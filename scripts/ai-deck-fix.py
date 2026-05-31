#!/usr/bin/env python3
"""
For high-severity card-level issues (WRONG_TRANSLATION), ask Claude to
generate a corrected English translation. Update deck.json's english field.

Only applies when the issue clearly identifies a wrong translation
(severity=high, issue=WRONG_TRANSLATION).
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
    print('ERROR: no API key')
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

SYSTEM = """You correct English translations for language learning cards.
Given a target sentence, an existing English translation, and an issue note,
produce a single corrected translation.

Rules:
- Concise, natural English (not overly literal)
- Match register (formal/informal) of the target
- For idioms, prefer the equivalent English idiom
- No commentary, no parentheticals, no markup
- For each card, return JSON: {"id": "<id>", "english": "<corrected>"}
- One JSON per line. Skip if you cannot improve it (don't output blank entries)."""


def call_api(lang_code, items, max_retries=5):
    lang_name = LANG_NAMES[lang_code]
    lines = [f"Correct these {lang_name} card translations:\n"]
    for it in items:
        lines.append(f"{it['id']}: \"{it['target']}\"")
        lines.append(f"  current: {it['english']}")
        lines.append(f"  issue: {it['note']}")
    prompt = '\n'.join(lines)
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
                    if 'id' in j and 'english' in j:
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


def fix_language(lang_code, batch_size=20, parallel=4):
    print(f'\n=== {lang_code} ===')
    issues_path = f'scripts/ai-card-issues-{lang_code}.jsonl'
    deck_path = f'src/data/{DECK_DIRS[lang_code]}/deck.json'
    if not os.path.exists(issues_path):
        print('  no issues file')
        return
    with open(issues_path) as f:
        issues = [json.loads(l) for l in f if l.strip().startswith('{')]
    # Process high + medium severity, both WRONG_TRANSLATION and UNNATURAL
    target_severities = os.environ.get('SEVERITIES', 'high,medium').split(',')
    target_issues = os.environ.get('ISSUES', 'WRONG_TRANSLATION,UNNATURAL,MISSING_NUANCE').split(',')
    high_wrong = [i for i in issues if i.get('severity') in target_severities and i.get('issue') in target_issues]
    print(f'  {len(high_wrong)} {"+".join(target_severities)} {"+".join(target_issues)} issues')
    if not high_wrong: return

    with open(deck_path) as f:
        deck = json.load(f)
    by_id = {c['id']: c for c in deck}

    items = []
    for i in high_wrong:
        c = by_id.get(i['id'])
        if not c: continue
        items.append({'id': c['id'], 'target': c['target'], 'english': c.get('english', ''), 'note': i.get('note', '')})

    if not items: return

    batches = [items[i:i+batch_size] for i in range(0, len(items), batch_size)]
    print(f'  Sending {len(items)} items in {len(batches)} batches')

    all_fixes = []
    with ThreadPoolExecutor(max_workers=parallel) as executor:
        futures = {executor.submit(call_api, lang_code, b): i for i, b in enumerate(batches)}
        for future in as_completed(futures):
            r = future.result()
            all_fixes.extend(r)

    # Apply fixes to deck
    applied = 0
    for fix in all_fixes:
        c = by_id.get(fix['id'])
        if not c: continue
        if c.get('english') != fix['english']:
            c['english'] = fix['english']
            applied += 1
    print(f'  Applied {applied} translation corrections')

    with open(deck_path, 'w', encoding='utf-8') as f:
        json.dump(deck, f, ensure_ascii=False, indent=2)
        f.write('\n')


def main():
    langs = sys.argv[1:] if len(sys.argv) > 1 else list(LANG_NAMES.keys())
    for lang in langs:
        try: fix_language(lang)
        except Exception as ex: print(f'  ERROR: {ex}')


if __name__ == '__main__':
    main()
