# Benchmarking & Optimization Spec (Agent 7)

Scope: how to judge changes when submitting is the only real test (4 per hour, 48 fixed-seed practice matches each, score = mean(16 − place)). All numbers below are either computed (scripts in `/tmp/claude-0/bm/`) or marked as assumptions.

## 1. Practice-score statistics

**Per-match SD.** Points run 0..15. A uniform placement gives SD 4.61. In a simulated 16-bot field with latent strength plus noise, the per-match SD was 2.7 for the top and bottom bots and 3.7 mid-pack. Against the house squad our bot sits at the bottom: mean 1–5 with a long right tail (an occasional win is worth 15). So **assume SD ≈ 4** (range 3–5).

| per-match SD | n | SE of mean | 95% MDD, independent runs | 80%-power MDD |
|---|---|---|---|---|
| 4 | 16 | 1.00 | 2.77 | 3.96 |
| 4 | 48 | 0.58 | **1.60** | 2.29 |
| 4 | 64 | 0.50 | 1.39 | 1.98 |
| 3 / 5 | 48 | 0.43 / 0.72 | 1.20 / 2.00 | 1.71 / 2.86 |

A practice move of +0.5 (e.g. 3.0 → 3.5) is **not** evidence of anything if the matches are independent.

**Paired seeds.** Practice seeds are fixed, so two submissions play the same 48 worlds: the same spawns, loot, zone and drops. That is the common-random-numbers design [BM-03, BM-04]. The MDD at n=48 and SD 4 depends on how strongly the two submissions' per-seed scores correlate (ρ):

| ρ | MDD |
|---|---|
| 0 | 1.60 |
| 0.5 | 1.13 |
| 0.8 | 0.72 |
| 0.95 | 0.36 |

The pairing only holds while trajectories stay alike. Any change to our actions shifts what the house squad does, and in a chaotic 480 s match the matches drift apart by mid-game, so a realistic ρ is maybe 0.3–0.6. This is an assumption. We get only the aggregate score back, not per-seed scores, so we cannot actually run a paired test. What we can see is the mean shift.

**Determinism trap.** `hello.seed` is "fixed per slot and says nothing about the match" (protocol.md). A bot that seeds its RNG with it, or uses no randomness at all, is fully deterministic. If the server and house bots are also deterministic given the match seed, then **resubmitting an identical bot may return the identical score**. The real noise would then be 0, while the noise that matters for the final stays near SD/√48. Risks: over-tuning on 48 frozen worlds (a "+0.4" can be one seed going 16th → 10th), and uncontrollable lateness jitter (a late answer coasts the mech and can flip a match).

**Guards:**
1. **Test-retest once (one submission, high value).** Resubmit the current bot unchanged, with its RNG seeded from `seed XOR time_ns()`. A score Δ near 0 means practice is near-deterministic; a Δ around ±0.6 means it really is a noisy sample.
2. Randomize internal tie-breaks: route choice among near-equal paths, strafe direction, which drop to contest. Seed from `time.time_ns()`, not `hello.seed`. Each submission then samples new trajectories on the same worlds, which makes the practice score an honest estimate rather than one frozen rollout.
3. Accept a change only if (a) Δ ≥ ~1.2 points, or (b) the mechanism is clearly right and offline-verifiable (e.g. "never stands outside the zone", "turns to face rear hits"), and the score does not drop by more than 1.2. Never accept a change on score alone with Δ < 1.
4. Keep the list of accepted changes in an experiment log (§3). If a change gave Δ < 1, re-test it later: submit the variant with it reverted as a confirming run.

## 2. Final-series statistics (what pays)

**Head-to-head.** In a 64-match series the difference in means against one rival has SD ≈ √2·4 ≈ 5.7 per match, so SE = 0.71. To beat a given rival with 95% confidence you need a **true edge of ~1.4 points** (one-sided: 1.16). With less than ~0.5 edge it is close to a coin flip.

**Simulation** (16 bots, evenly spread strengths, rank-based points):
- The best bot wins the 64-match series **84%** of the time. The second-best (−0.53 points in expectation) wins 15%.
- In the 16-match qualifier the best bot tops the table only **61%** of the time (SE 0.68). The qualifier mostly needs top-16 out of 32, which is far easier than winning it.

**Variance vs mean (winner-take-all).** Model: hold the series-mean fixed and vary only the per-match SD. P(win series) against a favorite with SD 4, with 14 others about 1 point behind:

| our gap to favorite | SD 2 | SD 4 | SD 6 |
|---|---|---|---|
| ahead 0.5 | **0.79** | 0.71 | 0.66 |
| level | 0.38 | 0.40 | 0.43 |
| behind 0.5 | 0.06 | 0.14 | **0.21** |
| behind 1.0 | 0.002 | 0.03 | 0.08 |

