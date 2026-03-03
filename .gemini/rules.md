# Bamboo 프로젝트 개발 규칙

## 프로젝트 개요
- **bamboo-app**: 앱인토스(Apps in Toss) 플랫폼용 React Native 미니앱
- **스킴**: `intoss://bamboo-app`
- **프레임워크**: Granite (`@granite-js/react-native`) + `@apps-in-toss/framework`
- **UI**: TDS (`@toss/tds-react-native`) — 비게임 앱은 TDS 사용 필수 (검수 기준)
- **백엔드**: Firebase Firestore (Web SDK v12, 모듈러 API)

## 기술 스택
- React Native 0.72, React 18.2
- TypeScript (strict mode)
- Metro 번들러 (Granite 내장)
- Firebase JS SDK v12 (`firebase/firestore`)
- `date-fns` (날짜 포맷)
- Biome (lint/format)

## 개발 원칙

### 라우팅
- **파일 기반 라우팅**: `src/pages/` 디렉토리 구조가 경로를 결정
  - `src/pages/index.tsx` → `/`
  - `src/pages/write.tsx` → `/write`
  - `src/pages/post/[id].tsx` → `/post/:id`
- 각 페이지는 반드시 `createRoute()` + `component` 패턴으로 정의
- 네비게이션: `Route.useNavigation()` → `navigation.navigate(경로, params?)`
- 파라미터: `Route.useParams()`, `validateParams`로 타입 검증

### UI 컴포넌트
- **모든 UI는 TDS 컴포넌트 우선 사용** (Button, Toast, ListRow, PageNavbar, TextArea, List, TextButton, Txt 등)
- TDS 컴포넌트는 **로컬 브라우저에서 동작하지 않음** → 반드시 샌드박스 앱에서 테스트
- `Txt` 컴포넌트: typography props (`t1`~`t7`), color, fontWeight 지원
- `PageNavbar`: 화면 상단 내비게이션 바 (Title, AccessoryButtons 등)
- `Icon`: TDS 아이콘 컴포넌트 — `name`, `size`, `color` props 사용
  - 아웃라인(선만): `heart-line`, `chat-line` 등 `-line` suffix
  - 채워진 형태: `heart`, `chat` 등 suffix 없음
  - **이모지/유니코드 문자 직접 사용 금지** → 반드시 `Icon` 컴포넌트 사용
- `Asset.Icon`: 프레임과 함께 아이콘을 표시할 때 사용 (`name` prop)
- 커스텀 스타일은 `StyleSheet.create()` 사용

### 환경 변수
- `@granite-js/plugin-env`로 빌드 시점에 주입
- `.env` 파일에서 `FIREBASE_*` 값 로드 → `granite.config.ts`의 `env()` 플러그인에서 `VITE_*` 접두사로 변환
- 런타임 접근: `(import.meta as unknown as { env: Record<string, string> }).env.VITE_*`

### Firebase / Firestore
- **모듈러 API만 사용** (v9+ 스타일): `import { getFirestore, collection, doc, ... } from 'firebase/firestore'`
- `@firebase/firestore`는 RN 전용 빌드(`dist/index.rn.js`)로 리졸브 (granite.config.ts 설정)
- crypto shim: `crypto-browserify`로 폴리필 (`shims/crypto.js`)
- Firestore 복합 쿼리는 반드시 `firestore.indexes.json`에 인덱스 정의 필요
- 보안 규칙: `firestore.rules` → `firebase deploy --only firestore`로 배포

### 코드 컨벤션
- 모든 비속어/금융사기 키워드 필터링: `containsBlockedContent()` (src/lib/cleanBot.ts)
- 닉네임 자동 생성: `generateNickname()` (형용사 + 동물)
- 댓글 표시 이름: 원글 작성자 = "글쓴이", 나머지 = "익명 N"
- `Date.now()` 밀리초 타임스탬프 사용 (Firestore Timestamp → `toMillis()` 변환 헬퍼)

## 디버깅
- Metro 서버: `npm run dev` (Granite dev server, port 8081)
- 샌드박스 앱에서 Metro 서버 주소 입력 후 테스트
- `j` 키로 React Native Debugger (Chrome) 연결
- PC 브라우저에서 8081 접속 시 "Not Found"는 정상 (샌드박스 전용)

## 공식 문서 참고 URL
- 앱인토스 개발자센터: https://developers-apps-in-toss.toss.im/llms.txt
- TDS React Native: https://tossmini-docs.toss.im/tds-react-native/llms-full.txt
- 예제 코드: https://developers-apps-in-toss.toss.im/tutorials/examples.md
- Firebase 연동: https://developers-apps-in-toss.toss.im/firebase/intro.md

## 디자인 가이드
- 토스 디자인 시스템 개요: https://developers-apps-in-toss.toss.im/design/overview.html
- TDS 컴포넌트 목록: https://developers-apps-in-toss.toss.im/design/components.html
- TDS Mobile 문서: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/
- UX 라이팅 가이드: https://developers-apps-in-toss.toss.im/design/ux-writing.html
- 접근성 가이드: https://frontend-fundamentals.com/a11y/
- 핵심 TDS 컴포넌트: Badge, Border, BottomCTA, Button, Asset, ListRow, ListHeader, Navigation, Paragraph, Tab, Top
