#!/usr/bin/env python3
"""
Regenerate the 11 Welsh fill audio files (listed in scripts/edge-tts-cards.json)
via Edge TTS with cy-GB-NiaNeural. This is the same voice the bulk of the Welsh
deck uses (which was generated via Azure with the same neural voice).

Usage:  python3 scripts/upgrade-welsh-fills-edge.py
"""
import asyncio
import json
import os
import sys

try:
    import edge_tts
except ImportError:
    print("Error: edge-tts not installed. Run: pip3 install edge-tts")
    sys.exit(1)

VOICE = "cy-GB-NiaNeural"
RATE = "-5%"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DECK_PATH = os.path.join(PROJECT_DIR, "src", "data", "welsh", "deck.json")
AUDIO_DIR = os.path.join(PROJECT_DIR, "public", "quest-audio")
MANIFEST_PATH = os.path.join(SCRIPT_DIR, "edge-tts-cards.json")


async def generate(card):
    audio_name = card.get("audio")
    if not audio_name:
        return False, "no audio field"
    out_path = os.path.join(AUDIO_DIR, audio_name)
    for attempt in range(5):
        try:
            communicate = edge_tts.Communicate(card["target"], VOICE, rate=RATE)
            await communicate.save(out_path)
            size = os.path.getsize(out_path)
            if size < 1000:
                raise Exception(f"file too small ({size} bytes)")
            return True, f"{size} bytes"
        except Exception as e:
            if attempt < 4:
                await asyncio.sleep(2 ** attempt)
            else:
                return False, str(e)
    return False, "max retries"


async def main():
    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)
    welsh_ids = manifest.get("welsh", [])
    if not welsh_ids:
        print("No Welsh fill cards in manifest.")
        return

    with open(DECK_PATH) as f:
        deck = json.load(f)
    by_id = {c["id"]: c for c in deck}

    print(f"Welsh fill cards to upgrade: {len(welsh_ids)} (voice: {VOICE})")
    done = 0
    failed = 0
    for cid in welsh_ids:
        card = by_id.get(cid)
        if not card:
            print(f"  {cid}: not in deck")
            failed += 1
            continue
        ok, info = await generate(card)
        status = "OK" if ok else "FAIL"
        print(f"  {cid}: {status} ({info}) – {card.get('target', '')[:50]}")
        if ok:
            done += 1
        else:
            failed += 1
        await asyncio.sleep(0.3)
    print(f"\nDone: {done}, Failed: {failed}")


if __name__ == "__main__":
    asyncio.run(main())
