#!/bin/bash
# usage: replay.sh <bot.ts> <out>; feeds the kit stream one line at a time, waits for each answer
python3 - "$1" "$2" <<'PY'
import gzip,json,subprocess,sys,os
p=subprocess.Popen(["bun",sys.argv[1]],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,cwd=os.path.dirname(sys.argv[1]),bufsize=1)
lines=gzip.open('/tmp/claude-0/kit/mechfight-kit/check/stream.jsonl.gz','rt').read().splitlines()
out=[]
h=json.loads(lines[0]); h['map']['dir']='/tmp/claude-0/kit/mechfight-kit/arena'
p.stdin.write(json.dumps(h)+"\n"); p.stdin.flush()
while True:
    l=p.stdout.readline()
    if json.loads(l).get('type')=='ready': break
for l in lines[1:]:
    o=json.loads(l)
    if o.get('type')!='obs': continue
    p.stdin.write(l+"\n"); p.stdin.flush()
    while True:
        a=json.loads(p.stdout.readline())
        if a.get('tick')==o['tick']: break
    a.pop('debug',None); out.append(json.dumps(a,sort_keys=True))
p.kill(); open(sys.argv[2],'w').write("\n".join(out))
PY
