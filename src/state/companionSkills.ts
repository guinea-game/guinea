import type { Outfit } from "../types";

// Every companion's own active skill — separate from the equipped skill slot (skills.ts,
// 3-minute cooldown). This one is per-outfit (always the same skill for that companion,
// nothing to equip) and cools down fast on purpose: the point isn't power, it's giving the
// player something to tap during a fight instead of just watching auto-battle. Sized so
// mashing it nonstop adds roughly +10~20% effective damage, not a build-defining choice.
export const COMPANION_SKILL_COOLDOWN_MS = 10_000;
// How long a buff-style companion skill's window lasts (사무라이/마녀/복서/탐험/암살/도사 are
// instant instead — see useAutoBattle's strikeIaido/strikeArcaneBurst/strikeUppercut,
// flagAmbush, reduceSkillCooldown, and useGameState's explorer gold-x2 ref).
export const COMPANION_SKILL_WINDOW_MS = 3_000;

// 사무라이기니 거합: one immediate cut, never a crit (same rule as its passive first-strike).
export const COMPANION_IAIDO_MULTIPLIER = 4;
// 복서기니 어퍼컷: several quick hits instead of one big one, same total ballpark as the others
// (6 × 0.65 ≈ a ×3.9 normal hit) — each still rolls its own crit normally.
export const COMPANION_UPPERCUT_HITS = 6;
export const COMPANION_UPPERCUT_HIT_RATIO = 0.65;
export const COMPANION_UPPERCUT_GAP_MS = 140;
// 셰프기니 불맛: crit chance while the window runs.
export const COMPANION_CHEF_CRIT_BONUS = 30;
// 셰프기니는 이미 OUTFIT_SURE_DROPS로 모든 드롭이 상시 확정이라 "드롭 1회 보장"은 의미가 없어서,
// 대신 그 3초 동안 드롭 2배(곱) 확률을 올려준다.
export const COMPANION_CHEF_DROP_DOUBLE_BONUS = 25;
// 구미호 가속 코어: shaved straight off the equipped skill's cooldown, once.
export const COMPANION_REDUCE_COOLDOWN_MS = 3_000;
// 모험기니 든든한 한 끼: food-buff-derived numbers (not the outfit's own bonus) run this much
// stronger while the window's up.
export const COMPANION_FOOD_BOOST_MULTIPLIER = 1.5;

export const COMPANION_SKILL_NAMES: Record<Outfit, string> = {
  default: "든든한 한 끼",
  explorerHamster: "보물 탐지",
  tetoGini: "전력 질주",
  assassinGini: "암습",
  egenGini: "가속 코어",
  samuraiGini: "거합",
  chefGini: "불맛",
  witchGini: "마력 폭발",
  cowboyGini: "연속 사격",
  boxerGini: "어퍼컷",
  transparentGini: "사라지기",
  nurseGini: "응급처치",
  archerGini: "조준 사격",
  detectiveGini: "탐문",
  plainGini: "그냥 있기",
  knightGini: "방패 태세",
  sageGini: "주문 영창",
};

// SkillCallout colors — same theme color as each companion's own icon border (companions.ts
// generation prompts), so the banner reads as "that companion's own color" at a glance.
export const COMPANION_SKILL_CALLOUT_COLOR: Record<Outfit, { color: string; strokeColor: string }> = {
  default: { color: "#ffb866", strokeColor: "#5a2a00" },
  explorerHamster: { color: "#ffe07a", strokeColor: "#5a4a00" },
  tetoGini: { color: "#7af0ff", strokeColor: "#063a40" },
  assassinGini: { color: "#c9a0ff", strokeColor: "#2a1040" },
  egenGini: { color: "#8ac4ff", strokeColor: "#0a2a4a" },
  samuraiGini: { color: "#ff6b5a", strokeColor: "#4a0a06" },
  chefGini: { color: "#ff9a4a", strokeColor: "#4a1a00" },
  witchGini: { color: "#d6a0ff", strokeColor: "#2a0a40" },
  cowboyGini: { color: "#e0a868", strokeColor: "#3a2000" },
  boxerGini: { color: "#ff7a6a", strokeColor: "#4a0a06" },
  transparentGini: { color: "#eaf6f4", strokeColor: "#39504c" },
  nurseGini: { color: "#ffd9e6", strokeColor: "#5a1a30" },
  archerGini: { color: "#d8f0a0", strokeColor: "#2a4a0a" },
  detectiveGini: { color: "#e0c090", strokeColor: "#4a3010" },
  plainGini: { color: "#fff3d6", strokeColor: "#6b5a30" },
  knightGini: { color: "#dce4f0", strokeColor: "#2a3a5a" },
  sageGini: { color: "#f3d9d9", strokeColor: "#5a1a1a" },
};

export const COMPANION_SKILL_SUMMARIES: Record<Outfit, string> = {
  default: `${COMPANION_SKILL_WINDOW_MS / 1000}초간 음식 버프 효과 +${Math.round((COMPANION_FOOD_BOOST_MULTIPLIER - 1) * 100)}%`,
  explorerHamster: "다음 처치 1회 골드 2배 (보스 제외)",
  tetoGini: `${COMPANION_SKILL_WINDOW_MS / 1000}초간 헛스윙 확률 0%`,
  assassinGini: "다음 공격 무조건 치명타 + 1타 추가",
  egenGini: `장착 스킬 쿨타임 ${COMPANION_REDUCE_COOLDOWN_MS / 1000}초 차감`,
  samuraiGini: `즉시 베기 1회, 평타의 ${COMPANION_IAIDO_MULTIPLIER}배 피해`,
  chefGini: `${COMPANION_SKILL_WINDOW_MS / 1000}초간 치명타 확률 +${COMPANION_CHEF_CRIT_BONUS}%p, 드롭 2배 확률 +${COMPANION_CHEF_DROP_DOUBLE_BONUS}%p`,
  witchGini: "즉시 마법 공격 1회, 치명타로 적용",
  cowboyGini: `${COMPANION_SKILL_WINDOW_MS / 1000}초간 재장전 없이 연속 발사`,
  boxerGini: `즉시 강타 ${COMPANION_UPPERCUT_HITS}회 (각 평타의 ${Math.round(COMPANION_UPPERCUT_HIT_RATIO * 100)}%)`,
  // 즉시 스킵(OUTFIT_NO_ATTACK 패시브의 수동 버전) — 보스전엔 효과 없음, castCompanionSkill 참고.
  transparentGini: "지금 상대 중인 몹/중간보스를 즉시 지나침 (보스는 효과 없음)",
  // 기니상자 전용 동료 3종 — 아직 전용 스킬 없음, castCompanionSkill의 switch에도 케이스 없음
  // (쿨다운만 돌고 실제 효과 없음). 사용자가 추후 직접 설계 예정.
  nurseGini: "...아무 일도 일어나지 않는다",
  archerGini: "...아무 일도 일어나지 않는다",
  detectiveGini: "...아무 일도 일어나지 않는다",
  plainGini: "...아무 일도 일어나지 않는다",
  knightGini: "...아무 일도 일어나지 않는다",
  sageGini: "...아무 일도 일어나지 않는다",
};
