# Mech Royale: Strategic Adaptation, Survival, and Bot Behavior — Research Report

**Prepared:** November 21, 2026 (ET)  
**Scope:** Independent literature research cross-referenced with `dmclaughlin-bit/mech-bot` on GitHub `main`; **research only**. No source changes, builds, or submissions.  
**Audience:** Grokbot (coordinator), Diego's Claude, Doug's Claude.  
**Evidence codes:** **[R]** documented game rule or current repository behavior; **[E]** externally established research finding in a different domain; **[O]** observed historical or local-simulator result; **[H]** Mech Royale hypothesis, not a verified score improvement.

## 1. Executive judgment

**Principal finding:** The largest plausible strategy shift is from a *fixed first-matching behavior priority* to a **small, risk-constrained, situation-aware policy selector**, while retaining the working weapon, aim, navigation, crossfire, and target-lock modules. The bot should distinguish *arming, intercepting, dueling, escaping, healing, and zone transit* based on equipment, enemies' projected reinforcement, cover/exposure, and the value of avoiding early elimination. This approach is supported conceptually by utility AI, goal-oriented planning, and opponent-modeling research **[E]**, but it has **not been validated as a Mech Royale score gain [H]**. Replacing the entire controller before the deadline is not justified.

**Current verified record (repo, latest logged 8:50 AM ET):** Champion Build 80 `28c3acc`, score **3.79**; contemporaneous top-32 cutoff **5.25** (`coord/log.md:361,377–381`; `coord/RESEARCH.md:16–29`). This cutoff is a historical snapshot, not guaranteed live. Scoring is mean `(16-place)` over 48 practice matches; 15 allied house bots cooperate and do not kill each other (`research/GAME_CONTEXT.md:5–13`, `research/protocol.md:88–94`). Only 1 CPU, 512 MB and 50 ms per action (`research/GAME_CONTEXT.md:12–13`).

**Failure evidence from *local approximation*, not official replays:** B80 simulation: 56/192 died by 40 seconds; 48/192 died gun-only before 45 seconds; 62/96 detailed deaths involved 2+ attackers in the previous 5 seconds; 29/96 obtained laser by 30 seconds. Early laser vs never-laser score gap is **correlation**, confounded by survival and weapon opportunity (`coord/RESEARCH.md:284–325`). The simulator itself correlates poorly with official score (r=0.22 over 28 builds) and significantly exaggerates gun-hit performance (`coord/RESEARCH.md:249–280`). We cannot derive exact *official* death mechanisms from these data.

## 2. Why the current bot plateaus: architectural interpretation

**[R] The bot uses a long prioritized if/else movement chain:** outside zone → next-zone travel → engaged fight → hurt retreat/cover → cube claim → weapon rush → 2+ LOS crossfire → heal → loot/farm → hide (`brain.ts:677–758`). Engagement selection is mainly thresholded against 1 visible shooter (`brain.ts:562–615`); `ourDps`/`enemyDps` use mean weapon potential, not explicitly the next shot's readiness (`brain.ts:286–312`). Target lock already adds hysteresis (`target.ts:78–115`). Ground-only pathfinder plans geometric routes; `travel()` can fall back to direct destination on failed path (`brain.ts:315–333`, `nav.ts:378–410`).

**[H] Why these reasonable rules can jointly be bad:** The highest-priority *currently eligible* action may be unsafe in five seconds. An early winning 1v1 can become a losing 2v1; a short laser pickup can be denied by a marginal finish trigger; a geometrically short route can keep the bot visible throughout. In the reverse direction, excessive global cautiousness can prevent timely acquisition of a laser. This is not proof the current priorities are wrong—it identifies testable cross-system interactions.

**[O] Previous negative evidence:** Generic strafe Build 27 (3.38 vs 3.50), wider emergency cover Build 82 (3.46 vs 3.79), overly broad special acquisition Build 76 (3.25 vs 3.67), early no-finish Build 98 (3.63 vs 3.79), laser precharge Build 32 (3.48 vs 3.54), slot swapping B66/B68/B90 all failed to beat their reference champions (`coord/RESEARCH.md:166–244`). Do **not** recycle these experiments under new terminology.

## 3. External research library — what transfers, what doesn't

