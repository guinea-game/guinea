import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "../components/GameText";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "../theme";
import { images, kit, shopKit } from "../assets";
import { Panel } from "../components/NineSlice";
import { PageHeading } from "../components/PageHeading";
import { GameButton } from "../components/GameButton";
import { CharacterSprite } from "../components/CharacterSprite";
import { SkillIcon } from "../components/SkillIcon";
import { SKILLS, type SkillId } from "../state/skills";
import { formatDuration } from "../state/buffs";
import { isSkillUnlocked, SKILL_UNLOCK_LEVEL } from "../state/unlocks";
import { LockBadge } from "../components/LockBadge";
import { PREVIEWABLE_SKILLS, SkillPreviewModal } from "../components/SkillPreviewModal";
import type { EnemyKind, Outfit } from "../types";
import { t } from "../i18n";

type SkillTab = "active" | "passive";

// Same backdrop/frame/gradient/character treatment as the Companions screen's "함께하는 중"
// preview — reused as-is (not a new image) so this banner reads as the same kind of thing.
const PREVIEW_SPRITE_SIZE = 100;
const BACKDROP_ASPECT = 880 / 1168;

// Every skill, with one equip slot between them — equipping a skill swaps out the last one.
export function SkillsScreen({
  equippedSkill,
  level,
  onEquip,
  swapReadyAt,
  now,
  enemyKind,
  outfit,
}: {
  equippedSkill: SkillId | null;
  level: number;
  onEquip: (id: SkillId | null) => void;
  swapReadyAt: number;
  now: number;
  // What the preview fight shows: the current stage's mob and the equipped companion.
  enemyKind: EnemyKind;
  outfit: Outfit;
}) {
  const swapLockLeftMs = Math.max(0, swapReadyAt - now);
  const [previewing, setPreviewing] = useState<SkillId | null>(null);
  const [tab, setTab] = useState<SkillTab>("active");
  const equippedSkillData = SKILLS.find((skill) => skill.id === equippedSkill) ?? null;
  const [previewWidth, setPreviewWidth] = useState(0);
  const visibleSkills = [...SKILLS]
    .filter((skill) => !!skill.passive === (tab === "passive"))
    .sort((a, b) => SKILL_UNLOCK_LEVEL[a.id] - SKILL_UNLOCK_LEVEL[b.id]);
  return (
    <View style={styles.page}>
      <PageHeading
        kicker="SKILLS"
        title={t("기니의 스킬", "Gini's Skills")}
        description={t(
          "스킬은 하나만 장착할 수 있어요. 스킬을 쓰거나 패시브를 장착하면 3분 동안 바꿀 수 없어요.",
          "Only one skill can be equipped. Using a skill or equipping a passive locks the slot for 3 minutes.",
        )}
      />

      {/* Same frame/backdrop/gradient/character treatment as the Companions screen's
          "함께하는 중" banner — shows whichever skill is actually equipped right now. */}
      <Panel slice={shopKit.frameWide} scale={0.32} style={styles.previewFrame}>
        <View style={styles.preview} onLayout={(event) => setPreviewWidth(event.nativeEvent.layout.width)}>
          {previewWidth > 0 && (
            <Image
              source={images.battleBackground}
              resizeMode="stretch"
              style={[styles.previewBackdrop, { width: previewWidth, height: previewWidth * BACKDROP_ASPECT }]}
            />
          )}
          <LinearGradient
            colors={["#14100ce6", "#14100cb3", "#14100c00"]}
            locations={[0, 0.45, 0.78]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.previewScrim}
            pointerEvents="none"
          />
          <View style={styles.previewCopy}>
            <Text style={styles.previewLabel}>{equippedSkillData ? t("장착 중인 스킬", "Equipped Skill") : t("장착한 스킬 없음", "No Skill Equipped")}</Text>
            <Text style={styles.previewTitle}>{equippedSkillData ? t(equippedSkillData.name) : t("기니의 스킬", "Gini's Skills")}</Text>
            <Text style={styles.previewBlurb}>
              {equippedSkillData ? t(equippedSkillData.description) : t("아래에서 스킬을 골라 장착해보세요.", "Pick a skill below to equip it.")}
            </Text>
          </View>
          <View style={styles.previewSprite}>
            <CharacterSprite outfit={outfit} animation="idle" size={PREVIEW_SPRITE_SIZE} />
          </View>
        </View>
      </Panel>

      <View style={styles.tabs}>
        <GameButton
          variant={tab === "active" ? "green" : "beige"}
          onPress={() => setTab("active")}
          style={styles.tabButton}
          textStyle={styles.tabButtonText}
        >
          {t("액티브 스킬", "Active Skills")}
        </GameButton>
        <GameButton
          variant={tab === "passive" ? "green" : "beige"}
          onPress={() => setTab("passive")}
          style={styles.tabButton}
          textStyle={styles.tabButtonText}
        >
          {t("패시브 스킬", "Passive Skills")}
        </GameButton>
      </View>

      <View style={styles.list}>
        {visibleSkills.map((skill) => {
          const equipped = skill.id === equippedSkill;
          const locked = swapLockLeftMs > 0;
          const unlockLevel = SKILL_UNLOCK_LEVEL[skill.id];
          const sealed = !equipped && !isSkillUnlocked(skill.id, level);
          const tagLabel = equipped
            ? t("✓ 장착 중", "✓ Equipped")
            : sealed
              ? t(`Lv.${unlockLevel}에 해금`, `Unlocks at Lv.${unlockLevel}`)
              : skill.passive
                ? t("패시브", "Passive")
                : t("액티브", "Active");
          return (
            <Panel slice={equipped ? kit.panel : kit.inset} style={styles.card} key={skill.id}>
              <View>
                <EquipSlam equipped={equipped}>
                  <View style={sealed && styles.dimmed}>
                    <SkillIcon id={skill.id} height={50} />
                  </View>
                </EquipSlam>
                {sealed && <LockBadge />}
              </View>
              <View style={styles.cardCopy}>
                <View style={[styles.tag, equipped ? styles.tagEquipped : sealed ? styles.tagLocked : styles.tagNeutral]}>
                  <Text style={[styles.tagText, equipped ? styles.tagTextEquipped : sealed ? styles.tagTextLocked : styles.tagTextNeutral]}>
                    {tagLabel}
                  </Text>
                </View>
                <Text style={styles.cardStrong}>{t(skill.name)}</Text>
                <Text style={styles.cardSpan}>{t(skill.description)}</Text>
              </View>
              <View style={styles.buttons}>
              <GameButton
                variant={sealed || locked ? "gray" : equipped ? "green" : "beige"}
                disabled={sealed || locked}
                onPress={() => onEquip(equipped ? null : skill.id)}
                style={styles.equipButton}
                textStyle={styles.equipButtonText}
                tutorialId={skill.id === "steal" ? "equip-steal" : undefined}
              >
                {sealed ? `Lv.${unlockLevel}` : locked ? formatDuration(swapLockLeftMs) : equipped ? t("해제", "Unequip") : t("장착", "Equip")}
              </GameButton>
              {PREVIEWABLE_SKILLS.includes(skill.id) && (
                <GameButton
                  variant="pillCream"
                  onPress={() => setPreviewing(skill.id)}
                  style={styles.equipButton}
                  textStyle={styles.equipButtonText}
                  accessibilityLabel={t(`${skill.name} 미리보기`, `Preview ${t(skill.name)}`)}
                >
                  {t("미리보기", "Preview")}
                </GameButton>
              )}
              </View>
            </Panel>
          );
        })}
      </View>
      {previewing && <SkillPreviewModal skillId={previewing} enemyKind={enemyKind} outfit={outfit} onClose={() => setPreviewing(null)} />}
    </View>
  );
}

