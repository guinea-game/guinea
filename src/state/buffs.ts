import type { Outfit } from "../types";
import { RECIPES } from "./recipes";
import type { RecipeTier } from "./recipeTiers";
import { t } from "../i18n";

// Food buffs: eating a cooked dish into a battle slot grants its effect for a while.

export type BuffEffect = {
  attack?: number; // % more attack (negative = less)
  criticalChance?: number; // percentage points (negative can switch crits off)
  criticalDamage?: number; // percentage points
  gold?: number; // percentage points of gold bonus
  attackSpeed?: number; // % faster auto-battle pace
  bossDamage?: number; // % more damage dealt to bosses
  exp?: number; // % more exp per kill
  extraHit?: number; // % chance a swing lands one more strike
  missReduction?: number; // points off a companion's miss chance
  skillCooldown?: number; // seconds off every skill cooldown
  execute?: number; // points added to Execute's HP threshold (only with Execute equipped)
  dropRate?: number; // % more likely, every ingredient drop
  dropDouble?: number; // % chance a dropped ingredient comes in twos
  vegetableDrop?: number; // % more likely, vegetables only
  seafoodDrop?: number; // % more likely, seafood only
  bossDropSure?: number; // > 0: every boss drop is guaranteed
  cookSpeed?: number; // % wider cooking minigame target zone
  greatSuccess?: number; // % chance a collected dish comes out as two
  ingredientSave?: number; // % chance, per ingredient, to use one less when cooking
  groceryDiscount?: number; // % off grandma's grocery
  offlineGold?: number; // % more offline gold, if running when the app closes
  offlineBuffs?: number; // > 0: food buffs keep working through offline progress
  skillReset?: number; // > 0: eating it makes the equipped skill ready at once
};

export type BuffSlot = { recipeId: string; expiresAt: number; durationMs: number } | null;

export const BUFF_SLOT_COUNT = 3;

// Only the first food slot is open from the start; the others are bought with gems.
// Index = slot index (slot 0 is free).
export const BUFF_SLOT_PRICES = [0, 500, 1000];

const MINUTE = 60_000;

// How long a dish lasts no longer depends on its tier — it depends on how well the cooking
// minigame went (src/state/cookingMinigame.ts): 대성공/보통/망함. See CookGrade/
// GRADE_DURATION_MS below, which replaced the old tier-fixed BUFF_DURATION_MS.

