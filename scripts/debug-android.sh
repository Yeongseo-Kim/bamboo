#!/usr/bin/env bash
set -euo pipefail

ADB_BIN="${ADB_BIN:-$HOME/Library/Android/sdk/platform-tools/adb}"
if [ ! -x "$ADB_BIN" ]; then
  ADB_BIN="adb"
fi

if ! command -v "$ADB_BIN" >/dev/null 2>&1; then
  echo "adb를 찾을 수 없습니다. Android SDK Platform-Tools 설치를 확인해 주세요."
  exit 1
fi

DEVICE_ID="${ANDROID_DEVICE_ID:-$("$ADB_BIN" devices | awk 'NR > 1 && $2 == "device" { print $1; exit }')}"
if [ -z "${DEVICE_ID:-}" ]; then
  echo "연결된 Android 실기기를 찾지 못했습니다. USB 디버깅 상태를 확인해 주세요."
  "$ADB_BIN" devices -l || true
  exit 1
fi

echo "[debug:android] device: $DEVICE_ID"
echo "[debug:android] adb reverse 설정 중..."
"$ADB_BIN" -s "$DEVICE_ID" reverse --remove-all >/dev/null 2>&1 || true
"$ADB_BIN" -s "$DEVICE_ID" reverse tcp:8081 tcp:8081
"$ADB_BIN" -s "$DEVICE_ID" reverse tcp:5173 tcp:5173
"$ADB_BIN" -s "$DEVICE_ID" reverse --list

echo "[debug:android] 샌드박스 앱 열기 시도..."
"$ADB_BIN" -s "$DEVICE_ID" shell am start -a android.intent.action.VIEW -d "intoss://bamboo-app" >/dev/null 2>&1 || true

echo "[debug:android] Metro 시작"
npm run dev
