#!/usr/bin/env python3
"""
DICT-CENTRIC polysemy completeness audit.

For each high-frequency dict entry (≥3 cards) where pos ∈ {n, v, adj, adv},
ask Claude Haiku: "Are there other COMMON everyday meanings missing from
this entry that native speakers regularly use?"

Specifically targets cases like:
- IT conto = currently 'to count' but is overwhelmingly 'bill/account' as noun
- FR addition = currently 'addition' but is 'bill (restaurant)' in common use
- NL rekening = currently 'account' but is 'bill/check' in restaurant context
- DE Rechnung = 'invoice' but is 'bill/check' in everyday speech

Output: scripts/ai-polysemy-{lang}.json — list of {k, en, pos} with COMPLETE
multi-meaning translations.
"""
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from anthropic import Anthropic

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

SYSTEM = """You audit dictionary entries for COMPLETENESS of common everyday meanings.

A word like Italian 'conto' has these common meanings:
- 'bill (restaurant/check)'  ← daily use
- 'account (bank)'            ← daily use
- 'count'                     ← occasional
- 'I count' (verb form)       ← rare, only in formal speech

If the dict only lists 'to count', it's INCOMPLETE — users tapping 'conto' at
a restaurant will see 'to count' which is wrong for that context.

Your job: for each dict entry, decide if common everyday meanings are missing.

Return JSON ONLY (one entry per line) for entries that NEED EXTENSION:
{"k": "WORD", "en": "MEANING1; MEANING2; ...", "pos": "POS"}

Strict format rules:
- Verbs: ALL meanings must start with "to ". E.g. "to take; to grab"
- Multiple meanings: separator is "; " (semicolon-space). NEVER "/"
- List meanings in DESCENDING ORDER OF FREQUENCY (most common first)
- For nouns/adjectives: just the noun/adj, no "to "
- POS: change pos to match the MOST COMMON meaning. If 'conto' is overwhelmingly
  a noun (bill/account) but currently tagged 'v' (verb), change pos to 'n' and put
  noun meanings first
- Don't include rare/archaic/technical meanings — only what regular speakers use daily
- Keep existing meanings if they're accurate
- For function words (det, prep, conj, pron) usually skip — they rarely have polysemy

ONLY return entries that genuinely need extension. Skip entries that are already
complete or where current entry is fine. NO commentary."""


def make_prompt(lang_name, entries):
    lines = [f"Audit these {lang_name} dictionary entries. For each, decide if common everyday meanings are missing. Return JSON for entries needing extension only.\n"]
    for e in entries:
        lemma_str = f" (lemma={e['lemma']})" if e.get('lemma') else ''
        lines.append(f"  {e['key']}: {e['en']} [pos={e['pos']}]{lemma_str} — appears in {e['freq']} cards")
    return '\n'.join(lines)


def call_api(lang_code, entries, max_retries=5):
    lang_name = LANG_NAMES[lang_code]
    prompt = make_prompt(lang_name, entries)
    for attempt in range(max_retries):
        try:
            resp = client.messages.create(
                model=MODEL,
                max_tokens=8000,
                system=SYSTEM,
                messages=[{'role': 'user', 'content': prompt}],
            )
            text = resp.content[0].text
            results = []
            for line in text.split('\n'):
                line = line.strip()
                if not line.startswith('{'): continue
                try:
                    j = json.loads(line)
                    if 'k' in j and 'en' in j:
                        results.append(j)
                except json.JSONDecodeError:
                    pass
            return results
        except Exception as ex:
            if '429' in str(ex):
                time.sleep(30 * (attempt + 1))
                continue
            if attempt == max_retries - 1: return []
            time.sleep(2 ** attempt)
    return []


def audit_language(lang_code, min_freq=None, max_entries=None, batch_size=40, parallel=4):
    if min_freq is None:
        min_freq = int(os.environ.get('MIN_FREQ', '3'))
    if max_entries is None:
        max_entries = int(os.environ.get('MAX_ENTRIES', '2000'))
    print(f'\n=== {lang_code} ({LANG_NAMES[lang_code]}) ===')
    freq_path = f'scripts/frequency-{lang_code}.json'
    if not os.path.exists(freq_path):
        print(f'  no frequency file: {freq_path}')
        return

    entries = json.load(open(freq_path))
    # Filter: only n/v/adj/adv, freq >= min_freq, and limit to top max_entries
    eligible = [e for e in entries
                if e.get('pos') in ('n', 'v', 'adj', 'adv', 'phrase')
                and e.get('freq', 0) >= min_freq][:max_entries]
    print(f'  {len(eligible)} eligible entries (freq≥{min_freq}, n/v/adj/adv/phrase)')
    if not eligible: return

    out_path = f'scripts/ai-polysemy-{lang_code}.json'
    # Resume support: skip entries already audited
    seen = set()
    if os.path.exists(out_path):
        try:
            existing = json.load(open(out_path))
            for e in existing:
                seen.add(e.get('k'))
            print(f'  Resuming: {len(seen)} entries previously audited')
        except: pass

    todo = [e for e in eligible if e['key'] not in seen]
    if not todo:
        print('  all eligible already audited')
        return

    batches = [todo[i:i+batch_size] for i in range(0, len(todo), batch_size)]
    print(f'  Auditing {len(todo)} entries in {len(batches)} batches')

    fixes = []
    if seen:
        try:
            fixes = json.load(open(out_path))
        except: fixes = []

    completed = 0
    with ThreadPoolExecutor(max_workers=parallel) as executor:
        futures = {executor.submit(call_api, lang_code, b): i for i, b in enumerate(batches)}
        for future in as_completed(futures):
            r = future.result()
            fixes.extend(r)
            completed += 1
            if completed % 5 == 0 or completed == len(batches):
                with open(out_path, 'w', encoding='utf-8') as f:
                    json.dump(fixes, f, ensure_ascii=False, indent=2)
                print(f'    Progress: {completed}/{len(batches)} batches, {len(fixes)} fixes so far')

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(fixes, f, ensure_ascii=False, indent=2)
    print(f'  DONE: {len(fixes)} entries flagged for extension')


def main():
    langs = sys.argv[1:] if len(sys.argv) > 1 else list(LANG_NAMES.keys())
    for lang in langs:
        if lang not in LANG_NAMES:
            print(f'Unknown: {lang}')
            continue
        try: audit_language(lang)
        except Exception as ex: print(f'  ERROR: {ex}')


if __name__ == '__main__':
    main()