// Effects are sized to a per-tier budget — common ~12, rare ~25, epic ~40, legendary ~95,
// hidden ~130 points. Per point: 1% attack, attack speed or extra-hit chance; 1 point of
// crit chance; 0.3% crit damage; 0.6% gold; 0.5% boss damage, exp or miss reduction;
// 2 points of execute; 0.4% drop rate; 0.6% double drops; 0.25% category drops; 0.3s skill
// cooldown; 0.3% wider minigame target zone (cookSpeed); 0.8% great success; 0.5% ingredient
// save; 0.4% grocery discount; 0.3% offline gold; ~10–15 for each on/off perk.
// Within a tier, dishes that unlock on later stages sit at the top of the budget.
const EFFECTS: Record<string, { effect: BuffEffect; tint: string }> = {
  "green-jelly": { effect: { attack: 10 }, tint: "#bfe08a" },
  "slime-potion": { effect: { attackSpeed: 12 }, tint: "#c9e39a" },
  "royal-jelly": { effect: { dropDouble: 15, attack: 5 }, tint: "#fbd56e" },
  "carrot-soup": { effect: { criticalDamage: 25, exp: 10 }, tint: "#9ebdba" },
  "fried-egg": { effect: { criticalChance: 8, groceryDiscount: 20 }, tint: "#dfc1a6" },
  "chopped-salad": { effect: { dropRate: 20, gold: 8 }, tint: "#e0ab7b" },
  "veggie-stew": { effect: { vegetableDrop: 40, attack: 15 }, tint: "#f8a37e" },
  pudding: { effect: { exp: 30, criticalDamage: 30 }, tint: "#efcf9d" },
  // rushDiscount's old 6-point share (30 × 0.2) folded into cookSpeed (30 → 50) when rushing
  // went away with the pot system — same 25-point rare budget either way.
  "mushroom-soup": { effect: { cookSpeed: 50, attack: 10 }, tint: "#efc598" },
  "pumpkin-roast": { effect: { gold: 30, offlineGold: 25 }, tint: "#f8b37c" },
  "chicken-grill": { effect: { bossDamage: 40, attack: 5 }, tint: "#f3c27a" },
  "pork-belly": { effect: {}, tint: "#f0a98f" },
  "salmon-sashimi": { effect: { seafoodDrop: 60, criticalDamage: 80 }, tint: "#f9b48a" },
  "shrimp-sashimi": { effect: { gold: 45, greatSuccess: 15 }, tint: "#f8c1a8" },
  "mussel-seaweed-soup": { effect: { offlineBuffs: 1, offlineGold: 50, gold: 25 }, tint: "#c9d69a" },
  "tuna-sashimi": { effect: { attack: 30, criticalChance: 10 }, tint: "#e98f8f" },
  steak: { effect: { bossDamage: 50, attack: 15 }, tint: "#d69f7c" },
  octopus: { effect: { extraHit: 25, criticalChance: 10, attack: 5 }, tint: "#f2c4c8" },
  "potato-pancake": { effect: { ingredientSave: 30, gold: 40 }, tint: "#fdd785" },
  "banana-milk": { effect: { attackSpeed: 25, criticalChance: 15 }, tint: "#fce6a0" },
  yukhoe: { effect: { execute: 10, attack: 20 }, tint: "#e79a8c" },
  "salmon-steak": { effect: { criticalDamage: 100, missReduction: 20 }, tint: "#fbb989" },
  "lamb-rib": { effect: { skillReset: 1, skillCooldown: 30, attack: 25 }, tint: "#d98b6a" },
  // All in on raw power: no crits at all while it runs.
  "fire-skewer": { effect: { attack: 90, criticalChance: -100 }, tint: "#f27b5b" },
  "seafood-boil": { effect: { bossDropSure: 1, seafoodDrop: 50, attack: 50, gold: 30 }, tint: "#faa880" },
  "bamboo-dumpling": { effect: { cookSpeed: 40, attack: 20 }, tint: "#e9e2b0" },
  "persimmon-roll": { effect: { gold: 40, offlineGold: 30 }, tint: "#f2a65a" },
  "haemul-pajeon": { effect: { extraHit: 20, attack: 30, dropRate: 20 }, tint: "#e8c27a" },
  "azalea-hwajeon": { effect: { skillCooldown: 30, exp: 30 }, tint: "#f0a6c8" },
  "tteokbokki": { effect: { attackSpeed: 30, criticalChance: 10 }, tint: "#e8604a" },
  "braised-mackerel": { effect: { seafoodDrop: 60, bossDamage: 40 }, tint: "#c97a5a" },
  "squid-ink-risotto": { effect: { criticalDamage: 120, criticalChance: 10 }, tint: "#6a6a7a" },
  "sakura-mochi": { effect: { greatSuccess: 20, gold: 40 }, tint: "#f7c6d4" },
  "inari-sushi": { effect: { execute: 12, attack: 30 }, tint: "#e3a95a" },
  "yuzu-sherbet": { effect: { offlineBuffs: 1, offlineGold: 60 }, tint: "#f6d76a" },
  "abalone-porridge": { effect: { exp: 50, attack: 40 }, tint: "#cfd6b8" },
  "dragon-feast": { effect: { bossDropSure: 1, attack: 80, gold: 60, dropDouble: 25 }, tint: "#f3c36a" },
  "curry-rice": { effect: { attack: 60, bossDamage: 50 }, tint: "#f0a030" },
  "masala-chai": { effect: { attackSpeed: 25, exp: 50, criticalDamage: 60 }, tint: "#d49a5c" },
  "mughal-biryani": { effect: { gold: 70, criticalChance: 10, dropDouble: 20 }, tint: "#f2c14e" },
  "tom-yum-goong": { effect: { attack: 50, criticalDamage: 80, seafoodDrop: 25 }, tint: "#e8743b" },
  "nasi-goreng": { effect: { gold: 80, attackSpeed: 30, criticalChance: 8 }, tint: "#9a5a2e" },
  "poke-bowl": { effect: { attack: 45, exp: 40, dropRate: 20 }, tint: "#f2b84b" },
  "pecan-bbq-ribs": { effect: { attack: 55, bossDamage: 40, criticalChance: 6 }, tint: "#8f3b1e" },
  "street-tacos": { effect: { attack: 40, gold: 60, extraHit: 15 }, tint: "#e9a23b" },
  "choco-banana": { effect: { criticalDamage: 120, criticalChance: 10, greatSuccess: 20 }, tint: "#6b3a22" },
  "chilean-empanada": { effect: { attack: 50, gold: 50, exp: 30 }, tint: "#c8893e" },
  "golden-sun-soup": { effect: { attack: 70, gold: 70, criticalDamage: 80, bossDamage: 30 }, tint: "#f5c542" },
  "barley-tea": { effect: { exp: 8, attackSpeed: 5 }, tint: "#e2b98a" },
  "mango-smoothie": { effect: { attackSpeed: 15, gold: 12 }, tint: "#fcd36a" },
  "grilled-sardine": { effect: { seafoodDrop: 25, criticalChance: 5 }, tint: "#c9d4dc" },
  "spicy-oyster": { effect: { criticalChance: 12, attack: 12 }, tint: "#f0a58c" },
  "five-grain-rice": { effect: { exp: 30, gold: 20 }, tint: "#d9c0b8" },
  "patbingsu": { effect: { attackSpeed: 20, greatSuccess: 20 }, tint: "#dfe7f2" },
  "salmon-roe-bowl": { effect: { criticalDamage: 70, seafoodDrop: 30 }, tint: "#f7a27a" },
  // Well under the hidden budget on purpose: it's made from early-game dishes.
  "guinea-feast": { effect: { attack: 25, criticalChance: 10, gold: 25, exp: 30 }, tint: "#dab8a2" },
};