| Research family | Representative evidence | Transferable mechanism | Important limitation |
|---|---|---|---|
| Utility-based behavior selection | Dill, *Dual-Utility Reasoning* (Game AI Pro 2); Mark & Dill, GDC utility talk [1–2] | Compare candidate behaviors with graded state-dependent scores rather than a brittle Boolean priority ladder | Utility values must be calibrated; inappropriate weights cause oscillation or suicidal trade-offs |
| Planning / GOAP | Orkin, *Agent Architecture Considerations for Real-Time Planning in Games* (AIIDE 2005) [3] | Reusable action goals; explicit preconditions, interruptions, and plans that survive changing observations | Full online planning requires costly search and caching; not justified within 50 ms unless bounded |
| Hybrid behavior selection | *Game AI Pro* architecture/behavior chapters; GOBT (2023) [4–5] | Keep deterministic safety guards, use small scored choices where priorities conflict | Need verify behavior-selection changes rather than refactor for elegance |
| Tactical influence maps | Millington, *AI for Games*, tactical AI chapter; Hagelbäck & Johansson (AIIDE 2009); CoG 2020 sneak-attack pathfinding [6–8] | Score positions/paths by shooter coverage and exposure time, not only geometric distance | Opponent predictions are uncertain; influence fields may encourage needless detours |
| Pursuit–evasion under uncertainty | Shah & Schwager (2019); Moreno-Martinez et al. review (2026); multi-pursuer assignment studies [9–11] | Estimate available escape corridors and likely hunter convergence; preempt enclosure | These papers often control the *pursuers*, not a single armed evader; game transfer is indirect |
| Opponent modeling and online adaptation | Spronck et al., case-based adaptive game AI; hybrid FPS adaptation research [12–13] | Track recent observed pursuit speed, aim, weapon, LOS and attack timing; switch policies under bounded confidence | Practice enemies share vision and their AI is partly unobserved; do not infer hidden state as fact |
| Adaptive policy switching | Constraint-Adaptive Policy Switching (2025) [14] | Select from *pretested* controllers subject to safety constraints rather than invent new behavior every tick | Offline safe-RL benchmark, not proof in this game; don't deploy a learned model without data |
| Model-based lookahead / search | Surrogate-assisted MCTS for real-time games (2024) [15] | Short-horizon candidate evaluation can anticipate incoming damage and weapon acquisition trade-offs | Heavy computation, uncertain opponent dynamics and 50-ms CPU cap make broad tree search poor near-term choice |
| Population-based robustness | Jaderberg et al., Quake III CTF, *Science* 2019; multi-agent hide-and-seek [16–17] | Train/test against diverse opponent policies to prevent exploitation of a single scripted squad | Requires many accurate games and hardware; not feasible to reproduce before imminent lock |
| FPS bot reinforcement learning survey | 2023 systematic review [18] | Use imitative/adaptive behavior as longer-term research; modular policy learning | Existing bot has strong rules and inadequate official trajectory data for full RL |
| Incremental navigation | Koenig & Likhachev, D* Lite [19] | Efficient replanning when environmental constraints change | Static arena and existing A* mean tactical cost selection is likely higher value than replacing planner |

## 4. Behavioral strategy candidates (ranked for practical evaluation)

### S1. **Context-sensitive objective choice, without a full rewrite** — **EVALUATE FIRST [H]**
**Research rationale [E]:** Utility theory handles nuanced trade-offs better than Boolean gates [1–2]. GOAP encourages explicit goal preconditions [3]. **Current code [R]:** Priority ladder in `brain.ts:677–758`; weapon rush gated by engage, recent hit, claim, and health (`brain.ts:633–670`).

**Policy:** Keep **hard constraints** (do not enter lethal zone; do not walk into known impossible routes; do not knowingly commit into unbounded 2+ shooters). Among **eligible** actions, compare 3–5 behaviors: `arm`, `fight`, `retreat`, `resource`, `zone`. Example *research-only scoring concept*: tactical value = expected survival/placement gain + weapon progress + eliminability – exposure risk – time/zone cost – goal-switch penalty. Numerical weights require empirical calibration; do not invent them. **Hysteresis:** commit to current goal for a bounded period unless threat or zone overrides; existing `target.ts` lock pattern can be reused.

**One-change experiment:** In `brain.ts`, replace **only** the `claimGoal` vs `rushMove` tie-break with a locally computed risk-aware selector; leave all other modes identical. First run a *shadow* score calculation that logs disagreements but does not affect actions, then a separately gated candidate. **Success screen:** meaningful change to previously losing early-gun-only states; no substantial simulated increase in <40s deaths, LOS exposure, or path failures; official score > current champion to keep. **Risk:** an apparently sound utility function may oscillate or silently override successful Build 17/B80 choices. Existing Build 36/B94 priority permutations previously tied/regressed; this must be a demonstrably different *contextual* decision, not unconditional priority swapping.

