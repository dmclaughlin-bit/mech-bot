# Grok → Diego's Claude: prompt inbox

## CURRENT PROMPT P-D-025 LEARNING-STANDARD SYNC (Grok, Sun Nov 22 12:50 AM ET; Doug's directive)
Champion: **P48 tree retreat, code b9492c6, main edb729f, site 4.44.** Any older champion line below is history. Read `coord/LEARNING_STANDARD.md` and `coord/data/findings.md`. Then add `ACK LEARNING-STANDARD (Diego's Claude) <time ET>` to `coord/log.md`, and reply on PR #152 with a 4-line check: (1) the current champion SHA, (2) where findings live, (3) your lane now (P52 #169 near miss; P-D-024 death study; Mac screens) and confirmation that you're NOT building P52b (Mech Builder owns it), (4) the finding IDs P52 builds on. Don't stop current work; apply the standard at your next task boundary. P-D-024 results come back as findings with confidence labels and at most 2 testable hypotheses, each with a disproof test.

## NEW CHAMPION (10:30 PM ET): P48 tree retreat, 4.44 (BB-94897D91). Code b9492c6f122c549c705b69402157f078b4a57857, merged to main as edb729fc790c0bd583204fa2a0c6492cc8277ca8. Every build must now contain edb729f (rebase onto origin/main). All old screens and approvals are stale. Champion baselines must be re-run on P48 b9492c6 (trees-on, both sets), on each screening machine.

Diego's Mac: before the cross-check, run the P48 b9492c6 champion baseline on the Mac (same sim 4b8663e, trees-on, bases 2000-5000). Cross-check builds are the REBASED P43 and P35b once Builder posts them. P-D-018 P50 must branch from current main (contains edb729f).


> **Every build (Doug 7:12 PM ET):** before handing to Sim Tester, pass `coord/BUILD_CHECKLIST.md` (opening untouched, drops untouched, no new sticking, early deaths, hazard counts) and report it in the PR body.

**Doug 6:46 PM ET (D2):** each new idea needs its `coord/data/ideas/<id>.json` record before a build starts. Chat is only a notification.

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

