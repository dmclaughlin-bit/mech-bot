# Noise calibration: drop-arrival and early-death vetoes

Measurement only. No rule change and no site impact in this folder. Doug asked (Coordinator, then 7:59 PM ET approval) how much drop-ring arrivals and deaths before 40 s swing when the bot's behavior does not really change.

**Base bot is 6182d29**, the champion *before* P29. P29 (2e1d036) was later merged as main `b6f2f8b` (site 4.35, BB-BAB3F961) and is the champion for screens from then on. This calibration was already running on 6182d29 and was finished on that SHA; it still measures natural swing of the veto metrics.

Doug's 7:55 PM ET ruling: the drop-ring veto is judged by each seed set's **total** arrivals versus the champion, not by a single seed. This report therefore gives both the **set-total swing** and the **per-game churn** (arrivals lost and gained, with seeds).

## Setup

- Hardware: this box, Intel Xeon, 8 cores (`nproc=8`, 1 thread per core), bun 1.4.4, `--jobs 4` for the 96-game sets, `--jobs 1` for isolated reruns.
- **Base bot:** champion `6182d29c673d99f5186d742a5f019c0b007234f2` (pre-P29). Uncommitted `/tmp` copies; only the listed no-op was added. No bot code was committed.
- **Sim:** `/workspace/wt-tester-fast`, HEAD `d548479cd5ebdf94391166c21aaf55ca761c23f3` (tools/sim) plus #133 item 1, the `geom.ts` component skip (`shortcut-geom.diff`, P-D-011-local `e07ed31`). `tools/sim/run.ts` also has the local `SEED_BASE` and read-only death-context columns used for screens. Nothing was merged; the live main sim is unchanged.
- Seeds: 2000+3000 and 4000+5000, 96 per base (384 games per side). Champion and each null were run fresh on this same faster sim.
- Hazard logs: the same screen wrapper (`wrapN-champ.ts` import path retargeted) and the same pin / drop-arrival definitions as `haz_an_mode.py` (10 s windows stepped 1 s, in zone, moved < 3 m, mean move command > 0.3; a 20 s+ pause is a run of those windows; a drop arrival is a distinct drop id in `dropIn`).
- Lock: each 96-game run took `flock /workspace/tester/sim.lock` and released it afterwards.
- Order: champion 2000, 3000, 4000, 5000, then N1, N2, N3 on the same bases, then isolated `--jobs 1` reruns of the two N2 seeds that differed in the batch.

## Variants

The bot sources (`bot.ts`, `brain.ts`, `map.ts`, `mechfight.ts`, `nav.ts`, `params.ts`, `target.ts`) contain **no** `Math.random` and no other RNG. The sim engine and house AI use `mulberry32` / `S.rng`, not `Math.random`. So an extra `Math.random()` in the bot cannot consume the sim's RNG; it is a true no-op for behavior (N1). There was no bot RNG to consume instead. N2 and N3 are timing perturbations, placed immediately after `const started = performance.now()` in `act()`, so they sit inside the `canPlan` window (`DEADLINE_MS=30`, `PLAN_RESERVE_MS=10`, budget 20 ms).

Exact diffs are in `diffs/`.

| Id | Perturbation | Fired |
|----|--------------|-------|
| N1 | one unused `Math.random()` per `act()` | every game (per-tick; true no-op) |
| N2 | ~1 ms busy-wait on `performance.now()` per `act()` | every game (per-tick) |
| N3 | ~1 ms busy-wait on every 7th `act()` only | every game (the 7th-tick wait still runs in every game) |

## Wall clock and load

Started Saturday, Nov 21, 2026, 7:59:48 PM ET. Load at start: 2.69 / 3.09 / 4.32. Other agents' sims were already on the box and load rose through the batch, ending at 14.72 / 12.35 / 8.50 at 8:08:12 PM ET (`runlog.txt`). N2 was slow because of the 1 ms wait, not only because of load.

Times below are the recorded wall of each 96-game run (`END ... wall=` in `runlog.txt`).

