# GROKBOT HANDOFF: Mech Royale Survival AI Implementation + Continuous Improvement

**Project:** `dmclaughlin-bit/mech-bot`  
**Audience:** Grok coordinator; Diego's Claude; Doug's Claude; Codex reviewers  
**Purpose:** Implement and evaluate survival improvements without disrupting the working bot or the repository's established coordination rules.  
**Competition clock:** Follow the live official deadlines and repository lock rules; do not silently extend them.

> **Coordinator instruction:** Treat this document as a *proposal/experiment backlog*, not permission to override the repository's `AI-Structure-Development.md`. Read `AI-Structure-Development.md`, `coord/GROK_BRIEF.md`, `coord/log.md`, `coord/learnings.md`, `EXPERIMENTS.md`, `research/protocol.md`, `brain.ts`, `map.ts`, `nav.ts`, and `params.ts` first. Where this file conflicts with current project policy, explicitly record the conflict and propose a minimal PR updating the single source of truth only after owner approval. Never launch a full rewrite or merge untested strategy changes.

## A. Mission and measurable objective

Optimize **average placement points** (`16 - final placement`) in the Builders Mech Royale rules, not kills, damage, or flashy behavior. Practice bots are a coordinated, vision-sharing squad, while the final uses independently competing entrants. Avoid creating a practice-only exploit that harms free-for-all generalization.

Known historical baseline (verify newest before acting): Build 5b scored **2.38**, versus original sample bot **1.15**. Earlier leaderboard cutoff was approximately **4.17**, which is *stale and not a current qualification guarantee*. Target scores such as 4.0 / 4.2 / 5.0 are goals or subjective forecasts—not measured expected scores. A good result is the highest verified score with correct and reliable execution.

**Constraint:** Runtime uses the `mechfight/1` JSON-lines protocol, Bun/TypeScript, no runtime network, approximately 50 ms per decision, 1 CPU, 512 MB. Values such as health, movement, vision, cooldowns, projectile physics and zone behavior must be read from the live `hello.config` and current observations whenever available. No unsupported fixed game constants.

## B. Non-negotiable workflow and role ownership

1. Grok **coordinates**; Grok does not directly implement bot files. It prioritizes and assigns bounded tasks, examines reports, flags conflicts and recommends KEEP / REVERT / INCONCLUSIVE.
2. Respect existing file ownership in `AI-Structure-Development.md`. Doug's Claude handles `brain.ts`, `map.ts`, `params.ts`, `bot.ts`, Docker; Diego's Claude handles `nav.ts`, `tools/`, `EXPERIMENTS.md` and coordination documentation. Any cross-file integration is agreed in an issue/PR before simultaneous edits.
3. Existing `nav.ts` is an A* grid navigator; existing `map.ts` is a terrain and prism LOS implementation. **Audit and extend these modules; do not rebuild the project.** Protect the best demonstrated commit and maintain an easy rollback.
4. Every push must append a status entry to `coord/log.md`. Every official practice submission gets an `EXPERIMENTS.md` row with commit, parent, params, score, hypothesis, time and verdict. Record new actionable knowledge in `coord/learnings.md`.
5. A single submission tests a single *strategic hypothesis*, whenever feasible. Keep performance-changing patches isolated from unrelated cleanup. No needless PR reviews, full rewrites, redundant cross-checking, or new heavy dependencies.
6. No hard-coded improvement is deemed proven because external research supports the algorithm. It must improve measurable performance on this particular game.
7. Use applicable existing project skills only when useful (Supabase is irrelevant here; GitHub/PR review, regression testing, or performance profiling skills may be useful). Report missing tools and permissions. Do not invent match replays, simulator results, or game telemetry.
8. Protect final submission cutoff and the repository's earlier internal lock time. Work backward from the clock; stop adding large features when too little validation time remains.

## C. Architecture — minimal additive implementation

Retain a deterministic, lightweight hierarchical agent:

```
observation -> memory/threat model -> emergency safety overrides
                                  -> state selection: ZONE_ESCAPE | EVADE | RETREAT | HEAL |
                                      ENGAGE | LOOT | REPOSITION | HOLD | ENDGAME
                                  -> position/route scoring and local action selection
                                  -> aim/fire/resource controller -> safe legal BotAction
```

Hard emergencies (imminent projectile / lethal zone / unavoidable collision) supersede lower-priority goals. Otherwise compare expected *placement survival value*, not only proximity or DPS. Add hysteresis/minimum commitment and emergency interrupts so states do not oscillate every tick. Add caching and strict computation budgets. Log **which policy fired and why** in local diagnostics; keep stdout protocol-only and limit stderr cost.

## D. Candidate strategy modules (all require validation)

### D1. Geometry and collision correctness — FIRST

- Audit terrain `terrain.i16`, `world.json` prism geometry, bridge clearance, holes, overlapping vertical solids, walkable surfaces, mech radius and growth due to cubes. In existing `map.ts`, a cell may represent overlapping prisms as one base-to-top interval; check whether this incorrectly seals walkable underpasses and produces false LOS blocks.
- In `nav.ts`, verify inflation radius relative to actual mech collision width and cube-size growth. A 2 m inflation may under-approximate a nominal 2.5 m collision radius; check intended rules rather than assuming values. Test narrow alleys, rooftops, bridge decks, slopes, ledges, and inaccessible endpoints.
- Confirm that path smoothing does not cut corners or create unsafe moves despite clear grid cells, including 3D clearance.
- Add deterministic nav unit scenarios and benchmark initial-grid construction, memory use, per-tick latency, path validity, collision frequency and stuck behavior. A safe path failure should return a legitimate recoverable action, never blindly charge through solid geometry.
- Avoid attempting a full multilayer navmesh unless evidence shows that cheaper fixes are inadequate and enough time remains.

### D2. Risk-weighted global navigation

- Preserve A* and its existing signature when possible. Score a route with a weighted combination of travel time, zone damage risk, enemy LOS exposure, predicted attack damage, collision risk, energy/jet expenditure, proximity to chokepoints, and escape-route availability.
- Enemy risk uses fresh tracks, speed, weapon/range, facing/aim, estimated line of sight and number of simultaneous shooters. Decay or expand uncertainty for old sightings. Incorporate sound-based threat hints without claiming precise enemy coordinates.
- Generate a small set of reachable candidate goals (cover, next-zone ingress, alternate corridors). Compare risk-weighted routes. Cache expensive static geometry and replan only upon threat/goal shift, stuck state or time budget availability.
- Zone ETA must use navigable distance and effective speed, including ascent/obstacle penalties and a conservative timing margin. Evaluate future zone and actual safe-area arrival, not automatic straight-line travel to the center.

### D3. Local movement and dodge

- Sample a bounded number of walk/boost directions over a short horizon (~1–2 s to start), respecting acceleration, obstacles, incoming projectiles, torso orientation, jump/jet energy and next waypoint.
- Reject predicted collisions and lethal damage before comparing efficiency. Against mortar shells, predict impact and splash radius; against charging lasers, evaluate time to clear hard cover. Avoid deterministic back-and-forth oscillation; random tie-breaks must be seeded/reproducible.
- Maintain movement independent from torso facing. During retreat, orient toward dominant incoming threat when this reduces rear-hit damage without making the escape path worse.
- Keep emergency movement computationally cheap and higher-priority than loot or target pursuit.

### D4. Cover scoring and regenerative disengagement

- Rank *reachable* cover spots, rather than picking the first nearby coordinate: blocked LOS against multiple threats, future zone safety, escape exits, path exposure, roof/height clearance, nearby enemies, and ability to hold without footsteps.
- Read actual vision configuration: near-range 360-degree detection and forward FOV beyond it; evaluate torso aim rather than travel direction. Trees can conceal vision but do not necessarily stop shots: distinguish concealment from hard cover.
- When health is low and escape is viable, break sight, stop shooting and taking damage for the configured regen delay, then remain concealed until a configurable health threshold or emergency requires moving. Avoid resetting healing by opportunistically firing.
- **Existing evidence caveat:** earlier experiment showed that a healing fire-gate variant scored worse. Do not assume silent healing improves official score. Compare per-encounter benefit and nearby enemy pressure. An emergency defense interrupt must permit fire when not firing means death.
- Verify what signals the official observation actually includes. Avoid assuming omniscience or perfect multi-enemy tracking.

