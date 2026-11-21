# P-B-008 iteration 3 — movement modes 30–44 (SIM-ONLY)

Research / sim-only. Written Saturday 21 November 2026, 5:05 PM ET (finished after the 4:10 PM ET usage reset). Nothing here is a site candidate, a merge to main, or a queue instruction. `EVADE_MODE` stays 0 on this branch. Other invited teams are not named. Every number below comes from a CSV in `/tmp/pb008i3/out/` produced by `tools/sim/measure_movement.ts` on this branch. No number is invented, and missing cells are marked "—" or called out.

**The site score is the only truth.** The sim is a screen. It is largely blind to drop-run gains (see Caveats).

## Bottom line

- **Mode 36 (drop commitment, isolated on champion movement) is the only mode that clears the iteration-3 pass bar on both seed sets.** Pooled over 384 games (SEED_BASE 2000–5000): score −0.016 ± 0.024 (paired; only 22 of 384 games change), drop rings reached 12 → 14, holds completed 10 → 11, drops captured 10 → 12, drop-run → break-crossfire flips 211 → 39, total oscillation 224 → 202, quiet oscillation 66 → 66, pins 352 → 327, alive at end 11 → 11, top-4 16 → 16. Pin seeds 41/43/72/92 are identical to mode 0. It does not move headline survival. Its value would be on the site, where drops matter more than the sim can show.
- **Mode 40b (v2 pathing 30 + 36) is a strong pathing fix but costs end-game survival on held-out.** Pooled 384: pins 352 → 60, nav.stuck trips 8805 → 2477, quiet osc 66 → 46, rings 12 → 15, holds 10 → 13, captures 10 → 14. But score −0.117 ± 0.081, alive at end 11 → 8, top-4 16 → 13, 2+ attacker deaths 193 → 205. On SEED_BASE 2000+3000 it was +0.068 ± 0.105; on held-out 4000+5000 it was −0.302 ± 0.123. Mode 44 (40b without the zone sprint) is no better on held-out (−0.219 ± 0.116), so the cost is in the slide/jet pathing itself, not the sprint.
- **Danger strafe (31), sprint (32), hops (34), 34+36 (41):** fail. Hit rate on us dips with sprint/hops (0.181 → 0.176 / 0.173; damage taken −48 ± 41 for 34). But oscillation rises 3–4.5× (84 → 249–379), drop rings fall (6 → 4–7, holds 5 → 2–4), alive at end 6 → 2–3, and 2+ attacker deaths 95 → 111–117.
- **Outnumbered escape (35, 35-v3, 42):** best early survival in the whole screen. Mode 35: died before 40 s 56 → 33, surv 60 s 0.448 → 0.583, score +0.427 ± 0.176. But it fails drop rings (6 → 5; 35-v3 → 2; 42 → 4), oscillation (84 → 286; v3 197) and final-circle survival (0.036 → 0.021 / 0.016). It shifts deaths from early to late (deaths at ≥120 s 27 → 39).
- **Torso sway (37, literal) is a large loss:** our gun hit rate 0.825 → 0.108, kills 3.33 → 0.10, score −3.271 ± 0.224. The idle-only sway (43) still loses (gun 0.677, score −1.010 ± 0.183). **Front-arc (38) cuts rear damage as designed** (rear hit share 0.165 → 0.099, rear damage share 0.227 → 0.154, rear damage/game 386 → 262). Total mech damage taken is unchanged (1703 → 1703/game; paired damage taken −1 ± 17), our kills drop 3.33 → 3.02, and score is −0.328 ± 0.129.
- **Mode 39 (Grok addendum, silent cap lifted while hurt with an enemy within 120 m):** score −0.203 ± 0.125, final 0.036 → 0.021, alive at end 6 → 3. Fails.

## SHAs

- Branch `build-121-movement-iter3`. PR #115 merge into main: `f54a99d7c2574b7a33910dcb3f7128b64d3ccd73`. Harness commit `6fecbe5`. Modes 30–41 `2e95c3d`. Merge of `origin/main` 1781116: `452e211`. v2 pathing (flap breaker, recharge-then-jet) `4f520e3`. Modes 42/43 and escape commitment `c77ab69`. Mode 44 `279e6b5`. The final push SHA is in the PR / summary.
- Code each screen ran: `m30 m31 m32 m34 m35 m36 m37 m38 m39 m40 m41` = `2e95c3d` (snapshot `/tmp/pb008i3/src-v1`). `m30b m40b` = `4f520e3` (`src-v2`). `p35 p42 p43` = `c77ab69` (`src-v3`). `p44` = `279e6b5` (`src-v4`). Modes 36–39 behave the same in every later version (the later changes are behind 30/35/42/43/44 flags only). Existing modes `m0`–`m6` are the merge tree `f54a99d` with the harness, run before this session.
- Origin/main during the run: `1781116` (merged), then `b9661fb` (coord files only; no `.ts` change since `369b52a`).

## Gates

- **Flag 0 identity.** `/tmp/eqdrive.py` on `bot.ts` at HEAD (flag 0) is byte-identical to `origin/main` (1781116) on all 302 lines, checked after every code commit. Sim: flag 0 on the final-v1 tree (`f0`) vs the earlier `m0` screen: 0 of 192 games differ in any column except wall-clock (`bot_ms_*`, `late_over_50ms`).
- **check.py** (`/workspace/mechfight-kit/check/check.py`): PASS for flag 0 (max 3.4 ms), mode 36 (max 3.4 ms) and mode 40b (max 3.5 ms); 300/300 in time. Mode 36 is identical to flag 0 on the check stream: the recorded stream has no drop run under crossfire, so check.py only shows timing there, not behavior.
- **Decision time in the sim.** `bot_ms_max` and `late_over_50ms` in the screens were taken while the box ran other teams' sims (load average ~30 on 8 cores). Mode 36 shows `late50` 21 on set 2000+3000 but 4 vs 3 for mode 0 on held-out. Its only code is one cheaper test that skips a `hideSpot` call. A mode-30 spike of 100 ms on seed 2001 did not reproduce on rerun (18.8 ms, 7.0 ms; same game). I treat these as machine load, not a 30 ms gate fail. check.py is the gate.

## Mode definitions (iteration 3)

All modes are copies of this branch with only the `EVADE_MODE` line in `params.ts` changed. Constants are in `brain.ts` right after `AIM_LAG_S`; the same list is in the `EVADE_MODE` comment in `params.ts`. Flag 0 is unchanged champion 4.17 behavior.

Rules shared by every new mode:
- No new movement replaces `drop, run` or `drop, hold`. The danger strafe only replaces a stand-still in an engage (`engage, ttk` / `engage, finish`), `heal` or `hold`, which are all below the drop run in the champion's decision order. The escape (35) only replaces `hold`, `heal`, `heal, hiding`, `hide`, `engage, standoff` or `lightning ambush`. Torso policies 37 and 38 are skipped in both drop modes. The champion's decision order, triggers and thresholds are unchanged. The one exception is the explicit drop commitment in 36/40/41.
- Modes 30+ do not use iteration 1's muzzle-position aim correction (`AIM_LAG_S`). Modes 1–6 still do. This keeps movement apart from aim.
- Strafe and escape decisions end their debug mode with `, ev`, so the harness counts them as `ep_evade` / `dec_evade`.