### S2. **Threat-forecasting: survive the *next* hunter, not just the current one** — **EVALUATE FIRST [H]**
**Research rationale [E]:** Multi-agent pursuit–evasion studies model uncertainty and constrain available escape space [9–11]. **Current [R]:** Build 60 reacts to 2+ LOS (`brain.ts:729–735`); `seenAt()` tests visible shots (`brain.ts:360–399`). In the sim 62/96 deaths follow multiple attackers (`coord/RESEARCH.md:314–318`).

**Policy:** Before committing to a fight/weapon detour, estimate near-term pressure from *observed or remembered* enemies: approach direction, separation, weapons, feasible shots in next ~2–4s, and possible route to cover. Use 3 bands: `solo/low`, `reinforcement likely`, `crossfire now`. Escalate the cost of an exposed fight *before* two shooters have a present LOS; ignore unseen invented house positions. **One-change experiment:** add a forward-risk warning to **engagement viability only**, not navigation or cover simultaneously. **Success:** fewer first engagements followed by a second shooter within 5 seconds, without an excessive fall in kills or laser acquisition. **Risk:** becoming too defensive; past B82/B100 late cover and B98 early avoidance failed. Avoid merely activating the old cover routine earlier.

### S3. **Exposure-budgeted routes** — **TEST LATER after validating route exposure [H]**
**Research rationale [E]:** Influence maps and tactical A* can prefer protected paths despite added distance [6–8]. **Current [R]:** `nav.ts` is ground-only geometric navigation; loot and weapon goals have time bounds (`brain.ts:633–666`, `nav.ts:378–410`).

**Policy:** Calculate a cheap approximate **risk cost per candidate existing route** from known enemy fields of fire: visible seconds, weapon reach, rear orientation, reachable cover, and zone slack. Prefer lower expected **cumulative damage**, not simply nearer pickups; avoid making exposure zero a requirement. Use coarse waypoint sampling, max 2–3 routes, and stop early to respect CPU cap. **One-change experiment:** change route selection for early **laser acquisition only**, not all A*. **Success:** less incoming damage during acquisition, similar or better weapon-by-30s and path success. **Risk:** longer trips, delayed laser, stuck routes, unknown hunters; existing nav inflation/nearest-fallback changes lost. Test on high-risk targeted seeds first.

### S4. **Two-horizon combat selection (immediate burst vs. sustained DPS)** — **TEST LATER, diagnostic first [H]**
**Research rationale [E]:** Utility and planning depend on realistic action feasibility [1–3]. **Current [R]:** `race()` uses time-to-kill/time-to-death from mean weapon DPS (`brain.ts:573–601`); `self.weapons` exposes cooldown, reload and charge (`research/protocol.md:182–186`).

**Policy:** Estimate achievable damage in next ~1.5s plus continuation over the next ~4s for gun/laser/lightning, with current charge/cooldown/energy and actual torso yaw. Preserve observed enemy-weapon uncertainty. **First step:** calculate estimates in shadow and count where they reverse a fight decision. **One-change experiment:** apply to `race()` only if it disagrees in many low-scoring early encounters; don't alter aggression/target weights simultaneously. **Risks:** conservative estimates suppress kills; holding laser charge halves walking speed; contested 1v1 TTK is not whole-squad TTD. Previous Build 48 recalibration and B20+22 spacing regressed.

### S5. **Threat-conditioned behavior modes (“operating posture”)** — **TEST LATER [H]**
**Research rationale [E]:** Hybrid goal/utility behavior frameworks retain reactive hard guards while selecting higher-level plans [4–5,14].

**Policy modes:**
- **Acquire:** gun-only, early, credible pickup and enough lead time; minimize time-to-special subject to exposure.
- **Isolate:** one hunter, useful cover, favorable burst; maintain aim and damage concentration, avoid routing toward a second shooter.
- **Disengage:** outnumbered or estimated burst threat exceeds escape reserve; face likely attacker to protect rear, exit towards zone-safe cover.
- **Recover:** safe from fire, preserve 5s regen window, selectively stop firing only where regeneration payoff exceeds missed damage.
- **Zone/late:** favor positioning, health and ongoing placement; never violate zone hard constraints.

