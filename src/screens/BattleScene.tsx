import { useEffect, useRef, useState, type ReactNode } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, Easing } from "react-native-reanimated";
import { colors, fonts } from "../theme";
import { apprenticeSprite, effects, icons, images, FRAME_SIZE, uiImages } from "../assets";
import { StrokedText } from "../components/StrokedText";
import { MOTE_PRESETS, RisingMotes, type MotePreset } from "../components/RisingMotes";
import { CharacterSprite } from "../components/CharacterSprite";
import { EnemySprite } from "../components/EnemySprite";
import { SpriteStrip } from "../components/SpriteStrip";
import { DamageNumber } from "../components/DamageNumber";
import { CoinPopup } from "../components/CoinPopup";
import { GoldFly } from "../components/GoldFly";
import { StageAdvanceBanner } from "../components/StageAdvanceBanner";
import { BossFleeBanner } from "../components/BossFleeBanner";
import { BossEntranceBanner } from "../components/BossEntranceBanner";
import { WITCH_SPELL_LIFE_MS, WITCH_TRAVEL_MS, WitchSpell } from "../components/WitchSpell";
import { playSfx } from "../sound";
import { playHaptic } from "../haptics";
import { formatGameNumber } from "../state/gameMath";
import { LevelUpBurst } from "../components/LevelUpBurst";
import { ProgressBar } from "../components/ProgressBar";
import { SKILL_SLOT_HEIGHT } from "../components/SkillSlot";
import { EXECUTE_TIMING, ExecuteEffect } from "../components/ExecuteEffect";
import { BeamEffect } from "../components/BeamEffect";
import { BossReviveEffect, BossSkillCastEffect } from "../components/BossSkillEffect";
import type { BossSkill } from "../state/bossSkills";
import { BEAM_TIMING, CARROT_THROW_HIT_MS, CHILI_THROW_HIT_MS, getSkill, METEOR_HIT_MS } from "../state/skills";
import {
  BarrageCastEffect,
  BuffVignette,
  CarrotThrowEffect,
  ChiliThrowEffect,
  MeteorStrikeEffect,
  FocusAura,
  FocusCastEffect,
  ShoutCastEffect,
  ShoutDebuff,
  StealAura,
  StealCastEffect,
  StealCoins,
  TELEPORT_PAD_MS,
  TeleportCastEffect,
} from "../components/SkillAuras";
import { DropItem } from "../components/DropItem";
import { MonsterSpeechBubble } from "../components/MonsterSpeechBubble";
import { BOSS_NAME, ENEMY_NAME, STAGE_KILL_TARGET } from "../state/stages";
import { t as tr } from "../i18n";
import { SHARDS_PER_BOSS } from "../state/progression";
import { BOSS_LINES, MOB_LINES } from "../state/monsterLines";
import { OUTFIT_NAMES } from "../state/buffs";
import { ITEM_IMAGES } from "../state/recipes";
import { UNLOCK_TOAST_MS, type DropEvent } from "../state/useGameState";
import { getUnlocksAtLevel } from "../state/unlocks";
import { tutorialRef } from "../components/tutorialTargets";
import { MENU_ICON_BOX, MENU_LEFT, MENU_SIDE } from "../components/BattleMenu";
import { BUFF_SLOT_SIZE } from "../components/BuffSlots";
import { ARROW_H, ARROW_W, GuideArrow } from "../components/GuideArrow";
import { COMPANION_SKILL_CALLOUT_COLOR, COMPANION_SKILL_NAMES } from "../state/companionSkills";
import { SkillCallout } from "../components/SkillCallout";
import { FlyingCoin } from "../components/FlyingCoin";
import { IconCaption } from "../components/IconCaption";
import type { BattlePhase, EnemyAnimation, EnemyKind, Outfit, PlayerAnimation } from "../types";

// Each boss art source fills a different fraction of its 160px frame (the original
// boss-slime asset nearly fills it edge to edge; the mushroom/potato ones were cropped
// with more headroom), so a flat displaySize makes them wildly inconsistent in size —
// scale each down to read as roughly the same on-screen height.
const BOSS_SIZE: Record<EnemyKind, number> = {
  slime: 128,
  mushroom: 158,
  carrot: 180,
  chicken: 165,
  potato: 165,
  mouse: 175,
  cauldron: 170,
  mudskipper: 175,
  bluefish: 180,
  salamander: 170,
  monkey: 170,
  carp: 175,
  cactus: 150,
  fox: 150,
  lizard: 160,
  mantou: 160,
  pig: 160,
  magpie: 160,
  snowRabbit: 160,
  drunkCat: 160,
  dokkaebiFire: 160,
  riceSack: 160,
  mackerel: 160,
  blossomCrab: 160,
  shrineFox: 160,
  armorBeetle: 160,
  onsenMonkey: 160,
  ninjaFrog: 160,
  lanternAngler: 160,
  clamMaid: 160,
  gondolaDuck: 160,
  bellCalf: 160,
  croissantKid: 160,
  sleepyGini: 160,
  sleepwalkerGini: 160,
  candyBasketSlime: 180,
  bee: 152,
  angryCandyBasketSlime: 170,
  thiefCrow: 180,
  spiceElephant: 160,
  teaYak: 168,
  saffronParrot: 176,
  coconutCrab: 176,
  paddyDuck: 180,
  hulaPineapple: 180,
  prairieDog: 180,
  pinataDonkey: 176,
  cacaoSloth: 176,
  grapeSnail: 176,
  llamaCook: 184,
};

// Regular mobs render at a flat 108px by default; override here for the rare mob whose
// art reads too small or large at that size (same idea as BOSS_SIZE, just sparse since
// most mobs look fine at the default).
const MOB_SIZE: Partial<Record<EnemyKind, number>> = {
  pig: 140,
  // Its frames also hold its fox-fires and fanned tails, so the fox itself reads small.
  shrineFox: 140,
  candyBasketSlime: 125,
  bee: 110,
  angryCandyBasketSlime: 125,
  thiefCrow: 120,
};

// What drifts through each stage's scene, to suit its place: snow on the snowy stages, petals
// in the blossom ones, embers on the volcano, bubbles under the sea, fireflies at night.
const AMBIENCE: Record<EnemyKind, MotePreset> = {
  slime: "dust",
  mushroom: "spores",
  carrot: "dust",
  chicken: "dust",
  potato: "spores",
  mouse: "dust",
  cauldron: "dust",
  mudskipper: "sand",
  bluefish: "bubbles",
  salamander: "embers",
  monkey: "leaves",
  carp: "sand",
  cactus: "sand",
  fox: "sand",
  lizard: "fireflies",
  mantou: "dust",
  pig: "fireflies",
  snowRabbit: "snow",
  magpie: "snow",
  drunkCat: "snow",
  dokkaebiFire: "fireflies",
  riceSack: "dust",
  mackerel: "dust",
  blossomCrab: "petals",
  shrineFox: "fireflies",
  armorBeetle: "petals",
  onsenMonkey: "snow",
  ninjaFrog: "leaves",
  lanternAngler: "bubbles",
  clamMaid: "bubbles",
  gondolaDuck: "dust",
  bellCalf: "dust",
  croissantKid: "dust",
  sleepyGini: "dust",
  sleepwalkerGini: "magic",
  candyBasketSlime: "fireflies",
  bee: "honey",
  angryCandyBasketSlime: "dust",
  thiefCrow: "embers",
  spiceElephant: "dust",
  teaYak: "leaves",
  saffronParrot: "petals",
  coconutCrab: "petals",
  paddyDuck: "petals",
  hulaPineapple: "embers",
  prairieDog: "dust",
  pinataDonkey: "petals",
  cacaoSloth: "fireflies",
  grapeSnail: "leaves",
  llamaCook: "magic",
};

// 카우보이기니's muzzle flash display size (the pixelfx strip is 72px).
const MUZZLE_SIZE = 60;
// Length of the bright head of 카우보이기니's bullet tracer.
const TRACER_STREAK = 34;
// 카우보이기니's attack/critical strips: holster, draw, fire, smoke — the fire frame's index,
// and when it shows in the 230ms strip (CharacterSprite DURATIONS.attack, 3 steps).
const COWBOY_FIRE_FRAME = 2;
const COWBOY_FIRE_FRAME_MS = Math.round((230 / 3) * COWBOY_FIRE_FRAME);

const BACKGROUND: Record<EnemyKind, number> = {
  slime: images.battleBackground,
  mushroom: images.battleBackgroundMushroom,
  carrot: images.battleBackgroundFarm,
  chicken: images.battleBackgroundChicken,
  potato: images.battleBackgroundPotatoCave,
  mouse: images.battleBackgroundVillage,
  cauldron: images.battleBackgroundMansionKitchen,
  mudskipper: images.battleBackgroundHarborBeach,
  bluefish: images.battleBackgroundSunkenReef,
  salamander: images.battleBackgroundVolcanoIsland,
  monkey: images.battleBackgroundTropicalJungle,
  carp: images.battleBackgroundOasis,
  cactus: images.battleBackgroundDesert,
  fox: images.battleBackgroundDesertMarket,
  lizard: images.battleBackgroundSilkRoadNight,
  mantou: images.battleBackgroundBambooCloudCity,
  pig: images.battleBackgroundBambooCloudPalace,
  magpie: images.battleBackgroundSnowVillage,
  snowRabbit: images.battleBackgroundSnowMountain,
  drunkCat: images.battleBackgroundSnowTavern,
  dokkaebiFire: images.battleBackgroundMoonlitHill,
  riceSack: images.battleBackgroundJoseonMarket,
  mackerel: images.battleBackgroundFishingPort,
  blossomCrab: images.battleBackgroundBlossomBeach,
  shrineFox: images.battleBackgroundFoxShrine,
  armorBeetle: images.battleBackgroundCastleKeep,
  onsenMonkey: images.battleBackgroundHotSpring,
  ninjaFrog: images.battleBackgroundNinjaVillage,
  lanternAngler: images.battleBackgroundDragonSeaRoad,
  clamMaid: images.battleBackgroundDragonPalace,
  gondolaDuck: images.battleBackgroundCanalCity,
  bellCalf: images.battleBackgroundAlpineVillage,
  croissantKid: images.battleBackgroundBakeryStreet,
  sleepyGini: images.battleBackgroundGiniMetropolis,
  sleepwalkerGini: images.battleBackgroundSuspiciousHouse,
  candyBasketSlime: images.battleBackgroundPumpkinForest,
  bee: images.battleBackgroundHoneyTrail,
  angryCandyBasketSlime: images.battleBackgroundGiniMetropolis,
  thiefCrow: images.battleBackgroundRuinedCitadel,
  spiceElephant: images.battleBackgroundSpiceBazaar,
  teaYak: images.battleBackgroundHimalayaTea,
  saffronParrot: images.battleBackgroundMughalGarden,
  coconutCrab: images.battleBackgroundFloatingMarket,
  paddyDuck: images.battleBackgroundBaliTerraces,
  hulaPineapple: images.battleBackgroundHawaiiBeach,
  prairieDog: images.battleBackgroundTexasCanyon,
  pinataDonkey: images.battleBackgroundTacoFiesta,
  cacaoSloth: images.battleBackgroundCacaoJungle,
  grapeSnail: images.battleBackgroundAndesVineyard,
  llamaCook: images.battleBackgroundSkyCity,
};

