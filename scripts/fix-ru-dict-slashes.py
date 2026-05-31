#!/usr/bin/env python3
"""
Fix Russian dictionary (ru.ts) entries where the 'en' field contains forward slashes.

Two categories:
1. Legitimate alternatives (verbs, adjectives, prepositions) — convert slash to comma or space.
2. Garbage "word/context" fragments — keep only the actual translation (first part).
"""

import re
import sys

INPUT = 'src/data/dictionary/ru.ts'
OUTPUT = INPUT  # overwrite in place

# ── Explicit corrections for known legitimate alternatives ──────────────
# These are real translations where both parts matter.
MANUAL_FIXES = {
    # Verbs with dual meanings — use comma separation
    "to do/make": "to do, to make",
    "to do/make (perf.)": "to do, to make (perf.)",
    "to speak/say": "to speak, to say",
    "to say/tell (perf.)": "to say, to tell (perf.)",
    "to go/walk (habitual)": "to go, to walk (habitual)",
    "to love/like": "to love, to like",
    "to look/watch": "to look, to watch",
    "to look/watch (perf.)": "to look, to watch (perf.)",
    "to teach/learn": "to teach, to learn",
    "to study/learn": "to study, to learn",
    "to search/look for": "to search, to look for",
    "to ask/request": "to ask, to request",
    "to ask/request (perf.)": "to ask, to request (perf.)",
    "to call/phone": "to call, to phone",
    "to call/phone (perf.)": "to call, to phone (perf.)",
    "to carry/wear": "to carry, to wear",
    "to come/arrive": "to come, to arrive",
    "to come/arrive (perf.)": "to come, to arrive (perf.)",
    "to decide/solve": "to decide, to solve",
    "to prepare/cook": "to prepare, to cook",
    "to prepare/cook (perf.)": "to prepare, to cook (perf.)",
    "to put/lay": "to put, to lay",
    "to put/lay (perf.)": "to put, to lay (perf.)",
    "to put/place": "to put, to place",
    "to put/place (perf.)": "to put, to place (perf.)",
    "to tell/narrate": "to tell, to narrate",
    "to tell/narrate (perf.)": "to tell, to narrate (perf.)",
    "to drive/lead (habitual)": "to drive, to lead (habitual)",
    "to be liked/pleasing": "to be liked, to be pleasing",
    "say/speak": "to say, to speak",

    # Compound phrases — use space
    "good/night": "good night",
    "good/morning": "good morning",
    "good/afternoon": "good afternoon",
    "good/luck": "good luck",
    "good/weather": "good weather",
    "excuse me/sorry": "excuse me, sorry",
    "forgive me/sorry": "forgive me, sorry",

    # Adjective/adverb/noun alternatives — comma
    "all/everyone": "all, everyone",
    "all/whole (f.)": "all, whole (f.)",
    "all/whole (m.)": "all, whole (m.)",
    "his/its": "his, its",
    "big/large": "big, large",
    "small/little": "small, little",
    "little/few": "little, few",
    "tall/high": "tall, high",
    "low/short": "low, short",
    "wide/broad": "wide, broad",
    "fast/quick": "fast, quick",
    "heavy/difficult": "heavy, difficult",
    "easy/light": "easy, light",
    "clean/pure": "clean, pure",
    "angry/evil": "angry, evil",
    "cheerful/merry": "cheerful, merry",
    "smart/clever": "smart, clever",
    "different/various": "different, various",
    "expensive/dear": "expensive, dear",
    "steep/cool": "steep, cool",
    "near/close": "near, close",
    "famous/known": "famous, known",
    "sick/patient": "sick, patient",
    "kind/good": "kind, good",
    "common/general": "common, general",
    "main/chief": "main, chief",
    "car/machine": "car, machine",
    "castle/lock": "castle, lock",
    "house/home": "house, home",
    "shop/store": "shop, store",
    "foot/leg": "foot, leg",
    "hand/arm": "hand, arm",
    "map/card": "map, card",
    "history/story": "history, story",
    "work/job": "work, job",
    "earth/land": "earth, land",
    "skin/leather": "skin, leather",
    "film/movie": "film, movie",
    "image/way/manner": "image, way, manner",
    "matter/affair/business": "matter, affair, business",
    "floor/layer": "floor, layer",
    "decision/solution": "decision, solution",
    "strength/force": "strength, force",
    "power/authority": "power, authority",
    "bench/shop": "bench, shop",
    "reason/cause": "reason, cause",
    "case/occasion": "case, occasion",
    "person/human": "person, human",
    "butter/oil": "butter, oil",
    "coat/winter": "coat, winter coat",
    "answer/informal": "answer (informal)",
    "beverage/formal": "beverage (formal)",
    "also/too": "also, too",
    "also/likewise": "also, likewise",
    "much/many": "much, many",
    "how much/many": "how much, how many",
    "how/as/like": "how, as, like",
    "which/what kind": "which, what kind",
    "what for/why": "what for, why",
    "while/until/bye": "while, until, bye",
    "still/yet/more": "still, yet, more",
    "so/thus": "so, thus",
    "well/good": "well, good",
    "well/so": "well, so",
    "completely/at all": "completely, at all",
    "in general/at all": "in general, at all",
    "less/smaller": "less, smaller",
    "more/bigger": "more, bigger",
    "this/it": "this, it",
    "some/certain": "some, certain",
    "anyone/someone": "anyone, someone",
    "anything/something": "anything, something",
    "other/another": "other, another",
    "every/each": "every, each",
    "next/following": "next, following",
    "future/next": "future, next",
    "past/last": "past, last",
    "real/present": "real, present",
    "complex/complicated": "complex, complicated",
    "best/better": "best, better",
    "worst/worse": "worst, worse",
    "higher/taller": "higher, taller",
    "less/nevertheless": "less, nevertheless",
    "moreover/and": "moreover, and",
    "namely/exactly": "namely, exactly",
    "especially/since": "especially since",
    "rather/fairly": "rather, fairly",
    "after all/you know": "after all, you know",

    # Prepositions — comma or space
    "in/into": "in, into",
    "on/onto": "on, onto",
    "with/from": "with, from",
    "to/toward": "to, toward",
    "from/out of": "from, out of",
    "behind/for": "behind, for",
    "along/by/on": "along, by, on",
    "at/during/in the presence of": "at, during, in the presence of",
    "in front of/before": "in front of, before",
    "near/about": "near, about",
    "before/until/to": "before, until, to",
    "through/across": "through, across",
    "above/over": "above, over",
    "below/downstairs": "below, downstairs",
    "above/upstairs": "above, upstairs",
    "and/but/while": "and, but, while",

    # Greetings / phrases
    "see/bye": "see you, bye",
    "bye/kisses": "bye, kisses",
    "young woman/girl": "young woman, girl",
    "female/friend": "female friend",
    "female/teacher": "female teacher",

    # Special: these are legitimate compound meanings
    "it is forbidden/impossible": "it is forbidden, impossible",
    "it is needed/necessary": "it is needed, necessary",
    "needed/necessary": "needed, necessary",
    "it is possible/allowed": "it is possible, allowed",
    "here is/that is": "here is, that is",
    "you (formal/plural)": "you (formal, plural)",
    "motherland/mother": "motherland, mother",
    "two (m./n.)": "two (m./n.)",  # keep as-is, not a slash issue
    "pipe/trumpet": "pipe, trumpet",
}

