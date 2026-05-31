#!/usr/bin/env python3
"""Fix 381 bad cards in Russian deck (ru-2900 through ru-3933).

Categories:
1. Trailing frequency adverbs (move before verb)
2. Tense mismatch: present + "last week" (change to past)
3. Nonsensical location combinations (replace with sensible ones)
4. Redundant time markers (fix contradiction)
5. Word salad / tautological (clean up)
"""

import json
import re
import copy
import sys

with open("src/data/russian/deck.json", "r", encoding="utf-8") as f:
    deck = json.load(f)

# Build index
deck_by_id = {c["id"]: c for c in deck}

# Track fixes
fixes = {"trailing_adverb": [], "tense_mismatch": [], "nonsense_location": [], "redundant_time": [], "word_salad": []}

# ============================================================
# ENGLISH ADVERB MAP -> RUSSIAN
# ============================================================
en_adv_to_ru = {
    "always": "всегда",
    "often": "часто",
    "never": "никогда не",
    "usually": "обычно",
    "sometimes": "иногда",
    "rarely": "редко",
    "occasionally": "иногда",
}

ru_adverbs = ["всегда", "часто", "никогда не", "никогда", "обычно", "иногда", "редко"]

# ============================================================
# ENGLISH VERB -> PAST TENSE
# ============================================================
en_verb_past = {
    "runs": "ran", "run": "ran",
    "cooks": "cooked", "cook": "cooked",
    "watches": "watched", "watch": "watched",
    "reads": "read", "read": "read",
    "buys": "bought", "buy": "bought",
    "listens": "listened", "listen": "listened",
    "works": "worked", "work": "worked",
    "commutes": "commuted", "commute": "commuted",
    "paints": "painted", "paint": "painted",
    "does": "did",
    "washes": "washed", "wash": "washed",
    "helps": "helped", "help": "helped",
    "swims": "swam", "swim": "swam",
    "writes": "wrote", "write": "wrote",
    "sings": "sang", "sing": "sang",
    "cleans": "cleaned", "clean": "cleaned",
    "plays": "played", "play": "played",
    "dances": "danced", "dance": "danced",
    "walks": "walked", "walk": "walked",
    "drinks": "drank", "drink": "drank",
    "eats": "ate", "eat": "ate",
    "sleeps": "slept", "sleep": "slept",
    "studies": "studied", "study": "studied",
    "teaches": "taught", "teach": "taught",
    "drives": "drove", "drive": "drove",
    "rides": "rode", "ride": "rode",
    "takes": "took", "take": "took",
    "makes": "made", "make": "made",
    "gives": "gave", "give": "gave",
    "goes": "went", "go": "went",
    "has": "had", "have": "had",
    "says": "said", "say": "said",
    "gets": "got", "get": "got",
    "comes": "came", "come": "came",
    "sees": "saw", "see": "saw",
    "knows": "knew", "know": "knew",
    "sits": "sat", "sit": "sat",
    "stands": "stood", "stand": "stood",
    "falls": "fell", "fall": "fell",
    "speaks": "spoke", "speak": "spoke",
    "sends": "sent", "send": "sent",
    "meets": "met", "meet": "met",
    "puts": "put", "put": "put",
    "brings": "brought", "bring": "brought",
    "finds": "found", "find": "found",
    "begins": "began", "begin": "began",
}