// Snacks: eaten on the spot instead of filling a slot — they pay out this many regular
// kills' worth of gold at the current stage, right away.
export const INSTANT_DISHES: Record<string, { goldKills: number }> = {
  "pork-belly": { goldKills: 40 },
};

// A recipe added without its own EFFECTS entry still works (and can be eaten): a plain
// attack buff sized to its tier's budget. contentCheck.ts warns about these in dev.
const DEFAULT_EFFECT: Record<RecipeTier, BuffEffect> = {
  common: { attack: 12 },
  rare: { attack: 25 },
  epic: { attack: 40 },
  legendary: { attack: 90 },
  hidden: { attack: 120 },
};

export function hasOwnEffect(recipeId: string) {
  return recipeId in EFFECTS;
}

// Every recipe has an entry, so lookups never come up empty.
// The kitchen's effect tabs. A dish files under every category one of its (positive)
// effects belongs to, so a two-effect dish shows up in both tabs; a drawback (a negative
// number, e.g. less attack) never files it anywhere.
export type DishCategory = "attack" | "critical" | "speed" | "gold" | "drop" | "cooking";
const CATEGORY_OF: Record<keyof BuffEffect, DishCategory> = {
  attack: "attack",
  extraHit: "attack",
  bossDamage: "attack",
  missReduction: "attack",
  execute: "attack",
  criticalChance: "critical",
  criticalDamage: "critical",
  attackSpeed: "speed",
  skillCooldown: "speed",
  skillReset: "speed",
  gold: "gold",
  exp: "gold",
  offlineGold: "gold",
  offlineBuffs: "gold",
  dropRate: "drop",
  dropDouble: "drop",
  vegetableDrop: "drop",
  seafoodDrop: "drop",
  bossDropSure: "drop",
  groceryDiscount: "drop",
  cookSpeed: "cooking",
  greatSuccess: "cooking",
  ingredientSave: "cooking",
};

export function getDishCategories(recipeId: string): DishCategory[] {
  if (INSTANT_DISHES[recipeId]) return ["gold"];
  const effect = BUFFS[recipeId]?.effect ?? {};
  const found = (Object.keys(effect) as (keyof BuffEffect)[]).filter((key) => (effect[key] ?? 0) > 0).map((key) => CATEGORY_OF[key]);
  return [...new Set(found)];
}

export const BUFFS: Record<string, { effect: BuffEffect; tint: string }> = Object.fromEntries(
  RECIPES.map((recipe) => [recipe.id, EFFECTS[recipe.id] ?? { effect: DEFAULT_EFFECT[recipe.tier], tint: "#e8d5b0" }]),
);

// How the cooking minigame's result (src/state/cookingMinigame.ts) turns into what a dish
// actually does once eaten — replaces the old tier-fixed BUFF_DURATION_MS entirely.
export type CookGrade = "great" | "good" | "fail";
export const GRADE_DURATION_MS: Record<CookGrade, number> = { great: 10 * MINUTE, good: 5 * MINUTE, fail: 1 * MINUTE };
// INSTANT_DISHES never run in a buff slot — their grade scales the one-off gold payout instead.
export const GRADE_GOLD_MULTIPLIER: Record<CookGrade, number> = { great: 1.5, good: 1, fail: 0.5 };
export const GRADE_LABEL: Record<CookGrade, string> = { great: "대성공", good: "보통", fail: "망함" };

