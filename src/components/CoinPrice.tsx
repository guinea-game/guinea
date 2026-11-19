import { Image, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { Text } from "./GameText";
import { uiImages } from "../assets";
import { formatGameNumber } from "../state/gameMath";

// A gold amount the way prices are shown everywhere: the coin icon, then the number
// (no "G"). The icon scales with the text's font size. `icon` swaps in another currency's
// icon (e.g. the gem, for a gem-priced upgrade) while keeping the same layout.
export function CoinPrice({
  amount,
  textStyle,
  style,
  iconSize,
  icon,
}: {
  amount: number;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  icon?: number;
}) {
  const fontSize = StyleSheet.flatten(textStyle)?.fontSize ?? 11;
  const size = iconSize ?? Math.round(fontSize * 1.25);
  return (
    <View style={[styles.row, style]}>
      <Image source={icon ?? uiImages.coin} style={{ width: size, height: size }} />
      <Text style={textStyle}>{formatGameNumber(amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
});
