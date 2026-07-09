#!/bin/sh
cd /Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones
base="https://pub-fa9d7e83944246fcb9a03f217e1dd0c9.r2.dev/quest-audio"
> scripts/tmp/hi-missing.txt
n=0; miss=0
for f in public/quest-audio/hi-hi-*.mp3; do
  b=$(basename "$f")
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "$base/$b")
  n=$((n+1))
  if [ "$code" != "200" ]; then miss=$((miss+1)); echo "$b" >> scripts/tmp/hi-missing.txt; fi
  case $n in *00) echo "checked $n, missing $miss";; esac
done
echo "SWEEP DONE checked=$n missing=$miss"
