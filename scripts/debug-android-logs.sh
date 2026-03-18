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

echo "[debug:android:logs] device: $DEVICE_ID"
echo "[debug:android:logs] 로그 초기화 후 실시간 수집을 시작합니다. (종료: Ctrl+C)"
echo "[debug:android:logs] (RedBox/Metro 에러도 이 터미널에 실시간 출력됩니다)"
"$ADB_BIN" -s "$DEVICE_ID" logcat -c || true
# RedBox·Metro 500 에러는 unknown, ReactHost, BridgelessReact 태그로도 출력됨
"$ADB_BIN" -s "$DEVICE_ID" logcat '*:S' ReactNative:V ReactNativeJS:V AndroidRuntime:E ReactHost:E BridgelessReact:W unknown:W
