# Idea records (`coord/data/ideas/<id>.json`)

Doug approved this as the canonical record on Sat Nov 21, 6:46 PM ET (D1). One file per idea. **Record first (D2):** create the record, at stage `idea`, before a build starts. Chat is only a notification. Grok is the writer of `stage` and `owner`.

Other files (`site_results.csv`, `screens.csv`, the READY ledger, `pipeline_view.json`) stay in use; they should be generated from, or kept consistent with, these records over time. Until that generation is complete, a value in a record must still be copied from a primary source. Never invent a number: use `null` or `"unknown"`.

## Schema

```json
{
  "id": "P27",
  "title": "one-line description of the idea",
  "family": "drops",
  "flags": ["DROP_CROSSFIRE_SKIP_ON"],
  "flag": "DROP_CROSSFIRE_SKIP_ON",
  "behaviors": ["one sentence, only if a source lists distinct behaviors"],
  "owner": "Mech Builder",
  "stage": "ready",
  "pr": 137,
  "sha": "full 40-character commit, or null",
  "champion_sha_tested_against": "full 40-character champion SHA, or null",
  "screens": [
    {
      "sha": "exact SHA screened",
      "seed_set": "2000+3000",
      "fired": 11,
      "diff_behavior": 11,
      "diff_score": 6,
      "pins": "text from the screen source, or null",
      "verdict": "PASS",
      "source": "coord/data/screens.csv or a PR comment URL",
      "sim_delta": -0.010,
      "sim_se": 0.029
    }
  ],
  "receipt": "BB-… or null",
  "site_score": 4.17,
  "decision": "KEEP / CLOSE / READY / HOLD / …",
  "blocker": "why it cannot move, or null",
  "next_action": "who does what next, or null",
  "doug_waiver": false,
  "source": "where the idea came from",
  "timestamps": { "pr_opened": "2026-11-21 17:56 ET", "updated": "2026-11-21 18:55 ET" },
  "sources": ["paths or URLs every value was copied from"]
}
```

`flag` and `champion_sha` (and `score`) are aliases of `flags` (when there is one flag), `champion_sha_tested_against`, and `site_score`, so a short loop stub stays readable.

## Stages

`idea` | `building` | `screening` | `ready` | `hold` | `submitted` | `scored` | `retired`

- `idea` — recorded, not yet being built (includes researched, unassigned queue items).
- `building` — a builder is implementing it.
- `screening` — a SHA exists and a screen is running or due.
- `ready` — complete both-set screen of this exact SHA vs the current champion, and the ledger marks it READY.
- `hold` — stopped pending a person decision or a missing gate.
- `submitted` — on the site, score not in yet.
- `scored` — has an official site score (KEEP, CLOSE, or TIE).
- `retired` — will not be submitted (veto, parked, superseded, measurement with no build).

## `doug_waiver`

Default `false`. Only Doug, in his own words, can set this to a dated waiver so a build that lists more than one flag or behavior may still be eligible (D3).

## Backfill

The first backfill covers every official site submission since 12:00 PM ET Saturday Nov 21, open PRs #136 (P25 / P25b), #137 (P27), #138 (P26), #139 (P-D-011), #140 (P-D-010), and the items in `ideas_queue.md` and `ready_ledger.md`. Values came from `site_results.csv`, `screens.csv`, those two markdown files, and PR bodies or comments (`gh`). A field with no such source is `null`.
