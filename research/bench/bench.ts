import { readFileSync } from "fs";
const d = JSON.parse(readFileSync("dims.json","utf8"));
const W = JSON.parse(readFileSync("/tmp/claude-0/kit/mechfight-kit/arena/v2/world.json","utf8"));
function load(f:string){const b=readFileSync(f);return new Float32Array(b.buffer,b.byteOffset,b.byteLength/4);}
const SQ2=Math.SQRT2;
function mkAstar(nx:number,ny:number){
  const N=nx*ny,g=new Float32Array(N),stamp=new Int32Array(N),came=new Int32Array(N),closed=new Int32Array(N);
  let heapK=new Float64Array(1<<20),heapV=new Int32Array(1<<20),gen=0;
  const DX=[1,-1,0,0,1,1,-1,-1],DY=[0,0,1,-1,1,-1,1,-1],DW=[1,1,1,1,SQ2,SQ2,SQ2,SQ2];
  return function(H:Float32Array,cell:number,s:number,goal:number,step:number){
    gen++;let n=0;const gx=goal%nx,gy=(goal/nx)|0;
    const push=(k:number,v:number)=>{if(n>=heapK.length){const a=new Float64Array(n*2);a.set(heapK);heapK=a;const b=new Int32Array(n*2);b.set(heapV);heapV=b;}let i=n++;while(i>0){const p=(i-1)>>1;if(heapK[p]<=k)break;heapK[i]=heapK[p];heapV[i]=heapV[p];i=p;}heapK[i]=k;heapV[i]=v;};
    const pop=()=>{const v=heapV[0];const k=heapK[--n],vv=heapV[n];let i=0;for(;;){let c=2*i+1;if(c>=n)break;if(c+1<n&&heapK[c+1]<heapK[c])c++;if(heapK[c]>=k)break;heapK[i]=heapK[c];heapV[i]=heapV[c];i=c;}heapK[i]=k;heapV[i]=vv;return v;};
    stamp[s]=gen;g[s]=0;push(0,s);let exp=0;
    while(n>0){const c=pop();if(c===goal)break;if(closed[c]===gen)continue;closed[c]=gen;if(++exp>300000)break;const cx=c%nx,cy=(c/nx)|0,hc=H[c],dc=g[c];
      for(let k=0;k<8;k++){const x=cx+DX[k],y=cy+DY[k];if(x<0||y<0||x>=nx||y>=ny)continue;const m=y*nx+x,dh=H[m]-hc;let cost=DW[k]*cell;
        if(dh>step){if(dh>60)continue;cost+=3*dh+10;}const nd=dc+cost;
        if(stamp[m]!==gen||nd<g[m]){stamp[m]=gen;g[m]=nd;came[m]=c;const ex=Math.abs(x-gx),ey=Math.abs(y-gy);push(nd+(Math.max(ex,ey)+(SQ2-1)*Math.min(ex,ey))*cell,m);}}}
    return exp;};
}
let seed=1;const rnd=()=>{seed=(Math.imul(seed,1103515245)+12345)&0x7fffffff;return seed/0x7fffffff;};
for(const [name,f,nx,ny,cell,step] of [["2m","H2.f32",d.nx2,d.ny2,2,2.4],["1m","H1.f32",d.nx,d.ny,1,1.2]] as any){
  const H=load(f),A=mkAstar(nx,ny);const G=readFileSync(f.replace('H','G').replace('f32','u8'));const ts:number[]=[];const es:number[]=[];
  for(let q=0;q<40;){const a=(rnd()*nx*ny)|0,b=(rnd()*nx*ny)|0;if(!G[a]||!G[b])continue;const dd=Math.hypot(a%nx-b%nx,((a/nx)|0)-((b/nx)|0))*cell;if(dd<150||dd>400)continue;q++;
    const t=performance.now();es.push(A(H,cell,a,b,step));ts.push(performance.now()-t);}
  ts.sort((a,b)=>a-b);es.sort((a,b)=>a-b);
  console.log(`${name} A* 150-400m: median ${ts[20].toFixed(1)} ms p90 ${ts[36].toFixed(1)} max ${ts[39].toFixed(1)} (first ${ts.length}) exp median ${es[20]}`);
}
// Dijkstra full field on 2m
{const nx=d.nx2,ny=d.ny2,N=nx*ny,H=load("H2.f32");const D=new Float64Array(N).fill(1e9);
 const t=performance.now();const hk:number[]=[],hv:number[]=[];
 // simple binary heap via arrays
 let n=0;const K=new Float64Array(N*9),V=new Int32Array(N*9);
 const push=(k:number,v:number)=>{let i=n++;while(i>0){const p=(i-1)>>1;if(K[p]<=k)break;K[i]=K[p];V[i]=V[p];i=p;}K[i]=k;V[i]=v;};
 const pop=()=>{const v=V[0],k0=K[0];const k=K[--n],vv=V[n];let i=0;for(;;){let c=2*i+1;if(c>=n)break;if(c+1<n&&K[c+1]<K[c])c++;if(K[c]>=k)break;K[i]=K[c];V[i]=V[c];i=c;}K[i]=k;V[i]=vv;return [k0,v];};
 const s=(ny>>1)*nx+(nx>>1);D[s]=0;push(0,s);const DX=[1,-1,0,0,1,1,-1,-1],DY=[0,0,1,-1,1,-1,1,-1],DW=[1,1,1,1,SQ2,SQ2,SQ2,SQ2];
 while(n>0){const [dc,c]=pop();if(dc>D[c])continue;const cx=c%nx,cy=(c/nx)|0;for(let k=0;k<8;k++){const x=cx+DX[k],y=cy+DY[k];if(x<0||y<0||x>=nx||y>=ny)continue;const m=y*nx+x;const dh=H[m]-H[c];let cost=DW[k]*2;if(dh>2.4){if(dh>60)continue;cost+=3*dh+10;}const nd=dc+cost;if(nd<D[m]){D[m]=nd;push(nd,m);}}}
 console.log(`2m full Dijkstra field ${(performance.now()-t).toFixed(0)} ms`);}