// Scene geometry the drop animation needs, measured from the sky's bottom-right corner.
// Keep in sync with styles.fighters (right/bottom) and the bottom-right button row.
const FIGHTERS_BOTTOM = 55;
const FIGHTERS_SIDE = 15;
const SKY_HEIGHT = 260;
// How much bigger a mid-boss is drawn than its regular mob.
const MINI_BOSS_SIZE = 1.3;
// How far the boss entrance close-up pushes in (first meeting / a boss beaten before).
const CLOSE_UP_ZOOM = 1.6;
const CLOSE_UP_ZOOM_REPEAT = 1.25;
const STEAL_DURATION = getSkill("steal").durationMs ?? 0;
const FOCUS_DURATION = getSkill("focus").durationMs ?? 0;
const BARRAGE_DURATION = getSkill("barrage").durationMs ?? 0;
const SHOUT_DURATION = getSkill("shout").durationMs ?? 0;
// A boss always gets a speech bubble on entrance (it's the stage's big moment); a regular
// mob only some of the time, or the fast auto-battle kill-chain would pop a bubble over
// every single death.
const MOB_SPEECH_CHANCE = 0.45;

// 연속 처치: a running count of regular-mob kills (a boss or mid-boss resets it — those get
// their own toast already) since this scene last mounted. A banner pops only at these
// widening milestones, then every KILL_STREAK_REPEAT past the last one — showing it on every
// single kill would just be noise during fast auto-battle.
const KILL_STREAK_MILESTONES = [5, 10, 20, 35, 50, 75, 100, 150, 200, 300, 500];
const KILL_STREAK_REPEAT = 250;
function isKillStreakMilestone(count: number) {
  const last = KILL_STREAK_MILESTONES[KILL_STREAK_MILESTONES.length - 1];
  return KILL_STREAK_MILESTONES.includes(count) || (count > last && (count - last) % KILL_STREAK_REPEAT === 0);
}

// Turns a skill's ever-increasing cast counter into what the scene should play:
// - `id` is 0 for casts from before this scene mounted (e.g. before visiting another
//   tab), so coming back doesn't replay their effects;
// - `active` is true from a fresh cast until `durationMs` later (flipped on during
//   render so it lands in the same frame as the cast, and off by a timer).
function useSkillEvent(rawId: number, durationMs: number) {
  const [mountedId] = useState(rawId);
  const id = rawId === mountedId ? 0 : rawId;
  const [seenId, setSeenId] = useState(id);
  const [active, setActive] = useState(false);
  if (id !== seenId) {
    setSeenId(id);
    setActive(id > 0 && durationMs > 0);
  }
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), durationMs);
    return () => clearTimeout(timer);
  }, [active, id, durationMs]);
  return { id, active };
}
const CHARACTER_WIDTH = 108;
const ENEMY_CENTER_RIGHT = 15 + 108 / 2;
const GROUND_BOTTOM = 68;
// Bottom row inside the scene: the skill slot on the left, the food slots on the right.
const ICON_BOX = { width: 52, height: 44 };
const ROW_RIGHT = 8;
const ROW_BOTTOM = 6;
// Loot flies down out of the scene's bottom edge toward the bag button in the battle row
// below (BattleActionsPanel), lined up over where that button sits.
// (The scene runs edge to edge; the menu row sits in from the screen edge by MENU_SIDE.)
const BAG_CENTER_LEFT = MENU_SIDE + MENU_LEFT + MENU_ICON_BOX.width / 2;

