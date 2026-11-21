import json,numpy as np,shapely
from shapely import Polygon,STRtree
W=json.load(open('/tmp/claude-0/kit/mechfight-kit/arena/v2/world.json'))
polys=[];edges=[]
for p in W['prisms']:
    if p['kind']=='bridge': continue
    r=p['ring'];pts=list(zip(r[::2],r[1::2]));polys.append(Polygon(pts))
    for i in range(len(pts)): edges+= [*pts[i],*pts[(i+1)%len(pts)]]
b=W['bounds'];C=2.0;nx=int((b['maxX']-b['minX'])/C)+1;ny=int((b['maxY']-b['minY'])/C)+1
xs=b['minX']+(np.arange(nx)+.5)*C;ys=b['minY']+(np.arange(ny)+.5)*C;X,Y=np.meshgrid(xs,ys)
idx=STRtree(polys).query(shapely.points(X.ravel(),Y.ravel()),predicate='within')
blk=np.zeros(nx*ny,np.uint8);blk[idx[0]]=1;blk.tofile('grid.u8')
np.array(edges,np.float64).tofile('edges.f64');json.dump({'nx':nx,'ny':ny,'minX':b['minX'],'minY':b['minY'],'C':C,'nedges':len(edges)//4},open('meta.json','w'))
print(nx,ny,len(edges)//4)
