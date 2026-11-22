# Cover use

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.38 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 21:29 ET. Corpus: 128 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 975 mech-rows, 138607 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
How T01–T16 use buildings as cover, and how that shifts with phase, HP, and being engaged.

## Per-team overall

| label | n_games | mean_place | cover_pct | hold_pct | los_block_pct |
| --- | ---: | ---: | ---: | ---: | ---: |
| T01 | 98 | 6.69 | 50.5% | 12.0% | 69.8% |
| T02 | 65 | 7.20 | 67.4% | 41.8% | 73.4% |
| T03 | 32 | 7.25 | 40.2% | 20.9% | 62.6% |
| T04 | 26 | 7.46 | 52.7% | 13.6% | 71.2% |
| T05 | 43 | 7.70 | 59.0% | 38.2% | 71.9% |
| T06 | 80 | 7.76 | 53.8% | 45.2% | 72.0% |
| T07 | 87 | 7.79 | 70.3% | 39.3% | 80.2% |
| T08 | 43 | 7.81 | 63.1% | 47.5% | 67.3% |
| T09 | 101 | 7.85 | 51.3% | 36.3% | 65.0% |
| T10 | 71 | 7.86 | 72.9% | 43.9% | 74.2% |
| T11 | 24 | 7.92 | 59.2% | 45.8% | 71.1% |
| T12 | 36 | 8.14 | 56.9% | 36.8% | 65.0% |
| T13 | 58 | 8.19 | 55.1% | 31.0% | 68.8% |
| T14 | 76 | 8.25 | 51.9% | 26.9% | 71.4% |
| T15 | 41 | 8.49 | 61.0% | 44.2% | 70.3% |
| T16 | 94 | 8.49 | 55.3% | 42.4% | 67.6% |

## Cover use by state

### near-building fraction

