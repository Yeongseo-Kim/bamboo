# 스마트 발송 (푸시/알림) 연동 가이드

> 토스 앱인토스 스마트 발송을 연동하여 **푸시 알림이 뜨고, 클릭 시 미니앱으로 진입**하도록 설정하는 가이드입니다.

---

## 1. 개요

### 현재 vs 스마트 발송

| 구분 | 현재 (Firestore 인앱 알림) | 스마트 발송 |
|------|---------------------------|-------------|
| 노출 | 앱을 열었을 때만 알림 목록에 표시 | **앱이 꺼져 있어도 OS 푸시** + 토스 앱 내 알림함 |
| 클릭 시 | 알림 화면 → 글 상세 이동 | **푸시 탭 → 토스 앱 실행 → 미니앱 해당 화면으로 바로 이동** |
| 발송 주체 | Firestore 클라이언트 직접 쓰기 | **Cloud Functions → 앱인토스 API (mTLS)** |

### 토스 요구사항 (준수 필수)

- [x] **mTLS 인증서** 적용 (서버-서버 통신)
- [ ] **템플릿 검수** (영업일 2~3일)
- [x] **알림 수신 해제** 경로 제공 (앱 내에서 해제 가능)
- [x] **랜딩 URL/딥링크**: 푸시 클릭 시 의도한 화면으로 정확히 진입
- [x] 제목 13자, 본문 20자 권장, 해요체
- [x] 기능성 메시지: 서비스 이용에 필요한 정보만 (광고/마케팅 X)

---

## 2. 구현 완료 사항

### Cloud Functions (`functions/`)

- `onCommentCreated`: 댓글 생성 시 → 게시글 작성자 + 참여자에게 푸시 발송
- `onHeartCreated`: 공감 생성 시 → 글/댓글 작성자에게 푸시 발송
- `registerUserKeyFromAuthCode`: 앱에서 appLogin 후 userKey 등록용 (Callable)

### 앱 연동

- `settings.tsx`: 푸시 ON 시 `registerUserKeyForPush()` 호출 → appLogin → userKey 등록
- `user_keys` 컬렉션: `userId`(deviceId) → `tossUserKey` 매핑 저장

### 템플릿 코드 (콘솔에 등록한 값과 일치해야 함)

- 댓글: `bamboo-app-bamboo_comment_notification`
- 공감: `bamboo-app-bamboo_heart_notification` (콘솔에 동일 템플릿 추가 필요)

---

## 3. 배포 전 체크리스트

### 1) mTLS 인증서

- [서버 mTLS 인증서 발급](https://developers-apps-in-toss.toss.im/development/integration-process.html#mtls-인증서-발급받기)
- `certs/bamboo-app.crt`, `certs/bamboo-app.key` 를 `functions/certs/` 또는 프로젝트 `certs/` 에 배치
- Cloud Functions 배포 시 certs 포함되도록 `.gcloudignore` 확인 (certs는 Secret Manager 권장)

### 2) 토스 로그인 연동 (userKey 수집용)

- 앱인토스 콘솔에서 토스 로그인 연동 완료 (cert.support@toss.im)
- 푸시 ON 시 appLogin → userKey 등록 플로우 동작

### 3) Functions 배포

```bash
cd functions
npm run build
firebase deploy --only functions
```

### 4) 콘솔 템플릿

- 댓글: `bamboo-app-bamboo_comment_notification` 검수 완료
- 공감: `bamboo-app-bamboo_heart_notification` 템플릿 추가 및 검수

---

## 4. 딥링크 (랜딩 URL) 형식

푸시를 탭했을 때 이동할 URL 형식:

```
intoss://bamboo-app                 → 홈
intoss://bamboo-app/post/{postId}   → 해당 글 상세
intoss://bamboo-app/notifications   → 알림 목록
```

---

## 5. 참고 링크

- [스마트 발송 이해하기](https://developers-apps-in-toss.toss.im/smart-message/intro)
- [스마트 발송 콘솔 가이드](https://developers-apps-in-toss.toss.im/smart-message/console)
- [스마트 발송 개발하기](https://developers-apps-in-toss.toss.im/smart-message/develop)
- [API 사용하기 (mTLS)](https://developers-apps-in-toss.toss.im/development/integration-process)
- [토스 로그인 개발하기](https://developers-apps-in-toss.toss.im/login/develop)
