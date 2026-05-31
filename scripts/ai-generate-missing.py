#!/usr/bin/env python3
"""
Generate proper dictionary entries for all missing words across all 11 languages.
Uses Claude Haiku (fast + cheap) with strict format enforcement.

Output: scripts/ai-missing-{lang}.json — list of {k, en, ipa, pos, lemma?} entries.
"""
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from anthropic import Anthropic

# Read API key from .env.local
api_key = None
try:
    with open('.env.local') as f:
        for line in f:
            if line.startswith('ANTHROPIC_API_KEY'):
                api_key = line.split('=', 1)[1].strip()
                break
except FileNotFoundError:
    pass
if not api_key:
    api_key = os.environ.get('ANTHROPIC_API_KEY')
if not api_key:
    print('ERROR: ANTHROPIC_API_KEY not found')
    sys.exit(1)

client = Anthropic(api_key=api_key)
MODEL = 'claude-haiku-4-5'

LANG_NAMES = {
    'es': 'Spanish', 'fr': 'French', 'it': 'Italian', 'pt': 'Portuguese',
    'de': 'German', 'nl': 'Dutch', 'sv': 'Swedish', 'cy': 'Welsh',
    'hi': 'Hindi', 'tr': 'Turkish', 'ru': 'Russian',
}

SYSTEM = """You generate dictionary entries for language learning. Strict rules:

1. ALL verbs must start with "to " (infinitive form). E.g. "to eat", "to be".
2. Multiple meanings separated by "; " (semicolon-space). NEVER use "/".
3. NO parenthetical case/gender markers like "(neuter)" or "(dative)".
4. Function words: just the meaning. "the", "to them", "in".
5. POS values: n (noun), v (verb), adj (adjective), adv (adverb), pron (pronoun),
   prep (preposition), conj (conjunction), det (determiner), interj (interjection),
   num (numeral), phrase (multi-word expression).
6. For hyphenated compounds, give the meaning of the whole phrase.
7. For pre-apostrophe forms (quest', dov', etc.), give the meaning of the full word.

Return JSON ONLY, one entry per line:
{"k": "WORD", "en": "TRANSLATION", "ipa": "IPA", "pos": "POS", "lemma": "BASE_FORM_OR_NULL"}

Skip impossible words (numbers, foreign loanwords with no clear translation).
Use "" for IPA if uncertain. Use null (no quotes) for lemma if word IS the base form."""

def make_prompt(lang_name, words_with_context):
    lines = [f"Generate dictionary entries for these {lang_name} words missing from the dictionary."]
    lines.append("Each line shows the word and example sentences where it appears (for context):")
    lines.append("")
    for w in words_with_context:
        lines.append(f"  {w['word']}")
        for c in w.get('contexts', [])[:2]:
            lines.append(f"    \"{c['target']}\" → {c['english']}")
    lines.append("")
    lines.append("Return one JSON entry per line. No commentary.")
    return '\n'.join(lines)

def call_api(lang_code, words_with_context, max_retries=5):
    lang_name = LANG_NAMES[lang_code]
    prompt = make_prompt(lang_name, words_with_context)
    for attempt in range(max_retries):
        try:
            resp = client.messages.create(
                model=MODEL,
                max_tokens=8000,
                system=SYSTEM,
                messages=[{'role': 'user', 'content': prompt}],
            )
            text = resp.content[0].text
            entries = []
            for line in text.split('\n'):
                line = line.strip()
                if not line.startswith('{'): continue
                try:
                    e = json.loads(line)
                    if 'k' in e and 'en' in e:
                        entries.append(e)
                except json.JSONDecodeError:
                    pass
            return entries
        except Exception as ex:
            if attempt == max_retries - 1:
                print(f'  {lang_code} batch error: {ex}')
                return []
            import time
            time.sleep(2 ** attempt)
    return []

def load_contexts(lang_code, words):
    """For each missing word, find example cards where it appears."""
    deck_dirs = {
        'es': 'spanish', 'fr': 'french', 'it': 'italian', 'pt': 'portuguese',
        'de': 'german', 'nl': 'dutch', 'sv': 'swedish', 'cy': 'welsh',
        'hi': 'hindi', 'tr': 'turkish', 'ru': 'russian',
    }
    deck_path = f'src/data/{deck_dirs[lang_code]}/deck.json'
    with open(deck_path) as f:
        deck = json.load(f)
    result = []
    for w in words:
        contexts = []
        word_lower = w['word'].lower()
        for card in deck:
            if word_lower in card.get('target', '').lower():
                contexts.append({'target': card['target'], 'english': card.get('english', '')})
                if len(contexts) >= 3: break
        result.append({'word': w['word'], 'count': w['count'], 'contexts': contexts})
    return result

def is_skippable(word):
    """Skip pure numbers and very short tokens."""
    if re.match(r'^\d+$', word): return True
    if len(word) < 2: return True
    return False

def main():
    with open('scripts/missing-words-real.json') as f:
        missing = json.load(f)

    BATCH_SIZE = 20
    grand_total = 0

    for lang_code, words in missing.items():
        # Filter out numbers and skippable
        words = [w for w in words if not is_skippable(w['word'])]
        if not words:
            print(f'{lang_code}: no real missing words, skipping')
            continue

        print(f'\n{lang_code} ({LANG_NAMES[lang_code]}): {len(words)} words to generate')

        # Load contexts for each word
        words_with_ctx = load_contexts(lang_code, words)

        # Batch
        all_entries = []
        batches = [words_with_ctx[i:i+BATCH_SIZE] for i in range(0, len(words_with_ctx), BATCH_SIZE)]

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {executor.submit(call_api, lang_code, batch): i for i, batch in enumerate(batches)}
            for future in as_completed(futures):
                entries = future.result()
                all_entries.extend(entries)
                print(f'  batch {futures[future]+1}/{len(batches)}: {len(entries)} entries')

        out_path = f'scripts/ai-missing-{lang_code}.json'
        with open(out_path, 'w') as f:
            json.dump(all_entries, f, ensure_ascii=False, indent=2)
        print(f'  Saved: {out_path} ({len(all_entries)} entries)')
        grand_total += len(all_entries)

    print(f'\nGrand total: {grand_total} entries generated')

if __name__ == '__main__':
    main()
