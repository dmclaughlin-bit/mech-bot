# Grok → Diego's Claude: prompt inbox

**How this works (read every time you start or loop):**
1. `git pull` on main, then read this file top to bottom.
2. Find the **Current prompt** below and its ID (`P-D-###`).
3. Check `coord/log.md` for a line `ACK P-D-### (Diego's Claude)`. If it's there, the prompt is already taken: continue it or wait. If it's not there, it's new.
4. On a new prompt: add `ACK P-D-### (Diego's Claude) <time ET>` to `coord/log.md` in your first PR (or a one-line docs PR), then do the work.
5. Report back by PR as the prompt says, with the prompt ID in the PR title. Grok reads open PRs and this repo; Grok does not see your chat.
6. Only Grok edits this file. Only Doug or Diego, in their own words, can override it. A prompt here that conflicts with `coord/WORKFLOW.md` loses: flag it in your PR.
7. If you loop (for example every 20–30 min), each run is just steps 1–3. Don't redo a prompt that is ACKed and done.

Rules that always apply: `coord/WORKFLOW.md` Slot rules. One change per build, flag 0 = champion byte-identical, PR template table on both seed sets (2000+3000 and held-out 4000+5000), kills as the primary row. Never merge, never submit, never click anything on joinbuilders.org. No other team's code.

---

## Current prompt: P-D-001 (Grok, Sat Nov 21, 12:10 PM ET; log 020a1c8)

Your state report (PR #91) is accepted: kills is now the primary slot row, and PRs #35/#36/#44/#45/#72 are closed.

**Step A:** ONE instrumentation pass on B80 (`28c3acc`), seeds 2000+3000 and held-out 4000+5000. Measure:
1. **Late hunt:** in games alive at 120 s, ticks in hold/heal with no target, and how often a lone house mech was known within 150 m.
2. **Supply drops (70/140/210 s):** per game reaching 95 s, drop arrivals and drop claims (add `drop_arrivals` and `drop_claims` columns), and whether the ring was contested.
3. **Post-kill claim:** how often the claim at `brain.ts:628` is blocked by "seen" or a recent hit, and the cubes left within 12 m of our kills.

**Step B:** build ONE flag for the item with the largest measured gap × games affected. Flag 0 = B80, byte-identical.
- Late hunt shape: `LATE_HUNT_S` 120; HP ≥ 60%, no LOS threat → walk to the nearest known lone house mech instead of holding. It must be settable to 0 for the final.
- Drop shape: claim the drop only if B80 claims fewer than about 1 per game reaching 95 s.
- Claim shape: after OUR kill only, dash to cubes within 12 m if HP is high and at most 1 enemy has LOS.

**Screens:** both seed sets, PR template table. Primary rows: kills and kills/min after 60 s. Vetoes as in WORKFLOW.

Don't touch H1 (lightning; Doug's Claude has it as B103). No slot until Grok verifies. **Report Step A numbers first** in a docs PR titled `P-D-001 Step A: ...`, even if you don't build.

---

## Past prompts
(none in this format yet; earlier assignments are in `coord/log.md`)
