import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { icons, uiImages } from "../assets";
import { ModalFrame } from "./ModalFrame";
import { GameButton } from "./GameButton";
import { CharacterSprite } from "./CharacterSprite";
import { t } from "../i18n";
import type { Outfit } from "../types";

const BURST_COLORS = ["#ffd34d", "#ff7a59", "#7ed957", "#5bc0ff", "#ff9ad5", "#fff3b8"];
const BURST_COUNT = 30;
const BURST_COUNT_2 = 20;

// One confetti chip flung outward from the box the instant it opens, each at its own fixed
// angle/distance/spin so the burst reads as a single radial pop rather than a random scatter.
// `big` is the second, later wave — thrown further and bigger, so the reveal keeps escalating
// instead of reading as one single burst.
function BurstPiece({ index, count, big = false }: { index: number; count: number; big?: boolean }) {
  const [piece] = useState(() => {
    const angle = (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = (big ? 110 : 70) + Math.random() * (big ? 90 : 60);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 20,
      spin: (Math.random() - 0.5) * 900,
      size: (big ? 8 : 6) + Math.random() * 7,
      long: Math.random() > 0.5,
      color: BURST_COLORS[index % BURST_COLORS.length],
      delay: Math.random() * 70,
    };
  });
  const fly = useSharedValue(0);
  useEffect(() => {
    fly.value = withDelay(piece.delay, withTiming(1, { duration: 650 + Math.random() * 300, easing: Easing.out(Easing.cubic) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: fly.value > 0.6 ? (1 - fly.value) / 0.4 : 1,
    transform: [
      { translateX: piece.x * fly.value },
      { translateY: piece.y * fly.value + fly.value * fly.value * 90 },
      { rotate: `${piece.spin * fly.value}deg` },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.burstPiece, { width: piece.size, height: piece.long ? piece.size * 1.8 : piece.size, backgroundColor: piece.color }, style]}
    />
  );
}

const SPARK_SPOTS = [
  { x: -58, y: -40, size: 16, delay: 80 },
  { x: 54, y: -50, size: 13, delay: 220 },
  { x: -46, y: 36, size: 12, delay: 360 },
  { x: 50, y: 44, size: 15, delay: 140 },
  { x: 0, y: -68, size: 11, delay: 300 },
];

// Little stars that blink in a ring around the open box, looping for as long as it stays open.
function BoxSparkles() {
  return (
    <View style={styles.sparkleLayer} pointerEvents="none">
      {SPARK_SPOTS.map((spot, index) => (
        <Spark key={index} {...spot} />
      ))}
    </View>
  );
}

function Spark({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 620, easing: Easing.in(Easing.quad) })), -1),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.4 + glow.value * 0.6 }] }));
  return (
    <Animated.View style={[styles.spark, { left: x - size / 2, top: y - size / 2, width: size, height: size }, style]}>
      <Image source={icons.star} style={{ width: size, height: size }} />
    </Animated.View>
  );
}

