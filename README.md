# Bamboo - 앱인토스 미니앱

앱인토스(Access In Toss) React Native 미니앱 프로젝트입니다.

## 📋 사전 준비

1. **앱인토스 콘솔**: [앱인토스 콘솔](https://developers-apps-in-toss.toss.im)에서 앱을 생성하세요.
2. **샌드박스 앱**: 개발/테스트를 위해 **앱인토스 샌드박스 앱** 설치가 필수입니다.

## 🚀 로컬 개발 서버 실행

```bash
npm run dev
```

개발 서버가 실행되면 Metro 번들러가 시작됩니다.

## 📱 미니앱 실행하기

### iOS 시뮬레이터
1. 앱인토스 샌드박스 앱 실행
2. `intoss://bamboo-app` 스킴 입력 후 "스키마 열기" 버튼 클릭
3. Metro 서버와 자동 연결됩니다

### Android 실기기/에뮬레이터
1. USB 연결 후 아래 명령어 실행:
   ```bash
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:5173 tcp:5173
   ```
2. 샌드박스 앱에서 `intoss://bamboo-app` 입력 후 실행

## 📦 빌드하기

```bash
npm run build
```

빌드 완료 시 `bamboo-app.ait` 파일이 생성됩니다. 이 파일을 앱인토스 콘솔에서 업로드하여 출시하세요.

## ⚙️ 설정 (granite.config.ts)

- **appName**: 앱인토스 콘솔에서 만든 앱 이름과 동일해야 합니다
- **displayName**: 화면에 표시될 앱 이름
- **primaryColor**: 대표 색상 (HEX 형식)
- **icon**: 앱 아이콘 이미지 URL (비워두면 테스트 가능)

## 📁 프로젝트 구조

```
bamboo/
├── pages/           # 파일 기반 라우팅 (index.tsx → /, about.tsx → /about)
├── src/
│   ├── _app.tsx     # 앱 진입점
│   └── pages/       # 실제 페이지 컴포넌트
├── granite.config.ts # 앱 설정
└── package.json
```

## 🤖 AI 개발 환경 설정 (Cursor)

AI가 앱인토스 SDK·TDS를 더 정확히 참고할 수 있도록 아래 설정을 권장합니다.

### 1. MCP 서버 연결

1. **ax CLI 설치** (macOS):
   ```bash
   brew tap toss/tap && brew install ax
   ```
2. 프로젝트의 `.cursor/mcp.json`에 앱인토스 MCP가 이미 설정돼 있습니다.
3. Cursor를 다시 시작하면 MCP 서버가 활성화됩니다.

### 2. Docs 등록 (@docs)

Cursor **설정(⚙️)** → **Indexing & Docs** → **Docs** → `+Add Doc`에서 아래 URL을 추가하세요:

| 용도 | URL |
|------|-----|
| 기본 (권장) | `https://developers-apps-in-toss.toss.im/llms.txt` |
| TDS React Native | `https://tossmini-docs.toss.im/tds-react-native/llms-full.txt` |

자세한 URL 목록은 `.cursor/docs-for-cursor.md`를 참고하세요.

### 3. @docs 사용법

SDK·API 사용법처럼 문서 기반 답변이 필요할 때:

```
@docs 앱인토스 인앱광고 샘플 코드 작성해줘
```

---

## 📚 참고 문서

- [앱인토스 React Native 가이드](https://developers-apps-in-toss.toss.im/tutorials/react-native.html)
- [AI 개발 가이드](https://developers-apps-in-toss.toss.im/development/llms.html)
- [TDS React Native](https://tossmini-docs.toss.im/tds-react-native/)
