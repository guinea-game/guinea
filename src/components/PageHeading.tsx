import { StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";

// `kicker` (the small English line above) and `badge` (a tag beside the title, e.g. "2회차")
// are both optional.
export function PageHeading({ kicker, title, description, badge }: { kicker?: string; title: string; description: string; badge?: string }) {
  return (
    <View style={styles.wrap}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 2, marginTop: 2, marginBottom: 18 },
  kicker: { color: colors.green, fontWeight: "800", fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5, marginBottom: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 9, backgroundColor: colors.green },
  badgeText: { fontSize: 13, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  title: { fontSize: 31, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink, letterSpacing: -1 },
  description: { fontFamily: fonts.light, letterSpacing: -0.36, marginTop: 3, color: colors.brown, fontSize: 12, lineHeight: 16 },
});