| Base | Champ | N1 | N2 | N3 | Champ start load (1-min) |
|------|------:|---:|---:|---:|--------------------------|
| 2000 | 19 s | 20 s | 50 s | 26 s | 2.69 (champ) / 9.58 (N1) / 11.70 (N2) / 13.95 (N3) |
| 3000 | 20 s | 21 s | 54 s | 28 s | 6.12 / 10.19 / 13.59 / 14.09 |
| 4000 | 22 s | 24 s | 56 s | 29 s | 7.10 / 10.59 / 14.80 / 14.65 |
| 5000 | 22 s | 24 s | 56 s | 31 s | 8.54 / 12.03 / 14.48 / 14.50 |
| 2000+3000 (sum) | 39 s | 41 s | 104 s | 54 s | |
| 4000+5000 (sum) | 44 s | 48 s | 112 s | 60 s | |
| **All 384, sum of walls** | **83 s** | **89 s** | **216 s** | **114 s** | |
| **Batch wall (all 16 runs)** | | | | **8 min 24 s** (7:59:48–8:08:12 PM ET) | |

No run missed an answer (`missed=0` on every CSV). Late answers (`late_over_50ms` event counts) were 0 on the champion; N1 1+0+0+0; N2 5+7+3+2; N3 1+3+3+3. Those lates clustered on the noisier bases.

## Faster-sim champion vs cached old-sim `runs/6182d29-*.csv`

Every non-timing CSV field (everything except `bot_ms_mean`, `late_over_50ms`, `missed`, `bot_ready`) matched on **384 / 384** games, including place, score, and death time. No isolated rerun was needed. Timing fields differed on most rows, as expected.

## Results vs 6182d29 on the same faster sim

Behavior-diff counts exclude the four timing columns above. “Fired” is 192/192 on every set: each perturbation is active in every game.

### Set totals (the 7:55 PM ET drop-ring ruling looks at these)

Drop-ring arrivals, deaths before 40 s, end-game survivors (no death time), and games with a 20 s+ pause were **identical** to the 6182d29 champion on both seed sets, for every null, including the load-contaminated N2 batch.

| Variant | Set | Drop arrivals (champ → null) | Set-total swing | Per-game churn (lost / gained) | Died &lt;40 s | Survivors | 20 s+ pause games | Beh-diff | Score-diff | Δ ± SE | Better / tied / worse |
|---------|-----|------------------------------|-----------------|--------------------------------|---------------|-----------|-------------------|----------|------------|--------|------------------------|
| N1 | 2000+3000 | 6 → 6 | 0 | 0 lost, 0 gained | 56 → 56 | 6 → 6 | 4 → 4 | 0 | 0 | +0.000 ± 0.000 | 0 / 192 / 0 |
| N1 | 4000+5000 | 5 → 5 | 0 | 0 lost, 0 gained | 54 → 54 | 5 → 5 | 5 → 5 | 0 | 0 | +0.000 ± 0.000 | 0 / 192 / 0 |
| N2 | 2000+3000 | 6 → 6 | 0 | 0 lost, 0 gained | 56 → 56 | 6 → 6 | 4 → 4 | 2* | 0 | +0.000 ± 0.000 | 0 / 192 / 0 |
| N2 | 4000+5000 | 5 → 5 | 0 | 0 lost, 0 gained | 54 → 54 | 5 → 5 | 5 → 5 | 0 | 0 | +0.000 ± 0.000 | 0 / 192 / 0 |
| N3 | 2000+3000 | 6 → 6 | 0 | 0 lost, 0 gained | 56 → 56 | 6 → 6 | 4 → 4 | 0 | 0 | +0.000 ± 0.000 | 0 / 192 / 0 |
| N3 | 4000+5000 | 5 → 5 | 0 | 0 lost, 0 gained | 54 → 54 | 5 → 5 | 5 → 5 | 0 | 0 | +0.000 ± 0.000 | 0 / 192 / 0 |

