import json,glob,csv,collections,sys
S=sys.argv[1]
rows={int(r['seed']):r for r in csv.DictReader(open(S+'/rush192.csv'))}
C=collections.Counter(); G=collections.Counter(); ex=collections.defaultdict(list)
def gates(r):
    b=[]
    if not r['slot']: b.append('no slot')
    if not r['inz']: b.append('out of zone')
    if r['leave']: b.append('leaving for circle')
    if r['trip']: b.append('trip')
    if r['engage']: b.append('engage:'+r['engage'])
    if r['claim']: b.append('claim cubes')
    if r['hurt']: b.append('hurt')
    if r['cube']: b.append('cube first')
    if r['hitq'] is not None and r['hitq']<=3: b.append('hit <3s')
    return b
out=[]
for f in sorted(glob.glob(S+'/rush/*.log')):
    seed=int(f.split('/')[-1][:-4]); R=[json.loads(l[5:]) for l in open(f) if l.startswith('RUSH ')]
    row=rows[seed]; dt=float(row['death_t'] or 999)
    has30=any(r['laser'] and r['t']<=30 for r in R)
    sc=int(row['score'])
    if has30: cat='laser by 30'
    elif dt<30 and not any(r['nlaser']>=0 for r in R if r['t']<dt): cat='died <30, never knew a laser'
    else:
        early=[r for r in R if r['t']<=30]
        known=[r for r in early if r['nlaser']>=0]
        if not known: cat='never knew a laser by 30 s'+(' (died <30)' if dt<30 else '')
        else:
            inr=[r for r in known if r['nlaser']<=250]
            if not inr: cat='laser known but >250 m'
            else:
                bl=collections.Counter()
                free=0
                for r in inr:
                    g=gates(r)
                    if not g: free+=1
                    for x in g: bl[x.split(':')[0] if x.startswith('engage') else x]+=1
                top=bl.most_common(1)[0][0] if bl else '-'
                cat=f'laser known <=250 m, blocked' if free< len(inr)*0.5 else 'laser known <=250 m, rush ran but no laser by 30'
                for x,n in bl.items(): G[x]+=n
                ex[cat].append((seed,len(inr),free,dict(bl.most_common(3)),round(min(r['nlaser'] for r in inr)),dt))
    C[cat]+=1; out.append((cat,sc,dt))
print('n',len(out))
for k,v in C.most_common():
    s=[o[1] for o in out if o[0]==k]; d=[o for o in out if o[0]==k and o[2]<40]
    print(f'{v:4d}  {k:50s} mean score {sum(s)/len(s):.2f}  died<40: {len(d)}')
print('gate ticks among blocked/ran games:',G.most_common())
for k,v in ex.items():
    print(k); [print('  ',x) for x in v[:12]]
print('--- sole-blocker ticks in the 49 blocked games, and weapons when no slot')
sole=collections.Counter(); games=collections.Counter(); W=collections.Counter(); hitsole_dist=[]
for seed,*_ in ex['laser known <=250 m, blocked']:
    R=[json.loads(l[5:]) for l in open(f'{S}/rush/{seed}.log') if l.startswith('RUSH ')]
    seen=set()
    for r in R:
        if r['t']>30 or r['nlaser']<0 or r['nlaser']>250: continue
        g=gates(r); g=[x.split(':')[0] for x in g]
        if 'no slot' in g: W[tuple(r['w'])]+=1
        if len(g)==1:
            sole[g[0]]+=1; seen.add(g[0])
            if g[0]=='hit <3s': hitsole_dist.append(r['nlaser'])
    for x in seen: games[x]+=1
print('sole ticks',sole.most_common()); print('games with any sole-blocker tick',games.most_common()); print('weapons on no-slot ticks',W.most_common(5))
import statistics
if hitsole_dist: print('laser dist on hit<3s-only ticks: median',statistics.median(hitsole_dist), 'share<=100m', sum(d<=100 for d in hitsole_dist)/len(hitsole_dist))
