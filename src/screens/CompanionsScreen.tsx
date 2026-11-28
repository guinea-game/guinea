import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "../components/GameText";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "../theme";
import { companionSkillImages, creamSlices, food, frameImages, icons, images, kit, shardImageForLevel, shopKit, skillImages, statIcons, uiImages } from "../assets";
import { COMPANION_SKILL_NAMES, COMPANION_SKILL_SUMMARIES } from "../state/companionSkills";
import { EnemySprite } from "../components/EnemySprite";
import { Panel } from "../components/NineSlice";
import { PageHeading } from "../components/PageHeading";
import { GameButton } from "../components/GameButton";
import { ProgressBar } from "../components/ProgressBar";
import { CharacterSprite } from "../components/CharacterSprite";
import {
  getOutfitName,
  getOutfitStats,
  isGumihoRevealed,
  OUTFIT_GROWTH_HINT,
  OUTFIT_FORCED_MANUAL,
  OUTFIT_NO_OFFLINE,
  OUTFIT_SURE_DROPS,
  OUTFIT_SKILL_POWER,
  describeEffect,
  describeEffectParts,
} from "../state/buffs";
import type { BuffEffect } from "../state/buffs";
import { LockBadge } from "../components/LockBadge";
import { BOX_RESCUE_OUTFITS, getOutfitGemPrice, isOutfitUnlocked, OUTFIT_EARLY_UNLOCK_GEMS, OUTFIT_GEM_PRICE, OUTFIT_LOOP_GRANT, OUTFIT_UNLOCK_STAGE } from "../state/unlocks";
import { ConfirmModal } from "../components/ConfirmModal";
import { COMPANION_MAX_LEVEL, COMPANION_SHARD_STAGE, getCompanionLevel, getCompanionShards, getShardCost, SHARDS_PER_BOSS } from "../state/progression";
import { getCompanionLevelCap } from "../state/lab";
import { BOSS_NAME, getEnemyKind, getStageCode } from "../state/stages";
import type { GameState, Outfit } from "../types";
import { t } from "../i18n";

// Each entry swaps the battle sprite to that companion's art and grants whichever of these
// quirks apply for as long as it stays equipped.
function companionDetail(outfit: Outfit, level = 0) {
  const parts: string[] = [];
  const stats = getOutfitStats(outfit, level);
  const buff = Object.keys(stats.buff).length > 0 ? stats.buff : undefined;
  if (buff) parts.push(describeEffect(buff));
  const missChance = stats.missChance;
  if (missChance)
    parts.push(
      t(`${missChance}% 확률로 공격 빗나감`, `${missChance}% chance to whiff`, `${missChance}%の確率で攻撃が外れる`, `${missChance}%概率攻击落空`),
    );
  const hitCount = stats.hitCount > 1 ? stats.hitCount : 0;
  if (hitCount) parts.push(t(`한 번에 ${hitCount}타씩 타격`, `Strikes ${hitCount} times per hit`, `一度に${hitCount}回攻撃`, `每次攻击${hitCount}连击`));
  const foodDurationBonus = stats.foodBonusSec;
  if (foodDurationBonus)
    parts.push(
      t(
        `음식 효과시간 +${foodDurationBonus}초`,
        `+${foodDurationBonus}s food buff duration`,
        `料理効果時間 +${foodDurationBonus}秒`,
        `食物效果时间 +${foodDurationBonus}秒`,
      ),
    );
  const firstStrike = stats.firstStrike;
  if (firstStrike)
    parts.push(
      t(
        `적마다 첫 공격은 일반 공격 ×${firstStrike} (치명타 없음)`,
        `First hit on each enemy is ×${firstStrike} a normal attack (no crit)`,
        `敵ごとの初撃は通常攻撃の${firstStrike}倍（クリティカルなし）`,
        `对每个敌人的首次攻击为普通攻击的${firstStrike}倍（无暴击）`,
      ),
    );
  if (OUTFIT_SURE_DROPS[outfit]) parts.push(t("재료 드랍 확률 100%", "100% ingredient drop rate", "素材ドロップ率100%", "材料掉落率100%"));
  const cooldownReduction = stats.cooldownSec;
  if (cooldownReduction)
    parts.push(
      t(
        `스킬 쿨타임 -${cooldownReduction}초`,
        `Skill cooldown -${cooldownReduction}s`,
        `スキルクールタイム -${cooldownReduction}秒`,
        `技能冷却 -${cooldownReduction}秒`,
      ),
    );
  const skillPower = OUTFIT_SKILL_POWER[outfit];
  if (skillPower)
    parts.push(
      t(
        `스킬 효과 ×${skillPower} (기니빔 보스 피해 최대 80%)`,
        `Skill power ×${skillPower} (Guinea Beam up to 80% boss damage)`,
        `スキル効果×${skillPower}（ギニービームのボスダメージ最大80%）`,
        `技能效果×${skillPower}（吉妮光束对首领伤害最高80%）`,
      ),
    );
  if (OUTFIT_FORCED_MANUAL[outfit])
    parts.push(t("항상 수동 전투 (탭해서 공격)", "Always manual combat (tap to attack)", "常に手動戦闘（タップで攻撃）", "始终手动战斗（点击攻击）"));
  if (OUTFIT_NO_OFFLINE[outfit])
    parts.push(t("휴식(오프라인) 중에는 사냥 안 함", "Doesn't hunt while resting (offline)", "休憩中（オフライン）は狩りをしない", "休息（离线）期间不进行狩猎"));
  const shotsBeforeReload = stats.shotsBeforeReload;
  if (shotsBeforeReload)
    parts.push(
      t(
        `${shotsBeforeReload}발마다 재장전 ${stats.reloadMs / 1000}초`,
        `Reloads every ${shotsBeforeReload} shots (${stats.reloadMs / 1000}s)`,
        `${shotsBeforeReload}発ごとに再装填 ${stats.reloadMs / 1000}秒`,
        `每${shotsBeforeReload}发装填 ${stats.reloadMs / 1000}秒`,
      ),
    );
  return parts.length > 0 ? parts.join(" · ") : t("동료 없이 다닐 때", "Traveling without a companion", "一人で旅する時", "独自旅行时");
}

