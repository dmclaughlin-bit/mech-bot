# Aggression and engagement

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.17 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 15:43 ET. Corpus: 93 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 868 mech-rows, 115655 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
When T01–T16 start and continue fights, at what range and HP, and how that changes with the enemy's HP, loadout, and whether the enemy is already in a fight.

## Per-team overall

| label | n_games | mean_place | hit_dealt_pct | nearest_m |
| --- | ---: | ---: | ---: | ---: |
| T01 | 67 | 7.10 | 11.0% | 129.77 |
| T02 | 65 | 7.20 | 8.9% | 117.60 |
| T03 | 32 | 7.25 | 11.1% | 136.85 |
| T04 | 26 | 7.46 | 11.0% | 142.60 |
| T05 | 21 | 7.62 | 7.1% | 106.35 |
| T06 | 64 | 7.78 | 6.9% | 119.18 |
| T07 | 78 | 7.83 | 7.9% | 126.25 |
| T08 | 68 | 7.94 | 8.6% | 113.93 |
| T09 | 54 | 7.94 | 7.4% | 119.22 |
| T10 | 58 | 8.19 | 11.8% | 122.69 |
| T11 | 76 | 8.25 | 12.3% | 128.62 |
| T12 | 56 | 8.25 | 11.5% | 133.65 |
| T13 | 50 | 8.40 | 5.9% | 136.95 |
| T14 | 53 | 8.60 | 13.4% | 121.52 |
| T15 | 39 | 8.62 | 8.4% | 114.30 |
| T16 | 61 | 8.67 | 7.8% | 119.46 |

## First time a labeled mech damages another mech

High (T01–T04) n=185 first hits: mean t=33.3 s, range=100.3 m, own HP frac=0.92, target HP frac=0.83, target already busy=19.5%.

Low (T13–T16) n=202 first hits: mean t=47.5 s, range=91.9 m, own HP frac=0.91, target HP frac=0.85, target already busy=15.3%.

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs. Target-already-busy: Enemy-is-already-fighting: not a protocol field. Implementable proxy when we can see the enemy and (a) its HP drops while we did not hit it, or (b) we also see another mech / a beam / a projectile involved with it. Unseen mid-fight third parties are not identifiable (sounds have no id).

Champion: TARGET_PICK_ON (prefers a shot we can take, short TTK, low HP, weak weapons, alone). ENGAGE_ON fight-or-flee uses ttk < 1.5×ttd when the HP retreat would fire and exactly one enemy threatens us. Finish rule: target HP ≤ one magazine, no second threat, our HP ≥ 0.35, ttk < ttd. Gun range gate 100 m unless the target is hitting us, below half HP, or not moving sideways. STANDOFF_BREAK after 60 s vs one enemy in the (45, 90) m band if our HP ≥ 0.50. CROSSFIRE_ON: with two or more enemies that have LOS, break to cover instead of trading.

## Tick-level aggression by state (including opponent state)

### share of ticks with a hit dealt this second

