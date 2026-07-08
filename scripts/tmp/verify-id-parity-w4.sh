#!/bin/sh
cd /Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones
base="https://pub-fa9d7e83944246fcb9a03f217e1dd0c9.r2.dev/quest-audio"
bad=0; retry=""
for i in $(seq -f "%04g" 1801 2800); do
  f="id-id-$i.mp3"
  local_md5=$(md5 -q "public/quest-audio/$f")
  etag=$(curl -sI --max-time 15 "$base/$f" | tr -d '\r' | awk -F'"' '/[Ee][Tt]ag/{print $2}')
  if [ "$etag" != "$local_md5" ]; then
    retry="$retry $f"
  fi
done
# sequential recheck of misses (r2.dev rate-limits — the 429 lesson)
for f in $retry; do
  sleep 1
  local_md5=$(md5 -q "public/quest-audio/$f")
  etag=$(curl -sI --max-time 15 "$base/$f" | tr -d '\r' | awk -F'"' '/[Ee][Tt]ag/{print $2}')
  if [ "$etag" != "$local_md5" ]; then
    bad=$((bad+1)); echo "MISMATCH $f local=$local_md5 r2=$etag"
  fi
done
echo "PARITY DONE mismatches=$bad"
