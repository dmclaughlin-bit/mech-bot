# Grok → Doug's Claude / Mech Builder: assignment inbox

Only Grok edits this file. Same protocol as `coord/next-diego.md`: pull main, find the current P-B-### prompt, ACK it in `coord/log.md` (`ACK P-B-### (<who>)`), report by PR with the ID in the title. The queue is never empty: when you finish, take the top "Queued" item if no new Current prompt is up.

Rules: the real site score is the only source of truth; the sim is a crash/timing/flag-0 screen. Check `coord/data/ideas.md` (once it lands) so you don't recycle dead ideas. One change per build, on its own branch. The submitted commit ships with the flag ON, and flag 0 must be byte-identical to B80 `28c3acc`. Gate with `check.py --map-dir arena` (max under 30 ms). Your PR carries the full 40-char SHA and the template table on both seed sets, and you append your rows to `coord/data/screens.csv`. Never merge, submit, or push to main.

**Read `coord/STATUS.md` first: current champion, in-flight builds, dead families.**

**CHAMPION CHANGED (Sat 12:59 PM ET): P-B-001 standoff break `ba52103` (on top of B103), site 4.06 (BB-6EA7D518), merged to main `42a19d7`. Branch every new build from current main. Flag 0 must be byte-identical to main, and a build keeps only if its site score beats 4.06. If you started from an older main, rebase onto main before you push.**

---

## CURRENT (SIM-ONLY training track, not a site slot): P-B-008 (Grok, Sat Nov 21, 1:56 PM ET): movement & evasion training track

Doug, 1:52 PM ET: train movement in the local sim (strafe, slide, fluid motion) so the mech is harder to hit, keep pathfinding from getting stuck on objects, fine-tune map awareness (always know where we are), and improve evasion plus aiming while moving. **All current 4.06 champion rules stay in place.** Only movement / evasion / aim-while-moving mechanics change. This is **sim-only**: do not submit to the site, do not merge to main, do not take a practice slot. After the gate is green and the sim testers show opponent hit rate down without new stuck/pathing damage, Grok hands the winning variant to Mech Builder for a later site test on the then-current champion.

**Base.** Branch off current `origin/main`. Verify bot code is still the champion: `git merge-base --is-ancestor 42a19d7f56770855d7583f569e1b2ebbae630822 HEAD` must succeed, and `git diff 42a19d7 -- bot.ts brain.ts params.ts nav.ts target.ts map.ts mechfight.ts` is empty before you start. Flag 0 must be byte-identical to that main bot code (not to B80).

**Champion rules you must not change** (from current main / EXPERIMENTS.md). Decision priorities, triggers, and thresholds stay exactly as they are. In particular, keep:

- Path-aware nav and the existing `nav.stuck` unstick (Build 3): jump / jet / replan after ~0.5 s of a commanded move with almost no speed.
- Farm (`FARM_ON`, `FARM_HUNT_ON`) and the farm distances.
- Engage / finish (`ENGAGE_ON`, `params.aggression`, `ENGAGE_FINISH_HP`) and cube claim after a kill.
- Target pick (`TARGET_PICK_ON`).
- Laser rush (`LASER_RUSH_ON`, `LASER_RUSH_S=45`, `LASER_TRIP_M=250`, `LASER_CHASE_S=20`), including lost-target re-aim and the release rule.
- No-sneak while not hurt (`NO_SNEAK_ON`).
- Crossfire break (`CROSSFIRE_ON`) and late lightning walk (`LATE_LIGHT_ON`, Build 80).
- Lightning ambush (`LIGHT_AMBUSH_ON` in `brain.ts`: lightning, no laser, seen by exactly one enemy at 45–90 m, step out of sight and wait). Do not widen it.
- Standoff break (`STANDOFF_BREAK_S=60`: after 60 s, lone 45–90 m heal/hold standoff, close to best-weapon range). Do not change the trigger or the close-to-range rule; you may only change *how* the mech moves while closing or fighting (strafe/slide/orbit), not *when* it decides to break or stand off.
- Rank order stays: engage, hurt retreat, zone travel, crossfire break, laser walk, and the lightning ambush all rank first. Zone safety always wins.

Today, when `engage` has a clear shot and is not closing for a finish, `move` stays `[0, 0]` (`brain.ts` initializes move to zero and only calls `travel` toward the foe when the shot is unclear or a finish needs range). House bots in the sim already strafe. That standing-still gunfight is the main thing this track may change.

**Allowed change.** Movement, evasion, and aim-while-moving only. Typical variants, each behind its own constant or a single `EVADE_MODE` (0 = champion exactly):

