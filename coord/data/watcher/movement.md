# Movement and pathing

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.38 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 21:28 ET. Corpus: 128 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 975 mech-rows, 138607 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
How T01–T16 move: speed, boost/sprint, jet, standing/stuck time, and strafing, sliced by game state and by the nearest enemy's state.

## Per-team overall (T01–T16)

Tick fractions are the share of 1 Hz samples. Stuck is a 5 s nearly-stationary window, excluding time standing in a landed drop ring.

| label | n_games | mean_place | boost_pct | air_pct | speed_mps | stuck_pct | strafe_aim_pct | silent_pct | hold_pct |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| T01 | 98 | 6.69 | 20.1% | 1.2% | 10.21 | 2.9% | 35.5% | 17.9% | 12.0% |
| T02 | 65 | 7.20 | 8.2% | 2.3% | 4.70 | 27.3% | 17.3% | 67.8% | 41.8% |
| T03 | 32 | 7.25 | 10.9% | 7.3% | 8.97 | 4.3% | 21.2% | 24.9% | 20.9% |
| T04 | 26 | 7.46 | 12.3% | 2.2% | 8.87 | 6.5% | 23.8% | 22.8% | 13.6% |
| T05 | 43 | 7.70 | 9.3% | 2.1% | 4.66 | 23.5% | 19.6% | 73.1% | 38.2% |
| T06 | 80 | 7.76 | 5.1% | 1.4% | 4.45 | 33.1% | 15.0% | 69.7% | 45.2% |
| T07 | 87 | 7.79 | 8.4% | 4.1% | 6.66 | 19.8% | 24.4% | 43.1% | 39.3% |
| T08 | 43 | 7.81 | 5.6% | 0.6% | 4.03 | 32.3% | 15.8% | 73.8% | 47.5% |
| T09 | 101 | 7.85 | 11.0% | 1.1% | 5.21 | 22.1% | 19.8% | 67.1% | 36.3% |
| T10 | 71 | 7.86 | 7.9% | 2.1% | 4.60 | 29.0% | 11.6% | 73.7% | 43.9% |
| T11 | 24 | 7.92 | 4.5% | 0.2% | 3.98 | 32.9% | 15.0% | 75.8% | 45.8% |
| T12 | 36 | 8.14 | 11.6% | 0.7% | 5.30 | 21.8% | 19.3% | 66.8% | 36.8% |
| T13 | 58 | 8.19 | 8.8% | 1.9% | 6.74 | 18.5% | 17.5% | 44.7% | 31.0% |
| T14 | 76 | 8.25 | 11.0% | 3.2% | 7.80 | 8.2% | 18.7% | 35.0% | 26.9% |
| T15 | 41 | 8.49 | 4.4% | 0.3% | 3.79 | 32.0% | 15.8% | 79.3% | 44.2% |
| T16 | 94 | 8.49 | 8.3% | 3.6% | 5.16 | 28.0% | 15.6% | 62.4% | 42.4% |

## What could not be measured from this stream

- There is no separate body yaw: the stream has `aim_yaw` only, which the protocol calls torso aim. A 'sway the body independently of aim' test cannot be read from Watcher frames.
- Planned path vs actual path (true pathing intent, wall slides) is not in the stream. Stuck time is a proxy.
- Trees/canopy are not in the cover/LOS proxy (same limit as findings.md).

## High vs low, overall and by state

### boost fraction of ticks

