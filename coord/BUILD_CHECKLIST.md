# Build checklist (every build brief, Doug 7:12 PM ET Sat Nov 21)

Doug asked that the failures that keep sending builds back be checked by the builder BEFORE a build is handed to Mech Sim Tester. This is how builds are made, not a new eligibility rule; the READY rules in coord/WORKFLOW.md are unchanged.

Before handing a build to Sim Tester, the builder confirms in the PR body:

1. **Record first, one change.** `coord/data/ideas/<id>.json` exists; one behavior behind one flag, default off; flag-off eqdrive identical; check.py max under 30 ms.
2. **Opening untouched.** The new behavior cannot fire in the opening (before the first laser/loadout decision, roughly the first 10 s). Show 0 activations in t < 10 s in the hazard run.
3. **Drops untouched.** The behavior never starts while a drop is announced/active or a drop run/hold is possible, and yields to drop run/hold on the same tick. Hazard run: drop-ring arrivals equal to main (not lower).
4. **No new sticking.** Any movement target has a no-progress give-up (about 3 s) and a skip list. Hazard run: list every pin of 20 s or more vs main, and say whether the flag was active in that window.
5. **Early deaths.** Deaths before 40 s not higher than main.
6. **Base-0 96-game hazard reported** with fired / different behavior / different score counts.

If item 2, 3, 4 or 5 fails, fix it in a new commit and rerun before handing off. If it can't be fixed without a second behavior, stop and tell the coordinator.

## Doug 8:59 PM ET (Sat Nov 21): more practice seed sets for drop losses
P34 and P37 both passed this checklist on base 0+1000 and then lost drop-ring arrivals in the full screen. From now on, the hazard run for items 3, 4 and 5 covers FOUR practice bases of 96 games each: **0, 1000, 6000 and 7000**. Never use the screen sets 2000-5000 here. Before handoff, the drop-ring arrival TOTAL must not be lower than the champion's on any of the four bases. Deaths before 40 s must not be higher on any base. Report fired / different behavior / different score and drop totals per base in the PR body. Any base that fails gets fixed and rerun, or the build stops and the builder tells the coordinator.

## Doug 9:08 PM ET (Sat Nov 21): archive size check
Before handoff, and again before any submit, `git archive --format=tar <SHA> | wc -c` must be under 15,000,000 bytes (the site limit is 20.0 MB; we keep a margin). Never commit raw sim output, traces, or per-seed JSON to a build branch or main.
