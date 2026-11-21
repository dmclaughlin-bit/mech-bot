# Ready/Hold ledger

One record per candidate, tied to its exact SHA and the champion SHA it was screened against. A new champion expires every approval (HOLD, stale) until rebased and re-screened. Format per Doug's 5:41 PM ET rules (coord/WORKFLOW.md).

Current champion: B113 drop reach 200 m, `6182d29c673d99f5186d742a5f019c0b007234f2`, site 4.17 (BB-09AE8A68).

## READY
None (Sat Nov 21, 5:45 PM ET tick).

## HOLD
### P25 cube memory
- SHA: none yet (no PR at 5:45 PM ET). Champion screened against: n/a.
- Novelty: not checked yet (needs SHA). Impact rank: not ranked yet.
- Timing / eqdrive / activation (fired, different behavior, different score): not run.
- Paired screen 2000+3000 and 4000+5000: not run (no rows in coord/data/screens.csv).
- Blocker: build not pushed. Owner: Mech Builder (parent assigns). Next action: push PR on 6182d29, then Mech Sim Tester full paired screen on both seed sets.

### Not eligible against the current champion (do not submit)
#127, #126, #128, #130, #134, #135; old PRs #104, #106, #110-#115, #119; sim-only #124, #125, #129, #131, #132, #133. Each needs a rebase on 6182d29 plus a full screen, and a rebuild of a tested idea qualifies only if the sim shows the new champion changes where or how often it fires.
