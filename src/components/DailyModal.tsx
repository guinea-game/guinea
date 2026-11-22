import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { buttonKit, frameKit, kit, uiImages } from "../assets";
import { NineSlice, Panel } from "./NineSlice";
import { GameButton } from "./GameButton";
import { CoinPrice } from "./CoinPrice";
import { FlightLayer, launchFlight } from "./FlightLayer";
import { measureTarget, tutorialRef } from "./tutorialTargets";
import { useBumpOnChange, useRollingNumber } from "./motion";
import { formatGameNumber } from "../state/gameMath";
import { getDailyOrders } from "../state/daily";
import type { GameState } from "../types";
import { t } from "../i18n";

// 일일 의뢰: today's customers and their food orders. Each card shows who ordered, the dish
// and how many, how many are in the bag, and what it pays. 판매 hands them over for gold
// (coins fly up into the counter); short on dishes, the button heads to the kitchen instead.
export function DailyModal({
  state,
  priceStage,
  onClose,
  onDeliver,
  onGoCook,
}: {
  state: GameState;
  priceStage: number;
  onClose: () => void;
  onDeliver: (index: number) => void;
  onGoCook: () => void;
}) {
  const orders = getDailyOrders(state, priceStage);
  const shownGold = useRollingNumber(state.gold, 700);
  const { style: goldBump } = useBumpOnChange(state.gold);
  const [delivering, setDelivering] = useState<number | null>(null);

  const deliver = (index: number) => {
    if (delivering !== null) return;
    setDelivering(index);
    measureTarget(`daily-sell-${index}`).then((from) =>
      measureTarget("daily-gold").then((to) => {
        if (from && to) {
          for (let coin = 0; coin < 5; coin++) {
            launchFlight({ image: uiImages.coin, from, to, delay: coin * 70, size: 18, duration: 520, arc: 50 + coin * 6, channel: "daily" });
          }
        }
        setTimeout(() => {
          onDeliver(index);
          setDelivering(null);
        }, 450);
      }),
    );
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("닫기", "Close")} />
        <View style={styles.panel}>
          <NineSlice slice={kit.panelLarge} />
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.top}>
              <View style={styles.topCopy}>
                <Text style={styles.topEyebrow}>{t("매일 자정에 새 주문", "New orders every midnight")}</Text>
                <Text style={styles.topTitle}>{t("일일 의뢰", "Daily Orders")}</Text>
              </View>
              <View style={styles.topRight}>
                <Animated.View ref={tutorialRef("daily-gold")} style={[styles.goldCounter, goldBump]}>
                  <NineSlice slice={buttonKit.pillCream} scale={0.3} />
                  <Image source={uiImages.coin} style={styles.goldIcon} />
                  <Text style={styles.goldText}>{formatGameNumber(shownGold)}</Text>
                </Animated.View>
                <GameButton onPress={onClose} style={styles.closeButton}>{t("닫기", "Close")}</GameButton>
              </View>
            </View>

            {orders.length === 0 ? (
              <Panel slice={kit.panelParchment} scale={0.4} style={styles.empty}>
                <Text style={styles.emptyText}>{t("레시피를 배우면 손님들이 주문하러 와요!", "Learn a recipe and customers will come to order!")}</Text>
              </Panel>
            ) : (
              <View style={styles.list}>
                {orders.map((order) => {
                  const enough = order.have >= order.count;
                  return (
                    <Panel key={order.index} slice={kit.panel} scale={0.4} style={[styles.item, order.delivered && styles.itemDone]}>
                      <View style={styles.customer}>
                        <Image source={order.customerImage} style={styles.customerImage} />
                      </View>
                      <View style={styles.info}>
                        <Text style={styles.customerName}>{order.customerName}</Text>
                        <View style={styles.orderRow}>
                          <Panel slice={frameKit.squareWood} scale={0.4} style={styles.dishSlot}>
                            <Image source={order.recipe.image} style={styles.dishImage} resizeMode="contain" />
                          </Panel>
                          <View style={styles.orderCopy}>
                            <Text style={styles.dishName} numberOfLines={2}>
                              {t(order.recipe.name)} ×{order.count}
                            </Text>
                            <Text style={[styles.have, (enough || order.delivered) && styles.haveEnough]}>
                              {order.delivered
                                ? t("배달 완료!", "Delivered!")
                                : t(`보유 ${Math.min(order.have, order.count)}/${order.count}`, `Have ${Math.min(order.have, order.count)}/${order.count}`)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View ref={tutorialRef(`daily-sell-${order.index}`)} style={styles.action}>
                        {order.delivered ? (
                          <GameButton variant="gray" disabled style={styles.button} textStyle={styles.buttonText}>
                            {t("완료", "Done")}
                          </GameButton>
                        ) : enough ? (
                          <GameButton variant="green" onPress={() => deliver(order.index)} disabled={delivering !== null} style={styles.button}>
                            <View style={styles.buttonStack}>
                              <Text style={styles.buttonText}>{t("판매", "Sell")}</Text>
                              <CoinPrice amount={order.pay} textStyle={styles.payText} />
                            </View>
                          </GameButton>
                        ) : (
                          <GameButton variant="beige" onPress={onGoCook} style={styles.button}>
                            <View style={styles.buttonStack}>
                              <Text style={styles.cookText}>{t("요리하기", "Cook")}</Text>
                              <CoinPrice amount={order.pay} textStyle={styles.payTextDark} />
                            </View>
                          </GameButton>
                        )}
                      </View>
                    </Panel>
                  );
                })}
              </View>
            )}
          </ScrollView>
          <FlightLayer channel="daily" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, padding: 22, paddingHorizontal: 14, justifyContent: "center", backgroundColor: "#263024cf" },
  panel: { maxHeight: "90%", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  scroll: { flexGrow: 0 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  topCopy: { flexShrink: 1 },
  topEyebrow: { color: colors.green, fontWeight: "800", fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1 },
  topTitle: { fontSize: 24, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.5 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  closeButton: { paddingHorizontal: 12 },
  goldCounter: { height: 32, minWidth: 74, flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 8, paddingRight: 14, paddingBottom: 2 },
  goldIcon: { width: 18, height: 18, resizeMode: "contain" },
  goldText: { color: colors.ink, fontSize: 14, fontWeight: "900", fontFamily: fonts.bold },
  empty: { paddingHorizontal: 16, paddingVertical: 20 },
  emptyText: { fontFamily: fonts.light, letterSpacing: -0.42, fontSize: 14, lineHeight: 20, color: colors.brown, textAlign: "center" },
  list: { gap: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 8, paddingRight: 11, paddingTop: 9, paddingBottom: 11 },
  itemDone: { opacity: 0.6 },
  // Customer art is 307x320.
  customer: { width: 50, alignItems: "center" },
  customerImage: { width: 50, height: 52, resizeMode: "contain" },
  info: { flex: 1, gap: 4 },
  customerName: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.brown },
  orderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dishSlot: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  dishImage: { width: 26, height: 26 },
  orderCopy: { flex: 1 },
  dishName: { fontSize: 13, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  have: { fontSize: 12, fontWeight: "700", fontFamily: fonts.bold, color: colors.muted },
  haveEnough: { color: colors.green },
  action: { alignItems: "center" },
  button: { minWidth: 70, minHeight: 46, paddingHorizontal: 8 },
  buttonStack: { alignItems: "center" },
  buttonText: { fontSize: 13, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  cookText: { fontSize: 13, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  payText: { fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  payTextDark: { fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
});
