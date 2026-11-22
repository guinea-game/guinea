import { AppState, Platform } from "react-native";
import {
  LevelPlay,
  LevelPlayInitRequest,
  LevelPlayPrivacySettings,
  LevelPlayRewardedAd,
  LevelPlayInterstitialAd,
} from "unity-levelplay-mediation";
import type { LevelPlayAdError, LevelPlayInitError } from "unity-levelplay-mediation";
import { PermissionStatus, requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { setBgmSuspended } from "../sound";

export type AdResult = "earned" | "dismissed" | "failed";

// Unity LevelPlay (ironSource's successor) — Android and iOS are registered as separate apps on
// the actual ad-serving backend, platform.ironsrc.com (NOT the newer cloud.unity.com UA/analytics
// dashboard, whose "Game ID" field is a different, unrelated identifier — using that one here is
// what caused every init to fail with "Unable to retrieve configurations from the IronSource
// server"). The real App Key and per-format Ad Unit IDs below come from platform.ironsrc.com's
// app settings / Ad units pages.
const APP_KEY = Platform.select({
  ios: "29973dfd5",
  default: "29974c5f5",
})!;
const REWARDED_UNIT_ID = Platform.select({
  ios: "m5biqto1h7innzsh",
  default: "aw8gwsvjouyctbd1",
})!;
const INTERSTITIAL_UNIT_ID = Platform.select({
  ios: "4qtmoy8vmxohfxue",
  default: "gvihvrmx6y1g1fu9",
})!;

// How long a button press waits for a rewarded ad that isn't loaded yet before giving up.
const LOAD_TIMEOUT_MS = 12000;
// After a failed load (most often "no fill" — no network had an ad for us at that moment),
// try again on this schedule instead of waiting for the next button press, so an ad is
// usually already sitting ready by the time the player asks for one.
const RETRY_DELAYS_MS = [5000, 15000, 30000, 60000];

// How long to wait between retries when iOS silently skips showing the ATT alert (see below).
const ATT_RETRY_DELAY_MS = 1200;
const ATT_MAX_ATTEMPTS = 3;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function waitUntilActive(): Promise<void> {
  if (AppState.currentState === "active") return Promise.resolve();
  return new Promise((resolve) => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        sub.remove();
        resolve();
      }
    });
  });
}

// Resolves once ATT is genuinely *determined* (granted or denied) — or gives up and resolves
// false after a few tries, meaning it's still "undetermined" and must be left that way for the
// rest of this session (see below). Split out from initAds() so the app can await it on its
// own, before anything with its own native presentation (a title screen's buttons, a tutorial RN
// <Modal>, ...) is on screen — see App.tsx.
//
// On a brand-new install, calling requestTrackingPermissionsAsync() from our very first effect
// can land a hair before the app is actually `active` (first-run disk/JS-bundle work makes this
// launch slower than every later one) — iOS then just silently returns the still-"undetermined"
// status without ever showing the alert at all, no error, nothing to await differently. Observed
// behavior matches this exactly: first install, no visible prompt, an ad plays fine once, then
// touches are dead; quitting and reopening shows the real prompt (this time the app is already
// properly active by the time we call it) and everything is fine from then on, forever.
// The actual freeze is very likely the ad mediation SDK's own internal ATT re-check firing (some
// ad networks probe/re-request tracking authorization themselves around serving/closing an ad
// when they see "undetermined") right as our own Modal/ad presentation sequencing is in the
// middle of handing control back — the same class of competing-native-presentation bug
// withLevelPlayTopViewController.js and RewardedAdModal's hideForNativeAd were written to avoid,
// just from a presenter neither of those knows about or can wait for.
// Retrying a few times (each after confirming `active` and a short delay) reliably gets the real
// prompt to show within the same session; initAds() below refuses to touch the SDK at all for
// the rest of this session if it still comes back undetermined, which is the actual fix — an ad
// SDK that's never initialized can't surprise-trigger ATT mid-flow.
let attPromise: Promise<boolean> | null = null;
export function ensureTrackingPermission(): Promise<boolean> {
  if (!attPromise) {
    attPromise = (async () => {
      for (let attempt = 0; attempt < ATT_MAX_ATTEMPTS; attempt++) {
        await waitUntilActive();
        const { status } = await requestTrackingPermissionsAsync().catch(() => ({ status: PermissionStatus.UNDETERMINED }));
        if (status !== PermissionStatus.UNDETERMINED) return true;
        await delay(ATT_RETRY_DELAY_MS);
      }
      return false;
    })();
  }
  return attPromise;
}