// 기니상자: shown once confirmLoopAdvance holds a loop-4+ "예" back for it (see
// useGameState's loopBox/openLoopBox/dismissLoopBox) — tap the closed chest, it opens, and
// either a rescued companion's name shows or (every time for now — BOX_RESCUE_OUTFITS is
// still empty) a plain "it's empty" note. Closing it is what actually finishes the loop.
export function LoopBoxModal({
  opened,
  companionName,
  companionOutfit,
  onOpen,
  onDismiss,
}: {
  opened: boolean;
  // Already resolved/translated display name of whatever openLoopBox found; null = empty box.
  companionName: string | null;
  // Raw outfit id for the same companion, so its own idle sprite can pop out of the box —
  // null for the empty-box case, same as companionName.
  companionOutfit: Outfit | null;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  // Idle invitation wobble on the closed box, only ever touched from this mount effect — kept
  // as its own value (never written from handleOpen below) since a value driven from both an
  // effect and a plain handler trips the hooks linter.
  const idleWobble = useSharedValue(0);
  // The frantic pre-open shake, only ever touched from handleOpen — its own value for the
  // same reason, combined with idleWobble in wobbleStyle below.
  const shake = useSharedValue(0);
  const preShakeScale = useSharedValue(1);
  const pop = useSharedValue(opened ? 1 : 0);
  const flash = useSharedValue(0);
  const ring = useSharedValue(0);
  const panelShake = useSharedValue(0);
  const resultIn = useSharedValue(opened ? 1 : 0);
  const charPop = useSharedValue(opened && companionOutfit ? 1 : 0);
  const boxFade = useSharedValue(1);
  const [showBurst, setShowBurst] = useState(opened);
  const [showBurst2, setShowBurst2] = useState(false);

  useEffect(() => {
    if (opened) return;
    idleWobble.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 120, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1, { duration: 240, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 120, easing: Easing.inOut(Easing.quad) }),
        withDelay(500, withTiming(0, { duration: 1 })),
      ),
      -1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const handleOpen = () => {
    // A frantic, building shake — bigger and faster than the idle wobble, with the box itself
    // swelling a little like it can barely hold shut — then the flash/ring/shake/burst/pop all
    // land together for one big "펑".
    shake.value = withSequence(
      withTiming(2.2, { duration: 50 }),
      withTiming(-2.2, { duration: 60 }),
      withTiming(2.4, { duration: 55 }),
      withTiming(-2.4, { duration: 50 }),
      withTiming(2, { duration: 50 }),
      withTiming(-1.6, { duration: 45 }),
      withTiming(0, { duration: 60 }),
    );
    preShakeScale.value = withSequence(
      withTiming(1.12, { duration: 160, easing: Easing.out(Easing.quad) }),
      withTiming(0.9, { duration: 90, easing: Easing.in(Easing.quad) }),
      withTiming(1, { duration: 1 }),
    );
    flash.value = withDelay(310, withSequence(withTiming(1, { duration: 55 }), withTiming(0, { duration: 340 })));
    ring.value = withDelay(310, withSequence(withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 1 })));
    panelShake.value = withDelay(
      300,
      withSequence(
        withTiming(1, { duration: 35 }),
        withTiming(-1, { duration: 35 }),
        withTiming(0.7, { duration: 35 }),
        withTiming(-0.7, { duration: 35 }),
        withTiming(0, { duration: 40 }),
      ),
    );
    pop.value = withDelay(320, withSequence(withTiming(1.4, { duration: 170, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 180, easing: Easing.out(Easing.back(2.6)) })));
    resultIn.value = withDelay(520, withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.6)) }));
    // The gini itself pops out a beat after the lid flies open — a bigger, snappier overshoot
    // than the box's own pop so it reads as "something jumped out", not just a bigger box.
    // Unconditional: `companionOutfit` here is still the pre-open prop (always null — openLoopBox
    // only picks one once onOpen() below actually runs), so gating on it never fired. Animating
    // it even for an empty box is harmless — the JSX below only renders the sprite when the
    // *post-open* prop comes back non-null.
    charPop.value = withDelay(430, withSequence(withTiming(1.45, { duration: 160, easing: Easing.out(Easing.quad) }), withTiming(0.92, { duration: 130, easing: Easing.in(Easing.quad) }), withTiming(1, { duration: 160, easing: Easing.out(Easing.back(2.4)) })));
    // Once the gini's had its moment, the box itself isn't needed any more — let it melt away
    // on its own instead of just sitting there behind the result text forever.
    boxFade.value = withDelay(800, withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) }));
    setTimeout(() => setShowBurst(true), 310);
    // A second, smaller confetti wave a beat later keeps the reveal going instead of it being
    // over in one single burst.
    setTimeout(() => setShowBurst2(true), 560);
    onOpen();
  };

  const wobbleStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${(opened ? shake.value : idleWobble.value) * 6}deg` },
      { scale: (opened ? preShakeScale.value : 1) + Math.abs(opened ? shake.value : idleWobble.value) * 0.03 },
    ],
  }));
  const popStyle = useAnimatedStyle(() => ({
    opacity: opened ? boxFade.value : 1,
    transform: [{ scale: opened ? pop.value * (0.85 + boxFade.value * 0.15) : 1 }, { translateY: (1 - boxFade.value) * 14 }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value > 0 ? (1 - ring.value) * 0.9 : 0,
    transform: [{ scale: 0.3 + ring.value * 2.2 }],
  }));
  const panelShakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: panelShake.value * 10 }] }));
  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultIn.value,
    transform: [{ scale: 0.7 + resultIn.value * 0.3 }, { translateY: (1 - resultIn.value) * 10 }],
  }));
  const charPopStyle = useAnimatedStyle(() => ({
    opacity: charPop.value > 0 ? 1 : 0,
    transform: [{ scale: charPop.value }, { translateY: (1 - charPop.value) * 40 }],
  }));

  return (
    <Modal visible animationType="fade" transparent onRequestClose={opened ? onDismiss : () => {}}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.panel, panelShakeStyle]}>
          <ModalFrame />
          <Text style={styles.eyebrow}>LOOP REWARD</Text>
          <Text style={styles.title}>{t("기니상자", "Gini Box", "ギニー箱", "吉妮宝箱")}</Text>
          <View style={styles.boxStage}>
            <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />
            <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />
            {opened && showBurst && (
              <View style={styles.burstLayer} pointerEvents="none">
                {Array.from({ length: BURST_COUNT }, (_, index) => (
                  <BurstPiece key={index} index={index} count={BURST_COUNT} />
                ))}
              </View>
            )}
            {opened && showBurst2 && (
              <View style={styles.burstLayer} pointerEvents="none">
                {Array.from({ length: BURST_COUNT_2 }, (_, index) => (
                  <BurstPiece key={index} index={index} count={BURST_COUNT_2} big />
                ))}
              </View>
            )}
            {opened && <BoxSparkles />}
            <Animated.View style={wobbleStyle}>
              <Pressable
                onPress={opened ? undefined : handleOpen}
                disabled={opened}
                accessibilityRole="button"
                accessibilityLabel={t("상자 열기", "Open the box")}
                style={({ pressed }) => [styles.boxWrap, pressed && !opened && styles.pressed]}
              >
                <Animated.View style={popStyle}>
                  <Image source={opened ? uiImages.guineaBoxOpen : uiImages.guineaBox} style={styles.box} resizeMode="contain" />
                </Animated.View>
              </Pressable>
            </Animated.View>
            {/* Painted last (and above the box's own z-index) so it pops out in FRONT of the
                lid, not behind it — dead centre of the stage and bigger than the box itself,
                since it's the actual reward, not a detail on top of it. */}
            {opened && companionOutfit && (
              <Animated.View style={[styles.charPop, charPopStyle]} pointerEvents="none">
                <CharacterSprite outfit={companionOutfit} animation="idle" size={150} />
              </Animated.View>
            )}
          </View>
          {!opened ? (
            <Text style={styles.hint}>{t("눌러서 열어 보세요!", "Tap to open it!")}</Text>
          ) : (
            <Animated.View style={resultStyle}>
              {companionName ? (
                <Text style={styles.resultTitle}>{t(`${companionName} 구출 완료!`, `${companionName} Rescued!`)}</Text>
              ) : (
                <>
                  <Text style={styles.resultTitle}>{t("엥?? 텅 비었네?", "Huh?? It's empty?")}</Text>
                  <Text style={styles.resultHint}>{t("(업데이트를 기다려주세요)", "(Please wait for an update)")}</Text>
                </>
              )}
            </Animated.View>
          )}
          {opened && (
            <GameButton variant="green" onPress={onDismiss} style={styles.button}>
              {t("확인", "OK")}
            </GameButton>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, padding: 22, paddingHorizontal: 14, justifyContent: "center", backgroundColor: "#263024cf" },
  panel: { alignItems: "center", paddingHorizontal: 34, paddingTop: 48, paddingBottom: 36 },
  eyebrow: { color: colors.green, fontWeight: "800", fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5 },
  title: { marginTop: 2, fontSize: 24, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.5 },
  boxStage: { marginTop: 18, width: 150, height: 150, alignItems: "center", justifyContent: "center" },
  flash: { position: "absolute", left: -55, right: -55, top: -55, bottom: -55, borderRadius: 999, backgroundColor: "#fffbe0" },
  ring: { position: "absolute", left: 5, right: 5, top: 5, bottom: 5, borderRadius: 999, borderWidth: 5, borderColor: "#ffe27a" },
  burstLayer: { position: "absolute", left: "50%", top: "50%", width: 0, height: 0 },
  burstPiece: { position: "absolute", left: 0, top: 0, borderRadius: 2 },
  sparkleLayer: { position: "absolute", left: "50%", top: "50%", width: 0, height: 0 },
  spark: { position: "absolute", left: 0, top: 0 },
  // Dead centre of the stage (same box the lid sits in) — zIndex keeps it in front of the
  // box art regardless of paint order.
  charPop: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 5, alignItems: "center", justifyContent: "center" },
  boxWrap: {},
  pressed: { transform: [{ scale: 0.95 }] },
  box: { width: 150, height: 150 },
  hint: { marginTop: 10, fontFamily: fonts.light, letterSpacing: -0.36, fontSize: 14, color: colors.brown },
  resultTitle: { marginTop: 10, fontSize: 18, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink, textAlign: "center" },
  resultHint: { marginTop: 4, fontFamily: fonts.light, letterSpacing: -0.33, fontSize: 12, color: colors.muted, textAlign: "center" },
  button: { marginTop: 18, minWidth: 120 },
});
