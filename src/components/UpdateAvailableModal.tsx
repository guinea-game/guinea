import { Linking } from "react-native";
import { ConfirmModal } from "./ConfirmModal";
import type { UpdateNotice } from "../state/remoteUpdate";
import { t } from "../i18n";

// Shown every app open when state/remoteUpdate.ts's check finds a newer build in the store
// than the one installed, until the player actually updates. "나중에" just closes it for this
// session; "업데이트하기" opens the config's store link for this platform, if it has one.
export function UpdateAvailableModal({ notice, onClose }: { notice: UpdateNotice; onClose: () => void }) {
  return (
    <ConfirmModal
      title={t("새 버전이 나왔어요!", "A new version is available!")}
      message={notice.message || t(`v${notice.latestVersion}로 업데이트해 보세요.`, `Update to v${notice.latestVersion}.`)}
      confirmLabel={t("업데이트하기", "Update")}
      cancelLabel={t("나중에", "Later")}
      onConfirm={() => {
        if (notice.storeUrl) Linking.openURL(notice.storeUrl).catch(() => {});
        onClose();
      }}
      onCancel={onClose}
    />
  );
}
