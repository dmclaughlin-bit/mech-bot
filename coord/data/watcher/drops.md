# Drops and crates

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.17 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 15:43 ET. Corpus: 93 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 868 mech-rows, 115655 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
Supply-drop and crate behavior for T01–T16. Site tests in the drops family already cover reach, lead, and hurt-unseen runs; this file is for context, not a reason to rerun those.

## Per-team overall

| label | n_games | mean_place | drops_taken | crates | first_cube_t | cubes_max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| T01 | 67 | 7.10 | 0.22 | 2.01 | 32.26 | 10.55 |
| T02 | 65 | 7.20 | 0.06 | 1.18 | 29.13 | 5.29 |
| T03 | 32 | 7.25 | 0.38 | 2.34 | 19.27 | 10.25 |
| T04 | 26 | 7.46 | 0.15 | 1.35 | 17.58 | 8.62 |
| T05 | 21 | 7.62 | 0.00 | 1.19 | 10.49 | 4.57 |
| T06 | 64 | 7.78 | 0.00 | 1.05 | 16.74 | 4.69 |
| T07 | 78 | 7.83 | 0.04 | 1.13 | 25.51 | 4.76 |
| T08 | 68 | 7.94 | 0.00 | 1.24 | 25.55 | 6.56 |
| T09 | 54 | 7.94 | 0.00 | 1.20 | 21.01 | 5.93 |
| T10 | 58 | 8.19 | 0.17 | 1.00 | 15.11 | 8.41 |
| T11 | 76 | 8.25 | 0.09 | 1.58 | 17.85 | 4.53 |
| T12 | 56 | 8.25 | 0.21 | 0.77 | 37.92 | 4.59 |
| T13 | 50 | 8.40 | 0.04 | 0.88 | 26.52 | 2.88 |
| T14 | 53 | 8.60 | 0.21 | 1.30 | 22.20 | 10.00 |
| T15 | 39 | 8.62 | 0.00 | 0.97 | 32.20 | 5.49 |
| T16 | 61 | 8.67 | 0.00 | 0.80 | 20.27 | 3.52 |

## Match-level drop and crate counts (games_raw)

Mean drops taken, high vs low: 0.18 (n=190) vs 0.06 (n=203).

Mean crates opened, high vs low: 1.69 vs 0.99.

Stream drop events logged: 655. Crate-open events: 1746.

Champion: DROP_RUN_M=200 m, arrive with a 5 s lead, only if not hurt (HP ≥ 0.3), the drop is not held by someone else, and the capture is zone-safe. Farm can also walk to a landed drop within 80 m when no enemy is known within 160 m. Engage, retreat, kill-claim, the laser walk, crossfire, and the lightning ambush all rank above a drop run.

Site family **drops** already has several official tests on this champion stack: B113 KEEP 4.17 (200 m reach), B115 CLOSE 4.13 (10 s lead, −0.04), B118 CLOSE 4.17 tie (260 m), P20 CLOSE 4.17 tie (run while hurt and unseen). Do not re-test reach, lead, or hurt-unseen drop runs without a genuinely new mechanism. Same-family-as-recent-loss ranks last.

## What could not be measured cleanly

- Contested vs uncontested capture is only as good as drop event `op`/`holder` fields in a given recording. Some files log `call` but not a clean `capture` with holder context. We do not invent take-condition percentages when the event is missing.
- Intent to rotate to a drop vs passing through the ring.

