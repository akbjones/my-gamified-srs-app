#!/usr/bin/env python3
"""
Full R2-vs-local audio parity check.

For every audio file referenced by any deck, compare the local MD5 with
the R2 object's ETag via the public URL (single-part PUT uploads make
ETag == MD5). A mismatch means R2 serves different bytes than the
canonical local file — i.e. a stale/mixed voice for that card.

Usage: python3 scripts/verify-r2-parity.py
Writes mismatches to /tmp/r2-parity-mismatches.json
"""
import json, os, hashlib, concurrent.futures, urllib.request, sys

BASE = "https://pub-fa9d7e83944246fcb9a03f217e1dd0c9.r2.dev/quest-audio"
AUDIO = "public/quest-audio"
LANGS = ["spanish","italian","french","portuguese","german","dutch",
         "swedish","hindi","turkish","russian","welsh"]
UA = {"User-Agent": "Mozilla/5.0 (parity-check)"}

files = []
seen = set()
for lang in LANGS:
    deck = json.load(open(f"src/data/{lang}/deck.json"))
    for c in deck:
        f = c.get("audio")
        if f and f not in seen:
            seen.add(f)
            files.append(f)
print(f"checking {len(files)} unique audio files", flush=True)

def check(f):
    p = os.path.join(AUDIO, f)
    if not os.path.exists(p):
        return (f, "missing-local")
    local_md5 = hashlib.md5(open(p, "rb").read()).hexdigest()
    req = urllib.request.Request(f"{BASE}/{f}", method="HEAD", headers=UA)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                etag = (r.headers.get("ETag") or "").strip('"')
                if etag == local_md5:
                    return (f, None)
                return (f, f"etag={etag} local={local_md5}")
        except Exception as e:
            if attempt == 3:
                return (f, f"error={e}")
            import time; time.sleep(1.5 ** attempt)

bad = []
done = 0
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
    for f, err in ex.map(check, files):
        done += 1
        if err:
            bad.append({"file": f, "issue": err})
        if done % 2000 == 0:
            print(f"  {done}/{len(files)}  mismatches so far: {len(bad)}", flush=True)

json.dump(bad, open("/tmp/r2-parity-mismatches.json", "w"), indent=1)
print(f"\nDONE: {done} checked, {len(bad)} mismatches -> /tmp/r2-parity-mismatches.json", flush=True)
by_lang = {}
for b in bad:
    by_lang[b["file"][:2]] = by_lang.get(b["file"][:2], 0) + 1
print("mismatches by lang prefix:", by_lang, flush=True)
