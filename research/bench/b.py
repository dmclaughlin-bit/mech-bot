import json,time,heapq,math,random,sys
import numpy as np, shapely
from shapely import Polygon, STRtree, LineString
W=json.load(open('/tmp/claude-0/kit/mechfight-kit/arena/v2/world.json'))
polys=[]
for p in W['prisms']:
    if p['kind']=='bridge': continue
    r=p['ring']; pts=list(zip(r[::2],r[1::2]))
    try: polys.append(Polygon(pts))
    except Exception: pass
print('polys',len(polys), set(p['kind'] for p in W['prisms']))
b=W['bounds']; C=2.0
nx=int((b['maxX']-b['minX'])/C)+1; ny=int((b['maxY']-b['minY'])/C)+1
t=time.perf_counter()
xs=b['minX']+(np.arange(nx)+.5)*C; ys=b['minY']+(np.arange(ny)+.5)*C
X,Y=np.meshgrid(xs,ys)
pts=shapely.points(X.ravel(),Y.ravel())
tree=STRtree(polys)
idx=tree.query(pts,predicate='within')
blk=np.zeros(nx*ny,bool); blk[idx[0]]=True; blk=blk.reshape(ny,nx)
print('grid',nx,ny,'blocked',blk.mean().round(3),'raster s',round(time.perf_counter()-t,2))
import tcod.path
cost=np.where(blk,0,1).astype(np.int32)
free=np.argwhere(~blk); random.seed(1)
pairs=[(tuple(free[random.randrange(len(free))]),tuple(free[random.randrange(len(free))])) for _ in range(20)]
# tcod A*
g=tcod.path.SimpleGraph(cost=cost,cardinal=2,diagonal=3)
ts=[]
for s,e in pairs:
    t=time.perf_counter(); pf=tcod.path.Pathfinder(g); pf.add_root(s); path=pf.path_to(e); ts.append(time.perf_counter()-t)
print('tcod A* ms max/mean',round(max(ts)*1e3,2),round(sum(ts)/len(ts)*1e3,2),'len',len(path))
t=time.perf_counter(); d=tcod.path.dijkstra2d(np.full(cost.shape,np.iinfo(np.int32).max,np.int32),cost,2,3); 
dist=np.full(cost.shape,np.iinfo(np.int32).max,np.int32); dist[pairs[0][0]]=0; tcod.path.dijkstra2d(dist,cost,2,3)
print('tcod full dijkstra flowfield ms',round((time.perf_counter()-t)*1e3,2))
# pure python heapq A* on flat array, 8-conn octile
F=blk.ravel().tolist()
def astar(s,e):
    sy,sx=s; ey,ex=e; si=sy*nx+sx; ei=ey*nx+ex
    g={si:0.0}; came={si:-1}; op=[(0.0,si)]; N=[(1,0,1),(-1,0,1),(0,1,1),(0,-1,1),(1,1,1.414),(1,-1,1.414),(-1,1,1.414),(-1,-1,1.414)]
    while op:
        f,i=heapq.heappop(op)
        if i==ei: break
        y,x=divmod(i,nx); gi=g[i]
        for dx,dy,c in N:
            X2=x+dx;Y2=y+dy
            if X2<0 or Y2<0 or X2>=nx or Y2>=ny: continue
            j=Y2*nx+X2
            if F[j]: continue
            ng=gi+c
            if ng<g.get(j,1e18):
                g[j]=ng;came[j]=i
                ddx=abs(X2-ex);ddy=abs(Y2-ey)
                heapq.heappush(op,(ng+max(ddx,ddy)+0.414*min(ddx,ddy),j))
    return len(g)
ts=[]
for s,e in pairs:
    t=time.perf_counter(); n=astar(s,e); ts.append(time.perf_counter()-t)
print('pure-py A* (2m grid) ms max/mean',round(max(ts)*1e3,1),round(sum(ts)/len(ts)*1e3,1))
# python-pathfinding lib
from pathfinding.core.grid import Grid; from pathfinding.finder.a_star import AStarFinder; from pathfinding.core.diagonal_movement import DiagonalMovement
t=time.perf_counter(); G=Grid(matrix=cost.tolist()); print('pathfinding Grid build s',round(time.perf_counter()-t,2))
ts=[]
for s,e in pairs[:5]:
    G.cleanup(); t=time.perf_counter(); p,r=AStarFinder(diagonal_movement=DiagonalMovement.only_when_no_obstacle,time_limit=60).find_path(G.node(s[1],s[0]),G.node(e[1],e[0]),G); ts.append(time.perf_counter()-t)
print('python-pathfinding A* ms max/mean',round(max(ts)*1e3,1),round(sum(ts)/len(ts)*1e3,1))
# shapely raycast LOS: 100 random segments
segs=[LineString([(random.uniform(-400,400),random.uniform(-250,300)),(random.uniform(-400,400),random.uniform(-250,300))]) for _ in range(1000)]
t=time.perf_counter(); 
for sg in segs[:200]: tree.query(sg,predicate='intersects')
print('shapely LOS per query us',round((time.perf_counter()-t)/200*1e6,1))
t=time.perf_counter(); tree.query(segs,predicate='intersects'); print('shapely LOS vectorized 1000 ms',round((time.perf_counter()-t)*1e3,2))
# grid DDA LOS pure python
def los(a,b):
    (y0,x0),(y1,x1)=a,b; n=max(abs(x1-x0),abs(y1-y0)) or 1
    for k in range(n+1):
        x=x0+(x1-x0)*k//n; y=y0+(y1-y0)*k//n
        if F[y*nx+x]: return False
    return True
t=time.perf_counter()
for s,e in pairs*10: los(s,e)
print('pure-py grid LOS per query us',round((time.perf_counter()-t)/200*1e6,1))
