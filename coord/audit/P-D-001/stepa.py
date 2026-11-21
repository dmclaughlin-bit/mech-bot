import json,sys,collections,glob,os,csv,statistics as st
S=sys.argv[1]; sets=sys.argv[2:]
rows={}
for B in sets:
  for r in csv.DictReader(open(f'{S}/m/b80-{B}.csv')): rows[(B,r['seed'])]=r
def L(B,seed): return [json.loads(l) for l in open(f'{S}/m/{B}/{seed}.jsonl')]
n=len(rows); kills=sum(int(r['kills']) for r in rows.values())
print(f'games {n}, kills {kills}, score mean {st.mean(int(r["score"]) for r in rows.values()):.3f}')
# 1 late hunt
g120=0; idle=0; idle_lone=0; games_lone=0; ticks120=0; k120=0; t120=0
for (B,s),r in rows.items():
  R=L(B,s); dt=float(r['death_t'] or 480)
  if dt<120: continue
  g120+=1; any_l=False
  for x in R:
    if x['t']<120: continue
    ticks120+=1
    if x['m'] in ('hold','heal') and x['tg'] is None:
      idle+=1
      if any(k[3]<=150 and k[4]==1 for k in x['known']): idle_lone+=1; any_l=True
    k120+=len(x['kills'])
  t120+=dt-120; games_lone+=any_l
print(f'[1 late hunt] games alive at 120 s: {g120}; decision ticks after 120 s: {ticks120}; hold/heal with no target: {idle} ({100*idle/max(1,ticks120):.0f}%); of those, a lone house mech known within 150 m: {idle_lone} ticks in {games_lone} games; our kills after 120 s: {k120} ({60*k120/max(1,t120):.2f}/min)')
# 2 drops
g95=[r for r in rows.values() if float(r['death_t'] or 480)>=95]
f=lambda k: sum(int(r[k]) for r in g95)
print(f'[2 drops] games reaching 95 s: {len(g95)}; drops landed while alive {f("drop_arrivals")}; we stood in a ring {f("drop_me_in")}; claimed by us {f("drop_claims")} ({f("drop_claims")/max(1,len(g95)):.2f}/game); by house {f("drop_house")}; contested at some point {f("drop_contested")}')
# 3 claim
E=[]
for (B,s),r in rows.items():
  R=L(B,s)
  for i,x in enumerate(R):
    if not x['kills']: continue
    c0=x['cubes']; ep=[]; j=i
    while j<len(R) and (j==i or R[j]['claim']) and R[j]['t']-x['t']<=13: ep.append(R[j]); j+=1
    seen=[y for y in ep if y['cb']==['seen']]; hit=[y for y in ep if y['cb'] and 'hit<2s' in y['cb'] and not y['cg']]
    shape=[y for y in seen if 0<=y['cd']<=12 and y['hp']>=0.6 and y['los']<=1]
    E.append(dict(g=(B,s),gain=max(y['cubes'] for y in ep)-c0,cn=max([y['cn'] for y in ep]+[0]),seen=len(seen)>0,hit=len(hit)>0,blocked=any(y['cb'] and not y['cg'] for y in ep),went=any(y['cg'] for y in ep),shape=len(shape)>0,near=min([y['cd'] for y in ep if y['cd']>=0]+[999])))
z=[e for e in E if e['gain']==0]
print(f'[3 claim] our kills {len(E)}; got >=1 cube within 13 s: {len(E)-len(z)}; got 0: {len(z)}')
print(f'   of all kills: claim blocked on some tick {sum(e["blocked"] for e in E)}; by seen only {sum(e["seen"] for e in E)}; by a hit <2 s {sum(e["hit"] for e in E)}')
print(f'   cubes within 12 m of the kill (max seen in episode): total {sum(e["cn"] for e in E)}, left uncollected on 0-gain kills {sum(e["cn"] for e in z)}')
sh=[e for e in z if e['shape']]
print(f'   0-gain kills that Grok\'s claim shape could reach (seen-only, cubes <=12 m, HP>=60%, <=1 LOS): {len(sh)} in {len(set(e["g"] for e in sh))} games')
for lim in (12,30,60):
  q=[e for e in z if e['seen'] and e['near']<=lim]; print(f'   0-gain, seen-blocked, came within {lim} m of the cubes: {len(q)} kills in {len(set(e["g"] for e in q))} games')