export function BattleScene({
  critical,
  damageEvents,
  enemyHp,
  enemyMaxHp,
  boss,
  miniBoss = false,
  bossEnraged = false,
  miniBossDefeated = false,
  golden = false,
  goldenReward = null,
  bossReward = null,
  enemyKind,
  foeKind,
  phase,
  enemyId,
  lastGoldReward,
  reloadInfo = { endsAt: 0, totalMs: 0 },
  shotId = 0,
  fannedShot = false,
  stageAdvance,
  onContinueStage,
  battleSpeed = 1,
  stageLabel,
  stageKills,
  onOpenMap,
  outfit,
  apprenticeActive = false,
  apprenticeAttackId = 0,
  apprenticeAttackKind = "slam",
  apprenticeAttackHitMs = 500,
  apprenticeUnlocked = false,
  apprenticeHidden = false,
  onToggleApprentice,
  manualEnabled,
  autoBattle = true,
  onManualAttack,
  foodBar,
  onCatchFlyingCoin,
  flyingGemsLeft = 0,
  giftKills = 0,
  heldLoot = null,
  skillBar,
  goldEvents,
  executeId: rawExecuteId,
  firstStrikeId: rawFirstStrikeId,
  companionSkillCastId: rawCompanionSkillCastId = 0,
  executedKill,
  beamId: rawBeamId,
  stealId: rawStealId,
  focusId: rawFocusId,
  barrageId: rawBarrageId,
  teleportId: rawTeleportId,
  shoutId: rawShoutId,
  carrotThrowId: rawCarrotThrowId,
  chiliThrowId: rawChiliThrowId,
  meteorStrikeId: rawMeteorStrikeId = 0,
  dropEvents,
  bossEntranceKey,
  bossFirstMeet = false,
  onBeginBoss,
  onWatchBossBuffAd,
  bossBuffActive = false,
  bossBuffPercent = 0,
  levelUpAnnouncement,
  now,
  bossTimerStartedAt,
  bossTimeLimitMs,
  bossFledKey: rawBossFledKey,
  bossSkillCastId: rawBossSkillCastId,
  bossSkillConfig,
  bossReviveId: rawBossReviveId,
  preview = false,
}: {
  critical: boolean;
  damageEvents: { id: number; amount: number; critical: boolean; missed?: boolean }[];
  enemyHp: number;
  enemyMaxHp: number;
  boss: boolean;
  // An enraged mid-boss: the stage's mob drawn bigger and red, with a rage aura.
  miniBoss?: boolean;
  // The boss is on its enraged second life.
  bossEnraged?: boolean;
  // Whether the enemy now dying is a mid-boss (for its defeat burst).
  miniBossDefeated?: boolean;
  // The mid-boss is a rare golden one, and what the last golden one paid (for its toast).
  golden?: boolean;
  goldenReward?: { id: number; gold: number; gems: number } | null;
  // What the last boss cleared paid beyond its drops (for its toast).
  bossReward?: { id: number; stars: number; gems: number; companion: string | null } | null;
  enemyKind: EnemyKind;
  // The regular mob actually on screen, when it's not the stage's own (a stray from the stage
  // before); the stage's look (backdrop, ambience, boss) still follows `enemyKind`.
  foeKind?: EnemyKind;
  phase: BattlePhase;
  enemyId: number;
  lastGoldReward: number;
  // 카우보이기니's reload (see useAutoBattle's reloadInfo): drawn as a yellow bar over the
  // nameplate, with the hat-tip "win" pose while it runs.
  reloadInfo?: { endsAt: number; totalMs: number };
  // Bumped per gunshot, for the muzzle flash.
  shotId?: number;
  // The latest shot was a fan-the-hammer round (gun already out — no draw).
  fannedShot?: boolean;
  stageAdvance: string | null;
  // Tapping the stage-clear banner moves on (battle waits until then).
  onContinueStage?: () => void;
  // How fast the fight runs (2x boost and attack-speed buffs) — paces 마녀기니's bolts.
  battleSpeed?: number;
  stageLabel: string;
  stageKills: number;
  onOpenMap: () => void;
  outfit: Outfit;
  // From the second loop on (loopsCompleted >= 1): 견습기니 wanders the scene (see ApprenticeFollower).
  // Already false whenever the player has toggled it off (apprenticeHidden) — BattleScreen ANDs
  // that into this before it ever reaches here.
  apprenticeActive?: boolean;
  // Bumped each time it attacks on its own clock (see useAutoBattle's own fields of the same name).
  apprenticeAttackId?: number;
  apprenticeAttackKind?: "slam" | "beam";
  apprenticeAttackHitMs?: number;
  // Whether the toggle button itself should show at all (independent of apprenticeActive, which
  // also goes false while hidden) — true once loopsCompleted >= 1, same gate apprenticeActive
  // used before the hide toggle existed.
  apprenticeUnlocked?: boolean;
  apprenticeHidden?: boolean;
  onToggleApprentice?: () => void;
  manualEnabled: boolean;
  // Auto battle on (green dot by the stage name) or hand-fighting during 난타 (orange).
  autoBattle?: boolean;
  onManualAttack: () => void;
  // The food buff slots, pinned to the scene's bottom-right corner.
  foodBar?: ReactNode;
  onCatchFlyingCoin: (kind: "coin" | "gem", watchAd?: boolean) => { gold: number; gems: number };
  // Winged-gem ads left today — none left, and only coins fly.
  flyingGemsLeft?: number;
  // One-hit kills left on the post-intro gift (shown as a banner while any remain).
  giftKills?: number;
  // The first gift kill's loot, frozen on the ground for the tutorial to explain.
  heldLoot?: { gold: number; items: { name: string; quantity: number }[]; stage: "gold" | "goldFlying" | "items" | "itemsFlying" } | null;
  skillBar: ReactNode;
  // Gold scattered by the Steal skill, one popup per hit.
  goldEvents: { id: number; amount: number }[];
  // Bumped each time Execute finishes an enemy (0 = never) — plays the teleport-slash.
  executeId: number;
  // 사무라이기니's first-strike draws — each plays the execute slash, without the dash.
  firstStrikeId: number;
  // Bumped on every companion skill cast (companionSkills.ts), any outfit — plays its name
  // as a SkillCallout banner, same as every equipped active skill already does.
  companionSkillCastId?: number;
  // The kill now playing out was an Execute — crit pose instead of the win pose.
  executedKill: boolean;
  // Bumped on each cast of that skill (0 = never).
  beamId: number;
  stealId: number;
  focusId: number;
  barrageId: number;
  teleportId: number;
  shoutId: number;
  carrotThrowId: number;
  chiliThrowId: number;
  // Bumped per falling 운석 낙하 meteor (the cast's, then one per mob of the shower).
  meteorStrikeId?: number;
  dropEvents: DropEvent[];
  // Set while a freshly spawned boss waits to be tapped (useGameState's bossIntroPending).
  bossEntranceKey: string | null;
  // A boss never beaten before: the entrance close-up pushes in further, with a thump.
  bossFirstMeet?: boolean;
  onBeginBoss: () => void;
  // The boss entrance banner's ad-for-attack-buff offer — omitted entirely to hide the button.
  onWatchBossBuffAd?: () => void;
  bossBuffActive?: boolean;
  bossBuffPercent?: number;
  levelUpAnnouncement: number | null;
  // Live clock + the current boss fight's deadline (see useGameState's bossTimerStartedAt)
  // — only meaningful while `boss` is true; null/0 otherwise.
  now: number;
  bossTimerStartedAt: number | null;
  bossTimeLimitMs: number;
  // Bumped each time the boss flees (timer ran out) — mount BossFleeBanner fresh off it.
  bossFledKey: number;
  // A boss using its own skill (src/state/bossSkills.ts) — bossSkillConfig is only
  // meaningful the instant bossSkillCastId bumps, same pattern as the player's own skills.
  bossSkillCastId: number;
  bossSkillConfig: BossSkill | null;
  // Bumped each time the boss (the lizard only — see bossSkills.ts) comes back from the
  // dead instead of dying.
  bossReviveId: number;
  // SkillPreviewModal's stand-in fight: just the backdrop, fighters and VFX — no stage bar,
  // quest/bag/kitchen/map buttons, skill slot or flying coin.
  preview?: boolean;
}) {
  // Boss fight countdown — 0/100 whenever there's no active timer (not a boss fight, or
  // the timer hasn't started yet) so the nameplate's bar below just doesn't render it.
  // Before the tap that starts the fight, show the full window it's about to get.
  const bossTimeRemainingMs = !boss ? 0 : bossTimerStartedAt === null ? (bossEntranceKey ? bossTimeLimitMs : 0) : Math.max(0, bossTimeLimitMs - (now - bossTimerStartedAt));
  const bossTimeProgress = boss && bossTimeLimitMs > 0 ? (bossTimeRemainingMs / bossTimeLimitMs) * 100 : 0;
  const bossSecondsLeft = Math.ceil(bossTimeRemainingMs / 1000);

  // 연속 처치: bumps on every fresh transition into "defeated" for a regular mob (not a
  // boss/mid-boss — see KILL_STREAK_MILESTONES above), popping a banner only at a milestone.
  const killStreakRef = useRef(0);
  const wasDefeatedRef = useRef(phase === "defeated");
  const [streakMilestone, setStreakMilestone] = useState<{ id: number; count: number } | null>(null);
  useEffect(() => {
    if (boss || miniBoss) {
      killStreakRef.current = 0;
    } else if (phase === "defeated" && !wasDefeatedRef.current) {
      const count = (killStreakRef.current += 1);
      if (isKillStreakMilestone(count)) {
        setStreakMilestone({ id: count, count });
        playHaptic("streak");
      }
    }
    wasDefeatedRef.current = phase === "defeated";
  }, [phase, boss, miniBoss]);

  const { id: executeId } = useSkillEvent(rawExecuteId, 0);
  const { id: firstStrikeId } = useSkillEvent(rawFirstStrikeId, 0);
  const { id: companionSkillCastId } = useSkillEvent(rawCompanionSkillCastId, 0);
  // Every cast/event id below is run through useSkillEvent so a tab switch (BattleScreen's
  // ScrollView is keyed by selectedTab — see GameScreen — so this whole component unmounts
  // and remounts on every visit) can't replay something that already happened before this
  // mount: without it, an id/key that's just a raw "> 0" check (no baseline-at-mount to
  // ignore) looks identical on a fresh mount to one that just fired for real.
  const { id: bossFledKey } = useSkillEvent(rawBossFledKey, 0);
  const { id: bossSkillCastId } = useSkillEvent(rawBossSkillCastId, 0);
  const { id: bossReviveId } = useSkillEvent(rawBossReviveId, 0);
  // Guinea Beam holds a crit pose from the cast until the beam has faded.
  const { id: beamId, active: beaming } = useSkillEvent(rawBeamId, BEAM_TIMING.end);
  const steal = useSkillEvent(rawStealId, STEAL_DURATION);
  const focus = useSkillEvent(rawFocusId, FOCUS_DURATION);
  const barrage = useSkillEvent(rawBarrageId, BARRAGE_DURATION);
  const shout = useSkillEvent(rawShoutId, SHOUT_DURATION);
  const { id: carrotThrowId } = useSkillEvent(rawCarrotThrowId, CARROT_THROW_HIT_MS);
  const { id: chiliThrowId } = useSkillEvent(rawChiliThrowId, CHILI_THROW_HIT_MS);
  const { id: meteorStrikeId } = useSkillEvent(rawMeteorStrikeId, METEOR_HIT_MS);
  // Teleport doesn't move the player or swing anything — it just holds them on their
  // existing "win" pose (see playerAnimation below) while TeleportCastEffect sells the
  // instant enemy swap underneath them.
  const { id: teleportId, active: teleporting } = useSkillEvent(rawTeleportId, TELEPORT_PAD_MS);
  // Every timed buff skill shares one vignette element; only one skill is ever equipped.
  const buffVignette = steal.active
    ? { key: `steal-${steal.id}`, durationMs: STEAL_DURATION }
    : focus.active
      ? { key: `focus-${focus.id}`, durationMs: FOCUS_DURATION }
      : barrage.active
        ? { key: `barrage-${barrage.id}`, durationMs: BARRAGE_DURATION }
        : shout.active
          ? { key: `shout-${shout.id}`, durationMs: SHOUT_DURATION }
          : null;

  // The speech component is keyed to the displayed enemy so its line and animation start
  // with that sprite, and it lives inside the fighters group so it follows the same motion.
  const executing = phase === "defeated" && executedKill;
  const reloadingGun = outfit === "cowboyGini" && reloadInfo.endsAt > 0 && phase === "idle";
  const playerAnimation: PlayerAnimation =
    reloadingGun
      ? "win"
      : teleporting
      ? "win"
      : executing || beaming
        ? "critical"
        : phase === "attacking"
          ? critical ? "critical" : "attack"
          : phase === "hit" && critical
            ? "critical"
            : phase === "defeated"
              ? "win"
              : "idle";
  // A skill pose pins the guinea pig in place and always restarts its strip, even if the
  // swing before it was already a crit.
  const skillPoseKey = executing
    ? `execute-${executeId}`
    : beaming
      ? `beam-${beamId}`
      : teleporting
        ? `teleport-${teleportId}`
        : null;

  // 마녀기니 casts instead of swinging: one WitchSpell per attack, dropped once it's played out.
  const isWitch = outfit === "witchGini";
  const [witchSpells, setWitchSpells] = useState<{ id: number; critical: boolean }[]>([]);
  const witchSpellId = useRef(0);
  useEffect(() => {
    if (!isWitch || phase !== "attacking" || skillPoseKey) return;
    const id = ++witchSpellId.current;
    // Deferred out of the effect body (react-hooks/set-state-in-effect).
    const add = setTimeout(() => setWitchSpells((spells) => [...spells, { id, critical }]), 0);
    // Not cleared on cleanup: `phase` moving on to "hit" runs it, and the spell must keep
    // playing (and still be dropped) after that.
    setTimeout(() => setWitchSpells((spells) => spells.filter((spell) => spell.id !== id)), WITCH_SPELL_LIFE_MS);
    return () => clearTimeout(add);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isWitch]);

  const enemyAnimation: EnemyAnimation =
    phase === "hit" ? "hit" : phase === "defeated" ? "die" : "idle";
  const fighterKind = boss ? enemyKind : (foeKind ?? enemyKind);
  // A mob wandered over from the stage before: named and talking like one that's lost.
  const stray = !boss && !miniBoss && fighterKind !== enemyKind;
  const enemySize = boss ? BOSS_SIZE[enemyKind] : (MOB_SIZE[fighterKind] ?? 108) * (miniBoss ? MINI_BOSS_SIZE : 1);
  // Sits just past the enemy's left edge at roughly its mid-height, scaling with its own
  // size (the sprite is always centred on ENEMY_CENTER_RIGHT regardless of how wide it
  // renders, so half its size is exactly the gap to clear it) — works the same for a
  // compact mob or a sprawling boss without the bubble ever overlapping the sprite.
  // Drops pop out of the enemy's middle and fly into the bag button's centre.
  const dropFrom = { right: ENEMY_CENTER_RIGHT, bottom: FIGHTERS_BOTTOM + enemySize * 0.45 };
  const stageProgress = (Math.min(stageKills, STAGE_KILL_TARGET) / STAGE_KILL_TARGET) * 100;

  // Finishing-blow punch: a quick zoom on both fighters, on every kill (not just
  // bosses) — re-fires each time `phase` cycles back to "defeated".
  const killPunch = useSharedValue(1);
  useEffect(() => {
    if (phase !== "defeated") return;
    killPunch.value = withSequence(
      withTiming(1.07, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  const sceneShake = useSharedValue(0);
  // A mid-boss arriving: a thud and a hard shake of the scene.
  const miniShake = useSharedValue(0);
  const wasMiniBoss = useRef(miniBoss);
  useEffect(() => {
    const arrived = miniBoss && !wasMiniBoss.current;
    wasMiniBoss.current = miniBoss;
    if (!arrived || preview) return;
    playSfx("bossEnter", 0.8);
    miniShake.value = withSequence(
      withTiming(10, { duration: 40 }),
      withTiming(-9, { duration: 50 }),
      withTiming(7, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(3, { duration: 50 }),
      withTiming(0, { duration: 60 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miniBoss]);
  useEffect(() => {
    if (beamId === 0) return;
    sceneShake.value = withDelay(
      BEAM_TIMING.hit,
      withSequence(
        withTiming(7, { duration: 35 }),
        withTiming(-6, { duration: 45 }),
        withTiming(5, { duration: 45 }),
        withTiming(-3, { duration: 45 }),
        withTiming(0, { duration: 45 }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beamId]);
  const killPunchStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sceneShake.value + miniShake.value }, { translateY: (sceneShake.value + miniShake.value) * -0.4 }, { scale: killPunch.value }],
  }));
  // Flying gold coins only for the fresh kill this render reflects (new enemyId + reward).
  const goldFlyFrom = { right: ENEMY_CENTER_RIGHT, bottom: FIGHTERS_BOTTOM + enemySize * 0.6 };

  // Execute: the guinea pig blinks across to just in front of the enemy and back. The
  // fighters row is measured since the gap between the two depends on screen width.
  const [fightersWidth, setFightersWidth] = useState(0);
  const dropTo = { dx: ENEMY_CENTER_RIGHT - (fightersWidth + FIGHTERS_SIDE * 2 - BAG_CENTER_LEFT), dy: dropFrom.bottom + 24 };
  const playerCenterLeft = FIGHTERS_SIDE + CHARACTER_WIDTH / 2;
  const enemyCenterLeft = FIGHTERS_SIDE + fightersWidth - CHARACTER_WIDTH / 2;
  const arrivalCenterLeft = Math.max(playerCenterLeft, enemyCenterLeft - enemySize * 0.5 - 22);
  const teleportX = arrivalCenterLeft - playerCenterLeft;
  const bodyBottom = FIGHTERS_BOTTOM + 45;

  // Boss entrance close-up: while the entrance banner waits for its tap, the camera (the
  // backdrop and the fighters — not the HUD or banners) pushes in on the boss's face, which
  // lands right of centre beside the banner's copy; the tap pulls it back out. A boss met
  // for the first time gets the full push and a thump, a repeat one just a quick nudge.
  const closeUp = bossEntranceKey !== null;
  const cam = useSharedValue(0);
  const camZoom = useSharedValue(CLOSE_UP_ZOOM);
  const camShake = useSharedValue(0);
  useEffect(() => {
    if (closeUp) {
      camZoom.value = bossFirstMeet ? CLOSE_UP_ZOOM : CLOSE_UP_ZOOM_REPEAT;
      cam.value = withTiming(1, { duration: bossFirstMeet ? 450 : 260, easing: Easing.out(Easing.cubic) });
      if (bossFirstMeet) {
        camShake.value = withDelay(
          380,
          withSequence(withTiming(1, { duration: 40 }), withTiming(-0.8, { duration: 50 }), withTiming(0.5, { duration: 50 }), withTiming(0, { duration: 60 })),
        );
      }
    } else {
      cam.value = withTiming(0, { duration: 300, easing: Easing.inOut(Easing.quad) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeUp]);
  const skyWidth = fightersWidth + FIGHTERS_SIDE * 2;
  // The boss's face (a bit above the middle of its sprite) and where it should end up.
  const faceX = enemyCenterLeft;
  const faceY = SKY_HEIGHT - (FIGHTERS_BOTTOM + enemySize * 0.62);
  const camStyle = useAnimatedStyle(() => {
    const c = cam.value;
    const s = 1 + c * (camZoom.value - 1);
    if (skyWidth <= 0 || c === 0) return { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] };
    // Scaled from the top-left corner, so a point p lands at p * s + t. Slide the face
    // toward its target as the zoom grows, never letting the backdrop's edges show.
    const targetX = skyWidth * 0.75, targetY = SKY_HEIGHT * 0.46;
    const tx = Math.min(0, Math.max(skyWidth - skyWidth * s, faceX + c * (targetX - faceX) - faceX * s));
    const ty = Math.min(0, Math.max(SKY_HEIGHT - SKY_HEIGHT * s, faceY + c * (targetY - faceY) - faceY * s));
    return { transform: [{ translateX: tx + camShake.value * 6 }, { translateY: ty + camShake.value * -3 }, { scale: s }] };
  });
  // The guinea pig's feet: the sprite's box sits on FIGHTERS_BOTTOM, with its feet drawn a
  // little above the frame's bottom edge — ground-level effects (the teleport pad) go here.
  const feetBottom = FIGHTERS_BOTTOM + 14;

  return (
    <View style={styles.scene}>
      <Pressable onPress={manualEnabled ? onManualAttack : undefined} disabled={!manualEnabled}>
        <View style={styles.sky}>
          {/* The backdrop sits in the camera layer (see camStyle) so the boss close-up can zoom it. */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.camLayer, camStyle]} pointerEvents="none">
            <Image source={BACKGROUND[enemyKind]} resizeMode="cover" style={styles.skyImage} />
          </Animated.View>
          <LinearGradient
            colors={["#17321b1f", "#17291400", "#17291424"]}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* The stage's ambience (AMBIENCE), behind the fighters and HUD. */}
          {/* Keyed by the look so a new stage starts its own set fresh. */}
          {!preview && <RisingMotes key={AMBIENCE[enemyKind]} {...MOTE_PRESETS[AMBIENCE[enemyKind]]} />}

          {/* One vignette for every buff skill — Steal and Focus render this exact element.
              It sits right on the backdrop, under the stage bar, fighters and buttons. */}
          {buffVignette && <BuffVignette key={buffVignette.key} durationMs={buffVignette.durationMs} />}

          {!preview && (
          <LinearGradient
            colors={["#171d19e8", "#263125a8", "#26312500"]}
            locations={[0, 0.62, 1]}
            style={styles.stageBar}
            pointerEvents="box-none"
          >
            {apprenticeUnlocked && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={apprenticeHidden ? tr("견습기니 보이기", "Show the apprentice") : tr("견습기니 숨기기", "Hide the apprentice")}
                onPress={onToggleApprentice}
                hitSlop={6}
                style={({ pressed }) => [styles.apprenticeToggle, apprenticeHidden && styles.apprenticeToggleOff, pressed && styles.questPressed]}
              >
                <SpriteStrip
                  source={apprenticeSprite.idle}
                  frameSize={500}
                  frameCount={4}
                  displaySize={34}
                  durationMs={1800}
                  mode="loop"
                  tintColor={apprenticeHidden ? "#000" : undefined}
                />
                <IconCaption offset={-5}>{tr("견습기니", "Apprentice")}</IconCaption>
              </Pressable>
            )}
            <View style={styles.stageBarInfo} pointerEvents="none">
              <View style={styles.stageTitleRow}>
                <View
                  style={[styles.autoDot, { backgroundColor: autoBattle ? "#6be04f" : "#ff8a2a" }]}
                  accessibilityLabel={autoBattle ? tr("자동 전투 중", "Auto battle on") : tr("직접 공격 중", "Manual attack")}
                />
                <StrokedText style={styles.stageBarTitle} strokeColor={colors.line} strokeWidth={1.5}>
                  {stageLabel}
                </StrokedText>
              </View>
              <ProgressBar
                progress={boss ? bossTimeProgress : stageProgress}
                fill={boss ? "red" : "gold"}
                height={18}
                label={boss ? tr(`${bossSecondsLeft}초`, `${bossSecondsLeft}s`) : `${Math.min(stageKills, STAGE_KILL_TARGET)} / ${STAGE_KILL_TARGET}`}
                style={styles.stageBarTrack}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tr("마일스톤 지도 열기", "Open milestone map")}
              onPress={onOpenMap}
              hitSlop={6}
              style={({ pressed }) => [styles.questButton, pressed && styles.questPressed]}
            >
              <Image source={icons.mapTrim} style={styles.mapIcon} />
              <IconCaption offset={-5}>{tr("지도", "Map")}</IconCaption>
            </Pressable>
          </LinearGradient>
          )}

          {!preview && <FlyingCoin onCatch={onCatchFlyingCoin} gemFlights={flyingGemsLeft > 0} />}
          {!preview && apprenticeActive && (
            <ApprenticeFollower attackId={apprenticeAttackId} attackKind={apprenticeAttackKind} attackHitMs={apprenticeAttackHitMs} />
          )}
          {!preview && giftKills > 0 && (
            <View style={styles.giftBanner} pointerEvents="none">
              <StrokedText style={styles.giftText} strokeColor={colors.line} strokeWidth={2}>
                {tr(`🎁 선물 버프! 한 방에 쓰러뜨리기 × ${giftKills}`, `🎁 Gift Buff! One-Hit Kills × ${giftKills}`)}
              </StrokedText>
            </View>
          )}
          {stageAdvance && <StageAdvanceBanner key={stageAdvance} stageLabel={stageAdvance} onContinue={onContinueStage} />}
          {bossEntranceKey && (
            <BossEntranceBanner
              key={bossEntranceKey}
              bossName={BOSS_NAME[enemyKind]}
              onStart={onBeginBoss}
              onWatchAd={onWatchBossBuffAd}
              buffActive={bossBuffActive}
              buffPercent={bossBuffPercent}
            />
          )}
          {bossFledKey > 0 && <BossFleeBanner key={bossFledKey} />}
          {goldenReward && <GoldenRewardToast key={goldenReward.id} gold={goldenReward.gold} gems={goldenReward.gems} />}
          {bossReward && <BossRewardToast key={bossReward.id} stars={bossReward.stars} gems={bossReward.gems} companion={bossReward.companion} />}
          {streakMilestone && <KillStreakBanner key={streakMilestone.id} count={streakMilestone.count} />}
          {/* Same camera layer as the backdrop, so the two zoom as one picture. */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.camLayer, styles.camFighters, camStyle]} pointerEvents="box-none">
          <Animated.View
            style={[styles.fighters, killPunchStyle]}
            onLayout={(event) => setFightersWidth(event.nativeEvent.layout.width)}
          >
            <PlayerFighter
              animation={playerAnimation}
              outfit={outfit}
              boss={boss}
              executeId={executeId}
              beamId={beamId}
              skillPoseKey={skillPoseKey}
              teleportX={teleportX}
              stealAuraId={steal.active ? steal.id : 0}
              focusAuraId={focus.active ? focus.id : 0}
              reloadInfo={reloadInfo}
              shotId={shotId}
              fannedShot={fannedShot}
            />
            {levelUpAnnouncement !== null && <LevelUpBurst key={levelUpAnnouncement} level={levelUpAnnouncement} />}
            {levelUpAnnouncement !== null && <UnlockToast key={`unlock-${levelUpAnnouncement}`} level={levelUpAnnouncement} />}

            <EnemyFighter
              animation={enemyAnimation}
              boss={boss}
              miniBoss={miniBoss}
              enraged={bossEnraged}
              miniBossDefeated={miniBossDefeated}
              golden={golden}
              stray={stray}
              enemyKind={fighterKind}
              enemyId={enemyId}
              currentHp={enemyHp}
              maxHp={enemyMaxHp}
              phase={phase}
              size={enemySize}
              critical={critical}
              beamId={beamId}
              shoutDebuffId={shout.active ? shout.id : 0}
              executedKill={executedKill}
            />

            {/* Kept below the enemy nameplate (fixed at bottom: 112) so numbers never cover
                the name or HP bar — they float up over the sprite's body instead. */}
            <View style={styles.effects} pointerEvents="none">
              {damageEvents.map((event) => (
                <DamageNumber key={event.id} amount={event.amount} critical={event.critical} missed={event.missed} />
              ))}
              {phase === "defeated" && !heldLoot && <CoinPopup key={`coin-${enemyId}`} amount={lastGoldReward} />}
              {goldEvents.map((event) => (
                <CoinPopup key={`steal-${event.id}`} amount={event.amount} />
              ))}
            </View>
          </Animated.View>
          </Animated.View>

          {!preview && (
          <>
          <View style={styles.foodBar}>{foodBar}</View>

          <View style={styles.skillBar}>{skillBar}</View>
          </>
          )}

          {/* Every combat VFX below renders as a sibling of `fighters` (zIndex: 4) further
          down the tree, so without its own zIndex it would stack *behind* the character/
          enemy sprites by CSS zIndex rules (explicit zIndex beats source order) — small,
          precisely-positioned effects (e.g. the teleport pad, sized and placed right at the
          player's feet) end up fully hidden behind the sprite, not just occluded at the
          edges like a big flash would be. Same zIndex as `fighters` itself (so it still
          stays below enemyNameplateFixed's zIndex: 5 — see critFlash's own comment on why
          that matters), but later in the tree, so it paints on top of it. */}
          <View style={[StyleSheet.absoluteFill, { zIndex: 4 }]} pointerEvents="none">
          {beamId > 0 && fightersWidth > 0 && (
            <BeamEffect
              key={`beam-${beamId}`}
              mouth={{ left: playerCenterLeft + 34, bottom: FIGHTERS_BOTTOM + 48 }}
              targetLeft={enemyCenterLeft + 20}
              enemy={{ left: enemyCenterLeft, bottom: FIGHTERS_BOTTOM + enemySize * 0.45 }}
            />
          )}

          {carrotThrowId > 0 && fightersWidth > 0 && (
            <CarrotThrowEffect
              key={`carrot-throw-${carrotThrowId}`}
              from={{ left: playerCenterLeft + 34, bottom: FIGHTERS_BOTTOM + 48 }}
              to={{ left: enemyCenterLeft, bottom: FIGHTERS_BOTTOM + enemySize * 0.45 }}
            />
          )}
          {meteorStrikeId > 0 && fightersWidth > 0 && (
            <MeteorStrikeEffect key={`meteor-${meteorStrikeId}`} at={{ left: enemyCenterLeft, bottom: FIGHTERS_BOTTOM + 8 }} />
          )}
          {chiliThrowId > 0 && fightersWidth > 0 && (
            <ChiliThrowEffect
              key={`chili-throw-${chiliThrowId}`}
              from={{ left: playerCenterLeft + 34, bottom: FIGHTERS_BOTTOM + 48 }}
              to={{ left: enemyCenterLeft, bottom: FIGHTERS_BOTTOM + enemySize * 0.45 }}
            />
          )}
          {fightersWidth > 0 &&
            witchSpells.map((spell) => (
              <WitchSpell
                key={`witch-${spell.id}`}
                critical={spell.critical}
                travelMs={WITCH_TRAVEL_MS / battleSpeed}
                // Just in front of her, at wand height — not out of her mouth like the beam.
                from={{ left: playerCenterLeft + 66, bottom: FIGHTERS_BOTTOM + 42 }}
                to={{ left: enemyCenterLeft, bottom: FIGHTERS_BOTTOM + enemySize * 0.45 }}
              />
            ))}
          {steal.id > 0 && <StealCastEffect key={`steal-${steal.id}`} at={{ left: playerCenterLeft, bottom: bodyBottom }} />}
          {focus.id > 0 && <FocusCastEffect key={`focus-${focus.id}`} at={{ left: playerCenterLeft, bottom: bodyBottom }} />}
          {barrage.id > 0 && <BarrageCastEffect key={`barrage-${barrage.id}`} at={{ left: playerCenterLeft, bottom: bodyBottom }} />}
          {teleportId > 0 && <TeleportCastEffect key={`teleport-${teleportId}`} at={{ left: playerCenterLeft, bottom: feetBottom }} />}
          {bossSkillCastId > 0 && bossSkillConfig && (
            <BossSkillCastEffect
              key={`boss-skill-${bossSkillCastId}`}
              skill={bossSkillConfig}
              bossAt={{ left: enemyCenterLeft, bottom: FIGHTERS_BOTTOM }}
              playerAt={{ left: playerCenterLeft, bottom: bodyBottom }}
            />
          )}
          {bossReviveId > 0 && (
            <BossReviveEffect key={`boss-revive-${bossReviveId}`} bossAt={{ left: enemyCenterLeft, bottom: FIGHTERS_BOTTOM }} />
          )}
          {shout.id > 0 && fightersWidth > 0 && (
            <ShoutCastEffect
              key={`shout-${shout.id}`}
              mouth={{ left: playerCenterLeft + 34, bottom: FIGHTERS_BOTTOM + 48 }}
              enemy={{ left: enemyCenterLeft, bottom: FIGHTERS_BOTTOM + enemySize * 0.45 }}
            />
          )}
          {companionSkillCastId > 0 && (
            <SkillCallout
              key={`companion-skill-${companionSkillCastId}`}
              text={`${tr(COMPANION_SKILL_NAMES[outfit])}!`}
              color={COMPANION_SKILL_CALLOUT_COLOR[outfit].color}
              strokeColor={COMPANION_SKILL_CALLOUT_COLOR[outfit].strokeColor}
              holdMs={420}
            />
          )}
          {fightersWidth > 0 &&
            goldEvents.map((event) => (
              <StealCoins
                key={`steal-coins-${event.id}`}
                from={{ left: enemyCenterLeft, bottom: FIGHTERS_BOTTOM + enemySize * 0.45 }}
                to={{ left: playerCenterLeft, bottom: bodyBottom }}
              />
            ))}

          {firstStrikeId > 0 && fightersWidth > 0 && (
            <ExecuteEffect
              key={`first-strike-${firstStrikeId}`}
              home={{ left: playerCenterLeft, bottom: bodyBottom }}
              arrival={{ left: playerCenterLeft, bottom: bodyBottom }}
              enemy={{ left: enemyCenterLeft, bottom: FIGHTERS_BOTTOM + enemySize * 0.45 }}
              dash={false}
            />
          )}
          {executeId > 0 && fightersWidth > 0 && (
            <ExecuteEffect
              key={`execute-${executeId}`}
              home={{ left: playerCenterLeft, bottom: bodyBottom }}
              // 마녀기니 doesn't blink over to the enemy — no dash, an arcane blast lands from range.
              arrival={{ left: isWitch ? playerCenterLeft : arrivalCenterLeft, bottom: bodyBottom }}
              enemy={{ left: enemyCenterLeft, bottom: FIGHTERS_BOTTOM + enemySize * 0.45 }}
              dash={!isWitch}
              magic={isWitch}
            />
          )}

          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {dropEvents.map((event) => (
              <DropItem
                key={event.id}
                image={ITEM_IMAGES[event.name]}
                delay={event.delay}
                from={dropFrom}
                groundDrop={dropFrom.bottom - GROUND_BOTTOM}
                to={dropTo}
              />
            ))}
            {heldLoot && fightersWidth > 0 && (
              <HeldLoot
                left={(playerCenterLeft + enemyCenterLeft) / 2}
                bottom={GROUND_BOTTOM}
                showGold={heldLoot.stage === "gold"}
                showItems={heldLoot.stage === "items"}
                items={heldLoot.items.map((item) => item.name)}
              />
            )}
            {phase === "defeated" && !heldLoot && [0, 1, 2].map((index) => (
              <GoldFly key={`gold-${enemyId}-${index}`} delay={index * 70} from={goldFlyFrom} />
            ))}
          </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// The frozen first-kill loot: a little coin pile and the dropped ingredients sitting on the
// ground, bobbing under a bouncing arrow so they read as "look here". Tagged for the tutorial's
// arrows and fly-in starting points.
function HeldLoot({ left, bottom, showGold, showItems, items }: { left: number; bottom: number; showGold: boolean; showItems: boolean; items: string[] }) {
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(withSequence(withTiming(1, { duration: 520 }), withTiming(0, { duration: 520 })), -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 5 }] }));
  return (
    <View style={[styles.heldLoot, { left: left - 70, bottom }]} pointerEvents="none">
      {showGold && (
        // No glow behind the coins — the tutorial's bouncing arrow points down at them instead.
        <View ref={tutorialRef("loot-gold")} style={styles.heldGoldSpot}>
          <Animated.View style={[styles.heldCoins, bobStyle]}>
            <Image source={uiImages.coin} style={[styles.heldGoldCoin, { left: 0, top: 13 }]} />
            <Image source={uiImages.coin} style={[styles.heldGoldCoin, { left: 20, top: 13 }]} />
            <Image source={uiImages.coin} style={[styles.heldGoldCoin, { left: 10, top: 0 }]} />
          </Animated.View>
          <GuideArrow style={styles.heldArrow} />
        </View>
      )}
      {/* Ingredients only come out once the gold has been explained and sent off. */}
      {showItems && (
        <View ref={tutorialRef("loot-items")} style={styles.heldItemsSpot}>
          <Animated.View style={[styles.heldItems, bobStyle]}>
            {items.map((name, index) => (
              <Image key={`${name}-${index}`} source={ITEM_IMAGES[name]} style={styles.heldItem} />
            ))}
          </Animated.View>
          <GuideArrow style={styles.heldItemsArrow} />
        </View>
      )}
    </View>
  );
}

// 카우보이기니's bullet: a short orange streak that zips from the barrel to the enemy and fades.
function BulletTracer({ length }: { length: number }) {
  const travel = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    travel.value = withTiming(1, { duration: 90, easing: Easing.linear });
    fade.value = withDelay(70, withTiming(0, { duration: 80 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const streak = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateX: travel.value * (length - TRACER_STREAK) }],
  }));
  const trail = useAnimatedStyle(() => ({
    opacity: fade.value * 0.45,
    width: travel.value * (length - TRACER_STREAK) + TRACER_STREAK,
  }));
  return (
    <View style={styles.tracer} pointerEvents="none">
      <Animated.View style={[styles.tracerTrail, trail]} />
      <Animated.View style={[styles.tracerStreak, streak]} />
    </View>
  );
}

