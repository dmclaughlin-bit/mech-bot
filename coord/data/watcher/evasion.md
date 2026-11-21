# Evasion and disengage

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.17 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 15:43 ET. Corpus: 93 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 868 mech-rows, 115655 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
How T01–T16 retreat, strafe, face threats, and use cover when HP, attacker count, or enemy weapons change.

## Per-team overall

| label | n_games | mean_place | face_atk_deg | cover_pct |
| --- | ---: | ---: | ---: | ---: |
| T01 | 67 | 7.10 | 7.42 | 50.7% |
| T02 | 65 | 7.20 | 5.41 | 67.4% |
| T03 | 32 | 7.25 | 8.54 | 40.2% |
| T04 | 26 | 7.46 | 6.83 | 52.7% |
| T05 | 21 | 7.62 | 6.18 | 59.9% |
| T06 | 64 | 7.78 | 5.41 | 59.6% |
| T07 | 78 | 7.83 | 5.77 | 53.0% |
| T08 | 68 | 7.94 | 6.65 | 52.8% |
| T09 | 54 | 7.94 | 5.30 | 57.9% |
| T10 | 58 | 8.19 | 5.16 | 55.1% |
| T11 | 76 | 8.25 | 5.09 | 51.9% |
| T12 | 56 | 8.25 | 4.91 | 72.3% |
| T13 | 50 | 8.40 | 7.39 | 72.9% |
| T14 | 53 | 8.60 | 4.46 | 42.5% |
| T15 | 39 | 8.62 | 6.68 | 64.8% |
| T16 | 61 | 8.67 | 8.39 | 58.1% |

## Rear exposure

Share of mech-hits taken from outside the 180° front arc (protocol rear armor, ×1.5). High: 5.8% (n=6146 hits with a measurable bearing). Low: 5.4% (n=5568). Implementable: `damaged.rear` and `damaged.bearing` are in our events, and visible attackers' positions are in `obs.mechs`. The champion aims to shoot; it has no separate 'face the biggest attacker' rule when not firing.

## 2v1 survival proxy

Among labeled mech-matches that had at least one tick with two or more recent exchangers of fire: high died within 8 s of the last such tick in 40/60 cases; low in 43/61. This is a proxy, not a formal 2v1 outcome table. Champion: CROSSFIRE_ON already leaves a 2-LOS fight for cover; there is no HP-vs-N policy for 3v1, and a multi-threat 'fight if the race looks winning' build (B26) lost on the site.

## What could not be measured

- Intentional disengage vs target simply dying or walking out of range.
- Independent body sway (no body yaw in the stream).
- Exact attacker count as the bot would know it (we used hits in the last 2 s, omniscient).

## Evasion and disengage by state

### speed while HP < 35% (m/s)

