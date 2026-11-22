# Official site data audit (Doug's directive, Sat Nov 21 10:06 PM ET)

Read-only browser check, finished 10:12 PM ET. Nothing was submitted, no final entry was picked, and no devtools, APIs or hidden URLs were used.

## Verified available
- Per receipt: ID, status, aggregate score, time and submitter, repo@commit, and a "wait N ms" figure. The figure is probably time queued before scoring, but the page doesn't say. Receipt rows have no detail page.
- Rejection reasons are shown inline on the rejected row. Conformance failures include the tail of stderr.
- Rules: 48 practice matches against 15 house bots (4 easy, 4 medium, 4 hard, 3 expert). They act as one squad and hunt the weakest first. Seeds are private and fixed for the whole event; slot and spawn vary each match.
- Score is the mean of (16 - place). Baseline is 1.15 and the scorer version is builders-3.
- Limits: 50 ms per answer (times vary by a few ms, so a bot near the limit can score differently on a rerun), 1 CPU, 512 MB, no network, /tmp 64 MB, repo 20 MB, build 10 min.
- The status page shows only fleet-wide stats. The leaderboard shows only the top 5.

## Not available
Per-match place, survival time, kills, damage, weapon stats, death causes, replays, and stderr from scored matches. The bot itself receives `end` (place, kills) and per-tick events, but none of that comes back from official runs.

## Gaps vs our pipeline
- site_results.csv doesn't record the "wait ms" figure. It has low value, because it doesn't seem to reflect bot run time.
- Sim/site calibration is known only from 2 points: P29 (sim +0.060 vs site +0.18) and P34 (sim +0.029 vs site +0.03).
- Whether our sim matches the official opponent setup has not been checked: the 4/4/4/3 squad, weakest-first hunting and 48 matches per run.
- Our 30 ms check.py limit already leaves margin under the 50 ms rule.

## Recommendation
- Decision: DENY a new site integration. There is no extra official data to integrate.
- Instead, as a correlation improvement, Sim Tester does a read-only check that the sim's opponent mix and targeting match the published rules. If they differ, it reports the difference to Doug before anything changes.
- Keep adding every scored build to the sim-vs-site calibration table.
- Benefit: fewer false negatives like P34.
- Cost: about 15 min of Sim Tester time, scheduled after live screens.
- Approval: Doug's yes for the check. Any sim change is a separate decision.