function PlayerFighter({
  animation,
  outfit,
  boss,
  executeId,
  beamId,
  skillPoseKey,
  teleportX,
  stealAuraId,
  focusAuraId,
  reloadInfo,
  shotId,
  fannedShot,
}: {
  animation: PlayerAnimation;
  outfit: Outfit;
  boss: boolean;
  executeId: number;
  beamId: number;
  // Set while a skill pose (Execute's cut, Guinea Beam) plays: no swing lunge/shake on
  // top of it, and the strip restarts per cast.
  skillPoseKey: string | null;
  teleportX: number;
  // Non-zero (the cast's id) while that buff skill's aura should show.
  stealAuraId: number;
  focusAuraId: number;
  reloadInfo: { endsAt: number; totalMs: number };
  shotId: number;
  fannedShot: boolean;
}) {
  const isAttacking = animation === "attack" || animation === "critical";
  // Spellcasters fire from where they stand: a small kick back per cast, never a lunge.
  const caster = outfit === "witchGini";
  // Same for 카우보이기니's revolver: it shoots from where it stands, crits included.
  const ranged = caster || outfit === "cowboyGini";
  const shake = useSharedValue(0);
  const lunge = useSharedValue(0);
  const teleport = useSharedValue(0);
  const visible = useSharedValue(1);
  const recoil = useSharedValue(0);

  // Guinea Beam kicks the guinea pig back a step as it fires, then it plants again.
  useEffect(() => {
    if (beamId === 0) return;
    recoil.value = withDelay(
      BEAM_TIMING.fire,
      withSequence(
        withTiming(1, { duration: 60, easing: Easing.out(Easing.quad) }),
        withDelay(BEAM_TIMING.hit - BEAM_TIMING.fire + 80, withTiming(0, { duration: 260, easing: Easing.inOut(Easing.quad) })),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beamId]);

  // Execute's ninja blink: fade out, jump to the enemy, pop back in for the cut, then the
  // same in reverse. A caster stays put and lands it from where she stands.
  useEffect(() => {
    if (executeId === 0 || caster) return;
    const { vanish, arrive, leave, home } = EXECUTE_TIMING;
    teleport.value = withSequence(
      withDelay(vanish, withTiming(teleportX, { duration: 0 })),
      withDelay(home - vanish, withTiming(0, { duration: 0 })),
    );
    visible.value = withSequence(
      withTiming(0, { duration: vanish }),
      withTiming(1, { duration: arrive - vanish }),
      withDelay(leave - arrive, withTiming(0, { duration: home - leave })),
      withTiming(1, { duration: 60 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executeId]);

  useEffect(() => {
    // A skill pose pins the guinea pig (e.g. at Execute's teleport spot) — kill any swing
    // motion still in flight, like a crit lunge from the swing that triggered it.
    if (skillPoseKey) {
      shake.value = 0;
      lunge.value = 0;
      return;
    }
    if (isAttacking) {
      shake.value = withSequence(withTiming(1, { duration: 130, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 130, easing: Easing.inOut(Easing.quad) }));
    }
    if (animation === "critical" && !ranged) {
      lunge.value = withSequence(withTiming(1, { duration: 260, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 260, easing: Easing.inOut(Easing.quad) }));
    } else {
      lunge.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animation, skillPoseKey]);

  // 카우보이기니: a pixel muzzle flash at the barrel on every shot, timed to the sprite's firing
  // frame. A fresh key per shot restarts the one-shot strip. An auto shot plays the whole
  // draw (holster → draw → fire → smoke); a fanned round lands every 110ms, faster than the
  // draw ever reaches the fire frame, so it restarts on the fire frame with the flash at once
  // — otherwise each round rewinds to the hand-on-holster frame and leaves an empty hand.
  const gunslinger = outfit === "cowboyGini";
  const [muzzleId, setMuzzleId] = useState(0);
  // Not cleared per shot: a fanned burst fires faster than the flash delay, and every shot
  // should still get its flash.
  const muzzleTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    if (!gunslinger || shotId === 0) return;
    muzzleTimers.current.push(setTimeout(() => setMuzzleId((value) => value + 1), fannedShot ? 0 : COWBOY_FIRE_FRAME_MS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gunslinger, shotId]);
  useEffect(() => () => muzzleTimers.current.forEach((timer) => clearTimeout(timer)), []);
  // Reload bar over the nameplate, ticking every 100ms only while a reload is running.
  const reloadEndsAt = reloadInfo.endsAt;
  const [now, setNow] = useState(() => Date.now());
  const reloadLeftMs = gunslinger ? Math.min(reloadEndsAt - now, reloadInfo.totalMs) : 0;
  const reloadProgress = reloadInfo.totalMs > 0 ? 1 - Math.max(0, reloadLeftMs) / reloadInfo.totalMs : 0;
  useEffect(() => {
    if (!gunslinger || reloadEndsAt <= Date.now()) return;
    const first = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [gunslinger, reloadEndsAt]);

  const style = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [
      { translateX: shake.value * (ranged ? -6 : 24) + lunge.value * 112 + teleport.value - recoil.value * 12 },
      { rotate: `${shake.value * (ranged ? -2 : 4)}deg` },
      { scale: 1 + lunge.value * 0.05 },
    ],
  }));

  return (
    <Animated.View style={[styles.characterWrap, style]}>
      {stealAuraId > 0 && <StealAura key={`steal-${stealAuraId}`} durationMs={STEAL_DURATION} />}
      {focusAuraId > 0 && <FocusAura key={`focus-${focusAuraId}`} durationMs={FOCUS_DURATION} />}
      {reloadLeftMs > 0 && (
        <View style={styles.reloadTrack} pointerEvents="none">
          <View style={[styles.reloadFill, { width: `${Math.round(reloadProgress * 100)}%` }]} />
        </View>
      )}
      {/* Same see-through plate and outlined name as the enemy's. */}
      <View style={[styles.unitLabel, styles.unitLabelClear]}>
        <StrokedText style={styles.unitLabelText} strokeColor={colors.line} strokeWidth={1.5}>
          {OUTFIT_NAMES[outfit]}
        </StrokedText>
      </View>
      <View>
        <CharacterSprite
          outfit={outfit}
          animation={animation}
          repeat={reloadLeftMs > 0 && animation === "win" ? Math.max(1, Math.round(reloadInfo.totalMs / 480)) : animation === "win" && boss ? 3 : 1}
          restartKey={skillPoseKey ? `${outfit}-${skillPoseKey}` : gunslinger && isAttacking ? `${outfit}-${animation}-${shotId}` : `${outfit}-${animation}`}
          startFrame={gunslinger && isAttacking && fannedShot && !skillPoseKey ? COWBOY_FIRE_FRAME : 0}
        />
        {gunslinger && muzzleId > 0 && <BulletTracer key={`tracer-${muzzleId}`} length={Math.max(40, teleportX - 10)} />}
        {gunslinger && muzzleId > 0 && (
          <View key={muzzleId} style={styles.muzzleFlash} pointerEvents="none">
            <SpriteStrip source={effects.muzzleRevolver} frameSize={72} frameCount={21} displaySize={MUZZLE_SIZE} durationMs={667} mode="once" />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// 견습기니, riding its bubble — joined in the "apprenticeGini" comic (state/comics.ts) at the
// start of the second loop. Not tied to the player: it drifts on its own around the scene's
// top-left corner (above the fighters' zIndex so it reads as passing in front, not behind,
// whenever it floats over one or the enemy), idling in place most of the time — except every
// APPRENTICE_ATTACK_INTERVAL_MS (see useAutoBattle), when it zips over to the enemy, lands its
// own hit, and drifts back. The damage itself (and its floating number) comes from the same
// dealDamage/DamageNumber path every other hit uses — this just plays the matching visual,
// timed to attackHitMs so the punch lands exactly when the hit actually does.
function ApprenticeFollower({ attackId, attackKind, attackHitMs }: { attackId: number; attackKind: "slam" | "beam"; attackHitMs: number }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const bob = useSharedValue(0);
  const flash = useSharedValue(0);
  // The attackId this component has already played the flight/impact for — starts at
  // whatever attackId already was on mount, so remounting mid-game doesn't replay an old hit.
  const lastHandledAttackId = useRef(attackId);

  useEffect(() => {
    bob.value = withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) })), -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The one place x/y ever get set: ambient wandering normally, or — the moment attackId
  // bumps — a detour to the enemy, a flash (beam only) timed to attackHitMs (matching
  // useAutoBattle's own scheduled dealDamage), then straight back into wandering from there —
  // no pause sitting next to the enemy first, which used to read as a second, separate hit.
  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const wander = () => {
      if (cancelled) return;
      const duration = 3200 + Math.random() * 2600;
      x.value = withTiming(Math.random() * size.width * 0.5, { duration, easing: Easing.inOut(Easing.quad) });
      y.value = withTiming(Math.random() * size.height * 0.4, { duration, easing: Easing.inOut(Easing.quad) });
      timer = setTimeout(wander, duration);
    };

    if (attackId !== lastHandledAttackId.current) {
      lastHandledAttackId.current = attackId;
      const travel = Math.max(150, attackHitMs - 60);
      x.value = withTiming(size.width * 0.74, { duration: travel, easing: Easing.out(Easing.quad) });
      y.value = withTiming(size.height * 0.5, { duration: travel, easing: Easing.out(Easing.quad) });
      timer = setTimeout(() => {
        if (attackKind === "beam") flash.value = withSequence(withTiming(1, { duration: 60 }), withTiming(0, { duration: 220 }));
        wander();
      }, attackHitMs);
    } else {
      wander();
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, attackId]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value - bob.value * 6 }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  return (
    <View
      style={styles.apprenticeLayer}
      pointerEvents="none"
      onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
    >
      <Animated.View style={style}>
        <SpriteStrip source={apprenticeSprite.idle} frameSize={500} frameCount={4} displaySize={76} durationMs={1800} mode="loop" />
        <Animated.View style={[styles.apprenticeBeamFlash, flashStyle]} />
      </Animated.View>
    </View>
  );
}

function EnemyFighter({
  animation,
  boss,
  miniBoss,
  enraged,
  miniBossDefeated,
  golden,
  stray,
  enemyKind,
  enemyId,
  currentHp,
  maxHp,
  phase,
  size,
  critical,
  beamId,
  shoutDebuffId,
  executedKill,
}: {
  animation: EnemyAnimation;
  boss: boolean;
  miniBoss: boolean;
  miniBossDefeated: boolean;
  golden: boolean;
  stray: boolean;
  enraged: boolean;
  enemyKind: EnemyKind;
  enemyId: number;
  currentHp: number;
  maxHp: number;
  phase: BattlePhase;
  size: number;
  critical: boolean;
  beamId: number;
  // Non-zero (the cast's id) while Shout's debuff mark should show.
  shoutDebuffId: number;
  // True while the current "defeated" phase is the result of an Execute kill — swaps the
  // usual shrink-and-fade for the sprite slicing in half along Execute's cut.
  executedKill: boolean;
}) {
  const shake = useSharedValue(0);
  const knockback = useSharedValue(0);
  const hitFlash = useSharedValue(0);
  const defeat = useSharedValue(0);
  const split = useSharedValue(0);
  const cutFlash = useSharedValue(0);
  const enter = useSharedValue(phase === "entering" ? 0 : 1);
  const beamPush = useSharedValue(0);
  const beamFlash = useSharedValue(0);

  // Guinea Beam connecting: a white flash and a shove back. A mob dies on the spot anyway;
  // a boss (which survives at half HP) gets dragged further and slowly plants its feet.
  useEffect(() => {
    if (beamId === 0) return;
    beamFlash.value = withDelay(
      BEAM_TIMING.hit,
      withSequence(withTiming(1, { duration: 40 }), withTiming(0.7, { duration: 120 }), withTiming(0, { duration: 200 })),
    );
    beamPush.value = withDelay(
      BEAM_TIMING.hit,
      withSequence(
        withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 420, easing: Easing.inOut(Easing.quad) }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beamId]);

  useEffect(() => {
    if (phase === "hit") {
      // A brief static hold (hit-stop) before the knockback punches out and eases back,
      // instead of jumping straight into the recoil — sells the impact as actually landing.
      // A crit holds longer and swings further/harder, so it reads as a heavier blow than
      // a regular hit instead of just triggering the same recoil with a different flash.
      const holdMs = critical ? 100 : 55;
      const knockbackPeak = critical ? 1.6 : 1;
      const shakePeak = critical ? 1.8 : 1;
      knockback.value = withSequence(
        withTiming(0, { duration: holdMs }),
        withTiming(knockbackPeak, { duration: 70, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 190, easing: Easing.out(Easing.quad) }),
      );
      shake.value = withSequence(withTiming(0, { duration: holdMs }), withTiming(shakePeak, { duration: 160 }), withTiming(0, { duration: 160 }));
      hitFlash.value = withSequence(withTiming(1, { duration: holdMs }), withTiming(0.85, { duration: 40 }), withTiming(0, { duration: 110 }));
    }
    if (phase === "defeated") {
      defeat.value = withTiming(1, { duration: 620, easing: Easing.in(Easing.quad) });
      if (executedKill) {
        // The split itself carries the sprite's exit motion, so the container's own
        // shrink/sink/rotate stays off for this death — see `style` below.
        cutFlash.value = withSequence(withTiming(1, { duration: 30 }), withTiming(0, { duration: 220 }));
        split.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) });
      }
    } else {
      defeat.value = 0;
      split.value = 0;
      cutFlash.value = 0;
    }
    if (phase === "entering") {
      enter.value = 0;
      enter.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
    } else if (phase === "idle") {
      enter.value = 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, executedKill, critical]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - defeat.value) * (0.4 + enter.value * 0.6),
    transform: [
      {
        translateX:
          knockback.value * 14 - (executedKill ? 0 : defeat.value * -7) + (1 - enter.value) * 35 + beamPush.value * (boss ? 34 : 18),
      },
      { translateY: executedKill ? 0 : defeat.value * 30 },
      { rotate: `${shake.value * 5 + (executedKill ? 0 : defeat.value * 18)}deg` },
      { scale: executedKill ? 1 : 1 - defeat.value * 0.65 + (1 - enter.value) * -0.4 },
    ],
  }));
  const hitFlashStyle = useAnimatedStyle(() => ({ opacity: Math.max(hitFlash.value, beamFlash.value) }));
  // Top half slides up-left, bottom half drops down-right — an uneven split reads more
  // like a real cut than two pieces mirroring each other.
  const topHalfStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, split.value - 0.5) * 2,
    transform: [{ translateX: -split.value * 16 }, { translateY: -split.value * 22 }, { rotate: `${-split.value * 10}deg` }],
  }));
  const bottomHalfStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, split.value - 0.5) * 2,
    transform: [{ translateX: split.value * 14 }, { translateY: split.value * 28 }, { rotate: `${split.value * 12}deg` }],
  }));
  const cutLineStyle = useAnimatedStyle(() => ({
    opacity: cutFlash.value,
    transform: [{ scaleX: 1 + split.value * 0.5 }],
  }));

  return (
    <Animated.View style={[styles.characterWrap, style]}>
      {shoutDebuffId > 0 && <ShoutDebuff key={`shout-${shoutDebuffId}`} durationMs={SHOUT_DURATION} />}
      {/* Fixed position regardless of sprite size, so the boss's HP bar lines up with a
          regular mob's — the (much taller) boss sprite grows upward behind it instead. */}
      <View style={[styles.unitLabel, styles.enemyNameplate, styles.enemyNameplateFixed, (boss || miniBoss) && styles.enemyNameplateBoss, miniBoss && (golden ? styles.enemyNameplateGolden : styles.enemyNameplateMini)]}>
        {/* Outlined, since the plate behind it is see-through. */}
        <StrokedText style={styles.unitLabelText} strokeColor={colors.line} strokeWidth={1.5}>
          {boss
            ? tr(`${enraged ? "분노한 " : ""}${BOSS_NAME[enemyKind]}`, `${enraged ? "Enraged " : ""}${tr(BOSS_NAME[enemyKind])}`)
            : golden
              ? tr(`황금 ${ENEMY_NAME[enemyKind]}`, `Golden ${tr(ENEMY_NAME[enemyKind])}`)
              : stray
                ? tr(`길 잃은 ${ENEMY_NAME[enemyKind]}`, `Stray ${tr(ENEMY_NAME[enemyKind])}`)
                : tr(ENEMY_NAME[enemyKind])}
        </StrokedText>
        <ProgressBar progress={(currentHp / maxHp) * 100} fill="red" height={11} style={styles.unitHealthTrack} />
      </View>
      {executedKill && phase === "defeated" ? (
        <View style={{ width: size, height: size }}>
          <Animated.View style={[styles.executeHalf, { width: size, height: size / 2 }, topHalfStyle]}>
            <EnemySprite boss={boss} kind={enemyKind} animation={animation} size={size} restartKey={`${animation}-${enemyId}`} />
          </Animated.View>
          <Animated.View style={[styles.executeHalf, { top: size / 2, width: size, height: size / 2 }, bottomHalfStyle]}>
            <View style={{ position: "absolute", top: -size / 2, left: 0, width: size, height: size }}>
              <EnemySprite boss={boss} kind={enemyKind} animation={animation} size={size} restartKey={`${animation}-${enemyId}`} />
            </View>
          </Animated.View>
          <Animated.View style={[styles.executeCutLine, { top: size / 2, width: size + 16 }, cutLineStyle]} pointerEvents="none" />
        </View>
      ) : (
        <EnemySprite boss={boss} kind={enemyKind} animation={animation} size={size} restartKey={`${animation}-${enemyId}`} />
      )}
      {/* Going down: a gold starburst over it. */}
      {miniBossDefeated && phase === "defeated" && (
        <View style={[styles.miniBurst, { width: size * 1.8, height: size * 1.8, marginLeft: -size * 0.9 }]} pointerEvents="none">
          <SpriteStrip source={effects.miniBossBurst} frameSize={216} frameCount={28} displaySize={size * 1.8} durationMs={900} mode="once" />
        </View>
      )}
      {/* Mid-boss or enraged boss: its own silhouette washed red (pulsing), and the rage aura over it. */}
      {(miniBoss || enraged) && phase !== "defeated" && (
        <MiniBossRage size={size} boss={boss} enemyKind={enemyKind} animation={animation} restartKey={`${animation}-${enemyId}`} golden={golden} />
      )}
      {/* White silhouette flash on every landed hit — same sprite/frame, tinted and faded
          in/out fast, so it exactly matches the current pose with no extra art. */}
      <Animated.View style={[styles.hitFlash, { width: size, height: size }, hitFlashStyle]} pointerEvents="none">
        <EnemySprite boss={boss} kind={enemyKind} animation={animation} size={size} restartKey={`${animation}-${enemyId}`} tintColor="#ffffff" />
      </Animated.View>
      {/* Mounts/unmounts with the hit phase itself, so it restarts fresh on every crit
          without needing its own restartKey. */}
      {phase === "hit" && critical && (
        <View style={[styles.critFlash, { width: size * 1.1, height: size * 1.1 }]} pointerEvents="none">
          <SpriteStrip source={effects.critFlash} frameSize={FRAME_SIZE} frameCount={3} displaySize={size * 1.1} durationMs={240} mode="once" />
        </View>
      )}
      <EnemySpeech
        key={`${enemyId}-${boss}-${enemyKind}`}
        speechKey={`${enemyId}-${boss}-${enemyKind}`}
        boss={boss}
        stray={stray}
        enemyKind={enemyKind}
        anchor={{ right: CHARACTER_WIDTH / 2 + size / 2 + 10, bottom: size / 2 }}
      />
    </Animated.View>
  );
}

