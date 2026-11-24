import { useEffect, useState, type ReactNode } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { Text } from "../components/GameText";
import { StrokedText } from "../components/StrokedText";
import { colors, fonts } from "../theme";
import { LinearGradient } from "expo-linear-gradient";
import { dailyImages, kit, shopKit } from "../assets";
import { NineSlice, Panel } from "../components/NineSlice";
import { GameButton } from "../components/GameButton";
import { CoinPrice } from "../components/CoinPrice";
import { ShopTopBar } from "../components/ShopScene";
import { getDailyOrders, type DailyOrderView } from "../state/daily";
import type { GameState } from "../types";
import { t } from "../i18n";

// A deep warm brown the restaurant fades up into under the top bar (whose text goes light).
const PAGE = "#3a2416";
const PAGE_CLEAR = "rgba(58, 36, 22, 0)";
const PAGE_SIDE = 16;
const PAGE_TOP = 20;
// Includes the top bar laid over the hall's upper part.
const SCENE_HEIGHT = 400;
// The counter's bottom edge sits this far above the scene's bottom, over the floor fade.
const COUNTER_LIFT = 10;
// Inside the ticket frames: cream, under a clear warm apricot fade at the top.
const TICKET_FILL = "#fbe6c2";
const PATTERN_ASPECT = 1386 / 780;
// The pattern art's base (between cream and caramel) — fills in below the picture on a very tall screen.
export const DAILY_LOWER_COLOR = "#e9b882";
const COUNTER_ASPECT = 398 / 900;
// The counter art's wooden top (front edge) sits this far down the picture.
const COUNTER_TOP = 0.36;
const CUSTOMER_HEIGHT = 168;
const CUSTOMER_WIDTH = CUSTOMER_HEIGHT * 0.95;

// 일일 의뢰: a restaurant counter that customers walk up to. The one being served stands
// behind the counter saying their order (and what it pays) in a speech bubble;
// 제출 under the scene hands it over — they hop, walk off, and the next one steps up. The
// tickets below are today's whole queue; tapping one calls that customer to the counter.
export function DailyScreen({
  state,
  priceStage,
  onBack,
  onDeliver,
  header,
}: {
  state: GameState;
  priceStage: number;
  onBack: () => void;
  onDeliver: (index: number) => void;
  // The game header, drawn over the top of the restaurant instead of on its own cream strip.
  header?: ReactNode;
}) {
  const orders = getDailyOrders(state, priceStage);
  const waiting = orders.filter((order) => !order.delivered);
  const [picked, setPicked] = useState<number | null>(null);
  const current = waiting.find((order) => order.index === picked) ?? waiting[0] ?? null;
  const [width, setWidth] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  // 제출: the customer hops and walks off (Customer), then the order is handed over and the
  // next one walks in — each customer is its own mount, keyed below.
  const [leaving, setLeaving] = useState(false);
  const shownKey = current ? `${current.index}-${current.customer}` : "none";
  const submit = () => {
    if (!current || leaving || current.have < current.count) return;
    const index = current.index;
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      setPicked(null);
      onDeliver(index);
    }, 760);
  };

  const counterHeight = width * COUNTER_ASPECT;
  const counterTop = SCENE_HEIGHT - COUNTER_LIFT - counterHeight;
  // Feet tucked well behind the counter's top.
  const customerTop = counterTop + counterHeight * COUNTER_TOP + 44 - CUSTOMER_HEIGHT;
  const enough = current ? current.have >= current.count : false;

  return (
    <View style={styles.page}>
      {/* The restaurant runs edge to edge and all the way up behind the game header (which
          this page draws itself, over it): from the header's top line it dissolves into the
          cream above, under a dark wash that keeps the top bar readable; the hall's floor
          blends into the wallpaper below the counter. */}
      <View style={[styles.scene, { height: headerHeight + SCENE_HEIGHT }]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
          <Image source={dailyImages.restaurant} style={styles.background} resizeMode="cover" />
          <LinearGradient
            colors={["rgba(58, 36, 22, 0.82)", "rgba(58, 36, 22, 0.55)", PAGE_CLEAR]}
            locations={[0, 0.45, 1]}
            style={[styles.topFade, { height: headerHeight + 120 }]}
            pointerEvents="none"
          />
          <LinearGradient colors={[colors.paper, "rgba(245, 237, 218, 0)"]} style={[styles.headerBlend, { height: headerHeight + 16 }]} pointerEvents="none" />
          <LinearGradient colors={["rgba(233, 184, 130, 0)", DAILY_LOWER_COLOR]} style={styles.bottomFade} pointerEvents="none" />
          {header && (
            <View style={styles.header} onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
              {header}
            </View>
          )}
          <View style={[styles.stage, { top: headerHeight }]} pointerEvents="box-none">
          {width > 0 && current && (
            <Customer key={`customer-${shownKey}`} source={current.customerImage} sceneWidth={width} top={customerTop} leaving={leaving} />
          )}
          {width > 0 && <Image source={dailyImages.counter} style={[styles.counter, { width, height: counterHeight }]} />}
          {width > 0 && current && <OrderBubble key={`bubble-${shownKey}`} order={current} />}
          {width > 0 && !current && (
            <View style={styles.closedSign}>
              <Panel slice={kit.panelBrown} scale={0.4} style={styles.closedPlank}>
                <Text style={styles.closedText}>{orders.length > 0 ? t("오늘 주문은 끝!", "All orders done!") : t("아직 손님이 없어요", "No customers yet")}</Text>
                <Text style={styles.closedSub}>
                  {orders.length > 0 ? t("자정에 새 손님이 와요", "New customers at midnight") : t("레시피를 배우면 주문하러 와요", "Learn a recipe and they'll come")}
                </Text>
              </Panel>
            </View>
          )}
          <View style={styles.topBar}>
            <ShopTopBar kicker="ORDERS" title={t("일일 의뢰", "Daily Orders")} gold={state.gold} onBack={onBack} backLabel={t("전투로 돌아가기", "Back to Battle")} dark showGold={false} />
          </View>
          </View>
      </View>

      {/* Under the counter: the caramel chef-pattern wallpaper, down to the nav. */}
      <View style={styles.lower}>
        {width > 0 && <Image source={dailyImages.pattern} style={[styles.pattern, { width, height: width * PATTERN_ASPECT }]} />}
      {orders.length > 0 && (
        <View style={styles.queue}>
          {orders.map((order) => (
            <Ticket key={order.index} order={order} onPress={() => setPicked(order.index)} />
          ))}
        </View>
      )}

      {current && (
        // 제출 have/need: green once the bag holds enough, gray (not pressable) until then.
        <GameButton variant={enough ? "green" : "gray"} onPress={submit} disabled={!enough || leaving} style={styles.submit}>
          <View style={styles.submitRow}>
            <Text style={[styles.submitText, !enough && styles.submitTextShort]}>
              {t(`제출 ${current.have}/${current.count}`, `Submit ${current.have}/${current.count}`)}
            </Text>
          </View>
        </GameButton>
      )}
      </View>
    </View>
  );
}

