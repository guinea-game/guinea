import { GROCERY } from "./grocery";
import { getCompanionLevelCap } from "./lab";
import type { GameState, Outfit } from "../types";

// Long-haul goals that survive each loop back to stage 1. Every bonus here adds on and has a
// ceiling: at most +70% attack in all. Anything compounding would outgrow the loop's enemy HP
// and shorten each run through it.

// --- 동료 승급: each companion's shards come from one boss of its own. --------------------
export const COMPANION_MAX_LEVEL = 10;
export const COMPANION_ATTACK_PER_LEVEL = 5;
// Three a kill: one boss a run would otherwise take 165 runs to fill a companion.
export const SHARDS_PER_BOSS = 3;

// The stage (0-based) whose boss drops each companion's shards: the stage it joins at, or
// where its story points; 복서기니 has no stage, so it gets a boss worth punching.
export const COMPANION_SHARD_STAGE: Record<Outfit, number> = {
  default: 0, // 왕 슬라임
  explorerHamster: 4, // 싹난감자 (the cave they met in)
  boxerGini: 7, // 킹크랩
  tetoGini: 9, // 용암 슬라임
  assassinGini: 13, // 방울뱀
  egenGini: 20, // 구미호
  samuraiGini: 23, // 벚꽃 상어
  chefGini: 32, // 바게트 기사
  witchGini: 34, // 마녀 기니
  cowboyGini: 12, // 탈수 직전 낙타 (desert — the closest thing to a Wild West boss)
  // Box-only (unlocks.ts's BOX_RESCUE_OUTFITS), so it has no stage story of its own to tie
  // this to — same boss as default. Harmless either way: leveling it doesn't change
  // anything (see getOutfitStats' switch, no case for it at all).
  transparentGini: 0,
  nurseGini: 0,
  archerGini: 0,
  detectiveGini: 0,
  plainGini: 0,
  knightGini: 0,
  sageGini: 0,
};

export function getShardCompanion(stageNumber: number) {
  return (Object.keys(COMPANION_SHARD_STAGE) as Outfit[]).find((outfit) => COMPANION_SHARD_STAGE[outfit] === stageNumber);
}

export function getCompanionLevel(state: Pick<GameState, "companionLevels">, outfit: Outfit) {
  return state.companionLevels?.[outfit] ?? 0;
}

export function getCompanionShards(state: Pick<GameState, "companionShards">, outfit: Outfit) {
  return state.companionShards?.[outfit] ?? 0;
}

// Shards from `level` to the next one: 165 from nothing to the top.
export function getShardCost(level: number) {
  return (level + 1) * 3;
}

export function addCompanionShards(previous: GameState, outfit: Outfit, amount: number): GameState {
  return { ...previous, companionShards: { ...previous.companionShards, [outfit]: getCompanionShards(previous, outfit) + amount } };
}

export function applyCompanionUpgrade(previous: GameState, outfit: Outfit): GameState {
  const level = getCompanionLevel(previous, outfit);
  const cost = getShardCost(level);
  const shards = getCompanionShards(previous, outfit);
  if (level >= getCompanionLevelCap(previous) || shards < cost) return previous;
  return {
    ...previous,
    companionShards: { ...previous.companionShards, [outfit]: shards - cost },
    companionLevels: { ...previous.companionLevels, [outfit]: level + 1 },
  };
}

// --- 별 도전: three per stage, kept for good, each paying its gems once. ------------------
export const STAR_GEMS = 5;
export const STAR_CLEAR = 1;
export const STAR_FAST = 2;
export const STAR_NO_FOOD = 4;

export function countStars(mask: number) {
  return (mask & STAR_CLEAR ? 1 : 0) + (mask & STAR_FAST ? 1 : 0) + (mask & STAR_NO_FOOD ? 1 : 0);
}

// Stars earned at a stage whose gems haven't been collected yet (collected from the map's
// "i"; older saves without the record had them all paid already).
export function getUnclaimedStars(state: Pick<GameState, "stageStars" | "stageStarsClaimed">, stage: number) {
  const key = String(stage);
  const earned = state.stageStars?.[key] ?? 0;
  const claimed = (state.stageStarsClaimed ?? state.stageStars)?.[key] ?? 0;
  return earned & ~claimed;
}

// Collects a stage's unclaimed star gems (STAR_GEMS each).
export function claimStageStars<S extends GameState>(state: S, stage: number): S {
  const unclaimed = getUnclaimedStars(state, stage);
  if (!unclaimed) return state;
  const key = String(stage);
  return {
    ...state,
    gems: state.gems + countStars(unclaimed) * STAR_GEMS,
    stageStarsClaimed: { ...(state.stageStarsClaimed ?? state.stageStars), [key]: state.stageStars?.[key] ?? 0 },
  };
}

// --- 완성 보상: read straight off how full each book is, so there's nothing to claim. ------
const TIERS = 4;
export const CODEX_GOLD_PER_TIER = 10;

function tierOf(done: number, total: number) {
  return total > 0 ? Math.floor((Math.min(done, total) / total) * TIERS) : 0;
}

export function getCodexGoldBonus(discoveredItems: string[] | undefined) {
  const found = new Set(discoveredItems ?? []);
  return tierOf(GROCERY.filter((item) => found.has(item.name)).length, GROCERY.length) * CODEX_GOLD_PER_TIER;
}
