# Loadout and upgrades

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.38 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 21:29 ET. Corpus: 128 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 975 mech-rows, 138607 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
What T01–T16 end up holding, how fast they arm, and how cube stacks change with phase.

## Per-team overall (match-level, games_raw)

| label | n_games | mean_place | laser_share | lightning_share | gun_share | laser_t | first_weapon_t | upgrades_n | cubes_max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| T01 | 98 | 6.69 | 42.77 | 1.39 | 55.20 | 48.61 | 22.09 | 2.88 | 9.99 |
| T02 | 65 | 7.20 | 23.11 | 9.78 | 67.12 | 21.05 | 19.47 | 1.85 | 5.29 |
| T03 | 32 | 7.25 | 40.84 | 2.60 | 56.55 | 25.30 | 13.72 | 2.84 | 10.25 |
| T04 | 26 | 7.46 | 31.00 | 3.04 | 65.20 | 32.73 | 14.65 | 2.58 | 8.62 |
| T05 | 43 | 7.70 | 25.19 | 5.05 | 69.77 | 65.64 | 30.70 | 2.53 | 7.86 |
| T06 | 80 | 7.76 | 19.23 | 8.46 | 72.30 | 37.07 | 27.49 | 1.88 | 4.83 |
| T07 | 87 | 7.79 | 33.53 | 3.37 | 61.46 | 45.01 | 20.07 | 2.17 | 6.94 |
| T08 | 43 | 7.81 | 28.03 | 4.27 | 67.69 | 62.56 | 27.19 | 2.21 | 6.49 |
| T09 | 101 | 7.85 | 25.92 | 6.97 | 67.11 | 51.61 | 20.73 | 2.19 | 6.45 |
| T10 | 71 | 7.86 | 12.75 | 2.80 | 83.87 | 46.57 | 28.85 | 1.25 | 2.89 |
| T11 | 24 | 7.92 | 27.95 | 7.85 | 64.21 | 53.77 | 40.36 | 2.29 | 5.62 |
| T12 | 36 | 8.14 | 30.08 | 6.36 | 63.56 | 44.08 | 20.81 | 2.14 | 6.33 |
| T13 | 58 | 8.19 | 19.79 | 4.89 | 75.32 | 31.36 | 16.92 | 2.59 | 8.41 |
| T14 | 76 | 8.25 | 31.46 | 1.47 | 65.88 | 36.55 | 21.10 | 1.72 | 4.53 |
| T15 | 41 | 8.49 | 29.65 | 9.45 | 60.91 | 44.82 | 19.58 | 1.63 | 4.05 |
| T16 | 94 | 8.49 | 29.07 | 3.28 | 66.64 | 22.92 | 16.43 | 1.91 | 4.87 |

## End-of-life (or end-of-match) loadout mix from the last 1 Hz tick (high n=224, low n=272)

| loadout | high | low |
| --- | ---: | ---: |
| gun+mortar | 2.2% | 6.2% |
| gun_only | 18.8% | 23.2% |
| laser | 55.8% | 51.8% |
| laser+lightning | 3.6% | 0.7% |
| lightning | 19.6% | 18.0% |

Champion: LASER_RUSH_ON in the first 45 s (no enemy-near test; damage in the last 3 s aborts). LATE_LIGHT_ON continues laser/lightning walks after that while gun-only. LIGHT_AMBUSH_ON for lightning-without-laser vs one enemy at 45–90 m. Upgrade offers are taken through the existing offer code; B21 (upgrade order) lost on the site.

## What could not be measured

- Exact upgrade *choices* (which of the three offers) are in the stream as `upgrade` events with an `up` name, but stacking them into a fair per-team order needs more offer-context than this pass scored. We report counts and first times, not a recommended upgrade ladder, because winners' first upgrades were already mixed in findings.md.
- Enemy upgrade lists are not visible to the bot (only cubes, when the enemy is in view).

## Cubes by state

### cubes held

Overall high (T01–T04) vs low (T13–T16): **6.17** vs **4.67** (diff +1.50, Cohen's d=0.20, 32185/33796 ticks, 122/128 matches, ok).

Champion P34 in this situation: Farm (FARM_ENEMY_M=160, hunt 150 m) and the early laser rush (45 s, trip ≤ 250 m) plus LATE_LIGHT_ON after that for gun-only, are in the stack. P34 lethal release is on. A dedicated upgrade-order build (B21) lost on the site. P43 (UPGRADE_DPS_TIER_ON) is research only. Late cubes-held at 2–4 alive is partly a survival confound.

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Our cubes and upgrades are always known. Visible enemies expose `cubes` but not their upgrade list.

| bucket | high | low | diff | d | n (high/low) | enough? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| phase=early | 3.42 | 3.18 | +0.23 | 0.05 | 23707/26207 ticks, 122/128 matches | ok |
| phase=mid | 13.67 | 9.47 | +4.20 | 0.40 | 8207/7323 ticks, 77/71 matches | ok |
| phase=late | 19.57 | 18.69 | +0.88 | 0.07 | 254/183 ticks, 13/8 matches | small n — no conclusion |
| phase=final | 18.76 | 17.25 | +1.51 | 0.17 | 17/83 ticks, 4/4 matches | small n — no conclusion |
| alive=alive_13_16 | 0.80 | 1.03 | -0.22 | -0.16 | 6916/9276 ticks, 122/128 matches | ok |
| alive=alive_9_12 | 2.54 | 3.26 | -0.73 | -0.24 | 8335/9797 ticks, 112/120 matches | ok |
| alive=alive_5_8 | 6.66 | 6.16 | +0.50 | 0.08 | 10858/10766 ticks, 97/95 matches | ok |
| alive=alive_2_4 | 16.36 | 12.59 | +3.78 | 0.33 | 6076/3957 ticks, 64/58 matches | ok |

