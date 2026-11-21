import fs from 'fs';
const M=JSON.parse(fs.readFileSync('meta.json'));console.log(M);
const B=new Uint8Array(fs.readFileSync('grid.u8'));console.log(B.length);
let seed=7;const rnd=()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff;
for(let i=0;i<5;i++)console.log(rnd());
