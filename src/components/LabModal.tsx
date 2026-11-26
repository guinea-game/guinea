import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { buttonKit, food, frameKit, icons, kit, statIcons, uiImages } from "../assets";
import { NineSlice, Panel } from "./NineSlice";
import { GameButton } from "./GameButton";
import { formatGameNumber } from "../state/gameMath";
import {
  describeLabSteps,
  getLabNodeSteps,
  getLabSteps,
  STEPS_PER_NODE,
  getLabNodeDish,
  getResearchCost,
  isLabBusy,
  isLabNodeDone,
  isLabNodeOpen,
  isLabNodeStarted,
  isLabProjectDone,
  isLabProjectOpen,
  LAB_PROJECTS,
  LAB_TRACK_TITLE,
  LAB_TREE,
  LAB_UNLOCK_TITLE,
  type LabNode,
  type LabResearchId,
  type LabTrackId,
  type LabUnlockId,
} from "../state/lab";
import type { GameState } from "../types";
import { t } from "../i18n";

const RESEARCH_ICON: Record<LabResearchId, number> = {
  mobHp: statIcons.attack,
  effDish: icons.scroll,
  effTime: icons.energy,
  effCost: icons.shop,
  offline: icons.potionBlue,
  drop: icons.chest,
  golden: icons.coins,
  bossTime: icons.trophy,
  bag: icons.backpackTrim,
  skill: icons.potionRed,
  cooking: food.cookPotTrim,
  companionCap: icons.heart,
  critCap: statIcons.criticalDamage,
};
// Short names under the tree's nodes (the detail card below uses the full titles).
const SHORT_NAME: Record<LabResearchId, [string, string]> = {
  mobHp: ["몹 약화", "Mob HP"],
  effDish: ["요리 절약", "Fewer Dishes"],
  effTime: ["시간 단축", "Less Time"],
  effCost: ["비용 절감", "Lower Cost"],
  offline: ["오프라인", "Offline"],
  drop: ["보스 재료", "Boss Loot"],
  golden: ["황금몹", "Golden"],
  bossTime: ["보스 시간", "Boss Time"],
  bag: ["가방", "Bag"],
  skill: ["스킬", "Skill"],
  cooking: ["요리", "Cooking"],
  companionCap: ["동료 승급", "Companion"],
  critCap: ["치명타", "Critical"],
};
const ROMAN = ["", "I", "II", "III"];

// A project's grid: three columns across the panel, one row per tier.
const COLS = 3;
const NODE = 46;
const ROW_H = 82;
const TREE_TOP = 6;
const LINE = 4;
// How far a link runs up under the child's frame rim (opaque there), so it reaches the art.
const LINK_TUCK = 4;
const LINE_OPEN = "#d29a3a";
const LINE_SHUT = "#c9b48e";

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function formatPlainDuration(ms: number) {
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return t(`${m}분`, `${m}m`);
  if (m === 0) return t(`${h}시간`, `${h}h`);
  return t(`${h}시간 ${m}분`, `${h}h ${m}m`);
}

function nodeTitle(node: LabNode) {
  if (node.level === undefined) return t(...LAB_UNLOCK_TITLE[node.research as LabUnlockId]);
  return `${t(...LAB_TRACK_TITLE[node.research as LabTrackId])} ${ROMAN[node.level]}`;
}

// What the node gives: its full effect once done; otherwise where its next step takes it
// (and, partway through, where it stands now).
function nodeEffect(state: GameState, node: LabNode) {
  const start = ((node.level ?? 1) - 1) * STEPS_PER_NODE;
  const done = getLabNodeSteps(state, node);
  if (done >= STEPS_PER_NODE) return t(...describeLabSteps(node.research, start + STEPS_PER_NODE));
  const next = t(...describeLabSteps(node.research, getLabSteps(state, node.research) + 1));
  if (done === 0) return next;
  return `${t("지금", "Now")} ${t(...describeLabSteps(node.research, getLabSteps(state, node.research)))}\n${t("다음", "Next")} ${next}`;
}

// The research a node would cost — its track's next level is exactly this node when it's open.
function nodeCost(state: GameState, node: LabNode, mobGold: number) {
  return isLabNodeOpen(state, node) ? getResearchCost(state, node.research, mobGold) : undefined;
}

