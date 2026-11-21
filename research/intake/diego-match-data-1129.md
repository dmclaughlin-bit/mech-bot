# Grokbot: Mech Royale Match-Data Research & Continuous Improvement Plan
**Prepared:** November 20–21, 2026 ET  
**Source:** user-supplied `games_raw.csv` (208 rows, 43 original columns)  
**Target repo:** `dmclaughlin-bit/mech-bot`  
**Purpose:** evidence-led diagnosis and small, controlled changes to surpass verified Build 5b score 2.38 without destabilizing final submission.

> **Evidence labels**: **[CSV]** = directly calculated from uploaded file; **[REPO]** = observed from previously inspected GitHub files and competition dashboard; **[HYPOTHESIS]** = unverified explanation; **[PROPOSED TEST]** = experimental design. Do not promote a hypothesis into a finding without a valid test.
## Executive decisions
1. **Preserve Build 5b (`100941f`, 2.38) as scoring reference**; the latest observed Build 8 scored 2.27, a decline of 0.11. Verify current best on dashboard before acting. [REPO]
2. **Do not assume laser-first, extra kills, or more cubes cause better scores**. These are correlated with placement among observed opponents, and all are vulnerable to survival-time/selection biases. [CSV]
3. **Run a failure-classification instrumentation gate first**; official aggregate scores cannot attribute death causes. Local gameplay or replay access must be verified before claiming telemetry. [PROPOSED TEST]
4. **Prioritize conditional engagement and threat-aware navigation** as independent A/B experiments. Do not bundle multiple changes in a single official submission. [HYPOTHESIS]
5. **Coordinate via existing files and ownership rules**, not a workflow reset. Read `AI-Structure-Development.md`, `coord/WORKFLOW.md`, `coord/GROK_BRIEF.md`, `coord/log.md`, `EXPERIMENTS.md`, `pipeline/` schemas, and current PRs before task assignment. [REPO]
## Dataset audit
| Check | Result |
|---|---:|
| Records | 208 |
| Distinct matches | 13 |
| Rows per match | 16 in every match |
| Showdown matches | 8 |
| Public matches | 5 |
| Distinct mech labels | 50 |
| Our team observed in CSV | No |
| Recorded nonmissing laser acquisition times | 100 |
| Records with end loadout containing laser | 97 |
| Missing hold_open_pct rows | 45 |
| Missing circ70_hpfrac rows | 204 |

**Interpretation limitations:** 13 matches are not independent examples of 208 independent team runs: 16 mechs share each match. Winner rows are only 13. `loadout` is an observed/end-state field; `laser_t` captures recorded acquisition times and is missing for many rows. The recorded set is not a random sample of leaderboard teams or official practice. Public games include house/human opponents; showdowns are separate. Our own team does not appear, so these records cannot establish our actual causes of death. Field names do not prove exactly how internal `hold_open_pct` and related telemetry were calculated; validate watcher definitions before interpreting.
## Reproducible descriptive findings
| Cohort | n | Mean placement points | Mean damage dealt | Mean kills | Median max cubes |
|---|---:|---:|---:|---:|---:|
| Winners | 13 | 15.00 | 6,085 | 3.46 | 24 |
| Top 4 | 52 | 13.50 | 4,533 | 2.31 | 9 |
| Bottom 8 | 104 | 3.51 | 823 | 0.24 | 0 |
| Laser in observed loadout | 97 | 8.87 | 3,199 | 1.51 | 4 |
| No laser in observed loadout | 111 | 6.32 | 1,066 | 0.40 | 0 |
| Laser acquired <=15 s | 57 | 7.60 | 3,004 | 1.47 | 2 |
| Laser acquired >15 s | 43 | 10.51 | 3,447 | 1.58 | 8 |

**Correction to prior chat analysis:** The earlier statement of 54 early-laser/43 late-laser records was inaccurate. Actual CSV `laser_t` has **57 <=15 s, 43 >15 s (100 total)**. The observed final `loadout` contains laser for **97** records; 3 with recorded laser times do not end with laser. Do not conflate these variables.

### By match type (do not pool uncritically)
| Match kind | n | Laser loadout n | Laser mean points | Nonlaser mean points | Winner laser count |
|---|---:|---:|---:|---:|---:|
| public | 80 | 33 | 8.33 | 6.94 | 3/5 |
| showdown | 128 | 64 | 9.14 | 5.86 | 8/8 |

