# Academic AI/RL review for Mech Royale (Research Agent 3)

## Bottom line (blunt)
Every learned-agent success below needed a fast simulator and millions to billions of steps. We have neither. Our only real evaluation channel is 4 submissions/hour × 48 matches, so roughly 100–150 noisy evaluations in the whole event. Placement scores run from 0 to 15, and their per-match standard deviation is plausibly 3–5. That puts the standard error of a 48-match mean at about 0.5–0.7. **One submission can only tell apart variants that differ by ~1.5 points or more.** No RL method can learn from that signal. So the answer is a **hand-built utility/behavior-tree bot with analytic aim and dodge**, plus **light black-box tuning of a few weights using submissions**. Learned components are worth considering only where an exact, cheap sub-simulator exists (projectile and kinematic math taken straight from the config).

The evidence that scripted bots win when there is little time and no simulator:
- Lux AI S2: rule-based agents won, and the best deep-RL agent placed 4th [AC-09].
- Halite IV: a "100% rule-based bot" placed 4th, and its authors dropped evolutionary tuning late on because it overfit [AC-10].
- NeurIPS 2022 Neural MMO: scripted policies were "quick to build and effective early" but fell off compared with RL "by the end" of a months-long competition [AC-06]. We do not have months.
- MARL-BattleGrounds (5v5 arena): scripted opponents beat every RL baseline at 40M steps. Recurrent IPPO needed **250M steps** at ~50k steps/s on a GPU before it dominated them [AC-14].

## What the landmark systems actually needed
| System | Method | Scale | Lesson for us |
|---|---|---|---|
| OpenAI Five [AC-01] | PPO, LSTM, self-play, shaped reward (deaths, resources, zero-sum symmetrised), more than 20 "surgeries" | ~10 months, up to 1,536 GPUs, ~2.95M-step batches, 820 PFlop/s-days | Reward-shaping ideas carry over; the scale does not. |
| AlphaStar [AC-02] | Supervised learning on human replays first, then a league of main agents plus exploiters | Huge TPU budget. The imitation policy alone beat 84% of players | Self-play forgets; imitation needs demonstrations we lack. |
| CTF / FTW [AC-03] | PBT over 30 agents, which also evolved the *internal reward weights*; two-timescale RNN | 450K games, 1,920 arenas | **Reusable: evolve utility weights.** Do a tiny version over submissions. |
| GT Sophy [AC-04] | QR-SAC (distributional), progress reward plus speed-scaled penalties | ~10 PS4s × 20 cars, 9–11 days to superhuman | Reward loopholes (corner-cutting); days of samples even for driving. |
| Hide-and-Seek [AC-05] | PPO self-play autocurricula | Batches below 32k never reached the later stages; "large scale training was critical" | Emergent strategy is compute-hungry. |
| ViZDoom 2016–17 [AC-08] | F1: A3C plus curriculum. IntelAct: Direct Future Prediction. Arnold: DQN navigation + DRQN aim + enemy-detector switch. Marvin: imitation from humans, then RL | GPU training against built-in bots | **Every winner hard-coded parts**; bots weak at "strategy, navigation, exploration, dodging, memory". |
| CodinGame Winter 2024 winner [AC-11] | ~98k-parameter ResNet trained with PPO plus depth-2–3 search | 512 parallel games of the **official referee simulator** | Small net + PPO wins **when an exact simulator is supplied**. |
| NeurIPS 2023 NMMO [AC-07] | PPO baseline. Winners improved it 4× in ≤8 A100-hours via feature scaling, action pruning and reward shaping. One team tuned reward weights with a genetic algorithm | Fast env, provided baseline | "Cheap" RL still assumed a fast env and a baseline. |

## Method-by-method verdicts
Latency is never the constraint: a 2×64 MLP runs in under 1 ms in numpy. **Samples and simulator fidelity** are.

