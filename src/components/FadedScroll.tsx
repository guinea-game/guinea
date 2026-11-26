import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// The modal frame's parchment, which the list fades into.
const MODAL_PARCHMENT = "#f9e7ba";
const FADE_HEIGHT = 30;

// A modal's scrolling list whose bottom edge melts into the parchment (like the battle
// menu row beside 2배속) instead of being cut off flat. The fade shows only while there is
// more below; scrolled to the end, the last row sits clear.
// `style` lays out the whole thing (as a ScrollView's style would); `fadeColor` for lists
// sitting on something other than the modal parchment.
export function FadedScroll({
  style,
  contentContainerStyle,
  fadeColor = MODAL_PARCHMENT,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  fadeColor?: string;
  children: ReactNode;
}) {
  const [box, setBox] = useState({ view: 0, content: 0, offset: 0 });
  const more = box.content > box.view + 1 && box.offset + box.view < box.content - 4;
  return (
    <View style={[styles.wrap, style]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onLayout={(event: LayoutChangeEvent) => {
          const view = event.nativeEvent.layout.height;
          setBox((previous) => (previous.view === view ? previous : { ...previous, view }));
        }}
        onContentSizeChange={(_width, content) => setBox((previous) => (previous.content === content ? previous : { ...previous, content }))}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const offset = event.nativeEvent.contentOffset.y;
          setBox((previous) => ({ ...previous, offset }));
        }}
      >
        {children}
      </ScrollView>
      {more && (
        <LinearGradient
          colors={[`${fadeColor}00`, fadeColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.fade}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexShrink: 1 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  fade: { position: "absolute", left: 0, right: 0, bottom: 0, height: FADE_HEIGHT },
});
