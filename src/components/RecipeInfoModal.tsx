import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { kit } from "../assets";
import { Panel } from "./NineSlice";
import { ModalFrame } from "./ModalFrame";
import { GameButton } from "./GameButton";
import { describeDish, describeDishLinks } from "../state/buffs";
import { MINIGAME_DIFFICULTY } from "../state/cookingMinigame";
import { ITEM_IMAGES, type Recipe } from "../state/recipes";
import { getDropSources } from "../state/drops";
import { getStageCode, STAGES } from "../state/stages";
import type { RecipeTier } from "../state/recipeTiers";
import { t } from "../i18n";

const DIFFICULTY_LABEL_EN: Record<RecipeTier, string> = { common: "Easy", rare: "Normal", epic: "Hard", legendary: "Very Hard", hidden: "Extreme" };
// Keyed by tier rather than looked up by the Korean label text — "보통" (Normal here)
// would otherwise collide with the cook-grade "보통" (Good) elsewhere in the dictionary.
const DIFFICULTY_LABEL_JA: Record<RecipeTier, string> = { common: "簡単", rare: "普通", epic: "難しい", legendary: "とても難しい", hidden: "極限" };
const DIFFICULTY_LABEL_ZH: Record<RecipeTier, string> = { common: "简单", rare: "普通", epic: "困难", legendary: "非常困难", hidden: "极限" };

// Where an ingredient comes from: the earliest stage that drops it ("3 거대 채소 농장", plus
// "보스" when only that stage's boss has it), or the grocer for the shop-only ones.
function ingredientSource(name: string) {
  const sources = getDropSources(name).map((source) => ({ ...source, stage: STAGES.findIndex((stage) => stage.enemyKind === source.kind) }));
  if (sources.length === 0) return t("식료품점", "Grocery");
  const first = Math.min(...sources.map((source) => source.stage));
  const bossOnly = sources.filter((source) => source.stage === first).every((source) => source.boss);
  return `${getStageCode(first)} ${t(STAGES[first].area)}${bossOnly ? ` ${t("보스", "Boss")}` : ""}`;
}

// A recipe's details behind the "i" on its kitchen card: the story line, set, how hard its
// minigame is, and its ingredients with where they come from. (How many are in the bag sits
// on the card itself, top-left.)
export function RecipeInfoModal({
  recipe,
  onClose,
  onOpenIngredient,
}: {
  recipe: Recipe;
  onClose: () => void;
  // Tapping an ingredient closes this modal and jumps to the ingredient codex, searched down to it.
  onOpenIngredient: (name: string) => void;
}) {
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
  ];
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("닫기", "Close")} />
        <View style={styles.panel}>
          <ModalFrame />
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
            {/* What goes in: each ingredient's icon and the stage it drops in. */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t("재료", "Ingredients")}</Text>
              <View style={styles.ingredients}>
                {recipe.ingredients.map((ingredient) => (
                  <Pressable
                    key={ingredient.name}
                    style={({ pressed }) => [styles.ingredient, pressed && styles.pressed]}
                    onPress={() => onOpenIngredient(ingredient.name)}
                    accessibilityRole="button"
                    accessibilityLabel={t(`${ingredient.name} 도감 보기`, `View ${t(ingredient.name)} in the codex`)}
                    hitSlop={4}
                  >
                    <Image source={ITEM_IMAGES[ingredient.name]} style={styles.ingredientIcon} resizeMode="contain" />
                    <View style={styles.ingredientText}>
                      <Text style={styles.ingredientName} numberOfLines={1}>
                        {t(ingredient.name)}
                      </Text>
                      <Text style={styles.ingredientSource} numberOfLines={1}>
                        {ingredientSource(ingredient.name)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
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
  panel: { alignItems: "center", paddingHorizontal: 34, paddingTop: 48, paddingBottom: 36 },
  dish: { width: 84, height: 84 },
  name: { marginTop: 6, fontSize: 20, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink, textAlign: "center" },
  description: { marginTop: 4, fontFamily: fonts.light, letterSpacing: -0.42, fontSize: 14, lineHeight: 20, color: colors.brown, textAlign: "center" },
  details: { alignSelf: "stretch", marginTop: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 7 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  rowLabel: { width: 76, fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.muted },
  rowValue: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  ingredients: { flex: 1, gap: 6 },
  ingredient: { flexDirection: "row", alignItems: "center", gap: 6 },
  pressed: { opacity: 0.6 },
  ingredientIcon: { width: 28, height: 28 },
  ingredientText: { flex: 1 },
  ingredientName: { fontSize: 13, lineHeight: 17, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  ingredientSource: { fontSize: 12, lineHeight: 16, fontFamily: fonts.light, color: colors.brown },
  close: { marginTop: 16, minWidth: 120 },
});
