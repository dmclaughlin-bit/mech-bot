# P-D-001 Step A: B80 instrumentation (Diego's Claude, Sat Nov 21, 12:18 PM ET)

Champion B80 logic (main `9ccc9c3`, bot code unchanged since `28c3acc`), local sim, 96 games per SEED_BASE.
The probe writes one line per decision and does not change behavior: on 2000 and 3000 it matches the committed `coord/audit/code-audit-tools/b80-{2000,3000}.csv` on score in 192/192 games (1 death time differs by a tick).
Files: `instrument.diff` (bot probe plus sim drop counters, scratch only), `stepa.py`, `stepA-output.txt`, and the per-game CSVs with the new `drop_arrivals` / `drop_claims` / `drop_house` / `drop_me_in` / `drop_contested` columns.

| Item | 2000+3000 | Held-out 4000+5000 |
|---|---|---|
| Games / our kills / sim score | 192 / 646 / 3.536 | 192 / 677 / 3.781 |
| **1. Late hunt**: games alive at 120 s | 34 | 41 |
| decision ticks after 120 s in hold/heal with no target | 11,284 of 26,124 (43%) | 23,095 of 39,126 (59%) |
| of those, a lone house mech (no other within 40 m) known within 150 m | 285 ticks in **10 games** | 456 ticks in **12 games** |
| our kills after 120 s | 43 (0.70/min) | 38 (0.45/min) |
| **2. Supply drops**: games reaching 95 s | 52 | 54 |
| drops landed while we were alive | 85 | 104 |
| drops we stood in the ring of / **claimed** | 0 / **0 (0.00 per game)** | 1 / **0 (0.00 per game)** |
| claimed by house / ever contested | 1 / 3 | 0 / 4 |
| **3. Post-kill claim**: kills that gave us ≥ 1 cube within 13 s | 110 of 645 | 109 of 674 |
| kills where the claim was blocked on some tick: by "seen" alone / by a hit < 2 s | 484 / 527 | 513 / 552 |
| cubes within 12 m of our kills: total / left on 0-cube kills | 2,705 / 2,259 | 2,831 / 2,494 |
| 0-cube kills Grok's claim shape reaches (seen only, cubes ≤ 12 m, HP ≥ 60%, ≤ 1 LOS) | **5 kills in 5 games** | **6 kills in 5 games** |
| 0-cube, seen-blocked, we came within 12 / 30 / 60 m of the cubes | 22 in 19 / 67 in 50 / 232 in 126 games | 16 in 14 / 73 in 57 / 214 in 124 games |

## Reading
- **Claim, Grok's shape:** it touches 5 games per set, under the "≈10 of 192" floor in slot rule 6, so it is near-inert as specified. The gap is real (≈ 85% of our kills give no cubes), but the cubes are usually 30 to 60 m away, where we are still seen and still being hit. Widening the radius moves it into the "walk while seen" family that lost before (B94, B53).
- **Late hunt:** the bot idles in 43 to 59% of ticks after 120 s, but a lone house mech is known within 150 m in only 10 to 12 games per set. Kill rate after 120 s is low (0.45 to 0.70 per minute) for lack of targets, not lack of chasing.
- **Supply drops:** we claim **0** drops in 106 games that reach 95 s, against 189 drops landing while we're alive, and house claims are just as rare (1). Farm takes a drop only with no enemy known within 160 m and the drop within 80 m, which is almost never true after 70 s. This is the drop-shape trigger ("B80 claims fewer than about 1 per game reaching 95 s"). It has the largest games-affected count (52 + 54).
- **Caveat:** drops in the sim are a model (`tools/sim/engine.ts` ~609: lands at the next center, a capture stalls with 2+ mechs in the ring). The house bots' interest in drops is invented.

**Step B pick: supply drops** (one flag, `DROP_RUN_M`, 0 = B80), built on `diego/P-D-001-droprun`.
