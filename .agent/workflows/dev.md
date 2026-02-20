---
description: 로컬 개발 서버 실행 및 디버깅 워크플로우
---

# 개발 서버 실행 및 디버깅

## 1. 기존 프로세스 정리
포트 충돌 방지를 위해 기존 Metro 서버를 먼저 종료합니다.

```bash
lsof -ti :8081 -ti :8097 -ti :8098 2>/dev/null | xargs kill -9 2>/dev/null; echo "done"
```

// turbo
## 2. 개발 서버 시작
```bash
cd /Users/eldrac/Desktop/bamboo && npm run dev
```

## 3. 샌드박스 앱에서 테스트
- iOS 시뮬레이터 또는 실기기에서 **앱인토스 샌드박스 앱** 실행
- 서버 주소 입력: `http://<PC IP>:8081` 또는 `http://localhost:8081`
- 앱이 Bundle을 로드하면 Metro 터미널에 `BUNDLE ./index.ts` 표시

## 4. 디버거 연결
- Metro 터미널에서 `j` 키를 눌러 React Native Debugger(Chrome) 열기
- Console 탭: 런타임 로그 및 에러 확인
- Network 탭: Firestore 요청 모니터링
- Source 탭: 중단점으로 디버깅

## 5. 트러블슈팅
- **`잠시 문제가 생겼어요` 표시**: adb 연결 끊고 포트 재연결
  ```bash
  adb reverse tcp:8081 tcp:8081
  ```
- **PC 웹에서 Not Found**: 8081 포트는 샌드박스 전용, PC 브라우저에서는 정상
- **기기 연결 안됨**: Metro 빌드가 시작(`BUNDLE ./index.ts`)되는지 확인
- **REPL 멈춤**: 콘솔 옆 눈 아이콘 클릭 → `__DEV__` 등 입력
- **네트워크 인스펙터 안됨**: 앱 완전 종료 → 서버 재시작 → 앱 재실행
