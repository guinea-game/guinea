import type { GameState } from "../types";
import type { RecipeTier } from "./recipeTiers";
import { canCook, consumeIngredients, getKnownRecipes, RECIPES, type Recipe } from "./recipes";
import { fitItems, getBagCapacity } from "./bag";
import { pushGrade } from "./buffs";

// 냄비: an idle batch cooker separate from the instant timing-minigame cook in KitchenScreen —
// pick a known recipe, pay POT_BATCH_SIZE worth of its ingredients up front, and it turns into
// POT_BATCH_SIZE finished dishes after simmering for a tier-based stretch of real wall-clock
// time (no minigame, so the grade is always "good"). Up to POT_QUEUE_SIZE jobs deep: index 0 is
// the one actually simmering (has startedAt/readyAt); the rest wait behind it with neither, and
// only start once the one ahead of them is collected (collectPotJob/rushPotJob both shift the
// queue forward on their way out).
export type PotJob = { recipeId: string; startedAt?: number; readyAt?: number };

export const POT_QUEUE_SIZE = 3;
export const POT_BATCH_SIZE = 10;

// How long one batch simmers, by the recipe's tier — common's ingredients are the easiest to
// farm, so it's also the pot's quickest turnaround; hidden is a multi-hour commitment.
export const POT_DURATION_MS: Record<RecipeTier, number> = {
  common: 15 * 60 * 1000,
  rare: 30 * 60 * 1000,
  epic: 60 * 60 * 1000,
  legendary: 150 * 60 * 1000,
  hidden: 300 * 60 * 1000,
};

export function getPotDurationMs(tier: RecipeTier) {
  return POT_DURATION_MS[tier];
}

// A recipe's ingredients scaled up to one pot batch.
export function getPotIngredients(recipe: Recipe) {
  return recipe.ingredients.map((ingredient) => ({ ...ingredient, quantity: ingredient.quantity * POT_BATCH_SIZE }));
}

export function canQueuePotJob(state: Pick<GameState, "potQueue" | "inventory" | "knownRecipes">, recipeId: string) {
  if ((state.potQueue ?? []).length >= POT_QUEUE_SIZE) return false;
  if (!getKnownRecipes(state.knownRecipes).includes(recipeId)) return false;
  const recipe = RECIPES.find((item) => item.id === recipeId);
  return !!recipe && canCook(state.inventory, { ...recipe, ingredients: getPotIngredients(recipe) });
}

export function queuePotJob(previous: GameState, recipeId: string, now = Date.now()): GameState {
  if (!canQueuePotJob(previous, recipeId)) return previous;
  const recipe = RECIPES.find((item) => item.id === recipeId)!;
  const queue = previous.potQueue ?? [];
  const inventory = consumeIngredients(previous.inventory, { ...recipe, ingredients: getPotIngredients(recipe) });
  // The first job to queue starts simmering right away; anything behind it just waits its turn.
  const job: PotJob = queue.length === 0 ? { recipeId, startedAt: now, readyAt: now + getPotDurationMs(recipe.tier) } : { recipeId };
  return { ...previous, inventory, potQueue: [...queue, job] };
}

// Starts the next waiting job (if any) the moment the one ahead of it is cleared out.
function shiftPotQueue(queue: PotJob[], now: number): PotJob[] {
  const rest = queue.slice(1);
  if (rest.length === 0) return [];
  const recipe = RECIPES.find((item) => item.id === rest[0].recipeId);
  const readyAt = now + (recipe ? getPotDurationMs(recipe.tier) : 0);
  return [{ ...rest[0], startedAt: now, readyAt }, ...rest.slice(1)];
}

// How many of the active job's batch would actually fit in the bag right now (0 = full).
export function getPotLandCount(state: Pick<GameState, "inventory" | "bagExpansions">, recipeId: string, stackSize: number) {
  const recipe = RECIPES.find((item) => item.id === recipeId);
  if (!recipe) return 0;
  const { kept } = fitItems(state.inventory, [{ name: recipe.name, quantity: POT_BATCH_SIZE }], getBagCapacity(state.bagExpansions), stackSize);
  return kept[0]?.quantity ?? 0;
}

function landPotJob(previous: GameState, job: PotJob, landed: number, now: number): GameState {
  const recipe = RECIPES.find((item) => item.id === job.recipeId)!;
  const dish = previous.inventory.find((item) => item.name === recipe.name);
  const cookedRecipes = previous.cookedRecipes?.includes(recipe.id) ? previous.cookedRecipes : [...(previous.cookedRecipes ?? []), recipe.id];
  return {
    ...previous,
    inventory: dish
      ? previous.inventory.map((item) => (item === dish ? { ...item, quantity: item.quantity + landed } : item))
      : [...previous.inventory, { name: recipe.name, quantity: landed, type: "dish" }],
    dishQuality: pushGrade(previous.dishQuality, recipe.id, "good", landed),
    cookedRecipes,
    dishesCooked: (previous.dishesCooked ?? 0) + landed,
    potQueue: shiftPotQueue(previous.potQueue ?? [], now),
  };
}

// Takes a finished batch out of the pot into the bag — only once its readyAt has passed.
export function collectPotJob(previous: GameState, stackSize: number, now = Date.now()): { state: GameState; result: "ok" | "full" | "none" } {
  const job = previous.potQueue?.[0];
  if (!job || job.readyAt === undefined || job.readyAt > now) return { state: previous, result: "none" };
  const landed = getPotLandCount(previous, job.recipeId, stackSize);
  if (landed === 0) return { state: previous, result: "full" };
  return { state: landPotJob(previous, job, landed, now), result: "ok" };
}

// Gems to finish the active job right now — scales with the time actually left, so rushing
// right after starting costs close to the full batch and rushing near the end costs almost
// nothing. 3 minutes left per gem, rounded up, never below 1.
export function getPotRushCost(job: PotJob, now: number) {
  if (job.readyAt === undefined) return 0;
  const remainingMinutes = Math.max(1, Math.ceil((job.readyAt - now) / 60000));
  return Math.max(1, Math.ceil(remainingMinutes / 3));
}

// Pays gems to finish the active job immediately and collects it in the same stroke. Charges
// nothing if the bag has no room for it, or if it was already done (collects it for free instead).
export function rushPotJob(previous: GameState, stackSize: number, now = Date.now()): { state: GameState; result: "ok" | "gems" | "full" | "none" } {
  const job = previous.potQueue?.[0];
  if (!job || job.readyAt === undefined) return { state: previous, result: "none" };
  if (job.readyAt <= now) return collectPotJob(previous, stackSize, now);
  const landed = getPotLandCount(previous, job.recipeId, stackSize);
  if (landed === 0) return { state: previous, result: "full" };
  const cost = getPotRushCost(job, now);
  if (previous.gems < cost) return { state: previous, result: "gems" };
  return { state: landPotJob({ ...previous, gems: previous.gems - cost }, job, landed, now), result: "ok" };
}
