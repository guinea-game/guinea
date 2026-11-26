import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { kitImages } from "../assets";
import { StrokedText } from "./StrokedText";
import { colors, fonts } from "../theme";

// A count on the red notification dot (the same art as the "something new" dot), e.g. how
// many rewards "모두 받기" will collect. Sized at 24px so the 56px art stays crisp.
export function CountBadge({ count, style }: { count: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.badge, style]} pointerEvents="none">
      <Image source={kitImages.dotRed} style={styles.dot} />
      <StrokedText style={styles.text} strokeColor="#7a1f12" strokeWidth={1.5}>
        {count > 99 ? "99+" : String(count)}
      </StrokedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", width: 24, height: 24 },
  text: { fontSize: 11, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
});
