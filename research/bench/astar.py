import json, time, heapq, random, math
from array import array
d=json.load(open('dims.json'))
def load(f,nx,ny):
    a=array('f'); a.frombytes(open(f,'rb').read()); return a
SQ2=math.sqrt(2)
def astar(H,nx,ny,cell,s,g,step):
    # 8-connected; up-step > step => jet edge (cost penalty), > 60 => blocked
    gx,gy=g%nx,g//nx
    dist={s:0.0}; came={s:-1}
    pq=[(0.0,s)]; exp=0; closed=set()
    nb=[(1,0,1.0),(-1,0,1.0),(0,1,1.0),(0,-1,1.0),(1,1,SQ2),(1,-1,SQ2),(-1,1,SQ2),(-1,-1,SQ2)]
    while pq:
        f,c=heapq.heappop(pq)
        if c==g: break
        dc=dist[c]
        if c in closed: continue
        closed.add(c)
        if exp>300000: break
        exp+=1
        cx,cy=c%nx,c//nx; hc=H[c]
        for dx,dy,w in nb:
            x=cx+dx; y=cy+dy
            if x<0 or y<0 or x>=nx or y>=ny: continue
            n=y*nx+x; dh=H[n]-hc
            cost=w*cell
            if dh>step:
                if dh>60: continue
                cost+=3*dh+10
            nd=dc+cost
            if nd<dist.get(n,1e18):
                dist[n]=nd; came[n]=c
                ex=abs(x-gx); ey=abs(y-gy)
                h=(max(ex,ey)+(SQ2-1)*min(ex,ey))*cell
                heapq.heappush(pq,(nd+h,n))
    return exp
random.seed(1); import sys; NP=int(sys.argv[1])
for name,f,nx,ny,cell,step in [('1m','H1.f32',d['nx'],d['ny'],1.0,1.2)]:
    H=load(f,nx,ny); G=open(f.replace('H','G').replace('f32','u8'),'rb').read()
    pairs=[]
    while len(pairs)<NP:
        a=random.randrange(nx*ny); b=random.randrange(nx*ny)
        if not (G[a] and G[b]): continue
        dd=math.hypot(a%nx-b%nx,a//nx-b//nx)*cell
        if 150<dd<400: pairs.append((a,b))
    ts=[];es=[]
    for a,b in pairs:
        t=time.perf_counter(); e=astar(H,nx,ny,cell,a,b,step); ts.append((time.perf_counter()-t)*1e3); es.append(e)
    ts.sort()
    print(name,"A* ms sorted",[round(x) for x in ts],"exp",sorted(es))
    # full Dijkstra field (zone center) 
    if name=='2m':
        t=time.perf_counter()
        s=(ny//2)*nx+nx//2
        D=array('f',[1e9])*(nx*ny); D[s]=0; pq=[(0.0,s)]
        nb=[(1,0,1.0),(-1,0,1.0),(0,1,1.0),(0,-1,1.0),(1,1,SQ2),(1,-1,SQ2),(-1,1,SQ2),(-1,-1,SQ2)]
        while pq:
            dc,c=heapq.heappop(pq)
            if dc>D[c]: continue
            cx,cy=c%nx,c//nx
            for dx,dy,w in nb:
                x=cx+dx;y=cy+dy
                if 0<=x<nx and 0<=y<ny:
                    n=y*nx+x; nd=dc+w*cell
                    if nd<D[n]: D[n]=nd; heapq.heappush(pq,(nd,n))
        print('2m full Dijkstra field %.0f ms'%((time.perf_counter()-t)*1e3))