# ============================================================
# RUSSIAN PRESENT -> PAST TENSE MAPPING
# (verb form -> {m: male, f: female, n: neuter, pl: plural})
# ============================================================
ru_verb_past = {
    # бегать - to run
    "бегает": {"m": "бегал", "f": "бегала", "n": "бегало", "pl": "бегали"},
    "бегает утром": {"m": "бегал утром", "f": "бегала утром", "n": "бегало утром", "pl": "бегали утром"},
    # готовить - to cook
    "готовит": {"m": "готовил", "f": "готовила", "n": "готовило", "pl": "готовили"},
    # смотреть - to watch
    "смотрит": {"m": "смотрел", "f": "смотрела", "n": "смотрело", "pl": "смотрели"},
    # читать - to read
    "читает": {"m": "читал", "f": "читала", "n": "читало", "pl": "читали"},
    # покупать - to buy
    "покупает": {"m": "покупал", "f": "покупала", "n": "покупало", "pl": "покупали"},
    # слушать - to listen
    "слушает": {"m": "слушал", "f": "слушала", "n": "слушало", "pl": "слушали"},
    # работать - to work
    "работает": {"m": "работал", "f": "работала", "n": "работало", "pl": "работали"},
    # ездить - to commute
    "ездит": {"m": "ездил", "f": "ездила", "n": "ездило", "pl": "ездили"},
    # рисовать - to paint
    "рисует": {"m": "рисовал", "f": "рисовала", "n": "рисовало", "pl": "рисовали"},
    # стирать - to do laundry
    "стирает": {"m": "стирал", "f": "стирала", "n": "стирало", "pl": "стирали"},
    # мыть - to wash
    "моет": {"m": "мыл", "f": "мыла", "n": "мыло", "pl": "мыли"},
    # помогать - to help
    "помогает": {"m": "помогал", "f": "помогала", "n": "помогало", "pl": "помогали"},
    # плавать - to swim
    "плавает": {"m": "плавал", "f": "плавала", "n": "плавало", "pl": "плавали"},
    # писать - to write
    "пишет": {"m": "писал", "f": "писала", "n": "писало", "pl": "писали"},
    # петь - to sing
    "поёт": {"m": "пел", "f": "пела", "n": "пело", "pl": "пели"},
    # убирать - to clean
    "убирает": {"m": "убирал", "f": "убирала", "n": "убирало", "pl": "убирали"},
    # играть - to play
    "играет": {"m": "играл", "f": "играла", "n": "играло", "pl": "играли"},
    # танцевать - to dance
    "танцует": {"m": "танцевал", "f": "танцевала", "n": "танцевало", "pl": "танцевали"},
    # гулять - to walk
    "гуляет": {"m": "гулял", "f": "гуляла", "n": "гуляло", "pl": "гуляли"},
    # пить - to drink
    "пьёт": {"m": "пил", "f": "пила", "n": "пило", "pl": "пили"},
    # есть - to eat (perfective-like)
    "ест": {"m": "ел", "f": "ела", "n": "ело", "pl": "ели"},
}

# Russian subject -> gender
ru_subject_gender = {
    # Masculine
    "Брат": "m", "Дедушка": "m", "Папа": "m", "Мальчик": "m", "Друг": "m", "Сын": "m",
    "Дядя": "m", "Отец": "m",
    "Продавец": "m", "Программист": "m", "Инженер": "m", "Музыкант": "m",
    "Художник": "m", "Спортсмен": "m", "Фермер": "m", "Журналист": "m",
    "Архитектор": "m", "Полицейский": "m", "Водитель": "m", "Директор": "m",
    "Библиотекарь": "m", "Учитель": "m", "Врач": "m", "Доктор": "m",
    "Студент": "m", "Сосед": "m", "Повар": "m", "Писатель": "m",
    # Feminine
    "Сестра": "f", "Бабушка": "f", "Мама": "f", "Девочка": "f",
    "Медсестра": "f", "Подруга": "f", "Дочь": "f", "Тётя": "f",
    # Neuter
    "Ребёнок": "m",  # grammatically masculine in Russian
}

def get_ru_gender(target):
    """Determine gender from the Russian subject."""
    for subj, gender in ru_subject_gender.items():
        if target.startswith(subj + " ") or target.startswith(subj + ","):
            return gender
    # Default to masculine for unknown subjects
    return "m"


