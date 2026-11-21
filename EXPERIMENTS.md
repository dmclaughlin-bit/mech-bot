# Experiments

One row per practice submission, newest first. Keep a change only if it gains about +1.2 or more, or is clearly right on mechanism and costs no more than −0.6. See `AI-Structure-Development.md`. **Parent** is the commit the change is measured against; repeats of one commit get their own rows. Grok's verdict rules: `coord/GROK_BRIEF.md`.

| Time (ET) | Commit | Parent | Params | Score | Hypothesis (rule ID) | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Fri 9:27 PM | `406ab9f` | `4726cfc` | `params.ts` defaults | 2.23 | Build 3: Z1 path-aware nav (PR #7, BB-955D92D8) | +0.06 vs Build 2 mean 2.17. KEEP: under +1.2, mechanism right and above −0.6. Auto final entry. Board 9:40 PM ET: 81st of 108; 32nd is 4.04 |
| Fri 9:21 PM | `4726cfc` | `4726cfc` | `params.ts` defaults | 2.17 | S3: identical Build 2 resubmit (D7, Q1, BB-89ECDFF6) | Δ 0.00 vs S2. Same to two decimals; practice looks frozen |
| Fri 8:55 PM | `4726cfc` | `76aabfa` | `params.ts` defaults | 2.17 | Build 2 survival-min | +0.50 vs S1. Keep: under +1.2, but the mechanism is right and it is well above −0.6 |
| Fri 7:50 PM | `76aabfa` | `7a22fee` | — | 1.67 | Build 1 aiming + tracking | +0.52 vs kit baseline |
| — | `7a22fee` | — | — | 1.15 (kit example bot, published baseline) | Starting point | — |
