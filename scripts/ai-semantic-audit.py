#!/usr/bin/env python3
"""
AI-powered semantic audit of dictionary translations.

For each language, sends batches of dictionary entries to Claude
asking for translation accuracy review. Outputs corrections.
"""

import json
import os
import sys
import re
from pathlib import Path
import anthropic
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List

# Load API key
def load_env():
    env_file = Path('.env.local')
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip()

load_env()
client = anthropic.Anthropic()

LANGUAGES = {
    'es': {'name': 'Spanish', 'file': 'src/data/dictionary/es.ts', 'var': 'dictionary'},
    'fr': {'name': 'French', 'file': 'src/data/dictionary/fr.ts', 'var': 'dictionary'},
    'it': {'name': 'Italian', 'file': 'src/data/dictionary/it.ts', 'var': 'dictionary'},
    'pt': {'name': 'Portuguese', 'file': 'src/data/dictionary/pt.ts', 'var': 'dictionary'},
    'de': {'name': 'German', 'file': 'src/data/dictionary/de.ts', 'var': 'DICT'},
    'nl': {'name': 'Dutch', 'file': 'src/data/dictionary/nl.ts', 'var': 'dictionary'},
    'sv': {'name': 'Swedish', 'file': 'src/data/dictionary/sv.ts', 'var': 'dictionary'},
    'cy': {'name': 'Welsh', 'file': 'src/data/dictionary/cy.ts', 'var': 'dict'},
    'hi': {'name': 'Hindi', 'file': 'src/data/dictionary/hi.ts', 'var': 'dictionary'},
    'tr': {'name': 'Turkish', 'file': 'src/data/dictionary/tr.ts', 'var': 'dictionary'},
    'ru': {'name': 'Russian', 'file': 'src/data/dictionary/ru.ts', 'var': 'dictionary'},
}

