import type { GameState, StatKey } from "../types";
import { STACK_SIZE } from "./bag";
import { roundPrice, STAT_CAP } from "./gameMath";
import { getItemQuantity, RECIPES } from "./recipes";
import { shiftGrade } from "./buffs";

// 연구소: a time-gated tech tree, separate from 강화(즉시, 골드)/요리(버프)/승급(동료 전용) — one
// active research at a time, paid in gold (ordinary ones) or gems (the big ones) plus a pile of
// one dish, that finishes itself once its real-time duration is up (see useGameState's
// lab-completion effect). Eleven tracks have 3 levels each and two are one-time unlocks; each
// level/unlock is a node of LAB_TREE (bottom of this file), and every node is researched in
// three steps — each step adds a third of the node's effect and costs more than the last.
export type LabTrackId = "mobHp" | "effDish" | "effTime" | "effCost" | "offline" | "drop" | "golden" | "bossTime" | "bag" | "skill" | "cooking";
export type LabUnlockId = "companionCap" | "critCap";
export type LabResearchId = LabTrackId | LabUnlockId;

export const LAB_TRACK_ORDER: LabTrackId[] = ["mobHp", "effDish", "effTime", "effCost", "offline", "drop", "golden", "bossTime", "bag", "skill", "cooking"];
export const LAB_UNLOCK_ORDER: LabUnlockId[] = ["companionCap", "critCap"];

type LabState = Pick<GameState, "labSteps" | "labLevels" | "labUnlocked">;

// --- Steps ------------------------------------------------------------------------------------

export const STEPS_PER_NODE = 3;
// A node's three steps cost these shares of its base price (below): dishes and gold/gems
// ½ → 1 → 1½, time ½ → 1 → 1⅓ — e.g. a 30-dish, 1-hour node runs 15/30/45 dishes over
// 30m/1h/1h20m.
const STEP_AMOUNT = [0.5, 1, 1.5];
const STEP_TIME = [0.5, 1, 4 / 3];
// No single step runs longer than this.
const MAX_STEP_MS = 12 * 60 * 60 * 1000;

// Steps finished on a track or unlock (3 per level). Saves from before steps existed stored
// whole levels (labLevels) and owned unlocks (labUnlocked) — read as all three steps done.
export function getLabSteps(state: LabState, id: LabResearchId) {
  const steps = state.labSteps?.[id];
  if (steps !== undefined) return steps;
  if (id in LAB_UNLOCKS) return (state.labUnlocked ?? []).includes(id as LabUnlockId) ? STEPS_PER_NODE : 0;
  return (state.labLevels?.[id as LabTrackId] ?? 0) * STEPS_PER_NODE;
}

// Whole levels finished (0–3) — kept for anything that only cares about levels.
export function getLabLevel(state: LabState, track: LabTrackId) {
  return Math.floor(getLabSteps(state, track) / STEPS_PER_NODE);
}

export function isLabUnlocked(state: LabState, unlock: LabUnlockId) {
  return getLabSteps(state, unlock) >= STEPS_PER_NODE;
}

// --- Costs (per node, before the step shares) -------------------------------------------------

// Ordinary research is paid in gold — `goldKills` regular kills' worth, priced off what one of
// the current stage's mobs actually pays this player (`mobGold`, no food buffs), so it keeps
// pace with real income instead of going trivial (or out of reach) as the run goes on; the big ones (offline II/III, most level IIIs and both caps) are paid in gems.
type NodeCost = { durationMs: number } & ({ goldKills: number; gems?: undefined } | { gems: number; goldKills?: undefined });
export type ResearchCost = { currency: "gold" | "gems"; amount: number; durationMs: number };

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;

