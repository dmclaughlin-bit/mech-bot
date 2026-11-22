# Opponent-independent skills (movement, aim, pickups, position)

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.38 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 21:33 ET. This pass refreshes the 2026-11-21 17:25 ET skills note against current champion P34 and every recording collected since the 15:43 ET per-mechanic refresh (and since that 17:25 ET skills pass). The question is still which *skills* — how a bot moves, aims, strafes, routes to items, sits in the zone, and spends energy — differ between high and low teams in a way that does not depend on who they are fighting.

Corpus: 128 complete showdown matches, 1 Hz samples (cache `ticks.csv.gz` / `events.csv.gz`). Previous per-mechanic refresh at 15:43 ET used 93 complete showdowns; this pass adds 35 complete showdowns (21 new live files; 90 live files in total, plus earlier recordings). Public matches (83 complete) stay held out. Labeled teams T01–T16: 996 mech-matches, 138607 tick-rows. High = T01–T04 (224 mech-matches, 122 matches), low = T13–T16 (272 mech-matches, 128 matches). A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (and at least 12 mech-matches). For per-game rates the tick minimum is waived, but 8 matches and 12 mech-matches still apply. A 1 Hz path extract from the live files (129 complete showdowns; the tick cache is 128) is used only for lateral/radial speed, heading-change cadence, and pickup detour. Life length in this file is the last 1 Hz tick minus the first plus one second. The `life_s` column in `mechanics/cache/mech_matches.csv` is about 20× too short (`death_t / 20`) and was not used.

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
| Speed, hold, stuck, silent — especially while healthy and not engaged | Speed 8.33 vs 5.93 m/s (d=0.43); when healthy and not engaged 7.93 vs 5.19 (d=0.51). Hold 21.9% vs 36.4% (d=−0.32). Stuck 10.6% vs 21.6% (d=−0.30). Silent 33.8% vs 54.7% (d=−0.43). 32185/33796 ticks, 122/128 matches, ok | Independent | The largest speed/hold/stuck gaps are still on idle, healthy ticks. That is how the bot uses its own legs, not a reply to a particular foe. Mid-game unstuck has never been site-tested; movement iteration remains on hold. P28 midring patrol and P32 fight-fade were retired, so this is evidence for *unstuck / keep moving*, not a re-test of those. |
| Boost / energy while traveling | Boost while healthy and not engaged: 9.9% vs 3.5% (d=0.26). While already moving in that state: 12.7% vs 5.6% (d=0.24). Mean energy 86.43 vs 94.59 (d=−0.38). 20673/21593 and 15417/12610 ticks, 122/128 matches, ok | Independent | The bot's own energy bar and a travel/farm/zone goal are always known. High teams still spend more energy moving when nobody is fighting them. P26 (HEALTHY_BOOST_ON) is HOLD on new 20 s+ pins (Doug decides); P26b retired (0/96 fires). Do not start a second healthy-boost build. |
| Air / jet fraction | 2.3% vs 2.6% (d=−0.01) overall; 3.5% vs 3.5% while engaged (d=0.00). 32185/33796 ticks, ok, but there is no gap | — | Jet is an own-state action, but high and low now jet at the same rate. P40b is roof-loot jet routing, not a combat jet-hop. This pass does not support a jet-combat build. |
| Strafe vs aim (binary, already in movement.md) | 27.4% vs 16.8% (d=0.26) overall; 27.9% vs 14.9% (d=0.32) when not engaged; 25.2% vs 25.8% (d=−0.01) when engaged. 32185/33796 ticks, ok | Mixed | The idle gap is still a travel habit (independent). Once a fight starts, high and low strafe vs aim at the same rate, so that slice is not a fighting-style difference. |
| Lateral vs radial speed (path pass) | Mean \|lateral\| 5.842 vs 5.349 m/s (d=0.37). While engaged, radial toward the nearest enemy: **−1.152 vs +0.894 m/s** (d=−0.61; 140/163 mech-matches, 79/104 matches, ok). Not engaged, radial is +1.252 vs +1.833 (d=−0.26) | Mixed | The idle lateral gap is a movement habit. The engaged fade (high teams back away, low teams still close) can transfer if we implement it from our position and a *visible* enemy only, but whether a house bot punishes a fade is matchup-dependent. P32 (FIGHT_FADE_ON) already retired: deaths <40 s 33→35 at base 0. Do not resubmit that mechanism. |
| Heading-change cadence and regularity | 0.299 vs 0.256 changes per moving second (d=0.31). Interval CV 1.239 vs 1.128 (d=0.19). 223/262 mech-matches, 123/127 matches, ok | Independent | How often the path turns is a motor habit. Both groups are irregular (CV > 1), so this is "change direction more often," not a metronomic strafe pattern to copy. |
| Shots per engagement-second | 1.429 vs 1.417 (d=0.02). 221/262 mech-matches, 120/127 matches, ok | — | No meaningful gap. Fire rate in a fight is not what separates high from low here. |
| Fire while moving vs standing | Of shots fired during an engagement, 95.6% vs 94.5% are already taken while moving (d=0.12). P(fire this second \| engaged and moving) 45.7% vs 48.5% (d=−0.06). Standing-and-firing in a fight is uncommon in both groups (21.7% vs 22.0%, d=−0.01) | — | No skill gap. High teams' higher share of *all* shots taken while moving (89.5% vs 84.4%, d=0.32) is still just that they move more of the time, not that they have a better fire-on-the-move habit once a fight starts. |
| Hit range by weapon | Gun 84.8 vs 78.2 m (d=0.18, medians 80.08 vs 71.13, 6054/7250 hits, 122/128 matches, ok). Laser 102.9 vs 103.2 (d=−0.01). Lightning 33.8 vs 33.1 (d=0.10) | Matchup-dependent | Gun range is a modest gap and sits in the already-lost engage/standoff-range family. Laser and lightning ranges are the same. Do not retune gun range from this. P34 lethal release is about *when* to let a laser go, not range. |
| Rear-hit share dealt / taken | Dealt 5.3% vs 6.8% per mech-match (d=−0.13); pooled hits 5.1% vs 6.5% (7281/8469). Taken 7.4% vs 8.2% (d=−0.05); pooled 5.9% vs 6.5% (7098/8322) | — | No useful gap. Front-arc discipline is not what separates these groups. P30 (FACE_ATTACKER_ON) was already retired (screen VETO; rear-damage share 21.3%→20.4%). |
| Cubes gained and cubes per minute | Pooled 3.62 vs 2.62 cubes/min on 1943/1474 cubes and 32185/33796 s (224/272 mech-matches, 122/128 matches). Among mechs alive ≥60 s: mean 3.48 vs 2.57 cubes/min (d=0.33) and 11.78 vs 7.88 cubes gained (d=0.37; 158/172 mech-matches, 108/106 matches, ok). Mid-phase pooled 5.30 vs 2.91; idle (not engaged) 3.83 vs 2.66 | Independent (the *rate*) | Farming while no enemy is engaged uses only our position, vision, and item list. Late-game *stock* of cubes held (see loadout.md) is partly a survival confound. The rate while idle and in mid-game is the skill. P25/P25b cube memory is HOLD; P25c is in the queue. P36 claim-cubes retired. Do not start a second cube-memory or claim-cube build. |
| Detour (path/straight line, 6 s before a cube) | 1.32 vs 1.34 (d=−0.03) on 585/591 pickup windows, 106/117 matches, ok | — | No gap. High teams do not walk a noticeably straighter route to a cube. They just pick up more often. |
| Zone ratio and center share | zratio 0.50 vs 0.47 (d=0.15). Center share 34.7% vs 38.0% (d=−0.07). Among mechs alive ≥60 s, center share 37.7% vs 39.2% (d=−0.05; 158/172, 108/106 matches, ok) | Independent as a habit, but **no high-vs-low gap** | Where a team sits in the circle is chosen from its own position and the zone, which we always know. In adequate samples, high and low still sit in the same place. Late/final slices still have too few matches (13/8 and 4/4; late also has only 10 low mech-matches) for a conclusion. |
| Time-to-center after a shrink | If not already in the center: reach rate 62.2% vs 55.7% (d=0.13; 201/158 events, 87/78 matches, ok). Delay among those who reach: 61.9 vs 63.0 s (d=−0.02) | Mixed | The delay is the same, so high teams are not faster. The higher reach rate is at least partly "they were still alive to finish the walk," which is matchup-tinged. Leaving earlier for the zone is an already-lost family and is not recommended. P29 already settles midring after a shrink; do not replace that with a center walk. |

