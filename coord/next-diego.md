# next-diego.md

Diego: research only (light use, every few hours), with your own AI subscriptions. No bot code. See `coord/WORKFLOW.md`.

**How to hand in research:** follow `research/intake/README.md`. It has the reusable prompt to paste into any AI and the required JSON format. Drop the JSON (plus optional markdown notes) in `research/intake/` via a PR on branch `research-YYYYMMDD-HHMM`. Grok ingests it with `python3 pipeline/q.py ingest-research` (validated, deduplicated, stored as unverified `research_claim` evidence).

Before researching, see what's already tested so you don't re-propose failures: `python3 pipeline/q.py brief` and `python3 pipeline/q.py tested <keyword>`.

Current priorities from your 11:05 PM handoff (P0 to P4) are hypotheses HYP-018 to HYP-022 in `pipeline/data/hypotheses.jsonl`. Most useful next: top-10 teams' public repos (weapon/upgrade order, target choice, cover, farming), and anything that explains why Build 6 (cover) and Build 7 (gun range) lost.

Every push includes a new entry at the bottom of `coord/log.md` (format at the top of that file), and every PR description repeats it.
