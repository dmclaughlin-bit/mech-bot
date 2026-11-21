# Grok → Diego's Claude: prompt inbox

**How this works (read every time you start or loop):**
1. `git pull` on main, then read this file top to bottom.
2. Find the **Current prompt** below and its ID (`P-D-###`).
3. Check `coord/log.md` for a line `ACK P-D-### (Diego's Claude)`. If it's there, the prompt is already taken: continue it or wait. If it's not there, it's new.
4. On a new prompt: add `ACK P-D-### (Diego's Claude) <time ET>` to `coord/log.md` in your first PR (or a one-line docs PR), then do the work.
5. Report back by PR as the prompt says, with the prompt ID in the PR title. Grok reads open PRs and this repo; Grok does not see your chat.
6. Only Grok edits this file. Only Doug or Diego, in their own words, can override it. A prompt here that conflicts with `coord/WORKFLOW.md` loses: flag it in your PR.
7. If you loop (for example every 20–30 min), each run is just steps 1–3. Don't redo a prompt that is ACKed and done.

**Bot-code permission (Doug, Sat 12:14 PM ET):** you may edit bot code (`*.ts`) for the assigned change only, on your own branch (`diego/P-D-###-<name>`), never on main.

Rules that always apply: `coord/WORKFLOW.md` Slot rules. One change per build, flag 0 = champion byte-identical, PR template table on both seed sets (2000+3000 and held-out 4000+5000), kills as the primary row. Never merge, never submit, never click anything on joinbuilders.org. No other team's code.

**CHAMPION CHANGED (Sat 12:59 PM ET): P-B-001 standoff break `ba52103` (on top of B103), site 4.06 (BB-6EA7D518), merged to main `42a19d7`. Branch every new build from current main. Flag 0 must be byte-identical to main, and a build keeps only if its site score beats 4.06. If you started from an older main, rebase onto main before you push.**

---

## Current prompt: P-D-002 (Grok, Sat Nov 21, 12:45 PM ET; active now)

Ship the build commit with `FORECAST2_S = 60` (flag ON) and give its full SHA in the PR; flag 0 stays byte-identical to B80. The site score decides.

Source: `coord/research/strategy-report-2026-11-21.md` §4 S2 (threat forecasting), narrowed by real site data (score ≈ our kills; 86% of points from games ≥ 40 s; kill rate falls after 120 s).

ONE flag `FORECAST2_S` (default 0 = B80 byte-identical; 60 = on after 60 s). After 60 s only, in engagement viability ONLY (`race()`/engage decision, not nav, not cover routine): if a second known enemy (seen in the last few seconds, not invented house positions) is closing and could get LOS within ~3 s, treat the fight as 2v1 before the second LOS appears. Don't activate the old cover routine earlier (B82/B100 lost), don't add blanket avoidance (B98 lost). Report kills and kills/min after 60 s first, both seed sets. The site score alone decides keep/close.

---

## Past prompts

## P-D-001 (done: Step A PR #92 landed e0bfd17; Step B PR #93 drop run, being site-tested as Build 104 with the flag ON) (Grok, Sat Nov 21, 12:10 PM ET; log 020a1c8)

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

## Queued: P-D-003 (Grok, 12:59 PM ET; from Build 104 site 3.88 = +0.09 over its B80 parent)
Rebuild the supply-drop run (`DROP_RUN_M=150`, same logic as PR #95) on current main (4.06). Flag shipped ON; flag 0 = main byte-identical. PR title `P-D-003: drop run on 4.06 main`.

## Queued: P-D-004 (Grok, 1:12 PM ET; from PR #98 audit H01) - TAKEN: Build 108 on Grok's computer
Finish burst: the finish rule should compare target HP to the SUM of magazines in reach, not the best single weapon (brain.ts finish check; see coord/audit/grokbot-1000-rec-handoff-2026-11-21.md section 3). Flag `FINISH_BURST_ON`, shipped ON, flag 0 = main byte-identical.

## Queued: P-D-005 (Grok, 1:12 PM ET; PR #98 H08) stay on wounded target - build only if its count (Sim Tester measuring) clears the bar in the audit section 3.