Overall high (T01–T04) vs low (T13–T16): **10.3%** vs **8.7%** (diff +1.5 pp, Cohen's d=0.05, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: Champion fires under A2 / gunRange / engage rules; it does not have a separate 'only shoot a busy third party' flag.

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs. Enemy-is-already-fighting: not a protocol field. Implementable proxy when we can see the enemy and (a) its HP drops while we did not hit it, or (b) we also see another mech / a beam / a projectile involved with it. Unseen mid-fight third parties are not identifiable (sounds have no id).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 10.2% | 8.9% | +1.3 pp | 0.05 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 9.8% | 7.8% | +2.0 pp | 0.07 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 21.7% | 17.9% | +3.8 pp | 0.09 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 52.9% | 20.5% | +32.5 pp | 0.75 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| hp=hp_ge_90 | 3.7% | 3.0% | +0.7 pp | 0.04 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 21.7% | 23.5% | -1.8 pp | -0.04 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 24.5% | 26.9% | -2.4 pp | -0.05 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 26.1% | 29.6% | -3.5 pp | -0.08 | 1405/1087 ticks, 85/84 matches | ok |
| eng=eng_0 | 0.0% | 0.0% | +0.0 pp | 0.00 | 21029/21109 ticks, 88/86 matches | ok |
| eng=eng_1 | 54.9% | 56.1% | -1.2 pp | -0.02 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 53.7% | 54.2% | -0.6 pp | -0.01 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| alive=alive_13_16 | 12.6% | 11.3% | +1.3 pp | 0.04 | 5714/7144 ticks, 88/86 matches | ok |
| alive=alive_9_12 | 9.1% | 8.5% | +0.6 pp | 0.02 | 6405/6967 ticks, 82/79 matches | ok |
| alive=alive_5_8 | 9.3% | 6.0% | +3.3 pp | 0.12 | 8475/7763 ticks, 72/68 matches | ok |
| alive=alive_2_4 | 10.7% | 10.2% | +0.4 pp | 0.01 | 5281/3133 ticks, 51/47 matches | ok |
| ndist=d_lt_45 | 42.8% | 42.2% | +0.6 pp | 0.01 | 631/688 ticks, 70/67 matches | ok |
| ndist=d_45_90 | 15.8% | 15.9% | -0.1 pp | -0.00 | 7262/6922 ticks, 88/86 matches | ok |
| ndist=d_90_160 | 8.7% | 6.0% | +2.7 pp | 0.10 | 11636/11544 ticks, 88/86 matches | ok |
| ndist=d_160_200 | 4.8% | 2.2% | +2.7 pp | 0.15 | 3188/3406 ticks, 77/77 matches | ok |
| ndist=d_ge_200 | 2.2% | 1.2% | +1.1 pp | 0.08 | 3158/2447 ticks, 57/65 matches | ok |
| nhp=hp_ge_90 | 3.9% | 3.5% | +0.4 pp | 0.02 | 16073/16812 ticks, 88/86 matches | ok |
| nhp=hp_50_90 | 18.3% | 18.9% | -0.6 pp | -0.02 | 6075/4857 ticks, 86/85 matches | ok |
| nhp=hp_30_50 | 22.7% | 19.6% | +3.1 pp | 0.08 | 2009/1885 ticks, 77/79 matches | ok |
| nhp=hp_lt_30 | 26.7% | 21.1% | +5.6 pp | 0.13 | 1718/1453 ticks, 77/74 matches | ok |
| nbusy=enemy_free | 10.3% | 8.6% | +1.7 pp | 0.06 | 23023/22483 ticks, 88/86 matches | ok |
| nbusy=enemy_busy | 9.9% | 10.2% | -0.3 pp | -0.01 | 2852/2524 ticks, 84/77 matches | ok |
| nload=gun_only | 10.6% | 9.0% | +1.5 pp | 0.05 | 7140/7281 ticks, 88/86 matches | ok |
| nload=laser | 10.0% | 8.1% | +1.8 pp | 0.06 | 11427/11145 ticks, 84/83 matches | ok |
| nload=lightning | 10.1% | 8.7% | +1.4 pp | 0.05 | 5512/5777 ticks, 71/72 matches | ok |
| nload=laser+lightning | 10.3% | 12.3% | -1.9 pp | -0.06 | 1238/269 ticks, 18/7 matches | small n — no conclusion |
| nload=gun+mortar | 14.5% | 15.3% | -0.8 pp | -0.02 | 558/535 ticks, 27/28 matches | ok |
| nvis=nearest_visible | 35.0% | 32.1% | +2.9 pp | 0.06 | 4260/4129 ticks, 87/84 matches | ok |
| nvis=nearest_hidden | 5.4% | 4.1% | +1.3 pp | 0.06 | 21615/20878 ticks, 88/86 matches | ok |

### mean nearest enemy (m)

Overall high (T01–T04) vs low (T13–T16): **127.92** vs **123.60** (diff +4.32, Cohen's d=0.07, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: Champion keeps fighting range via gunRange/standoff/ambush, but has no explicit 'hold 130 m' spacing rule.

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs. Distance to unseen enemies is omniscient in this metric; also see the nearest_visible slice.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 130.33 | 127.98 | +2.36 | 0.04 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 122.84 | 110.14 | +12.70 | 0.21 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 74.55 | 85.08 | -10.53 | -0.47 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 39.71 | 65.88 | -26.18 | -1.44 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| alive=alive_13_16 | 124.83 | 128.98 | -4.15 | -0.09 | 5714/7144 ticks, 88/86 matches | ok |
| alive=alive_9_12 | 126.09 | 122.83 | +3.26 | 0.06 | 6405/6967 ticks, 82/79 matches | ok |
| alive=alive_5_8 | 123.03 | 120.24 | +2.79 | 0.05 | 8475/7763 ticks, 72/68 matches | ok |
| alive=alive_2_4 | 141.34 | 121.39 | +19.95 | 0.27 | 5281/3133 ticks, 51/47 matches | ok |
| hp=hp_ge_90 | 133.06 | 130.46 | +2.60 | 0.04 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 118.82 | 103.50 | +15.32 | 0.27 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 119.07 | 103.74 | +15.33 | 0.26 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 113.02 | 105.25 | +7.77 | 0.14 | 1405/1087 ticks, 85/84 matches | ok |
| eng=eng_0 | 134.72 | 129.81 | +4.91 | 0.08 | 21029/21109 ticks, 88/86 matches | ok |
| eng=eng_1 | 98.80 | 90.43 | +8.37 | 0.19 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 88.32 | 79.66 | +8.66 | 0.27 | 164/153 ticks, 45/46 matches | small n — no conclusion |

### mean nearest-enemy HP frac (visible nearest only)

Overall high (T01–T04) vs low (T13–T16): **0.72** vs **0.76** (diff -0.04, Cohen's d=-0.12, 4260/4129 ticks, 87/84 matches, ok).

Champion B113 in this situation: Target pick already prefers low HP among visible enemies.

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 0.72 | 0.75 | -0.03 | -0.11 | 3357/3356 ticks, 87/83 matches | ok |
| phase=mid | 0.73 | 0.77 | -0.04 | -0.15 | 807/733 ticks, 51/45 matches | ok |
| phase=late | 0.65 | 0.80 | -0.16 | -0.56 | 83/32 ticks, 8/6 matches | small n — no conclusion |
| phase=final | 0.59 | 0.79 | -0.20 | -0.80 | 13/8 ticks, 3/2 matches | small n — no conclusion |
| eng=eng_0 | 0.85 | 0.87 | -0.02 | -0.08 | 1988/2236 ticks, 84/81 matches | ok |
| eng=eng_1 | 0.60 | 0.62 | -0.01 | -0.05 | 2191/1830 ticks, 86/84 matches | ok |
| eng=eng_2plus | 0.70 | 0.73 | -0.02 | -0.09 | 81/63 ticks, 29/28 matches | small n — no conclusion |
| nbusy=enemy_free | 0.74 | 0.78 | -0.03 | -0.12 | 3782/3670 ticks, 87/84 matches | ok |
| nbusy=enemy_busy | 0.54 | 0.57 | -0.04 | -0.13 | 478/459 ticks, 70/65 matches | ok |
| ndist=d_lt_45 | 0.64 | 0.58 | +0.06 | 0.21 | 355/317 ticks, 68/61 matches | ok |
| ndist=d_45_90 | 0.69 | 0.71 | -0.01 | -0.05 | 1678/1646 ticks, 84/81 matches | ok |
| ndist=d_90_160 | 0.74 | 0.82 | -0.08 | -0.28 | 1878/1817 ticks, 85/82 matches | ok |
| ndist=d_160_200 | 0.83 | 0.82 | +0.01 | 0.03 | 349/349 ticks, 57/55 matches | ok |

## Share of mech-hits that landed on a target already under 50% HP

High: 41.3% (n=6340 hits). Low: 37.4% (n=5426 hits). This uses Watcher HP at the hit (omniscient). For the bot it is implementable only when that target is in `obs.mechs` and `show_enemy_hp` is on.

## What could not be measured

- Why a bot started a fight (intent) vs happened to be shot first.
- Exact TTK/TTD math the champion uses (we do not have each team's hit-rate or upgrade list from the stream as a bot would compute it).
- Leading shots (projectile aim lead) was not scored in this pass.

