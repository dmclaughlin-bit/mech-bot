import json,csv,sys,statistics as st,math
S=sys.argv[1]; A_,B_=sys.argv[2],sys.argv[3]; sets=sys.argv[4:]
def load(tag):
    G={}
    for b in sets:
        for r in csv.DictReader(open(f'{S}/s/{tag}/{b}.csv')):
            R=[json.loads(l) for l in open(f'{S}/s/{tag}/{b}/{r["seed"]}.jsonl')]
            G[(b,r['seed'])]=(r,R)
    return G
def metrics(G):
    m={}
    m['score']=st.mean(int(r['score']) for r,_ in G.values())
    m['kills']=sum(int(r['kills']) for r,_ in G.values())
    k60=0;t60=0
    for r,R in G.values():
        dt=float(r['death_t'] or 480); k60+=sum(len(x['kills']) for x in R if x['t']>=60); t60+=max(0,dt-60)
    m['kpm60']=60*k60/max(1,t60)
    m['laser30']=sum(any(x['t']<=30 and 'laser' in x['w'] for x in R) for r,R in G.values())
    m['died40']=sum(1 for r,_ in G.values() if r['death_t'] and float(r['death_t'])<40)
    m['gunonly']=sum(r['weapons']=='gun' for r,_ in G.values())
    m['light']=sum('lightning' in r['weapons'] for r,_ in G.values())
    m['att2']=sum(1 for r,R in G.values() if r['death_t'] and R and R[-1]['att']>=2)
    st_g=0
    for r,R in G.values():
        run=0;hit=False
        for x in R:
            if x['mv']>0.5 and x['spd']<1.75: run+=1
            else: run=0
            if run>=10: hit=True
        st_g+=hit
    m['stuck']=st_g
    ms=sorted(x['ms'] for _,R in G.values() for x in R); m['p99']=ms[int(.99*len(ms))]; m['max']=ms[-1]
    m['drops']=sum(int(r['drop_claims']) for r,_ in G.values())
    m['g95']=sum(1 for r,_ in G.values() if float(r['death_t'] or 480)>=95)
    m['dropmodes']=sum(1 for _,R in G.values() for x in R if x['m'].startswith('drop'))
    return m
A=load(A_);B=load(B_);a=metrics(A);b=metrics(B)
d=[int(B[k][0]['score'])-int(A[k][0]['score']) for k in A]
print(f'sets {"+".join(sets)}: sim {a["score"]:.3f} -> {b["score"]:.3f}, delta {st.mean(d):+.3f} ± {st.stdev(d)/math.sqrt(len(d)):.3f}; changed {sum(1 for x in d if x)} (better {sum(x>0 for x in d)} / worse {sum(x<0 for x in d)})')
for k,lab in [('kills','Kills (total)'),('kpm60','Kills per minute after 60 s'),('laser30','Laser by 30 s'),('died40','Died before 40 s'),('gunonly','Gun-only at end'),('light','Lightning at end'),('att2','2+ attackers at death'),('stuck','Stuck >= 1 s (games)'),('p99','Decision p99 ms'),('max','Decision max ms'),('drops','Drops claimed'),('g95','Games reaching 95 s'),('dropmodes','Decision ticks in drop modes')]:
    fa=f'{a[k]:.2f}' if isinstance(a[k],float) else a[k]; fb=f'{b[k]:.2f}' if isinstance(b[k],float) else b[k]
    print(f'| {lab} | {fa} | {fb} |')