let initPromise: Promise<unknown> | null = null;
// Guards loadRewarded()/loadInterstitial() against ever calling the native loadAd() before (or
// after a failed) LevelPlay.init() — that's what throws the SDK's own "Load must be called
// after init success callback" error.
let initSucceeded = false;
let showing = false;
// Why the last ad couldn't be loaded or shown, shown small on the "no ad right now" panel so a
// missing ad can be diagnosed from a release build.
let lastAdError: string | null = null;
// When the last full-screen ad of either kind closed, so an interstitial never follows one the
// player just watched.
let lastAdClosedAt = 0;

// Whether a full-screen ad is up right now, for the game to pause under it.
const adShowingListeners = new Set<(showing: boolean) => void>();
function setAdShowing(showing: boolean) {
  adShowingListeners.forEach((listener) => listener(showing));
}
export function subscribeAdShowing(listener: (showing: boolean) => void) {
  adShowingListeners.add(listener);
  return () => {
    adShowingListeners.delete(listener);
  };
}

export function msSinceLastAd() {
  return lastAdClosedAt === 0 ? Infinity : Date.now() - lastAdClosedAt;
}

export function getLastAdError() {
  return lastAdError;
}

function describeError(error: LevelPlayAdError | LevelPlayInitError | null | undefined) {
  const text = error?.errorMessage || `code ${error?.errorCode ?? "unknown"}`;
  return text.slice(0, 60);
}

function finishShowing() {
  showing = false;
  setBgmSuspended(false);
  setAdShowing(false);
}

// One long-lived ad object per format, reused across loads for the whole session (LevelPlay's
// own object manager keeps a single native ad behind each instance and reloads it in place).
const rewardedAd = new LevelPlayRewardedAd(REWARDED_UNIT_ID);
const interstitialAd = new LevelPlayInterstitialAd(INTERSTITIAL_UNIT_ID);

// ---- Rewarded ----
let rewardedLoading = false;
let rewardedFailures = 0;
let rewardedRetry: ReturnType<typeof setTimeout> | null = null;
let pendingRewardedWait: ((ready: boolean) => void) | null = null;
// Failed loads seen by the button press currently waiting (it gives up after two).
let waitFailures = 0;
let pendingRewardedShow: ((result: AdResult) => void) | null = null;
let rewardEarned = false;

function loadRewarded() {
  if (!initSucceeded || rewardedLoading) return;
  if (rewardedRetry) {
    clearTimeout(rewardedRetry);
    rewardedRetry = null;
  }
  rewardedLoading = true;
  rewardedAd.loadAd();
}

function retryDelay(failures: number) {
  return RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length) - 1];
}

async function waitForRewardedReady(timeoutMs: number): Promise<boolean> {
  if (await rewardedAd.isAdReady()) return true;
  if (!initSucceeded) return false;
  waitFailures = 0;
  loadRewarded();
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      pendingRewardedWait = null;
      resolve(ready);
    };
    pendingRewardedWait = finish;
    const timer = setTimeout(() => finish(false), timeoutMs);
  });
}

// ---- Interstitials ----
// Only ever loaded in the background: if one isn't ready at the moment it's due, that moment is
// simply skipped (the player is never made to wait for an ad they didn't ask for).
let interstitialLoading = false;
let interstitialFailures = 0;
let interstitialRetry: ReturnType<typeof setTimeout> | null = null;
let pendingInterstitialShow: ((shown: boolean) => void) | null = null;

function loadInterstitial() {
  if (!initSucceeded || interstitialLoading) return;
  if (interstitialRetry) {
    clearTimeout(interstitialRetry);
    interstitialRetry = null;
  }
  interstitialLoading = true;
  interstitialAd.loadAd();
}