const LAB_TRACK_COSTS: Record<LabTrackId, NodeCost[]> = {
  mobHp: [{ goldKills: 300, durationMs: 1 * HOUR }, { goldKills: 900, durationMs: 4 * HOUR }, { gems: 2000, durationMs: 8 * HOUR }],
  effDish: [{ goldKills: 300, durationMs: 1 * HOUR }, { goldKills: 900, durationMs: 3 * HOUR }, { gems: 1500, durationMs: 6 * HOUR }],
  effTime: [{ goldKills: 300, durationMs: 1 * HOUR }, { goldKills: 900, durationMs: 3 * HOUR }, { gems: 1500, durationMs: 6 * HOUR }],
  effCost: [{ goldKills: 300, durationMs: 1 * HOUR }, { goldKills: 900, durationMs: 3 * HOUR }, { gems: 1500, durationMs: 6 * HOUR }],
  offline: [{ goldKills: 500, durationMs: 90 * MIN }, { gems: 1000, durationMs: 5 * HOUR }, { gems: 2500, durationMs: 10 * HOUR }],
  drop: [{ goldKills: 300, durationMs: 1 * HOUR }, { goldKills: 900, durationMs: 4 * HOUR }, { gems: 2000, durationMs: 8 * HOUR }],
  golden: [{ goldKills: 400, durationMs: 90 * MIN }, { goldKills: 1000, durationMs: 5 * HOUR }, { gems: 2000, durationMs: 9 * HOUR }],
  bossTime: [{ goldKills: 400, durationMs: 90 * MIN }, { goldKills: 1000, durationMs: 5 * HOUR }, { gems: 2000, durationMs: 9 * HOUR }],
  bag: [{ goldKills: 400, durationMs: 90 * MIN }, { goldKills: 1000, durationMs: 5 * HOUR }, { goldKills: 2000, durationMs: 9 * HOUR }],
  skill: [{ goldKills: 500, durationMs: 2 * HOUR }, { goldKills: 1200, durationMs: 6 * HOUR }, { gems: 2500, durationMs: 10 * HOUR }],
  cooking: [{ goldKills: 400, durationMs: 90 * MIN }, { goldKills: 1000, durationMs: 5 * HOUR }, { goldKills: 2000, durationMs: 9 * HOUR }],
};

// The two caps: the last nodes of 프로젝트 3, the longest research there is.
export const LAB_UNLOCKS: Record<LabUnlockId, NodeCost> = {
  companionCap: { gems: 2500, durationMs: 12 * HOUR },
  critCap: { gems: 3000, durationMs: 12 * HOUR },
};

export const LAB_TRACK_TITLE: Record<LabTrackId, [string, string]> = {
  offline: ["오프라인 보상 연구", "Offline Reward Research"],
  mobHp: ["몹 약화 연구", "Mob Weakening Research"],
  effDish: ["요리 절약 연구", "Dish Saving Research"],
  effTime: ["시간 단축 연구", "Time Saving Research"],
  effCost: ["비용 절감 연구", "Cost Saving Research"],
  drop: ["보스 재료 연구", "Boss Ingredient Research"],
  golden: ["황금몹 연구", "Golden Mob Research"],
  bossTime: ["보스 시간 연구", "Boss Timer Research"],
  bag: ["가방 연구", "Bag Research"],
  skill: ["스킬 연구", "Skill Research"],
  cooking: ["요리 연구", "Cooking Research"],
};

export const LAB_UNLOCK_TITLE: Record<LabUnlockId, [string, string]> = {
  companionCap: ["동료 승급 한계 해제", "Companion Upgrade Cap"],
  critCap: ["치명타 한계 연구", "Critical Hit Cap Research"],
};

// --- Effects -------------------------------------------------------------------------------
// Each track's value once a level is done (I, II, III), from `base` (nothing researched).
// Steps in between climb evenly from the level before, so a level's third step lands exactly
// on its value.
type Ladder = { base: number; levels: number[]; round: (value: number) => number };
const whole = (value: number) => Math.round(value);
const tenth = (value: number) => Math.round(value * 10) / 10;
const half = (value: number) => Math.round(value * 2) / 2;
const five = (value: number) => Math.round(value / 5) * 5;
const exact = (value: number) => value;

