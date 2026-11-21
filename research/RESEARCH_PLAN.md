# Research plan

Goal: the strongest bot architecture we can actually build, test and submit for Mech Royale before Sun Nov 22, 11:00 AM ET (~40 h from Fri 7:24 PM ET). Research only. No bot code at this stage.

Every agent was handed `GAME_CONTEXT.md` (the real rules and numbers) and told to tie its findings to this game, not to shooters in general.

| Agent | Owns | Scope | Depends on |
|---|---|---|---|
| 1 Game bots | agents/game-bots.md | PUBG/Fortnite/Apex/CS/Quake/Halo/F.E.A.R. bot AI, plus programming-contest winners | none |
| 2 Open source | agents/open-source.md | Permissively licensed code we can reuse: pathfinding, intercept/ballistics, BT/utility libs, Robocode techniques | none |
| 3 Academic | agents/academic-research.md | Is RL/IL appropriate? Evidence from OpenAI Five, AlphaStar, FTW, Neural MMO, VizDoom, Kaggle sims | none |
| 4 Tactics | agents/tactical-strategy.md | Quantitative decision framework from game numbers: TTK, zone, drops, loadout, stealth | none |
| 5 Architecture | agents/architecture.md | Architecture matrix, module design, language choice, micro-benchmarks | 2 and 4 are folded in at synthesis |
| 6 Training | agents/training.md | Sim vs no sim, tuning loop, what can be learned | 3 |
| 7 Benchmarking | agents/benchmarking.md | Score statistics, paired evaluation, latency profiling, submission schedule | 6 |

Each agent tags its sources with local IDs (GB-, OS-, AC-, TS-, AR-, TR-, BM-), and the coordinator merges them into `SOURCE_REGISTRY.md`. Each agent sends back a summary of 250 words or less. The coordinator alone writes `FINDINGS_SUMMARY.md`, `ARCHITECTURE_COMPARISON.md`, `RESEARCH_GAPS.md` and `FINAL_RECOMMENDATION.md`.