// LOS: spatial hash of prism edges, 8 m buckets
{const t0=performance.now();const B=8,minX=-520,minY=-340,bx=Math.ceil(1080/B),by=Math.ceil(740/B);
 const ex1:number[]=[],ey1:number[]=[],ex2:number[]=[],ey2:number[]=[],eb:number[]=[],et:number[]=[];
 const buckets:number[][]=Array.from({length:bx*by},()=>[]);
 for(const p of W.prisms){for(const r of [p.ring,...p.holes]){const m=r.length/2;for(let k=0;k<m;k++){const x1=r[2*k],y1=r[2*k+1],x2=r[(2*k+2)%r.length],y2=r[(2*k+3)%r.length];const id=ex1.length;ex1.push(x1);ey1.push(y1);ex2.push(x2);ey2.push(y2);eb.push(p.base);et.push(p.top);
   const i0=Math.floor((Math.min(x1,x2)-minX)/B),i1=Math.floor((Math.max(x1,x2)-minX)/B),j0=Math.floor((Math.min(y1,y2)-minY)/B),j1=Math.floor((Math.max(y1,y2)-minY)/B);
   for(let j=Math.max(0,j0);j<=Math.min(by-1,j1);j++)for(let i=Math.max(0,i0);i<=Math.min(bx-1,i1);i++)buckets[j*bx+i].push(id);}}}
 const seen=new Int32Array(ex1.length);let sg=0;
 const los=(ax:number,ay:number,az:number,bx_:number,by_:number,bz:number)=>{sg++;const dx=bx_-ax,dy=by_-ay,dz=bz-az;const L=Math.hypot(dx,dy);const steps=Math.ceil(L/(B*0.5))+1;
   for(let s=0;s<=steps;s++){const t=s/steps;const i=Math.floor((ax+dx*t-minX)/B),j=Math.floor((ay+dy*t-minY)/B);if(i<0||j<0||i>=bx||j>=by)continue;const L2=buckets[j*bx+i];
     for(const e of L2){if(seen[e]===sg)continue;seen[e]=sg;const qx=ex2[e]-ex1[e],qy=ey2[e]-ey1[e];const den=dx*qy-dy*qx;if(den===0)continue;const rx=ex1[e]-ax,ry=ey1[e]-ay;const u=(rx*qy-ry*qx)/den,v=(rx*dy-ry*dx)/den;if(u<0||u>1||v<0||v>1)continue;const z=az+dz*u;if(z>=eb[e]&&z<=et[e])return false;}}return true;};
 console.log(`LOS build ${(performance.now()-t0).toFixed(0)} ms, edges ${ex1.length}`);
 let blocked=0;const N=20000;const rays:number[][]=[];for(let q=0;q<N;q++){const ax=-400+rnd()*800,ay=-250+rnd()*500,ang=rnd()*6.283,r=20+rnd()*180;rays.push([ax,ay,5,ax+r*Math.cos(ang),ay+r*Math.sin(ang),5]);}
 const t=performance.now();for(const r of rays)if(!los(r[0],r[1],r[2],r[3],r[4],r[5]))blocked++;
 console.log(`LOS ${N} rays 20-200m: ${((performance.now()-t)*1000/N).toFixed(1)} us/ray, blocked ${(100*blocked/N).toFixed(0)}%`);}