// Equipping a skill here: its icon drops in big and thumps down inside a gold ring burst.
function EquipSlam({ equipped, children }: { equipped: boolean; children: React.ReactNode }) {
  const [equippedOnArrival] = useState(equipped);
  const slam = useSharedValue(1);
  const ring = useSharedValue(0);
  useEffect(() => {
    if (!equipped || equippedOnArrival) return;
    slam.value = withSequence(withTiming(1.5, { duration: 0 }), withTiming(0.9, { duration: 170, easing: Easing.in(Easing.quad) }), withTiming(1, { duration: 120 }));
    ring.value = withSequence(withTiming(0, { duration: 150 }), withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipped]);
  const slamStyle = useAnimatedStyle(() => ({ transform: [{ scale: slam.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value > 0 ? 1 - ring.value : 0, transform: [{ scale: 0.6 + ring.value * 0.9 }] }));
  return (
    <View>
      <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />
      <Animated.View style={slamStyle}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: "absolute", top: -6, left: -6, right: -6, bottom: -6, borderRadius: 40, borderWidth: 4, borderColor: colors.gold },
  page: { backgroundColor: "#e8dcc4", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 25 },

  previewFrame: { padding: 11, marginBottom: 14 },
  preview: { height: 150, flexDirection: "row", alignItems: "center", overflow: "hidden", borderRadius: 4 },
  previewBackdrop: { position: "absolute", left: 0, bottom: -10 },
  previewScrim: { position: "absolute", top: 0, left: 0, bottom: 0, right: 0 },
  previewCopy: { width: "58%", paddingLeft: 16, paddingRight: 4 },
  previewLabel: { color: "#d7dfab", fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, letterSpacing: 1.5 },
  previewTitle: { marginTop: 4, fontSize: 20, fontWeight: "800", fontFamily: fonts.bold, color: colors.cream },
  previewBlurb: { fontFamily: fonts.light, letterSpacing: -0.36, marginTop: 4, color: "#efe7d4", fontSize: 12, lineHeight: 16 },
  previewSprite: { flex: 1, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },

  tabs: { flexDirection: "row", gap: 8, marginBottom: 10 },
  tabButton: { flex: 1 },
  tabButtonText: { fontSize: 14 },

  list: { gap: 8 },
  card: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 15, flexDirection: "row", alignItems: "center", gap: 10 },
  dimmed: { opacity: 0.35 },
  cardCopy: { flex: 1 },
  tag: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginBottom: 3 },
  tagNeutral: { backgroundColor: "#e6d3ab" },
  tagEquipped: { backgroundColor: colors.green },
  tagLocked: { backgroundColor: "#e8c9c0" },
  tagText: { fontSize: 11, fontWeight: "900", fontFamily: fonts.bold },
  tagTextNeutral: { color: colors.brown },
  tagTextEquipped: { color: colors.cream },
  tagTextLocked: { color: colors.red },
  cardStrong: { marginVertical: 2, fontSize: 15, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink },
  cardSpan: { fontFamily: fonts.light, letterSpacing: -0.36, color: colors.muted, fontSize: 12, lineHeight: 16 },
  buttons: { gap: 4 },
  equipButton: { minWidth: 56 },
  equipButtonText: { fontSize: 12 },
});
