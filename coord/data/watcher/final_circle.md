# Final circle

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.38 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 21:29 ET. Corpus: 128 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 975 mech-rows, 465 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
HP, position, cover, and survival once the zone radius is 70 m or tighter.

## Per-team games_raw circ70_hpfrac (blank if they never reached it in that extractor)

| label | n_games | mean_place | circ70_hpfrac_games |
| --- | ---: | ---: | ---: |
| T01 | 98 | 6.69 | 0.70 |
| T02 | 65 | 7.20 | 0.59 |
| T03 | 32 | 7.25 | — |
| T04 | 26 | 7.46 | 0.68 |
| T05 | 43 | 7.70 | — |
| T06 | 80 | 7.76 | 0.95 |
| T07 | 87 | 7.79 | 0.72 |
| T08 | 43 | 7.81 | 1.00 |
| T09 | 101 | 7.85 | 0.78 |
| T10 | 71 | 7.86 | 0.95 |
| T11 | 24 | 7.92 | — |
| T12 | 36 | 8.14 | 0.76 |
| T13 | 58 | 8.19 | 1.00 |
| T14 | 76 | 8.25 | 1.00 |
| T15 | 41 | 8.49 | 0.81 |
| T16 | 94 | 8.49 | 1.00 |

## Entering r ≤ 70 (n matches with at least one labeled tick: 17)

HP frac on the first 1 Hz tick with r ≤ 70 — high: 0.64 (n=4) vs low: 0.96 (n=5).

Zone ratio at entry — high: 0.77 vs low: 0.50.

Cubes at entry — high: 16.8 vs low: 17.

games_raw circ70_hpfrac (older extractor, may be blank when the mech never reached r ≤ 70) — high: 0.64 (n=4) vs low: 0.96 (n=5).

Many showdowns end before a tight final circle, so n is smaller than the full corpus. Buckets below are only conclusive when they meet the minimum n in STATES.md.

Champion: no dedicated final-circle stand policy beyond zone-keep first, heal/hold, and the usual engage rules. Timeout ranking is by HP (protocol §4); zone damage ignores armor.

## Final-circle ticks by state

### HP frac in the final circle

Overall high (T01–T04) vs low (T13–T16): **0.50** vs **0.72** (diff -0.22, Cohen's d=-0.79, 17/83 ticks, 4/4 matches, small n — no conclusion).

Champion P34 in this situation: No special final HP policy beyond heal/retreat.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| edge=center | 0.50 | 0.72 | -0.23 | -0.75 | 3/15 ticks, 2/3 matches | small n — no conclusion |
| edge=midring | 0.69 | 0.64 | +0.05 | 0.17 | 6/33 ticks, 2/4 matches | small n — no conclusion |
| edge=edge | 0.43 | 0.90 | -0.47 | -2.57 | 5/22 ticks, 1/3 matches | small n — no conclusion |
| edge=outside | 0.25 | 0.62 | -0.36 | -1.49 | 3/13 ticks, 2/2 matches | small n — no conclusion |
| eng=eng_0 | 0.59 | 0.77 | -0.19 | — | 2/56 ticks, 2/4 matches | small n — no conclusion |
| eng=eng_1 | 0.49 | 0.61 | -0.12 | -0.42 | 15/27 ticks, 4/3 matches | small n — no conclusion |
| load=laser | 0.36 | 0.73 | -0.37 | -1.39 | 8/72 ticks, 2/4 matches | small n — no conclusion |
| load=lightning | 0.62 | 0.62 | +0.00 | 0.00 | 9/11 ticks, 2/1 matches | small n — no conclusion |

### cover in the final circle

Overall high (T01–T04) vs low (T13–T16): **70.6%** vs **81.9%** (diff -11.3 pp, Cohen's d=-0.29, 17/83 ticks, 4/4 matches, small n — no conclusion).

Champion P34 in this situation: Same cover stack as above; late-cover site tests already lost.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| eng=eng_0 | 100.0% | 89.3% | +10.7 pp | — | 2/56 ticks, 2/4 matches | small n — no conclusion |
| eng=eng_1 | 66.7% | 66.7% | +0.0 pp | 0.00 | 15/27 ticks, 4/3 matches | small n — no conclusion |
| hp=hp_ge_90 | 50.0% | 84.4% | -34.4 pp | — | 2/32 ticks, 1/4 matches | small n — no conclusion |
| hp=hp_50_90 | 50.0% | 81.2% | -31.2 pp | -0.76 | 8/32 ticks, 3/4 matches | small n — no conclusion |
| hp=hp_30_50 | 100.0% | 91.7% | +8.3 pp | — | 1/12 ticks, 1/3 matches | small n — no conclusion |
| hp=hp_lt_30 | 100.0% | 57.1% | +42.9 pp | 1.17 | 6/7 ticks, 3/3 matches | small n — no conclusion |

### outside in the final circle

Overall high (T01–T04) vs low (T13–T16): **17.6%** vs **15.7%** (diff +2.0 pp, Cohen's d=0.05, 17/83 ticks, 4/4 matches, small n — no conclusion).

Champion P34 in this situation: Zone-keep already ranks first.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| hp=hp_ge_90 | 0.0% | 3.1% | -3.1 pp | — | 2/32 ticks, 1/4 matches | small n — no conclusion |
| hp=hp_50_90 | 12.5% | 25.0% | -12.5 pp | -0.30 | 8/32 ticks, 3/4 matches | small n — no conclusion |
| hp=hp_30_50 | 0.0% | 16.7% | -16.7 pp | — | 1/12 ticks, 1/3 matches | small n — no conclusion |
| hp=hp_lt_30 | 33.3% | 28.6% | +4.8 pp | 0.10 | 6/7 ticks, 3/3 matches | small n — no conclusion |

## What could not be measured

- 8:00 timeout HP ranking is rare in this exhibition corpus (matches are often shorter). Do not invent an 8:00 table.
- Who 'should have' rotated to a better final rock: no planned-position field exists.