### D5. Combat decision policy

- Compute rough `T_kill = enemy_effective_HP / expected_hit_adjusted_DPS` and `T_die = our_effective_HP / estimated_total_incoming_DPS`, with confidence/uncertainty penalties. Include weapon counters, enemy aim, distance, charge/reload status, movement exposure and additional visible or recently heard enemies.
- Initiate combat only if expected survival/placement benefit exceeds retreating. Prefer isolated weak opponents or unavoidable self-defense. End engagement if second shooter appears, expected safety collapses, zone timing becomes urgent or target pursuit crosses unsafe ground.
- Avoid hard-coding `T_kill < T_die` as guaranteed survivability; calibrate conservative safety margins. Include pursuit abort duration and state hysteresis.
- Implement aim validation for gun projectile intercept, laser charge and hitscan release, lightning cone/range/energy, mortar ballistic arc/splash if relevant. Reject shots through hard geometry and low-probability long-range shots that only reveal position. Add accuracy telemetry if match replay/simulator permits.
- The starting gun, laser, mortar and lightning have distinct roles and counters. Existing plan currently rejects mortar: treat any mortar inclusion as a **separate experimental proposal**, not an unapproved modification to existing policy.

### D6. Zone timing and positioning

- Compute departure from remaining shrink time vs path ETA and risk. Plan next-zone ingress with safe routes and multiple exits. Avoid blindly hugging center or edge; test competing position policies on identical scenarios.
- Penalize remaining outside zone based on configured phase damage and predicted traversal time. Late phases use stronger safety penalties. Never assume all crossings are forbidden if the only survivable route briefly crosses the boundary; choose the least expected damage consistent with policy.
- Consider remaining HP in time-expiration tie-breaks if official rules specify that. Stay alive first.

### D7. Loot, upgrades, drops and cubes

- Evaluate pickup or objective as `future survival value - detour time - expected HP exposure - zone risk - energy and weapon-swap vulnerability`.
- Test contextual weapon loadouts against fixed laser+lightning preference; do not replace the baseline loadout globally without controlled evidence.
- Treat crates, drones, supply drops and cubes distinctly. A safe supply drop may deliver a powerful heal and cubes but contested capture can stall. Avoid tunnel-vision looting or fighting for objectives while weak.
- Account for cube stat benefits, size growth, collision/navigation consequences and caps. Use upgrades based on *current* needs, not only fixed hierarchy; keep the existing hierarchy as control.

### D8. Final-round generalization

- Practice opposition coordinates, while final entrants are independent. Define local enemy archetypes: chaser, camper, sniper, objective-rusher, close-range lightning, mortar user, opportunistic third-party, and mixed target policy. Only include behaviors implementable under the supplied game interface.
- Compare performance on same seeded environments and *held-out* seeds/mixed opponents. Do not let official repeated fixed-seed scores become the only test objective.
- If no supported match simulator or replay exists, flag any generated agent-vs-agent estimates as **simulated conjecture**, not official data.

## E. Continuous learning / post-result diagnosis protocol

**Core idea: the leaderboard score is the dependent variable, not a diagnosis.**

### E1. Collect evidence

After each official submission, obtain score, commit, parent and difference, plus any official per-match results/replays if actually exposed by the platform. If only aggregate scores exist, state **NO PER-MATCH OFFICIAL DATA** and use instrumented local scenarios separately. Never infer a death cause from a single aggregate number.