const LADDERS: Record<LabTrackId, Ladder> = {
  // Regular monsters (not mid-bosses or bosses) spawn with this % less HP — 10% at most.
  mobHp: { base: 0, levels: [3, 6, 10], round: whole },
  // Research efficiency: every later research needs this % fewer dishes / less time / less gold or gems.
  effDish: { base: 0, levels: [10, 20, 30], round: whole },
  effTime: { base: 0, levels: [10, 20, 30], round: whole },
  effCost: { base: 0, levels: [10, 20, 30], round: whole },
  // Offline payout rate (offline.ts's 1/8); its cap is OFFLINE_CAP_HOURS below.
  offline: { base: 1 / 8, levels: [1 / 6, 1 / 5, 1 / 4], round: exact },
  // % chance each boss-only ingredient (one no regular monster drops) comes in twos.
  drop: { base: 0, levels: [25, 50, 75], round: whole },
  // % of mid-bosses that come golden (stages.ts's GOLDEN_MINI_CHANCE is 5%).
  golden: { base: 5, levels: [7, 9, 12], round: tenth },
  // Extra seconds on every boss clock (both phases; gameMath's getBossTimeLimitMs).
  bossTime: { base: 0, levels: [10, 20, 30], round: whole },
  // Extra items a bag slot holds on top of STACK_SIZE (bag.ts).
  bag: { base: 0, levels: [16, 32, 48], round: whole },
  // Seconds off the skill cooldown, stacking with 구미호's and food's (useGameState).
  skill: { base: 0, levels: [20, 40, 60], round: whole },
  // % wider cooking-minigame target zone (cookingMinigame.ts), stacking with 셰프기니's and food's.
  cooking: { base: 0, levels: [15, 30, 45], round: whole },
};
const OFFLINE_CAP_HOURS: Ladder = { base: 8, levels: [10, 12, 16], round: half };

// Soft cap every companion's shard upgrades sit at until companionCap is researched (see
// progression.ts's applyCompanionUpgrade) — COMPANION_MAX_LEVEL (10) is the true ceiling.
export const COMPANION_SOFT_CAP = 5;
const COMPANION_CAP: Ladder = { base: COMPANION_SOFT_CAP, levels: [10], round: whole };
// Stat caps critCap raises (gameMath.ts's STAT_CAP holds the defaults).
const CRIT_CAPS: Partial<Record<StatKey, Ladder>> = {
  criticalChance: { base: STAT_CAP.criticalChance ?? 25, levels: [30], round: whole },
  criticalDamage: { base: STAT_CAP.criticalDamage ?? 300, levels: [325], round: five },
};

function climb(ladder: Ladder, steps: number) {
  if (steps <= 0) return ladder.base;
  const level = Math.min(ladder.levels.length, Math.ceil(steps / STEPS_PER_NODE));
  const within = Math.min(STEPS_PER_NODE, steps - (level - 1) * STEPS_PER_NODE);
  const from = level === 1 ? ladder.base : ladder.levels[level - 2];
  return ladder.round(from + ((ladder.levels[level - 1] - from) * within) / STEPS_PER_NODE);
}

function trackValue(state: LabState, track: LabTrackId) {
  return climb(LADDERS[track], getLabSteps(state, track));
}

export function getOfflineRewardRate(state: LabState) {
  return trackValue(state, "offline");
}

export function getOfflineCapMs(state: LabState) {
  return climb(OFFLINE_CAP_HOURS, getLabSteps(state, "offline")) * HOUR;
}

// How much the efficiency tracks take off (0–1).
function getEffCut(state: LabState, track: "effDish" | "effTime" | "effCost") {
  return trackValue(state, track) / 100;
}

// Regular mobs' HP multiplier (1 until researched, 0.9 at most).
export function getLabMobHpScale(state: LabState) {
  return 1 - trackValue(state, "mobHp") / 100;
}

export function getLabBossDoubleBonus(state: LabState) {
  return trackValue(state, "drop");
}

// The share of mid-bosses that come golden, 0–1 (`base`, GOLDEN_MINI_CHANCE, until researched).
export function getLabGoldenChance(state: LabState, base: number) {
  return getLabSteps(state, "golden") > 0 ? trackValue(state, "golden") / 100 : base;
}

export function getLabBossTimeBonusMs(state: LabState) {
  return trackValue(state, "bossTime") * 1000;
}

export function getLabBagStackSize(state: LabState) {
  return STACK_SIZE + trackValue(state, "bag");
}

export function getLabSkillCooldownSec(state: LabState) {
  return trackValue(state, "skill");
}

export function getLabCookSpeedBonus(state: LabState) {
  return trackValue(state, "cooking");
}

export function getCompanionLevelCap(state: LabState) {
  return climb(COMPANION_CAP, getLabSteps(state, "companionCap"));
}

