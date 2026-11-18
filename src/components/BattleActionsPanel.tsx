import type { ReactNode } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { fonts } from "../theme";
import { icons, uiImages } from "../assets";
import { GameButton } from "./GameButton";
import { formatDuration } from "../state/buffs";
import { t } from "../i18n";

export function BattleActionsPanel({
  isAutoBattle,
  autoLocked = false,
  reloading = false,
  speedBoostActive,
  speedBoostRemainingMs,
  onWatchAd,
  left,
}: {
  isAutoBattle: boolean;
  // A companion that can't fight by hand (사무라이기니) pins auto-battle on.
  autoLocked?: boolean;
  // 카우보이기니's cylinder is empty — the next swing is waiting out the reload instead
  // of the usual gap (see useAutoBattle's shotsBeforeReload/reloadMs).
  reloading?: boolean;
  speedBoostActive: boolean;
  speedBoostRemainingMs: number;
  onWatchAd: () => void;
  left?: ReactNode; // pinned to the row's left end (the food buff slots)
}) {
  // Not a toggle any more — manual combat only opens up while 난타 is cast (see
  // useAutoBattle's isAutoBattle), so this is just a status display now, but still built
  // from the same GameButton face as every other button on this row (not a flat badge).
  return (
    <View style={styles.wrap}>
      {left}
      <View style={styles.spacer} />
      {/* Both buttons share one fixed width (ACTION_WIDTH), sized for the longest label
          either can show, and the same caption-over-label layout — so the row never shifts
          as the status text changes. */}
      <GameButton variant={reloading ? "red" : isAutoBattle ? "green" : "beige"} style={styles.action} textStyle={styles.actionLabel}>
        <View style={styles.autoContent}>
          <Image source={reloading ? uiImages.swords : isAutoBattle ? icons.energy : uiImages.swords} style={styles.autoIcon} />
          {/* Plain auto battle reads as one word ("자동 전투"); the other states keep their
              caption-over-label pair. */}
          {isAutoBattle && !reloading && !autoLocked ? (
            <Text style={[styles.actionLabel, styles.actionLabelOnGreen]}>{t("자동 전투", "Auto Battle")}</Text>
          ) : (
            <View style={styles.stack}>
              <Text style={[styles.actionSmall, isAutoBattle && !reloading && styles.actionSmallOnGreen]}>
                {reloading ? t("재장전 중", "Reloading", "リロード中", "装填中") : isAutoBattle ? t("자동 전투", "Auto Battle") : t("난타 중", "Flurry Active")}
              </Text>
              <Text style={[styles.actionLabel, isAutoBattle && !reloading && styles.actionLabelOnGreen]}>
                {reloading ? t("잠시만요!", "Hang on!") : autoLocked ? t("고정", "Locked") : t("직접 공격", "Manual Attack")}
              </Text>
            </View>
          )}
        </View>
      </GameButton>

      {/* The ad clapper sits left of the text, inside the button — the same icon-then-text
          layout as the auto-battle button beside it. */}
      {/* Same plain cream box as the 기니 성장 rows. */}
      <GameButton variant={speedBoostActive ? "gray" : "box"} disabled={speedBoostActive} onPress={onWatchAd} style={styles.action}>
        <View style={[styles.autoContent, styles.adContent]}>
          {!speedBoostActive && <Image source={uiImages.adClapper} style={styles.adIcon} />}
          {speedBoostActive ? (
            <View style={styles.stack}>
              <Text style={styles.actionSmall}>{t("2배속 중", "2x Active")}</Text>
              <Text style={styles.actionLabel}>{formatDuration(speedBoostRemainingMs)}</Text>
            </View>
          ) : (
            // The clapper beside it already says "ad", so the label is just the reward.
            <Text style={styles.actionLabel}>{t("2배속", "2x Speed")}</Text>
          )}
        </View>
      </GameButton>
    </View>
  );
}

// Fits "직접 공격" beside its icon (the longest label either button shows) with padding.
const ACTION_WIDTH = 104;

const styles = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 2, marginHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  spacer: { flex: 1 },
  action: { width: ACTION_WIDTH, minHeight: 50, paddingHorizontal: 8 },
  autoContent: { flexDirection: "row", alignItems: "center", gap: 4 },
  autoIcon: { width: 16, height: 16 },
  // A little more air between the clapper and "2배속" than the auto button's small icon needs.
  adContent: { gap: 8 },
  // Clapper art is 219x256.
  adIcon: { width: 22, height: 26, resizeMode: "contain" },
  stack: { alignItems: "center" },
  actionSmall: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: "#4f463c" },
  actionSmallOnGreen: { color: "#2f4a16" },
  actionLabel: { fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: "#2a2316" },
  actionLabelOnGreen: { color: "#2a2316" },
});