// The mid-boss's anger: a red silhouette of the current frame pulsing over the sprite, and
// pixelfx's rage aura (anger mark, steam, stress lines) around its head and feet.
// "황금 처치!": what a golden mid-boss paid, rising over the scene and fading.
function GoldenRewardToast({ gold, gems }: { gold: number; gems: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.1 ? t.value * 10 : t.value > 0.75 ? (1 - t.value) / 0.25 : 1,
    transform: [{ translateY: -t.value * 30 }, { scale: t.value < 0.1 ? 0.7 + t.value * 4 : 1.1 - Math.min(0.1, (t.value - 0.1) * 0.5) }],
  }));
  return (
    <Animated.View style={[styles.goldenToast, style]} pointerEvents="none">
      <StrokedText style={styles.goldenToastTitle} strokeColor="#5a3a06" strokeWidth={2.5}>
        {tr("황금 처치!", "Golden Kill!")}
      </StrokedText>
      <View style={styles.goldenToastRow}>
        <Image source={uiImages.coin} style={styles.goldenToastIcon} />
        <StrokedText style={styles.goldenToastValue} strokeColor={colors.line} strokeWidth={2}>
          {`+${formatGameNumber(gold)}`}
        </StrokedText>
        <Image source={uiImages.crystal} style={styles.goldenToastIcon} />
        <StrokedText style={styles.goldenToastValue} strokeColor={colors.line} strokeWidth={2}>
          {`+${gems}`}
        </StrokedText>
      </View>
    </Animated.View>
  );
}

