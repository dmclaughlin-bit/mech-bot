# Evasion and disengage

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.38 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 21:29 ET. Corpus: 128 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 975 mech-rows, 138607 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
How T01–T16 retreat, strafe, face threats, and use cover when HP, attacker count, or enemy weapons change.

## Per-team overall

| label | n_games | mean_place | face_atk_deg | cover_pct |
| --- | ---: | ---: | ---: | ---: |
| T01 | 98 | 6.69 | 7.23 | 50.5% |
| T02 | 65 | 7.20 | 5.41 | 67.4% |
| T03 | 32 | 7.25 | 8.54 | 40.2% |
| T04 | 26 | 7.46 | 6.83 | 52.7% |
| T05 | 43 | 7.70 | 6.51 | 59.0% |
| T06 | 80 | 7.76 | 5.72 | 53.8% |
| T07 | 87 | 7.79 | 4.27 | 70.3% |
| T08 | 43 | 7.81 | 5.74 | 63.1% |
| T09 | 101 | 7.85 | 6.30 | 51.3% |
| T10 | 71 | 7.86 | 10.06 | 72.9% |
| T11 | 24 | 7.92 | 3.83 | 59.2% |
| T12 | 36 | 8.14 | 4.86 | 56.9% |
| T13 | 58 | 8.19 | 5.16 | 55.1% |
| T14 | 76 | 8.25 | 5.09 | 51.9% |
| T15 | 41 | 8.49 | 6.12 | 61.0% |
| T16 | 94 | 8.49 | 7.01 | 55.3% |

## Rear exposure

Share of mech-hits taken from outside the 180° front arc (protocol rear armor, ×1.5). High: 5.9% (n=7098 hits with a measurable bearing). Low: 6.5% (n=8322). Implementable: `damaged.rear` and `damaged.bearing` are in our events, and visible attackers' positions are in `obs.mechs`. P30 (FACE_ATTACKER_ON) tried a front-arc rule while retreating/healing and was retired (screen VETO). Do not resubmit it.

## 2v1 survival proxy

Among labeled mech-matches that had at least one tick with two or more recent exchangers of fire: high died within 8 s of the last such tick in 47/69 cases; low in 60/96. This is a proxy, not a formal 2v1 outcome table. Champion: CROSSFIRE_ON already leaves a 2-LOS fight for cover; there is no HP-vs-N policy for 3v1, and a multi-threat 'fight if the race looks winning' build (B26) lost on the site.

## What could not be measured

- Intentional disengage vs target simply dying or walking out of range.
- Independent body sway (no body yaw in the stream).
- Exact attacker count as the bot would know it (we used hits in the last 2 s, omniscient).

## Evasion and disengage by state

### speed while HP < 35% (m/s)