// 연구소: three projects one under another (scrolled), each a small research tree three columns wide — a project
// opens once the one before it is all done, and inside it each node opens by finishing the
// one above it (state/lab.ts's LAB_TREE). One research at a time, paid up front
// in gold (ordinary ones) or gems (the big ones) plus a pile of one dish, finishing itself on
// wall-clock time. Tap a node to see it in the card below.
// Done nodes wear the gold frame; ones not reachable yet are dark silhouettes.
export function LabModal({
  state,
  now,
  mobGold,
  onClose,
  onStartResearch,
}: {
  state: GameState;
  now: number;
  mobGold: number;
  onClose: () => void;
  onStartResearch: (id: LabResearchId) => void;
}) {
  const busy = isLabBusy(state, now);
  const active = state.labResearch && state.labResearch.readyAt > now ? state.labResearch : undefined;
  const activeNode = active ? LAB_TREE.find((node) => node.research === active.id && !isLabNodeDone(state, node) && isLabNodeOpen(state, node)) : undefined;
  const firstOpen = LAB_TREE.find((node) => isLabNodeOpen(state, node));
  const [picked, setPicked] = useState<string | null>(null);
  const selected = LAB_TREE.find((node) => node.id === picked) ?? activeNode ?? firstOpen ?? LAB_TREE[0];
  const [width, setWidth] = useState(0);

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("닫기", "Close")} />
        <View style={styles.panel}>
          <NineSlice slice={kit.panelLarge} />
          <View style={styles.top}>
            <View>
              <Text style={styles.topEyebrow}>{t("기니 연구소", "Gini's Lab")}</Text>
              <Text style={styles.topTitle}>{t("연구소", "Lab")}</Text>
            </View>
            <View style={styles.topRight}>
              <View style={styles.gemCounter}>
                <NineSlice slice={buttonKit.pillCream} scale={0.3} />
                <Image source={uiImages.crystal} style={styles.gemIcon} />
                <Text style={styles.gemText}>{formatGameNumber(state.gems)}</Text>
              </View>
              <GameButton onPress={onClose} style={styles.closeButton}>
                {t("닫기", "Close")}
              </GameButton>
            </View>
          </View>

          {/* The projects one under another, scrolled through — each its own small tree. */}
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {LAB_PROJECTS.map((project) => {
              const nodes = LAB_TREE.filter((node) => node.project === project);
              const projectOpen = isLabProjectOpen(state, project);
              const rows = Math.max(...nodes.map((node) => node.row)) + 1;
              const colW = width / COLS;
              const center = (node: LabNode) => ({ x: colW * (node.col + 0.5), y: TREE_TOP + node.row * ROW_H + NODE / 2 });
              return (
                <View key={project} style={styles.project}>
                  <View style={styles.projectHead}>
                    <Text style={[styles.projectTitle, !projectOpen && styles.projectTitleShut]}>{t(`프로젝트 ${project}`, `Project ${project}`)}</Text>
                    {isLabProjectDone(state, project) && <Text style={styles.projectDone}>{t("완료", "Done")}</Text>}
                  </View>
                  <View>
                  <Panel slice={frameKit.squareGold} scale={0.4} style={styles.treeFrame}>
                    <View style={[styles.tree, { height: TREE_TOP + (rows - 1) * ROW_H + NODE + 26 }]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
                      {/* Elbow links: down from the parent, across, and down into the child — lit
                          once the parent is done (the child is reachable). */}
                      {width > 0 &&
                        nodes.map((node) => {
                          const parent = node.parent ? nodes.find((item) => item.id === node.parent) : undefined;
                          if (!parent) return null;
                          const from = center(parent);
                          const to = center(node);
                          // Starts under the parent's name and runs just under the child's frame rim
                          // (drawn over it), so it meets the picture with no gap and never shows
                          // through a name or the frame's see-through middle.
                          const startY = from.y + NODE / 2 + 22;
                          const midY = startY + 6;
                          const color = isLabNodeStarted(state, parent) ? LINE_OPEN : LINE_SHUT;
                          const left = Math.min(from.x, to.x);
                          return (
                            <View key={`link-${node.id}`} pointerEvents="none">
                              <View style={[styles.link, { backgroundColor: color, left: from.x - LINE / 2, top: startY, width: LINE, height: midY - startY + LINE / 2 }]} />
                              <View style={[styles.link, { backgroundColor: color, left: left - LINE / 2, top: midY - LINE / 2, width: Math.abs(to.x - from.x) + LINE, height: LINE }]} />
                              <View style={[styles.link, { backgroundColor: color, left: to.x - LINE / 2, top: midY - LINE / 2, width: LINE, height: to.y - NODE / 2 + LINK_TUCK - (midY - LINE / 2) }]} />
                            </View>
                          );
                        })}
                      {width > 0 &&
                        nodes.map((node) => {
                          const { x, y } = center(node);
                          const done = isLabNodeDone(state, node);
                          const started = isLabNodeStarted(state, node);
                          const open = isLabNodeOpen(state, node);
                          const shut = !done && !open;
                          const researching = activeNode?.id === node.id;
                          const isSelected = selected.id === node.id;
                          return (
                            <Pressable
                              key={node.id}
                              onPress={() => setPicked(node.id)}
                              accessibilityRole="button"
                              accessibilityLabel={nodeTitle(node)}
                              hitSlop={4}
                              style={({ pressed }) => [styles.node, { left: x - colW / 2, top: y - NODE / 2, width: colW }, pressed && styles.pressed]}
                            >
                              {/* Frame: plain wood until its first step is done, gold once started (that
                                  already opens the nodes under it), the crowned gold frame once all
                                  three steps are done — with the icon gilded too. */}
                              <View style={[styles.nodeFrame, shut && styles.nodeShut, isSelected && styles.nodePicked]}>
                                {done ? (
                                  <Image source={uiImages.labNodeComplete} style={styles.completeFrame} />
                                ) : (
                                  <NineSlice slice={started ? frameKit.squareGold : frameKit.woodSquare} scale={started ? 0.42 : 0.22} />
                                )}
                                {/* Fully researched: a gold outline traced around the icon — gold copies of it
                                    nudged out in eight directions, behind it. */}
                                {done &&
                                  GOLD_OUTLINE.map(([dx, dy]) => (
                                    <Image
                                      key={`${dx},${dy}`}
                                      source={RESEARCH_ICON[node.research]}
                                      style={[styles.nodeIcon, styles.nodeIconGold, { transform: [{ translateX: dx }, { translateY: dy }] }]}
                                      resizeMode="contain"
                                    />
                                  ))}
                                {/* Keyed on shut: on iOS an Image whose tintColor is taken away stays a
                                    template image and falls back to the system blue, so the silhouette and
                                    the plain icon are separate mounts. */}
                                <Image key={shut ? "shut" : "open"} source={RESEARCH_ICON[node.research]} style={[styles.nodeIcon, shut && styles.nodeIconShut]} resizeMode="contain" />
                              </View>
                              <Text
                                style={[styles.nodeName, shut && styles.nodeNameShut, isSelected && styles.nodeNamePicked, researching && styles.nodeNameBusy]}
                                numberOfLines={1}
                              >
                                {researching ? formatCountdown(active!.readyAt - now) : `${t(...SHORT_NAME[node.research])}${node.level !== undefined ? ` ${ROMAN[node.level]}` : ""}`}
                              </Text>
                            </Pressable>
                          );
                        })}
                    </View>
                  </Panel>
                  {/* Not open yet: the tree under a dark veil, with what opens it. */}
                  {!projectOpen && (
                    <View style={styles.projectVeil} pointerEvents="none">
                      <Text style={styles.projectLocked}>{t(`프로젝트 ${project - 1}의 연구를 모두 끝내면 열려요`, `Opens once every research in Project ${project - 1} is done`)}</Text>
                    </View>
                  )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <NodeCard
            state={state}
            node={selected}
            now={now}
            mobGold={mobGold}
            busy={busy}
            researching={activeNode?.id === selected.id ? active!.readyAt : undefined}
            onStart={() => onStartResearch(selected.research)}
          />
        </View>
      </View>
    </Modal>
  );
}

// The picked node: what it does, and its button — cost to start, the countdown while it runs,
// 완료 once done, or what to finish first while it's still shut.
function NodeCard({
  state,
  node,
  now,
  mobGold,
  busy,
  researching,
  onStart,
}: {
  state: GameState;
  node: LabNode;
  now: number;
  mobGold: number;
  busy: boolean;
  researching?: number;
  onStart: () => void;
}) {
  const done = isLabNodeDone(state, node);
  const cost = nodeCost(state, node, mobGold);
  const parent = node.parent ? LAB_TREE.find((item) => item.id === node.parent) : undefined;
  const dish = getLabNodeDish(state, node);
  const enoughDish = dish.have >= dish.count;
  const affordable = cost !== undefined && (cost.currency === "gold" ? state.gold : state.gems) >= cost.amount && enoughDish;
  return (
    <Panel slice={frameKit.woodSquare} scale={0.3} style={styles.card}>
      {/* Top: the big icon beside what it is and what it does. */}
      <View style={styles.cardTop}>
        <Image source={RESEARCH_ICON[node.research]} style={styles.cardIcon} resizeMode="contain" />
        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{nodeTitle(node)}</Text>
            <Text style={styles.cardStep}>{t(`${Math.min(STEPS_PER_NODE, getLabNodeSteps(state, node) + (done ? 0 : 1))}/${STEPS_PER_NODE}단계`, `Step ${Math.min(STEPS_PER_NODE, getLabNodeSteps(state, node) + (done ? 0 : 1))}/${STEPS_PER_NODE}`)}</Text>
          </View>
          <Text style={styles.cardEffect}>{nodeEffect(state, node)}</Text>
          {!done && !cost && parent && <Text style={styles.cardNeed}>{t(`${nodeTitle(parent)} 완료 후 열려요`, `Opens after ${nodeTitle(parent)}`)}</Text>}
        </View>
      </View>
      {/* Bottom: the dish it eats on the left, the button on the right. */}
      <View style={styles.cardBottom}>
        {/* The dish it eats: how many the bag holds against how many it needs
            (already handed over once the research is running). */}
        {!done && researching === undefined && (
          <View style={styles.dishRow}>
            <Image source={dish.image} style={styles.dishIcon} />
            <Text style={styles.dishName} numberOfLines={1}>
              {t(dish.name)}
            </Text>
            <Text style={[styles.dishCount, enoughDish ? styles.dishCountOk : styles.dishCountShort]}>
              {dish.have}/{dish.count}
            </Text>
          </View>
        )}
        <View style={styles.cardDishSpacer} />
        <View style={styles.cardAction}>
          {done ? (
            <GameButton variant="gray" disabled style={styles.actionButton} textStyle={styles.actionButtonText}>
              {t("완료", "Done")}
            </GameButton>
          ) : researching !== undefined ? (
            <GameButton variant="gray" disabled style={styles.actionButton} textStyle={styles.actionButtonText}>
              {formatCountdown(researching - now)}
            </GameButton>
          ) : cost ? (
            <GameButton
              variant={busy || !affordable ? "gray" : "green"}
              disabled={busy || !affordable}
              onPress={onStart}
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
              accessibilityLabel={t(`${nodeTitle(node)} 연구 시작`, `Start researching ${nodeTitle(node)}`)}
            >
              <View style={styles.costLabel}>
                <View style={styles.costGemRow}>
                  <Image source={cost.currency === "gold" ? uiImages.coin : uiImages.crystal} style={styles.costGemIcon} />
                  <Text style={styles.costGemText}>{formatGameNumber(cost.amount)}</Text>
                </View>
                <Text style={styles.costDuration}>{formatPlainDuration(cost.durationMs)}</Text>
              </View>
            </GameButton>
          ) : (
            <GameButton variant="gray" disabled style={styles.actionButton} textStyle={styles.actionButtonText}>
              {t("잠김", "Locked")}
            </GameButton>
          )}
        </View>
      </View>
    </Panel>
  );
}

// Offsets of the gold copies that make a fully researched icon's outline (1.5px wide).
const GOLD_OUTLINE: [number, number][] = [
  [-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5],
  [-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1],
];

const styles = StyleSheet.create({
  backdrop: { flex: 1, padding: 22, paddingHorizontal: 14, justifyContent: "center", backgroundColor: "#263024cf" },
  panel: { maxHeight: "92%", paddingHorizontal: 22, paddingTop: 22, paddingBottom: 22 },
  scroll: { flexGrow: 0, marginTop: 10 },
  project: { marginBottom: 12 },
  projectHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  projectTitle: { fontSize: 16, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  projectTitleShut: { color: colors.muted },
  projectDone: { fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, color: colors.green },
  projectVeil: { position: "absolute", left: 6, right: 6, top: 6, bottom: 6, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  projectLocked: { fontSize: 14, fontWeight: "800", fontFamily: fonts.bold, color: colors.cream, textAlign: "center" },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topEyebrow: { color: colors.green, fontWeight: "800", fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5 },
  topTitle: { fontSize: 24, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.5 },
  closeButton: { paddingHorizontal: 12 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  gemCounter: { height: 32, minWidth: 74, flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 8, paddingRight: 14, paddingBottom: 2 },
  gemIcon: { width: 18, height: 18, resizeMode: "contain" },
  gemText: { color: colors.ink, fontSize: 14, fontWeight: "900", fontFamily: fonts.bold },
  treeFrame: { paddingHorizontal: 8, paddingTop: 12, paddingBottom: 6 },
  tree: { position: "relative" },
  // Square ends, so the elbows' pieces meet flush.
  link: { position: "absolute" },
  node: { position: "absolute", alignItems: "center" },
  pressed: { transform: [{ scale: 0.94 }] },
  nodeFrame: { width: NODE, height: NODE, alignItems: "center", justifyContent: "center" },
  // Not open yet: the plain wood frame says so on its own — kept at full strength.
  nodeShut: {},
  nodeIcon: { width: 28, height: 28 },
  // One of the gold outline's copies (see GOLD_OUTLINE).
  nodeIconGold: { position: "absolute", left: (NODE - 28) / 2, top: (NODE - 28) / 2, tintColor: "#ffc229" },
  // The crowned frame's square body fills the node; its crown rises above (art is 200x221).
  completeFrame: { position: "absolute", left: 0, top: (-21 * NODE) / 200, width: NODE, height: (221 * NODE) / 200, resizeMode: "stretch" },
  // Not reachable yet: a dark silhouette, like the battle row's locked pages.
  nodeIconShut: { tintColor: "#3b2a1c", opacity: 0.55 },
  // The node shown in the card below: a little bigger, its name picked out.
  nodePicked: { transform: [{ scale: 1.14 }] },
  nodeNamePicked: { color: "#c8553d" },
  nodeName: { marginTop: 5, fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink, textAlign: "center" },
  nodeNameBusy: { color: colors.green },
  nodeNameShut: { color: colors.muted },
  card: { marginTop: 12, paddingHorizontal: 18, paddingVertical: 16, gap: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardDishSpacer: { flex: 1 },
  cardIcon: { width: 52, height: 52 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: "row", alignItems: "baseline", gap: 6, flexWrap: "wrap" },
  cardTitle: { fontSize: 14, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  cardStep: { fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, color: colors.green },
  cardEffect: { marginTop: 4, fontSize: 12, lineHeight: 17, fontFamily: fonts.light, color: colors.brown },
  cardNeed: { marginTop: 2, fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.muted },
  cardAction: { flexDirection: "row", alignItems: "center", gap: 6 },
  dishRow: { flexShrink: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  dishIcon: { width: 22, height: 22, resizeMode: "contain" },
  dishName: { flexShrink: 1, fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink },
  dishCount: { fontSize: 12, fontWeight: "900", fontFamily: fonts.bold },
  dishCountOk: { color: colors.green },
  dishCountShort: { color: "#c8553d" },
  actionButton: { minWidth: 72, paddingHorizontal: 8 },
  actionButtonText: { fontSize: 12 },
  costLabel: { alignItems: "center" },
  costGemRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  costGemIcon: { width: 14, height: 14, resizeMode: "contain" },
  costGemText: { fontSize: 13, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  costDuration: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.cream, opacity: 0.85 },
});
