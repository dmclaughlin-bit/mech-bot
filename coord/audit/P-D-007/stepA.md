# P-D-007 Step A: late-game kill sources on 4.17 main (Diego's Claude, Sat Nov 21, 4:05 PM ET)

**Sim-only evidence.** Local sim (`tools/sim`), current main `f6f279e` (bot code = `6182d29`, 4.17), 96 games per SEED_BASE.
The probe is a scratch copy of `brain.ts` that writes one JSON line per decision; the bot in the repo is unchanged. On 2000 it matches plain main in 96/96 games (score and kills).
Files: `instrument.diff`, `pd7.py`, `stepA-output.txt`, per-game CSVs.

| | 2000+3000 | Held-out 4000+5000 |
|---|---|---|
| Games / our kills / sim score | 192 / 639 / 3.53 | 192 / 691 / 3.85 |
| Games alive after 60 s / 120 s | 86 / 33 | 99 / 41 |
| **1. No-target ticks after 60 s** | 53% (hold 18.7k, heal 3.1k, to next circle 3.0k) | 59% (hold 25.2k, to next circle 4.4k, heal 4.3k) |
| known enemy within 150 m on those ticks | hold 3%, heal 9%, to next circle 5% | hold 5%, heal 11%, to next circle 11% |
| **2. Our kills after 60 s** | 177; mode: heal 79, engage 32, retreat 24, to next circle 15 | 214; heal 77, retreat 36, engage 34, to next circle 21 |
| our HP at those kills (<35 / 35–70 / ≥70%) | 76 / 51 / 50 | 112 / 53 / 49 |
| **Deaths after 60 s** | 80; mode: retreat 33, to next circle 18, retreat to cover 13, heal 7, zone escape 5 | 94; retreat 39, to next circle 21, heal 16, retreat to cover 9, zone escape 4 |
| LOS on us at death (0/1/2/3+) | 2 / 12 / 15 / 51 | 6 / 15 / 21 / 52 |
| attackers in last 5 s (0/1/2/3+) | 5 / 18 / 29 / 28 | 11 / 29 / 23 / 31 |
| killer (top) | expert gun 19, medium gun 13, hard gun 12 | hard gun 19, expert gun 17, medium gun 12 |
| Kills after 120 s / deaths after 120 s | 36 / 27 (21 of 27 with 3+ LOS) | 44 / 36 (27 of 36 with 3+ LOS) |
| **3. Worst quartile** (score ≤ 2) | 94 games, mean 1.48, median death 39 s, 48 died < 40 s | 86 games, mean 1.38, median death 39 s, 45 died < 40 s |
| First kill (games / median time) | 186 / 16 s; first kill before 60 s and died within 30 s of it: 75 of 176 | 179 / 14 s; 64 of 173 |
| Zone-travel ("to next circle") ticks after 60 s / our kills during them | 6,520 / 15 | 9,642 / 21 |

**4. Gaps, trigger counts (games of 192):**

| Gap | 2000+3000 | 4000+5000 | Family status |
|---|---|---|---|
| G2 died after 60 s with 2+ attackers in the last 5 s | 57 | 54 | cover / crossfire widening: dead |
| G6 died after 60 s while retreating with 2+ LOS | 37 | 39 | retreat route (HYP-019) failed |
| **G5 died after 60 s with zone travel ("to next circle") in the last 5 s** | **28** | **37** | not tested |
| G3 died after 60 s in heal/hold while seen | 7 | 16 | under 10 on 2000+3000 |
| G1 idle ≥ 3 s after 60 s with a lone enemy known within 150 m (late hunt) | 6 | 15 | under 10 on 2000+3000 |

## Reading
- The late game is not starved of targets in the usual sense: 95% of "hold" ticks have no known enemy within 150 m. Late kills come mostly while we heal or retreat at low HP (the squad comes to us), not from hunting.
- Deaths after 60 s are nearly all multi-LOS (3+ LOS in 51 of 80 and 52 of 94). The largest untested pool is **zone travel**: it touches 28 and 37 games, yields almost no kills (15 kills in 6,520 ticks, 21 in 9,642), and ends in a 3+ LOS death.
- **Step B candidate (not built yet; Grok to confirm the family):** one flag on zone-travel timing after 60 s, e.g. `ZONE_EARLY_S`: start the move to the next circle that many seconds earlier, so we arrive before the squad converges on it. The nav route and cover logic stay unchanged. G2/G6 are larger, but they sit in dead families.