# ============================================================
# LOCATION REPLACEMENTS (nonsensical -> sensible)
# ============================================================
# English location -> sensible replacement for each activity type
location_fixes_en = {
    # For domestic chores (wash dishes, laundry, cook, iron, sew)
    "domestic": {
        "in the park": "at home",
        "at the beach": "at home",
        "at the stadium": "at home",
        "at the hospital": "at home",
        "at the airport": "at home",
        "in the forest": "at home",
        "at the theater": "at home",
        "at the museum": "at home",
        "in the library": "at home",
        "in the mountains": "at home",
        "at the market": "at home",
        "in the restaurant": "at home",
        "in the store": "at home",
    },
    # For dancing
    "dance": {
        "at the hospital": "at the party",
        "at the airport": "at the party",
    },
    # For painting
    "paint": {
        "at the airport": "in the studio",
        "at the hospital": "in the studio",
        "at the stadium": "in the studio",
    },
    # For swimming in pool
    "swim_pool": {
        "at the airport": "",  # just "swims in the pool"
        "at the hospital": "",
        "in the library": "",
        "at the theater": "",
        "at the museum": "",
        "in the restaurant": "",
        "in the store": "",
        "in the mountains": "",
        "at the market": "",
        "in the park": "",
    },
    # For running in the morning
    "run_morning": {
        "at the hospital": "in the park",
        "in the library": "in the park",
        "at the museum": "in the park",
        "in the restaurant": "in the park",
    },
    # For reading
    "read": {
        "at the airport": "at the library",
        "at the stadium": "at the library",
    },
    # For commuting
    "commute": {
        "at the market": "",  # just "commutes to work"
        "at work": "",
    },
}

# Russian location replacements
location_fixes_ru = {
    "в парке": {"domestic": "дома", "default": "дома"},
    "на пляже": {"domestic": "дома", "default": "дома"},
    "на стадионе": {"domestic": "дома", "default": "дома"},
    "в больнице": {"domestic": "дома", "dance": "на вечеринке", "paint": "в студии", "swim": "", "run": "в парке", "cook": "дома", "default": "дома"},
    "в аэропорту": {"domestic": "дома", "dance": "на вечеринке", "paint": "в студии", "swim": "", "read": "в библиотеке", "cook": "дома", "default": "дома"},
    "в лесу": {"domestic": "дома", "default": "дома"},
    "в театре": {"domestic": "дома", "swim": "", "default": "дома"},
    "в музее": {"domestic": "дома", "swim": "", "run": "в парке", "default": "дома"},
    "в библиотеке": {"domestic": "дома", "swim": "", "run": "в парке", "cook": "дома", "default": "дома"},
    "в горах": {"domestic": "дома", "swim": "", "default": "дома"},
    "на рынке": {"domestic": "дома", "swim": "", "commute": "", "default": "дома"},
    "в ресторане": {"domestic": "дома", "swim": "", "cook": "дома", "default": "дома"},
    "в магазине": {"domestic": "дома", "swim": "", "cook": "дома", "default": "дома"},
    "на работе": {"commute": ""},
}


def classify_activity(eng_lower):
    """Classify the English sentence by activity type."""
    if any(x in eng_lower for x in ["wash dishes", "washes dishes", "does laundry", "do laundry", "irons clothes", "iron clothes", "sews clothes", "sew clothes"]):
        return "domestic"
    if any(x in eng_lower for x in ["cooks lunch", "cook lunch", "cooks dinner", "cook dinner", "cooks breakfast", "cook breakfast"]):
        return "cook"
    if "dance" in eng_lower:
        return "dance"
    if "paint" in eng_lower:
        return "paint"
    if "swim" in eng_lower and "pool" in eng_lower:
        return "swim"
    if "runs in the morning" in eng_lower or "run in the morning" in eng_lower:
        return "run"
    if "reads a book" in eng_lower or "read a book" in eng_lower:
        return "read"
    if "commutes to work" in eng_lower or "commute to work" in eng_lower:
        return "commute"
    return None


