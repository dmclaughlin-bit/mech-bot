# Mech Royale performance audit: detailed plan (Deliverable A)

Sat Nov 21, 11:20 AM ET. Audit only. Nothing in the repo was changed. The short Grok version is `MECH_ROYALE_PERFORMANCE_FIX_HANDOFF.md` in the same folder.

## Verified baseline
- Champion: **B80 `28c3acc`** (main `cb93980`), site **3.79**, still the final entry. Main tip is `fea0df4`, with no bot-code change since B80.
- What B80 is built from, all flags on: farm (B12/B13), engage TTK/finish (B14), target pick (B16), no-sneak (B19), early laser rush (B17), the B30 settings (aggression 1.5, retreatHp 0.30, LASER_TRIP_M 250), crossfire break (B60) and the late gun-only walk (B80).
- Ideas that already failed and must not be repeated: unbounded or any-special early grabs (B8, B76), boosting the rush (B39), slot swaps (B66, B68, B90), pre-charge and charge-hold (B32, B40, B88), wider or looser cover (B82, B100, B53, B6), strafe (B27), rear step (B41), early no-finish (B98), hit rates and the race model (B48, B26), longer late walks (B86, B92, B94), and B64's distant-poke rush start.
- Doug's lane is resubmitting open PRs on B80 (B26 3.48, B51 3.79 tie at about 10:58 AM ET). Under `coord/WORKFLOW.md`, Grok's Claude writes the code.
- Sim limits: our gun hits 82% in the sim against about 23% in real recordings, sim house bots ignore charging lasers, and the sim score has r ≈ 0.22 with site scores. Loadout columns track the site better (lightning r 0.50, laser r 0.46). The sim repeats itself to within 1 of 192 games.
- Tools: no project skills apply here, and there are no site replays. The tester's `deaths.py` and detail CSVs live on Doug's box and aren't reachable from here, so I rebuilt the measurements with my own per-decision instrumentation (`perf-audit-tools/`).

## Bottleneck verdicts (192 paired games, SEED_BASE 2000 + 3000)

**1. Early weapon disadvantage: REAL, top priority.** We had a laser by 30 s in 58 of 192 games (30%), and those games scored 5.78. In 62 of the 76 games where we knew a laser within 250 m but didn't get it, the main blocker was the "hit in the last 3 s" gate. Smaller blockers:

| Blocker | Games where it was main |
|---|---|
| Hit in the last 3 s | 62 |
| No free slot (gun + lightning) | 3 |
| Engaged | 2 |
| Path, fit or skip | 8 |

Engagement rarely overrides the trip. Reach and timing are fine: the laser walk ran 3,359 ticks in the early-death games. Farming doesn't interfere: the cube-first rule never showed up as a blocker. Failed paths hit 5 games and never caused a stall. **Fix: UF100 (handoff §3).** Screen result: laser by 30 s +24, died before 40 s −2, sim +0.25 ± 0.14.

**2. Multiple hunters: REAL, but it is a downstream symptom.** Only 18 of 56 early deaths had 2+ enemies with line of sight before our first damage. The usual sequence is: a single poke, the walk is cancelled, the bot stands still in "heal", a second hunter joins 5.9 s later, and we die 15.4 s after that. Build 60 handles the 2+ LOS state once it exists. Preemptive positioning would act in the same window and on the same moves (walk to cover under fire) as B100, B82 and B53, which all lost. **I can't tell it apart from those failures, so I recommend dropping it as a separate build.** UF100 already shortens the standing-still window. The only variant worth re-measuring after UF100 is "cover instead of heal under single-attacker fire before 45 s" (rank 2, low confidence).

**3. Combat feasibility: the formula has defects, but they're not costing placements.**
- `ourDps` and `enemyDps` are averages that ignore cooldown, charge, ammo and torso turn.
- `ourMagazine` uses `stats.mag` rather than the current ammo.
- `race()` counts only one enemy's DPS, though `alone()` stands in for that.
- Unknown enemy weapons default to the gun.

None of this shows up in deaths: we were engaged in 0 of 56 early deaths and 7 of 188 overall, and finish-engage took 5% of early-death damage. **Keep the current model.** A 1.5 s readiness window would change decisions that aren't where we lose, and B48 and B26 lost on similar changes.

