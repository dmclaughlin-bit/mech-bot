# Drops and crates

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.38 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 21:29 ET. Corpus: 128 complete showdown matches, 1 Hz samples. Labeled teams T01–T16: 975 mech-rows, 138607 tick-rows in this file's scope. T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 best). High = T01–T04, low = T13–T16. A bucket is used for a conclusion only when it has at least 8 matches and 200 ticks (see STATES.md).
Supply-drop and crate behavior for T01–T16. Site tests in the drops family already cover reach, lead, and hurt-unseen runs; this file is for context, not a reason to rerun those.

## Per-team overall

| label | n_games | mean_place | drops_taken | crates | first_cube_t | cubes_max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| T01 | 98 | 6.69 | 0.17 | 2.04 | 26.78 | 9.99 |
| T02 | 65 | 7.20 | 0.06 | 1.18 | 29.13 | 5.29 |
| T03 | 32 | 7.25 | 0.38 | 2.34 | 19.27 | 10.25 |
| T04 | 26 | 7.46 | 0.15 | 1.35 | 17.58 | 8.62 |
| T05 | 43 | 7.70 | 0.00 | 1.09 | 10.93 | 7.86 |
| T06 | 80 | 7.76 | 0.04 | 1.12 | 25.19 | 4.83 |
| T07 | 87 | 7.79 | 0.22 | 1.01 | 26.51 | 6.94 |
| T08 | 43 | 7.81 | 0.00 | 1.21 | 12.73 | 6.49 |
| T09 | 101 | 7.85 | 0.00 | 1.24 | 21.69 | 6.45 |
| T10 | 71 | 7.86 | 0.07 | 0.97 | 22.84 | 2.89 |
| T11 | 24 | 7.92 | 0.00 | 1.21 | 27.15 | 5.62 |
| T12 | 36 | 8.14 | 0.00 | 1.22 | 12.07 | 6.33 |
| T13 | 58 | 8.19 | 0.17 | 1.00 | 15.11 | 8.41 |
| T14 | 76 | 8.25 | 0.09 | 1.58 | 17.85 | 4.53 |
| T15 | 41 | 8.49 | 0.00 | 1.12 | 12.56 | 4.05 |
| T16 | 94 | 8.49 | 0.14 | 1.45 | 20.11 | 4.87 |

## Match-level drop and crate counts (games_raw)

Mean drops taken, high vs low: 0.17 (n=221) vs 0.11 (n=269).

Mean crates opened, high vs low: 1.75 vs 1.34.

Stream drop events logged: 918. Crate-open events: 2516.

Champion: DROP_RUN_M=200 m, arrive with a 5 s lead, only if not hurt (HP ≥ 0.3), the drop is not held by someone else, and the capture is zone-safe. Farm can also walk to a landed drop within 80 m when no enemy is known within 160 m. Engage, retreat, kill-claim, the laser walk, crossfire, and the lightning ambush all rank above a drop run.

Site family **drops** already has several official tests on this stack: B113 KEEP 4.17 (200 m reach, still in the champion), B115 CLOSE 4.13 (10 s lead, −0.04), B118 CLOSE 4.17 tie (260 m), P20 CLOSE 4.17 tie (run while hurt and unseen), P27 CLOSE 4.13 (drop-crossfire skip). P34b2 (lethal drop gate) is building. Do not re-test reach, lead, or hurt-unseen drop runs without a genuinely new mechanism. Same-family-as-recent-loss ranks last.

## What could not be measured cleanly

- Contested vs uncontested capture is only as good as drop event `op`/`holder` fields in a given recording. Some files log `call` but not a clean `capture` with holder context. We do not invent take-condition percentages when the event is missing.
- Intent to rotate to a drop vs passing through the ring.