// The customer behind the counter: walks in from the left on arrival; on `leaving`, a happy
// hop and off to the right.
function Customer({ source, sceneWidth, top, leaving }: { source: number; sceneWidth: number; top: number; leaving: boolean }) {
  const x = useSharedValue(-sceneWidth * 0.7);
  const hop = useSharedValue(0);
  useEffect(() => {
    if (!leaving) {
      x.value = withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) });
      return;
    }
    hop.value = withSequence(withTiming(-16, { duration: 140, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }));
    x.value = withSequence(withTiming(0, { duration: 360 }), withTiming(sceneWidth * 0.8, { duration: 380, easing: Easing.in(Easing.cubic) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: hop.value }] }));
  return (
    <Animated.View style={[styles.customer, { top, left: sceneWidth * 0.5 - CUSTOMER_WIDTH / 2 }, style]}>
      <Image source={source} style={styles.customerImage} />
    </Animated.View>
  );
}

// The customer's line over the counter ("안녕하세요~ 당근 수프 2개 부탁드려도 될까요?"), tail
// toward them. Pops in each time a
// new customer steps up.
function OrderBubble({ order }: { order: DailyOrderView }) {
  const pop = useSharedValue(0);
  useEffect(() => {
    pop.value = withSequence(withTiming(0, { duration: 300 }), withTiming(1, { duration: 260, easing: Easing.out(Easing.back(1.6)) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: pop.value, transform: [{ scale: 0.7 + pop.value * 0.3 }] }));
  return (
    <Animated.View style={[styles.bubble, style]}>
      <NineSlice slice={shopKit.bubble} scale={0.32} />
      <Text style={styles.bubbleLine}>
        <HighlightDish line={order.line} dish={t(order.recipe.name)} />
      </Text>
      {/* What it pays, under the line. */}
      <CoinPrice amount={order.pay} textStyle={styles.bubblePay} style={styles.bubblePayRow} />
    </Animated.View>
  );
}

// The line with the dish's name picked out in its own colour.
function HighlightDish({ line, dish }: { line: string; dish: string }) {
  const at = line.indexOf(dish);
  if (at < 0) return <>{line}</>;
  return (
    <>
      {line.slice(0, at)}
      <Text style={styles.bubbleDish}>{dish}</Text>
      {line.slice(at + dish.length)}
    </>
  );
}

// One of today's orders in the queue under the counter: who, and what. Delivered ones go
// black-and-white with 완료.
function Ticket({ order, onPress }: { order: DailyOrderView; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={order.delivered}
      accessibilityRole="button"
      accessibilityLabel={t(`${order.customerName}: ${order.recipe.name} ${order.count}개`, `${order.customerName}: ${t(order.recipe.name)} x${order.count}`)}
      style={({ pressed }) => [styles.ticketWrap, pressed && styles.pressed]}
    >
      <View style={[styles.ticket, order.delivered && styles.ticketDone]}>
        {/* The customer stands low, cut off at the belly by the card's inner edge; a dark
            fade over the top lifts the dish and count out above them. */}
        <View style={styles.ticketWindow}>
          <Image source={order.customerImage} style={styles.ticketCustomer} />
          <LinearGradient colors={["rgba(240, 156, 72, 0.62)", "rgba(246, 176, 96, 0.32)", "rgba(246, 176, 96, 0)"]} locations={[0, 0.45, 1]} style={styles.ticketFade} pointerEvents="none" />
          <View style={styles.ticketDishRow}>
            <Image source={order.recipe.image} style={styles.ticketDish} />
            <Text style={styles.ticketCount}>×{order.count}</Text>
          </View>
        </View>
        {/* Gold frame over the window, so its rim covers where the picture is cut. */}
        <Image source={dailyImages.ticketFrame} style={styles.ticketFrame} />
        {order.delivered && (
          <View style={styles.ticketStamp} pointerEvents="none">
            <StrokedText style={styles.ticketStampText} strokeColor={colors.line} strokeWidth={2}>
              {t("완료", "Done")}
            </StrokedText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: PAGE, paddingHorizontal: PAGE_SIDE, paddingTop: PAGE_TOP },
  // Out to the screen's edges like the scene above, padded back in for its content.
  lower: { flexGrow: 1, marginHorizontal: -PAGE_SIDE, paddingHorizontal: PAGE_SIDE, paddingTop: 14, paddingBottom: 25, backgroundColor: DAILY_LOWER_COLOR, overflow: "hidden" },
  pattern: { position: "absolute", top: 0, left: 0 },
  // Pulled out past the page padding on every side but the bottom.
  scene: { height: SCENE_HEIGHT, marginHorizontal: -PAGE_SIDE, marginTop: -PAGE_TOP, overflow: "hidden" },
  bottomFade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 90 },
  headerBlend: { position: "absolute", top: 0, left: 0, right: 0 },
  header: { position: "absolute", top: 0, left: 0, right: 0 },
  // Everything below the header: laid out as before, just shifted down by its height.
  stage: { position: "absolute", left: 0, right: 0, height: SCENE_HEIGHT },
  topFade: { position: "absolute", top: 0, left: 0, right: 0 },
  topBar: { position: "absolute", top: PAGE_TOP, left: PAGE_SIDE, right: PAGE_SIDE },
  background: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  customer: { position: "absolute", width: CUSTOMER_WIDTH, height: CUSTOMER_HEIGHT },
  customerImage: { width: "100%", height: "100%", resizeMode: "contain" },
  counter: { position: "absolute", left: 0, bottom: COUNTER_LIFT },
  // Up in the faded top-right (the top bar has no gold chip here), above the centred
  // customer's head, its tail pointing down at them.
  bubble: { position: "absolute", top: PAGE_TOP + 30, right: 12, left: "50%", paddingLeft: 16, paddingRight: 12, paddingTop: 10, paddingBottom: 24 },
  bubbleDish: { color: "#c8553d", fontWeight: "900" },
  bubbleLine: { fontSize: 15, lineHeight: 20, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink },
  bubblePayRow: { marginTop: 3, alignSelf: "flex-end" },
  bubblePay: { fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: "#b0632a" },
  closedSign: { position: "absolute", top: 140, left: 0, right: 0, alignItems: "center" },
  closedPlank: { alignItems: "center", paddingHorizontal: 22, paddingTop: 10, paddingBottom: 13 },
  closedText: { fontSize: 17, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  closedSub: { marginTop: 2, fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: "#f6dcb0" },
  submit: { minHeight: 48 },
  submitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  submitText: { fontSize: 16, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  submitTextShort: { color: "#5e554a" },
  queue: { flexDirection: "row", gap: 8, marginBottom: 12 },
  ticketWrap: { flex: 1 },
  pressed: { transform: [{ scale: 0.95 }] },
  // Gold frame art (300x328, see assets): the window fills its opening right out under the
  // rim, so the dark fade and the customer reach the frame on every side.
  ticket: { aspectRatio: 300 / 328 },
  ticketWindow: { position: "absolute", left: "6%", right: "6%", top: "6%", bottom: "6%", borderRadius: 12, overflow: "hidden", alignItems: "center", backgroundColor: TICKET_FILL },
  ticketFrame: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", resizeMode: "stretch" },
  // A delivered order goes black-and-white (faded too, where filters aren't supported).
  ticketDone: { filter: "grayscale(1)", opacity: 0.7 },
  // Customer art is ~300x320; the bottom third (belly down) hangs below the card.
  ticketCustomer: { position: "absolute", bottom: -30, width: 86, height: 92, resizeMode: "contain" },
  ticketFade: { position: "absolute", top: 0, left: 0, right: 0, height: 58 },
  ticketDishRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 8 },
  ticketDish: { width: 34, height: 34, resizeMode: "contain" },
  ticketCount: { fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: "#8a3f12" },
  ticketStamp: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  ticketStampText: { fontSize: 18, fontWeight: "900", fontFamily: fonts.bold, color: "#ffe9a3" },
});
