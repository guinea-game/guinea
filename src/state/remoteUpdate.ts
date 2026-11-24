import AsyncStorage from "@react-native-async-storage/async-storage";
import appConfig from "../../app.json";
import { todayKey } from "./attendance";
import { getLanguage } from "../i18n";

// 앱 업데이트 안내: a tiny JSON file (update-config.json), served over
// raw.githubusercontent.com from a public repo — no backend needed. An already-installed
// build can't know a newer one exists on its own, so this is the one place that actually
// asks: bump the right platform's `latestVersion` in that file (only once that version is
// actually live on its store — iOS and Android review finish at different times) and push,
// and every install still below it starts nudging within a few minutes (GitHub's CDN cache
// is short). Separate from updates.ts's LATEST_UPDATE, which is baked into the bundle and
// only announces in-app content changes — it can't tell a player a new binary is even out.
// A separate public repo, not the main guinea repo (which is private) — raw.githubusercontent.com
// can't serve a private repo without an embedded token, so this file lives on its own here:
// https://github.com/guinea-game/guinea-config
const UPDATE_CONFIG_URL = "https://raw.githubusercontent.com/guinea-game/guinea-config/main/update-config.json";
const FETCH_TIMEOUT_MS = 4000;
const PROMPT_KEY = "gini.updatePrompt.v1";

const CURRENT_VERSION: string = appConfig.expo.version;

// iOS and Android ship on separate schedules (store review doesn't finish at the same time),
// so each platform tracks its own latestVersion/store link instead of sharing one.
type PlatformUpdateInfo = { latestVersion: string; url?: string };
type RemoteUpdateConfig = {
  ios?: PlatformUpdateInfo;
  android?: PlatformUpdateInfo;
  message?: Partial<Record<"ko" | "en" | "ja" | "zh", string>>;
};

export type UpdateNotice = { latestVersion: string; message: string; storeUrl?: string };

// "a.b.c" compared segment by segment, numerically — a missing segment counts as 0, so
// "1.2" vs "1.2.0" are equal and never loop forever on a malformed string.
function isNewerVersion(a: string, b: string) {
  const as = a.split(".").map(Number);
  const bs = b.split(".").map(Number);
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    const diff = (as[i] ?? 0) - (bs[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

async function fetchConfig(): Promise<RemoteUpdateConfig | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // Cache-busted — raw.githubusercontent.com's own CDN cache is short (~5 min) but a
    // stale in-app/browser cache shouldn't also sit in the way of a fresh check.
    const response = await fetch(`${UPDATE_CONFIG_URL}?t=${Date.now()}`, { signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as RemoteUpdateConfig;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function alreadyShownToday(version: string) {
  try {
    const raw = await AsyncStorage.getItem(PROMPT_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw) as { version: string; day: string };
    return saved.version === version && saved.day === todayKey();
  } catch {
    return false;
  }
}

// Once a day per version — bumping latestVersion in the config resets the nag for players
// who already dismissed the previous one today.
export async function markUpdatePromptShown(version: string) {
  try {
    await AsyncStorage.setItem(PROMPT_KEY, JSON.stringify({ version, day: todayKey() }));
  } catch {
    // Best-effort, same as the rest of this file — worst case it nags again today.
  }
}

// null unless the config is reachable, this platform has its own entry genuinely newer than
// this build, and it hasn't already been shown today for that exact version. Never throws —
// a flaky network (or an unrecognized platform, e.g. web) just means no nudge.
export async function checkForUpdate(platformOS: string): Promise<UpdateNotice | null> {
  const config = await fetchConfig();
  const platformInfo = platformOS === "ios" ? config?.ios : platformOS === "android" ? config?.android : undefined;
  if (!platformInfo?.latestVersion || !isNewerVersion(platformInfo.latestVersion, CURRENT_VERSION)) return null;
  if (await alreadyShownToday(platformInfo.latestVersion)) return null;
  const lang = getLanguage();
  const message = config?.message?.[lang] ?? config?.message?.ko ?? config?.message?.en ?? "";
  return { latestVersion: platformInfo.latestVersion, message, storeUrl: platformInfo.url };
}
