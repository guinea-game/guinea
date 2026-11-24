import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { buttonKit, food, frameKit, icons, kit, statIcons, uiImages } from "../assets";
import { NineSlice, Panel } from "./NineSlice";
import { GameButton } from "./GameButton";
import { formatGameNumber } from "../state/gameMath";
import {
  describeLabLevel,
  describeLabUnlock,
  getLabLevel,
  getLabTrackMax,
  getResearchCost,
  isLabBusy,
  isLabUnlocked,
  LAB_TRACK_ORDER,
  LAB_TRACK_TITLE,
  LAB_UNLOCK_ORDER,
  LAB_UNLOCK_TITLE,
  type LabResearchId,
  type LabTrackId,
  type LabUnlockId,
} from "../state/lab";
import type { GameState } from "../types";
import { t } from "../i18n";

const TRACK_ICON: Record<LabTrackId, number> = {
  offline: icons.potionBlue,
  drop: icons.star,
  bag: icons.backpackTrim,
  skill: icons.potionRed,
  cooking: food.cookPotTrim,
};
const UNLOCK_ICON: Record<LabUnlockId, number> = {
  companionCap: icons.heart,
  critCap: statIcons.criticalDamage,
};

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function formatPlainDuration(ms: number) {
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return t(`${m}분`, `${m}m`);
  if (m === 0) return t(`${h}시간`, `${h}h`);
  return t(`${h}시간 ${m}분`, `${h}h ${m}m`);
}

type RowInfo = {
  id: LabResearchId;
  icon: number;
  title: string;
  maxed: boolean;
  levelBadge?: string;
  activeLine?: string;
  nextLine?: string;
  cost?: { gems: number; durationMs: number };
};

function buildRows(state: GameState): RowInfo[] {
  const trackRows: RowInfo[] = LAB_TRACK_ORDER.map((track) => {
    const level = getLabLevel(state, track);
    const max = getLabTrackMax(track);
    const maxed = level >= max;
    return {
      id: track,
      icon: TRACK_ICON[track],
      title: t(...LAB_TRACK_TITLE[track]),
      maxed,
      levelBadge: `Lv.${level}/${max}`,
      activeLine: level > 0 ? t(...describeLabLevel(track, level)) : undefined,
      nextLine: maxed ? undefined : t(...describeLabLevel(track, level + 1)),
      cost: maxed ? undefined : getResearchCost(state, track),
    };
  });
  const unlockRows: RowInfo[] = LAB_UNLOCK_ORDER.map((id) => {
    const owned = isLabUnlocked(state, id);
    return {
      id,
      icon: UNLOCK_ICON[id],
      title: t(...LAB_UNLOCK_TITLE[id]),
      maxed: owned,
      activeLine: owned ? t(...describeLabUnlock(id)) : undefined,
      nextLine: owned ? undefined : t(...describeLabUnlock(id)),
      cost: owned ? undefined : getResearchCost(state, id),
    };
  });
  return [...trackRows, ...unlockRows];
}