def fix_en_location(eng, activity):
    """Fix nonsensical location in English sentence."""
    en_locs = location_fixes_en.get(activity if activity != "cook" else "domestic", {})
    for bad_loc, good_loc in en_locs.items():
        if bad_loc in eng.lower():
            if good_loc == "":
                # Remove the location entirely
                eng = re.sub(r'\s*' + re.escape(bad_loc), '', eng, flags=re.IGNORECASE)
            else:
                eng = re.sub(re.escape(bad_loc), good_loc, eng, flags=re.IGNORECASE)
            return eng
    return eng


def fix_ru_location(target, activity):
    """Fix nonsensical location in Russian sentence."""
    for bad_loc_ru, replacements in location_fixes_ru.items():
        if bad_loc_ru in target:
            # Determine replacement category
            act_key = activity if activity in replacements else "domestic" if activity in ["cook", "domestic"] else "default"
            if act_key not in replacements:
                act_key = "default"
            good_loc_ru = replacements[act_key]
            if good_loc_ru == "":
                target = target.replace(" " + bad_loc_ru, "")
                target = target.replace(bad_loc_ru + " ", "")
                target = target.replace(bad_loc_ru, "")
            else:
                target = target.replace(bad_loc_ru, good_loc_ru)
            return target
    return target


def fix_trailing_adverb_en(eng):
    """Move trailing adverb before the main verb in English."""
    for adv in ["always", "often", "never", "usually", "sometimes", "rarely", "occasionally"]:
        # Match trailing adverb with optional period
        pattern = r'^(.*?)\s+' + adv + r'\.\s*$'
        m = re.match(pattern, eng, re.IGNORECASE)
        if m:
            base = m.group(1).rstrip('.')
            # Find the main verb and insert adverb before it
            # Pattern: Subject + adverb + verb phrase
            # Try to find the verb position
            # Common patterns: "Subject verb...", "The subject verb..."
            verb_pattern = r'^((?:The\s+)?\w+)\s+([\w]+)'
            vm = re.match(verb_pattern, base)
            if vm:
                subject = vm.group(1)
                verb = vm.group(2)
                rest = base[vm.end():]
                new_eng = f"{subject} {adv} {verb}{rest}."
                return new_eng, adv
    return eng, None


def fix_trailing_adverb_ru(target, adv_en):
    """Move trailing Russian adverb before the verb."""
    adv_ru = en_adv_to_ru.get(adv_en, None)
    if not adv_ru:
        return target

    # Handle "никогда не" specially
    if adv_ru == "никогда не":
        # Remove trailing "никогда" (may or may not have "не" before verb)
        target = re.sub(r'\s+никогда\.\s*$', '.', target)
        target = re.sub(r'\s+никогда$', '', target)
        # Find subject and verb, insert "никогда не" before verb
        m = re.match(r'^(\S+)\s+(\S+)', target.rstrip('.'))
        if m:
            subj = m.group(1)
            verb = m.group(2)
            rest = target.rstrip('.')[m.end():]
            # Check if verb already has "не"
            if verb == "не":
                # "Subject не verb..." -> "Subject никогда не verb..."
                target = f"{subj} никогда {verb}{rest}."
            else:
                target = f"{subj} никогда не {verb}{rest}."
        return target

    # For other adverbs: remove from end, place before verb
    for ru_adv in ru_adverbs:
        if ru_adv == "никогда не":
            continue
        # Remove trailing adverb
        pattern = r'\s+' + re.escape(ru_adv) + r'\.\s*$'
        if re.search(pattern, target):
            target = re.sub(pattern, '.', target)
            # Insert before verb (after subject)
            m = re.match(r'^(\S+)\s+', target.rstrip('.'))
            if m:
                subj = m.group(1)
                rest = target.rstrip('.')[m.end():]
                target = f"{subj} {ru_adv} {rest}."
            return target

        # Also try without period
        pattern2 = r'\s+' + re.escape(ru_adv) + r'$'
        if re.search(pattern2, target.rstrip('.')):
            base = re.sub(pattern2, '', target.rstrip('.'))
            m = re.match(r'^(\S+)\s+', base)
            if m:
                subj = m.group(1)
                rest = base[m.end():]
                target = f"{subj} {ru_adv} {rest}."
            return target

    return target


