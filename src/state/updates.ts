// 업데이트 소식: what's new in the latest update, shown once to a player who hasn't seen this
// `id` yet (with a small gift), and any time again from the settings. For each new update,
// replace this with a fresh `id` (e.g. the release date) and its own list. Each line gets a
// game icon (`image`) or, for a new companion, that companion's own sprite (`outfit`).
import { icons, skillImages, uiImages } from "../assets";
import type { Outfit } from "../types";

type UpdateItem = { text: string; image?: number; outfit?: Outfit };

export const LATEST_UPDATE: { id: string; title: string; gems: number; items: UpdateItem[] } = {
  id: "2026-11-27",
  title: "새 동료들과 기니상자가 찾아왔어요!",
  gems: 100,
  items: [
    { image: uiImages.guineaBox, text: "4회차부터 클리어하면 기니상자 등장 — 랜덤 동료를 구출해 보세요!" },
    { image: icons.chest, text: "기니상자 전용 동료 6종 추가 — 누가 나올지는 열어 봐야 알아요!" },
    { image: icons.scroll, text: "새 스토리 만화: 아가기니 유괴 사건" },
    { image: skillImages.teleport, text: "2회차부터는 텔레포트 스테이지 제한이 풀려요" },
    { image: icons.star, text: "동남아·서부·라틴 지역에 새 배경음악 적용" },
    { image: icons.potionRed, text: "낚시 요리 미니게임 손맛이 더 좋아졌어요" },
  ],
};