// 연구소: one research at a time, paid in gems up front, that finishes itself on wall-clock
// time — see state/lab.ts. A flat list (no chapters, unlike QuestModal) since there are only
// seven tracks in all.
export function LabModal({
  state,
  now,
  onClose,
  onStartResearch,
}: {
  state: GameState;
  now: number;
  onClose: () => void;
  onStartResearch: (id: LabResearchId) => void;
}) {
  const rows = buildRows(state);
  const busy = isLabBusy(state, now);
  const activeResearch = state.labResearch;
  const activeTitle = activeResearch ? rows.find((row) => row.id === activeResearch.id)?.title : undefined;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("닫기", "Close")} />
        <View style={styles.panel}>
          <NineSlice slice={kit.panelLarge} />
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.top}>
              <View>
                <Text style={styles.topEyebrow}>{t("기니 연구소", "Gini's Lab")}</Text>
                <Text style={styles.topTitle}>{t("연구소", "Lab")}</Text>
              </View>
              <View style={styles.topRight}>
                <View style={styles.gemCounter}>
                  <NineSlice slice={buttonKit.pillCream} scale={0.3} />
                  <Image source={uiImages.crystal} style={styles.gemIcon} />
                  <Text style={styles.gemText}>{formatGameNumber(state.gems)}</Text>
                </View>
                <GameButton onPress={onClose} style={styles.closeButton}>{t("닫기", "Close")}</GameButton>
              </View>
            </View>

            {activeResearch && (
              <Panel slice={kit.inset} scale={0.4} style={styles.activeBanner}>
                <Text style={styles.activeBannerText}>
                  {t(`${activeTitle} 연구 중 · ${formatCountdown(activeResearch.readyAt - now)} 남음`, `Researching ${activeTitle} · ${formatCountdown(activeResearch.readyAt - now)} left`)}
                </Text>
              </Panel>
            )}

            <View style={styles.list}>
              {rows.map((row) => {
                const isActive = activeResearch?.id === row.id;
                const blockedByOther = busy && !isActive;
                const affordable = row.cost !== undefined && state.gems >= row.cost.gems;
                return (
                  <Panel key={row.id} slice={kit.panel} scale={0.4} style={styles.item}>
                    <Panel slice={frameKit.squareWood} scale={0.45} style={styles.iconSlot}>
                      <Image source={row.icon} style={styles.icon} resizeMode="contain" />
                    </Panel>
                    <View style={styles.info}>
                      <View style={styles.titleRow}>
                        <Text style={styles.infoTitle}>{row.title}</Text>
                        {row.levelBadge && <Text style={styles.levelBadge}>{row.levelBadge}</Text>}
                      </View>
                      {row.activeLine && <Text style={styles.activeLine}>{t("현재", "Now")} · {row.activeLine}</Text>}
                      {row.nextLine && <Text style={styles.nextLine}>{t("다음", "Next")} · {row.nextLine}</Text>}
                    </View>
                    <View style={styles.action}>
                      {row.maxed ? (
                        <GameButton variant="gray" disabled style={styles.actionButton} textStyle={styles.actionButtonText}>
                          {t("완료", "Done")}
                        </GameButton>
                      ) : isActive ? (
                        <GameButton variant="gray" disabled style={styles.actionButton} textStyle={styles.actionButtonText}>
                          {formatCountdown(activeResearch.readyAt - now)}
                        </GameButton>
                      ) : (
                        <GameButton
                          variant={blockedByOther || !affordable ? "gray" : "green"}
                          disabled={blockedByOther || !affordable}
                          onPress={() => onStartResearch(row.id)}
                          style={styles.actionButton}
                          textStyle={styles.actionButtonText}
                          accessibilityLabel={t(`${row.title} 연구 시작`, `Start researching ${row.title}`)}
                        >
                          <View style={styles.costLabel}>
                            <View style={styles.costGemRow}>
                              <Image source={uiImages.crystal} style={styles.costGemIcon} />
                              <Text style={styles.costGemText}>{formatGameNumber(row.cost!.gems)}</Text>
                            </View>
                            <Text style={styles.costDuration}>{formatPlainDuration(row.cost!.durationMs)}</Text>
                          </View>
                        </GameButton>
                      )}
                    </View>
                  </Panel>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
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
    maxHeight: "90%",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  scroll: { flexGrow: 0 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topEyebrow: { color: colors.green, fontWeight: "800", fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5 },
  topTitle: { fontSize: 24, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.5 },
  closeButton: { paddingHorizontal: 12 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  gemCounter: { height: 32, minWidth: 74, flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 8, paddingRight: 14, paddingBottom: 2 },
  gemIcon: { width: 18, height: 18, resizeMode: "contain" },
  gemText: { color: colors.ink, fontSize: 14, fontWeight: "900", fontFamily: fonts.bold },
  activeBanner: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 12 },
  activeBannerText: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.green, textAlign: "center" },
  list: { marginTop: 12, gap: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 11,
  },
  iconSlot: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  icon: { width: 26, height: 26 },
  info: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoTitle: { fontSize: 13, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  levelBadge: { fontSize: 11, fontWeight: "800", fontFamily: fonts.bold, color: colors.muted },
  activeLine: { marginTop: 2, color: colors.green, fontSize: 11, fontWeight: "700", fontFamily: fonts.bold },
  nextLine: { marginTop: 1, color: colors.muted, fontSize: 11, fontWeight: "700", fontFamily: fonts.bold },
  action: { alignItems: "flex-end" },
  actionButton: { minWidth: 72, paddingHorizontal: 8 },
  actionButtonText: { fontSize: 12 },
  costLabel: { alignItems: "center" },
  costGemRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  costGemIcon: { width: 14, height: 14, resizeMode: "contain" },
  costGemText: { fontSize: 13, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  costDuration: { fontSize: 10, fontWeight: "800", fontFamily: fonts.bold, color: colors.cream, opacity: 0.85 },
});
