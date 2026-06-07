#!/usr/bin/env bash
# 더블클릭하면 promo 를 http://localhost:8000/ 으로 바로 띄운다.
# promo/ 에서 서빙하되, design 심볼릭 링크로 이미지·폰트·BGM(../design)을 연결.
PORT=8000
DIR="$(cd "$(dirname "$0")" && pwd)"   # promo/
URL="http://localhost:${PORT}/"
cd "$DIR"

# ../design 에셋을 promo 안에서 접근 가능하게 (이미지·폰트·BGM)
[ -e design ] || ln -s ../design design

# 이미 8000 을 잡고 있는 서버가 있으면 정리 (이전 실행 잔재 → 404 원인)
PIDS="$(lsof -ti "tcp:${PORT}" 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  echo "포트 ${PORT} 정리: $PIDS"
  kill $PIDS 2>/dev/null || true
  sleep 0.6
fi

echo "▶ promo:  ${URL}"
echo "  (종료하려면 이 창에서 Ctrl+C)"
( sleep 1; open "$URL" ) &
exec python3 -m http.server "$PORT"
