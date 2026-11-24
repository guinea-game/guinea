import type { GameState, Outfit } from "../types";
import { npcImages } from "../assets";
import { getKnownRecipes, getItemQuantity, RECIPES, type Recipe } from "./recipes";
import { getGroceryPrice } from "./grocery";
import { OUTFIT_NAMES, shiftGrade } from "./buffs";
import { isOutfitUnlocked } from "./unlocks";
import { roundPrice } from "./gameMath";
import { t } from "../i18n";

// 일일 의뢰: customers come in with food orders each local day (reset at midnight). An order
// is "N of this dish"; cook them, hand them over, and get paid in gold. Orders are drawn from
// recipes the player already knows, so every one of them can actually be filled.

type Line = (dish: string, count: number) => string;

// Customers who place orders; each of a day's orders draws a different one at random.
// `line` is what they say at the counter, in their own voice.
export const CUSTOMERS: { id: string; name: string; image: number; line: Line }[] = [
  {
    id: "lady",
    name: "레이디기니",
    image: npcImages.customerLady,
    line: (dish, n) => t(`안녕하세요~ ${dish} ${n}개 부탁드려도 될까요?`, `Hello~ Could I please have ${n} ${t(dish)}?`),
  },
  {
    id: "farmer",
    name: "농부기니",
    image: npcImages.customerFarmer,
    line: (dish, n) => t(`밭일 끝! 배고파 죽겠어. ${dish} ${n}개 줘!`, `Done in the fields and starving! ${n} ${t(dish)}, please!`),
  },
  {
    id: "scholar",
    name: "학자기니",
    image: npcImages.customerScholar,
    line: (dish, n) => t(`연구엔 영양이 필수지. ${dish} ${n}개 부탁하네.`, `Research runs on good food. ${n} ${t(dish)}, if you would.`),
  },
  {
    id: "noble",
    name: "귀부인기니",
    image: npcImages.customerNoble,
    line: (dish, n) => t(`오호호, 오늘은 ${dish} ${n}개로 하겠어요.`, `Ohoho, today I'll have ${n} ${t(dish)}.`),
  },
  {
    id: "gentleman",
    name: "신사기니",
    image: npcImages.customerGentleman,
    line: (dish, n) => t(`흠흠, ${dish} ${n}개를 주문하고 싶네만.`, `Ahem. I should like to order ${n} ${t(dish)}.`),
  },
  {
    id: "auntie",
    name: "아주머니기니",
    image: npcImages.customerAuntie,
    line: (dish, n) => t(`우리 애들 먹이게 ${dish} ${n}개만 줘요~`, `${n} ${t(dish)} for my little ones, dear~`),
  },
  {
    id: "girl",
    name: "소녀기니",
    image: npcImages.customerGirl,
    line: (dish, n) => t(`꽃구경 가기 전에 ${dish} ${n}개 챙겨 갈래요!`, `${n} ${t(dish)} to take along on my flower walk!`),
  },
];

// Companions the player has met drop by now and then too — at most one a day, in place of
// one of the regular customers — and pay in gems instead of gold. The one out adventuring
// with the player (equipped) is busy, and 모험기니 is the player.
const COMPANION_LINES: Partial<Record<Outfit, Line>> = {
  explorerHamster: (dish, n) => t(`탐험 떠나기 전에 든든하게! ${dish} ${n}개 부탁해!`, `Fuel for the next expedition! ${n} ${t(dish)}, please!`),
  tetoGini: (dish, n) => t(`운동 끝! 단백질 보충이다. ${dish} ${n}개!`, `Workout done, time to refuel. ${n} ${t(dish)}!`),
  assassinGini: (dish, n) => t(`…조용히 ${dish} ${n}개. 아무한테도 말하지 마.`, `...${n} ${t(dish)}. Quietly. Tell no one.`),
  // 구미호 in disguise (egenGini was retconned into the stage-21 boss).
  egenGini: (dish, n) => t(`후후, ${dish} ${n}개 부탁해요. 꼬리는… 못 본 걸로 해줘요.`, `Hehe, ${n} ${t(dish)}, please. And the tails... you didn't see them.`),
  samuraiGini: (dish, n) => t(`${dish} ${n}개. …그거면 충분하다.`, `${n} ${t(dish)}. ...That will suffice.`),
  chefGini: (dish, n) => t(`다른 셰프 솜씨도 맛봐야지! ${dish} ${n}개 줘!`, `A chef should taste other chefs' work! ${n} ${t(dish)}!`),
  boxerGini: (dish, n) => t(`시합 전엔 든든하게! ${dish} ${n}개, 원투!`, `Gotta eat before the bout! ${n} ${t(dish)}, one-two!`),
  witchGini: (dish, n) => t(`마법약에 ${dish} ${n}개가 필요해. 히히.`, `My potion needs ${n} ${t(dish)}. Hehe.`),
  cowboyGini: (dish, n) => t(`먼 길 왔다구. ${dish} ${n}개 내줘, 파트너!`, `Long ride in. ${n} ${t(dish)}, partner!`),
};
const COMPANION_VISIT_CHANCE = 0.4;
const COMPANION_GEMS_MIN = 10;
const COMPANION_GEMS_MAX = 30;

