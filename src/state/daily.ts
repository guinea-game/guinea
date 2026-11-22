import type { GameState } from "../types";
import { npcImages } from "../assets";
import { getKnownRecipes, getItemQuantity, RECIPES, type Recipe } from "./recipes";
import { getGroceryPrice } from "./grocery";
import { shiftGrade } from "./buffs";
import { roundPrice } from "./gameMath";
import { t } from "../i18n";

// 일일 의뢰: customers come in with food orders each local day (reset at midnight). An order
// is "N of this dish"; cook them, hand them over, and get paid in gold. Orders are drawn from
// recipes the player already knows, so every one of them can actually be filled.

// Customers who place orders. Only one has art so far — more join as their pictures are made.
export const CUSTOMERS = [{ id: "lady", name: "레이디기니", image: npcImages.customerLady }] as const;

const ORDERS_PER_DAY = 3;
const MAX_COUNT = 3;
// An order pays this share of what its ingredients cost at the grocery right now — about
// what hunting them paid (the grocery charges 1.5x that), so hunted ingredients earn their
// gold a second time, but buying them just to fill orders always loses a little.
const PAY_MULTIPLIER = 0.6;

export type DailyOrder = { recipeId: string; count: number; customer: string };
type Daily = NonNullable<GameState["daily"]>;

// Small seeded RNG so a day's orders are fixed once drawn (and differ per save via runSeed).
function seeded(seed: number) {
  let value = seed >>> 0 || 1;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
}

function hashDay(day: string, salt: number) {
  let hash = salt | 0;
  for (const char of day) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  return hash;
}

// Today's orders: up to ORDERS_PER_DAY different known dishes, 1–MAX_COUNT of each.
export function startDaily(state: GameState, day: string): Daily {
  const random = seeded(hashDay(day, state.runSeed ?? 7));
  const pool = getKnownRecipes(state.knownRecipes).filter((id) => RECIPES.some((recipe) => recipe.id === id));
  const orders: DailyOrder[] = [];
  while (orders.length < ORDERS_PER_DAY && pool.length > 0) {
    const [recipeId] = pool.splice(Math.floor(random() * pool.length), 1);
    const customer = CUSTOMERS[Math.floor(random() * CUSTOMERS.length)].id;
    orders.push({ recipeId, count: 1 + Math.floor(random() * MAX_COUNT), customer });
  }
  return { day, orders, delivered: [] };
}

// A save from before orders existed, a new day, or a day that started with no recipes known
// (a fresh player) and has since learned one — all get a fresh set.
export function needsNewDaily(state: GameState, day: string) {
  const daily = state.daily;
  if (!daily || daily.day !== day || !Array.isArray(daily.orders)) return true;
  return daily.orders.length === 0 && getKnownRecipes(state.knownRecipes).length > 0;
}

export function getOrderPay(recipe: Recipe, count: number, priceStage: number) {
  const ingredients = recipe.ingredients.reduce((sum, item) => sum + getGroceryPrice(item.name, priceStage) * item.quantity, 0);
  return roundPrice(ingredients * count * PAY_MULTIPLIER);
}

export type DailyOrderView = DailyOrder & {
  index: number;
  recipe: Recipe;
  customerName: string;
  customerImage: number;
  have: number;
  pay: number;
  delivered: boolean;
};

export function getDailyOrders(state: GameState, priceStage: number): DailyOrderView[] {
  const daily = state.daily;
  if (!daily || !Array.isArray(daily.orders)) return [];
  return daily.orders.flatMap((order, index) => {
    const recipe = RECIPES.find((item) => item.id === order.recipeId);
    if (!recipe) return [];
    const customer = CUSTOMERS.find((item) => item.id === order.customer) ?? CUSTOMERS[0];
    return [
      {
        ...order,
        index,
        recipe,
        customerName: t(customer.name),
        customerImage: customer.image,
        have: getItemQuantity(state.inventory, recipe.name),
        pay: getOrderPay(recipe, order.count, priceStage),
        delivered: daily.delivered.includes(index),
      },
    ];
  });
}

// Every order handed over — the menu icon drops its "!" until tomorrow's customers come.
export function isDailyAllDone(state: GameState) {
  const daily = state.daily;
  if (!daily || !Array.isArray(daily.orders)) return false;
  return daily.orders.every((_, index) => daily.delivered.includes(index));
}

// Hands an order's dishes over (oldest-cooked first, like eating does) and pays for them.
export function deliverOrder(state: GameState, index: number, priceStage: number): GameState {
  const order = getDailyOrders(state, priceStage).find((item) => item.index === index);
  if (!state.daily || !order || order.delivered || order.have < order.count) return state;
  let dishQuality = state.dishQuality;
  for (let unit = 0; unit < order.count; unit++) dishQuality = shiftGrade(dishQuality, order.recipeId);
  return {
    ...state,
    inventory: state.inventory
      .map((item) => (item.name === order.recipe.name ? { ...item, quantity: item.quantity - order.count } : item))
      .filter((item) => item.quantity > 0),
    dishQuality,
    gold: state.gold + order.pay,
    totalGoldEarned: state.totalGoldEarned + order.pay,
    daily: { ...state.daily, delivered: [...state.daily.delivered, index] },
  };
}
