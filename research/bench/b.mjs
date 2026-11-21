import fs from 'fs';
import FlatQueue from '/tmp/claude-0/jsdeps/node_modules/flatqueue/index.js';
import Flatbush from '/tmp/claude-0/jsdeps/node_modules/flatbush/index.js';
import PF from '/tmp/claude-0/jsdeps/node_modules/pathfinding/index.js';
const M=JSON.parse(fs.readFileSync('meta.json'));const {nx,ny}=M;
const B=new Uint8Array(fs.readFileSync('grid.u8'));
let seed=7;const rnd=()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff;
const free=[];for(let i=0;i<B.length;i++)if(!B[i])free.push(i);
const pairs=[];for(let k=0;k<50;k++)pairs.push([free[(rnd()*free.length)|0],free[(rnd()*free.length)|0]]);
// typed-array A* (octile), hand-rolled reference using flatqueue
const g=new Float64Array(nx*ny),closed=new Uint32Array(nx*ny),came=new Int32Array(nx*ny),stamp=new Uint32Array(nx*ny);let S=0;const q=new FlatQueue();
const DX=[1,-1,0,0,1,1,-1,-1],DY=[0,0,1,-1,1,-1,1,-1],DC=[1,1,1,1,Math.SQRT2,Math.SQRT2,Math.SQRT2,Math.SQRT2];
function astar(s,e,maxExp=1e9){S++;q.clear();const ex=e%nx,ey=(e/nx)|0;g[s]=0;stamp[s]=S;came[s]=-1;q.push(s,0);let n=0;
 while(q.length){const i=q.pop();if(closed[i]===S)continue;closed[i]=S;if(i===e)return n;if(++n>maxExp)return -n;const x=i%nx,y=(i/nx)|0,gi=g[i];
  for(let d=0;d<8;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=nx||Y>=ny)continue;const j=Y*nx+X;if(B[j])continue;
   if(d>=4&&(B[y*nx+X]||B[Y*nx+x]))continue;const ng=gi+DC[d];if(stamp[j]===S&&ng>=g[j])continue;stamp[j]=S;g[j]=ng;came[j]=i;
   const ax=Math.abs(X-ex),ay=Math.abs(Y-ey);q.push(j,ng+Math.max(ax,ay)+0.4142*Math.min(ax,ay));}}return -n;}
function bench(name,f){for(let k=0;k<5;k++)f(pairs[k]);const ts=[];for(const p of pairs){const t=performance.now();f(p);ts.push(performance.now()-t);}ts.sort((a,b)=>a-b);
 console.log(name,'median',ts[25].toFixed(2),'p90',ts[45].toFixed(2),'max',ts[49].toFixed(2),'ms');}
bench('typed A* + flatqueue',p=>astar(p[0],p[1]));
// full-map Dijkstra flow field
const t0=performance.now();S++;q.clear();g[pairs[0][0]]=0;stamp[pairs[0][0]]=S;q.push(pairs[0][0],0);while(q.length){const i=q.pop();const x=i%nx,y=(i/nx)|0,gi=g[i];for(let d=0;d<8;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=nx||Y>=ny)continue;const j=Y*nx+X;if(B[j])continue;const ng=gi+DC[d];if(stamp[j]===S&&ng>=g[j])continue;stamp[j]=S;g[j]=ng;q.push(j,ng);}}
console.log('full Dijkstra flow field ms',(performance.now()-t0).toFixed(1));
// PathFinding.js
const mat=[];for(let y=0;y<ny;y++){mat.push(Array.from(B.subarray(y*nx,(y+1)*nx)));}
const grid=new PF.Grid(nx,ny,mat);
const jps=new PF.JumpPointFinder({diagonalMovement:PF.DiagonalMovement.OnlyWhenNoObstacles});
const ast=new PF.AStarFinder({diagonalMovement:PF.DiagonalMovement.OnlyWhenNoObstacles});
const run=f=>p=>f.findPath(p[0]%nx,(p[0]/nx)|0,p[1]%nx,(p[1]/nx)|0,grid.clone());
let t=performance.now();grid.clone();console.log('PF grid.clone ms',(performance.now()-t).toFixed(1));
bench('PathFinding.js JPS (incl clone)',run(jps));bench('PathFinding.js A* (incl clone)',run(ast));
// flatbush LOS over building edges
const E=new Float64Array(fs.readFileSync('edges.f64').buffer.slice(0));const ne=M.nedges;const fb=new Flatbush(ne);
for(let k=0;k<ne;k++){const a=E[4*k],b=E[4*k+1],c=E[4*k+2],d=E[4*k+3];fb.add(Math.min(a,c),Math.min(b,d),Math.max(a,c),Math.max(b,d));}fb.finish();
function segHit(ax,ay,bx,by){const ids=fb.search(Math.min(ax,bx),Math.min(ay,by),Math.max(ax,bx),Math.max(ay,by));for(const k of ids){const cx=E[4*k],cy=E[4*k+1],dx=E[4*k+2],dy=E[4*k+3];
 const r1=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax),r2=(bx-ax)*(dy-ay)-(by-ay)*(dx-ax),r3=(dx-cx)*(ay-cy)-(dy-cy)*(ax-cx),r4=(dx-cx)*(by-cy)-(dy-cy)*(bx-cx);if(r1*r2<0&&r3*r4<0)return true;}return false;}
const segs=[];for(let k=0;k<2000;k++){const x=-400+rnd()*800,y=-250+rnd()*550,a=rnd()*6.28,L=rnd()*200;segs.push([x,y,x+L*Math.cos(a),y+L*Math.sin(a)]);}
for(const s of segs)segHit(...s);t=performance.now();let h=0;for(const s of segs)h+=segHit(...s);console.log('flatbush LOS us/query',((performance.now()-t)/2000*1000).toFixed(2),'hit frac',h/2000);
