## Local #133 A/B (this machine, Sim Tester)

Saturday, Nov 21, 2026, 7:31 PM ET. Champion bot `6182d29`, sim base `4fac1f3`, `--jobs 4`, nproc=8, Intel Xeon. Separate worktrees; live tester setup unchanged. Only #133 item 1 (`geom.ts` component skip).

**Clean run (start 7:15:17 PM ET, load 0.80 / 4.89 / 5.25, no other sims at start): 384/384 finals match, 384/384 full traces match, 207.1 s → 79.9 s (2.59×).**

### Clean timings (use these)

| | Current (A) | Shortcut (B) | Speed-up |
|---|---|---|---|
| 2000 | 40.2 s | 18.0 s | 2.24× |
| 3000 | 63.3 s | 18.8 s | 3.37× |
| 4000 | 60.3 s | 20.9 s | 2.88× |
| 5000 | 43.3 s | 22.2 s | 1.95× |
| 2000+3000 (192) | 103.5 s | 36.7 s | 2.82× |
| 4000+5000 (192) | 103.5 s | 43.1 s | 2.40× |
| **Full 384, wall** | **207.1 s** | **79.9 s** | **2.59×** |
| Trace runs (384, hashing on) | 210.6 s | 82.5 s | 2.55× |

During B, other agents' P30 sims raised load from 5.08 to 9.59. B's base 5000 was still 22.2 s.

### Load-contaminated timings (first attempt, 7:04 PM ET; not the adoption figure)

`report.py` was at ~100% CPU at the start (load 1.84 / 3.25 / 3.82). Other agents' P28b sims and `ladder.py` drove load to 15.40 during B 5000, which took 42.2 s (about 2× the clean 22.2 s).

| | Current (A) | Shortcut (B) |
|---|---|---|
| 2000 / 3000 / 4000 / 5000 | 40.0 / 66.8 / 62.0 / 45.3 s | 18.9 / 19.1 / 20.3 / **42.2 s** |
| 2000+3000 | 106.8 s | 38.1 s |
| 4000+5000 | 107.3 s | 62.5 s (B 5000 inflated) |
| **Full 384, wall** | **214.1 s** | **100.7 s** |

Finals on that run: 383/384. The only mismatch was seed 4085 (A 11th / score 5 / death 41.90 s vs B 12th / score 4 / death 35.75 s).

### Seed 4085 isolation

Isolated `--jobs 1` reruns of **both** versions, plus the clean timing run and the hash run, all agree: 12th, score 4, 4 kills, death 35.75 s, 358 decisions. The isolated traces are byte-identical to each other and to both sides of the 384-game hash run (`sha256 f39638f5b32458caaf15b2a0f75cdd6c5d8cd94d54380a69ab2da0714c119032`). The contaminated A result did **not** reproduce. That was load noise on the current sim (same class as Diego's seed 2031 / `canPlan` wall-clock budget). The contaminated run had tracing off, so there is no first diverging tick from that game; every traced rerun never diverges.

Raw files (including the contaminated CSVs) are in `coord/data/benchmarks/P-D-011-local/` on main. Nothing merged; Doug decides.
