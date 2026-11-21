import json,sys,glob,csv,math,collections
S=sys.argv[1]; tag=sys.argv[2]
T={"to next circle":"zone","laser rush":"laser/lightning","drop, run":"drop","loot":"loot","farm, pickup":"cube","farm, hunt":"cube hunt","engage, collect":"kill cubes"}
def legs_of(rows):
    legs=[]; cur=None
    for i,r in enumerate(rows):
        ok = r.get("m") in T and r["hp"]>=0.9 and r.get("eng") is None
        g = (r.get("lt") if r.get("m")=="loot" else r.get("rg")) if ok else None
        if ok and g and cur and cur["m"]==r["m"] and math.dist(cur["g"],g)<=10 and i==cur["i1"]+1:
            cur["i1"]=i; cur["g"]=g
        else:
            if cur: legs.append(cur)
            cur={"m":r["m"],"i0":i,"i1":i,"g":g} if ok and g else None
    if cur: legs.append(cur)
    return legs
for pair in (("2000","3000"),("4000","5000")):
    n=0; tot=collections.Counter(); bym=collections.defaultdict(collections.Counter); games=collections.Counter(); legn=collections.Counter()
    for B in pair:
        info={r["seed"]:r for r in csv.DictReader(open(f"{S}/s/{tag}/{B}.csv"))}
        for f in sorted(glob.glob(f"{S}/s/{tag}/{B}/*.jsonl")):
            n+=1; seed=f.split("/")[-1][:-6]; row=info[seed]
            death=float(row["death_t"]) if row["death_t"] else None
            rows=[]
            for line in open(f):
                try: rows.append(json.loads(line))
                except: pass
            flags=set()
            for L in legs_of(rows):
                rs=rows[L["i0"]:L["i1"]+2]  # include next tick for last step
                if len(rs)<2: continue
                g=L["g"]; ws=rs[0]["ws"]; obj=T[L["m"]]
                dur=rs[-1]["t"]-rs[0]["t"]
                d0=math.dist((rs[0]["x"],rs[0]["y"]),g); d1=math.dist((rs[-1]["x"],rs[-1]["y"]),g)
                prog=max(0,d0-d1); ideal=prog/ws; delay=max(0,dur-ideal)
                c=collections.Counter()
                for a,b in zip(rs,rs[1:]):
                    dt=b["t"]-a["t"]; step=math.dist((a["x"],a["y"]),(b["x"],b["y"]))
                    da=math.dist((a["x"],a["y"]),g); db=math.dist((b["x"],b["y"]),g); p=da-db
                    lost=dt-p/ws
                    if a["mv"]<0.05: c["stop (no move chosen)"]+=lost
                    elif a["spd"]<1: c["blocked/stuck"]+=lost
                    elif a["mv"]<0.95: c["silent cap"]+=lost
                    else:
                        c["below walk speed (accel/turn/slope)"]+=dt-step/ws
                        c["off-line (detour/turning)"]+=(step-p)/ws
                    c["replans"]+=a.get("rpl",0); c["boost ticks"]+=a.get("bo",0); c["ticks"]+=1
                legn[obj]+=1; bym[obj]["delay_s"]+=delay; bym[obj]["dur_s"]+=dur; bym[obj]["ideal_s"]+=ideal
                rl0=rs[0].get("rl",-1)
                if rl0>0 and d0>0: bym[obj]["detour_m"]+=max(0,rl0-d0)
                for k,v in c.items(): tot[k]+=v; bym[obj][k]+=v
                tend=rs[-1]["t"]
                late=False
                if obj=="zone":
                    late=any(r["iz"]==0 for r in rows[L["i1"]:L["i1"]+30])
                    if late:
                        out=0
                        for r in rows[L["i1"]:]:
                            if r["iz"]==0: out+=0.1
                            elif out>0: break
                        if delay>=out: flags.add("zone: delay>=time outside")
                elif obj=="drop":
                    if delay>=1 and int(row.get("drop_house",0))>0 and int(row.get("drop_claims",0))==0: flags.add("drop: delayed run, house took a drop, we took none")
                    late=not any(r.get("dropEv") for r in rows[L["i0"]:L["i1"]+100])
                elif obj=="laser/lightning":
                    w0=rs[0]["w"]; late=not any(r["w"]!=w0 for r in rows[L["i1"]:L["i1"]+50])
                died = death is not None and tend<=death<=tend+20
                if late: flags.add("late"); bym[obj]["late legs"]+=1
                if died: flags.add("died20"); bym[obj]["death<=20s legs"]+=1
                if delay>=1 and late: flags.add("late&delay>=1s"); bym[obj]["late&delay>=1s"]+=1
                if delay>=1 and died: flags.add("died&delay>=1s"); bym[obj]["died&delay>=1s"]+=1
                if delay>=1 and (late or died): flags.add("changed?")
            for k in flags: games[k]+=1
    print(f"\n=== {pair[0]}+{pair[1]} n={n}")
    print(" lost seconds by source (all legs):", {k:round(v,1) for k,v in tot.items()})
    for o,c in sorted(bym.items(), key=lambda x:-x[1]["delay_s"]):
        print(f" {o}: legs {legn[o]}", {k:round(v,1) for k,v in c.items()})
    print(" games:", dict(games))
