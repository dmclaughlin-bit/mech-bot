# Directive for Grok: master system audit (Sat Nov 21, 11:18 AM ET)

**From:** Diego, written by Diego. Committed to the repo by Diego's Claude. **Status: open, highest priority.**

**How this reached you:** through the repo only. Diego's Claude has no direct line to Grok; this file, the pointer at the top of `coord/GROK_BRIEF.md` and `coord/learnings.md`, and the `coord/log.md` entry are the whole delivery. Nothing was sent to you any other way. Your first response (directive §18) needs to come back the usual way: Diego pastes or relays it, and a Claude commits it.

## Read this before starting (don't redo finished work)

Three audits were already done. They are copied into `coord/audit/` so you can read them from GitHub:

| File | What it settles |
|---|---|
| `coord/audit/perf-fix-handoff-2026-11-21-1115.md` | Today's 11:15 AM ET audit of B80 (192 instrumented sim games on fresh seeds 2000 + 3000). |
| `coord/audit/perf-audit-plan-2026-11-21.md` | The plan and method behind that audit. |
| `coord/audit/grok-brief-2026-11-21-0200.md` | The 2:00 AM ET audit of the old 3.50 champion (stand-still in fights, heal freeze, engage gating, hit-rate guesses). Its champion numbers are out of date. |

Verdicts from today's audit, so §3–§5 of the directive start from them rather than repeat them:

