import { Image, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { fonts } from "../theme";
import { uiImages } from "../assets";
import { GameButton } from "./GameButton";
import { formatDuration } from "../state/buffs";
import { t } from "../i18n";

// The 2배속 ad button, at the right end of the page-button row under the scene. (Auto
// battle isn't a button — its on/off shows as a coloured dot by the stage name.)
export function BattleActionsPanel({
  speedBoostActive,
  speedBoostRemainingMs,
  onWatchAd,
}: {
  speedBoostActive: boolean;
  speedBoostRemainingMs: number;
  onWatchAd: () => void;
}) {
  return (
    // Bright gold so the offer stands out; the ad clapper sits left of the text.
    <GameButton variant={speedBoostActive ? "gray" : "gold"} disabled={speedBoostActive} onPress={onWatchAd} style={styles.action}>
      <View style={styles.content}>
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
  );
}

const styles = StyleSheet.create({
  // Fixed width so the button doesn't change size when it flips to the countdown.
  action: { width: 90, minHeight: 42, paddingHorizontal: 4, paddingTop: 4, paddingBottom: 6 },
  content: { flexDirection: "row", alignItems: "center", gap: 6 },
  // Clapper art is 219x256.
  adIcon: { width: 19, height: 22, resizeMode: "contain" },
  stack: { alignItems: "center" },
  actionSmall: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: "#4f463c" },
  actionLabel: { fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: "#2a2316" },
});
