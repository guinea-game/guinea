import type { GameState } from "../types";

// 레벨 보상: a one-time gem chest at a handful of milestone levels, open-ended like character
// level itself. The gaps widen as levels get harder to reach (getExpToLevel's 1.12^level
// curve) — few, well-spaced chests that each feel like an event rather than one every 5
// levels. Rewards climb steadily to 5,000 at Lv1000 (~17,700 gems in all). Past 1000 there's
// simply no further milestone to claim yet.
export const LEVEL_REWARDS: { level: number; gems: number }[] = [
  { level: 5, gems: 10 },
  { level: 10, gems: 20 },
  { level: 20, gems: 50 },
  { level: 35, gems: 120 },
  { level: 50, gems: 200 },
  { level: 70, gems: 300 },
  { level: 100, gems: 450 },
  { level: 150, gems: 650 },
  { level: 200, gems: 900 },
  { level: 300, gems: 1400 },
  { level: 400, gems: 2000 },
  { level: 500, gems: 2800 },
  { level: 700, gems: 3800 },
  { level: 1000, gems: 5000 },
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
