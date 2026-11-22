import { useEffect, useRef, type ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { icons, kitImages } from "../assets";
import { IconCaption } from "./IconCaption";
import { DROP_ARRIVAL_MS } from "./DropItem";
import { tutorialRef } from "./tutorialTargets";
import { t } from "../i18n";
import type { DropEvent } from "../state/useGameState";

// The battle row's menu: bag, 일일 의뢰, 퀘스트, 레벨 보상, 연구소, 이벤트 (요리 lives in the bottom nav) — and whatever new pages join later. Every
// icon gets the same box; its art (trimmed to the visible pixels) is scaled to fit that box
// and centred in it. Art that would look off when fitted whole declares a `fit` region
// instead — only that part is fitted, the rest may overflow.
// `zoom` evens out how big an icon *looks* next to the others once fitted (a chunky,
// box-filling shape reads larger than a slim one at the same box size).
type RowIcon = { source: number; width: number; height: number; fit?: { x: number; y: number; width: number; height: number }; zoom?: number };

export const MENU_ICON_BOX = { width: 52, height: 44 };
export const MENU_ICON_GAP = 12;
export const MENU_SIDE = 10;
const ROW_PADDING = 6;
// Where the first button (the bag) starts inside the row — BattleScene aims loot falling
// out of the scene at it (MENU_SIDE + this from the screen's content edge).
export const MENU_LEFT = ROW_PADDING;

// The medal art has a little clear margin left and right; fit just the medal.
const QUEST_ICON: RowIcon = { source: icons.questMedal, width: 130, height: 130, fit: { x: 4, y: 0, width: 122, height: 130 } };
// The chest is a solid block that fills the whole box, so it's drawn smaller; the slim
// potion bottle a touch bigger; the calendar in between.
const LEVEL_REWARD_ICON: RowIcon = { source: icons.levelReward, width: 256, height: 218, zoom: 0.84 };
const LAB_ICON: RowIcon = { source: icons.lab, width: 198, height: 256, zoom: 1.06 };
const EVENT_ICON: RowIcon = { source: icons.event, width: 256, height: 247, zoom: 0.9 };
// 일일 의뢰: both pictures are fitted by the gold frame alone, so the Gini stays the same size
// whether or not the "!" bubble pokes out above-right.
const DAILY_DONE_ICON: RowIcon = { source: icons.dailyDone, width: 323, height: 256 };
const DAILY_NEW_ICON: RowIcon = { source: icons.dailyNew, width: 338, height: 317, fit: { x: 0, y: 62, width: 323, height: 256 } };
const BAG_ICON: RowIcon = { source: icons.backpackTrim, width: 349, height: 324 };

function fitInBox(icon: RowIcon) {
  const fit = icon.fit ?? { x: 0, y: 0, width: icon.width, height: icon.height };
  const scale = Math.min(MENU_ICON_BOX.width / fit.width, MENU_ICON_BOX.height / fit.height) * (icon.zoom ?? 1);
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
  onOpenDaily,
  dailyAllDone,
  onOpenQuest,
  questReady,
  onOpenLevelReward,
  onOpenLab,
  onOpenEvent,
  bagFull,
  dropEvents,
  trailing,
}: {
  onOpenBag: () => void;
  onOpenDaily: () => void;
  // Today's requests all claimed: the plain picture; otherwise the one with the "!" bubble.
  dailyAllDone: boolean;
  onOpenQuest: () => void;
  // A quest reward waiting: red dot on the medal (it sits still — no wobble down here).
  questReady: boolean;
  onOpenLevelReward: () => void;
  onOpenLab: () => void;
  onOpenEvent: () => void;
  bagFull: boolean;
  dropEvents: DropEvent[];
  // Pinned to the row's right end, outside the scrolling part (the 2배속 button).
  trailing?: ReactNode;
}) {
  // One row of page buttons under the scene, laid out left to right; it scrolls sideways
  // once more pages join than fit.
  return (
    <View style={styles.row}>
      <View style={styles.scroll}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent}>
        <BagButton onPress={onOpenBag} dropEvents={dropEvents} full={bagFull} />
        <MenuButton icon={dailyAllDone ? DAILY_DONE_ICON : DAILY_NEW_ICON} label={t("일일 의뢰", "Daily")} onPress={onOpenDaily} />
        <Pressable
          onPress={onOpenQuest}
          accessibilityRole="button"
          accessibilityLabel={t("퀘스트", "Quests")}
          hitSlop={4}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Image source={QUEST_ICON.source} style={fitInBox(QUEST_ICON)} />
          <IconCaption>{t("퀘스트", "Quests")}</IconCaption>
          {questReady && <Image source={kitImages.dotRed} style={styles.dot} accessibilityLabel={t("받을 보상 있음", "Reward available")} />}
        </Pressable>
        <MenuButton icon={LEVEL_REWARD_ICON} label={t("레벨 보상", "Lv. Rewards")} onPress={onOpenLevelReward} />
        <MenuButton icon={LAB_ICON} label={t("연구소", "Lab")} onPress={onOpenLab} />
        <MenuButton icon={EVENT_ICON} label={t("이벤트", "Event")} onPress={onOpenEvent} />
      </ScrollView>
      {/* Icons scrolling past fade into the page's cream instead of being cut off. */}
      <LinearGradient
        colors={["rgba(245, 237, 218, 0)", colors.paper]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fade}
        pointerEvents="none"
      />
      </View>
      {/* Nudged down to the middle of the icons *with* their hanging captions. */}
      {trailing && <View style={styles.trailing}>{trailing}</View>}
    </View>
  );
}

function MenuButton({ icon, label, onPress }: { icon: RowIcon; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Image source={icon.source} style={fitInBox(icon)} />
      <IconCaption>{label}</IconCaption>
    </Pressable>
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
  fade: { position: "absolute", top: 0, bottom: 0, right: 0, width: 28 },
  trailing: { marginTop: 8 },
  // The scroll view clips its content, so leave room above for art that pokes out of its
  // box (a slightly zoomed icon like the potion) and below for the hanging captions.
  rowContent: { gap: MENU_ICON_GAP, paddingHorizontal: ROW_PADDING, paddingTop: 14, paddingBottom: 12 },
  button: { ...MENU_ICON_BOX },
  pressed: { transform: [{ scale: 0.92 }] },
  // Tucked onto the medal's rim (the medal is ~41 wide, centred in the 52 box).
  dot: { position: "absolute", top: 2, right: 5, width: 13, height: 13 },
  bagFull: { position: "absolute", top: -4, right: -6, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 7, backgroundColor: colors.red, borderWidth: 1.5, borderColor: colors.line },
  bagFullText: { fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
});
