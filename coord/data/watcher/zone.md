# Zone rotation

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.38 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 21:29 ET. Corpus: 128 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 975 mech-rows, 138607 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
When T01–T16 sit in the circle, on the edge, or outside, and how that shifts as the zone shrinks and the alive count falls.

## Per-team overall

| label | n_games | mean_place | outside_pct | zratio |
| --- | ---: | ---: | ---: | ---: |
| T01 | 98 | 6.69 | 0.3% | 0.54 |
| T02 | 65 | 7.20 | 0.3% | 0.45 |
| T03 | 32 | 7.25 | 0.0% | 0.48 |
| T04 | 26 | 7.46 | 0.2% | 0.47 |
| T05 | 43 | 7.70 | 0.0% | 0.49 |
| T06 | 80 | 7.76 | 0.4% | 0.45 |
| T07 | 87 | 7.79 | 0.0% | 0.52 |
| T08 | 43 | 7.81 | 0.0% | 0.44 |
| T09 | 101 | 7.85 | 0.3% | 0.49 |
| T10 | 71 | 7.86 | 0.5% | 0.55 |
| T11 | 24 | 7.92 | 0.0% | 0.49 |
| T12 | 36 | 8.14 | 0.0% | 0.49 |
| T13 | 58 | 8.19 | 0.2% | 0.42 |
| T14 | 76 | 8.25 | 0.8% | 0.48 |
| T15 | 41 | 8.49 | 0.0% | 0.50 |
| T16 | 94 | 8.49 | 0.5% | 0.48 |

## Zone position by state

### outside-zone fraction

Overall high (T01–T04) vs low (T13–T16): **0.3%** vs **0.4%** (diff -0.2 pp, Cohen's d=-0.03, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: Zone travel ranks first. zoneWalk=0.8, zoneBuffer=10 s. The champion should almost never farm or fight its way into a late outside-zone death.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Zone is always known.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 0.1% | 0.3% | -0.2 pp | -0.05 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 0.6% | 0.7% | -0.0 pp | -0.00 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 0.8% | 0.0% | +0.8 pp | 0.12 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 17.6% | 15.7% | +2.0 pp | 0.05 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| alive=alive_13_16 | 0.0% | 0.0% | +0.0 pp | 0.00 | 6916/9276 ticks, 122/128 matches | ok |
| alive=alive_9_12 | 0.3% | 0.6% | -0.3 pp | -0.05 | 8335/9797 ticks, 112/120 matches | ok |
| alive=alive_5_8 | 0.3% | 0.6% | -0.3 pp | -0.05 | 10858/10766 ticks, 97/95 matches | ok |
| alive=alive_2_4 | 0.6% | 0.8% | -0.2 pp | -0.03 | 6076/3957 ticks, 64/58 matches | ok |
| hp=hp_ge_90 | 0.1% | 0.1% | -0.0 pp | -0.00 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 0.5% | 1.1% | -0.6 pp | -0.07 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 0.5% | 0.9% | -0.4 pp | -0.05 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 1.0% | 1.7% | -0.7 pp | -0.06 | 1644/1678 ticks, 117/127 matches | ok |
| eng=eng_0 | 0.3% | 0.5% | -0.2 pp | -0.04 | 26639/27690 ticks, 122/128 matches | ok |
| eng=eng_1 | 0.1% | 0.1% | +0.0 pp | 0.00 | 5349/5827 ticks, 122/128 matches | ok |
| eng=eng_2plus | 0.0% | 0.0% | +0.0 pp | 0.00 | 197/279 ticks, 54/69 matches | small n — no conclusion |

### mean zone ratio (distance/radius)

Overall high (T01–T04) vs low (T13–T16): **0.50** vs **0.47** (diff +0.03, Cohen's d=0.15, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: P29 midring settle is on: after a shrink, if we are outside the 0.40–0.70 band, walk to 0.55 of the radius on our side, then sit; off at r≤70. Zone travel, engage, retreat, drops and farm all still rank above it. P45 Step A is measuring whether a better *spot* in that band is available; do not retune the trigger here.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 0.50 | 0.46 | +0.03 | 0.15 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 0.52 | 0.49 | +0.03 | 0.12 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 0.52 | 0.50 | +0.03 | 0.12 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 0.70 | 0.77 | -0.07 | -0.16 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| alive=alive_13_16 | 0.49 | 0.48 | +0.01 | 0.05 | 6916/9276 ticks, 122/128 matches | ok |
| alive=alive_9_12 | 0.50 | 0.44 | +0.06 | 0.28 | 8335/9797 ticks, 112/120 matches | ok |
| alive=alive_5_8 | 0.51 | 0.48 | +0.03 | 0.16 | 10858/10766 ticks, 97/95 matches | ok |
| alive=alive_2_4 | 0.50 | 0.51 | -0.01 | -0.03 | 6076/3957 ticks, 64/58 matches | ok |
| hp=hp_ge_90 | 0.51 | 0.48 | +0.03 | 0.15 | 21999/23049 ticks, 122/128 matches | ok |
| hp=hp_50_90 | 0.48 | 0.45 | +0.03 | 0.14 | 6501/6796 ticks, 120/128 matches | ok |
| hp=hp_30_50 | 0.48 | 0.44 | +0.04 | 0.16 | 2041/2273 ticks, 116/124 matches | ok |
| hp=hp_lt_30 | 0.48 | 0.47 | +0.01 | 0.06 | 1644/1678 ticks, 117/127 matches | ok |

## What could not be measured

- The exact second a team *decided* to rotate (intent) vs the second it crossed in. We can only show position vs shrink schedule.

