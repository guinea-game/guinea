import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./GameText";
import { colors, fonts } from "../theme";
import { icons, kit } from "../assets";
import { Panel } from "./NineSlice";
import { ModalFrame } from "./ModalFrame";
import { GameButton } from "./GameButton";
import { getEventStatus, type EventStatus } from "../state/remoteEvent";
import { getLanguage, t } from "../i18n";

const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(ts: number) {
  const date = new Date(ts);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const lang = getLanguage();
  if (lang === "en") return `${MONTH_EN[month - 1]} ${day}`;
  if (lang === "ko") return `${month}월 ${day}일`;
  return `${month}月${day}日`;
}

// 이벤트: a flat status card (no list — only ever one event is relevant at a time), read live
// from state/remoteEvent.ts each time it opens. 진행 중인 이벤트의 실제 내용(상점·보상)은 아직
// 설계 전이라 여기선 이름과 기간만 보여준다.
export function EventModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<EventStatus | null>(null);
  useEffect(() => {
    let cancelled = false;
    getEventStatus().then((result) => {
      if (!cancelled) setStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("닫기", "Close")} />
        <View style={styles.panel}>
          <ModalFrame />
          <View style={styles.top}>
            <View>
              <Text style={styles.topEyebrow}>{t("시즌마다 한 번", "Once a Season")}</Text>
              <Text style={styles.topTitle}>{t("이벤트", "Event")}</Text>
            </View>
            <GameButton onPress={onClose} style={styles.closeButton}>{t("닫기", "Close")}</GameButton>
          </View>

          <Panel slice={kit.inset} scale={0.4} style={styles.card}>
            <Image source={icons.event} style={styles.icon} resizeMode="contain" />
            {status === null && <Text style={styles.statusLine}>{t("확인하는 중...", "Checking...")}</Text>}
            {status?.kind === "active" && (
              <>
                <Text style={styles.eyebrow}>{t("진행 중!", "Happening now!")}</Text>
                <Text style={styles.eventTitle}>{status.title}</Text>
                <Text style={styles.statusLine}>{t(`${formatDate(status.endsAt)}까지`, `Until ${formatDate(status.endsAt)}`)}</Text>
              </>
            )}
            {status?.kind === "upcoming" && (
              <>
                <Text style={styles.eyebrow}>{t("다음 이벤트", "Next Event")}</Text>
                <Text style={styles.eventTitle}>{status.title}</Text>
                <Text style={styles.statusLine}>{t(`${formatDate(status.startsAt)}에 시작`, `Starts ${formatDate(status.startsAt)}`)}</Text>
              </>
            )}
            {status?.kind === "none" && (
              <Text style={styles.statusLine}>{t("예정된 이벤트가 없어요. 다음 시즌을 기대해 주세요!", "No events scheduled yet — stay tuned for next season!")}</Text>
            )}
            {status?.kind === "unknown" && (
              <Text style={styles.statusLine}>{t("지금은 확인할 수 없어요. 나중에 다시 봐 주세요.", "Couldn't check right now — try again later.")}</Text>
            )}
          </Panel>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    padding: 22,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: "#263024cf",
  },
  panel: {
    paddingHorizontal: 34,
    paddingTop: 48,
    paddingBottom: 36,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topEyebrow: { color: colors.green, fontWeight: "800", fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5 },
  topTitle: { fontSize: 24, fontWeight: "800", fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.5 },
  closeButton: { paddingHorizontal: 12 },
  card: { marginTop: 16, paddingVertical: 24, paddingHorizontal: 18, alignItems: "center", gap: 4 },
  icon: { width: 72, height: 70, marginBottom: 6 },
  eyebrow: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bold, color: colors.green, letterSpacing: 0.5 },
  eventTitle: { fontSize: 19, fontWeight: "900", fontFamily: fonts.bold, color: colors.ink, textAlign: "center" },
  statusLine: { marginTop: 4, fontSize: 13, fontWeight: "700", fontFamily: fonts.bold, color: colors.brown, textAlign: "center" },
});
