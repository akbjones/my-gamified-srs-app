#!/usr/bin/env python3
"""Generate audio for new survival cards using Microsoft Edge TTS (free, no API key)."""

import asyncio
import json
import os
import edge_tts

# Voice mapping per language
VOICES = {
    # Voices chosen to closely match the Google Cloud TTS originals
    # Original used Google "*-Standard-A" / "*-Wavenet-A" (mostly female)
    'es': 'es-US-PalomaNeural',     # Match es-US-Standard-A (US female)
    'fr': 'fr-FR-DeniseNeural',     # Match fr-FR-Standard-A (FR female)
    'it': 'it-IT-ElsaNeural',       # Match it-IT-Standard-A (IT female)
    'pt': 'pt-BR-FranciscaNeural',  # Match pt-BR-Wavenet-A (BR female)
    'de': 'de-DE-KatjaNeural',      # Match de-DE-Wavenet-A (DE female)
    'nl': 'nl-NL-ColetteNeural',    # Match nl-NL-Standard-A (NL female)
    'sv': 'sv-SE-SofieNeural',      # Match sv-SE-Wavenet-D (SE female)
    'cy': 'cy-GB-NiaNeural',        # Match cy-GB-Standard-A (CY female)
    'hi': 'hi-IN-SwaraNeural',      # Match hi-IN-Wavenet-A (IN female)
    'tr': 'tr-TR-EmelNeural',       # Match tr-TR-Wavenet-A (TR female)
    'ru': 'ru-RU-SvetlanaNeural',   # Match ru-RU-Wavenet-A (RU female)
}

DECK_PATHS = {
    'es': 'src/data/spanish/deck.json',
    'fr': 'src/data/french/deck.json',
    'it': 'src/data/italian/deck.json',
    'pt': 'src/data/portuguese/deck.json',
    'de': 'src/data/german/deck.json',
    'nl': 'src/data/dutch/deck.json',
    'sv': 'src/data/swedish/deck.json',
    'cy': 'src/data/welsh/deck.json',
    'hi': 'src/data/hindi/deck.json',
    'tr': 'src/data/turkish/deck.json',
    'ru': 'src/data/russian/deck.json',
}

AUDIO_DIR = 'public/quest-audio'


async def generate_audio(text, voice, output_path):
    """Generate audio for a single text at higher quality."""
    # Use slower rate for clearer beginner pronunciation, higher quality output
    communicate = edge_tts.Communicate(text, voice, rate='-15%', volume='+0%')
    await communicate.save(output_path)


async def process_language(lang):
    """Find cards with no audio and generate it."""
    deck_path = DECK_PATHS[lang]
    voice = VOICES[lang]

    with open(deck_path, 'r', encoding='utf-8') as f:
        deck = json.load(f)

    # Find cards with empty audio field
    no_audio = [c for c in deck if not c.get('audio', '').strip()]
    if not no_audio:
        print(f"  {lang.upper()}: all cards have audio")
        return 0

    print(f"  {lang.upper()}: {len(no_audio)} cards need audio, voice={voice}")

    generated = 0
    for card in no_audio:
        card_id = card['id']
        text = card['target']

        # Generate filename
        # Use the card ID for the filename
        num = card_id.replace(lang + '-', '').lstrip('0') or '0'
        filename = f"{lang}-surv-{num}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)

        if os.path.exists(filepath):
            # Audio already exists, just update the card
            card['audio'] = filename
            generated += 1
            continue

        try:
            await generate_audio(text, voice, filepath)
            card['audio'] = filename
            generated += 1
            print(f"    Generated: {filename} ({text[:40]})")
        except Exception as e:
            print(f"    ERROR: {filename}: {e}")

    # Save updated deck
    with open(deck_path, 'w', encoding='utf-8') as f:
        json.dump(deck, f, ensure_ascii=False, indent=2)
        f.write('\n')

    return generated


async def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)
    total = 0
    for lang in VOICES:
        count = await process_language(lang)
        total += count
    print(f"\nTotal: {total} audio files generated")


if __name__ == '__main__':
    asyncio.run(main())
