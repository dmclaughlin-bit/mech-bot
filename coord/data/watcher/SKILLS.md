# Opponent-independent skills (movement, aim, pickups, position)

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.17 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 17:25 ET. This pass was asked for because our site tests are against house bots, while the Watcher records Top-16 teams fighting each other, so a matchup tactic that works in showdowns may not transfer. The question is which *skills* — how a bot moves, aims, strafes, routes to items, sits in the zone, and spends energy — differ between high and low teams in a way that does not depend on who they are fighting.

Corpus: 93 complete showdown matches, 1 Hz samples (cache `ticks.csv.gz` / `events.csv.gz`). Labeled teams T01–T16: 875 mech-matches, 115655 tick-rows. High = T01–T04 (190 mech-matches, 88 matches), low = T13–T16 (205 mech-matches, 86 matches). A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (and at least 12 mech-matches). For per-game rates the tick minimum is waived, but 8 matches and 12 mech-matches still apply. A 1 Hz path extract from the live files (103 complete showdowns; the cache is a slightly earlier 93-match snapshot) is used only for lateral/radial speed, heading-change cadence, and pickup detour. Life length in this file is the last 1 Hz tick minus the first plus one second. The `life_s` column in `mechanics/cache/mech_matches.csv` is about 20× too short (`death_t / 20`) and was not used.

Expected impact is a direction, not an invented site-point value. Nothing here is a site submission, a PR, or bot code.

## Method

- **High vs low** is T01–T04 vs T13–T16, with Cohen's d, tick or mech-match counts, and match counts. We do not treat a large d in a tiny bucket as a finding.
- **Aim and fire.** `fired` in the 1 Hz cache is unused (always 0), so shots come from `fire` events joined to the same second's tick. Hits used for range and rear-share are mech-to-mech `hit` events with a distance and a weapon. "Engaged" means a hit dealt or taken in the last 2 s (Watcher-omniscient).
- **Strafe kinematics.** From 1 Hz positions: speed is split into a component along the line to the nearest living mech (radial, positive = closing) and a sideways component (lateral). A heading change is a turn of at least 45°. Pickup detour is path length / straight-line displacement in the 6 s before a cube gain, dropping windows with under 3 m of displacement (standing pickups).
- **Pickups.** Cube gains are positive 1 Hz jumps in `cubes` (the stream value never fell in a 400-mech-match check, so it behaves like lifetime cubes collected). Cubes per minute uses seconds actually spent in the bucket (pooled) or alive time from the 1 Hz series (per-game).
- **Zone / center.** Center means distance/radius < 0.40 and still inside, same as STATES.md. Time-to-center after a shrink is measured from the first 1 Hz sample where the live radius is falling, until zratio first drops below 0.40. Association of center time with pickups and place is also reported for mechs that lived at least 60 s, so early deaths and spawn location do not dominate.
- **Transfer test.** A pattern is called opponent-independent when the bot can run it from its own observations (position, speed, aim, energy, loadout, zone, visible items, visible enemies) and the high-vs-low gap still shows up when no enemy is engaged, or is a motor/routing habit rather than a reply to a particular foe. A pattern is matchup-dependent when it is mainly about when or at what range to fight, or when the number would change if the other bots played differently.

## Transferability

