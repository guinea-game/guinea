import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "../components/GameText";
import { colors, fonts } from "../theme";
import { icons, kit } from "../assets";
import { Panel } from "../components/NineSlice";
import { PageHeading } from "../components/PageHeading";
import { COMIC_ORDER, COMIC_ON_FIRST_CLEAR, COMICS, getComicUnlockLabel, getUnlockedComics, LOOP_COMICS, type ComicId } from "../state/comics";
import { t } from "../i18n";

// getComicUnlockLabel (state/comics.ts) builds its Korean text dynamically (with numbers
// baked in), so it can't be translated via a one-arg dictionary lookup — this re-derives
// the English version from the same few template shapes without touching that file.
function unlockLabelEn(ko: string): string {
  if (ko === "게임 시작") return "Game Start";
  if (ko === "2회차를 시작하면 열려요") return "Unlocks when loop 2 begins";
  let match = ko.match(/^(\d+)회차의 마지막 보스를 잡으면 열려요$/);
  if (match) return `Unlocks on defeating loop ${match[1]}'s final boss`;
  match = ko.match(/^(\d+)회차에 (\d+)스테이지 보스를 잡으면 열려요$/);
  if (match) return `Unlocks on defeating stage ${match[2]}'s boss in loop ${match[1]}`;
  match = ko.match(/^(\d+)스테이지 보스를 처음 잡으면 열려요$/);
  if (match) return `Unlocks on first defeating stage ${match[1]}'s boss`;
  return ko;
}

// The album opens on a list of story roads; picking one shows its episodes. 모험의 길 is
// the main run (1~50화, then the later loops' episodes as "2회차 1화"…); the next road is
// still being written, so its entry only says it's coming.
type Road = "adventure" | "next";
const ROADS: { id: Road; label: string; labelEn: string; ready: boolean }[] = [
  { id: "adventure", label: "모험의 길", labelEn: "Adventure Road", ready: true },
  { id: "next", label: "???의 길", labelEn: "??? Road", ready: false },
];

// Which loop a comic belongs to: the first run's comics are loop 1; a later-loop comic is
// the loop it plays in (one that fires on a loop's last boss belongs to that loop).
function comicLoop(id: ComicId) {
  if (id === "opening" || Object.values(COMIC_ON_FIRST_CLEAR).includes(id)) return 1;
  if (id === "apprenticeGini") return 2;
  const entry = LOOP_COMICS.find((item) => item.comic === id);
  if (!entry) return 1;
  return entry.afterStage === undefined ? entry.afterLoop : entry.afterLoop + 1;
}

// "오프닝", then "12화" counted afresh in each loop (the loops after the first get their own
// "2회차" heading in the list).
function episodeLabels() {
  const perLoop = new Map<number, number>();
  return new Map(
    COMIC_ORDER.map((id) => {
      // The opening sits before 1화, so the stage comics run 1화 to 50화 (the ending is 50화).
      if (id === "opening") return [id, t("오프닝", "Opening")] as const;
      const loop = comicLoop(id);
      const n = (perLoop.get(loop) ?? 0) + 1;
      perLoop.set(loop, n);
      return [id, t(`${n}화`, `Ep. ${n}`)] as const;
    }),
  );
}

