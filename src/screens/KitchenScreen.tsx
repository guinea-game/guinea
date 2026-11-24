import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../components/GameText";
import { SearchBox } from "../components/SearchBox";
import { matchesSearch } from "../state/search";
import { colors, fonts } from "../theme";
import { chef, grandma, kit, kitImages } from "../assets";
import { CookingMinigame } from "../components/CookingMinigame";
import { SEALED_RECIPE } from "../state/recipeTiers";
import { describeDish, getDishCategories, type CookGrade, type DishCategory } from "../state/buffs";
import { RecipeInfoModal } from "../components/RecipeInfoModal";
import { BalancedRows, estimateTextWidth } from "../components/BalancedLines";
import { PageHeading } from "../components/PageHeading";
import { GameButton } from "../components/GameButton";
import { Panel } from "../components/NineSlice";
import { canCook, getItemQuantity, getKnownRecipes, ITEM_IMAGES, RECIPES } from "../state/recipes";
import { CoinPrice } from "../components/CoinPrice";
import { getShortfall } from "../state/grocery";
import type { GameState } from "../types";
import { t } from "../i18n";


const EFFECT_FONT = 12;
const INGREDIENT_FONT = 12;
const INGREDIENT_ICON = 16;


export function KitchenScreen({
  inventory,
  knownRecipes,
  cookSpeedPercent,
  gold,
  groceryDiscount,
  priceStage,
  onCook,
  onBuyAndCook,
  onCollect,
  guideRecipeId,
  onOpenGrocery,
  onOpenRecipes,
  recipesBadge = false,
}: {
  inventory: GameState["inventory"];
  knownRecipes: string[] | undefined;
  // Widens the cooking minigame's target zone — see state/cookingMinigame.ts's getZoneWidth.
  cookSpeedPercent: number;
  gold: number;
  // Food-buff % off grocery prices, for the "buy what's missing" cost.
  groceryDiscount: number;
  // The stage grocery prices are set by (see getGroceryPrice).
  priceStage: number;
  // Spends the recipe's ingredients immediately; the minigame opens right after.
  onCook: (recipeId: string) => "ok" | "unavailable";
  // Buys the missing ingredients from the grocery and starts the dish (see buyMissingAndCook).
  onBuyAndCook: (recipeId: string) => "ok" | "gold" | "unavailable";
  // Takes the dish out at the grade the minigame scored.
  onCollect: (recipeId: string, grade: CookGrade) => void;
  // During the recipe tutorial: the dish whose minigame gets the first-round guide arrow.
  guideRecipeId?: string;
  onOpenGrocery: () => void;
  onOpenRecipes: () => void;
  // A recipe went on sale that the shop hasn't been opened to see yet.
  recipesBadge?: boolean;
}) {
  const known = getKnownRecipes(knownRecipes);
  const startCooking = (recipe: (typeof RECIPES)[number], buyMissing = false) => {
    const result = buyMissing ? onBuyAndCook(recipe.id) : onCook(recipe.id);
    if (result === "ok") setCookingRecipeId(recipe.id);
  };
  // The recipe whose finishing minigame is up right now (null = none) — opens the instant
  // cooking starts, since there's no pot to leave a dish waiting in anymore.
  const [cookingRecipeId, setCookingRecipeId] = useState<string | null>(null);
  const cookingRecipe = cookingRecipeId ? RECIPES.find((recipe) => recipe.id === cookingRecipeId) : undefined;
  // What can be cooked right now floats to the top; otherwise recipe order is kept.
  const recipes = RECIPES.filter((recipe) => known.includes(recipe.id))
    .map((recipe) => ({ recipe, cookable: canCook(inventory, recipe) }))
    .sort((a, b) => Number(b.cookable) - Number(a.cookable))
    .map(({ recipe }) => recipe);
  const unlearned = RECIPES.length - recipes.length;
  // Search by dish name or any ingredient in it.
  const [query, setQuery] = useState("");
  // The recipe whose "!" details are open.
  const [infoRecipeId, setInfoRecipeId] = useState<string | null>(null);
  const infoRecipe = RECIPES.find((recipe) => recipe.id === infoRecipeId);
  // 전체 or one effect category. Typing a search looks through everything, whatever tab is on.
  const [category, setCategory] = useState<"all" | DishCategory>("all");
  const shown = recipes.filter((recipe) =>
    query.trim()
      ? matchesSearch(query, recipe.name, ...recipe.ingredients.map((ingredient) => ingredient.name))
      : category === "all" || getDishCategories(recipe.id).includes(category),
  );

  return (
    <View style={styles.page}>
      <View style={styles.headingRow}>
        <View style={styles.heading}>
          <PageHeading kicker="COOKING" title={t("기니의 부엌", "Gini's Kitchen")} description={t("재료를 모아 배고픈 기니에게 한 끼를.", "Gather ingredients and cook a meal for a hungry Gini.")} />
        </View>
        <View style={styles.shopButtons}>
          <GameButton variant="red" onPress={onOpenGrocery} accessibilityLabel={t("재료 상점 열기", "Open ingredient shop")} style={styles.shopButton}>
            <View style={styles.shopContent}>
              <Image source={grandma.basket} style={styles.shopImage} />
              <Text style={styles.shopText}>{t("재료", "Shop")}</Text>
            </View>
          </GameButton>
          <GameButton variant="pillCream" onPress={onOpenRecipes} tutorialId="kitchen-recipes" accessibilityLabel={t("레시피 상점 열기", "Open recipe shop")} style={styles.shopButton}>
            <View style={styles.shopContent}>
              <Image source={chef.spoon} style={styles.shopImage} />
              <Text style={[styles.shopText, styles.shopTextDark]}>{t("레시피", "Recipes")}</Text>
            </View>
            {recipesBadge && <Image source={kitImages.dotRed} style={styles.newDot} accessibilityLabel={t("새 레시피", "New recipe")} />}
          </GameButton>
        </View>
      </View>


      <View style={styles.toolbar}>
        <Text style={styles.toolbarText}>{t(`아는 레시피 ${recipes.length}개`, `${recipes.length} Known Recipes`)}</Text>
      </View>

      {/* Effect tabs, the same green/beige buttons as the bag's and skills' tabs. Scrolls
          sideways if they don't fit. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabs}>
        {CATEGORY_TABS.map((tab) => {
          const active = tab.id === category;
          return (
            <GameButton key={tab.id} variant={active ? "green" : "beige"} onPress={() => setCategory(tab.id)} style={styles.tab} textStyle={styles.tabText}>
              {t(tab.label, tab.labelEn)}
            </GameButton>
          );
        })}
      </ScrollView>
      <SearchBox value={query} onChange={setQuery} placeholder={t("요리나 재료 이름으로 찾기", "Search by dish or ingredient name")} resultCount={shown.length} />
      {shown.length === 0 && !query.trim() && (
        <Text style={styles.emptyTab}>{t("이 효과의 요리는 아직 배우지 않았어요.", "You haven't learned a dish with this effect yet.")}</Text>
      )}
      <View style={styles.grid}>
        {shown.map((recipe) => {
          const ready = canCook(inventory, recipe);
          // Bag room is checked when the dish comes out of the minigame, not when it goes in.
          const cookable = ready;
          const ingredientLabels = recipe.ingredients.map(
            (ingredient) => `${getItemQuantity(inventory, ingredient.name)}/${ingredient.quantity}`,
          );
          const ingredientChips = recipe.ingredients.map((ingredient, index) => (
            <View style={styles.ingredient} key={ingredient.name}>
              {ITEM_IMAGES[ingredient.name] !== undefined && (
                <Image source={ITEM_IMAGES[ingredient.name]} style={styles.ingredientImage} />
              )}
              <Text style={[styles.ingredientText, getItemQuantity(inventory, ingredient.name) < ingredient.quantity && styles.ingredientShort]}>
                {ingredientLabels[index]}
              </Text>
            </View>
          ));
          // Rows balanced by width, so a long list breaks into even lines instead of a
          // full line plus a straggler.
          const ingredients = (
            <BalancedRows
              items={ingredientChips}
              widths={ingredientLabels.map((label) => INGREDIENT_ICON + 2 + estimateTextWidth(label, INGREDIENT_FONT))}
              gap={6}
              align="center"
            />
          );
          // Short on ingredients the grocery sells: one button buys the rest and starts it.
          const shortfall = !ready ? getShortfall(inventory, recipe.ingredients, groceryDiscount, priceStage) : null;
          const affordable = shortfall !== null && gold >= shortfall.cost;
          const cookButton = shortfall ? (
            <GameButton
              variant={affordable ? "cream" : "gray"}
              disabled={!affordable}
              onPress={() => startCooking(recipe, true)}
              tutorialId={`cook-${recipe.id}`}
              accessibilityLabel={t(
                `부족한 재료를 ${shortfall.cost}골드에 사서 ${recipe.name} 요리하기`,
                `Buy missing ingredients for ${shortfall.cost} gold and cook ${t(recipe.name)}`,
              )}
              style={styles.gridCookButton}
            >
              <View style={styles.buyCook}>
                <Text style={[styles.cookButtonText, styles.buyCookText]}>{t("사서 요리", "Buy & Cook")}</Text>
                <CoinPrice amount={shortfall.cost} textStyle={[styles.buyCookCost, !affordable && styles.buyCookCostShort]} />
              </View>
            </GameButton>
          ) : (
            <GameButton
              variant={cookable ? "green" : "gray"}
              disabled={!cookable}
              onPress={() => startCooking(recipe)}
              tutorialId={`cook-${recipe.id}`}
              style={styles.gridCookButton}
              textStyle={styles.cookButtonText}
            >
              {!ready ? t("재료 부족", "Missing Ingredients") : t("요리하기", "Cook")}
            </GameButton>
          );
          // Just what eating it does; set, partner, difficulty and the rest sit behind the "i".
          const effectParts = describeDish(recipe.id).split(" · ");
          const infoButton = (
            <Pressable
              onPress={() => setInfoRecipeId(recipe.id)}
              accessibilityRole="button"
              accessibilityLabel={t(`${recipe.name} 상세 정보`, `${t(recipe.name)} details`)}
              hitSlop={8}
              style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
            >
              <View style={styles.infoRing}>
                <Text style={styles.infoText}>i</Text>
              </View>
            </Pressable>
          );
          // One effect per line, always — so a two-effect dish reads the same on every screen width.
          const effect = (
            <View style={styles.effectBox}>
              {effectParts.map((part) => (
                <Text key={part} style={styles.effect}>
                  {part}
                </Text>
              ))}
            </View>
          );

          return (
            <Panel slice={ready ? kit.panel : kit.inset} scale={0.4} style={styles.gridCard} key={recipe.id}>
              <Image source={recipe.image} style={[styles.gridDish, !ready && styles.dishShort]} />
              <Text style={styles.gridName} numberOfLines={1}>{t(recipe.name)}</Text>
              {effect}
              <View style={[styles.ingredients, styles.gridIngredients]}>{ingredients}</View>
              {cookButton}
              {infoButton}
            </Panel>
          );
        })}
        {unlearned > 0 && (
          <Panel slice={kit.inset} scale={0.4} style={styles.gridCard}>
            <Image source={SEALED_RECIPE} style={styles.gridDish} />
            <Text style={styles.gridName}>{t(`배울 레시피 ${unlearned}개`, `${unlearned} Recipes to Learn`)}</Text>
            <Text style={styles.gridDescription} numberOfLines={2}>{t("셰프 기니한테 새 요리를 배워 봐요.", "Learn new dishes from Chef Gini.")}</Text>
            <GameButton variant="red" onPress={onOpenRecipes} style={styles.gridCookButton} textStyle={styles.cookButtonText}>
              {t("배우러 가기", "Go Learn")}
            </GameButton>
          </Panel>
        )}
      </View>
      {infoRecipe && <RecipeInfoModal recipe={infoRecipe} owned={getItemQuantity(inventory, infoRecipe.name)} onClose={() => setInfoRecipeId(null)} />}
      {cookingRecipe && (
        <CookingMinigame
          recipe={cookingRecipe}
          cookSpeedPercent={cookSpeedPercent}
          guideActive={cookingRecipe.id === guideRecipeId}
          onFinish={(grade) => {
            onCollect(cookingRecipe.id, grade);
            setCookingRecipeId(null);
          }}
        />
      )}
    </View>
  );
}

const CATEGORY_TABS: { id: "all" | DishCategory; label: string; labelEn: string }[] = [
  { id: "all", label: "전체", labelEn: "All" },
  { id: "attack", label: "공격", labelEn: "Attack" },
  { id: "critical", label: "치명타", labelEn: "Crit" },
  { id: "speed", label: "속도", labelEn: "Speed" },
  { id: "gold", label: "골드", labelEn: "Gold" },
  { id: "drop", label: "재료", labelEn: "Drops" },
  { id: "cooking", label: "요리", labelEn: "Cooking" },
];

const styles = StyleSheet.create({
  tabScroll: { marginBottom: 10, marginHorizontal: -16 },
  tabs: { gap: 6, paddingHorizontal: 16, paddingBottom: 4 },
  tab: { minWidth: 58, minHeight: 38, paddingHorizontal: 10 },
  tabText: { fontSize: 13 },
  emptyTab: { marginTop: 4, marginBottom: 12, fontFamily: fonts.light, letterSpacing: -0.42, fontSize: 14, color: colors.brown, textAlign: "center" },
  page: { backgroundColor: "#e8dcc4", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 25 },
  headingRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  heading: { flex: 1 },
  shopButtons: { marginTop: 8, flexDirection: "row", gap: 5 },
  shopButton: { paddingLeft: 4, paddingRight: 12, minHeight: 40 },
  newDot: { position: "absolute", top: -3, right: -3, width: 13, height: 13 },
  shopContent: { flexDirection: "row", alignItems: "center", gap: 3 },
  // Pokes up out of the pill a little, like the shopkeeper is peeking over it.
  shopImage: { width: 34, height: 34, marginTop: -10 },
  shopText: { fontSize: 14, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  shopTextDark: { color: colors.brown },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18, paddingLeft: 4 },
  toolbarText: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.brown },
  pressed: { transform: [{ scale: 0.92 }] },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  gridCard: { width: "48.5%", alignItems: "center", paddingHorizontal: 10, paddingTop: 12, paddingBottom: 12 },
  gridDish: { width: 64, height: 64 },
  gridName: { marginTop: 4, fontSize: 14, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  gridDescription: { fontFamily: fonts.light, letterSpacing: -0.36, marginTop: 2, minHeight: 34, fontSize: 12, lineHeight: 16, color: colors.muted, textAlign: "center" },
  gridIngredients: { justifyContent: "center", marginBottom: 8 },
  // Pinned to the card's bottom: cards in a row stretch to the tallest, so the buttons line up.
  gridCookButton: { alignSelf: "stretch", marginTop: "auto" },
  // The "i" info button on each card's top-right corner: a soft ⓘ in the card's muted ink,
  // ringed so it reads as something to tap without shouting over the card.
  infoButton: { position: "absolute", top: 8, right: 9, zIndex: 1 },
  infoRing: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: "#b9a487", alignItems: "center", justifyContent: "center" },
  infoText: { fontSize: 12, lineHeight: 14, fontWeight: "900", fontFamily: fonts.bold, color: "#a48d6c" },
  effectBox: { marginTop: 3, alignItems: "center" },
  effect: { fontSize: EFFECT_FONT, lineHeight: 17, fontWeight: "900", fontFamily: fonts.bold, color: "#b0632a", textAlign: "center" },
  // Missing ingredients: the dish goes black-and-white (faded too, where filters aren't supported).
  dishShort: { filter: "grayscale(1)", opacity: 0.6 },
  ingredients: { marginTop: 5, alignSelf: "stretch" },
  ingredient: { flexDirection: "row", alignItems: "center", gap: 2 },
  ingredientImage: { width: INGREDIENT_ICON, height: INGREDIENT_ICON },
  ingredientText: { fontSize: INGREDIENT_FONT, fontWeight: "800", fontFamily: fonts.bold, color: colors.brown },
  ingredientShort: { color: colors.red },
  cookButtonText: { fontSize: 12 },
  buyCook: { alignItems: "center" },
  buyCookText: { fontWeight: "900", fontFamily: fonts.bold, color: colors.brown },
  buyCookCost: { fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  buyCookCostShort: { color: colors.red },
});
