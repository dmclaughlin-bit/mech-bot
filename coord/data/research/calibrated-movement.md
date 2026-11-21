# Calibrated movement research, plus an engage-count × HP policy idea

Research only. Written Saturday 21 November 2026, 2:47 PM ET. Nothing in this note is an implementation, a site candidate, or a queue instruction. Doug asked (2:39–2:40 PM ET) for movement and strafing that is randomly calibrated, not pure randomness, and for research before building, from the sims and from what the Watcher has collected. At 2:42 PM ET he also asked that we consider health versus how many opponents we are engaged with or near, explore the options, and keep that as a sim idea, not an implementation.

Numbers below are taken from the listed files, from the kit, or from arithmetic on those kit numbers. None are invented. Other invited teams are not named.

The site score is the only truth. The sim is a screen. At the time of writing, `origin/main` is `cb3c47c` (site champion 4.17, B113, `DROP_RUN_M=200`). The movement screens and the 384-game death tables were run on the previous 4.10 champion `4d6e71bf3e2aa823e0c8c24dbc0e155d03f36971` (`DROP_RUN_M=150`), which is also the base of PR #115. B113's only code change was the drop-run distance, so the retreat, TTK, finish, crossfire, ambush and standoff rules described here are the same rules.

## Sources mined

### Sim and track

