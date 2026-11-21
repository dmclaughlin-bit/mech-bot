import numpy as np
rng=np.random.default_rng(1)
# 1) score SD under plausible place distributions
u=np.arange(16); print('uniform pts SD %.2f'%u.std())
# model: pts=16-place; latent-performance FFA model
def series(mus,sigs,n,R=4000):
    k=len(mus); X=mus[None,None,:]+sigs[None,None,:]*rng.standard_normal((R,n,k))
    ranks=X.argsort(-1).argsort(-1)          # 0 = worst -> points = rank (0..15)
    pts=ranks.astype(float)
    return pts.mean(1), pts            # (R,k)
# field: 16 bots, strengths spread
base=np.linspace(-1.5,1.5,16)
m,p=series(base,np.ones(16),64)
print('per-match pts SD by bot (worst,mid,best):',p[...,0].std().round(2),p[...,8].std().round(2),p[...,15].std().round(2))
print('series mean (64) per bot, top3:',m.mean(0)[-3:].round(2),'SE of top:',m[:,15].std().round(2))
print('P(best bot has highest 64-mean):',(m.argmax(1)==15).mean().round(3))
print('P(2nd-best wins):',(m.argmax(1)==14).mean().round(3), ' gap in mean pts 1st vs 2nd:',(m.mean(0)[15]-m.mean(0)[14]).round(2))
# variance question: our bot index 14 (slightly worse) with sigma multiplier
for s in [0.5,1.0,1.5,2.0,3.0]:
    sig=np.ones(16); sig[14]=s
    m,p=series(base,sig,64,3000)
    print('2nd-best sigma x%.1f: mean pts %.2f  per-match SD %.2f  P(win series) %.3f  ; best bot mean %.2f'%(s,m[:,14].mean(),p[...,14].std(),(m.argmax(1)==14).mean(),m[:,15].mean()))
for s in [0.5,1.0,2.0]:
    sig=np.ones(16); sig[15]=s
    m,p=series(base,sig,64,3000)
    print('BEST sigma x%.1f: mean %.2f P(win) %.3f'%(s,m[:,15].mean(),(m.argmax(1)==15).mean()))
# qualifier n=16
m,p=series(base,np.ones(16),16)
print('qualifier n=16: P(best wins) %.3f, SE best %.2f'%((m.argmax(1)==15).mean(),m[:,15].std()))
