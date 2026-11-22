# Aggression and engagement

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.38 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 21:28 ET. Corpus: 128 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 975 mech-rows, 138607 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
When T01–T16 start and continue fights, at what range and HP, and how that changes with the enemy's HP, loadout, and whether the enemy is already in a fight.

## Per-team overall

| label | n_games | mean_place | hit_dealt_pct | nearest_m |
| --- | ---: | ---: | ---: | ---: |
| T01 | 98 | 6.69 | 9.2% | 138.58 |
| T02 | 65 | 7.20 | 8.9% | 117.60 |
| T03 | 32 | 7.25 | 11.1% | 136.85 |
| T04 | 26 | 7.46 | 11.0% | 142.60 |
| T05 | 43 | 7.70 | 7.5% | 115.01 |
| T06 | 80 | 7.76 | 7.8% | 125.53 |
| T07 | 87 | 7.79 | 12.1% | 128.23 |
| T08 | 43 | 7.81 | 8.1% | 102.52 |
| T09 | 101 | 7.85 | 8.3% | 118.00 |
| T10 | 71 | 7.86 | 4.7% | 131.60 |
| T11 | 24 | 7.92 | 7.5% | 106.49 |
| T12 | 36 | 8.14 | 7.6% | 121.45 |
| T13 | 58 | 8.19 | 11.8% | 122.69 |
| T14 | 76 | 8.25 | 12.3% | 128.62 |
| T15 | 41 | 8.49 | 7.2% | 104.96 |
| T16 | 94 | 8.49 | 9.5% | 121.45 |

## First time a labeled mech damages another mech

High (T01–T04) n=219 first hits: mean t=42.0 s, range=100.8 m, own HP frac=0.91, target HP frac=0.82, target already busy=18.7%.

Low (T13–T16) n=269 first hits: mean t=39.3 s, range=100.9 m, own HP frac=0.92, target HP frac=0.84, target already busy=17.1%.

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs. Target-already-busy: Enemy-is-already-fighting: not a protocol field. Implementable proxy when we can see the enemy and (a) its HP drops while we did not hit it, or (b) we also see another mech / a beam / a projectile involved with it. Unseen mid-fight third parties are not identifiable (sounds have no id).

Champion: TARGET_PICK_ON (prefers a shot we can take, short TTK, low HP, weak weapons, alone). ENGAGE_ON fight-or-flee uses ttk < 1.5×ttd when the HP retreat would fire and exactly one enemy threatens us. Finish rule: target HP ≤ one magazine, no second threat, our HP ≥ 0.35, ttk < ttd. Gun range gate 100 m unless the target is hitting us, below half HP, or not moving sideways. STANDOFF_BREAK after 60 s vs one enemy in the (45, 90) m band if our HP ≥ 0.50. CROSSFIRE_ON: with two or more enemies that have LOS, break to cover instead of trading.

## Tick-level aggression by state (including opponent state)

### share of ticks with a hit dealt this second

