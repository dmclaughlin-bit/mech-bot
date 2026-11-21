# Current status for researchers (read this first)

Updated by Grok, Sat Nov 21 2026, 2:00 PM ET. Grok updates this file whenever the champion or the in-flight list changes. The canonical data is `coord/data/` (site_results.csv, ideas.md, screens.csv, hazard_screens.csv).

## Champion (base for all research and builds)
- **P-D-003 drop run**, commit `4d6e71bf3e2aa823e0c8c24dbc0e155d03f36971`, site **4.10** (BB-DA9AC664), merged to main `9168d841c734ec6970340322600feb89f9c27ce6`.
- Stack on top of B80 (3.79): **B103 lightning ambush** (3.92, `LIGHT_AMBUSH_ON`: lightning holder with no laser, seen by exactly one enemy at 45–90 m, steps out of sight and waits) + **P-B-001 standoff break** (`STANDOFF_BREAK_S=60`, 4.06) + **P-D-003 supply-drop run** (`DROP_RUN_M=150`).
- Research line numbers must be on current main, not B80 or the 4.06 tree. PR #98's audit used B80 lines; re-locate before citing.
- A build keeps only if its site score is strictly above 4.10.
- Bot code on main equals `4d6e71b`. Flag 0 must be byte-identical to this main.

## Rules that affect research
- The site score is the only truth. The sim is a crash/timing/flag-0 screen (sim vs site held-out r about 0.2). Don't rank ideas by sim delta.
- Score tracks our kills. Kill rate drops after 120 s. Ideas that add kills mid/late game are the best bet.
- One change per build, behind a flag, flag 0 byte-identical to main.
- Sequence rule: one submission scored at a time; queued builds are rebased onto any new best before submission. Never submit while a score is pending.
- Queue priority: (1) site-result-driven ideas first — tweaks of the current best, and rebuilds of anything that beat its own parent; (2) Diego's research ideas fill leftover slots only, after a sim trigger count of about 10 of 192 games or more; (3) ideas in the same family as a recent loss go last. The finish-burst family is last after B108 (3.75). The threat-forecast type (S2 / P-D-002, site 3.79) now also ranks lower after a loss.

## Site results today (since B80)
| Build | Change | Parent | Site | Verdict |
|---|---|---|---|---|
| B103 | lightning ambush | B80 3.79 | 3.92 | KEEP |
| B104 | supply-drop run `DROP_RUN_M=150` | B80 3.79 | 3.88 | CLOSE (+0.09 over its parent; rebuilt on 4.06 as B107) |
| P-B-001 | standoff break | B103 3.92 | 4.06 | KEEP (previous champion; still in the stack) |
| B106 | lightning ambush also with an uncharged laser | B103 3.92 | 3.85 | CLOSE, dead (do not widen the ambush to laser holders) |
| B108 | finish burst (`FINISH_BURST_ON`) | 4.06 | 3.75 | CLOSE (−0.31); finish-burst family last |
| P-D-002 | second-hunter threat forecast (`FORECAST2_S=60`) | 4.06 | 3.79 | CLOSE (−0.27); threat-forecast type now ranks lower |
| B107 / P-D-003 | supply-drop run on 4.06 (`DROP_RUN_M=150`) | 4.06 | 4.10 | KEEP, current champion |

## In flight (do not duplicate)
None. No score is pending on the site.

## Queued
- P-B-006 standoff break at 45 s: rebuild onto 4.10 main (was built on 4.06; held back when the drop run scored). Direct tweak of the previous best; priority 1 after rebase.
- P-B-008 / B109 movement and evasion training track (sim-only). Does not take a site slot. Feeds the site queue only after the gate and sim testers show opponent hit rate down without new stuck problems.
- B110–B112 champion tweaks being built (must be on 4.10 main).
- Reserves to rebase onto 4.10: P-B-002 laser-charge react (PR #103), P-B-004 zone unpin (PR #104), P-D-006 cook-off (PR #105), P-B-005 gun lead during charge (PR #106).
- P-B-007 standoff at 90 s: build only after P-B-006 scores, and only on the then-current champion.

## Dead families (don't research further without a new mechanism)
Opening / first-30 s tweaks (seven 3.79 ties), upgrades, later aim tweaks, hold-behind-cover and wider cover variants, unbounded laser rush, lightning late-walk distance/start-time/claim variants, widening the lightning ambush to laser holders (B106), no-early-finish (B98), finish burst (B108 3.75). Threat-forecast (P-D-002 3.79) ranks lower after that loss. Full list: `coord/data/ideas.md`.

## Most useful research now
1. Mid/late-game kill sources on top of 4.10 (after 60 s, especially after 120 s), including ideas that combine with the drop run, standoff break, or ambush without changing them.
2. Trigger-frequency estimates for any new idea (how many games per 100 would it change?).
3. Tweaks of the 4.10 champion (priority 1).

## Sim-only track (added Sat Nov 21, 1:56 PM ET)
- **P-B-008 movement & evasion training track** (Doug, 1:52 PM ET). Sim-only: strafe / slide / orbit / telegraph dodge / slide-around-cover on the current champion, all current rules held in place (now the 4.10 drop-run stack). Branch `build-109-movement`. It does not take a site slot. It feeds the site queue only after the gate and sim testers show opponent hit rate down without new stuck problems. Not a remake of B101 (early gun-round dodge, not submitted). Rebase the track onto 4.10 main (`9168d84`) if work started from 4.06.
