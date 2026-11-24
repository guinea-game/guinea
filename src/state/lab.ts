import type { GameState, StatKey } from "../types";
import { STACK_SIZE } from "./bag";
import { STAT_CAP } from "./gameMath";

// 연구소: a time-gated tech tree, separate from 강화(즉시, 골드)/요리(버프)/승급(동료 전용) — one
// active research at a time, paid in gems, that finishes itself once its real-time duration is
// up (see useGameState's lab-completion effect). Five tracks have 3 levels each (cumulative
// totals below, not per-level deltas); two are one-time unlocks.
export type LabTrackId = "offline" | "drop" | "bag" | "skill" | "cooking";
export type LabUnlockId = "companionCap" | "critCap";
export type LabResearchId = LabTrackId | LabUnlockId;

export const LAB_TRACK_ORDER: LabTrackId[] = ["offline", "drop", "bag", "skill", "cooking"];
export const LAB_UNLOCK_ORDER: LabUnlockId[] = ["companionCap", "critCap"];

type TrackLevel = { gems: number; durationMs: number };

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;

// Offline: extends both the 8h cap (offline.ts's MAX_OFFLINE_MS) and the 1/8 payout rate
// together, so research stays a single dial instead of two.
const OFFLINE_LEVELS: (TrackLevel & { capMs: number; rate: number })[] = [
  { gems: 300, durationMs: 30 * MIN, capMs: 10 * HOUR, rate: 1 / 6 },
  { gems: 800, durationMs: 2 * HOUR, capMs: 12 * HOUR, rate: 1 / 5 },
  { gems: 2000, durationMs: 6 * HOUR, capMs: 16 * HOUR, rate: 1 / 4 },
];

// Drop: a permanent double-drop chance, on top of any food buff's own dropDouble.
const DROP_LEVELS: (TrackLevel & { doubleChance: number })[] = [
  { gems: 200, durationMs: 20 * MIN, doubleChance: 10 },
  { gems: 600, durationMs: 90 * MIN, doubleChance: 20 },
  { gems: 1500, durationMs: 5 * HOUR, doubleChance: 30 },
];

// Bag: raises STACK_SIZE (bag.ts), so each slot holds more before spilling into the next.
const BAG_LEVELS: (TrackLevel & { stackBonus: number })[] = [
  { gems: 250, durationMs: 30 * MIN, stackBonus: 16 },
  { gems: 700, durationMs: 2 * HOUR, stackBonus: 32 },
  { gems: 1800, durationMs: 6 * HOUR, stackBonus: 48 },
];

// Skill: a flat extra cooldown cut (seconds), stacking with 구미호's cooldownSec and food's
// skillCooldown — all three feed the same cooldownReductionMs in useGameState.
const SKILL_LEVELS: (TrackLevel & { cooldownSec: number })[] = [
  { gems: 300, durationMs: 40 * MIN, cooldownSec: 20 },
  { gems: 900, durationMs: 150 * MIN, cooldownSec: 40 },
  { gems: 2200, durationMs: 7 * HOUR, cooldownSec: 60 },
];

// Cooking: widens the minigame's target zone (cookingMinigame.ts's getZoneWidth), stacking
// with 셰프기니's own +50 and food's cookSpeed.
const COOKING_LEVELS: (TrackLevel & { cookSpeed: number })[] = [
  { gems: 250, durationMs: 30 * MIN, cookSpeed: 15 },
  { gems: 700, durationMs: 2 * HOUR, cookSpeed: 30 },
  { gems: 1700, durationMs: 330 * MIN, cookSpeed: 45 },
];

const LAB_TRACKS: Record<LabTrackId, TrackLevel[]> = {
  offline: OFFLINE_LEVELS,
  drop: DROP_LEVELS,
  bag: BAG_LEVELS,
  skill: SKILL_LEVELS,
  cooking: COOKING_LEVELS,
};

export const LAB_TRACK_TITLE: Record<LabTrackId, [string, string]> = {
  offline: ["오프라인 보상 연구", "Offline Reward Research"],
  drop: ["드랍률 연구", "Drop Rate Research"],
  bag: ["가방 연구", "Bag Research"],
  skill: ["스킬 연구", "Skill Research"],
  cooking: ["요리 연구", "Cooking Research"],
};

