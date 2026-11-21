#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <time.h>
static float*H;static unsigned char*G;static int nx,ny;static float*g;static int*st,*cl;static double*hk;static int*hv;static int n,gen;
static void push(double k,int v){int i=n++;while(i>0){int p=(i-1)>>1;if(hk[p]<=k)break;hk[i]=hk[p];hv[i]=hv[p];i=p;}hk[i]=k;hv[i]=v;}
static int pop(){int v=hv[0];double k=hk[--n];int vv=hv[n];int i=0;for(;;){int c=2*i+1;if(c>=n)break;if(c+1<n&&hk[c+1]<hk[c])c++;if(hk[c]>=k)break;hk[i]=hk[c];hv[i]=hv[c];i=c;}hk[i]=k;hv[i]=vv;return v;}
static int astar(float cell,int s,int goal,float step){const int DX[8]={1,-1,0,0,1,1,-1,-1},DY[8]={0,0,1,-1,1,-1,1,-1};const double SQ=1.41421356,DW[8]={1,1,1,1,SQ,SQ,SQ,SQ};
 gen++;n=0;int gx=goal%nx,gy=goal/nx,exp=0;st[s]=gen;g[s]=0;push(0,s);
 while(n>0){int c=pop();if(c==goal)break;if(cl[c]==gen)continue;cl[c]=gen;if(++exp>300000)break;int cx=c%nx,cy=c/nx;float hc=H[c];double dc=g[c];
  for(int k=0;k<8;k++){int x=cx+DX[k],y=cy+DY[k];if(x<0||y<0||x>=nx||y>=ny)continue;int m=y*nx+x;float dh=H[m]-hc;double cost=DW[k]*cell;if(dh>step){if(dh>60)continue;cost+=3*dh+10;}double nd=dc+cost;
   if(st[m]!=gen||nd<g[m]){st[m]=gen;g[m]=nd;int ex=abs(x-gx),ey=abs(y-gy);push(nd+((ex>ey?ex:ey)+(SQ-1)*(ex<ey?ex:ey))*cell,m);}}}return exp;}
int cmp(const void*a,const void*b){double d=*(double*)a-*(double*)b;return d<0?-1:d>0;}
int main(){const char*fs[2]={"H2.f32","H1.f32"},*gs[2]={"G2.u8","G1.u8"};int NX[2]={535,1070},NY[2]={362,724};float C[2]={2,1},S[2]={2.4,1.2};
 for(int r=0;r<2;r++){nx=NX[r];ny=NY[r];int N=nx*ny;H=malloc(N*4);G=malloc(N);FILE*f=fopen(fs[r],"rb");fread(H,4,N,f);fclose(f);f=fopen(gs[r],"rb");fread(G,1,N,f);fclose(f);
  g=malloc(N*4);st=calloc(N,4);cl=calloc(N,4);hk=malloc(8*N*9);hv=malloc(4*N*9);srand(1);double ts[40];int q=0;
  while(q<40){int a=rand()%N,b=rand()%N;if(!G[a]||!G[b])continue;double dd=hypot(a%nx-b%nx,a/nx-b/nx)*C[r];if(dd<150||dd>400)continue;struct timespec t0,t1;clock_gettime(CLOCK_MONOTONIC,&t0);astar(C[r],a,b,S[r]);clock_gettime(CLOCK_MONOTONIC,&t1);ts[q++]=(t1.tv_sec-t0.tv_sec)*1e3+(t1.tv_nsec-t0.tv_nsec)/1e6;}
  qsort(ts,40,8,cmp);printf("C %s A*: median %.2f ms p90 %.2f max %.2f\n",fs[r],ts[20],ts[36],ts[39]);}}
