# Next for Diego

Written by Grok, the coordinator (see `GROK_BRIEF.md`); committed here at Doug's request. Do the manual steps yourself first. Paste only the "For your Claude" section into your Claude.

## Manual steps (do these first)

1. **Submit Build 2 by 11:00 PM ET.** The commit is `main` @ `4726cfc` (PR #6). Before you submit, run the offline gate once with bun and the Docker flags in `research/protocol.md` §1 (Doug could not; plan §5 requires this once before Build 3). If that gate fails, do not submit — log the failure in `coord/log.md` and stop.
2. When the practice score is back, add a row at the top of the table in `EXPERIMENTS.md` (time, commit `4726cfc`, params, score, hypothesis, keep/revert using the plan's +1.2 / −0.6 rule) and append a `coord/log.md` entry in the format at the top of that file.
3. **S3 (~midnight):** resubmit the **identical** Build 2 commit `4726cfc`, unchanged (plan §3 and D7). Log that score the same way. Do not submit a later `main` if PR #5 or anything else has landed in between — S3 must be that exact commit. Do not submit two different changes at once.
4. On the Mech Royale track page and team page, try to close plan §6 **Q2** (are match replays public?) and **Q3** (does the leaderboard keep the latest or the best, and which goes to the final?). Put whatever you find in `coord/log.md`.

## For your Claude

Read `AI-Structure-Development.md` and `coord/log.md` in `dmclaughlin-bit/mech-bot` before starting.

Your task is to get PR #5 (`nav`) onto `main` so Doug can start Build 3 wiring, then commit the coordinator prompts. Branch: `nav` (already open as PR #5).

You may change only files you own in plan §4: `nav.ts`, `tools/`, `EXPERIMENTS.md`, `AI-Structure-Development.md`, plus append-only `coord/log.md` and the `coord/next-*.md` files Grok writes. Do not edit `brain.ts`, `bot.ts`, `map.ts`, `params.ts`, or `Dockerfile`.

1. Rebase `nav` onto current `main` (`4726cfc`). The expected conflict is `coord/log.md`. Keep both entries and leave them in chronological order: Fri 20:30 ET nav, then Fri 20:45 ET Build 2. Do not drop either entry.
2. Do not add jump/jet edges or other nav behavior in this rebase. Merge the ground module as reviewed in PR #5. If the rebase needs anything beyond the log resolution to stay green, stop and log it.
3. Merge PR #5 once the rebase is clean. Doug has already said the PR looks good; you own the files, so you merge.
4. Commit Grok's latest `coord/next-doug.md` and `coord/next-diego.md` verbatim.

Done when: PR #5 is merged to `main`, `nav.ts` and `tools/nav-bench.ts` are on `main`, both log entries are present in order, and the two next-prompt files are updated. Target: **rebase and merge tonight, well before 11:00 PM ET**, so Doug is unblocked. No other coding task tonight (no jet edges, no scenario harness). After the manual S3 score is in, you can update plan §1 (it still says Build 1 and no submissions) in a small follow-up if you have a free slot.

Every push includes a new entry at the bottom of `coord/log.md` (format at the top of that file), and every PR description repeats it.
