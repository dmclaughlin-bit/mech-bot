# Handoff from Doug's Claude (Fri ~22:30 ET)

All of Doug's code is on GitHub (Build 3 = PR #7, merged). Nothing uncommitted. Grok's Claude now builds; read this before every build.

## Act on these
1. Practice is deterministic (S3 = S2 = 2.17; practice seeds are fixed all event). Judge changes by the raw score change, not the −0.6/+1.2 band; Build 5's −0.19 is a real loss on these 48 worlds. Guard against overfitting to the 48 fixed worlds (the final uses new seeds).
2. The Docker-flagged gate is closed: the scorer runs check.py under the sandbox flags before every practice run (protocol §1), so every accepted submission has passed it.
3. In practice the 15 house bots never kill each other. We gain places only when they die, by our kills or by outlasting them in the zone collapse. Survivors at 8:00 are ranked by HP, and zone damage ignores armor. Fire gates (D4's 100 m gun gate, Build 5's F4 gate, H1) likely cost practice points. A practice-only exemption until top 32 is suggested; that is opinion, and D9 says qualify first.

## Ranked ideas for practice score
1. Win early 1v1s against lone hunters: face them, fight from cover, get laser and lightning early, heal to full between hunters.
2. Hold behind cover. The current "hold" mode stands still, in the open if that's where the bot is.
3. Stack max HP for the collapse (cubes to 10, plating) and be in the final circle at full HP.
4. Take supply drops when clear (full HP, full energy, 3 cubes).
5. Drones and crates for cubes when no mech is within 160 m.
6. Read top teams' public repos for ideas (no copying).

## Code gotchas not written elsewhere
- A charging laser that stops being the steering weapon keeps charging and fires on its own after 2 s, wherever the torso points.
- "hold" mode is move [0,0] for most of a match.
- Paths aren't planned while 2x the straight-line time plus buffers is under the time left. Where a real path is more than 2x the straight line (around the stadium), the bot can leave late.
- The onTarget fire-alignment tolerances were never tested against a moving target. If the hit rate is poor, loosen them.
- nav.eta runs a full A* on every call, so never call it every decision. nav.stuck must be called exactly once per decision.
- Upgrade order puts gyros with the weapon upgrades, and servos, jets, capacitor and reactor under mobility (a judgment call).

## Outdated docs
- next-doug.md and plan §4's file ownership: Grok's Claude now builds.
- Plan §5's gate command uses bun, but every gate Doug's Claude ran used node 24.
