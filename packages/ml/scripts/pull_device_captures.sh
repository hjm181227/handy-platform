#!/usr/bin/env bash
# 연결된 Android 기기(앱 com.handyapp)의 캐시에서 촬영 이미지를 test_images/로 가져온다.
# 앱에서 손톱 측정 촬영을 한 뒤 실행하면, 방금 찍은 사진이 로컬로 복사된다.
#
# 사용법:  bash scripts/pull_device_captures.sh
# 사전조건: adb 연결(기기 인증됨), 앱이 debuggable 빌드

set -euo pipefail
PKG=com.handyapp
DEST="$(cd "$(dirname "$0")/.." && pwd)/test_images"
mkdir -p "$DEST"

echo "[pull] 기기 확인..."
adb get-state >/dev/null 2>&1 || { echo "기기 미연결. adb devices로 확인하세요."; exit 1; }

echo "[pull] 앱 캐시에서 이미지 검색..."
FILES=$(adb shell "run-as $PKG ls /data/data/$PKG/cache/ 2>/dev/null" | tr -d '\r' | grep -iE '\.jpe?g$' || true)
if [ -z "$FILES" ]; then
  echo "[pull] 캐시에 이미지가 없습니다. 앱에서 측정 촬영을 먼저 하세요."
  exit 0
fi

n=0
for f in $FILES; do
  # run-as로 읽어 로컬로 저장 (앱 샌드박스 우회)
  adb exec-out "run-as $PKG cat /data/data/$PKG/cache/$f" > "$DEST/$f"
  if [ -s "$DEST/$f" ]; then
    echo "[pull] $f → test_images/$f ($(wc -c < "$DEST/$f") bytes)"
    n=$((n+1))
  else
    rm -f "$DEST/$f"
  fi
done
echo "[pull] 완료: $n개. 이제:  venv-cardtune\\Scripts\\python scripts/test_card_detection.py --image test_images/<파일>"