// The same quirks as companionDetail, each with an icon — the companion cards lead with the
// icon and keep the words as a caption.
const EFFECT_ICONS: Partial<Record<keyof BuffEffect, number>> = {
  attack: statIcons.attack,
  criticalDamage: statIcons.criticalDamage,
  criticalChance: statIcons.criticalChance,
  gold: statIcons.goldBonus,
  attackSpeed: icons.energy,
  cookSpeed: food.cookPotTrim,
};

function companionEffects(outfit: Outfit, level = 0): { icon: number; text: string }[] {
  const parts: { icon: number; text: string }[] = [];
  const stats = getOutfitStats(outfit, level);
  const buff = Object.keys(stats.buff).length > 0 ? stats.buff : undefined;
  if (buff) for (const part of describeEffectParts(buff)) parts.push({ icon: EFFECT_ICONS[part.key] ?? icons.star, text: part.text });
  const missChance = stats.missChance;
  if (missChance)
    parts.push({ icon: statIcons.criticalChance, text: t(`${missChance}% 빗나감`, `${missChance}% whiff`, `${missChance}%ミス`, `${missChance}%落空`) });
  const hitCount = stats.hitCount > 1 ? stats.hitCount : 0;
  if (hitCount) parts.push({ icon: skillImages.barrage, text: t(`${hitCount}연타`, `${hitCount}-hit combo`, `${hitCount}連撃`, `${hitCount}连击`) });
  const foodDurationBonus = stats.foodBonusSec;
  if (foodDurationBonus)
    parts.push({
      icon: food.cookPotTrim,
      text: t(`음식 시간 +${foodDurationBonus}초`, `+${foodDurationBonus}s food duration`, `料理時間 +${foodDurationBonus}秒`, `食物时间 +${foodDurationBonus}秒`),
    });
  const firstStrike = stats.firstStrike;
  if (firstStrike)
    parts.push({ icon: statIcons.attack, text: t(`첫 공격 ×${firstStrike}`, `First hit ×${firstStrike}`, `初撃×${firstStrike}`, `首击×${firstStrike}`) });
  if (OUTFIT_SURE_DROPS[outfit]) parts.push({ icon: icons.chest, text: t("재료 드랍 100%", "100% ingredient drop", "素材ドロップ100%", "材料掉落100%") });
  const cooldownReduction = stats.cooldownSec;
  if (cooldownReduction)
    parts.push({
      icon: icons.energy,
      text: t(`쿨타임 -${cooldownReduction}초`, `Cooldown -${cooldownReduction}s`, `クールタイム -${cooldownReduction}秒`, `冷却 -${cooldownReduction}秒`),
    });
  const skillPower = OUTFIT_SKILL_POWER[outfit];
  if (skillPower)
    parts.push({ icon: skillImages.beam, text: t(`스킬 효과 ×${skillPower}`, `Skill power ×${skillPower}`, `スキル効果×${skillPower}`, `技能效果×${skillPower}`) });
  if (OUTFIT_FORCED_MANUAL[outfit])
    parts.push({ icon: skillImages.barrage, text: t("항상 수동 전투", "Always manual combat", "常に手動戦闘", "始终手动战斗") });
  if (OUTFIT_NO_OFFLINE[outfit])
    parts.push({ icon: icons.home, text: t("휴식 중 사냥 안 함", "Doesn't hunt while resting", "休憩中は狩りをしない", "休息期间不狩猎") });
  if (outfit === "witchGini") parts.push({ icon: icons.potionBlue, text: t("모든 공격이 마법", "Every attack is magic", "すべての攻撃が魔法", "所有攻击皆为魔法") });
  const shotsBeforeReload = stats.shotsBeforeReload;
  if (shotsBeforeReload)
    parts.push({
      icon: icons.energy,
      text: t(`${shotsBeforeReload}발 · 재장전 ${stats.reloadMs / 1000}초`, `${shotsBeforeReload} rounds · ${stats.reloadMs / 1000}s reload`, `${shotsBeforeReload}発・リロード ${stats.reloadMs / 1000}秒`, `${shotsBeforeReload}发 · 装填 ${stats.reloadMs / 1000}秒`),
    });
  if (stats.extraHitChance)
    parts.push({
      icon: statIcons.attack,
      text: t(`${stats.extraHitChance}% 추가타`, `${stats.extraHitChance}% extra hit`, `${stats.extraHitChance}%追加打`, `${stats.extraHitChance}%追加打击`),
    });
  return parts.length > 0 ? parts : [{ icon: icons.heart, text: t("동료 없이", "No companion", "一人で", "独自一人") }];
}

