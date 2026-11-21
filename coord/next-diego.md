# Diego's research Claude: catch-up + autonomous loop

Paste this whole file into Claude Code inside a clone of github.com/dmclaughlin-bit/mech-bot (or run it via the loop at the bottom). You do RESEARCH only. Never edit bot code (`*.ts` outside `tools/`), never merge, never submit builds. Grok (coordinator) picks experiments; Grok's Claude builds them.

## 1. Catch up (every run, ~3 min)
`git pull` then read, in order:
1. `coord/WORKFLOW.md`: one goal, roles, rules. It supersedes older file-ownership and noise-band rules in other docs.
2. `EXPERIMENTS.md` (newest first) and the last ~10 entries of `coord/log.md`: what was tried and the score.
3. `coord/rca-report.md` (or `git show origin/rca-report:coord/rca-report.md`): code-level root causes.
4. `research/intake/`: your earlier findings, so you don't repeat them.
5. If Python 3 is available: `python3 pipeline/q.py brief` (ranked open hypotheses, what failed). Otherwise read `pipeline/data/hypotheses.jsonl` and `experiments.jsonl`.

State as of Fri 11:42 PM ET: the champion is Build 5b `100941f` at 2.38. Losses: B5 fire gate 2.04, B6 hold behind cover 2.23, B7 no 100 m gun gate 2.04, B8 laser first 2.27, B10 nav fallback 2.35, B11b nav inflation 2.5 m 2.10. In build now: B12 FARM (pick up cubes, shoot drones and crates when no enemy is within 160 m), because the RCA found the bot never collects cubes (winners have about 17-24, we have about 0). Top 32 at about 4.25 qualifies by Sun Nov 22 11:00 AM ET.

Facts: practice is 48 fixed seeds and deterministic. The site shows only the mean score, with no per-match data. Our bot never appears on the stream (only the top 16 do in showdowns; public matches are humans plus house bots). Regen starts 5 s after the last hit dealt or taken, at 45 HP/s.

## 2. Research (pick ONE question per run, ~15 min)
Prefer questions that decide the NEXT build, in this order:
1. If B12 FARM is scored: why did it win or lose? What is the next cube or upgrade refinement (upgrade order once cubes are in hand, safe farm radius, drones vs crates)?
2. Engagement: when should we fight instead of flee (enemy HP, 1v1 vs 2+ enemies, time to kill vs time to die)? Use only fields our bot can actually observe (kit `protocol.md`).
3. Healing that works without holding fire (the fire gate lost twice): where and when do winners regain HP in the recordings?
4. What top-10 teams' public repos do differently (ideas only, no code copying, cite file and line).
Sources: kit docs, the top teams' public repos, the leaderboard, and the CSV or recordings you already have. Never invent numbers.

## 3. Deliver (every run)
Write `research/intake/diego-YYYY-MM-DD-HHMM.json` in the format in `research/intake/README.md` (1-5 findings, each with one claim, sources, confidence, one suggested change, failure_classes). Add a short `coord/log.md` entry (Did / Result / Found / Next). Push to branch `research-YYYYMMDD-HHMM` and open a PR touching only `research/intake/` and `coord/log.md`. Grok merges it and ingests it on the next 15-min tick. If nothing new: write no file and exit.

## Autonomous loop (Diego runs once, leaves it running)
```bash
cd mech-bot && while true; do git checkout -q main && git pull -q && claude -p "$(cat coord/next-diego.md)" --dangerously-skip-permissions >> ~/diego-research.log 2>&1; sleep 2700; done
```
One run every ~45 min keeps usage low. Stop with Ctrl-C. Needs `gh` signed in (for the PR) and push access to the repo.
