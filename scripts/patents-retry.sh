#!/usr/bin/env bash
# Google Patents rate-limits bursts with a 503 that clears on its own. This
# retries the update until filings land, so the desk populates without anyone
# having to babysit it.
#
#   npm run patents:retry
set -u
ATTEMPTS=${PATENT_ATTEMPTS:-10}
WAIT=${PATENT_WAIT:-600}

for i in $(seq 1 "$ATTEMPTS"); do
  echo "attempt $i/$ATTEMPTS at $(date +%H:%M:%S)"
  PATENT_GAP_MS=${PATENT_GAP_MS:-6000} node scripts/update-patents.ts 2>&1 | tail -3
  count=$(node -e "console.log(JSON.parse(require('fs').readFileSync('data/patents.json','utf8')).items.length)")
  if [ "$count" -gt 0 ]; then
    echo "stored $count filings — done"
    exit 0
  fi
  [ "$i" -lt "$ATTEMPTS" ] && sleep "$WAIT"
done

echo "still blocked after $ATTEMPTS attempts; re-run npm run patents:retry later"
exit 1
