# Loadout and upgrades

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.17 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 15:43 ET. Corpus: 93 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 868 mech-rows, 115655 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
What T01–T16 end up holding, how fast they arm, and how cube stacks change with phase.

## Per-team overall (match-level, games_raw)

| label | n_games | mean_place | laser_share | lightning_share | gun_share | laser_t | first_weapon_t | upgrades_n | cubes_max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| T01 | 67 | 7.10 | 42.60 | 1.48 | 54.98 | 37.07 | 17.10 | 2.90 | 10.55 |
| T02 | 65 | 7.20 | 23.11 | 9.78 | 67.12 | 21.05 | 19.47 | 1.85 | 5.29 |
| T03 | 32 | 7.25 | 40.84 | 2.60 | 56.55 | 25.30 | 13.72 | 2.84 | 10.25 |
| T04 | 26 | 7.46 | 31.00 | 3.04 | 65.20 | 32.73 | 14.65 | 2.58 | 8.62 |
| T05 | 21 | 7.62 | 28.74 | 9.65 | 61.62 | 51.49 | 23.14 | 1.81 | 4.57 |
| T06 | 64 | 7.78 | 20.90 | 6.06 | 73.05 | 41.93 | 23.08 | 1.80 | 4.69 |
| T07 | 78 | 7.83 | 19.04 | 8.22 | 72.73 | 38.03 | 28.28 | 1.85 | 4.76 |
| T08 | 68 | 7.94 | 26.18 | 5.30 | 68.53 | 54.50 | 25.33 | 2.24 | 6.56 |
| T09 | 54 | 7.94 | 28.72 | 2.22 | 69.06 | 51.47 | 31.68 | 2.11 | 5.93 |
| T10 | 58 | 8.19 | 19.79 | 4.89 | 75.32 | 31.36 | 16.92 | 2.59 | 8.41 |
| T11 | 76 | 8.25 | 31.46 | 1.47 | 65.88 | 36.55 | 21.10 | 1.72 | 4.53 |
| T12 | 56 | 8.25 | 26.40 | 3.23 | 67.80 | 47.85 | 26.56 | 1.55 | 4.59 |
| T13 | 50 | 8.40 | 15.06 | 2.10 | 82.84 | 41.06 | 37.03 | 1.26 | 2.88 |
| T14 | 53 | 8.60 | 35.47 | 4.64 | 59.15 | 24.54 | 15.71 | 2.92 | 10.00 |
| T15 | 39 | 8.62 | 12.42 | 9.62 | 77.95 | 30.84 | 35.75 | 1.92 | 5.49 |
| T16 | 61 | 8.67 | 24.39 | 3.34 | 72.00 | 26.10 | 20.77 | 1.54 | 3.52 |

## End-of-life (or end-of-match) loadout mix from the last 1 Hz tick (high n=190, low n=205)

| loadout | high | low |
| --- | ---: | ---: |
| gun+mortar | 2.6% | 4.9% |
| gun_only | 20.0% | 28.3% |
| laser | 53.2% | 39.0% |
| laser+lightning | 4.2% | 1.0% |
| lightning | 20.0% | 26.8% |

Champion: LASER_RUSH_ON in the first 45 s (no enemy-near test; damage in the last 3 s aborts). LATE_LIGHT_ON continues laser/lightning walks after that while gun-only. LIGHT_AMBUSH_ON for lightning-without-laser vs one enemy at 45–90 m. Upgrade offers are taken through the existing offer code; B21 (upgrade order) lost on the site.

## What could not be measured

- Exact upgrade *choices* (which of the three offers) are in the stream as `upgrade` events with an `up` name, but stacking them into a fair per-team order needs more offer-context than this pass scored. We report counts and first times, not a recommended upgrade ladder, because winners' first upgrades were already mixed in findings.md.
- Enemy upgrade lists are not visible to the bot (only cubes, when the enemy is in view).

## Cubes by state

### cubes held

Overall high (T01–T04) vs low (T13–T16): **6.50** vs **3.98** (diff +2.52, Cohen's d=0.33, 25875/25007 ticks, 88/86 matches, ok).

Champion B113 in this situation: Farm (FARM_ENEMY_M=160, hunt 150 m) and the early laser rush (45 s, trip ≤ 250 m) plus LATE_LIGHT_ON after that for gun-only, are in the stack. A dedicated upgrade-order build (B21) lost on the site.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Our cubes and upgrades are always known. Visible enemies expose `cubes` but not their upgrade list.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 3.57 | 2.81 | +0.75 | 0.16 | 19373/19221 ticks, 88/86 matches | ok |
| phase=mid | 15.05 | 7.95 | +7.10 | 0.69 | 6231/5574 ticks, 54/56 matches | ok |
| phase=late | 19.57 | 4.57 | +15.00 | 1.32 | 254/168 ticks, 13/10 matches | small n — no conclusion |
| phase=final | 18.76 | 6.07 | +12.70 | 1.66 | 17/44 ticks, 4/3 matches | small n — no conclusion |
| alive=alive_13_16 | 0.72 | 1.00 | -0.29 | -0.21 | 5714/7144 ticks, 88/86 matches | ok |
| alive=alive_9_12 | 2.52 | 2.86 | -0.34 | -0.12 | 6405/6967 ticks, 82/79 matches | ok |
| alive=alive_5_8 | 7.17 | 5.55 | +1.63 | 0.24 | 8475/7763 ticks, 72/68 matches | ok |
| alive=alive_2_4 | 16.50 | 9.34 | +7.16 | 0.65 | 5281/3133 ticks, 51/47 matches | ok |

