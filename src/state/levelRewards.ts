import type { GameState } from "../types";

// 레벨 보상: a one-time gem chest for each milestone level, open-ended like character level
// itself. Spacing widens as levels get harder to reach (getExpToLevel's 1.12^level curve),
// echoing the cadence other level-gated content already uses (quests.ts's CHAPTERS open at
// 1/10/25/50/90/140, unlocks.ts's SKILL_UNLOCK_LEVEL runs to 220) — past 1000 there's simply
// no further milestone to claim yet.
export const LEVEL_REWARDS: { level: number; gems: number }[] = [
  { level: 5, gems: 10 },
  { level: 10, gems: 20 },
  { level: 15, gems: 25 },
  { level: 20, gems: 30 },
  { level: 25, gems: 40 },
  { level: 30, gems: 50 },
  { level: 35, gems: 60 },
  { level: 40, gems: 70 },
  { level: 45, gems: 80 },
  { level: 50, gems: 100 },
  { level: 60, gems: 120 },
  { level: 70, gems: 140 },
  { level: 80, gems: 160 },
  { level: 90, gems: 200 },
  { level: 100, gems: 250 },
  { level: 120, gems: 300 },
  { level: 140, gems: 350 },
  { level: 160, gems: 400 },
  { level: 180, gems: 450 },
  { level: 200, gems: 500 },
  { level: 220, gems: 600 },
  { level: 250, gems: 700 },
  { level: 280, gems: 800 },
  { level: 310, gems: 900 },
  { level: 340, gems: 1000 },
  { level: 370, gems: 1100 },
  { level: 400, gems: 1200 },
  { level: 450, gems: 1400 },
  { level: 500, gems: 1600 },
  { level: 600, gems: 2000 },
  { level: 700, gems: 2400 },
  { level: 800, gems: 2800 },
  { level: 900, gems: 3200 },
  { level: 1000, gems: 4000 },
];

export type LevelRewardRow = { level: number; gems: number; claimed: boolean; claimable: boolean };

// Every milestone with its live claimed/claimable state, in table order (earliest first).
export function getLevelRewards(state: Pick<GameState, "level" | "levelRewardsClaimed">): LevelRewardRow[] {
  const claimed = state.levelRewardsClaimed ?? [];
  return LEVEL_REWARDS.map((reward) => ({
    ...reward,
    claimed: claimed.includes(reward.level),
    claimable: state.level >= reward.level && !claimed.includes(reward.level),
  }));
}

export function hasClaimableLevelReward(state: Pick<GameState, "level" | "levelRewardsClaimed">) {
  return getLevelRewards(state).some((row) => row.claimable);
}

// Pays one milestone's gems — only once the player has actually reached that level.
export function claimLevelReward(state: GameState, level: number): GameState {
  const reward = LEVEL_REWARDS.find((item) => item.level === level);
  const claimed = state.levelRewardsClaimed ?? [];
  if (!reward || state.level < level || claimed.includes(level)) return state;
  return { ...state, gems: state.gems + reward.gems, levelRewardsClaimed: [...claimed, level] };
}
