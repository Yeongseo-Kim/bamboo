---
description: 앱 번들 빌드 및 출시 워크플로우
---

# 앱 번들 빌드

// turbo-all

## 1. 타입 체크
```bash
cd /Users/eldrac/Desktop/bamboo && npm run typecheck
```

## 2. 린트 체크
```bash
cd /Users/eldrac/Desktop/bamboo && npm run lint
```

## 3. 테스트 실행
```bash
cd /Users/eldrac/Desktop/bamboo && npm test
```

## 4. 번들 빌드
```bash
cd /Users/eldrac/Desktop/bamboo && npm run build
```

## 5. 빌드 결과 확인
- `dist/` 디렉토리에 번들 파일 생성 확인
- 콘솔에서 번들 업로드 후 QR 코드 테스트 또는 피처 테스트 진행