// A big icon with a small caption beside it.
function IconFact({ icon, caption, children }: { icon?: number; caption: string; children?: React.ReactNode }) {
  return (
    <View style={styles.fact}>
      {children ?? <Image source={icon} style={styles.factIcon} />}
      <Text style={styles.factCaption}>{caption}</Text>
    </View>
  );
}

// `detail` isn't translated here (module-scope, evaluated once at import — baking in
// whatever language was active then) — call companionDetail(outfit) fresh at display time
// instead (see the preview panel below), which is what every other reader of this array uses.
export const COMPANIONS: { outfit: Outfit; name: string; blurb: string; detail: string; revealedName?: string; revealedBlurb?: string }[] = [
  { outfit: "default", name: "모험기니", blurb: "건초에 지쳐 새로운 끼니를 찾아 세상을 모험하는 기니.", detail: companionDetail("default") },
  {
    outfit: "explorerHamster",
    name: "탐험기니",
    blurb: "전설의 당근을 찾아 세상을 탐험하는 호기심 많은 기니.",
    detail: companionDetail("explorerHamster"),
  },
  {
    outfit: "tetoGini",
    name: "테토기니",
    blurb: "멋을 위해 선글라스를 쓴 헬창 기니. 하지만 어두워서 가끔 헛스윙을 한다.",
    detail: companionDetail("tetoGini"),
  },
  {
    outfit: "assassinGini",
    name: "암살기니",
    blurb: "두건으로 얼굴을 가리고 단검을 숨긴 그림자 속의 자객.",
    detail: companionDetail("assassinGini"),
  },
  {
    outfit: "egenGini",
    name: "꽃잎기니",
    blurb: "벚꽃 지팡이를 든 다정하고 상냥한 기니. 함께 있으면 마음이 편안해진다.",
    revealedName: "구미호기니",
    revealedBlurb: "사실은 기니가 아니라 둔갑한 구미호. 다정한 얼굴 뒤에 아홉 개의 꼬리를 숨기고 있다.",
    detail: companionDetail("egenGini"),
  },
  {
    outfit: "samuraiGini",
    name: "사무라이기니",
    blurb: "벚꽃 해변을 떠도는 과묵한 떠돌이 무사. 칼은 단 한 번 뽑으면 충분하다.",
    detail: companionDetail("samuraiGini"),
  },
  {
    outfit: "chefGini",
    name: "셰프기니",
    blurb: "빵집 골목 주방에서 반죽하던 요리사 기니. 국자 하나면 어떤 요리든 뚝딱이다.",
    detail: companionDetail("chefGini"),
  },
  {
    outfit: "witchGini",
    name: "마녀기니",
    blurb: "수상한 집의 마법을 연구하던 기니. 모든 공격이 마법이라, 제자리에서 불꽃·얼음·독·번개·빛·유령불 등 여러 마법을 쏘아 싸운다.",
    detail: `${companionDetail("witchGini")} · 모든 공격이 마법`,
  },
  // After 마녀기니 (36스테이지, loop 1): 복서기니 only joins once loop 2 is done.
  {
    outfit: "boxerGini",
    name: "복서기니",
    blurb: "글러브를 벗는 법이 없는 열혈 복서. 2회차를 마칠 때쯤 단련 끝에 합류한다.",
    detail: companionDetail("boxerGini"),
  },
  // Loop 3's free grant (OUTFIT_LOOP_GRANT), same mechanism as 복서기니 above.
  {
    outfit: "cowboyGini",
    name: "카우보이기니",
    blurb: "총을 뽑아 든 서부의 총잡이 기니. 3회차를 마치면 합류한다.",
    detail: companionDetail("cowboyGini"),
  },
  // 기니상자 전용 (BOX_RESCUE_OUTFITS). 다른 상자 전용 동료와 달리 진짜 능력이 있어서
  // transparentGiniDetail()로 따로 설명 — OUTFIT_NO_ATTACK(공격 불가) + 3초마다 일반 몹을
  // 공짜로 지나침(useGameState.ts의 스킵 타이머), 보스는 지나칠 수 없어 장착 스킬로만 잡는다.
  {
    outfit: "transparentGini",
    name: "투명기니",
    blurb: "너무 투명해서 몹들도 눈치를 못 채는 기니. 슬쩍 지나가면 몹은 자기가 왜 없어졌는지도 모른다 — 그치만 보스는 눈치가 빨라서 안 통한다. 4회차부터 기니상자에서 무작위로 나타난다.",
    detail: transparentGiniDetail(),
  },
  {
    outfit: "nurseGini",
    name: "간호사기니",
    blurb: "주사기를 든 상냥한 간호사 기니. 기니상자에서 무작위로 나타난다.",
    detail: noEffectDetail(),
  },
  {
    outfit: "archerGini",
    name: "궁수기니",
    blurb: "활과 화살을 다루는 숲의 궁수 기니. 기니상자에서 무작위로 나타난다.",
    detail: noEffectDetail(),
  },
  {
    outfit: "detectiveGini",
    name: "탐정기니",
    blurb: "돋보기를 든 명탐정 기니. 기니상자에서 무작위로 나타난다.",
    detail: noEffectDetail(),
  },
  {
    outfit: "plainGini",
    name: "그냥기니",
    blurb: "아무 꾸밈도 없는 그냥 기니. 기니상자에서 무작위로 나타난다.",
    detail: noEffectDetail(),
  },
  {
    outfit: "knightGini",
    name: "기사기니",
    blurb: "검과 방패를 든 용맹한 기사 기니. 기니상자에서 무작위로 나타난다.",
    detail: noEffectDetail(),
  },
  {
    outfit: "sageGini",
    name: "현자기니",
    blurb: "지팡이와 마법서를 든 늙은 현자 기니. 기니상자에서 무작위로 나타난다.",
    detail: noEffectDetail(),
  },
];

