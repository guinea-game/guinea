import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, Easing } from "react-native-reanimated";
import { colors, fonts } from "../theme";
import { shopKit, uiImages } from "../assets";
import { NineSlice, Panel } from "./NineSlice";
import { StrokedText } from "./StrokedText";
import { t } from "../i18n";

const EXIT_MS = 200;

// Same visual language as StageAdvanceBanner (radial-ish flash + rings), red-themed for a
// boss instead of stage-clear gold. Stays up — battle paused, boss timer not started — until
// tapped; the scene is dimmed on the player's side but left lighter on the right so the
// boss itself shows through. Mount fresh via `key` at the call site.
export function BossEntranceBanner({
  bossName,
  onStart,
  onWatchAd,
  buffActive = false,
  buffPercent = 0,
}: {
  bossName: string;
  onStart: () => void;
  // Offers a one-time pre-fight attack buff for an ad; omitted once already active (buffActive).
  onWatchAd?: () => void;
  buffActive?: boolean;
  // The buff's attack-% bonus, for the button's own label (useGameState's BOSS_AD_BUFF_ATTACK_PERCENT).
  buffPercent?: number;
}) {
  const reveal = useSharedValue(0);
  const punch = useSharedValue(0.6);
  // Starts fully visible and only pulses down from there, so if the pulse never runs (reduced
  // motion, or a web quirk) the call to fight still shows.
  const prompt = useSharedValue(1);
  const exit = useSharedValue(0);
  const [leaving, setLeaving] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    reveal.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
    prompt.value = withDelay(500, withRepeat(withSequence(withTiming(0.55, { duration: 520 }), withTiming(1, { duration: 520 })), -1));
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
  const punchStyle = useAnimatedStyle(() => ({ transform: [{ scale: punch.value }] }));
  const promptStyle = useAnimatedStyle(() => ({ opacity: prompt.value, transform: [{ scale: 0.97 + prompt.value * 0.03 }] }));

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
        {/* One left-aligned column over the dark side, centred in the scene: BOSS tag and
            name, then the ad bubble and the call to fight. */}
        <View style={styles.content} pointerEvents="box-none">
          <Animated.View style={[styles.title, punchStyle]} pointerEvents="none">
            <Panel slice={shopKit.pillRed} scale={0.3} style={styles.badge}>
              <Text style={styles.badgeText}>BOSS</Text>
            </Panel>
            <StrokedText style={styles.name} strokeColor={colors.line} strokeWidth={3}>
              {t(bossName)}
            </StrokedText>
          </Animated.View>
          {/* The ad buff bubble sits just above the call to fight, its tail pointing down at
              it — same column, so it always moves with the prompt. */}
          <View style={styles.action} pointerEvents="box-none">
            {(buffActive || onWatchAd) && (
              <Pressable
                style={styles.buffBubble}
                disabled={buffActive}
                onPress={(event) => {
                  event.stopPropagation();
                  onWatchAd?.();
                }}
                accessibilityRole="button"
                accessibilityLabel={buffActive ? t("공격력 버프 적용 중", "Attack buff active") : t(`광고 보고 공격력 +${buffPercent}%`, `Watch ad: +${buffPercent}% attack`)}
              >
                <NineSlice slice={shopKit.bubble} scale={0.24} />
                <View style={styles.buffRow}>
                  {!buffActive && <Image source={uiImages.adClapper} style={styles.buffIcon} />}
                  <Text style={styles.buffText}>{buffActive ? t(`+${buffPercent}% 적용 중`, `+${buffPercent}% On`) : t(`공격력 +${buffPercent}%`, `+${buffPercent}% ATK`)}</Text>
                </View>
              </Pressable>
            )}
            <Animated.View style={promptStyle} pointerEvents="none">
              <StrokedText style={styles.promptText} strokeColor={colors.line} strokeWidth={2.5}>
                {t("터치해서 도전!", "Tap to Fight!")}
              </StrokedText>
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 8 },
  // Left side of the scene, so the boss on the right stays uncovered.
  content: { position: "absolute", left: 18, right: 10, top: 0, bottom: 0, alignItems: "flex-start", justifyContent: "center" },
  action: { marginTop: 18, alignItems: "flex-start" },
  title: { alignItems: "flex-start" },
  badge: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 7, alignItems: "center" },
  badgeText: { color: colors.cream, fontSize: 14, fontWeight: "900", fontFamily: fonts.bold, letterSpacing: 3 },
  name: { marginTop: 6, color: "#ffe3d4", fontSize: 28, fontWeight: "800", fontFamily: fonts.bold, letterSpacing: -1 },
  promptText: { color: colors.cream, fontSize: 22, fontWeight: "900", fontFamily: fonts.bold },
  // Tail (bottom-left) leans back toward "터치해서 도전!".
  buffBubble: { marginBottom: 2, paddingLeft: 11, paddingRight: 11, paddingTop: 6, paddingBottom: 15 },
  buffRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  buffIcon: { width: 18, height: 21, resizeMode: "contain" },
  buffText: { color: colors.ink, fontSize: 12, fontWeight: "900", fontFamily: fonts.bold },
});
