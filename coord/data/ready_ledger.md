# Ready/Hold ledger

One record per candidate, tied to its exact SHA and the champion SHA it was screened against. A new champion expires every approval (HOLD, stale) until rebased and re-screened. Format per Doug's 5:41 PM ET rules (coord/WORKFLOW.md).

Current champion: B113 drop reach 200 m, `6182d29c673d99f5186d742a5f019c0b007234f2`, site 4.17 (BB-09AE8A68).

## READY
None (Sat Nov 21, 5:55 PM ET tick).

## HOLD
### P25 cube memory (PR #136)
- SHA: b34271c15df17bac4fda4275a7928643034f5e83, on champion 6182d29 (builder reports merge-base --is-ancestor OK).
- Builder's self-reported checks (loop must re-run on the exact SHA): check.py PASS, max 3.3 ms; flag-off eqdrive identical to main; smoke 8/8.
- Novelty: new mechanism (remembered cubes out to 150 m while farming); closest prior tests are P23/P23b late idle farm (BB-AEFC0FA8, 4.00), and P25 does not use their sweep. Check against them on the full screen.
- Paired screen 2000+3000 and 4000+5000: NOT RUN (no rows in coord/data/screens.csv as of 5:55 PM ET).
- Decision: HOLD. Blocker: no full screen. Owner: Mech Sim Tester. Next action: complete paired screen on both seed sets against 6182d29, with the three activation counts kept separate.

### Not eligible against the current champion (do not submit)
#127, #126, #128, #130, #134, #135; old PRs #104, #106, #110-#115, #119; sim-only #124, #125, #129, #131, #132, #133. Each needs a rebase on 6182d29 plus a full screen, and a rebuild of a tested idea qualifies only if the sim shows the new champion changes where or how often it fires.
