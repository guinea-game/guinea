import { useEffect, useRef, useState } from "react";
import { DishPicker } from "../components/DishPicker";
import { BattleActionsPanel } from "../components/BattleActionsPanel";
import { BuffSlots } from "../components/BuffSlots";
import { BattleMenu } from "../components/BattleMenu";
import { SkillSlot } from "../components/SkillSlot";
import { CompanionSkillSlot } from "../components/CompanionSkillSlot";
import { View } from "react-native";
import { RewardedAdModal } from "../components/RewardedAdModal";
import { BattleScene } from "./BattleScene";
import { StatUpgradePanel } from "./StatUpgradePanel";
import { BOSS_AD_BUFF_ATTACK_PERCENT, BOSS_RETRY_TIME_RATIO, type UseGameState } from "../state/useGameState";
import { getBossTimeLimitMs } from "../state/gameMath";
import { getEnemyKind, getStageLabel } from "../state/stages";
import { getBagCapacity, slotsUsed } from "../state/bag";
import { playSfx } from "../sound";
import { ConfirmModal } from "../components/ConfirmModal";
import { EventModal } from "../components/EventModal";
import { BUFF_SLOT_PRICES, getOutfitName } from "../state/buffs";
import type { EnemyKind } from "../types";
import { hasClaimableQuest } from "../state/quests";
import { hasClaimableLevelReward } from "../state/levelRewards";
import { isDailyAllDone } from "../state/daily";
import { getMenuPageLockCaption, isMenuPageUnlocked, type MenuPage } from "../state/menuUnlocks";
import { t } from "../i18n";

