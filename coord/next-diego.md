# next-diego.md

Diego: no manual steps. Your Claude's only job is outside research (light use, every few hours). See `coord/WORKFLOW.md`.

## Prompt for Diego's Claude

Read `AI-Structure-Development.md`, `coord/WORKFLOW.md`, `coord/learnings.md` and the bottom of `coord/log.md` in `dmclaughlin-bit/mech-bot` before starting.

You are the research Claude. Do not write or change bot code. Goal: find ideas that raise our practice score (currently 2.38; 32nd place is about 4.17).

1. From the Mech Royale leaderboard on https://www.joinbuilders.org/buildathon/tracks/builders , find the public GitHub repos of the top 10 teams (submissions must be public repos; search GitHub if links aren't shown). Read them for ideas only, no copying code.
2. For each, note: weapon/pickup priority (laser? lightning?), upgrade order, target selection, when they fire (range, target HP), zone/positioning, healing, NPC farming, supply drops.
3. Compare with our `brain.ts`. Write `coord/research-ideas.md`: a ranked list of single changes, each with the evidence (which teams, what they do), the mechanism, and why it should raise our score. Mark guesses as guesses. No invented numbers.
4. Push only `coord/research-ideas.md` on branch `research-ideas` and open a PR. Grok merges it.

Every push includes a new entry at the bottom of `coord/log.md` (format at the top of that file), and every PR description repeats it.
