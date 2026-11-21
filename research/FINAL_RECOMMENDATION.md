# Mech Royale: final research report and recommendation

Coordinator synthesis of 7 agent reports (`agents/*.md`), written Fri Nov 20, ~8 PM ET. Source IDs such as [TS-02] resolve in `SOURCE_REGISTRY.md`. **[H]** marks a heuristic prior that has not been tested. No number here is a measured win rate, because no bot exists yet.

> **Status (Fri Nov 20, 8 PM ET):** this file is the evidence. The plan, roles, code layout, build order and timeline that the team follows now live in `AI-Structure-Development.md` at the repo root, which overrides §7's code layout and §10's roadmap where they differ. Open questions are tracked there too.

---

## 1. Executive summary

**Recommendation: a hand-written, deterministic, layered utility bot in TypeScript on bun, tuned only through practice submissions. No RL, and no learned components.**

These are the findings that matter most:

1. **The score counts how many mechs die before you.** Kills are worth nothing directly. At 16 alive, an even fight risks about 7.5 expected points to gain about 0.5 [TS-08 analysis]. The core behavior is therefore to survive by default and fight only fights you are very likely to win.
2. **TTKs are long and regen is strong.** The gun does about 102 sustained DPS once reloads are counted, so a front-on kill takes about 12 s. Hits from behind cut that by about 40%. Regen heals 50% in about 20 s and 100% in about 36 s after contact breaks. This rewards three things: facing the attacker, breaking line of sight, and healing up. A fight usually gives you time to leave it.
3. **The endgame is decided by HP.** From about 415 s the zone does 260 HP/s and ignores armor. Stacking max HP (cubes to 10, plating) and being inside the final circle at full HP decides 1st through 4th.
4. **Practice and the final reward different bots.** In practice the house bots never kill each other, so placement there comes mostly from your own kills and from outliving them in the collapse. In the final FFA, the other 15 bots kill each other for you. The $5k is paid on the final, so FFA-safe survival rules must be hard limits, and only the aggression knob should be tuned on practice.
5. **Every documented ML success had a fast simulator and millions to billions of steps** [AC-01, AC-03, AC-05, AC-14]. We have no simulator and roughly 50 evaluations of 48 matches each. In comparable contests (Lux AI S2, Halite, Battlecode, ViZDoom) rule-based or hybrid bots won or placed near the top [AC-08, AC-09, AC-10, GB-12, GB-13].
6. **One submission can only detect a change of about 1.2 to 1.6 points** (SD ≈ 4 per match is an assumption, n = 48) [BM analysis]. Tune only a few knobs, judge changes by mechanism as well as score, and re-run a winner before you trust it.
7. **Compute is not the bottleneck in bun.** A* on a 2 m grid takes 0.3 ms median and 4 ms max, and a line-of-sight ray costs 0.6 µs [AR-07]. The real risks are crashing (the mech idles for the rest of the match), stalls (late answers mean coasting and then idling), and getting stuck on geometry.

## 2. Existing bot systems (Agent 1)

- **No commercial battle-royale bot has a public technical write-up.** PUBG, Fortnite, Apex, Warzone and Free Fire bots are publicly described only as deliberately weak backfill that rarely uses cover or retreats [GB-14, GB-15]. Everything transferable comes from documented FPS bots and from contest postmortems:

| System | Architecture | What we take |
|---|---|---|
| Quake III bot [GB-01, GB-02] | Layered goals, fuzzy goal selection, 10 Hz | "If in a fight and not fit, retreat"; layered nav + goal + combat |
| Killzone [GB-07] / Unreal EQS [GB-08] | Weighted scoring of candidate positions, precomputed line-of-fire table | **Position query**: one weighted sum over ~60 candidate points |
| Halo 2 [GB-05, AR-03] | Behavior DAG, impulses, memory "props" | Retreat impulses; belief tracks that decay |
| CS:GO BT [GB-04], UE Perception [GB-09] | Sensors, memory that expires | Our own threat memory beyond the game's 5 s |
| L4D [GB-03] | Action stack, reason strings, flow distance | Log a reason on every mode switch; zone "flow distance" field |
| F.E.A.R. GOAP [GB-06, AR-02] | Planner | Not worth it: plans are short and the world changes every 0.1 s |
| Robocode (Diamond, wave surfing, GuessFactor) [OS-03, GB-10, GB-11, TS-05–07] | Minimum-risk movement, dodging | Melee min-risk movement; escape-angle aim limit; random stop-and-go |

