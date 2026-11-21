# Edge-case hazard screen: B103 (ed2cbbd) and Build 104 (60df7c0) vs B80 (28c3acc)

Local only. This is a hazard screen, not a ranking; the site score decides keep or close.
Sat Nov 21 2026. Sim: `/tmp/wild-sim/run.ts` (a copy of `tools/sim`, changed only to read `SEED_BASE` from the environment; no sim logic changed).
Builds ran unmodified through a wrapper outside the repo (`/tmp/stress-harness/wrap-<build>.ts`) that times `brain.act` and records each decision's output and position.
Build 104 branch `origin/build-104-droprun-on` existed (60df7c0: B80 + P-D-001 `DROP_RUN_M` = 150).

## Runs
12 sim runs = 3 builds x 4 seed sets: SEED_BASE 0, 5000, 9000 (96 seeds each) and 2147483600 (48 seeds, crosses 2^31; the CLI accepted it). 336 matches per build. Plus 3 single-seed reproduction runs of seed 5026 (B103 twice, B80 once).

## Findings
- **No crashes, exceptions, NaN or non-finite outputs, missed answers, answers over 50 ms (sim-side), or "bot not ready"** in any of the 1,008 matches (all three builds, all four sets).
- **Timing (in-process `act`, ms):** B80 max 18.4, worst per-match p99 6.5; B103 max 49.1, worst per-match p99 9.7; Build 104 max 17.7, worst per-match p99 8.2. Mean about 0.14 ms for all.
  - Exactly one tick over 30 ms in 1,008 matches: B103, seed 5026 in the SEED_BASE=5000 run, 49.1 ms. It did not reproduce: two reruns of that seed gave identical matches (2,328 decisions) with max 8.3 and 8.9 ms, and B80 on the seed gave max 8.9 ms. Looks like a machine spike (GC or load), not a code path. B103 also had a cluster of 8 ticks over 10 ms on seed 5091 (max under 20 ms), the only seed with more than 3.
  - Per-tick p99 across all ticks was not stored; only per-match p99 and max were.
- **Stuck on geometry (pinned: commanded move > 0.3 but under 3 m of displacement for 10 s windows)** happens in B80 and both new builds on the same seeds: 11 matches with 20 s or more pinned in zone per build over the 4 sets (B104 10), up to about 50 s (B103 seed 16: 49 s; B80 34 s).
  - Pinned outside the zone, i.e. zone escape not making progress: B80 4 matches, B103 5, B104 5. Examples: SEED_BASE=0 seed 92 pinned 57 s outside the zone (all three builds; died to the zone at 144 s with gun only); 5000 seed 5025 and 9000 seed 9053 (all three builds, zone deaths).
  - Build 104 new vs B80: seed 5054 (SEED_BASE 5000). B80 survived to 309.7 s; Build 104 was pinned outside the zone at (-170, 130.8) from about 240 s and died to the zone at 258.7 s (place 14 to 12). Drop-run mode is not visible from this harness, so I do not know if the drop run caused the divergence; the pin is the same pre-existing zone-escape pin.
  - B103 new vs B80: seed 3 (SEED_BASE 0) pinned outside the zone at (-183.2, 53.2) from 170 s (HP 1257 to 142), died to a mortar at 195 s; B80 died at 248 s.
- **Zone deaths:** B80 3, B103 3, Build 104 4 (the extra is 5054 above).
- **Oscillation (>120 m of path with <15 m net displacement in 20 s):** B80 28, B103 27, Build 104 29 matches, nearly the same seeds. New: B103 seed 12 (SEED_BASE 0); Build 104 seed 2147483636. Gone: B103 seeds 9063 and 2147483615. Treat as noise-level.
- **Never fired / never armed:** every match fired at least once in every build. "Gun only at end" was 126 of 336 for each build, identical seeds, including early deaths and unarmed spawns: baseline behavior, not new.
- **Early deaths (under 20 s):** 11 per build, same seeds (0: 32, 40, 77, 81; 5000: 5012, 5031, 5064; 9000: 9012, 9085; 2147483600: 2147483610, 2147483637).
- **How often the new features engage:** rows identical to B80 (score, death time, kills, damage) in 88 to 90 of 96 seeds for B103 and 91 of 96 for Build 104 on the 96-seed sets; 45 of 48 and 46 of 48 on the extreme set. Both changes are rare in the sim.

## Verdict (hazards only)
Neither build introduces a crash, a timeout over the sim's budget, or a new class of stuck behavior. The pre-existing B80 hazards (pinned geometry, zone-escape pins ending in zone deaths) carry over unchanged to both. One B103 timing spike was not reproducible. One new Build 104 zone death (5054) is the same zone-escape pin class as B80's; worth a look at the drop-run mode there if a trace becomes available.

Files: `/tmp/stress-screens.csv` (columns chosen here; `coord/data/screens.csv` does not exist on origin/main or any branch), per-match logs in `/tmp/stress-logs/<build>/`, run CSVs `/tmp/stress-<build>-<seedbase>.csv`.
