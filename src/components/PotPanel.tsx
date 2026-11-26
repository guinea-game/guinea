import { Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { food, kit, uiImages } from "../assets";
import { GameButton } from "./GameButton";
import { Panel } from "./NineSlice";
import { ProgressBar } from "./ProgressBar";
import { formatGameNumber } from "../state/gameMath";
import { getPotDurationMs, getPotRushCost, POT_BATCH_SIZE, POT_QUEUE_SIZE, type PotJob } from "../state/pot";
import { RECIPES } from "../state/recipes";
import { t } from "../i18n";

export function formatPotCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPotDuration(ms: number) {
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return t(`${m}분`, `${m}m`);
  if (m === 0) return t(`${h}시간`, `${h}h`);
  return t(`${h}시간 ${m}분`, `${h}h ${m}m`);
}

// The kitchen page's top panel: a fixed 3-slot queue (POT_QUEUE_SIZE) that turns a known
// recipe's ingredients x10 into 10 finished dishes on its own, over a tier-based stretch of
// real time — no minigame, unlike the per-dish cook below it. Slot 0 is whichever job is
// actually simmering; slots behind it just wait their turn (see state/pot.ts).
export function PotPanel({
  queue,
  now,
  gems,
  onAdd,
  onCollect,
  onRush,
}: {
  queue: PotJob[];
  now: number;
  gems: number;
  onAdd: () => void;
  onCollect: () => void;
  onRush: () => void;
}) {
  const slots = Array.from({ length: POT_QUEUE_SIZE }, (_, index) => queue[index]);
  return (
    <Panel slice={kit.panel} scale={0.4} style={styles.panel}>
      <View style={styles.head}>
        <Image source={food.cookPot} style={styles.headIcon} />
        <View style={styles.headText}>
          <Text style={styles.headTitle}>{t("냄비", "Stew Pot")}</Text>
          <Text style={styles.headHint}>{t(`한 번에 ${POT_BATCH_SIZE}개씩 끓여요`, `Simmers ${POT_BATCH_SIZE} dishes at once`)}</Text>
        </View>
      </View>
      <View style={styles.slots}>
        {slots.map((job, index) => {
          const recipe = job ? RECIPES.find((item) => item.id === job.recipeId) : undefined;
          if (!job || !recipe) {
            return (
              <Pressable
                key={index}
                onPress={onAdd}
                accessibilityRole="button"
                accessibilityLabel={t("냄비에 요리 올리기", "Add a dish to the pot")}
                style={({ pressed }) => [styles.slot, styles.addSlot, pressed && styles.pressed]}
              >
                <Text style={styles.addPlus}>+</Text>
                <Text style={styles.addLabel}>{t("추가", "Add")}</Text>
              </Pressable>
            );
          }
          const active = job.readyAt !== undefined;
          if (!active) {
            return (
              <View key={index} style={styles.slot}>
                <Image source={recipe.image} style={[styles.dish, styles.dishWaiting]} />
                <Text style={styles.dishName} numberOfLines={1}>{t(recipe.name)}</Text>
                <Text style={styles.waitingLabel}>{t("대기 중", "Waiting")}</Text>
              </View>
            );
          }
          const ready = job.readyAt! <= now;
          const total = getPotDurationMs(recipe.tier);
          const progress = ready ? 100 : Math.min(100, ((now - job.startedAt!) / total) * 100);
          const rushCost = ready ? 0 : getPotRushCost(job, now);
          const canRush = gems >= rushCost;
          return (
            <View key={index} style={styles.slot}>
              <Image source={recipe.image} style={styles.dish} />
              <Text style={styles.dishName} numberOfLines={1}>{t(recipe.name)}</Text>
              <ProgressBar progress={progress} fill={ready ? "green" : "gold"} height={10} style={styles.bar} label={ready ? t("완료!", "Done!") : formatPotCountdown(job.readyAt! - now)} />
              {ready ? (
                <GameButton variant="green" onPress={onCollect} style={styles.actionButton} textStyle={styles.actionText}>
                  {t("수령", "Collect")}
                </GameButton>
              ) : (
                <GameButton
                  variant={canRush ? "pillCream" : "gray"}
                  disabled={!canRush}
                  onPress={onRush}
                  style={styles.actionButton}
                  accessibilityLabel={t(`보석 ${rushCost}개로 즉시 완료`, `Finish instantly for ${rushCost} gems`)}
                >
                  <View style={styles.rushRow}>
                    <Image source={uiImages.crystal} style={styles.rushGem} />
                    <Text style={[styles.rushText, !canRush && styles.rushTextShort]}>{formatGameNumber(rushCost)}</Text>
                  </View>
                </GameButton>
              )}
            </View>
          );
        })}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { marginBottom: 16, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  headIcon: { width: 34, height: 34 },
  headText: { flex: 1 },
  headTitle: { fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  headHint: { fontFamily: fonts.light, letterSpacing: -0.33, fontSize: 11, color: colors.muted },
  slots: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  slot: { flex: 1, alignItems: "center", paddingTop: 8, paddingBottom: 8, paddingHorizontal: 4, borderRadius: 10, backgroundColor: "#f0e6cf" },
  addSlot: { justifyContent: "center", minHeight: 92, borderWidth: 2, borderColor: "#c9b48e", borderStyle: "dashed", backgroundColor: "transparent" },
  pressed: { transform: [{ scale: 0.95 }] },
  addPlus: { fontSize: 24, fontWeight: "900", fontFamily: fonts.bold, color: colors.muted, lineHeight: 26 },
  addLabel: { marginTop: 2, fontSize: 11, fontWeight: "800", fontFamily: fonts.bold, color: colors.muted },
  dish: { width: 36, height: 36 },
  dishWaiting: { opacity: 0.55 },
  dishName: { marginTop: 2, fontSize: 11, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink, maxWidth: "100%" },
  waitingLabel: { marginTop: 4, fontSize: 11, fontWeight: "800", fontFamily: fonts.bold, color: colors.muted },
  bar: { alignSelf: "stretch", marginTop: 5, marginBottom: 6 },
  actionButton: { minHeight: 30, paddingHorizontal: 8, alignSelf: "stretch" },
  actionText: { fontSize: 12 },
  rushRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  rushGem: { width: 14, height: 14, resizeMode: "contain" },
  rushText: { fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  rushTextShort: { color: "#9f927e" },
});