| mode | sits on | what it adds |
|---|---|---|
| 30 | champion | **Pathing.** Mode 5's slide-around-cover, with: a 0.6 s commitment on a slid heading (hysteresis); an in-bot oscillation breaker (over the last 20 s, more than 120 m walked but under 15 m net turns all new movement off for 10 s); a jump + jet when the slide finds no open heading within 86° (needs energy ≥ 40); jetting kept on after the champion's unstick jump for up to 1.2 s (energy ≥ 40 to start, stops at 15); boost on `to next circle` while energy ≥ 50%. No random strafe. |
| 31 | 30 | **Calibrated danger strafe.** Danger means one of: an enemy with a line on us, inside its weapon's reach, aiming within 0.35 rad of us, hitting us (last 2 s) or charging; 2+ enemies with lines on us; a mech hit in the last 2 s; or HP under the retreat line with a line on us. Reversal timer T = (d/252 + 0.1) × U(0.8, 1.4), clamped to 0.20–0.40 s. Steps are perpendicular to the shooter, checked against walls and the circle. On a reversal, if the new side lacks 2× look-ahead room and the other side has it, we keep the other side. In an engage, the step must keep our shot. A laser charging at us: go to cover (`hideSpot`), else step off the beam (no gun timer). |
| 32 | 31 | Boost (sprint) during the danger strafe while energy > 50%. |
| 34 | 32 | A jump at a strafe reversal in danger (energy ≥ 60%, at most once per 1.5 s), plus 30's pathing jets. |
| 35 | **30** | **Outnumbered escape.** 2+ attackers (line on us, or hit us in the last 2 s), no drop run/hold, and the champion would hold, heal, hide, ambush or close a standoff. That means the champion's crossfire break found no cover 1–3 s away. Then we go to cover 4–6 s away, else away from the attackers (weighted by DPS) leaning toward the circle, with the step checked. Boost above 20% energy, here and in the champion's `break crossfire`. Jets come from 30. Re-engaging the weakest once it is 1v1 is the champion's own finish/TTK rule (unchanged), not new code. |
| 36 | champion | **Drop commitment (isolated).** Exact rule: `break crossfire` is skipped while a drop run or ring hold is active (`dropMove` or `dropHold`) **unless a mech damaged us in the last 2 s** (`XFIRE_HIT_S`). Every other condition stays as the champion has it. The drop run itself already requires HP at or above the retreat line, not hurt, no engage, a zone-safe ring that can be reached in time, and the give-up timer. So "HP hits the retreat line" and "hold impossible" end the run on the champion's own terms, and the crossfire break then runs as usual. With 2+ enemies in sight but not hitting us, we keep walking the nav path to the drop. No other new movement. |
| 37 | champion | **Literal torso sway** (Doug 3:11 PM). In danger (31's gate) and not in a drop mode, aim yaw = champion aim + 0.6 rad × sin(2πt / 1.2 s). Legs unchanged. Peak slew is 3.1 rad/s, inside turn_rate 4. |
| 38 | champion | **Front-arc discipline.** Attackers are enemies with a line on us or that hit us in the last 2 s. A hitter we cannot see uses its remembered position, else the last hit's bearing. If any attacker is more than 75° (the 90° half-arc minus a 15° margin) from the champion's aim, turn the torso the least amount that puts all of them inside ±75°. If no single yaw covers them all, keep the highest-DPS one inside. Not in drop modes. Firing is still gated on the torso being on target, so a turn away costs shots. |
| 39 | champion | Grok addendum: the 5 m/s silent cap is lifted while hurt with an enemy seen within 120 m in the memory window. The drop run, not-hurt drop gate, zone-first travel and 2-LOS crossfire break are untouched. |
| 40 | 30 | 30 + 36. |
| 41 | 34 | 34 + 36. |

Not built (left as ideas): cover-to-cover rotation with the zone, and leaving earlier for the next circle. Both change zone timing triggers, not only movement.

## Must-not-regress checks (SEED_BASE 2000+3000, 192 games; held-out where run)

| mode | rings reached (m0 6) | holds completed (m0 5) | total osc (m0 84) | quiet osc (m0 10) | pins 41/43/72/92 vs m0 | verdict |
|---|---:|---:|---:|---:|---|---|
| 30 (v1) | 6 | 6 | 90 | 22 | worse on 41, 72 | fail (quiet osc, pins) |
| 30b (v2) | 6 | 6 | 61 | 7 | 41 mixed, 43 better, 72 ≈, 92 = | pass drop/osc; held-out not run alone |
| 31 | 4 | 3 | 305 | 28 | 41, 72, 92 worse | fail |
| 32 | 7 | 4 | 379 | 35 | 41, 72 worse | fail |
| 34 | 4 | 3 | 272 | 29 | 41, 72 worse | fail |
| 35 (v1) | 5 | 5 | 286 | 24 | 41, 72 worse | fail |
| 35-v3 | 2 | 2 | 197 | 12 | 41 mixed, 43 better | fail |
| **36** | **7** (held-out 7 vs 6) | **5** (held-out 6 vs 5) | **78** (held-out 124 vs 140) | **10** (held-out 56 vs 56) | **identical** | **pass** |
| 37 | 5 | 2 | 30 | 4 | 92 better, others ≈ / worse placement | fail (score collapse) |
| 38 | 4 | 4 | 80 | 11 | identical except one death cause | fail (rings, score) |
| 39 | 4 | 3 | 87 | 13 | ≈ | fail |
| 40 (v1) | 9 | 8 | 76 | 22 | 41, 72 worse | fail (quiet osc) |
| 40b (v2) | 9 (held-out 6 vs 6) | 8 (held-out 5 vs 5) | 60 (held-out 140 vs 140) | 7 (held-out 39 vs 56) | 41 mixed, 43 better, 72 ≈, 92 = | drop/osc pass; **headline fails on held-out** |
| 41 | 5 | 2 | 249 | 29 | 41, 72 worse | fail |
| 42 | 4 | 3 | 193 | 12 | 41 mixed, 43 better | fail |
| 43 | 4 | 3 | 93 | 44 | 92 better | fail |
| 44 | 6 (held-out 8 vs 6) | 5 (held-out 6 vs 5) | 64 (held-out 162 vs 140) | 8 (held-out 38 vs 56) | 41/43 better pins, 41 earlier death | headline fails on held-out |

"41 mixed" means pin windows fall (25 → 15 or 5) but nav.stuck trips rise (24 → 264 in 30b/40b) and we die earlier (155 s → 125–127 s). Seed 92 (zone death after a pin) is unchanged in every pathing mode. The trace shows we are wedged at z ≈ −1 with horizontal speed 0 even 24 m up, apparently in a walled shaft. The recharge-then-jet rule now fires there but the escape heading points into a wall. Not fixed.

## Screen, existing modes 0–6 (SEED_BASE 2000+3000, 192 games, merge tree f54a99d)

| metric | m0 | m1 | m2 | m3 | m4 | m5 | m6 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Δscore vs m0 (paired ± SE) / games changed | — | -0.120 ± 0.210 / 191 | -0.141 ± 0.182 / 191 | +0.057 ± 0.208 / 191 | +0.052 ± 0.166 / 158 | +0.188 ± 0.138 / 161 | +0.432 ± 0.207 / 192 |
| Δdmg taken vs m0 (paired ± SE) | — | +14 ± 45 | +1 ± 39 | +2 ± 47 | +13 ± 35 | -12 ± 38 | -23 ± 42 |
| score | 3.531 | 3.411 | 3.391 | 3.589 | 3.583 | 3.719 | 3.964 |
| score_se | 0.220 | 0.184 | 0.177 | 0.209 | 0.194 | 0.222 | 0.225 |
| kills | 3.33 | 3.26 | 3.23 | 3.36 | 3.35 | 3.48 | 3.79 |
| place_mean | 12.47 | 12.59 | 12.61 | 12.41 | 12.42 | 12.28 | 12.04 |
| surv60 | 0.448 | 0.448 | 0.448 | 0.505 | 0.479 | 0.438 | 0.526 |
| surv120 | 0.172 | 0.177 | 0.188 | 0.167 | 0.156 | 0.172 | 0.193 |
| surv180 | 0.125 | 0.115 | 0.099 | 0.078 | 0.104 | 0.094 | 0.099 |
| final | 0.036 | 0.016 | 0.010 | 0.016 | 0.016 | 0.021 | 0.016 |
| alive_end | 6 | 2 | 2 | 3 | 2 | 3 | 3 |
| top4 | 8 | 2 | 3 | 7 | 3 | 7 | 7 |
| place1 | 6 | 2 | 2 | 3 | 2 | 3 | 3 |
| alive_s | 78.3 | 78.7 | 77.9 | 78.6 | 78.0 | 79.3 | 80.8 |
| died_lt40 | 56 | 52 | 55 | 50 | 54 | 54 | 53 |
| deaths_mid | 103 | 106 | 101 | 110 | 108 | 105 | 102 |
| deaths_late | 27 | 32 | 34 | 29 | 28 | 30 | 34 |
| atk2_death | 95 | 116 | 111 | 114 | 101 | 91 | 107 |
| hit_on_us | 0.181 | 0.187 | 0.181 | 0.184 | 0.182 | 0.176 | 0.181 |
| dmg_taken | 1856 | 1870 | 1856 | 1858 | 1869 | 1843 | 1833 |
| dmg_dealt | 6704 | 6603 | 6514 | 6773 | 6717 | 6869 | 7542 |
| our_gun | 0.825 | 0.817 | 0.823 | 0.821 | 0.819 | 0.820 | 0.833 |
| our_gun_mov | 0.771 | 0.836 | 0.835 | 0.834 | 0.772 | 0.765 | 0.841 |
| stuck_dec | 8509 | 8524 | 11475 | 8785 | 9155 | 7165 | 6638 |
| nav_stuck | 4069 | 3953 | 4664 | 4344 | 4417 | 2857 | 1366 |
| pins | 166 | 140 | 150 | 168 | 128 | 121 | 67 |
| pin_longest | 44 | 41 | 36 | 43 | 44 | 37 | 20 |
| osc | 84 | 267 | 455 | 252 | 71 | 101 | 361 |
| osc_quiet | 10 | 44 | 38 | 63 | 13 | 44 | 25 |
| jumps | 321 | 325 | 369 | 337 | 336 | 250 | 146 |
| rings | 6 | 5 | 5 | 4 | 2 | 5 | 4 |
| holds_done | 5 | 3 | 4 | 3 | 2 | 5 | 4 |
| holds_ab | 1 | 2 | 1 | 1 | 0 | 0 | 0 |
| drops_cap | 5 | 4 | 4 | 4 | 2 | 5 | 4 |
| run_ep | 140 | 69 | 98 | 69 | 122 | 96 | 170 |
| flip_run_xfire | 88 | 42 | 67 | 44 | 69 | 54 | 91 |
| flip_hold_xfire | 1 | 2 | 0 | 0 | 0 | 0 | 0 |
| run_cut_fire | 28 | 21 | 28 | 27 | 27 | 28 | 14 |
| alive95 | 53 | 44 | 48 | 50 | 48 | 53 | 58 |
| ep_crossfire | 725 | 1053 | 923 | 1092 | 728 | 730 | 1315 |
| ep_retreat | 449 | 418 | 438 | 432 | 442 | 449 | 433 |
| ep_standoff | 33 | 33 | 40 | 16 | 14 | 27 | 17 |
| ep_ambush | 129 | 127 | 123 | 105 | 161 | 128 | 169 |
| ep_next_circle | 602 | 617 | 565 | 755 | 768 | 560 | 660 |
| ep_evade | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| dec_evade | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| air_dec | 9553 | 9052 | 9828 | 9175 | 9585 | 6482 | 4993 |
| boost_dec | 14211 | 13967 | 15263 | 14677 | 13639 | 12861 | 14004 |
| energy_empty | 135 | 68 | 146 | 88 | 80 | 113 | 55 |
| rear_hits | 832 | 832 | 792 | 807 | 770 | 816 | 733 |
| rear_hit_share | 0.165 | 0.167 | 0.155 | 0.158 | 0.151 | 0.163 | 0.145 |
| rear_dmg_share | 0.227 | 0.240 | 0.213 | 0.220 | 0.215 | 0.223 | 0.204 |
| dmg_rear_pg | 386 | 415 | 364 | 381 | 368 | 375 | 349 |
| dmg_mech_pg | 1703 | 1729 | 1706 | 1731 | 1715 | 1680 | 1709 |
| late50 | 4 | 0 | 3 | 1 | 0 | 2 | 2 |
| ms_p99 | 16.6 | 10.3 | 14.5 | 12.2 | 12.5 | 12.7 | 14.9 |
| ms_max | 97.8 | 39.9 | 151.1 | 69.2 | 27.2 | 65.4 | 63.9 |

## Screen, new modes (SEED_BASE 2000+3000, 192 games)

| metric | m0 | m30 | m30b | m31 | m32 | m34 | m35 | m36 | m40 | m40b | m41 | m39 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Δscore vs m0 (paired ± SE) / games changed | — | +0.042 ± 0.100 / 135 | +0.057 ± 0.105 / 134 | +0.286 ± 0.217 / 192 | -0.089 ± 0.201 / 192 | -0.214 ± 0.179 / 192 | +0.427 ± 0.176 / 190 | -0.010 ± 0.029 / 11 | +0.062 ± 0.100 / 134 | +0.068 ± 0.105 / 134 | -0.219 ± 0.180 / 192 | -0.203 ± 0.125 / 115 |
| Δdmg taken vs m0 (paired ± SE) | — | -19 ± 34 | -9 ± 34 | +11 ± 45 | -14 ± 45 | -48 ± 41 | +99 ± 41 | +0 ± 10 | -20 ± 35 | -10 ± 34 | -49 ± 42 | +6 ± 24 |
| score | 3.531 | 3.573 | 3.589 | 3.818 | 3.443 | 3.318 | 3.958 | 3.521 | 3.594 | 3.599 | 3.312 | 3.328 |
| score_se | 0.220 | 0.224 | 0.227 | 0.207 | 0.190 | 0.186 | 0.231 | 0.219 | 0.223 | 0.227 | 0.186 | 0.200 |
| kills | 3.33 | 3.39 | 3.40 | 3.59 | 3.27 | 3.16 | 3.73 | 3.36 | 3.40 | 3.40 | 3.17 | 3.12 |
| place_mean | 12.47 | 12.43 | 12.41 | 12.18 | 12.56 | 12.68 | 12.04 | 12.48 | 12.41 | 12.40 | 12.69 | 12.67 |
| surv60 | 0.448 | 0.464 | 0.464 | 0.526 | 0.443 | 0.469 | 0.583 | 0.448 | 0.464 | 0.464 | 0.469 | 0.432 |
| surv120 | 0.172 | 0.193 | 0.193 | 0.182 | 0.161 | 0.172 | 0.224 | 0.172 | 0.193 | 0.193 | 0.172 | 0.167 |
| surv180 | 0.125 | 0.104 | 0.109 | 0.120 | 0.083 | 0.120 | 0.115 | 0.115 | 0.094 | 0.099 | 0.104 | 0.094 |
| final | 0.036 | 0.031 | 0.031 | 0.016 | 0.010 | 0.016 | 0.021 | 0.031 | 0.031 | 0.031 | 0.010 | 0.021 |
| alive_end | 6 | 6 | 6 | 3 | 2 | 2 | 4 | 6 | 6 | 6 | 2 | 3 |
| top4 | 8 | 7 | 8 | 6 | 3 | 4 | 8 | 8 | 7 | 8 | 4 | 4 |
| place1 | 6 | 6 | 6 | 3 | 2 | 2 | 4 | 6 | 6 | 6 | 2 | 3 |
| alive_s | 78.3 | 78.8 | 79.3 | 80.8 | 76.0 | 81.4 | 89.1 | 76.8 | 77.8 | 78.3 | 79.3 | 76.8 |
| died_lt40 | 56 | 51 | 51 | 44 | 52 | 55 | 33 | 56 | 51 | 51 | 55 | 57 |
| deaths_mid | 103 | 104 | 104 | 113 | 109 | 104 | 116 | 103 | 104 | 104 | 104 | 103 |
| deaths_late | 27 | 31 | 31 | 32 | 29 | 31 | 39 | 27 | 31 | 31 | 31 | 29 |
| atk2_death | 95 | 90 | 93 | 111 | 117 | 111 | 103 | 96 | 89 | 91 | 115 | 98 |
| hit_on_us | 0.181 | 0.181 | 0.182 | 0.182 | 0.176 | 0.173 | 0.182 | 0.180 | 0.180 | 0.181 | 0.173 | 0.183 |
| dmg_taken | 1856 | 1837 | 1846 | 1867 | 1841 | 1807 | 1955 | 1856 | 1836 | 1846 | 1806 | 1861 |
| dmg_dealt | 6704 | 6770 | 6785 | 7128 | 6693 | 6386 | 7702 | 6701 | 6786 | 6790 | 6346 | 6327 |
| our_gun | 0.825 | 0.825 | 0.826 | 0.817 | 0.820 | 0.827 | 0.818 | 0.825 | 0.826 | 0.826 | 0.827 | 0.823 |
| our_gun_mov | 0.771 | 0.778 | 0.779 | 0.823 | 0.826 | 0.834 | 0.803 | 0.772 | 0.778 | 0.779 | 0.835 | 0.764 |
| stuck_dec | 8509 | 5988 | 5215 | 12465 | 9920 | 10561 | 9485 | 7986 | 5315 | 4954 | 10014 | 8354 |
| nav_stuck | 4069 | 1940 | 1244 | 2224 | 2285 | 2175 | 3977 | 3711 | 1393 | 1083 | 1826 | 3893 |
| pins | 166 | 66 | 14 | 210 | 150 | 175 | 121 | 137 | 46 | 14 | 164 | 104 |
| pin_longest | 44 | 29 | 14 | 81 | 29 | 56 | 29 | 32 | 29 | 14 | 56 | 30 |
| osc | 84 | 90 | 61 | 305 | 379 | 272 | 286 | 78 | 76 | 60 | 249 | 87 |
| osc_quiet | 10 | 22 | 7 | 28 | 35 | 29 | 24 | 10 | 22 | 7 | 29 | 13 |
| jumps | 321 | 221 | 171 | 223 | 235 | 923 | 381 | 300 | 180 | 160 | 888 | 329 |
| rings | 6 | 6 | 6 | 4 | 7 | 4 | 5 | 7 | 9 | 9 | 5 | 4 |
| holds_done | 5 | 6 | 6 | 3 | 4 | 3 | 5 | 5 | 8 | 8 | 2 | 3 |
| holds_ab | 1 | 0 | 0 | 1 | 2 | 1 | 0 | 2 | 1 | 1 | 3 | 1 |
| drops_cap | 5 | 6 | 6 | 3 | 4 | 3 | 5 | 6 | 8 | 8 | 3 | 3 |
| run_ep | 140 | 110 | 104 | 93 | 112 | 97 | 102 | 62 | 45 | 46 | 31 | 111 |
| flip_run_xfire | 88 | 83 | 74 | 64 | 76 | 71 | 71 | 21 | 18 | 18 | 10 | 57 |
| flip_hold_xfire | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| run_cut_fire | 28 | 36 | 36 | 25 | 16 | 9 | 30 | 28 | 23 | 23 | 18 | 17 |
| alive95 | 53 | 52 | 54 | 53 | 45 | 50 | 67 | 53 | 52 | 54 | 50 | 47 |
| ep_crossfire | 725 | 672 | 679 | 1020 | 1021 | 865 | 1533 | 619 | 589 | 604 | 795 | 628 |
| ep_retreat | 449 | 481 | 485 | 487 | 443 | 393 | 435 | 453 | 494 | 496 | 400 | 403 |
| ep_standoff | 33 | 38 | 38 | 11 | 27 | 8 | 50 | 33 | 38 | 38 | 8 | 43 |
| ep_ambush | 129 | 123 | 122 | 253 | 157 | 176 | 276 | 115 | 118 | 118 | 176 | 122 |
| ep_next_circle | 602 | 426 | 462 | 499 | 433 | 535 | 546 | 552 | 408 | 450 | 517 | 675 |
| ep_evade | 0 | 0 | 0 | 2032 | 2106 | 1807 | 1146 | 0 | 0 | 0 | 1800 | 0 |
| dec_evade | 0 | 0 | 0 | 36944 | 35907 | 35236 | 12773 | 0 | 0 | 0 | 35219 | 0 |
| air_dec | 9553 | 7108 | 6479 | 6939 | 6990 | 36446 | 10167 | 9292 | 6517 | 6261 | 35583 | 8863 |
| boost_dec | 14211 | 15616 | 15496 | 17099 | 30035 | 31457 | 27471 | 13721 | 14963 | 15122 | 30442 | 13448 |
| energy_empty | 135 | 127 | 76 | 134 | 115 | 177 | 321 | 121 | 94 | 74 | 138 | 166 |
| rear_hits | 832 | 805 | 815 | 794 | 827 | 772 | 589 | 853 | 813 | 816 | 823 | 745 |
| rear_hit_share | 0.165 | 0.160 | 0.160 | 0.153 | 0.164 | 0.158 | 0.114 | 0.168 | 0.162 | 0.161 | 0.167 | 0.151 |
| rear_dmg_share | 0.227 | 0.218 | 0.220 | 0.231 | 0.242 | 0.212 | 0.168 | 0.231 | 0.221 | 0.222 | 0.230 | 0.208 |
| dmg_rear_pg | 386 | 366 | 374 | 397 | 411 | 348 | 300 | 396 | 373 | 376 | 382 | 353 |
| dmg_mech_pg | 1703 | 1679 | 1697 | 1721 | 1697 | 1640 | 1789 | 1715 | 1687 | 1697 | 1660 | 1695 |
| late50 | 4 | 7 | 7 | 7 | 5 | 6 | 11 | 21 | 2 | 10 | 7 | 5 |
| ms_p99 | 16.6 | 17.8 | 11.4 | 20.9 | 15.8 | 14.0 | 21.8 | 50.4 | 14.5 | 14.3 | 17.0 | 12.5 |
| ms_max | 97.8 | 167.4 | 164.1 | 164.6 | 128.6 | 134.5 | 127.6 | 165.1 | 99.7 | 98.2 | 195.2 | 159.8 |

## Screen, v3 / ablation modes (SEED_BASE 2000+3000, 192 games)

| metric | m0 | m35 | p35 | p42 | p43 | p44 |
|---|---:|---:|---:|---:|---:|---:|
| Δscore vs m0 (paired ± SE) / games changed | — | +0.427 ± 0.176 / 190 | +0.203 ± 0.196 / 190 | +0.214 ± 0.196 / 190 | -1.010 ± 0.183 / 191 | +0.042 ± 0.100 / 127 |
| Δdmg taken vs m0 (paired ± SE) | — | +99 ± 41 | +108 ± 45 | +108 ± 45 | -69 ± 45 | -11 ± 35 |
| score | 3.531 | 3.958 | 3.734 | 3.745 | 2.521 | 3.573 |
| score_se | 0.220 | 0.231 | 0.222 | 0.221 | 0.188 | 0.223 |
| kills | 3.33 | 3.73 | 3.52 | 3.53 | 2.34 | 3.38 |
| place_mean | 12.47 | 12.04 | 12.27 | 12.26 | 13.48 | 12.43 |
| surv60 | 0.448 | 0.583 | 0.557 | 0.557 | 0.427 | 0.464 |
| surv120 | 0.172 | 0.224 | 0.219 | 0.219 | 0.125 | 0.193 |
| surv180 | 0.125 | 0.115 | 0.141 | 0.125 | 0.073 | 0.109 |
| final | 0.036 | 0.021 | 0.016 | 0.016 | 0.005 | 0.031 |
| alive_end | 6 | 4 | 3 | 3 | 1 | 6 |
| top4 | 8 | 8 | 5 | 5 | 3 | 7 |
| place1 | 6 | 4 | 3 | 3 | 1 | 6 |
| alive_s | 78.3 | 89.1 | 88.2 | 87.0 | 70.6 | 78.2 |
| died_lt40 | 56 | 33 | 40 | 40 | 62 | 51 |
| deaths_mid | 103 | 116 | 110 | 110 | 106 | 104 |
| deaths_late | 27 | 39 | 39 | 39 | 23 | 31 |
| atk2_death | 95 | 103 | 114 | 112 | 109 | 95 |
| hit_on_us | 0.181 | 0.182 | 0.184 | 0.183 | 0.187 | 0.179 |
| dmg_taken | 1856 | 1955 | 1964 | 1964 | 1786 | 1845 |
| dmg_dealt | 6704 | 7702 | 7336 | 7323 | 5115 | 6721 |
| our_gun | 0.825 | 0.818 | 0.822 | 0.822 | 0.677 | 0.824 |
| our_gun_mov | 0.771 | 0.803 | 0.809 | 0.810 | 0.626 | 0.776 |
| stuck_dec | 8509 | 9485 | 7540 | 7330 | 6782 | 5553 |
| nav_stuck | 4069 | 3977 | 2284 | 2249 | 2680 | 1756 |
| pins | 166 | 121 | 74 | 74 | 120 | 15 |
| pin_longest | 44 | 29 | 26 | 26 | 30 | 14 |
| osc | 84 | 286 | 197 | 193 | 93 | 64 |
| osc_quiet | 10 | 24 | 12 | 12 | 44 | 8 |
| jumps | 321 | 381 | 267 | 264 | 231 | 182 |
| rings | 6 | 5 | 2 | 4 | 4 | 6 |
| holds_done | 5 | 5 | 2 | 3 | 3 | 5 |
| holds_ab | 1 | 0 | 0 | 1 | 1 | 1 |
| drops_cap | 5 | 5 | 2 | 3 | 3 | 5 |
| run_ep | 140 | 102 | 89 | 47 | 48 | 59 |
| flip_run_xfire | 88 | 71 | 61 | 16 | 32 | 31 |
| flip_hold_xfire | 1 | 0 | 0 | 0 | 1 | 0 |
| run_cut_fire | 28 | 30 | 36 | 26 | 9 | 37 |
| alive95 | 53 | 67 | 67 | 67 | 41 | 52 |
| ep_crossfire | 725 | 1533 | 1429 | 1335 | 618 | 618 |
| ep_retreat | 449 | 435 | 406 | 408 | 421 | 499 |
| ep_standoff | 33 | 50 | 54 | 54 | 16 | 31 |
| ep_ambush | 129 | 276 | 259 | 254 | 96 | 110 |
| ep_next_circle | 602 | 546 | 631 | 616 | 532 | 541 |
| ep_evade | 0 | 1146 | 1039 | 1040 | 0 | 0 |
| dec_evade | 0 | 12773 | 15282 | 15298 | 0 | 0 |
| air_dec | 9553 | 10167 | 9294 | 9153 | 7025 | 7214 |
| boost_dec | 14211 | 27471 | 27200 | 26805 | 12053 | 13851 |
| energy_empty | 135 | 321 | 132 | 132 | 20 | 40 |
| rear_hits | 832 | 589 | 622 | 620 | 711 | 845 |
| rear_hit_share | 0.165 | 0.114 | 0.119 | 0.119 | 0.140 | 0.169 |
| rear_dmg_share | 0.227 | 0.168 | 0.185 | 0.186 | 0.210 | 0.228 |
| dmg_rear_pg | 386 | 300 | 334 | 336 | 350 | 385 |
| dmg_mech_pg | 1703 | 1789 | 1806 | 1807 | 1670 | 1688 |
| late50 | 4 | 11 | 3 | 5 | 1 | 8 |
| ms_p99 | 16.6 | 21.8 | 11.8 | 10.8 | 15.4 | 10.8 |
| ms_max | 97.8 | 127.6 | 88.3 | 110.0 | 134.3 | 251.5 |

## Held-out, SEED_BASE 4000+5000 (192 games): mode 0, 36, 40b, 44

| metric | m0 | m36 | m40b | p44 |
|---|---:|---:|---:|---:|
| Δscore vs m0 (paired ± SE) / games changed | — | -0.021 ± 0.038 / 11 | -0.302 ± 0.123 / 144 | -0.219 ± 0.116 / 138 |
| Δdmg taken vs m0 (paired ± SE) | — | -12 ± 10 | -16 ± 43 | +0 ± 43 |
| score | 3.849 | 3.828 | 3.547 | 3.630 |
| score_se | 0.237 | 0.234 | 0.200 | 0.209 |
| kills | 3.60 | 3.58 | 3.33 | 3.39 |
| place_mean | 12.15 | 12.17 | 12.45 | 12.37 |
| surv60 | 0.516 | 0.516 | 0.521 | 0.521 |
| surv120 | 0.214 | 0.214 | 0.193 | 0.208 |
| surv180 | 0.156 | 0.146 | 0.115 | 0.135 |
| final | 0.026 | 0.026 | 0.010 | 0.021 |
| alive_end | 5 | 5 | 2 | 4 |
| top4 | 8 | 8 | 5 | 5 |
| place1 | 5 | 5 | 2 | 4 |
| alive_s | 86.9 | 85.9 | 83.1 | 85.2 |
| died_lt40 | 54 | 54 | 54 | 54 |
| deaths_mid | 97 | 97 | 101 | 98 |
| deaths_late | 36 | 36 | 35 | 36 |
| atk2_death | 98 | 100 | 114 | 113 |
| hit_on_us | 0.184 | 0.184 | 0.190 | 0.186 |
| dmg_taken | 1894 | 1882 | 1878 | 1894 |
| dmg_dealt | 7481 | 7427 | 6935 | 7083 |
| our_gun | 0.803 | 0.802 | 0.799 | 0.802 |
| our_gun_mov | 0.731 | 0.730 | 0.729 | 0.732 |
| stuck_dec | 10017 | 9813 | 5566 | 5956 |
| nav_stuck | 4736 | 4604 | 1394 | 1812 |
| pins | 186 | 190 | 46 | 62 |
| pin_longest | 29 | 29 | 17 | 19 |
| osc | 140 | 124 | 140 | 162 |
| osc_quiet | 56 | 56 | 39 | 38 |
| jumps | 400 | 389 | 175 | 196 |
| rings | 6 | 7 | 6 | 8 |
| holds_done | 5 | 6 | 5 | 6 |
| holds_ab | 1 | 1 | 1 | 2 |
| drops_cap | 5 | 6 | 6 | 6 |
| run_ep | 164 | 49 | 30 | 67 |
| flip_run_xfire | 123 | 18 | 6 | 23 |
| flip_hold_xfire | 1 | 1 | 0 | 2 |
| run_cut_fire | 39 | 28 | 11 | 32 |
| alive95 | 58 | 58 | 56 | 56 |
| ep_crossfire | 823 | 728 | 703 | 732 |
| ep_retreat | 408 | 407 | 415 | 428 |
| ep_standoff | 16 | 16 | 35 | 35 |
| ep_ambush | 161 | 161 | 141 | 142 |
| ep_next_circle | 827 | 809 | 671 | 761 |
| ep_evade | 0 | 0 | 0 | 0 |
| dec_evade | 0 | 0 | 0 | 0 |
| air_dec | 10761 | 9948 | 6839 | 7685 |
| boost_dec | 15291 | 14667 | 15125 | 14033 |
| energy_empty | 191 | 189 | 91 | 75 |
| rear_hits | 636 | 637 | 712 | 734 |
| rear_hit_share | 0.125 | 0.126 | 0.139 | 0.142 |
| rear_dmg_share | 0.185 | 0.187 | 0.203 | 0.207 |
| dmg_rear_pg | 320 | 322 | 354 | 362 |
| dmg_mech_pg | 1728 | 1716 | 1739 | 1745 |
| late50 | 3 | 4 | 4 | 5 |
| ms_p99 | 12.0 | 13.8 | 11.9 | 12.7 |
| ms_max | 159.6 | 100.0 | 84.9 | 162.7 |

## Pooled 384 games (2000–5000): mode 0, 36, 40b, 44

| metric | m0 | m36 | m40b | p44 |
|---|---:|---:|---:|---:|
| Δscore vs m0 (paired ± SE) / games changed | — | -0.016 ± 0.024 / 22 | -0.117 ± 0.081 / 278 | -0.089 ± 0.077 / 265 |
| Δdmg taken vs m0 (paired ± SE) | — | -6 ± 7 | -13 ± 27 | -5 ± 28 |
| score | 3.690 | 3.674 | 3.573 | 3.602 |
| score_se | 0.162 | 0.160 | 0.151 | 0.153 |
| kills | 3.46 | 3.47 | 3.36 | 3.38 |
| place_mean | 12.31 | 12.33 | 12.43 | 12.40 |
| surv60 | 0.482 | 0.482 | 0.492 | 0.492 |
| surv120 | 0.193 | 0.193 | 0.193 | 0.201 |
| surv180 | 0.141 | 0.130 | 0.107 | 0.122 |
| final | 0.031 | 0.029 | 0.021 | 0.026 |
| alive_end | 11 | 11 | 8 | 10 |
| top4 | 16 | 16 | 13 | 12 |
| place1 | 11 | 11 | 8 | 10 |
| alive_s | 82.6 | 81.3 | 80.7 | 81.7 |
| died_lt40 | 110 | 110 | 105 | 105 |
| deaths_mid | 200 | 200 | 205 | 202 |
| deaths_late | 63 | 63 | 66 | 67 |
| atk2_death | 193 | 196 | 205 | 208 |
| hit_on_us | 0.183 | 0.182 | 0.185 | 0.183 |
| dmg_taken | 1875 | 1869 | 1862 | 1869 |
| dmg_dealt | 7092 | 7064 | 6862 | 6902 |
| our_gun | 0.814 | 0.814 | 0.813 | 0.813 |
| our_gun_mov | 0.751 | 0.751 | 0.754 | 0.754 |
| stuck_dec | 18526 | 17799 | 10520 | 11509 |
| nav_stuck | 8805 | 8315 | 2477 | 3568 |
| pins | 352 | 327 | 60 | 77 |
| pin_longest | 44 | 32 | 17 | 19 |
| osc | 224 | 202 | 200 | 226 |
| osc_quiet | 66 | 66 | 46 | 46 |
| jumps | 721 | 689 | 335 | 378 |
| rings | 12 | 14 | 15 | 14 |
| holds_done | 10 | 11 | 13 | 11 |
| holds_ab | 2 | 3 | 2 | 3 |
| drops_cap | 10 | 12 | 14 | 11 |
| run_ep | 304 | 111 | 76 | 126 |
| flip_run_xfire | 211 | 39 | 24 | 54 |
| flip_hold_xfire | 2 | 1 | 0 | 2 |
| run_cut_fire | 67 | 56 | 34 | 69 |
| alive95 | 111 | 111 | 110 | 108 |
| ep_crossfire | 1548 | 1347 | 1307 | 1350 |
| ep_retreat | 857 | 860 | 911 | 927 |
| ep_standoff | 49 | 49 | 73 | 66 |
| ep_ambush | 290 | 276 | 259 | 252 |
| ep_next_circle | 1429 | 1361 | 1121 | 1302 |
| ep_evade | 0 | 0 | 0 | 0 |
| dec_evade | 0 | 0 | 0 | 0 |
| air_dec | 20314 | 19240 | 13100 | 14899 |
| boost_dec | 29502 | 28388 | 30247 | 27884 |
| energy_empty | 326 | 310 | 165 | 115 |
| rear_hits | 1468 | 1490 | 1528 | 1579 |
| rear_hit_share | 0.145 | 0.147 | 0.150 | 0.155 |
| rear_dmg_share | 0.206 | 0.209 | 0.212 | 0.218 |
| dmg_rear_pg | 353 | 359 | 365 | 373 |
| dmg_mech_pg | 1715 | 1715 | 1718 | 1716 |
| late50 | 7 | 25 | 14 | 13 |
| ms_p99 | 16.6 | 50.4 | 14.3 | 12.7 |
| ms_max | 159.6 | 165.1 | 98.2 | 251.5 |

## Rear armor: mode 0 vs 37 vs 38 (and 43)

Mechs are vertical cylinders (radius 2.5 m, height 9 m), so facing does not change the hitbox. A hit from outside the 180° front arc centered on torso aim yaw deals ×1.5 and sets `damaged.rear`. Vision is a 120° wedge on torso aim.

| metric (192 games) | mode 0 | 37 literal sway | 43 sway only when no weapon can fire | 38 front arc |
|---|---:|---:|---:|---:|
| rear hits (total) | 832 | 723 | 711 | 510 |
| rear hit share of mech hits | 0.165 | 0.118 | 0.140 | 0.099 |
| rear damage share of mech damage | 0.227 | 0.180 | 0.210 | 0.154 |
| rear damage / game | 386 | 334 | 350 | 262 |
| mech damage taken / game | 1703 | 1859 | 1670 | 1703 |
| damage taken / game (all sources), paired Δ | 1856 | +152 ± 67 | −69 ± 45 | −1 ± 17 |
| house gun hit rate on us | 0.181 | 0.186 | 0.187 | 0.186 |
| our gun hit rate (aim accuracy) | 0.825 | 0.108 | 0.677 | 0.816 |
| kills / game | 3.33 | 0.10 | 2.34 | 3.02 |
| deaths with 2+ attackers (last 3 s) | 95 | 100 | 109 | 95 |
| surv 180 s / final 375 s / alive at end | 0.125 / 0.036 / 6 | 0.109 / 0.000 / 0 | 0.073 / 0.005 / 1 | 0.104 / 0.026 / 4 |
| sim score (paired Δ ± SE) | 3.531 | 0.260 (−3.271 ± 0.224) | 2.521 (−1.010 ± 0.183) | 3.203 (−0.328 ± 0.129) |

Reading: as the geometry predicts, swaying does not reduce how often we are hit (house hit rate 0.181 → 0.186). It ruins our own aim, because the gun fires only when the torso is on target and the target sits inside a ~0.04 rad window. Rear share falls in 37 only because a swaying torso faces more directions on average, and the extra damage taken from fights we no longer win swamps that. Mode 38 is the version that works mechanically: rear damage drops by about a third. But the turns away from our target cost shots (gun 0.825 → 0.816, kills −0.31/game), enemies live longer, and total damage taken does not fall. In the sim it is a net loss. That matches the Watcher showdown note that rear hits barely differ between top and low teams (5.8% vs 5.4%). Keep 38 as a measurement, not a priority.

## Pin regression, seeds 41, 43, 72, 92 (exact Wild Sim set-0 seeds)

Cell: `pin windows / longest pin, nav.stuck trips, quiet osc windows, place, killer weapon and death time`.

| seed | m0 | m5 | m6 | m30 | m30b | m31 | m32 | m34 | m35 | p35 |
|---|---|---|---|---|---|---|---|---|---|---|
| 41 | pin 25/34s, nav 24, oscQ 3, pl 12, gun 155.20s | pin 25/34s, nav 57, oscQ 3, pl 12, laser 134.35s | pin 25/34s, nav 60, oscQ 3, pl 12, gun 137.25s | pin 34/34s, nav 285, oscQ 3, pl 13, laser 131.05s | pin 15/19s, nav 264, oscQ 0, pl 14, gun 124.95s | pin 34/34s, nav 285, oscQ 3, pl 13, laser 131.05s | pin 34/34s, nav 285, oscQ 3, pl 13, laser 131.05s | pin 34/34s, nav 285, oscQ 3, pl 13, laser 131.05s | pin 34/34s, nav 285, oscQ 3, pl 13, laser 131.05s | pin 15/19s, nav 264, oscQ 0, pl 14, gun 124.95s |
| 43 | pin 37/46s, nav 11, oscQ 1, pl 13, mortar 185.35s | pin 43/27s, nav 357, oscQ 10, pl 10, gun 177.75s | pin 43/27s, nav 357, oscQ 10, pl 10, gun 177.75s | pin 18/27s, nav 25, oscQ 0, pl 10, mortar 226.85s | pin 6/15s, nav 35, oscQ 0, pl 11, mortar 188.20s | pin 18/27s, nav 52, oscQ 0, pl 12, gun 197.05s | pin 18/27s, nav 52, oscQ 0, pl 12, gun 197.05s | pin 18/27s, nav 52, oscQ 0, pl 12, gun 197.05s | pin 22/27s, nav 79, oscQ 0, pl 10, lightning 203.25s | pin 8/15s, nav 104, oscQ 0, pl 12, mortar 202.10s |
| 72 | pin 0/0s, nav 6, oscQ 2, pl 15, gun 191.60s | pin 25/24s, nav 6, oscQ 81, pl 13, gun 207.15s | pin 25/24s, nav 6, oscQ 81, pl 14, gun 202.35s | pin 10/19s, nav 0, oscQ 17, pl 14, gun 195.25s | pin 0/0s, nav 4, oscQ 4, pl 14, gun 206.90s | pin 10/19s, nav 0, oscQ 17, pl 14, gun 198.25s | pin 11/19s, nav 107, oscQ 17, pl 15, mortar 193.70s | pin 11/19s, nav 107, oscQ 17, pl 15, mortar 193.70s | pin 10/19s, nav 0, oscQ 17, pl 15, gun 195.95s | pin 0/0s, nav 4, oscQ 4, pl 15, laser 204.95s |
| 92 | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s | pin 0/0s, nav 6, oscQ 0, pl 13, gun 187.85s | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s | pin 29/38s, nav 346, oscQ 0, pl 13, gun 250.50s | pin 7/16s, nav 597, oscQ 0, pl 15, zone 145.75s | pin 7/16s, nav 533, oscQ 0, pl 15, zone 139.30s | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s |

| seed | m0 | m36 | m37 | m38 | m39 | m40 | m40b | m41 | p42 | p43 | p44 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 41 | pin 25/34s, nav 24, oscQ 3, pl 12, gun 155.20s | pin 25/34s, nav 24, oscQ 3, pl 12, gun 155.20s | pin 25/34s, nav 6, oscQ 3, pl 16, gun 121.40s | pin 25/34s, nav 24, oscQ 3, pl 12, gun 155.20s | pin 25/34s, nav 25, oscQ 3, pl 12, gun 157.50s | pin 34/34s, nav 285, oscQ 3, pl 13, laser 131.05s | pin 15/19s, nav 264, oscQ 0, pl 14, gun 124.95s | pin 34/34s, nav 285, oscQ 3, pl 13, laser 131.05s | pin 15/19s, nav 264, oscQ 0, pl 14, gun 124.95s | pin 25/34s, nav 6, oscQ 3, pl 10, gun 148.00s | pin 5/12s, nav 0, oscQ 0, pl 14, gun 127.15s |
| 43 | pin 37/46s, nav 11, oscQ 1, pl 13, mortar 185.35s | pin 37/46s, nav 11, oscQ 1, pl 13, mortar 185.35s | pin 37/46s, nav 11, oscQ 1, pl 15, gun 182.20s | pin 37/46s, nav 11, oscQ 1, pl 13, mortar 185.35s | pin 37/46s, nav 11, oscQ 1, pl 13, mortar 185.35s | pin 18/27s, nav 25, oscQ 0, pl 10, mortar 226.85s | pin 6/15s, nav 35, oscQ 0, pl 11, mortar 188.20s | pin 18/27s, nav 52, oscQ 0, pl 12, gun 197.05s | pin 7/15s, nav 98, oscQ 0, pl 11, mortar 201.50s | pin 37/46s, nav 11, oscQ 1, pl 13, mortar 185.35s | pin 6/15s, nav 16, oscQ 0, pl 12, gun 185.90s |
| 72 | pin 0/0s, nav 6, oscQ 2, pl 15, gun 191.60s | pin 0/0s, nav 6, oscQ 2, pl 15, gun 191.60s | pin 0/0s, nav 50, oscQ 2, pl 16, gun 190.55s | pin 0/0s, nav 6, oscQ 2, pl 15, laser 190.25s | pin 0/0s, nav 6, oscQ 2, pl 15, gun 191.60s | pin 10/19s, nav 0, oscQ 17, pl 14, gun 195.25s | pin 0/0s, nav 4, oscQ 4, pl 14, gun 206.90s | pin 11/19s, nav 107, oscQ 17, pl 15, mortar 193.70s | pin 0/0s, nav 4, oscQ 4, pl 15, laser 204.95s | pin 0/0s, nav 6, oscQ 2, pl 15, laser 190.25s | pin 0/0s, nav 4, oscQ 4, pl 14, lightning 206.95s |
| 92 | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s | pin 0/0s, nav 15, oscQ 0, pl 16, lightning 182.10s | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s | pin 7/16s, nav 533, oscQ 0, pl 15, zone 139.30s | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s | pin 0/0s, nav 22, oscQ 0, pl 14, laser 251.95s | pin 19/21s, nav 723, oscQ 0, pl 15, zone 144.00s |

## Champion-behavior counts

Episode counts (`ep_*` = entries into the mode) are in the full tables above: `ep_crossfire`, `ep_retreat`, `ep_standoff`, `ep_ambush`, `ep_next_circle`, `run_ep` (drop run), `rings` (drop hold), `ep_evade` (new strafe/escape decisions, mode string ending `, ev`). Notable: mode 36 cuts drop-run episodes 140 → 62 because the run no longer flickers into crossfire and back. Every escape mode roughly doubles `ep_crossfire` (725 → 1533 in 35). Mode 32/34's sprint triples boost decisions (14211 → 30035/31457), and 34's hops quadruple air decisions (9553 → 36446).

## Which piece did what

| piece | where | effect in the sim |
|---|---|---|
| Drop commitment (36) | champion | Flips 211 → 39 and rings 12 → 14 over 384 games, score flat. The only clean pass. |
| Slide + commitment + jets (30 v1) | champion | Pins 166 → 66, nav.stuck 4069 → 1940. Quiet osc 10 → 22 (one farm-pickup route flap on seed 2047, and a laser rush ↔ farm pickup decision flap on pin seed 41, reached because the trajectory diverged). |
| Quiet flap breaker + recharge-then-jet (30 v2) | 30 | Fixed both flaps. Pins 166 → 14, quiet osc 22 → 7. Held-out end-game survival still worse with 36 on top (40b). |
| Zone sprint | 30 | Ablated in 44. Removing it does not recover held-out score (−0.219 ± 0.116). |
| Calibrated danger strafe (31) | 30 | Moving gun hit rate up (0.771 → 0.823) but house hit rate on us flat (0.182), osc ×3.6, rings down, late survival down. |
| Sprint in danger (32) | 31 | House hit rate on us 0.176 (lowest of the strafe set but within noise); osc ×4.5; holds 4. |
| Hops in danger (34) | 32 | House hit rate on us 0.173, damage taken −48 ± 41; score −0.214 ± 0.179; alive at end 2. |
| Outnumbered escape (35) | 30 (v1); 35-v3 on 30 v2 | Early deaths −23 (56 → 33), surv 60 s +0.135. Late survival and drop rings worse. |
| Torso sway (37, 43) | champion | Aim collapse. |
| Front arc (38) | champion | Rear damage −32%, total damage flat, score down. |
| Silent-cap lift (39) | champion | Score down, end game worse. |

## Caveats

- **Drop-run blindness.** The first supply drop lands at about 95 s, and only about a quarter of games are still alive then (mode 0: 53 of 192 alive at 95 s on 2000+3000). Mode 0 reaches only 12 rings in 384 games. Ring and hold counts are single digits per 192, so a change of 1–3 is near noise. The sim can catch a regression in rings (it does: 31, 35-v3, 38, 42), but it cannot value a ring gained. Site score is the only judge of mode 36.
- **House aim model.** Sim house bots lead perfectly and add a Gaussian aim error held for 0.4 s (`tools/sim/ASSUMPTIONS.md`). The calibrated 0.20–0.40 s strafe timer and the flight-timed hops are tuned against that model. Site bots may aim differently: not lead, re-aim every tick, or not hold the error. Any hit-rate gain from 32/34 could vanish or grow on the site. In this screen the gain was small (≤ 0.008) and came with real costs.
- **Machine load.** Timing columns were taken on a shared box at load ~30 (see Gates).
- **One run per mode per seed set**, paired by seed. Differences of 1–3 games in survival counts are within noise. SE is the paired SE of the per-game score difference.
- **Held-out runs** cover only modes 0, 36, 40b and 44. Others failed the first screen's must-not-regress rules and were not taken further.
- **Showdowns ≠ practice.** The Watcher addendum (top teams move more mid-game and kite when hurt late) is FFA correlation among top teams, not the house squad. Mode 39's sim loss does not refute it, and the sim's house bots do not hunt like site bots.

## Ranked next ideas for end-game survival (with evidence)

1. **Site-test mode 36 alone, as the drop-commitment rule on the champion** (if and when the team picks a slot; this note does not queue it). Evidence: flips 211 → 39, rings 12 → 14, captures 10 → 12 over 384 games, score flat, every pin seed identical, flag-0 rest unchanged. The sim cannot see the upside, so only the site can.
2. **Find what in the v2 pathing costs held-out late survival before shipping any of it.** It is not the zone sprint (44). Candidates: the slide in `retreat` / `break crossfire` (leaves cover lines the champion's straight walk kept), and jets after the unstick (airborne hit rate on us is higher: mode-0 `hg_rate_air` 0.216 vs still 0.182). Next ablations: slide only on path-less travel (no combat modes); jets only out of the zone. The pathing is too valuable to drop: pins 352 → 60.
3. **Outnumbered escape that respects drops and the late game.** Mode 35 cut early deaths by 23 of 56, the biggest survival lever seen in three iterations. It failed by cutting drop runs (indirectly: more crossfire episodes, fewer games near drops at the right time) and by oscillating. Next try: escape only before 120 s, or only with HP < 60%, with the 1.5 s commitment, on 36 and not on 30.
4. **Fix seed 92 (walled shaft, zone death).** The trace is in this note: wedged, horizontal speed 0 at every height, heading toward the zone center into a wall. Try a heading sweep while airborne (jet toward the most open of 8 headings) under recharge-then-jet.
5. **Champion decision flap: laser rush ↔ farm pickup (seed 41) and farm route flapping at a ledge (seed 2047).** Found by tracing. The v2 breaker hides it, but the same flap can hit the champion on other seeds. A champion-level fix (hysteresis on `cubeFirst`) would be a decision change and needs its own test.
6. **Front arc only when it costs no shot** (e.g. only while reloading or with no clear target), since 38 shows rear damage can fall by a third. Low priority per the Watcher (rear-hit share barely differs at the top).
7. Do **not** pursue literal torso sway, always-on/danger strafe, or hops on this sim. Every version raised oscillation and cut late survival, and the hit-rate gains are within the house-aim caveat.

## Files

- CSVs and logs: `/tmp/pb008i3/out/` (`m*`, `f0`, `p*`, `*-pins.csv`). Builds: `/tmp/pb008i3/build/<tag>`. Table script: `/tmp/pb008i3/compare.py`. Batch scripts: `/tmp/pb008i3/batch-new.sh`, `batch2.sh`, `batch3.sh`, `batch4.sh`.
- Earlier evidence used only as context: `/tmp/pb008i2/out/`, `/tmp/pb008b/out/`, `calibrated-movement.md` (271e2ac), `wildsim-movement-pb008.md` (a967d29).
