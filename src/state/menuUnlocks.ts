import type { GameState } from "../types";
import { getStageCode } from "./stages";
import { t } from "../i18n";

// The battle row's later pages open one by one as the run goes on, instead of all at once
// on a fresh save. Until then each shows as a black silhouette with a "?" and, as its
// caption, what opens it.
//  - 레벨 보상: Lv.5, the first milestone (so it opens with a reward already waiting).
//  - 일일 의뢰: clearing stage 3 — by then the kitchen is going and a few recipes are known
//    to draw orders from.
//  - 이벤트: clearing stage 5.
//  - 연구소: clearing stage 10 — research costs 200+ gems, so it waits until gems come in.
// Stage gates count the furthest stage reached this loop; any finished loop opens them all
// (highestStageNumber drops back when a new loop starts).
export type MenuPage = "daily" | "levelReward" | "lab" | "event";

type Gate = { level: number } | { clearedStage: number };

const MENU_GATES: Record<MenuPage, Gate> = {
  levelReward: { level: 5 },
  daily: { clearedStage: 3 },
  event: { clearedStage: 5 },
  lab: { clearedStage: 10 },
};

export function isMenuPageUnlocked(state: Pick<GameState, "level" | "highestStageNumber" | "stageNumber" | "loopsCompleted">, page: MenuPage) {
  const gate = MENU_GATES[page];
  if ("level" in gate) return state.level >= gate.level;
  if ((state.loopsCompleted ?? 0) > 0) return true;
  // highestStageNumber is the 0-based stage reached; reaching stage index N means stage code N was cleared.
  return (state.highestStageNumber ?? state.stageNumber) >= gate.clearedStage;
}

// The locked icon's caption: what opens it ("Lv.5", "3스테이지").
export function getMenuPageLockCaption(page: MenuPage) {
  const gate = MENU_GATES[page];
  if ("level" in gate) return `Lv.${gate.level}`;
  const code = getStageCode(gate.clearedStage - 1);
  return t(`${code}스테이지`, `Stage ${code}`);
}
