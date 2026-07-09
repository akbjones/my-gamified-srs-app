# -*- coding: utf-8 -*-
"""Modern Greek grapheme->IPA, calibrated to src/data/dictionary/el.ts style."""

STRESS = set('άέήίόύώΐΰ')
DIAER = {'ϊ':'ι','ϋ':'υ'}
DEACC = {'ά':'α','έ':'ε','ή':'η','ί':'ι','ό':'ο','ύ':'υ','ώ':'ω','ΐ':'ι','ΰ':'υ','ϊ':'ι','ϋ':'υ'}
PLAINVOWELS = set('αεηιουω')
ALLVOWELS = PLAINVOWELS | set('άέήίόύώϊϋΐΰ')
IFRONT = set('εέηήιίυύ')

def _front_after(s, i):
    """Does a front vowel [e]/[i] begin at position i in deaccented string s?"""
    two = s[i:i+2]
    if two in ('αι','ει','οι','υι'):
        return True
    return s[i] in set('εηιυ')

def g2p(word):
    raw = word.lower()
    # deaccent, record stress on the vowel that carried the tonos
    s = []
    stress_i = -1
    for ch in raw:
        if ch in STRESS:
            stress_i = len(s)
        s.append(DEACC.get(ch, ch))
    s = ''.join(s)
    n = len(s)

    phon = []          # [ipa, kind, base_idx, stressed]
    i = 0
    while i < n:
        c = s[i]; two = s[i:i+2]
        st = (i == stress_i) or (i+1 == stress_i and two in ('ου','αι','ει','οι','υι','αυ','ευ','ηυ'))
        if two == 'ου':
            phon.append(['u','V',i,st]); i+=2; continue
        if two == 'αι':
            phon.append(['e','V',i,st]); i+=2; continue
        if two in ('ει','οι','υι'):
            phon.append(['i','V',i,st]); i+=2; continue
        if two in ('αυ','ευ','ηυ'):
            fol = s[i+2] if i+2<n else ''
            voiced = fol=='' or fol in (ALLVOWELS | set('βγδζλμνρ'))
            bv = 'a' if two=='αυ' else ('e' if two=='ευ' else 'i')
            phon.append([bv,'V',i,st]); phon.append(['v' if voiced else 'f','C',i,False]); i+=2; continue
        if c in PLAINVOWELS:
            mp={'α':'a','ε':'e','η':'i','ι':'i','ο':'o','υ':'i','ω':'o'}
            phon.append([mp[c],'V',i,st]); i+=1; continue
        # consonant digraphs
        if two in ('γγ','γκ'):
            phon.append(['g','C',i,False] if i==0 else ['ŋ','C',i,False])
            if i!=0: phon.append(['ɡ','C',i,False])
            i+=2; continue
        if two=='γχ':
            phon.append(['ŋ','C',i,False]); phon.append(['x','C',i,False]); i+=2; continue
        if two=='μπ':
            if i==0: phon.append(['b','C',i,False])
            else: phon.append(['m','C',i,False]); phon.append(['b','C',i,False])
            i+=2; continue
        if two=='ντ':
            if i==0: phon.append(['d','C',i,False])
            else: phon.append(['n','C',i,False]); phon.append(['d','C',i,False])
            i+=2; continue
        if two=='τσ':
            phon.append(['ts','C',i,False]); i+=2; continue
        if two=='τζ':
            phon.append(['dz','C',i,False]); i+=2; continue
        if c=='γ':
            phon.append(['ʝ' if _front_after(s,i+1) else 'ɣ','C',i,False]); i+=1; continue
        if c=='κ':
            phon.append(['c' if _front_after(s,i+1) else 'k','C',i,False]); i+=1; continue
        if c=='χ':
            phon.append(['ç' if _front_after(s,i+1) else 'x','C',i,False]); i+=1; continue
        if c=='ξ':
            phon.append(['k','C',i,False]); phon.append(['s','C',i,False]); i+=1; continue
        if c=='ψ':
            phon.append(['p','C',i,False]); phon.append(['s','C',i,False]); i+=1; continue
        if c in ('σ','ς'):
            f=s[i+1] if i+1<n else ''
            phon.append(['z' if f in set('βγδμνρλ') else 's','C',i,False]); i+=1; continue
        simple={'β':'v','γ':'ɣ','δ':'ð','ζ':'z','θ':'θ','λ':'l','μ':'m','ν':'n','π':'p','ρ':'r','τ':'t','φ':'f'}
        if c in simple:
            phon.append([simple[c],'C',i,False]); i+=1; continue
        i+=1

    # ── synizesis: unstressed [i] between a consonant and a vowel → glide ──
    out=[]
    k=0
    L=len(phon)
    while k<L:
        p=phon[k]
        if (p[1]=='V' and p[0]=='i' and not p[3] and out and out[-1][1]=='C'
                and k+1<L and phon[k+1][1]=='V'):
            prev=out[-1][0]
            if prev in ('k','c'): out[-1][0]='c'
            elif prev in ('ɣ','ʝ'): out[-1][0]='ʝ'
            elif prev in ('x','ç'): out[-1][0]='ç'
            elif prev=='l': out[-1][0]='ʎ'
            elif prev=='n': out[-1][0]='ɲ'
            elif prev=='ð': out.append(['ʝ','C',p[2],False])  # δια- → ðʝa
            else:
                out.append(p)  # no synizesis; keep i (labials/dentals/liquids lexical)
                k+=1; continue
            k+=1; continue
        out.append(p); k+=1

    # geminate collapse (identical adjacent consonants)
    dedup=[]
    for p in out:
        if dedup and p[1]=='C' and dedup[-1][1]=='C' and dedup[-1][0]==p[0]:
            if p[3]: dedup[-1][3]=True
            continue
        dedup.append(p)
    seq=dedup

    nuclei=[idx for idx,p in enumerate(seq) if p[1]=='V']
    text=[p[0] for p in seq]
    if len(nuclei)>=2:
        si=next((idx for idx,p in enumerate(seq) if p[3]), -1)
        if si>=0:
            onset=si
            while onset-1>=0 and seq[onset-1][1]=='C':
                onset-=1
            ncons=si-onset
            if ncons>=2:
                if onset==0:
                    mark = 0  # word-initial cluster is the onset (ˈftano, ˈscilo)
                else:
                    cl=''.join(text[onset:si])
                    # medial: only stop/fricative + liquid r/l stays as onset
                    valid={'tr','pr','kr','θr','xr','fr','vr','ðr','ɣr','cr','çr',
                           'pl','kl','fl','ɣl','xθ','fθ','st','sp','sk','sf','sx',
                           'sθ','sm','sn','str','spr','skr'}
                    mark = onset if cl in valid else si-1
            else:
                mark = onset
            text.insert(mark,'ˈ')
    return ''.join(text)


if __name__=='__main__':
    import json
    pairs=json.load(open('scripts/tmp/_el4-ipa-pairs.json'))
    ok=0; bad=[]
    for k,ipa in pairs:
        g=g2p(k)
        if g==ipa: ok+=1
        else: bad.append((k,ipa,g))
    print(f'match {ok}/{len(pairs)} = {100*ok/len(pairs):.1f}%')
    import collections
    for k,ipa,g in bad[:45]:
        print(f'  {k:18} want {ipa:18} got {g}')