**Switching:** Add hysteresis, minimum dwell time (only where safe), explicit emergency interrupts, and logging of **why** state changed. **Risk:** duplicates fixed priority chain; costly, large regression surface. Start as a *shadow-mode classifier* only. Do not replace controller before the lock unless a narrowly isolated switch proves value.

### S6. **Opponent archetype memory and online adaptation** — **TEST LATER [H]**
**Research rationale [E]:** Case-based opponent modeling and FPS hybrid adaptation support small online updates rather than expensive retraining [12–13]. **Current [R]:** `known` stores observed location/velocity/HP/weapons (`brain.ts:402–428`), while protocol gives sounds and charging indicators (`research/protocol.md:365–405`).

**Policy:** Maintain short-lived observations: `pursuer speed`, `approach bearing`, `gun/laser/lightning`, `laser charging`, `time since sound`, `recent hit`, `tendency to re-acquire LOS`. Classify `closing gunner`, `laser sniper`, `lightning rusher`, `unknown`; adapt exposure and range decisions only where observed. Avoid treating sound bearing as exact identity or counting same event twice. **One-change experiment:** respond to observed **laser charging** by altering a single engagement safety assessment, not aim, path and firing together. **Risk:** noisy observations, sample starvation, unseen shared squad, wrong opponent identification; the B88 charge-suppression experiment lost and is not this idea.

### S7. **Placement-aware survival value instead of raw kills/HP** — **TEST LATER [H]**
**Research rationale:** The actual competition is placement-based, not kill-count-based (`research/protocol.md:88–94`; official track page [20]). In practice, house squad non-combat means only own kills and zone deaths advance placement; the value of **avoiding early death** can exceed winning a marginal first duel. **Policy:** approximate value of survival under current alive count, zone phase, available cover, enemy reinforcement and own power; distinguish early practice from FFA final. Do not use the simplistic idea “kills always equal score”—they only generate placement points *if the victim dies before our mech*. **One-change experiment:** apply a placement-risk surcharge to engagement decision **only** before first major encounter; avoid disabling the proven B14 engage rule in all cases. **Risk:** passivity against squad; Build 98 proved blanket avoidance loses. Requires scenario-level evaluation.

### S8. **Small tactical lookahead, not large MCTS** — **DEFER [H]**
**Research rationale [E]:** limited-horizon planning can outperform reactive choices in games, but search costs CPU and model uncertainty [3,15]. **Policy concept:** at most 3–5 pre-approved candidate actions (hold/fire, move to cover, approach special, reposition) evaluated for the next 1–2 seconds via a *very cheap* approximate damage/exposure heuristic; no full local physics rollouts in 50 ms. **Risk:** inaccurate enemy model could make short-term forecasts worse than simple guards; large changes under deadline.

### S9. **Offline policy portfolio, not online neural-net training** — **POST-LOCK [H]**
**Research rationale [E]:** population-based multiagent training improves robustness with diverse opponents in other 3D games [16–18]. **Near-term:** retain current scripted controller, test specialized configurations against diverse opponent ensembles offline and compare *held-out* seeds and historical official outcomes. **Long-term:** choose an offline-trained policy with guardrails only if simulator reliability and trajectory data improve. **Risk:** training on an inaccurate `tools/sim` transfers simulator exploits to official matches.

## 5. Behavioral interactions that should be audited before creating new strategies

1. **The opening conflict:** `engage` / `claim` / hit-recent gates may cancel a beneficial early laser trip (`brain.ts:633–670`); count how often each gate blocks laser by 30s. Do not simply override engage: B36/B94 tested priority changes.
2. **Combat continuation:** A weapon in effective range is not necessarily ready; `race()` ignores some immediate readiness states (`brain.ts:286–312,573–601`). Determine how often this reverses fight outcomes before editing.
3. **Exposure versus path length:** `travel()` falls back to goal when path unavailable (`brain.ts:315–333`) and map routing emphasizes geometric reachability; first quantify stuck/obstructed goals.
4. **Multi-threat prediction:** Existing B60 only handles 2+ current LOS; observed enemies may converge before this, but threat inference must be conservative (`brain.ts:729–735`; `coord/RESEARCH.md:314–325`).
5. **Fighting vs regeneration:** Protocol regen starts after 5s without dealing **or receiving** damage (`research/protocol.md:289–291`), so 'heal' while continuously shooting can fail to regen; B5b retaining fire improved score against its parent, so do not blanket-disable fire. Measure time since dealt/taken hit and the actual opportunity cost.
6. **Information gathering vs aim:** Torso orientation controls both seeing and firing; scan decisions consume real aim time (`research/protocol.md:365–376`). An isolated scout/look policy must account for rear-hit exposure (`:293–295`), not indiscriminately spin.
7. **Opponents modeled as one squad:** Any strategy depending on hiding from one enemy must still account for others sharing sightings; disappearing from one sensor is not a confirmed reset of squad pursuit (`research/GAME_CONTEXT.md:7–9`).

