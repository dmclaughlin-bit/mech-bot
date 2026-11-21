import json,csv,sys,collections as C,statistics as st
S=sys.argv[1]; tag=sys.argv[2]; sets=sys.argv[3:]
G={}
for b in sets:
    for r in csv.DictReader(open(f'{S}/s/{tag}/{b}.csv')):
        G[(b,r['seed'])]=(r,[json.loads(l) for l in open(f'{S}/s/{tag}/{b}/{r["seed"]}.jsonl')])
dt=lambda r: float(r['death_t']) if r['death_t'] else 480.0
band=lambda h: '>=70%' if h>=.7 else ('35-70%' if h>=.35 else '<35%')
base=lambda m: m.split(',')[0].split(' [')[0]
print(f'== {"+".join(sets)}: {len(G)} games, kills {sum(int(r["kills"]) for r,_ in G.values())}, score {st.mean(int(r["score"]) for r,_ in G.values()):.3f}')
for T in (60,120):
    alive=[(r,R) for r,R in G.values() if dt(r)>T]
    idle=C.Counter(); near=C.Counter(); tot=0
    for r,R in alive:
        for x in R:
            if x['t']<T: continue
            tot+=1
            if x['tg'] is None:
                idle[base(x['m'])]+=1
                if any(k[3]<=150 for k in x['known']): near[base(x['m'])]+=1
    print(f'-- after {T} s: {len(alive)} games alive; {tot} decision ticks; no-target ticks {sum(idle.values())} ({100*sum(idle.values())/max(1,tot):.0f}%)')
    for m,n in idle.most_common(6): print(f'     no target, {m:22s} {n:6d} ticks; known enemy <=150 m on {near[m]} ({100*near[m]/n:.0f}%)')
    km=C.Counter(); kl=C.Counter(); kh=C.Counter(); nk=0
    for r,R in alive:
        for x in R:
            if x['t']>=T and x['kills']:
                for _ in x['kills']: nk+=1; km[base(x['m'])]+=1; kl[min(x['los'],3)]+=1; kh[band(x['hp'])]+=1
    print(f'   our kills after {T} s: {nk}; by mode {dict(km.most_common(5))}; by LOS count (3=3+) {dict(sorted(kl.items()))}; by our HP {dict(kh)}')
    dead=[(r,R) for r,R in alive if r['death_t'] and R]
    dm=C.Counter(); dl=C.Counter(); da=C.Counter(); dh=C.Counter(); dk=C.Counter(); seq=C.Counter()
    for r,R in dead:
        x=R[-1]; dm[base(x['m'])]+=1; dl[min(x['los'],3)]+=1; da[min(x['att'],3)]+=1
        b5=[y for y in R if y['t']>=x['t']-5]; dh[band(b5[0]['hp'])]+=1
        dk[(r['killer'].split('#')[0], r['killer_weapon'])]+=1
        s=[]; 
        for y in b5:
            m=base(y['m'])
            if not s or s[-1]!=m: s.append(m)
        seq[' > '.join(s[-3:])]+=1
    print(f'   deaths after {T} s: {len(dead)}; mode at death {dict(dm.most_common(6))}')
    print(f'     LOS at death {dict(sorted(dl.items()))}; attackers in last 5 s {dict(sorted(da.items()))}; our HP 5 s before {dict(dh)}')
    print(f'     killer {dict(dk.most_common(5))}')
    print(f'     last 5 s (last 3 modes) {seq.most_common(5)}')
# 3 downside tail
sc=sorted(int(r['score']) for r,_ in G.values()); q=sc[len(sc)//4]
W=[(r,R) for r,R in G.values() if int(r['score'])<=q]
print(f'-- worst quartile (score <= {q}): {len(W)} games, mean score {st.mean(int(r["score"]) for r,_ in W):.2f}, median death {st.median(dt(r) for r,_ in W):.0f} s, died <40 s {sum(dt(r)<40 for r,_ in W)}, killer {C.Counter(r["killer"].split("#")[0] for r,_ in W).most_common(4)}')
win=[];lose=[]
for r,R in G.values():
    i=next((i for i,x in enumerate(R) if x['m'].startswith('engage') or x['tg'] is not None),None)
    fk=next((x['t'] for x in R if x['kills']),None)
    if fk is None: lose.append(r)
    else: win.append((r,fk))
print(f'-- first kill: {len(win)} games got one (mean score {st.mean(int(r["score"]) for r,_ in win):.2f}, median first kill {st.median(t for _,t in win):.0f} s); {len(lose)} never killed (mean {st.mean(int(r["score"]) for r in lose):.2f})')
aft=[(r,t) for r,t in win if t<60]
print(f'   first kill before 60 s: {len(aft)} games; of them died within 30 s of it {sum(dt(r)-t<30 for r,t in aft)}; mean score {st.mean(int(r["score"]) for r,_ in aft):.2f}')
# 4 gap trigger counts
def games(pred): return sum(1 for r,R in G.values() if pred(r,R))
g1=games(lambda r,R: sum(1 for x in R if x['t']>=60 and x['tg'] is None and base(x['m']) in ('hold','heal') and any(k[3]<=150 and k[4]==1 for k in x['known']))>=30)
g2=games(lambda r,R: r['death_t'] and dt(r)>=60 and R and R[-1]['att']>=2)
g3=games(lambda r,R: r['death_t'] and dt(r)>=60 and R and base(R[-1]['m']) in ('heal','hold') and R[-1]['los']>=1)
g4=games(lambda r,R: r['death_t'] and dt(r)>=60 and R and base(R[-1]['m']).startswith('engage') and R[-1]['los']>=2)
print(f'-- trigger counts (games of {len(G)}): G1 idle >=3 s after 60 s in hold/heal with a lone enemy known <=150 m: {g1}; G2 died after 60 s with 2+ attackers in last 5 s: {g2}; G3 died after 60 s in heal/hold while seen: {g3}; G4 died after 60 s engaging with 2+ LOS: {g4}')
g5=games(lambda r,R: r['death_t'] and dt(r)>=60 and R and any(base(y['m'])=='to next circle' for y in R if y['t']>=R[-1]['t']-5))
g6=games(lambda r,R: r['death_t'] and dt(r)>=60 and R and base(R[-1]['m']) in ('retreat','retreat to cover') and R[-1]['los']>=2)
zk=sum(1 for r,R in G.values() for x in R if x['t']>=60 and base(x['m'])=='to next circle' for _ in x['kills'])
zt=sum(1 for r,R in G.values() for x in R if x['t']>=60 and base(x['m'])=='to next circle')
print(f'   G5 died after 60 s with "to next circle" in the last 5 s: {g5} games; G6 died after 60 s retreating with 2+ LOS: {g6} games; zone-travel ticks after 60 s {zt}, kills during them {zk}')
