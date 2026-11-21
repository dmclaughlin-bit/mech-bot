# Research gaps and open questions

| # | Gap | Why it matters | How to close it |
|---|---|---|---|
| 1 | **Is the practice score deterministic?** (fixed seeds, fixed `hello.seed`) | If yes, practice deltas measure fit to 48 frozen worlds, not skill | S2 = S1 resubmitted with a time-seeded RNG (BM §1) |
| 2 | **Are match replays public?** (protocol mentions "public replay") | They would be our best data source: our deaths, house-bot behavior, top teams | Check the track/team page after the first submission |
| 3 | Per-match SD of placement (assumed ≈4) | Sets the detectable delta (1.2–1.6) | Estimate from S1/S2 and the repeat submissions |
| 4 | How house bots actually behave (aim quality per tier, drop behavior, pursuit) | The brief says they hunt weakest-first. Do they converge on drops? | Replays, or infer from score changes |
| 5 | Does a pure hider score near 0 in practice? (tactics agent hypothesis) | Decides how much aggression practice rewards | One deliberate "turtle" variant early on |
| 6 | Judge CPU speed vs dev box | Timing margins assume up to 2× slower | `check.py` result on S1; keep p99 ≤15 ms locally |
| 7 | Leaderboard: latest or best submission? Which entry goes to the final? | Decides whether a late weak build can hurt | Read the track page / FAQ before Sunday |
| 8 | Commercial BR bot internals | None are public (GB-14) | Not closable. Use documented FPS bots instead |
| 9 | LOS model fidelity (canopy, LiDAR bumps, eaves) | Misjudged cover gives free hits | Count "fired, no `hit` event" in the harness; separate can-see from can-hit |

**Resolved during synthesis:**
- **Supply-drop clock.** Protocol §7: a contested ring freezes the clock; it restarts only if the ring empties or a different mech becomes the sole occupant. Stepping in freezes a rival's capture; it does not reset it.
- **Deadline guard.** 30 ms hard cap (the agents proposed 25 and 35).
- **Submission budget.** Plan on ~50–70 (the agents estimated 45–70 and 100–150).
- **A\* timing gap.** Agent 2 measured 1.5/19.6 ms, Agent 5 measured 0.3/4.1 ms on a 2 m grid. The implementations differ, and both fit with an expansion cap and time slicing.
