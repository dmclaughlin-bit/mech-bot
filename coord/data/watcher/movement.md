# Movement and pathing

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.17 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 15:43 ET. Corpus: 93 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 868 mech-rows, 115655 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
How T01–T16 move: speed, boost/sprint, jet, standing/stuck time, and strafing, sliced by game state and by the nearest enemy's state.

## Per-team overall (T01–T16)

Tick fractions are the share of 1 Hz samples. Stuck is a 5 s nearly-stationary window, excluding time standing in a landed drop ring.

| label | n_games | mean_place | boost_pct | air_pct | speed_mps | stuck_pct | strafe_aim_pct | silent_pct | hold_pct |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| T01 | 67 | 7.10 | 20.5% | 1.5% | 10.09 | 3.2% | 34.4% | 18.3% | 12.7% |
| T02 | 65 | 7.20 | 8.2% | 2.3% | 4.70 | 27.3% | 17.3% | 67.8% | 41.8% |
| T03 | 32 | 7.25 | 10.9% | 7.3% | 8.97 | 4.3% | 21.2% | 24.9% | 20.9% |
| T04 | 26 | 7.46 | 12.3% | 2.2% | 8.87 | 6.5% | 23.8% | 22.8% | 13.6% |
| T05 | 21 | 7.62 | 3.9% | 0.1% | 3.88 | 29.9% | 16.0% | 79.0% | 42.6% |
| T06 | 64 | 7.78 | 5.2% | 1.4% | 3.82 | 35.0% | 14.9% | 76.1% | 48.9% |
| T07 | 78 | 7.83 | 5.2% | 1.4% | 4.53 | 32.1% | 15.3% | 69.2% | 44.3% |
| T08 | 68 | 7.94 | 11.2% | 1.2% | 5.48 | 18.3% | 20.4% | 65.3% | 32.9% |
| T09 | 54 | 7.94 | 5.4% | 1.3% | 4.38 | 26.2% | 17.4% | 72.8% | 40.6% |
| T10 | 58 | 8.19 | 8.8% | 1.9% | 6.74 | 18.5% | 17.5% | 44.7% | 31.0% |
| T11 | 76 | 8.25 | 11.0% | 3.2% | 7.80 | 8.2% | 18.7% | 35.0% | 26.9% |
| T12 | 56 | 8.25 | 8.1% | 4.9% | 6.63 | 21.0% | 25.7% | 43.3% | 38.7% |
| T13 | 50 | 8.40 | 7.6% | 0.6% | 4.38 | 37.9% | 9.5% | 70.0% | 51.6% |
| T14 | 53 | 8.60 | 10.5% | 1.3% | 8.04 | 12.0% | 18.1% | 31.8% | 22.2% |
| T15 | 39 | 8.62 | 5.5% | 0.9% | 4.50 | 29.7% | 16.3% | 70.7% | 43.2% |
| T16 | 61 | 8.67 | 5.6% | 2.0% | 4.64 | 30.3% | 16.1% | 68.6% | 42.1% |

## What could not be measured from this stream

- There is no separate body yaw: the stream has `aim_yaw` only, which the protocol calls torso aim. A 'sway the body independently of aim' test cannot be read from Watcher frames.
- Planned path vs actual path (true pathing intent, wall slides) is not in the stream. Stuck time is a proxy.
- Trees/canopy are not in the cover/LOS proxy (same limit as findings.md).

## High vs low, overall and by state

### boost fraction of ticks