// One-time unlocks: no levels, just a single gems+time cost.
export const LAB_UNLOCKS: Record<LabUnlockId, TrackLevel> = {
  companionCap: { gems: 1500, durationMs: 4 * HOUR },
  critCap: { gems: 2000, durationMs: 5 * HOUR },
};

export const LAB_UNLOCK_TITLE: Record<LabUnlockId, [string, string]> = {
  companionCap: ["동료 승급 한계 해제", "Companion Upgrade Cap"],
  critCap: ["치명타 한계 연구", "Critical Hit Cap Research"],
};

// Soft cap every companion's shard upgrades sit at until companionCap is researched (see
// progression.ts's applyCompanionUpgrade) — COMPANION_MAX_LEVEL (10) is the true ceiling.
export const COMPANION_SOFT_CAP = 5;
// Raised stat caps once critCap is researched (gameMath.ts's STAT_CAP holds the defaults).
export const CRIT_CAP_RESEARCHED: Partial<Record<StatKey, number>> = { criticalChance: 30, criticalDamage: 325 };

export function getLabLevel(state: Pick<GameState, "labLevels">, track: LabTrackId) {
  return state.labLevels?.[track] ?? 0;
}

export function getLabTrackMax(track: LabTrackId) {
  return LAB_TRACKS[track].length;
}

export function isLabUnlocked(state: Pick<GameState, "labUnlocked">, unlock: LabUnlockId) {
  return (state.labUnlocked ?? []).includes(unlock);
}

// Current level's effect values (0 = not researched at all yet).
function currentTrackLevel(state: Pick<GameState, "labLevels">, track: LabTrackId) {
  const level = getLabLevel(state, track);
  return level > 0 ? LAB_TRACKS[track][level - 1] : undefined;
}

export function getOfflineRewardRate(state: Pick<GameState, "labLevels">) {
  const BASE_RATE = 1 / 8;
  const level = currentTrackLevel(state, "offline") as (TrackLevel & { rate: number }) | undefined;
  return level?.rate ?? BASE_RATE;
}

export function getOfflineCapMs(state: Pick<GameState, "labLevels">) {
  const BASE_CAP_MS = 8 * HOUR;
  const level = currentTrackLevel(state, "offline") as (TrackLevel & { capMs: number }) | undefined;
  return level?.capMs ?? BASE_CAP_MS;
}

export function getLabDropDoubleBonus(state: Pick<GameState, "labLevels">) {
  const level = currentTrackLevel(state, "drop") as (TrackLevel & { doubleChance: number }) | undefined;
  return level?.doubleChance ?? 0;
}

export function getLabBagStackSize(state: Pick<GameState, "labLevels">) {
  const level = currentTrackLevel(state, "bag") as (TrackLevel & { stackBonus: number }) | undefined;
  return STACK_SIZE + (level?.stackBonus ?? 0);
}

export function getLabSkillCooldownSec(state: Pick<GameState, "labLevels">) {
  const level = currentTrackLevel(state, "skill") as (TrackLevel & { cooldownSec: number }) | undefined;
  return level?.cooldownSec ?? 0;
}

export function getLabCookSpeedBonus(state: Pick<GameState, "labLevels">) {
  const level = currentTrackLevel(state, "cooking") as (TrackLevel & { cookSpeed: number }) | undefined;
  return level?.cookSpeed ?? 0;
}

export function getCompanionLevelCap(state: Pick<GameState, "labUnlocked">) {
  return isLabUnlocked(state, "companionCap") ? 10 : COMPANION_SOFT_CAP;
}

// Falls back to gameMath's own STAT_CAP until critCap is researched.
export function getEffectiveStatCap(state: Pick<GameState, "labUnlocked">, key: StatKey): number | undefined {
  if (isLabUnlocked(state, "critCap") && key in CRIT_CAP_RESEARCHED) return CRIT_CAP_RESEARCHED[key];
  return STAT_CAP[key];
}

// --- The research queue: one slot, paid up front, ticks down on wall-clock time. ----------