# ── Patterns for detecting "legitimate" vs "garbage" slash entries ──────
# Legitimate: both parts form a real English translation
# Garbage: "word/context" — the second part is just sentence context

def is_name_entry(en_val):
    """Entries like 'виктор/name' — these are names."""
    return en_val.endswith('/name')

def fix_name_entry(en_val):
    """Convert 'виктор/name' → 'Viktor (name)'."""
    name = en_val.replace('/name', '')
    # Transliterate common Russian names
    NAMES = {
        'виктор': 'Viktor', 'дмитрий': 'Dmitry', 'екатерина': 'Ekaterina',
        'елена': 'Elena', 'иван': 'Ivan', 'ирина': 'Irina',
        'михаил': 'Mikhail', 'наташа': 'Natasha', 'николай': 'Nikolay',
        'олег': 'Oleg', 'ольга': 'Olga', 'павел': 'Pavel',
        'светлана': 'Svetlana', 'сергей': 'Sergey', 'татьяна': 'Tatyana',
        'юлия': 'Yulia',
    }
    return NAMES.get(name, name) + ' (name)'

def is_garbage_context(en_val):
    """
    Detect garbage "word/context" entries.
    These typically look like: "beautiful/flowers", "children/play", "carried/books"
    where the second part is just a context word, not an alternative meaning.
    """
    if '/' not in en_val:
        return False

    # If it's in manual fixes, it's legitimate
    if en_val in MANUAL_FIXES:
        return False

    # Name entries handled separately
    if is_name_entry(en_val):
        return False

    parts = en_val.split('/')
    if len(parts) != 2:
        return False

    left, right = parts[0].strip(), parts[1].strip()

    # If both sides are single common English words without "to " prefix,
    # and neither is a grammatical annotation like (perf.) or (formal),
    # it's likely a garbage context entry.
    # Exception: known pairs like "big/large", "clean/pure" are in MANUAL_FIXES.

    # At this point, anything not in MANUAL_FIXES with a slash is garbage.
    return True

