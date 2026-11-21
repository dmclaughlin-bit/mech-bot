import gzip,json,time
K='/tmp/claude-0/kit/mechfight-kit/'
O=[json.loads(l) for l in gzip.open(K+'check/stream.jsonl.gz','rt') if l.strip()][1:-1]
samp={}
for o in O:
    for k,v in o.items():
        if isinstance(v,list) and v and k not in samp: samp[k]=v[0]
print({k:len(json.dumps(v)) for k,v in samp.items()})
b=dict(O[-1])
for k,n in [('mechs',15),('projectiles',80),('sounds',40),('pickups',40),('crates',36),('cubes',30),('beams',10),('events',20),('drops',3)]:
    if k in samp: b[k]=[samp[k]]*n
s=json.dumps(b,separators=(',',':'))
ts=[]
for _ in range(3000):
    t=time.perf_counter(); json.loads(s); ts.append(time.perf_counter()-t)
ts.sort(); print('worst-case obs %d bytes; parse us p50 %.0f p99 %.0f max %.0f'%(len(s),ts[1500]*1e6,ts[2970]*1e6,ts[-1]*1e6))
print('max obs in stream', max(len(json.dumps(o)) for o in O), 'max alive', max(o['alive'] for o in O), 'ticks', O[0]['tick'], O[-1]['tick'])