// Falls back to gameMath's own STAT_CAP until critCap is researched.
export function getEffectiveStatCap(state: LabState, key: StatKey): number | undefined {
  const ladder = CRIT_CAPS[key];
  const steps = getLabSteps(state, "critCap");
  return ladder && steps > 0 ? climb(ladder, steps) : STAT_CAP[key];
}

// What a track or unlock does after `steps` steps, for the lab's card (LabModal.tsx).
export function describeLabSteps(id: LabResearchId, steps: number): [string, string] {
  if (id === "companionCap") {
    const cap = climb(COMPANION_CAP, steps);
    return [`모든 동료의 승급 한계 Lv.${cap}`, `Every companion's upgrade cap Lv.${cap}`];
  }
  if (id === "critCap") {
    const chance = climb(CRIT_CAPS.criticalChance!, steps);
    const damage = climb(CRIT_CAPS.criticalDamage!, steps);
    return [`치명타 확률 상한 ${chance}% · 치명타 피해 상한 ${damage}%`, `Critical chance cap ${chance}% · critical damage cap ${damage}%`];
  }
  const value = climb(LADDERS[id], steps);
  switch (id) {
    case "offline": {
      const hours = climb(OFFLINE_CAP_HOURS, steps);
      const pct = Math.round(value * 100);
      return [`오프라인 보상 최대 ${hours}시간 · 효율 ${pct}%`, `Offline cap ${hours}h · ${pct}% rate`];
    }
    case "effDish":
      return [`연구에 드는 요리 -${value}%`, `Dishes needed for research -${value}%`];
    case "effTime":
      return [`연구 시간 -${value}%`, `Research time -${value}%`];
    case "effCost":
      return [`연구 골드·보석 -${value}%`, `Research gold/gems -${value}%`];
    case "mobHp":
      return [`일반 몹 체력 -${value}%`, `Regular mob HP -${value}%`];
    case "drop":
      return [`보스 전용 재료 2배 확률 +${value}%`, `Boss-only ingredients double +${value}%`];
    case "golden":
      return [`황금몹 등장 확률 ${value}%`, `Golden mob chance ${value}%`];
    case "bossTime":
      return [`보스 제한시간 +${value}초`, `Boss time limit +${value}s`];
    case "bag":
      return [`가방 한 칸에 ${STACK_SIZE + value}개까지`, `Bag slot holds up to ${STACK_SIZE + value}`];
    case "skill":
      return [`스킬 쿨타임 -${value}초`, `Skill cooldown -${value}s`];
    case "cooking":
      return [`요리 성공 범위 +${value}%`, `Cooking success zone +${value}%`];
  }
}

// --- The research queue: one slot, paid up front, ticks down on wall-clock time. ----------

function maxSteps(id: LabResearchId) {
  return id in LAB_UNLOCKS ? STEPS_PER_NODE : LAB_TRACK_COSTS[id as LabTrackId].length * STEPS_PER_NODE;
}

// What the next step of `id` costs right now — undefined once it's all done.
export function getResearchCost(state: LabState, id: LabResearchId, mobGold: number): ResearchCost | undefined {
  const steps = getLabSteps(state, id);
  if (steps >= maxSteps(id)) return undefined;
  const node = id in LAB_UNLOCKS ? LAB_UNLOCKS[id as LabUnlockId] : LAB_TRACK_COSTS[id as LabTrackId][Math.floor(steps / STEPS_PER_NODE)];
  const step = steps % STEPS_PER_NODE;
  // 시간 단축 / 비용 절감 연구 shave every research after them.
  const durationMs = Math.round(Math.min(MAX_STEP_MS, node.durationMs * STEP_TIME[step]) * (1 - getEffCut(state, "effTime")));
  const costScale = STEP_AMOUNT[step] * (1 - getEffCut(state, "effCost"));
  if (node.gems !== undefined) return { currency: "gems", amount: Math.round((node.gems * costScale) / 10) * 10, durationMs };
  return { currency: "gold", amount: roundPrice(mobGold * node.goldKills * costScale), durationMs };
}

export function isLabBusy(state: Pick<GameState, "labResearch">, now = Date.now()) {
  return !!state.labResearch && state.labResearch.readyAt > now;
}