def fix_en_past_tense(eng):
    """Change present tense verbs to past tense in English."""
    words = eng.split()
    fixed_words = []
    for i, w in enumerate(words):
        w_lower = w.lower().rstrip('.,!?')
        punct = w[len(w_lower):] if len(w) > len(w_lower) else ""
        if w_lower in en_verb_past:
            # Don't change "does" when part of "does laundry"
            if w_lower == "does" and i + 1 < len(words) and words[i + 1].lower() == "laundry":
                fixed_words.append("did" + punct)
            else:
                replacement = en_verb_past[w_lower]
                # Preserve capitalization
                if w[0].isupper():
                    replacement = replacement.capitalize()
                fixed_words.append(replacement + punct)
        else:
            fixed_words.append(w)
    return " ".join(fixed_words)


def fix_ru_past_tense(target, gender):
    """Change present tense Russian verbs to past tense."""
    for present, past_forms in ru_verb_past.items():
        if present in target:
            past = past_forms[gender]
            target = target.replace(present, past, 1)
            return target
    return target


# ============================================================
# MAIN FIX LOOP
# ============================================================
fixed_ids = set()
all_english = set()  # Track to avoid duplicates

# First pass: collect all existing English sentences
for c in deck:
    all_english.add(c["english"].lower().strip())

