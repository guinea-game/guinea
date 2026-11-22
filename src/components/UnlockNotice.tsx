import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { panelSlices } from "../assets";
import { NineSlice } from "./NineSlice";
import { StrokedText } from "./StrokedText";
import { SkillIcon } from "./SkillIcon";
import { CharacterSprite } from "./CharacterSprite";
import { getSkill } from "../state/skills";
import { OUTFIT_NAMES } from "../state/buffs";
import type { UnlockNotice as Notice } from "../state/useGameState";
import { t } from "../i18n";

const FRAME = panelSlices.redRibbon;
const WIDTH = 320;
const SCALE = WIDTH / FRAME.width;

// A new skill or companion: the battle holds behind this card until it's tapped away, so the
// moment can't slip past mid-fight. Red-ribbon frame (same as 업데이트 소식) with the news
// on the ribbon, the new thing big in the middle, and where to go use it.
export function UnlockNotice({ notice, onDone }: { notice: Notice; onDone: () => void }) {
  const pop = useSharedValue(0);
  const prompt = useSharedValue(1);
  useEffect(() => {
    pop.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.back(1.4)) });
    prompt.value = withDelay(700, withRepeat(withSequence(withTiming(0.5, { duration: 520 }), withTiming(1, { duration: 520 })), -1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const backdropStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, pop.value) }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, pop.value), transform: [{ scale: 0.8 + pop.value * 0.2 }] }));
  const promptStyle = useAnimatedStyle(() => ({ opacity: prompt.value }));

  const skill = notice.kind === "skill" ? getSkill(notice.id) : null;
  const heading = skill ? t("새 스킬 해금!", "New Skill Unlocked!") : t("새 동료 합류!", "New Companion!");
  const name = skill ? t(skill.name) : t(OUTFIT_NAMES[notice.kind === "companion" ? notice.outfit : "default"]);
  const where = skill ? t("스킬 탭에서 장착할 수 있어요", "Equip it from the Skills tab") : t("동료 탭에서 함께할 수 있어요", "Bring them along from the Companions tab");

  return (
    <Pressable style={styles.overlay} onPress={onDone} accessibilityRole="button" accessibilityLabel={t(`${heading} ${name}. 터치해서 계속`, `${heading} ${name}. Tap to continue`)}>
      <Animated.View style={[styles.backdrop, backdropStyle]} />
      <Animated.View style={[styles.card, cardStyle]} pointerEvents="none">
        <NineSlice slice={FRAME} scale={SCALE} />
        {/* The ribbon's flat middle, between its folded tails. */}
        <View style={[styles.ribbon, { top: 12 * SCALE, height: 44 * SCALE }]}>
          <StrokedText style={styles.ribbonText} strokeColor="#7a2414" strokeWidth={2}>
            {heading}
          </StrokedText>
        </View>
        <View style={styles.hero}>
          {notice.kind === "skill" ? <SkillIcon id={notice.id} height={92} /> : <CharacterSprite outfit={notice.outfit} animation="idle" size={128} />}
        </View>
        <Text style={styles.name}>{name}</Text>
        {skill && <Text style={styles.description}>{t(skill.description)}</Text>}
        <Text style={styles.where}>{where}</Text>
      </Animated.View>
      <Animated.View style={[styles.promptWrap, promptStyle]} pointerEvents="none">
        <StrokedText style={styles.prompt} strokeColor={colors.line} strokeWidth={2.5}>
          {t("터치해서 계속", "Tap to Continue")}
        </StrokedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 46, alignItems: "center", justifyContent: "center", padding: 16 },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(20, 12, 6, 0.72)" },
  card: { width: WIDTH, alignItems: "center", paddingTop: 96 * SCALE, paddingHorizontal: 30 * SCALE + 14, paddingBottom: 30 * SCALE + 18 },
  ribbon: { position: "absolute", left: "18%", right: "18%", alignItems: "center", justifyContent: "center" },
  ribbonText: { fontSize: 19, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  hero: { height: 128, alignItems: "center", justifyContent: "center" },
  name: { marginTop: 6, fontSize: 24, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink, textAlign: "center" },
  description: { marginTop: 6, fontFamily: fonts.light, letterSpacing: -0.42, fontSize: 14, lineHeight: 20, color: colors.brown, textAlign: "center" },
  where: { marginTop: 10, fontSize: 13, fontWeight: "800", fontFamily: fonts.bold, color: colors.green, textAlign: "center" },
  promptWrap: { marginTop: 22 },
  prompt: { fontSize: 20, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
});
