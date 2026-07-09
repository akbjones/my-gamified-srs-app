#!/bin/sh
cd /Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones
ok=0; fail=0
for i in $(seq -f "%04g" 301 1300); do
  f="ko-ko-$i.mp3"
  if npx wrangler r2 object put "langlab-srs-audio/quest-audio/$f" --file "public/quest-audio/$f" --content-type audio/mpeg --remote >/dev/null 2>&1; then
    ok=$((ok+1))
  elif npx wrangler r2 object put "langlab-srs-audio/quest-audio/$f" --file "public/quest-audio/$f" --content-type audio/mpeg --remote >/dev/null 2>&1; then
    ok=$((ok+1))
  else
    fail=$((fail+1)); echo "FAIL $f"
  fi
  case $((ok+fail)) in *00) echo "progress: $((ok+fail))/1000";; esac
done
echo "DONE ok=$ok fail=$fail"