// The shards this boss drops, plus any stars this clear newly earned. Over the stage-clear banner.
function BossRewardToast({ stars, gems, companion }: { stars: number; gems: number; companion: string | null }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: t.value < 0.1 ? t.value * 10 : t.value > 0.8 ? (1 - t.value) / 0.2 : 1 }));
  return (
    <Animated.View style={[styles.goldenToast, styles.bossRewardToast, style]} pointerEvents="none">
      {companion && (
        <StrokedText style={styles.goldenToastValue} strokeColor={colors.line} strokeWidth={2}>
          {tr(`${companion} 조각 +${SHARDS_PER_BOSS}`, `${tr(companion)} Shard +${SHARDS_PER_BOSS}`)}
        </StrokedText>
      )}
      {stars > 0 && (
        <StrokedText style={styles.goldenToastTitle} strokeColor="#5a3a06" strokeWidth={2.5}>
          {tr(`${"★".repeat(stars)} 보석 +${gems}`, `${"★".repeat(stars)} Gems +${gems}`)}
        </StrokedText>
      )}
    </Animated.View>
  );
}

// 연속 처치 milestone pop — same slot as the golden/boss toasts above (they never overlap:
// this one's regular mobs only), punchier color so it doesn't read as a reward.
function KillStreakBanner({ count }: { count: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.12 ? t.value / 0.12 : t.value > 0.7 ? (1 - t.value) / 0.3 : 1,
    transform: [{ scale: t.value < 0.12 ? 0.6 + t.value * 3.3 : 1 }],
  }));
  return (
    <Animated.View style={[styles.goldenToast, style]} pointerEvents="none">
      <StrokedText style={styles.streakToastTitle} strokeColor="#7a1f00" strokeWidth={2.5}>
        {tr(`${formatGameNumber(count)} 연속 처치!`, `${formatGameNumber(count)} Kill Streak!`)}
      </StrokedText>
    </Animated.View>
  );
}