## P-D-015 DECISION (Doug 10:28 PM ET, exact wording): "Use Diego's Mac for screens with the build and champion on the same machine, cross-checking the first two builds on both stations"
Match check result (PR #152, e121987): 350/384 games match Sim Tester; all 34 differences are deaths after 100 s; early deaths identical; Sim Tester's plain-bot rerun confirmed its wrapper is not the cause. Likely cause: the bot's wall-clock plan budget on a faster CPU. So:
- SAME-MACHINE RULE: every Mac screen compares the build against the champion baseline run ON THE MAC (sim sim/trees-screen-patch-v1 4b8663e, plain P34 0e6fadd bot.ts, --trees, bases 2000-5000; your e121987 baseline rows are the Mac champion reference). Never mix Mac build rows with Sim Tester champion rows.
- CROSS-CHECK FIRST 2: screen P43 #158 (884aedd) and P35b #159 (8ddd077) on the Mac NOW, both sets, same veto list as Sim Tester (crash, timing, flag-0 identical, drop-ring set totals, died <40 s, survivors/end-game, stall a/b/c, activations). Post per-set totals and the veto-by-veto decision on each PR tagged "station: diego-mac, mode: cross-check". During the cross-check, Sim Tester's verdict is the one that counts.
- If both builds get the SAME veto decisions on both stations, the Mac joins the rotation: Sim Tester hands you builds and your verdict counts like Sim Tester's (tag "station: diego-mac, mode: official-screen", add a screens.csv row). If any decision differs, report the exact item and the Mac stays info-only until Doug decides.
- Do not merge the sim patch into main or #148. You never submit.
Then continue P-D-018 (P50).

## P-D-015 MATCH CHECK SPEC (Doug 10:08 PM ET, exact wording basis)
Doug approved sharing Sim Tester's exact sim patch (SEED_BASE + PR #133 shortcut) with you for this check only; the repo merge is a separate decision, so do NOT merge it into main or #148.
- Setup: check out base commit 22f72a8 (#148 tools/sim), use branch `sim/trees-screen-patch-v1` at commit 4b8663e (= base 22f72a88d071bc949ccec6dbc9bd535b74844e3b with `coord/patches/trees-screen-v1.patch` applied; patch sha256 7b0e3366bcf183fc4db87b205a2b262092a39ecd9b366cab88662df540d1db64; 2 files: tools/sim/run.ts SEED_BASE, tools/sim/geom.ts #133 item 1). Kit arena/v2/world.json must have sha256 e0302dd4777b527b00a6a4b2e02759915402a23c58839d921e9fcc6d58092445. Per base: `SEED_BASE=<base> bun tools/sim/run.ts --bot <bot.ts> --seeds 96 --jobs 4 --kit <kit dir> --trees --out <out.csv>`. Use the plain P34 bot (0e6fadd). Caveat: Sim Tester's reference rows came via a hazard-logging wrapper around 0e6fadd; if rows differ, that wrapper is the first suspect (Sim Tester will confirm with one plain-bot base). Reference rows: https://github.com/dmclaughlin-bit/mech-bot/pull/147#issuecomment-7073394832 (that comment says the sim changes are 'uncommitted'; they are now on sim/trees-screen-patch-v1 4b8663e). Expected totals: 2000+3000 mean 3.750, kills 678, died<40s 48, survivors 2, drops 9, pause games 2; 4000+5000 mean 4.099, kills 739, died<40s 38, survivors 3, drops 8, pause games 2. Compare place, score, death_t and kills PER SEED, not whole-file sha256 (timing columns differ between machines). Record in your PR: base SHA, patch sha256, machine, bun version, jobs.
- Run: the P34 0e6fadd trees-on baseline (`--trees`) on the same two seed sets, 2000+3000 and 4000+5000 (bases 2000, 3000, 4000, 5000; 96 seeds each).
- Compare against Sim Tester's per-seed rows (comment on PR #147; files /workspace/tester/runs/trees-0e6fadd-{2000..5000}.csv; set means 3.750 and 4.099). Report: how many of the 384 games match exactly (place, death time, kills, drops, pauses), any move-by-move differences that REPEAT (same seed differing on rerun with --jobs 1, or a pattern across seeds), and whether both stations reach the SAME screening decision on every veto item.
- If they match under the approved checks: you join the screening rotation (Sim Tester hands you screens). If they differ: live screens stay on Sim Tester; trace the FIRST differing tick on the first differing seed and report it.

## CURRENT ORDER (Doug 10:06 PM ET, speed-up): P-D-015 second screening station FIRST, then P-D-018 (P50)
Doug approved making Diego's Mac a second screening station NOW so two builds can be screened at once. Order: finish the P-D-016 run in progress, then P-D-015 (below; match check first), then P-D-018 P50. Update for P-D-015: screens are now TREES-ON. The match check uses Sim Tester's sim "#148 22f72a8 tools/sim + #133 item 1, --trees" and reproduces the P34 0e6fadd trees-on champion baseline rows in coord/data/screens.csv (2000+3000 mean 3.750, 4000+5000 mean 4.099) exactly, not the old trees-off P29 screen. Once it matches, take screens Sim Tester hands you (post them tagged "station: diego-mac, mode: official-screen" on the build's PR and in screens.csv). Sim Tester stays the primary screener. You never submit.


## NEXT (Doug 10:02 PM ET): P-D-018 = P50 ST-1 clear-shot laser charge (`CHARGE_LINED_ON`), a BUILD
Order (updated 10:06 PM ET): after P-D-015 is matched and running. Branch `diego/P-D-018-charge-lined` from current origin/main (must contain 8c130ad, champion P34 0e6fadd, 4.38).
- **Change (one flag, CHARGE_LINED_ON):** brain.ts around :1096 (`} else if (leading === "laser") fire[laser] = true`) starts a charge whenever the laser leads. Start the charge only when `clear && beamOn` (the same "lined" test the release uses around :1071). Release logic (full / P34 lethal) is unchanged. Source: Sim Tester death report /workspace/tester/proposals/20261121-2153-0e6fadd.md (the champion has no laser at the end in 53% of games; opponents can see `charging: true`).
- **Record first (D2):** write `coord/data/ideas/P50.json` (owner Diego's Claude) before code.
- **Step A (log only, trees-on, bases 2000-5000):** count the games where a charge starts with `!clear || !beamOn`, and how long those charges run. Under 10/192 on either set: retire it and stop.
- **On a pass:** one flag, flag-off byte-identical to main (eqdrive), check.py max under 30 ms, the 4-base trees-on checklist (0, 1000, 6000, 7000; reuse Sim Tester champion CSVs /workspace/tester/runs/trees-0e6fadd-*.csv if on the box), archive size in the PR body, flag-ON PR head titled "P-D-018 P50 ...". Then hand off to Mech Sim Tester for the full paired screen. Note: house bots ignore charging, so expect near-zero sim change; the screen only checks for breakage. A sim score alone neither promotes nor vetoes.
- Add `ACK P-D-018 (Diego's Claude) <time ET>` to coord/log.md. You never submit to the site.


## Current prompt: P-D-013 P29b midring settle fix (`MIDRING_SETTLE_ON`, same flag) (Grok, Sat Nov 21, 7:52 PM ET)

Not ACKed. Add `ACK P-D-013 (Diego's Claude) <time ET>` to `coord/log.md` in your first push. Same rules as P-D-012 below: one behavior, one flag, flag 0 byte-identical, never merge/submit/click.

**Status (7:58 PM ET):** P29 #143 was PASSED by Doug (drop arrivals judged by set totals) and goes to the site first. P29b is a backup, only useful if P29 loses or the seed 5028 and 4027 issues matter. Keep it a separate PR.

**Why.** Sim Tester's full paired screen of P29 PR #143 (head 2e1d036) came back VETO, so the build is on hold. 2000+3000 was clean. On 4000+5000: seed **5028 lost its drop-ring arrival** (place 15 vs 14), and seed **4027 had a new 46 s pause** at a spot where the champion never gets stuck, in a game that ended 1.3 s earlier. That hits clause (b) of Doug's 7:16 PM ET stall rule (coord/WORKFLOW.md). See the Sim Tester comment on #143.

**Task.** On your branch `diego/P-D-012-midring-settle` (or `diego/P-D-013-midring-settle-fix`), fix both inside the SAME behavior:
1. Reproduce seeds 5028 and 4027 (`SEED_BASE=4000`/`5000`) flag on vs main and find what the settle did right before each failure.
2. Drop yield: never settle in the 15 s before a drop call or while a drop is announced or live, or while a drop run or ring hold is possible. Stand down instantly if a drop is called.
3. No-progress give-up: if the settle move makes less than about 3 m of progress in 3 s, abandon that settle target for the rest of the circle (no retry loop).
4. Re-run your base-0 hazard plus seeds 5028 and 4027, and report the full `coord/BUILD_CHECKLIST.md`. Drop arrivals must equal main, with no new 20 s+ pause where the flag was active.
5. The PR head must be the **flag-ON build**, since screens and site tests run on the exact SHA. Keep the flag-off eqdrive proof in the PR body. Do NOT push to #143: Doug passed P29 #143 (2e1d036) at 7:55 PM ET and it's going to the site as is. Open a NEW PR titled with P-D-013 and P29b on branch `diego/P-D-013-midring-settle-fix` and update `coord/data/ideas/P29.json` on your branch. Grok copies it to main.

If the fix needs a second behavior, stop and say so in the PR.

---

## Previous prompt (done, screened VETO): P-D-012 P29 midring settle (`MIDRING_SETTLE_ON`) (Grok, Sat Nov 21, 7:00 PM ET)

Not ACKed. Add `ACK P-D-012 (Diego's Claude) <time ET>` to `coord/log.md` in your first PR. This is a bot-code build, one change, one flag. Don't merge, don't submit, don't click anything on the site.

**Idea record first (D2).** `coord/data/ideas/P29.json` already exists. Don't start coding until you've pulled main and confirmed that file is there. Put the idea id on the PR template.

**Base.** Branch `diego/P-D-012-midring-settle` off current `origin/main`. `git merge-base --is-ancestor 6182d29c673d99f5186d742a5f019c0b007234f2 HEAD` must succeed. Flag 0 must be byte-identical to main. A keep requires a site score strictly above 4.17. Champion is still B113, official 4.17, receipt BB-09AE8A68. P27 (drop crossfire skip, PR #137) just scored 4.13 CLOSE (BB-004FA2FF) — do not rebuild that idea.

**The single decision (D3).** One flag, `MIDRING_SETTLE_ON`, default off (0 / false = main, byte-identical). After a shrink, once we are already inside the circle with `farmOk`, prefer a midring sit/patrol (zratio about 0.40–0.70) over camping the center or hugging the edge. Drop run and zone-first travel stay above this rule. Stay off at r ≤ 70. Nothing else changes.

**Do not overlap P28.** P28 (Mech Builder) is a midring *patrol when there is nothing to farm and no shrink context*. P29 is the *position choice after a shrink*. Keep the code paths separate. Don't implement P28 here, and don't share a flag or a helper that also does P28's job.

**Evidence (from Watcher SKILLS.md / ideas_queue.md item 5; do not invent new numbers).** Among mechs alive ≥ 60 s, the 20–40% center-time bin has mean place 4.14 and 12.01 cubes vs 6.29 and 7.42 at ≥ 60% center time (115 mech-matches, 66 matches). Most high-team cubes are midring (909) not center (638). Overall center share is a tie (36.9% vs 37.4%). Final-circle samples are too small, which is why the rule stays off at r ≤ 70.

**Closest previous test.** No official center-camp or midring-settle receipt. Zone-early timing (P-D-007 Step B, PR #125) failed in sim and got no slot — that was when to leave, not where to stand. P27 was a drop-run interrupt, not this.

**What would disprove it.** Midring sits miss drops or the next shrink, add 20 s+ pins, raise deaths before 40 s, or fire in under about 10/192 games on the official screen; or a site score ≤ 4.17.

**Deliver** a PR titled `P29 midring settle (MIDRING_SETTLE_ON)` with:
- the idea id, the one behavior, the single flag, the champion SHA the branch contains, and change-off identical (yes/no) filled in on the PR template;
- `check.py --map-dir arena` PASS, max under 30 ms;
- flag 0 byte-identical to main (eqdrive / cmp);
- a 96-game base-0 hazard: games fired, different behavior, different score, 20 s+ pins, drop-ring arrivals, deaths before 40 s;
- the full 40-character SHA in the PR body;
- rows appended to `coord/data/screens.csv` only if you run an official both-set screen (the Sim Tester's paired screen on 2000+3000 and 4000+5000 of this exact SHA is still required before any site test).

No site submits. The 10-minute loop is the only submitter, and only after that full paired screen.

**Backup builder (Doug approved 5:57 PM ET):** if Grok's computer's Claude hits its usage limit, Grok will hand you a named build here, with branch, last verified result and next action. Take one only when it appears as the Current prompt.

## Past: P-D-011 #133 benchmark (done, PR #139) (Grok, Sat Nov 21, 5:58 PM ET; Doug approved 5:57 PM ET)

Done. ACK at 6:16 PM ET. PR #139 (Digs22, opened 6:16 PM ET): with the `geom.ts` component skip alone, a full 384-game screen ran 2.38× faster (256.4 s → 107.9 s) on a 4-core Xeon, `--jobs 4`, champion 6182d29. Final results matched 384/384; full traces matched 383/384 (seed 2031 diverged under load in the current sim's own run, not caused by the shortcut). Doug decides on adoption after the same-machine confirm on Sim Tester. Don't change the live screening setup and don't merge.

## Past: P-D-010 en-route travel delay (done, PR #140, no Step B) (Grok, Sat Nov 21, 5:50 PM ET)

Done. PR #140: the delay changes zone arrival in 6/192 and 2/192 games, and drop captures in 0, below the ~10/192 bar. No Step B and no travel-speed flag.

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

**UPDATE 8:10 PM ET: P29 WON 4.35 and is the new champion (main b6f2f8b).** P29b #146 must be rebased onto b6f2f8b. It's now a single fix on top of the champion (the drop yield plus the no-progress give-up, behind its own flag; MIDRING_SETTLE_ON stays true). Then it needs a fresh full paired screen against 2e1d036 before it can go to the site.


---
## NEXT PROMPT P-D-014 (after the P29b rebase): add trees to tools/sim (Doug approved 8:17 PM ET)

**Goal.** Make the local sim model trees the way the official protocol says, so tree ideas (blind fire into trees at a sound, concealment) can be screened. Doug's words: "ok also add trees to the simulations".

**Facts to implement (cite protocol.md).** Trees block vision, not shots: "Trees do not stop shots: you can fire blind into trees at a sound." Trunks stop sight, and the canopy is soft (partial). Gun, mortar and laser all hit buildings and terrain the same way. Today tools/sim/ASSUMPTIONS.md says trees block neither sight nor shots. Use tree data from the kit's map files and the official stream/hello where available. Never invent geometry.

**Rules.**
- Sim-only PR, branch `diego/P-D-014-sim-trees`. Put trees behind a sim option (e.g. `--trees`) that's OFF by default, so current screens are unaffected.
- Do not touch bot code (brain.ts, params.ts, nav.ts, map.ts).
- Report: the champion (2e1d036) on both seed sets with trees off vs on (placements, drop arrivals, early deaths, survivors, kills), the runtime cost, and every assumption added to ASSUMPTIONS.md.
- The coordinator and Doug decide on adopting it for screens after seeing that comparison.

---
## NEXT PROMPT P-D-015 (after P-D-014 trees): Diego's Mac becomes a second screening station (Doug approved 8:32-8:33 PM ET)

**Goal.** Run official paired screens on Diego's Mac (M4 Pro, 24 GB) alongside Mech Sim Tester, so finished builds don't wait in one queue. The sim uses CPU, not Claude usage: Claude starts the runs and reports totals, and does not read individual games unless asked.

**Step 1: match check (required before any screen counts).**
- Use the same sim as Sim Tester: tools/sim at d548479 plus #133 item 1 (shortcut-geom.diff from P-D-011-local e07ed31), trees OFF.
- Re-run Sim Tester's recorded P29 screen: build 2e1d036 vs champion 6182d29, both 2000+3000 and 4000+5000.
- Every per-set number has to match its rows in coord/data/screens.csv exactly (games changed, better/worse, delta, kills, died <40 s, drop arrivals, 20 s+ pause games). If anything differs (for example Apple-chip floating point), stop and report the differing seeds. Don't screen anything until the coordinator clears it.
- Also report the speed: jobs used and minutes per 384-game screen.

**Step 2: screening.**
- Screen ONLY builds the coordinator assigns to you in this file (each with its exact flag-ON SHA and the champion SHA).
- Use the same seeds, metrics and veto evidence as Sim Tester: activation fired/behavior/score, drop-arrival set totals, deaths before 40 s, survivors, 20 s+ pauses with clause-by-clause stall evidence.
- Post the result as a PR comment and add the rows to coord/data/screens.csv, with `source` ending in "station: diego-mac".
- Don't label anything as eligible; the coordinator decides.


---
**UPDATE 8:39 PM ET: P29b is RETIRED.** #146 6ff499b was vetoed: the dropNear gate is always true because uncaptured drops stay in obs.drops, so the settle fired 0/384 and P29 was effectively removed. Don't work on P29b any more, and leave #146 as is. **Start P-D-014 (trees in the sim) now**, then P-D-015 (second screening station). Lesson for any gate: test "a drop is near AND reachable within DROP_RUN_M", never "any drop exists".

**UPDATE 8:42 PM ET, P-D-015 match-check reference (from Sim Tester):** the P29 per-seed reference is at https://github.com/dmclaughlin-bit/mech-bot/pull/143#issuecomment-7072375870. It has per-base and per-set totals, per-seed drop churn, the 20 s+ pause list and field definitions. The original P29 screen ran on the OLD sim (plain d548479 tools/sim, WITHOUT #133 item 1). For a seed-for-seed match, use plain d548479: `SEED_BASE=<base> bun tools/sim/run.ts --bot <bot> --seeds 96 --jobs 4`. On any single-seed mismatch, rerun that seed with `--jobs 1` before calling it a failure, because the canPlan wall-clock budget can flip a seed under load.

## NEXT PROMPT P-D-016 (Doug approved 8:42 PM ET): 1-vs-15-champions info sim, Diego's Mac only
Order: finish P-D-014 (trees) first, then do this, then P-D-015. Sim-only. UPDATE 8:44 PM ET (Doug): when no fully screened build is ready, a build that beats the champion's own 15-champions baseline on BOTH seed sets with no rise in deaths before 40 s can fill a spare site slot (the loop submits; you never submit). So report the average score per game per set for the build AND the champion baseline, on the exact SHA.
- Add an option to tools/sim, off by default, that fills the 15 opponent slots with copies of the current champion (P29, 2e1d036) instead of house bots.
- For each build I assign (and the champion itself as a baseline), run 96 seeds on 2000+3000 and 4000+5000, and report average place, score, kills, early deaths, and how often it beats all 15 champions.
- Post results on the build's PR, tagged "station: diego-mac, mode: vs-15-champions". Commit the tool on branch `diego/P-D-016-vs-champions`. Don't touch bot code, the workflow, or the champion.

**UPDATE 8:46 PM ET (Doug): P-D-016 moves FIRST, ahead of the tree work.** Commit or park what you have on P-D-014 trees, build the 15-champions option now, and use it from now on. Run it on CURRENT builds only (no replays of old or rejected builds), best first: P37 #149 (f174d5556025fc0bd35c73ef83c3438a7b964c6a) first, then P34 #147 (c281bf59e6276ffda376cc84a0c95f620331485e), then P35, P38 and P40 as their PRs open. Always run the champion baseline (2e1d036) too. Post per-set average score per game, place, kills and deaths before 40 s for each build next to the baseline, tagged "station: diego-mac, mode: vs-15-champions". After that, go back to trees, then P-D-015. You never submit to the site.

**UPDATE 9:09 PM ET (Doug 9:08): repo size.** The site rejects any commit whose archive is over 20 MB. P34 was rejected because the noise-calibration raw data was on main. main 00e9ff1 removes it. Rebase your branches onto 00e9ff1. Never commit raw sim output, traces or per-seed JSON. Before pushing, check that `git archive --format=tar HEAD | wc -c` is under 15,000,000.

**UPDATE 9:17 PM ET: P34 is the new champion, site 4.38 (BB-ABEB42BF, code 0e6fadd), merged to main 8c130ad.** Branch every new build from current origin/main. Flag 0 must be byte-identical to this main, and a keep needs a site score strictly above 4.38. All queued builds (P34b, P38, P40, P37b) are stale: rebuild them on the new champion main, hand off on fresh branches, run the 4-base trees-on checklist (bases 0, 1000, 6000, 7000), and put the archive size in the PR body (`git archive --format=tar HEAD | wc -c` under 15,000,000). Old approvals expire. P34b is P34 plus one drop gate, so on the new main it should be only the drop-gate diff (LETHAL_RELEASE_ON is already true). For P-D-016, the champion baseline is now P34 0e6fadd, not P29 2e1d036. Rebase sim/tool branches onto current main as well (the 00e9ff1 size rule still applies).

## NEXT PROMPT P-D-017 (Doug approved 9:26 PM ET): death-cause reports in both sims
Order: finish the current P-D-016 vs-15-champions runs, then do this, then P-D-015. Sim-only. Don't touch bot code, the workflow or the champion. Branch `diego/P-D-017-death-report`, one PR.
- Add an off-by-default option to tools/sim (e.g. `--death-report`). For each of OUR deaths, write one row: seed, game time, killer (house slot or champion copy), weapon, front or rear hit, how many enemies had sight of us in the last 2 s, our HP 3 s before death, the bot's mode at the time (settle, drop run/hold, zone walk/escape, heal/hide, engage, farm, other), alive count, zone radius, and whether trees blocked any sightline. Use only what the sim actually knows; leave a field blank if it isn't modeled.
- Group the rows into a summary: the top 3-5 death causes (mode × weapon × sightline count, plus timing bucket <40 s / 40-120 s / late), each with its count per seed set.
- It must work both in the regular trees-on screen (`--trees`, house squad) and in `--vs-champions`. Turning the option on must not change any game result. Prove it with a 96-seed byte-identical check on one base.
- First run: champion P34 0e6fadd (main 588557e), trees-on, bases 2000-5000, in both modes.
- Commit ONLY the summary (.md/.csv, small) to coord/data/deaths/ through your PR. Raw per-death rows stay on your Mac. Check the archive with `git archive --format=tar HEAD | wc -c` < 15,000,000.
- Post the summary on the PR, tagged "station: diego-mac, mode: death-report". Grok uses it to rank the next fixes, and every new build is then checked on whether its biggest death cause goes down.
