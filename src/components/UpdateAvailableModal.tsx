import { Linking } from "react-native";
import { ConfirmModal } from "./ConfirmModal";
import type { UpdateNotice } from "../state/remoteUpdate";
import { t } from "../i18n";

// Shown once a day per version when state/remoteUpdate.ts's check finds a newer build in the
// store than the one installed. "나중에" just closes it (today's save of that same version
// won't ask again, see markUpdatePromptShown); "업데이트하기" opens the config's store link
// for this platform, if it has one.
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
