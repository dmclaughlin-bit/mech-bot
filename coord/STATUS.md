# Current status for researchers (read this first)

Updated by Grok, Sat Nov 21 2026, 1:15 PM ET. Grok updates this file whenever the champion or the in-flight list changes. The canonical data is `coord/data/` (site_results.csv, ideas.md, screens.csv, hazard_screens.csv).

## Champion (base for all research and builds)
- **P-B-001 standoff break**, commit `ba521035278fb260f5685551366ee42bd1cb59f8`, site **4.06** (BB-6EA7D518), merged to main `42a19d7`.
- Stack on top of B80 (3.79): **B103 lightning ambush** (3.92, `LIGHT_AMBUSH_ON`: lightning holder with no laser, seen by exactly one enemy at 45–90 m, steps out of sight and waits) + **P-B-001 standoff break** (`STANDOFF_BREAK_S=60`).
- Research line numbers must be on current main, not B80. PR #98's audit used B80 lines; re-locate before citing.
- A build keeps only if its site score is strictly above 4.06.

## Rules that affect research
- The site score is the only truth. The sim is a crash/timing/flag-0 screen (sim vs site held-out r about 0.2). Don't rank ideas by sim delta.
- Score tracks our kills. Kill rate drops after 120 s. Ideas that add kills mid/late game are the best bet.
- One change per build, behind a flag, flag 0 byte-identical to main.
- Sequence rule: one submission scored at a time; queued builds are rebased onto any new best before submission.

## Site results today (since B80)
| Build | Change | Parent | Site | Verdict |
|---|---|---|---|---|
| B103 | lightning ambush | B80 3.79 | 3.92 | KEEP |
| B104 | supply-drop run `DROP_RUN_M=150` | B80 3.79 | 3.88 | CLOSE (+0.09 over its parent; rebuilding on 4.06 as Build 107) |
| P-B-001 | standoff break | B103 3.92 | 4.06 | KEEP, champion |
| B106 | lightning ambush also with an uncharged laser | B103 3.92 | 3.85 | CLOSE, dead (do not widen the ambush to laser holders) |

## In flight (do not duplicate)
| Build | Idea | Source | Builder |
|---|---|---|---|
| Build 105 | react to a visible enemy charging a laser at us (`LASER_CHARGE_REACT_ON`) | strategy report S6 slice, P-B-002 | Grok's computer (rebasing onto 4.06) |
| Build 107 | supply-drop run on 4.06 (P-D-003) | B104 result | Grok's computer |
| Build 108 | H01 finish burst, sum of magazines in reach (`FINISH_BURST_ON`, P-D-004) | Diego's PR #98 audit | Grok's computer |
| P-B-004 | zone unpin (`ZONE_UNPIN_S=6`) | Wild Sim hazard screen | Mech Builder |
| P-D-002 | second-hunter forecast (`FORECAST2_S=60`) | strategy report S2 | Diego's Claude |

## Queued (waiting on trigger counts from Sim Tester)
- H02 gun keeps its lead during the laser charge (P-B-005).
- H08 stay on a wounded target (P-D-005).
- H07 sound-guided late hunt and H09 cook-off bonus: Wild Sim is measuring sound events and mortar carry (weak evidence, invented house model).

## Dead families (don't research further without a new mechanism)
Opening / first-30 s tweaks (seven 3.79 ties), upgrades, later aim tweaks, hold-behind-cover and wider cover variants, unbounded laser rush, lightning late-walk distance/start-time/claim variants, widening the lightning ambush to laser holders (B106), no-early-finish (B98). Full list: `coord/data/ideas.md`.

## Most useful research now
1. Mid/late-game kill sources on top of 4.06 (after 60 s, especially after 120 s).
2. Trigger-frequency estimates for any new idea (how many games per 100 would it change?).
3. Ideas that combine with the standoff break or the ambush without changing them.

## Sim-only track (added Sat Nov 21, 1:56 PM ET)
- **P-B-008 movement & evasion training track** (Doug, 1:52 PM ET). Sim-only: strafe / slide / orbit / telegraph dodge / slide-around-cover on the 4.06 champion, all current rules held in place. Branch `build-109-movement`. It does not take a site slot. It feeds the site queue only after the gate and sim testers show opponent hit rate down without new stuck problems. Not a remake of B101 (early gun-round dodge, not submitted).
