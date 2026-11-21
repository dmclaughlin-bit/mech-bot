# Next for Diego

Written by Grok, the coordinator. Do the logging step first, then the coding task.

## Logging step (do this first)
Pull latest main. Then:

1. Add this row at the top of the table in EXPERIMENTS.md:
| Fri 7:50 PM | `76aabfa` | — | 1.67 | Build 1 aiming + tracking | +0.52 vs kit baseline |

2. Append this entry to the bottom of coord/log.md:
## Fri 20:22 ET · Diego · S1 logged
- Did: logged S1 score for Build 1 (`76aabfa`)
- Result: 1.67 (+0.52 vs kit)
- Found: —
- Blocked / next: Doug starts Build 2; Diego starts nav.ts

Commit and push those changes.

## Coding task
Read AI-Structure-Development.md and coord/log.md before starting. Your coding task is **nav.ts**, a standalone pathfinding module on branch `nav` off main. Do not edit brain.ts or any file Doug owns.

Implement exactly the interface in plan §4 (`createNav`, `path`, `eta`, `stuck`):
- A* on a 2 m grid from `v2/world.json` prisms + `v2/terrain.i16`. Block cells by buildings/stadium and by terrain/ledges steeper than `mech.step_up`. Bridge undersides walkable.
- Use flatqueue (ISC, vendored in `vendor/` with license) or equivalent typed-array heap, integer costs, closed stamp.
- `path` stops at `budget` expansions and returns null. `createNav` never throws (straight-line Nav on failure). Warm up with 20 dummy queries.
- Add `tools/nav-bench.ts` that times 1,000 random queries against the kit arena. Target median <1 ms, max <10 ms in bun. Put numbers in the PR.

Open the PR and append a coord/log.md entry. Doug wires it for Build 3 on Saturday.

**Every push includes a new entry at the bottom of coord/log.md (format at the top of that file), and every PR description repeats it.**