for c in deck:
    cid = c["id"]
    if cid < "ru-2900":
        continue

    eng = c["english"]
    target = c["target"]
    original_eng = eng
    original_target = target
    categories_applied = []

    eng_lower = eng.lower()

    # ============================================================
    # CATEGORY 5: Word salad / tautological (fix first as they overlap with others)
    # ============================================================

    # "commutes to work at work" -> "commutes to work"
    if re.search(r'commutes to work at work', eng_lower):
        eng = re.sub(r' at work', '', eng, count=1, flags=re.IGNORECASE)
        target = target.replace(" на работе", "", 1)
        categories_applied.append("word_salad")

    # "swims in the pool in the restaurant/library/museum/store/park" -> "swims in the pool"
    pool_bad_locs = ["in the restaurant", "in the library", "in the museum", "in the store", "in the mountains", "at the market", "in the park"]
    for bad_loc in pool_bad_locs:
        if "swims in the pool" in eng.lower() and bad_loc in eng.lower():
            eng = re.sub(r'\s*' + re.escape(bad_loc), '', eng, flags=re.IGNORECASE)
            # Remove corresponding Russian location
            ru_bad_locs = {
                "in the restaurant": "в ресторане",
                "in the library": "в библиотеке",
                "in the museum": "в музее",
                "in the store": "в магазине",
                "in the mountains": "в горах",
                "at the market": "на рынке",
                "in the park": "в парке",
            }
            if bad_loc in ru_bad_locs and ru_bad_locs[bad_loc] in target:
                target = target.replace(" " + ru_bad_locs[bad_loc], "")
                target = target.replace(ru_bad_locs[bad_loc] + " ", "")
            if "word_salad" not in categories_applied:
                categories_applied.append("word_salad")
            break

    # "commutes to work at the market" -> "commutes to work"
    if "commutes to work at the market" in eng.lower():
        eng = re.sub(r' at the market', '', eng, flags=re.IGNORECASE)
        target = target.replace(" на рынке", "")
        if "word_salad" not in categories_applied:
            categories_applied.append("word_salad")

    # ============================================================
    # CATEGORY 4: Redundant time markers
    # ============================================================

    # "runs in the morning after lunch" -> "runs in the afternoon"
    if "runs in the morning after lunch" in eng.lower():
        eng = re.sub(r'runs in the morning after lunch', 'runs in the afternoon', eng, flags=re.IGNORECASE)
        target = target.replace("бегает утром после обеда", "бегает днём")
        categories_applied.append("redundant_time")

    # "runs in the morning this morning" -> "runs every morning"
    elif re.search(r'runs in the morning this morning', eng, re.IGNORECASE):
        eng = re.sub(r'runs in the morning this morning', 'runs every morning', eng, flags=re.IGNORECASE)
        target = target.replace("бегает утром сегодня утром", "бегает каждое утро")
        categories_applied.append("redundant_time")

    # "This morning ... runs in the morning in the museum" -> "This morning ... runs in the park"
    elif re.search(r'this morning.*runs in the morning', eng, re.IGNORECASE):
        eng = re.sub(r'runs in the morning', 'runs', eng, flags=re.IGNORECASE)
        target = target.replace("бегает утром", "бегает")
        # Also fix location if needed
        if "in the museum" in eng.lower():
            eng = eng.replace("in the museum", "in the park").replace("In the museum", "In the park")
            target = target.replace("в музее", "в парке")
        categories_applied.append("redundant_time")

    # "runs in the morning in the museum this morning" -> multiple redundancies
    elif re.search(r'runs in the morning in the \w+ this morning', eng, re.IGNORECASE):
        eng = re.sub(r'runs in the morning (in the \w+) this morning', r'runs \1 this morning', eng, flags=re.IGNORECASE)
        target = target.replace("бегает утром", "бегает")
        categories_applied.append("redundant_time")

    # ============================================================
    # CATEGORY 3: Nonsensical locations
    # ============================================================
    eng_lower_now = eng.lower()
    activity = classify_activity(eng_lower_now)

    # Define which locations are nonsensical for each activity
    nonsensical_combos = {
        "domestic": ["in the park", "at the beach", "at the stadium", "at the hospital", "at the airport",
                     "in the forest", "at the theater", "at the museum", "in the library", "in the mountains",
                     "at the market", "in the restaurant", "in the store"],
        "cook": ["at the airport", "at the stadium", "in the park", "at the beach", "at the hospital",
                 "in the forest", "at the theater", "at the museum", "in the library", "in the mountains",
                 "in the restaurant", "in the store"],
        "dance": ["at the hospital", "at the airport"],
        "paint": ["at the airport", "at the hospital", "at the stadium"],
        "swim": ["at the airport", "at the hospital", "in the library", "at the theater", "at the museum",
                 "in the restaurant", "in the store", "in the mountains", "at the market", "in the park"],
        "run": ["at the hospital", "in the library", "at the museum", "in the restaurant"],
        "read": ["at the airport", "at the stadium"],
        "commute": ["at the market", "at work"],
    }

    if activity and activity in nonsensical_combos:
        for bad_loc in nonsensical_combos[activity]:
            if bad_loc in eng_lower_now:
                # Check for compound sentences
                if ", and " in eng:
                    # Handle compound: fix only the clause with the bad location
                    parts = eng.split(", and ")
                    target_parts = target.split(", а " if ", а " in target else (", и " if ", и " in target else ", "))

                    fixed_parts_en = []
                    fixed_parts_ru = []
                    for pi, part in enumerate(parts):
                        if bad_loc in part.lower():
                            part = fix_en_location(part, activity)
                            if pi < len(target_parts):
                                target_parts[pi] = fix_ru_location(target_parts[pi], activity)
                        fixed_parts_en.append(part)

                    eng = ", and ".join(fixed_parts_en)
                    if len(target_parts) > 1:
                        separator = ", а " if ", а " in original_target else ", и "
                        target = separator.join(target_parts)
                else:
                    eng = fix_en_location(eng, activity)
                    target = fix_ru_location(target, activity)

                if "nonsense_location" not in categories_applied:
                    categories_applied.append("nonsense_location")
                break

    # ============================================================
    # CATEGORY 2: Tense mismatch (present + "last week")
    # ============================================================
    if "last week" in eng.lower():
        # Check if verb is in present tense (not already past)
        # Heuristic: check for present-tense verbs
        has_present = False
        for v in en_verb_past:
            # Only match 3rd person singular present
            if v.endswith('s') or v in ['does']:
                if re.search(r'\b' + re.escape(v) + r'\b', eng, re.IGNORECASE):
                    has_present = True
                    break
            # Also check base forms in certain constructs
            if re.search(r'\b' + re.escape(v) + r'\b', eng, re.IGNORECASE) and v in ['run', 'swim', 'cook', 'read', 'buy', 'listen', 'work', 'commute', 'paint', 'wash', 'help', 'write', 'sing', 'clean', 'play', 'dance', 'walk', 'drink', 'eat']:
                has_present = True
                break

        if has_present:
            eng = fix_en_past_tense(eng)
            gender = get_ru_gender(target)
            target = fix_ru_past_tense(target, gender)
            categories_applied.append("tense_mismatch")

    # ============================================================
    # CATEGORY 1: Trailing frequency adverbs
    # ============================================================
    # Check if sentence ends with an adverb
    for adv in ["always", "often", "never", "usually", "sometimes", "rarely", "occasionally"]:
        if eng.lower().rstrip('.').endswith(' ' + adv):
            eng, matched_adv = fix_trailing_adverb_en(eng)
            if matched_adv:
                target = fix_trailing_adverb_ru(target, matched_adv)
                categories_applied.append("trailing_adverb")
            break

    # ============================================================
    # Apply fixes
    # ============================================================
    if categories_applied:
        # Clean up any double spaces
        eng = re.sub(r'\s+', ' ', eng).strip()
        target = re.sub(r'\s+', ' ', target).strip()

        # Ensure proper ending
        if not eng.endswith('.'):
            eng = eng + '.'
        if not target.endswith('.'):
            target = target + '.'

        # Check for duplicate English
        eng_key = eng.lower().strip()
        if eng_key in all_english and eng_key != original_eng.lower().strip():
            # Slight variation to avoid duplicate
            # Add a small modifier
            pass  # We'll check at the end

        c["english"] = eng
        c["target"] = target
        fixed_ids.add(cid)

        for cat in categories_applied:
            fixes[cat].append(cid)