| Metric | High vs low (main number) | Independent of opponent? | Why |
| --- | --- | --- | --- |
| Speed, hold, stuck, silent — especially while healthy and not engaged | Speed 7.82 vs 5.36 m/s (d=0.45); when healthy and not engaged 7.21 vs 4.35 (d=0.55). Hold 24.6% vs 40.1% (d=−0.34). Stuck 12.5% vs 27.9% (d=−0.39). Silent 37.8% vs 60.6% (d=−0.47). 25875/25007 ticks, 88/86 matches, ok | Independent | The largest speed/hold/stuck gaps are on idle, healthy ticks. That is how the bot uses its own legs, not a reply to a particular foe. (Mid-game unstuck already failed the sim gate, and movement iteration 3 is in flight, so this is evidence, not a new movement-mode proposal.) |
| Boost / energy while traveling | Boost while healthy and not engaged: 8.1% vs 1.8% (d=0.29). While already moving in that state: 10.8% vs 3.3% (d=0.29). Mean energy 88.2 vs 94.2 (d=−0.28). 15938/17643 and 11283/9145 ticks, 88/86 matches, ok | Independent | The bot's own energy bar and a travel/farm/zone goal are always known. High teams spend more energy moving when nobody is fighting them. |
| Air / jet fraction | 2.7% vs 1.2% (d=0.11) overall; 3.9% vs 2.6% while engaged (d=0.07). 25875/25007 ticks, ok, but the effect is small | Weakly independent | Jet is an own-state action, but the gap is too small to hang a build on. |
| Strafe vs aim (binary, already in movement.md) | 25.0% vs 14.9% (d=0.26) overall; 24.8% vs 12.9% (d=0.31) when not engaged; 25.7% vs 25.3% (d=0.01) when engaged. 25875/25007 ticks, ok | Mixed | The idle gap is a travel habit (independent). Once a fight starts, high and low strafe vs aim at the same rate, so that slice is not a fighting-style difference. |
| Lateral vs radial speed (path pass) | Mean \|lateral\| 5.79 vs 5.22 m/s (d=0.44). While engaged, radial toward the nearest enemy: **−1.12 vs +0.53 m/s** (d=−0.49; 127/114 mech-matches, 66/63 matches, ok). Not engaged, radial is similar (+1.39 vs +1.58, d=−0.09) | Mixed | The idle lateral gap is a movement habit. The engaged fade (high teams back away, low teams still close) can transfer if we implement it from our position and a *visible* enemy only, but whether a house bot punishes a fade is matchup-dependent. This is not a range-gate change. |
| Heading-change cadence and regularity | 0.290 vs 0.241 changes per moving second (d=0.37). Interval CV 1.19 vs 1.06 (d=0.24). 197/215 mech-matches, 97/96 matches, ok | Independent | How often the path turns is a motor habit. Both groups are irregular (CV > 1), so this is "change direction more often," not a metronomic strafe pattern to copy. |
| Shots per engagement-second | 1.41 vs 1.47 (d=−0.09). 189/189 mech-matches, 88/84 matches, ok | — | No meaningful gap. Fire rate in a fight is not what separates high from low here. |
| Fire while moving vs standing | Of shots fired during an engagement, 95.5% vs 95.0% are already taken while moving (d=0.05). P(fire this second \| engaged and moving) 45.8% vs 46.9%. Standing-and-firing in a fight is uncommon in both groups (19.6% vs 20.8%) | — | No skill gap. High teams' higher share of *all* shots taken while moving (88.3% vs 82.8%, d=0.30) is just that they move more of the time, not that they have a better fire-on-the-move habit once a fight starts. |
| Hit range by weapon | Gun 84.3 vs 76.4 m (d=0.21, medians 78.8 vs 70.1, 5252/4644 hits, 88/85 matches, ok). Laser 103.5 vs 102.8 (d=0.02). Lightning 33.6 vs 33.1 (d=0.07) | Matchup-dependent | Gun range is a modest gap and sits in the already-lost engage/standoff-range family. Laser and lightning ranges are the same. Do not retune gun range from this. |
| Rear-hit share dealt / taken | Dealt 5.7% vs 5.0% per mech-match (d=0.07); pooled hits 5.1% vs 6.2% (6340/5426). Taken 7.5% vs 7.0% (d=0.03); pooled 5.8% vs 5.4% | — | No gap. Front-arc discipline is not what separates these groups in this corpus. Rear hits are still 1.5× damage, but high teams do not take or land them at a different rate. |
| Cubes gained and cubes per minute | Pooled 3.71 vs 2.62 cubes/min on 1598/1091 cubes and 25875/25007 s (190/205 mech-matches, 88/86 matches). Among mechs alive ≥60 s: mean 3.56 vs 2.56 cubes/min (d=0.34) and 11.78 vs 7.56 cubes gained (d=0.38; 130/130 mech-matches, 80/72 matches, ok). Mid-phase pooled 5.11 vs 3.12; idle (not engaged) 3.94 vs 2.27 | Independent (the *rate*) | Farming while no enemy is engaged uses only our position, vision, and item list. Late-game *stock* of cubes held (16.50 vs 9.34 at 2–4 alive) is partly a survival confound and is already in loadout.md. The rate while idle and in mid-game is the skill. |
| Detour (path/straight line, 6 s before a cube) | 1.34 vs 1.28 (d=0.09) on 486/401 pickup windows, 77/75 matches, ok | — | No gap. High teams do not walk a noticeably straighter route to a cube. They just pick up more often. |
| Zone ratio and center share | zratio 0.48 vs 0.47 (d=0.04). Center share 36.9% vs 37.4% (d=−0.01). Among mechs alive ≥60 s, center share 40.3% vs 42.2% (d=−0.06; 130/130, 80/72 matches, ok) | Independent as a habit, but **no high-vs-low gap** | Where a team sits in the circle is chosen from its own position and the zone, which we always know. In adequate samples, high and low sit in the same place. Late/final slices still have too few matches (13/10 and 4/3) for a conclusion. |
| Time-to-center after a shrink | If not already in the center: reach rate 60.7% vs 49.6% (d=0.22; 150/135 events, 61/56 matches, ok). Delay among those who reach: 60.5 vs 62.4 s (d=−0.03) | Mixed | The delay is the same, so high teams are not faster. The higher reach rate is at least partly "they were still alive to finish the walk," which is matchup-tinged. Leaving earlier for the zone is an already-lost family and is not recommended. |

