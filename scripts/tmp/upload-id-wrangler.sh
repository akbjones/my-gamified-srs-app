#!/bin/sh
cd /Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones
ok=0; fail=0
for i in $(seq -f "%04g" 2 300); do
  f="id-id-$i.mp3"
  if npx wrangler r2 object put "langlab-srs-audio/quest-audio/$f" --file "public/quest-audio/$f" --content-type audio/mpeg --remote >/dev/null 2>&1; then
    ok=$((ok+1))
  else
    # one retry
    if npx wrangler r2 object put "langlab-srs-audio/quest-audio/$f" --file "public/quest-audio/$f" --content-type audio/mpeg --remote >/dev/null 2>&1; then
      ok=$((ok+1))
    else
      fail=$((fail+1)); echo "FAIL $f"
    fi
  fi
  case $((ok+fail)) in *00|*50) echo "progress: $((ok+fail))/299";; esac
done
echo "DONE ok=$ok fail=$fail"
