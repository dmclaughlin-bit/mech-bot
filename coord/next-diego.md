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

**Read `coord/STATUS.md` first: current champion, in-flight builds, dead families.**

**CHAMPION (Sat 2:44 PM ET): B113 drop reach 200 m, bot code `6182d29c673d99f5186d742a5f019c0b007234f2`, site 4.17 (BB-09AE8A68), merged to main `8b6e7b2`.** Branch every new build from current origin/main. Flag 0 must be byte-identical to main, and a build keeps only if its site score is strictly above 4.17.

**While you were out (about 1:18 to 3:42 PM ET)** Grok's Claude built P-D-004 (Build 108 finish burst, PR #101, site 3.75 CLOSE) and P-D-006 (Build 109 cook-off bonus, PR #105, rebased as PR #114, reserve, not yet site-tested). Don't redo either. The drop family (P20 PR #121, P21 PR #122) and B117 matchup (PR #123) belong to Mech Builder: don't touch them.

---

## Current prompt: P-D-010 en-route travel delay (Grok, Sat Nov 21, 5:50 PM ET)

Not ACKed. Add `ACK P-D-010 (Diego's Claude) <time ET>` to `coord/log.md` in your first PR. MEASUREMENT FIRST; stop early if it rules the idea out.

Question (Doug's overhaul, 5:38 PM ET): when the champion is healthy and not engaged, travelling to a safe objective (next zone circle, a drop ring, a cube or laser), where does it lose time, and does that delay ever change whether it arrives in time or survives? A general "move faster" isn't buildable; we need the single decision that costs time.
Evidence: Watcher Top-16 (`coord/data/watcher/SKILLS.md`, `movement.md`) shows top teams travel faster when healthy and unengaged and boost more (8.1% vs 1.8% of those ticks); the champion's boost/energy policy and route planning may waste time.
Step A (sim only, champion 6182d29 = origin/main bot code, seeds 2000+3000 and 4000+5000, n=192 each): for every healthy (HP >= 90%), unengaged travel leg, log the objective type, straight-line vs path distance, time taken vs ideal at max walk speed, time stopped/turning/replanning, boost use and energy, and whether the leg ended late (zone damage taken, drop ring missed, enemy reached the drop first) or with a death within 20 s. Report: total delay seconds, where it comes from (replan cadence, detours, stop-and-turn, no boost), and in how many games/192 the delay changed arrival or survival.
Step B ONLY if the delay changes arrival or survival in ~10/192 games or more on both sets: propose (don't build) the single decision to change, with expected games affected. Grok assigns any build.
Don't touch drop logic directly; the drop family is tapped out on the site.

Results since your last prompt: P-D-008 (#131, laserSkip comeback 4/192, 3/192, no Step B) and P-D-009 (#132, rare disagreement, no build) are both DONE, logged, and get no slot. Site since 5 PM: P24 heal-in-cover 3.79, P23b late idle farm 4.00, B125 six-tactic package 3.50, all closed. Champion is still 4.17.

## DONE (no slot): P-D-008 laserSkip expiry (#131) and P-D-009 two-horizon race (#132)

## (done) P-D-008 laserSkip expiry (audit H12) (Grok, Sat Nov 21, 4:16 PM ET)

Not ACKed. Add `ACK P-D-008 (Diego's Claude) <time ET>` to `coord/log.md` in your first PR. Doug (4:14 PM ET) wants every lane working for the next half hour: when this is done, go straight on to P-D-009 below without waiting.

Once a laser target fails (no route, or chase longer than `LASER_CHASE_S`), it goes into `laserSkip` for the rest of the match (`brain.ts:280`, `:693`, `:704` on 4.17 main), so the late walk can never retry it. Lasers matter: in the sim, laser by 30 s scores 6.28 vs 2.01 without (coord/RESEARCH.md).
**Step A:** count games on both seed sets (2000+3000 and 4000+5000, n=192 each) where a skipped id later becomes reachable and in-zone while we still lack the weapon. **Step B, only if ~10/192 or more on both sets:** branch `diego/P-D-008-laserskip`, flag `LASER_SKIP_EXPIRE_S` (0 = main byte-identical), skip entries expire after that many seconds; gate PASS, PR template table on both seed sets, kills first. No slot until Grok verifies. Branch from current origin/main (champion bot code still 6182d29).

Site context since P-D-007: P21 4.17 tie, standoff 90 s 3.96, ambush 100 m 4.10, B117 matchup 4.08, all closed. Your P-D-007 finding (zone timing makes zone-travel deaths worse) is logged, no slot. Grok's Claude is building mid-game unstuck pathing and late-game hurt kiting (Watcher Top-16 evidence, coord/data/watcher/RANKED.md); don't duplicate those.

## DONE (no slot): P-D-007 late-game kill-source measurement (Grok, 3:44 PM ET)
Step A PR #124 (late deaths are multi-LOS; zone travel in last 5 s touches 28/37 games). Step B PR #125 `ZONE_EARLY_S` failed in sim (zone-travel deaths 28→30 and 37→45), no slot.

## (moved to Current above) P-D-008
Once a laser target fails (no route, or chase longer than `LASER_CHASE_S`), it goes into `laserSkip` for the rest of the match (`brain.ts:280`, `:693`, `:704` on 4.17 main), so the late walk can never retry it. Step A: count games on both seed sets where a skipped id later becomes reachable and in-zone while we still lack the weapon. Step B only if ~10/192 or more: flag `LASER_SKIP_EXPIRE_S` (0 = main byte-identical), skip entries expire after that many seconds.

## Queued: P-D-009 two-horizon race, shadow count only (audit H13) (Grok, 3:44 PM ET)
Shadow-log only, no behavior change: in `race()` engagements after 60 s, count how often a burst-horizon estimate and the current sustained estimate disagree on engage vs not, and how those fights ended. B48 and B20+22 TTK recalibrations lost on the site, so this is a count, not a build. Report in a docs PR; Grok decides whether it earns a build.

---

## Past prompts

## DONE (lost 3.79): P-D-002 (Grok, Sat Nov 21, 12:45 PM ET)

Shipped `FORECAST2_S = 60` (flag ON). Site 3.79 (BB-8DA0CF9D, PR #102, `4c42170`, submitted 1:48 PM ET) CLOSE vs 4.06. Threat-forecast type now ranks lower after a loss.

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

## DONE KEEP 4.10: P-D-003 (Grok, 12:59 PM ET; from Build 104 site 3.88 = +0.09 over its B80 parent)
Rebuilt the supply-drop run (`DROP_RUN_M=150`, same logic as PR #95) on 4.06 main. Site **4.10** (BB-DA9AC664, `4d6e71b`, PR #99) KEEP, new champion, merged `9168d84` Sat 2:00 PM ET. Site auto-entered it as the final entry (no click).

## DONE (lost 3.75): P-D-004 (Grok, 1:12 PM ET; from PR #98 audit H01) - built by Grok's Claude as Build 108, PR #101
Finish burst: the finish rule should compare target HP to the SUM of magazines in reach, not the best single weapon (brain.ts finish check; see coord/audit/grokbot-1000-rec-handoff-2026-11-21.md section 3). Flag `FINISH_BURST_ON`, shipped ON, flag 0 = main byte-identical.

## PARKED: P-D-005 (PR #98 H08) stay on wounded target - Sim Tester count FAILS the bar (target found healed later in only 2-4% of matches; screens.csv 8950ae2).

## BUILT, reserve: P-D-006 (Grok, 1:22 PM ET; PR #98 H09, Wild Sim counts) - built by Grok's Claude as Build 109, PR #105, rebased as PR #114
Cook-off target bonus: some enemy holds a mortar in 98.7% of sim matches; mortar holders are 18.9% of our kills and mortars cause 11.5% of our deaths (coord/data/audit_h07_h09.csv; sim house model is invented, weak evidence). Flag `COOKOFF_BONUS_ON`, shipped ON, flag 0 = main byte-identical.

H07 sound-guided late hunt: PARKED. Wild Sim: a usable sound while idle late shows up only 2.2% of the time.
