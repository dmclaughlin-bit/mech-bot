# READY / HOLD ledger

Updated Saturday 21 November 2026, about 5:50 PM ET. Expands the 5:45 PM ET loop stub (`99aa2d1`) and the 5:55 PM ET loop update (`20d03ae`, which added P25 PR #136 and still recorded zero READY). From recorded repo data only. Current champion: B113, bot code `6182d29c673d99f5186d742a5f019c0b007234f2`, merge `8b6e7b2841f5d26402d19fc4b28d16d2d6760550`, official score 4.17, receipt BB-09AE8A68. A record whose comparable screen was not run against that champion SHA is automatically HOLD (stale), even if the branch later merged 4.17. “Fired / different-behavior / different-score” are left blank when the record does not separate them. No READY rows at this snapshot.

## HOLD — P25 cube memory (`CUBE_MEMORY_ON`)

**6:05 PM ET update (Grok):** the full paired screen is DONE on `b34271c` vs `6182d29` (Sim Tester, 5:51–6:02 PM ET, comment https://github.com/dmclaughlin-bit/mech-bot/pull/136#issuecomment-7070616608, screens.csv `03efb84`). Fired / behavior differs / score differs: 2000+3000 30/30/15; 4000+5000 32/32/23; base-0 14/13/10. Flag-0 identical. check.py max 3.3 ms (Builder; independent re-run is due before any click). Sim 2000+3000 −0.073 ± 0.057, held-out +0.036 ± 0.102 (information only). Hazards: pin windows down on every set, games with a ≥20 s pin 15→13, died <40 s unchanged, drop-ring arrivals 11 in 10 → 9 in 8 on 2000–5000.
**Decision: STILL HOLD.** Veto rule (6) says no NEW pins of 20 s or more. Seed 3043 has a new 21 s pin (t=38–59 s) that IS caused by cube memory (83 ticks walking in place until the give-up budget dropped the cube). Seeds 72, 4091 and 5048 also have new ≥20 s pins, not caused by memory. Sim Tester rated it PASS on net (fewer pinned games overall), but rule (6) is written per new pin, and only Doug can grant an exception.
**Blocker / owner / next action:** (a) Mech Builder fixes the walk-in-place on 3043 in the same single change (a no-progress check that drops the remembered cube sooner); the new SHA then gets a fresh full screen. (b) In parallel, Doug decides whether a net-fewer-pins result can pass. Closes when either a re-screened SHA shows no change-caused new pin, or Doug says yes in his own words.

- **Decision: HOLD**
- **Exact SHA:** `b34271c15df17bac4fda4275a7928643034f5e83` (branch `p25-cube-memory`). **PR #136** opened 5:47 PM ET: https://github.com/dmclaughlin-bit/mech-bot/pull/136 . The 5:45 stub had no SHA; the 5:55 loop tick recorded this SHA and correctly left it HOLD.
- **Tested against:** commit message says flag-0 vs main and a base-0 96-game hazard. Branch **contains** `6182d29`. There is **no** paired 2000+3000 or 4000+5000 screen vs `6182d29` in `screens.csv`.
- **Novelty:** remembers seen cubes and walks up to 150 m under the existing `farmOk` gate, with TTL and a strict give-up. Closest official test: P23b late farm sweep, 4.00, BB-AEFC0FA8 (different mechanism: standing/still sweep + abort). P23 (`76c3fa8`) was vetoed for a 64 s pin. B12/B13 remain in the champion stack.
- **Impact rank:** Medium (see `ideas_queue.md`).
- **check.py max:** 3.3 ms (commit message). Under 30.
- **Flag-0:** yes, per commit message, `eqdrive` cmp vs main. Not independently re-run in this audit.
- **Paired screen 2000+3000 / 4000+5000:** missing (`screens.csv` still has no P25 row at 5:55). Builder/PR hazard, SEED_BASE 0, 96 games only: fired in **14 games** (592 ticks); 14 games different outcome rows; 11 games different score; pin windows 190→160, longest 49 s unchanged, **new 30 s pin on seed 72**; drop-ring arrivals 3/5 unchanged; died <40 s 33→33. Paired −0.052 ± 0.088 (info only). Official-set fired / different-behavior / different-score: unknown.
- **Hazards:** new seed-72 pin is a live blocker until Sim Tester measures it on the official sets and drop-ring / early-death checks.
- **Blocker / owner / next:** No complete official paired screen; seed-72 pin unresolved. **Owner: Mech Sim Tester** to run both seed sets vs `6182d29` and report the three counts plus pins and drop rings. No click until those land. Matches the 5:55 loop decision.

## HOLD — PR #129 mode 36 (drop commitment) — sim-only, not a site SHA

- **Decision: HOLD** (deserves a *future* candidate build; this PR is not it)
- **Exact SHA:** `11826aee02b45fedfee392a0c9c66c7ec0e29704` (branch `build-121-movement-iter3`). PR says **SIM-ONLY. Do not merge. Not a site candidate.** `EVADE_MODE` stays 0 on the branch, so this SHA is flag-0 champion movement, not mode 36 in production.
- **Tested against:** research screens in `movement-iter3.md` vs mode 0 on main `1781116` / later `b9661fb` (coord-only). `6182d29` **is an ancestor**. Bot code of that main equals the champion.
- **Novelty:** skip `break crossfire` during an active drop run/hold unless hit in the last 2 s. Closest official tests: B113 4.17 BB-09AE8A68 (reach 200 m), B118 4.17 tie BB-BAC9670C (reach 260 m), B115 4.13 BB-D76FEDCF (lead 10 s), P20 4.17 tie BB-36A427E0, P21 4.17 tie BB-1D97890A. Different decision.
- **Impact rank:** High.
- **check.py max:** 3.4 ms (flag 0 and mode 36). Under 30.
- **Flag-0:** yes, eqdrive vs `origin/main` at `1781116`, 302 lines; sim flag 0 vs earlier m0: 0 of 192 games differ in outcome columns.
- **Paired screen (research, not yet copied into `screens.csv`):** 2000+3000: 11 games changed, rings 6→7, captures 5→6, alive at end 6→6, surv 180 s 0.125→0.115, died <40 s 56→56, pins 166→137. 4000+5000: 11 changed, rings 6→7, captures 5→6, alive at end 5→5, surv 180 s 0.156→0.146, died <40 s 54→54, pins 186→190. Pooled 384: rings 12→14, captures 10→12, flips 211→39, score −0.016 ± 0.024. Separate “fired” vs “different-behavior” vs “different-score” was not published beyond “22 games change” over 384. Pin seeds 41/43/72/92 identical to mode 0.
- **Hazards:** no new pin seeds; slight surv-180 dip; sim `late50` spikes on 2000+3000 attributed to machine load.
- **Blocker / owner / next:** No one-flag site SHA, and the research tables are not an official `screens.csv` row for a *site* commit. **Owner: Grok to assign; Doug’s Claude or Mech Builder to cut** `EVADE_MODE=36` (or a dedicated flag) as its own commit on current main; **Sim Tester** to screen that exact SHA on both seed sets and log the three counts. Then re-enter this ledger.

## HOLD — PR #131 P-D-008 laserSkip comeback (docs / measurement)

- **Decision: HOLD** (not a site candidate)
- **Exact SHA:** `65e04bf9d6c441e88a4e36ee1656b5e8a06fe546`
- **Tested against:** shadow probe on current main bot code (`6182d29`); 0/384 games changed vs a plain main probe.
- **Novelty / impact:** come-back of a skipped laser/lightning in **4/192** and **3/192**. Below the ~10/192 bar. Diego recommended no Step B.
- **check.py / flag-0 / official paired bot screen:** docs PR, no bot-behavior change.
- **Blocker / owner / next:** Trigger bar not met. No build. **Owner: none.** Do not cut `LASER_SKIP_EXPIRE_S` unless a new count on a new champion crosses the bar (Doug’s 5:41 rebuild policy).

## HOLD — PR #132 P-D-009 two-horizon race shadow (docs / measurement)

- **Decision: HOLD** (not a site candidate)
- **Exact SHA:** `4d437ff00cba2d3d847f93ae85753e472c3c49e6`
- **Tested against:** shadow only, 0/384 changed vs main probe on `6182d29`. Disagreement in 9/192 and 10/192; mixed outcomes; Diego recommended no build.
- **Closest official tests:** B48 and B20+22 TTK recalibrations, both official losses (see `ideas.md`).
- **Blocker / owner / next:** Evidence does not support a build. **Owner: none.**

## HOLD — PR #133 sim-effectiveness recs (docs only)

- **Decision: HOLD** (not a bot candidate; screening-lane change only after a benchmark and Doug’s yes)
- **Exact SHA:** `1703c0c58c72c3b7e1f95f03c2006efa64399e98`
- **Tested against:** n/a (docs). See the audit §5 benchmark (identical games and outcome columns before any path-search shortcut is used in the screening lane).
- **Blocker / owner / next:** No authorization to change the screening lane. **Owner: Grok** to schedule the benchmark if desired; **Doug** must yes before the lane changes.

## HOLD — HEAL_COVER=1 (`c3a5d11`)

- **Decision: HOLD**
- **Exact SHA:** `c3a5d11a11c51ebc2caaca9469a91044c0b4fdb1` (branch `p24-heal-cover-v1`). **No PR.** Same tree as P24 with `HEAL_COVER=1`. Contains `6182d29`.
- **Tested against:** gate only, in the P24 PR body: check.py PASS p99 4.3 / max **5.4 ms**, flag-0 eqdrive identical, smoke 8 seeds (v1 changed 1/8). No official paired screen of this SHA in `screens.csv`.
- **Novelty:** `noSneak` no longer turns off the existing heal hide walk. Closest official test: **P24 HEAL_COVER=2, 3.79, BB-BE220066**.
- **Impact rank:** Low (same family just lost 0.38 official).
- **Fired / different-behavior / different-score:** unknown for this SHA. Research estimate for the *slice* is ~57/192 on the champion, not a screen of `c3a5d11`.
- **Blocker / owner / next:** Family just lost; no screen of this SHA; no distinct mechanism yet that explains why it would avoid P24’s 34 worse games. **Owner: Sim Tester** only if Grok still wants a cause-isolation screen; otherwise leave parked. Not a click.

## HOLD — other open bot PRs (stale screen, hold, or veto)

Each of the following heads was merge-updated around 2:51 PM ET so `6182d29` is an ancestor. That does **not** make the old screen valid.

| PR | Head SHA (short) | Why HOLD | Blocker / owner / next |
|---|---|---|---|
| #104 P-B-004 zone unpin | `7a822c4243` | No `screens.csv` row vs `6182d29` on both official sets found in this audit. Built and first discussed on an earlier champion. | Re-screen both sets vs `6182d29` (Sim Tester) or close if the mechanism is no longer the priority. |
| #106 P-B-005 gun lead during charge | `8bb6d107fa` | Same stale-screen problem. | Re-screen or close. |
| #110 B112 standoff max 100 m | `080e7fd11e` | `screens.csv` rows are vs `4d6e71b` (4.10). Standoff 90 s just scored 3.96 (B110, BB-4E063E2E). | Family just lost a related tweak. Re-screen only if Grok still ranks it; else park. |
| #111 P18 standoff max 120 m | `c6597c254b` | Same family / stale or missing 4.17 both-set screen. | Park / re-screen. |
| #112 P19 standoff HP margin 0.1 | `0135384951` | `screens.csv` vs `4d6e71b`; 2000+3000 was 0 games changed vs 4.10 (under the fire bar on that parent). | Almost certainly HOLD even after a re-screen if fires stay near 0. Owner: Sim Tester only if asked. |
| #113 P-B-002 laser-charge react | `0e4985aadf` | **Worked stale-approval case.** Screens in `screens.csv` are vs **`42a19d7` (4.06)**. | Re-screen vs `6182d29` both sets (Sim Tester) before any READY discussion. |
| #114 P-D-006 cook-off | `e8538894fc` | Same: screens vs `42a19d7`. | Re-screen vs `6182d29` or park. |
| #119 B116 movement mode 6 | `50eab3baee` | **Doug hold, 3:07 PM ET.** Also a movement-mode site candidate without a fresh official both-set row vs 4.17 in this audit. | Stays HOLD until Doug lifts the hold *and* a complete 4.17 screen exists. |
| #127 P23 late idle sweep | `76c3fa8899` | **VETO** (seed-90 64 s pin). Both official sets are in `screens.csv`. | Do not site-test. Closed path is P23b (already tested 4.00) / P25. |
| #128 B123 late-game hurt kiting | `dbc5f3b247` | Title already says **VETO, do not site-test.** | No click. |

## READY

None at this snapshot. Closest, in order: (1) mode 36 after a one-flag site SHA and an official both-set screen of that SHA; (2) P25 after a PR, a resolved seed-72 pin, and an official both-set screen.

## HOLD — remaining names from the 5:45 stub

These were listed in the stub as “not eligible / do not submit.” They stay HOLD. Details already covered above are not repeated.

| PR | Head SHA (short) | Why HOLD | Blocker / owner / next |
|---|---|---|---|
| #115 P-B-008 movement track (iter 1–2) | `c23c739ba0` | SIM-ONLY. Superseded by iter 3 PR #129. | Do not site-test this SHA. Mode 36, if cut, gets its own site SHA. Owner: none on this PR. |
| #124 P-D-007 Step A | `4db9b54122` | Docs / measurement only (late deaths are multi-LOS). | No bot click. |
| #125 P-D-007 Step B `ZONE_EARLY_S` | `889233e9b6` | Failed in sim (zone-travel deaths 28→30 and 37→45); Diego recommended no slot. | No click. |
| #126 B122 mid-game unstuck | `4296b4308a` | Closed 4:34 PM ET. Title: VETO, do not site-test. | No click. |
| #130 P24 HEAL_COVER=2 | `184bc1c2ed` | Already site-tested 3.79, BB-BE220066, CLOSE. | Do not resubmit. Family parked (see HEAL_COVER=1). |
| #134 P23b | `cf96cf514b` | Already site-tested 4.00, BB-AEFC0FA8, CLOSE. | Do not resubmit. Next farm path is P25. |
| #135 B125 | `ec50d23285` | Already site-tested 3.50, BB-C6A19503, CLOSE. Held-out drop rings 6→1. | Do not resubmit the package. |

## HOLD — new PRs (loop, 6:06 PM ET)
- P26 healthy boost with reserve, PR #138, c566fbadf65372c0de70d2ccd02e8f4c91a29ef0: no paired screen vs 6182d29 yet. Owner: Mech Sim Tester. Next: full screen on both sets; novelty check against the loadout/upgrade-timing losses.
- P27 mode 36 skip break-crossfire during drop runs, PR #137, 7df3a4a6: one-flag site SHA; no paired screen vs 6182d29 yet. Owner: Mech Sim Tester. Next: full screen on both sets.
- 6:15 PM ET (loop): P25 #136 head moved to 47d0e6ce (the pin fix). The b34271c screen does not carry over. HOLD until Mech Sim Tester runs a fresh full screen of 47d0e6ce on both sets vs 6182d29.


## Loop 6:55 PM ET (Sat Nov 21) - screens evaluated this tick
### READY - P27 drop crossfire skip (DROP_CROSSFIRE_SKIP_ON), PR #137, 7df3a4a6ab809aae28ef4e63e6629db5b9aedd81, vs champion 6182d29
- Novelty: closest priors P21 drop contest (tie, BB-1D97890A), P20 drop-when-hurt (tie, BB-36A427E0). New trigger (drop active + 2+ enemies in sight + no hit in 2 s) and action (skip the crossfire hide). Not tested before.
- Impact rank: 1 (only eligible candidate).
- Timing: loop check.py re-run PASS 300/300, max 3.2 ms.
- Change off: identical (tester flag-0 temp copy, 96 base-2000 seeds; code guarded by the flag).
- Activations: 2000+3000 fired 11 / diff behavior 11 / diff score 6; 4000+5000 fired 11 / 11 / 8.
- Hazards: no crash, no new 20 s+ pin (champion 3062 44 s pin gone), died<40 s 56->56, drop arrivals held.
- Single change: brain.ts one guarded condition + one params flag.
- Decision: READY.
### HOLD - P26 healthy boost (HEALTHY_BOOST_ON), PR #138, c566fbad
- Screens complete and rated PASS by Sim Tester, but new 20 s+ pins 4018 (22 s) and 5053 (20 s) with boost not active in the window. Rule (6) is per new pin. Owner: Doug (decide whether pins with the feature inactive veto). Next: Doug's answer; then loop check.py re-run.
### HOLD - P25b cube memory + no-progress drop (CUBE_MEMORY_ON), PR #136, 47d0e6ce
- Screens complete; seed 3043 pin fixed, but new 20 s+ pins 72 (20 s), 4091 (26 s), 5048 (25 s), 5054 (20 s), memory not active in any window. Also D3 question: memory plus no-progress drop may be two behaviors under one flag. Owner: Doug (pin rule + D3). Next: Doug's answer.

### 6:54 PM ET: P27 submitted 6:50 PM ET, BB-004FA2FF, scored 4.13 (-0.04 vs 4.17). CLOSE. READY count now 0.

## P29 midring settle (PR #143) READY 7:58 PM ET
- SHA 2e1d03615f6e8faa7097ffcbd441be43b234c5b9 vs champion 6182d29 (site 4.17). Screen: Sim Tester #143 comment 7071728630 (old sim, both sets).
- Novelty: first zone settle/midring position rule site-tested (not zone-early, not P28 patrol).
- Gate: own check.py PASS, max 2.6 ms. Flag-0 identical (Sim Tester, base 2000). merge-base OK. q.py eligible OK (single change).
- Activation: 17/16/8 (2000+3000), 25/25/11 (4000+5000). Sim +0.031 ± 0.037, +0.021 ± 0.028 (information only).
- Hazards: drops 6->8 and 5->7; died <40 s 56->56, 54->54; 20 s+ pause games 4->4, 5->5; survivors equal.
- Decision: READY by Doug's 7:55 PM ET ruling (set-total drop arrivals; seed 4027 1.3 s earlier death at same place is not "worse").
