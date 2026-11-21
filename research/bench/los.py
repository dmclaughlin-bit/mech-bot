import json,time,math,random
W=json.load(open('/tmp/claude-0/kit/mechfight-kit/arena/v2/world.json'))
B=8;minX=-520;minY=-340;bx=135;by=93
E=[];bk=[[] for _ in range(bx*by)]
for p in W['prisms']:
  for r in [p['ring']]+p['holes']:
    m=len(r)//2
    for k in range(m):
      x1,y1,x2,y2=r[2*k],r[2*k+1],r[(2*k+2)%len(r)],r[(2*k+3)%len(r)];eid=len(E);E.append((x1,y1,x2-x1,y2-y1,p['base'],p['top']))
      for j in range(max(0,int((min(y1,y2)-minY)//B)),min(by-1,int((max(y1,y2)-minY)//B))+1):
        for i in range(max(0,int((min(x1,x2)-minX)//B)),min(bx-1,int((max(x1,x2)-minX)//B))+1): bk[j*bx+i].append(eid)
def los(ax,ay,az,bx_,by_,bz):
  dx=bx_-ax;dy=by_-ay;dz=bz-az;steps=int(math.hypot(dx,dy)/(B*.5))+2;seen=set()
  for s in range(steps+1):
    t=s/steps;i=int((ax+dx*t-minX)//B);j=int((ay+dy*t-minY)//B)
    if not(0<=i<bx and 0<=j<by):continue
    for e in bk[j*bx+i]:
      if e in seen:continue
      seen.add(e);x1,y1,qx,qy,b,tp=E[e];den=dx*qy-dy*qx
      if den==0:continue
      rx=x1-ax;ry=y1-ay;u=(rx*qy-ry*qx)/den;v=(rx*dy-ry*dx)/den
      if 0<=u<=1 and 0<=v<=1 and b<=az+dz*u<=tp:return False
  return True
random.seed(2);R=[]
for _ in range(5000):
  ax=-400+random.random()*800;ay=-250+random.random()*500;a=random.random()*6.283;r=20+random.random()*180;R.append((ax,ay,5,ax+r*math.cos(a),ay+r*math.sin(a),5))
t=time.perf_counter();bl=sum(1 for q in R if not los(*q));print('py LOS %.1f us/ray blocked %d%%'%((time.perf_counter()-t)*1e6/len(R),bl*100//len(R)))