// 추억 앨범: every story comic in story order. Reached ones show their first panel and play
// on tap (a "NEW" tag until watched); the rest stay covered with what opens them.
export function ComicsScreen({
  clearedStages,
  allUnlocked,
  seenComics,
  onPlay,
  onBack,
}: {
  clearedStages: number[];
  allUnlocked: boolean;
  seenComics: string[] | undefined;
  onPlay: (id: ComicId) => void;
  onBack: () => void;
}) {
  const unlocked = getUnlockedComics(clearedStages, allUnlocked);
  const seen = new Set(seenComics ?? []);
  // apprenticeGini unlocks by having been shown once (GameScreen's comic chain), not by a
  // stage clear, so getUnlockedComics (clearedStages-based) alone can't see it.
  const isOpen = (id: ComicId) => unlocked.includes(id) || seen.has(id);
  const [road, setRoad] = useState<Road | null>(null);
  const openCount = COMIC_ORDER.filter(isOpen).length;
  const hasNew = COMIC_ORDER.some((id) => isOpen(id) && !seen.has(id));
  const episodes = episodeLabels();

  return (
    <View style={styles.page}>
      <View style={styles.headingRow}>
        <View style={styles.heading}>
          <PageHeading kicker="ALBUM" title={t("추억 앨범", "Memory Album")} description={t("지나온 이야기를 다시 볼 수 있어요.", "Relive the stories you've already been through.")} />
        </View>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t("모험 지도로 돌아가기", "Back to Adventure Map")} hitSlop={6} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Image source={icons.map} style={styles.backIcon} />
        </Pressable>
      </View>
      {road === null ? (
        // The road list: 모험의 길 opens its episodes; the next road is still on its way.
        <View style={styles.list}>
          {ROADS.map((item) => {
            const roadCover = COMICS.opening.panels[0];
            return (
              <Pressable
                key={item.id}
                disabled={!item.ready}
                onPress={() => setRoad(item.id)}
                accessibilityRole="button"
                accessibilityLabel={item.ready ? t(item.label, item.labelEn) : t(`${item.label}, 준비 중`, `${item.labelEn}, coming soon`)}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <Panel slice={item.ready ? kit.panel : kit.inset} scale={0.4} style={styles.card}>
                  <View style={[styles.cover, { aspectRatio: 1 / roadCover.aspect }]}>
                    <Image source={roadCover.image} style={[styles.coverImage, !item.ready && styles.coverLocked]} />
                    {!item.ready && (
                      <View style={styles.lockVeil}>
                        <Text style={styles.soonVeil}>{t("준비 중", "Soon")}</Text>
                      </View>
                    )}
                    {item.ready && hasNew && (
                      <View style={styles.newTag}>
                        <Text style={styles.newText}>NEW</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.copy}>
                    <Text style={[styles.roadTitle, !item.ready && styles.titleLocked]}>{t(item.label, item.labelEn)}</Text>
                    <Text style={styles.condition}>
                      {item.ready
                        ? t(`모은 이야기 ${openCount} / ${COMIC_ORDER.length}`, `Stories ${openCount} / ${COMIC_ORDER.length}`)
                        : t("새로운 이야기를 준비하고 있어요", "A new story is on its way")}
                    </Text>
                  </View>
                </Panel>
              </Pressable>
            );
          })}
        </View>
      ) : (
      <>
      <View style={styles.roadHead}>
        <Pressable onPress={() => setRoad(null)} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [pressed && styles.pressed]}>
          <Text style={styles.roadBack}>{t("‹ 이야기 목록", "‹ Stories")}</Text>
        </Pressable>
        <Text style={styles.roadHeadTitle}>{t(ROADS.find((item) => item.id === road)!.label, ROADS.find((item) => item.id === road)!.labelEn)}</Text>
      </View>
      <Text style={styles.count}>
        {t(`모은 이야기 ${COMIC_ORDER.filter(isOpen).length} / ${COMIC_ORDER.length}`, `Stories Collected ${COMIC_ORDER.filter(isOpen).length} / ${COMIC_ORDER.length}`)}
      </Text>
      <View style={styles.list}>
        {COMIC_ORDER.map((id, index) => {
          const comic = COMICS[id];
          // A loop's first episode gets that loop's heading above it, on the page itself.
          const loop = comicLoop(id);
          const loopStarts = loop > 1 && (index === 0 || comicLoop(COMIC_ORDER[index - 1]) !== loop);
          const open = isOpen(id);
          const cover = comic.panels[0];
          return (
            <View key={id} style={styles.entry}>
            {loopStarts && <Text style={styles.loopHeading}>{t(`${loop}회차`, `Loop ${loop}`)}</Text>}
            <Pressable
              disabled={!open}
              onPress={() => onPlay(id)}
              accessibilityRole="button"
              accessibilityLabel={
                open
                  ? t(`${comic.title} 보기`, `View ${t(comic.title)}`)
                  : t(`잠긴 이야기, ${getComicUnlockLabel(id)}`, `Locked story, ${t(getComicUnlockLabel(id), unlockLabelEn(getComicUnlockLabel(id)))}`)
              }
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Panel slice={open ? kit.panel : kit.inset} scale={0.4} style={styles.card}>
                <View style={[styles.cover, { aspectRatio: 1 / cover.aspect }]}>
                  <Image source={cover.image} style={[styles.coverImage, !open && styles.coverLocked]} />
                  {!open && (
                    <View style={styles.lockVeil}>
                      <Text style={styles.lockText}>🔒</Text>
                    </View>
                  )}
                  {open && !seen.has(id) && (
                    <View style={styles.newTag}>
                      <Text style={styles.newText}>NEW</Text>
                    </View>
                  )}
                </View>
                <View style={styles.copy}>
                  <Text style={styles.episode}>{episodes.get(id)}</Text>
                  <Text style={[styles.title, !open && styles.titleLocked]} numberOfLines={1}>
                    {open ? t(comic.title) : "???"}
                  </Text>
                  <Text style={styles.condition}>{open ? t("터치해서 다시 보기 ▶", "Tap to Rewatch ▶") : t(getComicUnlockLabel(id), unlockLabelEn(getComicUnlockLabel(id)))}</Text>
                </View>
              </Panel>
            </Pressable>
            </View>
          );
        })}
      </View>
      </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#e8dcc4", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 25 },
  headingRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  heading: { flex: 1 },
  back: { marginTop: 4 },
  backIcon: { width: 46, height: 46 },
  pressed: { transform: [{ scale: 0.97 }] },
  entry: { gap: 10 },
  loopHeading: { marginTop: 8, marginLeft: 4, fontSize: 16, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  roadTitle: { fontSize: 17, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  soonVeil: { fontSize: 13, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  roadHead: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2, marginBottom: 8, marginLeft: 4 },
  roadBack: { fontSize: 13, fontWeight: "900", fontFamily: fonts.bold, color: colors.green },
  roadHeadTitle: { fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  count: { marginBottom: 8, marginLeft: 4, fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.brown },
  list: { gap: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  cover: { width: 120, borderRadius: 6, borderWidth: 2, borderColor: colors.line, overflow: "hidden" },
  coverImage: { width: "100%", height: "100%" },
  coverLocked: { opacity: 0.25, filter: "grayscale(1) blur(2px)" },
  lockVeil: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "#2b1f1799" },
  lockText: { fontSize: 26 },
  newTag: { position: "absolute", top: 4, left: 4, paddingHorizontal: 5, borderRadius: 5, backgroundColor: colors.red },
  newText: { fontSize: 8, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
  copy: { flex: 1 },
  episode: { fontSize: 12, fontWeight: "900", fontFamily: fonts.bold, color: colors.green },
  title: { marginTop: 2, fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink },
  titleLocked: { color: colors.muted },
  condition: { marginTop: 4, fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.brown },
});
