# P-D-008 Step A: does a skipped laser/lightning come back? (Diego's Claude, Sat Nov 21 5:08 PM ET)

**Answer: rarely. 4/192 games on 2000+3000 and 3/192 on 4000+5000, below the ~10/192 bar, so no Step B (`LASER_SKIP_EXPIRE_S` not built).**

Bot: current main bot code (6182d29, B113 4.17) plus a shadow probe (`laserskip-probe.diff`). The probe adds no behavior: all 384 games match the plain main probe run seed for seed (score and kills, 0/384 changed). Reachability is checked with `nav.path(me.pos, pickup, PATH_BUDGET)` after the action is chosen, cached for 1 s per id.

"Comes back" means: at a decision where the arm-up gate is open (no laser held, free slot or gun-only, in zone, not leaving, no engage/claim/trip, not hurt, quiet), a skipped id passes every option filter (laser, or lightning while gun-only; inside the zone with margin; on the ground; trip fits) **and** nav now finds a path.

| | 2000+3000 (n=192) | 4000+5000 (n=192) |
|---|---|---|
| Games with any skip | 6 | 6 |
| Skipped id eligible again (filters pass) | 6 | 6 |
| ...and now reachable | 4 | 4 |
| ...and a walk could start (t < 45 s or gun-only) | 4 | 4 |
| ...and it is the **only** option (a retry changes the pick) | **4** | **3** |
| Skip reasons | lightning noroute 5, laser noroute 2, laser timeout 1, lightning timeout 1 | laser noroute 7, lightning noroute 1, lightning timeout 1 |
| Median lag skip → reachable again | 2.1 s | 24.9 s |

Notes:
- Skips themselves are rare (6/192 games per set), so the whole lane caps out near 3% of games even if every retry won a laser.
- On 2000+3000 most comebacks are lightning, 2 s after a "noroute" skip: nav found nothing from one spot and a path from the next. A short expiry would retry those, but that is about 2% of games.
- Reproduce: apply `laserskip-probe.diff` to main brain.ts (plus the usual SEED_BASE sim patch), run 96 seeds per base with `INSTR_DIR`, then `python3 count.py <dir> <tag> 45`.

Recommendation: no slot, no build. Moving on to P-D-009.