## Center-holding plus item collection

**Verdict: do not build a "sit in the center and farm" policy.** The Watcher does not show top teams camping the center, and among mechs that lived long enough for the number to mean something, more time in the center is not tied to more pickups or better place. If we build a positioning-plus-farm idea at all, it should be a moving midring farm, not a center hold.

### What top vs low teams actually do

- Overall zone ratio is the same: **0.48 vs 0.47** (d=0.04, 25875/25007 ticks, 88/86 matches, ok). Early 0.47 vs 0.46; mid 0.50 vs 0.50; 2–4 mechs alive 0.49 vs 0.50. Late (0.52 vs 0.67, d=−0.70) and final (0.70 vs 0.87) still fail the sample rule (13/10 and 4/3 matches).
- Center share is the same: **36.9% vs 37.4%** (d=−0.01). Early 37.8% vs 39.4%; mid 34.2% vs 31.9%; 2–4 alive 35.0% vs 30.3% (d=0.10). Among mechs alive ≥60 s: **40.3% vs 42.2%** (d=−0.06, 130/130 mech-matches, 80/72 matches, ok) — if anything, low teams sit in the center slightly more.
- After a shrink, high teams are not already more often in the center (42.5% vs 45.6%), and those who get there do not get there faster (60.5 vs 62.4 s).

### Is center position associated with more pickups or survival?

Use mechs that lived at least 60 s, so a bot that spawned in the middle and died in 15 s is not counted as a "center camper."

- Early-and-mid center fraction vs cubes gained: r = −0.04 (n=576 labeled mech-matches). High only r = −0.10 (n=130); low only r = +0.00 (n=130). No positive link.
- The same fraction vs place (1 is best): r = +0.17 overall, +0.21 high, +0.19 low — more center time goes with *worse* place, a small effect.
- Vs life: r = −0.19 overall (slightly shorter lives).

Binned early-and-mid center share, mechs alive ≥60 s, all labeled T01–T16:

| bin | n (matches) | mean place | mean life s | mean cubes gained | mean cubes/min |
| --- | ---: | ---: | ---: | ---: | ---: |
| <20% in center | 220 (86) | 5.22 | 187.5 | 7.56 | 2.37 |
| 20–40% in center | 115 (66) | **4.14** | 217.7 | **12.01** | **3.21** |
| 40–60% in center | 80 (57) | 5.19 | 185.6 | 9.38 | 3.02 |
| ≥60% in center | 161 (80) | 6.29 | 156.7 | 7.42 | 2.76 |

The best place and the most cubes are in the **20–40% center** bin (a team that spends most of its time in the midring and only some time near the middle). Teams that spend 60% or more of the game in the center place worse and pick up less. The same pattern holds inside the high group (20–40% bin: mean place 2.81, 18.88 cubes, 239 s life; ≥60% center: place 5.92, 9.29 cubes).

Pooled pickup *rate* by where the mech was standing when the cube was gained (high vs low, all labeled ticks):

| where | high cubes/min | low cubes/min | cubes (high/low) | seconds (high/low) | matches |
| --- | ---: | ---: | ---: | ---: | ---: |
| center | 4.01 | 3.21 | 638/500 | 9549/9360 | 83/75 |
| midring | 3.49 | 2.26 | 909/572 | 15645/15215 | 85/85 |
| edge | 4.12 | 3.22 | 42/19 | 612/354 | 36/21 |
| not engaged (idle) | 3.94 | 2.27 | 1382/798 | 21029/21109 | 88/86 |
| early phase | 3.24 | 2.50 | 1047/801 | 19373/19221 | 88/86 |
| mid phase | 5.11 | 3.12 | 531/290 | 6231/5574 | 54/56 |
| late phase | 4.72 | 0.00 | 20/0 | 254/168 | 13/10, small n |