// A FIFO queue per recipe of its uneaten units' grades — pushed once per unit in finishCooking
// (twice on a 대성공-quantity roll), shifted once per unit eaten in eatDish/eatSnack. This
// lives apart from `inventory` on purpose: inventory only ever stacks dishes by name/quantity
// (see types.ts), so there's nowhere on an inventory item itself to remember which specific
// cook produced it. Missing/empty means "no record" (an older save, or desync) — callers
// fall back to "good".
export type DishQuality = Record<string, CookGrade[]>;

export function peekGrade(quality: DishQuality | undefined, recipeId: string): CookGrade {
  return quality?.[recipeId]?.[0] ?? "good";
}

export function pushGrade(quality: DishQuality | undefined, recipeId: string, grade: CookGrade, count: number): DishQuality {
  const next = { ...(quality ?? {}) };
  next[recipeId] = [...(next[recipeId] ?? []), ...Array.from({ length: count }, () => grade)];
  return next;
}

export function shiftGrade(quality: DishQuality | undefined, recipeId: string): DishQuality | undefined {
  if (!quality?.[recipeId]?.length) return quality;
  const rest = quality[recipeId].slice(1);
  if (rest.length === 0) {
    const { [recipeId]: _dropped, ...withoutRecipe } = quality;
    return withoutRecipe;
  }
  return { ...quality, [recipeId]: rest };
}

// Filling all three slots with dishes from one set adds its bonus on top.
export const DISH_SETS: { id: string; name: string; recipes: string[]; bonus: BuffEffect }[] = [
  {
    id: "sea",
    name: "바다 한 상",
    recipes: ["salmon-sashimi", "shrimp-sashimi", "mussel-seaweed-soup", "tuna-sashimi", "octopus", "salmon-steak", "seafood-boil", "grilled-sardine", "spicy-oyster", "salmon-roe-bowl"],
    bonus: { gold: 30, seafoodDrop: 30 },
  },
  {
    id: "meat",
    name: "고기 파티",
    recipes: ["chicken-grill", "steak", "yukhoe", "lamb-rib", "fire-skewer"],
    bonus: { attack: 25, bossDamage: 25 },
  },
  {
    id: "garden",
    name: "텃밭 정식",
    recipes: ["carrot-soup", "chopped-salad", "veggie-stew", "mushroom-soup", "pumpkin-roast", "potato-pancake"],
    bonus: { dropRate: 25, exp: 15 },
  },
  {
    id: "sweet",
    name: "디저트 타임",
    recipes: ["green-jelly", "slime-potion", "royal-jelly", "pudding", "banana-milk", "mango-smoothie", "patbingsu"],
    bonus: { attackSpeed: 15, criticalChance: 5 },
  },
];

export function getDishSet(recipeId: string) {
  return DISH_SETS.find((set) => set.recipes.includes(recipeId));
}

// A dish's effect is this much stronger while its partner companion is equipped.
export const PARTNER_MULTIPLIER = 1.5;
export const DISH_PARTNERS: Record<string, Outfit> = {
  "chopped-salad": "default",
  "mango-smoothie": "explorerHamster",
  "banana-milk": "explorerHamster",
  "salmon-steak": "tetoGini",
  "fire-skewer": "tetoGini",
  octopus: "assassinGini",
  "lamb-rib": "egenGini",
  "tuna-sashimi": "samuraiGini",
  "squid-ink-risotto": "chefGini",
  "slime-potion": "witchGini",
  steak: "boxerGini",
  "pecan-bbq-ribs": "cowboyGini",
};

export const OUTFIT_NAMES: Record<Outfit, string> = {
  default: "모험기니",
  explorerHamster: "탐험기니",
  tetoGini: "테토기니",
  assassinGini: "암살기니",
  egenGini: "에겐기니",
  samuraiGini: "사무라이기니",
  chefGini: "셰프기니",
  boxerGini: "복서기니",
  witchGini: "마녀기니",
  cowboyGini: "카우보이기니",
};

// "세트: 바다 한 상", "궁합: 테토기니" — the set a dish belongs to and its partner companion.
export function describeDishLinks(recipeId: string) {
  const set = getDishSet(recipeId);
  const partner = DISH_PARTNERS[recipeId];
  return [
    set && t(`세트: ${set.name}`, `Set: ${t(set.name)}`, `セット: ${t(set.name)}`, `套装: ${t(set.name)}`),
    partner && t(`궁합: ${OUTFIT_NAMES[partner]}`, `Pairs With: ${t(OUTFIT_NAMES[partner])}`, `相性: ${t(OUTFIT_NAMES[partner])}`, `搭配: ${t(OUTFIT_NAMES[partner])}`),
  ].filter((part): part is string => !!part);
}

