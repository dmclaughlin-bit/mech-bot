# Coordination log

Append-only. Each worker Claude adds one entry at the end of every task, newest at the bottom. The coordinator reads this, open PRs and `EXPERIMENTS.md`, then rewrites `next-doug.md` and `next-diego.md`. Rules and roles: `../AI-Structure-Development.md`.

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
