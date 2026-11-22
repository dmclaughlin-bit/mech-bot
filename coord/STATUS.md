**CURRENT (2:05 AM ET Sun, builders-4 cutover reconciled):** Champion P48 `b9492c6` (main `edb729f`). Official bar is builders-4 **3.75** (BB-5727119F, confirmed, Entered in the final). builders-3 history: 4.44 (BB-94897D91). P49b 3.49 (BB-7C26BD16) is a LOSS vs 3.75. P53b #178 `52c2862` is queued as BB-9617EF60. Promotion and the eligibility checker use the 3.75 bar. D6 dashboard Page remains suspended; `pipeline/data/champion.json` and `coord/data/site_results.csv` are the data files.

**12:50 AM ET:** P52 #169 74b6ee4 near-miss data test (one veto: drop-ring 8->3 on 2000+3000) scored 4.23 (BB-0AB39656), LOSS vs P48 4.44 (-0.21). PR closed, retired. P41 #173 closed (Sim Tester 2 stall vetoes count over the Mac PASS). P53 #176 c57e009 opened ready to screen (builds on F9); Diego's Mac notified on #152. Site tests last 60 min: 5. Counter 1 of 6 left, next frees 12:54 AM EST. Ready: none. Near-miss pool: empty.

**12:23 AM ET:** P40d #170 45ecb4c near-miss data test (one veto: died<40 38->39) scored 4.35 (BB-97019487), LOSS vs P48 4.44. Family retired, PR closed. P44b retired by Mech Builder (near-zero effect). P38c Step A 14/192 + 9/192 on P48. Screening queue: P52 #169, P47 #171, P49 #172. Site banner changed (parked for Doug): 'Machina: one submission an hour, and your Builders folder has moved'; counter still says 6/hour.

**12:08 AM ET:** Autonomous mode. Site tests last 60 min: 1 (P43b 11:54). Slot unused: no READY build and near-miss pool empty (P43b scored, P35c retired, P50 retired). Building: P40d 45ecb4c (pushed 12:05, no PR), P52 911a662, P47 d2cf521 (Diego), P44b + P49 (no branch yet), P38c/P46 (Doug laptop, not pushed). Records for P52/P47/P40d copied to main.

**11:55 PM ET:** P43b #162 e4879af official screen vs P48: 1 veto (drop-ring 7->5 on 2000+3000), mean -0.010/+0.031, fires 8/192 and 11/192. Near-miss candidate pending Doug ruling on 8/192 activation. Slot unused this tick: no READY build; near miss held for that ruling. ChatGPT #168 reviewed (APPROVE_WITH_STIPULATIONS, advisory).

# Current status for researchers (read this first)

**Doug 10:28 PM ET:** Diego's Mac screens builds with build and champion on the same machine; first two builds (P43 #158, P35b #159) cross-checked on both stations before its verdicts count.
n**10:29 PM ET: P48 tree retreat scored 4.44 (BB-94897D91), NEW CHAMPION (near-miss data test, drop-ring veto was a sim false negative). PR #157 needs merge; rebase queue onto b9492c6.**

**Doug 10:06 PM ET speed-ups:** Diego's Mac second screening station (P-D-015) moved first; Step A fires check before every new full build; spare tests to near misses every tick. P40b ca549ae scored 4.29 (BB-18893791), LOSS.

Updated by Grok, Sat Nov 21 2026, 3:44 PM ET. Grok updates this file whenever the champion or the in-flight list changes. The canonical data is `coord/data/` (site_results.csv, ideas.md, screens.csv, hazard_screens.csv).

