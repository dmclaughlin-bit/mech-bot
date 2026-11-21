# Architecture comparison

Full per-architecture matrix (1–5 scores, 5 = best for this game and team): `agents/architecture.md` §1. Here: the three candidates from the brief, and the decision.

| Criterion | A: Deterministic tactical (utility + paths + rules, layered) | B: Learning-based (RL/IL for major decisions) | C: Hybrid (A + learned components) |
|---|---|---|---|
| Competitive effectiveness in 40 h | **High.** Contest winners were rule-based or hybrid [AC-08, AC-09, AC-10, GB-12, GB-13] | Low. Needs a simulator and roughly 10⁷–10⁹ steps [AC-01, AC-03, AC-14] | ≈ A. The learned parts have no training data |
| Training data / compute | None (tuned through about 50 submissions) | Simulator + GPU-days | Replays or a simulator. Neither exists |
| Decision latency (bun) | <5 ms typical, 30 ms hard guard [AR-07] | OK for a small MLP | OK |
| Implementation time | ~25–30 person-hours for the full feature list | Not feasible | A + 8–15 h |
| Reliability / debuggability | High (a reason string per mode switch [GB-03]) | Low | Medium |
| Adaptability to unfamiliar opponents | Medium. All rules come from mechanics, not from opponent quirks | Depends on how diverse the training opponents are | Medium |
| Main risk | Tuning noise. Mistuned thresholds | Doesn't train in time | Time lost on learned parts |

**Decision: A, built in the layered shape** (strategic ~1 Hz → tactical utility per decision → execution channels for legs, torso and triggers, with a reflex override). That is C's structure with nothing learned in it.

**What would justify adding learning:** public replays (for an opponent model or behavior cloning), or a duel micro-sim built by about hour 16 (CEM tuning for aim and dodge offline).
