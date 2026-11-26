import { useEffect, useRef, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { Text } from "../components/GameText";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { colors, fonts } from "../theme";
import { frameImages, icons, kit, uiImages } from "../assets";
import { PageHeading } from "../components/PageHeading";
import { GameButton } from "../components/GameButton";
import { Panel } from "../components/NineSlice";
import { ModalFrame } from "../components/ModalFrame";
import { MonsterCodex } from "../components/MonsterCodex";
import { EnemySprite } from "../components/EnemySprite";
import { IconCaption } from "../components/IconCaption";
import { BOSS_NAME, ENEMY_NAME, getStageCode, STAGES } from "../state/stages";
import { countStars, getUnclaimedStars, STAR_CLEAR, STAR_FAST, STAR_GEMS, STAR_NO_FOOD } from "../state/progression";
import { t } from "../i18n";

type Page = "map" | "monsters";

// A function (not a module-level constant) so every field re-translates on each render —
// t() needs to run at render/call time to react to a language switch.
function getHeadings(): Record<Page, { kicker: string; title: string; description: string; icon: number; open: string; caption: string }> {
  return {
    map: {
      kicker: "MILESTONE",
      title: t("모험 지도", "Adventure Map"),
      description: t("보스를 쓰러뜨리면 다음 스테이지가 열려요.", "Defeat the boss to open the next stage."),
      icon: icons.map,
      open: t("모험 지도로 돌아가기", "Back to Adventure Map"),
      caption: t("지도", "Map"),
    },
    monsters: {
      kicker: "BESTIARY",
      title: t("몬스터 도감", "Monster Codex"),
      description: t("만난 몬스터와 떨어뜨리는 재료를 모아봐요.", "Collect the monsters you've met and what they drop."),
      icon: icons.codexMonster,
      open: t("몬스터 도감 열기", "Open Monster Codex"),
      caption: t("몬스터 도감", "Monster Codex"),
    },
  };
}

export function MilestoneScreen({
  stageNumber,
  highestStageNumber,
  onSelectStage,
  seenStage,
  onSeen,
  onOpenComics,
  codexStageNumber,
  stageStars,
  stageStarsClaimed,
  onClaimStars,
  onFocusStage,
}: {
  // Each stage's stars (STAR_* bits in state/progression.ts).
  stageStars: Record<string, number> | undefined;
  stageNumber: number;
  highestStageNumber: number;
  // Furthest stage shown last visit (undefined = never tracked), and the report on leaving.
  seenStage: number | undefined;
  onSeen: (stage: number) => void;
  // Opens the comic album (추억 앨범).
  onOpenComics: () => void;
  // Furthest stage ever reached: monsters already met stay in the codex.
  codexStageNumber: number;
  onSelectStage: (stageNumber: number) => void;
  // Where the stage being fought sits on the page (top and height), once it's laid out —
  // so the page can open with it in the middle of the screen.
  onFocusStage?: (y: number, height: number) => void;
  // Which stars' gems were already collected, and collecting a stage's waiting ones.
  stageStarsClaimed: Record<string, number> | undefined;
  onClaimStars: (stage: number) => void;
}) {
  const [view, setView] = useState<Page>("map");
  // The stage whose three challenges are open in the "i" popup.
  const [starInfo, setStarInfo] = useState<number | null>(null);
  const headings = getHeadings();
  const heading = headings[view];
  // A stage opened since the last visit: its path draws in and its badge drops onto the map.
  const [newStage] = useState(() => (seenStage !== undefined && highestStageNumber > seenStage ? highestStageNumber : null));
  const latest = useRef({ highestStageNumber, onSeen });
  useEffect(() => {
    latest.current = { highestStageNumber, onSeen };
  });
  useEffect(() => () => latest.current.onSeen(latest.current.highestStageNumber), []);
  // The current stage's card, nested page → list → card: each offset is reported by its own
  // layout; once all three are in, the page is scrolled to it (just the first time).
  const focus = useRef<{ page?: number; list?: number; card?: { y: number; height: number }; done?: boolean }>({});
  const tryFocus = () => {
    const { page, list, card, done } = focus.current;
    if (done || page === undefined || list === undefined || !card) return;
    focus.current.done = true;
    onFocusStage?.(page + list + card.y, card.height);
  };

  return (
    <View
      style={styles.page}
      onLayout={(event) => {
        focus.current.page = event.nativeEvent.layout.y;
        tryFocus();
      }}
    >
      <View style={styles.headingRow}>
        <View style={styles.heading}>
          <PageHeading kicker={heading.kicker} title={heading.title} description={heading.description} />
        </View>
        {/* Bare icon: the purple book opens the monster codex, the map brings you back. */}
        <View style={styles.toggles}>
          {(["map", "monsters"] as Page[])
            .filter((item) => item !== view)
            .map((item) => (
              <Pressable
                key={item}
                onPress={() => setView(item)}
                accessibilityRole="button"
                accessibilityLabel={headings[item].open}
                hitSlop={6}
                style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
              >
                <Image source={headings[item].icon} style={styles.toggleIcon} />
                <IconCaption shift={item === "map" ? 4 : 0}>{headings[item].caption}</IconCaption>
              </Pressable>
            ))}
          <Pressable
            onPress={onOpenComics}
            accessibilityRole="button"
            accessibilityLabel={t("추억 앨범 열기", "Open Memory Album")}
            hitSlop={6}
            style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
          >
            <Image source={icons.scroll} style={styles.toggleIcon} />
            <IconCaption>{t("만화보기", "View Comics")}</IconCaption>
          </Pressable>
        </View>
      </View>
      {view === "monsters" ? (
        <MonsterCodex highestStageNumber={codexStageNumber} />
      ) : (
      <View
        style={styles.list}
        onLayout={(event) => {
          focus.current.list = event.nativeEvent.layout.y;
          tryFocus();
        }}
      >
        {STAGES.map((stage, index) => {
          const current = index === stageNumber;
          const unlocked = index <= highestStageNumber;
          const isLast = index === STAGES.length - 1;
          return (
            <View
              key={stage.area}
              onLayout={
                current
                  ? (event) => {
                      focus.current.card = { y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height };
                      tryFocus();
                    }
                  : undefined
              }
            >
              <Panel slice={unlocked ? kit.panel : kit.inset} style={styles.card}>
                <StageBadge current={current} drop={index === newStage}>
                  <View style={[styles.badge, !unlocked && styles.badgeLocked]}>
                    <Image source={current ? frameImages.ringGold : frameImages.ringWood} style={styles.badgeRing} />
                    <Text style={[styles.badgeText, current && styles.badgeTextCurrent]}>{getStageCode(index)}</Text>
                  </View>
                </StageBadge>
                <View style={styles.cardCopy}>
                  <View style={styles.titleRow}>
                    {/* Not reached yet: a mystery — no name, no stars. */}
                    <Text style={[styles.cardStrong, !unlocked && styles.cardStrongLocked]}>{unlocked ? t(stage.area) : "???"}</Text>
                  </View>
                  {unlocked && (
                    <View style={styles.starRow}>
                      <ChallengeStars mask={stageStars?.[String(index)] ?? 0} wave={current} />
                    </View>
                  )}
                  {/* Only the stage being fought tells its story; the rest stay folded to keep the map short. */}
                  {current && <Text style={styles.cardSpan}>{t(stage.story)}</Text>}
                </View>
                {/* The stage being fought needs no button (its gold ring says so); the others
                    reached take a plain "이동 ›" in the bottom-right corner. */}
                {!unlocked && <Image source={icons.key} style={styles.lockIcon} accessibilityLabel={t("잠김", "Locked")} />}
                {unlocked && !current && (
                  <Pressable
                    onPress={() => onSelectStage(index)}
                    accessibilityRole="button"
                    accessibilityLabel={t(`${stage.area}(으)로 이동`, `Go to ${t(stage.area)}`)}
                    hitSlop={10}
                    style={({ pressed }) => [styles.moveLink, pressed && styles.togglePressed]}
                  >
                    <Text style={styles.moveLinkText}>{t("이동", "Go")}</Text>
                    <Svg width={10} height={14} viewBox="0 0 10 14">
                      <Polyline points="2.5,2 7.5,7 2.5,12" fill="none" stroke={colors.green} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </Pressable>
                )}
                {/* Its challenges and monsters, in the card's top-right corner like the kitchen's. */}
                {unlocked && (
                  <Pressable
                    onPress={() => setStarInfo(index)}
                    accessibilityRole="button"
                    accessibilityLabel={t(`${stage.area} 정보`, `${t(stage.area)} info`)}
                    hitSlop={8}
                    style={({ pressed }) => [styles.infoButton, pressed && styles.togglePressed]}
                  >
                    <InfoIcon twinkle={getUnclaimedStars({ stageStars, stageStarsClaimed }, index) !== 0} />
                  </Pressable>
                )}
              </Panel>
              {!isLast && <TrailPath locked={index >= highestStageNumber} draw={index + 1 === newStage} />}
            </View>
          );
        })}
      </View>
      )}
      {starInfo !== null && (
        <ChallengeInfoModal
          stage={starInfo}
          mask={stageStars?.[String(starInfo)] ?? 0}
          unclaimed={getUnclaimedStars({ stageStars, stageStarsClaimed }, starInfo)}
          onClaim={() => onClaimStars(starInfo)}
          onClose={() => setStarInfo(null)}
        />
      )}
    </View>
  );
}

// The current stage's badge bobs; a newly opened one drops in from above (after its path).
function StageBadge({ current, drop, children }: { current: boolean; drop: boolean; children: React.ReactNode }) {
  const bob = useSharedValue(0);
  const fall = useSharedValue(drop ? 0 : 1);
  useEffect(() => {
    bob.value = current ? withRepeat(withTiming(1, { duration: 650, easing: Easing.inOut(Easing.sin) }), -1, true) : withTiming(0, { duration: 150 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);
  useEffect(() => {
    if (drop) fall.value = withDelay(650, withTiming(1, { duration: 500, easing: Easing.out(Easing.bounce) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, fall.value * 3),
    transform: [{ translateY: -bob.value * 5 - (1 - fall.value) * 60 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

// The dashed trail to the next stage — drawn in top to bottom when that stage just opened.
// The trail between two stage cards runs on under both of them (tucked PATH_TUCK
// in at each end, the cards drawn over it), so it never shows a gap at a card's edge.
const PATH_GAP = 22;
const PATH_TUCK = 24;
const PATH_LENGTH = PATH_GAP + PATH_TUCK * 2;

function TrailPath({ locked, draw }: { locked: boolean; draw: boolean }) {
  const grow = useSharedValue(draw ? 0 : 1);
  useEffect(() => {
    if (draw) grow.value = withDelay(200, withTiming(1, { duration: 450, easing: Easing.inOut(Easing.quad) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ height: PATH_LENGTH * grow.value }));
  return (
    <View style={styles.pathSlot}>
      <Animated.View style={[styles.path, locked && styles.pathLocked, style]} />
    </View>
  );
}

// The stage's three challenges, as stars filled from the left by how many are done (in
// colour; the rest black and white) — which ones is behind the "i". On the stage being
// fought they ripple in turn, each swelling a little and settling back, like a wave.
function ChallengeStars({ mask, wave }: { mask: number; wave: boolean }) {
  const earned = [0, 1, 2].map((index) => index < countStars(mask));
  return (
    <View style={styles.stars} accessible accessibilityLabel={t(`별 ${countStars(mask)}개`, `${countStars(mask)} stars`)}>
      {earned.map((on, index) => (
        <WaveStar key={index} on={on} order={index} wave={wave} />
      ))}
    </View>
  );
}

const WAVE_STEP_MS = 140;
const WAVE_SWELL_MS = 220;
const WAVE_REST_MS = 1400;

function WaveStar({ on, order, wave }: { on: boolean; order: number; wave: boolean }) {
  const swell = useSharedValue(0);
  useEffect(() => {
    if (!wave) {
      swell.value = 0;
      return;
    }
    // Each star waits its turn, swells and settles, then rests until the next round —
    // every round the same length, so the three stay in step.
    const before = order * WAVE_STEP_MS;
    const after = WAVE_REST_MS + (2 - order) * WAVE_STEP_MS;
    swell.value = withRepeat(
      withSequence(
        withDelay(before, withTiming(1, { duration: WAVE_SWELL_MS, easing: Easing.out(Easing.quad) })),
        withTiming(0, { duration: WAVE_SWELL_MS, easing: Easing.in(Easing.quad) }),
        withDelay(after, withTiming(0, { duration: 0 })),
      ),
      -1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wave]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + swell.value * 0.15 }] }));
  return <Animated.Image source={on ? icons.star : icons.starGray} style={[styles.starIcon, style]} />;
}

// The card's "i": its ring twinkles gold — a gentle swell and fade, then a rest — while the
// stage has star gems waiting to be collected.
function InfoIcon({ twinkle }: { twinkle: boolean }) {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = twinkle
      ? withRepeat(withSequence(withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) }), withDelay(700, withTiming(0, { duration: 0 }))), -1)
      : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twinkle]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + glow.value * 0.25 }] }));
  return (
    <Animated.View style={[styles.infoRing, twinkle && styles.infoRingReady, style]}>
      <Text style={[styles.infoText, twinkle && styles.infoTextReady]}>i</Text>
    </Animated.View>
  );
}

const CHALLENGES: { bit: number; label: string; labelEn: string }[] = [
  { bit: STAR_CLEAR, label: "보스 처치", labelEn: "Defeat the boss" },
  { bit: STAR_FAST, label: "분노한 보스를 40초 안에 처치", labelEn: "Defeat the enraged boss within 40s" },
  { bit: STAR_NO_FOOD, label: "음식 없이 보스 처치", labelEn: "Defeat the boss with no food buff" },
];

// The "i" on a stage's card: its monster and boss, and its three challenges, each marked
// done or not.
function ChallengeInfoModal({ stage, mask, unclaimed, onClaim, onClose }: { stage: number; mask: number; unclaimed: number; onClaim: () => void; onClose: () => void }) {
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("닫기", "Close")} />
        <View style={styles.modalPanel}>
          <ModalFrame />
          <Text style={styles.modalTitle}>{`${getStageCode(stage)} ${t(STAGES[stage].area)}`}</Text>
          {/* Who lives here: the regular monster and the boss, standing still. */}
          <View style={styles.modalMonsters}>
            {[false, true].map((boss) => (
              <View key={String(boss)} style={styles.modalMonster}>
                <View style={styles.modalSprite}>
                  <EnemySprite boss={boss} kind={STAGES[stage].enemyKind} animation="idle" size={boss ? 76 : 64} still />
                </View>
                <Text style={styles.modalMonsterTag}>{boss ? t("보스", "Boss") : t("일반", "Normal")}</Text>
                <Text style={styles.modalMonsterName} numberOfLines={1}>
                  {t(boss ? BOSS_NAME[STAGES[stage].enemyKind] : ENEMY_NAME[STAGES[stage].enemyKind])}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.modalSub}>{t(`도전 과제 · 별마다 보석 ${STAR_GEMS}개`, `Challenges · ${STAR_GEMS} gems per star`)}</Text>
          <Panel slice={kit.panelParchment} scale={0.4} style={styles.modalList}>
            {CHALLENGES.map((item) => {
              const done = (mask & item.bit) !== 0;
              return (
                <View key={item.bit} style={styles.modalRow}>
                  <Image source={done ? icons.star : icons.starGray} style={styles.modalStar} />
                  <Text style={[styles.modalLabel, !done && styles.modalLabelOpen]}>{t(item.label, item.labelEn)}</Text>
                  <Text style={[styles.modalState, done ? styles.modalStateDone : styles.modalStateOpen]}>{done ? t("달성", "Done") : t("미달성", "Not yet")}</Text>
                </View>
              );
            })}
          </Panel>
          {/* Stars earned but not collected yet: their gems come from here. */}
          {unclaimed !== 0 ? (
            <GameButton variant="green" onPress={onClaim} style={styles.modalClose}>
              <View style={styles.claimLabel}>
                <Text style={styles.claimText}>{t("보상 받기", "Collect")}</Text>
                <Image source={uiImages.crystal} style={styles.claimGem} />
                <Text style={styles.claimText}>{countStars(unclaimed) * STAR_GEMS}</Text>
              </View>
            </GameButton>
          ) : (
            <GameButton variant="beige" onPress={onClose} style={styles.modalClose}>
              {t("닫기", "Close")}
            </GameButton>
          )}
        </View>
      </View>
    </Modal>
  );
}

// A stage card's padding, shared by its content and its corner controls (the "i", "이동").
const CARD_PAD_X = 17;
const CARD_PAD_TOP = 14;
const CARD_PAD_BOTTOM = 16;

const styles = StyleSheet.create({
  pathSlot: { height: PATH_GAP, zIndex: 0 },
  headingRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  heading: { flex: 1 },
  toggles: { flexDirection: "row", gap: 14, marginTop: 4 },
  toggle: {},
  togglePressed: { transform: [{ scale: 0.92 }] },
  toggleIcon: { width: 46, height: 46 },
  page: { backgroundColor: "#e8dcc4", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 25 },
  list: {},
  stars: { flexDirection: "row", alignItems: "center", gap: 1 },
  starRow: { marginTop: 3, marginBottom: 2, flexDirection: "row", alignItems: "center", gap: 8 },
  // Corner controls sit on the card's own padding (CARD_PAD_*), lined up with its content.
  infoButton: { position: "absolute", top: CARD_PAD_TOP, right: CARD_PAD_X, zIndex: 2 },
  cardStrongLocked: { color: colors.muted },
  infoRing: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: "#b9a487", alignItems: "center", justifyContent: "center" },
  infoRingReady: { borderColor: "#e9aa3a", backgroundColor: "#ffe9a8" },
  infoTextReady: { color: "#b5701c" },
  moveLink: { position: "absolute", right: CARD_PAD_X, bottom: CARD_PAD_BOTTOM, flexDirection: "row", alignItems: "center", gap: 3 },
  moveLinkText: { fontSize: 13, fontWeight: "900", fontFamily: fonts.bold, color: colors.green },
  claimLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  claimText: { fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  claimGem: { width: 18, height: 18, resizeMode: "contain" },
  infoText: { fontSize: 12, lineHeight: 14, fontWeight: "900", fontFamily: fonts.bold, color: "#a48d6c" },
  modalBackdrop: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#263024cf" },
  modalPanel: { alignItems: "center", paddingHorizontal: 34, paddingTop: 48, paddingBottom: 36 },
  modalTitle: { fontSize: 19, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink, textAlign: "center" },
  modalMonsters: { flexDirection: "row", justifyContent: "center", gap: 18, marginTop: 10, marginBottom: 4 },
  modalMonster: { alignItems: "center", width: 110 },
  modalSprite: { height: 80, justifyContent: "flex-end", alignItems: "center" },
  modalMonsterTag: { marginTop: 2, fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, color: colors.muted },
  modalMonsterName: { fontSize: 13, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  modalSub: { marginTop: 8, fontSize: 13, fontFamily: fonts.light, color: colors.brown, textAlign: "center" },
  modalList: { alignSelf: "stretch", marginTop: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  modalRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalStar: { width: 22, height: 22 },
  modalLabel: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  modalLabelOpen: { color: colors.muted },
  modalState: { fontSize: 12, fontWeight: "900", fontFamily: fonts.bold },
  modalStateDone: { color: colors.green },
  modalStateOpen: { color: colors.muted },
  modalClose: { marginTop: 16, minWidth: 120 },
  starIcon: { width: 16, height: 16 },
  card: {
    position: "relative",
    zIndex: 1,
    paddingHorizontal: CARD_PAD_X,
    paddingTop: CARD_PAD_TOP,
    paddingBottom: CARD_PAD_BOTTOM,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  badge: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRing: { position: "absolute", width: 54, height: 54 },
  badgeLocked: { opacity: 0.5 },
  badgeText: { color: "#71491b", fontSize: 18, fontWeight: "900", fontFamily: fonts.bold },
  badgeTextCurrent: { color: colors.red },
  cardCopy: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardStrong: { marginVertical: 2, fontSize: 16, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink },
  cardSpan: { fontFamily: fonts.light, letterSpacing: -0.36, color: colors.muted, fontSize: 12, lineHeight: 16 },
  lockIcon: { width: 34, height: 34, opacity: 0.6 },
  // Dashed trail between stage cards, lined up under the round stage badge.
  // A solid line (like 연구소's links), so no dash gap lands at a card's edge.
  path: { position: "absolute", top: -PATH_TUCK, left: 38, width: 4, height: PATH_LENGTH, backgroundColor: colors.gold },
  pathLocked: { backgroundColor: "#b6a78e" },
});