Overall high (T01–T04) vs low (T13–T16): **14.8%** vs **8.4%** (diff +6.4 pp, Cohen's d=0.20, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: Boost is available. No state-conditioned boost policy is written down beyond ordinary travel; NO_SNEAK_ON means healthy movement is full walk speed. Hurt movement is capped at 5.0 m/s.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 13.5% | 8.0% | +5.5 pp | 0.18 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 18.2% | 9.7% | +8.5 pp | 0.25 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 23.2% | 6.0% | +17.2 pp | 0.48 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 29.4% | 24.1% | +5.3 pp | 0.12 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| hp=hp_ge_90 | 11.0% | 4.7% | +6.3 pp | 0.24 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 20.9% | 13.8% | +7.1 pp | 0.19 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 23.5% | 17.9% | +5.6 pp | 0.14 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 30.0% | 24.1% | +5.9 pp | 0.13 | 1644/1678 ticks, 117/127 matches | ok |
| eng=eng_0 | 10.3% | 3.9% | +6.4 pp | 0.25 | 26639/27690 ticks, 122/128 matches | ok |
| eng=eng_1 | 35.8% | 27.9% | +7.9 pp | 0.17 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 47.7% | 49.5% | -1.7 pp | -0.03 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| en=en_ge_80 | 8.3% | 4.6% | +3.7 pp | 0.15 | 22939/29995 ticks, 122/128 matches | ok |
| en=en_30_80 | 32.0% | 42.4% | -10.4 pp | -0.22 | 7433/3069 ticks, 118/126 matches | ok |
| en=en_lt_30 | 26.5% | 20.8% | +5.8 pp | 0.13 | 1813/732 ticks, 107/84 matches | ok |
| alive=alive_13_16 | 15.3% | 8.1% | +7.2 pp | 0.23 | 6916/9276 ticks, 122/128 matches | ok |
| alive=alive_9_12 | 13.1% | 7.4% | +5.6 pp | 0.19 | 8335/9797 ticks, 112/120 matches | ok |
| alive=alive_5_8 | 14.1% | 9.0% | +5.1 pp | 0.16 | 10858/10766 ticks, 97/95 matches | ok |
| alive=alive_2_4 | 17.7% | 9.7% | +8.1 pp | 0.23 | 6076/3957 ticks, 64/58 matches | ok |

### air / jet fraction of ticks

Overall high (T01–T04) vs low (T13–T16): **2.3%** vs **2.6%** (diff -0.2 pp, Cohen's d=-0.01, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: Jump + jet (boost in the air) is available. No dedicated jet-hop combat policy is in the champion flags. P40b (ROOF_JET_ROUTE_ON) is building for roof-loot pathing only, not combat jet-hops.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 1.8% | 2.6% | -0.8 pp | -0.05 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 3.8% | 2.4% | +1.4 pp | 0.08 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 4.3% | 3.8% | +0.5 pp | 0.03 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 11.8% | 0.0% | +11.8 pp | 0.90 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| hp=hp_ge_90 | 2.1% | 2.6% | -0.5 pp | -0.03 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 2.8% | 2.5% | +0.2 pp | 0.01 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 3.2% | 1.7% | +1.6 pp | 0.10 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 2.7% | 3.1% | -0.4 pp | -0.02 | 1644/1678 ticks, 117/127 matches | ok |
| eng=eng_0 | 2.1% | 2.4% | -0.3 pp | -0.02 | 26639/27690 ticks, 122/128 matches | ok |
| eng=eng_1 | 3.5% | 3.3% | +0.3 pp | 0.01 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 2.0% | 7.5% | -5.5 pp | -0.25 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| en=en_ge_80 | 1.8% | 1.8% | -0.0 pp | -0.00 | 22939/29995 ticks, 122/128 matches | ok |
| en=en_30_80 | 3.3% | 8.0% | -4.7 pp | -0.22 | 7433/3069 ticks, 118/126 matches | ok |
| en=en_lt_30 | 5.6% | 11.9% | -6.3 pp | -0.24 | 1813/732 ticks, 107/84 matches | ok |

### mean speed (m/s)

Overall high (T01–T04) vs low (T13–T16): **8.33** vs **5.93** (diff +2.40, Cohen's d=0.43, 31961/33524 ticks, 122/128 matches, ok).

Champion P34 in this situation: Healthy: full walk (NO_SNEAK_ON). Hurt (HP < 0.3 or recent damage): silent cap 5.0 m/s and hide/heal. Zone trips use zoneWalk=0.8 and a 10 s buffer.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 8.52 | 6.22 | +2.31 | 0.42 | 23483/25935 ticks, 122/128 matches | ok |
| phase=mid | 7.80 | 4.92 | +2.87 | 0.51 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 7.15 | 4.22 | +2.93 | 0.56 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 8.31 | 7.75 | +0.56 | 0.10 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| hp=hp_ge_90 | 8.08 | 5.48 | +2.59 | 0.48 | 21775/22777 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 9.02 | 7.31 | +1.71 | 0.31 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 8.10 | 6.24 | +1.86 | 0.31 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 9.16 | 5.93 | +3.23 | 0.53 | 1644/1678 ticks, 117/127 matches | ok |
| eng=eng_0 | 7.93 | 5.24 | +2.69 | 0.49 | 26415/27418 ticks, 122/128 matches | ok |
| eng=eng_1 | 10.18 | 8.95 | +1.23 | 0.23 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 10.75 | 10.35 | +0.40 | 0.07 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| alive=alive_13_16 | 9.56 | 7.70 | +1.86 | 0.36 | 6692/9004 ticks, 122/128 matches | ok |
| alive=alive_9_12 | 8.00 | 5.33 | +2.67 | 0.49 | 8335/9797 ticks, 112/120 matches | ok |
| alive=alive_5_8 | 8.06 | 5.05 | +3.01 | 0.53 | 10858/10766 ticks, 97/95 matches | ok |
| alive=alive_2_4 | 7.88 | 5.74 | +2.14 | 0.38 | 6076/3957 ticks, 64/58 matches | ok |
| edge=center | 8.02 | 5.89 | +2.13 | 0.38 | 11117/12772 ticks, 109/118 matches | ok |
| edge=midring | 8.39 | 5.89 | +2.50 | 0.45 | 18855/19762 ticks, 118/123 matches | ok |
| edge=edge | 9.37 | 7.11 | +2.26 | 0.45 | 1906/838 ticks, 57/34 matches | ok |
| edge=outside | 10.45 | 6.58 | +3.86 | 0.66 | 83/152 ticks, 12/7 matches | small n — no conclusion |

### stuck fraction (≈5 s almost unmoved, not in a drop ring)

Overall high (T01–T04) vs low (T13–T16): **10.6%** vs **21.6%** (diff -11.0 pp, Cohen's d=-0.30, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: Nav paths exist; there is no separate unstuck policy in params. Movement builds that tried random strafe / combined movement are on hold and were sim-only as of this writing. Mid-game unstuck has never been site-tested.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 10.6% | 19.2% | -8.6 pp | -0.24 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 10.3% | 30.2% | -19.9 pp | -0.52 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 16.9% | 25.7% | -8.8 pp | -0.22 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 5.9% | 1.2% | +4.7 pp | 0.34 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| hp=hp_ge_90 | 13.7% | 26.8% | -13.2 pp | -0.33 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 3.3% | 9.1% | -5.8 pp | -0.24 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 5.7% | 14.7% | -9.0 pp | -0.30 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 3.6% | 9.3% | -5.6 pp | -0.23 | 1644/1678 ticks, 117/127 matches | ok |
| eng=eng_0 | 12.7% | 26.3% | -13.6 pp | -0.35 | 26639/27690 ticks, 122/128 matches | ok |
| eng=eng_1 | 0.1% | 0.3% | -0.1 pp | -0.02 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 0.5% | 0.0% | +0.5 pp | 0.11 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| edge=center | 14.2% | 20.8% | -6.6 pp | -0.17 | 11181/12857 ticks, 109/118 matches | ok |
| edge=midring | 9.3% | 22.3% | -13.0 pp | -0.36 | 19015/19949 ticks, 118/123 matches | ok |
| edge=edge | 2.0% | 13.5% | -11.5 pp | -0.52 | 1906/838 ticks, 57/34 matches | ok |
| edge=outside | 0.0% | 30.9% | -30.9 pp | -0.83 | 83/152 ticks, 12/7 matches | small n — no conclusion |
| alive=alive_13_16 | 4.2% | 7.1% | -2.8 pp | -0.12 | 6916/9276 ticks, 122/128 matches | ok |
| alive=alive_9_12 | 14.6% | 25.5% | -10.8 pp | -0.27 | 8335/9797 ticks, 112/120 matches | ok |
| alive=alive_5_8 | 12.0% | 30.8% | -18.8 pp | -0.47 | 10858/10766 ticks, 97/95 matches | ok |
| alive=alive_2_4 | 9.6% | 21.0% | -11.4 pp | -0.33 | 6076/3957 ticks, 64/58 matches | ok |

### strafe vs aim (moving ≥2 m/s, heading 60–120° from torso aim)

Overall high (T01–T04) vs low (T13–T16): **27.4%** vs **16.8%** (diff +10.5 pp, Cohen's d=0.26, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: No calibrated strafe in the champion. A movement build is on hold (B116). Sim-only strafe-only screened worse than the champion; combined movement was mixed and failed the drop-reach / late-survival bar.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Heading vs aim is fully known.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 27.3% | 17.3% | +10.0 pp | 0.24 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 27.7% | 15.1% | +12.6 pp | 0.31 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 24.0% | 18.0% | +6.0 pp | 0.15 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 17.6% | 21.7% | -4.0 pp | -0.10 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| eng=eng_0 | 27.9% | 14.9% | +13.0 pp | 0.32 | 26639/27690 ticks, 122/128 matches | ok |
| eng=eng_1 | 25.1% | 25.7% | -0.5 pp | -0.01 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 26.9% | 28.3% | -1.4 pp | -0.03 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| hp=hp_ge_90 | 27.7% | 15.8% | +12.0 pp | 0.29 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 27.7% | 20.5% | +7.3 pp | 0.17 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 22.6% | 17.2% | +5.4 pp | 0.14 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 27.3% | 16.6% | +10.6 pp | 0.26 | 1644/1678 ticks, 117/127 matches | ok |
| ndist=d_lt_45 | 28.2% | 16.5% | +11.6 pp | 0.29 | 692/1130 ticks, 82/100 matches | ok |
| ndist=d_45_90 | 23.9% | 17.6% | +6.3 pp | 0.16 | 8373/10116 ticks, 121/127 matches | ok |
| ndist=d_90_160 | 28.0% | 17.2% | +10.8 pp | 0.26 | 14356/15440 ticks, 122/128 matches | ok |
| ndist=d_160_200 | 28.1% | 16.7% | +11.4 pp | 0.28 | 4297/4391 ticks, 107/112 matches | ok |
| ndist=d_ge_200 | 31.1% | 12.5% | +18.6 pp | 0.45 | 4467/2719 ticks, 82/78 matches | ok |

### strafe vs nearest enemy

Overall high (T01–T04) vs low (T13–T16): **24.6%** vs **20.4%** (diff +4.2 pp, Cohen's d=0.10, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: Same as above: no champion strafe policy.

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| eng=eng_0 | 24.1% | 19.0% | +5.1 pp | 0.12 | 26639/27690 ticks, 122/128 matches | ok |
| eng=eng_1 | 26.6% | 26.2% | +0.4 pp | 0.01 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 28.4% | 31.9% | -3.5 pp | -0.08 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| hp=hp_ge_90 | 24.2% | 19.8% | +4.4 pp | 0.11 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 26.6% | 23.6% | +2.9 pp | 0.07 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 21.1% | 18.0% | +3.0 pp | 0.08 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 25.7% | 17.9% | +7.7 pp | 0.19 | 1644/1678 ticks, 117/127 matches | ok |
| ndist=d_lt_45 | 24.4% | 17.2% | +7.3 pp | 0.18 | 692/1130 ticks, 82/100 matches | ok |
| ndist=d_45_90 | 22.9% | 19.9% | +3.0 pp | 0.07 | 8373/10116 ticks, 121/127 matches | ok |
| ndist=d_90_160 | 24.9% | 20.9% | +4.0 pp | 0.09 | 14356/15440 ticks, 122/128 matches | ok |
| ndist=d_160_200 | 25.7% | 20.6% | +5.1 pp | 0.12 | 4297/4391 ticks, 107/112 matches | ok |
| ndist=d_ge_200 | 25.5% | 20.0% | +5.5 pp | 0.13 | 4467/2719 ticks, 82/78 matches | ok |
| nvis=nearest_visible | 22.9% | 21.6% | +1.2 pp | 0.03 | 4966/5749 ticks, 121/128 matches | ok |
| nvis=nearest_hidden | 24.9% | 20.1% | +4.7 pp | 0.11 | 27219/28047 ticks, 122/127 matches | ok |

### silent (speed ≤ 5 m/s) fraction

Overall high (T01–T04) vs low (T13–T16): **33.8%** vs **54.7%** (diff -20.9 pp, Cohen's d=-0.43, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: Champion applies the 5.0 m/s cap only while hurt (NO_SNEAK_ON).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 32.2% | 52.4% | -20.2 pp | -0.42 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 38.0% | 62.9% | -24.9 pp | -0.51 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 45.3% | 60.7% | -15.4 pp | -0.31 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 29.4% | 37.3% | -7.9 pp | -0.17 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| hp=hp_ge_90 | 36.1% | 59.9% | -23.8 pp | -0.49 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 27.5% | 39.7% | -12.3 pp | -0.26 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 33.5% | 48.6% | -15.1 pp | -0.31 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 28.0% | 51.3% | -23.3 pp | -0.49 | 1644/1678 ticks, 117/127 matches | ok |
| eng=eng_0 | 37.2% | 61.6% | -24.4 pp | -0.50 | 26639/27690 ticks, 122/128 matches | ok |
| eng=eng_1 | 17.6% | 23.7% | -6.1 pp | -0.15 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 17.3% | 16.5% | +0.8 pp | 0.02 | 197/279 ticks, 54/69 matches | small n — no conclusion |

