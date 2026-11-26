import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { icons } from "../assets";
import { ModalFrame } from "./ModalFrame";
import { GameButton } from "./GameButton";
import { AdBadge } from "./AdBadge";
import { cancelRewardedWait, getLastAdError, showRewardedAd } from "../ads";
import { t } from "../i18n";

type Phase = "prompt" | "loading" | "fallback";

// How long hiding our own Modal is given before the native ad presents (see hideForNativeAd).
const HIDE_FALLBACK_MS = 400;
const HIDE_SETTLE_MS = 600;
// How long after the ad reports closed before anything else moves (handing the reward out,
// closing the popup that opened this). onAdClosed can arrive while the ad's own full-screen
// view is still sliding away; dismissing a Modal underneath it in that window is the same
// overlapping-presentation race that leaves an invisible view eating every touch.
const AFTER_AD_SETTLE_MS = 500;

// Every "watch an ad for X" button goes through this. It plays a real rewarded ad (src/ads):
// - watched to the end: onClaim hands the reward out.
// - closed early, or no ad to show (offline, no fill yet, web): no reward — onCancel (or,
//   without one, back to the prompt to try again). The "no ad right now" panel just explains
//   why and dismisses; it never hands the reward out on its own.
// `autoStart` false shows the message with a button first (the boss retry prompt, which
// opens on its own when the boss timer runs out; an ad must never start unasked).
export function RewardedAdModal({
  message,
  claimLabel,
  onClaim,
  onCancel,
  autoStart = true,
  secondary,
  embedded = false,
}: {
  message: string;
  claimLabel: string;
  onClaim: () => void;
  onCancel?: () => void;
  autoStart?: boolean;
  // A no-ad alternative shown beside the ad button on the prompt (e.g. the boss retry's
  // "그냥 다시 도전"), so skipping the ad is a clear choice rather than a hidden dismiss.
  secondary?: { label: string; onPress: () => void };
  // Drawn inside the caller's own Modal (a plain overlay, no Modal of its own). For popups
  // that offer an ad themselves (출석 보상, 오프라인 보상): swapping their Modal out for this
  // one used to dismiss one native modal while presenting another in the same instant — on a
  // fresh install or a long-idle launch, the only times those popups show, that left the
  // screen dead to touches after the ad.
  embedded?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(autoStart ? "loading" : "prompt");
  // The real native ad presents its own full-screen view the instant showRewardedAd() calls
  // showAd() — if our own RN Modal is still up at that exact moment, the two native
  // presentations fight over the window and the SDK's own "is this screen visible" check can
  // time out (seen as the ad error "Screen is not visible... timeout"). `hiding` drops our
  // Modal first; showRewardedAd() is told to wait for `onDismiss` (confirms the native modal
  // is actually gone, not just that React scheduled the state update — a plain setState right
  // before showAd() isn't enough, since React doesn't flush it to the native side
  // synchronously) before it calls showAd(). `onDismiss` is iOS-only, hence the timeout
  // fallback below for everywhere else (and belt-and-suspenders if iOS ever skips it).
  const [hiding, setHiding] = useState(false);
  const dismissResolver = useRef<(() => void) | null>(null);
  // onDismiss can fire before the fade-out has actually finished (logged: the ad was presented
  // 13ms after hiding, mid-transition, and iOS refused it "while a presentation is in
  // progress"), so it's never trusted alone: the ad waits for BOTH onDismiss (or its fallback)
  // and a floor long enough for the native dismissal to settle.
  const hideForNativeAd = () =>
    new Promise<void>((resolve) => {
      let dismissed = false;
      let settled = false;
      const maybeResolve = () => {
        if (dismissed && settled) resolve();
      };
      const finish = () => {
        if (!dismissResolver.current) return;
        dismissResolver.current = null;
        dismissed = true;
        maybeResolve();
      };
      dismissResolver.current = finish;
      setHiding(true);
      setTimeout(finish, HIDE_FALLBACK_MS);
      setTimeout(() => {
        settled = true;
        maybeResolve();
      }, HIDE_SETTLE_MS);
    });
  const mounted = useRef(true);
  const callbacks = useRef({ onClaim, onCancel });
  useEffect(() => {
    callbacks.current = { onClaim, onCancel };
  });

  // No ad watched to the end: no reward. "failed" (load/display failure, no fill) still shows
  // the fallback panel to explain why before dismissing; "dismissed" (closed early) skips
  // straight to it.
  // Only brings our RN Modal back (`setHiding(false)`) when this component is going to stay
  // mounted to show it (fallback/prompt) — never right before the parent unmounts us (onClaim,
  // or onCancel, which every caller uses to close this same modal). Telling the native Modal to
  // re-present for a single frame right as React tears the whole tree down is what left iOS
  // with a dangling, invisible presented view controller eating every touch app-wide after an ad
  // (seen as "ad 보고 나면 터치가 안 먹음") — the ad's own full-screen cover dismissing at the same
  // moment our Modal flips visible again raced the two native presentations.
  const dismissNoReward = () => {
    if (callbacks.current.onCancel) callbacks.current.onCancel();
    else {
      setHiding(false);
      setPhase("prompt");
    }
  };
  // The loading screen's 취소: stop waiting and close as if no ad was watched.
  const cancelled = useRef(false);
  const cancelLoading = () => {
    cancelled.current = true;
    cancelRewardedWait();
    dismissNoReward();
  };
  const start = () => {
    cancelled.current = false;
    showRewardedAd(hideForNativeAd).then(async (result) => {
      if (cancelled.current) return;
      if (result !== "failed") await new Promise((resolve) => setTimeout(resolve, AFTER_AD_SETTLE_MS));
      if (!mounted.current) return;
      if (result === "earned") {
        callbacks.current.onClaim();
        return;
      }
      if (result === "failed") {
        setHiding(false);
        setPhase("fallback");
        return;
      }
      dismissNoReward();
    });
  };
  const play = () => {
    setPhase("loading");
    start();
  };

  useEffect(() => {
    mounted.current = true;
    if (autoStart) start();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = phase === "fallback" ? dismissNoReward : phase === "prompt" ? onCancel : undefined;

  const content = (
    <Pressable style={styles.backdrop} onPress={() => dismiss?.()}>
      <Pressable style={styles.panel} onPress={(event) => event.stopPropagation()}>
        <ModalFrame />
        <Image source={icons.energy} style={styles.heroIcon} />
        <Text style={styles.eyebrow}>{t("광고 안내", "Ad")}</Text>
        {phase === "loading" && (
          <>
            <Text style={styles.title}>{t("광고를 불러오는 중이에요", "Loading the ad")}</Text>
            <ActivityIndicator color={colors.green} style={styles.spinner} />
            <GameButton variant="beige" onPress={cancelLoading} style={styles.cancelButton}>
              {t("취소", "Cancel")}
            </GameButton>
          </>
        )}
        {phase === "prompt" && (
          <>
            <Text style={styles.message}>{message}</Text>
            {secondary ? (
              <View style={styles.choiceRow}>
                <GameButton variant="beige" onPress={secondary.onPress} style={styles.choiceButton} textStyle={styles.choiceLabel}>
                  {secondary.label}
                </GameButton>
                <View>
                  <GameButton variant="green" onPress={play} style={styles.choiceButton}>
                    <View style={styles.choiceContent}>
                      <Text style={styles.choiceSmall}>{t("광고 보고", "Watch Ad")}</Text>
                      <Text style={styles.choiceLabel}>{claimLabel}</Text>
                    </View>
                  </GameButton>
                  <AdBadge />
                </View>
              </View>
            ) : (
              <GameButton variant="green" onPress={play} style={styles.claimButton}>{claimLabel}</GameButton>
            )}
          </>
        )}
        {phase === "fallback" && (
          <>
            <Text style={styles.title}>{t("앗, 지금은 보여드릴 광고가 없어요!", "Oops, there's no ad to show right now!")}</Text>
            <Text style={styles.message}>{t("잠시 후 다시 시도해주세요.", "Please try again in a bit.")}</Text>
            <GameButton variant="green" onPress={dismissNoReward} style={styles.claimButton}>{t("확인", "OK")}</GameButton>
            {getLastAdError() !== null && <Text style={styles.errorCode}>{t(`광고 오류: ${getLastAdError()}`, `Ad error: ${getLastAdError()}`)}</Text>}
          </>
        )}
      </Pressable>
    </Pressable>
  );

  if (embedded) {
    // Hidden while the native ad is up; it presents over the caller's Modal.
    return hiding ? null : <View style={StyleSheet.absoluteFill}>{content}</View>;
  }

  return (
    <Modal
      visible={!hiding}
      animationType="fade"
      transparent
      onRequestClose={() => dismiss?.()}
      onDismiss={() => dismissResolver.current?.()}
    >
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    padding: 22,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: "#263024cf",
  },
  panel: {
    paddingHorizontal: 34,
    paddingTop: 48,
    paddingBottom: 36,
    alignItems: "center",
  },
  heroIcon: { width: 44, height: 44, marginBottom: 6 },
  eyebrow: { color: colors.green, fontWeight: "800", fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5 },
  title: { marginTop: 2, fontSize: 18, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink, textAlign: "center" },
  message: { fontFamily: fonts.light, letterSpacing: -0.36, marginTop: 8, fontSize: 12, color: colors.brown, textAlign: "center", lineHeight: 16 },
  spinner: { marginTop: 14, marginBottom: 4 },
  claimButton: { marginTop: 16, minWidth: 140 },
  cancelButton: { marginTop: 12, minWidth: 110 },
  choiceRow: { marginTop: 16, flexDirection: "row", gap: 8 },
  choiceButton: { minWidth: 124, minHeight: 50 },
  choiceContent: { alignItems: "center" },
  choiceSmall: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: "#e9f2d4" },
  choiceLabel: { fontSize: 16, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  errorCode: { fontFamily: fonts.light, letterSpacing: -0.36, marginTop: 8, fontSize: 12, lineHeight: 16, color: colors.muted, textAlign: "center" },
});