- **Champion: B80 `28c3acc` (merged as `cb93980`), site 3.79, receipt BB-78A44AAF.** Bot code on `main` hasn't changed since. Board at 10:59 AM ET: 137th of 256, #32 at 5.33.
- **The one fix worth a slot: UF100, the early laser walk under fire** (PR #86's idea). The 3 s "hit recently" gate (`brain.ts:643`) blocked the early laser walk in 62 of 76 games, and the bot then stands still in "heal" mode under fire (`brain.ts:736`). That's 42% of the damage we take in early deaths. Sim vs B80: +0.25 ± 0.14, laser by 30 s 58 → 82, died before 40 s 56 → 54. Spec, vetoes and keep rule are in the handoff §3–§4.
- **Recommended dropped:** a multi-hunter / preemptive positioning system (early deaths start 1-on-1; the second hunter arrives after), combat-math / readiness estimates (we were engaged in 0 of 56 early deaths), and nav fixes (3 of 192 games, inert).
- **Measurement already built:** a local sim (`tools/sim`) that reproduces itself (1 of 192 games changed on rerun), but its score correlates only r ≈ 0.22 with the site score (`coord/RESEARCH.md` §6). Treat it as a screen, not proof. The instrumentation scripts live in Diego's project files, not the repo; ask Diego's Claude to rerun them on a new champion.

## Where the directive's deliverables (§16) already live

Update these instead of creating duplicates. Create a new file only where none exists.

| Directive deliverable | Existing home |
|---|---|
| E. EXPERIMENT_LEDGER | `EXPERIMENTS.md` + `pipeline/data/experiments.jsonl` + `coord/log.md` |
| F. CHAMPION_STATUS | `pipeline/data/champion.json` (plus the newest champion line in `coord/log.md`) |
| G. AGENT_COORDINATION | `coord/WORKFLOW.md` |
| B. SCORE_PLATEAU_ANALYSIS, C. STRATEGY_GAP_ANALYSIS (in part) | `coord/RESEARCH.md`, `coord/rca-report.md`, `coord/audit/` |
| D. OPTIMIZATION_BACKLOG | `pipeline/data/hypotheses.jsonl` (`python3 pipeline/q.py brief`) |
| A. SYSTEM_AUDIT, H. FINAL_READINESS | No file yet. |

## Fixed constraints for this work

- **Deadline Sun Nov 22, 11:00 AM ET**; team lock Sun 9:00 AM ET. 4 submissions per hour.
- **Using or building on another team's bot is against the rules.** Read their public repos for ideas only, as before.
- Submissions, merges to `main` that change bot code, and anything paid or irreversible still need Diego or Doug's go-ahead, as the directive says. This commit changed no bot code and submitted nothing.

---

# The directive (Diego's words, verbatim)

MECH ROYALE — MASTER SYSTEM AUDIT, STRATEGIC OPTIMIZATION & AUTONOMOUS COORDINATION DIRECTIVE
PRIORITY: CRITICAL — CHAMPIONSHIP OPTIMIZATION
Recipient: Claude → Grokbot (Central AI Coordinator)
Competition: Builders Buildathon — Mech Royale
Deadline: November 22, 2026, 11:00 AM ET
Primary objective: Maximize expected tournament placement points while preserving reliability, runtime compliance, and generalization against unfamiliar opponents.

## 1. YOUR IMMEDIATE INSTRUCTIONS

Claude, your first responsibility is to communicate the entirety of this directive to Grokbot, our established central coordinator.
Grokbot must become responsible for orchestrating a comprehensive, evidence-based review and optimization of our existing Mech Royale system.
Do not treat this as a request to create a new mech.
We already have an existing architecture, functioning code, established workflows, experimental results, and a collaborative multi-agent system.
Your mission is to determine:

1. What our current mech is doing correctly.
2. Why our placement score has plateaued.
3. Which existing systems are underperforming.
4. Which systems are unnecessarily complicated or redundant.
5. Which important competitive strategies are missing.
6. Which components should remain completely unchanged.
7. Whether our coordination and testing processes are limiting progress.
8. Which proposed improvements actually have the greatest expected impact.
9. How to implement and validate those improvements with minimal disruption.
10. How to maximize our final competition score before the deadline.

Grokbot should coordinate this entire process automatically using our established collaboration infrastructure, without requiring my approval for every ordinary internal step.
However, preserve human authorization where required for external submissions, destructive operations, paid services, irreversible actions, or changes outside previously approved project boundaries.
Do not claim that an agent has completed an action unless the result is independently verified.
If Claude cannot communicate directly with Grokbot using the available integration, prepare the complete directive in the coordinator's existing handoff format and report exactly what remains to be delivered. Do not pretend the message was transmitted.

## 2. VERIFY THE COMPETITION RULES

Before evaluating strategy, retrieve and inspect the official competition documentation:

* https://www.joinbuilders.org/buildathon#rules
* https://www.joinbuilders.org/buildathon/tracks/builders
* https://www.joinbuilders.org/buildathon/tracks/builders/files/protocol.md?inline=1

Also inspect the latest available official technical files, including the protocol schema, example bot, conformance checker, game configuration, and map geometry.
Treat official documentation and actual runtime configuration as authoritative.
Verify all numerical mechanics rather than relying on memory or assumptions.
Key constraints to check include:

* 50 ms action-response deadline.
* One CPU core.
* 512 MB memory.
* No runtime networking.
* JSON-lines action protocol.
* Restricted filesystem and repository size.
* Official placement-based scoring.
* Practice submission limits.
* Tournament and qualification structure.
* Submission deadline.

Distinguish practice performance from tournament performance.
Practice opponents consist of coordinated house bots.
Tournament opponents consist of other participants' submitted mechs in a free-for-all.
Optimizing exclusively for the practice environment risks overfitting.
Grokbot must account for both environments when evaluating strategic improvements.

## 3. CONDUCT A COMPLETE CURRENT-SYSTEM AUDIT

Grokbot must assign nonoverlapping audit responsibilities to the available agents.
The first audit pass must be read-only.
Every active system that materially affects gameplay, runtime performance, score measurement, or agent collaboration must be examined.

### 3.1 Source-code audit

Inspect the actual executable code, not merely the documentation.
Review:

* Startup and runtime initialization.
* Observation parsing.
* Internal world-state updates.
* Persistent memory.
* Enemy tracking.
* Threat evaluation.
* Navigation.
* Pathfinding.
* Collision handling.
* Zone management.
* Tactical decision-making.
* State-machine transitions.
* Target selection.
* Aim calculations.
* Weapon selection.
* Projectile prediction.
* Weapon firing and cooldowns.
* Movement and boost usage.
* Energy management.
* Regeneration logic.
* Resource collection.
* Upgrade decisions.
* Supply-drop behavior.
* Endgame decision-making.
* Output validation.
* Latency and runtime safety.
* Error handling and fallback actions.

For each subsystem, determine:
A. Current purpose: What is it supposed to accomplish?
B. Actual behavior: What does the code genuinely do?
C. Dependencies: Which other systems affect its decisions?
D. Redundancy: Does another subsystem duplicate its functionality?
E. Conflict: Can two modules issue contradictory instructions?
F. Computational cost: Does the subsystem consume unnecessary CPU time, memory, or decision latency?
G. Strategic effectiveness: Is its behavior consistent with maximizing placement?
H. Potential improvement: Is there a simpler or stronger alternative?
I. Supporting evidence: What tests, code paths, or match outcomes support the conclusion?
J. Recommendation: Preserve, simplify, repair, replace, or remove.
Identify exact files, functions, and relevant line ranges for every confirmed issue.
Do not label code problematic simply because it differs from a preferred architecture.

## 4. TRACE THE ENTIRE DECISION PIPELINE

A particularly important task is determining how the mech converts observations into actions.
Trace:
Observation → State Interpretation → Threat Assessment → Strategic Objective → Tactical Decision → Movement/Weapon Control → Final Action
Identify:

1. Where decisions originate.
2. Which systems have final authority.
3. Whether downstream logic overrides upstream decisions.
4. Whether old goals persist after conditions change.
5. Whether navigation and targeting contradict each other.
6. Whether multiple systems compete for boost or energy.
7. Whether the mech repeatedly switches objectives.
8. Whether emergency behaviors can reliably override normal planning.
9. Whether the policy can get stuck in repetitive loops.
10. Whether different tactical modules calculate conflicting interpretations of the same environment.

Specifically investigate:

* Oscillating movement.
* Unnecessary target switching.
* Repeated failed navigation commands.
* Movement into dangerous firing angles.
* Attacking while attempting to regenerate.
* Continuing a resource pursuit during an emergency.
* Wasting boost energy.
* Repeatedly approaching unreachable positions.
* Overcorrecting aim.
* Using weapons when the probability of hitting is poor.
* Failing to interrupt an obsolete objective.

Where conflicts exist, propose a unified decision hierarchy.
Suggested priority:
Immediate safety → Tactical survival → Strategic positioning → Combat opportunities → Resource acquisition
This hierarchy is a starting hypothesis, not a requirement to rewrite the current controller.
Preserve effective existing behavior.

## 5. IDENTIFY THE TRUE CAUSES OF OUR SCORE PLATEAU

Our score has reached a ceiling despite repeated development and optimization.
Grokbot must investigate why.
Do not immediately assume the problem is aiming, movement, or aggression.
Analyze the entire system.
Potential explanations include:

Strategic weaknesses

* Excessive aggression.
* Failure to disengage.
* Poor use of regeneration.
* Weak endgame positioning.
* Poor zone awareness.
* Unsafe resource collection.
* Failure to adapt to multiple enemies.

Mechanical weaknesses

* Inaccurate predictive aiming.
* Wrong weapon selection.
* Poor collision handling.
* Wasted movement inputs.
* Improper laser charge timing.
* Incorrect mortar ballistic calculations.
* Inefficient energy management.

Architectural weaknesses

* Contradictory decision logic.
* Too many nested heuristics.
* Redundant computation.
* Overly complicated state management.
* Unstable state transitions.
* Insufficient emergency overrides.

Experimental weaknesses

* Inadequate sample sizes.
* Comparing different seeds or opponent populations.
* Missing replay diagnostics.
* Testing too many modifications simultaneously.
* Misinterpreting random score variation as improvement.
* Optimizing the practice leaderboard at the expense of tournament generalization.

Collaboration weaknesses

* Multiple agents investigating the same problem.
* Agents implementing overlapping changes.
* Repeated code reviews without new information.
* Large context transfers that contain mostly redundant material.
* Unclear ownership.
* Unverified merge assumptions.
* Insufficient communication between experimental findings and implementation.

For every suspected bottleneck, assign:

* Evidence level: confirmed, probable, speculative, or unknown.
* Expected impact on placement.
* Frequency of occurrence.
* Complexity of fixing.
* Risk of introducing regressions.
* Minimum experiment required to verify it.

Prioritize causes capable of explaining a substantial portion of lost placement points.
Avoid low-value micro-optimizations while major systemic problems remain.

## 6. CROSS-REFERENCE OUR EXISTING MECH AGAINST A CHAMPIONSHIP STRATEGY FRAMEWORK

The following framework contains proposed strategies.
These are hypotheses to evaluate, not features that must all be implemented.
Grokbot must compare each proposed capability against the current architecture.
For each strategy, determine:

1. Already implemented correctly?
2. Implemented but ineffective?
3. Partially implemented?
4. Missing?
5. Incompatible with existing systems?
6. Worth implementing before the deadline?
7. Measurable expected benefit?
8. Cheapest safe implementation method?

### 6.1 Survival-first tactical intelligence

Evaluate:

* Threat-aware fight selection.
* Intelligent retreat decisions.
* Regeneration-aware disengagement.
* Multiple-attacker avoidance.
* Protection against rear-armor exposure.
* Emergency evasion.
* Escape-route feasibility.
* Damage-exposure minimization.
* Health preservation before endgame.

Determine whether the current mech fights too frequently or remains engaged when retreating would have higher expected placement value.

### 6.2 Threat prediction and enemy tracking

Evaluate:

* Enemy velocity tracking.
* Position prediction.
* Last-seen memory.
* Confidence-weighted enemy estimates.
* Sound-based tactical awareness.
* Weapon threat classification.
* Line-of-sight reasoning.
* Enemy focus-fire detection.
* Nearby hostile density.
* Probability of receiving imminent damage.

Do not treat uncertain enemy locations as exact positions.

### 6.3 Navigation and tactical positioning

Evaluate:

* Global pathfinding.
* Local obstacle avoidance.
* Cover identification.
* Cover quality evaluation.
* Zone-entry timing.
* Future-zone anticipation.
* Rooftop navigation.
* Elevation-aware paths.
* Stuck detection.
* Escape-route preservation.
* Collision recovery.
* Avoidance of exposed open terrain.

Investigate whether the mech frequently wastes movement attempting unreachable destinations.

### 6.4 Weapon-specific optimization

Gun
Evaluate predictive intercept calculations, projectile travel time, target velocity, obstruction handling, reload awareness, and accuracy.
Mortar
Evaluate ballistic modeling, elevation differences, impact prediction, splash effectiveness, knockback utility, and self-damage risk.
Laser
Evaluate charge timing, aim alignment, release decisions, movement penalties, and opportunities for safe burst damage.
Lightning
Evaluate range, target visibility, chaining opportunities, energy consumption, and defensive applications against laser threats.
Weapon selection
Determine whether the bot properly considers range, counters, terrain, available energy, current combat conditions, and the danger of acquiring new weapons.

### 6.5 Resource and upgrade economy

Evaluate:

* Power-cube collection efficiency.
* Health and damage scaling.
* Increasing mech size.
* Cube collection beyond damage/HP scaling caps.
* Supply-drop timing.
* Supply-drop capture risk.
* NPC drone reward efficiency.
* Crate collection.
* Upgrade selection.
* Recovery value.
* Resource acquisition relative to zone urgency.

Determine whether resource pursuit increases or decreases expected placement.

### 6.6 Adaptive objective planning

Evaluate whether the mech has a coherent high-level decision system for:

* Exploring.
* Looting.
* Repositioning.
* Engaging.
* Disengaging.
* Recovering.
* Evading.
* Preparing for endgame.

Investigate whether a unified utility-based objective selector would improve the current system.
Do not add an unnecessary new decision layer if the existing architecture already performs this function effectively.

### 6.7 Endgame intelligence

Evaluate:

* Final-circle positioning.
* Remaining safe-zone geometry.
* Health conservation.
* Opponent weapon matchups.
* Timing of attacks.
* Avoidance of unnecessary engagements.
* Third-party opportunities.
* Remaining energy.
* HP-based clock expiration tiebreaks.
* Final one-versus-one behavior.
* Survival under multiple attackers.

Determine whether endgame weakness is a major contributor to our placement ceiling.

## 7. ESTABLISH A MEASUREMENT AND EXPERIMENT FRAMEWORK

Grokbot must inspect our current testing and scoring infrastructure.
Determine what we already measure and what important information is missing.
At minimum, investigate whether we can accurately measure:

Outcome metrics

* Mean placement points.
* Median placement.
* Placement distribution.
* Win rate.
* Top-four rate.
* Survival time.

Combat metrics

* Damage dealt and received.
* Accuracy by weapon.
* Shots fired.
* Weapon-specific effectiveness.
* Damage received from behind.
* Enemy kills.
* Energy spent on attacks.

Movement metrics

* Distance traveled.
* Time exposed.
* Time outside the safe zone.
* Stuck events.
* Inefficient movement loops.
* Collision failures.
* Escape success rate.

Survival metrics

* Health regenerated.
* Time spent recovering.
* Emergency evasion success.
* Failed retreats.
* Fatality causes.

Decision metrics

* Objective-switch frequency.
* Tactical state transitions.
* Decision conflicts.
* Unnecessary target switching.
* Missed tactical opportunities.

Runtime metrics

* p50/p95/p99 decision latency.
* Worst-case decision latency.
* Crashes.
* Invalid actions.
* Missed deadlines.
* Memory use.

Use official observations, game events, and verified local instrumentation.
If a metric is unavailable, report the limitation.
Never fabricate telemetry.

## 8. IMPLEMENT SCIENTIFIC EXPERIMENTATION

Before implementing speculative improvements, create a controlled experiment plan.
Each experiment must contain:

1. Hypothesis.
2. Existing baseline.
3. Proposed modification.
4. Expected behavioral change.
5. Test conditions.
6. Seeds and opponents where controllable.
7. Primary success metric.
8. Secondary metrics.
9. Regression criteria.
10. Decision: accept, reject, or refine.

Use matched-seed comparisons when possible.
Do not assume the official kit contains a complete local match simulator; verify available capabilities.
If a faithful local simulator is unavailable, distinguish:

* Unit tests.
* Synthetic tactical scenarios.
* Approximate simulations.
* Official practice submissions.

Do not treat synthetic tests as proof of competition-level improvement.

Required ablation analysis
Where feasible, measure the contribution of:

* Threat assessment.
* Regeneration planning.
* Predictive aiming.
* Tactical disengagement.
* Dynamic weapon selection.
* Cover evaluation.
* Resource pursuit.
* Endgame logic.

Disable or simplify a subsystem in a controlled variant and compare outcomes.
If a subsystem increases complexity without measurable benefit, consider removing or simplifying it.

## 9. OPTIMIZE THE SYSTEM WITHOUT OVERENGINEERING

A central objective is improving the quality of our mech while minimizing unnecessary complexity.
Grokbot must specifically search for:

* Duplicated calculations.
* Unnecessary state variables.
* Expensive repeated path searches.
* Unused tactical features.
* Contradictory heuristics.
* Obsolete logic.
* Deeply nested conditional branches.
* Unnecessary abstractions.
* Redundant error handling.
* Unused dependencies.
* Overly frequent replanning.
* Features without measurable performance value.

However, do not remove working functionality solely to reduce lines of code.
Judge simplification by actual effects on:
Reliability, readability, decision quality, runtime efficiency, and placement performance.
Prefer minimal surgical fixes over complete rewrites.
Do not add machine-learning models or heavy inference dependencies unless a convincing, achievable performance advantage has been demonstrated.

## 10. AUTOMATIC MULTI-AGENT ORCHESTRATION

Grokbot is responsible for coordinating our established two-person development team.
We have:

* My Claude.
* My Codex.
* My teammate's Claude.
* My teammate's Codex.
* Grokbot as coordinator.

Maintain the current collaboration infrastructure where it works effectively.
Suggested ownership:

Claude A — Strategy and architecture

* Tactical planning.
* Threat and survival models.
* Movement decision analysis.
* Cross-system behavioral inconsistencies.

Codex A — Navigation and integration

* Navigation implementation.
* Runtime reliability.
* Policy integration.
* Regression testing.

Claude B — Combat and mechanical analysis

* Predictive aiming.
* Weapon optimization.
* Ballistic modeling.
* Combat-state behavior.

Codex B — Combat implementation and benchmarking

* Weapon fixes.
* Targeting improvements.
* Performance optimization.
* Combat-focused experiments.

Grokbot — Coordination and optimization

* Task prioritization.
* Experiment tracking.
* Work allocation.
* Cross-agent communication.
* Evidence synthesis.
* Progress monitoring.
* Final release planning.

Grokbot may adjust responsibilities based on actual repository ownership and agent availability.

Coordination constraints

1. One primary owner per task.
2. One working branch per independent change.
3. No simultaneous editing of the same files without explicit coordination.
4. No unnecessary duplicate audits.
5. No redundant reviews.
6. No repeated research already preserved in project documentation.
7. Use concise structured handoff files.
8. Preserve the highest-scoring validated commit.
9. Require evidence before promoting a candidate.
10. Escalate conflicts affecting the overall architecture.

Use the strongest available reasoning models for difficult architectural analysis and Codex for implementation and repository-level debugging.
Choose model effort proportional to task complexity.
Discover and use relevant installed project skills where helpful, including testing, repository review, performance profiling, and debugging skills.
Report unavailable or incompatible skills rather than silently assuming they exist.

## 11. AUTOMATED EXECUTION PROCESS

After completing the initial read-only audit, Grokbot should coordinate the following cycle using the tools and permissions already available.

Step 1 — Diagnose
Identify the largest verified performance bottleneck.
Step 2 — Prioritize
Estimate expected placement impact, implementation cost, confidence, and regression risk.
Step 3 — Assign
Choose exactly one primary implementation owner.
Step 4 — Implement
Apply the smallest effective change on an isolated branch.
Step 5 — Verify
Run focused tests, applicable regression tests, and runtime performance checks.
Step 6 — Compare
Compare the candidate with the preserved champion using credible evaluation conditions.
Step 7 — Review
Use one independent reviewer for high-risk changes.
Step 8 — Decide
Accept, refine, reject, or roll back based on evidence.
Step 9 — Record
Write the outcome and supporting evidence into the persistent experiment ledger.
Step 10 — Repeat
Proceed to the next highest-value unresolved bottleneck.

The cycle should require minimal manual coordination.
Do not automatically submit code to the official competition or perform other external, irreversible, or paid actions without the necessary authorization.
Do not deploy speculative changes directly onto the best-performing branch.

## 12. ESTABLISH AUTOMATIC BOTTLENECK DETECTION

Grokbot should continuously inspect completed experiment results and determine which component is currently limiting performance.
Examples:

* If accuracy is strong but placement remains poor, investigate engagement selection and exposure.
* If damage output is strong but deaths occur early, investigate retreat and recovery.
* If the mech survives early but consistently fails late, prioritize zone and endgame intelligence.
* If resource acquisition is high without corresponding placement gains, evaluate acquisition risk.
* If movement commands frequently fail, prioritize collision handling and navigation.
* If most experiments produce no improvement, investigate measurement quality, strategic assumptions, and policy-level limitations.

Do not repeatedly tune minor parameters without establishing why the associated behavior matters.
Identify the current binding constraint on performance, fix it, and reassess whether the binding constraint has changed.

## 13. ESTABLISH A CHAMPION–CHALLENGER SYSTEM

Maintain two distinct roles:

Champion
The best validated version currently available.
Never overwrite it with an unproven experiment.

Challenger
The candidate undergoing improvement.
A challenger must pass technical and gameplay verification before replacing the champion.

Store:

* Commit hash.
* Configuration.
* Test results.
* Official score, if available.
* Known strengths.
* Known weaknesses.
* Reason for promotion.

Grokbot must preserve rollback capability throughout the optimization process.

## 14. COMPETITION-SPECIFIC OPTIMIZATION

We are optimizing for placement scoring.
Do not assume maximizing kills produces the highest score.
Prioritize strategies capable of improving expected survival and placement.
Grokbot must evaluate whether our existing bot effectively uses:

* Passive HP regeneration.
* Cover.
* Enemy isolation.
* Zone prediction.
* Safe resource collection.
* Supply-drop healing and energy restoration.
* Front-facing armor.
* Weapon counters.
* Efficient energy conservation.
* Opportunistic third-party engagements.
* Defensive positioning.
* Endgame survival.

Distinguish strategies that increase the practice leaderboard score from those likely to generalize to the final free-for-all.
Where tradeoffs are uncertain, design experiments.

## 15. DEADLINE AND EXPERIMENT PRIORITIZATION

The deadline is November 22, 2026, at 11:00 AM Eastern.
Time is a hard constraint.
Grokbot must prioritize improvements based on:
Expected placement improvement × evidence confidence ÷ implementation time and regression risk.
This is a ranking heuristic, not a substitute for test results.
Avoid:

* Low-impact cosmetic changes.
* Unnecessary refactors.
* Repeated general research.
* Large speculative rewrites.
* Excessive review cycles.
* Complicated features that cannot be adequately tested.
* Improvements that risk destabilizing the final candidate shortly before the cutoff.

Reserve sufficient time for final testing, public repository verification, Docker conformance, and competition submission.
Do not consume the entire remaining development window on experimentation.
Respect the official four-submissions-per-hour limit and any other current limits.

## 16. REQUIRED DELIVERABLES

Grokbot must coordinate creation or updating of the following documents, adapting file locations to our existing repository.

A. SYSTEM_AUDIT.md
A complete technical and architectural analysis of the current bot.
B. SCORE_PLATEAU_ANALYSIS.md
Verified and suspected explanations for the performance ceiling, ranked by expected impact.
C. STRATEGY_GAP_ANALYSIS.md
Comparison between the current implementation and the proposed championship optimization framework.
D. OPTIMIZATION_BACKLOG.md
Ranked improvements, owners, acceptance criteria, and projected costs.
E. EXPERIMENT_LEDGER.md
Results of all controlled experiments, including negative or inconclusive results.
F. CHAMPION_STATUS.md
The best verified version, exact commit, validation evidence, and rollback instructions.
G. AGENT_COORDINATION.md
Agent ownership, active work, interface contracts, handoffs, and integration requirements.
H. FINAL_READINESS.md
Official compliance, reproducible build, test results, submission status, and outstanding risks.

Do not duplicate documentation already maintained by the existing project. Update authoritative files wherever possible.
Keep findings concise enough for rapid agent handoffs, while preserving evidence and technical details needed for implementation.

## 17. STRICT HONESTY AND QUALITY REQUIREMENTS

All participating agents must follow these requirements:

* Never invent test results.
* Never fabricate performance measurements.
* Never claim a change improves placement without supporting evidence.
* Never assume unverified game mechanics.
* Never silently ignore failed tests.
* Never merge an untested critical change.
* Never erase the highest-performing validated version.
* Never conceal uncertainty.
* Never repeat large audits without new justification.
* Never implement a feature solely because it appears sophisticated.
* Never confuse theoretical strength with demonstrated competition performance.

When evidence is insufficient, state what is unknown and identify the most efficient experiment needed to resolve it.

## 18. FIRST RESPONSE REQUIRED FROM GROKBOT

After Claude communicates this directive, Grokbot must produce:

1. Current verified system status
What exists, what is working, and what is known about our latest scoring results.
2. Audit execution plan
Which agent is responsible for each nonoverlapping investigation.
3. Initial architecture map
How our existing code processes observations and produces actions.
4. Top 10 suspected bottlenecks
Ranked by expected placement impact, clearly labeled according to evidence.
5. Strategy-gap table
Which championship strategies are already implemented, missing, partially implemented, or unsuitable.
6. Testing infrastructure assessment
What performance metrics and controlled experiments are currently possible.
7. Highest-priority first experiment
The most promising concrete investigation or fix.
8. Automatic execution assignments
Exact tasks, ownership, branches, expected outputs, and review requirements.
9. Final deadline strategy
How remaining engineering and submission opportunities should be allocated.
10. Required human decisions
Only genuinely necessary approvals or unresolved dependencies.

## FINAL DIRECTIVE

Claude, deliver this instruction to Grokbot through our established coordination system.
Grokbot should immediately initiate the coordinated read-only audit, discover our actual bottlenecks, and then organize targeted, independently verifiable improvements.
Do not rebuild what already works.
Do not add complexity unless it creates measurable value.
Do not optimize isolated systems at the expense of the whole mech.
Do not chase a higher damage statistic if it reduces placement performance.
The ultimate goal is to transform our current mech into the highest-performing, most reliable, strategically intelligent candidate we can produce before the competition deadline.
The desired outcome is not a larger codebase.
It is a streamlined system in which every meaningful decision contributes toward maximizing expected placement.
BEGIN THE COORDINATED SYSTEM AUDIT IMMEDIATELY.