// witchGini's extra " · 모든 공격이 마법" suffix on its detail (baked in above) — translated
// separately so the live companionDetail() call at display time can append it too.
const WITCH_EXTRA_DETAIL = "모든 공격이 마법";

// 기니상자 전용 코스메틱 동료(BOX_RESCUE_OUTFITS) 전부가 쓰는 공용 문구 — companionDetail은
// 쓸 게 없으면 "동료 없이 다닐 때"(장비 안 한 기본값 문구)로 빠지는데, 진짜로 장비 중인 동료에
// 쓰면 헷갈려서 이걸로 대체한다.
function noEffectDetail() {
  return t("딱히 효과는 없음 (장식용 동료)", "No real effect (cosmetic companion)", "特に効果はない（装飾用の仲間）", "没有实际效果（装饰用同伴）");
}

// 투명기니만의 진짜 능력 — companionDetail()이 읽는 숫자 스탯(OutfitStats)에 없는 거라 직접 쓴다.
function transparentGiniDetail() {
  return t(
    "공격을 하지 않음 — 대신 3초마다 몹이나 중간보스를 슬쩍 지나침(골드·재료 없이 처치 처리, 보스는 못 지나침)",
    "Never attacks — instead slips past a mob or mini-boss every 3s (counts as defeated, no gold or materials; can't skip a real boss)",
    "攻撃はしない — 代わりに3秒ごとにモンスターや中ボスをこっそりすり抜ける（撃破扱いだが金貨・素材はなし、ボスには通用しない）",
    "不进行攻击——取而代之，每3秒悄悄放过小怪或中boss（算作击败但没有金币和材料，对真正的boss无效）",
  );
}

// One fact about a companion on a soft cream plate: a small label over its value.
function InfoTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Panel slice={creamSlices.cell} scale={0.2} style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <View style={styles.tileFacts}>{children}</View>
    </Panel>
  );
}

// Puffs of smoke around the preview while the companion swaps outfits, then a little pop.
const PUFFS = [
  { x: -30, y: -10 },
  { x: 28, y: -18 },
  { x: -18, y: 26 },
  { x: 24, y: 20 },
  { x: 0, y: -34 },
];

function OutfitSwap({ animate, children }: { animate: boolean; children: React.ReactNode }) {
  const pop = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (animate) pop.value = withDelay(180, withSequence(withTiming(1.15, { duration: 180, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 140 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, pop.value * 2), transform: [{ scale: pop.value }] }));
  return (
    <View style={styles.swap}>
      {animate && PUFFS.map((puff, index) => <SmokePuff key={index} {...puff} />)}
      <Animated.View style={style}>{children}</Animated.View>
    </View>
  );
}

function SmokePuff({ x, y }: { x: number; y: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: (1 - t.value) * 0.9,
    transform: [{ translateX: x * t.value }, { translateY: y * t.value }, { scale: 0.5 + t.value * 1.1 }],
  }));
  return <Animated.View style={[styles.puff, style]} pointerEvents="none" />;
}

// The padlock of a newly joined companion jumps, spins off and fades away.
function BreakingLock() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(350, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateY: -t.value * 26 + t.value * t.value * 30 }, { translateX: t.value * 14 }, { rotate: `${t.value * 200}deg` }, { scale: 1 + t.value * 0.3 }],
  }));
  return (
    <Animated.View style={[styles.breaking, style]} pointerEvents="none">
      <LockBadge />
    </Animated.View>
  );
}

const PREVIEW_SPRITE_SIZE = 108;
// Height / width of the battle backgrounds (1168x880).
const BACKDROP_ASPECT = 880 / 1168;