Instrument local scenarios with:
- final placement, survival duration, HP curve, deaths and source/type of final damage;
- time outside zone, zone HP loss, time/attempts in stuck state, failed route queries;
- enemy count and line-of-sight exposures at damage and death, rear-hit proportion;
- time spent in retreat, hide, regen, engage, loot, zone travel, and oscillation count;
- damage dealt/taken by weapon, shot attempts and hit proxies if visible;
- energy use, pickups/upgrade timing, cubes, weapon loadout;
- action computation p50/p95/p99/max, timeout count and memory high-water;
- map/seed/scenario ID, exact commit hash, config digest and bot policy knobs.

Keep logs compact and reproducible; a structured event can record `t, state, trigger, hp, energy, position, next waypoint, n_visible, n_recent, zone_eta, policy_score, action` when state changes or damage occurs, rather than logging every tick. Runtime diagnostics should never delay live actions.

### E2. Categorize causes of failure (do not overstate certainty)

- **NAV_COLLISION:** navigation commanded movement into or too close to geometry.
- **NAV_STUCK:** repeated command with negligible progress; failed recovery.
- **NAV_BAD_ROUTE:** traversable but overexposed or avoidably indirect route.
- **ZONE_LATE:** reached safe zone too late or accumulated avoidable zone damage.
- **MULTI_ENEMY_TRAP:** escape went into overlapping attack lines.
- **COVER_FAILURE:** hiding spot was reachable but exposed or lacked escape.
- **REGEN_RESET:** agent repeatedly reset healing by attacking or receiving avoidable damage.
- **OVER_AGGRESSION:** voluntary duel had poor expected survival value.
- **UNDER_AGGRESSION:** failed to remove a dangerous threat or capture a clearly favorable opportunity.
- **AIM_WEAPON:** poor hit choice, LOS, wrong range, ineffective matchup or energy usage.
- **RESOURCE_TRAP:** looting/upgrading caused more exposure than benefit.
- **COMPUTE_FAILURE:** timeout, crash, invalid action, stdout pollution, initialization failure.
- **UNKNOWN:** evidence insufficient; request replay/instrumentation instead of guessing.

For each event store a *confidence level* and counterfactual candidate; distinguish direct observables from explanations requiring assumptions.

### E3. Rank improvement opportunities

Define a priority score for candidate fix `i` (for ordering only, not an official game metric):

`Priority_i = estimated placement impact × evidence confidence × recurrence / (implementation effort + testing burden + regression risk)`

Do not hide subjective estimates; report factors separately. Prioritize repeated high-cost deaths, then broad correctness failures, then combat tuning. Choose one highest-leverage experiment at a time.

### E4. Explicit hypotheses, ablation and comparison

Each experiment proposal must include:

```
ID, parent commit, owner, changed files, single hypothesis,
current observed failure, expected causal mechanism,
exact parameter/algorithm change, predicted metric direction,
test cases, budget, failure/rollback condition
```

Test A (unchanged best baseline) and B (candidate) on the *same* available seeds and opponent models. Calculate `delta_placement = mean(score_B - score_A)` and distribution, not just B's score. Record percent of paired improvements, worst-case degradation, early-death fraction and policy-specific diagnostics. Reserve some seeds/opponents as holdout. If enough samples are available, use bootstrap confidence intervals for paired deltas and avoid treating small noisy differences as proof.

Conduct **ablation tests** to establish the mechanism: if a multi-part patch improves, separately disable threat scoring, cover quality and dodge (where feasible) to learn which component mattered. Do not spend official submissions on a full factorial grid while qualification is at risk.

Change one parameter at a time (or a very small predeclared sweep), within budget. Prefer robust plateaus to a narrow peak that may overfit 48 frozen practice matches. Keep all test configurations, seeds and outcomes in durable repository files.

### E5. Promotion rule

**KEEP** if correctness and timing gates pass and score improvement is convincing, or if a mechanism-fixing bug patch is essential and official score impact is not materially harmful. **REVERT** if reliable degradation, new crashes, timing failures or broken collision/navigation behavior. **INCONCLUSIVE** if a small delta is within variability or data are insufficient. For unresolved cases, retest only if time/submission budget justifies it.

