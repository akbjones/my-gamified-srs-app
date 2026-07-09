# -*- coding: utf-8 -*-
"""Greek grapheme->IPA, matching the existing el.ts dictionary style
(e.g. εγώ->eˈɣo, άσκηση->ˈascisi, αυγό->avˈɣo). Stress mark ˈ before the
onset of the stressed syllable."""
import re, unicodedata

ACC = {'ά':'α','έ':'ε','ή':'η','ί':'ι','ό':'ο','ύ':'υ','ώ':'ω','ϊ':'ι','ϋ':'υ','ΐ':'ι','ΰ':'υ'}
FRONT = set('εηιΕΗΙ')  # trigger palatalization (e/i sounds); after mapping
VOICED_CONS = set('βγδζμνρλ')

def strip_final_sigma(w): return w.replace('ς','σ')

def to_ipa(word):
    w = word.strip().lower()
    w = strip_final_sigma(w)
    # find stressed vowel index (accented char), record then debug-strip accents
    chars = list(w)
    stress_i = None
    for i,ch in enumerate(chars):
        if ch in ('ά','έ','ή','ί','ό','ύ','ώ','ΐ','ΰ'):
            stress_i = i
    base = ''.join(ACC.get(c,c) for c in chars)  # 1:1 with chars, no accents
    n = len(base)
    # Determine which output syllable is stressed: we mark ˈ before the
    # consonant-onset preceding the stressed vowel nucleus.
    out = []
    stresses = []  # positions in output where stress should be inserted (before onset)
    i = 0
    # We'll build phonemes with source index tracking to place stress.
    phon = []  # list of (ipa, src_start)
    def nextc(k):
        return base[k+1] if k+1 < n else ''
    def is_front(c):
        return c in ('ε','η','ι')
    DOUBLE = set('λρνμσβκπτφθδζ')
    while i < n:
        c = base[i]; c2 = base[i:i+2]; c3 = base[i:i+3]
        # doubled consonant (άλλο->alo) — emit once, skip the second; γγ handled below
        if c in DOUBLE and i+1 < n and base[i+1] == c:
            i += 1; continue
        # digraph vowels
        if c2 == 'ου': phon.append(('u', i)); i+=2; continue
        if c2 in ('ει','οι','υι'): phon.append(('i', i)); i+=2; continue
        if c2 == 'αι': phon.append(('e', i)); i+=2; continue
        if c2 in ('αυ','ευ'):
            nc = base[i+2] if i+2 < n else ''
            voiced = (nc in VOICED_CONS) or (nc in 'αεηιουω') or nc==''
            v = 'v' if voiced else 'f'
            phon.append((('a' if c=='α' else 'e')+v, i)); i+=2; continue
        # digraph consonants
        if c3 in ('γγι',):
            pass
        if c2 == 'γγ' or c2 == 'γκ':
            phon.append(('ŋɡ' if i > 0 else 'ɡ', i)); i+=2; continue
        if c2 == 'μπ': phon.append(('mb' if i > 0 else 'b', i)); i+=2; continue
        if c2 == 'ντ': phon.append(('nd' if i > 0 else 'd', i)); i+=2; continue
        if c2 == 'τσ': phon.append(('ts', i)); i+=2; continue
        if c2 == 'τζ': phon.append(('dz', i)); i+=2; continue
        # single
        if c == 'γ':
            nc = nextc(i)
            if nc in ('ε','η','ι') or base[i:i+2] in ('γε','γη','γι'):
                phon.append(('ʝ', i))
            else:
                phon.append(('ɣ', i))
            i+=1; continue
        if c == 'κ':
            phon.append(('c' if is_front(nextc(i)) or nextc(i) in ('ε','η','ι') else 'k', i)); i+=1; continue
        if c == 'χ':
            phon.append(('ç' if is_front(nextc(i)) or nextc(i) in ('ε','η','ι') else 'x', i)); i+=1; continue
        if c == 'σ':
            nc = nextc(i)
            phon.append(('z' if nc in VOICED_CONS else 's', i)); i+=1; continue
        m = {'α':'a','ε':'e','η':'i','ι':'i','ο':'o','υ':'i','ω':'o',
             'β':'v','δ':'ð','ζ':'z','θ':'θ','λ':'l','μ':'m','ν':'n',
             'ξ':'ks','π':'p','ρ':'r','τ':'t','φ':'f','ψ':'ps'}
        if c in m: phon.append((m[c], i)); i+=1; continue
        # unknown (latin, digits) -> keep
        phon.append((c, i)); i+=1; continue
    # place stress: find phon index whose src covers stress_i's vowel nucleus.
    vowels_ipa = set('aeiou')
    if stress_i is not None:
        # find the phon entry that is the vowel at/after stress_i
        target = None
        for idx,(p,src) in enumerate(phon):
            if src <= stress_i and p and p[0] in vowels_ipa:
                target = idx
        if target is None:
            for idx,(p,src) in enumerate(phon):
                if p and p[0] in vowels_ipa: target = idx
        if target is not None:
            # Is there a vowel phoneme before target? (determines onset size)
            prevVowel = any(p and p[0] in vowels_ipa for p, _ in phon[:target])
            if prevVowel:
                # single-consonant onset: ˈ before just the consonant right before the vowel
                j = target - 1 if target - 1 >= 0 and phon[target-1][0] and phon[target-1][0][0] not in vowels_ipa else target
            else:
                # stressed vowel is the first nucleus: whole leading cluster is onset
                j = target
                while j-1 >= 0 and phon[j-1][0] and phon[j-1][0][0] not in vowels_ipa:
                    j -= 1
            parts = [p for p,_ in phon]
            parts.insert(j, 'ˈ')
            return ''.join(parts)
    return ''.join(p for p,_ in phon)

if __name__ == '__main__':
    import json,sys
    tests = {'εγώ':'eˈɣo','αυτή':'afˈti','και':'ce','άσκηση':'ˈascisi',
             'αγορά':'aɣoˈra','δουλειά':'ðuˈlʝa','τράπεζα':'ˈtrapeza'}
    for k,v in tests.items():
        print(f"{k}: {to_ipa(k)}  (ref {v})")