### Positioning and death evidence
- Winners with nonmissing `hold_open_pct`: 13; mean **6.2%**. Bottom-eight finishers with nonmissing value: 63; mean **36.6%**. This is descriptive; time/behavior and missingness confound the relationship. [CSV]
- Observed death labels: `team`=117, `house`=70, `nan`=13, `zone`=4, `human`=3, `npc`=1. These describe the recording sample, **not** our own deaths. [CSV]
- Winner loadout has laser in **11/13** matches, including **8/8** showdown wins. Laser effectiveness is a priority to test, not established as a causal win driver. [CSV]
- Damage/kills/cubes share a fundamental time-at-risk confound: survivors have longer to deal damage and collect cubes. Comparing raw totals by final placement exaggerates causal inference. [CSV + inference]
## Competing root-cause hypotheses for our 2.3 ceiling
| Rank | Hypothesis | Why plausible | Disconfirming evidence / what would falsify |
|---|---|---|---|
| 1 | Our AI avoids eliminations until several coordinated pursuers accumulate | House-bot practice enemies share information and do not kill each other; survival code is defensive [REPO] | Early selective engagement reduces placement or increases deaths in paired trials |
| 2 | Route selection ignores dynamic exposure | Existing A* is primarily static-geometry based [REPO] | Exposure weighting fails to reduce route damage or slows zone access |
| 3 | Nearest hiding spot is tactically poor | Current candidate spot selection is local and limited [REPO] | Better scored cover fails to increase regen completion or survival |
| 4 | Loot detours trade away too much HP/position | Build 8 laser-first lost 0.11 points against 2.38 [REPO] | Acquisition-policy-only A/B materially improves placement |
| 5 | Health regeneration seldom activates in real combat | Fire during damage-recovery behavior and repeated pursuit could reset cooldown [REPO/HYPOTHESIS] | Event logs show many uninterrupted regen windows and high HP recovery |
| 6 | Geometry or runtime failures create catastrophic deaths | Navigation includes approximations and deadline-sensitive searches [REPO] | No stucks, bad path segments, timeout or action failures in realistic scenarios |
## Required diagnostics BEFORE speculative strategy expansion
Record, when a legitimate replay/local simulation supports it: match/seed/scenario identifier, commit, timestamp, place, health, energy, cubes, weapon inventory, zone phase/next-zone slack, position/velocity, chosen behavior and reason, nearest enemy distances, visible and remembered shooters, line-of-sight and cover scores, incoming damage rate and source, fire/reload events, regen timer and HP regained, projectile risks, desired waypoint, path length/ETA, actual progress/stuck time, latency, fallback/timeout and cause of death. Store compact event-triggered logs or sampled intervals to keep under resource constraints. Do not print debug telemetry to stdout; protocol only there.

**Classification:** label each death with *primary* and *secondary* categories (multi-shooter, lost duel, bad route, stuck/collision, zone, exposed while healing, loot detour, late combat, failure/timeout, unknown), evidence timestamps, and confidence. Do not assign causal labels when an aggregate CSV cannot substantiate them.

**Data access gate:** audit documented `watch` interfaces, official submission logs, permitted game recordings and kit capabilities. If faithful match replay unavailable, report exact limitation and implement synthetic geometry/decision scenarios only; never present synthetic outcomes as scored matches.
## Experiment backlog (ONE strategic change per branch)
### EXP-A — Combat-vs-escape decision (Highest)
- **Hypothesis:** Current bot may allow coordinated attackers to accumulate.
- **Change:** One carefully scoped conditional engage rule when a single isolated threat has favorable predicted time-to-kill; preserve all existing retreat safeguards.
- **Metrics:** Mean placement points; deaths with >=2 nearby enemies; damage/kill; cubes gained; HP loss per fight.
- **Comparison:** Two-sided comparison on same local seeds and adversary models; official score for promoted candidate.
- **Rejection / guardrails:** Reject if timeouts, higher catastrophic death rate or reproducible worse placement.
- **Required output:** code SHA, parent SHA, config, harness command, conformance, latency, scenario-level differences, official submission ID/score when available, and KEEP/REVERT/INCONCLUSIVE decision.

