import json, time, heapq, random, math, sys
from array import array
K='/tmp/claude-0/kit/mechfight-kit/arena/v2/'
t0=time.perf_counter()
w=json.load(open(K+'world.json'))
T=w['terrain']; nx,ny=T['nx'],T['ny']; mx,my=T['minX'],T['minY']
ter=array('h'); ter.frombytes(open(K+'terrain.i16','rb').read())
print('cells',nx*ny,len(ter))
H=array('f',[v*0.01 for v in ter])
t1=time.perf_counter(); print('load %.0f ms'%((t1-t0)*1e3))
# rasterize prisms by scanline (cell centers at vertex positions)
occ=array('h',[-1])*(nx*ny)
def rings(p):
    yield p['ring']
    for h in p['holes']: yield h
for pi,p in enumerate(w['prisms']):
    if p['kind']=='bridge': continue
    r=p['ring']; ys=r[1::2]
    j0=max(0,int(math.ceil(min(ys)-my))); j1=min(ny-1,int(max(ys)-my))
    edges=[]
    for rg in rings(p):
        n=len(rg)//2
        for k in range(n):
            x1,y1=rg[2*k],rg[2*k+1]; x2,y2=rg[(2*k+2)%(2*n)],rg[(2*k+3)%(2*n)]
            if y1!=y2: edges.append((x1,y1,x2,y2))
    top=p['top']
    for j in range(j0,j1+1):
        y=my+j; xs=[]
        for x1,y1,x2,y2 in edges:
            if (y1<=y)!=(y2<=y): xs.append(x1+(y-y1)*(x2-x1)/(y2-y1))
        xs.sort()
        for a,b in zip(xs[0::2],xs[1::2]):
            i0=max(0,int(math.ceil(a-mx))); i1=min(nx-1,int(b-mx))
            base=j*nx
            for i in range(i0,i1+1):
                c=base+i
                if top>H[c]: H[c]=top; occ[c]=pi
t2=time.perf_counter(); print('rasterize %.0f ms'%((t2-t1)*1e3), 'occupied',sum(1 for o in occ if o>=0))
# blocked-edge: cell blocked if any 4-neighbour step >1.2 upward? keep heights; A* checks step per edge
open('H1.f32','wb').write(H.tobytes())
# 2 m grid: max of 2x2
nx2,ny2=nx//2,ny//2
H2=array('f',[0.0])*(nx2*ny2)
for j in range(ny2):
    for i in range(nx2):
        c=2*j*nx+2*i
        H2[j*nx2+i]=max(H[c],H[c+1],H[c+nx],H[c+nx+1])
open('H2.f32','wb').write(H2.tobytes())
t3=time.perf_counter(); print('coarsen %.0f ms'%((t3-t2)*1e3))
json.dump({'nx':nx,'ny':ny,'nx2':nx2,'ny2':ny2},open('dims.json','w'))
g1=bytes(1 if o<0 else 0 for o in occ); open('G1.u8','wb').write(g1)
g2=bytearray(nx2*ny2)
for j in range(ny2):
    for i in range(nx2):
        c=2*j*nx+2*i
        g2[j*nx2+i]=1 if (occ[c]<0 and occ[c+1]<0 and occ[c+nx]<0 and occ[c+nx+1]<0) else 0
open('G2.u8','wb').write(bytes(g2))
