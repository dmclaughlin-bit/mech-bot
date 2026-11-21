import gzip,json,time,gc,statistics as st,copy,sys
K='/tmp/claude-0/kit/mechfight-kit/'
L=[l for l in gzip.open(K+'check/stream.jsonl.gz','rt') if l.strip()]
obs=[l for l in L if '"type":"obs"' in l or '"obs"' in l[:30]]
def bench(lines,rep=20):
    ts=[]
    for _ in range(rep):
        for l in lines:
            t=time.perf_counter(); json.loads(l); ts.append(time.perf_counter()-t)
    ts.sort(); f=lambda p: ts[min(len(ts)-1,int(p*len(ts)))]*1e6
    return f(.5),f(.99),ts[-1]*1e6
print('recorded obs n=%d  parse us p50/p99/max = %.1f/%.1f/%.1f'%((len(obs),)+bench(obs)))
# synthetic heavy obs: pad lists to 15 mechs, 40 projectiles, 30 sounds, 40 pickups etc
o=json.loads(obs[-1])
print('keys',list(o.keys()))
for k,v in o.items():
    if isinstance(v,list): print(' ',k,len(v))
big=copy.deepcopy(o)
def pad(k,n):
    if big.get(k): big[k]=(big[k]*n)[:n]
for k,n in [('mechs',15),('projectiles',60),('sounds',40),('pickups',40),('crates',36),('cubes',30),('beams',10),('events',20)]: pad(k,n)
bl=json.dumps(big,separators=(',',':'))
print('heavy synthetic obs bytes',len(bl),' parse us p50/p99/max = %.1f/%.1f/%.1f'%bench([bl],2000))
t=time.perf_counter(); w=json.load(open(K+'arena/v2/world.json')); print('world.json load ms %.1f'%((time.perf_counter()-t)*1e3))
import array
t=time.perf_counter(); a=array.array('h'); a.frombytes(open(K+'arena/v2/terrain.i16','rb').read()); print('terrain.i16 load ms %.1f n=%d'%((time.perf_counter()-t)*1e3,len(a)))
t=time.perf_counter(); g=[[0]*1070 for _ in range(724)]
for y in range(724):
    row=g[y]; base=y*1070
    for x in range(1070): row[x]=a[base+x]>0
print('pure-python 1070x724 grid pass ms %.1f'%((time.perf_counter()-t)*1e3))
# GC pause with big heap
gc.collect(); objs=[{'a':[i,i+1]} for i in range(10**6)]
t=time.perf_counter(); gc.collect(); print('full gc.collect with ~1M dicts ms %.1f'%((time.perf_counter()-t)*1e3))
gc.freeze(); t=time.perf_counter(); gc.collect(); print('gc.collect after gc.freeze ms %.1f'%((time.perf_counter()-t)*1e3))