export function runningSlots(slots: BuffSlot[] | undefined, now: number) {
  return (slots ?? []).filter((slot): slot is NonNullable<BuffSlot> => !!slot && slot.expiresAt > now);
}

// The set whose bonus is on: every slot running, all from that one set.
export function getActiveSet(slots: BuffSlot[] | undefined, now: number) {
  const running = runningSlots(slots, now);
  if (running.length < BUFF_SLOT_COUNT) return undefined;
  const set = getDishSet(running[0].recipeId);
  return set && running.every((slot) => set.recipes.includes(slot.recipeId)) ? set : undefined;
}

// Companion outfits: equipping one swaps the battle sprite and grants a small permanent
// bonus — smaller than a food buff since it never runs out, unlike those timed dishes.
export const OUTFIT_BUFFS: Partial<Record<Outfit, BuffEffect>> = {
  explorerHamster: { gold: 10 },
  // Huge attack, but every hit risks whiffing entirely — see OUTFIT_MISS_CHANCE.
  tetoGini: { attack: 100 },
  // Weaker per hit, but strikes twice per swing — see OUTFIT_HIT_COUNT.
  assassinGini: { attack: -45 },
  // Draws slowly — the price of OUTFIT_FIRST_STRIKE's one huge opening cut.
  samuraiGini: { attackSpeed: -35 },
  // The kitchen companion: widens the cooking minigame's target zone a lot and lifts
  // great-success odds, at a cost in the fight — the only companion that trades battle
  // power for cooking.
  chefGini: { cookSpeed: 50, greatSuccess: 20, attack: -15 },
  witchGini: { criticalDamage: 20 },
  // ×1.3 damage. The drawback isn't a stat here — it's OUTFIT_SHOTS_BEFORE_RELOAD below:
  // every 6th shot, the gun has to reload.
  cowboyGini: { attack: 30 },
};

// 카우보이기니: every OUTFIT_SHOTS_BEFORE_RELOAD-th shot (auto-battle only — see
// useAutoBattle's shotsBeforeReload) empties the cylinder; the next swing is delayed by
// OUTFIT_RELOAD_MS instead of the usual gap while it reloads.
export const OUTFIT_SHOTS_BEFORE_RELOAD: Partial<Record<Outfit, number>> = {
  cowboyGini: 6,
};
export const OUTFIT_RELOAD_MS: Partial<Record<Outfit, number>> = {
  cowboyGini: 2000,
};

// Every ingredient a monster can drop always drops while this companion is out —
// 셰프기니 knows exactly which part of every catch is worth keeping.
export const OUTFIT_SURE_DROPS: Partial<Record<Outfit, boolean>> = {
  chefGini: true,
};

// The first strike on each enemy is worth this many normal hits and never crits —
// 사무라이기니's iaido draw. Auto-battle only while it's equipped.
export const OUTFIT_FIRST_STRIKE: Partial<Record<Outfit, number>> = {
  samuraiGini: 5,
};

// Percent chance an attack whiffs completely (0 damage, no kill, no on-hit effects) while
// this outfit is equipped — the tradeoff that balances tetoGini's oversized attack buff.
export const OUTFIT_MISS_CHANCE: Partial<Record<Outfit, number>> = {
  tetoGini: 40,
};

// Extra strikes landed per swing (default 1) — assassinGini's twin daggers hit twice,
// each rolling its own crit independently, offsetting its attack penalty.
export const OUTFIT_HIT_COUNT: Partial<Record<Outfit, number>> = {
  assassinGini: 2,
};

// Extra seconds added to every food buff's duration the moment it's eaten, while this
// outfit is equipped — 모험기니 doesn't fight any better, it just makes meals last longer.
export const OUTFIT_FOOD_DURATION_BONUS_SEC: Partial<Record<Outfit, number>> = {
  default: 15,
};

// Seconds shaved off every active skill's cooldown while this outfit is equipped.
export const OUTFIT_COOLDOWN_REDUCTION_SEC: Partial<Record<Outfit, number>> = {
  egenGini: 60,
};

// Multiplies skill effects while this outfit is equipped (see useAutoBattle's skillPower).
export const OUTFIT_SKILL_POWER: Partial<Record<Outfit, number>> = {};

// 복서기니: always fights by hand (no auto-battle at all, no 난타 needed) — but see
// OUTFIT_NO_OFFLINE below, the tradeoff for that always-on manual fighting.
export const OUTFIT_FORCED_MANUAL: Partial<Record<Outfit, boolean>> = {
  boxerGini: true,
};

