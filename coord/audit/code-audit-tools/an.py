import json,glob,sys,collections,csv
S=sys.argv[1]
rows={}
for B in (2000,3000):
    for r in csv.DictReader(open(f"{S}/b80-{B}.csv")): rows[int(r['seed'])]=r
print("mean score", sum(float(r['score']) for r in rows.values())/len(rows), "n",len(rows))
tot=collections.Counter(); games=collections.Counter(); per=collections.defaultdict(float)
quiet_heal_blocked=0; quiet_heal=0; heal_any=0; heal_fire=0; heal_hide=0; heal_hide_ticks=0
supp_las=0; supp_lit=0; gunlead_ok=0; ticks=0; gun_fire=0
charge_moving_zone=0; charge_retreat=0; zone_ticks=0
qh_games=0; qh_blocked_games=0; blocked_kind=collections.Counter()
heal_qd_fire=0
for f in glob.glob(f"{S}/i*/*.jsonl"):
    L=[json.loads(x) for x in open(f)]
    qh=0; qhb=0
    for d in L:
        ticks+=1; tot[d['m']]+=1
        if d['m'].startswith('heal'):
            heal_any+=1
            if d['en']==0 and d['qd']>5:
                quiet_heal+=1; qh+=1
                if d['loot'] or d['fg']:
                    quiet_heal_blocked+=1; qhb+=1
                    blocked_kind['loot' if d['loot'] else ('hunt' if d['fh'] else 'pickup/drop')]+=1
            if d['fire'][0] or d['fire'][1]: heal_fire+=1
            if d['fs'] and d['qd']>5 and (d['fire'][0] or d['fire'][1]): heal_qd_fire+=1
            if d['m']=='heal, hiding': heal_hide+=1
        if d['supp']==1: supp_las+=1
        if d['supp']==2: supp_lit+=1
        if d['gunFire']: gun_fire+=1
        if d['ch'] and d['m'] in ('to next circle','zone escape'): charge_moving_zone+=1
        if d['ch'] and d['m'].startswith('retreat'): charge_retreat+=1
        if d['m'] in ('to next circle','zone escape'): zone_ticks+=1
    if qh: qh_games+=1
    if qhb: qh_blocked_games+=1
print("ticks",ticks)
for k,v in tot.most_common(): print(f"  {k:20s} {v:7d} {v/ticks:.3f}")
print("heal ticks",heal_any,"quiet heal (no enemy, no dmg 5s)",quiet_heal,"games",qh_games)
print("quiet heal with loot/farm goal blocked",quiet_heal_blocked,"games",qh_blocked_games, blocked_kind)
print("heal ticks firing",heal_fire," farm shots during quiet heal",heal_qd_fire, "heal hiding",heal_hide)
print("gun ready+in range+clear but held while laser leads",supp_las," while lightning leads",supp_lit," gun firing ticks",gun_fire)
print("laser charging during zone travel",charge_moving_zone,"of",zone_ticks," during retreat",charge_retreat)
