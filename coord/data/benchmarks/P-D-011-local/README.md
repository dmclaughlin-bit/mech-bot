# P-D-011-local: #133 path-search shortcut, this machine (Sim Tester)

**Clean timing result: a full 384-game screen is 2.59× faster, 207.1 s → 79.9 s, with the same games. 384/384 final results match on the clean timing run, on the trace run, and on an isolated rerun of seed 4085. 384/384 full per-tick traces match.**

A earlier timing run (7:04 PM ET) is kept only as a load-contaminated record: B's base-5000 set was inflated to 42.2 s (vs 22.2 s when rerun quieter). That run also showed one final-result mismatch, seed 4085, which did **not** reproduce on the clean run or on isolated reruns of both versions.

## Setup
- Hardware: this box, Intel Xeon, 8 cores (`nproc=8`, 1 thread per core), `--jobs 4` for the 96-game sets, `--jobs 1` for the isolated 4085 reruns.
- Bot: champion bot code `6182d29`, unmodified (`/tmp/sim-6182d29/bot.ts`).
- Sim base: origin/main `4fac1f3fad42e5136cbe6c450b4271b503e19bf7`. **Current (A)** = that sim. **Shortcut (B)** = the same, plus only #133 item 1 in `tools/sim/geom.ts` (`shortcut-geom.diff`): label the coarse grid's connected components once (8 neighbours, no corner cutting) and return `null` from `findPath` when start and goal cells are in different components. Nothing else from #133. Separate worktrees `/tmp/bench-A` and `/tmp/bench-B`. The live tester worktree was not modified.
- Both copies get the same `run.ts` bench patch (`bench-run-ts.diff`): `SEED_BASE` from env, and optional `SIM_HASH_DIR` per-tick traces. Hashing is off in the timing runs.
- Seeds: 2000+3000 and 4000+5000, 96 per base (384 total).
- Trace: after every tick, a hash of tick, all 16 mechs (id, alive, pos, vel, hp, energy, cubes, weapons, kills), our action, the death count, and drop holder/taken state. `trace-sha256/` lists one SHA-256 per game trace file.
- Order (clean run): current timing → shortcut timing → current trace → shortcut trace, back to back, then isolated 4085 on both versions (`times.txt`).

## Wall clock — clean timing run (no trace)

Started Saturday, Nov 21, 2026, 7:15:17 PM ET. Load at start: 0.80 / 4.89 / 5.25. No other sims at start (Xvfb and a Claude process ~11% CPU only). Ended B at 7:20:04 PM ET, load 9.59 / 6.80 / 5.91 — other agents' P30 sims came up during B and raised the 1-minute load from 5.08 at the start of B to 9.59 at the end. B's base 5000 was still 22.2 s, not the contaminated 42.2 s.

| | Current (A) | Shortcut (B) | Speed-up |
|---|---|---|---|
| 2000 (96) | 40.2 s | 18.0 s | 2.24× |
| 3000 (96) | 63.3 s | 18.8 s | 3.37× |
| 4000 (96) | 60.3 s | 20.9 s | 2.88× |
| 5000 (96) | 43.3 s | 22.2 s | 1.95× |
| 2000+3000 (192) | 103.5 s | 36.7 s | 2.82× |
| 4000+5000 (192) | 103.5 s | 43.1 s | 2.40× |
| **Full screen (384), wall** | **207.1 s** | **79.9 s** | **2.59×** |
| Trace runs, full screen (with hashing) | 210.6 s | 82.5 s | 2.55× |

Per-set times above are the sum of the two 96-game base times. The 384-game figures are the recorded wall (`times.txt`), which includes a fraction of a second between bases.

## Wall clock — load-contaminated timing run (kept for honesty, not the adoption figure)

Started 7:04:03 PM ET. Load at start: 1.84 / 3.25 / 3.82, with `/workspace/watch/report.py` at ~100% CPU (not killed). B's base 5000 ran while other agents' P28b sims and `ladder.py` drove load from 8.33 to 15.40. That single set was 42.2 s, about 2× the clean 22.2 s, and pulled the 384-game B wall to 100.7 s.

| | Current (A) | Shortcut (B) | Notes |
|---|---|---|---|
| 2000 | 40.0 s | 18.9 s | |
| 3000 | 66.8 s | 19.1 s | |
| 4000 | 62.0 s | 20.3 s | |
| 5000 | 45.3 s | **42.2 s** | B inflated by load |
| 2000+3000 (192) | 106.8 s | 38.1 s | |
| 4000+5000 (192) | 107.3 s | 62.5 s | B 5000 skews this set |
| **Full screen (384), wall** | **214.1 s** | **100.7 s** | do not use for adoption |

Raw files: `contaminated/times.txt` and `contaminated/csv/`.

## Same games?

| Comparison | Match |
|---|---|
| Final results, clean timing run (every CSV column except `bot_ms_mean` / `late_over_50ms` / `missed` / `bot_ready`) | **384 / 384** |
| Final results, trace (hash) run | **384 / 384** |
| Final results, hash run vs clean timing (each version vs itself) | **384 / 384** |
| Full per-tick traces, hash run (SHA-256 of each game's trace file) | **384 / 384** |
| Isolated seed 4085, both versions (finals and full trace) | both sides match each other and the clean/hash 4085 traces |

**Seed 4085, contaminated timing run only.** On that first run, current (A) was 11th, score 5, 5 kills, death 41.90 s, 419 decisions; shortcut (B) was 12th, score 4, 4 kills, death 35.75 s, 358 decisions. The clean timing run, the hash run, and isolated `--jobs 1` reruns of **both** versions all give B's outcome (12th, score 4, death 35.75 s, 358 decisions). The isolated traces are byte-identical to each other and to both sides of the 384-game hash run (`sha256 f39638f5b32458caaf15b2a0f75cdd6c5d8cd94d54380a69ab2da0714c119032`, 358 tick hashes). The odd result was the current sim under load, not the shortcut. This is the same class of canPlan / wall-clock-budget noise Diego saw on seed 2031. There is no first diverging tick to report from the contaminated 4085 game: that run had tracing off. On every traced rerun the two versions never diverge.

## Files
- `csv/{time,hash}-{current,shortcut}-{2000..5000}.csv`: clean timing and hash-run output.
- `csv/iso-{current,shortcut}-4085.csv`: isolated single-seed reruns.
- `trace-sha256/{current,shortcut}.txt`: SHA-256 of each game's per-tick trace (384 identical lines).
- `times.txt`: seconds per base and run (clean timing, then hash, then iso).
- `contaminated/`: the earlier load-contaminated timing CSVs and times.
- `shortcut-geom.diff` (the change under test) and `bench-run-ts.diff` (bench-only, both sides).

Nothing is merged and the live screening setup is unchanged. Doug decides.
