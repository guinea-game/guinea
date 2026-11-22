import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { kit } from "../assets";
import { NineSlice, Panel } from "./NineSlice";
import { GameButton } from "./GameButton";
import { describeDish, describeDishLinks } from "../state/buffs";
import { MINIGAME_DIFFICULTY } from "../state/cookingMinigame";
import type { Recipe } from "../state/recipes";
import type { RecipeTier } from "../state/recipeTiers";
import { t } from "../i18n";

const DIFFICULTY_LABEL_EN: Record<RecipeTier, string> = { common: "Easy", rare: "Normal", epic: "Hard", legendary: "Very Hard", hidden: "Extreme" };
// Keyed by tier rather than looked up by the Korean label text — "보통" (Normal here)
// would otherwise collide with the cook-grade "보통" (Good) elsewhere in the dictionary.
const DIFFICULTY_LABEL_JA: Record<RecipeTier, string> = { common: "簡単", rare: "普通", epic: "難しい", legendary: "とても難しい", hidden: "極限" };
const DIFFICULTY_LABEL_ZH: Record<RecipeTier, string> = { common: "简单", rare: "普通", epic: "困难", legendary: "非常困难", hidden: "极限" };

// A recipe's details behind the "i" on its kitchen card: the story line, set and partner
// companion, how hard its minigame is, and how many are in the bag. The card itself keeps
// just the picture, name, effect and ingredients.
export function RecipeInfoModal({ recipe, owned, onClose }: { recipe: Recipe; owned: number; onClose: () => void }) {
  const tier = recipe.tier;
  const rows: { label: string; value: string }[] = [
    { label: t("효과", "Effect"), value: describeDish(recipe.id).split(" · ").join("\n") },
    ...describeDishLinks(recipe.id).map((part) => {
      const [label, ...rest] = part.split(": ");
      return { label, value: rest.join(": ") };
    }),
    {
      label: t("요리 난이도", "Cooking Difficulty"),
      value: t(MINIGAME_DIFFICULTY[tier].label, DIFFICULTY_LABEL_EN[tier], DIFFICULTY_LABEL_JA[tier], DIFFICULTY_LABEL_ZH[tier]),
    },
    { label: t("보유", "In Bag"), value: t(`${owned}개`, `${owned}`) },
  ];
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("닫기", "Close")} />
        <View style={styles.panel}>
          <NineSlice slice={kit.panelLarge} />
          <Image source={recipe.image} style={styles.dish} />
          <Text style={styles.name}>{t(recipe.name)}</Text>
          <Text style={styles.description}>{t(recipe.description)}</Text>
          <Panel slice={kit.panelParchment} scale={0.4} style={styles.details}>
            {rows.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </Panel>
          <GameButton variant="green" onPress={onClose} style={styles.close}>
            {t("닫기", "Close")}
          </GameButton>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, padding: 22, paddingHorizontal: 24, justifyContent: "center", backgroundColor: "#263024cf" },
  panel: { alignItems: "center", paddingHorizontal: 26, paddingTop: 26, paddingBottom: 26 },
  dish: { width: 84, height: 84 },
  name: { marginTop: 6, fontSize: 20, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink, textAlign: "center" },
  description: { marginTop: 4, fontFamily: fonts.light, letterSpacing: -0.42, fontSize: 14, lineHeight: 20, color: colors.brown, textAlign: "center" },
  details: { alignSelf: "stretch", marginTop: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 7 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  rowLabel: { width: 76, fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.muted },
  rowValue: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  close: { marginTop: 16, minWidth: 120 },
});
