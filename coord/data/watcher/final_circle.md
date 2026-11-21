# Final circle

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.17 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 15:43 ET. Corpus: 93 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 868 mech-rows, 212 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
HP, position, cover, and survival once the zone radius is 70 m or tighter.

## Per-team games_raw circ70_hpfrac (blank if they never reached it in that extractor)

| label | n_games | mean_place | circ70_hpfrac_games |
| --- | ---: | ---: | ---: |
| T01 | 67 | 7.10 | 0.70 |
| T02 | 65 | 7.20 | 0.59 |
| T03 | 32 | 7.25 | — |
| T04 | 26 | 7.46 | 0.68 |
| T05 | 21 | 7.62 | — |
| T06 | 64 | 7.78 | 0.94 |
| T07 | 78 | 7.83 | 0.95 |
| T08 | 68 | 7.94 | 0.73 |
| T09 | 54 | 7.94 | 0.99 |
| T10 | 58 | 8.19 | 1.00 |
| T11 | 76 | 8.25 | 1.00 |
| T12 | 56 | 8.25 | 0.26 |
| T13 | 50 | 8.40 | 0.84 |
| T14 | 53 | 8.60 | — |
| T15 | 39 | 8.62 | — |
| T16 | 61 | 8.67 | 1.00 |

## Entering r ≤ 70 (n matches with at least one labeled tick: 12)

HP frac on the first 1 Hz tick with r ≤ 70 — high: 0.64 (n=4) vs low: 0.90 (n=3).

Zone ratio at entry — high: 0.77 vs low: 0.95.

Cubes at entry — high: 16.8 vs low: 4.3.

games_raw circ70_hpfrac (older extractor, may be blank when the mech never reached r ≤ 70) — high: 0.64 (n=4) vs low: 0.90 (n=3).

Many showdowns end before a tight final circle, so n is smaller than the full corpus. Buckets below are only conclusive when they meet the minimum n in STATES.md.

Champion: no dedicated final-circle stand policy beyond zone-keep first, heal/hold, and the usual engage rules. Timeout ranking is by HP (protocol §4); zone damage ignores armor.

## Final-circle ticks by state

### HP frac in the final circle

Overall high (T01–T04) vs low (T13–T16): **0.50** vs **0.70** (diff -0.20, Cohen's d=-0.62, 17/44 ticks, 4/3 matches, small n — no conclusion).

Champion B113 in this situation: No special final HP policy beyond heal/retreat.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| edge=center | 0.50 | 0.39 | +0.11 | — | 3/1 ticks, 2/1 matches | small n — no conclusion |
| edge=midring | 0.69 | 0.54 | +0.14 | 0.43 | 6/14 ticks, 2/2 matches | small n — no conclusion |
| edge=edge | 0.43 | 0.94 | -0.51 | -3.92 | 5/19 ticks, 1/1 matches | small n — no conclusion |
| edge=outside | 0.25 | 0.48 | -0.23 | -0.87 | 3/10 ticks, 2/2 matches | small n — no conclusion |
| eng=eng_0 | 0.59 | 0.73 | -0.14 | — | 2/30 ticks, 2/3 matches | small n — no conclusion |
| eng=eng_1 | 0.49 | 0.62 | -0.13 | -0.45 | 15/14 ticks, 4/2 matches | small n — no conclusion |
| load=laser | 0.36 | 0.74 | -0.38 | -1.28 | 8/31 ticks, 2/2 matches | small n — no conclusion |
| load=lightning | 0.62 | 0.58 | +0.04 | 0.12 | 9/13 ticks, 2/1 matches | small n — no conclusion |

### cover in the final circle

Overall high (T01–T04) vs low (T13–T16): **70.6%** vs **100.0%** (diff -29.4 pp, Cohen's d=-1.24, 17/44 ticks, 4/3 matches, small n — no conclusion).

Champion B113 in this situation: Same cover stack as above; late-cover site tests already lost.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| eng=eng_0 | 100.0% | 100.0% | +0.0 pp | — | 2/30 ticks, 2/3 matches | small n — no conclusion |
| eng=eng_1 | 66.7% | 100.0% | -33.3 pp | -0.98 | 15/14 ticks, 4/2 matches | small n — no conclusion |
| hp=hp_ge_90 | 50.0% | 100.0% | -50.0 pp | — | 2/20 ticks, 1/2 matches | small n — no conclusion |
| hp=hp_50_90 | 50.0% | 100.0% | -50.0 pp | -1.46 | 8/9 ticks, 3/2 matches | small n — no conclusion |
| hp=hp_30_50 | 100.0% | 100.0% | +0.0 pp | — | 1/5 ticks, 1/2 matches | small n — no conclusion |
| hp=hp_lt_30 | 100.0% | 100.0% | +0.0 pp | 0.00 | 6/10 ticks, 3/3 matches | small n — no conclusion |

### outside in the final circle

Overall high (T01–T04) vs low (T13–T16): **17.6%** vs **22.7%** (diff -5.1 pp, Cohen's d=-0.12, 17/44 ticks, 4/3 matches, small n — no conclusion).

Champion B113 in this situation: Zone-keep already ranks first.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| hp=hp_ge_90 | 0.0% | 0.0% | +0.0 pp | — | 2/20 ticks, 1/2 matches | small n — no conclusion |
| hp=hp_50_90 | 12.5% | 55.6% | -43.1 pp | -1.01 | 8/9 ticks, 3/2 matches | small n — no conclusion |
| hp=hp_30_50 | 0.0% | 40.0% | -40.0 pp | — | 1/5 ticks, 1/2 matches | small n — no conclusion |
| hp=hp_lt_30 | 33.3% | 30.0% | +3.3 pp | 0.07 | 6/10 ticks, 3/3 matches | small n — no conclusion |

## What could not be measured

- 8:00 timeout HP ranking is rare in this exhibition corpus (matches are often shorter). Do not invent an 8:00 table.
- Who 'should have' rotated to a better final rock: no planned-position field exists.

