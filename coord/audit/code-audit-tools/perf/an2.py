import json,csv,collections,statistics as st
rows={}
for f in ['/tmp/claude-0/i2000.csv','/tmp/claude-0/i3000.csv']:
    for r in csv.DictReader(open(f)): rows[int(r['seed'])]=r
SM=collections.Counter(); stuckm=collections.Counter(); runs=[]
HU=collections.Counter(); early=collections.Counter(); allc=collections.Counter()
dmg_by_mode=collections.Counter(); dmg_by_mode_e=collections.Counter()
tooLong=collections.Counter()
for seed,r in rows.items():
    L=[json.loads(x) for x in open(f'/tmp/claude-0/instr/{seed}.jsonl')]
    dt=float(r['death_t']) if r['death_t'] else 999
    run=0
    for i,x in enumerate(L):
        if 'stuck' in x['ev']: SM[x['mode']]+=1; stuckm[seed]+=1; run+=1
        else:
            if run: runs.append(run)
            run=0
        if 'path_too_long' in x['ev']: tooLong[seed]+=1
        recent=any(L[j]['dmg'] for j in range(max(0,i-20),i+1))
        d=sum(dd[1] for dd in x['dmg'])
        dmg_by_mode[x['mode']]+=d
        if dt<40: dmg_by_mode_e[x['mode']]+=d
        if x['t']<40:
            allc[(x['mode'],recent)]+=1
            if dt<40: early[(x['mode'],recent)]+=1
print('stuck ticks by mode',SM.most_common(8)); print('matches with stuck',len(stuckm),'stuck runs >=10 ticks (1s)',sum(r>=10 for r in runs),'max run',max(runs))
print('top stuck matches',stuckm.most_common(5)); print('path_too_long per match',tooLong)
print('EARLY-DEATH games, t<40, (mode, hit in last 2s) ticks:',early.most_common(12))
tot=sum(dmg_by_mode_e.values()); print('damage taken in early-death games by mode share:',[(k,round(v/tot,2)) for k,v in dmg_by_mode_e.most_common(8)])
tot=sum(dmg_by_mode.values()); print('damage taken all games by mode share:',[(k,round(v/tot,2)) for k,v in dmg_by_mode.most_common(8)])
