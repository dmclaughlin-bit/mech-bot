# Agent 6: Training, Self-Play & Simulation

**Bottom line:** don't build a full simulator, and don't attempt RL. Do three things instead:

1. A **scenario harness** that unit-tests behaviors on synthetic observations (≈5 h).
2. An **offline replay analyzer** for aim and latency (≈2 h).
3. A disciplined **submission schedule**: successive halving over structural variants, then 1-D sweeps of 2–3 scalars.

Optional **duel micro-sim** (≈8 h) only if the bot plays full matches cleanly by about hour 16. Submissions are the only ground truth, so make each slot answer one question.

## 0. What the kit actually gives us (inspected)

- `check.py` only checks protocol conformance: schema, ticks, the 50 ms budget (fails above 2% late), newest-obs rule, clean exit. Its own docstring says it "says nothing about how well your bot plays" [TR-08].
- **The recorded stream** (decoded) is **36.8 s** of one match. The recorded bot ended **place 13, 0 kills** after house bot id 10 (gun + laser, visible in 169 of 300 obs) landed a **315-damage laser hit**. It also has 13 `damaged` and 10 `hit` events (one a rear hit, 67.5 = 45 × 1.5), 62 gun sounds, and roof pickups at z 12–17 m. Lesson: house bots loot fast and punish with lasers within 30 s. The full `hello.config` (every constant) is included and could parameterize any sim.
- **No per-match feedback:** stderr isn't shown and the page shows only the score [TR-08]. The protocol does mention a *public replay*. **Spend 30 min checking whether replays are accessible.** If they are, they become our best data: house-bot trajectories, our death causes, placement per match.
- **Fixed seeds:** practice seeds are fixed and our bot's seed is fixed per slot. **Submit the baseline twice early.** If the scores match, the server is deterministic, and noise comes only from the 48-seed sample plus chaos: any behavioral change reshuffles matches.

## 1. Simulator options

| Option | Build | Unlocks | Main risk |
|---|---|---|---|
| (a) Submissions only | 0 h | Real signal vs real house squad | ~4 evals/h, noisy |
| (b) Full 2.5D sim | **22–30 h** for one person | Self-play, 16-copy FFA, regression, local CMA-ES | Over half of one person's remaining time. House-bot AI is a guess, so we would tune against our own assumptions. |
| (c) Scenario harness | **4–6 h** | Behavior unit tests, regressions, latency stress, offline aim scoring | Open loop: shows decisions are right, not that the bot wins |
| (b-lite) Duel micro-sim | **~8 h** | Closed-loop tuning of aim, dodge, laser timing in 1v1/1v3 | No zone, loot or map |

**(b) breakdown:** map loading and LOS/collision 3–4 h; kinematics 3; four weapons 3–4; zone, regen and rear arc 1; vision and sound emitted as protocol-exact obs (so the real bot runs unmodified) 3; loot, crates, cubes, offers and drops 3; NPCs 1; house squad 3–4; lockstep runner 2; calibration 2. Throughput: 16 bots × 4,800 decisions at ~10 ms each is ~1–3 min per match, or ~20–60 matches/h. That is enough for regressions, not for RL. Policies tuned in an imprecise sim exploit its errors. Domain randomization is the usual fix [TR-05], but our biggest unknown is opponent behavior, not physics.

**Recommendation:** (c) now, run by person B during hours 0–6. Then (b-lite) only if the conditions above hold. Never (b).

Battlecode teams rely on local scrimmages against their own old versions [TR-06], and Robocode tuners use batch runners [TR-07]. Both have the official engine locally; we don't, so fixed test cases are the cheap substitute.

### Scenario harness design (c)

- **Base.** Clone real obs from `stream.jsonl.gz` so the format is exact. Mutate fields such as `self`, `mechs`, `projectiles`, `events`, `zone` and `drops` to build cases.
- **Optional closed loop.** A ~50-line stub integrates own position and yaw from the action, using `walk_speed`, `boost_speed` and `turn_rate` (no collision).
- **Cases with assertions:**
  1. Rear hit → turn to face within 3 decisions.
  2. `charging` enemy at 150 m → strafe or break LOS.
  3. Zone ETA unreachable at walk speed → boost in.
  4. Uncontested drop within 120 m → go. Two enemies at the ring → skip.
  5. Low HP and 2 enemies → flee. Lone enemy below 30% HP → engage.
  6. `offer` answered in time.
  7. No fire while reloading.
  8. **Latency stress:** 16 mechs, 60 projectiles → p99 under 35 ms in Docker on 1 CPU.
