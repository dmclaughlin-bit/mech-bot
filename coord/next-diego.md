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
Prefer questions that decide the NEXT build. KILLS ARE THE SCORE: in practice the house squad never kills itself, so we only gain places when house bots die to us or the zone (2.54 now ~ 2.5 bots before us; top teams ~5.5). Order:
1. End every run with ONE concrete next-build proposal (a single mechanism, the file/function to change, the expected gain and why), in suggested_change. A proposal beats a summary.
2. How do top bots get kills on house bots: aim/leading, weapon choice and range, which target first (weakest/lone/easy-tier), finishing? Use the recordings in /workspace/watch if shared, the stream, public repos (ideas only, cite file:line).
3. Early laser: Watcher measures laser by 30 s in 77% of winners vs 26% of the bottom half (d=1.17), but our Build 8 'laser first' scored 2.27 vs 2.38. Why did ours fail and what would a correct version do?
4. Engagement refinements after Build 14 (TTK vs TTD) is scored, and healing that works without holding fire.
Sources: kit docs, the top teams' public repos, the leaderboard, and the CSV or recordings you already have. Never invent numbers.

## 3. Deliver (every run)
Write `research/intake/diego-YYYY-MM-DD-HHMM.json` in the format in `research/intake/README.md` (1-5 findings, each with one claim, sources, confidence, one suggested change, failure_classes). Add a short `coord/log.md` entry (Did / Result / Found / Next). Push to branch `research-YYYYMMDD-HHMM` and open a PR touching only `research/intake/` and `coord/log.md`. Grok merges it and ingests it on the next 15-min tick. If nothing new: write no file and exit.

## Autonomous loop (Diego runs once, leaves it running)
```bash
cd mech-bot && while true; do git checkout -q main && git pull -q && claude -p "$(cat coord/next-diego.md)" --dangerously-skip-permissions >> ~/diego-research.log 2>&1; sleep 1200; done
```
One run every ~45 min keeps usage low. Stop with Ctrl-C. Needs `gh` signed in (for the PR) and push access to the repo.
