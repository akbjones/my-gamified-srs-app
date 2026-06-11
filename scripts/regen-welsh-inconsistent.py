#!/usr/bin/env python3
"""
Regenerate the inconsistent-voice Welsh MP3s via free Edge TTS using the
same cy-GB-NiaNeural voice the canonical bulk uses.

Reads /tmp/welsh-regen-list.txt (created by the auditor). Writes a
progress checkpoint to /tmp/welsh-regen-progress.json every 25 files
so the run can be resumed after a crash with --resume.

Usage:
    python3 scripts/regen-welsh-inconsistent.py [--resume]
"""
import asyncio
import json
import os
import sys
import time

import edge_tts

VOICE = "cy-GB-NiaNeural"
RATE = "-5%"
CONCURRENCY = 4
CHECKPOINT_EVERY = 25
LOG_EVERY = 25

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DECK_PATH = os.path.join(PROJECT_DIR, "src", "data", "welsh", "deck.json")
AUDIO_DIR = os.path.join(PROJECT_DIR, "public", "quest-audio")
LIST_PATH = "/tmp/welsh-regen-list.txt"
PROGRESS_PATH = "/tmp/welsh-regen-progress.json"


async def generate(card):
    audio_name = card.get("audio")
    if not audio_name:
        return False, "no audio field"
    out_path = os.path.join(AUDIO_DIR, audio_name)
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(card["target"], VOICE, rate=RATE)
            await comm.save(out_path)
            size = os.path.getsize(out_path)
            if size < 1000:
                raise Exception(f"file too small ({size} bytes)")
            return True, size
        except Exception as e:
            if attempt < 4:
                await asyncio.sleep(2 ** attempt)
            else:
                return False, str(e)
    return False, "max retries"


async def worker(name, queue, deck_by_audio, counters):
    while True:
        item = await queue.get()
        if item is None:
            queue.task_done()
            return
        idx, audio_file = item
        card = deck_by_audio.get(audio_file)
        if not card:
            counters["skip"] += 1
            queue.task_done()
            continue
        ok, info = await generate(card)
        if ok:
            counters["done"] += 1
        else:
            counters["failed"] += 1
            counters["failures"].append({"file": audio_file, "id": card.get("id"), "error": str(info)})
            print(f"  ✗ [{card.get('id')}] {audio_file}: {str(info)[:80]}")
        counters["processed"] += 1
        if counters["processed"] % LOG_EVERY == 0:
            print(f"  [{counters['processed']}/{counters['total']}]  done={counters['done']}  failed={counters['failed']}  skip={counters['skip']}")
        if counters["processed"] % CHECKPOINT_EVERY == 0:
            save_progress(counters)
        queue.task_done()


def save_progress(counters):
    with open(PROGRESS_PATH, "w") as f:
        json.dump({
            "processed": counters["processed"],
            "done": counters["done"],
            "failed": counters["failed"],
            "skip": counters["skip"],
            "failures": counters["failures"][-50:],  # keep last 50
        }, f, indent=2)


async def main():
    with open(LIST_PATH) as f:
        file_list = [line.strip() for line in f if line.strip()]
    with open(DECK_PATH) as f:
        deck = json.load(f)
    deck_by_audio = {c["audio"]: c for c in deck if c.get("audio")}

    # Filter out orphan files (in list but not in deck)
    work = [(i, f) for i, f in enumerate(file_list) if f in deck_by_audio]
    orphans = len(file_list) - len(work)
    print(f"Total work: {len(work)} files ({orphans} orphans skipped) — voice {VOICE}")
    print(f"Concurrency: {CONCURRENCY}")

    # Resume from checkpoint
    resume_from = 0
    if "--resume" in sys.argv and os.path.exists(PROGRESS_PATH):
        with open(PROGRESS_PATH) as f:
            prev = json.load(f)
        resume_from = prev.get("processed", 0)
        print(f"Resuming from index {resume_from}")
        work = work[resume_from:]

    counters = {
        "total": len(work),
        "processed": 0,
        "done": 0,
        "failed": 0,
        "skip": 0,
        "failures": [],
    }

    queue = asyncio.Queue()
    for item in work:
        await queue.put(item)
    for _ in range(CONCURRENCY):
        await queue.put(None)

    workers = [asyncio.create_task(worker(f"w{i}", queue, deck_by_audio, counters)) for i in range(CONCURRENCY)]
    start = time.time()
    await queue.join()
    for w in workers:
        await w
    elapsed = time.time() - start

    save_progress(counters)
    print(f"\n✅ Done in {elapsed:.0f}s.  done={counters['done']}  failed={counters['failed']}  skip={counters['skip']}")


if __name__ == "__main__":
    asyncio.run(main())
