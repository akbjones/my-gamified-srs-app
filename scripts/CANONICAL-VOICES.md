# Canonical TTS voices

Every language uses **one** voice. Mixing voices (or voice gender) inside a
language is what created the user-reported "alternating male/female" Welsh
bug. Pick from this table when adding audio for a new card; do not reach for
a different script or voice.

| Language    | Voice                              | Provider | Script                                |
|-------------|------------------------------------|----------|---------------------------------------|
| Spanish     | `es-US-Neural2-A`                  | Google   | `generate-audio.cjs --lang=es`        |
| Italian     | `it-IT-Neural2-A`                  | Google   | `generate-audio.cjs --lang=it`        |
| French      | `fr-FR-Neural2-F`                  | Google   | `generate-audio.cjs --lang=fr`        |
| Portuguese  | `pt-BR-Neural2-A`                  | Google   | `generate-audio.cjs --lang=pt`        |
| German      | `de-DE-Neural2-G`                  | Google   | `generate-audio.cjs --lang=de`        |
| Dutch       | `nl-NL-Wavenet-F`                  | Google   | `generate-audio.cjs --lang=nl`        |
| Swedish     | `sv-SE-Wavenet-A`                  | Google   | `generate-audio.cjs --lang=sv`        |
| Turkish     | `tr-TR-Wavenet-A`                  | Google   | `generate-audio.cjs --lang=tr`        |
| Hindi       | `hi-IN-Neural2-A`                  | Google   | `generate-audio.cjs --lang=hi`        |
| Russian     | `ru-RU-Wavenet-A`                  | Google   | `generate-audio.cjs --lang=ru`        |
| **Welsh**   | `cy-GB-NiaNeural`                  | **Azure / Edge TTS** | `regen-welsh-inconsistent.py` |

All voices are **female and language-NATIVE**. Earlier we tried
`Chirp3-HD-Aoede` as a single cross-language voice for cosmetic
consistency, but Aoede is a **multilingual** voice that mispronounces
non-English languages — most catastrophically Hindi (Aoede could not
read Devanagari, producing ~half-length jumbled audio). The fix is
language-native Neural2/Wavenet voices, which sound correct in each
target language even though the voice name varies across languages.

## Why Welsh is different

Google Cloud TTS only offers Welsh as Standard-tier (low quality, audibly
robotic). Azure has `cy-GB-NiaNeural` which is Neural-tier. Free Edge TTS
uses the same Azure backend, so we use that — no API key needed.

Don't use `generate-welsh-audio.cjs` (espeak-ng — robotic, gender varies by
system). Don't use Google `cy-GB-Standard-A` (low quality). The right path
for Welsh is the Azure NiaNeural voice via Edge TTS.

## Auditing for consistency

Whenever new audio batches land, run the encoder-signature audit:

```bash
node -e "
const fs = require('fs'), path = require('path');
const dir = 'public/quest-audio';
const PREFIXES = {spanish:'es', italian:'it', french:'fr', portuguese:'pt',
  german:'de', dutch:'nl', swedish:'sv', welsh:'cy', turkish:'tr',
  hindi:'hi', russian:'ru'};
const all = fs.readdirSync(dir);
for (const [lang, prefix] of Object.entries(PREFIXES)) {
  const files = all.filter(f => f.startsWith(prefix + '-') && f.endsWith('.mp3'));
  const sigs = new Map();
  for (const f of files.slice(0, 500)) {
    const buf = fs.readFileSync(path.join(dir, f));
    if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) sigs.set(buf[2], (sigs.get(buf[2])||0)+1);
  }
  console.log(lang, [...sigs.entries()].map(([s,n])=>'0x'+s.toString(16)+'×'+n).join(' '));
}"
```

A healthy language has ONE encoder signature. Welsh is the only language
allowed to have two (Azure direct API + Edge TTS, same NiaNeural voice).