- **Offline aim scoring.** Replay enemy id 10's 169 visible samples. For each sample, predict the position at t + time of flight and score the miss distance. This tunes the velocity-smoothing α and the lead model. It is only one 37 s track, so treat the result as a sanity check, not a fit.
- **Regression gate.** The harness plus `check.py` (with the Docker flags) must pass before any submission. A rejected submission wastes a slot.

## 2. If a sim (b-lite or b) is built

- **Environment:** gun and laser first; building footprints as 2D polygons with heights. Randomize spawns (≥130 m apart, inside 0.8 × zone), the next zone center inside the current circle, and loot (25% on roofs). The real bot is the policy, through stdin/stdout, so observations and actions match production.
- **Opponents:** frozen past versions of our bot, a rusher, a camper, a laser sniper (200–280 m), a drop-chaser, and a squad imitation that shares vision and focuses the weakest. Weight toward FFA opponents, because the final is FFA.
- **Anti-pathology:** report squad score, FFA score and worst-mix score, and accept only Pareto improvements. Timeouts that rank by HP punish campers. The squad imitation and rushers punish overextending.
- **Reward:** 16 − place only. Shaping on damage dealt rewards recklessness, survival time rewards camping, and kills reward ignoring third parties. Keep those as log diagnostics, never as the objective.

## 3. Optimizing under a 4/hour, 48-match budget

**Noise.** We assume the per-match standard deviation of 16 − place is about 3.5–4.5. This is our own estimate, not measured; replays would let us measure it.

| Quantity | Value |
|---|---|
| SE of one submission's mean (sd / √48) | ≈ 0.5–0.65 |
| SE of the difference between two submissions | ≈ 0.6–0.9 (shared seeds help only partly, because chaos decorrelates matches) |
| Gain one slot can reliably detect | **≥ ~1.2 points** |
| Winner's curse when picking the best of k = 8 noisy variants | inflates its score by ~1.4 SE ≈ 0.8 |

**Re-evaluate any winner once before adopting it.** Fixed seeds also mean that heavy selection overfits those 48 matches.

**Slots per day.** The cap is 4/h only while someone is awake to push, about 22–26 usable hours. Bot bring-up eats the first ~8–10 h. Realistically that is **~45–70 evaluations in total**.

- Keep a **variant queue**: one Git tag per variant, with parameters in `params.json`. Script the commit and push so a submission takes under 1 min.
- **Measure the turnaround time** on the first submission. If results lag more than 15 min, keep 2–3 evaluations in flight.

**Method fit:**
- **CMA-ES on submissions: no.** λ = 6 × 5 generations is 30 slots of noisy fitness. Noisy problems need large populations or learning-rate adaptation [TR-02], and evaluation-limited game-agent tuning favors model-based or bandit EAs [TR-01]. Use CMA-ES or CEM **offline only**, on harness or micro-sim objectives (aim miss distance, dodge survival).
- **Successive halving** [TR-03]: 6 structural variants × 1 slot, re-run the top 3, keep the best mean of 2.
- **1-D sweeps**, 3 points each, on engage HP ratio, zone safety margin and the drop-contest rule. Re-run the winner.
- **Hand-run PBT "exploit and explore"** [TR-04]: every ~2 h, copy the best and perturb one subsystem.
- **Score-as-probe:** a variant that disables one behavior (e.g. drops) measures what it is worth.

**Slot plan (hours after the first playable bot):**

| Phase | Slots | Purpose |
|---|---|---|
| H0 | 2 | Run baseline twice: determinism and turnaround |
| H1–H3 | ~10 | Successive halving across 6 strategies: passive-edge survivor, drop-chaser, third-party opportunist, laser-sniper loadout, etc. |
| H4–H8 | ~16 | Sweeps on the top strategy's 3 scalars, plus bug-fix regressions |
| H9+ | the rest | Exploit-and-explore copies, plus a re-evaluation of every adopted change |
| Final 3 h | — | Freeze. Submit only the robust best plus one re-run confirmation. |

