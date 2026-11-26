import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { buttonKit, frameKit, kit, kitImages, uiImages } from "../assets";
import { NineSlice, Panel } from "./NineSlice";
import { ModalFrame } from "./ModalFrame";
import { CountBadge } from "./CountBadge";
import { GameButton } from "./GameButton";
import { formatGameNumber } from "../state/gameMath";
import { getLevelRewards } from "../state/levelRewards";
import { useBumpOnChange, useRollingNumber } from "./motion";
import { playSfx } from "../sound";
import { playHaptic } from "../haptics";
import type { GameState } from "../types";
import { t } from "../i18n";

// A flat, ever-growing ladder of one-time gem chests (state/levelRewards.ts's LEVEL_REWARDS) —
// no chapters to page through like QuestModal, just one scrolling list, earliest first.
export function LevelRewardModal({
  state,
  onClose,
  onClaim,
}: {
  state: GameState;
  onClose: () => void;
  onClaim: (level: number) => void;
}) {
  const rows = getLevelRewards(state);
  const claimableRows = rows.filter((row) => row.claimable);
  const claimableGems = claimableRows.reduce((sum, row) => sum + row.gems, 0);
  const shownGems = useRollingNumber(state.gems, 700);
  const { style: gemBump } = useBumpOnChange(state.gems);
  // Which claim is mid-flight (or "all") so a double tap can't claim it twice.
  const [claiming, setClaiming] = useState<string | null>(null);

  const claim = (level: number) => {
    if (claiming) return;
    setClaiming(String(level));
    onClaim(level);
    playSfx("levelup");
    playHaptic("claim");
    setTimeout(() => setClaiming(null), 300);
  };

  const claimAll = () => {
    if (claiming || claimableRows.length === 0) return;
    setClaiming("all");
    claimableRows.forEach((row) => onClaim(row.level));
    playSfx("levelup");
    playHaptic("claim");
    setTimeout(() => setClaiming(null), 300);
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* A sibling behind the panel, not a Pressable wrapped around it — see QuestModal. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("닫기", "Close")} />
        <View style={styles.panel}>
          <ModalFrame />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.top}>
              <View>
                <Text style={styles.topEyebrow}>{t("레벨을 올릴수록", "The higher you climb")}</Text>
                <Text style={styles.topTitle}>{t("레벨 보상", "Level Rewards")}</Text>
              </View>
              <View style={styles.topRight}>
                <Animated.View style={[styles.gemCounter, gemBump]}>
                  <NineSlice slice={buttonKit.pillCream} scale={0.3} />
                  <Image source={uiImages.crystal} style={styles.gemIcon} />
                  <Text style={styles.gemText}>{formatGameNumber(shownGems)}</Text>
                </Animated.View>
                <GameButton onPress={onClose} style={styles.closeButton}>{t("닫기", "Close")}</GameButton>
              </View>
            </View>

            {claimableRows.length > 0 && (
              <View style={styles.claimAllWrap}>
                <GameButton
                  variant="green"
                  onPress={claimAll}
                  disabled={claiming !== null}
                  style={styles.claimAll}
                  accessibilityLabel={t(`레벨 보상 ${claimableRows.length}개 모두 받기`, `Claim all ${claimableRows.length} level rewards`)}
                >
                  <View style={styles.claimAllContent}>
                    <Text style={styles.claimAllText}>{t("모두 받기", "Claim All")}</Text>
                    <RewardLabel gems={claimableGems} />
                  </View>
                </GameButton>
                <CountBadge count={claimableRows.length} style={styles.countBadge} />
              </View>
            )}

            <View style={styles.list}>
              {rows.map((row) => (
                <Panel key={row.level} slice={kit.panel} scale={0.4} style={[styles.item, !row.claimable && !row.claimed && styles.itemLocked]}>
                  <Panel slice={frameKit.squareWood} scale={0.45} style={styles.iconSlot}>
                    <Image source={uiImages.crystal} style={styles.icon} resizeMode="contain" />
                    {row.claimable && <Image source={kitImages.dotRed} style={styles.readyDot} accessibilityLabel={t("받을 보상 있음", "Reward ready")} />}
                  </Panel>
                  <View style={styles.info}>
                    <Text style={styles.infoTitle}>{t(`Lv.${row.level}`, `Lv.${row.level}`)}</Text>
                    <Text style={styles.infoSub}>
                      {row.claimed
                        ? t("받았어요", "Claimed")
                        : row.claimable
                          ? t("받을 수 있어요!", "Ready to claim!")
                          : t(`Lv.${row.level}에 열려요`, `Unlocks at Lv.${row.level}`)}
                    </Text>
                  </View>
                  <GameButton
                    variant="green"
                    disabled={!row.claimable || claiming === String(row.level)}
                    onPress={() => claim(row.level)}
                    style={styles.claimButton}
                    textStyle={styles.claimButtonText}
                  >
                    {row.claimed ? t("완료", "Done") : <RewardLabel gems={row.gems} />}
                  </GameButton>
                </Panel>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// The claim button's face: the gems it pays, instead of a "받기" label.
function RewardLabel({ gems }: { gems: number }) {
  return (
    <View style={styles.rewardLabel}>
      <Image source={uiImages.crystal} style={styles.rewardGem} />
      <Text style={styles.rewardText}>{formatGameNumber(gems)}</Text>
    </View>
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
    paddingHorizontal: 34,
    paddingTop: 48,
    paddingBottom: 36,
  },
  // A little room either side inside the scroller (given back by the negative margin), so the
  // "모두 받기" count badge poking past the button's corner isn't clipped by the scroll view.
  scroll: { flexGrow: 0, marginHorizontal: -8 },
  scrollContent: { paddingHorizontal: 8 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topEyebrow: { color: colors.green, fontWeight: "800", fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5 },
  topTitle: { fontSize: 24, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.5 },
  closeButton: { paddingHorizontal: 12 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  gemCounter: { height: 32, minWidth: 74, flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 8, paddingRight: 14, paddingBottom: 2 },
  gemIcon: { width: 18, height: 18, resizeMode: "contain" },
  gemText: { color: colors.ink, fontSize: 14, fontWeight: "900", fontFamily: fonts.bold },
  claimAllWrap: { marginTop: 14, marginBottom: 4 },
  claimAll: { minHeight: 40 },
  claimAllContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  claimAllText: { fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  countBadge: { position: "absolute", top: -8, right: -6 },
  list: { marginTop: 10, gap: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 11,
  },
  itemLocked: { opacity: 0.55 },
  iconSlot: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  icon: { width: 24, height: 24 },
  readyDot: { position: "absolute", right: -3, top: -3, width: 13, height: 13 },
  info: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  infoSub: { marginTop: 2, color: colors.muted, fontSize: 12, fontWeight: "700", fontFamily: fonts.bold },
  claimButton: { minWidth: 64, paddingHorizontal: 8 },
  claimButtonText: { fontSize: 12 },
  rewardLabel: { flexDirection: "row", alignItems: "center", gap: 3 },
  rewardGem: { width: 15, height: 15, resizeMode: "contain" },
  rewardText: { fontSize: 14, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
});