High teams collect faster in every adequate bucket, and the **midring is where most of their cubes come from** (909 vs 638 in the center). The mid-phase and idle rates are the big, well-sampled gaps. Late-phase 4.72 vs 0 is in the right direction but fails the sample rule.

### Why a center hold is the wrong read

Top and low teams already sit at the same zone ratio. House-bot tests can still reward a style the Watcher never saw, but the skill data we do have says the pickup advantage is "keep moving and take midring and idle cubes," not "park at the origin." A center hold would also fight the champion's 200 m drop run (drops do not land in the exact middle every time) and is a pin risk if the bot stands still to guard a point. P23's idle torso sweep was already vetoed for a new 64 s in-zone pin; a stationary center camp has the same failure mode.

If we test a positioning-plus-items idea, the spec that matches the evidence is idea 5 below (settle in the midring after a shrink, then farm while moving), not a center camp.

## Champion B113 gaps (read from `bot.ts` / `brain.ts` / `params.ts` on origin/main)

Champion is B113, commit `6182d29c673d99f5186d742a5f019c0b007234f2`, site 4.17, still an ancestor of this worktree. Keep the 200 m drop run, the not-hurt drop gate, zone-first travel, B5b heal-and-fire, engage/target-pick, B60 crossfire break, B17/B80 laser walks, B103 lightning ambush, and the 60 s standoff break unless a later sim test beats them on end-game score.

Biggest skill gaps versus high (T01–T04), limited to things the bot can do from its own observations:

1. **Cube memory and cube walk radius.** Farm walks only to cubes and landed drops that are *currently in view* and within `FARM_PICKUP_M = 80` m. Drones and crates may be hunted to 150 m. Lasers and lightning are remembered; cubes are not. High teams' mid-phase pickup rate is 5.11 vs 3.12 cubes/min, and idle 3.94 vs 2.27, with no detour-efficiency gap (1.34 vs 1.28). The missing skill is "go get cubes we already saw, farther out," not a tighter path to a cube we can already see.
2. **Idle hold when farm is open.** If nothing is in the 80 m cube window and no drone/crate is in the 150 m hunt window, the champion holds. High teams hold 24.6% vs 40.1% of ticks (mid-phase 28.5% vs 48.2%, d=−0.42) and are much less often silent or stuck when healthy and not fighting. Some of that gap is already being worked in other lanes (see exclusions). The part that is still open is a *farm patrol* when `farmOk` and the list is empty, not a standing torso sweep and not a mid-game unstuck jitter.
3. **Boost on healthy travel.** The champion boosts when it is outside the zone, when a zone trip is tight, on some retreats if energy is above 30%, and as part of a stuck jump/jet. Ordinary farm and in-zone travel often do not boost. High teams boost 8.1% vs 1.8% of healthy, not-engaged ticks, and 10.8% vs 3.3% of those ticks where they are already moving, and they run a lower mean energy (88 vs 94) as a result.
4. **In a fight, high teams fade instead of closing.** While engaged, high teams' radial speed toward the nearest enemy is −1.12 m/s; low teams are still closing at +0.53 m/s. The champion walks in toward effective weapon range (standoff break closes; the finish rule walks in). There is no calibrated orbit. This gap is real, but late-game hurt kiting already failed its sim screen, and movement iteration 3 is in flight, so any test has to be a narrow "don't walk straight in while we already have a clear gun or laser shot" rule, not a new engage range and not a late-hurt kite.
5. **No center-hold gap to close.** The champion has no edge-versus-center sit target; it plans a trip to the next circle and then holds. That is closer to the data than a new center camp would be. The remaining miss is what it does *after* it arrives (midring farm patrol, idea 5), not a rule to sit at ratio 0.

Smaller or already-handled: fire-while-moving is already the norm in fights (Build 5b keeps fire up while healing, but healing itself is a stand-still — P24 is in flight). Jet use is slightly higher for high teams (d=0.11) and the champion already jumps when `nav.stuck` is true. Rear-hit rates do not differ. Shot rate in engagements does not differ. Pickup path straightness does not differ.

## Ranked build ideas (expected site impact vs house bots)

These are skill-style rules that use only our own observations. They are ranked by the size and cleanliness of the high-vs-low gap, whether the same kind of idea has already paid off against house bots (item collection has; fighting-distance tweaks have not), and whether the champion already does it. Expected impact is a direction, not a made-up site score.