def parse_dict(file_path: str, var_name: str) -> Dict[str, dict]:
    """Parse a TS dictionary file into a Python dict."""
    content = Path(file_path).read_text(encoding='utf-8')

    # Find dict declaration
    pattern = rf'(?:export\s+)?const\s+{var_name}\s*(?::\s*Record<[^>]+>\s*)?=\s*\{{'
    match = re.search(pattern, content)
    if not match:
        raise ValueError(f"Can't find dict in {file_path}")

    decl_end = match.end()
    depth = 1
    i = decl_end
    while i < len(content) and depth > 0:
        ch = content[i]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
        elif ch in '"\'':
            quote = ch
            i += 1
            while i < len(content):
                if content[i] == '\\':
                    i += 2
                    continue
                if content[i] == quote:
                    break
                i += 1
        i += 1

    body = content[decl_end:i-1]

    # Use Node.js to safely parse via JS
    import subprocess
    result = subprocess.run(
        ['node', '-e', f'console.log(JSON.stringify({{{body}}}))'],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise ValueError(f"Parse error: {result.stderr[:200]}")
    return json.loads(result.stdout)


def review_batch(lang_code: str, lang_name: str, entries: List[tuple], model: str) -> List[dict]:
    """Send a batch of entries to Claude for review.

    Returns a list of {key, issue, suggested_en, suggested_pos} for entries with issues.
    """
    # Format entries for the prompt
    entry_list = []
    for key, entry in entries:
        en = entry.get('en', '')
        pos = entry.get('pos', '')
        lemma = entry.get('lemma', '')
        line = f'  {key} ({pos})'
        if lemma:
            line += f' [lemma: {lemma}]'
        line += f': "{en}"'
        entry_list.append(line)

    entry_text = '\n'.join(entry_list)

    system = f"""You are a {lang_name} language expert reviewing a learner's dictionary for translation quality.

For each entry, you'll see: word (POS) [lemma if applicable]: "current English translation"

Identify ANY of these issues:
1. WRONG: Translation is incorrect/inaccurate
2. POLYSEMY: Word has 2+ common meanings; translation only shows one. Show common meanings semicolon-separated.
3. NO_TO: It's a verb but English doesn't have "to" prefix
4. UNTRANSLATED: English is just the romanized form (e.g. "amit" for अमित – should be "Amit; boundless")
5. CAPITALIZED: Adjective/adverb/verb that's wrongly capitalized
6. WRONG_POS: POS tag is wrong

For each problematic entry, output a JSON line in this exact format (one per line, JSONL):
{{"k": "word", "p": "WRONG|POLYSEMY|NO_TO|UNTRANSLATED|CAPITALIZED|WRONG_POS", "en": "corrected translation", "pos": "v|n|adj|adv|pron|det|prep|postp|conj|num|part|intj"}}

Rules:
- ALL verbs must start with "to " (e.g. "to eat")
- For polysemy use semicolons: "ask; question"
- For ambiguous words show all common meanings
- For names that have meanings: "Name; meaning"
- Only output JSON for entries with issues. Skip correct ones.
- Output JSONL only. No prose."""

    user = f"Review these {lang_name} dictionary entries:\n\n{entry_text}"

    try:
        response = client.messages.create(
            model=model,
            max_tokens=8000,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        text = next((b.text for b in response.content if b.type == "text"), "")

        # Parse JSONL output
        fixes = []
        for line in text.strip().split('\n'):
            line = line.strip()
            if not line or not line.startswith('{'):
                continue
            try:
                fix = json.loads(line)
                if 'k' in fix and 'en' in fix:
                    fixes.append(fix)
            except json.JSONDecodeError:
                continue
        return fixes
    except Exception as e:
        print(f"  Batch error: {e}")
        return []


def audit_language(lang_code: str, batch_size: int = 50, max_entries: int = None, model: str = "claude-haiku-4-5"):
    """Audit a single language."""
    config = LANGUAGES[lang_code]
    print(f"\n=== Auditing {config['name']} ({lang_code}) ===")

    # Load dict
    try:
        d = parse_dict(config['file'], config['var'])
    except Exception as e:
        print(f"  ERROR loading dict: {e}")
        return {}

    # Get entries to review (skip ones with empty en, very short, or already polysemic)
    entries = []
    for key, entry in d.items():
        en = entry.get('en', '')
        if not en or len(en) < 1:
            continue
        # Skip metadata-looking entries
        if key in ('past', 'present', 'future', 'imperative', 'auxiliary'):
            continue
        entries.append((key, entry))

    if max_entries:
        entries = entries[:max_entries]

    print(f"  Entries to review: {len(entries)}")

    # Process in batches with parallelism
    batches = [entries[i:i+batch_size] for i in range(0, len(entries), batch_size)]
    print(f"  Batches: {len(batches)}")

    all_fixes = []
    completed = 0

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(review_batch, lang_code, config['name'], batch, model): i
            for i, batch in enumerate(batches)
        }
        for future in as_completed(futures):
            batch_idx = futures[future]
            fixes = future.result()
            all_fixes.extend(fixes)
            completed += 1
            if completed % 5 == 0 or completed == len(batches):
                print(f"  Progress: {completed}/{len(batches)} batches, {len(all_fixes)} fixes so far")

    # Save per-language fixes
    output_path = f'scripts/ai-fixes-{lang_code}.json'
    Path(output_path).write_text(json.dumps(all_fixes, ensure_ascii=False, indent=2))
    print(f"  Saved: {output_path} ({len(all_fixes)} fixes)")

    # Show samples
    if all_fixes:
        print(f"\n  Sample fixes:")
        for fix in all_fixes[:10]:
            print(f"    {fix.get('k', '?')}: {fix.get('p', '?')} -> {fix.get('en', '?')}")

    return all_fixes


def main():
    args = sys.argv[1:]
    target_lang = args[0] if args else 'all'
    max_entries = int(args[1]) if len(args) > 1 else None
    model = args[2] if len(args) > 2 else "claude-haiku-4-5"

    print(f"Model: {model}")
    if max_entries:
        print(f"Max entries per language: {max_entries}")

    if target_lang == 'all':
        for code in LANGUAGES:
            audit_language(code, batch_size=50, max_entries=max_entries, model=model)
    else:
        audit_language(target_lang, batch_size=50, max_entries=max_entries, model=model)


if __name__ == '__main__':
    main()
