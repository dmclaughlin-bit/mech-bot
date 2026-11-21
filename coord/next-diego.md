# Next for Diego

Written by the coordinator. Do steps 1 to 3 yourself, then paste everything below the second line into your Claude.

1. **Submit S1 now:** `main` at commit `76aabfa` (Build 1), as it is. Add its row to `EXPERIMENTS.md` when the score comes back.
2. While it runs, check the track and team pages for **replays** (Q2) and **whether the latest or the best submission counts** (Q3). Note what you find in `coord/log.md`.
3. When Doug merges Build 2 (target 10:30 PM ET), submit it (S2), and at about midnight submit the **same commit again** (S3) to test determinism.

---

Read `AI-Structure-Development.md` (the team's single source of truth) and `coord/log.md` in `dmclaughlin-bit/mech-bot`. Your task is **`nav.ts`**, a standalone pathfinding module on a branch `nav` off `main`. Don't edit `brain.ts` or any file Doug owns.

Implement exactly the interface in section 4 of the plan (`createNav`, `path`, `eta`, `stuck`):
- A\* on a 2 m grid built at hello from `v2/world.json` prisms and `v2/terrain.i16`. Cells are blocked by buildings and the stadium, and by terrain or ledges steeper than `mech.step_up`. A bridge's underside is walkable.
- Use flatqueue (ISC, vendored in `vendor/` with its license) or an equivalent typed-array heap, integer costs and a closed stamp. A Float32 cost with no closed set took 1.8 s per query in research.
- `path` stops at `budget` node expansions and returns null. `createNav` never throws: on any failure it returns a straight-line Nav.
- Warm up with 20 dummy queries at the end of `createNav`.
- Add `tools/nav-bench.ts`, which builds the grid from the kit's `arena/` and times 1,000 random queries. Target median under 1 ms and max under 10 ms in bun. Put the numbers in the PR.

Open the PR and append an entry to `coord/log.md`. Doug wires it into `brain.ts` for Build 3 on Saturday morning.
