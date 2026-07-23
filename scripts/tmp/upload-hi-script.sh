#!/bin/sh
cd /Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones
LOG=scripts/tmp/upload-hi-script.log
: > "$LOG"
for f in public/quest-audio/sc-hi-*.mp3; do
  base=$(basename "$f")
  if npx wrangler r2 object put "langlab-srs-audio/quest-audio/$base" --file "$f" --content-type audio/mpeg --remote 2>&1 | grep -q "Upload complete"; then
    echo "OK $base" >> "$LOG"
  elif npx wrangler r2 object put "langlab-srs-audio/quest-audio/$base" --file "$f" --content-type audio/mpeg --remote 2>&1 | grep -q "Upload complete"; then
    echo "OK $base" >> "$LOG"
  else
    echo "FAIL $base" >> "$LOG"
  fi
done
echo "ok=$(grep -c '^OK' "$LOG") fail=$(grep -c '^FAIL' "$LOG")"
