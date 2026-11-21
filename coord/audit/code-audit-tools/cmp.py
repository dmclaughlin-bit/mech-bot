import csv,sys,math
S,a,b=sys.argv[1:4]
def load(p):
    R={}
    for B in (2000,3000):
        for r in csv.DictReader(open(f"{S}/{p}-{B}.csv")): R[int(r['seed'])]=r
    return R
A=load(a);Bb=load(b)
d=[float(Bb[s]['score'])-float(A[s]['score']) for s in A]
n=len(d);m=sum(d)/n;sd=math.sqrt(sum((x-m)**2 for x in d)/(n-1))
print(f"{b} vs {a}: {m:+.3f} ± {sd/math.sqrt(n):.3f}  changed {sum(1 for x in d if x)} better {sum(1 for x in d if x>0)} worse {sum(1 for x in d if x<0)}")
for p,R in ((a,A),(b,Bb)):
    early=sum(1 for r in R.values() if r['death_t'] and float(r['death_t'])<40)
    lit=sum(1 for r in R.values() if 'lightning' in r['weapons']); las=sum(1 for r in R.values() if 'laser' in r['weapons'])
    go=sum(1 for r in R.values() if r['weapons']=='gun')
    print(f"  {p}: mean {sum(float(r['score']) for r in R.values())/n:.3f} died<40 {early} laser {las} lightning {lit} gun-only {go} cubes {sum(int(r['cubes']) for r in R.values())} kills {sum(int(r['kills']) for r in R.values())}")