def extract_translation(en_val):
    """
    For garbage entries, extract the actual translation (first part).
    'beautiful/flowers' → 'beautiful'
    'children/play' → 'children'
    """
    parts = en_val.split('/')
    return parts[0].strip()


def main():
    with open(INPUT, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match en: 'value' entries (handling escaped quotes)
    # We use a callback-based replacement
    pattern = re.compile(r"(en:\s*')((?:[^'\\]|\\.)*)(')")

    stats = {
        'manual_fixed': 0,
        'name_fixed': 0,
        'garbage_fixed': 0,
        'already_ok': 0,
        'total_slash': 0,
    }

    changes = []

    def replacer(m):
        prefix = m.group(1)  # "en: '"
        en_val = m.group(2)  # the value
        suffix = m.group(3)  # "'"

        if '/' not in en_val:
            return m.group(0)

        # Skip IPA-like content (shouldn't be in en field, but safety check)
        if en_val.startswith('/') and en_val.endswith('/'):
            return m.group(0)

        stats['total_slash'] += 1
        original = en_val

        # Check manual fixes first
        if en_val in MANUAL_FIXES:
            fixed = MANUAL_FIXES[en_val]
            if fixed != en_val:
                stats['manual_fixed'] += 1
                changes.append(f"  MANUAL: '{original}' → '{fixed}'")
            else:
                stats['already_ok'] += 1
            return prefix + fixed.replace("'", "\\'") + suffix

        # Name entries
        if is_name_entry(en_val):
            fixed = fix_name_entry(en_val)
            stats['name_fixed'] += 1
            changes.append(f"  NAME:   '{original}' → '{fixed}'")
            return prefix + fixed.replace("'", "\\'") + suffix

        # Garbage context entries — keep only first part
        if is_garbage_context(en_val):
            fixed = extract_translation(en_val)
            # Handle some edge cases
            if fixed.startswith("it\\'s"):
                fixed = fixed  # keep escaped quotes
            stats['garbage_fixed'] += 1
            changes.append(f"  STRIP:  '{original}' → '{fixed}'")
            return prefix + fixed + suffix

        return m.group(0)

    new_content = pattern.sub(replacer, content)

    # Print summary
    print(f"=== Russian Dictionary Slash Fix ===")
    print(f"Total entries with '/' in en field: {stats['total_slash']}")
    print(f"  Manual fixes (legitimate alternatives): {stats['manual_fixed']}")
    print(f"  Name entries fixed: {stats['name_fixed']}")
    print(f"  Garbage context stripped: {stats['garbage_fixed']}")
    print(f"  Already OK: {stats['already_ok']}")
    print(f"  Total fixed: {stats['manual_fixed'] + stats['name_fixed'] + stats['garbage_fixed']}")
    print()

    # Show some examples
    print("Sample changes (first 40):")
    for c in changes[:40]:
        print(c)
    if len(changes) > 40:
        print(f"  ... and {len(changes) - 40} more")
    print()

    # Also check for other oddities in en field
    oddities = []
    for m in re.finditer(r"en:\s*'((?:[^'\\]|\\.)*)'", new_content):
        val = m.group(1)
        # Check for remaining issues
        if val.startswith("it\\'s"):
            oddities.append(f"  Escaped apostrophe: '{val}'")
        elif val.endswith("\\"):
            oddities.append(f"  Trailing backslash: '{val}'")
        elif val == '':
            oddities.append(f"  Empty en value at pos {m.start()}")

    if oddities:
        print(f"Other oddities found ({len(oddities)}):")
        for o in oddities[:20]:
            print(o)
        if len(oddities) > 20:
            print(f"  ... and {len(oddities) - 20} more")
    else:
        print("No other oddities found.")

    # Write output
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"\nFile written: {OUTPUT}")


if __name__ == '__main__':
    main()
