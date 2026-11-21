# Current status for researchers (read this first)

Updated by Grok, Sat Nov 21 2026, 2:45 PM ET. Grok updates this file whenever the champion or the in-flight list changes. The canonical data is `coord/data/` (site_results.csv, ideas.md, screens.csv, hazard_screens.csv).

## Champion (base for all research and builds)
- **B113 drop reach 200 m**, commit `6182d29c673d99f5186d742a5f019c0b007234f2`, site **4.17** (BB-09AE8A68), merged to main `8b6e7b2841f5d26402d19fc4b28d16d2d6760550`. Submitted 2:40 PM ET, scored 2:43:56 PM ET. Site showed wait 202 ms (earlier entries showed 35–127 ms). Site auto-entered it in the final (no click).
- Stack on top of B80 (3.79): **B103 lightning ambush** (3.92, `LIGHT_AMBUSH_ON`: lightning holder with no laser, seen by exactly one enemy at 45–90 m, steps out of sight and waits) + **P-B-001 standoff break** (`STANDOFF_BREAK_S=60`, 4.06) + **P-D-003 supply-drop run** + **B113 longer reach** (`DROP_RUN_M=200`).
- Research line numbers must be on current main, not the 4.10 tree. Re-locate before citing.
- A build keeps only if its site score is strictly above 4.17.
- Bot code on main equals `6182d29`. Flag 0 must be byte-identical to this main.

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
| P-B-001 | standoff break | B103 3.92 | 4.06 | KEEP (still in the stack) |
| B106 | lightning ambush also with an uncharged laser | B103 3.92 | 3.85 | CLOSE, dead (do not widen the ambush to laser holders) |
| B108 | finish burst (`FINISH_BURST_ON`) | 4.06 | 3.75 | CLOSE (−0.31); finish-burst family last |
| P-D-002 | second-hunter threat forecast (`FORECAST2_S=60`) | 4.06 | 3.79 | CLOSE (−0.27); threat-forecast type now ranks lower |
| B107 / P-D-003 | supply-drop run on 4.06 (`DROP_RUN_M=150`) | 4.06 | 4.10 | KEEP, previous champion; still in the stack, reach now 200 |
| P-B-006 | standoff break at 45 s (`STANDOFF_BREAK_S` 60→45) | 4.10 | 4.02 | CLOSE (−0.08); 60 s stays |
| B113 | drop reach `DROP_RUN_M` 150→200 | 4.10 | 4.17 | KEEP, current champion |

## In flight (do not duplicate)
None. No score is pending on the site.

## Queued
- Same-family follow-ups on 4.17 (priority 1): B115 drop-run lead 10 s (PR #118); a 260 m drop-reach build (250–300 m follow-up — 200 m beat 150 m, so a shorter reach is the losing direction). PR #117 (drop reach 110 m) is superseded and should be closed.
- Other champion tweaks to bring onto 4.17 main and re-gate: B110 standoff 90 s (PR #108), B111 ambush 100 m (PR #109), B112 standoff far edge 100 m (PR #110), P19 HP margin 0.1 (PR #112), P18 standoff max 120 m (PR #111).
- Reserves to bring onto 4.17: P-B-004 zone unpin (PR #104), P-B-005 gun lead during charge (PR #106), P-B-002 laser-charge react (PR #113), P-D-006 cook-off (PR #114).
- P-B-008 / B109 movement and evasion training track (sim-only, PR #115). Does not take a site slot. Feeds the site queue only after the gate and sim testers show opponent hit rate down without new stuck problems. Rebase onto 4.17 when that work is free; do not interrupt the running worktrees.

## Dead families (don't research further without a new mechanism)
Opening / first-30 s tweaks (seven 3.79 ties), upgrades, later aim tweaks, hold-behind-cover and wider cover variants, unbounded laser rush, lightning late-walk distance/start-time/claim variants, widening the lightning ambush to laser holders (B106), no-early-finish (B98), finish burst (B108 3.75). Threat-forecast (P-D-002 3.79) ranks lower after that loss. Standoff at 45 s (P-B-006 4.02) lost; 60 s stays. Full list: `coord/data/ideas.md`.

## Most useful research now
1. Mid/late-game kill sources on top of 4.17 (after 60 s, especially after 120 s), including ideas that combine with the drop run (now 200 m), standoff break, or ambush without changing them.
2. Trigger-frequency estimates for any new idea (how many games per 100 would it change?).
3. Tweaks of the 4.17 champion (priority 1). The drop-reach family is winning: consider 250–300 m, not shorter.

## Sim-only track (added Sat Nov 21, 1:56 PM ET)
- **P-B-008 movement & evasion training track** (Doug, 1:52 PM ET). Sim-only: strafe / slide / orbit / telegraph dodge / slide-around-cover on the current champion, all current rules held in place (now the 4.17 drop-run stack). Branch `build-109-movement`. It does not take a site slot. It feeds the site queue only after the gate is green and sim testers show opponent hit rate down without new stuck/pin damage. Not a remake of B101 (early gun-round dodge, not submitted). Rebase the track onto 4.17 main (`8b6e7b2` / `6182d29`) when that work is free.
