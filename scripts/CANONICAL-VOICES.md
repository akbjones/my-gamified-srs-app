# Canonical TTS voices

Every language uses **one** voice. Mixing voices (or voice gender) inside a
language is what created the user-reported "alternating male/female" Welsh
bug. Pick from this table when adding audio for a new card; do not reach for
a different script or voice.

| Language    | Voice                              | Provider | Script                                |
|-------------|------------------------------------|----------|---------------------------------------|
| Spanish     | `es-US-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=es --voice=es-US-Chirp3-HD-Aoede` |
| Italian     | `it-IT-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=it --voice=it-IT-Chirp3-HD-Aoede` |
| French      | `fr-FR-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=fr --voice=fr-FR-Chirp3-HD-Aoede` |
| Portuguese  | `pt-BR-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=pt --voice=pt-BR-Chirp3-HD-Aoede` |
| German      | `de-DE-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=de --voice=de-DE-Chirp3-HD-Aoede` |
| Dutch       | `nl-NL-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=nl --voice=nl-NL-Chirp3-HD-Aoede` |
| Swedish     | `sv-SE-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=sv --voice=sv-SE-Chirp3-HD-Aoede` |
| Turkish     | `tr-TR-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=tr --voice=tr-TR-Chirp3-HD-Aoede` |
| Hindi       | `hi-IN-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=hi --voice=hi-IN-Chirp3-HD-Aoede` |
| Russian     | `ru-RU-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=ru --voice=ru-RU-Chirp3-HD-Aoede` |
| **Welsh**   | `cy-GB-NiaNeural`                  | **Azure / Edge TTS** | `regen-welsh-inconsistent.py` |
| Indonesian  | `id-ID-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=id --voice=id-ID-Chirp3-HD-Aoede` (staged) |
| Greek       | `el-GR-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=el --voice=el-GR-Chirp3-HD-Aoede` (staged) |
| Korean      | `ko-KR-Chirp3-HD-Aoede`            | Google   | `generate-audio.cjs --lang=ko --voice=ko-KR-Chirp3-HD-Aoede` (staged) |

All voices are **female**. As of 2026-06-28 we migrated 10 non-Welsh
languages from Neural2/Wavenet to `Chirp3-HD-Aoede` for substantially
better naturalness. The earlier concern about Aoede producing "half-length"
audio on non-English languages turned out to be partially fixed in later
voice updates — production-quality audio is now generated across all 10
language codes with no length compression. We left Welsh on Azure NiaNeural
because Google has no Welsh Chirp voices.

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
