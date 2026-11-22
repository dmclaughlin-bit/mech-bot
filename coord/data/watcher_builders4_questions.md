# Match formats and sensor-observable behaviors

Source: 246 unique complete matches in `/workspace/watch/index/match_formats.csv` (149 Top-16 showdowns, 97 public). Match length is `result.ticks / tick_hz` (20 Hz); last-frame time matches that in every row. Behavior numbers are from `/workspace/watch/ladder.md` (Sun Nov 22, 2026 1:56 AM ET) on the **149 complete showdowns** (winner n=151 / m=149, places 2–4 n=445, bottom 9–16 n=1191), except question 5, which was measured on the same 149 showdowns for this note. Public matches are not mixed in. Labels: **Verified** = ladder high, **Promising** = med, **Uncertain** = low.

## Formats

Every complete match has **16 mechs** and the same map string in the replay header: `viewer/public/arena/v2/world.json`. No header or state field varies the map or marks trees/canopy on or off (**trees: not stated in stream**).

Two formats, split only by kind and first shrink:

- **Showdown** (n=149): title `Top 16 Showdown, <hour>`; first shrink at **60 s**; length median **281.25 s** (range 135.25–366.45 s). Title counts: 12 AM 10, 1 AM 10, 2 AM 4, 3 AM 4, 4 AM 6, 5 AM 6, 6 AM 5, 7 AM 6, 8 AM 6, 9 AM 4, 10 AM 6, 11 AM 6, 12 PM 5, 1–8 PM 6 each, 9 PM 8, 10 PM 8, 11 PM 7.
- **Public** (n=97): channel title `Real players · play.joinbuilders.org`; no showdown title; first shrink at **30 s**; length median **153.05 s** (range 94.95–181.65 s).

## What the bot can observe (`mechfight/1`)

Always known in `obs`: self (pos, hp, energy, cubes, upgrades, weapons, `in_zone`), the zone (current and next circle, `shrink_start` / `shrink_end`), and called supply drops. Other mechs, NPCs, crates, cubes, pickups, and enemy projectiles only with line of sight and either within **45 m** (any direction; buildings block, canopy does not) or within **200 m** and a **120° yaw FOV**; mechs/NPCs stay in memory **5 s** after leaving view. Sounds give bearing and near/far (not identity) within each kind's carry range. Buildings (and trees, if the kit map applies) come from `hello.map`, but the spectator stream never says whether trees are on.

## Five questions

**1. Do top finishers stay farther from enemies they can see or hear in the first 30 s?** (F10) **Promising.**
Winners' nearest enemy, first 30 s: **145 m** (n=151 / m=149) vs bottom **117 m** (n=1191); gap +28 m, d=+0.76, cons 107/149. Enemies within 100 m: **0.23** vs **0.45**, d=−0.67, cons 114/149 (also Promising). Places 2–4 sit with the winners (141 m, 0.25). Caveat: the stream metric is god's-eye nearest; at ~145 m a bot only sees an enemy in the 120° FOV (or via 5 s memory / sound). Policy: if you see or hear someone closer than ~140 m early, leave.

**2. Do top finishers who are still alive at 60 s hold more cubes by then?** (F8) **Promising.**
Cubes by 60 s (alive at 60 s): winners **4.4** (151 / 149) vs bottom **2.4** (308); gap +2.01, d=+0.67, cons 56/89. Places 2–4: 3.4. Own cube count and visible cubes are in `obs`.

**3. Do top finishers who are still alive at 60 s already have more upgrades?** (F8) **Promising.**
Upgrades by 60 s (alive at 60 s): winners **2.0** (151 / 149) vs bottom **1.3** (308); gap +0.73, d=+0.62, cons 58/89. Places 2–4: 1.6. `self.upgrades` and `offer` are in `obs`.

**4. When their own HP is below 35%, do top finishers boost less?** (F9) **Promising.**
Boost % of frames while below 35% HP: winners **19%** (127 / 125) vs bottom **37%** (1182); gap −18 pts, d=−0.69, cons 99/125. Places 2–4: 31% (gap W−(2–4) −12 pts, d=−0.49). Own HP and the boost command are fully observable.

**5. Do top finishers leave building cover earlier when the zone shrinks?** (new) **Uncertain.**
Measured on the 149 showdowns, first shrink at 60 s, mechs alive at shrink start, building/stadium footprints from the kit map (≤12 m or inside). Winners are near a building about as often as bottom-half survivors: **55%** (151 / 149) vs **59%** (316), d=−0.09, cons 38/90. Under kit-map tree canopy (position overlay only; trees not stated in the stream): 18% vs 20%, d=−0.06, cons 40/90. Too few mechs are both in cover and outside the next circle at shrink start (winners n=10, bottom n=16, cons 0/0) to say whether they leave cover earlier. Not a build candidate.

No Verified (high-equivalent) sensor-observable, matched-window row made this list. Whole-life cover and boost gaps look large but are confounded by early deaths (bottom median life 35.6 s).
