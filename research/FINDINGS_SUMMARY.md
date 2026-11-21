# Findings summary and status

| Agent | Status | Evidence | Key output | Open questions |
|---|---|---|---|---|
| 1 Game bots | Complete | 15 sources (official docs, GDC talks, thesis, postmortems) | Position query formula, threat tracks, retreat default, escape-angle limit on gun duels | No public BR bot internals |
| 2 Open source | Complete | 16 repos, licenses read, bun/node benchmarks on the real map | flatqueue + flatbush (ISC), Diamond min-risk (zlib), own solvers | None blocking |
| 3 Academic | Complete | 17 papers/reports | RL not feasible. Utility AI + bandit/NTBEA tuning | None |
| 4 Tactics | Complete | Protocol math + 8 sources | TTK tables, zone/drop/loadout rules, utility framework with knobs | House-bot drop behavior; hider score in practice |
| 5 Architecture | Complete | Python/node/bun/C micro-benchmarks | Layered utility hybrid, TS on bun, module layout, risk table | Judge CPU speed |
| 6 Training | Complete | Kit inspection + 8 sources | Scenario harness, no full sim, no RL, submission schedule | Replays? |
| 7 Benchmarking | Complete | Simulations + latency measurements | SE 0.58 at n=48, detectable delta ~1.2–1.6, determinism risk, lock Sun 9 AM | Real SD, determinism |

**Quality gate notes:**
- Every agent answered its questions.
- Benchmarking measured Python parse/GC, which matters less now that the bot is TS.
- Architecture cited AR-06 from memory; AC-01 covers the same claim with a fetched source.
- TS-02 is unread (low weight).
- Benchmark scripts are copied to `research/bench/`.

**Conflicts and their resolutions:** see `RESEARCH_GAPS.md` (bottom).

**The integrated answer:** `FINAL_RECOMMENDATION.md`.