| Method | How it could help | Data / compute | Difficulty, stability, failure modes | Verdict (40 h) |
|---|---|---|---|---|
| PPO (single agent) | End-to-end movement and fighting policy | 10^7–10^8 sim steps [AC-14, AC-07]; needs a simulator | Medium-hard. Reward hacking [AC-04]. Learns the sim's quirks rather than the real game | **Only if a simulator exists**, and even then only for a narrow sub-skill |
| MAPPO / IPPO | Strong default for multi-agent RL [AC-13] | Same as PPO, plus multi-agent opponents in the sim | We control one mech in an FFA, so centralised critics buy little | **No** |
| DQN / DRQN | Discrete macro choices (Arnold-style) [AC-08] | Millions of frames | Unstable and sample-hungry | **No** |
| SAC / QR-SAC | Continuous control (Sophy) [AC-04] | Days of real-time samples | Good for driving-like control. Our aim and dodge have closed-form solutions | **No**. Use analytic intercept and dodge |
| Hierarchical RL | Learned high-level options over scripted skills | Fewer samples than flat RL, but still a simulator | The option set *is* the utility AI. Learning the selector needs a match-level simulator | **No**. Hand-write the selector |
| Self-play / league | Robustness to unseen bots in the final [AC-02] | Massive. Exploiters multiply the cost | Forgetting and cycling [AC-02] | **No**. Instead, make the scripted bot conservative and avoid overfitting the house squad |
| PBT / evolution of weights | Tune utility and reward weights [AC-03, AC-07] | Each "fitness" evaluation costs one submission, ~15 min | Noise SE ~0.6 per evaluation. Overfit risk [AC-10] | **Yes, tiny version**: 4–8 knob changes chosen by hand, or successive halving across 3–4 variants |
| CMA-ES / Bayesian optimisation over submissions | Same, automated | CMA-ES needs ≳10× dimensions evaluations per generation, so it is infeasible beyond 2–3 parameters. NTBEA handles noisy win/loss signals in few evaluations [AC-12] | Too few evaluations for anything above ~3 dimensions | **Partial**: a bandit or NTBEA over a few discrete settings. Run CMA-ES only inside an exact micro-simulator |
| Imitation / behavior cloning | Clone good play [AC-02, AC-17] | Needs expert trajectories. We have 300 recorded observations and no expert actions | Copies the demonstrator's mistakes, and imitation is capped by data quality [AC-06] | **No**, unless match logs with strong-bot actions turn up |
| Curriculum | Easier-to-harder sim training [AC-08 F1] | Needs a simulator | — | **Only if a simulator exists**. The manual equivalent is building skills in order |
| Opponent modeling / classifier | Predict enemy weapon, aim and intent; flag "is hunting me" | Visible state already gives weapon, charging flag, aim and HP | A rule-based classifier covers this. A learned one has no labels | **Yes, as rules**. Sound reveals weapon type; the charging flag gives laser timing |
| Model-based RL / planning | Short-horizon rollouts of projectiles and zone | The physics is **fully specified** (g = 22, projectile speeds, cooldowns) | Exact for our own kinematics. Opponent policies are unknown | **Yes, as analytic planning**: lead targets, ballistic arcs, a dodge search over a few candidate moves, zone ETA. Not learned |
| Decision Transformer [AC-15] | Offline RL from logs | Large offline datasets | No dataset. Heavy | **No** |
| Risk-sensitive / distributional RL | The score rewards survival, so risk aversion is right | — | The *principle* transfers to utilities: maximise P(survive), penalise variance | **Principle only**, encoded in the utility function |
| POMDP handling | Memory of unseen mechs, sound bearings | Spec: 5 s memory, sound bearing σ 7° | Hand-built belief: a decaying threat map from sounds and damage bearings | **Yes, scripted** (Bayesian-ish threat grid) |
| Small learned aim/dodge models | Correct for bot movement patterns | Could train on the 300 recorded observations | Too little data. The analytic intercept is already optimal against constant velocity | **No**. At most, fit one lead-time fudge factor |

## Should we build a local approximate simulator?
**A full match simulator: no.** Rebuilding the 3D map, vision and sound occlusion, loot, NPCs, zone, drops and 15 opponents would take ~15–25 h of our 40 h. It would also be wrong where it matters: house-bot behavior is unknown, and the final opponents are other teams. RL on top of it would then need roughly 10^7–10^8 steps. MARL-BattleGrounds needed 250M steps on a JAX GPU simulator to beat scripted bots [AC-14]; the NMMO winners ran a fast provided env on a 4090 [AC-07]. A Python simulator on laptop and cloud CPU might reach 10^3–10^4 steps/s, so ~10^8 steps per day at best, against a moving target. Then add sim-to-real loss. Expected value: negative.