So variance helps an underdog, as the max-order-statistic argument predicts. But the effect is second-order next to the mean, because 64 matches divide the SD by 8.

The real trade-off is not at fixed mean. In the rank simulation, making a near-top bot noisier also **lowered its mean**: at ×1.5 noise, mean 11.9 → 11.3 and P(win) 0.15 → 0.03. At ×0.5 noise, mean rose to 12.45 and P(win) to 0.47. Rank scoring is concave at the top: a win adds a few points over 2nd, an early death costs 10+.

**Conclusion:** maximize the mean via consistent survival. Consistently placing ~top 5 (11+ points) is the winning profile. Add variance only in the last ~30 s, when tied for alive and behind on HP (timeout ranks survivors by HP).

## 3. What we can actually measure

stderr is hidden in matches, and the only per-match output is `end.place` and `end.kills`, of which we see just the aggregate score. Measurable channels:

| Metric | Where | How |
|---|---|---|
| Placement mean | Leaderboard | Per submission (n=48) |
| Decision latency p50/p99/max, missed % | `check.py` locally | Every build, ×3 runs |
| Ready time vs 20 s | `check.py` output ("ready in N ms") | Every build |
| Conformance failure messages | Submission (tail of stderr shown on failure) | Incidental |
| Survival time, zone deaths, rear damage taken, drops captured, damage dealt | **Only in a local harness** | See below |

**Per-submission experiment log** (`research/experiments.csv`, one row each): time, git SHA, variant ID, hypothesis, **single change**, practice score, Δ vs parent, local check p99/max, accept/reject, mechanism note. This is the minimum cheap harness.

**Local replay/log harness** (worth ~2 h only if a teammate writes a mini-sim; the kit has none). Without a sim:
- `replay.py` feeds `check/stream.jsonl.gz` (300 real obs, ticks 0–736, up to 16 alive) to `Bot.act`. Log per tick: chosen mode/state, target, whether in zone, whether facing the last `damaged` bearing (rear = `events.rear`), and time spent in `act`.
- Assertions: no move vector that leaves the zone when a safe route exists; torso turns toward a rear-hit bearing within ≤3 ticks; boost energy never hits 0 while outside the zone.

This tests decisions, not outcomes. Internal counters can go to stderr locally; they are unreadable from scored matches.

## 4. Latency profiling (measured, Python 3.13, this container)

**How check.py judges time** (read from the source): `perf_counter()` at the stdin write, until a reader thread timestamps the arrival of the stdout line. The budget is `tick_budget_ms` = 50 ms. More than 2% missed out of 300 obs (i.e. >6) means failure. A slow pass is retried with a fresh bot up to 3 times and the best pass counts. Every 25th observation arrives as a burst of 3; answering an older tick counts as "stale" (dropped). It prints p50/p90/p99/max and notes "this machine, not the 1-CPU match container". Correctness errors fail at once; ready (20 s) is timed from the `hello` send.

**Numbers:**
- Example bot through `check.py`: p50 0.2 ms, p99 0.4 ms, max 1.1 ms. Pinned to one core (`taskset -c 0`): p99 0.3 ms, max 0.4 ms. Ready in 29 ms.
- `json.loads` of recorded obs (1.2–2.0 KB): **p50 10 µs, p99 25 µs, max 55–87 µs**.
- Synthetic worst-case obs (15 mechs, 80 projectiles, 40 sounds, 40 pickups, 36 crates, 30 cubes, 10 beams, 20 events; 19.7 KB): **p50 139 µs, p99 171 µs, max 526 µs**. Parsing is negligible.
- Map: `world.json` (300 KB) loads in 3.9 ms, `terrain.i16` (774,680 cells) in 2.3 ms. **One pure-Python pass over the 1070×724 grid takes 54 ms**, so a 1 m nav grid with A* preprocessing in pure Python is fine within 20 s if it needs < ~50 full-grid passes. Budget ≤ 5 s on our machine to leave ~4× headroom for the slower match CPU and container start.
- GC: a full `gc.collect()` with ~1M live dicts takes **186 ms**, about 4 budgets in one pause. After `gc.freeze()`, collection of the frozen heap takes ~0 ms [BM-05].

