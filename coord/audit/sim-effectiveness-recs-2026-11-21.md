# Sim effectiveness: 6 small changes to existing files (Diego's Claude, Sat Nov 21 5:40 PM ET)

Asked by Diego: make the existing sim (`tools/sim/`) more effective on three fronts, throughput, information and opponent diversity. Every item below modifies an existing file, and nothing here is implemented. Each item ends with a check that it changes no result. Ranked by value for effort.

## The numbers behind it (measured just now on this 4-core box, current main bot)
- On 2 seeds profiled, `squadDecide` (house AI) is about **90% of sim time** in long games: 6.6 s of 7.3 s in a 2,035-tick game, vs 0.3 s in a 336-tick game.
- Inside it, **failed A\* searches** in `geom.ts findPath` cost 6.1 s of the 7.0 s spent in path finding: 987 failures at about 6 ms each. A failure explores until the 60,000-pop cap or the edge of its component. It happens when a house bot follows a goal it can't reach, like us on a roof. It retries every 4 s or each time we move 10 m.
- The bot itself (pipe round-trip) is only about 9% of job time. Bot start-up (`hello` → `ready`, nav build) takes about 0.5 s per match.
- `--jobs` defaults to min(8, cores) = 4. On 24 seeds: jobs 4 took 26.2 s, 6 took 23.1 s, and 8 took 21.8 s, with identical results (the sim process and the bot process take turns, so the cores sit half idle).

## Ranked recommendations

| # | Front | Change (existing file) | Value | Effort | Same-results check |
|---|---|---|---|---|---|
| 1 | Throughput | `geom.ts`: label connected components of `g.blocked` once in `loadGeo` (same 8-neighbour and corner rule A\* uses). At the top of `findPath`, return `null` when the start and goal cells are in different components | Estimate **~2× faster** on full screens, from the profile above. Most of the failed searches should be cross-component; a few may fail on the pop cap and stay slow | ~15 lines | Exact by construction: cross-component A\* always returns null. Verify 0/384 games changed on 2000–5000 |
| 2 | Throughput | `run.ts`: default `--jobs` to 2 × cores (cap 8) | **~17%** (measured) | 1 line | Results don't depend on jobs (`ANSWER_MS` 2000 ms). Note: `late_over_50ms` gets noisier, so keep the kit check as the timing gate |
| 3 | Information | `run.ts`: `--seed-base` flag, or `SEED_BASE` env, in place of the hard-coded 1000. Every held-out run today needs a local patch | Removes a patch that every lane re-makes, and 2000–5000 becomes reproducible from main | 1 line | Default 1000, so it is identical |
| 4 | Information | `run.ts` CSV: add `kills_after_60` (from `S.deaths` where `by === me.id && t >= 60`) and `los_at_death` (house bots that `sees` us on the death tick). Add `kills/min after 60 s` to the existing summary line | Kills after 60 s is the primary PR-template row. Today it needs a bot-side probe. Multi-LOS deaths were the main P-D-007 finding | ~6 lines | New columns only |
| 5 | Information | `run.ts`: `--vs <base.csv>` prints one extra summary line: games changed, paired mean diff of score and kills, and the paired SE | This is what every slot decision uses. ASSUMPTIONS.md already says to compare seed by seed. Today each lane computes it by hand | ~15 lines | Print only |
| 6 | Opponent diversity | `tune.ts`: on load, merge an optional `SIM_HOUSE` JSON (env) into `TIERS`, `SQUAD` and `TIER_COUNTS`. house.ts and engine.ts already read those objects. Name 3 profiles in tune.ts's comments: **sharp** (aimSigma ×0.7, reactS ×0.7; ASSUMPTIONS.md says the current aim error is wider than the recordings show), **swarm** (huntersEveryS 45, huntersPerDeath 2), **passive** (engageR 0, huntersEveryS 120) | Tests a candidate against plausible stronger, faster and calmer squads without new code paths | ~10 lines | Unset env = identical |

## How to use #6 without new process
- Pick profiles once, using site scores we already have. Re-run about 6 site-scored builds (B80 3.79, B108 3.75, B110 3.96, B117 4.08, B111 4.10, B113 4.17) on default plus the 3 profiles. Keep the profiles whose ranking matches the site at least as well as default does. ASSUMPTIONS.md reports Spearman 0.58 on its original six commits.
- After that, a screen is default plus the kept profiles, both seed sets. A candidate earns a slot only if it doesn't lose on any of them. With #1 and #2, that costs about what one default screen costs today.

## Deliberately not recommended
- Running the bot in-process (no subprocess) would remove the pipe cost, but that is only ~9% of the time and the work is risky.
- Caching the bot's nav build across matches would save ~0.5 s per match, but it changes the bot.
- Replacing the house AI, or adding a second sim.
- Jump and dodge behaviour for house bots: the known gap in ASSUMPTIONS.md (our sim gun hit rate is 80%). Worth it only if #6's sharp profile doesn't already pull the hit rate toward reality.

Order: 1 → 2 → 3 → 4 → 5 → 6. Items 1–5 need no calibration and are safe to land together after the 0/384 check. Grok decides; nothing changes until Diego or Doug authorizes it.
