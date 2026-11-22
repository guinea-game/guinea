import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { colors, fonts } from "../theme";
import { companionSkillImages } from "../assets";
import type { Outfit } from "../types";
import { COMPANION_SKILL_NAMES, COMPANION_SKILL_SUMMARIES } from "../state/companionSkills";
import { formatDuration } from "../state/buffs";
import { InfoBubble } from "./InfoBubble";
import { StrokedText } from "./StrokedText";
import { SKILL_SLOT_HEIGHT } from "./SkillSlot";
import { t as tr } from "../i18n";

// The companion's own active skill — sits right of the equipped skill slot. One per outfit,
// always available (nothing to equip), 10s cooldown. Each outfit has its own icon
// (companionSkillImages, assets/companions/skill-*.webp), same square skill-card art style
// as the equipped skill icons.
export function CompanionSkillSlot({
  outfit,
  readyAt,
  activeUntil,
  now,
  canCast,
  onCast,
}: {
  outfit: Outfit;
  readyAt: number;
  // End of the buff-style window (default/tetoGini/chefGini/cowboyGini) — 0 for the
  // instant-effect outfits, which only ever show the cooldown, never a running state.
  activeUntil: number;
  now: number;
  canCast: boolean;
  onCast: () => void;
}) {
  const [info, setInfo] = useState(false);
  const closeInfo = useCallback(() => setInfo(false), []);
  const cooldownLeft = Math.max(0, readyAt - now);
  const activeLeft = Math.max(0, activeUntil - now);
  const cooling = cooldownLeft > 0;
  const running = activeLeft > 0;
  const name = tr(COMPANION_SKILL_NAMES[outfit]);

  return (
    <Pressable
      onPress={cooling || running ? () => setInfo((current) => !current) : onCast}
      disabled={!canCast && !cooling && !running}
      accessibilityRole="button"
      accessibilityLabel={
        running
          ? tr(`${name} ${Math.ceil(activeLeft / 1000)}초 남음`, `${name} ${Math.ceil(activeLeft / 1000)}s left`)
          : cooling
            ? tr(`${name} 재사용 ${Math.ceil(cooldownLeft / 1000)}초 남음`, `${name} ready again in ${Math.ceil(cooldownLeft / 1000)}s`)
            : tr(`${name} 사용`, `Use ${name}`)
      }
      hitSlop={6}
      style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
    >
      <Image source={companionSkillImages[outfit]} style={styles.icon} />
      {running ? (
        <View style={[styles.overlay, styles.running]} pointerEvents="none">
          <StrokedText style={styles.seconds} strokeColor={colors.line} strokeWidth={1}>
            {Math.ceil(activeLeft / 1000)}
          </StrokedText>
        </View>
      ) : (
        cooling && (
          <View style={[styles.overlay, styles.cooling]} pointerEvents="none">
            <StrokedText style={styles.seconds} strokeColor={colors.line} strokeWidth={1}>
              {formatDuration(cooldownLeft)}
            </StrokedText>
          </View>
        )
      )}
      {info && (cooling || running) && (
        <InfoBubble
          title={name}
          lines={[
            tr(COMPANION_SKILL_SUMMARIES[outfit]),
            running
              ? tr(`${Math.ceil(activeLeft / 1000)}초 남음`, `${Math.ceil(activeLeft / 1000)}s left`)
              : tr(`재사용 ${Math.ceil(cooldownLeft / 1000)}초 남음`, `Ready again in ${Math.ceil(cooldownLeft / 1000)}s`),
          ]}
          anchorWidth={SKILL_SLOT_HEIGHT}
          onClose={closeInfo}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: { height: SKILL_SLOT_HEIGHT, width: SKILL_SLOT_HEIGHT, alignItems: "center", justifyContent: "center" },
  pressed: { transform: [{ scale: 0.92 }] },
  icon: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  cooling: { backgroundColor: "#1c120bA6" },
  running: { borderWidth: 2, borderColor: colors.gold },
  seconds: { fontSize: 15, fontWeight: "900", fontFamily: fonts.bold, color: colors.cream },
});
