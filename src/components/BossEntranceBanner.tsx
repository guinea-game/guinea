import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing } from "react-native-reanimated";
import { colors, fonts } from "../theme";
import { AdBadge } from "./AdBadge";
import { t } from "../i18n";

const EXIT_MS = 200;

// Same visual language as StageAdvanceBanner (radial-ish flash + rings), red-themed for a
// boss instead of stage-clear gold. Stays up — battle paused, boss timer not started — until
// tapped; the scene is dimmed on the player's side but left lighter on the right so the
// boss itself shows through. Mount fresh via `key` at the call site.
export function BossEntranceBanner({
  bossName,
  tagline,
  onStart,
  onWatchAd,
  buffActive = false,
  buffPercent = 0,
}: {
  bossName: string;
  tagline: string;
  onStart: () => void;
  // Offers a one-time pre-fight attack buff for an ad; omitted once already active (buffActive).
  onWatchAd?: () => void;
  buffActive?: boolean;
  // The buff's attack-% bonus, for the button's own label (useGameState's BOSS_AD_BUFF_ATTACK_PERCENT).
  buffPercent?: number;
}) {
  const reveal = useSharedValue(0);
  const ringA = useSharedValue(0);
  const ringB = useSharedValue(0);
  const punch = useSharedValue(0.6);
  const prompt = useSharedValue(0);
  const exit = useSharedValue(0);
  const [leaving, setLeaving] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    reveal.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
    prompt.value = withSequence(
      withTiming(0, { duration: 500 }),
      withRepeat(withSequence(withTiming(1, { duration: 520 }), withTiming(0.35, { duration: 520 })), -1),
    );
    ringA.value = withTiming(1, { duration: 760, easing: Easing.out(Easing.quad) });
    ringB.value = withSequence(withTiming(0, { duration: 60 }), withTiming(1, { duration: 760, easing: Easing.out(Easing.quad) }));
    punch.value = withSequence(withTiming(1.12, { duration: 180, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 180 }));
    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = () => {
    if (leaving) return;
    setLeaving(true);
    exit.value = withTiming(1, { duration: EXIT_MS, easing: Easing.in(Easing.quad) });
    exitTimer.current = setTimeout(onStart, EXIT_MS);
  };

  const revealStyle = useAnimatedStyle(() => ({ opacity: reveal.value * (1 - exit.value) }));
  const ringAStyle = useAnimatedStyle(() => ({
    opacity: ringA.value < 1 ? 1 - Math.abs(ringA.value - 0.35) : 0,
    transform: [{ scale: 0.35 + ringA.value * 0.9 }, { rotate: `${24 - ringA.value * 38}deg` }],
  }));
  const ringBStyle = useAnimatedStyle(() => ({
    opacity: ringB.value < 1 ? 1 - Math.abs(ringB.value - 0.35) : 0,
    transform: [{ scale: 0.35 + ringB.value * 0.9 }, { rotate: `${24 - ringB.value * 38}deg` }],
  }));
  const punchStyle = useAnimatedStyle(() => ({ transform: [{ scale: punch.value }] }));
  const promptStyle = useAnimatedStyle(() => ({ opacity: prompt.value, transform: [{ scale: 0.96 + prompt.value * 0.06 }] }));

  return (
    <Animated.View style={[styles.overlay, revealStyle]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={start}
        accessibilityRole="button"
        accessibilityLabel={t(`보스 ${bossName} 등장. 터치해서 도전하기`, `Boss ${t(bossName)} has appeared. Tap to take it on`)}
      >
        {/* Dark over the player, thinning out toward the boss on the right. */}
        <LinearGradient
          colors={["#1c1613f2", "#3d2a1dd0", "#c8553d33"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content} pointerEvents="box-none">
          <Animated.View style={[styles.ring, styles.ringDashed, ringAStyle]} />
          <Animated.View style={[styles.ring, styles.ringSolid, ringBStyle]} />
          <Animated.View style={[styles.title, punchStyle]} pointerEvents="none">
            <Text style={styles.badge}>BOSS</Text>
            <Text style={styles.name}>{t(bossName)}</Text>
            <Text style={styles.sub}>{t(tagline)}</Text>
          </Animated.View>
          <Animated.View style={[styles.prompt, promptStyle]} pointerEvents="none">
            <Text style={styles.promptText}>{t("터치해서 도전!", "Tap to Fight!")}</Text>
          </Animated.View>
          {buffActive ? (
            <View style={styles.buffChip} pointerEvents="none">
              <Text style={styles.buffChipText}>{t("공격력 버프 적용 중!", "Attack buff active!")}</Text>
            </View>
          ) : (
            onWatchAd && (
              <Pressable
                style={styles.adButton}
                onPress={(event) => {
                  event.stopPropagation();
                  onWatchAd();
                }}
              >
                <Text style={styles.adButtonText}>{t(`광고 보고 공격력 +${buffPercent}%`, `Watch Ad: +${buffPercent}% Attack`)}</Text>
                <AdBadge inline />
              </Pressable>
            )
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 8 },
  // Left ~58% of the scene, so the boss on the right stays uncovered.
  content: { position: "absolute", left: 0, top: 0, bottom: 0, width: "58%", alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderRadius: 999 },
  ringDashed: { width: 210, height: 210, borderWidth: 2, borderColor: "#f3a993", borderStyle: "dashed" },
  ringSolid: { width: 155, height: 155, borderWidth: 2, borderColor: "#ffd4bd88" },
  title: { alignItems: "center" },
  badge: {
    color: colors.cream,
    backgroundColor: colors.red,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 11,
    fontSize: 14,
    fontWeight: "900",
    fontFamily: fonts.bold,
    letterSpacing: 3,
  },
  name: { marginTop: 7, color: "#ffe3d4", fontSize: 28, fontWeight: "800", fontFamily: fonts.bold, letterSpacing: -1 },
  sub: {
    marginTop: 7,
    color: colors.cream,
    backgroundColor: "#382d25b8",
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 7,
    fontSize: 14,
    fontWeight: "900",
    fontFamily: fonts.bold,
    // Per-boss lines vary in length — wrap within the banner's column, centred.
    maxWidth: 190,
    textAlign: "center",
  },
  prompt: {
    marginTop: 14,
    backgroundColor: colors.red,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  promptText: { color: colors.cream, fontSize: 14, fontWeight: "900", fontFamily: fonts.bold },
  adButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  adButtonText: { color: colors.cream, fontSize: 13, fontWeight: "900", fontFamily: fonts.bold },
  buffChip: {
    marginTop: 10,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  buffChipText: { color: colors.cream, fontSize: 13, fontWeight: "900", fontFamily: fonts.bold },
});