export function BattleScreen({ game }: { game: UseGameState }) {
  const {
    state,
    battle,
    upgradeMode,
    upgradeStat,
    upgraded,
    enemyMaxHp,
    boss,
    displayBoss,
    isBossDefeatFlash,
    defeatedStageNumber,
    bossSkillCastId,
    bossSkillConfig,
    bossReviveId,
  } = game;
  // stageNumber advances the instant a boss dies, before its ~650ms death clip finishes —
  // keep showing the stage it died in (not the next one) for the rest of that clip, same
  // as `displayBoss` already does, or the die animation flashes the next boss.
  const displayStageNumber = isBossDefeatFlash ? defeatedStageNumber : state.stageNumber;
  const regularEnemyKind: EnemyKind = getEnemyKind(displayStageNumber);
  // Derived live from stageNumber rather than the saved `state.currentStage` string, so a
  // save written before a stage-label wording change can't show a stale label.
  const stageLabel = getStageLabel(displayStageNumber);
  // Which empty buff slot the dish picker is filling, if it's open.
  const [pickingSlot, setPickingSlot] = useState<number | null>(null);
  // A locked food slot that was tapped: confirm the gem price (slots open in order).
  const [unlockingSlot, setUnlockingSlot] = useState<number | null>(null);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [bossBuffAdModalOpen, setBossBuffAdModalOpen] = useState(false);

  // The entrance banner shows once the boss sprite is actually up (displayBoss — not at the
  // 25th-kill moment, that's still mid mob-death-clip) and stays until tapped.
  const bossEntranceKey = displayBoss && game.bossIntroPending ? `${regularEnemyKind}-${battle.enemyId}` : null;
  const wasDisplayBoss = useRef(displayBoss);
  useEffect(() => {
    if (displayBoss && !wasDisplayBoss.current) playSfx("bossEnter");
    wasDisplayBoss.current = displayBoss;
  }, [displayBoss]);

  const [eventOpen, setEventOpen] = useState(false);

  return (
    <>
      <BattleScene
        critical={battle.lastCritical}
        damageEvents={battle.damageEvents}
        enemyHp={battle.enemyHp}
        enemyMaxHp={enemyMaxHp}
        boss={displayBoss}
        miniBoss={game.displayMiniBoss}
        bossEnraged={game.bossEnraged}
        miniBossDefeated={game.isMiniDefeatFlash}
        golden={game.displayGolden}
        goldenReward={game.goldenReward}
        bossReward={game.bossReward}
        enemyKind={regularEnemyKind}
        foeKind={game.displayStrayKind ?? regularEnemyKind}
        phase={battle.phase}
        enemyId={battle.enemyId}
        reloadInfo={battle.reloadInfo}
        shotId={battle.shotId}
        fannedShot={battle.fannedShot}
        lastGoldReward={battle.lastGoldReward}
        stageAdvance={game.stageAnnouncement}
        onContinueStage={game.continueStage}
        battleSpeed={game.battleSpeed}
        stageLabel={
          game.bossEnraged
            ? `${stageLabel} · ${t("분노한 보스", "Enraged Boss")}`
            : boss
              ? `${stageLabel} · ${t("보스", "Boss")}`
              : game.displayMiniBoss
                ? `${stageLabel} · ${game.displayGolden ? t("황금 ", "Golden ") : ""}${t("중간 보스", "Mid-Boss")}`
                : stageLabel
        }
        stageKills={state.stageKills}
        onOpenMap={() => game.setState((previous) => ({ ...previous, selectedTab: "milestone" }))}
        outfit={state.equippedOutfit}
        playerName={getOutfitName(state.equippedOutfit, state)}
        manualEnabled={!battle.isAutoBattle || state.equippedOutfit === "cowboyGini"}
        autoBattle={!battle.manualActive}
        onManualAttack={battle.manualAttack}
        foodBar={
          <BuffSlots
            slots={game.buffSlots}
            now={game.now}
            outfit={state.equippedOutfit}
            unlocked={state.buffSlotsUnlocked ?? 1}
            onPressSlot={setPickingSlot}
            onPressLocked={setUnlockingSlot}
          />
        }
        onCatchFlyingCoin={game.catchFlyingCoin}
        flyingGemsLeft={game.flyingGemAdsLeft}
        giftKills={state.giftKills ?? 0}
        heldLoot={game.heldLoot}
        skillBar={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <SkillSlot
              skillId={state.equippedSkill ?? null}
              timers={battle.skillTimers}
              now={game.now}
              canCast={!game.bossIntroPending && (state.equippedSkill === "teleport" ? game.canTeleportToBoss(game.now) : battle.canCastSkill(game.now))}
              onCast={state.equippedSkill === "teleport" ? game.teleportToBoss : battle.castSkill}
              onOpenSkills={() => game.setState((previous) => ({ ...previous, selectedTab: "skills" }))}
            />
            <CompanionSkillSlot
              outfit={state.equippedOutfit}
              readyAt={game.companionSkillReadyAt}
              activeUntil={game.companionSkillActiveUntil}
              now={game.now}
              canCast={game.canCastCompanionSkill(game.now)}
              onCast={game.castCompanionSkill}
            />
          </View>
        }
        goldEvents={battle.goldEvents}
        executeId={battle.executeId}
        firstStrikeId={battle.firstStrikeId}
        companionSkillCastId={game.companionSkillCastId}
        executedKill={battle.lastKillExecuted}
        beamId={battle.castIds.beam}
        stealId={battle.castIds.steal}
        focusId={battle.castIds.focus}
        barrageId={battle.castIds.barrage}
        teleportId={battle.castIds.teleport}
        shoutId={battle.castIds.shout}
        carrotThrowId={battle.castIds.carrotThrow}
        chiliThrowId={battle.castIds.chiliThrow}
        meteorStrikeId={battle.meteorStrikeId}
        dropEvents={game.dropEvents}
        bossEntranceKey={bossEntranceKey}
        bossFirstMeet={!game.clearedStages.includes(state.stageNumber)}
        onBeginBoss={game.beginBossFight}
        onWatchBossBuffAd={game.bossBuffRemainingMs > 0 ? undefined : () => setBossBuffAdModalOpen(true)}
        bossBuffActive={game.bossBuffRemainingMs > 0}
        bossBuffPercent={BOSS_AD_BUFF_ATTACK_PERCENT}
        levelUpAnnouncement={game.levelUpAnnouncement}
        now={game.now}
        bossTimerStartedAt={game.bossTimerStartedAt}
        bossTimeLimitMs={game.bossTimeLimitMs}
        bossFledKey={game.bossFledKey}
        bossSkillCastId={bossSkillCastId}
        bossSkillConfig={bossSkillConfig}
        bossReviveId={bossReviveId}
      />
      {unlockingSlot !== null && (() => {
        const next = state.buffSlotsUnlocked ?? 1;
        const price = BUFF_SLOT_PRICES[next];
        const outOfOrder = unlockingSlot > next;
        const affordable = state.gems >= price;
        return (
          <ConfirmModal
            title={t(`음식 슬롯 ${next + 1} 열기`, `Open Food Slot ${next + 1}`)}
            message={
              outOfOrder
                ? t(
                    `슬롯은 차례대로 열려요. 먼저 슬롯 ${next + 1}을 보석 ${price}개로 열 수 있어요.`,
                    `Slots open in order. You can open slot ${next + 1} first for ${price} gems.`,
                  )
                : affordable
                  ? t(
                      `보석 ${price}개로 음식 슬롯을 하나 더 열까요? 음식 버프를 동시에 더 받을 수 있어요.`,
                      `Open one more food slot for ${price} gems? You'll be able to run more food buffs at once.`,
                    )
                  : t(
                      `보석이 ${price - state.gems}개 모자라요. 상점에서 보석을 모아 올까요?`,
                      `You're ${price - state.gems} gems short. Head to the shop to get more?`,
                    )
            }
            confirmLabel={affordable ? t(`보석 ${price}개로 열기`, `Open for ${price} Gems`) : t("상점으로", "Go to Shop")}
            onConfirm={() => {
              if (affordable) game.unlockBuffSlot();
              else game.setState((previous) => ({ ...previous, selectedTab: "shop" }));
              setUnlockingSlot(null);
            }}
            onCancel={() => setUnlockingSlot(null)}
          />
        );
      })()}
      {pickingSlot !== null && (
        <DishPicker
          inventory={state.inventory}
          dishQuality={state.dishQuality}
          slots={game.buffSlots}
          now={game.now}
          outfit={state.equippedOutfit}
          onEat={(recipeId) => {
            game.eatDish(pickingSlot, recipeId);
            setPickingSlot(null);
          }}
          onClose={() => setPickingSlot(null)}
          guideRecipeId={state.tutorialDone && !state.recipeTutorialDone ? "green-jelly" : undefined}
          onGoCook={() => {
            setPickingSlot(null);
            game.setState((previous) => ({ ...previous, selectedTab: "kitchen" }));
          }}
        />
      )}
      {adModalOpen && (
        <RewardedAdModal
          message={t("대신 섭섭하지 않게 2배속 효과는 그대로 챙겨드릴게요.", "No worries — you'll still get the 2x speed boost.")}
          claimLabel={t("2배속 받기", "Get 2x Speed")}
          onClaim={() => {
            game.watchAdForSpeedBoost();
            setAdModalOpen(false);
          }}
          onCancel={() => setAdModalOpen(false)}
        />
      )}
      {bossBuffAdModalOpen && (
        <RewardedAdModal
          message={t(
            `광고를 보면 이번 보스전 동안 공격력이 ${BOSS_AD_BUFF_ATTACK_PERCENT}% 올라가요.`,
            `Watch an ad for +${BOSS_AD_BUFF_ATTACK_PERCENT}% attack for this boss fight.`,
          )}
          claimLabel={t(`공격력 +${BOSS_AD_BUFF_ATTACK_PERCENT}% 받기`, `Claim +${BOSS_AD_BUFF_ATTACK_PERCENT}% Attack`)}
          onClaim={() => {
            game.watchAdForBossBuff();
            setBossBuffAdModalOpen(false);
          }}
          onCancel={() => setBossBuffAdModalOpen(false)}
        />
      )}
      {game.bossRetryAvailable && (
        <RewardedAdModal
          message={t(
            `광고를 보면 보스의 남은 체력 그대로 이어서 싸워요. 제한 시간은 절반(${Math.round((getBossTimeLimitMs(state.stageNumber, game.bossEnraged ? 2 : 1) * BOSS_RETRY_TIME_RATIO) / 1000)}초)이에요. 필드로 가면 보스는 도망가고 처음부터 다시 몹을 잡아야 해요.`,
            `Watch an ad to pick the fight back up with the boss's remaining HP. The time limit is half as long (${Math.round((getBossTimeLimitMs(state.stageNumber, game.bossEnraged ? 2 : 1) * BOSS_RETRY_TIME_RATIO) / 1000)}s). If you head to the field instead, the boss flees and you'll have to fight through mobs again from the start.`,
          )}
          claimLabel={t("이어서 도전", "Resume Fight")}
          onClaim={game.retryBossAfterAd}
          autoStart={false}
          secondary={{ label: t("필드로 가기", "Go to the Field"), onPress: game.leaveBossFight }}
        />
      )}
      <BattleMenu
        onOpenBag={() => game.setState((previous) => ({ ...previous, selectedTab: "inventory" }))}
        onOpenDaily={() => game.setState((previous) => ({ ...previous, selectedTab: "daily" }))}
        dailyAllDone={isDailyAllDone(state)}
        onOpenQuest={() => game.setQuestOpen(true)}
        questReady={hasClaimableQuest(state)}
        onOpenLevelReward={() => game.setLevelRewardOpen(true)}
        levelRewardReady={hasClaimableLevelReward(state)}
        onOpenLab={() => game.setLabOpen(true)}
        onOpenEvent={() => setEventOpen(true)}
        bagFull={slotsUsed(state.inventory, game.bagStackSize) >= getBagCapacity(state.bagExpansions)}
        dropEvents={game.dropEvents}
        locks={Object.fromEntries(
          (["daily", "levelReward", "lab", "event"] as MenuPage[]).filter((page) => !isMenuPageUnlocked(state, page)).map((page) => [page, getMenuPageLockCaption(page)]),
        )}
        trailing={
          <BattleActionsPanel
            speedBoostActive={game.speedMultiplier > 1}
            speedBoostRemainingMs={game.speedBoostRemainingMs}
            onWatchAd={() => setAdModalOpen(true)}
          />
        }
      />
      {eventOpen && <EventModal onClose={() => setEventOpen(false)} />}
      <StatUpgradePanel
        state={state}
        upgradeMode={upgradeMode}
        onUpgrade={upgradeStat}
        compact
        upgraded={upgraded}
      />
    </>
  );
}