Overall high (T01–T04) vs low (T13–T16): **13.6%** vs **7.3%** (diff +6.3 pp, Cohen's d=0.21, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: Boost is available. No state-conditioned boost policy is written down beyond ordinary travel; NO_SNEAK_ON means healthy movement is full walk speed. Hurt movement is capped at 5.0 m/s.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 12.9% | 6.9% | +6.1 pp | 0.20 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 15.4% | 8.5% | +6.9 pp | 0.21 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 23.2% | 13.7% | +9.5 pp | 0.24 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 29.4% | 25.0% | +4.4 pp | 0.10 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| hp=hp_ge_90 | 9.3% | 3.2% | +6.1 pp | 0.26 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 20.2% | 16.4% | +3.8 pp | 0.10 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 23.0% | 21.1% | +1.9 pp | 0.04 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 28.3% | 27.8% | +0.5 pp | 0.01 | 1405/1087 ticks, 85/84 matches | ok |
| eng=eng_0 | 8.7% | 2.4% | +6.3 pp | 0.28 | 21029/21109 ticks, 88/86 matches | ok |
| eng=eng_1 | 34.6% | 32.7% | +1.9 pp | 0.04 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 41.5% | 56.9% | -15.4 pp | -0.31 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| en=en_ge_80 | 7.5% | 3.4% | +4.2 pp | 0.19 | 19312/22238 ticks, 88/86 matches | ok |
| en=en_30_80 | 32.8% | 43.6% | -10.8 pp | -0.23 | 5359/2052 ticks, 84/85 matches | ok |
| en=en_lt_30 | 26.2% | 25.5% | +0.7 pp | 0.02 | 1204/717 ticks, 76/64 matches | ok |
| alive=alive_13_16 | 14.5% | 7.3% | +7.2 pp | 0.24 | 5714/7144 ticks, 88/86 matches | ok |
| alive=alive_9_12 | 12.3% | 7.6% | +4.7 pp | 0.16 | 6405/6967 ticks, 82/79 matches | ok |
| alive=alive_5_8 | 12.5% | 6.0% | +6.5 pp | 0.22 | 8475/7763 ticks, 72/68 matches | ok |
| alive=alive_2_4 | 16.1% | 10.0% | +6.1 pp | 0.18 | 5281/3133 ticks, 51/47 matches | ok |

### air / jet fraction of ticks

Overall high (T01–T04) vs low (T13–T16): **2.7%** vs **1.2%** (diff +1.5 pp, Cohen's d=0.11, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: Jump + jet (boost in the air) is available. No dedicated jet-hop combat policy is in the champion flags.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 2.1% | 1.1% | +1.0 pp | 0.08 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 4.5% | 1.8% | +2.8 pp | 0.16 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 4.3% | 3.0% | +1.4 pp | 0.07 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 11.8% | 0.0% | +11.8 pp | 0.70 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| hp=hp_ge_90 | 2.5% | 1.1% | +1.4 pp | 0.10 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 3.1% | 1.3% | +1.8 pp | 0.12 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 3.6% | 1.3% | +2.3 pp | 0.14 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 3.1% | 2.8% | +0.3 pp | 0.02 | 1405/1087 ticks, 85/84 matches | ok |
| eng=eng_0 | 2.4% | 1.0% | +1.5 pp | 0.11 | 21029/21109 ticks, 88/86 matches | ok |
| eng=eng_1 | 3.9% | 2.5% | +1.4 pp | 0.08 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 2.4% | 5.9% | -3.4 pp | -0.17 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| en=en_ge_80 | 2.0% | 0.9% | +1.1 pp | 0.10 | 19312/22238 ticks, 88/86 matches | ok |
| en=en_30_80 | 4.4% | 4.0% | +0.4 pp | 0.02 | 5359/2052 ticks, 84/85 matches | ok |
| en=en_lt_30 | 6.9% | 4.0% | +2.8 pp | 0.12 | 1204/717 ticks, 76/64 matches | ok |

### mean speed (m/s)

Overall high (T01–T04) vs low (T13–T16): **7.82** vs **5.36** (diff +2.46, Cohen's d=0.45, 25685/24802 ticks, 88/86 matches, ok).

Champion B113 in this situation: Healthy: full walk (NO_SNEAK_ON). Hurt (HP < 0.3 or recent damage): silent cap 5.0 m/s and hide/heal. Zone trips use zoneWalk=0.8 and a 10 s buffer.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 8.05 | 5.61 | +2.44 | 0.44 | 19183/19016 ticks, 88/86 matches | ok |
| phase=mid | 7.14 | 4.50 | +2.64 | 0.48 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 7.15 | 5.31 | +1.83 | 0.33 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 8.31 | 5.73 | +2.58 | 0.48 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| hp=hp_ge_90 | 7.41 | 4.62 | +2.79 | 0.53 | 16896/18361 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 8.76 | 7.72 | +1.04 | 0.19 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 7.91 | 6.51 | +1.40 | 0.24 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 8.82 | 7.63 | +1.19 | 0.19 | 1405/1087 ticks, 85/84 matches | ok |
| eng=eng_0 | 7.31 | 4.62 | +2.69 | 0.51 | 20839/20904 ticks, 88/86 matches | ok |
| eng=eng_1 | 9.99 | 9.25 | +0.73 | 0.14 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 10.13 | 10.09 | +0.04 | 0.01 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| alive=alive_13_16 | 9.18 | 7.33 | +1.85 | 0.35 | 5524/6939 ticks, 88/86 matches | ok |
| alive=alive_9_12 | 7.29 | 4.82 | +2.47 | 0.45 | 6405/6967 ticks, 82/79 matches | ok |
| alive=alive_5_8 | 7.51 | 4.22 | +3.29 | 0.61 | 8475/7763 ticks, 72/68 matches | ok |
| alive=alive_2_4 | 7.54 | 4.98 | +2.57 | 0.46 | 5281/3133 ticks, 51/47 matches | ok |
| edge=center | 7.54 | 5.71 | +1.83 | 0.33 | 9495/9304 ticks, 83/75 matches | ok |
| edge=midring | 7.93 | 5.10 | +2.83 | 0.52 | 15509/15066 ticks, 85/85 matches | ok |
| edge=edge | 9.07 | 7.74 | +1.33 | 0.26 | 612/354 ticks, 36/21 matches | ok |
| edge=outside | 10.78 | 2.21 | +8.57 | 2.15 | 69/78 ticks, 10/5 matches | small n — no conclusion |

### stuck fraction (≈5 s almost unmoved, not in a drop ring)

Overall high (T01–T04) vs low (T13–T16): **12.5%** vs **27.9%** (diff -15.3 pp, Cohen's d=-0.39, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: Nav paths exist; there is no separate unstuck policy in params. Movement builds that tried random strafe / combined movement are on hold and were sim-only as of this writing.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 12.5% | 25.6% | -13.1 pp | -0.34 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 12.3% | 36.5% | -24.1 pp | -0.59 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 16.9% | 6.0% | +11.0 pp | 0.34 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 5.9% | 11.4% | -5.5 pp | -0.18 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| hp=hp_ge_90 | 16.7% | 34.7% | -18.0 pp | -0.42 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 3.7% | 6.8% | -3.1 pp | -0.14 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 6.7% | 13.2% | -6.5 pp | -0.22 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 4.3% | 6.7% | -2.4 pp | -0.11 | 1405/1087 ticks, 85/84 matches | ok |
| eng=eng_0 | 15.4% | 33.0% | -17.6 pp | -0.42 | 21029/21109 ticks, 88/86 matches | ok |
| eng=eng_1 | 0.2% | 0.0% | +0.2 pp | 0.06 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 0.6% | 0.0% | +0.6 pp | 0.11 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| edge=center | 16.1% | 24.2% | -8.1 pp | -0.20 | 9549/9360 ticks, 83/75 matches | ok |
| edge=midring | 10.7% | 30.3% | -19.6 pp | -0.50 | 15645/15215 ticks, 85/85 matches | ok |
| edge=edge | 4.2% | 11.3% | -7.1 pp | -0.28 | 612/354 ticks, 36/21 matches | ok |
| edge=outside | 0.0% | 61.5% | -61.5 pp | -1.74 | 69/78 ticks, 10/5 matches | small n — no conclusion |
| alive=alive_13_16 | 5.1% | 8.8% | -3.8 pp | -0.15 | 5714/7144 ticks, 88/86 matches | ok |
| alive=alive_9_12 | 18.5% | 31.6% | -13.1 pp | -0.31 | 6405/6967 ticks, 82/79 matches | ok |
| alive=alive_5_8 | 14.0% | 40.7% | -26.7 pp | -0.63 | 8475/7763 ticks, 72/68 matches | ok |
| alive=alive_2_4 | 11.0% | 30.9% | -19.9 pp | -0.53 | 5281/3133 ticks, 51/47 matches | ok |

### strafe vs aim (moving ≥2 m/s, heading 60–120° from torso aim)

Overall high (T01–T04) vs low (T13–T16): **25.0%** vs **14.9%** (diff +10.1 pp, Cohen's d=0.26, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: No calibrated strafe in the champion. A movement build is on hold (B116). Sim-only strafe-only screened worse than the champion; combined movement was mixed and failed the drop-reach / late-survival bar.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Heading vs aim is fully known.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 24.8% | 15.5% | +9.4 pp | 0.23 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 25.6% | 12.5% | +13.1 pp | 0.34 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 24.0% | 22.6% | +1.4 pp | 0.03 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 17.6% | 27.3% | -9.6 pp | -0.22 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| eng=eng_0 | 24.8% | 12.9% | +11.9 pp | 0.31 | 21029/21109 ticks, 88/86 matches | ok |
| eng=eng_1 | 25.6% | 25.4% | +0.2 pp | 0.00 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 28.0% | 21.6% | +6.5 pp | 0.15 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| hp=hp_ge_90 | 24.6% | 12.9% | +11.7 pp | 0.31 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 26.9% | 21.2% | +5.7 pp | 0.13 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 21.5% | 20.1% | +1.4 pp | 0.04 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 26.8% | 19.2% | +7.6 pp | 0.18 | 1405/1087 ticks, 85/84 matches | ok |
| ndist=d_lt_45 | 28.1% | 20.1% | +8.0 pp | 0.19 | 631/688 ticks, 70/67 matches | ok |
| ndist=d_45_90 | 22.7% | 15.9% | +6.8 pp | 0.17 | 7262/6922 ticks, 88/86 matches | ok |
| ndist=d_90_160 | 25.7% | 15.5% | +10.3 pp | 0.26 | 11636/11544 ticks, 88/86 matches | ok |
| ndist=d_160_200 | 24.5% | 13.6% | +10.9 pp | 0.28 | 3188/3406 ticks, 77/77 matches | ok |
| ndist=d_ge_200 | 27.5% | 9.3% | +18.2 pp | 0.47 | 3158/2447 ticks, 57/65 matches | ok |

### strafe vs nearest enemy

Overall high (T01–T04) vs low (T13–T16): **24.0%** vs **18.3%** (diff +5.7 pp, Cohen's d=0.14, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: Same as above: no champion strafe policy.

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| eng=eng_0 | 23.3% | 16.8% | +6.5 pp | 0.16 | 21029/21109 ticks, 88/86 matches | ok |
| eng=eng_1 | 27.2% | 26.4% | +0.9 pp | 0.02 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 26.8% | 30.1% | -3.2 pp | -0.07 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| hp=hp_ge_90 | 23.3% | 16.8% | +6.5 pp | 0.16 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 26.8% | 23.9% | +2.9 pp | 0.07 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 21.1% | 20.4% | +0.7 pp | 0.02 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 25.2% | 21.7% | +3.5 pp | 0.08 | 1405/1087 ticks, 85/84 matches | ok |
| ndist=d_lt_45 | 24.6% | 21.4% | +3.2 pp | 0.08 | 631/688 ticks, 70/67 matches | ok |
| ndist=d_45_90 | 22.6% | 19.5% | +3.1 pp | 0.08 | 7262/6922 ticks, 88/86 matches | ok |
| ndist=d_90_160 | 24.5% | 18.6% | +5.8 pp | 0.14 | 11636/11544 ticks, 88/86 matches | ok |
| ndist=d_160_200 | 24.5% | 17.5% | +7.0 pp | 0.17 | 3188/3406 ticks, 77/77 matches | ok |
| ndist=d_ge_200 | 25.2% | 14.2% | +11.1 pp | 0.28 | 3158/2447 ticks, 57/65 matches | ok |
| nvis=nearest_visible | 22.7% | 20.3% | +2.4 pp | 0.06 | 4260/4129 ticks, 87/84 matches | ok |
| nvis=nearest_hidden | 24.3% | 17.9% | +6.3 pp | 0.16 | 21615/20878 ticks, 88/86 matches | ok |

### silent (speed ≤ 5 m/s) fraction

Overall high (T01–T04) vs low (T13–T16): **37.8%** vs **60.6%** (diff -22.8 pp, Cohen's d=-0.47, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: Champion applies the 5.0 m/s cap only while hurt (NO_SNEAK_ON).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 36.1% | 58.3% | -22.2 pp | -0.46 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 42.9% | 68.5% | -25.7 pp | -0.53 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 45.3% | 63.1% | -17.8 pp | -0.36 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 29.4% | 56.8% | -27.4 pp | -0.57 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| hp=hp_ge_90 | 41.6% | 67.8% | -26.3 pp | -0.55 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 29.4% | 37.9% | -8.5 pp | -0.18 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 34.9% | 46.8% | -11.9 pp | -0.24 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 29.5% | 38.5% | -9.0 pp | -0.19 | 1405/1087 ticks, 85/84 matches | ok |
| eng=eng_0 | 42.2% | 67.7% | -25.5 pp | -0.53 | 21029/21109 ticks, 88/86 matches | ok |
| eng=eng_1 | 18.5% | 22.3% | -3.9 pp | -0.10 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 20.1% | 19.6% | +0.5 pp | 0.01 | 164/153 ticks, 45/46 matches | small n — no conclusion |

