import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../components/GameText";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { colors, fonts } from "../theme";
import { kit } from "../assets";
import { Panel } from "../components/NineSlice";
import { PageHeading } from "../components/PageHeading";
import { GameButton } from "../components/GameButton";
import { SkillIcon } from "../components/SkillIcon";
import { SKILLS, type SkillId } from "../state/skills";
import { formatDuration } from "../state/buffs";
import { isSkillUnlocked, SKILL_UNLOCK_LEVEL } from "../state/unlocks";
import { LockBadge } from "../components/LockBadge";
import { PREVIEWABLE_SKILLS, SkillPreviewModal } from "../components/SkillPreviewModal";
import type { EnemyKind, Outfit } from "../types";
import { t } from "../i18n";

type SkillTab = "active" | "passive";

// Every skill, with one equip slot between them — equipping a skill swaps out the last one.
export function SkillsScreen({
  equippedSkill,
  level,
  onEquip,
  swapReadyAt,
  now,
  enemyKind,
  outfit,
  playerName,
}: {
  equippedSkill: SkillId | null;
  level: number;
  onEquip: (id: SkillId | null) => void;
  swapReadyAt: number;
  now: number;
  // What the preview fight shows: the current stage's mob and the equipped companion.
  enemyKind: EnemyKind;
  outfit: Outfit;
  playerName: string;
}) {
  const swapLockLeftMs = Math.max(0, swapReadyAt - now);
  const [previewing, setPreviewing] = useState<SkillId | null>(null);
  const [tab, setTab] = useState<SkillTab>("active");
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
          // 장착 중/잠김은 패널 테두리·장착 슬램 애니메이션·자물쇠 배지·버튼 글자로 이미 표시되니,
          // 테두리 없는 색만 칠한 태그는 활성/패시브 구분할 때만 보여준다 (해금/장착 중엔 숨김).
          const tagLabel = skill.passive ? t("패시브", "Passive") : t("액티브", "Active");
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
                {!equipped && !sealed && (
                  <View style={[styles.tag, styles.tagNeutral]}>
                    <Text style={[styles.tagText, styles.tagTextNeutral]}>{tagLabel}</Text>
                  </View>
                )}
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
      {previewing && (
        <SkillPreviewModal skillId={previewing} enemyKind={enemyKind} outfit={outfit} playerName={playerName} onClose={() => setPreviewing(null)} />
      )}
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

  tabs: { flexDirection: "row", gap: 8, marginBottom: 10 },
  tabButton: { flex: 1 },
  tabButtonText: { fontSize: 14 },

  list: { gap: 8 },
  card: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 15, flexDirection: "row", alignItems: "center", gap: 10 },
  dimmed: { opacity: 0.35 },
  cardCopy: { flex: 1 },
  tag: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginBottom: 3 },
  tagNeutral: { backgroundColor: "#e6d3ab" },
  tagText: { fontSize: 11, fontWeight: "900", fontFamily: fonts.bold },
  tagTextNeutral: { color: colors.brown },
  cardStrong: { marginVertical: 2, fontSize: 15, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink },
  cardSpan: { fontFamily: fonts.light, letterSpacing: -0.36, color: colors.muted, fontSize: 12, lineHeight: 16 },
  buttons: { gap: 4 },
  equipButton: { minWidth: 56 },
  equipButtonText: { fontSize: 12 },
});
