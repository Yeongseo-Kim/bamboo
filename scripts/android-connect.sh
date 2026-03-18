#!/usr/bin/env bash
set -euo pipefail

ADB_BIN="${ADB_BIN:-$HOME/Library/Android/sdk/platform-tools/adb}"
if [ ! -x "$ADB_BIN" ]; then
  ADB_BIN="adb"
fi

# 첫 번째 authorized 기기 선택 (status = "device")
DEVICE_ID="${ANDROID_DEVICE_ID:-$("$ADB_BIN" devices | awk 'NR > 1 && $2 == "device" { print $1; exit }')}"
if [ -z "${DEVICE_ID:-}" ]; then
  echo "연결된 Android 실기기를 찾지 못했습니다. USB 디버깅 허용 상태를 확인해 주세요."
  "$ADB_BIN" devices -l || true
  exit 1
fi

echo "adb reverse 설정 중... (기기: $DEVICE_ID)"
"$ADB_BIN" -s "$DEVICE_ID" reverse tcp:8081 tcp:8081
"$ADB_BIN" -s "$DEVICE_ID" reverse tcp:5173 tcp:5173
"$ADB_BIN" -s "$DEVICE_ID" reverse --list
echo "완료."
