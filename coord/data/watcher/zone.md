# Zone rotation

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.17 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 15:43 ET. Corpus: 93 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 868 mech-rows, 115655 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
When T01–T16 sit in the circle, on the edge, or outside, and how that shifts as the zone shrinks and the alive count falls.

## Per-team overall

| label | n_games | mean_place | outside_pct | zratio |
| --- | ---: | ---: | ---: | ---: |
| T01 | 67 | 7.10 | 0.4% | 0.50 |
| T02 | 65 | 7.20 | 0.3% | 0.45 |
| T03 | 32 | 7.25 | 0.0% | 0.48 |
| T04 | 26 | 7.46 | 0.2% | 0.47 |
| T05 | 21 | 7.62 | 0.0% | 0.49 |
| T06 | 64 | 7.78 | 0.7% | 0.50 |
| T07 | 78 | 7.83 | 0.4% | 0.46 |
| T08 | 68 | 7.94 | 0.0% | 0.48 |
| T09 | 54 | 7.94 | 0.0% | 0.50 |
| T10 | 58 | 8.19 | 0.2% | 0.42 |
| T11 | 76 | 8.25 | 0.8% | 0.48 |
| T12 | 56 | 8.25 | 0.1% | 0.52 |
| T13 | 50 | 8.40 | 0.2% | 0.53 |
| T14 | 53 | 8.60 | 0.1% | 0.40 |
| T15 | 39 | 8.62 | 0.0% | 0.47 |
| T16 | 61 | 8.67 | 0.8% | 0.47 |

## Zone position by state

### outside-zone fraction

Overall high (T01–T04) vs low (T13–T16): **0.3%** vs **0.3%** (diff -0.0 pp, Cohen's d=-0.01, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: Zone travel ranks first. zoneWalk=0.8, zoneBuffer=10 s. The champion should almost never farm or fight its way into a late outside-zone death.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Zone is always known.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 0.1% | 0.2% | -0.2 pp | -0.05 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 0.9% | 0.3% | +0.5 pp | 0.07 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 0.8% | 2.4% | -1.6 pp | -0.13 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 17.6% | 22.7% | -5.1 pp | -0.12 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| alive=alive_13_16 | 0.0% | 0.0% | +0.0 pp | 0.00 | 5714/7144 ticks, 88/86 matches | ok |
| alive=alive_9_12 | 0.1% | 0.7% | -0.5 pp | -0.09 | 6405/6967 ticks, 82/79 matches | ok |
| alive=alive_5_8 | 0.3% | 0.0% | +0.3 pp | 0.08 | 8475/7763 ticks, 72/68 matches | ok |
| alive=alive_2_4 | 0.6% | 1.0% | -0.3 pp | -0.04 | 5281/3133 ticks, 51/47 matches | ok |
| hp=hp_ge_90 | 0.1% | 0.1% | +0.0 pp | 0.01 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 0.4% | 0.7% | -0.3 pp | -0.04 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 0.6% | 1.1% | -0.6 pp | -0.06 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 1.1% | 1.7% | -0.6 pp | -0.05 | 1405/1087 ticks, 85/84 matches | ok |
| eng=eng_0 | 0.3% | 0.3% | -0.0 pp | -0.01 | 21029/21109 ticks, 88/86 matches | ok |
| eng=eng_1 | 0.1% | 0.2% | -0.0 pp | -0.01 | 4682/3745 ticks, 88/86 matches | ok |
| eng=eng_2plus | 0.0% | 0.0% | +0.0 pp | 0.00 | 164/153 ticks, 45/46 matches | small n — no conclusion |

### mean zone ratio (distance/radius)

Overall high (T01–T04) vs low (T13–T16): **0.48** vs **0.47** (diff +0.01, Cohen's d=0.04, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: No explicit edge-vs-center hold target. The bot plans a trip to the next circle; it does not have a late 'sit at ratio 0.5' rule.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 0.47 | 0.46 | +0.01 | 0.06 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 0.50 | 0.50 | -0.00 | -0.01 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 0.52 | 0.67 | -0.14 | -0.70 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 0.70 | 0.87 | -0.17 | -0.79 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| alive=alive_13_16 | 0.48 | 0.48 | +0.00 | 0.01 | 5714/7144 ticks, 88/86 matches | ok |
| alive=alive_9_12 | 0.45 | 0.43 | +0.02 | 0.11 | 6405/6967 ticks, 82/79 matches | ok |
| alive=alive_5_8 | 0.49 | 0.48 | +0.00 | 0.01 | 8475/7763 ticks, 72/68 matches | ok |
| alive=alive_2_4 | 0.49 | 0.50 | -0.01 | -0.06 | 5281/3133 ticks, 51/47 matches | ok |
| hp=hp_ge_90 | 0.48 | 0.49 | -0.01 | -0.03 | 17086/18566 ticks, 88/86 matches | ok |
| hp=hp_50_90 | 0.47 | 0.41 | +0.06 | 0.29 | 5640/4048 ticks, 88/84 matches | ok |
| hp=hp_30_50 | 0.46 | 0.42 | +0.04 | 0.20 | 1744/1306 ticks, 86/80 matches | ok |
| hp=hp_lt_30 | 0.46 | 0.46 | +0.01 | 0.03 | 1405/1087 ticks, 85/84 matches | ok |

## What could not be measured

- The exact second a team *decided* to rotate (intent) vs the second it crossed in. We can only show position vs shrink schedule.