// How a still-locked companion joins, for its ??? card.
function unlockCondition(outfit: Outfit) {
  const gemOnlyPrice = OUTFIT_GEM_PRICE[outfit];
  const loopGrant = OUTFIT_LOOP_GRANT[outfit];
  if (gemOnlyPrice !== undefined) {
    return loopGrant !== undefined
      ? t(
          `보석 ${gemOnlyPrice}개로 해금 · ${loopGrant}회차 완료 시 무료 합류`,
          `Unlock for ${gemOnlyPrice} gems · joins free after loop ${loopGrant}`,
          `宝石${gemOnlyPrice}個で解放・${loopGrant}周目クリアで無料加入`,
          `花费${gemOnlyPrice}颗宝石解锁·完成第${loopGrant}周目后免费加入`,
        )
      : t(`보석 ${gemOnlyPrice}개로 해금`, `Unlock for ${gemOnlyPrice} gems`, `宝石${gemOnlyPrice}個で解放`, `花费${gemOnlyPrice}颗宝石解锁`);
  }
  if (loopGrant !== undefined)
    return t(`${loopGrant}회차 완료 시 합류`, `Joins after loop ${loopGrant}`, `${loopGrant}周目クリアで加入`, `完成第${loopGrant}周目后加入`);
  if (BOX_RESCUE_OUTFITS.includes(outfit))
    return t(
      "4회차부터, 회차를 마칠 때 기니상자에서 무작위로 발견",
      "Found at random from the Gini Box, starting loop 4's clear",
      "4周目から、周回クリア時にギニー箱からランダムに発見",
      "从第4周目开始，通关时从吉妮宝箱中随机发现",
    );
  return t(
    `${OUTFIT_UNLOCK_STAGE[outfit]}스테이지 도달 시 합류 · 보석 ${OUTFIT_EARLY_UNLOCK_GEMS}개로 미리 해금`,
    `Joins on reaching stage ${OUTFIT_UNLOCK_STAGE[outfit]} · unlock early for ${OUTFIT_EARLY_UNLOCK_GEMS} gems`,
    `ステージ${OUTFIT_UNLOCK_STAGE[outfit]}到達で加入・宝石${OUTFIT_EARLY_UNLOCK_GEMS}個で先行解放`,
    `抵达第${OUTFIT_UNLOCK_STAGE[outfit]}关后加入·花费${OUTFIT_EARLY_UNLOCK_GEMS}颗宝石提前解锁`,
  );
}

export function getCompanionName(outfit: Outfit, state: Pick<GameState, "bossesCleared">) {
  return t(getOutfitName(outfit, state));
}