The existing project uses an approximate `+1.2` gain or no worse than `−0.6` for mechanism-based promotion; follow its current authoritative policy until owners update it. Do not blindly call every tiny positive result a breakthrough. After final lock, favor the most reliably measured build over theoretical novelty.

### E6. Learning memory (this is how the model improves between iterations)

Write each resolved result in `coord/learnings.md` with:
- hypothesis and commit identifiers;
- evidence, metric deltas and whether test was official, local or simulated;
- observed failure causes and level of confidence;
- what changed, whether it fixed the targeted failure, and what new failure emerged;
- generalizable rule discovered or refuted;
- what would falsify the conclusion;
- exact next experiment.

Grok should read this file before suggesting new work, so failed experiments are not repeated and opposing evidence is reconciled. This is **external empirical learning**, not online training of model weights. Do not add RL, neural training or self-play infrastructure unless approved and realistic under the deadline.

## F. Suggested immediate sequence (subject to clock and current queue)

1. **Sync repository** and official team status; identify latest best validated commit, open PRs, assignments and remaining official attempts. Do not use the old 2.38 as live truth.
2. **P0:** short geometry/navigation correctness audit and local failure-case harness; collect evidence on stuck, false LOS and collisions. Execute a minimal single-root-cause fix if found.
3. **P1:** one targeted threat-weighted retreat/route comparison with baseline, using cases with multiple enemies.
4. **P2:** test healing mode and appropriate fire suppression only after cover selection works. Measure uninterrupted regen and survival trade-offs.
5. **P3:** test combat entry/exit based on estimated TTK and TTD, with stable state hysteresis, while preserving emergency defense.
6. **P4:** evaluate objective/weapon policy only when navigation/retreat are stable; final time goes to robustness and final entry selection.

If the deadline is close, pick **the single best-supported fix** from existing evidence, run conformance and latency tests, submit if permitted, then freeze. Do not attempt the entire backlog at once.

## G. Verification gates (all required where available)

- Official kit conformance: `python3 check/check.py --map-dir arena -- bun ../mech-bot/bot.ts` adjusted to correct actual paths; verify stdout contains protocol-only JSON lines.
- Full local Docker runtime test against CPU, memory, filesystem and no-network rules; check initialization, crash fallback and deadlines. Target p99 <= 15 ms locally with hard safe cutoff before 50 ms; profile spikes.
- Navigation regression tests for solid buildings, bridges/underpasses, terrain, narrow alleys, stuck recovery and off-map positions.
- Combat and survival tests for laser charge/release, mortality under multiple shooters, rear-facing retreat, regen timer, zone crossing and contested supply drops.
- Paired seed/arena tests when an authentic game simulator is available; label locally approximated results separately.
- One change per PR; documented review for correctness and accidental regressions; owner approves merge. Preserve previous best candidate and final selection mechanism.

## H. Grok response template after each experiment

```
## State of competition
Current time ET; cutoff and lock; best verified commit; score; rank / current 32nd cutoff if visible.

## What changed
PR; parent -> candidate; exact behavior and files; which experiment hypothesis.

## What the evidence says
Official score before/after; local paired metrics and sample count; p99; uncertainty.

## Why it likely changed
Top 1–3 observed failure classes; explicit supporting events; competing explanations.

## Verdict
KEEP / REVERT / INCONCLUSIVE and why; rollback commit if applicable.

## One next experiment
Owner; files; narrowly scoped change; predicted impact labeled hypothesis; tests; stop condition.

## Next prompts
Full copy/paste prompts for Doug's Claude and Diego's Claude, honoring file ownership and plan.

## Repo records
Exact entries for coord/log.md, EXPERIMENTS.md, coord/learnings.md, and coord/next-*.md.
```

**Final directive:** Your role is to create a *closed-loop research engineer*, not a large speculative code generator. Produce evidence before changing strategy, preserve successful behavior, isolate failures, eliminate redundant work, and optimize verified mean placement under the clock and runtime constraints.
