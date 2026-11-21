# Coordination log

Append-only. **Each worker Claude adds one entry in the same push as every change**, newest at the bottom. Grok, the coordinator, reads only what is on GitHub: this file, open PRs, `EXPERIMENTS.md` and the plan. It then writes the next prompts, which Diego's Claude commits to `next-doug.md` and `next-diego.md`. Work on a branch counts: log it on that branch and in its PR description. Rules and roles: `../AI-Structure-Development.md`.

Format:

```
## <Day HH:MM ET> · <Doug|Diego> · <task>
- Did: <one or two lines, with PR or commit>
- Result: <check.py numbers, practice score, or "not submitted">
- Found: <anything the other side should know: a rule, a bug, a number>
- Blocked / next: <one line>
```

---

## Fri 20:00 ET · Diego · Align both Claudes on one plan
- Did: merged the team plan (#1) and research (#3) into one PR, rewrote `AI-Structure-Development.md` as the single source of truth, removed five redundant research docs, added `coord/`.
- Result: Build 1 (`main` @ `76aabfa`) re-checked: `check.py` PASS, 300/300 in time, p99 1.5 ms.
- Found: Build 1 picks up mortars, shoots any visible enemy up to 230 m, and ignores terrain in its cover check. Decisions D3 to D5 in the plan fix these in Build 2.
- Blocked / next: Diego submits S1 now. Doug starts Build 2 (`next-doug.md`).

## Fri 20:15 ET · Diego · Behavior rulebook
- Did: cross-referenced the tactics and game-bot research reports and added the ranked rulebook as §9 of the plan (PR #4).
- Result: docs only.
- Found: the tactics report's `U_fight` risk term `(16 − n)/8` is backwards (0 at 16 alive). Use the game-bots engagement gate (F1) instead, tighter while more than 8 are alive.
- Blocked / next: Doug builds the rules tagged Build 2.

## Fri 20:20 ET · Diego · Grok as coordinator
- Did: added `coord/GROK_BRIEF.md`, made Grok the coordinator in plan §4, and made a `coord/log.md` entry mandatory in every push (plan §5, both next prompts).
- Result: docs only (PR #4).
- Found: Grok can't push, so Diego's Claude commits Grok's prompts into `coord/next-*.md`. Grok reads raw files from `main`, so PR #4 must be merged first.
- Blocked / next: merge PR #4, then start Grok with the onboarding prompt.

## Fri 20:22 ET · Diego · S1 logged
- Did: logged S1 score for Build 1 (`76aabfa`)
- Result: 1.67 (+0.52 vs kit)
- Found: —
- Blocked / next: Doug starts Build 2; Diego starts nav.ts

## Fri 20:30 ET · Diego · nav.ts (Build 3 module)
- Did: added `nav.ts` (plan §4 interface: `createNav`, `path`, `eta`, `stuck`) and `tools/nav-bench.ts` on branch `nav`. 2 m A* with integer costs, typed-array heap, closed stamps, component labels, string-pulled waypoints, 20-query warm-up. No changes to Doug's files.
- Result: kit arena, bun 1.4.4, 1,000 random queries at budget 30k: median 0.33–0.36 ms, p99 6–8 ms, max 8.3–10.1 ms (3 runs). At budget 20k: max 6.3–7.1 ms. Grid build 90–110 ms, `createNav` with warm-up under 200 ms, 65 MB RSS. 448/448 checked paths stay on free cells.
- Found: worst case is set by `budget` (about 0.25 µs per expansion), so use 20k for in-tick calls. 72% of 2 m cells are walkable; the largest region holds 94% of them, so a cross-region query returns null at once. Ground only: no jets, no planned drops, no roofs. `stuck()` is stateful: call it once per decision.
- Blocked / next: Doug wires `nav.path` / `nav.eta` / `nav.stuck` into `brain.ts` for Build 3 (Sat AM).