## Center-holding plus item collection

The same no-go as the previous pass: high and low already sit at about the same zone ratio, and among mechs that lived at least 60 s the center share is 37.7% vs 39.2% (d=−0.05). Pooled pickup rate is higher for high teams in both the midring (3.58 vs 2.70 cubes/min on 1134/898 cubes and 19015/19949 s, 118/123 matches) and the center (3.95 vs 2.56 on 736/549 cubes and 11181/12857 s, 109/118 matches). High teams still collect most of their cubes in the midring (1134 vs 736 in the center). Mid-phase and idle rates remain the large, well-sampled gaps (5.30 vs 2.91 mid; 3.83 vs 2.66 idle). Late-phase 4.72 vs 0.98 is in the right direction but fails the sample rule (13/8 matches, 15/10 mech-matches).

### Why a center hold is still the wrong read

Top and low teams already sit at the same zone ratio. The skill data says the pickup advantage is "keep moving and take midring and idle cubes," not "park at the origin." A center hold would also fight the champion's 200 m drop run and the P29 midring settle (now in the champion). P29 already implemented the midring-settle idea from the previous skills note (site 4.17→4.35). P45 is measuring whether a better *spot* inside that band is worth choosing. Do not start a center camp or a second settle trigger.

## Champion P34 gaps (read from `bot.ts` / `brain.ts` / `params.ts` on `0e6fadd`)

