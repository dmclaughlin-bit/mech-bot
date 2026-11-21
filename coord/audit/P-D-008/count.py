import json,sys,glob,os,collections
S=sys.argv[1]; tag=sys.argv[2]; RUSH_S=float(sys.argv[3])
for pair in (("2000","3000"),("4000","5000")):
    tot=0; c=collections.Counter(); skipwhy=collections.Counter(); kinds=collections.Counter(); lag=[]
    for B in pair:
        for f in sorted(glob.glob(f"{S}/s/{tag}/{B}/*.jsonl")):
            tot+=1; g=set(); first_skip={}
            for line in open(f):
                try: r=json.loads(line)
                except: continue
                for k in r.get("skips") or []:
                    skipwhy[(k["kind"],k["why"])]+=1; first_skip.setdefault(k["id"],k["t"]); g.add("skipped")
                sk=r.get("sk")
                if not sk: continue
                g.add("eligible")  # a skipped id in zone, fits, while gate open
                reach=[x for x in sk if x[3]==1]
                if not reach: continue
                g.add("reach")
                live = r["t"]<RUSH_S or r["w"] in ("gun+-","gun","-+gun","gun+gun")
                if live: g.add("reach_live")
                if r["alt"]==0: g.add("reach_noalt")
                if live and r["alt"]==0:
                    if "rl0" not in g:
                        lag.append(r["t"]-first_skip.get(reach[0][0],r["t"])); kinds[reach[0][1]]+=1
                    g.add("rl0")
            for k in g: c[k]+=1
    print(f"set {pair[0]}+{pair[1]} n={tot}: games w/ skip {c['skipped']}, skipped id eligible again {c['eligible']}, reachable {c['reach']}, reachable+walk could start {c['reach_live']}, reachable+no other option {c['reach_noalt']}, both {c['rl0']}")
    print("  skip reasons", dict(skipwhy), " kinds(first rl0)", dict(kinds), " median lag s", sorted(lag)[len(lag)//2] if lag else None)