// Steps done within one node (0–3).
export function getLabNodeSteps(state: LabState, node: LabNode) {
  const start = ((node.level ?? 1) - 1) * STEPS_PER_NODE;
  return Math.max(0, Math.min(STEPS_PER_NODE, getLabSteps(state, node.research) - start));
}

// The dish a node's next step eats, with how many the bag holds now.
export function getLabNodeDish(state: Pick<GameState, "inventory"> & LabState, node: LabNode) {
  const [recipeId, baseCount] = node.dish;
  const step = Math.min(STEPS_PER_NODE - 1, getLabNodeSteps(state, node));
  // Rounded to fives; 요리 절약 연구 then trims the pile (rounded up, never below one).
  const stepCount = Math.max(5, Math.round((baseCount * STEP_AMOUNT[step]) / 5) * 5);
  const count = Math.max(1, Math.ceil(stepCount * (1 - getEffCut(state, "effDish"))));
  const recipe = RECIPES.find((item) => item.id === recipeId)!;
  return { recipeId, name: recipe.name, image: recipe.image, count, have: getItemQuantity(state.inventory, recipe.name) };
}

export function startLabResearch(previous: GameState, id: LabResearchId, mobGold: number): GameState {
  if (isLabBusy(previous)) return previous;
  const node = getNextLabNode(previous, id);
  if (!node || !isLabNodeOpen(previous, node)) return previous;
  const dish = getLabNodeDish(previous, node);
  if (dish.have < dish.count) return previous;
  const cost = getResearchCost(previous, id, mobGold);
  if (!cost) return previous;
  const wallet = cost.currency === "gold" ? previous.gold : previous.gems;
  if (wallet < cost.amount) return previous;
  // The dishes go oldest-cooked first, like eating and 일일 의뢰 hand-ins do.
  let dishQuality = previous.dishQuality;
  for (let unit = 0; unit < dish.count; unit++) dishQuality = shiftGrade(dishQuality, dish.recipeId);
  return {
    ...previous,
    inventory: previous.inventory
      .map((item) => (item.name === dish.name ? { ...item, quantity: item.quantity - dish.count } : item))
      .filter((item) => item.quantity > 0),
    dishQuality,
    ...(cost.currency === "gold" ? { gold: previous.gold - cost.amount } : { gems: previous.gems - cost.amount }),
    labResearch: { id, readyAt: Date.now() + cost.durationMs },
  };
}

// 시간 가속권: one takes 5 hours off the research running now (never past finishing it).
export const LAB_BOOST_MS = 5 * HOUR;

export function applyLabBoost(previous: GameState, now = Date.now()): GameState {
  const research = previous.labResearch;
  if (!research || research.readyAt <= now || (previous.labBoosts ?? 0) <= 0) return previous;
  return {
    ...previous,
    labBoosts: (previous.labBoosts ?? 0) - 1,
    labResearch: { ...research, readyAt: Math.max(now, research.readyAt - LAB_BOOST_MS) },
  };
}

// Applies a finished step (once its readyAt has passed) and clears the slot — called every tick
// from useGameState so it lands the moment the timer's up, app open or not.
export function completeLabResearch(state: GameState, now = Date.now()): GameState {
  const research = state.labResearch;
  if (!research || research.readyAt > now) return state;
  const id = research.id as LabResearchId;
  // Carries every track's progress over into labSteps the first time, so legacy levels stay.
  const steps: Partial<Record<LabResearchId, number>> = {};
  for (const item of [...LAB_TRACK_ORDER, ...LAB_UNLOCK_ORDER]) steps[item] = getLabSteps(state, item);
  steps[id] = Math.min(maxSteps(id), (steps[id] ?? 0) + 1);
  return { ...state, labResearch: undefined, labSteps: steps };
}

