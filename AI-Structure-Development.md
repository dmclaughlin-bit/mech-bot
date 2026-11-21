# AI Structure and Development Plan

How the team (Diego and Doug) and our two Claude sessions split the work on the Mech Royale bot, what we have tried, and what to do next. Both Claudes read this file and `EXPERIMENTS.md` before starting any task, so neither redoes the other's work.

**Deadline:** Sun Nov 22, 11:00 AM ET. **Lock the final build at 9:00 AM ET.**
**Score:** mean of (16 − place) per match. Placement only; kills just yield cubes. The kit's example bot scores 1.15.
**Architecture and evidence:** `research/FINAL_RECOMMENDATION.md` in the project files (summary below).

## How we measure a change

There is no local simulator, and building one would cost 22 to 30 hours, so we don't. Every change is judged two ways:

1. **Offline gate (must pass before any submit):** `check/check.py` under the full sandbox flags, plus the scenario harness (clips of real observations from `check/stream.jsonl.gz` with pass/fail cases such as "face a rear attacker within 3 decisions").
2. **Practice submission:** 48 matches per submission, 4 submissions per hour. One submission only detects a change of about 1.2 points, so **keep a change only if it gains about +1.2 or more, or is clearly right on mechanism and costs no more than −0.6.** Re-submit a winner before trusting it.

## Roles

| Who | Owns |
| --- | --- |
| **Doug (5x Claude plan)** | `main` and the long build sessions: the bot's code, the scenario harness, latency hardening. |
| **Diego (lighter Claude plan)** | What to try next and why, submitting to practice, and the `EXPERIMENTS.md` log. Uses Claude for short tasks: reading results, spotting failure modes, writing one-paragraph specs. |

**Merge rule:** a PR that passes the offline gate merges without waiting for review. Diego can veto. A PR that changes behavior is submitted right after merging, one change per submission.

## Timeline (ET)

| When | Build (Doug) | Submit (Diego) |
| --- | --- | --- |
| **Fri 8 PM–midnight** | Survival-min bot: crash and timeout safety, zone-safe travel, face attacker, always pick an offer, take laser/lightning | **S1 by ~11 PM** to lock qualifying (earlier submissions win ties) |
| **Fri midnight–1 AM** | — | **S2:** S1 with a time-seeded RNG, to test whether practice is deterministic |
| **Sat 9 AM–1 PM** | Pathfinding (A* + stuck recovery), enemy tracking, retreat / break LOS, engagement gating | One feature per submission. Target ≥ 3.0 |
| **Sat 1–6 PM** | Position query (cover, exposure), weapon fire logic, dodge reflexes, scenario harness | Target ≥ 4.0 |
| **Sat 6–11 PM** | Supply drops, third-partying, loot and upgrades, endgame hold | 3-point sweeps on aggression and retreat threshold. Trust trends, not the single best |
| **Sun 7–9 AM** | Fix the worst observed failure only | Submit the final candidate 3 times, pick by mean. **Lock at 9:00 AM** |
| **Sun 9–11 AM** | Buffer. Final checks: decision time, 512 MB, stderr-only logs, MIT license, README credits | Deadline 11:00 AM |

## Rules

1. **Tune for the free-for-all final**, not the practice ladder. In practice the 15 house bots act as one squad and never fight each other; in the final the other bots kill each other for us. Survival limits (no early even fights, reach the final circle at full HP) are hard limits. Only the aggression knob is tuned on practice.
2. **No reinforcement learning, no simulator, no large refactor on Sunday.**
3. **Read all numbers from `hello.config`.** Balance can change.
4. **Runtime limits:** hard deadline guard at 30 ms per decision (limit is 50 ms), target p99 ≤ 15 ms, `ready` within 20 s, 1 CPU, 512 MB, stdout for protocol lines only. Wrap map prep in a try with a no-map fallback, since a constructor throw idles the bot all match.

## Architecture findings

From `research/FINAL_RECOMMENDATION.md`:

- **Decision model:** deterministic layered utility bot in TypeScript on bun. A strategic planner (about 1 Hz) picks a goal; a tactical selector (every decision) picks engage, kite, flee, third-party, loot or travel; execution channels drive legs, torso and triggers; reflexes override one channel for one tick (dodge, face a rear hit, unstick).
- **Module layout:** `bot.ts`, `mechfight.ts` (unchanged), `src/{brain,params,debug}.ts`, `src/map/`, `src/world/`, `src/strategy/`, `src/tactics/`, `src/exec/`, `vendor/` (flatqueue, flatbush and their licenses), `params/*.json`, `tools/`.
- **Tunable knobs (4 to 6 at most):** aggression, retreat thresholds, rotation buffer, supply-drop HP margin, gun accuracy priors, edge offset. All live in `params/*.json`.
- **Credit in the README:** flatqueue and flatbush (ISC), and the Diamond min-risk idea (zlib).

## What's been tried

Log one row per submission in `EXPERIMENTS.md` at the repo root: time, commit, params, practice score, hypothesis, and result. Diego owns it and adds the row when each score comes back.

## First task list for Doug

1. **Survival-min bot (`feat/survival-min`), tonight.** Crash and timeout safety (top-level try/catch, deadline guard, map prep in a try), zone-safe travel, turn to face whoever is shooting, always answer an upgrade offer, take a laser or lightning gun in range. All knobs in `params/default.json`. Pass `check.py` and hand over for S1.
2. **Map and pathfinding (`feat/nav`).** Map prep grids, line of sight, A* on a 2 m grid with jump and jet edges, stuck detection.
3. **Scenario harness (`feat/harness`).** Cases cut from `check/stream.jsonl.gz`, plus a latency stress case (16 mechs, 60 projectiles, p99 < 30 ms). This becomes part of the offline gate.
4. **Combat layer.** Enemy tracking, engagement gating, retreat and break LOS, then the features in the timeline above, one PR each.