// What finishing `id` next would cost right now — undefined if it's already at/past that
// (a maxed track, or an unlock already owned).
export function getResearchCost(state: Pick<GameState, "labLevels" | "labUnlocked">, id: LabResearchId): TrackLevel | undefined {
  if (id in LAB_UNLOCKS) {
    const unlockId = id as LabUnlockId;
    return isLabUnlocked(state, unlockId) ? undefined : LAB_UNLOCKS[unlockId];
  }
  const track = id as LabTrackId;
  const level = getLabLevel(state, track);
  return LAB_TRACKS[track][level];
}

// What one level of a track does, for the research list (LabModal.tsx) — `level` is 1-based,
// same numbering as getLabLevel's stored value.
export function describeLabLevel(track: LabTrackId, level: number): [string, string] {
  const info = LAB_TRACKS[track][level - 1];
  switch (track) {
    case "offline": {
      const { capMs, rate } = info as (typeof OFFLINE_LEVELS)[number];
      return [`오프라인 보상 최대 ${capMs / HOUR}시간 · 1/${Math.round(1 / rate)} 배율`, `Offline cap ${capMs / HOUR}h · 1/${Math.round(1 / rate)} rate`];
    }
    case "drop": {
      const { doubleChance } = info as (typeof DROP_LEVELS)[number];
      return [`재료 2배 드롭 확률 +${doubleChance}%`, `Double-drop chance +${doubleChance}%`];
    }
    case "bag": {
      const { stackBonus } = info as (typeof BAG_LEVELS)[number];
      return [`가방 한 칸에 ${STACK_SIZE + stackBonus}개까지`, `Bag slot holds up to ${STACK_SIZE + stackBonus}`];
    }
    case "skill": {
      const { cooldownSec } = info as (typeof SKILL_LEVELS)[number];
      return [`스킬 쿨타임 -${cooldownSec}초`, `Skill cooldown -${cooldownSec}s`];
    }
    case "cooking": {
      const { cookSpeed } = info as (typeof COOKING_LEVELS)[number];
      return [`요리 성공 범위 +${cookSpeed}%`, `Cooking success zone +${cookSpeed}%`];
    }
  }
}

export function describeLabUnlock(id: LabUnlockId): [string, string] {
  return id === "companionCap"
    ? ["모든 동료의 승급 한계를 Lv.10까지 풀어요.", "Raises every companion's upgrade cap to Lv.10."]
    : [
        `치명타 확률 상한 ${CRIT_CAP_RESEARCHED.criticalChance}%, 치명타 피해 상한 ${CRIT_CAP_RESEARCHED.criticalDamage}%까지 강화할 수 있게 돼요.`,
        `Lets critical chance reach ${CRIT_CAP_RESEARCHED.criticalChance}% and critical damage reach ${CRIT_CAP_RESEARCHED.criticalDamage}%.`,
      ];
}

export function isLabBusy(state: Pick<GameState, "labResearch">, now = Date.now()) {
  return !!state.labResearch && state.labResearch.readyAt > now;
}

export function startLabResearch(previous: GameState, id: LabResearchId): GameState {
  if (isLabBusy(previous)) return previous;
  const cost = getResearchCost(previous, id);
  if (!cost || previous.gems < cost.gems) return previous;
  return {
    ...previous,
    gems: previous.gems - cost.gems,
    labResearch: { id, readyAt: Date.now() + cost.durationMs },
  };
}

// Applies a finished research (once its readyAt has passed) and clears the slot — called every
// tick from useGameState so it lands the moment the timer's up, app open or not.
export function completeLabResearch(state: GameState, now = Date.now()): GameState {
  const research = state.labResearch;
  if (!research || research.readyAt > now) return state;
  if (research.id in LAB_UNLOCKS) {
    const unlockId = research.id as LabUnlockId;
    const unlocked = state.labUnlocked ?? [];
    return {
      ...state,
      labResearch: undefined,
      labUnlocked: unlocked.includes(unlockId) ? unlocked : [...unlocked, unlockId],
    };
  }
  const track = research.id as LabTrackId;
  return {
    ...state,
    labResearch: undefined,
    labLevels: { ...state.labLevels, [track]: getLabLevel(state, track) + 1 },
  };
}
