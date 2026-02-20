---
description: Firestore 보안 규칙 및 인덱스 배포
---

# Firestore 배포

## 1. 규칙 및 인덱스 배포
```bash
cd /Users/eldrac/Desktop/bamboo && firebase deploy --only firestore
```

## 2. 확인
- Firebase 콘솔에서 규칙이 반영되었는지 확인:
  https://console.firebase.google.com/u/0/project/bamboo-ff951/firestore
- 복합 인덱스가 `firestore.indexes.json`에 정의된 대로 생성되었는지 확인

## 3. 주의사항
- 현재 `firestore.rules`는 `allow read, write: if true`로 열려 있음 (MVP용)
- 배포 전 보안 규칙 강화 필요: `request.auth != null` 또는 userId 검증 적용
- 복합 쿼리(where + orderBy 조합)는 반드시 인덱스 필요
  - posts: `isHidden` + `createdAt` DESC
  - comments: `postId` + `isHidden` + `createdAt` ASC
  - reports: `targetType` + `targetId` + `userId`
  - reports: `targetType` + `targetId`
