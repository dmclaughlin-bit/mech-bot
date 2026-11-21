import json,glob,sys,collections
S=sys.argv[1]
loot_eps=[];lowammo_starts=0;starts=0;lit_ticks=0;lit_bins=collections.Counter();lit_fire=0
cover_lowammo=0; cover_ticks=0
for f in glob.glob(f"{S}/i*/*.jsonl"):
    L=[json.loads(x) for x in open(f)]
    ep=None; last_fire=-99
    for i,d in enumerate(L):
        if d['m']=='loot':
            if ep is None: ep={'t0':d['t'],'w0':d['w'],'n':0}
            ep['n']+=1
        elif ep is not None:
            ep['w1']=d['w']; loot_eps.append(ep); ep=None
        if d['gunFire']:
            if d['t']-last_fire>3:
                starts+=1
                if 0<=d['gunAmmo']<=6: lowammo_starts+=1
            last_fire=d['t']
        if d['tgt'] and not d['tclear'] and d['gunHeld']:
            cover_ticks+=1
            if 0<=d['gunAmmo']<=6 and d['gunRl']<=0: cover_lowammo+=1
        if 'lightning' in d['w'] and d['tgt'] and d['tclear']:
            lit_ticks+=1; b=min(d['td']//15*15,150); lit_bins[b]+=1
            li=d['w'].split('+').index('lightning')
            if d['fire'][li]: lit_fire+=1
got=sum(1 for e in loot_eps if e.get('w1')!=e['w0'])
print("loot episodes",len(loot_eps),"ended with weapon change",got,"ticks",sum(e['n'] for e in loot_eps), "long(>5s) no gain",sum(1 for e in loot_eps if e['n']>50 and e.get('w1')==e['w0']))
print("gun fight starts",starts,"with <=6 rounds",lowammo_starts)
print("target behind cover ticks",cover_ticks,"with <=6 rounds and not reloading",cover_lowammo)
print("lightning held, clear target ticks",lit_ticks,"lightning firing",lit_fire)
print(" target distance bins (m):",sorted(lit_bins.items()))