## Champion (base for all research and builds)
- **B113 drop reach 200 m**, commit `6182d29c673d99f5186d742a5f019c0b007234f2`, site **4.17** (BB-09AE8A68), merged to main `8b6e7b2841f5d26402d19fc4b28d16d2d6760550`. Submitted 2:40 PM ET, scored 2:43:56 PM ET. Site showed wait 202 ms (earlier entries showed 35–127 ms). Site auto-entered it in the final (no click).
- Stack on top of B80 (3.79): **B103 lightning ambush** (3.92, `LIGHT_AMBUSH_ON`: lightning holder with no laser, seen by exactly one enemy at 45–90 m, steps out of sight and waits) + **P-B-001 standoff break** (`STANDOFF_BREAK_S=60`, 4.06) + **P-D-003 supply-drop run** + **B113 longer reach** (`DROP_RUN_M=200`).
- Research line numbers must be on current main, not the 4.10 tree. Re-locate before citing.
- A build keeps only if its site score is strictly above 4.17.
- Bot code on main equals `6182d29`. Flag 0 must be byte-identical to this main.

## Rules that affect research
- The site score is the only truth. The sim is a crash/timing/flag-0 screen (sim vs site held-out r about 0.2). Don't rank ideas by sim delta.
- Score tracks our kills. Kill rate drops after 120 s. Ideas that add kills mid/late game are the best bet.
- One change per build, behind a flag, flag 0 byte-identical to main.
- Sequence rule: one submission scored at a time; queued builds are rebased onto any new best before submission. Never submit while a score is pending.
- Queue priority: (1) site-result-driven ideas first — tweaks of the current best, and rebuilds of anything that beat its own parent; (2) Diego's research ideas fill leftover slots only, after a sim trigger count of about 10 of 192 games or more; (3) ideas in the same family as a recent loss go last. The finish-burst family is last after B108 (3.75). The threat-forecast type (S2 / P-D-002, site 3.79) now also ranks lower after a loss.

## Site results today (since B80)
| Build | Change | Parent | Site | Verdict |
|---|---|---|---|---|
| B103 | lightning ambush | B80 3.79 | 3.92 | KEEP |
| B104 | supply-drop run `DROP_RUN_M=150` | B80 3.79 | 3.88 | CLOSE (+0.09 over its parent; rebuilt on 4.06 as B107) |
| P-B-001 | standoff break | B103 3.92 | 4.06 | KEEP (still in the stack) |
| B106 | lightning ambush also with an uncharged laser | B103 3.92 | 3.85 | CLOSE, dead (do not widen the ambush to laser holders) |
| B108 | finish burst (`FINISH_BURST_ON`) | 4.06 | 3.75 | CLOSE (−0.31); finish-burst family last |
| P-D-002 | second-hunter threat forecast (`FORECAST2_S=60`) | 4.06 | 3.79 | CLOSE (−0.27); threat-forecast type now ranks lower |
| B107 / P-D-003 | supply-drop run on 4.06 (`DROP_RUN_M=150`) | 4.06 | 4.10 | KEEP, previous champion; still in the stack, reach now 200 |
| P-B-006 | standoff break at 45 s (`STANDOFF_BREAK_S` 60→45) | 4.10 | 4.02 | CLOSE (−0.08); 60 s stays |
| B113 | drop reach `DROP_RUN_M` 150→200 | 4.10 | 4.17 | KEEP, current champion |
| B115 | drop-run arrival lead `DROP_RUN_LEAD_S` 5→10 | 4.17 | 4.13 | CLOSE (−0.04); keep lead 5 |
| B118 | drop reach `DROP_RUN_M` 200→260 | 4.17 | 4.17 | CLOSE (tie); reach gain flat past 200 m |
| P20 | drop run when hurt and unseen (`DROP_HURT_ON`) | 4.17 | 4.17 | CLOSE (tie); trigger looks rare |