## 4. Learned vs deterministic components

| Component | Verdict |
|---|---|
| Aim lead (gun 252 m/s; mortar ballistic with g = 22) | **Deterministic** intercept from closed-form physics. Tune smoothing α offline on the recorded track. A learned residual needs trajectory data we don't have; replays would change this. |
| Dodge (laser `charging`, incoming projectiles have velocity) | **Deterministic** rules: strafe perpendicular, break LOS, jump timing. Tune 1–2 timings in the micro-sim or harness. |
| Engage/flee | **Hand-written score** from HP ratio, weapon triangle, nearby enemy count, zone ETA and drop timing. 2–3 thresholds tuned via sweeps. No labels exist to train a classifier. |
| Upgrade picks | Fixed priority table. |
| Loot path, zone path | A* or flow field over a nav grid precomputed during the 20 s `ready` window. |

If replays turn out to be accessible, a cheap **learned engage/flee classifier** becomes possible: label each engagement by whether we survived the next 15 s, then fit logistic regression on ~6 features. It costs about 3 h, and only once there are more than ~200 engagements.

## 5. RL and self-play: honest feasibility

- **Feasible now (in 40 h):** deterministic bot, scenario harness, offline CEM/CMA-ES on 2–5 low-level parameters in the harness or micro-sim, bandit scheduling of submissions.
- **Not feasible:** RL needs a sim (22–30 h before training starts). Our ~10^4–10^5 decisions/h is far less experience than deep RL in a 3D shooter normally consumes. The house squad is unmodeled (sim-to-real gap). And the policy must run in 50 ms on 1 CPU.
- **Future research:** full protocol-exact sim → league self-play with PBT [TR-04] and domain randomization over opponents and physics [TR-05] → distill into a small policy. That is a multi-week project.

## Hour budget (team of 2)

| Item | Owner | Hours |
|---|---|---|
| Scenario harness + latency stress + regression gate | B | 5 |
| Offline aim analyzer on the recorded track | B | 1.5 |
| Variant/params pipeline (tags, `params.json`, push script) | B | 1 |
| Check whether replays are accessible | A | 0.5 |
| Submission scheduling and result log (spreadsheet: tag, params, score, Δ) | A/B | ~0.25/h ongoing |
| Optional duel micro-sim plus offline CEM on aim/dodge | B | 8 |
| **Core infrastructure total** | | **≈8 h** (plus 8 h optional) |

## Sources

- TR-01: Lucas et al., "Efficient Evolutionary Methods for Game Agent Optimisation: Model-Based is Best" (2019). https://rdgain.github.io/assets/pdf/papers/lucas2019efficient.pdf
- TR-02: Nomura et al., "CMA-ES with Learning Rate Adaptation: Can CMA-ES with Default Population Size Solve Multimodal and Noisy Problems?" GECCO 2023. https://dl.acm.org/doi/10.1145/3583131.3590358
- TR-03: Li, Jamieson et al., "Hyperband: A Novel Bandit-Based Approach to Hyperparameter Optimization," JMLR 18 (2018). https://www.jmlr.org/papers/volume18/16-558/16-558.pdf
- TR-04: Jaderberg et al., "Population Based Training of Neural Networks" (2017). https://arxiv.org/abs/1711.09846
- TR-05: Tobin et al., "Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World" (2017). https://arxiv.org/abs/1703.06907
- TR-06: Battlecode 2023 postmortem "Don't @ Me" (local full-map scrimmages against old versions). https://battlecode.org/assets/files/postmortem-2023-dont-at-me.pdf
- TR-07: RoboWiki, RoboRunner batch battle runner for Robocode. https://www.cse.chalmers.se/~bergert/robowiki-mirror/RoboWiki/robowiki.net/wiki/RoboRunner.html
- TR-08: Kit files `check/check.py`, `check/stream.jsonl.gz` (decoded by this agent), `protocol.md` §1, §3, §6.
