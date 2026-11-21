# P-D-011 #133 benchmark: path-search shortcut (Diego's Claude, Sat Nov 21 6:16 PM ET)

**Result: the shortcut makes a complete screen (384 games, both sets) 2.4× faster, 256 s → 108 s, with the same games. 384/384 final results match. 383/384 full per-tick traces match in the run-to-run comparison, and the one exception (seed 2031) is run-to-run noise in the current sim, not the shortcut: three repeat runs of 2031 on the current sim give the shortcut's exact trace.**

## Setup
- Hardware: one machine, Intel Xeon @ 2.10 GHz, 4 cores (cloud container), `--jobs 4` for every run, nothing else running.
- Bot: champion bot code 6182d29 (origin/main `b270ae1`, bot files byte-identical to `8b6e7b2`), unmodified.
- Seeds: 2000+3000 and 4000+5000, 96 per base (n=192 per set).
- **Current** = origin/main sim. **Shortcut** = the same, plus only #133 item 1 in `tools/sim/geom.ts` (`shortcut-geom.diff`): label the coarse grid's connected components once, under the same moves A* uses (8 neighbours, no corner cutting), and return `null` from `findPath` when start and goal cells are in different components. Nothing else from #133 is included.
- Both copies get the same `run.ts` bench patch (`bench-run-ts.diff`): `SEED_BASE` from env, and an optional `SIM_HASH_DIR` per-tick trace. This is off in the timing runs.
- Trace: after every tick, a hash of tick, every mech (ours and all 15 house: id, alive, pos, vel, hp, energy, cubes, weapons, kills), our action, the death count, and drop holder/taken state. One hash per tick per game: 316,084 ticks. `trace-sha256/` lists one SHA-256 per game trace file.
- Order: current timing → shortcut timing → current trace → shortcut trace, back to back (`times.txt`).

## Wall clock (timing runs, no trace)

| | Current | Shortcut | Speed-up |
|---|---|---|---|
| 2000+3000 (192 games) | 128.3 s | 51.4 s | 2.50× |
| 4000+5000 (192 games) | 128.1 s | 56.5 s | 2.27× |
| **Full screen (384)** | **256.4 s** | **107.9 s** | **2.38×** |
| Trace runs, full screen (with hashing) | 266.6 s | 121.5 s | 2.19× |

Per base: current 51.1 / 77.3 / 73.6 / 54.5 s; shortcut 25.6 / 25.8 / 28.0 / 28.5 s. The slow bases for the current sim are those with long games: the time saved is failed searches by house bots chasing goals they can't reach.

## Same games?

| Comparison | Match |
|---|---|
| Final results, timing runs (every CSV column except the wall-clock `bot_ms_mean` / `late_over_50ms`) | **384 / 384** |
| Final results, trace runs | 383 / 384 |
| Full per-tick trace, trace runs | 383 / 384 |

**The one difference: seed 2031.** It first diverges at tick 172 (t = 17.2 s). The current sim's trace run ended 11th, 5 kills, dead at 71.8 s, 718 ticks. The shortcut's ended 1st, 14 kills, 1959 ticks. But the current sim's own timing run of 2031 ended exactly like the shortcut (1st, 14 kills, 1959 ticks). Three more isolated runs of 2031 on the current sim all reproduce the shortcut's trace hash (243c74cc42d7d05d) exactly. So the current sim produced the odd one out, once, under load. The likely cause is the bot's wall-clock planning budget (`canPlan`: plan only while under 20 ms of the 30 ms decision deadline). A loaded CPU can skip one path plan and fork the game. The shortcut cannot change results: A* from one component can never reach another, so it always returned `null` there anyway, and the grid is static (only `loadGeo` writes `blocked`).

Side note for Grok: this shows any sim run can, rarely (about 1 in 384 here), fork a game from CPU load alone, with or without the shortcut. A flag-0 identity check that shows 1 changed game should be re-run before it counts as a real difference.

## Files
- `csv/{time,hash}-{current,shortcut}-{2000..5000}.csv`: raw run.ts output.
- `trace-sha256/{current,shortcut}.txt`: SHA-256 of each game's per-tick trace (383 identical lines; only 2031 differs).
- `times.txt`: seconds per base and run.
- `shortcut-geom.diff` (the change under test) and `bench-run-ts.diff` (bench-only, both sides).

Nothing is merged and the live screening setup is unchanged. Doug decides.
