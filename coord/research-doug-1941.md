# Research run: early laser, first fight, upgrades, public repos (rerun on the 4.17 champion)

Sat 2026-11-21 7:41 PM ET, Doug's Claude, branch `research-doug-20261122-0041` (the branch name is UTC; file names are ET). No bot code changed.

## Read this first

- **The prompt's context is a day old.** It names Build 14 (2.88) as champion and quotes "laser by 30 s in 77% of winners vs 26%, d=1.17". The champion is now **B113 at 4.17** (`coord/STATUS.md:8`). Today's ladder, on 113 showdowns, measures laser by 30 s at **56% vs 33%, d=+0.47, low confidence** (`/workspace/watch/ladder.md:56`). The same four questions were already answered in `coord/research-doug-0040.md` (PR #30, merged). This run re-measures them on a corpus about five times larger and checks each answer against the 56 site results recorded since then (`coord/data/site_results.csv`).
- **Early laser: settled.** The fix 0040 proposed for Build 8 (ARM-UP) shipped as **B17 and gained +0.42** (3.08 → 3.50, `site_results.csv`, B17 row). Of the eight later early-laser variants: three tied (B36, B74, UF100) and five lost (B40, B32, B39, B64, B45). UF100 raised our sim laser-by-30 s from 58 to 82 of 192 games and still tied on the site (`coord/log.md:409`). Opening tweaks are a dead family (`coord/STATUS.md:57`). The laser gap that remains is **late**: winners almost always have a laser by the end (94% vs 34%), and 30 of their 45 lasers taken after 30 s were weapons another mech dropped.
- **Kills come late.** In 93 showdowns, winners make **2.51 kills per game after 120 s, against 0.68 in the first 60 s**. **58%** of those late kills are laser kills. This agrees with STATUS's "most useful research now: mid/late kill sources" (`coord/STATUS.md:60`).
- **First fights** (1,856 showdown first engagements; 0040 had 222): the strongest observable predictors are landing the first hit, holding a laser, and opening on a target that is already hurt. Strafing speed makes no difference.
- **Upgrades:** 0040's reorder was built as B21 and lost 0.04 (`coord/log.md:313`). Keep the current order. I give an inferred reason below.
- **Top 3 next builds:** none of them is an opening or early-laser change. See [Ranked next builds](#ranked-next-builds).

## Evidence and limits

- **Corpus:** every complete match in `/workspace/watch/stream/*/live.jsonl` plus `/workspace/watch/recordings/`, deduplicated by (showdown id, seed). That gives **120 complete showdowns (1,888 spawns) and 77 public matches (1,232 spawns)**. Kill sources come from the Watcher cache `/workspace/watch/mechanics/cache/` (93 complete showdowns, `meta.json`).
- **Scripts and raw output:** `/workspace/watch/research-doug-1941/`. That folder holds `q1.py`, `q1b.py` and `q2.py` (0040's scripts with a streaming loader so the full corpus fits in memory), plus `killsrc.py` and `dropsrc.py`, each with an `.out` file. The scripts stay off the repo because the recordings and team names are not committed. Every number marked MEASURED is in one of those `.out` files.
- **Proxy limits (unchanged from 0040):** showdowns are team-bot free-for-alls, not the practice house squad. Our bot is in no recording (`/workspace/watch/ladder.md:7`). Statements about why one of our builds won or lost are INFERRED. Site scores are deterministic for the same code: B2 and its identical resubmit S3 both scored 2.17 (`site_results.csv`). A small loss is therefore real on the 48 practice seeds, though not necessarily on new seeds.
- **Team names** follow the Watcher labels T01–T16 (`coord/data/watcher/teams.csv`). No other team names or repo links appear here (`coord/log.md` 12:25 PM ET entry). The site now warns that "excessive code reuse may result in disqualification" (`coord/STATUS.md`, 6:55 PM ET loop), so section 4 lists ideas only.

## 1. Early laser

### How winners get it (MEASURED, `q1.out`, showdowns by final place)

| | winner (n=120) | places 2–4 (n=352) | places 5–8 (n=472) | bottom half (n=944) |
|---|---:|---:|---:|---:|
| Ever took a laser | **94%** | 77% | 64% | **34%** |
| Laser by 30 s, of those alive at 30 s | 57% | 46% | 39% | 33% |
| First laser take, median s (takers) | 19.1 | 16.3 | 21.8 | 8.2 |
| A ground laser within 80 m of spawn | 30% | 32% | 25% | 25% |
| Torso yaw swept in first 3 s, median | 214° | 231° | 221° | 217° |

Of the winners' first lasers taken by 30 s (68):

- **Source:** 52 lay on the floor at start, 14 came from crates they shot, 2 were dropped by another mech. None was on a roof.
- **Which laser:** 81% (42 of 52 floor lasers) were the nearest floor laser to spawn. **Winners go to the nearest one; they do not detour to a better one.**
- **Distance:** straight-line median 75.5 m (longest 206 m). Path walked median 95.7 m, and straight-line over path 0.93, so they walk almost straight to it.
- **Time:** median 6.2 s from the laser entering the view wedge to the take. Boost was used on 17% of trip frames.
- **Fights avoided:** an enemy came inside 160 m on 76% of trips (closest enemy, median 118 m). 28% took mech damage before the take and only 12% dealt any. They walk past enemies and do not stop to fight.
- **Spawn luck sets most of it.** Laser by 30 s against spawn distance to the nearest ground laser:

  | Spawn to nearest ground laser | winner | places 2–4 | bottom half |
  |---|---:|---:|---:|
  | 0–40 m | 9/9 | 36/40 | 36/42 |
  | 40–80 m | 22/27 | 58/71 | 50/89 |
  | 80–130 m | 20/30 | 31/74 | 46/125 |
  | 130–200 m | 13/25 | 23/99 | 30/170 |
  | over 200 m | 4/29 | 13/68 | 14/109 |

  The gap between groups is at 80–200 m. Our B17 trip (≤250 m, `params.ts:84`) already covers that band.

**Winners' lasers after 30 s come from kills.** Of the winners' 45 first lasers taken after 30 s, 30 were dropped weapons (`q1.out` winner rows, origin `swapdrop`). Their median damage dealt before the take is 1,285, and the closest enemy during the trip a median 40 m. A dead mech drops the laser it holds: 862 laser drops in 120 showdowns happened on the tick the holder died (`dropsrc.out`). Guns were never dropped at death. In practice the squad never fights itself, so the only lasers a house bot drops are those of house bots **we** kill.

**Lasers are not scarce.** Of 1,553 floor lasers in showdowns, 553 were taken by 30 s and 899 were never taken (`q1.out`, fate table).

### Why Build 8 failed, and what happened since

0040 (§1) diffed `beb9240` against its parent and ranked the causes. The first two hold up on the 5× corpus (`q1b.out`):

1. **Its seek almost never ran.** Replaying B8's rule on real spawns, it passes in **16% of showdown spawns (294/1,888) and 14% of public spawns (176/1,232)**. The two reasons are its in-view-only pickup list (`obs.pickups`, no memory) and its 160 m enemy gate. That gate is broken by 76–88% of all laser trips, in every finishing group.
2. **Its costs applied in every laser game:** the charge steers the torso and the trigger stays held behind cover. In later tests, laser-rush variants carrying those costs lost too: B32 pre-charge behind cover 3.48 and B40 3.23.

A full torso turn plus memory would reach a ground laser within 175 m from **49% of showdown spawns**, and a laser or lightning from 69% (`q1b.out`). That is the design B17 shipped (scan at spawn, pickup memory, ≤250 m trip, no enemy gate; `params.ts:64-84`, `brain.ts:674-705`), and it gained +0.42.

### The design for now (no new early-laser build)

- **Early acquisition is saturated on the site.** UF100 kept walking under fire and added 24 sim games with an early laser, yet tied (`coord/log.md:409`). Every later early-laser variant tied or lost (`site_results.csv`, `laser-rush` and `opening` families).
- **The open laser gap is late (94% vs 34% ever).** B80 already starts a late walk for gun-only bots (`brain.ts:681`). The part no build has targeted is **the laser a house bot drops when we kill it**. Build 3 below measures that first and builds only if it triggers often enough.

## 2. First fight

### What separates first-fight winners (MEASURED, `q2.out`, 1,856 showdown first engagements)

A first engagement is a mech's first exchange of hits with another mech, followed until 6 s pass with no hit between the pair. Outcomes: KILL (I killed it), DIED (I died during it), AHEAD or BEHIND on damage.

| | winner (n=119) | places 2–4 (n=340) | places 5–8 (n=461) | bottom half (n=936) |
|---|---:|---:|---:|---:|
| KILL / AHEAD / BEHIND / DIED | 48 / 49 / 22 / **0** | 116 / 106 / 89 / 29 | 130 / 149 / 130 / 52 | 144 / 198 / 207 / **387** |
| First hit at, median | 21.5 s | 23.8 s | 25.6 s | 13.6 s |
| I landed the first hit | **72%** | 59% | 54% | **49%** |
| Range at first hit, median | 88.9 m | 88.8 m | 90.3 m | 104.3 m |
| First-hit weapon is the gun | 100/119 | 293/340 | 389/461 | 797/936 |
| I hold a laser at first hit | **55%** | 41% | 37% | **24%** |
| My cubes at first hit, mean | 2.29 | 1.66 | 1.49 | 0.83 |
| Opponent already under 70% HP | **25%** | 17% | 18% | **8%** |
| Someone else was also hitting me | **3%** | 4% | 6% | **18%** |
| Duration, median | 4.8 s | 4.5 s | 4.5 s | 6.5 s |
| Damage dealt / taken, medians | 725 / 414 | 773 / 562 | 624 / 495 | 617 / 899 |
| Lateral speed against the opponent | 5.2 m/s | 5.2 m/s | 5.4 m/s | 5.7 m/s |
| Building between us, share of samples | 0.26 | 0.24 | 0.29 | 0.15 |
| Range change over the fight, median | 0.0 m | 0.0 m | 0.0 m | −3.7 m |
| Rear hits dealt, of hits dealt | 137/1,171 (12%) | 304/3,866 (8%) | 330/4,673 (7%) | 441/10,582 (4%) |
| My HP at the end (survivors), mean | 73% | 67% | 69% | 64% |

Pooled kill and death odds by condition (`q2.out`):

| Condition | n | KILL | DIED |
|---|---:|---:|---:|
| First hit mine | 993 | 309 | 171 |
| First hit theirs | 863 | 129 | 297 |
| I hold a laser, opponent does not | 297 | 122 | 28 |
| Opponent holds a laser, I do not | 400 | 46 | 156 |
| Opponent already under 70% HP | 244 | **111** | **16** |
| I am already under 70% HP | 40 | 2 | 20 |
| Someone else is hitting me | 217 | 37 | 128 |
| I have more cubes | 485 | 166 | 74 |
| I have fewer cubes | 631 | 100 | 220 |
| Opening range ≥ 150 m | 384 | 67 | 81 |
| Opening range under 60 m | 551 | 148 | 157 |

- **Time to kill and HP left:** a KILL engagement lasts a median 6.5 s, deals 1,385 and takes 585, and the killer ends at a mean 61% HP.
- **Rear hits:** they make up 9.2% of hits dealt in KILL engagements (637/6,919) and 1.3% in DIED ones (79/6,007). A rear hit does ×1.5 (`protocol.md:295`).
- **Range:** opening range barely matters below 150 m. Net damage medians are +25, +46 and +47 for under 60, 60–100 and 100–150 m, and −36 at 150 m or more.
- **Strafing and boost** do not separate the groups. The bottom half moves slightly *more* sideways. Same result as 0040.
- **House bots,** our practice opponents' family: gun hit rates are 4–13% at 150–230 m and 13–29% at 100–150 m. Their laser hits 22–24% overall (`q2.out`, hit-rate table). An opening fired at a house bot beyond 100 m is cheap for us.

### Each difference, mapped to what our bot sees, and what is already built

| Difference (MEASURED) | We observe it in | Status on 4.17 main |
|---|---|---|
| First hit mine: KILL 309 / DIED 171 vs 129 / 297 | `obs.mechs[i].aim` vs the bearing to us. Outside its front arc (>90°) and beyond `near_range` 45 m, it cannot see us (`protocol.md:369`) | **Not built alone.** "Backstab" ran only inside the B40 three-part stack (3.23, `coord/log.md:335`). → Build 2 |
| Laser in hand: 122/28 vs 46/156 | `self.weapons` | Built: B17 early walk, B80 late walk. A house laser dropped on our kill is not targeted → Build 3 |
| Opponent already under 70%: 111/16 | `mechs[i].hp` (`vision.show_enemy_hp` true in the kit hello) | Partly built: target pick weights HP (`TARGET_W.hp` 1.5, `params.ts`). B117's matchup range lost (4.08) |
| Someone else on me: 37/128 | Distinct `damaged.by` ids, enemies with a clear line | Built: B60 crossfire break (kept) |
| Cube lead: 166/74 vs 100/220 | `self.cubes`, `mechs[i].cubes` | Built: in Build 14's race |
| Laser finishes most late kills | Our laser `charge`, target `hp` | **Not built:** we only release at full charge (`brain.ts:1038-1046`) → Build 1 |
| Strafing speed | — | Not a lever. B27 strafe lost (3.38) |

## 3. Upgrade order when fighting more

Current order (`brain.ts:156-165`, picked at `:486-488`): plating > armor > nanites > sensors > any weapon upgrade or gyros (tied) > mobility. Unchanged since 0040.

Effects from the kit hello (`/workspace/mechfight-kit/check/stream.jsonl.gz`, `config.upgrades`). 0040 §3 has the DPS arithmetic.

| Upgrade | Effect | Worth in a one-on-one race |
|---|---|---:|
| `gun_mag` | +8 rounds, reload ×0.8 | Sustained gun DPS +31% |
| `laser_damage` | laser damage ×1.18 | +18% laser DPS |
| `plating` | max HP ×1.15 | +15% HP |
| `gun_damage` | ×1.15 | +15% gun DPS |
| `armor` | +0.08 armor | about +8.7% effective HP, not against the zone (`protocol.md:291`) |
| `laser_charge` | charge ×0.75 | +8.5% laser DPS |
| `gun_rate` | cooldown ×0.87 | +7.6% gun DPS |
| `nanites` | regen ×1.6, delay −1.5 s | No effect during a fight |
| `sensors` | +15 m near range, +25 m vision, hearing error ×0.5 | No damage; you see first: vision 200 → 225 m, proximity 45 → 60 m |

- **The ranking 0040 proposed was tested and lost.** B21 used plating, armor, nanites, gun_mag, laser_damage, gun_damage, laser_charge, gun_rate, lightning_efficiency, with sensors dropped below the other weapon upgrades (`git show e0710b6`). It scored 3.46 against 3.50. The sim had it at −0.08 ± 0.17 (`coord/log.md:313`).
- **Most likely reason (INFERRED):** under kill focus, **seeing first is the fight.** Whoever lands the first hit wins 309 to 171 and loses 129 to 297 (section 2). Sensors widens the view wedge's reach and the all-round proximity ring. Pushing it below weapon upgrades swapped a first-sight edge for a few percent of DPS. That trade lost on deterministic seeds.
- **The upgrade with the biggest effect sits at the bottom of the tie.** `gun_mag` (+31% sustained DPS) ties with `gun_velocity`, `laser_pierce` and the mortar upgrades at rank 4. A single change could order only that tier and leave sensors at rank 3. B21 moved both at once, so they were never tested apart.
- **T06's bot** (ideas only, section 4) changes its order when it holds a laser: plating, armor, laser_damage, laser_charge, nanites, … sensors 20th (`mech/brain.go:458-482`).
- **Verdict:** keep the current order. Upgrades are a dead family (`coord/STATUS.md:57`). Offers come at 1, 3, 6, 10 cubes (`protocol.md:429`). The weapon-tier ordering is the only untested piece, and it is worth only an empty slot.

## 4. Top teams' public repos

GitHub searches (`mechfight`, `mech royale`, `joinbuilders`, and each top-20 name from `/workspace/leaderboard.txt` and the Watcher T01–T16 list) found about 40 Buildathon bot repos updated today. The only one tied to a top team is **a public, MIT-licensed, unchanged copy of Watcher T06's bot** (Go). A second repo says it is derived from it. The links stay off this public repo. Team A and Team B from 0040 §4 were not re-read.

Ideas from T06's bot (`mech/brain.go` at commit `f3871e2`). These are ideas only; nothing was copied.

- **Lethal partial laser release** (`:978-990`): while charging, it estimates the damage the current charge would do. That estimate includes the cube damage bonus and the mortar cook-off. If 0.8 × that damage is at least the target's HP and the aim is lined up, it lets go early instead of waiting for full charge. We always wait for full charge (`brain.ts:1038-1046`). → Build 1.
- **A fitted fight-odds model** (`:1890-1924`): a logistic over log(my HP / its HP), the cube difference capped at 10, the weapon-count difference, and "I am being hit" minus "it is busy". When opening a fight it adds a distance term and **+0.82 logit when the target's aim is more than 1.75 rad off us**. → Build 2.
- **A practice profile** (`:325-347`, `squadParams` `:1926-1947`): from 20 s, unless 5 or more mechs have died that it did not kill (a free-for-all), it switches to a squad profile. That profile ignores the peek and ghost behaviour, uses laser range 120, seeks lasers out to 240 m, holds its target for 120 score points of stickiness, gives a big bonus to targets under 30% HP (`:570-575`), and finishes within 20 m. Our bot already plays only against the squad, so only the release and target ideas are new.
- **Range preference by the enemy's weapon** (`prefRange`, `:1329-1351`): it stands off at 64 m or more from a lightning holder and 80 m or more from a mortar holder when it has no lightning itself. B117 (loadout/HP matchup range) lost 4.08, so this is low priority.

## Ranked next builds

Each is one mechanism behind one flag, with flag 0 byte-identical to main (`6182d29`). The gains are my guesses, not measurements. The planning prior is about 15% per test (`coord/STATUS.md`, 6:06 PM ET hourly report), and with no data on our own bot, every confidence is low.

| # | Build | Mechanism (one) | Where | Trigger estimate | Expected gain | Confidence |
|---|---|---|---|---|---|---|
| 1 | **LETHAL RELEASE** | While charging the laser at a locked target with visible `hp`, let go as soon as the partial charge is lethal. Partial damage = `damage × (min_frac + (1 − min_frac) × charge / charge_full)` × cube bonus × cook-off if it holds a mortar (`protocol.md:305`), and the release fires when 0.8 × that ≥ target HP and the torso is lined up (the existing `lined` test). Never before `min_charge` 0.15 s | `brain.ts:1036-1046` (`fire[laser] = !(full && lined)`); values from `hello.config.weapons.laser` and `config.cubes` | Every laser shot at a target under about 315 HP. Laser is 58% of winners' kills after 120 s (`killsrc.out`). Count it in the sim before a slot | +0.05 (0 to +0.15) | 0.35 |
| 2 | **UNSEEN TARGET FIRST** | Add one term to the target pick: a bonus for an enemy whose torso aim is more than 90° off its bearing to us and that is beyond 45 m. It is outside its front arc (×1.5 rear damage, `protocol.md:295`) and cannot see us (`protocol.md:369`), so we likely land the first hit | `target.ts` `scoreTargets` (new weight in `TARGET_W`, `params.ts`); the aim comes from `obs.mechs[i].aim` | Any pick with 2 or more visible enemies, or a new target. Mid and late, not only the opening | +0.08 (−0.1 to +0.2) | 0.3 |
| 3 | **TAKE THE KILL'S LASER** (Step A first) | After our `kill` event, if the victim was seen holding a laser (`mechs[i].weapons`) and we hold none, put its death position in the `arms` memory as a laser and let the existing claim walk and B80 walk take it. Step A: count in the sim how often we kill a laser holder and end the match without a laser. Build only if that is ≥10 of 192 games | `brain.ts` `arms` memory (`:514-519`) and the claim/late-walk block (`:681-705`) | Unknown until Step A. 862 lasers dropped at death in 120 showdowns (`dropsrc.out`); house bots hold a second weapon 57–66% of the time (0040 §2) | +0.05 (−0.05 to +0.15) if Step A passes | 0.25 |

**Why this order**

- **Build 1 targets late laser kills, the biggest kill source** we measured (winners: 2.51 kills per game after 120 s, 58% by laser). A top-16 bot does it. It changes nothing until a target is already low, so it cannot weaken the opening, the drop run or the standoff break. It is not the finish-burst family: B108 changed *when to commit* by summing magazines, while this changes only *when to let go* of a charge already in progress.
- **Build 2 has the largest measured first-fight gap that has never been tested alone.** First hit decides 309/171 against 129/297, and T06's fitted model gives the same signal +0.82 logit. Risk: it is a target-pick change, and Build 16's pick is in the champion. Backstab lost inside the B40 stack, though that stack also carried two laser-rush changes that lost elsewhere.
- **Build 3 is the only laser lever left that is not early.** It ranks last because the trigger count is unknown, and the swap variants B66 (3.58) and B90 (3.73) lost, so it must not add a swap.

**Not in the top 3:** any opening or early-laser change (saturated; seven ties at 3.79 and UF100 tied); upgrade reorder (B21 lost; at most the weapon-tier-only order for an empty slot); strafing (no measured difference; B27 lost).

**Data gap:** nothing still shows our own bot fighting. Every "why ours failed" statement above is inferred.
