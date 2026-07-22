#!/bin/sh
cd /Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones
ok=0; fail=0
for f in public/quest-audio/sc-ko-*.mp3; do
  base=$(basename "$f")
  if npx wrangler r2 object put "langlab-srs-audio/quest-audio/$base" --file "$f" --content-type audio/mpeg --remote >/dev/null 2>&1; then
    ok=$((ok+1))
  elif npx wrangler r2 object put "langlab-srs-audio/quest-audio/$base" --file "$f" --content-type audio/mpeg --remote >/dev/null 2>&1; then
    ok=$((ok+1))
  else
    fail=$((fail+1)); echo "FAIL $base"
  fi
done
echo "DONE ok=$ok fail=$fail"