// This outfit never fights while the app is closed — simulateOfflineProgress skips it
// outright (offline.ts), since a boxer only throws punches with someone actually tapping.
export const OUTFIT_NO_OFFLINE: Partial<Record<Outfit, boolean>> = {
  boxerGini: true,
};

// --- 동료 승급 (조각): each level grows the companion's OWN quirk instead of a flat attack
// bonus — sharpening its strength or shrinking its drawback. Levels 0..COMPANION_MAX_LEVEL
// (progression.ts); 5 and 10 also unlock a milestone extra. Everything that reads a
// companion's numbers goes through getOutfitStats, never the raw tables above.
export type OutfitStats = {
  buff: BuffEffect;
  missChance: number;
  hitCount: number;
  // % chance a swing lands one more strike (on top of food's extraHit).
  extraHitChance: number;
  firstStrike: number;
  cooldownSec: number;
  foodBonusSec: number;
  shotsBeforeReload: number;
  reloadMs: number;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

export function getOutfitStats(outfit: Outfit, level = 0): OutfitStats {
  const L = Math.max(0, Math.min(10, level));
  const buff: BuffEffect = { ...(OUTFIT_BUFFS[outfit] ?? {}) };
  const stats: OutfitStats = {
    buff,
    missChance: OUTFIT_MISS_CHANCE[outfit] ?? 0,
    hitCount: OUTFIT_HIT_COUNT[outfit] ?? 1,
    extraHitChance: 0,
    firstStrike: OUTFIT_FIRST_STRIKE[outfit] ?? 0,
    cooldownSec: OUTFIT_COOLDOWN_REDUCTION_SEC[outfit] ?? 0,
    foodBonusSec: OUTFIT_FOOD_DURATION_BONUS_SEC[outfit] ?? 0,
    shotsBeforeReload: OUTFIT_SHOTS_BEFORE_RELOAD[outfit] ?? 0,
    reloadMs: OUTFIT_RELOAD_MS[outfit] ?? 0,
  };
  switch (outfit) {
    case "default": // 음식 시간 +15초 → +90초
      stats.foodBonusSec += L * 7.5;
      break;
    case "explorerHamster": // 골드 +10% → +35%, Lv5 재료 드롭 +10%
      buff.gold = (buff.gold ?? 0) + L * 2.5;
      if (L >= 5) buff.dropRate = (buff.dropRate ?? 0) + 10;
      break;
    case "tetoGini": // 헛스윙 40% → 15%
      stats.missChance = Math.max(0, stats.missChance - L * 2.5);
      break;
    case "assassinGini": // 공격 -45% → -15%, Lv10 20% 확률로 3연타
      buff.attack = (buff.attack ?? 0) + L * 3;
      if (L >= 10) stats.extraHitChance += 20;
      break;
    case "samuraiGini": // 첫 타 ×5 → ×8, 공속 -35% → -15%
      stats.firstStrike = round1(stats.firstStrike + L * 0.3);
      buff.attackSpeed = (buff.attackSpeed ?? 0) + L * 2;
      break;
    case "egenGini": // 스킬 쿨 -60초 → -105초
      stats.cooldownSec += L * 4.5;
      break;
    case "chefGini": // 대성공 +20% → +40%, 공격 -15% → 0%
      buff.greatSuccess = (buff.greatSuccess ?? 0) + L * 2;
      buff.attack = (buff.attack ?? 0) + L * 1.5;
      break;
    case "witchGini": // 치명 피해 +20 → +50, Lv10 치명 확률 +5
      buff.criticalDamage = (buff.criticalDamage ?? 0) + L * 3;
      if (L >= 10) buff.criticalChance = (buff.criticalChance ?? 0) + 5;
      break;
    case "boxerGini": // 탭 한 방 공격 +5%/레벨
      buff.attack = (buff.attack ?? 0) + L * 5;
      break;
    case "cowboyGini": // 탄창 6 → 8발 (Lv5, Lv10), 재장전 2초 → 1.2초
      stats.shotsBeforeReload += Math.floor(L / 5);
      stats.reloadMs -= L * 80;
      break;
  }
  return stats;
}

// One line on what the next 승급 improves, for the companion card.
export const OUTFIT_GROWTH_HINT: Record<Outfit, [string, string, string, string]> = {
  default: ["음식 시간 +7.5초", "+7.5s food duration", "料理時間 +7.5秒", "食物时间 +7.5秒"],
  explorerHamster: ["골드 +2.5% (Lv5 재료 드롭 +10%)", "Gold +2.5% (Lv5: +10% drops)", "ゴールド +2.5%（Lv5 素材ドロップ +10%）", "金币 +2.5%（Lv5 材料掉落 +10%）"],
  tetoGini: ["헛스윙 -2.5%", "Whiff -2.5%", "空振り -2.5%", "落空 -2.5%"],
  assassinGini: ["공격 페널티 -3% (Lv10 3연타)", "Attack penalty -3% (Lv10: triple hit)", "攻撃ペナルティ -3%（Lv10 3連撃）", "攻击惩罚 -3%（Lv10 三连击）"],
  samuraiGini: ["첫 타 +0.3배 · 공속 +2%", "First hit +0.3× · Speed +2%", "初撃 +0.3倍・攻速 +2%", "首击 +0.3倍 · 攻速 +2%"],
  egenGini: ["스킬 쿨 -4.5초", "Skill cooldown -4.5s", "スキルクール -4.5秒", "技能冷却 -4.5秒"],
  chefGini: ["대성공 +2% · 공격 페널티 -1.5%", "Great success +2% · Attack penalty -1.5%", "大成功 +2%・攻撃ペナルティ -1.5%", "大成功 +2% · 攻击惩罚 -1.5%"],
  witchGini: ["치명 피해 +3 (Lv10 치명 확률 +5)", "Crit damage +3 (Lv10: +5 crit chance)", "クリダメ +3（Lv10 クリ率 +5）", "暴伤 +3（Lv10 暴击率 +5）"],
  boxerGini: ["공격력 +5%", "Attack +5%", "攻撃力 +5%", "攻击力 +5%"],
  cowboyGini: ["재장전 -0.08초 (Lv5·10 탄창 +1)", "Reload -0.08s (Lv5/10: +1 round)", "リロード -0.08秒（Lv5・10 装弾数 +1）", "装填 -0.08秒（Lv5/10 弹仓 +1）"],
};

const signed = (value: number) => `${value >= 0 ? "+" : ""}${value}`;

const EFFECT_LABELS: Record<keyof BuffEffect, (value: number) => string> = {
  attack: (value) => t(`공격력 ${signed(value)}%`, `Attack ${signed(value)}%`, `攻撃力 ${signed(value)}%`, `攻击力 ${signed(value)}%`),
  criticalChance: (value) =>
    value <= -100
      ? t("치명타 없음", "No crits", "クリティカルなし", "无暴击")
      : t(`치명타 확률 ${signed(value)}%`, `Crit Chance ${signed(value)}%`, `クリティカル率 ${signed(value)}%`, `暴击率 ${signed(value)}%`),
  criticalDamage: (value) => t(`치명타 피해 ${signed(value)}%`, `Crit Damage ${signed(value)}%`, `クリティカルダメージ ${signed(value)}%`, `暴击伤害 ${signed(value)}%`),
  gold: (value) => t(`골드 획득 ${signed(value)}%`, `Gold Gain ${signed(value)}%`, `ゴールド獲得 ${signed(value)}%`, `金币获取 ${signed(value)}%`),
  attackSpeed: (value) => t(`공격 속도 ${signed(value)}%`, `Attack Speed ${signed(value)}%`, `攻撃速度 ${signed(value)}%`, `攻击速度 ${signed(value)}%`),
  bossDamage: (value) => t(`보스 피해 ${signed(value)}%`, `Boss Damage ${signed(value)}%`, `ボスダメージ ${signed(value)}%`, `首领伤害 ${signed(value)}%`),
  exp: (value) => t(`경험치 ${signed(value)}%`, `EXP ${signed(value)}%`, `経験値 ${signed(value)}%`, `经验值 ${signed(value)}%`),
  extraHit: (value) => t(`추가 타격 ${value}%`, `Extra Hit ${value}%`, `追加打撃 ${value}%`, `额外打击 ${value}%`),
  missReduction: (value) => t(`빗나감 -${value}%`, `Miss Chance -${value}%`, `ミス率 -${value}%`, `未命中 -${value}%`),
  skillCooldown: (value) => t(`스킬 쿨타임 -${value}초`, `Skill Cooldown -${value}s`, `スキルクールタイム -${value}秒`, `技能冷却 -${value}秒`),
  execute: (value) => t(`처형 기준 +${value}%`, `Execute Threshold +${value}%`, `処刑基準 +${value}%`, `处决阈值 +${value}%`),
  dropRate: (value) => t(`재료 드롭 ${signed(value)}%`, `Item Drop Rate ${signed(value)}%`, `素材ドロップ ${signed(value)}%`, `材料掉落率 ${signed(value)}%`),
  dropDouble: (value) => t(`재료 2배 ${value}%`, `Double Drop ${value}%`, `素材2倍 ${value}%`, `材料双倍 ${value}%`),
  vegetableDrop: (value) => t(`채소 드롭 ${signed(value)}%`, `Vegetable Drop ${signed(value)}%`, `野菜ドロップ ${signed(value)}%`, `蔬菜掉落 ${signed(value)}%`),
  seafoodDrop: (value) => t(`해산물 드롭 ${signed(value)}%`, `Seafood Drop ${signed(value)}%`, `海産物ドロップ ${signed(value)}%`, `海鲜掉落 ${signed(value)}%`),
  bossDropSure: () => t("보스 재료 확정", "Guaranteed Boss Drop", "ボス素材確定", "首领材料必掉"),
  cookSpeed: (value) => t(`성공 범위 +${value}%`, `Success Zone +${value}%`, `成功範囲 +${value}%`, `成功区域 +${value}%`),
  greatSuccess: (value) => t(`요리 대성공 ${value}%`, `Great Success ${value}%`, `料理大成功 ${value}%`, `大成功概率 ${value}%`),
  ingredientSave: (value) => t(`재료 절약 ${value}%`, `Ingredient Save ${value}%`, `素材節約 ${value}%`, `食材节省 ${value}%`),
  groceryDiscount: (value) => t(`재료 상점 -${value}%`, `Grocery Discount -${value}%`, `食材店 -${value}%`, `食材商店 -${value}%`),
  offlineGold: (value) => t(`오프라인 골드 ${signed(value)}%`, `Offline Gold ${signed(value)}%`, `オフラインゴールド ${signed(value)}%`, `离线金币 ${signed(value)}%`),
  offlineBuffs: () => t("자는 동안 버프 유지", "Buffs Keep Running While Away", "眠っている間もバフ維持", "睡眠期间增益持续"),
  skillReset: () => t("먹으면 스킬 즉시 충전", "Resets Skill Cooldown on Eating", "食べるとスキルが即チャージ", "食用后技能立即充满"),
};

const EFFECT_KEYS = Object.keys(EFFECT_LABELS) as (keyof BuffEffect)[];

// The same, one entry per stat — for UI that pairs each with its own icon.
export function describeEffectParts(effect: BuffEffect) {
  return EFFECT_KEYS.filter((key) => effect[key] !== undefined).map((key) => ({ key, text: EFFECT_LABELS[key](effect[key] ?? 0) }));
}

export function describeEffect(effect: BuffEffect) {
  return EFFECT_KEYS.filter((key) => effect[key] !== undefined)
    .map((key) => EFFECT_LABELS[key](effect[key] ?? 0))
    .join(" · ");
}

// What a dish does, for UI copy — an instant snack describes its payout instead.
export function describeDish(recipeId: string) {
  const instant = INSTANT_DISHES[recipeId];
  if (instant)
    return t(
      `먹으면 즉시 골드 (몹 ${instant.goldKills}마리분)`,
      `Instant gold on eating (worth ${instant.goldKills} mobs)`,
      `食べるとゴールド即時獲得（モンスター${instant.goldKills}匹分）`,
      `食用后立即获得金币（相当于${instant.goldKills}只小怪）`,
    );
  return describeEffect(BUFFS[recipeId]?.effect ?? {});
}

export function emptyEffect(): Required<BuffEffect> {
  return Object.fromEntries(EFFECT_KEYS.map((key) => [key, 0])) as Required<BuffEffect>;
}

function addEffect(totals: Required<BuffEffect>, effect: BuffEffect, scale = 1) {
  for (const key of EFFECT_KEYS) totals[key] += Math.round((effect[key] ?? 0) * scale);
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Sum of every slot that's still running at `now` — a dish whose partner companion is
// equipped counts PARTNER_MULTIPLIER times over — plus a full set's bonus.
export function getBuffTotals(slots: BuffSlot[] | undefined, now: number, outfit?: Outfit): Required<BuffEffect> {
  const totals = emptyEffect();
  for (const slot of runningSlots(slots, now)) {
    const effect = BUFFS[slot.recipeId]?.effect ?? {};
    addEffect(totals, effect, outfit && DISH_PARTNERS[slot.recipeId] === outfit ? PARTNER_MULTIPLIER : 1);
  }
  const set = getActiveSet(slots, now);
  if (set) addEffect(totals, set.bonus);
  return totals;
}

export function emptyBuffSlots(): BuffSlot[] {
  return Array.from({ length: BUFF_SLOT_COUNT }, () => null);
}