export function CompanionsScreen({
  equippedOutfit,
  highestStageNumber,
  onEquip,
  outfitsSeen,
  onSeen,
  gems,
  purchasedOutfits,
  onPurchase,
  onOpenShop,
  progress,
  onUpgrade,
}: {
  // 동료 승급 (state/progression.ts); labUnlocked for the 연구소-gated cap past Lv.5;
  // bossesCleared for egenGini's 꽃잎기니→구미호기니 name/blurb reveal (getCompanionInfo).
  progress: Pick<GameState, "companionLevels" | "companionShards" | "labUnlocked" | "bossesCleared">;
  onUpgrade: (outfit: Outfit) => void;
  equippedOutfit: Outfit;
  // Furthest stage reached (0-based) — companions join on arriving at their stage.
  highestStageNumber: number;
  onEquip: (outfit: Outfit) => void;
  // Companions shown unlocked last visit (undefined = never tracked), and the report on leaving.
  outfitsSeen: Outfit[] | undefined;
  onSeen: (outfits: Outfit[]) => void;
  // For gem-bought companions — any stage one unlocked early (OUTFIT_EARLY_UNLOCK_GEMS).
  gems: number;
  purchasedOutfits: Outfit[] | undefined;
  onPurchase: (outfit: Outfit) => void;
  onOpenShop: () => void;
}) {
  const equippedItem = COMPANIONS.find((item) => item.outfit === equippedOutfit) ?? COMPANIONS[0];
  // egenGini shows as "꽃잎기니" until her own stage's boss falls, then "구미호기니" — see buffs.ts's getOutfitName.
  const companionDisplay = (item: (typeof COMPANIONS)[number]) =>
    item.revealedName && isGumihoRevealed(progress) ? { name: item.revealedName, blurb: item.revealedBlurb ?? item.blurb } : { name: item.name, blurb: item.blurb };
  const [previewWidth, setPreviewWidth] = useState(0);
  // A locked companion whose gem button was tapped: confirm before spending.
  const [buying, setBuying] = useState<Outfit | null>(null);
  const unlockedNow = COMPANIONS.filter((item) => isOutfitUnlocked(item.outfit, highestStageNumber, purchasedOutfits)).map((item) => item.outfit);
  // Unlocked since the last visit: their padlock breaks open this time.
  const [freshlyUnlocked] = useState(() => (outfitsSeen ? unlockedNow.filter((outfit) => !outfitsSeen.includes(outfit)) : []));
  const [outfitOnArrival] = useState(equippedOutfit);
  const latest = useRef({ unlockedNow, onSeen });
  useEffect(() => {
    latest.current = { unlockedNow, onSeen };
  });
  useEffect(() => () => latest.current.onSeen(latest.current.unlockedNow), []);

  return (
    <View style={styles.page}>
      <PageHeading kicker="FRIENDS" title={t("동료", "Companions")} description={t("혼자보다 덜 쓸쓸하고, 조금 더 세다.", "Less lonely than alone, and a little stronger.")} />

      {/* Wooden frame around a slice of the forest stage, with the companion standing on its
          ground and a dark scrim behind the copy that fades out toward the right. */}
      <Panel slice={shopKit.frameWide} scale={0.32} style={styles.previewFrame}>
        <View style={styles.preview} onLayout={(event) => setPreviewWidth(event.nativeEvent.layout.width)}>
          {previewWidth > 0 && (
            <Image
              source={images.battleBackground}
              resizeMode="stretch"
              style={[styles.previewBackdrop, { width: previewWidth, height: previewWidth * BACKDROP_ASPECT }]}
            />
          )}
          <LinearGradient
            colors={["#14100ce6", "#14100cb3", "#14100c00"]}
            locations={[0, 0.45, 0.78]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.previewScrim}
            pointerEvents="none"
          />
          <View style={styles.previewCopy}>
            <Text style={styles.previewTitle}>{t(companionDisplay(equippedItem).name)}</Text>
            <Text style={styles.previewBlurb}>{t(companionDisplay(equippedItem).blurb)}</Text>
            <Text style={styles.previewSub}>
              {equippedItem.outfit === "witchGini"
                ? `${companionDetail(equippedItem.outfit, getCompanionLevel(progress, equippedItem.outfit))} · ${t(WITCH_EXTRA_DETAIL, "Every attack is magic")}`
                : equippedItem.outfit === "transparentGini"
                  ? transparentGiniDetail()
                  : // companionDetail falls back to "동료 없이 다닐 때" (meant for having none
                    // equipped at all) when there's nothing to list — wrong message for a real,
                    // equipped companion that's just permanently statless.
                    BOX_RESCUE_OUTFITS.includes(equippedItem.outfit)
                    ? noEffectDetail()
                    : companionDetail(equippedItem.outfit, getCompanionLevel(progress, equippedItem.outfit))}
            </Text>
          </View>
          <View style={styles.previewSprite}>
            <OutfitSwap key={equippedOutfit} animate={equippedOutfit !== outfitOnArrival}>
              <CharacterSprite outfit={equippedOutfit} animation="idle" size={PREVIEW_SPRITE_SIZE} restartKey={equippedOutfit} />
            </OutfitSwap>
          </View>
        </View>
      </Panel>

      <View style={styles.list}>
        {COMPANIONS.map((item) => {
          const equipped = item.outfit === equippedOutfit;
          const unlockStage = OUTFIT_UNLOCK_STAGE[item.outfit];
          const gemPrice = getOutfitGemPrice(item.outfit);
          const loopGrant = OUTFIT_LOOP_GRANT[item.outfit];
          const locked = !equipped && !isOutfitUnlocked(item.outfit, highestStageNumber, purchasedOutfits);
          const affordable = gemPrice !== undefined && gems >= gemPrice;
          const level = getCompanionLevel(progress, item.outfit);
          const shards = getCompanionShards(progress, item.outfit);
          const shardCost = getShardCost(level);
          const trueMax = level >= COMPANION_MAX_LEVEL;
          // Soft-capped at Lv.5 until 연구소's 동료 승급 한계 해제 is researched (lab.ts).
          const maxed = level >= getCompanionLevelCap(progress);
          const pendingLabUnlock = maxed && !trueMax;
          const canUpgrade = !locked && !maxed && shards >= shardCost;
          return (
            <Panel slice={equipped ? kit.panel : kit.inset} style={styles.card} key={item.outfit}>
              <View style={styles.cardHead}>
              <View>
                {/* Portrait in a wood ring (gold for the one along now). A locked companion
                    is just a black silhouette — no name, no blurb, no effects; when it joins
                    is on its button instead. */}
                <View style={styles.avatar}>
                  <Image source={equipped ? frameImages.ringGold : frameImages.ringWood} style={styles.avatarRing} />
                  <View style={styles.avatarInner}>
                    <CharacterSprite outfit={item.outfit} animation="idle" size={46} restartKey={item.outfit} tintColor={locked ? "#000" : undefined} />
                  </View>
                </View>
                {freshlyUnlocked.includes(item.outfit) && <BreakingLock />}
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardStrong}>{locked ? "???" : t(companionDisplay(item).name)}</Text>
                {locked ? (
                  // The one thing a locked companion does say: how to get it.
                  <Text style={styles.cardBlurb}>{unlockCondition(item.outfit)}</Text>
                ) : (
                  <Text style={styles.cardBlurb}>{t(companionDisplay(item).blurb)}</Text>
                )}
              </View>
              {locked && gemPrice !== undefined ? (
                // Short of gems: just greyed out (no detour to the shop).
                <GameButton
                  variant={affordable ? "beige" : "gray"}
                  disabled={!affordable}
                  onPress={() => setBuying(item.outfit)}
                  style={styles.equipButton}
                  textStyle={styles.equipButtonText}
                  accessibilityLabel={t(`보석 ${gemPrice}개로 동료 열기`, `Unlock companion for ${gemPrice} gems`)}
                >
                  <View style={styles.gemCost}>
                    <Image source={uiImages.crystal} style={styles.gemIcon} />
                    <Text style={[styles.gemButtonText, !affordable && styles.gemButtonTextOff]}>{t(`${gemPrice}개로 열기`, `Unlock for ${gemPrice}`)}</Text>
                  </View>
                </GameButton>
              ) : (
                <GameButton
                  variant={equipped ? "green" : locked ? "gray" : "beige"}
                  disabled={locked}
                  onPress={() => onEquip(item.outfit)}
                  style={styles.equipButton}
                  textStyle={styles.equipButtonText}
                >
                  {equipped
                    ? t("모험 중", "On the Journey")
                    : locked
                      ? loopGrant !== undefined
                        ? t(`${loopGrant}회차 완료`, `Loop ${loopGrant} Complete`)
                        : t(`${unlockStage}스테이지`, `Stage ${unlockStage}`)
                      : t("모험 합류", "Join the Journey")}
                </GameButton>
              )}
              </View>
              {/* 승급: the shard badge (its colour shows the tier), level, shards toward the next
                  level, and the button — the one place on the card that grows the companion. */}
              {!locked && (
                <View style={styles.growth}>
                  <Image source={shardImageForLevel(level)} style={styles.growthIcon} />
                  <View style={styles.growthCopy}>
                    <Text style={styles.growthLevel}>{trueMax ? t(`Lv.${level} 최고`, `Lv.${level} Max`) : `Lv.${level}`}</Text>
                    <ProgressBar
                      progress={maxed ? 100 : Math.min(100, (shards / shardCost) * 100)}
                      fill={trueMax ? "blue" : pendingLabUnlock ? "gold" : canUpgrade ? "green" : "gold"}
                      height={16}
                      label={trueMax ? t("최고 레벨", "Max") : pendingLabUnlock ? t("연구소 필요", "Lab Needed") : `${shards} / ${shardCost}`}
                    />
                  </View>
                  {!maxed && (
                    <Text style={styles.nextUpgradeHint} numberOfLines={3}>
                      {t(OUTFIT_GROWTH_HINT[item.outfit][0], OUTFIT_GROWTH_HINT[item.outfit][1], OUTFIT_GROWTH_HINT[item.outfit][2], OUTFIT_GROWTH_HINT[item.outfit][3])}
                    </Text>
                  )}
                  {pendingLabUnlock && (
                    <Text style={styles.nextUpgradeHint} numberOfLines={3}>
                      {t("연구소에서 승급 한계를 풀어야 더 키울 수 있어요.", "Research in the Lab to raise the upgrade cap further.")}
                    </Text>
                  )}
                  {!maxed && (
                    <GameButton
                      variant={canUpgrade ? "green" : "gray"}
                      disabled={!canUpgrade}
                      onPress={() => onUpgrade(item.outfit)}
                      style={styles.upgradeButton}
                      textStyle={styles.equipButtonText}
                      accessibilityLabel={t(
                        `${companionDisplay(item).name} 승급`,
                        `Upgrade ${t(companionDisplay(item).name)}`,
                        `${t(companionDisplay(item).name)}を昇格`,
                        `升级${t(companionDisplay(item).name)}`,
                      )}
                    >
                      {t("승급", "Upgrade")}
                    </GameButton>
                  )}
                </View>
              )}
              {/* What the companion does, as little cards rather than lines of text — kept
                  hidden until it joins. */}
              {!locked && <View style={styles.tiles}>
                <InfoTile label={t("적용 효과", "Effects")}>
                  {companionEffects(item.outfit, level).map((effect) => (
                    <IconFact key={effect.text} icon={effect.icon} caption={effect.text} />
                  ))}
                </InfoTile>
                <InfoTile label={t(`조각 획득 +${SHARDS_PER_BOSS}`, `Shards +${SHARDS_PER_BOSS}`)}>
                  <IconFact
                    caption={t(
                      `${BOSS_NAME[getEnemyKind(COMPANION_SHARD_STAGE[item.outfit])]}\n${getStageCode(COMPANION_SHARD_STAGE[item.outfit])}스테이지 보스`,
                      `${t(BOSS_NAME[getEnemyKind(COMPANION_SHARD_STAGE[item.outfit])])}\nStage ${getStageCode(COMPANION_SHARD_STAGE[item.outfit])} Boss`,
                      `${t(BOSS_NAME[getEnemyKind(COMPANION_SHARD_STAGE[item.outfit])])}\nステージ${getStageCode(COMPANION_SHARD_STAGE[item.outfit])}ボス`,
                      `${t(BOSS_NAME[getEnemyKind(COMPANION_SHARD_STAGE[item.outfit])])}\n第${getStageCode(COMPANION_SHARD_STAGE[item.outfit])}关首领`,
                    )}
                  >
                    <View style={styles.factSprite}>
                      <EnemySprite boss kind={getEnemyKind(COMPANION_SHARD_STAGE[item.outfit])} animation="idle" size={44} restartKey={`shard-${item.outfit}`} />
                    </View>
                  </IconFact>
                </InfoTile>
                <InfoTile label={t("액티브 스킬", "Active Skill")}>
                  <IconFact icon={companionSkillImages[item.outfit]} caption={`${t(COMPANION_SKILL_NAMES[item.outfit])} · ${t(COMPANION_SKILL_SUMMARIES[item.outfit])}`} />
                </InfoTile>
              </View>}
            </Panel>
          );
        })}
      </View>
      {buying && (() => {
        const price = getOutfitGemPrice(buying) ?? 0;
        const gemOnly = buying in OUTFIT_GEM_PRICE;
        return (
          <ConfirmModal
            // Still locked, so the name stays hidden here too.
            title={t("??? 데려오기", "Bring Along ???")}
            message={
              gemOnly
                ? t(
                    `보석 ${price}개로 이 동료를 데려올까요?`,
                    `Bring this companion along for ${price} gems?`,
                    `宝石${price}個でこの仲間を連れていきますか？`,
                    `花费${price}颗宝石带上这位同伴吗？`,
                  )
                : t(
                    `보석 ${price}개로 이 동료를 지금 바로 데려올까요? (${OUTFIT_UNLOCK_STAGE[buying]}스테이지에 도착하면 무료로 합류해요)`,
                    `Bring this companion along right now for ${price} gems? (It joins free on reaching stage ${OUTFIT_UNLOCK_STAGE[buying]})`,
                    `宝石${price}個で今すぐこの仲間を連れていきますか？（ステージ${OUTFIT_UNLOCK_STAGE[buying]}に到達すると無料で加入します）`,
                    `花费${price}颗宝石现在就带上这位同伴吗？（抵达第${OUTFIT_UNLOCK_STAGE[buying]}关后可免费加入）`,
                  )
            }
            confirmLabel={t(`보석 ${price}개 쓰기`, `Spend ${price} Gems`, `宝石${price}個を使う`, `花费${price}颗宝石`)}
            onConfirm={() => {
              onPurchase(buying);
              setBuying(null);
            }}
            onCancel={() => setBuying(null)}
          />
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#e8dcc4", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 25 },
  previewFrame: { padding: 11, marginBottom: 12 },
  preview: { height: 170, flexDirection: "row", alignItems: "center", overflow: "hidden", borderRadius: 4 },
  // Pinned to the bottom so the forest floor sits under the companion's feet.
  previewBackdrop: { position: "absolute", left: 0, bottom: -10 },
  previewScrim: { position: "absolute", top: 0, left: 0, bottom: 0, right: 0 },
  // Copy takes the left part; the companion gets the rest and is centred inside it.
  previewCopy: { width: "58%", paddingLeft: 16, paddingRight: 4 },
  previewTitle: { marginTop: 4, fontSize: 22, fontWeight: "800", fontFamily: fonts.bold, color: colors.cream },
  previewBlurb: { fontFamily: fonts.light, letterSpacing: -0.36, marginTop: 4, color: "#efe7d4", fontSize: 12, fontStyle: "italic", lineHeight: 16 },
  previewSub: { marginTop: 5, color: "#f3d993", fontSize: 12, fontWeight: "800", fontFamily: fonts.bold },
  previewSprite: { flex: 1, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  list: { gap: 8 },
  growth: { flexDirection: "row", alignItems: "center", gap: 8 },
  growthIcon: { width: 36, height: 35, resizeMode: "contain" },
  growthCopy: { flex: 1, gap: 3 },
  growthLevel: { fontSize: 14, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  upgradeButton: { minWidth: 60, minHeight: 40 },
  nextUpgradeHint: { width: 72, marginRight: 4, fontSize: 10, lineHeight: 12, fontFamily: fonts.light, letterSpacing: -0.3, color: colors.muted, textAlign: "right" },
  swap: { alignItems: "center", justifyContent: "center" },
  puff: { position: "absolute", width: 36, height: 36, borderRadius: 18, backgroundColor: "#f3eee2" },
  breaking: { position: "absolute", right: 0, bottom: 0, width: 24, height: 24 },
  card: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 15, gap: 10 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  // Two per row; an odd one out stretches across.
  tile: { flexBasis: "45%", flexGrow: 1, paddingHorizontal: 10, paddingTop: 7, paddingBottom: 9 },
  tileLabel: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: "#b0632a" },
  tileFacts: { marginTop: 5, gap: 6 },
  // Icon first, its caption to the right.
  fact: { flexDirection: "row", alignItems: "center", gap: 6 },
  factIcon: { width: 34, height: 34, resizeMode: "contain" },
  factSprite: { width: 40, height: 40, alignItems: "center", justifyContent: "flex-end", overflow: "hidden" },
  factCaption: { flexShrink: 1, fontFamily: fonts.light, letterSpacing: -0.36, fontSize: 12, lineHeight: 15, color: colors.brown },
  // ring-wood.png's opening is ~55% of its width; the face is clipped to that circle.
  avatar: { width: 66, height: 66, alignItems: "center", justifyContent: "center" },
  avatarRing: { position: "absolute", left: 0, top: 0, width: 66, height: 66 },
  avatarInner: { width: 37, height: 37, borderRadius: 18.5, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  avatarGem: { width: 24, height: 24, resizeMode: "contain" },
  avatarStage: { fontSize: 16, lineHeight: 18, fontWeight: "900", fontFamily: fonts.bold, color: colors.brown },
  // Squeezed inside the ring's opening — one of the few labels kept under 12pt.
  avatarStageLabel: { fontSize: 8, lineHeight: 9, fontWeight: "800", fontFamily: fonts.bold, color: colors.muted },
  cardCopy: { flex: 1 },
  cardStrong: { marginVertical: 2, fontSize: 14, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink },
  cardBlurb: { fontFamily: fonts.light, letterSpacing: -0.36, color: colors.muted, fontSize: 12, lineHeight: 16, fontStyle: "italic", marginBottom: 2 },
  equipButton: { minWidth: 70 },
  equipButtonText: { fontSize: 12 },
  gemButtonText: { fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  gemButtonTextOff: { color: "#4f463c" },
  gemCost: { flexDirection: "row", alignItems: "center", gap: 3 },
  gemIcon: { width: 12, height: 12, resizeMode: "contain" },
});