Overall high (T01–T04) vs low (T13–T16): **54.5%** vs **55.4%** (diff -0.9 pp, Cohen's d=-0.02, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: B5b cover/heal is in the stack. Dedicated hold-behind-cover, post-kill cover, late 1+LOS cover, and wider/rear-step variants lost on the site. Do not resubmit those mechanisms.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Buildings come from the kit map, always known.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 52.1% | 50.5% | +1.6 pp | 0.03 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 61.3% | 71.5% | -10.2 pp | -0.22 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 59.4% | 94.5% | -35.1 pp | -0.87 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 70.6% | 81.9% | -11.3 pp | -0.29 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| hp=hp_ge_90 | 54.5% | 56.8% | -2.2 pp | -0.04 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 52.8% | 51.5% | +1.3 pp | 0.03 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 56.6% | 51.5% | +5.1 pp | 0.10 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 57.5% | 56.9% | +0.7 pp | 0.01 | 1644/1678 ticks, 117/127 matches | ok |
| eng=eng_0 | 55.7% | 57.5% | -1.9 pp | -0.04 | 26639/27690 ticks, 122/128 matches | ok |
| eng=eng_1 | 49.3% | 45.8% | +3.6 pp | 0.07 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 35.0% | 39.4% | -4.4 pp | -0.09 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| alive=alive_13_16 | 42.5% | 37.5% | +5.0 pp | 0.10 | 6916/9276 ticks, 122/128 matches | ok |
| alive=alive_9_12 | 54.0% | 56.8% | -2.8 pp | -0.06 | 8335/9797 ticks, 112/120 matches | ok |
| alive=alive_5_8 | 60.1% | 64.7% | -4.6 pp | -0.10 | 10858/10766 ticks, 97/95 matches | ok |
| alive=alive_2_4 | 58.6% | 68.1% | -9.4 pp | -0.20 | 6076/3957 ticks, 64/58 matches | ok |
| edge=center | 55.5% | 56.6% | -1.1 pp | -0.02 | 11181/12857 ticks, 109/118 matches | ok |
| edge=midring | 54.0% | 55.4% | -1.3 pp | -0.03 | 19015/19949 ticks, 118/123 matches | ok |
| edge=edge | 51.3% | 43.0% | +8.3 pp | 0.17 | 1906/838 ticks, 57/34 matches | ok |
| edge=outside | 98.8% | 21.7% | +77.1 pp | 2.28 | 83/152 ticks, 12/7 matches | small n — no conclusion |

### hold (speed ≤ 2 m/s) fraction

Overall high (T01–T04) vs low (T13–T16): **21.9%** vs **36.4%** (diff -14.4 pp, Cohen's d=-0.32, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: Champion holds/heals in place in several modes; NO_SNEAK_ON stops healthy hide-walks.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 20.7% | 33.7% | -13.0 pp | -0.29 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 25.3% | 45.9% | -20.6 pp | -0.44 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 29.5% | 43.2% | -13.6 pp | -0.29 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 23.5% | 18.1% | +5.5 pp | 0.14 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| hp=hp_ge_90 | 23.3% | 38.2% | -15.0 pp | -0.33 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 16.9% | 26.6% | -9.8 pp | -0.24 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 25.3% | 41.6% | -16.3 pp | -0.35 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 20.2% | 43.2% | -23.0 pp | -0.51 | 1644/1678 ticks, 117/127 matches | ok |
| eng=eng_0 | 24.5% | 41.5% | -17.0 pp | -0.37 | 26639/27690 ticks, 122/128 matches | ok |
| eng=eng_1 | 9.6% | 13.6% | -4.0 pp | -0.13 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 10.2% | 5.0% | +5.1 pp | 0.20 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| alive=alive_13_16 | 12.8% | 20.0% | -7.2 pp | -0.19 | 6916/9276 ticks, 122/128 matches | ok |
| alive=alive_9_12 | 23.9% | 39.9% | -16.0 pp | -0.35 | 8335/9797 ticks, 112/120 matches | ok |
| alive=alive_5_8 | 24.5% | 46.5% | -22.0 pp | -0.47 | 10858/10766 ticks, 97/95 matches | ok |
| alive=alive_2_4 | 25.0% | 38.6% | -13.5 pp | -0.30 | 6076/3957 ticks, 64/58 matches | ok |

### LOS to nearest blocked

Overall high (T01–T04) vs low (T13–T16): **70.2%** vs **69.3%** (diff +0.9 pp, Cohen's d=0.02, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: CROSSFIRE_ON already seeks a hideSpot vs two LOS enemies.

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 68.9% | 67.0% | +1.9 pp | 0.04 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 74.7% | 77.0% | -2.3 pp | -0.05 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 50.8% | 88.0% | -37.2 pp | -0.85 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 17.6% | 73.5% | -55.8 pp | -1.29 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| eng=eng_0 | 75.3% | 74.9% | +0.4 pp | 0.01 | 26639/27690 ticks, 122/128 matches | ok |
| eng=eng_1 | 46.3% | 44.5% | +1.8 pp | 0.04 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 27.4% | 30.1% | -2.7 pp | -0.06 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| hp=hp_ge_90 | 72.6% | 71.9% | +0.7 pp | 0.02 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 65.1% | 65.0% | +0.0 pp | 0.00 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 65.4% | 64.1% | +1.3 pp | 0.03 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 64.2% | 58.6% | +5.6 pp | 0.12 | 1644/1678 ticks, 117/127 matches | ok |
| nvis=nearest_visible | 0.0% | 0.0% | +0.0 pp | 0.00 | 4966/5749 ticks, 121/128 matches | ok |
| nvis=nearest_hidden | 83.0% | 83.5% | -0.5 pp | -0.01 | 27219/28047 ticks, 122/127 matches | ok |

## What could not be measured

- Cover-to-cover travel as a planned route (we can see time near buildings, not 'this was a cover-to-cover path').
- Tree vision (trees hide vision but do not stop shots; they are excluded from this cover proxy).