**4. Navigation: minor.**
- 7 failed paths in 5 games and 2 timeouts.
- In 3 games a laser path was over 250 m. `rush` resets every tick there, so `LASER_CHASE_S` never fires and the bot re-plans A* each tick. It never stalled, and the worst decision took 11.6 ms.
- The bot was stuck 1 s or more 100 times across 101 games, mostly on zone travel, retreat and kill-cube collection.

A one-line patch (`laserSkip.add(id)` when the planned path is over `LASER_TRIP_M`) would touch about 3 of 192 games. That's inert, so **don't spend a slot on it.**

**5. Experimentation: REAL.** The rerun shows the sim is deterministic, so "games changed" is exact. The B64 vs UF100 contrast shows that two builds with flat sim scores can still have opposite behavior profiles: died before 40 s went +3 for B64-style and −2 for UF100. **Gate every slot on the handoff §3 table, not on the sim mean.**

## Priority table

| Rank | Bottleneck | Verified evidence | Root cause | One-change solution | Risk | Confidence | Priority |
|---|---|---|---|---|---|---|---|
| 1 | Early weapon | 62 of 76 blocked by the hit gate. UF100 screen +24 lasers by 30 s, −2 early deaths | Quiet gate, `brain.ts:643` | UF100 (`UNDER_FIRE_RUSH_M` 100) | B64 cousin lost −0.04 | Medium | **High** |
| 2 | Multi-hunter | 38 of 56 early deaths start 1-on-1. 42% of damage taken in "heal" | Heal stands still under fire, `:736` | Early cover instead of heal (later, re-measure first) | B100, B82, B53 lost | Low | Low until #1 scores |
| 3 | Workflow | Inert and rematch slots, sim r 0.22 | Choosing builds by sim mean and games changed | §3 diagnostic table before every slot | None | High | High (process, no slot) |
| 4 | Combat estimate | 0 of 56 early deaths engaged | Not the binding constraint | Keep the current model | — | Medium | Drop |
| 5 | Nav | 3 to 5 of 192 games affected | Over-long laser path never skipped | `laserSkip` on too-long path (hygiene only) | Inert | High | Drop for slots |

## Experiment 1 plan (after Diego approves)
1. Branch `build-uf100` (or the name Grok picks) from main `fea0df4`. Add one flag in `params.ts` and three lines in the `brain.ts` rush gate, exactly as handoff §3 says.
2. Tests:
   - `bun build`
   - Kit gate `check.py --map-dir arena -- bun bot.ts` must PASS, with max under 30 ms
   - With the flag at 0, the kit-stream actions must match B80 exactly
   - The 192-game paired screen with the handoff §3 table
   - Behavior vetoes: died before 40 s +3 or more, lightning at end −5 or more, or sim below −0.3
3. Open the PR with the table. Don't merge. Grok submits.
4. Rollback: the flag goes to 0, or the PR is closed. Main and the final entry stay B80 unless the site score beats 3.79.

**Expected effect:** this changes about 37 of 192 games. B17 was the same kind of lever (laser by 30 s) and gained +0.42. I'd guess a site change somewhere between −0.1 and +0.3, but treat that as low confidence, because the sim doesn't rank builds reliably. **Minimum submissions:** 1, plus at most 1 follow-up at 80 m if it ties.

## Phase 8: behavior structure (no rewrite recommended)
- **Acquire:** the rush is cancelled by any hit (the 3 s gate) while engage, claim and hurt already outrank it. Those are two layers guarding the same thing. UF100 relaxes only the first one, and only near a laser.
- **Prevent overwhelm:** "heal" (HP under 90%) sets move to zero even while we're being shot, when regen is impossible. That contradicts what the mode is for, and it's where we take the most damage. Don't fix it with a generic strafe (B27 lost). Revisit it only as a measured rank-2 build.
- **Win fights:** the engage logic is rarely involved in deaths. Leave it alone.
- **Redundant or expensive:** `route` is shared by the rush, farm, claim and zone code, so different goals overwrite each other and force re-plans (3 games). It's cheap (p99 1.3 ms), so there's no change needed for the time budget.
- **Ownership:** UF100 is Lane B, rush gate only. It doesn't collide with Doug's open PRs. Don't submit B54 (#55), because it overlaps.
