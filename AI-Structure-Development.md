# AI Structure and Development Plan

How the team (Diego and Doug) and our two Claude sessions split the work on the Mech Royale bot, what we have tried, and what to do next. Keep this file current: it is how neither Claude redoes the other's work.

**Deadline:** Sun Nov 22, 11:00 AM ET (final entry locks). Target final submit by 10:30 AM ET.
**Scoring:** mean of (16 − place) per match. Placement only; kills just yield cubes. Baseline starter bot scores 1.15.

## Roles

| Who | Plan | Owns |
| --- | --- | --- |
| **Diego** | Lighter Claude plan | Research and strategy, PR review, deciding what ships, submitting to practice (4 per hour). Uses Claude for short, high-value tasks: reading match logs, spotting failure modes, writing tight specs for Doug. |
| **Doug** | 5x Claude plan | Owns `main` and runs the long sessions: building the bot, building the local 16-mech match runner, running tuning sweeps. |

## Shared setup

- **One repo, small PRs.** One feature branch per change. `main` must always pass `check/check.py` from the kit.
- **This file is the shared plan.** Update the "What's been tried" log in the same PR as the change it describes.
- **Local runner.** Plays N seeded matches against the starter bot, earlier versions of our bot, and variants, and reports average placement (and score as 16 − place).

## Timeline (ET)

| When | What |
| --- | --- |
| **Fri night** | Research finishes (Diego). Doug builds the baseline bot: zone safety, turning to face whoever is shooting, supply drops, avoiding early fights. Submit right away to lock in qualifying. |
| **Sat morning** | Doug's Claude finishes the runner and the opponent pool. Diego picks the top 3 behaviors to improve, using the research and practice replays. |
| **Sat afternoon and evening** | Main loop. Doug runs parallel variant branches and sweeps the utility weights. Diego reviews results and merges the winners. Submit each improvement. |
| **Sun 12 to 8 AM** | Doug's Claude runs long tuning sweeps overnight. |
| **Sun 8 to 11 AM** | Feature freeze, then final checks: decision time under 50 ms, the 512 MB limit, stderr-only logs, MIT license and README credits. Submit the final build by 10:30. |

## Rules

1. **Keep a change only if it beats the current best over at least 100 seeded matches**, not one lucky game.
2. **Tune for the free-for-all final**, not just the house-bot practice ladder. Practice is 15 house bots acting as one squad that hunts the weakest; the final is 16 real bots in FFA.
3. **No reinforcement learning.** No time for it. Heuristics and tuned weights only.
4. **Read all numbers from `hello.config`.** Balance can change; never hard-code ranges, damage or radii.
5. **Sandbox limits are hard:** 1 CPU, 512 MB, no network, read-only FS, `/tmp` 64 MB, `ready` within 20 s, 50 ms per decision (>2% late fails), stdout for protocol lines only.

## Architecture findings

_Placeholder. A separate research thread is producing architecture findings (bot structure, decision model, utility weights to expose for tuning). Paste the summary and decisions here when it lands._

- Decision model: _TBD_
- Module layout: _TBD_
- Tunable weights: _TBD_

## What's been tried

Log every experiment, including the ones that lost. Newest first.

| Date / time (ET) | Branch or commit | Change | Matches | Avg place / score | Result |
| --- | --- | --- | --- | --- | --- |
| Fri Nov 20 | `7a22fee` | Kit TypeScript starter bot (`bot.ts`) | — | baseline 1.15 (kit example) | Starting point |

## First task list for Doug

In order. Each item is its own branch and PR unless noted.

1. **Baseline bot, submit tonight** (`feat/baseline`). Replace the example logic in `bot.ts` with:
   - **Zone safety:** move toward `zone.next_center` early, boost only when out of zone or under fire, never end a tick predicted outside the next zone.
   - **Face the attacker:** when taking damage, turn toward the source (rear hits do 1.5x), and keep facing it while retreating.
   - **Avoid early fights:** do not fire at or approach mechs in the opening phase unless they are already shooting us or are low on HP.
   - **Supply drops:** go for a drop (full heal) when it is reachable before contested, or when our HP is low.
   - **Loot:** keep picking weapons and take useful pickups within `hello.config.loot.pickup_radius`.
   - Logs to stderr only. Pass `check/check.py`, then tell Diego so it can be submitted.
2. **Local match runner** (`feat/runner`). A script that runs N seeded 16-mech matches with the kit's engine, mixing our bot, the starter bot, saved earlier versions, and variants. Output: per-bot mean placement and mean score (16 − place), with seeds recorded so runs are reproducible. Must handle 100+ matches in a reasonable time.
3. **Opponent pool** (`feat/pool`). Save each submitted version under a versioned name so the runner can play against it. Include at least: kit starter bot, current best, previous best.
4. **Expose tunable weights** (`feat/weights`). Pull every heuristic threshold and utility weight into one config object (with defaults) that the runner can override per variant, so sweeps need no code edits.
5. **Timing and memory guard.** Measure the slowest decision per match in the runner and fail loudly over 40 ms, leaving headroom under the 50 ms limit. Check memory stays well under 512 MB.
6. **Update this file** with each result in "What's been tried".