// --- The projects: the research is split into three trees, each three columns wide, opened
// one after another (a project opens once every node of the one before it is done). Inside
// one, every node is opened by finishing its parent:
//
//   Each project (level I in 1, II in 2, III in 3):
//                      몹 약화
//         ┌───────────────┼───────────────┐
//     요리 절약        시간 단축        비용 절감       (research efficiency: the rest of the
//         │               │               │           project already gets the discount)
//      황금몹          오프라인          스킬
//         │               │               │
//       가방            요리           보스 시간
//         │               │               │
//     보스 재료      (3: 동료 승급 해제) (3: 치명타 한계)
//
// `col` (0–2) and `row` place the node on its project's grid. A track's levels sit one per
// project, in order, so a node is open exactly when its project is open, its parent is done
// and its track is at the level just before it.
export type LabNodeId = string;
// `dish`: on top of the gold/gems, each research eats a pile of one dish, each dish used by one
// research only. The lab opens at stage 10 and is late-game content, so dishes follow the stage
// their last ingredient starts dropping (recipes.ts getRecipeStage), never the easy early ones:
// 프로젝트 1 uses dishes cookable from stage 10 to 19, 2 from stage 20 to 25, 3 from stage 27 to
// 49, and the two caps the last legendaries. The count is the node's middle step; its three
// steps take ½ / 1 / 1½ of it (30 → 15/30/45).
export type LabNode = {
  id: LabNodeId;
  project: number;
  research: LabResearchId;
  level?: number;
  parent?: LabNodeId;
  col: number;
  row: number;
  dish: [recipeId: string, count: number];
};

export const LAB_PROJECTS = [1, 2, 3];

export const LAB_TREE: LabNode[] = [
  { id: "mobHp-1", project: 1, research: "mobHp", level: 1, col: 1, row: 0, dish: ["potato-pancake", 30] },
  { id: "effDish-1", project: 1, research: "effDish", level: 1, parent: "mobHp-1", col: 0, row: 1, dish: ["octopus", 30] },
  { id: "effTime-1", project: 1, research: "effTime", level: 1, parent: "mobHp-1", col: 1, row: 1, dish: ["steak", 30] },
  { id: "effCost-1", project: 1, research: "effCost", level: 1, parent: "mobHp-1", col: 2, row: 1, dish: ["lamb-rib", 30] },
  { id: "golden-1", project: 1, research: "golden", level: 1, parent: "effDish-1", col: 0, row: 2, dish: ["fire-skewer", 30] },
  { id: "offline-1", project: 1, research: "offline", level: 1, parent: "effTime-1", col: 1, row: 2, dish: ["banana-milk", 30] },
  { id: "skill-1", project: 1, research: "skill", level: 1, parent: "effCost-1", col: 2, row: 2, dish: ["mango-smoothie", 30] },
  { id: "bag-1", project: 1, research: "bag", level: 1, parent: "golden-1", col: 0, row: 3, dish: ["grilled-sardine", 30] },
  { id: "cooking-1", project: 1, research: "cooking", level: 1, parent: "offline-1", col: 1, row: 3, dish: ["salmon-steak", 30] },
  { id: "bossTime-1", project: 1, research: "bossTime", level: 1, parent: "skill-1", col: 2, row: 3, dish: ["bamboo-dumpling", 30] },
  { id: "drop-1", project: 1, research: "drop", level: 1, parent: "bag-1", col: 0, row: 4, dish: ["persimmon-roll", 30] },

  { id: "mobHp-2", project: 2, research: "mobHp", level: 2, col: 1, row: 0, dish: ["haemul-pajeon", 60] },
  { id: "effDish-2", project: 2, research: "effDish", level: 2, parent: "mobHp-2", col: 0, row: 1, dish: ["tteokbokki", 60] },
  { id: "effTime-2", project: 2, research: "effTime", level: 2, parent: "mobHp-2", col: 1, row: 1, dish: ["azalea-hwajeon", 60] },
  { id: "effCost-2", project: 2, research: "effCost", level: 2, parent: "mobHp-2", col: 2, row: 1, dish: ["five-grain-rice", 60] },
  { id: "golden-2", project: 2, research: "golden", level: 2, parent: "effDish-2", col: 0, row: 2, dish: ["patbingsu", 60] },
  { id: "offline-2", project: 2, research: "offline", level: 2, parent: "effTime-2", col: 1, row: 2, dish: ["salmon-roe-bowl", 60] },
  { id: "skill-2", project: 2, research: "skill", level: 2, parent: "effCost-2", col: 2, row: 2, dish: ["squid-ink-risotto", 60] },
  { id: "bag-2", project: 2, research: "bag", level: 2, parent: "golden-2", col: 0, row: 3, dish: ["sakura-mochi", 60] },
  { id: "cooking-2", project: 2, research: "cooking", level: 2, parent: "offline-2", col: 1, row: 3, dish: ["inari-sushi", 60] },
  { id: "bossTime-2", project: 2, research: "bossTime", level: 2, parent: "skill-2", col: 2, row: 3, dish: ["spicy-oyster", 60] },
  { id: "drop-2", project: 2, research: "drop", level: 2, parent: "bag-2", col: 0, row: 4, dish: ["braised-mackerel", 60] },

  { id: "mobHp-3", project: 3, research: "mobHp", level: 3, col: 1, row: 0, dish: ["yuzu-sherbet", 100] },
  { id: "effDish-3", project: 3, research: "effDish", level: 3, parent: "mobHp-3", col: 0, row: 1, dish: ["abalone-porridge", 100] },
  { id: "effTime-3", project: 3, research: "effTime", level: 3, parent: "mobHp-3", col: 1, row: 1, dish: ["dragon-feast", 100] },
  { id: "effCost-3", project: 3, research: "effCost", level: 3, parent: "mobHp-3", col: 2, row: 1, dish: ["curry-rice", 100] },
  { id: "golden-3", project: 3, research: "golden", level: 3, parent: "effDish-3", col: 0, row: 2, dish: ["masala-chai", 100] },
  { id: "offline-3", project: 3, research: "offline", level: 3, parent: "effTime-3", col: 1, row: 2, dish: ["mughal-biryani", 100] },
  { id: "skill-3", project: 3, research: "skill", level: 3, parent: "effCost-3", col: 2, row: 2, dish: ["tom-yum-goong", 100] },
  { id: "bag-3", project: 3, research: "bag", level: 3, parent: "golden-3", col: 0, row: 3, dish: ["nasi-goreng", 100] },
  { id: "cooking-3", project: 3, research: "cooking", level: 3, parent: "offline-3", col: 1, row: 3, dish: ["poke-bowl", 100] },
  { id: "bossTime-3", project: 3, research: "bossTime", level: 3, parent: "skill-3", col: 2, row: 3, dish: ["pecan-bbq-ribs", 100] },
  { id: "drop-3", project: 3, research: "drop", level: 3, parent: "bag-3", col: 0, row: 4, dish: ["street-tacos", 100] },
  { id: "companionCap", project: 3, research: "companionCap", parent: "cooking-3", col: 1, row: 4, dish: ["choco-banana", 150] },
  { id: "critCap", project: 3, research: "critCap", parent: "bossTime-3", col: 2, row: 4, dish: ["chilean-empanada", 150] },
];

