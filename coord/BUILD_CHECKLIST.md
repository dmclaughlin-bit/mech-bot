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
