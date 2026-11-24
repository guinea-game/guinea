import { getLanguage } from "../i18n";

// 이벤트: season-long windows scheduled in event-config.json, hosted (like update-config.json)
// in the separate public repo guinea-game/guinea-config — this repo is private, and
// raw.githubusercontent.com needs a public one. No client-side caching: fetched fresh each
// time the event tab opens, since nothing here needs to interrupt the player unprompted.
const EVENT_CONFIG_URL = "https://raw.githubusercontent.com/guinea-game/guinea-config/main/event-config.json";
const FETCH_TIMEOUT_MS = 4000;

type EventEntry = {
  id: string;
  title: Partial<Record<"ko" | "en" | "ja" | "zh", string>>;
  // "YYYY-MM-DD", read as this device's local calendar day (not UTC) — see parseLocalDate.
  start: string;
  end: string;
};

type RemoteEventConfig = { events?: EventEntry[] };

export type EventStatus =
  | { kind: "active"; title: string; endsAt: number }
  | { kind: "upcoming"; title: string; startsAt: number }
  // Config fetched fine, but nothing scheduled right now or in the future.
  | { kind: "none" }
  // Network/parse failure — distinct from "none" so the UI can say "couldn't check" instead
  // of wrongly claiming there's nothing planned.
  | { kind: "unknown" };

// Built from plain numbers, not `new Date("YYYY-MM-DD")` — that ISO form parses as UTC
// midnight, which would silently shift the window by this device's UTC offset. Local calendar
// day, same philosophy as attendance.ts's todayKey.
function parseLocalDate(dateStr: string, endOfDay: boolean): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return endOfDay
    ? new Date(year, (month ?? 1) - 1, day ?? 1, 23, 59, 59, 999).getTime()
    : new Date(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0).getTime();
}

function titleFor(event: EventEntry): string {
  const lang = getLanguage();
  return event.title[lang] ?? event.title.ko ?? event.title.en ?? event.id;
}

async function fetchConfig(): Promise<RemoteEventConfig | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${EVENT_CONFIG_URL}?t=${Date.now()}`, { signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as RemoteEventConfig;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Never throws — a flaky network just means "unknown", not a crash.
export async function getEventStatus(): Promise<EventStatus> {
  const config = await fetchConfig();
  if (!config) return { kind: "unknown" };
  const events = config.events ?? [];
  if (events.length === 0) return { kind: "none" };

  const now = Date.now();
  const active = events.find((event) => parseLocalDate(event.start, false) <= now && now <= parseLocalDate(event.end, true));
  if (active) return { kind: "active", title: titleFor(active), endsAt: parseLocalDate(active.end, true) };

  const upcoming = events
    .filter((event) => parseLocalDate(event.start, false) > now)
    .sort((a, b) => parseLocalDate(a.start, false) - parseLocalDate(b.start, false))[0];
  return upcoming ? { kind: "upcoming", title: titleFor(upcoming), startsAt: parseLocalDate(upcoming.start, false) } : { kind: "none" };
}