**Game-specific insight.** The gun's escape angle is asin(v/252): 2.7° against a walking target and 4.4° against a boosting one. At 150 m that lets a target end up 7–12 m from a straight lead, against a mech about 5 m wide. **Long gun duels are coin flips, so shoot inside about 100 m, or at targets that aren't moving sideways.**

## 3. Ranked open-source resources (Agent 2, licenses checked by the coordinator)

| Rank | Resource | License | Use | Effort |
|---|---|---|---|---|
| 1 | flatqueue (github.com/mourner/flatqueue) | ISC ✔ | Binary heap under our typed-array A* and Dijkstra | <1 h |
| 2 | flatbush (github.com/mourner/flatbush) | ISC ✔ | Spatial index over building edges and trees for LOS and cover, 3 µs per query. The architecture agent's own 8 m edge hash was faster (0.6 µs), so either works. | 1 h |
| 3 | Diamond MeleeMover (github.com/Voidious/Diamond) | modified zlib ✔ | Re-implement its minimum-risk melee movement formula (~40 lines) with added zone, LOS, rear and drop terms. Credit it in the README. | 2 h |
| 4 | Own closed-form solvers | MIT (ours) | Gun intercept (iterate t three times), mortar pitch from the ballistic formula with g = 22, no drag | 1–2 h |
| — | mistreevous (MIT), PathFinding.js (MIT), behavior3js | — | Rejected. The BT library adds nothing, and JPS hit 183 ms on one query. | — |
| — | DrussGT | restrictive | Ideas only | — |
| — | Neural MMO, GoBigger, Meta MMO | MIT/Apache | Not transferable; no usable local simulator exists | — |

**A pitfall the open-source agent measured.** One A* query took 1.8 s with Float32 costs and no closed set. Use Float64 or integer costs plus a closed stamp.

**README credit line:** flatqueue and flatbush © Vladimir Agafonkin, ISC. The movement risk function is adapted from Diamond by Voidious (modified zlib license). Keep the license texts in `vendor/LICENSES/`.

## 4. Academic research findings (Agent 3)

| Method | Verdict for this event |
|---|---|
| Utility AI with analytic aim and dodge | **Yes** (the main approach) |
| Bandit, successive halving or NTBEA over 3–4 discrete settings, run on submissions [AC-12, TR-03] | **Yes** (this is our "learning") |
| CMA-ES / CEM | Only inside a cheap offline micro-sim (aim, dodge) |
| PPO, curriculum | Only if a fast, accurate simulator existed. It doesn't. |
| MAPPO, DQN, SAC, hierarchical RL, self-play leagues, BC, Decision Transformer, learned aim/dodge | **No** |

The evidence behind these verdicts:
- OpenAI Five trained for 10 months on up to 1,536 GPUs [AC-01]. FTW and Hide-and-Seek needed hundreds of thousands of games and large batches [AC-03, AC-05].
- In Neural MMO 2022, scripted bots led early and were only overtaken by RL over months [AC-06].
- In MARL-BattleGrounds, scripted bots beat RL at 40M steps; RL only pulled ahead at 250M [AC-14, preprint].
- In Lux AI S2, a rule-based bot won and the best RL bot was 4th [AC-09].
- Every ViZDoom winner hard-coded parts of its bot [AC-08].
- **No peer-reviewed battle-royale RL result exists** [AC-16].

