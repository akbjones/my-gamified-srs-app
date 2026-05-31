#!/usr/bin/env python3
"""
Fix dictionary formatting inconsistencies across all 11 language files:
1. Standardize `en` field separators to ", " (commas)
2. Strip leading/trailing slashes from `ipa` values
"""

import re
import os

BASE = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'dictionary')
LANGUAGES = ['es', 'it', 'fr', 'pt', 'de', 'nl', 'sv', 'cy', 'hi', 'tr', 'ru']


def fix_en_value(val: str) -> str:
    """Fix separators inside an en field value string (without quotes)."""
    # We need to handle:
    # " / " -> ", "
    # "/" -> ", " (but not inside parentheses like "(le/la)")
    # "; " -> ", "
    # For verbs: "to be/become" -> "to be, to become" (repeat "to")

    # First: replace "; " with ", "
    val = val.replace('; ', ', ')

    # Now handle slashes. We need to be careful with parenthetical content.
    # Strategy: split on parts outside parens, fix slashes, rejoin.

    # Process " / " (slash with spaces) - straightforward replacement
    # But need to handle "to X / Y" -> "to X, to Y"
    # And "to X/Y" -> "to X, to Y"

    # Let's work with a regex approach that avoids parens content
    # First handle " / " (with spaces)
    # Then handle "/" (without spaces) but not inside parens

    result = _fix_slashes(val)
    return result


def _fix_slashes(val: str) -> str:
    """Replace slashes with commas, handling 'to' verb prefixes and parenthetical content."""
    # Find parenthetical regions to protect them
    # We'll process the string in segments: outside parens vs inside parens
    segments = []
    depth = 0
    current = []
    for ch in val:
        if ch == '(':
            if depth == 0 and current:
                segments.append(('text', ''.join(current)))
                current = []
            depth += 1
            current.append(ch)
        elif ch == ')':
            depth -= 1
            current.append(ch)
            if depth == 0:
                segments.append(('paren', ''.join(current)))
                current = []
        else:
            current.append(ch)
    if current:
        segments.append(('text', ''.join(current)))

    # Now fix slashes only in 'text' segments
    fixed_segments = []
    for kind, text in segments:
        if kind == 'paren':
            fixed_segments.append(text)
        else:
            fixed_segments.append(_replace_slashes_in_text(text))

    return ''.join(fixed_segments)


def _replace_slashes_in_text(text: str) -> str:
    """Replace / and ' / ' with ', ' in a text segment, handling 'to X/Y' patterns."""

    # Handle " / " first (slash with spaces around it)
    # Check for "to WORD / WORD" pattern -> "to WORD, to WORD"
    # More generally: if the segment starts with "to " before a slash, repeat "to"

    # Strategy: split on " / " or "/" and rejoin with ", "
    # But if the first part starts with "to ", prefix subsequent parts with "to " too

    # First normalize: replace " / " with "/"
    text = text.replace(' / ', '/')

    if '/' not in text:
        return text

    parts = text.split('/')
    if len(parts) <= 1:
        return text

    # Check if we need to repeat a prefix like "to "
    first = parts[0].strip()

    # Detect "to " prefix
    prefix = ''
    if first.startswith('to '):
        prefix = 'to '

    result_parts = [parts[0].rstrip()]
    for p in parts[1:]:
        p = p.strip()
        if prefix and not p.startswith(prefix):
            result_parts.append(prefix + p)
        else:
            result_parts.append(p)

    return ', '.join(result_parts)


def fix_ipa_value(val: str) -> str:
    """Strip outer /.../ from IPA value."""
    if val.startswith('/') and val.endswith('/') and len(val) > 2:
        return val[1:-1]
    return val


def process_file(lang: str) -> dict:
    filepath = os.path.join(BASE, f'{lang}.ts')
    if not os.path.exists(filepath):
        return {'en_changes': 0, 'ipa_changes': 0, 'error': 'file not found'}

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    en_changes = 0
    ipa_changes = 0
    new_lines = []

    for line in lines:
        new_line = line

        # Fix en: field values
        # Match: en: 'some value' or en: "some value"
        en_match = re.search(r"(en:\s*')([^']*?)(')", new_line)
        if en_match:
            prefix, val, suffix = en_match.group(1), en_match.group(2), en_match.group(3)
            new_val = fix_en_value(val)
            if new_val != val:
                new_line = new_line[:en_match.start()] + prefix + new_val + suffix + new_line[en_match.end():]
                en_changes += 1

        # Fix ipa: field values
        ipa_match = re.search(r"(ipa:\s*')([^']*?)(')", new_line)
        if ipa_match:
            prefix, val, suffix = ipa_match.group(1), ipa_match.group(2), ipa_match.group(3)
            new_val = fix_ipa_value(val)
            if new_val != val:
                new_line = new_line[:ipa_match.start()] + prefix + new_val + suffix + new_line[ipa_match.end():]
                ipa_changes += 1

        new_lines.append(new_line)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    return {'en_changes': en_changes, 'ipa_changes': ipa_changes}


def main():
    total_en = 0
    total_ipa = 0
    print(f"{'Lang':<6} {'en fixes':>10} {'ipa fixes':>10}")
    print('-' * 30)
    for lang in LANGUAGES:
        result = process_file(lang)
        en_c = result['en_changes']
        ipa_c = result['ipa_changes']
        total_en += en_c
        total_ipa += ipa_c
        print(f"{lang:<6} {en_c:>10} {ipa_c:>10}")
    print('-' * 30)
    print(f"{'TOTAL':<6} {total_en:>10} {total_ipa:>10}")


if __name__ == '__main__':
    main()