function isCompanionCustomer(id: string): id is Outfit {
  return id in COMPANION_LINES;
}

const ORDERS_PER_DAY = 3;
const MAX_COUNT = 3;
// An order pays this share of what its ingredients cost at the grocery right now — about
// what hunting them paid (the grocery charges 1.5x that), so hunted ingredients earn their
// gold a second time, but buying them just to fill orders always loses a little.
const PAY_MULTIPLIER = 0.6;

// `gems` is set on a companion's order: it pays that many gems instead of gold.
export type DailyOrder = { recipeId: string; count: number; customer: string; gems?: number };
type Daily = NonNullable<GameState["daily"]>;

// Small seeded RNG so a day's orders are fixed once drawn (and differ per save via runSeed).
function seeded(seed: number) {
  // Scrambled first, so nearby seeds (the same day string on close saves) don't start alike.
  let value = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0 || 1;
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
  // A different customer for each order, so one day's orders don't all come from one face.
  const customers: string[] = CUSTOMERS.map((item) => item.id);
  const orders: DailyOrder[] = [];
  while (orders.length < ORDERS_PER_DAY && pool.length > 0) {
    const [recipeId] = pool.splice(Math.floor(random() * pool.length), 1);
    const [customer] = customers.splice(Math.floor(random() * customers.length), 1);
    orders.push({ recipeId, count: 1 + Math.floor(random() * MAX_COUNT), customer });
  }
  const highest = state.highestStageNumber ?? state.stageNumber;
  const companions = (Object.keys(COMPANION_LINES) as Outfit[]).filter(
    (outfit) => outfit !== state.equippedOutfit && isOutfitUnlocked(outfit, highest, state.purchasedOutfits),
  );
  if (orders.length > 0 && companions.length > 0 && random() < COMPANION_VISIT_CHANCE) {
    const slot = Math.floor(random() * orders.length);
    const customer = companions[Math.floor(random() * companions.length)];
    const gems = COMPANION_GEMS_MIN + Math.floor(random() * (COMPANION_GEMS_MAX - COMPANION_GEMS_MIN + 1));
    orders[slot] = { ...orders[slot], customer, gems };
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
  // A regular's portrait, or — for a visiting companion — their outfit (drawn as its sprite).
  customerImage: number | null;
  companion: Outfit | null;
  // What the customer says at the counter (names the dish and count).
  line: string;
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
    const companionLine = isCompanionCustomer(order.customer) ? COMPANION_LINES[order.customer] : undefined;
    const companion = companionLine ? (order.customer as Outfit) : null;
    const customer = CUSTOMERS.find((item) => item.id === order.customer) ?? CUSTOMERS[0];
    return [
      {
        ...order,
        index,
        recipe,
        customerName: t(companion ? OUTFIT_NAMES[companion] : customer.name),
        customerImage: companion ? null : customer.image,
        companion,
        line: (companionLine ?? customer.line)(recipe.name, order.count),
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

// Hands an order's dishes over (oldest-cooked first, like eating does) and pays for them —
// in gold, or in gems for a companion.
export function deliverOrder(state: GameState, index: number, priceStage: number): GameState {
  const order = getDailyOrders(state, priceStage).find((item) => item.index === index);
  if (!state.daily || !order || order.delivered || order.have < order.count) return state;
  let dishQuality = state.dishQuality;
  for (let unit = 0; unit < order.count; unit++) dishQuality = shiftGrade(dishQuality, order.recipeId);
  const gems = order.companion ? (order.gems ?? COMPANION_GEMS_MIN) : 0;
  const gold = order.companion ? 0 : order.pay;
  return {
    ...state,
    inventory: state.inventory
      .map((item) => (item.name === order.recipe.name ? { ...item, quantity: item.quantity - order.count } : item))
      .filter((item) => item.quantity > 0),
    dishQuality,
    gold: state.gold + gold,
    gems: state.gems + gems,
    totalGoldEarned: state.totalGoldEarned + gold,
    daily: { ...state.daily, delivered: [...state.daily.delivered, index] },
  };
}
