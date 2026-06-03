#!/usr/bin/env python3
"""
Generate Welsh audio files using edge-tts (Microsoft Edge TTS).
Google Cloud TTS does not support Welsh (cy-GB), so we use edge-tts instead.

Usage:
  python3 scripts/generate-welsh-audio.py [--resume] [--concurrency=20]
"""

import asyncio
import json
import os
import sys
import time

try:
    import edge_tts
except ImportError:
    print("Error: edge-tts not installed. Run: pip3 install edge-tts")
    sys.exit(1)

VOICE = "cy-GB-NiaNeural"
RATE = "-5%"  # slightly slower for clarity

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DECK_PATH = os.path.join(PROJECT_DIR, "src", "data", "welsh", "deck.json")
AUDIO_DIR = os.path.join(PROJECT_DIR, "public", "quest-audio")

# Parse args
args = sys.argv[1:]
resume = "--resume" in args
concurrency_arg = [a for a in args if a.startswith("--concurrency=")]
concurrency = int(concurrency_arg[0].split("=")[1]) if concurrency_arg else 20


def audio_filename(card_id):
    return f"cy-{card_id}.mp3"


async def generate_one(card, semaphore, stats):
    """Generate a single audio file with retry logic."""
    filename = audio_filename(card["id"])
    filepath = os.path.join(AUDIO_DIR, filename)

    async with semaphore:
        for attempt in range(5):
            try:
                communicate = edge_tts.Communicate(card["target"], VOICE, rate=RATE)
                await communicate.save(filepath)

                # Verify file was created and is not empty
                size = os.path.getsize(filepath)
                if size < 100:
                    raise Exception(f"File too small: {size} bytes")

                stats["done"] += 1
                if stats["done"] % 50 == 0 or stats["done"] == stats["total"]:
                    elapsed = time.time() - stats["start"]
                    rate = stats["done"] / elapsed if elapsed > 0 else 0
                    remaining = (stats["total"] - stats["done"]) / rate if rate > 0 else 0
                    pct = (stats["done"] / stats["total"]) * 100
                    print(
                        f"  [{pct:.1f}%] {stats['done']}/{stats['total']} done "
                        f"– {rate:.1f} cards/s – ~{int(remaining)}s remaining"
                    )
                return

            except Exception as e:
                if attempt < 4:
                    wait = (2 ** attempt) * 1 + 0.5
                    if attempt > 0:
                        print(f"  Retry {attempt+1} for card {card['id']}: {str(e)[:80]}")
                    await asyncio.sleep(wait)
                else:
                    stats["failed"] += 1
                    stats["failed_cards"].append(
                        {"id": card["id"], "target": card["target"], "error": str(e)}
                    )
                    print(f"  FAILED card {card['id']}: {e}")


async def main():
    print("┌─────────────────────────────────────────────┐")
    print("│  Welsh Audio Generator (edge-tts)            │")
    print("├─────────────────────────────────────────────┤")
    print(f"│  Voice: {VOICE:<35}│")
    print(f"│  Rate:  {RATE:<35}│")
    print(f"│  Concurrency: {str(concurrency):<29}│")
    print(f"│  Resume mode: {str(resume):<29}│")
    print("└─────────────────────────────────────────────┘")

    # Load deck
    with open(DECK_PATH, "r", encoding="utf-8") as f:
        deck = json.load(f)
    print(f"\nLoaded {len(deck)} cards from deck.json")

    # Ensure audio directory exists
    os.makedirs(AUDIO_DIR, exist_ok=True)

    # Filter cards
    to_process = deck
    if resume:
        existing = set(os.listdir(AUDIO_DIR))
        to_process = [c for c in deck if audio_filename(c["id"]) not in existing]
        print(
            f"Resuming: {len(deck) - len(to_process)} already done, "
            f"{len(to_process)} remaining"
        )

    if len(to_process) == 0:
        print("\nAll cards already have audio files. Nothing to do.")
    else:
        print(
            f"\nGenerating {len(to_process)} audio files "
            f"({concurrency} parallel)...\n"
        )

        semaphore = asyncio.Semaphore(concurrency)
        stats = {
            "done": 0,
            "failed": 0,
            "failed_cards": [],
            "total": len(to_process),
            "start": time.time(),
        }

        tasks = [generate_one(card, semaphore, stats) for card in to_process]
        await asyncio.gather(*tasks)

        total_time = time.time() - stats["start"]
        print(
            f"\nGeneration complete: {stats['done']} succeeded, "
            f"{stats['failed']} failed in {total_time:.1f}s"
        )

        if stats["failed_cards"]:
            fail_path = os.path.join(SCRIPT_DIR, "failed-welsh-audio.json")
            with open(fail_path, "w") as f:
                json.dump(stats["failed_cards"], f, indent=2)
            print(f"Failed cards saved to: {fail_path}")

    # Update deck.json audio fields
    print("\nUpdating deck.json audio fields...")
    audio_files = set(os.listdir(AUDIO_DIR))
    updated = 0

    for card in deck:
        filename = audio_filename(card["id"])
        if filename in audio_files:
            if card.get("audio") != filename:
                card["audio"] = filename
                updated += 1

    if updated > 0:
        with open(DECK_PATH, "w", encoding="utf-8") as f:
            json.dump(deck, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"Updated {updated} cards with audio filenames")
    else:
        print("All audio fields already up to date")

    # Summary
    with_audio = sum(1 for c in deck if c.get("audio") and len(c["audio"]) > 0)
    print(
        f"\nFinal: {with_audio}/{len(deck)} cards have audio "
        f"({(with_audio/len(deck))*100:.1f}%)"
    )

    # Size report
    total_size = 0
    count = 0
    for filename in audio_files:
        if filename.startswith("cy-"):
            filepath = os.path.join(AUDIO_DIR, filename)
            total_size += os.path.getsize(filepath)
            count += 1
    print(f"Welsh audio: {count} files, {total_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    asyncio.run(main())
