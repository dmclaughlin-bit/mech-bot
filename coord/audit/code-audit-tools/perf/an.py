import json,csv,glob,os,collections,statistics as st
rows={}
for f in ['/tmp/claude-0/i2000.csv','/tmp/claude-0/i3000.csv']:
    for r in csv.DictReader(open(f)): rows[int(r['seed'])]=r
C=collections.Counter(); blockers=collections.Counter(); only=collections.Counter()
ms=[]; out=[]
for seed,r in sorted(rows.items()):
    L=[json.loads(x) for x in open(f'/tmp/claude-0/instr/{seed}.jsonl')]
    died = r['death_t']!=''; dt=float(r['death_t']) if died else 999
    ms+= [x['ms'] for x in L]
    lt=next((x['t'] for x in L if 'laser' in x['w']),None)
    m={'seed':seed,'score':int(r['score']),'dt':dt,'laser_t':lt,'w_end':r['weapons']}
    # blocked ticks t<30 no laser, known laser <=250 straight, not rushing
    blk=collections.Counter(); knew=False; first_known=None
    for x in L:
        if x['t']>=30 or 'laser' in x['w']: continue
        if 0<=x['ld']<=250:
            knew=True; first_known = first_known or x['t']
            if not x['rm'] and x['mode']!='laser rush':
                g=x['g']; rs=[]
                for k,bad in [('slot',not g['slot']),('zone',not g['zone']),('leave',g['leave']),('trip',g['trip']),('engage',g['eng']),('claim',g['claim']),('hurt',g['hurt']),('cubefirst',g['cube']),('hit3s',not g['quiet'])]:
                    if bad: rs.append(k)
                key='+'.join(rs) or 'gate-pass(no-move:path/fit/skip)'
                blk[key]+=1
    m['knew']=knew; m['blk']=blk
    # events
    ev=collections.Counter(e for x in L for e in x['ev']); m['ev']=ev
    # attackers: distinct attacker ids in last 5s before death
    if died:
        last=[x for x in L if x['t']>dt-5]
        att={d[0] for x in last for d in x['dmg']}
        m['att5']=len(att)
        rear=sum(d[1] for x in last for d in x['dmg'] if d[3]); tot=sum(d[1] for x in last for d in x['dmg']) or 1
        m['rearfrac']=rear/tot
    # first damage time; LOS>=2 before first damage
    fd=next((x['t'] for x in L if x['dmg']),None); m['fd']=fd
    m['los2_before_fd']= any(x['los']>=2 for x in L if fd is None or x['t']<fd)
    # first time los>=2 and whether hp was full
    f2=next((x for x in L if x['los']>=2),None); m['los2_t']=f2['t'] if f2 else None; m['los2_hpfrac']=f2['hp']/f2['mhp'] if f2 else None
    # time sequence of attackers: first time 2 distinct attackers within 5s window
    hist=[];two=None
    for x in L:
        for d in x['dmg']: hist.append((x['t'],d[0]))
        ids={i for t,i in hist if t>x['t']-5}
        if len(ids)>=2 and two is None: two=x['t']
    m['two_t']=two
    # engage ticks
    m['eng']=collections.Counter(x['g']['eng'] for x in L if x['g']['eng'])
    m['died_engaged']= died and any(x['g']['eng'] for x in L if x['t']>dt-3)
    m['modes']=collections.Counter(x['mode'] for x in L)
    out.append(m)
json.dump([{**m,'blk':dict(m['blk']),'ev':dict(m['ev']),'eng':dict(m['eng']),'modes':dict(m['modes'])} for m in out],open('/tmp/claude-0/match.json','w'))
N=len(out); print('N',N,'mean',st.mean(m['score'] for m in out))
lb30=[m for m in out if m['laser_t'] is not None and m['laser_t']<30]; print('laser<30',len(lb30),'score',st.mean(m['score'] for m in lb30))
no=[m for m in out if not(m['laser_t'] is not None and m['laser_t']<30)]
print('no laser<30:',len(no),' died<30',sum(m['dt']<30 for m in no),' knew laser<=250 before 30',sum(m['knew'] for m in no))
agg=collections.Counter()
for m in no:
    if m['knew']:
        for k,v in m['blk'].items(): agg[k]+=v
print('blocked tick reasons (t<30, laser known<=250):',agg.most_common(12))
# per match dominant blocker
dom=collections.Counter(m['blk'].most_common(1)[0][0] for m in no if m['knew'] and m['blk'])
print('dominant blocker per match:',dom.most_common())
print('knew but never blocked (rushed but failed):',sum(1 for m in no if m['knew'] and not m['blk']))
d40=[m for m in out if m['dt']<40]; print('died<40',len(d40),'score',st.mean(m['score'] for m in d40) if d40 else 0)
dd=[m for m in out if m['dt']<999]
print('deaths',len(dd),'2+ attackers last5s',sum(m['att5']>=2 for m in dd),' early(<40) 2+',sum(m['att5']>=2 for m in d40))
print('early deaths: LOS>=2 before first damage',sum(m['los2_before_fd'] for m in d40),'/',len(d40))
gaps=[m['dt']-m['two_t'] for m in d40 if m['two_t']]; print('early deaths: time from 2nd attacker to death median',st.median(gaps) if gaps else None, 'n',len(gaps))
gaps2=[m['two_t']-m['fd'] for m in d40 if m['two_t'] and m['fd']]; print('early: first dmg -> 2nd attacker median',st.median(gaps2) if gaps2 else None)
print('early deaths engaged in last 3s',sum(m['died_engaged'] for m in d40),'/',len(d40),' all deaths',sum(m['died_engaged'] for m in dd))
print('early deaths rear dmg frac mean',st.mean(m['rearfrac'] for m in d40))
E=collections.Counter()
for m in out: E.update(m['ev'])
print('nav events total',dict(E),' matches with skip_nopath',sum('skip_nopath' in m['ev'] for m in out),'timeout',sum('skip_timeout' in m['ev'] for m in out),'too_long',sum('path_too_long' in m['ev'] for m in out))
ms.sort(); print('ms p99',ms[int(.99*len(ms))],'max',ms[-1])
MD=collections.Counter()
for m in d40: MD.update(m['modes'])
print('early-death modes',MD.most_common(8))
