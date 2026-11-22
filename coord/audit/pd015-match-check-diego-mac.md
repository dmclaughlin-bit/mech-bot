# P-D-015 Step 1: match check on Diego's Mac (station: diego-mac). Result: NOT an exact match

Run 9:10-9:20 PM ET Sat Nov 21 by Diego's Claude (Remote Control on Diego's Mac).

## Setup
- Mac: M4 Pro, 14 cores (10 performance + 4 efficiency). bun 1.4.5 (local install). `--jobs 10`.
- Sim: plain `d548479` tools/sim; the only change is `SEED_BASE` from env. No shortcut, no trees.
- Build P29 `2e1d036` vs champion B113 `6182d29`, 96 seeds on each of 2000, 3000, 4000, 5000.
- Speed: 15-32 s per 96 games. About **1.4 min per 384-game screen** (81 s build, 84 s champion).

## Numbers vs Sim Tester reference (PR #143 comment 7072375870 / coord/data/screens.csv)

| set | games changed | better/worse | delta | kills base->build | died<40 |
|---|---|---|---|---|---|
| 2000+3000 Mac | 7 | 3/4 | -0.010 ± 0.033 | 647 -> 647 | 56 -> 56 |
| 2000+3000 ref | 8 | 4/4 | +0.031 ± 0.037 | 639 -> 646 | 56 -> 56 |
| 4000+5000 Mac | 12 | 9/3 | +0.083 ± 0.042 | 686 -> 703 | 54 -> 54 |
| 4000+5000 ref | 11 | 7/4 | +0.021 ± 0.028 | 691 -> 698 | 54 -> 54 |

Per base:
- **2000:** behavior differed in 4 games (ref 6), score in 1 (ref 2).
- **3000:** behavior 10 and score 6 match. Better/tied/worse is 3/90/3 (ref 4/90/2).
- **4000:** behavior 13, score 6 and better/tied/worse 4/90/2 all match.
- **5000:** behavior 12 matches. Score differed in 6 games (ref 5), and better/tied/worse is 5/90/1 (ref 3/91/2).

Seed checks:
- 4027 (268.75 / 267.45 s, both 2nd) and 5028 (14 -> 15) match.
- Seed 5036 survives on both sides in the reference, but dies on both here.
- Seed 5053 is a build survivor here, but not in the reference.
- Seed 2002 champion death is 32.00, the comment's "faster-sim" value, not 33.20.
- No missed answers, and every bot was ready.

Not computed: drop-ring arrivals and 20 s+ pauses. The hazard tracer (`hzlib.py` / `haz_an_mode.py`) isn't in the repo.

## Self-consistency
- Champion 3000 and 5000 were re-run with `--jobs 10` and `--jobs 1`. Both were identical to the first run on every non-timing field.
- So the Mac reproduces itself exactly. The differences are between stations, not from load on one machine.

## Likely cause
`brain.ts` plans against a wall-clock budget: `DEADLINE_MS 30`, `PLAN_RESERVE_MS 10`, `performance.now()`. How much planning fits in a tick depends on CPU speed, so a faster machine makes different plans in some games. This is the same mechanism as the known 1/384 fork under load.

Bit-exact matching across stations would need a deterministic budget in sim mode, such as tick-count based. That's a bot change, so it's not done here.

## Status
- Per P-D-015 the station is **not cleared**. No screens were run on it.
- Options for the coordinator and Doug:
  - (a) Accept Mac screens as statistically comparable, not bit-exact. Always screen build and champion on the same station.
  - (b) Keep the Mac for info runs only (P-D-016).
- P-D-016 vs-15-champions (baseline 2e1d036, then P34 c281bf5) runs on the Mac now. P37 was skipped because it's retired.

## v2: trees-on match check (Doug 10:08 PM spec), Sat 2026-11-21 ~10:15 PM ET

**Result: NOT exact. 350 of 384 games match.** Station: diego-mac. No screens run.

Setup
- Sim: sim/trees-screen-patch-v1 at 4b8663e (base 22f72a88d071bc949ccec6dbc9bd535b74844e3b). Patch sha256 7b0e3366bcf183fc4db87b205a2b262092a39ecd9b366cab88662df540d1db64 (matches). Kit world.json sha256 e0302dd4…2445 (matches).
- Bot: plain P34 0e6fadd, no wrapper. `--trees --jobs 4`, 96 seeds per base, bases 2000–5000.
- Machine: Apple M4 Pro, 14 cores (10P+4E), 24 GB, macOS 26.6.2, bun 1.4.5. About 9 s per base. 0 missed answers, 0 answers over 50 ms.

Set totals (Mac vs Sim Tester, PR #147 comment 7073394832)

| | mean | kills | died<40 | survivors |
|---|---|---|---|---|
| 2000+3000 | 3.724 vs 3.750 | 673 vs 678 | 48 = 48 | 2 = 2 |
| 4000+5000 | 4.094 vs 4.099 | 739 = 739 | 38 = 38 | 3 = 3 |

Drop arrivals and 20 s+ pauses were not computed (they need Sim Tester's hazard wrapper).

Per seed: 34 of 384 differ on place / death_t / kills:
2020 2021 2032 2035 2038 2047 2068 2077 3000 3028 3037 3043 3066 3067 3074 3095 4023 4030 4067 4074 4075 4078 4084 5003 5017 5023 5048 5052 5053 5055 5077 5088 5092 5093
- All differences are late: every differing Sim Tester death is at t ≥ 107 s; every death before 100 s matches exactly.
- Examples (Sim Tester → Mac, place/death_t/kills): 2020 9/161.85/7 → 11/239.40/4; 5003 1st/11 → 5/172.30/8; 5017 2/185.30/13 → 1st/14; 2047 182.25 → 181.80.

Repeatability: the 34 seeds rerun with `--jobs 1` gave 34/34 identical to the Mac's `--jobs 4` run and 0/34 matching Sim Tester. The Mac is deterministic; the gap is systematic between stations.

Suspects, in order:
1. Sim Tester's hazard-logging wrapper adds per-tick work inside the bot's 30 ms wall-clock plan budget (brain.ts DEADLINE_MS 30 / PLAN_RESERVE_MS 10).
2. The same wall-clock budget on machines of different speed. Late-only divergence (more path planning) fits both.

Quickest test: Sim Tester runs one base (e.g. 2000) with the plain bot, no wrapper. If it matches the Mac, the wrapper is the cause. A 5 s trace of seed 2020 is saved on the Mac for a side-by-side.

Status: live screens stay on Sim Tester. The Mac is idle and ready.
