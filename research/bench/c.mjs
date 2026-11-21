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
const g=new Float32Array(nx*ny),came=new Int32Array(nx*ny),stamp=new Uint32Array(nx*ny);let S=0;const q=new FlatQueue();
const DX=[1,-1,0,0,1,1,-1,-1],DY=[0,0,1,-1,1,-1,1,-1],DC=[1,1,1,1,Math.SQRT2,Math.SQRT2,Math.SQRT2,Math.SQRT2];
function astar(s,e,maxExp=1e9){S++;q.clear();const ex=e%nx,ey=(e/nx)|0;g[s]=0;stamp[s]=S;came[s]=-1;q.push(s,0);let n=0;
 while(q.length){const i=q.pop();if(i===e)return n;if(++n>maxExp)return -n;const x=i%nx,y=(i/nx)|0,gi=g[i];
  for(let d=0;d<8;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=nx||Y>=ny)continue;const j=Y*nx+X;if(B[j])continue;
   if(d>=4&&(B[y*nx+X]||B[Y*nx+x]))continue;const ng=gi+DC[d];if(stamp[j]===S&&ng>=g[j])continue;stamp[j]=S;g[j]=ng;came[j]=i;
   const ax=Math.abs(X-ex),ay=Math.abs(Y-ey);q.push(j,ng+Math.max(ax,ay)+0.4142*Math.min(ax,ay));}}return -n;}
function bench(name,f){for(let k=0;k<5;k++)f(pairs[k]);const ts=[];for(const p of pairs){const t=performance.now();f(p);ts.push(performance.now()-t);}ts.sort((a,b)=>a-b);
 console.log(name,'median',ts[25].toFixed(2),'p90',ts[45].toFixed(2),'max',ts[49].toFixed(2),'ms');}
for(const p of pairs.slice(0,5)){const t=performance.now();const n=astar(p[0],p[1]);console.log(n,(performance.now()-t).toFixed(1));}