// A golden one is washed gold instead, with no rage aura.
function MiniBossRage({ size, boss, enemyKind, animation, restartKey, golden }: { size: number; boss: boolean; enemyKind: EnemyKind; animation: EnemyAnimation; restartKey: string; golden: boolean }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 450 }), withTiming(0, { duration: 450 })), -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const tintStyle = useAnimatedStyle(() => ({ opacity: 0.32 + pulse.value * 0.2 }));
  const aura = size * 1.35;
  return (
    <>
      <Animated.View style={[styles.hitFlash, { width: size, height: size }, tintStyle]} pointerEvents="none">
        <EnemySprite boss={boss} kind={enemyKind} animation={animation} size={size} restartKey={restartKey} tintColor={golden ? "#ffd84a" : "#ff2a1a"} />
      </Animated.View>
      {!golden && (
      <View style={[styles.rageAura, { width: aura, height: aura, marginLeft: -aura / 2 }]} pointerEvents="none">
        <SpriteStrip source={effects.miniBossRage} frameSize={80} frameCount={36} displaySize={aura} durationMs={1167} mode="loop" />
      </View>
      )}
    </>
  );
}

// Picks and shows dialogue once for the currently displayed enemy.
// What a stray says — always, so it's clear it isn't from around here.
const STRAY_LINES = ["여기 어디지...?", "우리 동네가 아니잖아?", "길을 잃었나 봐...", "집에 가고 싶어...", "어라, 풍경이 달라졌네?"];
// English versions, same order — see STRAY_LINES above.
const STRAY_LINES_EN = ["Where... am I?", "This isn't my neighborhood, is it?", "I think I got lost...", "I want to go home...", "Huh, the scenery looks different?"];