Champion is P34 lethal laser release, code `0e6fadd1a30db4ee30c26114b8198f63d782b7c9`, merged to main as `8c130ad`, recorded in champion.json in `588557e`, site 4.38 (`BB-ABEB42BF`), built on P29 midring settle (`2e1d036`, site 4.35). Keep the 200 m drop run, the not-hurt drop gate, the P29 midring settle (band 0.40–0.70, goal 0.55, off at r≤70), P34 lethal release (margin 0.8, min t 40 s, no release while a drop run/hold is possible), zone-first travel, B5b heal-and-fire, engage/target-pick, B60 crossfire break, B17/B80 laser walks, B103 lightning ambush, and the 60 s standoff break unless a later sim test beats them on end-game score.

Biggest skill gaps versus high (T01–T04), limited to things the bot can do from its own observations, after later experiments are marked:

1. **Mid-game unstuck / keep moving (OPEN).** With 5–8 alive, high teams are stuck 12.0% vs 30.8% of ticks (d=−0.47; 10858/10766 ticks, 97/95 matches) and move 8.06 vs 5.05 m/s (d=0.53). Mid-phase stuck is 10.3% vs 30.2% (d=−0.52; 8207/7323 ticks, 77/71 matches). The champion has nav paths but no separate unstuck policy. This has never been site-tested. P40b is roof-loot jet routing, not unstuck. P28 midring patrol and P32 fade are retired and are different mechanisms. Any test must keep the drop run and the midring settle intact.
2. **Cube memory and cube walk radius (IN FLIGHT).** Farm still walks only to cubes and landed drops that are *currently in view* and within `FARM_PICKUP_M = 80` m. High teams' mid-phase pickup rate is 5.30 vs 2.91 cubes/min, and idle 3.83 vs 2.66, with no detour-efficiency gap (1.32 vs 1.34). P25/P25b (CUBE_MEMORY_ON) is HOLD on new 20 s+ pins (Doug decides); P25c is already in the queue. Do not start a second one.
3. **Boost on healthy travel (IN FLIGHT).** High teams boost 9.9% vs 3.5% of healthy, not-engaged ticks, and 12.7% vs 5.6% of those ticks where they are already moving, and they run a lower mean energy (86.43 vs 94.59). P26 is HOLD on pins; P26b retired (0/96 fires). Do not start a second healthy-boost build.
4. **Visible-enemy spacing in the end game (OPEN, proxy only).** With 2–4 alive, high teams' mean nearest-enemy distance is 139.88 vs 120.94 m (d=0.26; 6076/3957 ticks, 64/58 matches). At HP 30–50% it is 119.07 vs 104.16 m (d=0.26; 2041/2273 ticks, 116/124 matches). The Watcher measurement is omniscient; a build can only use enemies in `obs.mechs` (or a sound proxy). P33 (hurt retreat to ~120 m at HP < 35%) retired at 0/96 activations with the drop gate — that was a hurt-retreat extension, not a general spacing rule. P30–P32 hurt-evasion are also retired. A new test has to be a visible-only spacing rule that does not redo those, and must not break P34 or the drop run.
5. **In a fight, high teams still fade (COVERED / retired).** While engaged, radial speed toward the nearest enemy is −1.152 m/s vs +0.894 m/s (d=−0.61). P32 already tested a narrow "don't walk straight in while we already have a clear gun or laser shot" rule and was retired on early deaths. Do not resubmit it.