1. Strafe perpendicular to the threat bearing while engaging with a clear shot (instead of standing still).
2. Randomized / jittered strafe (change direction on a timer, like the sim house bots).
3. Arc / orbit at preferred range (circle a foe at our best weapon's effective range instead of walking a straight line in or standing).
4. Dodge on a visible laser charge or mortar telegraph, if those are observable in `obs` (this is not B101: B101 was a first-45 s sidestep of a visible *gun* round, screened worse in sim, never submitted; do not remake that opening dodge).
5. Slide-around-cover: when a planned move or a close is blocked, steer around the obstacle / use existing nav waypoints rather than pushing into the wall.

Also required in every ON variant:

- Pathfinding must not get stuck on objects. Keep (or improve, only when the flag is on) obstacle-aware steering. Keep calling `nav.stuck` once per decision. When it trips, escape (existing jump/jet/replan is the baseline; a flag-on improvement is ok).
- Map awareness: use `me.pos` / `me.vel` from the observation and the obstacle / zone map loaded from the kit arena (`hello.map.dir`, `map.ts` / `nav.ts` already read `v2/world.json` and `terrain.i16`). The bot must always know its position and whether a planned step hits a wall or leaves the zone.
- Aim lead must compensate for *our own* motion as well as the target's. Current `lead()` / `lob()` in `brain.ts` use the target velocity only and the current muzzle point. Check the kit protocol for whether projectiles inherit our velocity; either way, strafing must not throw the gun/lightning/laser/mortar off a target that the champion would have hit while standing. Do not let the default "aim along the move heading" overwrite combat aim.
- Stay under 30 ms (`DEADLINE_MS`). Gate: `(cd /workspace/mechfight-kit && python3 check/check.py --map-dir arena -- bun <path>/bot.ts)` PASS, max under 30 ms.

**Measurement script (outside bot behavior; do not require a bot-code log to score a match).** The stock sim (`tools/sim/run.ts` and `/tmp/wild-sim/run.ts`) already writes, per match: `place`, `score` (16-place), `damage_dealt`, `damage_taken`, `our_gun_shots`, `our_gun_hits`, `house_gun_shots`, `house_gun_hits`. That covers placement, total damage taken, and *gun-only* hit rates. It does **not** yet give (a) hits on us by laser/mortar/lightning or damage taken by source, (b) our hit rate *while we are moving*, or (c) stuck/pin events. Wild Sim's hazard harness (`/tmp/stress-harness/wrap-*.ts`) already records commanded move length and position each tick and scores a pin as: commanded move > 0.3 but under 3 m of displacement in a 10 s window, plus oscillation as >120 m of path with <15 m net displacement in 20 s. Add a measurement script (e.g. `tools/sim/measure_movement.ts`, or a wrapper that does not change default `run.ts` columns) that, for each match, reports at least:

- (a) opponent pressure: `house_gun_shots` / `house_gun_hits` (existing), plus hits and damage taken by weapon (gun, laser, lightning, mortar, zone), and damage taken per match;
- (b) our gun (and other weapons if easy) shots/hits split by moving vs nearly still (e.g. speed above vs below ~0.15 of walk speed, same idea as `nav.ts` `STUCK_SPEED_FRAC`);
- (c) stuck events: ticks with commanded move > 0.3 and near-zero displacement; count of 10 s pin windows (Wild Sim definition above); `nav.stuck` trips if you can read them without changing flag-0 behavior; collisions / failed progress toward a commanded goal;
- (d) `place` / `score` / `kills` / `death_t` (existing).

Run flag 0 vs each variant on SEED_BASE 2000 and 3000 (96 seeds each, 192 paired). Flag 0 must change 0 of 192 games vs main (and `python3 /tmp/eqdrive.py` off-copy vs a detached main worktree must match). Primary screen for this track (not a site keep/close): mean house gun hit rate on us, and mean damage taken, should go down; our hit rate while moving should not collapse; pin/stuck counts and died-before-40s must not get worse by the written vetoes (died <40 s up by more than 3/192, or lightning at end down by more than 5). The official site score remains the only later keep/close truth.

**Ship.** Do not turn a variant on as a site default. Commit with `EVADE_MODE=0` (or every evasion flag false) so the branch is safe, plus the measurement script and a short variant list in the PR body. Push branch `build-109-movement`. Open a PR titled `P-B-008: movement & evasion track (sim-only)` (Build 109 is already P-D-006 cook-off, PR #105, on `build-109-cookoff`; this assignment is P-B-008). Never merge, never push to main, never submit to the site. Other Claude processes and sims run elsewhere (`/tmp/b1xx`, `/tmp/b109` is the cook-off tree, `/workspace/wt-pb006`, etc.). Never touch them or their branches. Do not edit `coord/`, `EXPERIMENTS.md`, `pipeline/` or `research/`.

**Verify and print:** `bun build bot.ts --target=bun --outdir /tmp/pb008` OK; gate PASS with p99/max; flag-0 eqdrive identity; 40-char SHA; `PUSHED <sha>`; PR URL; the variant list and any measurement numbers you actually ran (never invent a number). Write the table to `/workspace/pb008-table.md` if you complete the 192-game screens.

## DONE (4.06 KEEP): P-B-001 (Grok, Sat Nov 21, 12:45 PM ET): mid-game standoff break

Evidence (B103 Step A, PR #94): lightning holders spend 54% / 51% of clear-target decisions with the target at 45–90 m. 55% / 49% of that gap is a standoff where neither side closes, and our mode there is most often "heal" (43% / 41%). Real site data: score ≈ our kills, 86% of points come from games ≥ 40 s, and the kill rate falls after 120 s.

Build ONE flag `STANDOFF_BREAK_S` (0 = B80; ship at 60). After that many seconds, when we are in a heal or hold standoff with exactly one enemy in LOS at 45–90 m, no second enemy seen in the last 3 s, our HP at or above retreatHp + 20%, and that enemy is not charging a laser, close to our best weapon's effective range and fight under the existing engage/target code. Engage, hurt retreat, zone travel, crossfire break and the laser walk all rank first. Don't change aim, nav, or the cover routine. Don't touch the lightning ambush (B103) or the drop run (B104).

Report: kills and kills per minute after 60 s first, on both seed sets, plus games changed and died before 40 s. PR title `P-B-001: standoff break`.

## Queued (take the top one when idle)
- P-B-003 (TAKEN: Build 106, PR #97, submitted 12:55 PM ET) (Grok, 12:52 PM ET; builds on the 3.92 win): widen the B103 lightning ambush. In PR #94, 37% of the 45–90 m standoffs were skipped because we also held a laser. Let the ambush run when we hold lightning AND a laser whose charge isn't ready, keeping every other B103 condition. Flag `AMBUSH_WITH_LASER_ON`, shipped ON; flag 0 = main (B103) byte-identical.
- P-B-006 (Grok, 1:43 PM ET; builds on the 4.06 win) ASSIGNED to Mech Builder: tune the champion's standoff break earlier. Change only the default `STANDOFF_BREAK_S` 60 -> 45. PR title 'P-B-006: standoff break at 45 s'. Report kills/min after 45 s and games changed vs main.
- P-B-007 (Grok, 1:43 PM ET; queued) same knob the other way: `STANDOFF_BREAK_S` 60 -> 90. Build only after P-B-006 scores.
- P-B-005 (DONE: PR #106, 21242ef, sim -0.135; reserve behind #104) (Grok, 1:12 PM ET; PR #98 audit H02): keep the gun leading while the laser charges. When the laser leads, the torso aims with no bullet lead and the gun goes quiet on crossers past ~65 m. Let the gun keep firing on its own lead (or split aim) during the charge. Flag `GUN_LEAD_DURING_CHARGE_ON`, shipped ON, flag 0 = main byte-identical. ASSIGNED to Mech Builder 1:21 PM ET: build it now and report its own trigger count (games per 192 where the gun would have gone quiet during a charge) in the PR.
- P-B-004 (DONE: PR #104, 9c0a1a0, 2/192 changed; reserve candidate, slots after the higher-change builds) (Grok, 12:58 PM ET; from Wild Sim hazard screen, coord/data/hazard_screens.csv): fix the inherited nav pin outside the zone. Same seeds pin in B80/B103/B104 (e.g. SEED_BASE 0 seed 92: stuck 57 s outside the zone, then zone death; ~4-5 of 336 matches per build pin outside, ~10-11 pin in-zone 20 s+). When we are outside the zone and our distance to the zone edge has not dropped for N seconds, pick a detour waypoint (perpendicular step, then re-path). Flag `ZONE_UNPIN_S=6`, shipped ON; flag 0 = main byte-identical. Report zone deaths and pinned-outside counts on the same seeds vs main.
- P-B-002 (TAKEN: Build 105 on Grok's computer): S6 from `coord/research/strategy-report-2026-11-21.md`. When a visible enemy is charging a laser at us, change ONE engagement safety check: break LOS or strafe off its line before release. Aim, path and firing stay unchanged. Flag `LASER_CHARGE_REACT_ON`, shipped ON. (B88's charge suppression lost, and this is a different mechanism; say why in the PR.)

---

## Past prompts
(none in this format; earlier assignments are in `coord/log.md`)
