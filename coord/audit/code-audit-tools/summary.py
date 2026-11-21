# Summarize the per-game CSVs: python3 summary.py <dir with {b80,hq,sc,lt,lc,rl,zc}-{2000,3000}.csv>
import csv,sys,math,statistics as st,os
D=sys.argv[1] if len(sys.argv)>1 else "."
def load(p):
    R={}
    for B in (2000,3000):
        for r in csv.DictReader(open(os.path.join(D,f"{p}-{B}.csv"))): R[int(r['seed'])]=r
    return R
f=lambda r,k:float(r[k]) if r[k] else 0.0
A=load('b80')
print("score-kills mean %.3f, games score==kills %d/192, corr %.3f"%(st.mean(f(r,'score')-f(r,'kills') for r in A.values()),sum(f(r,'score')==f(r,'kills') for r in A.values()),st.correlation([f(r,'kills') for r in A.values()],[f(r,'score') for r in A.values()])))
L=[r for r in A.values() if r['death_t']]
for lo,hi in [(0,40),(40,60),(60,120),(120,240),(240,480)]:
    S=[r for r in L if lo<=f(r,'death_t')<hi]
    print(f"died {lo}-{hi}s: {len(S)} games, score {st.mean(f(r,'score') for r in S):.2f}, kills/min {sum(f(r,'kills') for r in S)/sum(f(r,'death_t') for r in S)*60:.2f}")
print("variant,mean,delta,se,changed,better,worse,died<40,laser_end,lightning_end,gun_only_end,cubes,kills")
for p in ['b80','hq','sc','lt','lc','rl','zc']:
    if not os.path.exists(os.path.join(D,f"{p}-2000.csv")): continue
    B=load(p);dd=[f(B[s],'score')-f(A[s],'score') for s in A];V=B.values()
    print(p,f"{st.mean(f(r,'score') for r in V):.3f}",f"{st.mean(dd):+.3f}",f"{st.stdev(dd)/math.sqrt(len(dd)):.3f}",sum(1 for x in dd if x),sum(x>0 for x in dd),sum(x<0 for x in dd),
      sum(1 for r in V if r['death_t'] and f(r,'death_t')<40),sum('laser' in r['weapons'] for r in V),sum('lightning' in r['weapons'] for r in V),sum(r['weapons']=='gun' for r in V),sum(int(r['cubes']) for r in V),sum(int(r['kills']) for r in V),sep=',')