20 s+ pause seeds were the same as the champion on every run: 2004, 2025, 2047, 3062 and 4027, 4090, 4095, 5003, 5072. Per-base drop arrivals were also the same: 5, 1, 1, 4.

\* N2's two behavior-diff games are **load noise**, not a reproducible effect of the 1 ms wait. See below.

### Per-base late counts and the two N2 diffs

N1, N3, and N2 on 2000 / 4000 / 5000 were behavior-identical and score-identical to the champion on all 96+96+96 games (N1: 384/384; N3: 384/384; N2 4000+5000: 192/192).

N2 base 3000, run at 8:03:32–8:04:26 PM ET with 1-minute load 13.59 → 14.80, had **2 / 96** games with a non-timing CSV difference and **0 / 96** with a different score:

- Seed 3007: place 13 and score 3 both sides, but death 75.00 s (champ) vs 70.25 s (N2 batch). N2 batch had `late_over_50ms=2` and a 108.6 ms decision (`ms.max` in the hazard log). Weapons, upgrades, cubes, and final position also differed.
- Seed 3050: place 14, score 2, death 31.00 s both sides; only final `zone_edge`, `pos_x`, `pos_z`, `killer_dist`, and `speed` differed. No late answers. Neither game had a drop arrival.

Isolated `--jobs 1` reruns at 8:09 PM ET (1-minute load 8.41), both seeds, both sides:

- Isolated champion matched the batch champion on all non-timing fields.
- Isolated N2 matched the isolated champion on all non-timing fields (only `bot_ms_mean` was higher, as expected from the 1 ms wait: 1.37 vs 0.30 on 3007, 1.57 vs 0.33 on 3050). No late answers.
- Isolated N2 therefore does **not** match the batch N2 rows; those two batch differences were the same class of canPlan / wall-clock-budget noise seen earlier on seed 4085 under load.

So a clean reading is: N1, N2, and N3 left drop totals, per-game arrivals, deaths before 40 s, survivors, 20 s+ pauses, places, and scores unchanged vs 6182d29 on both 192-game sets. The only batch behavior diffs (N2 seeds 3007 and 3050) did not reproduce in isolation.

## Context from today's vetoes (vs the same 6182d29 drop totals)

- P29 (2e1d036): set totals *rose* (6 → 8 and 5 → 7) while seed 5028 lost one arrival the champion reached. Under the 7:55 PM ET set-total ruling that is not a drop veto.
- P30 unofficial 9906286 flag-on copy: set totals 6 → 4 on 2000+3000 (two arrivals lost on that set), and deaths before 40 s 56 → 59 and 54 → 57. That is a 2-arrival set-total loss, larger than any swing in this calibration (all swings here were 0), and it came with more early deaths.

In this calibration, even the 1 ms per-tick wait under heavy load did not move a set's drop-arrival total or its early-death count. A 1–2 arrival set-total loss was not observed as noise here. Per-game churn was also 0 on every variant; the only non-score CSV disagreements were the two load-contaminated N2 games, which had no drop arrivals.

## Files

- `csv/{champ,n1,n2,n3}-{2000,3000,4000,5000}.csv`: 96-game results on the faster sim.
- `csv/iso/{champ,n2}-{3007,3050}.csv`: isolated `--jobs 1` reruns.
- `haz/{tag}-{base}/`: wrapper hazard logs used for drop arrivals and 20 s+ pauses (96 JSON files per run).
- `haz-iso/`: hazard logs for the isolated reruns.
- `haz-summary.json`: per-run totals (drop_arr, died40, pin20 seeds, survivors, lates, …).
- `diffs/{n1,n2,n3}-brain.ts.diff`: exact null patches against a byte-identical copy of 6182d29 `brain.ts`.
- `runlog.txt`: start/end timestamps, load averages, sim stdout, and walls.
- `summary.json`: machine-readable comparison of the 384-game batch (isolated confirmation is in this README and `csv/iso/`).

Numbers in the tables are taken from these files and from the sim stdout in `runlog.txt`.
