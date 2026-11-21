# Architecture & Systems (Research Agent 5)

Bottom line: build a **utility-driven hierarchical hybrid** in **TypeScript on bun** (the team repo's current setup). It has three layers. A strategic goal scorer runs at about 1 Hz. A tactical utility selector runs every decision, with a commitment bonus so it does not flip between options. The execution layer drives three separate channels: legs, torso and triggers. On top sits a reflex layer for dodging, facing an attacker and getting unstuck. All costly work runs against a hard time budget. I measured bun at about 10–17x faster than pure Python on A* and about 8x faster on LOS rays. Compiled C is only about 1.5x faster than bun. **That is no reason to switch languages.**

## 1. Comparison matrix (scores 1–5, 5 = best for *this* game and team)

| | Effect. | Adapt. | CPU cost | Latency | Build in 40 h | Reliab. | Debug | Training need (5 = none) |
|---|---|---|---|---|---|---|---|---|
| FSM | 2 | 1 | 5 | 5 | 5 | 4 | 4 | 5 |
| Rule system (priority if-then) | 3 | 2 | 5 | 5 | 5 | 4 | 4 | 5 |
| Behavior tree | 3 | 3 | 4 | 5 | 3 | 4 | 4 | 5 |
| Utility AI (IAUS-style considerations) | 4 | 4 | 4 | 5 | 4 | 4 | 3 | 5 (hand-tuned curves) |
| GOAP | 3 | 4 | 2 | 3 | 2 | 3 | 2 | 5 |
| HTN | 3 | 3 | 3 | 4 | 2 | 3 | 3 | 5 |
| RL (end-to-end) | 1* | 4 | 3 | 4 | 1 | 1 | 1 | 1 |
| Hierarchical (strategic/tactical/execution) | 4 | 4 | 4 | 4 | 3 | 4 | 4 | 5 |
| **Hybrid: hierarchy + utility selector + reflexes** | **5** | **4** | **4** | **5** | **4** | **4** | **4** | **5** |

\*RL could be strong in principle. Here there is no local simulator; the only real signal is 48 practice matches per submission at 4 submissions an hour. An RL agent cannot be trained in 40 h. OpenAI Five needed a vast amount of compute (AR-06).

How I scored them: FSM and rule systems are fast to build but turn into brittle hard-coded priorities once many drives interact (zone, drop timer, HP, energy, loot, enemies heard but not seen). A BT's priority order is fixed (Halo 2, AR-03), while our choices are continuous trade-offs, so scoring fits better. Utility AI (Infinite Axis, AR-01) scores each option as a product of response curves and is tuned through parameter files. GOAP and HTN (AR-02, AR-04) do multi-step plans well, but our plans are short and the world changes every 0.1 s. Layered goals over movement and combat follow the Quake III bot (AR-05).

## 2. Recommended architecture

**Does strategic/tactical/execution fit?** Yes, with two changes:
1. Split execution into **independent channels**. The legs (`move`/`boost`/`jump`) are independent of the torso (`aim`), and both are independent of the triggers. The best play is often "path to the zone, torso tracking the threat, firing when the aim error is small".
2. Add a **reflex layer** that can override a channel for one tick (dodge, face attacker, unstick) without changing the chosen behavior.

### Component diagram

```
            hello (config, map)                      obs (10 Hz)
                  |                                       |
                  v                                       v
     +--------------------------+          +---------------------------------+
     | MapPrep (at hello, <8 s) |--------->| WorldModel (every obs)          |
     | H1/H2 height grids,      | static   |  Self state, zone/drop timers   |
     | occupancy, nav flags,    | layers   |  EnemyTracker (vision+memory+   |
     | edge hash (LOS), cover,  |          |   sound+damage events)          |
     | bridge/tree/barrier data |          |  ProjectileList (+impact pred.) |
     +--------------------------+          |  LootIndex (pickups/crates/cubes)|
                                           |  ThreatMap (cheap, per tick)     |
                                           +---------------+-----------------+
                                                           |
        +--------------------------------------------------+-------------------+
        v                                                  v                   |
 +---------------------+  goal (pos, kind, deadline) +-------------------+     |
 | StrategicPlanner    |---------------------------->| TacticalSelector  |     |
 | ~1 Hz, utility over |                             | every decision:   |     |
 | ZoneSafe, Drop,     |<--- replan triggers --------| score behaviors,  |     |
 | Loot, NPC farm,     |  (zone change, drop called, | +commit bonus,    |     |
 | Hide/Regen, Endgame |   HP shock)                 | pick 1 + target   |     |
 +---------------------+                             +---------+---------+     |
                                                               | intent        |
                       +------------------+--------------------+--------+      |
                       v                  v                    v        |      |
               +---------------+  +---------------+  +----------------+ |      |
               | Legs: path    |  | Torso: aim    |  | Triggers: fire | |      |
               | follow, jet/  |  | lead, slew,   |  | rules per wpn, | |      |
               | jump, unstick |  | face-threat   |  | reload, take   | |      |
               +-------+-------+  +-------+-------+  +--------+-------+ |      |
                       +----------+-------+-------------------+         |      |
                                  v                                     |      |
                         +------------------+     Reflexes (dodge shell,|      |
                         | ActionComposer + |<----face attacker, stuck)-+      |
                         | DeadlineGuard    |                                  |
                         +--------+---------+---- PathService (time-sliced A*, |
                                  v                distance fields) <----------+
                        action JSON (+debug)
```

### Modules

**MapPrep** (runs in the bot constructor; the wrappers call `make_bot`/factory synchronously before sending `ready`):
- Load `terrain.i16`: a 1070×724 vertex grid, **774,680 cells at 1 m and 193,670 at 2 m** (not 1.1M).
- Rasterise the 223 building and 27 stadium prisms by scanline (ring plus holes) into `occ` (prism id per cell) and `H1` = max(terrain, top). Bridges (9) go in a separate list of deck heights (`base`/`top`); under a bridge you pass if clearance is ≥9 m.
- Add barriers (185 polylines, `blocks`, height 1.6 m) as one-cell walls. Mark water and cars (446) as high-cost or blocked.
- Build `H2` (2 m) as the max of each 2×2 block.
- Store a nav flag per directed edge: walk (dh ≤ step_up 1.2 from config), jet (1.2 < dh ≤ about 55 m, cost about 3·dh+10, which needs energy), or blocked (towers over 60 m, slopes over 50°).
- **LOS structure:** a spatial hash of all prism edges in 8 m buckets (10,596 edges), each edge carrying base/top. A ray walks the buckets and tests segment against edge in 2D, then checks z at the hit. Separately, sample the terrain heightfield along the ray every 2 m. Trees are a sight-only layer (1560 trunks/crowns in a 16 m hash): they count for "can they see me", never for "can I hit".
- **Cover map:** for each ground cell next to a building wall, store the outward wall normal and the wall height. A cover query at runtime is then "nearby cells whose wall normal points away from the threat bearing, plus a LOS check".

**WorldModel**:
- **EnemyTracker:** one track per mech id, with fields `pos, vel, lastSeen, source(vision|memory|sound|damage), posSigma, hp, weapons, charging, aimYaw, threat`.
  - Vision resets sigma to 0.
  - The server's 5 s memory keeps a mech listed in `mechs`. After it drops out, dead-reckon for at most 2 s, then grow sigma by about 12 m/s.
  - A sound adds a bearing plus a distance-band hypothesis (σ 7°). Associate it with an existing track by bearing gate and weapon kind (sound reveals the weapon), else create a ghost.
  - `damaged.by`/`bearing` pins the attacker id and bearing.
  - Remove a track on a `kill` event or when `alive` drops and the track is stale.
  - Precompute per track: time-to-kill each way (HP, their weapons vs mine, the triangle rule, ×1.5 rear), and whether they have LOS to me.
- **ProjectileList:** visible enemy shells and bullets with velocity. Predict mortar impacts analytically (g from config) and gun-bullet closest approach to my cylinder over the next 0.5 s. Output a "danger" set for Reflexes.
- **LootIndex**, plus the zone (current and next circle, time to shrink, my distance to the safe edge) and drops (`lands_in`, holder, contested).

**StrategicPlanner** (~1 Hz, or on triggers):
- Uses utility over goals: `ZoneSafe` (be inside the next circle with margin before shrink_start), `CaptureDrop` (if reachable before others: ETA vs the ETA of known tracks), `Loot(kind)` (weapon gaps and the counter-triangle), `FarmNPC` (cubes, only when healthy and no enemies near), `Hide/Regen` (5 s without damage gives 45 HP/s), `Endgame` (take high ground or cover inside the final circles).
- Output: a goal position, a kind, a deadline, and a "budget for risk".

**TacticalSelector** (every decision): roughly 8 behaviors, each scored as a product of curves with compensation (AR-01): `Engage`, `Kite/Peek` (fight from cover edge), `BreakLOS/Flee`, `ThirdParty` (attack a damaged mech that is busy with someone else), `Loot/Take`, `HoldDrop`, `Travel` (pursue strategic goal), `FightNPC`.
- Add a commitment bonus (×1.25 to the current behavior) and a minimum dwell of 0.5 s to stop oscillation.
- Output: an intent `{moveGoal|path, faceTarget|aimPoint, fireMask, boostPolicy}`.

**Execution**:
- **Path follower.** Run A* on H2 and refine the near segment with H1. Steer toward the lookahead point. Wall sliding is server-side, so steering is simple.
  - Jet edges: if the next edge needs to climb by dh, and energy ≥ (dh/60)·100 plus a 15 margin, then `jump` when grounded, hold `boost` in the air until feet are higher than the ledge plus 0.5, then move over it. Otherwise re-path with jet edges disabled.
  - Stuck detector: if moved less than 1 m in 1.5 s while commanding motion, unstick (strafe perpendicular plus jump, then blacklist that edge for 10 s).
- **Aim.** Iterative lead: solve t = |p + v·t − muzzle| / speed in 2–3 iterations; mortar uses the ballistic solution (prefer the low arc, the high arc to lob over a roof). Account for torso slew (4 rad/s yaw, 3 pitch): fire only when the angle between `self.aim` and the solution is under the target's angular radius at that distance. When idle, aim at the highest-threat bearing (facing it halves the rear ×1.5 risk).
- **Fire logic** per weapon:
  - gun: track ammo, reload early when out of combat;
  - laser: start charging when the predicted LOS will hold for 0.75 s, release when charge is full or LOS is about to break;
  - lightning: only when the target is inside 45 m and the 30° cone;
  - mortar: avoid targets within 10 m (self-splash).
- **Dodge.** For predicted shell impacts within 7 m of my position, add a lateral move component away from the impact (boost if energy > 30). For laser `charging` aimed at me, strafe perpendicular to the beam just before release, or break LOS.

### Per-tick data flow (target 10–20 ms, hard cap 35 ms)

1. Parse obs (the wrapper does this) → `WorldModel.update(obs)`, about 0.3 ms.
2. Triggers: strategic replan if more than 1 s has passed or a trigger fired (≤5 ms, else time-sliced).
3. `TacticalSelector.score()`: about 8 behaviors × ≤6 tracks, with ≤200 LOS rays at about 1 µs each, so under 1 ms.
4. PathService: continue the incremental A* or distance-field job until the budget mark (`deadline − 8 ms`).
5. Legs, Torso and Triggers compute → Reflex overrides → `ActionComposer`. Debug output only every 5th tick.
6. DeadlineGuard: if the elapsed time exceeds 35 ms at any checkpoint, return the last composed action with fresh `aim`/`fire`.

## 3. Compute budget: measured

Setup: dev container (4 vCPU, unknown clock), single-threaded, real map, 8-connected grid with jet-penalty edges, random ground cell pairs 150–400 m apart, 40 queries (6 for Python at 1 m). **Assume the judging core is up to 2x slower.**

| Workload | Python 3.13 (stdlib) | node 22 | **bun 1.4.4** | C -O2 |
|---|---|---|---|---|
| A* 2 m grid (193,670 cells): median / p90 / max | 3 / 16 / 28 ms | 0.3 / 3.7 / 7.1 ms | **0.3 / 2.6 / 4.1 ms** | 0.22 / 0.66 / 3.1 ms |
| A* 1 m grid (774,680 cells) | 12–193 ms (6 queries); one 20-query run grew past **4 GB RSS**, killed | 2.2 / 11.2 / 23.3 ms | **1.9 / 9.5 / 18.5 ms** | 1.2 / 7.0 / 9.1 ms |
| Cost per A* expansion | ~3 µs | ~0.2 µs | **~0.18 µs** | ~0.12 µs |
| Full Dijkstra distance field, 2 m | n/m | 46 ms | **56 ms** | n/m |
| LOS ray 20–200 m vs 259 prisms (edge hash 8 m, 61% blocked) | 5.0 µs | n/m | **0.6 µs** (build 5 ms) | n/m |
| Map preprocessing (load + rasterise + coarsen) | 51 + 70 + 70 ms | | (faster) | |

(n/m = not measured.)

**What the numbers mean:**
- In bun, a 2 m A* fits easily inside one tick. A 1 m A* across the map usually fits, but its tail (18 ms, maybe 36 ms on a slow core) does not fit alongside everything else. So **plan on 2 m, refine locally on 1 m within about 40 m**.
- A whole-map distance field (about 56 ms) must be **time-sliced** across 3–6 ticks, or built inside the 20 s `ready` window for the known zone center.
- LOS is cheap: 1000 rays/tick costs about 1 ms. Terrain and tree checks may make it 2–3x more.
- Pure Python is 10–17x slower on search. Its dict/tuple A* can exceed the **512 MB** limit, so it needs flat typed arrays and an expansion cap. Python only works with numpy plus a coarse grid.
- C/Rust/Go gain only about 1.5x over bun, at the cost of rewriting the wrapper, the Dockerfile and the team's working loop.
- **Recommendation: TypeScript on bun, as the repo already is.**

**Memory.** The 1 m grids as Float32/Int32 cost about 3 MB each. All the layers (H1, H2, occ, nav flags, cover, A* scratch for both grids, 2–3 distance fields) come to well under 60 MB. Avoid JS object-per-cell structures.

**Precomputation and runtime strategies:**
1. **At hello (budget ≤8 s, because the 20 s also covers container start and bun JIT warm-up):** grids, nav flags, edge hash, cover cells. Warm the JIT by running 20 dummy A* queries; the first queries in bun/node are slower.
2. **Coarse planning grid at 2 m** (or 4 m, 48k cells, for long strategic ETA estimates). Use 1 m only near the mech and for ledge decisions.
3. **Cached distance fields:** one to the next zone center (rebuild when `next_center` changes, about 4 times a match), and one per called supply drop. These turn "ETA to X" and "direction to X" into O(1) lookups for the utility scorers, and remove most A* calls.
4. **Incremental replanning:** keep the path. Re-path only when the goal moves more than 8 m, the mech is more than 4 m off the path, or the stuck detector fires. Otherwise just advance the path index.
5. **Time slicing:** A* and Dijkstra run as resumable jobs with an expansion budget of about 30k per tick (about 6 ms in bun).
6. **DeadlineGuard:** check `performance.now()` at each checkpoint. Above 35 ms, emit the last action. Never block on anything; the wrappers have no timeout of their own, and a late line is simply dropped (coast, then idle after 1 s).
7. **No GC pauses:** preallocate the heap and scratch arrays.

## 4. Integration and code layout (in `mech-bot/`, bun runs `.ts` directly)

```
bot.ts                 entry: run(h => new Brain(h)); keep mechfight.ts unmodified
mechfight.ts           kit wrapper (unchanged)
src/brain.ts           Brain.act(): tick pipeline, DeadlineGuard, top-level try/catch
src/params.ts          load params (defaults + params/*.json selected by env PARAMS)
src/map/prep.ts        terrain/prism rasterisation, nav flags, cover
src/map/los.ts         edge hash + terrain + tree sight
src/map/nav.ts         A*/Dijkstra jobs (typed arrays, resumable), path smoothing
src/world/model.ts     self, zone, drops, loot index
src/world/tracker.ts   EnemyTracker (vision/memory/sound/damage fusion)
src/world/projectiles.ts impact prediction
src/strategy/planner.ts goal utilities (1 Hz)
src/tactics/selector.ts behaviors + considerations + curves
src/exec/legs.ts  src/exec/aim.ts  src/exec/fire.ts  src/exec/reflex.ts
src/debug.ts           stderr logger (ring buffer, rate-limited) + debug draw helpers
tools/replay.ts        feed check/ recorded obs, profile act() p50/p99, assert <35 ms
params/default.json  params/aggressive.json ...
```

**Parameter file.** Put every curve (min, max, exponent, weight), threshold (engage HP ratio, zone margin, energy reserve, commit bonus) and timing constant in JSON. A `PARAMS` env var chosen in the Dockerfile `ENTRYPOINT`/`ENV` gives cheap A/B variants across the 4 submissions an hour without code changes. Read all game numbers from `hello.config`, never hard-coded.

**Logging.** stderr only. Matches do not show stderr; only the end of stderr from a failed conformance check is shown. So log for local runs: one compact line per strategic decision, and a timing histogram every 100 ticks. Rate-limit logging, because a blocked stderr pipe could stall the bot.

**Debug drawing.** The server strips it from public replays and nothing on the track shows it, so it is only useful in local tools. Keep it behind a flag and send it at most every 5th tick: path (≤20 lines), track ghosts with sigma, chosen behavior as the `label`.

**Local test loop.** `check.py` plus `tools/replay.ts` for timing and crash regression, always under the full Docker sandbox flags.

## 5. Major technical risks and mitigations

| Risk | Mitigation |
|---|---|
| **Timeouts** (>2% late fails the check; late in a match means coasting, then idle) | DeadlineGuard at 35 ms; resumable jobs; expansion caps; JIT warm-up at hello; preallocated memory; profile p99 with `tools/replay.ts` inside `--cpus 1` docker. |
| **Crash means idle for the rest of the match** | The wrapper catches exceptions in `act()` and resends the last continuous action, but repeated failures leave a mech frozen in place. So: a top-level try/catch in `Brain.act` with per-module fallbacks (planner fails → keep the old goal; nav fails → move straight toward the zone center; aim fails → aim at the nearest track); process-level `uncaughtException`/`unhandledRejection` handlers that log and continue. A **constructor failure leaves the bot null for the whole match**, so MapPrep must also be wrapped, with a degraded no-map mode. |
| **`ready` late (20 s includes container start)** | MapPrep at most 8 s with a time check. If over, skip the optional layers (cover, 1 m nav flags) and build them lazily. Test cold start in docker. |
| **Stuck on walls, ledges, eaves, fences, under bridges** | Explicit jet-edge execution with an energy check; stuck detector, then unstick manoeuvre, then edge blacklist; bridges modelled as decks with clearance; barriers rasterised; prefer walk edges by cost. |
| **LOS misestimates** (prism-only model; trees block sight but not shots; LiDAR terrain bumps) | Separate "can hit" (prisms + terrain) from "can see / be seen" (adds trees); sample from muzzle and eye heights (z+7, z+8) to several target heights; treat a shot that hits no target (no `hit` event) as a sign of blocked LOS and adapt. |
| **Zone death from bad ETA** | ETA comes from the distance field, not the straight-line distance; safety margin as a parameter; ZoneSafe utility rises sharply as the time margin approaches 0. |
| **Utility oscillation** | Commitment bonus, minimum dwell, hysteresis on thresholds. |
| **Overfitting to the house squad** | Keep the parameters general; read the map and all game numbers from `hello` at runtime. |

## Sources

| ID | Title | URL | Type | Finding used | Quality |
|---|---|---|---|---|---|
| AR-01 | Infinite Axis Utility System (Dave Mark, gameai.com) | https://gameai.com/iaus.php | Practitioner page / GDC talk index | Considerations × response curves, compensated product, used at MMO scale | Medium-high (originator) |
| AR-02 | Orkin, "Three States and a Plan: The A.I. of F.E.A.R." (GDC 2006) | https://pages.cs.wisc.edu/~dyer/cs540/handouts/gdc2006_orkin_jeff_fear.pdf | GDC paper | GOAP: FSM reduced to Goto/Animate/UseObject; the planner picks actions | High |
| AR-03 | Isla, "Handling Complexity in the Halo 2 AI" (GDC 2005) | https://gamedeveloper.com/programming/gdc-2005-proceeding-handling-complexity-in-the-i-halo-2-i-ai | GDC proceeding | BT/priority-list behavior DAG, impulses, behavior masks | High |
| AR-04 | Humphreys, "Exploring HTN Planners through Example" (Game AI Pro) | https://www.taylorfrancis.com/chapters/edit/10.1201/9780429055058-9/exploring-htn-planners-example-troy-humphreys | Book chapter | HTN decomposition and replanning cost/trade-offs for game agents | High |
| AR-05 | van Waveren, "The Quake III Arena Bot" (thesis, TU Delft 2001) | https://www.cs.rochester.edu/u/brown/242/docs/QuakeIII.pdf | MSc thesis | Layered bot: area-awareness nav + fuzzy goal selection + combat/aim | High |
| AR-06 | OpenAI et al., "Dota 2 with Large Scale Deep RL" (arXiv 1912.06680) | https://arxiv.org/abs/1912.06680 | Paper (cited from memory, not re-fetched) | Superhuman RL needed months of large-scale self-play: not possible in 40 h | High |
| AR-07 | Local micro-benchmarks (this agent) | /tmp/claude-0/bench/ (prep.py, astar.py, los.py, bench.ts, a.c) | Measurement | Timings in §3 | Medium (dev box ≠ judge CPU; synthetic queries) |