- `/workspace/pb008-table.md` and PR #115 body (head `c23c739`, 0 review comments). Iteration 1: modes 0–6, 192 games, SEED_BASE 2000+3000. Held-out 4000+5000 were not run. Flag 0: 0 of 192 games changed vs main; `eqdrive.py` identical to detached `origin/main` at that time.
- Raw iteration-1 CSVs: `/tmp/pb008-out/{off,main,v1–v6}-{2000,3000}.csv`.
- Iteration 2 (still running when this was started; `/tmp/b109-iter2-claude.log` was empty). Partial and then completed 192-game screens in `/tmp/pb008i2/out/` for flag 0 and modes 7, 8 and 11, with `AIM_MUZZLE_ON=0` (movement isolated from the muzzle-aim correction). Modes 9, 10, 12, 13 and 14 are defined in `params.ts` on `/workspace/wt-b109-movement` but had no 192-game table yet. Mode comments in that file describe the timers.
- Refine run (still running; `/tmp/b109b-refine-claude.log` was empty). Worktree `/workspace/wt-b109b`, modes 20–25 (mode 6 plus pathing, laser-cover, aim, retreat-cover, gun-gate refinements). Only short diagnostic CSVs in `/tmp/pb008b/out/` (not a 192-game screen). Not used as a pass/fail result.
- Champion death-context CSVs: `/workspace/tester/runs/4d6e71b-{2000,3000,4000,5000}.csv` (96 seeds each, 384 games). Columns include `attackers_5s`, `fight_hp`, `dmg_5s`, `sees_us`, `killer_dist`, `killer_weapon`. Definitions in `tools/sim/run.ts`: `fight_hp` is our HP at the start of the last fight (a new fight starts when we take non-zone damage after a gap of more than 5 s); `attackers_5s` is the number of distinct damagers in the last 5 s of the match (usually the last 5 s before death). The 3000 late-check and flag-0 2000 copies were not double-counted.
- `tools/sim/ASSUMPTIONS.md` (PR #115 tree and the same text on later trees): house aim is "Perfect linear lead plus a Gaussian error held for 0.4 s" (`AIM_RESAMPLE_S = 0.4` in `tune.ts`). House strafe itself flips every 1.2 to 3 s. Tier aim error σ: easy 11.5°, medium 8°, hard 6°, expert 4.3°.
- `tools/sim/measure_movement.ts` outputs, including `attackers_at_death` (house bots that hit us in the last 3 s before death).
- `/workspace/claude-pb008-iter2.txt` and `/workspace/claude-pb008-refine.txt` (the prompts, not results).
- A short one-dimensional toy Monte Carlo (`/tmp/pb008i2/mc.py` logic, T = 800 s, mech radius 2.5 m from the kit). This is not a full-sim result; it is cited only as a directional check.

### Watcher

- `/workspace/watch/findings.md` (refreshed corpus: 150 unique matches, 86 complete showdown, 58 complete public, 6 incomplete). Aggregate tables use the 86 complete showdowns only. Public house+human matches are kept separate and were the calibration source for the sim's house aim.
- `/workspace/watch/research-doug-0040/q2.out` (first-engagement outcomes in showdowns).
- `/workspace/watch/index/games_raw.csv`, `matches.csv`, `recordings.csv`; `/workspace/watch/pipeline/summary.json` (151 matches listed there, 144 complete, 86 showdown complete, generated 2:30 PM ET).
- `/workspace/watch/ladder.md`, `/workspace/watch/README.md`.
- Live-stream recorder output: 61 session directories `/workspace/watch/stream/1121-*` (latest `1121-1938`), each with `live.jsonl` and `state.jsonl`; plus `/workspace/watch/recordings/` (10 jsonl files from earlier in the night) and `/workspace/live.jsonl`, `/workspace/live2.jsonl`. No `.mp4`, `.webm` or `.mkv` was found under `/workspace/watch`. The text findings and CSVs are the extracted use of those streams. This research did not re-parse the raw jsonl for a new lead-vs-mover study.

### Kit

- `/workspace/mechfight-kit/protocol.md` and `hello.config` from the first line of `/workspace/mechfight-kit/check/stream.jsonl.gz`: gun speed 252 m/s, range 230 m, spread 0.6°; laser hitscan, charge 0.75 s, min charge 0.15 s, hold 2 s, range 280 m, half move speed while charging, telegraph visible; mortar speed 72 m/s, gravity 22 m/s², max range ≈ v²/g ≈ 235.6 m, splash radius 7 m; lightning instant, range 45 m, cone 30°; NPC bullets 90 m/s. Mech: walk 11.7 m/s, boost 19.5 m/s, ground accel 58.5 m/s², air accel 12, turn rate 4 rad/s, radius 2.5 m, start HP 1400.

### Champion rules (read, not changed)

- `params.ts` and `brain.ts` at `4d6e71b`: `retreatHp` 0.30, `aggression` 1.5, `ENGAGE_ON`, `ENGAGE_FINISH_HP` 0.35, `CROSSFIRE_ON` true, `LIGHT_AMBUSH_ON` true, `STANDOFF_BREAK_S` 60, `hideSpot`, `enemyDps`, TTK / TTD.

## 1. Flight times, and the window where a direction flip beats a lead

Gun bullets fly straight at 252 m/s. Flight time is distance / 252:

| Range (m) | Flight (s) | Why that range |
| --- | ---: | --- |
| 45 | 0.179 | near bucket in the movement screen; lightning range |
| 50–68 | 0.198–0.270 | Watcher / ASSUMPTIONS: median distance of house gun hits on mechs is 50 to 68 m |
| 55 | 0.218 | sim expert preferred range |
| 65–85 | 0.258–0.337 | sim hard / easy preferred range |
| 90 | 0.357 | mid/far split in the movement screen |
| 95–108 | 0.377–0.429 | ASSUMPTIONS: 90th percentile of house gun hits, 95 to 108 m |
| 140 | 0.556 | sim house `gunOpenM` |
| 230 | 0.913 | kit gun range |

Laser is hitscan: flight time is 0. The dodge window is the charge telegraph (min 0.15 s, full 0.75 s, then up to 2 s more before it auto-fires), during which the charger is visible as `charging: true` and moves at half speed. Mode 4 already steps out of a laser aimed at us.

Lightning is instant inside 45 m and a 30° cone. There is no in-flight dodge; the answer is not to be in the cone, or to break line of sight.

Mortar shells: speed 72 m/s, gravity 22 m/s². On flat ground at the same height, using the protocol's own v²/g max-range formula (235.6 m at 45°), low-arc flight times are: 25 m 0.35 s, 50 m 0.70 s, 75 m 1.06 s, 100 m 1.42 s, 140 m 2.05 s, 180 m 2.76 s (the sim house fires the low arc between 25 and 180 m). The high arc at those ranges is about 5.7 to 6.5 s. Real landings also depend on muzzle height (tube at `pos.z + 9.5`) and terrain; those figures are the same-height calculation. Mode 4 already walks away from a visible shell whose landing is inside splash range. A short strafe timer is the wrong tool for a mortar.

NPC bullets: 90 m/s, so 30 m is 0.33 s and 45 m is 0.50 s. Drones in the sim aim without lead.

Time to actually change our velocity, from kit accel 58.5 m/s²: stop from walk 0.20 s, full reverse from walk 0.40 s, stop from boost 0.33 s. A 90° torso turn at 4 rad/s is 0.39 s. A flip interval shorter than about 0.20 s does not finish the speed change; iteration 1 already noted that mode 2's reversals pass through zero speed with a move still commanded, and mode 2 had the most stuck decisions (11,660 vs 7,896 for the champion).

The sim's house aim holds a linear lead, plus a Gaussian error, for 0.4 s. A constant-velocity strafe is what that lead is built for. A direction or speed change beats that lead only if it happens while the round is in the air, or inside that 0.4 s hold. Iteration 1's jitter of 0.5 to 1.4 s is longer than a typical gun flight (0.20 to 0.43 s at 50–108 m) and longer than the hold, so most rounds still see a nearly constant velocity. That is the "too slow" point in the iteration-2 prompt, and it is consistent with the kit numbers.

Mode 7's already-written timer (not a recommendation to ship) is: `(distance / 252 + 0.1 s) × Uniform(0.7, 1.5)`, clamped to [0.15, 0.4] s. At 55 m that clamp leaves about 0.22–0.40 s; at 100 m about 0.35–0.40 s; at 140 m and beyond the clamp is stuck at 0.40 s. The 0.15 s floor is tighter than a full stop (0.20 s). The 0.40 s cap matches both a full reverse and the aim-hold.

## 2. What the sim shows, mode by mode

Primary screen (stated in PR #115 and `/workspace/pb008-table.md`): house gun hit rate on us down, and damage taken down, both beyond one standard error. Vetoes used in that table: died before 40 s up by more than 3; lightning at end down by more than 5; pin windows rising (iteration 2 prompt). Flag 0 must stay identical to the champion.

### Iteration 1 (modes 0–6, 192 games, muzzle-aim correction on in every mode above 0)

House gun hit rate on us (pooled) and damage taken per game:

| Mode | Hit rate on us | Damage taken | Paired Δ damage ± SE | nav.stuck trips | Pin windows | Our gun overall / moving | Sim Δ score ± SE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 champion | 0.182 | 1853 | — | 3667 | 130 | 0.825 / 0.770 | — |
| 1 strafe | 0.186 | 1856 | +3 ± 44 | 3794 | 162 | 0.816 / 0.835 | −0.083 ± 0.207 |
| 2 jitter 0.5–1.4 s | 0.180 | 1847 | −6 ± 37 | 4822 | 180 | 0.822 / 0.834 | −0.109 ± 0.181 |
| 3 orbit | 0.183 | 1852 | −1 ± 46 | 3740 | 135 | 0.822 / 0.834 | +0.125 ± 0.204 |
| 4 telegraph dodge | 0.182 | 1847 | −6 ± 31 | 3730 | 90 | 0.817 / 0.771 | +0.031 ± 0.164 |
| 5 slide | 0.176 | 1851 | −2 ± 38 | 3080 | 170 | 0.819 / 0.763 | +0.286 ± 0.141 |
| 6 all (jittered orbit + dodge + slide) | 0.180 | 1823 | −30 ± 40 | 1758 | 112 | 0.833 / 0.842 | +0.505 ± 0.201 |

No mode passed the primary screen. The hit rate on us moved by at most 0.006, and damage by at most 30 of 1853, all inside one standard error. Mode 6 was the best sim-score and pathing result (stuck trips roughly halved, 3667 to 1758; collision ticks 11,229 to 5,985; damage dealt 6637 to 7538). Mode 2, the only pure random timer, did not lower hit rate in any useful way and had the most stuck decisions. Mode 5 had the lowest hit rate (0.176) but that is 0.006, inside noise, and it is a slide-around-cover change, not jitter. Mode 3 vetoed on lightning at end (50 vs 57). Mode 1 raised 2+ attackers at death (119 vs 97).

The PR body warns that modes 4 and 5 changed 165 to 169 games even though their own moves are rare, because the muzzle-position aim correction ran in every mode above 0. Iteration 2 split that into `AIM_MUZZLE_ON`.

### Iteration 2 (modes 7, 8, 11 vs their own flag 0, 192 games, `AIM_MUZZLE_ON=0`)

Flag 0 in this later measure script: hit rate 0.183, damage 1855, score 3.484 (very close to iteration 1's 0.182 / 1853 / 3.474; not mixed with iteration 1 when judging deltas).

| Mode | Hit rate (Δ ± SE) | Damage taken (paired Δ ± SE) | nav.stuck | Pin windows (games, longest s) | Stuck decisions | Died < 40 s | 2+ atk at death | Sim Δ score ± SE |
| --- | --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| f0 | 0.183 | 1855 | 3667 | 130 (18, 32) | 7909 | 56 | 98 | — |
| 7 fast flight-time jitter | 0.173 (−0.009 ± 0.005) | 1873 (+18 ± 44) | 3314 | 204 (35, 60) | 14551 | 52 | 104 | −0.078 ± 0.197 |
| 8 stop-and-go, same timer | 0.187 (+0.004 ± 0.005) | 1841 (−14 ± 45) | 3107 | 146 (19, 40) | 10979 | 61 | 115 | −0.255 ± 0.209 |
| 11 kite at 120 m on mode 6 | 0.179 (−0.003 ± 0.005) | 1890 (+35 ± 44); damage per min −127 ± 42 | 2403 | 212 (16, 89) | 7875 | 44 | 98 | +0.510 ± 0.188 |

Mode 7 is the first full-sim result with a hit-rate dip that is about 1.8 SE, but it does not pass the screen: damage taken is not down, pin windows rise (130 to 204, longest 32 s to 60 s), and stuck decisions nearly double (7,909 to 14,551). House gun hit rate on us at 45–90 m is 0.214 vs 0.225, and under 45 m 0.463 vs 0.472; far shots are unchanged (0.077 vs 0.078). Our own overall aim stays at 0.821 vs 0.824.

Mode 8 (stop-and-go) does not work on this screen: hit rate is up, sim score is down, deaths before 40 s are 61 vs 56 (the "up by more than 3" veto), and 2+ attackers at death are 115 vs 98.

Mode 11 matches mode 6's sim-score band (+0.510 ± 0.188, alive 87.1 s vs 77.9 s) and does not clearly lower hit rate. Pin windows rise (212, longest 89 s). Damage per minute is down because we live longer, not because we take less per game.

By our motion, flag 0 is already slightly harder to hit while we are moving than while still (0.174 vs 0.187), and easier to hit in the air (0.217). Under 45 m the house still hits 0.472 of gun rounds even when we can jitter. That is the range where flight time is shorter than a full reverse.

A short 1D toy Monte Carlo (linear target, perfect lead, 0.4 s error hold, kit accel; not the full sim) showed only a small mid-range dip for flight-timed flips versus standing still, in the same "about 0.01" neighbourhood as mode 7. It is not a basis for a new number, only a consistency check that timing alone is not a large effect.

## 3. What the Watcher and stream evidence says about real enemy aim

Direct measurement of "does this shooter lead, and by how much?" was not in the extracted Watcher tables. The raw `live.jsonl` / `state.jsonl` sessions are on disk (61 stream directories, 10 earlier recording files, no video). This note does not invent a lead study from them. What is already extracted:

From `tools/sim/ASSUMPTIONS.md`, calibrated on 9 complete public matches in `/workspace/watch` (house bots in a free-for-all, not the 15-bot practice hunting squad):

- House gun hits on mechs, per shot not spent on a drone or crate: 0.50 to 0.56 for the tighter public house groups, 0.20 to 0.21 for the looser group. Those numbers anchored the sim's aim-error σ.
- Distance of those hits: median 50 to 68 m, 90th percentile 95 to 108 m.
- After the last tune, the sim's aim error was widened by about 1.3× relative to what those recordings suggested for the best house bots, as a level fit, not as a measurement.
- Known gap, quoted: in the sim our gun hits about 80% of its shots, "because house bots strafe predictably and never jump." In the public recordings the human-slot bots hit 23%. Our real practice hit rate is unknown.
- Not calibrated, because nothing in those recordings measures it: how house bots dodge, whether they retreat, and how they find us.

So: real house bots in public matches miss a large share of gun shots on mechs (roughly half even for the tighter groups). The sim assumes they lead perfectly and then smear the aim. That is a model, and it was loosened to fit average practice scores, not proven shot-by-shot. Site bots may aim differently. PR #115 and the iteration-2 prompt already say only the site decides.

From showdown exhibitions in `/workspace/watch/findings.md` (86 complete matches; these are invited free-for-alls, not practice vs the house squad):

- Winners land 32% of gun-on-mech hits past 100 m (1197/4104 hits, mean range 88 m). Top-4: 29%, mean 84 m. Bottom half: 33%, mean 87 m. People do hit moving-or-not targets at ranges where gun flight is ~0.4 s.
- Winners spend 32.2% of sampled time holding (speed ≤ 2 m/s) vs 15.3% for the bottom half; of winners' hold time, 68.5% is next to a building, 85.9% has a building blocking line of sight to the nearest enemy, and 4.8% is in the open. Overall time near a building: winners 57.4% vs bottom 36.8%. LOS blocked to the nearest enemy: 77.8% vs 42.5%.
- Winners keep space (mean nearest enemy 139 m vs 111 m) and land 50% of mech hits on targets already under 50% HP vs 25% for the bottom half.
- Low-HP row in the same aggregate table: winners' low-HP speed 7.35 m/s vs bottom 9.70, nearest enemy 122 m vs 82 m, heal-frame share 28.3% vs 4.0%, boost 19.4% vs 40.5%. Direction: at low HP the winners slow down, stay farther, and heal, rather than sprint next to enemies.
- 318/688 bottom-half mechs died by 30 s; 0 winners and 0 other top-4 did. Winner boost share 10% vs bottom 19%.
- Laser is the main damage engine for winners (mean laser damage share 53%). The findings' later note that dodge versus charging lasers stays in the qualifying order is about that telegraph, not about gun jitter.

From `/workspace/watch/research-doug-0040/q2.out`, first engagements in showdowns, pooled by outcome:

- Someone else was also hitting me: 14% of KILL, 6% of AHEAD, 6% of BEHIND, **46% of DIED** (n = 58 / 53 / 54 / 57). Multi-attacker first fights are where first engagements die.
- Someone else was also hitting the opponent: 40% of KILL vs 16% of DIED (third-party or a finish on a target already in a fight). The findings mark third-partying as mixed and as weak evidence for practice, because the practice house squad does not fight each other.
- Opponent holds a laser in 44% of DIED first fights vs 24% of KILL. DIED boost share 0.36 vs 0.26 (KILL) and 0.19 (AHEAD).
- Lateral speed vs the opponent is similar across outcomes (about 6.0 to 6.3 m/s). That does not, by itself, say whether aim leads or misses movers.

Does the sim's aim model match the streams? Partially, and only at the level of average hit rate and preferred range. It was not validated as "they hold a linear lead for 0.4 s." Fast, flight-timed jitter is an exploit of that model. If site bots do not lead, or re-aim every tick, or do not hold the error, the gain will shrink. If they lead better than the loosened σ, the gain could be larger. Only a site test after a sim pass can say.

## 4. Recommended calibrated-randomness spec (not implemented)

This is a research recommendation for a later sim experiment, not a build.

**Interval.** Do not use a fixed 0.5–1.4 s coin flip (mode 2). Draw the next change from a range- and weapon-scaled window, then add randomness inside that window:

- Against a gun (or when the threat weapon is unknown and the range is in gun reach): `T = (d / 252 + 0.1) × Uniform(0.8, 1.4)`, then clamp to **[0.20, 0.40] s**. The 0.20 s floor is the kit time to stop from walk, so a change can actually finish; mode 7's 0.15 s floor is a bit tighter than the physics. The 0.40 s cap is a full reverse and the sim's aim-hold. At long range the clamp spends most of its time at 0.40 s, which is still inside a 140 m flight (0.56 s).
- Against a charging laser: ignore the gun timer; step off the beam line or to `hideSpot` (mode 4). The telegraph is 0.15–0.75 s, not a flight time.
- Against a mortar shell in view that will splash us: walk off the landing point (mode 4). Do not jitter in place.
- Against lightning inside ~45 m: break line of sight or leave the cone; do not rely on jitter.
- If several threats, time against the nearest one that can currently hit us with a projectile or a charge.

**Direction bias, not a coin flip.** When the timer fires, choose among wall-, zone- and shot-checked headings, in order: (1) perpendicular to the shooter (existing mode 1), (2) the side that moves toward cover or a `hideSpot`, (3) the side that increases clearance from walls and the zone edge. Never reverse into a blocked cell, out of the circle we keep to, or through zero speed on a timer shorter than 0.20 s. A tie keeps the last heading (mode 13's idea: do not walk into a round that is already missing).

**Stop-and-go.** Mode 8, using the same flight-time timer, failed the 192-game screen (hit rate up, early-death veto, more 2+ deaths, sim score −0.255 ± 0.209). Do not use stop-and-go as the default. A later test could try a rarer pause (for example only when a laser is charging off-line, or only to take a still shot) but that is a new experiment.

**When to stay still to aim.** Keep the champion's stand-still when: no threat is aiming or charging at us; we are taking a laser shot (the beam has no spread and the champion already holds until the torso is in the outline); we are in a drop-run capture ring; we are healing out of sight. The iteration-1 table shows our still gun hit rate is higher than our moving one on the champion (0.868 vs 0.770). Strafe only in a standing gunfight, the same situations mode 1 already names (engage with a clear shot and not closing, or heal/hold with a clear line to an enemy within 160 m, or one that hit us in the last 2 s, or one charging a laser).

**Champion rules stay first.** Drop run, hurt retreat, zone travel and zone escape, standoff break, lightning ambush, crossfire break, finish and TTK engages must still win the rank. Evasion only replaces a stand-still, bends a close the champion is already walking, or slides a blocked straight-line move (the PR #115 contract). No trigger, threshold or rank change in the movement flag. Flag 0 remains byte-identical to the champion.

**Pairing.** If this timer is tested, test it on top of mode 6's slide and telegraph dodge (that is mode 9 in the iteration-2 list, not yet screened), not as a bare strafe. Mode 7 alone raised pins and stuck decisions. Mode 6 is what actually cleaned pathing. Do not ship a site default above 0 until the screen below passes.

**Confidence.** Medium as a description of how to beat the *sim's* lead model and as a better idea than pure 0.5–1.4 s randomness. Low as a prediction of a site gain. Mode 7's hit-rate dip is real-looking but it failed damage, pin and stuck tests.

**Top risks.**

1. The sim house lead + 0.4 s hold may not be how site bots aim (ASSUMPTIONS says this; the Watcher has no shot-level lead study).
2. Fast reversals raise stuck and pin counts (mode 2 and mode 7).
3. Under 45 m, flight time is shorter than a reverse; jitter will not save a close-range gunfight (house hit rate ~0.47 there).
4. Iteration 1's mode 6 score gain came with almost no hit-rate change; slide, orbit and the muzzle-aim correction can look like a movement win.
5. Overfitting the 0.20–0.40 s clamp to the sim's hold.
6. Breaking drop-run, retreat, ambush, standoff or zone if the flag is wired sloppily.

## 5. Minimal sim test plan for calibrated movement

Still research / later work. Do not start a site build from this note.

- **Modes, one change at a time, `AIM_MUZZLE_ON` off unless that flag is the thing under test.** Flag 0 (identity). A "calibrated jitter + mode 6 slide/dodge" candidate (iteration-2 mode 9, or the spec in §4 if it differs). Optionally mode 7 and mode 13 (barrel dodge) as references. Do not treat mode 8 as a contender unless the early-death problem is specifically being re-tested. If iteration 2 finishes modes 9–14 or the refine run finishes a 192-game screen first, read those tables before starting another variant.
- **Seeds.** 192 games, SEED_BASE 2000 and 3000, 96 each, paired against flag 0. Then held-out 4000 and 5000 (not yet run for this track). Same `measure_movement.ts` columns.
- **Metrics.** Primary: house gun hit rate on us (pooled and by still / moving / air and by <45 / 45–90 / >90 m), damage taken per game and per minute, paired Δ ± SE. Pathing: nav.stuck trips, stuck decisions, pin windows (count, games, longest), collision ticks, failed-progress, quiet oscillations. Our aim: overall and moving gun hit rate, damage dealt. Vetoes: died before 40 s up by more than 3; lightning at end down by more than 5; pin windows rising; 2+ attackers at death rising sharply. Timing: `check.py` max under 30 ms, no missed answers.
- **Pass bar.** Hit rate on us down and damage taken down, both beyond 1 SE on the 192, and no pathing veto, and flag 0 identical (every column equal except wall-clock, and a byte-level flag-0 identity check vs current champion main). Then, and only then, confirm on held-out 4000+5000 with the same bar. The sim still does not decide a site keep.

## 6. Engage-count × HP decision policy (Doug, 2:42 PM ET) — ideas only, not to implement

Doug's examples: 1v1 and low HP, evade; 2v1 and we are reasonably outmatched, evade even with substantial HP, because the goal is to stay alive; 3v1, evade constantly while re-evaluating, and if we can get out alive by killing the weakest first (and so on), do it while evading. Also considered below: third-party waiting, breaking line of sight to make a 1v1, the zone edge, finishing a low-HP enemy, retreat toward cover versus away from the crowd.

### What the champion already does

These are the rules at `4d6e71b` (unchanged in spirit by B113's drop-run distance):

- **Hurt retreat.** If we were hit in the last 2 s and HP is below 30% of max, walk to the nearest in-zone `hideSpot` that no current threat can see. Zone travel and zone escape always rank first.
- **TTK override (1v1 only).** If that retreat would fire, and exactly one enemy threatens us (line of sight or hit us in the last 2 s), and it is alone, keep fighting while `ttk < 1.5 × ttd`. `ttk` is that enemy's HP over our reaching DPS (hit-rate guess 0.8/0.5 for gun inside/beyond 60 m, 0.9 for laser and lightning, times our cube bonus). `ttd` is our HP over the summed `enemyDps` of every enemy with line of sight. `aggression` 1.5 means we will stay in a 1v1 we are estimated to lose by up to 50%. This is the main point of tension with "1v1 and low HP, evade."
- **Finish rule (1v1 only).** If HP ≥ 35% of max, no second enemy sees us or is hitting us, the target is within one magazine of a weapon we hold, and `ttk < ttd` (no 1.5×), commit and close, then claim cubes if nobody sees us.
- **Crossfire break (2+ with line of sight).** With `CROSSFIRE_ON`, if two or more enemies have line of sight to us, walk to cover that breaks those lines instead of standing still and trading. This already ranks above heal/hold and the standoff break, and below zone, hurt retreat, and the early laser trip. The comment in `brain.ts` says a 2-on-1 stand-and-shoot is a fight we cannot finish against a squad that shares vision. The move does not test "are we outmatched?"; it fires on the count of lines of sight. Finish and TTK already require `alone()`.
- **Lightning ambush and standoff break** also require exactly one enemy in view (ambush: step out of sight with `hideSpot` and reappear in lightning range; standoff: after 60 s, HP at least 0.30 + 0.20 of max, one enemy at 45–90 m, close to our best weapon's range).
- **Target pick** already prefers a short TTK, low HP, weak weapons, and an alone target, and keeps firing while we move. There is no "kill the weakest while evading a 3v1" exception to `alone()` for a committed close.
- **`hideSpot`** picks the nearest in-zone point that none of the listed threats can see, and that is not closer to a threat than we are now. Retreat, crossfire, ambush, laser dodge and hurt healing all use it.
- **`enemyDps` / TTD already sums every LOS shooter**, but that sum is only applied in the 1v1 TTK and finish tests. In a 2v1 or 3v1 the champion does not compare "time to kill the weakest" against "time for the pack to kill us" before deciding to flee.

What the champion does *not* do: evade a low-HP 1v1 when the (optimistic) TTK rule says stay; evade a high-HP 2v1 on a matchup test (it breaks LOS whenever 2+ see us, even if we could win); keep evading in a 3v1 while deliberately finishing the weakest; wait for two house bots to fight each other (they do not, in practice).

### Sim evidence (384 games on `4d6e71b`, seeds 2000/3000/4000/5000)

These are end-of-match snapshots, not a survival curve from the moment a 2v1 starts. Almost every game dies (10 survived, 5 of the rest died to the zone with 0 attackers in the last 5 s). "Death rate given `attackers_5s` ≥ 1" is therefore ~1 and is not informative. What is informative is how deaths are distributed, how early they are, and the score and kills that go with them. `fight_hp` is HP at the start of the last fight, not HP at the moment of death.

| Attackers in last 5 s | Games | Died | Median death t (s) | Died before 40 s | Mean score | Mean kills | Mean `dmg_5s` | Median killer dist (m) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 13 | 5 (all zone) | 258.7 | 0 | 11.23 | 10.00 | 0 | — |
| 1 | 112 | 110 | 54.6 | 25 (22.3%) | 3.84 | 3.69 | 373 | 65.6 |
| 2 | 134 | 134 | 48.7 | 50 (37.3%) | 3.04 | 2.96 | 539 | 69.4 |
| 3+ | 125 | 125 | 88.4 | 35 (28.0%) | 3.37 | 3.10 | 911 | 56.3 |

Dying in a 2-attacker last fight is the largest bucket (134/384), happens earlier, and has the worst mean score. Dying in a 3+ last fight happens later (median 88.4 s, when the sim has added hunters) and closer (median 56.3 m), with much more damage in the last 5 s (mean 911 vs 373 in a 1v1). In 1-attacker deaths, a mean of 2.06 house bots still *see* us at the end: more watchers than recent damagers, which is what shared vision looks like.

Cross of `attackers_5s` with `fight_hp` (HP at the start of that last fight):

| Last fight | `fight_hp` < 420 (~< 0.30 of 1400) | 420–699 | 700–1049 | ≥ 1050 |
| --- | --- | --- | --- | --- |
| 1 attacker | n=47, early 6.4%, score 4.62, kills 4.40 | n=11, early 9.1%, score 3.64 | n=12, early 8.3%, score 3.50 | n=42, early **47.6%**, score 3.12, kills 2.98 |
| 2 attackers | n=21, early 9.5%, score 4.33, kills 4.14 | n=19, early 21.1%, score 2.89 | n=19, early 21.1%, score 3.74 | n=75, early **53.3%**, score **2.53**, kills 2.48 |
| 3+ attackers | n=4, early 25%, score 7.25, kills 7.00 | n=8, early 12.5%, score 4.62 | n=22, early 18.2%, score 4.09 | n=91, early 31.9%, score 2.91, kills 2.62 |

The ugly cell is a last fight that *started* at high HP against two (or more) attackers: 75 games of 2-attacker / high-HP entries, 40 of them dead before 40 s, mean score 2.53. That is "we took a 2v1 at substantial HP and died fast," which is exactly Doug's 2v1 concern. Low-HP last fights, including 1v1 under 420 HP, have better mean score and far fewer early deaths, which is consistent with having already lived long enough to be worn down (and with the TTK rule sometimes winning a late 1v1). Absolute HP buckets are a proxy: max HP grows with cubes, and this CSV has no `max_hp` column, so 1050 is "high relative to the 1400 spawn," not a strict fraction of current max.

Killer weapon mix does not shift much by attacker count (gun is always the most common). Movement-track `attackers_at_death` (last 3 s, 192 games) agrees that about half of deaths are already 2+: flag 0 had 97–98 such deaths; mode 1 had 119; mode 6 had 107; mode 8 had a worse rate on the 2000+3000 table (115).

### Watcher evidence (showdowns, not the practice squad)

The first-engagement table is the cleanest extracted multi-attacker result: 46% of first fights that end in our death had a second party hitting us, versus 14% of first fights we won. Dying first fights also face a laser more often (44% vs 24%) and boost more (0.36 vs 0.26). Winners in the aggregate tables keep space, hold behind cover, finish targets already under 50% HP, and at low HP slow down and stay farther rather than sprinting. That supports "evade and break LOS when outnumbered or hurt," and "if you take a shot, take it at a weak target."

It does **not** support waiting for two practice house bots to damage each other. The practice squad shares vision, never fights each other, and hunts the weakest first. The findings already mark third-partying as mixed and as the wrong setting for practice. Breaking line of sight is still useful in practice: they may know where we are, but gun, laser and mortar still need a line. Hiding from one bot's eyes does not hide us from the squad's knowledge (Build 19 / `NO_SNEAK_ON` already took that point).

### Other options explored (still not implemented)

- **Third-party waiting.** Useful in exhibitions when someone else is already hitting the target (40% of KILL first fights). In practice, house bots will not pre-damage each other. Skip as a practice policy; keep target-pick's preference for a low-HP or weak-weapon target when one happens to be hurt (for example after our own shots).
- **Break LOS to turn a 2v1 into a 1v1.** This is already the crossfire break. Worth keeping. A possible tightening: after the lines break, only re-engage the isolated or weakest one under the finish / TTK tests, and keep evading if a second line opens. Do not walk back into the crowd.
- **Zone edge as a wall.** Zone escape already ranks first, and winners spend ~0% of life outside the circle. Do not evade out of the zone. Using the edge as a backstop so hunters approach from one side is an idea, but it is easy to pin ourselves; it would need its own screen and a veto on zone deaths and time outside.
- **Kill-steal / finish the weakest while evading.** In practice this means "the hunter we have already softened," not a third-party steal. Allow *shots* at a target within one magazine while we are already walking to cover, if `ttk_weakest` is well under `ttd` against the whole pack. Do not *commit a close* (the finish-rule walk-in) unless `alone()` is true again. The 3v1 high-HP early-death cell says a committed stand in a pack is costly.
- **Retreat toward cover versus away from the crowd.** `hideSpot` already rejects a point closer to a threat than we are now, but it does not explicitly steer away from the centroid of the pack or toward a building edge. A refinement (the refine track's "retreat cover" idea is in this family) would prefer a heading that increases distance from the second and third attackers and ends at cover, even if a slightly nearer LOS-break tile sits between them.
- **Re-evaluate every decision in a 3v1.** Count current LOS, who is charging, who is weakest, our HP fraction, and whether a hide path is open. Default is keep evading. Switch to a 1v1 finish only when the pack has been reduced or lines are broken.

### Recommended policy table (a later sim experiment, not a patch)

Let `n` be the number of threats (LOS or hit in the last 2 s). Let `ttd_pack` use the existing summed `enemyDps` over those with LOS. Let `ttk_weak` be TTK against the current target-pick (weakest / best kill value). "Evade" means walk to a wall- and zone-checked `hideSpot` or cover heading, keep firing under the existing aim rules, and do not close.

| n | Our HP | Proposed action | vs champion today |
| --- | --- | --- | --- |
| 1 | < 0.30 of max, and `ttk_weak` ≥ `ttd` (we are not winning the race) | Evade. Do not use the 1.5× aggression override. | Tighter than today (`aggression` 1.5 would stay and fight). |
| 1 | < 0.30, and `ttk_weak` < `ttd` (we win the race even at 1.0×) | Fight, with calibrated strafe; abort to evade if a second threat appears. | Slightly tighter than today (drops the 50% optimism). |
| 1 | ≥ 0.35, finish-rule conditions hold | Unchanged finish, then claim. Calibrated strafe may apply only to a stand-still, not to the close, unless a later screen says otherwise. | Unchanged. |
| 1 | otherwise, and outmatched (`ttk_weak` > `ttd`, e.g. they have a laser we cannot beat at this range) | Evade / break LOS. Do not let the standoff break walk us in. | New caution on the standoff path; standoff already forbids a charging laser and requires HP ≥ 0.50. |
| 2 | any, and `ttk_weak` ≥ `ttd_pack` (outmatched, including "reasonably" when the pack DPS wins) | Evade even at high HP. Prefer cover away from the second attacker. Do not stand and trade. | Close to today's crossfire break; adds an explicit matchup test and a heading bias. |
| 2 | `ttk_weak` clearly < `ttd_pack` and the weak target is isolated or already in one-magazine range | Break the second line first if we can; shoot the weak target while moving; close only once `alone()` is true. | New, narrow exception. |
| 3+ | default | Evade constantly, re-evaluate every decision. Shots at the weakest are allowed while moving if they do not take us toward the pack. No finish-rule close. | New emphasis; today we only crossfire-break and we never finish without `alone()`. |
| 3+ | `ttk_weak` much less than `ttd_pack` (a nearly dead hunter, clear path to cover afterwards) | Shoot that target while evading; leave as soon as a second line is a problem. | Doug's "if we can get out alive by killing the weakest." |
| any | laser charging on our bearing, or mortar inbound | Existing telegraph dodge / hide, first among movement options. | Unchanged. |
| any | zone would be left, or a drop-run we are already committed to and not hurt | Zone and the drop-run rules still win the rank. | Unchanged. |

Practice constraint, to keep in the experiment design: do not add a "wait until they shoot each other" branch. Do not leave the zone to kite. Do not change flag-0 identity of the current champion: this would be a new flag, off by default.

### Sim test plan for the policy (separate from §5)

- One flag, default off, no change to movement timers in the same commit (one idea per screen).
- 192 games, seeds 2000+3000, then held-out 4000+5000, paired with flag 0 on current champion main.
- Report, in addition to the usual score and death-t: deaths and score by `attackers_5s` (or a mid-match count of LOS threats, if the measure script is extended in a later tooling change), early deaths in fights that started at high HP with 2+ attackers (the 2.53-score cell), lightning-at-end, finish-rule fire rate, and time spent in retreat / crossfire.
- Pass bar: sim score not required to decide a site keep, but a useful screen would be fewer deaths before 40 s in the high-HP 2+ bucket, no rise in 1v1 losses that the current TTK rule was winning, no rise in zone deaths, flag 0 identical. If 1v1 tightening (dropping `aggression` 1.5) costs more than the 2v1 evades save, split that into its own flag and test it alone.
- After any sim pass, the site still decides.

### Confidence and risks for the policy

Confidence is medium that 2v1 / 3v1 at high HP is a real failure mode (sim bucket + Watcher first-fight deaths). Confidence is lower that tightening the 1v1 low-HP TTK rule is a gain: those low-HP 1v1 rows are the better-scoring deaths, and `aggression` 1.5 may be why. Confidence is low that a 3v1 "kill the weakest while evading" close would help; shots-while-moving is the safer half of that idea.

Risks: giving up winnable 1v1s; evading so far that we never take a laser fight we would have won; hiding from one hunter while another, who already knows our position, just walks around the wall; conflicting with the standoff break and the drop run; measuring only end-of-match attacker counts, so a mid-fight policy needs better instrumentation before anyone trusts a small delta.

## Bottom line

- Calibrated randomness means a flip interval scaled to gun flight time and clamped to what our accel can actually do, plus a biased heading, not a 0.5–1.4 s coin flip. The kit and the sim's own aim model support that design. Iteration 1's pure jitter did not lower hit rate. Iteration 2's flight-timed jitter (mode 7) lowered it slightly and failed pin, stuck and damage tests. Stop-and-go (mode 8) failed. Mode 6 remains the best *pathing and sim-score* result and still did not pass the hit-rate screen.
- Watcher streams are plentiful in text form (no video files). They show that real house guns miss often, that winners hold cover and avoid early piles, and that dying first engagements are often already 2-on-1. They do not yet show, shot by shot, whether site bots lead like the sim.
- The engage-count × HP idea is a separate flag-shaped experiment. The champion already retreats under 30% HP, already breaks 2+ lines of sight, and already refuses to finish unless it is alone. The gap is an optimistic 1v1 override, no pack-TTD test, and early deaths when a last fight starts at high HP against two or more. Research only: do not implement from this note.