Overall high (T01–T04) vs low (T13–T16): **8.82** vs **7.46** (diff +1.36, Cohen's d=0.22, 1746/1385 ticks, 87/86 matches, ok).

Champion B113 in this situation: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| eng=eng_0 | 7.14 | 5.02 | +2.13 | 0.37 | 872/606 ticks, 59/59 matches | ok |
| eng=eng_1 | 10.61 | 9.26 | +1.35 | 0.24 | 807/715 ticks, 84/83 matches | ok |
| eng=eng_2plus | 9.17 | 10.50 | -1.33 | -0.22 | 67/64 ticks, 33/33 matches | small n — no conclusion |
| phase=early | 8.82 | 7.37 | +1.45 | 0.24 | 1227/1029 ticks, 77/78 matches | ok |
| phase=mid | 8.84 | 7.72 | +1.12 | 0.20 | 488/333 ticks, 40/46 matches | ok |
| phase=late | 8.34 | 9.24 | -0.90 | -0.16 | 25/12 ticks, 6/7 matches | small n — no conclusion |
| phase=final | 9.34 | 6.40 | +2.94 | 0.43 | 6/11 ticks, 3/3 matches | small n — no conclusion |
| near=near80_0 | 9.02 | 7.21 | +1.81 | 0.30 | 1209/944 ticks, 75/74 matches | ok |
| near=near80_1 | 8.48 | 7.82 | +0.66 | 0.11 | 470/401 ticks, 68/69 matches | ok |
| near=near80_2plus | 7.68 | 9.89 | -2.21 | -0.36 | 67/40 ticks, 22/15 matches | small n — no conclusion |
| alive=alive_13_16 | 9.01 | 9.60 | -0.60 | -0.10 | 232/334 ticks, 38/49 matches | ok |
| alive=alive_9_12 | 8.77 | 6.13 | +2.64 | 0.44 | 509/490 ticks, 48/50 matches | ok |
| alive=alive_5_8 | 8.71 | 7.68 | +1.03 | 0.17 | 558/312 ticks, 55/45 matches | ok |
| alive=alive_2_4 | 8.94 | 6.95 | +2.00 | 0.35 | 447/249 ticks, 43/43 matches | ok |

### boost while HP < 35%

Overall high (T01–T04) vs low (T13–T16): **28.4%** vs **26.7%** (diff +1.6 pp, Cohen's d=0.04, 1746/1385 ticks, 87/86 matches, ok).

Champion B113 in this situation: No dedicated 'boost away when low' flag; hurt movement is the silent cap and hide/heal.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| eng=eng_0 | 11.1% | 8.7% | +2.4 pp | 0.08 | 872/606 ticks, 59/59 matches | ok |
| eng=eng_1 | 45.6% | 39.2% | +6.4 pp | 0.13 | 807/715 ticks, 84/83 matches | ok |
| eng=eng_2plus | 44.8% | 57.8% | -13.0 pp | -0.26 | 67/64 ticks, 33/33 matches | small n — no conclusion |
| en=en_ge_80 | 16.7% | 12.1% | +4.5 pp | 0.13 | 684/593 ticks, 67/72 matches | ok |
| en=en_30_80 | 42.8% | 44.5% | -1.6 pp | -0.03 | 635/470 ticks, 69/74 matches | ok |
| en=en_lt_30 | 25.5% | 27.6% | -2.1 pp | -0.05 | 427/322 ticks, 65/53 matches | ok |
| phase=early | 28.9% | 25.8% | +3.2 pp | 0.07 | 1227/1029 ticks, 77/78 matches | ok |
| phase=mid | 26.6% | 29.7% | -3.1 pp | -0.07 | 488/333 ticks, 40/46 matches | ok |
| phase=late | 32.0% | 25.0% | +7.0 pp | 0.15 | 25/12 ticks, 6/7 matches | small n — no conclusion |
| phase=final | 33.3% | 27.3% | +6.1 pp | 0.13 | 6/11 ticks, 3/3 matches | small n — no conclusion |

### nearest enemy (m) while HP < 35%

Overall high (T01–T04) vs low (T13–T16): **114.35** vs **104.50** (diff +9.85, Cohen's d=0.18, 1746/1385 ticks, 87/86 matches, ok).

Champion B113 in this situation: Hurt hide/retreat should increase spacing; not a fixed meter target.

Observability: Not directly implementable as measured: the Watcher sees this for every mech, including ones we cannot see. Use only with a visible/sound proxy, or flag as research-only. Restrict to visible enemies in a later test if we implement this.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| eng=eng_0 | 130.76 | 122.51 | +8.25 | 0.14 | 872/606 ticks, 59/59 matches | ok |
| eng=eng_1 | 99.56 | 91.44 | +8.13 | 0.18 | 807/715 ticks, 84/83 matches | ok |
| eng=eng_2plus | 78.97 | 79.87 | -0.90 | -0.03 | 67/64 ticks, 33/33 matches | small n — no conclusion |
| phase=early | 113.52 | 108.51 | +5.01 | 0.09 | 1227/1029 ticks, 77/78 matches | ok |
| phase=mid | 119.17 | 94.61 | +24.56 | 0.48 | 488/333 ticks, 40/46 matches | ok |
| phase=late | 78.06 | 63.83 | +14.23 | 1.00 | 25/12 ticks, 6/7 matches | small n — no conclusion |
| phase=final | 44.58 | 73.04 | -28.46 | -1.10 | 6/11 ticks, 3/3 matches | small n — no conclusion |
| alive=alive_13_16 | 97.02 | 100.36 | -3.34 | -0.07 | 232/334 ticks, 38/49 matches | ok |
| alive=alive_9_12 | 113.37 | 110.13 | +3.23 | 0.06 | 509/490 ticks, 48/50 matches | ok |
| alive=alive_5_8 | 112.93 | 111.79 | +1.14 | 0.02 | 558/312 ticks, 55/45 matches | ok |
| alive=alive_2_4 | 126.25 | 89.83 | +36.42 | 0.71 | 447/249 ticks, 43/43 matches | ok |

### strafe vs aim while engaged

Overall high (T01–T04) vs low (T13–T16): **25.7%** vs **25.3%** (diff +0.4 pp, Cohen's d=0.01, 4846/3898 ticks, 88/86 matches, ok).

Champion B113 in this situation: No champion strafe-under-fire policy. Sim-only strafe work is still research, not a site candidate.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| hp=hp_ge_90 | 26.1% | 24.8% | +1.3 pp | 0.03 | 1148/923 ticks, 81/81 matches | ok |
| hp=hp_50_90 | 26.3% | 25.5% | +0.9 pp | 0.02 | 2195/1713 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 23.1% | 26.4% | -3.3 pp | -0.08 | 791/625 ticks, 86/78 matches | ok |
| hp=hp_lt_30 | 26.0% | 24.5% | +1.5 pp | 0.03 | 712/637 ticks, 85/84 matches | ok |
| eng=eng_1 | 25.6% | 25.4% | +0.2 pp | 0.00 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 28.0% | 21.6% | +6.5 pp | 0.15 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| ndist=d_lt_45 | 28.5% | 24.9% | +3.6 pp | 0.08 | 376/390 ticks, 64/61 matches | ok |
| ndist=d_45_90 | 24.6% | 23.0% | +1.6 pp | 0.04 | 1982/1834 ticks, 87/83 matches | ok |
| ndist=d_90_160 | 26.0% | 28.4% | -2.4 pp | -0.05 | 2040/1437 ticks, 82/80 matches | ok |
| ndist=d_160_200 | 28.6% | 28.2% | +0.3 pp | 0.01 | 287/177 ticks, 49/45 matches | small n — no conclusion |
| ndist=d_ge_200 | 24.2% | 16.7% | +7.6 pp | 0.18 | 161/60 ticks, 36/23 matches | small n — no conclusion |
| phase=early | 25.4% | 24.7% | +0.6 pp | 0.01 | 3675/3103 ticks, 87/82 matches | ok |
| phase=mid | 26.4% | 27.4% | -1.0 pp | -0.02 | 1076/742 ticks, 54/53 matches | ok |
| phase=late | 33.8% | 25.6% | +8.1 pp | 0.18 | 80/39 ticks, 12/8 matches | small n — no conclusion |
| phase=final | 20.0% | 42.9% | -22.9 pp | -0.51 | 15/14 ticks, 4/2 matches | small n — no conclusion |

### cover while engaged

Overall high (T01–T04) vs low (T13–T16): **49.4%** vs **49.6%** (diff -0.3 pp, Cohen's d=-0.01, 4846/3898 ticks, 88/86 matches, ok).

Champion B113 in this situation: B5b heal-and-fire and B60 crossfire-to-cover are in the stack. Later hold-behind-cover / late-cover variants lost on the site (cover family).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Cover is from the official world.json buildings (same proxy as findings.md).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| hp=hp_ge_90 | 42.9% | 44.6% | -1.8 pp | -0.04 | 1148/923 ticks, 81/81 matches | ok |
| hp=hp_50_90 | 49.3% | 49.0% | +0.3 pp | 0.01 | 2195/1713 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 52.0% | 53.0% | -1.0 pp | -0.02 | 791/625 ticks, 86/78 matches | ok |
| hp=hp_lt_30 | 57.2% | 55.4% | +1.7 pp | 0.04 | 712/637 ticks, 85/84 matches | ok |
| eng=eng_1 | 49.9% | 50.1% | -0.2 pp | -0.00 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 33.5% | 37.3% | -3.7 pp | -0.08 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| phase=early | 45.3% | 46.7% | -1.4 pp | -0.03 | 3675/3103 ticks, 87/82 matches | ok |
| phase=mid | 63.0% | 59.4% | +3.6 pp | 0.07 | 1076/742 ticks, 54/53 matches | ok |
| phase=late | 51.2% | 82.1% | -30.8 pp | -0.66 | 80/39 ticks, 12/8 matches | small n — no conclusion |
| phase=final | 66.7% | 100.0% | -33.3 pp | -0.98 | 15/14 ticks, 4/2 matches | small n — no conclusion |
| alive=alive_13_16 | 30.6% | 37.7% | -7.1 pp | -0.15 | 1348/1394 ticks, 76/75 matches | ok |
| alive=alive_9_12 | 48.0% | 54.4% | -6.4 pp | -0.13 | 1122/1095 ticks, 72/69 matches | ok |
| alive=alive_5_8 | 60.2% | 55.3% | +4.9 pp | 0.10 | 1413/880 ticks, 71/62 matches | ok |
| alive=alive_2_4 | 61.3% | 61.8% | -0.5 pp | -0.01 | 963/529 ticks, 51/46 matches | ok |

### LOS to nearest blocked while engaged

Overall high (T01–T04) vs low (T13–T16): **45.5%** vs **43.4%** (diff +2.1 pp, Cohen's d=0.04, 4846/3898 ticks, 88/86 matches, ok).

Champion B113 in this situation: CROSSFIRE_ON already walks to a hideSpot when two or more enemies have LOS.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). The bot can test LOS with the map and a visible or remembered enemy position.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| hp=hp_ge_90 | 47.7% | 41.5% | +6.2 pp | 0.13 | 1148/923 ticks, 81/81 matches | ok |
| hp=hp_50_90 | 43.6% | 42.6% | +0.9 pp | 0.02 | 2195/1713 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 44.6% | 47.5% | -2.9 pp | -0.06 | 791/625 ticks, 86/78 matches | ok |
| hp=hp_lt_30 | 48.9% | 44.0% | +4.9 pp | 0.10 | 712/637 ticks, 85/84 matches | ok |
| eng=eng_1 | 46.0% | 43.8% | +2.2 pp | 0.04 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 30.5% | 32.0% | -1.5 pp | -0.03 | 164/153 ticks, 45/46 matches | small n — no conclusion |
| phase=early | 41.1% | 41.1% | +0.0 pp | 0.00 | 3675/3103 ticks, 87/82 matches | ok |
| phase=mid | 60.8% | 52.3% | +8.5 pp | 0.17 | 1076/742 ticks, 54/53 matches | ok |
| phase=late | 48.8% | 51.3% | -2.5 pp | -0.05 | 80/39 ticks, 12/8 matches | small n — no conclusion |
| phase=final | 13.3% | 57.1% | -43.8 pp | -1.04 | 15/14 ticks, 4/2 matches | small n — no conclusion |