### EXP-B — Threat-aware path costs (Highest)
- **Hypothesis:** Geometry-only A* misses exposure to multiple enemies.
- **Change:** Compare existing A* with a bounded opponent-exposure penalty based on current/last-seen tracks, while keeping collision safety as hard constraint.
- **Metrics:** Mean placement; path time; damage while traveling; zone damage; stuck rate; p99 latency.
- **Comparison:** Same local seeds, same zone transitions and adversary placements.
- **Rejection / guardrails:** Reject if geometry/CPU regressions or no placement gain.
- **Required output:** code SHA, parent SHA, config, harness command, conformance, latency, scenario-level differences, official submission ID/score when available, and KEEP/REVERT/INCONCLUSIVE decision.

### EXP-C — Cover selection quality (High)
- **Hypothesis:** Nearest hidden point may become trapped or soon visible.
- **Change:** Rank reachable candidate covers on multiple enemy LOS, exits, zone, predicted approach, travel cost; compare only when actually under threat.
- **Metrics:** Damage during retreats; seconds uninterrupted regen; successful disengagement; zone entries.
- **Comparison:** Replay/simulator scenarios with 1, 2, 4 pursuing bots.
- **Rejection / guardrails:** Reject if overcomplicated search times out or cover relocation increases damage.
- **Required output:** code SHA, parent SHA, config, harness command, conformance, latency, scenario-level differences, official submission ID/score when available, and KEEP/REVERT/INCONCLUSIVE decision.

### EXP-D — Nearby cube collection (High)
- **Hypothesis:** Bot may be underpowered during late encounters.
- **Change:** Add strictly low-risk nearby cube pickup on existing route; cap size-aware pickup utility; no exposed detours.
- **Metrics:** Max cubes at 60/120 sec; mean place; HP spent to get cubes; effective hit-rate.
- **Comparison:** Same seed scenarios, no intentional aggressive chasing.
- **Rejection / guardrails:** Reject if exposure outweighs scaling.
- **Required output:** code SHA, parent SHA, config, harness command, conformance, latency, scenario-level differences, official submission ID/score when available, and KEEP/REVERT/INCONCLUSIVE decision.

### EXP-E — Weapon policy (Medium)
- **Hypothesis:** Laser is associated with success but detours may hurt.
- **Change:** Test route-aligned laser pickups vs Build 8 laser-first detours vs baseline, holding combat policy constant.
- **Metrics:** HP at first weapon; detour meters; acquisition time; mean placement.
- **Comparison:** Separate acquisition policy from targeting/charging changes.
- **Rejection / guardrails:** Avoid interpreting winner loadout as causal proof.
- **Required output:** code SHA, parent SHA, config, harness command, conformance, latency, scenario-level differences, official submission ID/score when available, and KEEP/REVERT/INCONCLUSIVE decision.

### EXP-F — Regen verification (High)
- **Hypothesis:** Firing during low HP may defeat healing intent.
- **Change:** Instrument timestamps of dealt/received damage and actual HP increases; compare quiet-heal only when LOS truly broken.
- **Metrics:** Regeneration activation count; regenerated HP; survival; offensive output.
- **Comparison:** Synthetic legal observations plus faithful gameplay if available.
- **Rejection / guardrails:** Fix only confirmed implementation errors.
- **Required output:** code SHA, parent SHA, config, harness command, conformance, latency, scenario-level differences, official submission ID/score when available, and KEEP/REVERT/INCONCLUSIVE decision.

### EXP-G — Reliability and environment (Highest)
- **Hypothesis:** Silent geometry failures or action timeouts can cap score.
- **Change:** Measure time budget, fallback activation, path failures, illegal moves, missed actions and map errors; audit bridge/roof/height collision.
- **Metrics:** p99 and max decision latency; invalid outputs; stuck seconds; route failures.
- **Comparison:** Official check.py and Docker-equivalent under 1 CPU, 512MB, read-only.
- **Rejection / guardrails:** No promotion with conformance regression.
- **Required output:** code SHA, parent SHA, config, harness command, conformance, latency, scenario-level differences, official submission ID/score when available, and KEEP/REVERT/INCONCLUSIVE decision.