export function isLabNodeDone(state: LabState, node: LabNode) {
  return getLabNodeSteps(state, node) >= STEPS_PER_NODE;
}

// A project opens once every node of the one before it is done.
export function isLabProjectOpen(state: LabState, project: number) {
  return LAB_TREE.filter((node) => node.project < project).every((node) => isLabNodeDone(state, node));
}

export function isLabProjectDone(state: LabState, project: number) {
  return LAB_TREE.filter((node) => node.project === project).every((node) => isLabNodeDone(state, node));
}

// Started = at least its first step is done — enough to open the nodes under it.
export function isLabNodeStarted(state: LabState, node: LabNode) {
  return getLabNodeSteps(state, node) >= 1;
}

// Open = its next step can be started: project open, parent node started (one step is enough),
// and its track already through the level before (steps in a track always go in order).
export function isLabNodeOpen(state: LabState, node: LabNode) {
  if (isLabNodeDone(state, node) || !isLabProjectOpen(state, node.project)) return false;
  const parent = node.parent ? LAB_TREE.find((item) => item.id === node.parent) : undefined;
  if (parent && !isLabNodeStarted(state, parent)) return false;
  return getLabSteps(state, node.research) >= ((node.level ?? 1) - 1) * STEPS_PER_NODE;
}

// The node a research id's next step belongs to (its track's current level, or the unlock).
export function getNextLabNode(state: LabState, id: LabResearchId) {
  if (id in LAB_UNLOCKS) return LAB_TREE.find((node) => node.id === id);
  return LAB_TREE.find((node) => node.research === id && node.level === Math.floor(getLabSteps(state, id) / STEPS_PER_NODE) + 1);
}
