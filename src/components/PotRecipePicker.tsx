import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { kit } from "../assets";
import { GameButton } from "./GameButton";
import { Panel } from "./NineSlice";
import { ModalFrame } from "./ModalFrame";
import { formatPotDuration } from "./PotPanel";
import { getPotDurationMs, getPotIngredients, POT_BATCH_SIZE } from "../state/pot";
import { canCook, getItemQuantity, getKnownRecipes, ITEM_IMAGES, RECIPES } from "../state/recipes";
import type { GameState } from "../types";
import { t } from "../i18n";

// Opened from the pot's "+" slot: every known recipe, cookable-at-x10 ones first, each
// showing the 10x ingredient cost and how long that tier simmers for.
export function PotRecipePicker({
  inventory,
  knownRecipes,
  onQueue,
  onClose,
}: {
  inventory: GameState["inventory"];
  knownRecipes: string[] | undefined;
  onQueue: (recipeId: string) => void;
  onClose: () => void;
}) {
  const known = getKnownRecipes(knownRecipes);
  const recipes = RECIPES.filter((recipe) => known.includes(recipe.id))
    .map((recipe) => ({ recipe, ready: canCook(inventory, { ...recipe, ingredients: getPotIngredients(recipe) }) }))
    .sort((a, b) => Number(b.ready) - Number(a.ready));

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(event) => event.stopPropagation()}>
          <ModalFrame />
          <View style={styles.top}>
            <View>
              <Text style={styles.eyebrow}>COOKING POT</Text>
              <Text style={styles.title}>{t("냄비에 올리기", "Add to the Pot")}</Text>
            </View>
            <GameButton onPress={onClose} style={styles.closeButton}>{t("닫기", "Close")}</GameButton>
          </View>
          {recipes.length === 0 ? (
            <Panel slice={kit.inset} style={styles.empty}>
              <Text style={styles.emptyText}>{t("아는 레시피가 없어요.", "You don't know any recipes yet.")}</Text>
            </Panel>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {recipes.map(({ recipe, ready }) => {
                const ingredients = getPotIngredients(recipe);
                return (
                  <Panel slice={kit.panel} scale={0.4} style={styles.item} key={recipe.id}>
                    <Image source={recipe.image} style={[styles.dish, !ready && styles.dishShort]} />
                    <View style={styles.info}>
                      <Text style={styles.name} numberOfLines={1}>{t(recipe.name)}</Text>
                      <Text style={styles.meta}>
                        {t(`${POT_BATCH_SIZE}개 · ${formatPotDuration(getPotDurationMs(recipe.tier))}`, `${POT_BATCH_SIZE}x · ${formatPotDuration(getPotDurationMs(recipe.tier))}`)}
                      </Text>
                      <View style={styles.ingredientRow}>
                        {ingredients.map((ingredient) => (
                          <View style={styles.ingredient} key={ingredient.name}>
                            {ITEM_IMAGES[ingredient.name] !== undefined && <Image source={ITEM_IMAGES[ingredient.name]} style={styles.ingredientImage} />}
                            <Text style={[styles.ingredientText, getItemQuantity(inventory, ingredient.name) < ingredient.quantity && styles.ingredientShort]}>
                              {getItemQuantity(inventory, ingredient.name)}/{ingredient.quantity}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <GameButton
                      variant={ready ? "green" : "gray"}
                      disabled={!ready}
                      onPress={() => onQueue(recipe.id)}
                      style={styles.queueButton}
                      textStyle={styles.queueText}
                      accessibilityLabel={t(`${recipe.name} 냄비에 올리기`, `Add ${t(recipe.name)} to the pot`)}
                    >
                      {t("담기", "Add")}
                    </GameButton>
                  </Panel>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, paddingHorizontal: 14, justifyContent: "center", backgroundColor: "#263024cf" },
  panel: { maxHeight: "80%", width: "100%", maxWidth: 410, alignSelf: "center", paddingHorizontal: 34, paddingTop: 48, paddingBottom: 36 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  eyebrow: { color: colors.green, fontWeight: "800", fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5 },
  title: { fontSize: 24, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.5 },
  closeButton: { paddingHorizontal: 12 },
  empty: { alignItems: "center", paddingVertical: 20, paddingHorizontal: 14 },
  emptyText: { fontSize: 14, fontWeight: "800", fontFamily: fonts.bold, color: colors.brown },
  list: { flexGrow: 0 },
  listContent: { gap: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 11, paddingTop: 9, paddingBottom: 11 },
  dish: { width: 40, height: 40 },
  dishShort: { filter: "grayscale(1)", opacity: 0.6 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink },
  meta: { marginTop: 1, fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.green },
  ingredientRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 3 },
  ingredient: { flexDirection: "row", alignItems: "center", gap: 2 },
  ingredientImage: { width: 14, height: 14 },
  ingredientText: { fontSize: 11, fontWeight: "800", fontFamily: fonts.bold, color: colors.brown },
  ingredientShort: { color: colors.red },
  queueButton: { minWidth: 58 },
  queueText: { fontSize: 12 },
});
