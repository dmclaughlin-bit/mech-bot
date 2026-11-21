# Research intake (Diego → pipeline)

File-based, no API needed. Run your research anywhere (your own AI subscriptions), then drop **one JSON file per session** here via a PR:

```
research/intake/diego-YYYY-MM-DD-HHMM.json     (required, machine-readable)
research/intake/diego-research-HHMM.md         (optional, your long-form notes)
```

Open a PR on branch `research-YYYYMMDD-HHMM` touching only `research/intake/` plus a `coord/log.md` entry. Grok merges it and runs `python3 pipeline/q.py ingest-research`, which **validates** every finding against `pipeline/schemas/research_finding.json`, **dedupes** (hash of normalized claim + source refs, so re-sending is harmless), assigns `EV-R-NNNN` IDs and stores them in `pipeline/data/evidence.jsonl` as `research_claim`. Invalid findings are reported as `REJECT file[i]: reason` and skipped; the rest still go in. Research claims are never treated as proven mechanics: only a practice score turns an idea into `validated` evidence.

First real intake: `diego-research-1105.md` (Fri 11:05 PM ET), with its concrete claims in `diego-2026-11-20-1105.json` (EV-R-0007 to EV-R-0019).

## Reusable research prompt (paste into any AI)

```
You are a research analyst for a Mech Royale battle-bot team (repo: github.com/dmclaughlin-bit/mech-bot, public).
Read AI-Structure-Development.md, coord/WORKFLOW.md, coord/learnings.md, EXPERIMENTS.md, research/protocol.md and brain.ts.
Then run `python3 pipeline/q.py brief` if you can (or read pipeline/data/experiments.jsonl and hypotheses.jsonl)
so you know what has already been tested and failed. Do not write bot code.

Goal: ideas that raise our PRACTICE score (average placement, 48 fixed seeds vs a coordinated house squad;
the final is a free-for-all on new seeds). Investigate:
 1. strategy_mechanics     - competitive strategies and game mechanics (protocol, hello.config, scoring)
 2. top_team_behavior      - what top teams do that our watcher stats may not explain (read top teams' public repos; ideas only, no copying)
 3. resource_upgrade       - cubes, crates, drones, supply drops, upgrade order
 4. our_weakness           - concrete weaknesses in our current brain.ts / nav.ts / map.ts
 5. untested_opportunity   - ideas not yet in hypotheses.jsonl
 6. contradiction          - evidence against our assumptions, or why a past experiment failed

Rules: one claim per finding; cite a source for every claim (repo URL + file/line, doc section, or watcher file);
mark guesses with "is_guess": true; never invent numbers or match results; keep "verification": "unverified".
Output ONLY one JSON object in the format below (no prose around it).
```

## Required JSON format

Top level: `{"author", "submitted_at", "findings": [ ... ]}`. Each finding:

| field | required | type / values |
|---|---|---|
| `claim` | yes | string, ≥10 chars, one claim |
| `topic` | yes | `strategy_mechanics` \| `top_team_behavior` \| `resource_upgrade` \| `our_weakness` \| `untested_opportunity` \| `contradiction` |
| `sources` | yes | ≥1 of `{"ref": "...", "kind": "repo\|doc\|protocol\|video\|leaderboard\|watch_stream\|other", "quote": "..."\|null}` |
| `confidence` | yes | 0–1 |
| `suggested_change` | yes | string (one single change) |
| `is_guess` | no | bool |
| `verification` | no | `unverified` (default) \| `verified` \| `refuted` |
| `mechanism` | no | why it should raise the score |
| `expected_gain` | no | 0–3, estimated practice-score delta (a guess) |
| `effort` | no | 1–5 |
| `regression_risk` | no | 0–1 |
| `failure_classes` | no | list of `{"class": NAV_COLLISION\|NAV_STUCK\|NAV_BAD_ROUTE\|ZONE_LATE\|MULTI_ENEMY_TRAP\|COVER_FAILURE\|REGEN_RESET\|OVER_AGGRESSION\|UNDER_AGGRESSION\|AIM_WEAPON\|RESOURCE_TRAP\|COMPUTE_FAILURE\|UNKNOWN, "confidence": 0–1, "basis": "..."}` |
| `related_rule_ids`, `related_experiments`, `contradicts`, `keywords` | no | string lists (e.g. `["F4"]`, `["EXP-0005"]`, `["EV-W-D-showdown-gun_gt100_pct"]`) |
| `sample_size` | no | integer |

Example:

```json
{
  "author": "Diego",
  "submitted_at": "2026-11-21T09:30:00-05:00",
  "findings": [
    {
      "claim": "Team X's bot only opens crates when no enemy has been seen for 5 s.",
      "topic": "top_team_behavior",
      "sources": [{"ref": "https://github.com/teamx/bot/blob/main/brain.ts#L120", "kind": "repo", "quote": "if (lastSeen > 5) openCrate()"}],
      "confidence": 0.6,
      "is_guess": false,
      "verification": "unverified",
      "suggested_change": "Gate crate farming on no enemy seen for 5 s",
      "mechanism": "Farming without being interrupted grows cubes safely",
      "expected_gain": 0.2,
      "effort": 2,
      "failure_classes": [{"class": "RESOURCE_TRAP", "confidence": 0.3, "basis": "we farm under fire"}],
      "keywords": ["crate", "farm"]
    }
  ]
}
```

Check your file before the PR: `python3 pipeline/q.py ingest-research --dir research/intake` on a scratch copy (`PIPELINE_DATA_DIR=/tmp/x` after copying `pipeline/data` there) prints ACCEPT / REJECT per finding.
