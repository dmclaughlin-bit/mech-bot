# Cover use

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.17 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 15:43 ET. Corpus: 93 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 868 mech-rows, 115655 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
How T01–T16 use buildings as cover, and how that shifts with phase, HP, and being engaged.

## Per-team overall

| label | n_games | mean_place | cover_pct | hold_pct | los_block_pct |
| --- | ---: | ---: | ---: | ---: | ---: |
| T01 | 67 | 7.10 | 50.7% | 12.7% | 68.9% |
| T02 | 65 | 7.20 | 67.4% | 41.8% | 73.4% |
| T03 | 32 | 7.25 | 40.2% | 20.9% | 62.6% |
| T04 | 26 | 7.46 | 52.7% | 13.6% | 71.2% |
| T05 | 21 | 7.62 | 59.9% | 42.6% | 69.6% |
| T06 | 64 | 7.78 | 59.6% | 48.9% | 69.9% |
| T07 | 78 | 7.83 | 53.0% | 44.3% | 72.4% |
| T08 | 68 | 7.94 | 52.8% | 32.9% | 63.6% |
| T09 | 54 | 7.94 | 57.9% | 40.6% | 74.9% |
| T10 | 58 | 8.19 | 55.1% | 31.0% | 68.8% |
| T11 | 76 | 8.25 | 51.9% | 26.9% | 71.4% |
| T12 | 56 | 8.25 | 72.3% | 38.7% | 81.5% |
| T13 | 50 | 8.40 | 72.9% | 51.6% | 74.1% |
| T14 | 53 | 8.60 | 42.5% | 22.2% | 70.7% |
| T15 | 39 | 8.62 | 64.8% | 43.2% | 69.2% |
| T16 | 61 | 8.67 | 58.1% | 42.1% | 64.7% |

## Cover use by state

### near-building fraction

