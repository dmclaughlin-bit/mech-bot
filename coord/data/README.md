# coord/data — canonical results database

This directory is the **one** record of what we have tested. Do not keep a second score list in a side file and let it drift.

## The rule (Doug, Sat 12:32 PM ET)

The official [joinbuilders](https://www.joinbuilders.org/buildathon/tracks/builders) site score is the **only source of truth**. Keep a build only if that score is strictly above the current verified champion. A tie keeps the earlier champion (and the earlier final entry).

The local sim is a **screen only**: crash, `check.py` timing, flag-0 byte-identity, and the written vetoes (died-before-40s, lightning-at-end). Sim Δ does not rank builds and does not justify a keep or a close. See `coord/WORKFLOW.md` Slot rules.

## Files

| File | What it holds | Who writes it |
|---|---|---|
| `site_results.csv` | One row per official site submission | **Grok (coordinator) only** |
| `screens.csv` | One row per local sim screen (one seed set per row) | Builders append their screen rows in the PR; Grok backfills and may land rows from a tester draft |
| `ideas.md` | Every idea family tried, the builds that tested it, best site result, and status | Grok updates when a family is tested or retired |

Unknown numbers are left **blank**. Never invent a score, receipt, SHA, or kill count.

## site_results.csv

Append a row **the moment a receipt appears**, with `verdict=PENDING` if the score is not in yet. Update that same row when the score arrives (`KEEP` / `LOSS` / `TIE`).

Columns: `submitted_et`, `build_id`, `commit_sha` (full 40 characters when known), `parent_sha`, `champion_score_at_time`, `site_score`, `scorer_version` (`builders-3` before 01:00 ET Sun Nov 22, `builders-4` after), `record_or_points` (raw points/games if known, e.g. 182/48), `receipt_id`, `pr_url`, `change_summary` (one line), `idea_family`, `verdict` (`KEEP` / `WIN` / `LOSS` / `TIE` / `BASELINE` / `REJECTED` / `PENDING`, optionally with a scorer suffix such as `LOSS builders-4 (3.49 < 3.75)`), `notes`.

Official gains are computed only within the same `scorer_version`. The current promotion bar is the highest confirmed builders-4 score in `pipeline/data/champion.json` (P48 3.75, BB-5727119F). P48's builders-3 4.44 (BB-94897D91) is history only. A `REJECTED` receipt (no score) is terminal and must never be treated as queued.

`parent_sha` is the commit the change was measured against (usually the then-champion bot), not necessarily `git` first-parent of a docs-mixed main tip.

## screens.csv

Append one row per seed set when a screen is run. Builders put the rows in the PR (and may leave a draft at `/workspace/tester/pending_screens.csv` on the box until they are allowed to push to main). Columns: `build_id`, `commit_sha`, `seed_set`, `games_changed`, `better`, `worse`, `sim_delta`, `sim_se`, `kills_base`, `kills_build`, `died_lt40_base`, `died_lt40_build`, `laser_by30_base`, `laser_by30_build`, `source`.

A screen never overrides a site score.

## ideas.md

Check this before starting a build so a dead idea is not recycled. Status is `alive` (a keep in the champion stack, or a pending site test), `dead` (site-tested, did not beat the then-champion; do not rerun without a genuinely new mechanism), or `untested` (including queued and deferred work).

## Real-match recordings (box, not in git)

Raw practice-site recordings and indexes live on the shared box only. They are not committed here (size, and they can name other teams). Link them from this file so nothing is lost.

- **Raw recordings:** `/workspace/watch/stream/<MMDD-HHMM>/{live,state}.jsonl` (20-minute chunks; folder names are UTC timestamps), plus older `/workspace/watch/recordings/*.jsonl` and `/workspace/live*.jsonl`.
- **Indexes** (refreshed on the watcher's check): `/workspace/watch/index/recordings.csv` (one row per raw file: path, bytes, time ET, matches inside), `/workspace/watch/index/matches.csv` (one row per complete match: id, kind, seed, winner, source file), `/workspace/watch/index/games_raw.csv` (one row per mech per complete match). As of Sat Nov 21, 12:40 PM ET: 118 raw files, 125 complete matches, 2000 mech rows.
- **Pipeline:** `/workspace/watch/pipeline/{events,derived}.jsonl`, `/workspace/watch/pipeline/summary.json`.
- **Summaries:** `/workspace/watch/findings.md`, `/workspace/watch/ladder.md`.
- **Regenerate:** `/workspace/watch/update.sh && /workspace/venv/bin/python /workspace/watch/ladder.py && /workspace/venv/bin/python /workspace/watch/index.py`.

Do not copy other teams' names, handles, or repo names from those files into this public repo.

## Gaps still open (do not fill with guesses)

These were unresolved when this directory was first landed (Sat Nov 21, 12:45 PM ET). Leave them blank in the CSVs until a primary source appears.

1. The 11:57 AM ET receipt check said **seven different commits** scored exactly 3.79 (182/48). Only five are named in the written record: B80 `28c3acc…` (BB-78A44AAF), B86 `b93ae6d…` (BB-7A43732D), B92 `a941607…` (BB-ECD38FB6), B51 `ba84a1a…` (BB-2FD05CB0), UF100 `3ee37ca…` (BB-D7178316). The other two commits are unknown here.
2. `record_or_points` is blank for every non-3.79 score. Only 182/48 is documented (all exact 3.79 ties share it, per that receipt check and `coord/audit/diego-state-2026-11-21-1200.md`).
3. B101's recorded commit `6ff9f47` is not on origin remotes, so the full 40-character SHA is unknown.
4. The public track page was fetched without login and has no per-receipt `commit_sha` or receipt list. Site receipts could not be re-enumerated from the page.
5. Early Friday builds have no 192-game paired screens (the paired method started after B23).
6. Paired sim Δ vs the then-champion is missing from `tester/results.txt` for B48 and B60.
7. PR #94 (B103) reports games changed as 16 (2 / 5) and 14 (6 / 3); those counts were copied as written, not "corrected."
8. `/workspace/tester/pending_screens.csv` was not present when this directory was created.

Sources used for the backfill: `coord/research/site-submissions.csv`, `EXPERIMENTS.md`, `coord/log.md`, `coord/RESEARCH.md`, `coord/research/site-corr-2026-11-21.txt`, PR bodies (`gh pr list --state all`), `/workspace/tester/results.txt`, `/workspace/tester/site_scores.txt`. `coord/research/site-submissions.csv` stops at B94 (8:50 AM ET); B26, B51 and UF100 were recovered from the log and EXPERIMENTS.
