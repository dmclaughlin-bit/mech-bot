import csv,json,sys,statistics as st
S=sys.argv[1]
def load(csvf,d):
    rows={int(r['seed']):r for r in csv.DictReader(open(f'{S}/{csvf}'))}
    out={}
    for s,r in rows.items():
        R=[json.loads(l[5:]) for l in open(f'{S}/{d}/{s}.log') if l.startswith('RUSH ')]
        out[s]=dict(score=int(r['score']),dt=float(r['death_t'] or 999),l30=any(x['laser'] and x['t']<=30 for x in R),w=r['weapons'],kills=int(r['kills']))
    return out
A=load('rush192.csv','rush'); B=load(sys.argv[2],sys.argv[3])
d=[B[s]['score']-A[s]['score'] for s in A]; ch=[x for x in d if x]
n=len(d); se=st.stdev(d)/n**.5
print(f'paired delta {st.mean(d):+.3f} ± {se:.3f} SE; changed {len(ch)}/{n}')
for k,f in [('laser by 30',lambda x:x['l30']),('died<40',lambda x:x['dt']<40),('laser at end',lambda x:'laser' in x['w']),('gun-only at end',lambda x:x['w']=='gun')]:
    print(f'{k}: {sum(map(f,A.values()))} -> {sum(map(f,B.values()))}')
print('kills/match', st.mean(x['kills'] for x in A.values()), '->', st.mean(x['kills'] for x in B.values()))
