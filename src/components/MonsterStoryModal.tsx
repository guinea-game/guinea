import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { kit } from "../assets";
import { Panel } from "./NineSlice";
import { ModalFrame } from "./ModalFrame";
import { GameButton } from "./GameButton";
import { EnemySprite } from "./EnemySprite";
import { BOSS_LORE, MOB_LORE } from "../state/bestiary";
import { BOSS_NAME, ENEMY_NAME, getStageCode } from "../state/stages";
import type { EnemyKind } from "../types";
import { t } from "../i18n";

export function MonsterStoryModal({
  kind,
  boss,
  stageIndex,
  area,
  canGo,
  onGo,
  onClose,
}: {
  kind: EnemyKind;
  boss: boolean;
  stageIndex: number;
  area: string;
  // Whether its stage has been reached, and going there (tapping the stage tag).
  canGo: boolean;
  onGo: () => void;
  onClose: () => void;
}) {
  const lore = boss ? BOSS_LORE[kind] : MOB_LORE[kind];
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(event) => event.stopPropagation()}>
          <ModalFrame />
          <View style={styles.top}>
            <View style={[styles.tag, boss ? styles.tagBoss : styles.tagMob]}>
              <Text style={styles.tagText}>{boss ? t("보스", "Boss") : t("일반", "Normal")}</Text>
            </View>
            {/* Where it lives — tapping the tag goes to that stage (once it's been reached). */}
            <Pressable
              disabled={!canGo}
              onPress={onGo}
              accessibilityRole="button"
              accessibilityLabel={canGo ? t(`${area}(으)로 이동`, `Go to ${t(area)}`) : t(area)}
              hitSlop={6}
              style={({ pressed }) => [styles.stageTag, pressed && styles.stageTagPressed]}
            >
              <Text style={styles.stageTagText}>
                {getStageCode(stageIndex)} {t(area)}
              </Text>
            </Pressable>
          </View>
          <View style={styles.portrait}>
            <EnemySprite boss={boss} kind={kind} animation="idle" size={boss ? 130 : 110} restartKey={`story-${kind}-${boss}`} />
          </View>
          <Text style={styles.name}>{t(boss ? BOSS_NAME[kind] : ENEMY_NAME[kind])}</Text>
          <View style={styles.traits}>
            {lore.traits.map((trait) => (
              <View key={trait} style={styles.trait}>
                <Text style={styles.traitText}>#{t(trait)}</Text>
              </View>
            ))}
          </View>
          <Panel slice={kit.inset} scale={0.4} style={styles.storyBox}>
            <Text style={styles.story}>{t(lore.story)}</Text>
          </Panel>
          <GameButton variant="green" onPress={onClose} style={styles.close}>
            {t("닫기", "Close")}
          </GameButton>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, paddingHorizontal: 16, justifyContent: "center", backgroundColor: "#263024cf" },
  panel: { width: "100%", maxWidth: 400, alignSelf: "center", alignItems: "center", paddingHorizontal: 34, paddingTop: 48, paddingBottom: 36 },
  top: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 6 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  tagMob: { backgroundColor: colors.green },
  tagBoss: { backgroundColor: colors.red },
  tagText: { fontSize: 9, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  stageTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: "#e9d6ae" },
  stageTagPressed: { transform: [{ scale: 0.95 }] },
  stageTagText: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.brown },
  portrait: { height: 130, justifyContent: "flex-end", alignItems: "center" },
  name: { marginTop: 4, fontSize: 24, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  traits: { marginTop: 6, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 5 },
  trait: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: "#e9d6ae" },
  traitText: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.brown },
  storyBox: { marginTop: 12, alignSelf: "stretch", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  story: { fontSize: 14, lineHeight: 18, color: colors.ink, fontFamily: fonts.bold },
  close: { marginTop: 14, minWidth: 120 },
});
