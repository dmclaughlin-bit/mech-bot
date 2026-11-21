# P-D-010 Step A: en-route travel delay (Diego's Claude, Sat Nov 21 6:17 PM ET)

**Answer: healthy, unengaged travel loses about 2.5 s per game, and that delay doesn't decide arrival or survival in ~10/192 games on either set. Zone arrival changes in 6/192 and 2/192 games, drop captures in 0. Delayed legs are not followed by more deaths (12.8% vs 14.0% die within 20 s on 2000+3000, 11.9% vs 14.5% on 4000+5000). So no Step B, and there's no single decision to propose.**

Bot: champion 6182d29 (origin/main bot code) plus a shadow probe (`travel-probe.diff`: position, in-zone, boost, energy, route goal/length/replan flag, loot target, drop events). Same games as plain main: 0/384 changed (score and kills, seed for seed).

## Method
- A **leg** is consecutive decisions with HP ≥ 90%, no engage, a travel mode, and the same goal (within 10 m). Travel modes: `to next circle` (zone), `laser rush` (laser/lightning), `drop, run`, `loot`, `farm, pickup` / `farm, hunt` (cube), `engage, collect` (kill cubes).
- **Ideal** = straight-line progress toward the goal ÷ walk speed. **Delay** = leg time − ideal.
- Each tick's lost time goes to one source: no move chosen; blocked/stuck (speed < 1 m/s while moving); silent cap (move < 95%); or, at full move, *below walk speed* (accel, turning, slopes) plus *off-line* (moving, but not straight at the goal: path detours around buildings and turning).
- **Late**: a zone leg is followed by time outside the circle; a drop run has no capture by us. **Changed**: late or death within 20 s, together with a delay of 1 s or more.

## Results

| | 2000+3000 (n=192) | 4000+5000 (n=192) |
|---|---|---|
| Healthy travel legs / ticks | 1,324 / 21,071 | 1,505 / 24,880 |
| Total delay (all legs) | 487 s (2.5 s/game) | 709 s (3.7 s/game) |
| ...off-line (detours around buildings, turning) | 238 s (47%) | 373 s (51%) |
| ...below walk speed (accel/turn/slope) | 165 s (32%) | 213 s (29%) |
| ...blocked/stuck | 85 s (17%) | 130 s (18%) |
| ...silent cap | 22 s (4%) | 21 s (3%) |
| Replans per travel tick | 14% (3,024) | 13% (3,112) |
| Boost on, share of travel ticks | 0.6% (121) | 0.6% (146) |
| Legs with delay ≥ 1 s | 78 | 126 |
| **Zone: delay ≥ the time we then spent outside** (removing the delay avoids zone damage) | **6 games** | **2 games** |
| Drop: delayed run, house took a drop, we took none | 0 | 0 |
| Late/death with delay ≥ 1 s (upper bound, not causal) | 14 games | 20 games |
| Death within 20 s: legs with delay ≥ 1 s vs < 1 s | 12.8% vs 14.0% | 11.9% vs 14.5% |

Delay by objective (2000+3000; 4000+5000): zone 159 s, 191 s; cubes 123 s, 236 s; laser/lightning 68 s, 48 s; drop run 48 s, 113 s; kill cubes 41 s, 44 s; cube hunt 26 s, 39 s; loot 23 s, 38 s.

## Reading
- Most of the lost time is geometry. Half is the path bending around buildings (zone legs alone add about 7,500 m of path beyond straight-line on each set). Another third is acceleration and turning. Neither is one decision.
- Stuck time is about 0.5 s per game. Grok's Claude is already building mid-game unstuck pathing, so I left it alone.
- We boost on 0.6% of healthy travel ticks; Watcher says top teams boost on 8.1%. But no delayed leg here maps to a missed drop, and only 6/2 games to zone time. Boosting would also spend the energy lightning needs. The arrival evidence doesn't support a boost-on-travel build.
- The upper-bound "changed" counts (14 and 20) are co-occurrence only: legs with ≥ 1 s delay die *less* often within 20 s than legs without.

Reproduce: apply `travel-probe.diff` to main brain.ts (plus the SEED_BASE sim patch), run 96 seeds per base with `INSTR_DIR`, then `python3 count.py <dir> <tag>`.

Recommendation: no Step B, no slot.
