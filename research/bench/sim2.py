import numpy as np
from math import sqrt
rng=np.random.default_rng(2)
for sd in [3,4,5]:
    row=[f'SD{sd}:']
    for n in [16,48,64]:
        se=sd/sqrt(n); row.append(f'n={n} SE {se:.2f} indepMDD {1.96*sqrt(2)*se:.2f} (80%pow {2.80*sqrt(2)*se:.2f})')
    print(' | '.join(row))
# paired: MDD with correlation rho between two submissions' scores on the same seed
for rho in [0,0.5,0.8,0.95]:
    print('rho',rho,'paired MDD n=48 SD4: %.2f'%(1.96*4*sqrt(2*(1-rho))/sqrt(48)))
# Fixed mean, vary SD: 16 rivals series means; we are 0.5 pts behind the favorite, 64 matches
def pwin(gap,sd_us,sd_fav=4,n=64,others=14,R=200000):
    fav=rng.normal(0,sd_fav/8,R); us=rng.normal(-gap,sd_us/sqrt(n),R)
    oth=rng.normal(-1.0,4/8,(R,others)).max(1)   # rest of field 1 pt behind favorite
    return ((us>fav)&(us>oth)).mean()
for gap in [-0.5,0,0.5,1.0]:
    print('gap to favorite %.1f:'%gap, ' '.join('sd%d->P=%.3f'%(s,pwin(gap,s)) for s in [2,3,4,5,6]))
# bimodal example with mean 10: consistent (8-12) vs win-or-die mix
cons=np.clip(rng.normal(10,2.5,10**6),0,15); wod=np.where(rng.random(10**6)<0.62,15,1.85) # mean ~10
print('consistent mean %.2f sd %.2f; win-or-die mean %.2f sd %.2f'%(cons.mean(),cons.std(),wod.mean(),wod.std()))
