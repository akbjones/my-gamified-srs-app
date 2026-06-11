# Welsh audio: deprecated scripts (DO NOT USE)

These 8 scripts collectively caused the "Welsh alternating male/female voice"
bug because they used **different voices** for different cohorts of the
Welsh deck. See `../../CANONICAL-VOICES.md` for the canonical pipeline.

**For all Welsh audio work, use `scripts/regen-welsh-inconsistent.py`** —
that's the only Welsh script that should be touched going forward. It uses
Edge TTS with `cy-GB-NiaNeural`, the same voice as the canonical bulk.

## What each archived script did, and why it's deprecated

| Script | What it did | Why archived |
|--------|-------------|--------------|
| `generate-welsh-audio.cjs` | Used **espeak-ng + LAME** — synthetic robot voice, gender varied by system | This was the smoking gun for the alternating-voice bug |
| `generate-welsh-audio.py` | Python equivalent of above | Same espeak issue |
| `generate-welsh-audio-azure.cjs` | Azure direct API with `cy-GB-NiaNeural` | Replaced by Edge TTS version; Azure key is expired |
| `upgrade-welsh-fills-azure.cjs` | Re-generated 11 "fill" cards via Azure | Subsumed by regen-welsh-inconsistent.py |
| `upgrade-welsh-fills-edge.py` | Re-generated 11 fill cards via Edge TTS | Same — generalized into regen-welsh-inconsistent.py |
| `fix-welsh-audio.cjs` | Ad-hoc fix script (unknown intent, file was small) | Superseded |
| `fix-welsh-node25.py` | Tried to fix corrupt cy-25 specifically | Superseded |
| `check-welsh-audio.cjs` | Old audit | Replaced by the encoder-signature audit in CANONICAL-VOICES.md |

## If you need to regenerate Welsh audio

```bash
# Run the encoder-signature audit (see CANONICAL-VOICES.md) to find files
# whose encoder signature differs from the canonical 0x80 (Azure direct API)
# or 0x64 (Edge TTS NiaNeural — both same voice, different bitrate).

# Write the list of files to regenerate to /tmp/welsh-regen-list.txt,
# then:
python3 scripts/regen-welsh-inconsistent.py
```

The script is idempotent — re-running it will skip files already done.
