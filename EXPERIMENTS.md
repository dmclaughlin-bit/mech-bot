# Experiments

One row per practice submission, newest first. Keep a change only if it gains about +1.2 or more, or is clearly right on mechanism and costs no more than −0.6. See `AI-Structure-Development.md`. **Parent** is the commit the change is measured against; repeats of one commit get their own rows. Grok's verdict rules: `coord/GROK_BRIEF.md`.

| Time (ET) | Commit | Parent | Params | Score | Hypothesis (rule ID) | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Fri 10:32 PM | `1386dd1` | `100941f` | `params.ts` defaults | 2.23 | Build 6: hold behind cover (PR #12, BB-BC5A52AB) | −0.15 vs Build 5b (2.38). REVERT: PR closed. Board 10:36 PM ET: 93rd of 127 on best 2.38; 32nd is 4.17 |
| Fri 10:21 PM | `100941f` | `406ab9f` | `params.ts` defaults | 2.38 | Build 5b: F3/F4/Q2 without the F4 fire gate (PR #11, BB-54EDF93F) | +0.15 vs Build 3 (2.23), +0.34 vs Build 5. KEEP (deterministic practice: raw gain). Merged as `516f3b3`; now the auto final entry. Board 10:24 PM ET: 88th of 121; 32nd is 4.15 |
| Fri 10:10 PM | `2a0cbad` | `406ab9f` | `params.ts` defaults | 2.04 | Build 5 survival half: F3/F4/Q2 (PR #10, BB-AA244730) | −0.19 vs Build 3 (2.23). INCONCLUSIVE: inside the −0.6/+1.2 band. Not merged; A/B next with `build-5b-f4-fire` (F4 heal without the fire gate). Board 10:15 PM ET: we are 89th of 119 on best 2.23; 32nd is 4.13 |
| Fri 9:27 PM | `406ab9f` | `4726cfc` | `params.ts` defaults | 2.23 | Build 3: Z1 path-aware nav (PR #7, BB-955D92D8) | +0.06 vs Build 2 mean 2.17. KEEP: under +1.2, mechanism right and above −0.6. Auto final entry. Board 9:40 PM ET: 81st of 108; 32nd is 4.04 |
| Fri 9:21 PM | `4726cfc` | `4726cfc` | `params.ts` defaults | 2.17 | S3: identical Build 2 resubmit (D7, Q1, BB-89ECDFF6) | Δ 0.00 vs S2. Same to two decimals; practice looks frozen |
| Fri 8:55 PM | `4726cfc` | `76aabfa` | `params.ts` defaults | 2.17 | Build 2 survival-min | +0.50 vs S1. Keep: under +1.2, but the mechanism is right and it is well above −0.6 |
| Fri 7:50 PM | `76aabfa` | `7a22fee` | — | 1.67 | Build 1 aiming + tracking | +0.52 vs kit baseline |
| — | `7a22fee` | — | — | 1.15 (kit example bot, published baseline) | Starting point | — |
