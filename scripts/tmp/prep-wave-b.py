import json, glob, collections, math, os, sys
LANGS=['italian','portuguese','german','dutch','swedish']
def band_target(node):
    n=int(node.replace('node-','')) if node and node.startswith('node-') else 1
    if n<=8: return 0.35
    if n<=21: return 0.22
    if n<=27: return 0.12
    return 0.10
summary={}
for lang in LANGS:
    deck=json.load(open(f'src/data/{lang}/deck.json'))
    by_id={str(c['id']):c for c in deck}
    verd={}; foc={}
    for f in sorted(glob.glob(f'docs/tips-wave-b/{lang}-classify-*.json')):
        for r in json.load(open(f)):
            verd[r['id']]=r['verdict']
            if r.get('focus'): foc[r['id']]=r['focus']
    keep=[i for i,v in verd.items() if v=='keep']
    rew=[i for i,v in verd.items() if v=='rewrite']
    survivors=set(keep)|set(rew)
    node_cards=collections.defaultdict(list)
    for c in deck: node_cards[c.get('grammarNode','node-01')].append(str(c['id']))
    node_surv_tips=collections.defaultdict(list)
    for i in survivors:
        t=by_id[i].get('grammar')
        if t: node_surv_tips[by_id[i].get('grammarNode','')].append(t[:100])
    d=f'docs/tips-wave-b/{lang}'; os.makedirs(d,exist_ok=True)
    # rewrite slices
    rin=[{'id':i,'target':by_id[i]['target'],'english':by_id[i]['english'],'node':by_id[i].get('grammarNode',''),'old':by_id[i].get('grammar',''),'focus':foc.get(i,'')} for i in rew]
    SL=46; nsl=math.ceil(len(rin)/SL) if rin else 0
    for s in range(nsl):
        json.dump(rin[s*SL:(s+1)*SL], open(f'{d}/rewrite-{s:02d}.json','w'), ensure_ascii=False, indent=1)
    # fill nodes
    fill_nodes=[]; total_fill=0
    for node,cards in sorted(node_cards.items()):
        surv=[i for i in cards if i in survivors]
        tgt=math.ceil(len(cards)*band_target(node))
        need=max(0,tgt-len(surv))
        if need<=0: continue
        cands=[i for i in cards if i not in survivors]
        pool=cands[:max(60,need*3)]
        json.dump({'node':node,'quota':need,'cards':[{'id':i,'target':by_id[i]['target'],'english':by_id[i]['english']} for i in pool],'existing_tips':node_surv_tips.get(node,[])[:40]}, open(f'{d}/fill-{node}.json','w'), ensure_ascii=False, indent=1)
        fill_nodes.append(node); total_fill+=need
    summary[lang]={'deck':len(deck),'keep':len(keep),'rewrite':len(rew),'rewrite_slices':nsl,'fill_nodes':fill_nodes,'fill_est':total_fill}
    print(f"{lang}: deck {len(deck)} · keep {len(keep)} rewrite {len(rew)} → {nsl} rw-slices + {len(fill_nodes)} fill-nodes (~{total_fill} fills) · target ~{100*(len(keep)+len(rew)+total_fill)/len(deck):.1f}%")
json.dump(summary, open('docs/tips-wave-b/wave-b-plan.json','w'), indent=1)
