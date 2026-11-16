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
│  └─ offline.ts         # 오프라인 보상 계산
├─ assets.ts             # 모든 이미지 에셋 등록처
└─ i18n/                 # 다국어 문자열
```

새 필드가 세이브(`GameState`)에 추가될 때는 항상 `optional`로 선언하고, 이전 버전 세이브와의 호환을 `useGameState.ts`의 로드 로직에서 처리합니다.

## 세계관

캐릭터, 스테이지, 스토리 설정은 [`설정집.md`](설정집.md)를 따릅니다.

## 라이선스

[LICENSE](LICENSE) 참고.