**Recommendations:**
- After map preprocessing: `gc.collect(); gc.freeze()`. Optionally `gc.disable()`, then run `gc.collect(0)` manually on cheap ticks. Store grids in `array`/`bytes`, not lists of lists: fewer tracked objects, smaller GC scans.
- **Deadline guard:** do anytime planning. Check `perf_counter()` from the obs read, abort search at **25 ms**, and always have a fallback action ready by 5 ms. Target local p99 ≤ 10 ms, max ≤ 20 ms.
- **Measuring "1 CPU":** Docker `--cpus 1` is a CFS quota (100 ms period by default). A multi-threaded process can burn its quota early and then be throttled for the rest of the period [BM-06]. Keep the bot single-threaded; the wrapper's reader thread is mostly idle. There is no Docker daemon in this container. Locally, run `taskset -c 0 python3 check/check.py -- taskset -c 0 <bot>` and, if Docker is available, `docker run --cpus 1 --memory 512m --read-only --network none`. Run 3× and report the worst p99/max. Stress test: add a busy loop on the same core (`taskset -c 0 python3 -c "while 1: pass" &`) to approximate a busy scorer.

## 5. Ablation protocol and submission schedule

**Rule: one change per submission, against a fixed parent.** Batch independent changes only when the expected effects are each ≥ 2 points (early game), then ablate.

**Phase A (hours 0–8, ~4/h, ~25 slots):**
1. S1: current bot = parent P0.
2. S2: P0 unchanged with time-seeded RNG (test-retest noise; see §1).
3. Then big-ticket survival features, each as one submission: zone-safe movement → avoid early fights → face attackers → drop capture → loot priority → third-partying.
4. Accept with Δ ≥ 1.2, or with a mechanism check and Δ > −0.6.

**Phase B (hours 8–30):**
- Parameter sweeps for aggression thresholds and zone margin: submit 3 settings in one hour (low/mid/high). Trust a monotone trend, not the noisy argmax.
- Every ~6 h, resubmit the current best unchanged to track drift and noise.

**Phase C (hours 30–38): robustness only.**
- Latency hardening and crash-proofing: wrap `act` in try/except that returns a safe action.
- Final candidate submitted ≥ 3 times. Choose by the mean of repeats, not the max.

**Stop rule:** lock the final **2 h before deadline** (Sun 09:00 ET). After that, change only a candidate that already passed `check.py` 3× under one-core pinning and has ≥ 2 practice runs. If the leaderboard keeps the latest or best submission and earlier submissions win ties, submit the final candidate as early as possible (≥ 2 h before), and never resubmit a weaker build afterwards. Check the brief for whether the leaderboard and the final use the latest or the best entry.

**Overfit guard:** practice opponents are a coordinated squad that hunts us; the final is an FFA of independent bots. Favor changes whose mechanism is general (zone, facing, drops) over ones exploiting squad behavior (e.g. baiting hunters into a specific trap).

## 6. Local baseline opponent set (if any sim/harness appears)

- **B0 Example** (`example_bot.py`): run to zone, shoot nearest.
- **B1 Camper:** reach the next-zone center early, stand still (silent), shoot only at < 60 m.
- **B2 Rusher:** boost to the nearest heard or seen mech and fire continuously.
- **B3 Looter:** maximize crates/cubes, avoid mechs.
- **B4 Drop-hunter:** path to each supply drop, fight anyone in the ring.
- **B5 Third-party:** follow gunfire sounds and engage the lower-HP mech.
- **B6 Prior-self:** the last accepted version (regression check).

Mixed 16-bot lobbies, ≥ 64 seeds, mean ± 95% CI; TrueSkill/Plackett–Luce only when ranking many variants [BM-01, BM-02].

## Sources
- BM-01 Herbrich, Minka, Graepel, "TrueSkill: A Bayesian Skill Rating System", NIPS 2006. https://papers.nips.cc/paper_files/paper/2006/file/f44ee263952e65b3610b8ba51229d1f9-Paper.pdf
- BM-02 "The Evaluation of Rating Systems in Online Free-for-All Games", arXiv:2008.06787. https://arxiv.org/pdf/2008.06787
- BM-03 "When Does Pairing Seeds Reduce Variance? Evidence from a Multi-Agent Economic Simulation", arXiv:2512.24145. https://arxiv.org/abs/2512.24145v3
- BM-04 Burch et al., "AIVAT: A New Variance Reduction Technique for Agent Evaluation in Imperfect Information Games", AAAI 2018. https://ojs.aaai.org/index.php/AAAI/article/view/11481
- BM-05 Python docs, `gc` (gc.freeze). https://docs.python.org/3/library/gc.html
- BM-06 Linux kernel docs, "CFS Bandwidth Control". https://docs.kernel.org/6.14/scheduler/sched-bwc.html
- BM-07 Kit sources: `/tmp/claude-0/kit/mechfight-kit/check/check.py`, `protocol.md`; local measurements in `/tmp/claude-0/bm/{parse,heavy,sim,sim2}.py`.