Overall high (T01–T04) vs low (T13–T16): **9.12** vs **5.91** (diff +3.21, Cohen's d=0.52, 2031/2170 ticks, 120/128 matches, ok).

Champion P34 in this situation: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| eng=eng_0 | 7.37 | 3.35 | +4.02 | 0.73 | 1020/1018 ticks, 73/87 matches | ok |
| eng=eng_1 | 10.97 | 8.01 | +2.96 | 0.50 | 931/1064 ticks, 114/125 matches | ok |
| eng=eng_2plus | 10.09 | 10.17 | -0.08 | -0.01 | 80/88 ticks, 40/42 matches | small n — no conclusion |
| phase=early | 9.07 | 6.18 | +2.89 | 0.46 | 1333/1547 ticks, 94/118 matches | ok |
| phase=mid | 9.26 | 5.17 | +4.09 | 0.70 | 667/603 ticks, 62/68 matches | ok |
| phase=late | 8.34 | 6.71 | +1.63 | 0.28 | 25/9 ticks, 6/3 matches | small n — no conclusion |
| phase=final | 9.34 | 8.45 | +0.89 | 0.15 | 6/11 ticks, 3/3 matches | small n — no conclusion |
| near=near80_0 | 9.33 | 5.56 | +3.77 | 0.63 | 1446/1366 ticks, 105/104 matches | ok |
| near=near80_1 | 8.70 | 6.40 | +2.30 | 0.36 | 514/679 ticks, 82/108 matches | ok |
| near=near80_2plus | 7.99 | 7.10 | +0.89 | 0.14 | 71/125 ticks, 25/35 matches | small n — no conclusion |
| alive=alive_13_16 | 9.44 | 7.06 | +2.38 | 0.37 | 249/531 ticks, 44/76 matches | ok |
| alive=alive_9_12 | 9.01 | 6.45 | +2.57 | 0.42 | 558/537 ticks, 56/77 matches | ok |
| alive=alive_5_8 | 9.05 | 4.95 | +4.10 | 0.68 | 673/685 ticks, 70/76 matches | ok |
| alive=alive_2_4 | 9.18 | 5.32 | +3.86 | 0.66 | 551/417 ticks, 54/56 matches | ok |

### boost while HP < 35%

Overall high (T01–T04) vs low (T13–T16): **29.7%** vs **23.6%** (diff +6.1 pp, Cohen's d=0.14, 2031/2170 ticks, 120/128 matches, ok).

Champion P34 in this situation: No dedicated 'boost away when low' flag; hurt movement is the silent cap and hide/heal.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| eng=eng_0 | 11.0% | 7.2% | +3.8 pp | 0.13 | 1020/1018 ticks, 73/87 matches | ok |
| eng=eng_1 | 48.3% | 36.5% | +11.9 pp | 0.24 | 931/1064 ticks, 114/125 matches | ok |
| eng=eng_2plus | 52.5% | 58.0% | -5.5 pp | -0.11 | 80/88 ticks, 40/42 matches | small n — no conclusion |
| en=en_ge_80 | 16.5% | 11.8% | +4.6 pp | 0.14 | 765/1328 ticks, 79/109 matches | ok |
| en=en_30_80 | 44.4% | 48.7% | -4.3 pp | -0.09 | 736/618 ticks, 94/108 matches | ok |
| en=en_lt_30 | 28.5% | 24.1% | +4.4 pp | 0.10 | 530/224 ticks, 91/55 matches | ok |
| phase=early | 29.4% | 23.8% | +5.6 pp | 0.13 | 1333/1547 ticks, 94/118 matches | ok |
| phase=mid | 30.3% | 23.5% | +6.7 pp | 0.15 | 667/603 ticks, 62/68 matches | ok |
| phase=late | 32.0% | 11.1% | +20.9 pp | 0.48 | 25/9 ticks, 6/3 matches | small n — no conclusion |
| phase=final | 33.3% | 9.1% | +24.2 pp | 0.67 | 6/11 ticks, 3/3 matches | small n — no conclusion |

### nearest enemy (m) while HP < 35%

Overall high (T01–T04) vs low (T13–T16): **115.36** vs **103.74** (diff +11.62, Cohen's d=0.21, 2031/2170 ticks, 120/128 matches, ok).

Champion P34 in this situation: Hurt hide/retreat should increase spacing; not a fixed meter target.

Observability: Not directly implementable as measured: the Watcher sees this for every mech, including ones we cannot see. Use only with a visible/sound proxy, or flag as research-only. Restrict to visible enemies in a later test if we implement this.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| eng=eng_0 | 131.34 | 118.03 | +13.31 | 0.22 | 1020/1018 ticks, 73/87 matches | ok |
| eng=eng_1 | 100.82 | 92.32 | +8.50 | 0.18 | 931/1064 ticks, 114/125 matches | ok |
| eng=eng_2plus | 80.69 | 76.40 | +4.29 | 0.14 | 80/88 ticks, 40/42 matches | small n — no conclusion |
| phase=early | 114.64 | 104.40 | +10.25 | 0.18 | 1333/1547 ticks, 94/118 matches | ok |
| phase=mid | 118.82 | 103.23 | +15.59 | 0.28 | 667/603 ticks, 62/68 matches | ok |
| phase=late | 78.06 | 66.57 | +11.49 | 0.57 | 25/9 ticks, 6/3 matches | small n — no conclusion |
| phase=final | 44.58 | 68.83 | -24.25 | -1.17 | 6/11 ticks, 3/3 matches | small n — no conclusion |
| alive=alive_13_16 | 96.38 | 105.35 | -8.96 | -0.16 | 249/531 ticks, 44/76 matches | ok |
| alive=alive_9_12 | 117.06 | 105.07 | +11.99 | 0.21 | 558/537 ticks, 56/77 matches | ok |
| alive=alive_5_8 | 111.82 | 95.09 | +16.73 | 0.35 | 673/685 ticks, 70/76 matches | ok |
| alive=alive_2_4 | 126.53 | 114.18 | +12.36 | 0.20 | 551/417 ticks, 54/56 matches | ok |

### strafe vs aim while engaged

Overall high (T01–T04) vs low (T13–T16): **25.2%** vs **25.8%** (diff -0.6 pp, Cohen's d=-0.01, 5546/6106 ticks, 122/128 matches, ok).

Champion P34 in this situation: No champion strafe-under-fire policy. Sim-only strafe work is still research, not a site candidate.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| hp=hp_ge_90 | 25.2% | 26.3% | -1.1 pp | -0.03 | 1326/1456 ticks, 109/122 matches | ok |
| hp=hp_50_90 | 25.5% | 26.5% | -1.0 pp | -0.02 | 2483/2724 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 23.4% | 24.2% | -0.8 pp | -0.02 | 905/1008 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 26.2% | 24.5% | +1.7 pp | 0.04 | 832/918 ticks, 117/127 matches | ok |
| eng=eng_1 | 25.1% | 25.7% | -0.5 pp | -0.01 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 26.9% | 28.3% | -1.4 pp | -0.03 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| ndist=d_lt_45 | 28.6% | 20.4% | +8.2 pp | 0.19 | 399/579 ticks, 73/96 matches | ok |
| ndist=d_45_90 | 23.9% | 27.6% | -3.7 pp | -0.08 | 2278/2767 ticks, 119/126 matches | ok |
| ndist=d_90_160 | 25.7% | 25.2% | +0.5 pp | 0.01 | 2369/2239 ticks, 112/121 matches | ok |
| ndist=d_160_200 | 26.6% | 26.5% | +0.1 pp | 0.00 | 331/392 ticks, 57/66 matches | ok |
| ndist=d_ge_200 | 24.9% | 19.4% | +5.5 pp | 0.13 | 169/129 ticks, 40/35 matches | small n — no conclusion |
| phase=early | 25.2% | 24.9% | +0.3 pp | 0.01 | 4003/4698 ticks, 114/126 matches | ok |
| phase=mid | 24.7% | 28.5% | -3.8 pp | -0.09 | 1448/1352 ticks, 77/71 matches | ok |
| phase=late | 33.8% | 34.5% | -0.7 pp | -0.02 | 80/29 ticks, 12/6 matches | small n — no conclusion |
| phase=final | 20.0% | 33.3% | -13.3 pp | -0.30 | 15/27 ticks, 4/3 matches | small n — no conclusion |

### cover while engaged

Overall high (T01–T04) vs low (T13–T16): **48.8%** vs **45.5%** (diff +3.3 pp, Cohen's d=0.07, 5546/6106 ticks, 122/128 matches, ok).

Champion P34 in this situation: B5b heal-and-fire and B60 crossfire-to-cover are in the stack. Later hold-behind-cover / late-cover variants lost on the site (cover family).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Cover is from the official world.json buildings (same proxy as findings.md).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| hp=hp_ge_90 | 42.2% | 42.4% | -0.3 pp | -0.01 | 1326/1456 ticks, 109/122 matches | ok |
| hp=hp_50_90 | 49.2% | 45.0% | +4.1 pp | 0.08 | 2483/2724 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 51.2% | 43.3% | +7.9 pp | 0.16 | 905/1008 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 55.8% | 53.9% | +1.8 pp | 0.04 | 832/918 ticks, 117/127 matches | ok |
| eng=eng_1 | 49.3% | 45.8% | +3.6 pp | 0.07 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 35.0% | 39.4% | -4.4 pp | -0.09 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| phase=early | 45.3% | 41.5% | +3.9 pp | 0.08 | 4003/4698 ticks, 114/126 matches | ok |
| phase=mid | 58.1% | 58.1% | +0.1 pp | 0.00 | 1448/1352 ticks, 77/71 matches | ok |
| phase=late | 51.2% | 86.2% | -35.0 pp | -0.75 | 80/29 ticks, 12/6 matches | small n — no conclusion |
| phase=final | 66.7% | 66.7% | +0.0 pp | 0.00 | 15/27 ticks, 4/3 matches | small n — no conclusion |
| alive=alive_13_16 | 31.4% | 30.4% | +1.1 pp | 0.02 | 1469/2220 ticks, 88/120 matches | ok |
| alive=alive_9_12 | 48.8% | 53.0% | -4.3 pp | -0.09 | 1267/1431 ticks, 89/109 matches | ok |
| alive=alive_5_8 | 56.9% | 51.9% | +5.0 pp | 0.10 | 1678/1664 ticks, 92/91 matches | ok |
| alive=alive_2_4 | 59.5% | 60.7% | -1.2 pp | -0.03 | 1132/791 ticks, 64/58 matches | ok |

### LOS to nearest blocked while engaged

Overall high (T01–T04) vs low (T13–T16): **45.7%** vs **43.8%** (diff +1.8 pp, Cohen's d=0.04, 5546/6106 ticks, 122/128 matches, ok).

Champion P34 in this situation: CROSSFIRE_ON already walks to a hideSpot when two or more enemies have LOS.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). The bot can test LOS with the map and a visible or remembered enemy position.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| hp=hp_ge_90 | 48.0% | 43.8% | +4.2 pp | 0.08 | 1326/1456 ticks, 109/122 matches | ok |
| hp=hp_50_90 | 43.2% | 43.9% | -0.8 pp | -0.02 | 2483/2724 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 44.6% | 43.8% | +0.9 pp | 0.02 | 905/1008 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 50.4% | 43.7% | +6.7 pp | 0.13 | 832/918 ticks, 117/127 matches | ok |
| eng=eng_1 | 46.3% | 44.5% | +1.8 pp | 0.04 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 27.4% | 30.1% | -2.7 pp | -0.06 | 197/279 ticks, 54/69 matches | small n — no conclusion |
| phase=early | 40.4% | 39.7% | +0.7 pp | 0.01 | 4003/4698 ticks, 114/126 matches | ok |
| phase=mid | 60.4% | 58.1% | +2.3 pp | 0.05 | 1448/1352 ticks, 77/71 matches | ok |
| phase=late | 48.8% | 51.7% | -3.0 pp | -0.06 | 80/29 ticks, 12/6 matches | small n — no conclusion |
| phase=final | 13.3% | 44.4% | -31.1 pp | -0.69 | 15/27 ticks, 4/3 matches | small n — no conclusion |

