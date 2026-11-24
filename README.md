<div align="center">

# 🐹 기니 키우기

**기니피그와 함께하는 방치형 모험 RPG**

Expo (SDK 57) · React Native · TypeScript

</div>

---

## 소개

기니피그를 키우며 몹을 자동으로 사냥하고, 요리를 해 먹이고, 동료를 모으고, 골목부터 세상 끝까지 퀘스트를 깨며 성장시키는 웹/모바일 방치형 RPG입니다.

- 🗺️ **42개 스테이지** — 뒷산에서 시작해 타지마할 정원까지, 테마별 몬스터와 보스
- 🍳 **요리 시스템** — 식재료를 모아 레시피를 배우고, 버프가 걸리는 요리를 만들어 먹기
- 🎒 **가방 & 도감** — 식재료 도감, 몬스터 도감, 요리책 《세상의 모든 맛》
- 👯 **동료** — 스테이지를 클리어하며 새로운 복장/동료를 해금
- ⚔️ **스킬 & 강화** — 공격력/치명타/골드 획득 강화, 액티브·패시브 스킬
- 📜 **골목 퀘스트** — 6개 장으로 구성된 퀘스트 사다리, 히든 퀘스트
- 💤 **오프라인 보상** — 접속하지 않아도 조금씩 진행되는 모험

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | [Expo](https://expo.dev) 57, React Native 0.86 |
| 언어 | TypeScript |
| 애니메이션 | react-native-reanimated |
| 저장 | `@react-native-async-storage/async-storage` |
| 광고 | unity-levelplay-mediation (LevelPlay) |
| 플랫폼 | 웹 우선 개발, iOS/Android 빌드 지원 |

> 이 프로젝트는 **Expo Router를 사용하지 않습니다.** 모든 화면 전환은 [`src/GameScreen.tsx`](src/GameScreen.tsx)의 탭 전환 방식으로 이루어집니다.

## 시작하기

```bash
# 의존성 설치
npm install

# 웹에서 실행 (가장 빠른 개발 루프)
npm run web

# iOS / Android 네이티브 빌드로 실행
npm run ios
npm run android
```

### 코드 점검

```bash
npx tsc --noEmit   # 타입 체크
npx eslint src     # 린트
```

## 프로젝트 구조

```
src/
├─ GameScreen.tsx        # 탭 전환, 헤더/하단 내비, 모달·튜토리얼 오버레이
├─ screens/              # 전투, 부엌, 상점, 동료, 마일스톤 등 탭별 화면
├─ components/           # 공용 UI 컴포넌트 (NineSlice, 버튼, 모달 등)
├─ state/
│  ├─ useGameState.ts    # 모든 게임 상태와 액션 (세이브: AsyncStorage `gini.save.v1`)
│  ├─ bag.ts             # 가방 용량 계산
│  ├─ quests.ts          # 퀘스트 사다리 (장 구성)
│  ├─ recipes.ts         # 레시피 데이터
│  ├─ buffs.ts           # 음식 버프
│  ├─ drops.ts           # 몬스터 드롭 테이블
│  ├─ grocery.ts         # 식료품점 가격 계산
│  ├─ stages.ts          # 스테이지 데이터
│  ├─ bestiary.ts        # 몬스터 도감
│  ├─ offline.ts         # 오프라인 보상 계산
│  ├─ levelRewards.ts    # 레벨 보상 (레벨 마일스톤 보석 상자)
│  ├─ lab.ts             # 연구소 (시간제 연구 트리)
│  └─ remoteUpdate.ts    # 앱 업데이트 알림 (아래 참고)
├─ assets.ts             # 모든 이미지 에셋 등록처
└─ i18n/                 # 다국어 문자열
```

새 필드가 세이브(`GameState`)에 추가될 때는 항상 `optional`로 선언하고, 이전 버전 세이브와의 호환을 `useGameState.ts`의 로드 로직에서 처리합니다.

## 앱 업데이트 알림

이미 설치된 빌드에게 "새 버전이 나왔다"고 알려주는 가벼운 장치가 있습니다 ([`src/state/remoteUpdate.ts`](src/state/remoteUpdate.ts)). 백엔드 없이, 별도의 public 저장소 [`guinea-game/guinea-config`](https://github.com/guinea-game/guinea-config)에 있는 `update-config.json`을 `raw.githubusercontent.com`으로 직접 읽어오는 방식입니다 — 이 저장소(`guinea`)는 private이라 자기 자신의 파일은 이 방법으로 못 읽으므로, 설정 파일만 따로 public 저장소에 둡니다.

- **판정 기준은 GitHub입니다.** 앱스토어/플레이스토어를 실제로 조회하지 않습니다 — `update-config.json`의 `ios.latestVersion`/`android.latestVersion`과 빌드에 박힌 `app.json`의 `version`을 숫자로 비교할 뿐이고, 그 값은 사람이 직접 적어 넣습니다.
- **플랫폼별로 따로 관리합니다.** iOS/Android는 스토어 심사·배포 시점이 서로 다르므로, 버전 번호와 스토어 링크를 `ios`/`android` 각각 따로 둡니다 — 한쪽만 올려도 다른 쪽엔 영향이 없습니다.
- **그래서 순서가 중요합니다.** 해당 플랫폼의 스토어 심사/배포가 끝나 사용자가 실제로 받을 수 있는 상태가 된 뒤에 그 플랫폼의 `latestVersion`을 올려야 합니다. 미리 올리면 "업데이트하기"를 눌러도 스토어에 그 버전이 아직 없어서 혼란을 줍니다.
- **알리는 방법**: `guinea-config` 저장소의 `update-config.json`에서 해당 플랫폼의 `latestVersion`(필요하면 `message`/`url`도)을 고치고 그 저장소의 `main`에 푸시하면 끝 — 이미 깔려 있는 옛날 빌드들도 앱을 켤 때마다 이 파일을 확인하므로, 몇 분 안에(GitHub 캐시) 알림이 뜨기 시작합니다.
- 하루에 같은 버전으로 한 번만 뜨고, "나중에"를 눌러도 다음 날이나 버전이 더 오르면 다시 뜹니다. 네트워크가 안 되면 조용히 아무 일도 없습니다.
- 진짜 푸시 알림(앱이 꺼져 있어도 오는 알림)이 아니라, 앱을 켤 때마다 확인하는 방식입니다.

## 세계관

캐릭터, 스테이지, 스토리 설정은 [`설정집.md`](설정집.md)를 따릅니다.

## 라이선스

[LICENSE](LICENSE) 참고.