// Coming back to the app (and on every launch, via init): a preloaded ad can have expired
// while the app sat in the background for hours, so make sure a fresh one is on its way.
let foregroundWatch = false;
function watchForeground() {
  if (foregroundWatch) return;
  foregroundWatch = true;
  AppState.addEventListener("change", (state) => {
    if (state !== "active" || !initSucceeded || showing) return;
    rewardedAd.isAdReady().then((ready) => {
      if (!ready) loadRewarded();
    });
    interstitialAd.isAdReady().then((ready) => {
      if (!ready) loadInterstitial();
    });
  });
}

export function initAds() {
  if (!initPromise) {
    rewardedAd.setListener({
      onAdLoaded: () => {
        rewardedLoading = false;
        rewardedFailures = 0;
        lastAdError = null;
        pendingRewardedWait?.(true);
      },
      onAdLoadFailed: (error) => {
        rewardedLoading = false;
        lastAdError = describeError(error);
        // A button press waiting on this load keeps waiting (up to its own timeout) for the
        // quick retry, rather than giving up on the first "no fill".
        rewardedFailures += 1;
        if (pendingRewardedWait) {
          waitFailures += 1;
          if (waitFailures >= 2) pendingRewardedWait(false);
          else rewardedRetry = setTimeout(loadRewarded, RETRY_DELAYS_MS[0]);
        }
        if (!rewardedRetry) rewardedRetry = setTimeout(loadRewarded, retryDelay(rewardedFailures));
      },
      onAdDisplayed: () => {},
      onAdRewarded: () => {
        rewardEarned = true;
      },
      onAdClosed: () => {
        finishShowing();
        lastAdClosedAt = Date.now();
        const resolve = pendingRewardedShow;
        pendingRewardedShow = null;
        resolve?.(rewardEarned ? "earned" : "dismissed");
        loadRewarded();
      },
      onAdDisplayFailed: (error) => {
        lastAdError = describeError(error);
        finishShowing();
        const resolve = pendingRewardedShow;
        pendingRewardedShow = null;
        resolve?.(rewardEarned ? "earned" : "failed");
        loadRewarded();
      },
    });

    interstitialAd.setListener({
      onAdLoaded: () => {
        interstitialLoading = false;
        interstitialFailures = 0;
      },
      onAdLoadFailed: () => {
        interstitialLoading = false;
        interstitialFailures += 1;
        interstitialRetry = setTimeout(loadInterstitial, retryDelay(interstitialFailures));
      },
      onAdDisplayed: () => {},
      onAdClosed: () => {
        finishShowing();
        lastAdClosedAt = Date.now();
        const resolve = pendingInterstitialShow;
        pendingInterstitialShow = null;
        resolve?.(true);
        loadInterstitial();
      },
      onAdDisplayFailed: () => {
        finishShowing();
        const resolve = pendingInterstitialShow;
        pendingInterstitialShow = null;
        resolve?.(false);
        loadInterstitial();
      },
    });

    // Apple requires the ATT prompt before any IDFA-dependent SDK init; the SDK then serves
    // personalized or non-personalized ads based on the user's answer on its own. By the time
    // this runs, App.tsx has already awaited ensureTrackingPermission() with nothing else on
    // screen, so this is normally already resolved. If ATT is STILL undetermined (the first-run
    // timing miss described on ensureTrackingPermission()), the SDK is deliberately never
    // touched this session — ads are simply unavailable until the next app open, rather than
    // risking the SDK's own ATT re-check firing mid-ad and freezing the app (see that comment).
    initPromise = ensureTrackingPermission()
      .then((determined) => {
        if (!determined) return false;
        // The SDK's own README says these privacy calls must happen before LevelPlay.init(),
        // not after — no CMP/consent UI of our own yet, so this is a placeholder consent answer
        // (matches the README's own example), not a real per-region GDPR decision.
        return Promise.all([
          LevelPlayPrivacySettings.setGDPRConsent(true),
          LevelPlayPrivacySettings.setCCPA(false),
          LevelPlayPrivacySettings.setCOPPA(false),
        ])
          .catch(() => null)
          .then(
            () =>
              new Promise<boolean>((resolve) => {
                LevelPlay.init(LevelPlayInitRequest.builder(APP_KEY).build(), {
                  onInitSuccess: () => resolve(true),
                  onInitFailed: (error) => {
                    lastAdError = `init: ${describeError(error)}`;
                    resolve(false);
                  },
                });
              }),
          );
      })
      .catch(() => false);
    // Loading ads after a failed init just reproduces the SDK's own "Load must be called
    // after init success callback" error — skip it and leave ads as simply unavailable.
    initPromise.then((success) => {
      initSucceeded = success === true;
      if (initSucceeded) {
        loadRewarded();
        loadInterstitial();
        watchForeground();
      }
    });
  }
  return initPromise;
}