// The enemy that last got its line. The battle page unmounts while another tab is open, and
// coming back must not replay the greeting — that made a half-beaten boss look freshly
// respawned. Module-level so it outlives the page.
let lastSpokenKey: string | null = null;

function EnemySpeech({ speechKey, boss, stray, enemyKind, anchor }: { speechKey: string; boss: boolean; stray: boolean; enemyKind: EnemyKind; anchor: { right: number; bottom: number } }) {
  const [line, setLine] = useState<string | null>(() => {
    if (speechKey === lastSpokenKey) return null;
    lastSpokenKey = speechKey;
    const pool = boss ? BOSS_LINES[enemyKind] : stray ? STRAY_LINES : MOB_LINES[enemyKind];
    if (!(boss || stray || Math.random() < MOB_SPEECH_CHANCE)) return null;
    const index = Math.floor(Math.random() * pool.length);
    return stray ? tr(STRAY_LINES[index], STRAY_LINES_EN[index]) : tr(pool[index]);
  });
  return line ? <MonsterSpeechBubble line={line} anchor={anchor} onClose={() => setLine(null)} /> : null;
}

// "새 스킬 해금! ○○" over the scene on a level that opens a skill. Fades in, stays a good
// while, then fades out slowly; the battle keeps going underneath.
function UnlockToast({ level }: { level: number }) {
  const { skills } = getUnlocksAtLevel(level);
  const opacity = useSharedValue(0);
  useEffect(() => {
    const fadeOut = 1600;
    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(UNLOCK_TOAST_MS - 300 - fadeOut, withTiming(0, { duration: fadeOut, easing: Easing.in(Easing.quad) })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  if (skills.length === 0) return null;
  return (
    <Animated.View style={[styles.unlockToast, style]} pointerEvents="none">
      {skills.map((id) => (
        <StrokedText key={id} style={styles.unlockText} strokeColor={colors.line}>
          {tr(`새 스킬 해금! ${getSkill(id).name}`, `New skill unlocked! ${tr(getSkill(id).name)}`)}
        </StrokedText>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  unlockToast: {
    position: "absolute",
    top: 62,
    left: 40,
    right: 40,
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#14100cb3",
    borderWidth: 2,
    borderColor: "#ffd34d",
    zIndex: 12,
  },
  unlockText: { fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: "#ffe9a3" },
  // Runs edge to edge across the screen; only its top and bottom keep the dark rim.
  scene: {
    marginTop: 10,
    marginBottom: 8,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: colors.line,
    overflow: "hidden",
  },
  sky: { width: "100%", height: SKY_HEIGHT, overflow: "hidden" },
  camLayer: { transformOrigin: "0% 0%" },
  // Where the fighters always sat in the stacking order (styles.fighters' own zIndex).
  camFighters: { zIndex: 4 },
  // Above camFighters, so the wandering follower reads as passing in front of either
  // fighter whenever it happens to float over one.
  apprenticeLayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 12 },
  // A quick white zap over the sprite itself on the rare magic-bolt hit.
  apprenticeBeamFlash: { position: "absolute", top: -6, left: -6, right: -6, bottom: -6, borderRadius: 999, backgroundColor: "#ffffff" },
  skyImage: { width: "100%", height: "100%" },
  stageBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stageBarInfo: { flex: 1, alignItems: "center" },
  stageTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  autoDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.line },
  stageBarTitle: { color: colors.cream, fontSize: 19, fontWeight: "900", fontFamily: fonts.bold, letterSpacing: -0.3 },
  stageBarTrack: { width: "100%", marginTop: 4 },
  questButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  questPressed: { transform: [{ scale: 0.92 }] },
  // Map art is 669x574.
  mapIcon: { width: 40, height: 34 },
  // Toggles the wandering 견습기니 on/off — same slot/size as questButton, on the bar's other end.
  apprenticeToggle: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  apprenticeToggleOff: { opacity: 0.45 },
  // Just a dot — whether there's something to claim, not how many.
  heldLoot: { position: "absolute", width: 140, flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: 18, zIndex: 13 },
  heldGoldSpot: { width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  heldCoins: { width: 48, height: 41 },
  heldGoldCoin: { position: "absolute", width: 28, height: 28 },
  // Sits just above the coin pile, centred on it.
  heldArrow: { left: 25 - ARROW_W / 2, top: -ARROW_H - 4 },
  heldItems: { flexDirection: "row", gap: 2 },
  heldItem: { width: 38, height: 38 },
  heldItemsSpot: { minWidth: 50, height: 50, alignItems: "center", justifyContent: "center" },
  heldItemsArrow: { left: "50%", marginLeft: -ARROW_W / 2, top: -ARROW_H - 4 },
  giftBanner: {
    position: "absolute",
    top: 62,
    left: 24,
    right: 24,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#14100cb3",
    borderWidth: 2,
    borderColor: "#ffd34d",
    zIndex: 12,
  },
  giftText: { fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: "#ffe9a3" },
  fighters: {
    position: "absolute",
    zIndex: 4,
    top: 42,
    left: 15,
    right: 15,
    bottom: 55,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  foodBar: { position: "absolute", right: ROW_RIGHT, bottom: ROW_BOTTOM + (ICON_BOX.height - BUFF_SLOT_SIZE) / 2, zIndex: 7 },
  mapButtonPressed: { transform: [{ scale: 0.92 }] },
  // Bottom-left, mirroring the right-hand button row's inset; sits below the player sprite.
  // zIndex 7: above the fighters (4) and the enemy nameplate (5), so the slot's info bubble
  // pops out in front of Gini — but still under the full-scene banners (8) that dim it.
  skillBar: { position: "absolute", left: ROW_RIGHT, bottom: ROW_BOTTOM + (ICON_BOX.height - SKILL_SLOT_HEIGHT) / 2, zIndex: 7 },
  effects: { position: "absolute", right: 96, bottom: 30, zIndex: 10 },
  // Below enemyNameplateFixed's zIndex: 5 so a big flash can never cover the HP bar.
  critFlash: { position: "absolute", bottom: 0, alignSelf: "center", zIndex: 4 },
  // Sits right over the base sprite (same box), below critFlash/the nameplate.
  hitFlash: { position: "absolute", bottom: 0, alignSelf: "center", zIndex: 3 },
  // Execute's two sprite halves — each clips its own full-size copy of the sprite to just
  // one half, then the two slide apart (see topHalfStyle/bottomHalfStyle).
  executeHalf: { position: "absolute", top: 0, left: 0, overflow: "hidden" },
  executeCutLine: { position: "absolute", left: -8, height: 3, borderRadius: 1.5, backgroundColor: "#ffffff" },
  characterWrap: { width: 108, alignItems: "center", position: "relative" },
  unitLabel: {
    marginBottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.line,
    borderRadius: 5,
  },
  // Centred on the sprite's box, the aura's floor glow at the feet.
  rageAura: { position: "absolute", bottom: -10, left: "50%" },
  miniBurst: { position: "absolute", left: "50%", bottom: -20, zIndex: 6 },
  enemyNameplateGolden: { backgroundColor: "#7a5a0acc", borderWidth: 1.5, borderColor: "#ffe27a" },
  goldenToast: { position: "absolute", top: 70, left: 0, right: 0, alignItems: "center", zIndex: 9 },
  bossRewardToast: { top: 24, zIndex: 40, elevation: 40 },
  goldenToastTitle: { color: "#ffe27a", fontSize: 26, fontWeight: "900", fontFamily: fonts.bold },
  streakToastTitle: { color: "#ffb24a", fontSize: 24, fontWeight: "900", fontFamily: fonts.bold },
  goldenToastRow: { marginTop: 2, flexDirection: "row", alignItems: "center", gap: 4 },
  goldenToastIcon: { width: 18, height: 18, resizeMode: "contain" },
  goldenToastValue: { color: "#fff4bd", fontSize: 18, fontWeight: "900", fontFamily: fonts.bold, marginRight: 6 },
  enemyNameplateMini: { backgroundColor: "#6a120ccc", borderWidth: 1.5, borderColor: "#ffb020" },
  unitLabelClear: { backgroundColor: "#2b1d1259" },
  // Sits right on top of the nameplate (absolute, so the sprite doesn't shift while it shows).
  // Starts at the barrel tip (same point as muzzleFlash) and runs right toward the enemy.
  tracer: { position: "absolute", left: 100, top: 48, height: 3, width: 1, overflow: "visible", zIndex: 3 },
  tracerTrail: { position: "absolute", left: 0, top: 1, height: 1, borderRadius: 1, backgroundColor: "#ffb347" },
  tracerStreak: { position: "absolute", left: 0, top: 0, width: TRACER_STREAK, height: 3, borderRadius: 2, backgroundColor: "#ff8a2a", shadowColor: "#ffc23d", shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  reloadTrack: { position: "absolute", top: -9, alignSelf: "center", width: 54, height: 6, borderRadius: 3, borderWidth: 1, borderColor: colors.line, backgroundColor: "#2b1d12b3", overflow: "hidden", zIndex: 6 },
  reloadFill: { height: "100%", backgroundColor: "#f5c542" },
  // Barrel tip in the 108px sprite box is about (98, 49); the strip's muzzle point is ~(23, 32) of
  // its 72px frame, so at MUZZLE_SIZE the strip's top-left goes here.
  muzzleFlash: { position: "absolute", left: 98 - 23 * (MUZZLE_SIZE / 72), top: 49 - 32 * (MUZZLE_SIZE / 72), zIndex: 3 },
  unitLabelText: { color: colors.cream, fontSize: 8, fontWeight: "800", fontFamily: fonts.bold },
  // See-through, so a tall boss behind it (head, horns) still shows.
  enemyNameplate: { width: 104, paddingHorizontal: 6, paddingTop: 4, paddingBottom: 5, gap: 3, alignItems: "center", backgroundColor: "#2b1d1259" },
  // Pinned at the regular mob's natural nameplate position (108px sprite + its 4px gap)
  // so a much taller boss sprite doesn't drag its HP bar up with it. zIndex keeps it
  // painted above the sprite below — a tall boss (e.g. the mushroom boss's cap) can
  // otherwise grow up past bottom: 112 and paint over its own name/HP bar.
  enemyNameplateFixed: { position: "absolute", bottom: 112, zIndex: 5 },
  enemyNameplateBoss: { width: 116 },
  unitHealthTrack: { width: "100%" },
});