## Statistical evaluation and decision policy
1. **Primary competition KPI = mean(16 - finishing_place)** on official practice. Calculate score deltas against **identical parent/baseline**; reference best 2.38, do not compare against the latest 2.27 as though it were a winner.
2. Paired *local* comparisons should use identical seeds, arena configurations, spawn slots, opponent policies, and scenario order if the simulator permits. Report mean paired delta, median paired delta, early-death fraction, and bootstrap confidence intervals resampling **matches/scenarios**, not 16 rows within a shared match as independent samples.
3. Practice has fixed private seeds and prior identical-code resubmissions matched at two decimal places. Therefore same-benchmark deltas are useful for this leaderboard but may reflect overfitting; they are not proof of generalization or that a tiny delta is significant. Maintain unseen local scenarios/holdouts.
4. Keep a version only when it passes protocol conformance, latency and safety checks and has a defensible primary-metric benefit; if tiny increase, mark tentative and test further. Revert clear regression. A rule that improves a secondary statistic but lowers placement should not be promoted without compelling evidence.
5. Do not assume gains from separate experiments are additive. Evaluate interactions only after each component works alone. Maintain a compact ablation table for each introduced mechanism.
6. Test with Bun runtime and official `check/check.py` under documented 50ms limit, and Docker-equivalent 1 CPU / 512MB / read-only constraints when available. Gate on p99 ≤15ms if this is still the team target. Keep safe fallback path and protect current final entry.
## Allocation and 24-hour execution order
**Grok coordinator:** read repo and current state, select exactly one top experiment using evidence and remaining submission budget; assign ownership; reconcile `coord/WORKFLOW.md` if it supersedes older assignments; prohibit simultaneous edits to same files; make no direct bot-code edits unless the current team workflow explicitly authorizes them. Require each push to update `coord/log.md` and all tested builds to update the experimental data pipeline.

**Doug/implementing Claude:** inspect `brain.ts` and current branches; implement scoped behavior in code-owned files with explicit rollback switch; include one hypothesis and tests.

**Diego/research Claude:** analyze opponent telemetry and permitted recordings; produce independent evidence, diagnostics and experiment definitions, without conflating showdown/public/official practice or copying competitors’ code.

**Codex reviewer:** when configured, run focused independent review of geometry, protocol, timing, and whether the diff isolates one mechanism; unavailable reviews should be recorded as unavailable, not reported as passed.

**Recommended order:** (1) verify current repo/deadline/submission limits; (2) establish data/replay access and failure instrumentation; (3) assess reliability; (4) test EXP-A and EXP-B separately; (5) test EXP-C/EXP-F; (6) only then vary weapon/loot logic. Conserve official submissions, and freeze sufficiently ahead of deadline for final verification.
## Grokbot execution prompt — paste this with the file
> You are the Mech Royale coordinator. Read this report and `AI-Structure-Development.md`, `coord/WORKFLOW.md`, `coord/GROK_BRIEF.md`, `coord/log.md`, `EXPERIMENTS.md`, and `pipeline/` before assigning any task. Verify present commits, baseline and submission allowance. Respect the most recent workflow and file ownership; do not rewrite existing architecture, copy other teams’ code, or make bundled speculative changes. Our uploaded opponent CSV excludes our team; all its findings are associative and must not be described as direct diagnosis of our failures. Your first deliverable is a ranked root-cause table, current telemetry-access audit and one small controlled experiment with owner, baseline commit, allowed files, pass/fail tests, time budget and rollback conditions. After a scored result, ingest it into the established pipeline, classify KEEP/REVERT/INCONCLUSIVE using primary placement and reliability, record the lesson with uncertainty, and assign the next single experiment. Preserve best known scored entry and stop unvalidated late changes.
## Minimal reproduction script
```python
import pandas as pd
d = pd.read_csv("games_raw.csv")
d["points"] = 16 - d["place"]
print(d.shape, d.match_id.nunique(), d.mech.nunique())
for key, mask in {"winners": d.place == 1, "bottom8": d.place >= 9, "laser_loadout": d.loadout.str.contains("laser", na=False), "not_laser": ~d.loadout.str.contains("laser", na=False), "laser_early": d.laser_t <= 15, "laser_late": d.laser_t > 15}.items():
    z = d[mask]
    print(key, len(z), round(z.points.mean(), 3), round(z.damage_dealt.mean(), 1), z.cubes_max.median())
print(d.groupby("match_kind").match_id.nunique())
```
---
**Scope statement:** This file is an implementation/research handoff and does not claim the experiments were run or any code changed. Verify every claimed current baseline and branch from GitHub before execution.