**Not in this list** (already lost on the site, or already in flight): standoff / engage range, ambush distance, hold-behind-cover, zone-early timing, mid-game unstuck, heal-in-cover P24, late idle torso sweep P23, movement iteration 3 modes 30–41, laserSkip expiry. The stuck/speed gap is large, but it is not turned into a new movement-mode idea here.

### 1. Remember cubes we have seen, and walk to them out to 150 m

**Why it should transfer.** Idle and mid-game cube *rate* is a self-driven routing skill. The same family already raised the site score (B12 farm +0.06, B13 hunt +0.10, both still in the champion). House bots leave cubes, death cubes, and crates on the field the same way showdown teams do.

**Evidence.** Pooled cubes/min 3.71 vs 2.62 (1598/1091 cubes, 25875/25007 s, 190/205 mech-matches, 88/86 matches). Alive ≥60 s: 3.56 vs 2.56 cubes/min (d=0.34) and 11.78 vs 7.56 cubes gained (d=0.38), 130/130 mech-matches, 80/72 matches, ok. Mid-phase 5.11 vs 3.12 cubes/min (531/290 cubes, 6231/5574 s, 54/56 matches). Idle 3.94 vs 2.27 (1382/798 cubes, 21029/21109 s). Detour 1.34 vs 1.28 (d=0.09) — not a path-shape problem. Mid-game cubes *held* (stock) is already 15.05 vs 7.95 in loadout.md.

**Spec (one flag on B113).** While `farmOk` (same gate as today: in zone, no known enemy within 160 m, no recent mech damage), remember cubes (and, if cheap, crates) that have been in `obs.cubes` / `obs.crates`, forget them if we stand close and they are gone, and walk to a remembered or visible cube out to **150 m** (the same radius as `FARM_HUNT_M`), zone-safe. Do not add a standing torso sweep (that was P23, vetoed for a 64 s in-zone pin). Drop run, zone travel, engage, retreat, and crossfire still rank first.