## 6. Proposed research-and-test program for Grok

**Gate 0 — Source truth.** Recheck freshest `main`, `coord/log.md`, official score and cutoff, §9, and previous negative experiments. Do not use historical score 3.79 as though live without verification.

**Gate 1 — Shadow diagnostics, no action change.** Log why each early laser attempt failed, whether next 4 seconds involved a second shooter, first-contact weapon readiness, and candidate route exposure. Record compact counters; measure p99 action time. No official submission merely to add diagnostics unless necessary.

**Gate 2 — One hypothesis per build:**
- **First:** risk-aware comparison of two competing early objectives when a real laser opportunity exists, retaining B17/B60/B80 and all zone hard constraints.
- **Second:** threat-forecast surcharge in early engagement decision (not a blanket stronger retreat).
- **Third:** route exposure choice for one acquisition path if telemetry proves avoidable exposure.

**Gate 3 — Evaluate on paired independent local seeds and opponent variations.** Include laser-by-30s, died<40s, kill/placement distribution, first-hit direction, multi-attacker engagements, loss of LOS, stuck minutes, misses >50ms. The current local simulator's mean has only r=0.22 with official scores across 28 builds (`coord/RESEARCH.md:249–280`); local simulation is mainly a regression/behavioral screen, not a trustworthy ranking oracle. Validate mechanistic effects with available public recordings but **do not conflate public FFA with official house squad**.

**Gate 4 — Official promotion is coordinator-controlled.** One isolated behavioral mechanism per submission, check.py PASS, store base SHA and rollback flag, keep only if official score strictly beats current verified champion; no unauthorized code or submissions. Lock Sun Nov 22 at 9:00 AM ET; budget remaining must drive scope (`AI-Structure-Development.md` header and `coord/GROK_BRIEF.md`).

**Estimated impact:** No research source gives a defensible expected Mech Royale score gain. Given the remaining 1.46-point gap to historical cutoff, small improvements alone may be insufficient. These directions increase *information value* and open new mechanisms, but **0 or negative gain is possible**. Do not attach fabricated +0.5–1.0 predictions.

## 7. Decision matrix

| Candidate | Novelty vs tested builds | Near-term feasibility | Most important failure mode | Verdict |
|---|---|---|---|---|
| S1 Risk-constrained objective tie-break | Medium, if truly contextual | High | Recreates failed priority swaps | **Research/test first** |
| S2 Forecast second shooter | High if predictive not reactive | Medium | Excessive passivity | **Research/test first** |
| S3 Exposure-aware pickup route | High vs pure geometric A* | Medium | Longer, losing laser trips | **Test after data** |
| S4 Two-horizon fight readiness | Medium | Medium | TTK model still wrong | **Shadow first** |
| S5 Full behavioral mode controller | Medium | Low before deadline | Refactor/regressions | **Defer architecture change** |
| S6 Small opponent-type memory | High | Medium | Noisy hidden information | **Test later** |
| S7 Placement-aware risk | Medium | Medium | Underfighting in practice | **Test later** |
| S8 Bounded lookahead | Medium | Low | False precision and CPU | **Defer** |
| S9 Multiagent RL/portfolio | High | Very low | Simulator overfit | **Post-lock** |

## 8. Annotated source library (external)