## Ranked build ideas from the previous skills pass — current status

The five ideas from the 17:25 ET pass are all either in the champion, retired, or already assigned. They are listed here so they are not restarted.

### 1. Remember cubes we have seen, and walk to them out to 150 m — IN FLIGHT

P25 / P25b (CUBE_MEMORY_ON) are HOLD on new 20 s+ pins; P25c is in the pre-built queue. Mid-phase and idle pickup gaps are still present (5.30 vs 2.91 and 3.83 vs 2.66 cubes/min), so the assigned follow-up remains relevant. Do not start a duplicate.

### 2. When farm is open and the list is empty, walk a midring patrol instead of holding — COVERED (retired)

P28 midring patrol retired on drop-arrival losses (P28c still lost arrivals). Do not resubmit a patrol that moves the hold spot during the drop window. Mid-game *unstuck* (idea of keeping movement without a new patrol path) is the remaining open movement idea, listed above.

### 3. Boost on healthy farm and travel, keeping an energy reserve — IN FLIGHT

P26 (HEALTHY_BOOST_ON) is HOLD on new 20 s+ pins (Doug decides). P26b retired: the drop-safe gate left 0/96 activations. The gap is still there (9.9% vs 3.5% boost while healthy and not engaged). Do not start a second one.

### 4. In a gun or laser fight with a clear shot, orbit and fade instead of walking straight in — COVERED (retired)

P32 (FIGHT_FADE_ON) retired: deaths <40 s rose 33→35 at base 0; a pre-45 s fix left too few activations. The kinematic gap is still large (−1.152 vs +0.894 m/s radial while engaged). Do not resubmit that mechanism.

### 5. After a shrink, settle in the midring and farm — do not camp the center — COVERED (now in the champion)

P29 (MIDRING_SETTLE_ON) kept at 4.35 and is in current champion P34 (4.38). P29b retired (settle fired 0/384). P45 (MIDRING_SPOT_ON) is Step A, already assigned, for choosing among 2–3 reachable spots in the same band. Do not start a second settle trigger or a center hold.

## What is still worth a new experiment

After those five, the skill data that is both large, implementable, and not already covered points first at **mid-game unstuck / keep moving with 5–8 alive** (stuck 12.0% vs 30.8%, speed 8.06 vs 5.05 m/s; fully own-state). A narrower second idea is **visible-only spacing with 2–4 alive or at HP 30–50%**, with the observability limit and the retired P33 overlap called out above. Laser follow-ups (P34b2 drop gate, P42 no charge on a zone trip, P44 lightning-holder guard) and P45 midring spot quality are already assigned; do not start overlapping ones.

## What this pass could not measure

- True planned path vs the path taken (wall slides, nav intent). Detour and heading change are 1 Hz approximations.
- Independent body yaw (the stream has torso aim only).
- Enemy energy and enemy upgrade choices (not in `ActorObs`). Rear-hit and range numbers above use Watcher-omniscient hits.
- Tree/canopy vision and the 5 s memory track, except as already noted in STATES.md. Official screens now run with trees on; this Watcher cover proxy is still buildings only.
- `fired` as a cache field (always 0); fire events were used instead.
- Practice-squad trigger frequencies. This corpus is exhibition FFA. Use the sim for how often a flag would fire against house bots.
- Late and final-circle position (13/8 and 4/4 matches; late also has only 10 low mech-matches) — still too small for a build.
- The 1 Hz path extract covers 129 complete showdowns in the live files, one more than the 128-match tick cache. Kinematic directions are consistent with the cache movement tables; counts are not mixed into the 128-match tables above except where the path pass is explicitly named.
