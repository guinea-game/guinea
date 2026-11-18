import { Image } from "react-native";
import * as assets from "../assets";
import type { UiSlice } from "../assets";

// Frame art (every 9-slice) that has finished loading. NineSlice stays invisible until its
// image is in here, so a slow connection never shows the flat centre-colour rectangle or a
// half-built frame popping in piece by piece — the whole frame appears at once.
const loaded = new Set<number>();
const listeners = new Set<() => void>();

export function isSliceLoaded(source: number) {
  return loaded.has(source);
}

export function markSliceLoaded(source: number) {
  if (loaded.has(source)) return;
  loaded.add(source);
  listeners.forEach((listener) => listener());
}

export function onSliceLoaded(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Every UiSlice exported from assets.ts (found by shape, so new frame kits are picked up).
function allSliceSources() {
  const sources = new Set<number>();
  const visit = (value: unknown, depth: number) => {
    if (!value || typeof value !== "object" || depth > 2) return;
    const candidate = value as Partial<UiSlice>;
    if (typeof candidate.source === "number" && Array.isArray(candidate.insets)) {
      sources.add(candidate.source);
      return;
    }
    Object.values(value).forEach((child) => visit(child, depth + 1));
  };
  Object.values(assets).forEach((value) => visit(value, 0));
  return [...sources];
}

// Called once at launch (while the title screen is up): fetches every frame image so the
// game's panels are ready by the time the player taps in.
export function preloadUiFrames() {
  allSliceSources().forEach((source) => {
    const uri = Image.resolveAssetSource(source)?.uri;
    if (!uri) return;
    Image.prefetch(uri)
      .then(() => markSliceLoaded(source))
      .catch(() => {});
  });
}