1. Kevin Dill, **Dual-Utility Reasoning**, *Game AI Pro 2* (2015). Graded choice among actions vs yes/no gating. https://www.oreilly.com/library/view/game-ai-pro/9781482254792/K23980_C003.xhtml
2. Kevin Dill and Dave Mark, **Improving AI Decision Modeling Through Utility Theory**, GDC. Utility curves and nuanced behavior. https://www.gdcvault.com/play/1012747/contactUs
3. Jeff Orkin, **Agent Architecture Considerations for Real-Time Planning in Games**, AIIDE 2005. GOAP for FPS NPCs; planning costs and caching. https://ojs.aaai.org/index.php/AIIDE/article/view/18724
4. **Game AI Pro**, architecture and behavior-selection chapters (multiple authors). https://www.gameaipro.com/
5. **GOBT: A Synergistic Approach to Game AI Using Goal-Oriented and Utility-Based Planning in Behavior Trees**, 2023. Hybrid planning/controller. https://www.jmis.org/archive/view_article?pid=jmis-10-4-321
6. Ian Millington, **AI for Games**, 3rd ed., chapter 6 (tactical positions, influence maps, tactical A*). https://www.oreilly.com/library/view/ai-for-games/9781351053280/xhtml/16_Chapter06.xhtml
7. Johan Hagelbäck & Stefan J. Johansson, **A Multi-Agent Potential Field-based Bot for a Full RTS Game Scenario**, AIIDE 2009. Competitive field-based navigation. https://ojs.aaai.org/index.php/AIIDE/article/view/12365
8. **Combining Influence Maps with Heuristic Search for Executing Sneak-Attacks in RTS Games**, IEEE CoG 2020. Example of threat-weighted routes. https://ieee-cog.org/2020/papers/paper_282.pdf
9. Kunal Shah & Mac Schwager, **Multi-Agent Cooperative Pursuit-Evasion Strategies Under Uncertainty**, 2019. Capture pressure under uncertain evader localization. https://msl.stanford.edu/papers/correll_multi-agent_2019.pdf
10. Alejandro Moreno-Martinez et al., **Pursuit–Evasion Strategies in Multi-Agent Robotic Systems**, *Robotics* 2026 review. Predictive/reactive and adversarial/probabilistic methods. https://www.mdpi.com/2218-6581/15/8/155
11. **Pursuer Assignment and Control Strategies in Multi-Agent Pursuit-Evasion Under Uncertainties**, *Frontiers in Robotics and AI*, 2021. Multi-pursuer coordination under noisy observations. https://pmc.ncbi.nlm.nih.gov/articles/PMC8415911/
12. Pieter Spronck et al., **Opponent modelling for case-based adaptive game AI**, *Entertainment Computing* 2009. Online adaptation without resource-heavy training. https://www.sciencedirect.com/science/article/pii/S1875952109000044
13. **A Hybrid Fuzzy ANN System for Agent Adaptation in a First Person Shooter**, 2008. Small adaptive weapon selection atop rule-based agent. https://onlinelibrary.wiley.com/doi/10.1155/2008/432365
14. **Constraint-Adaptive Policy Switching for Offline Safe Reinforcement Learning**, 2025. Select policies subject to constraints; conceptual transfer only. https://experts.umn.edu/en/publications/constraint-adaptive-policy-switching-for-offline-safe-reinforceme/
15. **Surrogate-assisted Monte Carlo Tree Search for real-time video games**, *Engineering Applications of Artificial Intelligence* 2024. Search with computational considerations. https://www.sciencedirect.com/science/article/pii/S0952197624003105
16. Max Jaderberg et al., **Human-level performance in 3D multiplayer games with population-based reinforcement learning**, *Science* 2019. Quake III CTF population learning. https://pubmed.ncbi.nlm.nih.gov/31147514/
17. Bowen Baker et al., **Emergent Tool Use from Multi-Agent Autocurricula**, ICLR 2020. Emergent multi-agent strategy over many training games. https://mlanthology.org/iclr/2020/baker2020iclr-emergent/
18. **Reinforcement Learning Applied to AI Bots in First-Person Shooters: A Systematic Review**, *Algorithms* 2023. Scope and limits of FPS bot RL. https://www.mdpi.com/1999-4893/16/7/323
19. Sven Koenig & Maxim Likhachev, **D* Lite**, AAAI 2002. Incremental replanning. https://ocs.aaai.org/Library/AAAI/2002/aaai02-072.php
20. Builders, **Mech Royale track rules**. Official scoring, runtime and game setup. https://www.joinbuilders.org/buildathon/tracks/builders

## 9. Bottom line

**Behavior matters more than feature count.** The plausible strategic breakthrough is an agent that is aggressive only when well-armed and locally advantaged, gets armed early when expected payoff exceeds exposure, predicts the onset of multi-hunter pressure rather than reacting afterward, chooses routes by survivability, and keeps track of why its goals change. The practical path is *one constrained behavior-decision change at a time* with baseline fidelity and independent validation—not a rushed neural network or complete rewrite.
