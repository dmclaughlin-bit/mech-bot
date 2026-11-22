# Situational state buckets

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.38 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.


Generated 2026-11-21 21:29 ET. These buckets are applied at every 1 Hz sample for every labeled mech that is still alive. Conclusions require at least 8 matches and 200 ticks in the bucket (and at least 12 mech-matches). Smaller buckets are still printed, marked `small n — no conclusion`.

T01–T16 are the 16 teams with at least 20 complete showdown games, ranked by mean placement. Teams with fewer games are omitted from the labels because their means are too noisy; they are not named in this repo.

## Own and match state

| Dimension | Buckets | Source |
| --- | --- | --- |
| Phase | `early` (zone phases 0–1, r=560 and the shrink to 380), `mid` (phases 2–3, r=240 and 140), `late` (later phases while r>70), `final` (r≤70) | Zone schedule in the recording header plus current radius |
| Zone size | `r_gt_400`, `r_200_400`, `r_70_200`, `r_le_70` | Current radius |
| Distance to edge | `center` (d/r < 0.40), `midring` (0.40–0.85), `edge` (≥0.85 and still inside), `outside` | Our position vs current circle |
| Mechs alive | `alive_13_16`, `alive_9_12`, `alive_5_8`, `alive_2_4` | Count of living mechs in the frame (same idea as `obs.alive`) |
| Nearby (80 m) | `near80_0`, `near80_1`, `near80_2plus` | Omniscient count; the bot only knows about visible / remembered / heard enemies |
| Engaged | `eng_0`, `eng_1`, `eng_2plus` | Unique mechs we hit or were hit by in the last 2 s (Watcher-omniscient) |
| Own HP frac | `hp_ge_90`, `hp_50_90`, `hp_30_50`, `hp_lt_30` | Stream HP/max. Thresholds line up with heal-until-90%, half HP, and champion retreatHp=0.3 |
| Energy | `en_ge_80`, `en_30_80`, `en_lt_30` | Stream energy (starts at 100). This is stamina for boost/jet/lightning |
| Loadout | `gun_only`, `laser`, `lightning`, `laser+lightning`, plus mortar variants | Slots in the frame |
| Cubes | `cu_0`, `cu_1_2`, `cu_3_9`, `cu_ge_10` | Stream cubes (upgrade thresholds are 1, 3, 6, 10, 15, 21, …) |

## Opponent state (nearest enemy, and nearby counts)

| Dimension | Buckets | In the Watcher? | In our bot's observation? |
| --- | --- | --- | --- |
| Nearest distance | `d_lt_45`, `d_45_90`, `d_90_160`, `d_160_200`, `d_ge_200` | Always | Yes if that enemy is in `obs.mechs` or still on the 5 s position-memory track; otherwise no (sounds give a band only) |
| Nearest visible (protocol proxy) | `nearest_visible`, `nearest_hidden` | Computed: 45 m any direction or 200 m inside a 120° torso FOV, building LOS, **no** tree/canopy model and **no** 5 s memory | This is the implementable visibility test (memory not applied in the proxy) |
| Nearest HP | same HP buckets as ours, or `none` | Always | Yes, on currently listed `obs.mechs`, if `hello.config.vision.show_enemy_hp` is true. Our champion already uses enemy HP for TTK, so this is on in practice. Not available for unseen mechs |
| Nearest loadout | same labels as ours | Always | Yes, `ActorObs.weapons` while listed in `obs.mechs`. `charging` is also exposed for a laser telegraph |
| Nearest energy | recorded in the cache | Always | **No.** Enemy energy is not in `ActorObs`. Rules that need it are not implementable; use a proxy or drop them |
| Nearest cubes | recorded | Always | Yes, `ActorObs.cubes` while listed. This is a rough stand-in for upgrade *count*, not which upgrades they took |
| Enemy upgrades (which ones) | not extracted as a per-tick opponent field | Upgrade events exist in the stream | **No.** There is no enemy upgrade list in the observation |
| Enemy already fighting someone else | `enemy_busy` / `enemy_free` | Hits among other mechs in the last 2 s | **Not a field.** Proxy: visible HP dropping while we did not hit them, a visible beam/projectile, or a second visible mech in the fight. Sounds have no id |
| Nearby laser holders / low-HP enemies within 80 m | counts in the tick cache | Always | Only the ones we can currently see (or maybe remember) |

`obs.alive`, the zone, and all called supply drops are always known. `obs.events` tell us when *we* were damaged (`bearing`, `by`, `rear`) or when *we* hit someone.

## High vs low

Comparisons are T01–T04 vs T13–T16 on the same bucket, with Cohen's d, tick counts, and match counts. We do not treat a large d in a tiny bucket as a finding.

## Refresh

See README.md. Re-running the extractor rebuilds the 1 Hz cache from complete showdown `live.jsonl` files; this document's bucket definitions live in `mechanics/lib.py`.
