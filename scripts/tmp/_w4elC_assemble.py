import importlib.util, json, re
from collections import Counter

# Romanization normaliser: match deck convention (θ->th, ŋ->ng, velar χ 'x'->'ch').
_GREEK = re.compile(r'[Α-Ωα-ωΆ-Ώά-ώϊϋΐΰ]')
_ROM = re.compile(r"^[A-Za-zÀ-ÿçðɣʝŋθ0-9\s'’=/.,\-]+$")
def _fixrom(r):
    return r.replace('ŋx','nch').replace('ŋɡ','ng').replace('ŋg','ng').replace('ŋ','ng').replace('x','ch').replace('θ','th')
def fix_tip(tip):
    def repl(m):
        inner=m.group(1)
        # θ is used as a phonetic symbol in romanizations; ignore it for the
        # Greek-script check (real Greek examples have other Greek letters too).
        if _GREEK.search(inner.replace('θ','')) or not _ROM.match(inner) or not re.search(r'[A-Za-z]',inner):
            return m.group(0)
        return '('+_fixrom(inner)+')'
    return re.sub(r'\(([^)]*)\)', repl, tip)
def load(p,name):
    s=importlib.util.spec_from_file_location(name,p); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
n25=load('scripts/tmp/_w4elC_node25.py','n25').NODE25
n26=load('scripts/tmp/_w4elC_node26.py','n26').NODE26
assert len(n25)==125 and len(n26)==125, (len(n25),len(n26))
rows=n25+n26

# Primary (strong) keywords
FAM=['μαμά','αδερφ','αδέρφ','γονεί','γονιό','γιαγιά','παππού','μητέρα','πατέρα','μπαμπά','κόρη','γιος','οικογέν','παιδι','παιδί','ξαδερφ','ξαδέρφ','εγγόν','θείο','πεθερ','νύφη','γάμο','παντρ','αρραβων','μωρό','αδερφούλα','ζευγάρι','επέτειο','ταίρι','περήφαν']
WRK=['δουλ','ηθοποι','σκηνοθέτ','τραγουδιστ','τραγουδίστ','συγγραφέ','ξεναγ','ξενάγ','καλλιτέχν','κιθαρίστ','χορευτ','θίασ','ορχήστρ','αφεντικό','πρωταγωνιστ','μουσικού','δημιούργησ','δημιουργ','βραβείο','παρουσίαση','δεξιοτεχν','κριτικ','συγκρότημα','λόγο του']
TRV=['σινεμά','θέατρ','μουσεί','συναυλ','φεστιβάλ','ταξιδ','ταξίδ','νησί','χωριό','Επιδαύ','Κάννε','Σύρο','πανηγύρ','ταβέρν','βόλτα','Λονδίν','γλέντ','θερινό','πινακοθήκ','βιβλιοπωλ','μπαράκ','έκθεσ','πρεμιέρ','εισιτήρι','κινηματογράφ','Ηπείρ','παράσταση','ξενάγ','διακοπ','κόσμο']
# Secondary (soft) keywords for top-up toward ~26% each
FAM2=['φίλ','παρέα','σχέση','ραντεβού','αγαπ','ερωτ','φιλήσ','φίλησε','αγκαλ','καβγά','συγχώρ','μαλών','μαλώσ','σπίτι','χωρίσ','εμπιστ','τσακ','αγάπη','επιτέλους το ταίρι']
WRK2=['μαγαζί','ζωντανή μουσική','ρόλο','σκηνή','μάθημα','κιθάρα','ανεβάζ','βήματα','δάσκαλ','τέχνη','αφιερών','περιοδεύ','παίζ','έργο','σενάρι','έκθεσ','συναυλ','τραγούδι','κομμάτι','σόλο','μονόλογ','σκηνικ','σκοπ','παράσταση','ντοκιμαντέρ']
TRV2=['ταινί','βιβλιοθήκ','κιθάρα','βράδυ','ποτό','γιορτ','καλοκαίρ','αίθουσα','βροχή','πόλη','κόσμο','αρχαίο','κάρτα','θάλασσα','ακούμε']

def has(t, kws): return any(k in t for k in kws)

cards=[]
for i,(target,english,extra,grammar) in enumerate(rows):
    n=2801+i
    node='node-25' if n<=2925 else 'node-26'
    tags=['general']
    ex=set(extra)
    if 'family' in ex or has(target,FAM): tags.append('family')
    if 'work' in ex or has(target,WRK): tags.append('work')
    if 'travel' in ex or has(target,TRV): tags.append('travel')
    seen=set(); tags=[t for t in tags if not (t in seen or seen.add(t))]
    c={"id":f"el-{n}","target":target,"english":english,"audio":f"el-el-{n}.mp3",
       "tags":tags,"grammarNode":node,"priority":n,"_target":target}
    if grammar: c["grammar"]=fix_tip(grammar)
    cards.append(c)

# ── Top-up soft tags toward ~66 (26%) each ──
def count(tag): return sum(1 for c in cards if tag in c['tags'])
for tag,kws,tgt in [('family',FAM2,66),('travel',TRV2,66),('work',WRK2,62)]:
    for c in cards:
        if count(tag)>=tgt: break
        if tag in c['tags']: continue
        if len(c['tags'])>=3: continue  # avoid 4-tag cards
        if has(c['_target'],kws):
            c['tags'].append(tag)
for c in cards: del c['_target']

# Tip trim: drop weakest ~ to land near 48%. Weakest = pure vocab-gloss tips
# (single headword + '=' + no grammar keyword). Keep grammar/usage tips.
GRAMMAR_KW=['μου αρέσ','singular','plural','deponent','aorist','imperfect','present-only',
 'accusative','genitive','reciprocal','comparative','impersonal','clitic','object','takes',
 'with ','agree','not a','—','idiom','fixed','after ','before ','possessiv']
def is_grammar(tip):
    return any(k in tip for k in GRAMMAR_KW)
# candidates to drop: non-grammar tips
drop_candidates=[c['id'] for c in cards if 'grammar' in c and not is_grammar(c['grammar'])]
# We want ~120 tips (48%). currently 142. drop 22.
target_tips=120
ntips=sum(1 for c in cards if 'grammar' in c)
to_drop=max(0, ntips-target_tips)
dropset=set(drop_candidates[:to_drop])
for c in cards:
    if c['id'] in dropset and 'grammar' in c:
        del c['grammar']

json.dump(cards, open('scripts/tmp/wave4-el-cards-C.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)

tagc=Counter()
for c in cards:
    for t in c['tags']: tagc[t]+=1
tips=sum(1 for c in cards if 'grammar' in c)
print('cards:',len(cards),'tips:',tips,f'({tips*100/250:.1f}%)')
for k in ['general','travel','work','family']:
    print(f'  {k}: {tagc[k]} ({tagc[k]*100/250:.0f}%)')
n25fam=sum(1 for c in cards if c['grammarNode']=='node-25' and 'family' in c['tags'])
n26fam=sum(1 for c in cards if c['grammarNode']=='node-26' and 'family' in c['tags'])
print('family node-25:',n25fam,'node-26:',n26fam)
