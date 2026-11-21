# Open-source code we can reuse (Research Agent 2)

**Constraint update:** the bot is TypeScript on bun with no deps. So the main candidates are single-file, zero-dependency JS/TS code we can vendor. Python results are reference only.
**Method:** I read license files and source over raw.githubusercontent.com. The GitHub API, codeload and jsDelivr listings were blocked, so I give last-release dates from the npm/PyPI registries. I benchmarked on the real map: 250 building/stadium footprints from `arena/v2/world.json`, rasterized to a 2 m grid of 534x361 cells (21.9% blocked) with 9,728 wall edges. Each library ran on 50 random start/goal pairs under bun and under node 22 in this container. Bench scripts: `/tmp/claude-0/bench/b.mjs`, `/tmp/claude-0/bench/b.py`.

## Ranked table

| # | Item | Lang | License (verified) | Last release | Use for | Bench (bun) | Effort |
|---|---|---|---|---|---|---|---|
| 1 | **mourner/flatqueue** | JS, 130 lines | ISC | 2025 (v3) | Binary heap behind our own typed-array A* and Dijkstra | Hand-rolled A* on the 2 m grid: median 1.5 ms, p90 7.2, max 19.6 ms. Full-map Dijkstra flow field: 16.8 ms | 0.5 h vendor + 2 h A* |
| 2 | **mourner/flatbush** | JS, 565 lines (needs flatqueue) | ISC | 2026-10-30 (4.7.0) | Static R-tree over building edges: LOS raycasts, cover queries, "is this shot blocked" | **3.1 µs per segment LOS under bun** (1.1 µs under node) | 1.5 h |
| 3 | **Voidious/Diamond**, `voidious/move/MeleeMover.java` | Java | modified zlib (permissive, attribution) | repo 2009-2012 | Port of the minimum-risk melee movement formula (ex-Melee #1 Robocode bot) | n/a (we port about 40 lines) | 2 h |
| 4 | Hand-rolled lead and mortar solvers (closed form, below) | TS | ours (MIT) | n/a | Gun lead, mortar pitch | Microseconds | 1–2 h |
| 5 | qiao/PathFinding.js (`pathfinding` on npm) | JS | MIT (in README and package.json; no LICENSE file) | npm 0.4.18, 2016 | Reference only | JPS median 8.2 ms, **max 183 ms**; A* max 60 ms. Rebuilds the grid each call (16 ms `clone`) | Do not use |
| 6 | nikkorn/mistreevous | TS | MIT (dep `lotto-draw` MIT) | 4.3.1, 2025-07 | Behaviour trees from a DSL | not benched | 3 h; not worth it |
| 7 | behavior3/behavior3js | JS | MIT | 0.2.2, 2017 | Behaviour trees | — | Do not use |
| 8 | anvaka/ngraph.path | JS | MIT | 1.6.1, 2025-11 | A*/NBA* on an explicit graph (waypoint graph) | — | Only if we build a waypoint graph |
| 9 | libtcod/python-tcod (Python reference) | C via Python | BSD-2 | 21.2.4, 2026-11 | C-speed A* and Dijkstra maps | A* mean 7.7 ms, max 54 ms; Dijkstra 28 ms | Python only |
| 10 | NeuralMMO/environment, kywch/meta-mmo, opendilab/gobigger | Python | MIT / MIT / Apache-2.0 | nmmo 2.1.2, 2024 | RL survival environments with a shrinking zone | — | Not usable |

## Notes per repo

**flatqueue (OS-01).** A binary heap that stores ids and priorities in typed arrays: `push(id, priority)`, `pop()`, `clear()`, `length`. It has no dependencies, so we vendor `index.js` (ISC header kept). Our A* around it uses flat typed arrays for g, came-from, a generation stamp and a closed set, with 8-way octile moves and no corner cutting.
- Worst cases are searches for unreachable goals (courtyards fully inside a building footprint), which expand the whole connected region.
- **Fix:** precompute connected-component labels when `ready` arrives and snap goals to the nearest cell in the bot's own component. Then A* stays well under 10 ms.
- **Bug we hit, so we don't repeat it:** with g in a `Float32Array` and no closed set, one query expanded 5.9 M nodes and took 1.8 s. Rounding to float32 keeps re-opening nodes. Use `Float64Array` (or integer 10/14 costs) plus a closed stamp.
- **Flow fields:** one 8-way Dijkstra over the whole map from a goal (zone centre, drop ring) takes about 17 ms. That fits in one tick, or can be spread over 2–3 ticks. After that, every tick's path query is O(1) gradient descent. This is the best fit for "go to the next zone / drop" with 15 hunters around.

**flatbush (OS-02).** A packed Hilbert R-tree with `add(minX, minY, maxX, maxY)`, `finish()`, `search(bbox)` and `neighbors(x, y, k, maxDist)`. Its only dependency is flatqueue.
- **LOS:** index each building edge's bounding box once at load (250 polygons, 9.7 k edges, under 5 ms). A raycast is `search(segment bbox)` followed by an exact segment-segment orientation test. That cost about 3 µs per query, so 1,000 LOS checks per tick is roughly 3 ms.
- **Height:** compare the ray's z at the crossing with the prism `top` so we can shoot or see over low roofs and bridges.
- **Trees:** they block sight but not shots, so put them in a separate index (1,560 points) and use `neighbors`.
- **Other uses:** cover search ("nearest wall that breaks LOS from enemy E"), mortar arcs over buildings, and the vision model.

**Diamond MeleeMover (OS-03).** I read `voidious/move/MeleeMover.java` (273 lines).
- **Candidates:** 64 points on a circle of radius min(100–200 random, distance to nearest enemy).
- **Risk per candidate:** Σ over live enemies of `clamp(E_enemy/E_me, .25, 4) * (1+|cos(bearing_enemy − goAngle)|) * damageFactor / (d² * (botsCloserThanMe(0.8·d²)+1))`. The cos term penalises moving straight toward or away from an enemy, because perpendicular moves are harder to hit.
- **Anti-repetition:** multiply by `(1 + Σ_recent 30/dist²)` over the last 50 own positions. Keep the current destination with a 0.8 bias.
- **Port:** about 40 lines of TS. Add our own terms: zone (distance outside the next circle × dps), LOS (an enemy behind a wall is about 0 risk, via flatbush), rear exposure (×1.5), and drop rings as negative risk.
- **Licence:** zlib-style, so we can redistribute modified code if we mark it altered and keep the notice. Writing a fresh port from the formula with credit in the README is cleanest.
- Diamond's README also lists "Displacement Vectors" and the "Shadow" melee gun.
- **DrussGT (OS-04)** is the 1v1 wave-surfing and guess-factor champion. Its terms ("derivatives MUST be open source", no use in competitions without permission) make it **ideas only, no code**.

**Techniques that transfer (ideas, no code reuse needed).**
- **Guess-factor targeting:** our gun at 252 m/s needs 0.6 s to cover 150 m. In that time a walking mech covers 7 m (11.7 m/s) and a boosting one 11.7 m (19.5 m/s), against a 2.5 m radius. Linear lead is the baseline. Against final-stage bots that dodge, log each enemy's lateral displacement over the flight time, binned by lateral velocity and distance, and aim at the densest bin.
- **Wave dodging:** enemy gun and mortar projectiles appear in our observation with their velocity, which is better information than Robocode gives. So we don't need statistical surfing: predict the closest-approach time of each projectile and side-step. That needs no library.

**PathFinding.js (OS-05).** JPS spikes to 183 ms, and its per-query `grid.clone()` alone costs 16–24 ms. It is too slow for 50 ms ticks and has been unmaintained since 2016. Our own A* is 5–10× faster.

**Behaviour-tree libraries (OS-06, OS-07, py_trees OS-11).**
- mistreevous is fine (MIT, TS, `step()` per tick), but it adds a DSL and an async model.
- behavior3js is unmaintained.
- py_trees is BSD-3, Python only, and pulls in `pydot`.
- **Verdict:** our decision layer is small (about 6 modes: loot, rotate, fight, flee, drop, third-party). Hand-rolled utility scoring is faster to write and to tune from 48-match feedback: score each mode every tick, add hysteresis, then run that mode's controller. Skip BT libraries.

**ngraph.path (OS-08).** Only needed if we switch to a waypoint or visibility graph built from building corners. The grid plus flow fields already fit the budget.

**Python reference (OS-09, OS-10, OS-12).**
- python-tcod `SimpleGraph` and `dijkstra2d` run in C. The wheel is 10.4 MB and needs numpy (15.7 MB).
- python-pathfinding (MIT): A* mean 80 ms, max 136 ms. Too slow.
- Pure-Python heapq A*: mean 166 ms, max 1.2 s.
- Shapely STRtree LOS: 44 µs per query.
- **numpy:** irrelevant now that we're on bun. In Python it would matter only for vectorised rasterising and flow fields. Pure-Python grid A* fails the 50 ms budget at 2 m resolution.

**Battle-royale / RL repos (OS-13 to OS-15).**
- NeuralMMO (MIT) and Meta MMO (MIT) are tile-based survival environments with a closing fog; gobigger (Apache-2.0) is agar.io-style.
- Different physics, Python, and they need training. **Not usable** in 40 h.
- **Local sim:** none of the repos I checked can be adapted as a fast simulator for this game. The kit's 48-match submission is the only real signal. At most we can build a thin TS checker that validates lead and LOS against `check/stream.jsonl.gz`.

## Solvers to hand-roll (no library is worth it)

`ballistic-solver` (OS-16, MIT) models drag, which our game doesn't have, so it's overkill. The protocol says the gun "flies straight (no drop)" and the mortar falls at g = 22 with no drag.

- **Gun lead:** shooter S (muzzle z = pos.z + 7·size), target P and velocity V, speed s = 252. Let D = P − S. Solve (V·V − s²)t² + 2(D·V)t + D·D = 0 for the smallest t > 0. Aim at P + V·t. Iterate once with acceleration if the target is boosting. Check t·s ≤ range 230, and clear the line with flatbush.
- **Mortar pitch:** horizontal distance x, height difference y, v = 72. tanθ = (v² ± √(v⁴ − g(g x² + 2 y v²))) / (g x).
  - **Low root** for speed.
  - **High root** to lob over buildings. Check the arc's apex against prism tops along the path.
  - **Flight time:** t = x / (v cosθ).
  - **Moving target:** iterate 3× on P + V·t. Aim 1–2 m short of the feet, since splash r 7 m is blocked by walls.
  - **Reachability:** the discriminant is < 0 when the target is out of reach (max range about 235 m).

## Reuse plan

| Bot module | Source | How |
|---|---|---|
| `nav/heap.ts` | flatqueue (ISC) | Vendor verbatim and keep the ISC header |
| `nav/grid.ts`, `nav/astar.ts`, `nav/flowfield.ts` | Ours, modelled on the benchmarked loop | 2 m grid at `ready` (rasterize polygons with a point-in-polygon scanline), slope from terrain.i16, component labels, A* with Float64 g and a closed stamp, Dijkstra flow field to the zone or drop |
| `geom/spatial.ts` (LOS, cover) | flatbush (ISC) | Vendor `index.js` and convert it to TS or add a `.d.ts`. One index for wall edges, one for trees |
| `move/risk.ts` | Port of Diamond MeleeMover risk (zlib) | Credit in the README; extend with zone, LOS, rear and drop terms |
| `aim/lead.ts`, `aim/mortar.ts` | Ours | Closed forms above |
| `brain/utility.ts` | Ours | Utility scores plus hysteresis; no BT library |

**README credits:** "flatqueue and flatbush © Vladimir Agafonkin, ISC; movement risk function adapted from Diamond by Voidious (zlib licence, altered)." ISC and zlib are both compatible with our MIT repo. Keep each licence text in `vendor/LICENSES/`. Vendored size is under 30 KB.

## Sources

| ID | Title | URL | Type | Date | Finding | Quality | License |
|---|---|---|---|---|---|---|---|
| OS-01 | flatqueue | https://github.com/mourner/flatqueue | repo (read index.js, LICENSE) | 2025 | Fast typed-array heap; A* median 1.5 ms on map | High, benchmarked | ISC |
| OS-02 | flatbush | https://github.com/mourner/flatbush | repo (read index.js, LICENSE) | 4.7.0, 2026-10-30 | LOS 3 µs per query on 9.7 k edges | High, benchmarked | ISC |
| OS-03 | Diamond (Voidious) | https://github.com/Voidious/Diamond | repo (read LICENSE, README, MeleeMover.java) | 2009–2012 | Minimum-risk melee formula | High | modified zlib |
| OS-04 | DrussGT (RoboWiki) | https://robowiki.net/wiki/DrussGT | wiki | ongoing | Wave surfing + GF/DC; restrictive terms | Medium | custom, restrictive |
| OS-05 | PathFinding.js | https://github.com/qiao/PathFinding.js | repo + npm | 0.4.18, 2016 | JPS max 183 ms; too slow | High, benchmarked | MIT |
| OS-06 | mistreevous | https://github.com/nikkorn/mistreevous | repo (LICENSE, README) | 4.3.1, 2025-07 | Workable BT, not needed | Medium | MIT |
| OS-07 | behavior3js | https://github.com/behavior3/behavior3js | repo (LICENSE) | 0.2.2, 2017 | Stale | Low | MIT |
| OS-08 | ngraph.path | https://github.com/anvaka/ngraph.path | repo (LICENSE) | 1.6.1, 2025-11 | Graph A*, zero deps | Medium | MIT |
| OS-09 | python-tcod | https://github.com/libtcod/python-tcod | repo (path.py, LICENSE) | 21.2.4, 2026-11 | C A*: mean 7.7 ms, max 54 ms; Dijkstra 28 ms | High, benchmarked | BSD-2 |
| OS-10 | python-pathfinding | https://github.com/brean/python-pathfinding | repo (finder.py, a_star.py, LICENSE) | 1.0.23, 2026-10 | Mean 80 ms; too slow | High, benchmarked | MIT |
| OS-11 | py_trees | https://github.com/splintered-reality/py_trees | repo (LICENSE) | 2.6.0, 2026-09 | Python BT, needs pydot | Medium | BSD-3 |
| OS-12 | Shapely | https://github.com/shapely/shapely | repo (LICENSE) + bench | 2.2.0, 2026-10 | STRtree LOS 44 µs per query | High, benchmarked | BSD-3 |
| OS-13 | Neural MMO | https://github.com/NeuralMMO/environment | repo (LICENSE) | nmmo 2.1.2, 2024-08 | Survival RL environment; not transferable | Medium | MIT |
| OS-14 | Meta MMO | https://github.com/kywch/meta-mmo | repo (LICENSE) | 2024 | Same | Medium | MIT |
| OS-15 | GoBigger | https://github.com/opendilab/gobigger | repo (LICENSE) | — | agar.io-style environment; not transferable | Low | Apache-2.0 |
| OS-16 | ballistic-solver | https://github.com/ujinf74/ballistic-solver | repo (LICENSE) + PyPI | 1.3.0, 2026-10 | Drag solver, overkill; use closed form | Medium | MIT |