**Main risk.** New in-zone pins if a remembered cube is against a wall or already taken (P23's failure mode). A long walk can also miss a drop ring or run us toward an unseen house bot. Screen pin windows, drop-ring arrivals, and deaths before 40 s, and keep flag-0 identical.

### 2. When farm is open and the list is empty, walk a midring patrol instead of holding

**Why it should transfer.** This is the idle-movement half of the same pickup skill: high teams do not stand still as much when nobody is fighting them. It is not mid-game unstuck (no jitter, no "we've been still 5 s" trigger) and not P23 (we move the feet, we do not spin in place).

**Evidence.** Hold 24.6% vs 40.1% (d=−0.34); mid-phase hold 28.5% vs 48.2% (d=−0.42), 6231/5574 ticks, 54/56 matches, ok. Speed while healthy and not engaged 7.21 vs 4.35 m/s (d=0.55). Idle cube rate 3.94 vs 2.27. Best long-run place and cubes sit in the 20–40% center-share bin, not in a hold at the origin.

**Spec.** If `farmOk` and there is no visible or remembered cube, drop, drone, or crate to walk to, do not hold. Walk a short zone-safe path that stays in the midring of the current (or next) circle, roughly zratio 0.40–0.70, so the 120° vision wedge sweeps new ground. Break immediately for zone travel, a drop run, engage, or a newly seen item.

**Main risk.** Pins and walking into a house bot we have not seen. Must not override the drop run or the just-in-time zone trip. Screen pin windows, drop-ring arrivals, and early deaths.

### 3. Boost on healthy farm and travel, keeping an energy reserve

**Why it should transfer.** Boost is an own-energy decision. The gap is largest when no one is fighting. Faster, safer trips to cubes, drones, and the next circle are the same collection style that has already scored on the site.

**Evidence.** Boost, healthy, not engaged: 8.1% vs 1.8% (d=0.29, 15938/17643 ticks, 88/86 matches, ok). Boost while already moving in that state: 10.8% vs 3.3% (d=0.29, 11283/9145 ticks). Overall boost 13.6% vs 7.3% (d=0.21). Mean energy 88.2 vs 94.2 (d=−0.28) — high teams actually spend the bar. The boost gap shrinks once a fight starts (engaged: 34.6% vs 32.7%, d=0.04).

**Spec.** When HP is at or above `retreatHp`, no recent damage, we are not engaged, and the current goal is farm, hunt, zone travel, or a drop approach, set boost if energy is above a reserve (suggest 40–50% of max, so a lightning fight still has a clip). Do not boost during heal, hold, lightning ambush, or the standoff-break close. Existing outside-zone and late-for-the-circle boosts stay as they are.

**Main risk.** Arriving at a lightning or jet moment with an empty bar. Noise from boosting is less of a concern against a house squad that already shares vision, but it is still a change in how often we are heard. Unlikely to pin or to miss a drop ring if the path is unchanged; still check those screens and late-fight wins when energy ran out.

### 4. In a gun or laser fight with a clear shot, orbit and fade instead of walking straight in

**Why it might transfer.** This is a movement *style* during a fight we have already chosen, using only our position, our aim, and a visible enemy's position. It is not a new standoff band, not a new ambush distance, and not the late-hurt kiting build that already failed its sim screen. House bots still shoot at a target that walks straight in; a sideways fade can be useful against them too. It is more matchup-dependent than ideas 1–3, so it ranks lower.

**Evidence.** While engaged and moving, radial speed toward the nearest enemy is **−1.12 m/s (high) vs +0.53 m/s (low)** (d=−0.49, 127/114 mech-matches, 66/63 matches, ok). Absolute lateral speed in the same state: 5.79 vs 5.16 m/s (d=0.44). Heading changes 0.290 vs 0.241 per moving second (d=0.37). Strafe-*aim* while engaged is already the same (25.7% vs 25.3%) — the difference is "don't close," not "strafe more in a fight." Shot rate and fire-while-moving in engagements are also the same, so we are not asking the bot to shoot differently, only to stop marching down the bearing.

**Spec.** When we already have a clear gun or laser shot, we are not in a lightning-commit or finish-rule walk, and the target is visible, keep current aim/fire rules and add a lateral offset with a slight fade (negative radial) instead of walking straight at the target. Leave existing close-ins alone: lightning ambush, finish rule, standoff break, and retreat. Visible enemies only.

**Main risk.** Never closing when we need to (especially lightning), new pins, or overlap with movement iteration 3 if a mode already adds a fight strafe. Must not retune engage range. Screen drop-ring arrivals (this should not touch them), pin windows, and early deaths, and compare mid-fight survival, not just the radial metric.

### 5. After a shrink, settle in the midring and farm — do not camp the center

**Why it should transfer (as the *alternative* to a center hold).** Zone position is fully known from our position and the circle. The skill data says high teams do not camp the center, and the best long-run place and cube counts sit in a midring-heavy mix (20–40% of time in the center). This is not zone-early timing (we do not leave sooner); it is where we stand *after* we are already in.

**Evidence.** Overall zratio and center share are ties (0.48 vs 0.47; 36.9% vs 37.4%). Alive ≥60 s, center share 40.3% vs 42.2% (d=−0.06). Among those mechs, ≥60% center time has mean place 6.29 and 7.42 cubes; 20–40% center time has mean place 4.14 and 12.01 cubes (115 mech-matches, 66 matches). Most high-team cubes are gained in the midring (909) not the center (638). Shrink delay is a tie (60.5 vs 62.4 s).

**Spec.** After we have entered the current or next circle, if `farmOk` and we are not on a drop run, prefer a midring sit/patrol (zratio about 0.40–0.70) over walking to the exact center or hugging the edge. Combine with ideas 1–2 so the patrol actually picks up cubes. Do not add a "hold the origin" flag.

**Main risk.** Sitting midring while a drop lands nearer the middle or the edge, or while the next shrink wants us deeper in. Keep the drop run and zone-first trip above this. Pins if the chosen midring point is against a building. Final-circle samples are still too small to claim this is right when r ≤ 70, so keep the rule off, or very loose, in the final circle.

## What this pass could not measure

- True planned path vs the path taken (wall slides, nav intent). Detour and heading change are 1 Hz approximations.
- Independent body yaw (the stream has torso aim only).
- Enemy energy and enemy upgrade choices (not in `ActorObs`). Rear-hit and range numbers above use Watcher-omniscient hits.
- Tree/canopy vision and the 5 s memory track, except as already noted in STATES.md.
- `fired` as a cache field (always 0); fire events were used instead.
- Practice-squad trigger frequencies. This corpus is exhibition FFA. Use the sim for how often a flag would fire against house bots.
- Late and final-circle position (13/10 and 4/3 matches) — still too small, and still the reason a late "high teams sit closer to the center" line from zone.md is not a build.
- The 1 Hz path extract covers 103 complete showdowns in the live files, a slightly newer set than the 93-match tick cache. Kinematic directions are consistent with the cache movement tables; counts are not mixed into the 93-match tables above except where the path pass is explicitly named.