## In flight (do not duplicate)
No score pending as of the last log entry (3:12 PM ET). Next site order for the 3:40 PM ET hour: B117 loadout/HP matchup (PR #123, `4e39389`), then P21 drop contest (PR #122), B110 standoff 90 s (PR #108), B111 ambush 100 m (PR #109). Check `coord/data/site_results.csv` for scores.

## Queued
- Champion tweaks to bring onto 4.17 main and re-gate: B112 standoff far edge 100 m (PR #110), P19 HP margin 0.1 (PR #112), P18 standoff max 120 m (PR #111).
- Reserves on 4.17 or to rebase: P-B-004 zone unpin (PR #104), P-B-005 gun lead during charge (PR #106), P-B-002 laser-charge react (PR #113), P-D-006 cook-off (PR #114). B116 movement mode 6 (PR #119) on hold (Doug, 3:07 PM ET).
- P-B-008 movement and evasion track (sim-only, PR #115); feeds the site queue only after the gate and sim testers show opponent hit rate down without new stuck problems.
- Diego's Claude (from 3:42 PM ET): P-D-007 late-game kill-source measurement (current), P-D-008 laserSkip expiry, P-D-009 two-horizon race shadow count. See `coord/next-diego.md`.

## Dead families (don't research further without a new mechanism)
Opening / first-30 s tweaks (seven 3.79 ties), upgrades, later aim tweaks, hold-behind-cover and wider cover variants, unbounded laser rush, lightning late-walk distance/start-time/claim variants, widening the lightning ambush to laser holders (B106), no-early-finish (B98), finish burst (B108 3.75). Threat-forecast (P-D-002 3.79) ranks lower after that loss. Standoff at 45 s (P-B-006 4.02) lost; 60 s stays. Drop-run lead 10 s (B115 4.13) lost; drop reach 260 m (B118) and drop-when-hurt (P20) tied 4.17, so reach is flat past 200 m. Full list: `coord/data/ideas.md`.

## Most useful research now
1. Mid/late-game kill sources on top of 4.17 (after 60 s, especially after 120 s), including ideas that combine with the drop run (now 200 m), standoff break, or ambush without changing them.
2. Trigger-frequency estimates for any new idea (how many games per 100 would it change?).
3. Tweaks of the 4.17 champion (priority 1). Drop reach is flat past 200 m (260 m tied) and a 10 s lead lost; new drop ideas need a new mechanism, not a longer reach.

## Sim-only track (added Sat Nov 21, 1:56 PM ET)
- **P-B-008 movement & evasion training track** (Doug, 1:52 PM ET). Sim-only: strafe / slide / orbit / telegraph dodge / slide-around-cover on the current champion, all current rules held in place (now the 4.17 drop-run stack). Branch `build-109-movement`. It does not take a site slot. It feeds the site queue only after the gate is green and sim testers show opponent hit rate down without new stuck/pin damage. Not a remake of B101 (early gun-round dodge, not submitted). Rebase the track onto 4.17 main (`8b6e7b2` / `6182d29`) when that work is free.


## Empty slot, Sat Nov 21 5:45 PM ET tick (loop)
- No READY candidate against champion 6182d29 (B113, 4.17). Ledger: coord/data/ready_ledger.md (created this tick).
- Blocker: zero fully screened builds; P25 cube memory has no PR/SHA and no paired screen yet. Reserve goal (2 READY + 1 researched) is at 0 READY.
- Owner: Mech Builder (P25 build), then Mech Sim Tester (full paired screen 2000+3000 and 4000+5000). Diego's Claude is backup builder.
- Next action: parent assigns P25 push + a second new-family build so the reserve refills; loop submits the first one that turns READY.

- Sat Nov 21 10:47 PM ET: Codex reviewer UNAVAILABLE (codex-cli 0.171.0 installed, not logged in). REV-0002 on PR #129 11826ae vs champion 6182d29 recorded as status unavailable, verdict none (script exit 0 because codex_required=false; this is NOT a pass). Owner: Doug, who runs `codex login --device-auth` on the project computer. Closes when `codex login status` shows logged in and a completed review record exists.
- Sat Nov 21 10:50 PM ET: Doug decided we will NOT use Codex. Codex review is retired from the workflow; REV-0002 stays as an unavailable record. Device sign-in was cancelled.


## Hourly report, 5:00-6:00 PM ET (loop, 6:06 PM ET tick)
1. Champion: B113 drop reach 200 m, 6182d29, 4.17 (BB-09AE8A68). Official gain since 12:00 PM ET: +0.38 (3.79 -> 4.17). Wins: 4 of 19 scored tests since noon (B103, P-B-001, P-D-003/B107, B113).
2. Verified winners implemented: 4/4 (100%), all in champion history on main.
3. Submissions with all required evidence before the click: 0/3 this hour (P24 5:15, P23b 5:24, B125 5:33, all before the 5:41 PM rules; P23b and P24 screen rows were recorded after their clicks, B125 has none). 0/0 submissions under the new rules so far.
4. Slots: 3 of 6 used. Lost: 5:45 and 5:55 PM ET ticks had no READY build (zero fully screened builds); a third slot went unused. Ready next: none. P25 #136 (b34271c) finished its full screen but is HOLD on a 21 s pin caused by the change (seed 3043); the Builder is fixing it and an exception needs Doug's yes. P26 #138 (c566fba) and P27 mode 36 #137 (7df3a4a) are new, not screened yet.
5. Decision that changed: the B125 package loss (3.50) retired bundled tactic packages; one change per build only.
Hit rate: 4/19 = 21% since 12:00 PM ET (in line with the 20% prior); 0/10 against the current champion (3 ties at 4.17). Planning prior for the next test: about 15%.


## Loop 6:55 PM ET (Sat Nov 21)
- P27 #137 (7df3a4a6) submitted 6:50 PM ET, BB-004FA2FF, scored 4.13 (-0.04 vs 4.17): CLOSE. Champion unchanged: B113 6182d29, 4.17.
- Empty reserve: 0 READY. P26 #138 and P25b #136 screens are complete but HOLD on rule (6) new 20 s+ pins with the feature not active in the window (P26: 4018 22 s, 5053 20 s; P25b: 72, 4091, 5048, 5054). Owner: Doug (does a pin with the feature inactive veto?). P25b also has a D3 question (memory + no-progress drop under one flag).
- Site banner (seen 6:50 PM ET): "New rule: excessive code reuse may result in disqualification." Counter 5 of 6 left; next frees 7:50 PM ET.
- Next action: parent assigns a new non-drop build to Mech Builder (Diego's Claude backup) to refill the reserve.

## Loop 9:13 PM ET (Sat Nov 21)
- NEW CHAMPION: P34 lethal release, 0e6fadd, 4.38 (BB-ABEB42BF), +0.03 over P29 4.35. Submitted 9:10 PM ET on Doug's order. Branch p34-rebased is not merged to main yet (needs a PR; coordinator does not merge). All waiting builds are stale: rebase on 0e6fadd and re-screen. Banner now: 'Shopping Sessions is being rescored, please see the rules page!'. Counter 4 of 6 left, next frees 10:07 PM EST.
- UPDATE 9:17 PM ET: P34 0e6fadd is now merged to main as 8c130ad7f0c81acb03508c40f20c31867f29d358. Bot code on main equals 0e6fadd (coord/pipeline excepted).

## 9:25 PM ET: P45 selected from Doug research handoff (R1)
- Midring settle spot quality (MIDRING_SPOT_ON), Step A measurement first, owner Mech Builder, next free session ahead of P37b. Record: coord/data/ideas/P45.json. R3 laser option deferred (P34b2, P42, P44 already cover P34 follow-ups).

## 9:29 PM ET: Doug on PR #153
- Option A: no knob sweeps; keep the current queue and the full two-set screen. Revisit a specific setting only if replay evidence shows changing it produces a genuinely different behavior.
- 10:07 PM ET slot: the loop submits the highest-ranked eligible (fully screened) build if one is ready and no score is pending; if the slot goes unused, log what held it up in this file.


## 9:53 PM ET: near-miss pathway confirmed (Doug 9:47 PM ET)
- Doug confirmed the merged near-miss pathway. Official text is the additive section in `coord/WORKFLOW_CHART.md` (existing chart untouched) and the matching section in `coord/WORKFLOW.md`. First ranking: `coord/data/near_miss_ranking.md`.
- At this check: U = 2 (P34 `c281bf5` rejected 9:07 PM ET, BB-FB8CB5AE; P34 `0e6fadd` submitted 9:10 PM ET, scored 4.38, BB-ABEB42BF; `coord/data/site_results.csv`). R = 1 (P40b PR #155 handed off 9:47 PM ET after a trees-on four-base checklist; official screen comment not posted yet as of 9:53 PM ET; if Sim Tester started promptly the screen can finish before 10:07). spare = (6 - 2) - (1 + 1) = 2. Next slot frees 10:07 PM EST. No normal READY build. No near miss is eligible to submit yet: none has a trees-on official screen on main `8c130ad`. Best candidate is P35; it still needs a rebase onto current main and a trees-on official screen (see the ranking file).

## 11:30 PM ET tick (box back after reset ~11:23 PM ET; down since ~10:32 PM ET, ticks 10:32-11:11 skipped)
- Champion P48 b9492c6 (main edb729f), 4.44. Ready: 0. Tests in last hour: 1 (P48 10:27 PM). Slot unused 10:32-11:23 PM ET: coordinator computer down, and no READY build existed.
- Mac fallback screens (P-D-019): P43b #162 VETO (drop-ring 8->6 on 2000+3000; pause games 1->2 on 4000+5000). P35c #163 HOLD (pause games 1->3 on 2000+3000; survivors 3->2 on 4000+5000; mean lower on both sets). Records copied to main (D2).
- P50 #161: checklist item 3 fail (rings 11->10 over 4 bases); Doug's ruling requested.
- ChatGPT issue inbox (Doug 10:44 PM ET): labels chatgpt-review / under-review / reviewed created; test issue #164 detected, one review comment (APPROVE_WITH_STIPULATIONS), labels flipped to reviewed, closed; a second pass did not detect it again. Verified 11:33 PM ET.

## 11:45 PM ET tick
- Champion P48 b9492c6 (main edb729f), 4.44. Ready: 0 (below target 3-4). Tests in last 60 min: 0 (last 10:27 PM ET). Slot unused this tick: no READY build and no eligible near miss (owner: builders; next: Sim Tester official screens of P43b #162 / P35c #163, Mech Builder P44b / P40d).
- P50 #161: Sim Tester trees-on screen vs P48 = VETO, 3 vetoes (stall a/b/c) + 1 NEEDS DOUG (survivors 3->2 on 4000+5000). Failed, not a near miss. Mac cross-check also VETO (drop rings 8->7).
- P51 (PR #167): Step A on P48 fired 8/192, retired.
- ChatGPT issues #165 and #166 (connection tests from Diego) reviewed: DENY as directives (no idea in them); integration confirmed working.

## Loop 12:42 AM ET Sun
- Site tests last 60 min: 3 (P43b 11:54, P40d 12:20, P49 12:33 on Doug's order, score pending). Slot unused this tick: held by the pending P49 score.
- READY: P47 #171 9d388ad (Mac screen no veto, check.py max 2.9 ms, archive 3,543,040). Next in line after the P49 score.
- Near miss: P52 #169 74b6ee4 (only veto: drop-ring 8->3 on 2000+3000).
- Retired from in-flight: P44b (no effect, no PR), P38c (Step A fail), P46 (Step A fail), P41 (Sim Tester VETO 2, stall), P49 (screen VETO 3; site-tested on Doug's order). Building: P42 (39b342c 12:28), P49b, P53.

## Loop 12:58 AM ET Sun (champion P48 edb729f, 4.44)
- Site tests last 60 min: 4 (00:20 P40d, 00:34 P49, 00:40 P47, 00:47 P52). Ready: 0. Slot unused this tick: nothing READY and no eligible near miss.
- P53 #176 c57e009: Diego's Mac screen VETO (stall c held-out 2->3) and mean lower on both sets -> not READY, not a near miss. Outcome B; F14/N5 added. Refinement P53b assigned to Diego's Claude (P-D-026). Sim Tester screen of P53 optional (Mac verdict stands unless Sim Tester disagrees).
- Building: P49b (branch 0c6b134, flag-ON flip pushed 12:53, no PR yet), P52b and P54 (Mech Builder; no branch yet).

## HOURLY REPORT 1:05 AM ET Sun
- Champion: P48 tree retreat b9492c6 (main edb729f), site 4.44. Since P48: 0 wins in 5 scored tests (P43b 4.35, P40d 4.35, P49 4.02, P47 4.35, P52 4.23).
- Site tests last hour: 4 (00:20, 00:34, 00:40, 00:47) vs goal 3: met.
- Submissions with full evidence / total (last hour): 3/4 (P49 was Doug's direct order on a vetoed screen).
- Slots unused since 12:54 and why: nothing READY, no eligible near miss (P53 vetoed with mean lower on both sets on both stations).
- Most important decision changed by the last result: P52's 4.23 confirmed drop-ring loss is real (N3) -> P52b must keep both drop rings; P53 outcome B -> refinement P53b (gate on no enemy in gun range).
- Learning metrics: active experiments with complete records 4/4 (P49b, P52b, P54, P53b); new assignments citing findings 4/4; refinements from earlier experiments 3 (P49b<-F4, P52b<-F8/F11+N3, P53b<-F9/F14+N5); redundant experiments avoided 2 (P42 N4, P52 rebuild as-is); refinements passing screen 0 so far; refinements improving the official score 0 so far.
- In flight: P49b PR #177 0c6b134 screening (Sim Tester + Mac); P53b building on diego/p53b-boost-save-safe d3662df; P52b, P54 with Mech Builder (no branch yet).

## Loop 1:18 AM ET Sun
- P49b #177 0c6b134 on the site as BB-7C26BD16 (submitted 1:09 AM ET), queued; PENDING row added. Near-miss data test: Sim Tester VETO 1 (stall c), Mac PASS; own checks pass (check.py max 4.7 ms, archive 3.55 MB).
- SITE BANNER CHANGED: "Mech Royale is being rescored on 96 fresh random seeds!" Older receipts now show "Scored under a previous version". Parked for Doug: whether the champion/standing changes after the rescore (watch the site for new scores; the champion only changes by a strictly higher site score).
- Counter at 1:18: 1 of 6 left, next frees 1:20 AM EST.

## Loop 1:29 AM ET Sun
- P49b BB-7C26BD16 still queued on site (#40 of 80, site queue ~9 min). No builders-4 score for P48 yet; all our rows show "Scored under a previous version". Banner unchanged (rescore on 96 fresh seeds). Counter 2 of 6 left, next frees 1:34 AM EST.
- P53b #178 52c2862 READY (neutral, Mac screen no veto); held only by the pending P49b score.
- ChatGPT issue #179 reviewed: APPROVE_WITH_STIPULATIONS, audit result NO-GO / no change; closed.
- Parked for Doug (once): re-testing builders-3 near-losers P43b, P40d, P47 under builders-4 would resubmit tested code.
## Loop 1:50 AM ET Sun
- Pending: P48 baseline retest BB-5727119F queued (#20 of 46 at ~1:49 AM, site wait ~6 min). P49b BB-7C26BD16 scored 3.49 builders-4 (compare pending vs P48 builders-4). Counter 3 of 6 left.
- Slot unused this tick: site allows one pending per team. NEXT the tick BB-5727119F scores: P53b #178 52c2862 (rechecked now: contains edb729f, archive 3,727,360 B, not in site_results).
- Banner unchanged ("being rescored on 96 fresh random seeds").

## Loop 2:00 AM ET Sun
- P48 builders-4 baseline scored 3.75 (BB-5727119F) = champion bar; P49b 3.49 LOSS.
- Submitted P53b #178 52c2862 (BB-9617EF60, queued). Site tests last 60 min: 3 (P49b 1:09, P48 1:44, P53b 1:59). Rules text says 4/hour; counter 6/hour; loop caps at 4. Next: P41 near miss #173 c21d23b after BB-9617EF60 scores (4th slot until ~2:09).

## Loop 2:10 AM ET Sun
- BB-9617EF60 (P53b) still queued (#3 of 28 at ~2:08). Counter 3 of 6 left; rules text 4/hour.
- Near-miss pool now EMPTY: P41 #173 was retired 12:50 AM ET (Sim Tester stall b+c vetoes); 96-fresh-game advisory 2:03 AM: P41 3.708 vs P48 3.740, delta -0.031 +/- 0.056. Loop rechecks of c21d23b (check.py max 3.9 ms, archive 3,584,000) are moot.
- Unused slot reason: no READY build and no eligible near miss after P53b. Closest: Mech Builder P60 (no branch yet; last builder commit P59 1:48 AM).

## Loop 2:15 AM ET Sun
- P53b BB-9617EF60 scored 3.63 builders-4: LOSS (-0.12 vs 3.75). 96-game had predicted +0.000 (neutral); site came in lower, consistent with N2 (hypothesis).
- Submitted P41 c21d23b as near-miss data test (BB-0AAB8ADB, queued #14). Reason: no READY build; P60 (positive F16, near-miss candidate) still needs the official screen + 96-game estimate. Site tests last 60 min: 3 (P48 1:44, P53b 1:58, P41 2:13). P60 is next once screened.

## Loop 2:20 AM ET Sun
- P41 BB-0AAB8ADB scored 3.84 builders-4: WIN (+0.09 vs P48 3.75). NEW CHAMPION P41 c21d23b (PR #173, not yet merged to main). Site marks BB-0AAB8ADB Entered in the final.
- Submitted P60 afb6f26 (BB-6F449E11, queued #16 of 21) in the same browser session: it was READY vs P48 (Sim Tester PASS 0 vetoes; 96-game +0.000 +/- 0.086; loop check.py max 5.3 ms; archive 3,747,840). Now a data test vs 3.84 (it lacks P41's change).
- Site tests last 60 min: 4 (P48 1:44, P53b 1:58, P41 2:13, P60 2:23). Cap reached until 2:44 AM ET.
- Queue is stale: P61 and any new build must be rebuilt on P41 c21d23b and re-screened; Sim Tester needs a P41 trees-on baseline.
- Learning: F17 (P41 won despite local -0.031) and N10 (96-game estimate missed the sign twice). Because we learned the 96-game estimate does not predict small site effects, we moved one-veto near misses up for site tests and kept the estimate advisory only.
- 2:27 AM ET: coordinator merged P41 c21d23b to main as 503a53d (no-ff; only conflict was coord/data/ideas/P41.json, kept main version). New champion bar 3.84 builders-4 (BB-0AAB8ADB). All builds must now contain 503a53d (or c21d23b). Queue rebased: P61 rebuild on main; Sim Tester P41 baseline requested.

## Loop 2:38 AM ET Sun
- P60 BB-6F449E11 scored 3.88 builders-4: WIN (+0.04 vs P41 3.84). NEW CHAMPION P60 afb6f26 (PR #181, not merged; built on P48, lacks P41 EARS_LOOK). Site marks BB-6F449E11 Entered in the final. champion.json updated (merge_commit pending, parent merges).
- Site: counter 2 of 6, next frees 2:44 AM ET; rules text still 4/hour; nothing pending. Tests last 60 min: 4 (1:44, 1:58, 2:13, 2:23).
- Queue stale again: P61 (being rebuilt on P41) must instead be built on P60. Top next build: P41 EARS_LOOK rebuilt on P60 (F17+F18). Sim Tester needs a P60 trees-on baseline (screens vs P48 already exist for afb6f26).
- Unused slot reason (from 2:44): no build READY vs the new champion.
- Because we learned P60's far-cover walk scores above P41 on the site, we moved "P41 look on P60" to the top, moved P61 down until rebuilt on P60, and assigned Sim Tester to baseline P60.
- 2:42 AM ET: P60 afb6f26 3.88 builders-4 (BB-6F449E11) = champion. Coordinator merged #181 as 32acd3d with main bot code exactly afb6f26 (P41 EARS_LOOK removed from main because the scored champion lacks it). New builds must contain 32acd3d. Top build: P41 EARS_LOOK as one change on 32acd3d; then P61 on 32acd3d. Sim Tester: P60 baseline.
- 2:45 AM ET loop: slot free (3 tests last 60 min: 1:58, 2:13, 2:23), none used: nothing eligible; P41 EARS_LOOK-on-P60 build not yet pushed; P60 baseline rows landed (2bca723). No receipt pending.

- 2:52 AM ET loop: unused slot. No READY build, near-miss pool empty, no receipt pending. P62 (EARS_LOOK on P60) still with Mech Builder (briefed 2:43), not yet pushed; nothing screened vs P60. Rolling hour 3 tests (1:59, 2:13, 2:23).

## Hourly report 3:00 AM ET (loop)
- Champion P60 3.88 builders-4 (BB-6F449E11). Wins out of scored builders-4 tests: 2 of 4 (P41 3.84, P60 3.88; P53b 3.63 loss; P48 3.75 baseline).
- Site tests 2:00-3:00: 2 (2:13 P41, 2:23 P60); rolling 60 min at 3:01: 2 (2:13, 2:23). Goal 6, min 3. Below minimum.
- Unused slots: 2:33-3:00 nothing eligible; P60 promotion at 2:38 made every queued build stale; P62 (first build on P60) only pushed 2:57.
- Decision changed by last result: P60 became champion without P41 EARS_LOOK, so P62 re-tests EARS_LOOK as one change on P60.
- P62 d3c356a: loop checks PASS (contains 32acd3d; check.py max 4.0 ms; archive 3,819,520 bytes). Waiting for Sim Tester paired screen vs P60 + 96-game estimate. Idea record copied to main.
- Learning: findings ledger at F18/N10; no new screen verdicts this hour after 2bca723.
- 3:10 AM ET coordinator ruling: P61 f1fcab7 (BUILDING_COVER_COMMIT_ON) is outcome C because the mechanism was disproved (target deaths 6->6, 8->8). It is still kept as a DATA-TEST candidate: paired +0.042/+0.031 on practice bases 0/6000, kills up, no safety veto, and F17/F18 show the site decides small effects while candidate supply is the bottleneck. It is eligible only if the official Sim Tester screen vs P60 has no veto. Builder free slot: P65 BODY_WIDTH_COVER_ON. Diego lane: P64 BACKAWAY_LOS_BREAK_ON (#152, 3:03).

**3:09 AM ET (loop):** P62 #182 d3c356a submitted as near-miss data test, receipt BB-AD32CDFC (queued #1; counter 4 of 6 before, 3 of 6 after; rules text still says 4/hour; scorer builders-4). Reasoning (autonomous mode): Sim Tester VETO is one veto type (blocking stall) via clauses b (2021) and c (2021, 5036); the look was not active during either new pause; both means higher (+0.036 and +0.057); same stall seeds as P41, which beat its site bar. No crash, deaths<40 48->47 and 38=38, drops equal. Bar 3.88 builders-4. Final entry unchanged (BB-6F449E11).

**3:16 AM ET (loop):** P62 BB-AD32CDFC scored 3.82, LOSS vs 3.88 (builders-4); F19 added; P62 retired. P61 #183 2298fbe: Sim Tester VETO (2 stall vetoes) and means lower on both sets (-0.031, -0.021) so it is not eligible as a normal build or near miss. Slot unused: nothing eligible. Counter 4 of 6 left. Waiting on P64 (Diego, branch pushed 3:13) and P65 (Mech Builder).
