# Grok → Doug's Claude / Mech Builder: assignment inbox

**Doug 6:46 PM ET (D2):** each new idea needs its `coord/data/ideas/<id>.json` record before a build starts. Chat is only a notification.

Only Grok edits this file. Same protocol as `coord/next-diego.md`: pull main, find the current P-B-### prompt, ACK it in `coord/log.md` (`ACK P-B-### (<who>)`), report by PR with the ID in the title. The queue is never empty: when you finish, take the top "Queued" item if no new Current prompt is up.

Rules: the real site score is the only source of truth; the sim is a crash/timing/flag-0 screen. Check `coord/data/ideas.md` (once it lands) so you don't recycle dead ideas. One change per build, on its own branch. The submitted commit ships with the flag ON, and flag 0 must be byte-identical to B80 `28c3acc`. Gate with `check.py --map-dir arena` (max under 30 ms). Your PR carries the full 40-char SHA and the template table on both seed sets, and you append your rows to `coord/data/screens.csv`. Never merge, submit, or push to main.

**Read `coord/STATUS.md` first: current champion, in-flight builds, dead families.**

**CHAMPION CHANGED (Sat 2:00 PM ET): P-D-003 drop run `4d6e71b` (PR #99, on top of 4.06), site 4.10 (BB-DA9AC664), merged to main `9168d841c734ec6970340322600feb89f9c27ce6`. Bot code on main equals `4d6e71b`. Branch every new build from current main. Flag 0 must be byte-identical to this main, and a build keeps only if its site score beats 4.10. If you started from an older main (including 4.06 / `42a19d7`), rebase onto this main before you push. P-D-003 is DONE KEEP 4.10. P-D-002 forecast lost at 3.79.**

---

## CURRENT (Doug 9:38 PM ET): P46 mid-game unstuck, built by Doug's Claude (Grok, Sat Nov 21, 9:39 PM ET)
Record: `coord/data/ideas/P46.json`. Champion: P34 lethal release, code 0e6fadd, main 588557e (merge 8c130ad), site 4.38. Mech Builder no longer takes P46; its queue is P45 Step A, then P37b.
Add `ACK P46 (Doug's Claude) <time ET>` to `coord/log.md` in your first push.

**Step A first (log-only, no behavior change).** Branch `p46-unstuck-mid` off origin/main. Sim: #148 22f72a8 tools/sim with `--trees`, SEED_BASE from env, 96 seeds each on 2000, 3000, 4000, 5000. Count stretches where we moved under ~3 m in 5 s with 5-8 alive, outside a drop ring/hold, outside P29's settle, not healing and not engaged, plus deaths or zone damage within 20 s after them. Pass: 10/192 games or more on BOTH sets. On a fail, write a one-line reason in P46.json and stop.

**Build only if Step A passes.** One flag `UNSTUCK_MID_ON` in params.ts: in that state, re-path to a reachable in-zone point a short distance away. The drop run, the near-and-reachable drop gate, P29 midring settle, P34 lethal release and zone rules stay unchanged. Use our own observations only. The flag-off build must be byte-identical to main (eqdrive). Follow coord/BUILD_CHECKLIST.md with the 4 practice bases 0, 1000, 6000, 7000 trees-on (champion CSVs are already at /workspace/tester/runs/trees-0e6fadd-*.csv, so reuse them). Drop-arrival totals can't be lower on any base, and deaths under 40 s can't be higher. Stall rule applies. Archive: `git archive --format=tar <SHA> | wc -c` under 15,000,000, written in the PR body. The PR head must be the flag-ON build.

**Hand off** by opening a PR titled "P46 mid-game unstuck (UNSTUCK_MID_ON)" and messaging Grok. Sim Tester runs the full trees-on paired screen on 2000+3000 and 4000+5000; only a full pass goes to the site, and the loop submits it. Never merge, submit, click on the site, force-push or commit raw sim output.

## PAUSED (SIM-ONLY training track, not a site slot): P-B-008 (Grok, Sat Nov 21, 1:56 PM ET): movement & evasion training track

Doug, 1:52 PM ET: train movement in the local sim (strafe, slide, fluid motion) so the mech is harder to hit, keep pathfinding from getting stuck on objects, fine-tune map awareness (always know where we are), and improve evasion plus aiming while moving. **All current 4.10 champion rules stay in place** (the 4.06 stack plus `DROP_RUN_M=150`). Only movement / evasion / aim-while-moving mechanics change. This is **sim-only**: do not submit to the site, do not merge to main, do not take a practice slot. After the gate is green and the sim testers show opponent hit rate down without new stuck/pathing damage, Grok hands the winning variant to Mech Builder for a later site test on the then-current champion.

**Base.** Branch off current `origin/main`. Verify bot code is still the 4.10 champion: `git merge-base --is-ancestor 4d6e71bf3e2aa823e0c8c24dbc0e155d03f36971 HEAD` must succeed, and `git diff 4d6e71b -- bot.ts brain.ts params.ts nav.ts target.ts map.ts mechfight.ts` is empty before you start. Flag 0 must be byte-identical to that main bot code (not to B80 or to the 4.06 tree). If this track was started on 4.06, rebase onto `9168d84` first.

**Champion rules you must not change** (from current 4.10 main / EXPERIMENTS.md). Decision priorities, triggers, and thresholds stay exactly as they are. In particular, keep:

- Path-aware nav and the existing `nav.stuck` unstick (Build 3): jump / jet / replan after ~0.5 s of a commanded move with almost no speed.
- Farm (`FARM_ON`, `FARM_HUNT_ON`) and the farm distances.
- Engage / finish (`ENGAGE_ON`, `params.aggression`, `ENGAGE_FINISH_HP`) and cube claim after a kill.
- Target pick (`TARGET_PICK_ON`).
- Laser rush (`LASER_RUSH_ON`, `LASER_RUSH_S=45`, `LASER_TRIP_M=250`, `LASER_CHASE_S=20`), including lost-target re-aim and the release rule.
- No-sneak while not hurt (`NO_SNEAK_ON`).
- Crossfire break (`CROSSFIRE_ON`) and late lightning walk (`LATE_LIGHT_ON`, Build 80).
- Lightning ambush (`LIGHT_AMBUSH_ON` in `brain.ts`: lightning, no laser, seen by exactly one enemy at 45–90 m, step out of sight and wait). Do not widen it.
- Standoff break (`STANDOFF_BREAK_S=60`: after 60 s, lone 45–90 m heal/hold standoff, close to best-weapon range). Do not change the trigger or the close-to-range rule; you may only change *how* the mech moves while closing or fighting (strafe/slide/orbit), not *when* it decides to break or stand off.
- Supply-drop run (`DROP_RUN_M=150`, P-D-003, now in the 4.10 champion): called drop within 150 m, not held by another mech, zone-safe for the whole capture, HP at or above retreatHp — walk to arrive as it lands, then hold the ring. Do not change this rule or its rank.
- Rank order stays: engage, hurt retreat, zone travel, kill-claim, crossfire break, laser walk, and the lightning ambush all rank first, then the supply-drop run. Zone safety always wins. The standoff break never replaces a drop run (it only runs from heal or hold). While the champion would be walking to a drop or holding its ring, do not abandon that run; at most add evasion that still arrives on time and stays in the ring.

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
- P-B-006 (Grok, 1:43 PM ET; originally on 4.06) ASSIGNED / REBASE REQUIRED: tune the standoff break earlier. Change only the default `STANDOFF_BREAK_S` 60 -> 45, **on current 4.10 main** (`9168d84` / `4d6e71b`). The 4.06 build (PR #107, `f93ed86`) was held back and must be rebuilt or rebased onto the drop-run champion before any site test. PR title 'P-B-006: standoff break at 45 s'. Report kills/min after 45 s and games changed vs the 4.10 main.
- P-B-007 (BUILT: PR #108, `24d5b4d01f6424bdcc08a41effe762b37fd02393`, parent `9168d84` / drop-run `4d6e71b`, site 4.10; Grok, 2:01 PM ET): same knob the other way, already on the 4.10 champion. `STANDOFF_BREAK_S` 60 -> 90 in params.ts only. Branch `build-110-standoff-90`. Independent gate PASS, max 2.7 ms (p99 1.3 ms). Do not merge or submit until its slot.
- P-B-009 (BUILT: PR #109, `1fb1f4709a6317e41624c8a603e8b81d5af832aa`, parent `9168d84` / drop-run `4d6e71b`, site 4.10; Grok, 2:01 PM ET): B111 lightning ambush far-edge tweak. `AMBUSH_MAX_M` 90 -> 100 in brain.ts only. Why: house bots hold 55–95 m, so 90 misses the 90–95 m band. Branch `build-111-ambush-max`. Independent gate PASS, max 2.8 ms (p99 1.1 ms). Do not merge or submit.
- P-B-010 (BUILT: PR #110, `869da49b94c72bbe13cda584d229c5d028636a6d`, parent `9168d84` / drop-run `4d6e71b`, site 4.10; Grok, 2:01 PM ET): B112 standoff-break far-edge tweak (ambush/standoff interaction band). `STANDOFF_MAX_M` 90 -> 100 in brain.ts only. Why: the same 55–95 m hold band, for the close-in path when the lightning ambush does not run (e.g. we also hold a laser). Branch `build-112-standoff-max`. Independent gate PASS, max 3.0 ms (p99 1.1 ms). Do not merge or submit.
- P-B-011 (BUILT: PR #116, `6182d29c673d99f5186d742a5f019c0b007234f2`, parent `dc20b91` / drop-run `4d6e71b`, site 4.10; Grok, 2:27 PM ET): B113 longer drop reach. `DROP_RUN_M` 150 -> 200 in params.ts only. 150 still matches main exactly. Branch `build-113-droprun-200`. Independent gate PASS, max 4.2 ms (p99 3.2 ms). Do not merge or submit.
- P-B-012 (BUILT: PR #117, `79854a67e4e5e73b44ee888af4aee36e87064832`, parent `dc20b91` / drop-run `4d6e71b`, site 4.10; Grok, 2:27 PM ET): B114 shorter drop reach. `DROP_RUN_M` 150 -> 110 in params.ts only. 150 still matches main exactly. Branch `build-114-droprun-110`. Independent gate PASS; three reruns max 3.8 ms (p99 1.1–1.2 ms). One first parallel-run spike of 32.1 ms, 0 missed. Do not merge or submit.
- P-B-013 (BUILT: PR #118, `18c826e7c19e5de4713060f78b132a38f1dd241c`, parent `dc20b91` / drop-run `4d6e71b`, site 4.10; Grok, 2:27 PM ET): B115 drop-run arrival lead. New `DROP_RUN_LEAD_S` 5 -> 10 (the old hardcoded +5 in brain.ts). Why: more margin for nav unstick/pathing so we miss fewer captures; we hold the ring longer before landing. 5 still matches main exactly. DROP_RUN_M stays 150. Branch `build-115-droprun-lead`. Independent gate PASS, max 6.4 ms (p99 1.0 ms). Do not merge or submit.
- P-B-005 (DONE: PR #106, 21242ef, sim -0.135; reserve behind #104) (Grok, 1:12 PM ET; PR #98 audit H02): keep the gun leading while the laser charges. When the laser leads, the torso aims with no bullet lead and the gun goes quiet on crossers past ~65 m. Let the gun keep firing on its own lead (or split aim) during the charge. Flag `GUN_LEAD_DURING_CHARGE_ON`, shipped ON, flag 0 = main byte-identical. ASSIGNED to Mech Builder 1:21 PM ET: build it now and report its own trigger count (games per 192 where the gun would have gone quiet during a charge) in the PR.
- P-B-004 (DONE: PR #104, 9c0a1a0, 2/192 changed; reserve candidate, slots after the higher-change builds) (Grok, 12:58 PM ET; from Wild Sim hazard screen, coord/data/hazard_screens.csv): fix the inherited nav pin outside the zone. Same seeds pin in B80/B103/B104 (e.g. SEED_BASE 0 seed 92: stuck 57 s outside the zone, then zone death; ~4-5 of 336 matches per build pin outside, ~10-11 pin in-zone 20 s+). When we are outside the zone and our distance to the zone edge has not dropped for N seconds, pick a detour waypoint (perpendicular step, then re-path). Flag `ZONE_UNPIN_S=6`, shipped ON; flag 0 = main byte-identical. Report zone deaths and pinned-outside counts on the same seeds vs main.
- P-B-002 (TAKEN: Build 105 on Grok's computer): S6 from `coord/research/strategy-report-2026-11-21.md`. When a visible enemy is charging a laser at us, change ONE engagement safety check: break LOS or strafe off its line before release. Aim, path and firing stay unchanged. Flag `LASER_CHARGE_REACT_ON`, shipped ON. (B88's charge suppression lost, and this is a different mechanism; say why in the PR.)

---

## Past prompts
(none in this format; earlier assignments are in `coord/log.md`)

---

## Doug 8:06 PM ET: mechanics research directive

Verdict: **APPROVE WITH STIPULATIONS**. Do not begin implementation. Narrow scope only; do not reopen already-tested families.

**Stipulations**
- Research only. No champion edits, no submissions, no workflow or chart changes, no new infrastructure, no protocol bypass, no countdown manipulation, and no use of `hello.seed` as a match seed (it is per-slot only).
- New ideas enter as `coord/data/ideas/<id>.json` records under D2 before any build starts.
- No Mech Wild Sim batch without Doug's yes.
- Single-change builds go through the normal full paired screen. Only a fully passing build may go to the site.
- This work competes for the 4 Claude sessions after P33, P34, P35, and the research run already in flight.
- Do not redo covered families: drop/zone/cover, opening laser and first-fight (PR #145), P30 front-arc facing (retired), P26/P26b healthy boost, B5b heal-and-fire, B125's six-tactic pack (site 3.5, includes TAC_JET_LOOT). P35 unseen-target is already building.
- Tree/canopy tactics cannot be screened in the current sim (trees are ignored: they block neither sight nor shots). Do not add tree support to the sim, and do not send a tree build to the site, without Doug's yes.

**In scope if later assigned (research first, then one idea record each)**
1. Tree/canopy vision and blind fire at a sound (protocol: trees block sight, not shots). Blocked on the sim until Doug says otherwise.
2. Planned jet/roof routes to rooftop loot. Champion nav is ground-only; jump/jet is only the stuck escape. Isolate this from the retired B125 pack.

**Doug 8:16-8:17 PM ET:** record the rooftop jet route as P40 and build it after P38. Doug approved adding trees to the sim ("ok also add trees to the simulations"). The tree work goes to Diego's Claude as P-D-014. The tree sim is adopted for screens only after it's validated and the champion baseline is re-run on it; until then, screens stay on the current sim.

**UPDATE 9:17 PM ET: P34 is the new champion, site 4.38 (BB-ABEB42BF, code 0e6fadd), merged to main 8c130ad.** Branch every new build from current origin/main. Flag 0 must be byte-identical to this main, and a keep needs a site score strictly above 4.38. All queued builds (P34b, P38, P40, P37b) must be rebuilt on the new champion main, handed off on fresh branches, with the 4-base trees-on checklist (bases 0, 1000, 6000, 7000) and archive size in the PR body (`git archive --format=tar HEAD | wc -c` under 15,000,000). Old approvals expire. P34b is P34 plus one drop gate, so on the new main it should be only the drop-gate diff (LETHAL_RELEASE_ON is already true).
