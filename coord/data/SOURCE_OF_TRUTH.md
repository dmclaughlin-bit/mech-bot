# Source of truth: every change and its site result

The site score is the only truth. This page is built from `coord/data/site_results.csv`, one row per site submission, newest first. Delta is the site score minus the champion score at the time.

Related data: `screens.csv` (sim screens), `hazard_screens.csv` (Wild Sim), `postmortems/` (why losses lost), `ideas.md` (idea family status), `pipeline/data/champion.json` (current best).

| Submitted (ET) | Build | Change | Family | Champion then | Site | Delta | Verdict | Receipt |
|---|---|---|---|---|---|---|---|---|
| 2026-11-21 16:00 ET | B110 | B110 standoff break at 90 s, on 4.17 main | standoff | 4.17 | 3.96 | -0.21 | CLOSE | BB-4E063E2E |
| 2026-11-21 15:55 ET | P21 | P21 contest a lone enemy drop, on 4.17 main | drops | 4.17 | 4.17 | +0.00 | CLOSE | BB-1D97890A |
| 2026-11-21 15:44 ET | B117 | B117 loadout/HP matchup range, on 4.17 main | loadout | 4.17 | 4.08 | -0.09 | CLOSE | BB-A84FCC28 |
| 2026-11-21 15:07 ET | P20 | P20 drop run when hurt and unseen, on 4.17 main | drops | 4.17 | 4.17 | +0.00 | CLOSE | BB-36A427E0 |
| 2026-11-21 14:57 ET | B118 | B118 drop reach DROP_RUN_M 200 -> 260, on 4.17 main | drops | 4.17 | 4.17 | +0.00 | CLOSE | BB-BAC9670C |
| 2026-11-21 14:54 ET | B115 | B115 drop-run arrival lead 5 -> 10 s, on 4.17 main | drops | 4.17 | 4.13 | -0.04 | CLOSE | BB-D76FEDCF |
| 2026-11-21 14:40 ET | B113 | B113 drop reach DROP_RUN_M 150 -> 200, on 4.10 drop-run main | drops | 4.10 | 4.17 | +0.07 | KEEP | BB-09AE8A68 |
| 2026-11-21 14:04 ET | P-B-006 | P-B-006 STANDOFF_BREAK_S 60->45, on 4.10 drop-run main | standoff | 4.10 | 4.02 | -0.08 | CLOSE | BB-A1312E8D |
| 2026-11-21 13:55 ET | B107 | P-D-003 supply-drop run on 4.06 main (DROP_RUN_M=150), rebuilt from B104 | drops | 4.06 | 4.10 | +0.04 | KEEP | BB-DA9AC664 |
| 2026-11-21 13:48 ET | P-D-002 | P-D-002 second-hunter threat forecast (FORECAST2_S=60), built on 4.06 | threat-forecast | 4.06 | 3.79 | -0.27 | CLOSE | BB-8DA0CF9D |
| 2026-11-21 13:39 ET | B108 | P-D-004 H01 finish burst: finish rule compares target HP to summed magazines in reach (FINISH_BURST_ON), built on 4.06 | engage | 4.06 | 3.75 | -0.31 | CLOSE | BB-26BA2735 |
| 2026-11-21 12:58 ET | B106 | P-B-003 lightning ambush also with an uncharged laser (AMBUSH_WITH_LASER_ON), built on B103 | lightning | 4.06 | 3.85 | -0.21 | CLOSE | BB-EC8326F0 |
| 2026-11-21 12:55 ET | B105-PB001 | P-B-001 standoff break (STANDOFF_BREAK_S=60), built on B103 | standoff | 3.92 | 4.06 | +0.14 | KEEP | BB-6EA7D518 |
| 2026-11-21 12:47 ET | B104 | Supply-drop run ON (DROP_RUN_M=150). Flag-on version of PR #93. | drops | 3.79 | 3.88 | +0.09 | CLOSE | BB-A6C704B4 |
| 2026-11-21 12:39 ET | B103 | Lightning ambush (H1): holder of lightning and no laser, seen by exactly one enemy at 45–90 m, steps out of sight and waits (LIGHT_AMBUSH_ON) | lightning | 3.79 | 3.92 | +0.13 | KEEP | BB-DE1ADA05 |
| 2026-11-21 11:47 ET | UF100 | In the first 30 s, keep walking to a laser within 100 m even after a hit (UNDER_FIRE_RUSH_M=100) | opening | 3.79 | 3.79 | +0.00 | TIE | BB-D7178316 |
| 2026-11-21 10:59 ET | B51 | Early corner duel vs one closing enemy, no laser (CORNER_DUEL_ON), rematched on B80 | opening | 3.79 | 3.79 | +0.00 | TIE | BB-2FD05CB0 |
| 2026-11-21 10:57 ET | B26 | Multi-threat fight race at any HP, rematched on B80 | engage | 3.79 | 3.48 | -0.31 | LOSS | BB-58CA917D |
| 2026-11-21 08:50 ET | B94 | P9+P10: late walk outranks cube claim, and late chase is 30 s (LATE_CLAIM_ON) | lightning | 3.79 | 3.73 | -0.06 | LOSS | BB-EA74B72B |
| 2026-11-21 08:44 ET | B100 | After 45 s, B60 cover also fires at 1+ LOS when just hit (LATE_COVER_ON) | cover | 3.79 | 3.50 | -0.29 | LOSS | BB-813FFACF |
| 2026-11-21 08:28 ET | B98 | P12: no finish-engage before 40 s without a laser (NO_EARLY_FINISH_ON) | engage | 3.79 | 3.63 | -0.16 | LOSS | BB-970E5B69 |
| 2026-11-21 08:22 ET | B92 | Start B80's late gun-only walk at 35 s instead of 45 s (LATE_EARLY_ON) | lightning | 3.79 | 3.79 | +0.00 | TIE | BB-ECD38FB6 |
| 2026-11-21 07:50 ET | B90 | P5: keep lightning, drop the gun for a laser (KEEP_LIGHT_ON) | lightning | 3.79 | 3.73 | -0.06 | LOSS | BB-D3165A39 |
| 2026-11-21 07:37 ET | B43 | Idle aim toward likely laser/threat (LASER_SCOUT_ON), rematch on B80 | opening | 3.79 | 3.69 | -0.10 | LOSS | BB-69DCBAF9 |
| 2026-11-21 07:27 ET | B88 | P8: do not start a laser charge under 2+ LOS + hit in last 2 s unless target <50% HP | crossfire | 3.79 | 3.52 | -0.27 | LOSS | BB-485F96CC |
| 2026-11-21 07:20 ET | B86 | P7: late walk may go 400 m after 60 s (LATE_LONG_ON) | lightning | 3.79 | 3.79 | +0.00 | TIE | BB-7A43732D |
| 2026-11-21 06:49 ET | B82 | Wider B60 crossfire cover search ([0.5,1,2,3,4,5] s instead of [1,2,3]), rematch on B80 | crossfire | 3.79 | 3.46 | -0.33 | LOSS | BB-4023B260 |
| 2026-11-21 06:37 ET | B80 | After 45 s, a gun-only bot may walk to lightning/laser (LATE_LIGHT_ON, 250 m, 3 s quiet) | lightning | 3.67 | 3.79 | +0.12 | KEEP | BB-78A44AAF |
| 2026-11-21 06:26 ET | B53 | Take cover after an early kill (POST_KILL_COVER_ON) | cover | 3.67 | 3.50 | -0.17 | LOSS | BB-290B6BD3 |
| 2026-11-21 06:19 ET | B76 | Walk to any special early, ranked by value and distance (includes mortars) | opening | 3.67 | 3.25 | -0.42 | LOSS | BB-3AB97F36 |
| 2026-11-21 05:49 ET | B45 | Glance away from a far, harmless target to find a laser (TRACK_SWEEP_ON) | opening | 3.67 | 3.35 | -0.32 | LOSS | BB-CB222B29 |
| 2026-11-21 05:37 ET | B64 | Start the laser trip through a distant poke (rush-start) | laser-rush | 3.67 | 3.63 | -0.04 | LOSS | BB-061D8305 |
| 2026-11-21 05:26 ET | B68 | Keep a free slot for a laser (refuse lightning until a laser) | lightning | 3.67 | 3.21 | -0.46 | LOSS | BB-ABA74C24 |
| 2026-11-21 05:19 ET | B74 | Finish the last 30 m of a laser walk (do not give up close) | laser-rush | 3.67 | 3.67 | +0.00 | TIE | BB-CD0FED5C |
| 2026-11-21 04:49 ET | B41 | Step to keep shooters in front after rear hits | cover | 3.67 | 3.65 | -0.02 | LOSS | BB-411B5ADB |
| 2026-11-21 04:36 ET | B66 | Swap lightning for a laser when a laser is in reach | lightning | 3.67 | 3.58 | -0.09 | LOSS | BB-4E471C6E |
| 2026-11-21 04:24 ET | B39 | Boost during laser rush (laserdash), rematch on B60 | laser-rush | 3.67 | 3.38 | -0.29 | LOSS | BB-ECAB0443 |
| 2026-11-21 04:17 ET | B60 | Break LOS in a 2-on-1 crossfire (CROSSFIRE_ON, hide distances [1,2,3] s) | crossfire | 3.54 | 3.67 | +0.13 | KEEP | BB-A0BBBFEE |
| 2026-11-21 03:48 ET | B48 | House hit rates in the TTK race (enemy side only) | engage | 3.54 | 3.50 | -0.04 | LOSS | BB-D03F8790 |
| 2026-11-21 03:36 ET | B32 | Laser pre-charge behind cover | laser-rush | 3.54 | 3.48 | -0.06 | LOSS | BB-C5622A3A |
| 2026-11-21 03:23 ET | B40 | Stack: rush-first + pre-charge + backstab | laser-rush | 3.54 | 3.23 | -0.31 | LOSS | BB-2F1AD6E9 |
| 2026-11-21 03:17 ET | B36 | Laser trip before finish-engage (rush-first) | laser-rush | 3.54 | 3.54 | +0.00 | TIE | BB-285D47C5 |
| 2026-11-21 02:48 ET | B30 | Settings comboA: aggression 1.0→1.5, retreatHp 0.35→0.30, LASER_TRIP_M 175→250 | engage | 3.50 | 3.54 | +0.04 | KEEP | BB-5E7DE301 |
| 2026-11-21 02:35 ET | B27 | Strafe while holding a clear line | engage | 3.50 | 3.38 | -0.12 | LOSS | BB-0D0F93D6 |
| 2026-11-21 02:23 ET | B24 | Torso turns toward unseen rear attacker | aim | 3.50 | 3.40 | -0.10 | LOSS | BB-F54B5674 |
| 2026-11-21 02:16 ET | B20+22 | Weapon standoff + calibrated race (stacked) | engage | 3.50 | 3.35 | -0.15 | LOSS | BB-F9B0A975 |
| 2026-11-21 01:47 ET | B23 | Laser-safe early spacing | opening | 3.50 | 3.46 | -0.04 | LOSS | BB-D6AC95A2 |
| 2026-11-21 01:35 ET | B21 | Upgrade order change | upgrades | 3.50 | 3.46 | -0.04 | LOSS | BB-1AFE6423 |
| 2026-11-21 01:23 ET | B17 | Early arm-up: bounded laser/lightning walk in first 45 s (LASER_RUSH_ON; trip 175 m in this commit) | laser-rush | 3.08 | 3.50 | +0.42 | KEEP | BB-FE8FEA0F |
| 2026-11-21 01:16 ET | B19 | Stop sneaking while not hurt (NO_SNEAK_ON) | nav | 2.98 | 3.08 | +0.10 | KEEP | BB-B23070D8 |
| 2026-11-21 00:47 ET | B15 | Aim lead + fire discipline | aim | 2.98 | 2.65 | -0.33 | LOSS | BB-E5918214 |
| 2026-11-21 00:34 ET | B16 | Kill-value target selection (TARGET_PICK_ON) | engage | 2.88 | 2.98 | +0.10 | KEEP | BB-340B47F3 |
| 2026-11-21 00:22 ET | B14 | Fight-or-flee by TTK vs TTD + finish-engage (ENGAGE_ON) | engage | 2.54 | 2.88 | +0.34 | KEEP | BB-2897E011 |
| 2026-11-21 00:12 ET | B13 | Farm reach: hunt drones/crates in view within 150 m (FARM_HUNT_ON) | farm | 2.44 | 2.54 | +0.10 | KEEP | BB-5573AA45 |
| 2026-11-20 23:45 ET | B12 | Farm cubes/drones/crates when no enemy within 160 m (FARM_ON) | farm | 2.38 | 2.44 | +0.06 | KEEP | BB-35E5C75F |
| 2026-11-20 23:33 ET | B11b | nav INFLATE_M 2→2.5 m (mech radius) | nav | 2.38 | 2.10 | -0.28 | LOSS | BB-5BB9D164 |
| 2026-11-20 23:21 ET | B10 | nav.path nearest-reachable fallback | nav | 2.38 | 2.35 | -0.03 | LOSS | BB-9A951653 |
| 2026-11-20 23:12 ET | B8 | Laser first (unbounded seek + charge-steers-torso) | laser-rush | 2.38 | 2.27 | -0.11 | LOSS | BB-DB8A4479 |
| 2026-11-20 22:37 ET | B7 | Drop the 100 m gun fire gate | aim | 2.38 | 2.04 | -0.34 | LOSS | BB-07153949 |
| 2026-11-20 22:32 ET | B6 | Hold behind cover | cover | 2.38 | 2.23 | -0.15 | LOSS | BB-BC5A52AB |
| 2026-11-20 22:21 ET | B5b | Same as B5 but heal keeps firing (no F4 fire gate) | cover | 2.23 | 2.38 | +0.15 | KEEP | BB-54EDF93F |
| 2026-11-20 22:10 ET | B5 | F3/F4/Q2 survival: cover retreat, heal with fire gate, hide from sight cones | cover | 2.23 | 2.04 | -0.19 | LOSS | BB-AA244730 |
| 2026-11-20 21:27 ET | B3 | Wire nav.ts: path-aware zone travel, stuck recovery, 30 ms guard | nav | 2.17 | 2.23 | +0.06 | KEEP | BB-955D92D8 |
| 2026-11-20 21:21 ET | S3 | Identical resubmit of B2 (determinism check) | nav | 2.17 | 2.17 | +0.00 | TIE | BB-89ECDFF6 |
| 2026-11-20 20:55 ET | B2 | Survival-min (terrain in LOS, loot rules, basic retreat/zone) | nav | 1.67 | 2.17 | +0.50 | KEEP | BB-91057C0A |
| 2026-11-20 19:50 ET | B1 | Aiming + tracking (gun lead, laser charge, lightning, mortar lob) | aim | 1.15 | 1.67 | +0.52 | KEEP | BB-92A5D3DC |

## By idea family

| Family | Site tests | Kept |
|---|---|---|
| engage | 9 | 3 |
| lightning | 9 | 2 |
| laser-rush | 8 | 1 |
| nav | 6 | 3 |
| cover | 6 | 1 |
| opening | 6 | 0 |
| aim | 4 | 1 |
| crossfire | 3 | 1 |
| drops | 7 | 2 |
| farm | 2 | 2 |
| standoff | 3 | 1 |
| upgrades | 1 | 0 |
| threat-forecast | 1 | 0 |

Regenerate after every result (Grok).
