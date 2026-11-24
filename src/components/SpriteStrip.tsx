import { useEffect, useState } from "react";
import { Image, View, type ImageSourcePropType } from "react-native";

type Props = {
  source: ImageSourcePropType;
  frameSize: number; // native px per frame in the source strip (160 for all current strips)
  frameCount: number; // 5 for guinea strips, 4 for boss strips
  displaySize: number; // rendered box size on screen, e.g. 108
  durationMs: number; // full-cycle duration, ported verbatim from the web CSS animation-duration
  mode: "loop" | "once" | "still"; // loop = idle breathing; once = CSS "both" fill, holds last frame; still = just startFrame, no animation
  repeat?: number; // "once" mode only: play the full cycle this many times before holding (default 1)
  restartKey?: string | number; // change this to force the animation to restart from startFrame (mirrors the web's key={tick} remount trick)
  startFrame?: number; // frame a (re)start begins on, default 0 — e.g. to skip a wind-up

  onComplete?: () => void;
  // Recolors every opaque pixel this flat color, keeping the sprite's own silhouette —
  // used to flash a hit-reaction overlay exactly matching the current frame's shape.
  tintColor?: string;
};

export function SpriteStrip({
  source,
  frameSize,
  frameCount,
  displaySize,
  durationMs,
  mode,
  repeat = 1,
  restartKey,
  startFrame = 0,
  onComplete,
  tintColor,
}: Props) {
  const [frame, setFrame] = useState(startFrame);

  // Rewind during render whenever the clip changes, rather than from inside the effect
  // below (which would paint one stale frame first).
  const run = [source, frameCount, durationMs, mode, repeat, restartKey, startFrame];
  const [previousRun, setPreviousRun] = useState(run);
  if (run.some((value, index) => value !== previousRun[index])) {
    setPreviousRun(run);
    setFrame(startFrame);
  }

  useEffect(() => {
    if (frameCount <= 1 || mode === "still") return;
    // CSS steps(frameCount - 1) visits frameCount frames across durationMs with no easing.
    const stepMs = durationMs / (frameCount - 1);
    let current = startFrame;
    let cyclesDone = 0;
    const id = setInterval(() => {
      current += 1;
      if (current >= frameCount) {
        if (mode === "loop") {
          current = 0;
        } else {
          cyclesDone += 1;
          if (cyclesDone < repeat) {
            current = 0;
          } else {
            clearInterval(id);
            current = frameCount - 1;
            setFrame(current);
            onComplete?.();
            return;
          }
        }
      }
      setFrame(current);
    }, stepMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, frameCount, durationMs, mode, repeat, restartKey, startFrame]);

  const scale = displaySize / frameSize;

  return (
    <View style={{ width: displaySize, height: displaySize, overflow: "hidden" }}>
      <Image
        source={source}
        resizeMode="stretch"
        tintColor={tintColor}
        style={{
          width: frameSize * frameCount * scale,
          height: frameSize * scale,
          transform: [{ translateX: -frame * frameSize * scale }],
        }}
      />
    </View>
  );
}