Overall high (T01–T04) vs low (T13–T16): **55.5%** vs **59.6%** (diff -4.1 pp, Cohen's d=-0.08, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: B5b cover/heal is in the stack. Dedicated hold-behind-cover, post-kill cover, late 1+LOS cover, and wider/rear-step variants lost on the site. Do not resubmit those mechanisms.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Buildings come from the kit map, always known.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 52.6% | 55.6% | -3.0 pp | -0.06 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 64.4% | 72.2% | -7.9 pp | -0.17 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 59.4% | 85.1% | -25.7 pp | -0.58 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 70.6% | 100.0% | -29.4 pp | -1.24 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| hp=hp_ge_90 | 55.6% | 61.7% | -6.1 pp | -0.12 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 53.1% | 53.3% | -0.2 pp | -0.00 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 58.7% | 54.2% | +4.4 pp | 0.09 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 60.1% | 54.8% | +5.2 pp | 0.11 | 1405/1087 ticks, 85/84 matches | ok |
| eng=eng_0 | 56.9% | 61.5% | -4.5 pp | -0.09 | 21029/21109 ticks, 88/86 matches | ok |
| eng=eng_1 | 49.9% | 50.1% | -0.2 pp | -0.00 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 33.5% | 37.3% | -3.7 pp | -0.08 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| alive=alive_13_16 | 43.0% | 41.2% | +1.8 pp | 0.04 | 5714/7144 ticks, 88/86 matches | ok |
| alive=alive_9_12 | 54.4% | 61.3% | -6.9 pp | -0.14 | 6405/6967 ticks, 82/79 matches | ok |
| alive=alive_5_8 | 62.0% | 69.7% | -7.7 pp | -0.16 | 8475/7763 ticks, 72/68 matches | ok |
| alive=alive_2_4 | 60.0% | 73.1% | -13.0 pp | -0.28 | 5281/3133 ticks, 51/47 matches | ok |
| edge=center | 55.6% | 60.6% | -5.0 pp | -0.10 | 9549/9360 ticks, 83/75 matches | ok |
| edge=midring | 55.2% | 59.7% | -4.5 pp | -0.09 | 15645/15215 ticks, 85/85 matches | ok |
| edge=edge | 56.7% | 38.4% | +18.3 pp | 0.37 | 612/354 ticks, 36/21 matches | ok |
| edge=outside | 98.6% | 17.9% | +80.6 pp | 2.77 | 69/78 ticks, 10/5 matches | small n — no conclusion |

### hold (speed ≤ 2 m/s) fraction

Overall high (T01–T04) vs low (T13–T16): **24.6%** vs **40.1%** (diff -15.5 pp, Cohen's d=-0.34, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: Champion holds/heals in place in several modes; NO_SNEAK_ON stops healthy hide-walks.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 23.3% | 37.9% | -14.6 pp | -0.32 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 28.5% | 48.2% | -19.7 pp | -0.42 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 29.5% | 31.0% | -1.4 pp | -0.03 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 23.5% | 22.7% | +0.8 pp | 0.02 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| hp=hp_ge_90 | 26.6% | 45.0% | -18.4 pp | -0.39 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 18.2% | 21.7% | -3.5 pp | -0.09 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 27.1% | 36.1% | -9.1 pp | -0.20 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 22.6% | 29.9% | -7.3 pp | -0.17 | 1405/1087 ticks, 85/84 matches | ok |
| eng=eng_0 | 27.8% | 45.6% | -17.7 pp | -0.37 | 21029/21109 ticks, 88/86 matches | ok |
| eng=eng_1 | 10.4% | 10.7% | -0.3 pp | -0.01 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 12.2% | 4.6% | +7.6 pp | 0.28 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| alive=alive_13_16 | 14.1% | 22.3% | -8.2 pp | -0.21 | 5714/7144 ticks, 88/86 matches | ok |
| alive=alive_9_12 | 28.5% | 44.3% | -15.8 pp | -0.33 | 6405/6967 ticks, 82/79 matches | ok |
| alive=alive_5_8 | 27.3% | 50.8% | -23.5 pp | -0.50 | 8475/7763 ticks, 72/68 matches | ok |
| alive=alive_2_4 | 26.8% | 45.0% | -18.2 pp | -0.39 | 5281/3133 ticks, 51/47 matches | ok |

### LOS to nearest blocked

Overall high (T01–T04) vs low (T13–T16): **69.9%** vs **69.5%** (diff +0.4 pp, Cohen's d=0.01, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: CROSSFIRE_ON already seeks a hideSpot vs two LOS enemies.

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 68.2% | 67.1% | +1.2 pp | 0.03 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 76.0% | 77.7% | -1.7 pp | -0.04 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 50.8% | 75.6% | -24.8 pp | -0.52 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 17.6% | 81.8% | -64.2 pp | -1.67 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| eng=eng_0 | 75.5% | 74.3% | +1.2 pp | 0.03 | 21029/21109 ticks, 88/86 matches | ok |
| eng=eng_1 | 46.0% | 43.8% | +2.2 pp | 0.04 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 30.5% | 32.0% | -1.5 pp | -0.03 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| hp=hp_ge_90 | 72.6% | 72.7% | -0.1 pp | -0.00 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 65.2% | 60.4% | +4.7 pp | 0.10 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 64.5% | 62.2% | +2.3 pp | 0.05 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 63.0% | 57.6% | +5.4 pp | 0.11 | 1405/1087 ticks, 85/84 matches | ok |
| nvis=nearest_visible | 0.0% | 0.0% | +0.0 pp | 0.00 | 4260/4129 ticks, 87/84 matches | ok |
| nvis=nearest_hidden | 83.7% | 83.3% | +0.4 pp | 0.01 | 21615/20878 ticks, 88/86 matches | ok |

## What could not be measured

- Cover-to-cover travel as a planned route (we can see time near buildings, not 'this was a cover-to-cover path').
- Tree vision (trees hide vision but do not stop shots; they are excluded from this cover proxy).