Overall high (T01–T04) vs low (T13–T16): **9.5%** vs **10.3%** (diff -0.8 pp, Cohen's d=-0.03, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: Champion fires under A2 / gunRange / engage rules; it does not have a separate 'only shoot a busy third party' flag.

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs. Enemy-is-already-fighting: not a protocol field. Implementable proxy when we can see the enemy and (a) its HP drops while we did not hit it, or (b) we also see another mech / a beam / a projectile involved with it. Unseen mid-fight third parties are not identifiable (sounds have no id).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 9.2% | 10.1% | -0.9 pp | -0.03 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 10.0% | 11.0% | -1.0 pp | -0.03 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 21.7% | 10.9% | +10.7 pp | 0.29 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 52.9% | 22.9% | +30.0 pp | 0.69 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| hp=hp_ge_90 | 3.4% | 3.9% | -0.5 pp | -0.03 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 21.5% | 22.4% | -1.0 pp | -0.02 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 23.8% | 25.1% | -1.3 pp | -0.03 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 26.4% | 28.7% | -2.3 pp | -0.05 | 1644/1678 ticks, 117/127 matches | ok |
| eng=eng_0 | 0.0% | 0.0% | +0.0 pp | 0.00 | 26639/27690 ticks, 122/128 matches | ok |
| eng=eng_1 | 55.2% | 56.8% | -1.7 pp | -0.03 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 57.4% | 61.3% | -3.9 pp | -0.08 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| alive=alive_13_16 | 11.5% | 13.9% | -2.4 pp | -0.07 | 6916/9276 ticks, 122/128 matches | ok |
| alive=alive_9_12 | 8.0% | 8.2% | -0.1 pp | -0.01 | 8335/9797 ticks, 112/120 matches | ok |
| alive=alive_5_8 | 8.7% | 8.7% | +0.0 pp | 0.00 | 10858/10766 ticks, 97/95 matches | ok |
| alive=alive_2_4 | 10.9% | 11.7% | -0.8 pp | -0.03 | 6076/3957 ticks, 64/58 matches | ok |
| ndist=d_lt_45 | 41.3% | 37.1% | +4.2 pp | 0.09 | 692/1130 ticks, 82/100 matches | ok |
| ndist=d_45_90 | 15.9% | 16.8% | -0.9 pp | -0.02 | 8373/10116 ticks, 121/127 matches | ok |
| ndist=d_90_160 | 8.3% | 7.4% | +1.0 pp | 0.04 | 14356/15440 ticks, 122/128 matches | ok |
| ndist=d_160_200 | 4.1% | 3.8% | +0.3 pp | 0.02 | 4297/4391 ticks, 107/112 matches | ok |
| ndist=d_ge_200 | 1.7% | 2.2% | -0.6 pp | -0.04 | 4467/2719 ticks, 82/78 matches | ok |
| nhp=hp_ge_90 | 3.6% | 4.1% | -0.6 pp | -0.03 | 20199/21669 ticks, 122/128 matches | ok |
| nhp=hp_50_90 | 17.3% | 19.8% | -2.6 pp | -0.07 | 7516/7169 ticks, 119/128 matches | ok |
| nhp=hp_30_50 | 21.4% | 20.7% | +0.6 pp | 0.02 | 2430/2787 ticks, 106/118 matches | ok |
| nhp=hp_lt_30 | 25.7% | 26.9% | -1.2 pp | -0.03 | 2040/2171 ticks, 102/117 matches | ok |
| nbusy=enemy_free | 9.6% | 10.1% | -0.5 pp | -0.02 | 28752/30414 ticks, 122/128 matches | ok |
| nbusy=enemy_busy | 9.1% | 12.3% | -3.2 pp | -0.10 | 3433/3382 ticks, 110/119 matches | ok |
| nload=gun_only | 10.0% | 11.5% | -1.5 pp | -0.05 | 8056/8854 ticks, 122/128 matches | ok |
| nload=laser | 9.1% | 9.7% | -0.6 pp | -0.02 | 15620/16865 ticks, 115/121 matches | ok |
| nload=lightning | 9.5% | 9.6% | -0.1 pp | -0.00 | 6617/7092 ticks, 97/106 matches | ok |
| nload=laser+lightning | 10.3% | 13.9% | -3.6 pp | -0.11 | 1238/331 ticks, 18/14 matches | ok |
| nload=gun+mortar | 12.4% | 16.2% | -3.8 pp | -0.11 | 654/654 ticks, 31/32 matches | ok |
| nvis=nearest_visible | 34.5% | 36.5% | -2.0 pp | -0.04 | 4966/5749 ticks, 121/128 matches | ok |
| nvis=nearest_hidden | 5.0% | 4.9% | +0.0 pp | 0.00 | 27219/28047 ticks, 122/127 matches | ok |

### mean nearest enemy (m)

Overall high (T01–T04) vs low (T13–T16): **132.64** vs **120.63** (diff +12.01, Cohen's d=0.20, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: Champion keeps fighting range via gunRange/standoff/ambush, but has no explicit 'hold 130 m' spacing rule.

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs. Distance to unseen enemies is omniscient in this metric; also see the nearest_visible slice.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 137.50 | 125.61 | +11.89 | 0.20 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 120.60 | 104.91 | +15.69 | 0.27 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 74.55 | 59.16 | +15.38 | 0.70 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 39.71 | 69.81 | -30.10 | -1.56 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| alive=alive_13_16 | 131.40 | 127.22 | +4.18 | 0.08 | 6916/9276 ticks, 122/128 matches | ok |
| alive=alive_9_12 | 137.16 | 122.85 | +14.31 | 0.24 | 8335/9797 ticks, 112/120 matches | ok |
| alive=alive_5_8 | 125.90 | 112.81 | +13.09 | 0.23 | 10858/10766 ticks, 97/95 matches | ok |
| alive=alive_2_4 | 139.88 | 120.94 | +18.94 | 0.26 | 6076/3957 ticks, 64/58 matches | ok |
| hp=hp_ge_90 | 139.29 | 127.16 | +12.13 | 0.20 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 119.02 | 108.26 | +10.76 | 0.19 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 119.07 | 104.16 | +14.91 | 0.26 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 114.36 | 103.34 | +11.02 | 0.19 | 1644/1678 ticks, 117/127 matches | ok |
| eng=eng_0 | 139.74 | 126.51 | +13.23 | 0.22 | 26639/27690 ticks, 122/128 matches | ok |
| eng=eng_1 | 98.96 | 94.47 | +4.48 | 0.10 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 86.48 | 82.78 | +3.70 | 0.10 | 197/279 ticks, 54/69 matches | small n — no conclusion |

### mean nearest-enemy HP frac (visible nearest only)

Overall high (T01–T04) vs low (T13–T16): **0.73** vs **0.73** (diff -0.00, Cohen's d=-0.01, 4966/5749 ticks, 121/128 matches, ok).

Champion P34 in this situation: Target pick already prefers low HP among visible enemies.

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 0.73 | 0.73 | -0.00 | -0.01 | 3786/4764 ticks, 120/127 matches | ok |
| phase=mid | 0.73 | 0.72 | +0.01 | 0.03 | 1084/946 ticks, 71/63 matches | ok |
| phase=late | 0.65 | 0.72 | -0.07 | -0.26 | 83/21 ticks, 8/6 matches | small n — no conclusion |
| phase=final | 0.59 | 0.54 | +0.05 | 0.17 | 13/18 ticks, 3/4 matches | small n — no conclusion |
| eng=eng_0 | 0.85 | 0.86 | -0.01 | -0.03 | 2373/2824 ticks, 118/125 matches | ok |
| eng=eng_1 | 0.61 | 0.60 | +0.01 | 0.02 | 2493/2810 ticks, 117/128 matches | ok |
| eng=eng_2plus | 0.70 | 0.67 | +0.03 | 0.10 | 100/115 ticks, 37/47 matches | small n — no conclusion |
| nbusy=enemy_free | 0.75 | 0.75 | -0.00 | -0.00 | 4440/5080 ticks, 121/128 matches | ok |
| nbusy=enemy_busy | 0.54 | 0.57 | -0.03 | -0.11 | 526/669 ticks, 85/99 matches | ok |
| ndist=d_lt_45 | 0.65 | 0.59 | +0.06 | 0.20 | 375/452 ticks, 77/95 matches | ok |
| ndist=d_45_90 | 0.70 | 0.70 | +0.00 | 0.00 | 1926/2546 ticks, 113/124 matches | ok |
| ndist=d_90_160 | 0.74 | 0.77 | -0.03 | -0.10 | 2220/2271 ticks, 119/124 matches | ok |
| ndist=d_160_200 | 0.84 | 0.83 | +0.01 | 0.05 | 445/480 ticks, 83/80 matches | ok |

## Share of mech-hits that landed on a target already under 50% HP

High: 40.7% (n=7281 hits). Low: 38.9% (n=8469 hits). This uses Watcher HP at the hit (omniscient). For the bot it is implementable only when that target is in `obs.mechs` and `show_enemy_hp` is on.

## What could not be measured

- Why a bot started a fight (intent) vs happened to be shot first.
- Exact TTK/TTD math the champion uses (we do not have each team's hit-rate or upgrade list from the stream as a bot would compute it).
- Leading shots (projectile aim lead) was not scored in this pass.

