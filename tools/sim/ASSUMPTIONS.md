# Local practice sim: what is real and what is assumed

`tools/sim` is our model of a practice match, not the organisers' engine. The kit ships no engine and no house-bot
code, and practice returns only an aggregate score. Use the sim to rank builds, not to predict a score. The
calibration numbers are in the pull request that added this folder.

```sh
bun tools/sim/run.ts --bot <path/to/bot.ts> --seeds 48 --out sim.csv   # [--jobs N] [--kit <mechfight-kit dir>]
SIM_TRACE=1 bun tools/sim/run.ts --worker --bot bot.ts --seed-list 1000   # one match, a status line every 5 s
```

Seeds are fixed: `1000 .. 1000+N-1`. The same bot on the same seed gives the same match (checked: three runs of 16
seeds with different job counts gave identical rows), so two builds can be compared seed by seed. The kit is looked for at `--kit`, `$MECHFIGHT_KIT`, `/workspace/mechfight-kit`, then
`../mechfight-kit` next to the repo.

CSV columns: `seed, slot, place, score (16 - place), death_t, killer, killer_weapon, kills, damage_dealt,
damage_taken, cubes, upgrades, weapons, house_dead, hunters_at_end, our_gun_shots, our_gun_hits, house_gun_shots,
house_gun_hits, decisions, missed, late_over_50ms, bot_ms_mean, bot_ready`.

## Taken from the kit (not assumed)

- Every rule number comes from the `hello.config` of the kit's recorded match (`check/stream.jsonl.gz`, first
  line), sent to the bot unchanged: mech, weapons, vision, sound, cubes, crates, loot, npc, drops, zone, upgrades.
- The map is `arena/v2/world.json` and `terrain.i16`. Prisms are rasterised on the 1 m terrain grid.
- Protocol: `hello`, `ready`, one `obs` per decision (every 2 ticks of a 20 Hz sim, so 10 Hz), an action echoing
  `tick`, then `end` and stdin closes. The observation carries every field of protocol §6.
- Implemented as written in protocol §7 to §10: acceleration, walls and sliding, step-up, jump and jet, energy;
  HP regen after 5 s without dealing or taking damage; rear armor; armor; gun (spread, magazine, reload), mortar
  (ballistic shell, direct hit, splash, concussion, self damage), laser (charge, minimum charge, hold, cook-off),
  lightning (cone, chain, energy, short); NPC drones; crates; weapon take, swap and drop; cubes, size growth and
  upgrade offers; supply drops; the six-phase zone and its damage; vision (near range, 120° wedge, 5 s memory)
  and sound (range, bearing noise, near/mid/far).
- Placement: the match stops when our bot dies and its place is the number of mechs alive at that moment. If it
  outlives every house bot it is 1st; at 8:00 survivors are ranked by HP.

## Assumed about the world

| Topic | Assumption |
| --- | --- |
| Spawns | Uniform on open ground inside 0.8 of the first circle, at least 130 m apart, 30 m from the map edge. Our slot and the house tiers are shuffled by the seed. |
| Zone centres | Each next centre is uniform in the disc that keeps the next circle inside the current one, clamped 60 m inside the map. |
| Crates, drones, floor loot | Uniform on open ground inside 0.9 of the first circle; the roof share lands on a random roof 4 to 45 m high. |
| Supply drops | Land on open ground within `drops.spread` of the next circle's radius. House bots do not contest them. |
| Trees | Ignored: they block neither sight nor shots. The real server lets canopy block sight, so real hiding is a little better. |
| Geometry | One base and one top per 1 m cell (stacked prisms merge). The mech collides at its center and 8 points on its radius. The 50° slope limit is not modelled, only the 1.2 m step. Roof-edge sliding and eave rules are not modelled. |
| Mortar direct hit | The target takes `damage` plus full splash. |
| Lightning cone | Within `cone_deg` on either side of the aim yaw. |
| Drones | Aim without lead, fire inside 120 m with a clear line, stop 35 m from their target, walk through nothing solid. |
| Beams and projectiles in `obs` | A beam is listed when we see its shooter or it ends within near range. Projectiles follow the normal sight rule. |
| Bot timing | The sim waits up to 2 s for an answer instead of 50 ms, so machine load does not change results. Answers over 50 ms are counted in the CSV (`late_over_50ms`). |
| Same-tick deaths | Share the best of their places. |

## Assumed about the house squad

The track rules say: 15 house bots (4 easy, 4 medium, 4 hard, 3 expert), one squad sharing vision, never fighting
each other, hunting the weakest first, one early, more as they are thinned out, all of them late. Everything
below fills in what the rules leave open. All numbers are in `tune.ts`.

