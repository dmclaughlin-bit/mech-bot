import json,sys,glob,csv,collections
S=sys.argv[1]; tag=sys.argv[2]
def ep_outcome(kills, death, eid, t1):
    kt=[t for t,i in kills if i==eid and t1-0.01<=t<=t1+10]
    dt = death if death is not None and t1-0.01<=death<=t1+10 else None
    if kt and (dt is None or kt[0]<=dt): return "kill"
    if dt is not None: return "died"
    return "neither"
for pair in (("2000","3000"),("4000","5000")):
    n=0; games_dis=0; games_eval=0
    res=collections.Counter(); allres=collections.Counter(); evals=0; dis=0
    for B in pair:
        deaths={}
        for row in csv.DictReader(open(f"{S}/s/{tag}/{B}.csv")):
            deaths[row["seed"]]=float(row["death_t"]) if row["death_t"] not in ("","None") and float(row["place"])>1 else None
        for f in sorted(glob.glob(f"{S}/s/{tag}/{B}/*.jsonl")):
            n+=1; seed=f.split("/")[-1][:-6]; death=deaths.get(seed)
            kills=[]; eps={}  # key (id,rule,dir) -> list of [t0,t1]
            alleps={}
            for line in open(f):
                try: r=json.loads(line)
                except: continue
                for k in r.get("kills") or []: kills.append((r["t"],k))
                for e in r.get("race") or []:
                    eid,rule,ttk,tb,ttd,d,sv,bv,d3,hp=e; evals+=1
                    key=(eid,rule)
                    L=alleps.setdefault(key,[])
                    if L and r["t"]-L[-1][1]<=2: L[-1][1]=r["t"]
                    else: L.append([r["t"],r["t"],sv])
                    if sv!=bv:
                        dis+=1
                        key=(eid,rule,"sus-yes/burst-no" if sv else "sus-no/burst-yes")
                        L=eps.setdefault(key,[])
                        if L and r["t"]-L[-1][1]<=2: L[-1][1]=r["t"]
                        else: L.append([r["t"],r["t"]])
            if alleps: games_eval+=1
            if eps: games_dis+=1
            for (eid,rule,dr),L in eps.items():
                for t0,t1 in L: res[(rule,dr,ep_outcome(kills,death,eid,t1))]+=1
            for (eid,rule),L in alleps.items():
                for t0,t1,sv in L: allres[(rule,ep_outcome(kills,death,eid,t1))]+=1
    print(f"set {pair[0]}+{pair[1]} n={n}: games with race evals after 60s {games_eval}, with a disagreement {games_dis}; tick evals {evals}, disagreeing {dis}")
    for rule in ("fin","ttk"):
        tot={o:allres[(rule,o)] for o in ("kill","died","neither")}
        print(f"  {rule} all episodes {sum(tot.values())} {tot}")
        for dr in ("sus-yes/burst-no","sus-no/burst-yes"):
            o={x:res[(rule,dr,x)] for x in ("kill","died","neither")}
            print(f"    {dr}: {sum(o.values())} {o}")
