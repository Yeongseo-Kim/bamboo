# 샌드박스 Metro 연결 체크리스트

## ✅ 1. Metro 서버 실행 (완료)
- `npm run dev` → **http://0.0.0.0:8081** 에서 실행 중

---

## ⚠️ 2. 기기별 필수 설정 (여기서 막힐 수 있음!)

### 📱 iPhone 실기기 (진짜 아이폰)
**가장 많이 빠지는 단계: 샌드박스 앱에서 서버 주소 입력**

1. Mac과 아이폰이 **같은 Wi‑Fi**에 연결되어 있어야 함
2. 샌드박스 앱 실행 → **"로컬 네트워크" 허용** 선택
3. **서버 주소 입력 화면**이 나오면 아래 IP를 입력하고 저장:
   ```
   192.168.45.18
   ```
4. 그 다음 `intoss://bamboo-app` 스킴으로 접속

> 💡 **이 서버 주소 입력을 하지 않으면** "Metro 서버 실행해주세요" 메시지가 계속 뜹니다!

---

### 🤖 Android (휴대폰/에뮬레이터)
**USB 연결 후 adb reverse 필수**

1. USB로 컴퓨터에 연결
2. 터미널에서 실행:
   ```bash
   ~/Library/Android/sdk/platform-tools/adb reverse tcp:8081 tcp:8081
   ~/Library/Android/sdk/platform-tools/adb reverse tcp:5173 tcp:5173
   ```
3. 연결 확인: `adb reverse --list`

> 에뮬레이터가 `offline`이면 에뮬레이터를 재시작하세요.

---

### 🍎 iPhone 시뮬레이터 (맥에서만)
- 별도 설정 없음, Metro만 켜면 자동 연결

---

## 3. 최종 확인
- 샌드박스 앱에서 `intoss://bamboo-app` 입력 후 실행
- 화면 상단에 **`Bundling ...%`** 가 보이면 연결 성공
