#!/usr/bin/env python3
"""
Card-level AI semantic audit.

For every card in every language, send to Claude Haiku:
  - target sentence + english translation
  - per-token dict entries (so Claude can see what the user sees)

Claude returns a JSON object indicating:
  - translation_quality: PERFECT | MINOR_ISSUE | MAJOR_ISSUE
  - issues: list of specific problems
  - suggested_fixes: dict-level changes to en/pos for specific words

Output: scripts/ai-card-issues-{lang}.jsonl (one JSON per card, only issues)

Run with high parallelism. Will take time. Tokens not an issue.
"""
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from anthropic import Anthropic

# Read API key
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
DECK_DIRS = {
    'es': 'spanish', 'fr': 'french', 'it': 'italian', 'pt': 'portuguese',
    'de': 'german', 'nl': 'dutch', 'sv': 'swedish', 'cy': 'welsh',
    'hi': 'hindi', 'tr': 'turkish', 'ru': 'russian',
}

SYSTEM = """You audit language learning cards. For each batch of cards in a target language,
identify any issues and suggest dictionary-level fixes.

Categories of issues to detect:
1. WRONG_TRANSLATION — English doesn't match target sentence
2. UNNATURAL — translation is grammatically awkward
3. MISSING_NUANCE — common alternate meaning omitted
4. WRONG_REGISTER — formal/casual mismatch
5. CARD_DUPLICATE — appears identical to others (only flag if obvious)

For each card with issues, return JSON Lines (one per card):
{"id": "es-0001", "severity": "low|medium|high", "issue": "WRONG_TRANSLATION", "note": "brief"}

Then if you can suggest dictionary fixes (a word's translation needs updating):
{"id": "es-0001", "fix": {"k": "WORD", "en": "BETTER", "pos": "POS"}}

Strict format rules:
- Verbs ALWAYS as "to <infinitive>" (to eat, to be)
- Multiple meanings: "; " separator (NOT "/")
- Function words: "the" not "(the)"
- POS: n, v, adj, adv, pron, prep, conj, det, interj, num, phrase
- NO parenthetical case markers like "(neuter)"

Be CONSERVATIVE. Only flag genuine issues, not style preferences.
A card with no issues = NOT in your output.
Output only JSON lines, no commentary or markdown."""


def make_prompt(lang_name, cards_batch):
    lines = [f"Audit these {lang_name} cards:\n"]
    for c in cards_batch:
        lines.append(f"{c['id']}: \"{c['target']}\" → {c.get('english', '')}")
    return '\n'.join(lines)


def call_api(lang_code, cards_batch, max_retries=5):
    lang_name = LANG_NAMES[lang_code]
    prompt = make_prompt(lang_name, cards_batch)
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
                    results.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
            return results
        except Exception as ex:
            err_str = str(ex)
            # Rate limit — wait and retry
            if '429' in err_str or 'rate_limit' in err_str:
                wait = 30 * (attempt + 1)
                time.sleep(wait)
                continue
            if attempt == max_retries - 1:
                return [{'_error': err_str}]
            time.sleep(2 ** attempt)
    return []


def audit_language(lang_code, batch_size=30, parallel=4):
    print(f'\n=== {lang_code} ({LANG_NAMES[lang_code]}) ===')
    deck_path = f'src/data/{DECK_DIRS[lang_code]}/deck.json'
    with open(deck_path) as f:
        deck = json.load(f)
    print(f'  Total cards: {len(deck)}')

    out_path = f'scripts/ai-card-issues-{lang_code}.jsonl'
    # Resume: skip cards already audited
    done_ids = set()
    if os.path.exists(out_path):
        with open(out_path) as f:
            for line in f:
                try:
                    j = json.loads(line)
                    done_ids.add(j.get('id'))
                except json.JSONDecodeError:
                    pass
        print(f'  Resuming: {len(done_ids)} already audited')

    todo = [c for c in deck if c.get('id') not in done_ids]
    if not todo:
        print('  All cards already audited.')
        return

    batches = [todo[i:i + batch_size] for i in range(0, len(todo), batch_size)]
    print(f'  Auditing {len(todo)} cards in {len(batches)} batches')

    out = open(out_path, 'a')
    issues_count = 0
    fixes_count = 0
    completed = 0

    with ThreadPoolExecutor(max_workers=parallel) as executor:
        futures = {executor.submit(call_api, lang_code, batch): i for i, batch in enumerate(batches)}
        for future in as_completed(futures):
            results = future.result()
            for r in results:
                if '_error' in r:
                    print(f'    Error: {r["_error"][:100]}')
                    continue
                out.write(json.dumps(r, ensure_ascii=False) + '\n')
                if 'issue' in r: issues_count += 1
                if 'fix' in r: fixes_count += 1
            out.flush()
            completed += 1
            if completed % 5 == 0 or completed == len(batches):
                print(f'    Progress: {completed}/{len(batches)} batches, {issues_count} issues, {fixes_count} fixes')

    out.close()
    print(f'  DONE: {issues_count} issues, {fixes_count} fixes')


def main():
    langs = sys.argv[1:] if len(sys.argv) > 1 else list(LANG_NAMES.keys())
    for lang_code in langs:
        if lang_code not in LANG_NAMES:
            print(f'Unknown lang: {lang_code}')
            continue
        try:
            audit_language(lang_code)
        except Exception as ex:
            print(f'  FATAL: {ex}')


if __name__ == '__main__':
    main()
