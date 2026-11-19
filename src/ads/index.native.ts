import { Platform } from "react-native";
import {
  LevelPlay,
  LevelPlayInitRequest,
  LevelPlayPrivacySettings,
  LevelPlayRewardedAd,
  LevelPlayInterstitialAd,
} from "unity-levelplay-mediation";
import type { LevelPlayAdError, LevelPlayInitError } from "unity-levelplay-mediation";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
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
const LOAD_TIMEOUT_MS = 8000;

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
let pendingRewardedWait: ((ready: boolean) => void) | null = null;
let pendingRewardedShow: ((result: AdResult) => void) | null = null;
let rewardEarned = false;

function loadRewarded() {
  if (!initSucceeded || rewardedLoading) return;
  rewardedLoading = true;
  rewardedAd.loadAd();
}

async function waitForRewardedReady(timeoutMs: number): Promise<boolean> {
  if (await rewardedAd.isAdReady()) return true;
  if (!initSucceeded) return false;
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
let pendingInterstitialShow: ((shown: boolean) => void) | null = null;

function loadInterstitial() {
  if (!initSucceeded || interstitialLoading) return;
  interstitialLoading = true;
  interstitialAd.loadAd();
}

export function initAds() {
  if (!initPromise) {
    rewardedAd.setListener({
      onAdLoaded: () => {
        rewardedLoading = false;
        lastAdError = null;
        pendingRewardedWait?.(true);
      },
      onAdLoadFailed: (error) => {
        rewardedLoading = false;
        lastAdError = describeError(error);
        pendingRewardedWait?.(false);
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
      },
      onAdLoadFailed: () => {
        interstitialLoading = false;
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
    // personalized or non-personalized ads based on the user's answer on its own.
    initPromise = requestTrackingPermissionsAsync()
      .catch(() => null)
      // The SDK's own README says these privacy calls must happen before LevelPlay.init(),
      // not after — no CMP/consent UI of our own yet, so this is a placeholder consent answer
      // (matches the README's own example), not a real per-region GDPR decision.
      .then(() =>
        Promise.all([
          LevelPlayPrivacySettings.setGDPRConsent(true),
          LevelPlayPrivacySettings.setCCPA(false),
          LevelPlayPrivacySettings.setCOPPA(false),
        ]).catch(() => null),
      )
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
      )
      .catch(() => false);
    // Loading ads after a failed init just reproduces the SDK's own "Load must be called
    // after init success callback" error — skip it and leave ads as simply unavailable.
    initPromise.then((success) => {
      initSucceeded = success === true;
      if (initSucceeded) {
        loadRewarded();
        loadInterstitial();
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
export async function showRewardedAd(onAboutToShow?: () => Promise<void>): Promise<AdResult> {
  if (showing) return "failed";
  // Claimed synchronously, before any `await` below, not after — otherwise a second call that
  // starts while this one is still awaiting init/load/onAboutToShow would also read `showing` as
  // false and the two could both reach rewardedAd.showAd(). A double-tap on a "watch ad" button
  // (nothing here debounces the button itself) was enough to trigger that: two concurrent native
  // showAd() calls on iOS's ad SDK, which is exactly the kind of overlapping presentation that
  // leaves a dangling invisible view eating every touch afterward.
  showing = true;
  await initAds();
  const ready = await waitForRewardedReady(LOAD_TIMEOUT_MS);
  if (!ready) {
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
