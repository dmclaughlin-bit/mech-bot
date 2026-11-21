import csv,sys,json,statistics as st,math
def load(p,d):
    out={}
    for b in ('2000','3000'):
        for r in csv.DictReader(open(f'/tmp/claude-0/{p}{b}.csv')):
            s=int(r['seed']); L=[json.loads(x) for x in open(f'/tmp/claude-0/{d}/{s}.jsonl')]
            lt=next((x['t'] for x in L if 'laser' in x['w']),None)
            dt=float(r['death_t']) if r['death_t'] else 999
            att=set()
            for x in L:
                if x['t']>dt-5: att|={q[0] for q in x['dmg']}
            hd=sum(q[1] for x in L if x['mode']=='heal' and x['t']<40 for q in x['dmg'])
            out[s]=dict(score=int(r['score']),l30=lt is not None and lt<30,d40=dt<40,gun=r['weapons']=='gun',lend='laser' in r['weapons'],two=dt<999 and len(att)>=2,stuck=sum('stuck' in x['ev'] for x in L),heal=hd,kills=int(r['kills']))
    return out
A=load(sys.argv[1],sys.argv[2]); B=load(sys.argv[3],sys.argv[4])
d=[B[s]['score']-A[s]['score'] for s in A]
print(f"delta {st.mean(d):+.3f} ± {st.stdev(d)/math.sqrt(len(d)):.3f}  changed {sum(x!=0 for x in d)}/{len(d)}  better {sum(x>0 for x in d)} worse {sum(x<0 for x in d)}")
for k in ['l30','d40','gun','lend','two','kills','stuck','heal']:
    print(k, sum(A[s][k] for s in A), '->', sum(B[s][k] for s in B))
