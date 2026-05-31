#!/usr/bin/env python3
"""Fill empty audio for cards using Edge TTS (Google billing not available)."""
import asyncio, json, os
import edge_tts

VOICES = {
    'es': 'es-US-PalomaNeural', 'fr': 'fr-FR-DeniseNeural',
    'it': 'it-IT-ElsaNeural', 'pt': 'pt-BR-FranciscaNeural',
    'de': 'de-DE-KatjaNeural', 'nl': 'nl-NL-ColetteNeural',
    'sv': 'sv-SE-SofieNeural', 'cy': 'cy-GB-NiaNeural',
    'hi': 'hi-IN-SwaraNeural', 'tr': 'tr-TR-EmelNeural',
    'ru': 'ru-RU-SvetlanaNeural',
}
DECK_DIRS = {
    'es': 'spanish', 'fr': 'french', 'it': 'italian', 'pt': 'portuguese',
    'de': 'german', 'nl': 'dutch', 'sv': 'swedish', 'cy': 'welsh',
    'hi': 'hindi', 'tr': 'turkish', 'ru': 'russian',
}
AUDIO_DIR = 'public/quest-audio'
os.makedirs(AUDIO_DIR, exist_ok=True)

async def gen(text, voice, path):
    c = edge_tts.Communicate(text, voice, rate='-15%')
    await c.save(path)

async def main():
    total = 0
    for lang, dir in DECK_DIRS.items():
        deck_path = f'src/data/{dir}/deck.json'
        with open(deck_path) as f:
            deck = json.load(f)
        no_audio = [c for c in deck if not c.get('audio', '').strip()]
        if not no_audio: continue
        print(f'{lang}: {len(no_audio)} cards need audio')
        for card in no_audio:
            filename = f"{lang}-fill-{card['id']}.mp3"
            filepath = os.path.join(AUDIO_DIR, filename)
            if os.path.exists(filepath):
                card['audio'] = filename
                total += 1
                continue
            try:
                await gen(card['target'], VOICES[lang], filepath)
                card['audio'] = filename
                total += 1
                print(f"  Generated: {filename}")
            except Exception as e:
                print(f"  ERROR {filename}: {e}")
        with open(deck_path, 'w', encoding='utf-8') as f:
            json.dump(deck, f, ensure_ascii=False, indent=2)
            f.write('\n')
    print(f'\nTOTAL: {total}')

asyncio.run(main())