**A micro-simulator (2–4 h): yes, and not for RL.** It would be a pure function that takes our pose, an enemy track and the projectile and zone parameters from config, and returns hit and damage outcomes. The physics is given exactly, so fidelity is high. Use it to:
1. unit-test target leading (gun 252 m/s, mortar ballistic g = 22) and dodging against recorded enemy velocities;
2. run CMA-ES or grid search on a few aim/dodge parameters offline, where evaluations are free;
3. regression-test decisions against the 50 ms budget.

**If RL is attempted anyway**, restrict it to a 2D duel arena with the real projectile rules: PPO, tiny MLP, reward = damage dealt − 1.5×rear damage taken − death, scripted opponents and a scripted override [AC-08]. Cost: at least 10 h plus a day of CPU, and it will likely lose to a hand-tuned duel routine.

## How to use the 100–150 submissions (the "ML" we should do)
- Treat each submission as a bandit pull. Change **one** knob at a time, or run successive halving over 3–4 variants. Ignore differences below ~1.5 points unless they replicate.
- Log placement, death cause and death time per match if the platform returns them. A death-cause histogram tells you far more than the mean score.
- Guard against overfitting the house squad [AC-10]. Prefer survival-mechanic gains (zone, cover, facing, heals) over house-bot exploits.

## Sources
- AC-01 OpenAI Five, "Dota 2 with Large Scale Deep RL", arXiv:1912.06680, 2019. 10 months, up to 1,536 GPUs, >20 surgeries, shaped reward. High.
- AC-02 AlphaStar, Nature 2019 (s41586-019-1724-z), deepmind.google AlphaStar blog. Imitation policy beat 84% of players; exploiters needed. High.
- AC-03 Jaderberg et al., CTF/FTW, arXiv:1807.01281, Science 2019. PBT over 30 agents evolves reward weights; 450K games. High.
- AC-04 Sony AI, GT Sophy blog (Nature 2022), ai.sony/blog/training-the-worlds-fastest-gran-turismo-racer. QR-SAC, 9–11 days, reward loophole. Medium-high.
- AC-05 Baker et al., Hide-and-Seek, arXiv:1909.07528, ICLR 2020. Batch <32k failed later stages. High.
- AC-06 NeurIPS 2022 Neural MMO Challenge, arXiv:2311.03707, PMLR 2023. Scripted good early, overtaken by RL over months; IL 5th. High.
- AC-07 NeurIPS 2023 Neural MMO results, arXiv:2508.12524, 2025. 4x baseline in <=8 A100-h; GA reward tuning. High.
- AC-08 Wydmuch et al., ViZDoom Competitions, arXiv:1809.03470, 2018. All winners hybrid with hard-coded parts. High.
- AC-09 Lux AI S2 report, arXiv:2402.08112, NeurIPS 2023 comp., 2024. Rule-based won; best RL 4th. High.
- AC-10 0Zeta HaliteIV-Bot, github.com/0Zeta/HaliteIV-Bot, 2020. 4th, rule-based; evo tuning overfit. Medium.
- AC-11 reCurse CodinGame Winter 2024 post-mortem, gist.github.com/reCurs3/fea106bea9c55389706e959b97f956c0. PPO + search, needs referee sim. Medium.
- AC-12 Lucas et al., NTBEA, arXiv:1901.00723, 2019. Competitive for noisy game-agent tuning. Medium-high.
- AC-13 Yu et al., MAPPO, arXiv:2103.01955, NeurIPS 2022. PPO strong in cooperative MARL. High.
- AC-14 MARL-BattleGrounds, arXiv:2610.14883, 2026. Scripted beat RL at 40M steps; RL wins at 250M. Medium (preprint).
- AC-15 Chen et al., Decision Transformer, arXiv:2106.01345, NeurIPS 2021. Needs offline dataset. High (abstract only).
- AC-16 Multi-Agent Interplay in a Competitive Survival Environment, arXiv:2301.08030, 2023 (MSc). Only simple emergent strategies; no peer-reviewed battle-royale RL win found. Low.
- AC-17 ironbar Lux AI 2021 IL agent, github.com/ironbar/luxai. BC from top replays. Low-medium.