// Shows one rewarded ad. "earned": watched to the reward point, hand the reward out.
// "dismissed": closed early, no reward. "failed": nothing could be loaded or shown (offline, no
// fill yet), and the caller decides what to do instead.
// `onAboutToShow`, if given, is awaited right before the native ad actually presents — the
// caller's own RN <Modal> (the "로딩 중" one) must be fully dismissed by the time it resolves.
// On iOS, that caller's native modal staying up the instant the SDK tries to present its own
// full-screen ad races the SDK's own "is this screen visible" check and can time out (seen as
// the ad error "Screen is not visible... timeout") — a plain `setState` before calling showAd()
// isn't enough, since React doesn't flush it to the native side synchronously; the caller has
// to actually confirm its modal is gone (e.g. via <Modal onDismiss>) before this resolves.
// Set by cancelRewardedWait(): the player gave up on the "광고를 불러오는 중" screen.
let waitCancelled = false;

// The loading screen's 취소 button: stops waiting for an ad that hasn't loaded yet, so
// showRewardedAd() resolves "failed" right away instead of presenting one later. (The load
// itself keeps going in the background, ready for next time.)
export function cancelRewardedWait() {
  waitCancelled = true;
  pendingRewardedWait?.(false);
}

export async function showRewardedAd(onAboutToShow?: () => Promise<void>): Promise<AdResult> {
  if (showing) return "failed";
  waitCancelled = false;
  // Claimed synchronously, before any `await` below, not after — otherwise a second call that
  // starts while this one is still awaiting init/load/onAboutToShow would also read `showing` as
  // false and the two could both reach rewardedAd.showAd(). A double-tap on a "watch ad" button
  // (nothing here debounces the button itself) was enough to trigger that: two concurrent native
  // showAd() calls on iOS's ad SDK, which is exactly the kind of overlapping presentation that
  // leaves a dangling invisible view eating every touch afterward.
  showing = true;
  await initAds();
  const ready = !waitCancelled && (await waitForRewardedReady(LOAD_TIMEOUT_MS));
  if (!ready || waitCancelled) {
    showing = false;
    return "failed";
  }
  if (onAboutToShow) await onAboutToShow();
  rewardEarned = false;
  return new Promise<AdResult>((resolve) => {
    pendingRewardedShow = resolve;
    setBgmSuspended(true);
    setAdShowing(true);
    rewardedAd.showAd();
  });
}

// Opens Unity's Test Suite debug screen: shows fake test ads (not real ones) per ad unit, so
// integration can be checked (does init succeed, does each placement load) without any risk of
// tapping a real ad. Dev-build only, wired to a hidden settings button (see SettingsModal).
export function launchAdTestSuite() {
  initAds().then(() => LevelPlay.launchTestSuite());
}

// Shows the preloaded interstitial if there is one; resolves true once it was shown and closed.
export async function showInterstitial(): Promise<boolean> {
  if (showing) return false;
  // Same early-claim as showRewardedAd() above — see its comment.
  showing = true;
  await initAds();
  if (!(await interstitialAd.isAdReady())) {
    showing = false;
    loadInterstitial();
    return false;
  }
  return new Promise<boolean>((resolve) => {
    pendingInterstitialShow = resolve;
    setBgmSuspended(true);
    setAdShowing(true);
    interstitialAd.showAd();
  });
}
