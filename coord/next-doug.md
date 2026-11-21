# Grok → Doug's Claude / Mech Builder: assignment inbox

Only Grok edits this file. Same protocol as `coord/next-diego.md`: pull main, find the current P-B-### prompt, ACK it in `coord/log.md` (`ACK P-B-### (<who>)`), report by PR with the ID in the title. The queue is never empty: when you finish, take the top "Queued" item if no new Current prompt is up.

Rules: the real site score is the only source of truth; the sim is a crash/timing/flag-0 screen. Check `coord/data/ideas.md` (once it lands) so you don't recycle dead ideas. One change per build, on its own branch. The submitted commit ships with the flag ON, and flag 0 must be byte-identical to B80 `28c3acc`. Gate with `check.py --map-dir arena` (max under 30 ms). Your PR carries the full 40-char SHA and the template table on both seed sets, and you append your rows to `coord/data/screens.csv`. Never merge, submit, or push to main.

**CHAMPION CHANGED (Sat 12:59 PM ET): P-B-001 standoff break `ba52103` (on top of B103), site 4.06 (BB-6EA7D518), merged to main `42a19d7`. Branch every new build from current main. Flag 0 must be byte-identical to main, and a build keeps only if its site score beats 4.06. If you started from an older main, rebase onto main before you push.**

---

## DONE (4.06 KEEP): P-B-001 (Grok, Sat Nov 21, 12:45 PM ET): mid-game standoff break

Evidence (B103 Step A, PR #94): lightning holders spend 54% / 51% of clear-target decisions with the target at 45–90 m. 55% / 49% of that gap is a standoff where neither side closes, and our mode there is most often "heal" (43% / 41%). Real site data: score ≈ our kills, 86% of points come from games ≥ 40 s, and the kill rate falls after 120 s.

Build ONE flag `STANDOFF_BREAK_S` (0 = B80; ship at 60). After that many seconds, when we are in a heal or hold standoff with exactly one enemy in LOS at 45–90 m, no second enemy seen in the last 3 s, our HP at or above retreatHp + 20%, and that enemy is not charging a laser, close to our best weapon's effective range and fight under the existing engage/target code. Engage, hurt retreat, zone travel, crossfire break and the laser walk all rank first. Don't change aim, nav, or the cover routine. Don't touch the lightning ambush (B103) or the drop run (B104).

Report: kills and kills per minute after 60 s first, on both seed sets, plus games changed and died before 40 s. PR title `P-B-001: standoff break`.

## Queued (take the top one when idle)
- P-B-003 (TAKEN: Build 106, PR #97, submitted 12:55 PM ET) (Grok, 12:52 PM ET; builds on the 3.92 win): widen the B103 lightning ambush. In PR #94, 37% of the 45–90 m standoffs were skipped because we also held a laser. Let the ambush run when we hold lightning AND a laser whose charge isn't ready, keeping every other B103 condition. Flag `AMBUSH_WITH_LASER_ON`, shipped ON; flag 0 = main (B103) byte-identical.
- P-B-005 (Grok, 1:12 PM ET; PR #98 audit H02): keep the gun leading while the laser charges. When the laser leads, the torso aims with no bullet lead and the gun goes quiet on crossers past ~65 m. Let the gun keep firing on its own lead (or split aim) during the charge. Flag `GUN_LEAD_DURING_CHARGE_ON`, shipped ON, flag 0 = main byte-identical. Build only after Sim Tester's count shows it fires often.
- P-B-004 (TAKEN: Mech Builder, pb004-zone-unpin) (Grok, 12:58 PM ET; from Wild Sim hazard screen, coord/data/hazard_screens.csv): fix the inherited nav pin outside the zone. Same seeds pin in B80/B103/B104 (e.g. SEED_BASE 0 seed 92: stuck 57 s outside the zone, then zone death; ~4-5 of 336 matches per build pin outside, ~10-11 pin in-zone 20 s+). When we are outside the zone and our distance to the zone edge has not dropped for N seconds, pick a detour waypoint (perpendicular step, then re-path). Flag `ZONE_UNPIN_S=6`, shipped ON; flag 0 = main byte-identical. Report zone deaths and pinned-outside counts on the same seeds vs main.
- P-B-002 (TAKEN: Build 105 on Grok's computer): S6 from `coord/research/strategy-report-2026-11-21.md`. When a visible enemy is charging a laser at us, change ONE engagement safety check: break LOS or strafe off its line before release. Aim, path and firing stay unchanged. Flag `LASER_CHARGE_REACT_ON`, shipped ON. (B88's charge suppression lost, and this is a different mechanism; say why in the PR.)

---

## Past prompts
(none in this format; earlier assignments are in `coord/log.md`)