## 5. Competitive strategy (Agent 4, numbers from the protocol)

**Placement and fights**
- No even fights before zone phase 3.
- Engage only when the bot is very likely to win: the target is below 50% HP, already fighting someone else, or showing its back. Also require that no other track has LOS to us.
- Third-party window: about 10 s after a fight goes quiet (a `death` sound carries 600 m), before the winner starts to regen.

**Survival micro**
- Keep the torso on the highest threat. Snap to `damaged.bearing` when `rear` is true.
- Retreat by walking backwards. Legs and torso are independent, and a 180° torso turn costs 0.8 s.
- Retreat when TTK(them on me) < 0.8 × TTK(me on them), or HP < 35% under fire [H].
- Dodge gun bullets only beyond about 75 m; closer in, break LOS instead.
- The laser is hitscan. When a visible enemy shows `charging` with its aim on us, break LOS within 0.75 s, or short it with lightning if it is within 45 m.
- Shells are visible: solve their impact point and step more than 7 m away.

**Zone**
- Leave when path ETA / (0.8 × walk) + 10 s ≥ time to shrink end [H], using the distance-field ETA, not straight-line distance.
- Crossing the zone costs dps × distance / speed. It is fine in phases 1–2, an escape move only in phase 4, and never from phase 5 on.
- Hold the centroid-facing edge of the next circle, arrive early, and move under 5 m/s so footsteps stay silent.
- At r ≤ 70, take cover nearest the announced final center.

**Supply drops** (full HP, full energy, +3 cubes, 4 s alone in the ring)
- Contest when all of these hold [H]:
  - HP > worst-case damage from visible shooters + 150
  - no rival within 80 m
  - at most one known enemy within 150 m
  - pre-positioned 30–60 m away in cover before it lands
- Otherwise third-party it from 100–200 m, or ignore it.
- Clock rule, resolved from protocol §7: the clock **freezes** while contested and restarts only if the ring empties or a different mech becomes the sole occupant. Stepping into a rival's ring freezes their capture but does not reset it.

**Loadout and upgrades**
- Prefer laser + lightning; it covers the whole weapon triangle. Keep the gun until both are in hand, since it needs no energy and reaches 230 m. Make the final loadout a tunable variant.
- Avoid the mortar: lasers do +60% to whoever holds one, and it splashes its owner.
- Never swap weapons with an enemy in view (equip lockout is 1–1.65 s).
- Collect cubes to 10 (+4% HP and damage each). Above 10, cubes only make you bigger (+5% size each).
- Upgrade order [H]: plating > armor > nanites > sensors > primary-weapon upgrade > mobility. Always pick before the offer expires.

**Stealth and hearing**
- Stay silent (≤5 m/s on the ground). Path through gaps between enemy vision wedges (enemy `aim` is observed).
- Fire only when you expect to finish the target or can break LOS right after, because a gunshot carries 320 m.
- Fuse sound bearings (σ 7°) into tracks.

**Robust plan for practice and the final.** Use one `aggression` knob tuned on practice. Hard-cap three rules so the bot stays FFA-safe: no early even fights, hold the edge silently, and reach the final center at full HP.

## 6. Architecture comparison

Full matrix in `agents/architecture.md` §1. Summary of the three candidates:

| | A: Deterministic tactical | B: Learning-based | C: Hierarchical hybrid with learned parts |
|---|---|---|---|
| Expected strength in 40 h | **High** | Low (can't be trained without a simulator) | Same as A, plus risk |
| What evidence supports | Contest winners, FPS bot practice | Needs a simulator and huge numbers of steps | Learned parts have no data to learn from |
| Latency | <5 ms typical | Fine | Fine |
| Debuggability | High (reason strings) | Low | Medium |

**Decision: Candidate A, built in a layered shape** (strategic goals at ~1 Hz, a tactical utility selector, an execution layer split into channels, and reflexes). This is the hierarchy from the brief **without any learned component**. The only "learning" is tuning parameters through submissions. C's learned parts fail for lack of data, and B can't be trained in time. A is the simplest design that covers every behavior in §5.

## 7. Recommended architecture (Agent 5, adjusted)

```
hello ─► MapPrep (≤8 s, guarded) ──static layers──┐
obs ───► WorldModel: self/zone/drops, EnemyTracker (vision+5 s memory+sound+damage),
         ProjectileList (impact prediction), LootIndex, cached distance fields
             │
             ├─► StrategicPlanner (~1 Hz / on trigger): ZoneSafe | Drop | Loot | FarmNPC | Hide/Regen | Endgame
             │        └─ goal(pos, kind, deadline, risk budget)
             ├─► TacticalSelector (every decision): Engage | Kite/Peek | BreakLOS/Flee | ThirdParty |
             │        Loot/Take | HoldDrop | Travel | FightNPC   (product of curves, ×1.25 commit, 0.5 s dwell)
             │        └─ intent {path goal, aim target, fire mask, boost policy}
             └─► Execution channels: Legs (A* 2 m + 1 m local refine, jump/jet ledges, unstick)
                                     Torso (lead, ballistic, slew-aware, face threat)
                                     Triggers (per-weapon fire rules, reload, take, pick)
                  ▲ Reflexes override one channel for one tick: dodge shell / laser, face rear hit, unstick
                  └► ActionComposer + DeadlineGuard ─► action JSON
```

**Module notes:**
- **Position query** (Killzone/EQS, game-bots §3.2):
  - Every 0.5 s, about 60 candidate points get one weighted score: cover, zone safety, range fit, isolation, exposure, travel time and drop bonus.
  - The Diamond min-risk term goes in as the "isolation/exposure" part.
  - Both the Reposition and the Flee destinations come from it.
- **EnemyTracker** (game-bots §3.1):
  - After the game's 5 s memory runs out, dead-reckon for 1 s, then grow σ at up to 19.5 m/s.
  - Associate sounds with tracks by bearing and weapon kind.
  - Drop a track when σ > 150 m or after 30 s.
- **Engagement** (game-bots §3.3 combined with tactical-strategy §9):
  - `R = TTK_them / TTK_me` with triangle, rear and accuracy priors; `p_win = 1/(1+R^-2.5)`.
  - Engage when `U_fight = p_win·(0.5+0.1·loot) − (1−p_win)·(16−n)/8 − 0.15·N_near_other > 0`.
  - The two agents' formulas agree in direction, so use the tactics one and treat the game-bots thresholds as the sanity check.
- **Distance fields:**
  - One to the next zone circle, rebuilt about 4 times a match, and one per called drop.
  - Each takes 17–56 ms, so time-slice it over several ticks or build it on a 4 m grid.
  - These make "ETA to X" an O(1) lookup.

**Runtime rules** (conflict resolved: the architecture agent said 35 ms, benchmarking said 25 ms):
- **Hard deadline 30 ms.** Fallback action ready by 5 ms. A* expansion budget per tick of about 20k.
- **Target p99 ≤ 15 ms** in Docker with `--cpus 1`, since the judging core may be 2× slower.
- Warm up the JIT at hello with 20 dummy A* queries. Preallocate typed arrays.
- Top-level try/catch with fallbacks for each module.
- MapPrep **inside a try with a degraded no-map mode**. The wrapper builds the bot before `ready`, so a constructor throw means a null bot for the entire match.
- `process.on('uncaughtException')` handler.

**Code layout in `mech-bot/`**: `bot.ts` (entry), `mechfight.ts` (unchanged), `src/{brain,params,debug}.ts`, `src/map/{prep,los,nav}.ts`, `src/world/{model,tracker,projectiles}.ts`, `src/strategy/planner.ts`, `src/tactics/{selector,posquery}.ts`, `src/exec/{legs,aim,fire,reflex}.ts`, `vendor/` (flatqueue, flatbush and their licenses), `params/*.json` selected by an env var in the Dockerfile, `tools/{replay,scenarios}.ts`.

## 8. Training strategy (Agents 3 and 6)

- **No full simulator and no RL.** A full simulator would cost one person 22–30 h, and its house-bot AI would be our own guess.
- **Scenario harness (≈5 h):** clone real observations from `check/stream.jsonl.gz` and mutate them into pass/fail cases. Cases:
  - rear hit → face the attacker within 3 decisions
  - `charging` enemy → break LOS
  - zone ETA can't be reached walking → boost
  - drop contest vs skip
  - flee vs finish
  - upgrade offer answered in time
  - no fire while reloading
  - latency stress: 16 mechs and 60 projectiles, p99 < 30 ms
- **Regression gate:** the harness and `check.py` under the full Docker flags must pass before every submission.
- **Offline aim check (1.5 h):** score the lead predictor against enemy id 10's 169 visible samples in the recorded stream. Treat it as a sanity check, not a fit.
- **Tuning:** use successive halving or 3-point sweeps over submissions, on at most 4–6 knobs (order from §5: aggression, retreat thresholds, rotation buffer, drop HP margin, gun accuracy priors, edge offset).
- **Optional (8 h, only if the bot plays clean full matches by about hour 16):** a duel micro-sim of movement and projectiles for tuning dodge and aim offline with CEM.

## 9. Benchmark framework (Agent 7)

- **Primary metric:** practice mean(16 − place) over 48 matches. With SE ≈ 0.58, **only trust changes of about +1.2 or more**, or changes that are clearly right on mechanism and cost no more than −0.6.
- **Determinism check first.** The practice seeds are fixed, and `hello.seed` is fixed per slot, so a deterministic bot may score identically every time.
  - Submit the same bot twice, once with a time-seeded RNG.
  - If the scores match, add randomized tie-breaks, because otherwise we would be tuning to 48 frozen worlds.
- **What pays:** in simulation, the best of 16 bots wins a 64-match series about 84% of the time.
  - Beating one rival with 95% confidence needs about a 1.4-point edge.
  - Win-or-die variance does not pay for a bot with the best mean. **Consistent top-5 placement beats high-variance play.**
- **Observable data** is only `end.place/kills` and the score page, since stderr is never shown. Keep an experiment log (`EXPERIMENTS.md` at the repo root) with one row per submission: commit, params, score, hypothesis and mechanism.
- **Latency measurements:**
  - `check.py` times from write to read and fails above 2% late over 300 observations (best of 3 passes).
  - Profile with `tools/replay.ts` inside `docker run --cpus 1`.
  - Parsing is negligible (10 µs median, 0.5 ms max in Python; less in bun).
- **Ablation:** one change per submission against a fixed parent. Resubmit the current best every ~6 h to track noise.
- **Spending the slots:** at 4/h, ~50–70 submissions is realistic once build time and sleep are counted. The two reports estimated 45–70 and 100–150; the lower range is the one to plan on.

## 10. Roadmap (scaled to ~39 h: Fri 8 PM → Sun 11 AM ET, team of 2)

Person A owns brain/tactics, Person B owns map/nav/harness. These are labels only; split however you like.

| When (ET) | A: decisions & combat | B: map, nav, tooling | Submit / success criterion |
|---|---|---|---|
| **Fri 8 PM–midnight** | Brain skeleton: try/catch, DeadlineGuard, params file. ZoneSafe travel (straight line), face attacker on `damaged`, always pick an offer, take laser/lightning in range | MapPrep: H2/H1 grids, occupancy, edge-hash LOS. Docker check under sandbox flags | **S1 by ~11 PM**: "survival-min" bot. Beat baseline 1.15. Earlier submissions win ties. |
| Fri midnight–1 AM | | | **S2**: S1 unchanged + time-seeded RNG (determinism and noise test) |
| **Sat 9 AM–1 PM** | EnemyTracker, engagement utility, retreat/BreakLOS, gun lead and fire gating | A* on 2 m grid + jet/jump edges + stuck detector; zone distance field (time-sliced) | 1 feature per submission: pathing → retreat → engage rules. Target ≥ 3.0 |
| **Sat 1–6 PM** | Position query (cover/exposure/zone/isolation), laser/lightning fire logic, dodge reflexes (shells, laser charge) | Scenario harness + `tools/replay.ts` p99 profiler; offline aim check | Target ≥ 4.0. Harness gate on every submission |
| **Sat 6–11 PM** | Supply-drop contest/third-party logic, loot/cube/NPC farming, upgrade scoring, endgame center-hold | Latency hardening, constructor fallback, cold-start test | Sweeps: aggression ×3, retreat threshold ×3. Trust trends, not argmax |
| **Sun 7–9 AM** | Fix the worst observed failure only | Final candidate submitted 3×; pick by mean of repeats | **Lock at 9:00 AM ET**. No changes after unless already validated |
| Sun 9–11 AM | Buffer, optional video | | Deadline 11:00 AM |

**Features ranked by impact per hour [H]:**

| Rank | Feature | Impact | Hours |
|---|---|---|---|
| 1 | Crash and timeout safety | avoids catastrophic 0s | 1 |
| 2 | Zone-safe travel with ETA | very high | 2 |
| 3 | Face attacker, retreat, break LOS | very high | 3 |
| 4 | Pathfinding around buildings, ledges, stuck recovery | high | 5 |
| 5 | Engagement gating: fight only when likely to win | high | 3 |
| 6 | Weapon pickup (laser/lightning) + fire logic + gun lead | high | 4 |
| 7 | Endgame: HP stacking, final-center hold | high late | 2 |
| 8 | Supply drops | medium-high | 3 |
| 9 | Position query (cover/exposure) | medium-high | 4 |
| 10 | Projectile/laser dodge reflexes | medium | 3 |
| 11 | Sound-fused tracks, third-partying | medium | 3 |
| 12 | Cube/NPC farming, upgrade scoring | medium-low | 2 |

**What not to attempt:** RL or self-play, a full simulator, behavior cloning, a learned aim model, GOAP or HTN, a BT library, switching languages, CMA-ES on submission scores, mortar play, exploiting quirks of the house squad, or a large refactor on Sunday.

## 11. Source index

See `SOURCE_REGISTRY.md`. It lists 78 entries across the 7 agents, each with type and quality. Agents fetched every web source they cite except TS-02, which was a search result only. The coordinator checked the three reused licenses by cloning the repos (flatqueue ISC, flatbush ISC, Diamond modified zlib). Direct URL spot checks from the coordinator's shell were blocked by the network.

## 12. Final technical recommendation, and what would change it

**Build Candidate A**: a deterministic, layered utility bot in TypeScript on bun. Its defaults put survival first: zone-safe silent travel, always face the threat, retreat and regen, fight only when very likely to win, third-party, take drops, and stack HP for the endgame. Tune 4–6 knobs through about 50 practice submissions, with a scenario harness as the regression gate. Ship the first survival-minimal bot tonight.

**Evidence that would change this:**
- **Practice scores identical across resubmissions.** Then practice deltas measure seed overfitting. Weight mechanism reasoning more and add randomness.
- **Public replays exist.** Then they become the main data source: watch the top-scoring teams, the house-bot behavior and our deaths. That could justify a behavior-cloned opponent model for a micro-sim.
- **The house squad punishes hiding much harder than expected** (practice score near 0 while the bot survives long). Then raise aggression for practice only while keeping the FFA caps, since the final is what pays.
- **Bun timing on the judge is more than 2× slower than our measurements**, or `check.py` fails late. Then move to a 4 m grid with precomputed distance fields.
- **A balance change in `hello.config`**, for example a stronger gun or different zone dps. Every threshold above is derived from the config, so recompute the thresholds; the architecture does not change.
