# Watcher per-mechanic Top-16 analysis

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.38 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.


This folder is the research input added to the locked workflow chart on Sat Nov 21, 3:27 PM ET (Doug confirmed), with situational slices (3:29 PM ET) and opponent-state plus protocol observability (3:31 PM ET).

It does **not** submit to the site, change bot code, or open PRs. Ranked behaviors go to the sim first, and only a sim pass that keeps drop-run performance and end-game survival can enter the queue. The site score remains the only keep/close truth.

## What's in here

| File | Contents |
| --- | --- |
| `STATES.md` | State buckets, minimum n, and what the bot can actually observe |
| `movement.md` / `.csv` | Speed, boost, jet, stuck, strafe |
| `aggression.md` / `.csv` | When fights start and continue, including enemy HP / loadout / busy |
| `evasion.md` / `.csv` | Retreat, facing, rear hits, 2v1 proxy, cover under fire |
| `drops.md` / `.csv` | Drops and crates (see also the already-tested drops family) |
| `zone.md` / `.csv` | In / edge / outside as the circle shrinks |
| `cover.md` / `.csv` | Building cover and hold |
| `loadout.md` / `.csv` | Weapons, cubes, upgrade counts and timing |
| `final_circle.md` / `.csv` | r ≤ 70 entry and play |
| `*_slices.csv` | The situational high-vs-low numbers behind the markdown tables |
| `RANKED.md` | State-conditioned IF-THEN rules, ranked for *our* site score, with observability and family overlap |
| `SKILLS.md` | Opponent-independent skill patterns (movement, aim, pickups, position); refreshed with the same cache |
| `teams.csv` | T01–T16 means and sample sizes (no real team names) |

Raw `live.jsonl` / `state.jsonl` recordings are **not** in this repo. They live on the box under `/workspace/watch/stream/` and `/workspace/watch/recordings/`.

## How teams are labeled

T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement (T01 is the best mean). Real team names stay on the box (`/workspace/watch/mechanics/cache/teams.json`) and must not be copied into this public repo.

## How to refresh (on the box, after new recordings)

```bash
# optional: rebuild findings/index first
/workspace/watch/update.sh
/workspace/venv/bin/python /workspace/watch/index.py

# per-mechanic cache + these files (nice, so it shares the machine)
nice -n 10 /workspace/watch/mechanics/refresh.sh --repo-out /path/to/mech-bot/coord/data/watcher
```

`refresh.sh` is incremental: if the live-file signature is unchanged, the heavy parse is skipped. It does not start a recorder, does not commit, and does not submit. Do not run it automatically every 15 minutes from `update.sh` (it is heavier than findings.md).

## Methods in brief

- Corpus: complete Top-16 showdown matches only. Public matches are counted in the extractor log and left out of the tables.
- Samples: 1 Hz from `live.jsonl` frames (tick_hz usually 20, frames usually every 0.1 s).
- Cover / building LOS: official kit `world.json` building + stadium prisms, same 12 m / hold ≤ 2 m/s proxy as `findings.md`. Trees are not cover.
- Visibility proxy: protocol `near_range` 45 m or `range` 200 m inside a 120° yaw FOV, with building LOS. Memory (5 s) and canopy are not in the proxy.
- Engagement: a hit given or received between two mechs in the last 2 s.
- Aim convention: `atan2(dy, dx)` vs stream `aim_yaw`. A median residual is stored in the cache meta; front/rear uses the protocol's 180° torso front arc.

Champion behavior cited here is from P34 lethal laser release (`0e6fadd1a30db4ee30c26114b8198f63d782b7c9`, merged `8c130ad7f0c81acb03508c40f20c31867f29d358`, champion.json `588557e`), site 4.38 (`BB-ABEB42BF`), built on P29 midring settle (`2e1d03615f6e8faa7097ffcbd441be43b234c5b9`, site 4.35), as read from `params.ts` and `brain.ts` on that commit. We do not invent site deltas; expected impact is a reasoned direction only, and the sim + site decide.