| Topic | Assumption |
| --- | --- |
| Target | We are the only non-house mech, so we are always "the weakest". |
| Friendly fire | House shots pass through house bots; lightning never arcs to them; their mortar splash skips them. |
| Shared vision | When any house bot sees us, all know our position. Our gunfire within 320 m of any house bot gives it away to within about 12 m. A hunter that reaches a stale position is told where we are. At t = 0 the squad knows our spawn. |
| Hunter count | `1 + 1 per dead house bot + 1 per 75 s from 75 s`; every bot from 240 s or once 8 or fewer are left. Hunters are the house bots nearest our last known position and stay hunters. |
| Non-hunters | Take the nearest ground weapon for an empty slot, then shoot ground crates and drones inside the next circle and walk over cubes, else wander inside the next circle. They fight back for 10 s when we hit them, and fight us when they see us inside their tier's `engageR`. They take random upgrades. |
| Movement | Walk on a 4 m grid with A* (walls widened by 3 m), ground level only: no roofs, no jumping. Everyone leaves for the next circle in time. |
| Fighting | Close to the tier's `prefRange`, then strafe, changing direction every 1.2 to 3 s. Gun inside 140 m. Laser charged fully and released when lined up. Lightning inside its range. Mortar between 25 and 180 m on the low arc. No retreat at low HP. |
| Aim | Perfect linear lead plus a Gaussian error held for 0.4 s. |

Tiers (`tune.ts`):

| Tier | Aim error σ | Reaction | Closes to | Fights when not hunting inside | Strafes | Boosts to chase |
| --- | --- | --- | --- | --- | --- | --- |
| easy | 11.5° | 1.2 s | 85 m | never | 30% | no |
| medium | 8° | 0.8 s | 75 m | 30 m | 60% | no |
| hard | 6° | 0.5 s | 65 m | 45 m | 85% | yes |
| expert | 4.3° | 0.25 s | 55 m | 60 m | 100% | yes |

## Calibration from the recordings

Source: 9 complete public matches in `/workspace/watch` with 1 to 3 humans and 13 to 15 house bots
(`house:expert`, `house:probe-*`). These are free-for-alls where house bots kill each other. They are not the
practice squad, and their bot names are not the practice tiers.

| Measured in the recordings | Value | Used for |
| --- | --- | --- |
| House gun hits on mechs per shot not spent on a drone or crate | 0.50 to 0.56 (expert, red-best, red-honest), 0.20 to 0.21 (astra) | Upper and lower anchor for aim error |
| Distance of house gun hits on mechs | median 50 to 68 m, 90th percentile 95 to 108 m | `prefRange`, `gunOpenM` |
| Distance of house lightning hits | median 30 to 40 m | lightning use inside its range |
| First weapon picked up by a house bot | median 3 to 7 s, 73% to 92% of bots | non-hunters fetch a weapon first |
| Closest pair of spawns | minimum 131 m, median 151 m | spawn separation |
| Regen (from `rca_replay.ts`) | starts 5.00 s after the last hit, 45 HP/s | regen rule |

Not calibrated, because nothing measures it: which tier is which, how fast the practice squad adds hunters, how
house bots dodge, whether they retreat, and how they find us.

## What was tuned, and to what

Only global numbers in `tune.ts`, and only to the average of the six real scores, never to one commit:

1. First run: house aim error σ 9 / 6 / 4.5 / 3.3°, 2 extra hunters per house death, `engageR` 0 / 45 / 70 / 100 m,
   a hunter every 60 s. One build averaged 1.38, far under the real 2.1 to 2.5.
2. Extra hunters per death 2 to 1, and `engageR` to 0 / 30 / 45 / 60 m. Six-commit average 1.51 (real 2.35).
3. Aim error σ times about 1.3, and time hunters every 75 s from 75 s. Six-commit average 2.31 (real 2.35). This
   is the committed setting.

Rank correlation (Spearman) between sim and real over the six commits: 0.61 after step 2, 0.58 after step 3. With
six points neither is statistically distinguishable from chance. What the sim did get: the two farm builds
(`8f2c7c8`, `c2e7f60`) rank above the other four. What it missed: the order of those two, and the nav regression
`8bfc89e` (real -0.28, sim +0.02).

The aim error after step 3 is wider than the public recordings suggest for the best house bots. That is a level
fit, not a measurement.

## Known gaps

- In the sim our gun hits about 80% of its shots, because house bots strafe predictably and never jump. In the
  public recordings the human-slot bots hit 23%. Our real hit rate in practice is unknown.
- Nothing here reproduces a nav bug that depends on the real collision rules (roof edges, eaves, slopes).
- 48 matches give a standard error of about 0.2 on a mean, and the real builds differ by 0.03 to 0.44. Compare
  builds seed by seed (same seeds, paired difference), and treat a paired difference under about 0.3 as noise.
