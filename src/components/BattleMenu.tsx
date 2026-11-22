import { useEffect, useRef, type ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { food, icons } from "../assets";
import { IconCaption } from "./IconCaption";
import { DROP_ARRIVAL_MS } from "./DropItem";
import { tutorialRef } from "./tutorialTargets";
import { t } from "../i18n";
import type { DropEvent } from "../state/useGameState";

// The battle row's menu: bag, cook pot, map — and whatever new pages join later. Every
// icon gets the same box; its art (trimmed to the visible pixels) is scaled to fit that box
// and centred in it. Art that would look off when fitted whole declares a `fit` region
// instead — only that part is fitted, the rest may overflow.
type RowIcon = { source: number; width: number; height: number; fit?: { x: number; y: number; width: number; height: number } };

export const MENU_ICON_BOX = { width: 52, height: 44 };
export const MENU_ICON_GAP = 12;
export const MENU_SIDE = 10;
const ROW_PADDING = 6;
// Where the first button (the bag) starts inside the row — BattleScene aims loot falling
// out of the scene at it (MENU_SIDE + this from the screen's content edge).
export const MENU_LEFT = ROW_PADDING;

const MAP_ICON: RowIcon = { source: icons.mapTrim, width: 669, height: 574 };
const BAG_ICON: RowIcon = { source: icons.backpackTrim, width: 349, height: 324 };
// The spoon pokes up out of the pot, so fitting the whole art makes the pot itself look
// small — fit the pot body (below the spoon, y >= 62) and let the spoon stick out.
const POT_ICON: RowIcon = { source: food.cookPotTrim, width: 356, height: 353, fit: { x: 0, y: 62, width: 356, height: 291 } };

function fitInBox(icon: RowIcon) {
  const fit = icon.fit ?? { x: 0, y: 0, width: icon.width, height: icon.height };
  const scale = Math.min(MENU_ICON_BOX.width / fit.width, MENU_ICON_BOX.height / fit.height);
  return {
    position: "absolute" as const,
    width: icon.width * scale,
    height: icon.height * scale,
    left: MENU_ICON_BOX.width / 2 - (fit.x + fit.width / 2) * scale,
    top: MENU_ICON_BOX.height / 2 - (fit.y + fit.height / 2) * scale,
  };
}

export function BattleMenu({
  onOpenBag,
  onOpenKitchen,
  onOpenMap,
  bagFull,
  dropEvents,
  trailing,
}: {
  onOpenBag: () => void;
  onOpenKitchen: () => void;
  onOpenMap: () => void;
  bagFull: boolean;
  dropEvents: DropEvent[];
  // Pinned to the row's right end, outside the scrolling part (the 2배속 button).
  trailing?: ReactNode;
}) {
  // One row of page buttons under the scene, laid out left to right; it scrolls sideways
  // once more pages join than fit.
  return (
    <View style={styles.row}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.rowContent}>
        <BagButton onPress={onOpenBag} dropEvents={dropEvents} full={bagFull} />
        <Pressable
          onPress={onOpenKitchen}
          accessibilityRole="button"
          accessibilityLabel={t("요리 페이지 열기", "Open kitchen page")}
          hitSlop={4}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Image source={POT_ICON.source} style={fitInBox(POT_ICON)} />
          <IconCaption>{t("요리", "Cook")}</IconCaption>
        </Pressable>
        <Pressable
          onPress={onOpenMap}
          accessibilityRole="button"
          accessibilityLabel={t("마일스톤 지도 열기", "Open milestone map")}
          hitSlop={4}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Image source={MAP_ICON.source} style={fitInBox(MAP_ICON)} />
          <IconCaption shift={5}>{t("지도", "Map")}</IconCaption>
        </Pressable>
      </ScrollView>
      {trailing}
    </View>
  );
}

// Loot from a kill flies down out of the scene toward this button; it bumps as it lands.
function BagButton({ onPress, dropEvents, full }: { onPress: () => void; dropEvents: DropEvent[]; full: boolean }) {
  const bump = useSharedValue(1);
  const lastSeen = useRef(0);

  useEffect(() => {
    const fresh = dropEvents.filter((event) => event.id > lastSeen.current);
    if (fresh.length === 0) return;
    lastSeen.current = Math.max(...fresh.map((event) => event.id));
    const lastArrival = Math.max(...fresh.map((event) => event.delay)) + DROP_ARRIVAL_MS;
    bump.value = withDelay(lastArrival, withSequence(withTiming(1.22, { duration: 90 }), withTiming(1, { duration: 160 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropEvents]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      ref={tutorialRef("bag")}
      accessibilityLabel={full ? t("가방 열기 (가득 참)", "Open bag (full)") : t("가방 열기", "Open bag")}
      hitSlop={4}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Animated.Image source={BAG_ICON.source} style={[fitInBox(BAG_ICON), style]} />
      <IconCaption>{t("가방", "Bag")}</IconCaption>
      {full && (
        <View style={styles.bagFull} pointerEvents="none">
          <Text style={styles.bagFullText}>{t("가득", "Full")}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Pulled up by the extra top padding below, so the gap under the scene stays the same.
  row: { marginHorizontal: MENU_SIDE, marginTop: -8, flexDirection: "row", alignItems: "center", gap: 8 },
  scroll: { flex: 1 },
  // The scroll view clips its content, so leave room above for art that pokes out of its
  // box (the cook pot's spoon) and below for the hanging captions.
  rowContent: { gap: MENU_ICON_GAP, paddingHorizontal: ROW_PADDING, paddingTop: 14, paddingBottom: 12 },
  button: { ...MENU_ICON_BOX },
  pressed: { transform: [{ scale: 0.92 }] },
  bagFull: { position: "absolute", top: -4, right: -6, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 7, backgroundColor: colors.red, borderWidth: 1.5, borderColor: colors.line },
  bagFullText: { fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
});
