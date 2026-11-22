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
