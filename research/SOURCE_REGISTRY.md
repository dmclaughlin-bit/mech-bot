# Source registry

Each source has a global ID (SRC-###) and the local ID its agent used. The full entry (type, date, finding, evidence quality, license) is in the agent's own file under **Sources**. Every web source was opened by the agent that cites it, except TS-02, which was a search result only. The coordinator checked licenses by cloning the repos: flatqueue ISC, flatbush ISC, Diamond modified zlib. Local measurement scripts are copied to `research/bench/`.

| Global | Local | File | Source (short) | URL |
|---|---|---|---|---|
| SRC-001 | GB-01 | agents/game-bots.md | van Waveren, *The Quake III Arena Bot*, thesis, 2001. Paper. Layered design, 10 Hz, fuzzy goals, retreat rule. Quality: paper (partially read). | https://www.cs.rochester.edu/u/brown/242/docs/QuakeIII.pdf |
| SRC-002 | GB-02 | agents/game-bots.md | *Q3 bot manual: Characteristics*. Doc. Skill sets 1/4/5, interpolated. Quality: official doc. | https://icculus.org/gtkradiant/documentation/bot_manual/characteristics.html |
| SRC-003 | GB-03 | agents/game-bots.md | Booth, *The AI Systems of Left 4 Dead*, Valve, 2009. Action stack, reason strings, flow distance. Quality: talk (official). | https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf |
| SRC-004 | GB-04 | agents/game-bots.md | *Bot Behavior Trees* (CS:GO). Sensors, expiring memory, per-difficulty reaction/aim. Quality: official/community wiki. | https://developer.valvesoftware.com/wiki/Mp_bot_ai_bt |
| SRC-005 | GB-05 | agents/game-bots.md | Isla, *Handling Complexity in the Halo 2 AI*, GDC 2005. Relevancy, impulses, props. Quality: talk proceedings. | https://gamedeveloper.com/programming/gdc-2005-proceeding-handling-complexity-in-the-i-halo-2-i-ai |
| SRC-006 | GB-06 | agents/game-bots.md | Orkin, *Three States and a Plan*, GDC 2006. GOAP; cover dropped when shot at. Quality: paper. | https://pages.cs.wisc.edu/~dyer/cs540/handouts/gdc2006_orkin_jeff_fear.pdf |
| SRC-007 | GB-07 | agents/game-bots.md | Guerrilla, *Killzone's AI: Dynamic Procedural Combat Tactics*, GDC-E 2005. LOF table, weighted position evaluation, tactical A\*. Quality: talk (offic | https://www.guerrilla-games.com/media/News/Files/gdce05_killzone_ai.pdf |
| SRC-008 | GB-08 | agents/game-bots.md | Epic, *EQS Node Reference: Tests*. Normalize → curve → factor. Quality: official doc. | https://dev.epicgames.com/documentation/en-us/unreal-engine/eqs-node-reference-tests-in-unreal-engine |
| SRC-009 | GB-09 | agents/game-bots.md | Epic, *AI Perception*. Senses, Max Age, prediction. Quality: official doc. | https://dev.epicgames.com/documentation/en-us/unreal-engine/ai-perception-in-unreal-engine |
| SRC-010 | GB-10 | agents/game-bots.md | RoboWiki, *Wave Surfing Tutorial*. Bullet waves, movement prediction. Quality: third-party (community). | https://www.cse.chalmers.se/~bergert/robowiki-mirror/RoboWiki/robowiki.net/wiki/Wave_Surfing_Tutorial |
| SRC-011 | GB-11 | agents/game-bots.md | RoboWiki, *GuessFactor Targeting Tutorial*. Escape angle = asin(v/bullet speed). Quality: third-party. | https://www.cse.chalmers.se/~bergert/robowiki-mirror/RoboWiki/robowiki.net/wiki/GuessFactor_Targeting_Tutorial |
| SRC-012 | GB-12 | agents/game-bots.md | SPAARK, *Battlecode 2025 postmortem*. Weighted-score micro; avoid untested changes. Quality: third-party (competitor). | https://battlecode.org/assets/files/postmortem-2025-spaark.pdf |
| SRC-013 | GB-13 | agents/game-bots.md | *Halite III post-mortem* (rank 66). Simple tuned heuristic beat a complex one. Quality: third-party. | https://stonet2000.github.io/postmortem/ |
| SRC-014 | GB-14 | agents/game-bots.md | Liu, *AI designs in Battle royale games*, Game Developer blog, 2021-06-18. BR bots weak, rarely use cover or retreat. Quality: third-party/opinion. | https://gamedeveloper.com/design/-user-research-ai-designs-in-battle-royale-games |
| SRC-015 | GB-15 | agents/game-bots.md | GamesRadar, *Fortnite bots explained*. Matchmaking facts only, no behavior detail. Quality: press. | https://gamesradar.com/uk/fortnite-bots-explained-along-with-new-matchmaking-system-in-epic-developer-blog |
| SRC-016 | OS-01 | agents/open-source.md | flatqueue repo (read index.js, LICENSE) 2025 Fast typed-array heap; A* median 1.5 ms on map High, benchmarked ISC | https://github.com/mourner/flatqueue |
| SRC-017 | OS-02 | agents/open-source.md | flatbush repo (read index.js, LICENSE) 4.7.0, 2026-10-30 LOS 3 µs per query on 9.7 k edges High, benchmarked ISC | https://github.com/mourner/flatbush |
| SRC-018 | OS-03 | agents/open-source.md | Diamond (Voidious) repo (read LICENSE, README, MeleeMover.java) 2009–2012 Minimum-risk melee formula High modified zlib | https://github.com/Voidious/Diamond |
| SRC-019 | OS-04 | agents/open-source.md | DrussGT (RoboWiki) wiki ongoing Wave surfing + GF/DC; restrictive terms Medium custom, restrictive | https://robowiki.net/wiki/DrussGT |
| SRC-020 | OS-05 | agents/open-source.md | PathFinding.js repo + npm 0.4.18, 2016 JPS max 183 ms; too slow High, benchmarked MIT | https://github.com/qiao/PathFinding.js |
| SRC-021 | OS-06 | agents/open-source.md | mistreevous repo (LICENSE, README) 4.3.1, 2025-07 Workable BT, not needed Medium MIT | https://github.com/nikkorn/mistreevous |
| SRC-022 | OS-07 | agents/open-source.md | behavior3js repo (LICENSE) 0.2.2, 2017 Stale Low MIT | https://github.com/behavior3/behavior3js |
| SRC-023 | OS-08 | agents/open-source.md | ngraph.path repo (LICENSE) 1.6.1, 2025-11 Graph A*, zero deps Medium MIT | https://github.com/anvaka/ngraph.path |
| SRC-024 | OS-09 | agents/open-source.md | python-tcod repo (path.py, LICENSE) 21.2.4, 2026-11 C A*: mean 7.7 ms, max 54 ms; Dijkstra 28 ms High, benchmarked BSD-2 | https://github.com/libtcod/python-tcod |
| SRC-025 | OS-10 | agents/open-source.md | python-pathfinding repo (finder.py, a_star.py, LICENSE) 1.0.23, 2026-10 Mean 80 ms; too slow High, benchmarked MIT | https://github.com/brean/python-pathfinding |
| SRC-026 | OS-11 | agents/open-source.md | py_trees repo (LICENSE) 2.6.0, 2026-09 Python BT, needs pydot Medium BSD-3 | https://github.com/splintered-reality/py_trees |
| SRC-027 | OS-12 | agents/open-source.md | Shapely repo (LICENSE) + bench 2.2.0, 2026-10 STRtree LOS 44 µs per query High, benchmarked BSD-3 | https://github.com/shapely/shapely |
| SRC-028 | OS-13 | agents/open-source.md | Neural MMO repo (LICENSE) nmmo 2.1.2, 2024-08 Survival RL environment; not transferable Medium MIT | https://github.com/NeuralMMO/environment |
| SRC-029 | OS-14 | agents/open-source.md | Meta MMO repo (LICENSE) 2024 Same Medium MIT | https://github.com/kywch/meta-mmo |
| SRC-030 | OS-15 | agents/open-source.md | GoBigger repo (LICENSE) — agar.io-style environment; not transferable Low Apache-2.0 | https://github.com/opendilab/gobigger |
| SRC-031 | OS-16 | agents/open-source.md | ballistic-solver repo (LICENSE) + PyPI 1.3.0, 2026-10 Drag solver, overkill; use closed form Medium MIT | https://github.com/ujinf74/ballistic-solver |
| SRC-032 | AC-01 | agents/academic-research.md | OpenAI Five, "Dota 2 with Large Scale Deep RL", arXiv:1912.06680, 2019. 10 months, up to 1,536 GPUs, >20 surgeries, shaped reward. High. | (local / see file) |
| SRC-033 | AC-02 | agents/academic-research.md | AlphaStar, Nature 2019 (s41586-019-1724-z), deepmind.google AlphaStar blog. Imitation policy beat 84% of players; exploiters needed. High. | (local / see file) |
| SRC-034 | AC-03 | agents/academic-research.md | Jaderberg et al., CTF/FTW, arXiv:1807.01281, Science 2019. PBT over 30 agents evolves reward weights; 450K games. High. | (local / see file) |
| SRC-035 | AC-04 | agents/academic-research.md | Sony AI, GT Sophy blog (Nature 2022), ai.sony/blog/training-the-worlds-fastest-gran-turismo-racer. QR-SAC, 9–11 days, reward loophole. Medium-high. | (local / see file) |
| SRC-036 | AC-05 | agents/academic-research.md | Baker et al., Hide-and-Seek, arXiv:1909.07528, ICLR 2020. Batch <32k failed later stages. High. | (local / see file) |
| SRC-037 | AC-06 | agents/academic-research.md | NeurIPS 2022 Neural MMO Challenge, arXiv:2311.03707, PMLR 2023. Scripted good early, overtaken by RL over months; IL 5th. High. | (local / see file) |
| SRC-038 | AC-07 | agents/academic-research.md | NeurIPS 2023 Neural MMO results, arXiv:2508.12524, 2025. 4x baseline in <=8 A100-h; GA reward tuning. High. | (local / see file) |
| SRC-039 | AC-08 | agents/academic-research.md | Wydmuch et al., ViZDoom Competitions, arXiv:1809.03470, 2018. All winners hybrid with hard-coded parts. High. | (local / see file) |
| SRC-040 | AC-09 | agents/academic-research.md | Lux AI S2 report, arXiv:2402.08112, NeurIPS 2023 comp., 2024. Rule-based won; best RL 4th. High. | (local / see file) |
| SRC-041 | AC-10 | agents/academic-research.md | 0Zeta HaliteIV-Bot, github.com/0Zeta/HaliteIV-Bot, 2020. 4th, rule-based; evo tuning overfit. Medium. | (local / see file) |
| SRC-042 | AC-11 | agents/academic-research.md | reCurse CodinGame Winter 2024 post-mortem, gist.github.com/reCurs3/fea106bea9c55389706e959b97f956c0. PPO + search, needs referee sim. Medium. | (local / see file) |
| SRC-043 | AC-12 | agents/academic-research.md | Lucas et al., NTBEA, arXiv:1901.00723, 2019. Competitive for noisy game-agent tuning. Medium-high. | (local / see file) |
| SRC-044 | AC-13 | agents/academic-research.md | Yu et al., MAPPO, arXiv:2103.01955, NeurIPS 2022. PPO strong in cooperative MARL. High. | (local / see file) |
| SRC-045 | AC-14 | agents/academic-research.md | MARL-BattleGrounds, arXiv:2610.14883, 2026. Scripted beat RL at 40M steps; RL wins at 250M. Medium (preprint). | (local / see file) |
| SRC-046 | AC-15 | agents/academic-research.md | Chen et al., Decision Transformer, arXiv:2106.01345, NeurIPS 2021. Needs offline dataset. High (abstract only). | (local / see file) |
| SRC-047 | AC-16 | agents/academic-research.md | Multi-Agent Interplay in a Competitive Survival Environment, arXiv:2301.08030, 2023 (MSc). Only simple emergent strategies; no peer-reviewed battle-ro | (local / see file) |
| SRC-048 | AC-17 | agents/academic-research.md | ironbar Lux AI 2021 IL agent, github.com/ironbar/luxai. BC from top replays. Low-medium. | (local / see file) |
| SRC-049 | TS-01 | agents/tactical-strategy.md | Chen & Liu, "Strategy in Battle Royale Games" (2021), Preprint A low kill-to-placement reward ratio makes peaceful play optimal; mutual retreat is nev | https://aochen.netlify.app/uploads/Strategy_Battle_Royale.pdf |
| SRC-050 | TS-02 | agents/tactical-strategy.md | Kotaku, PUBG tournament rules and upsets, News Placement-heavy scoring led to passive play (search result only, not read) Low | https://kotaku.com/battlegrounds-tournament-rules-result-in-confusing-upse-1798434823 |
| SRC-051 | TS-03 | agents/tactical-strategy.md | Guild Order, Apex zone prediction, Guide Centroid-facing edge is safest; third parties arrive 30–90 s after the first shot; time-box fights Medium | https://guildorder.com/games/apex/guides/zone-prediction-and-map-reading |
| SRC-052 | TS-04 | agents/tactical-strategy.md | Guild Order, PUBG circle rotations, Guide Edge spots rotators and allows ambushes; center is exposed Low–Med | https://guildorder.com/games/pubg/guides/circle-prediction-and-rotations |
| SRC-053 | TS-05 | agents/tactical-strategy.md | RoboWiki "Dodging Bullets", Wiki Random/flat movement beats head-on, linear and circular aim Med–High | https://www.cse.chalmers.se/~bergert/robowiki-mirror/RoboWiki/robowiki.net/wiki/Dodging_Bullets |
| SRC-054 | TS-06 | agents/tactical-strategy.md | RoboWiki "Stop And Go", Wiki Beats simple aim; loses to velocity-averaging aim Med–High | https://www.cse.chalmers.se/~bergert/robowiki-mirror/RoboWiki/robowiki.net/wiki/Stop_And_Go |
| SRC-055 | TS-07 | agents/tactical-strategy.md | RoboWiki "Melee Surfing", Wiki Pick the minimum-danger reachable point Medium | https://www.cse.chalmers.se/~bergert/robowiki-mirror/RoboWiki/robowiki.net/wiki/Melee_Surfing.html |
| SRC-056 | TS-08 | agents/tactical-strategy.md | `research/protocol.md`, `GAME_CONTEXT.md` Primary spec Every number used here; TTK and dodge values computed from it High | (local / see file) |
| SRC-057 | AR-01 | agents/architecture.md | Infinite Axis Utility System (Dave Mark, gameai.com) Practitioner page / GDC talk index Considerations × response curves, compensated product, used at | https://gameai.com/iaus.php |
| SRC-058 | AR-02 | agents/architecture.md | Orkin, "Three States and a Plan: The A.I. of F.E.A.R." (GDC 2006) GDC paper GOAP: FSM reduced to Goto/Animate/UseObject; the planner picks actions Hig | https://pages.cs.wisc.edu/~dyer/cs540/handouts/gdc2006_orkin_jeff_fear.pdf |
| SRC-059 | AR-03 | agents/architecture.md | Isla, "Handling Complexity in the Halo 2 AI" (GDC 2005) GDC proceeding BT/priority-list behavior DAG, impulses, behavior masks High | https://gamedeveloper.com/programming/gdc-2005-proceeding-handling-complexity-in-the-i-halo-2-i-ai |
| SRC-060 | AR-04 | agents/architecture.md | Humphreys, "Exploring HTN Planners through Example" (Game AI Pro) Book chapter HTN decomposition and replanning cost/trade-offs for game agents High | https://www.taylorfrancis.com/chapters/edit/10.1201/9780429055058-9/exploring-htn-planners-example-troy-humphreys |
| SRC-061 | AR-05 | agents/architecture.md | van Waveren, "The Quake III Arena Bot" (thesis, TU Delft 2001) MSc thesis Layered bot: area-awareness nav + fuzzy goal selection + combat/aim High | https://www.cs.rochester.edu/u/brown/242/docs/QuakeIII.pdf |
| SRC-062 | AR-06 | agents/architecture.md | OpenAI et al., "Dota 2 with Large Scale Deep RL" (arXiv 1912.06680) Paper (cited from memory, not re-fetched) Superhuman RL needed months of large-sca | https://arxiv.org/abs/1912.06680 |
| SRC-063 | AR-07 | agents/architecture.md | Local micro-benchmarks (this agent) /tmp/claude-0/bench/ (prep.py, astar.py, los.py, bench.ts, a.c) Measurement Timings in §3 Medium (dev box ≠ judge  | (local / see file) |
| SRC-064 | TR-01 | agents/training.md | Lucas et al., "Efficient Evolutionary Methods for Game Agent Optimisation: Model-Based is Best" (2019). | https://rdgain.github.io/assets/pdf/papers/lucas2019efficient.pdf |
| SRC-065 | TR-02 | agents/training.md | Nomura et al., "CMA-ES with Learning Rate Adaptation: Can CMA-ES with Default Population Size Solve Multimodal and Noisy Problems?" GECCO 2023. | https://dl.acm.org/doi/10.1145/3583131.3590358 |
| SRC-066 | TR-03 | agents/training.md | Li, Jamieson et al., "Hyperband: A Novel Bandit-Based Approach to Hyperparameter Optimization," JMLR 18 (2018). | https://www.jmlr.org/papers/volume18/16-558/16-558.pdf |
| SRC-067 | TR-04 | agents/training.md | Jaderberg et al., "Population Based Training of Neural Networks" (2017). | https://arxiv.org/abs/1711.09846 |
| SRC-068 | TR-05 | agents/training.md | Tobin et al., "Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World" (2017). | https://arxiv.org/abs/1703.06907 |
| SRC-069 | TR-06 | agents/training.md | Battlecode 2023 postmortem "Don't @ Me" (local full-map scrimmages against old versions). | https://battlecode.org/assets/files/postmortem-2023-dont-at-me.pdf |
| SRC-070 | TR-07 | agents/training.md | RoboWiki, RoboRunner batch battle runner for Robocode. | https://www.cse.chalmers.se/~bergert/robowiki-mirror/RoboWiki/robowiki.net/wiki/RoboRunner.html |
| SRC-071 | TR-08 | agents/training.md | Kit files `check/check.py`, `check/stream.jsonl.gz` (decoded by this agent), `protocol.md` §1, §3, §6. | (local / see file) |
| SRC-072 | BM-01 | agents/benchmarking.md | Herbrich, Minka, Graepel, "TrueSkill: A Bayesian Skill Rating System", NIPS 2006. | https://papers.nips.cc/paper_files/paper/2006/file/f44ee263952e65b3610b8ba51229d1f9-Paper.pdf |
| SRC-073 | BM-02 | agents/benchmarking.md | "The Evaluation of Rating Systems in Online Free-for-All Games", arXiv:2008.06787. | https://arxiv.org/pdf/2008.06787 |
| SRC-074 | BM-03 | agents/benchmarking.md | "When Does Pairing Seeds Reduce Variance? Evidence from a Multi-Agent Economic Simulation", arXiv:2512.24145. | https://arxiv.org/abs/2512.24145v3 |
| SRC-075 | BM-04 | agents/benchmarking.md | Burch et al., "AIVAT: A New Variance Reduction Technique for Agent Evaluation in Imperfect Information Games", AAAI 2018. | https://ojs.aaai.org/index.php/AAAI/article/view/11481 |
| SRC-076 | BM-05 | agents/benchmarking.md | Python docs, `gc` (gc.freeze). | https://docs.python.org/3/library/gc.html |
| SRC-077 | BM-06 | agents/benchmarking.md | Linux kernel docs, "CFS Bandwidth Control". | https://docs.kernel.org/6.14/scheduler/sched-bwc.html |
| SRC-078 | BM-07 | agents/benchmarking.md | Kit sources: `/tmp/claude-0/kit/mechfight-kit/check/check.py`, `protocol.md`; local measurements in `/tmp/claude-0/bm/{parse,heavy,sim,sim2}.py`. | (local / see file) |

Total: 78 sources.