# ============================================================
# Dedup check
# ============================================================
seen_english = {}
dupes = []
for c in deck:
    eng_key = c["english"].lower().strip()
    if eng_key in seen_english:
        dupes.append((c["id"], seen_english[eng_key], c["english"]))
    else:
        seen_english[eng_key] = c["id"]

# ============================================================
# STATS
# ============================================================
print("=== FIX STATS ===")
print(f"Category 1 - Trailing adverbs:     {len(fixes['trailing_adverb'])}")
print(f"Category 2 - Tense mismatch:       {len(fixes['tense_mismatch'])}")
print(f"Category 3 - Nonsense locations:    {len(fixes['nonsense_location'])}")
print(f"Category 4 - Redundant time:        {len(fixes['redundant_time'])}")
print(f"Category 5 - Word salad:            {len(fixes['word_salad'])}")
print(f"---")
# Some cards have multiple categories
all_fixed = set()
for cat, ids in fixes.items():
    all_fixed.update(ids)
print(f"Total unique cards fixed:           {len(all_fixed)}")
print(f"Duplicates created:                 {len(dupes)}")

if dupes:
    print("\nDuplicates found:")
    for d in dupes:
        print(f"  {d[0]} duplicates {d[1]}: {d[2]}")

# Show some examples per category
for cat, ids in fixes.items():
    if ids:
        print(f"\n=== Sample {cat} fixes ===")
        for cid in ids[:3]:
            c = deck_by_id[cid]
            print(f"  {cid}: EN={c['english']}")
            print(f"         RU={c['target']}")

# Write fixed deck
with open("src/data/russian/deck.json", "w", encoding="utf-8") as f:
    json.dump(deck, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"\nDeck written successfully with {len(deck)} cards.")
