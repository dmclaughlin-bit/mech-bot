# Research run: early laser, first fight, upgrades, public repos

Sat 2026-11-21 00:40 ET, Doug's Claude, branch `research-doug-20261121-0528` (branch name is UTC, file names are ET). No bot code changed. Champion: Build 14, 2.88 (`EXPERIMENTS.md:7`).

## Read this first

1. **Build 8 could not have delivered "laser by 30 s".** From 384 real spawns in the recordings, its rule could start a laser trip at spawn in at most 12–16% of them. Meanwhile its aim changes applied in every match where we held a laser. The benefit was rare and the cost was not.
2. **Winners get the laser by walking about 60–80 m to the nearest ground laser, ignoring enemies at 100–160 m, and they do not fight first.** 9 of 10 early winner trips had an enemy inside our 160 m loot gate.
3. **The laser's edge is range, not burst.** Showdown lasers hit 49–89% in every range bin from 30 to 230 m (winners 57–84%), while guns fall to 25–37% at 150–230 m. House bots hit 2–35% with the gun beyond 100 m and 15–27% with the laser overall.
4. **First fights are won before the first shot:** by landing the first hit, holding a laser, having at least as many cubes, and having nobody else shooting at you. Strafing speed does not differ between winners and losers.
5. **Two other teams measured a cost for quiet slow-walking in practice.** One clean A/B gained 0.21 by turning it off; a second team gained 0.13 with a supply-capture fix mixed in. We still creep and hide (`brain.ts:417`, `:619-630`).

Top 3 next builds are in [Ranked next builds](#ranked-next-builds). Builds 15 (aim, PR #27) and 16 (target choice, PR #26) are already open, so none of the three repeats them.

## Evidence and limits

- **Corpus:** 24 complete matches: 14 Top-16 showdowns (224 mech-rows, team bots only) and 10 public matches (160 mech-rows: house bots plus `human`). One more showdown than `findings.md` (seed `2985948728` finished after it was generated).
- **Scripts and raw output:** `/workspace/watch/research-doug-0040/` (`q1.py`, `q1b.py`, `q2.py`, `*.out`). They are outside the repo because the recordings are not committed. Every number below marked MEASURED is in those `.out` files.
- **Showdowns are free-for-alls among team bots,** not practice against the house squad (`/workspace/watch/README.md:4-6`). Public matches are also free-for-alls. Their house bots are `house:expert`, `house:probe-red-best`, `house:probe-red-honest`, `house:probe-astra-finalist` and `house:probe-astra-skirmish` (header `bots` field). Practice uses 4 easy, 4 medium, 4 hard, 3 expert (`coord/log.md:214`). Only `expert` appears under the same name in both, so the house numbers are a proxy.
- **Our bot is in no recording** (`/workspace/watch/ladder.md:7`), and practice gives no per-match data (`coord/log.md:229`). Every statement about why our build lost is INFERRED.
- **Hit-rate estimator:** a gun shot counts as aimed at a mech when the shooter's torso yaw is within 10° of a mech inside 300 m and no drone sits in the same cone. Hits are binned by range at hit time, so the 0–30 m bin can exceed 100%. Treat the bins as estimates.

## 1. Early laser

### How winners actually get it (MEASURED, `q1.out`)

| Showdown, by final place | winner (n=14) | places 2–4 (n=42) | bottom half (n=112) |
|---|---:|---:|---:|
| Ever took a laser | 14/14 | 30/42 | 34/112 |
| Laser by 30 s, of those alive at 30 s | 10/14 | 18/42 | 10/37 |
| A ground laser within 80 m of spawn | 5/14 | 14/42 | 27/112 |
| Spawn to nearest ground laser, median | 157 m | 120 m | 119 m |
| Torso yaw swept in first 3 s, median | 201° | 238° | 227° |

Of the 10 winner lasers taken by 30 s:

- **Source:** 7 lay on the floor at match start and 3 dropped from a crate the winner shot. None came from a roof.
- **Which one:** 6 of the 7 floor lasers were the nearest laser to the winner's spawn.
- **Distance:** straight line median 58 m, maximum 176 m. Path walked median 78 m. Straight line over path: 0.88.
- **Time:** median 6.0 s from the laser entering the view wedge to the take.
- **Enemies ignored:** 9 of 10 trips had an enemy inside 160 m at some point. The closest enemy during the trip was a median 97 m away.
- **Fights avoided:** 2 of 10 had dealt mech damage before the take (bottom half: 16 of 33). 4 of 10 had taken any.
- **Boost:** 16% of trip frames (bottom half: 28%).

The 4 winners without a laser by 30 s took one at 39.6, 62.6, 66.8 and 76.2 s. Three were weapons another mech had dropped (swap or death) and one was a crate drop.

**Detour or luck? Both.** When a ground laser was within 80 m of spawn, almost everyone took it by 30 s: winners 5/5, places 2–4 12/14, bottom half 3/4. The gap opens at 80–200 m: winners 4/4, places 2–4 4/21, bottom half 5/25. Two of those four winners walked 124 m and 176 m to a floor laser; the other two shot a crate that dropped one about 85 m from spawn. Beyond 200 m even winners rarely get one early (1/5, and that one was a crate drop). The n is small.

**Scanning is not the difference.** Every group sweeps about 200° or more in the first 3 s. A bot that does not turn at all is the outlier.

**Lasers are not scarce.** Of 196 floor lasers in the showdowns, 67 were taken by 30 s and 121 were never taken. In public matches 37 of 132 were taken by 30 s. The nearest ground laser was gone before a walking mech could reach it in 21–35% of showdown spawns and 11–25% of public ones.

### What `beb9240` did (`git diff 100941f beb9240 -- brain.ts`)

- **Seek:** until a laser is held, walk a nav path to a laser in `obs.pickups` that is in the hide circle, on the ground, with no known enemy within 160 m of us or of it, and with zone time to spare. No distance cap beyond the zone-time test.
- **Aim:** a charging laser steers the torso even when the target is past range or behind cover, and the trigger stays held while the target is behind cover.
- **No target in view:** keep the trigger held and aim at the last-seen enemy.

### Most likely reason it failed (INFERRED, ranked)

1. **The seek almost never ran.** Replaying its conditions on real spawns (`q1b.out`, building line of sight only, so an upper bound): a ground laser is in the spawn view wedge without turning in 28–29% of spawns, and the full rule passes in 12% (19/160, public) to 16% (35/224, showdown). It kept the two things that block winners' trips: it only knows pickups it sees this tick (`obs.pickups`, no memory, no scan), and it kept the 160 m gate that 9 of 10 winner trips break. Part of that 12–16% was already covered by the parent's 80 m rule.
2. **The cost side ran in every laser match.** While the laser leads, the torso aims with no lead and the gun's `onTarget(gunAim)` test fails against a sideways mover, so the gun is silent for about 31% of each laser cycle (Diego's intake, PR #28). Build 8 widened that to charges held behind cover or past range. A held charge moves at half speed (`charge_move_mult` 0.5 in the kit hello) for up to 0.75 + 2 s (`protocol.md:305`).
3. **Our laser release is looser than the target is wide.** `yawTol` is `atan2(radius × size × 1.2, d)` with a 0.015 rad floor (`brain.ts:678`), so a full charge releases with up to 3.0 m of sideways error, or 4.2 m at 280 m. A mech's radius is 2.5 m (`protocol.md:101`). The Wolverines bot releases inside 0.9 × a 2.2 m half-width (`varchaskukreja/TTUN@596f339 mech-royale/bot/bot.ts:289,312`).
4. **A laser on our bot is an ungated long-range weapon.** The 100 m gate covers only the gun (`brain.ts:716`). The laser fires at any clear mech inside 280 m (`brain.ts:691`) and is heard at 380 m (`protocol.md:385`). Build 7 removed the gun's gate and lost 0.34 (`EXPERIMENTS.md:13`).
5. **Holding a laser early is not enough.** Bottom-half mechs that take a laser take it at a median 6.0 s and still finish bottom half. Diego's rows agree: laser at ≤15 s averaged 7.60 points and >15 s averaged 10.51 (`research/intake/diego-match-data-1129.md:38-39`).

The loss was 0.11, which is about 5 placement points over 48 matches. I cannot separate these causes without per-match data.

### Corrected design: ARM-UP

One mechanism: know where the weapons are and go for one while still gun-only.

- **Scan:** sweep the torso through a full turn in the first 3 s when no enemy is in view, then sweep around the heading while walking. The Wolverines bot does both (`varchaskukreja/TTUN@b7e9a6d mech-royale/bot/bot.ts:616-621`).
- **Remember:** keep ground-level pickups for 60 s and forget one on `took`, `take_failed`, or when we stand next to it and it is gone (same repo, `bot.ts:154-162`).
- **Go:** while gun-only, walk a nav path to the best remembered laser or lightning within about 175 m (the longest early winner trip was 176 m). Prefer the laser. Drop the 160 m gate. Stop only when a mech is hitting us or the zone test fails.
- **Reach this buys (MEASURED, `q1b.out`):** after a full turn, a ground laser is visible within 130 m from 38–42% of spawns and within 175 m from 47–51%. A laser or lightning is visible within 130 m from 58–59% and within 175 m from 65%. Build 8's rule passed in 12–16%.
- **Do not copy from Build 8:** the charge-steers-torso and hold-behind-cover changes.
- **Rollback:** one flag, as for Builds 12–14.

## 2. First fight

### What separates first-fight winners (MEASURED, `q2.out`)

A first engagement is a mech's first exchange of hits with another mech, followed until 6 s pass with no hit between the pair. Outcomes: KILL (I killed it), DIED (I died during it), AHEAD or BEHIND on damage.

| Showdown, first engagement | winner (n=14) | places 2–4 (n=40) | bottom half (n=112) |
|---|---:|---:|---:|
| KILL / AHEAD / BEHIND / DIED | 7 / 5 / 2 / 0 | 16 / 10 / 10 / 4 | 16 / 21 / 26 / 49 |
| First hit at, median | 20.1 s | 11.4 s | 6.2 s |
| I landed the first hit | 79% | 55% | 47% |
| I hold a laser at first hit | 64% | 30% | 13% |
| My cubes at first hit, mean | 2.64 | 1.20 | 0.31 |
| Someone else was also hitting me | 7% | 8% | 30% |
| Range at first hit, median | 111 m | 127 m | 136 m |
| First-hit weapon is the gun | 13/14 | 37/40 | 100/112 |
| Damage dealt / taken, medians | 1164 / 94 | 1026 / 471 | 418 / 605 |
| Rear hits taken, of hits taken | 2/59 | 14/328 | 104/1061 |
| Rear hits dealt, of hits dealt | 36/118 | 82/462 | 80/911 |
| Building between us, share of samples | 0.35 | 0.21 | 0.13 |
| Range change over the fight, median | +4.9 m | −2.2 m | −7.0 m |
| Lateral speed against the opponent | 6.1 m/s | 5.8 m/s | 6.4 m/s |
| Boost share | 0.25 | 0.26 | 0.30 |

Pooled over all 222 showdown first engagements:

| Condition | n | KILL | DIED |
|---|---:|---:|---:|
| First hit mine | 119 | 42 | 23 |
| First hit theirs | 103 | 16 | 34 |
| I hold a laser, opponent does not | 30 | 14 | 2 |
| Opponent holds a laser, I do not | 44 | 5 | 16 |
| I have more cubes | 42 | 18 | 3 |
| I have fewer cubes | 51 | 8 | 19 |
| Someone else is hitting me | 40 | 8 | 26 |
| Nobody else is hitting me | 182 | 50 | 31 |
| Opponent already under 70% HP | 29 | 10 | 4 |

A KILL engagement lasts a median 8.2 s, deals 1,197 and takes 393, and leaves the killer at a mean 65% HP.

### Hit rate by range (MEASURED, `q2.out`)

| Shooter, weapon | 30–60 m | 60–100 m | 100–150 m | 150–230 m |
|---|---:|---:|---:|---:|
| Showdown winners, gun | 82% | 68% | 52% | 37% |
| Showdown places 2–4, gun | 87% | 76% | 49% | 25% |
| Showdown bottom half, gun | 95% | 70% | 42% | 25% |
| Showdown winners, laser | 62% | 57% | 74% | 84% |
| Showdown places 2–4, laser | 49% | 68% | 79% | 66% |
| House `expert`, gun | 76% | 50% | 21% | 13% |
| House `red-best`, gun | 83% | 57% | 29% | 9% |
| House `red-honest`, gun | 78% | 54% | 35% | 9% |
| House `astra-finalist`, gun | 64% | 26% | 10% | 5% |
| House `astra-skirmish`, gun | 64% | 30% | 13% | 2% |
| House bots, laser, all ranges | 15–27% | | | |

- **Charge discipline:** every group fires at full charge (median 0.80 s from charge start to beam, 75–98% of beams at 0.7 s or more). Nobody wins with partial charges.
- **Winner laser hits:** median 441 damage, against a base of 315 (`protocol.md:305`).
- **House first hits:** median range 83–101 m, and 57–66% of house bots already hold a second weapon.

### Each difference, mapped to what we can see and do

| Difference | We observe it in | Action |
|---|---|---|
| Winners land the first hit (79% vs 47%) | A mech entering `obs.mechs` with a clear line | Shoot on first clear sight inside effective range. Do not creep to a hiding spot first (`brain.ts:619-625`). Start the laser charge on sight |
| Laser in hand (64% vs 13%) | `self.weapons` | ARM-UP before contact. Mid-fight, a gun-only bot detours to a remembered weapon within 60 m unless losing (`TTUN@b7e9a6d bot.ts:396`) |
| Cube lead (2.64 vs 0.31) | `self.cubes` against `mechs[i].cubes` | Add the cube bonus to both sides of the Build 14 race (already there) and avoid opening on a target with more cubes unless it is hurt |
| Nobody else on me (7% vs 30%) | Distinct `damaged.by` ids in the last 2–3 s, plus enemies with line of sight | Break off at two attackers. Build 14's `alone` test does this |
| Rear hits (deal 31%, take 3%) | `mechs[i].aim` yaw against the bearing to us (`protocol.md:295`) | Open on a target whose aim is more than 75–90° off us (`brycehcmcgrath/mechfight-bot@18ae7c4 vendor/lance/bot.py:466-467`). Keep facing whoever hits us |
| Winners hold range, losers close | Distance to target | Hold a standoff by weapon instead of closing: 110 m with a laser, 70–85 m gun-only, 28 m with lightning (`TTUN@596f339 bot.ts:352`; `vendor/lance/bot.py:982-984`) |
| Laser keeps its hit rate with range | Distance, `self.weapons` | With a laser, fight at 100–200 m, where house guns hit 2–35% |
| Cover between shots (0.35 vs 0.13) | `clearLine` on the map | Weak for us: Build 6 lost 0.15 moving to cover (`EXPERIMENTS.md:14`). Only step behind a corner during a reload or laser cooldown |
| Strafing speed (6.1 vs 6.4 m/s) | — | Not a lever. Do not spend a build on it |

## 3. Upgrade order with more fighting

Current order (`brain.ts:97-104`, picked at `:391-393`): plating > armor > nanites > sensors > any weapon upgrade or gyros > mobility.

Values from the kit hello (`check/stream.jsonl.gz`, `config.upgrades`) and `protocol.md:303-305`. Sustained gun DPS is a magazine's damage over its fire time plus reload.

| Upgrade | Effect | Worth in a one-on-one race |
|---|---|---:|
| `gun_mag` | +8 rounds, reload ×0.8 | Sustained gun DPS 102.3 → 133.9, **+31%** |
| `laser_damage` | laser damage ×1.18 | +18% laser DPS |
| `plating` | max HP ×1.15 | +15% HP |
| `gun_damage` | gun damage ×1.15 | +15% gun DPS |
| `armor` | damage taken −8% | +8.7% effective HP (first), not against the zone |
| `laser_charge` | charge time ×0.75 | laser DPS 131.3 → 142.4, +8.5% |
| `gun_rate` | cooldown ×0.87 | sustained gun DPS 102.3 → 110.1, +7.6% |
| `nanites` | regen ×1.6, starts 1.5 s sooner | None during a fight. Heals 35% → 90% in 14.2 s instead of 22.1 s |
| `sensors` | +15 m near range, +25 m vision | None |

- **The top three are right.** Both public bots I read open with plating, armor, nanites (`TTUN@b7e9a6d bot.ts:15-18`; `vendor/lance/bot.py:23-28`). The squad focuses one target, so HP pays against every attacker while DPS pays against one.
- **Sensors is too high.** It sits above every weapon upgrade and adds nothing to a fight. The two public bots rank it 18th of 22 and 14th of 22.
- **Weapon upgrades need an order.** Today all of them tie at rank 4, so `gun_velocity`, `laser_pierce` and mortar upgrades can beat `gun_mag`. Suggested: `gun_mag`, `laser_damage`, `gun_damage`, `laser_charge`, `gun_rate`, `lightning_efficiency`, then the rest.
- **The recordings do not settle order.** Winners' first upgrades are mixed and the defensive share is 49% vs 47% (`ladder.md:58-59`, low confidence). Winners have more upgrades because they have more cubes (6.46 vs 0.42, `findings.md:73`).
- **Expected size: small.** Offers arrive at 1, 3, 6 and 10 cubes (`protocol.md:429`). This is a reorder for an empty slot, not a top-3 build.

## 4. Public repos of other teams

Ideas only. All `bot.ts` and `bot.py` lines below were re-read at the stated commits. Not read: AT, BobBuildIt and ranks 4–9 (no public repo found); `shanmukha-here/eagle-eye-mech-royale`, `atharvatripathi2026/gtgoats_mech_royale` and `moonriver0922/mech-royale-planner` (found, not opened).

### `varchaskukreja/TTUN` — Wolverines, rank 3 on the 9:40 PM board

Team link is second-hand: r1ver's notes cite a TTUN receipt (`moonriver0922/wgsrobot@2f343eb experiments/README.md:7`). Commit `b7e9a6d` is "v8-econ"; a later commit message calls it the 5.19 economy bot.

- **Spawn scan:** for the first 3 s it commands the torso 1.6 rad ahead of its current aim, which is a continuous spin, then sweeps ±0.9 rad around the heading while walking (`@b7e9a6d bot.ts:616-621`).
- **Pickup memory:** ground-level pickups kept 60 s (`@b7e9a6d bot.ts:154-162`).
- **Loot choice:** distance minus a weapon preference (laser 3.2, lightning 2.5, mortar 1) and minus 50 when gun-only. No distance cap and no enemy-distance gate outside fight mode (`@b7e9a6d bot.ts:14,431-441`).
- **Mid-fight detours:** to a cube within 70 m above half HP, and to a weapon within 60 m when gun-only (`@b7e9a6d bot.ts:393-396`).
- **Gun gate:** fires at any distance under the weapon's range when the yaw error is inside 1.2 × the target's angular half-width. No fixed range gate (`@596f339 bot.ts:289,297`).
- **Laser:** starts charging once the target is seen in range, releases only at full charge and aligned (`@596f339 bot.ts:310-315`).
- **Finish and losing:** never retreats from a target under 20% HP while above 20% itself with at most 2 threats. Losing is HP under 35% and behind the enemy, or 2 threats under 55% (`@596f339 bot.ts:349-350`).
- **Practice note in code:** cover-seeking against a charging laser is disabled in practice as too passive against squad focus fire (`@596f339 bot.ts:379`). It infers a free-for-all when at least 3 mechs have died that it did not kill (`@596f339 bot.ts:113-118`).
- **Upgrade order:** plating, armor, nanites, lightning_efficiency, laser_damage, laser_charge, gun_damage, gun_rate, …, sensors 18th (`@b7e9a6d bot.ts:15-18`).

### `LanceHuang245/mech-royale` — read as vendored in `brycehcmcgrath/mechfight-bot@18ae7c4 vendor/lance/bot.py`

- **Weapon reach:** remembered pickups up to 240 m when holding neither laser nor lightning, 160 m otherwise (`bot.py:738-746`).
- **Opening rule:** opens only cheap fights: under 55 m, target under 55% HP, target shot us in the last 6 s or is charging, or its aim is more than 75° off us (`bot.py:453-468`).
- **Standoff:** 110 m with a laser, 28 m with lightning, 85 m gun-only, 55 m when finishing (`bot.py:982-986`).
- **Quiet walking is a flag,** capping speed at 4.6 m/s near enemies or recent sounds (`bot.py:1071-1076`).

### Official scores other teams published

`brycehcmcgrath/mechfight-bot@18ae7c4 docs/RESULTS.md` (BackwardsDeployeds, rank 10):

| Change | Score | Line |
|---|---:|---|
| Raise loot priority 1.0 → 1.6 on a GT Goats controller | 3.71 → 3.65 | `:10-11` |
| Magazine-aware finishing | → 4.10 | `:12` |
| Lance controller, quiet walking on | 4.54 | `:13` |
| Same source, quiet walking off | 4.75 | `:14` |

r1ver (`moonriver0922/wgsrobot@2f343eb experiments/official-runs.md:7-10`, in Chinese, my translation): 4.54 for a Lance derivative with slow walking, 4.67 with normal speed plus a supply-capture fix, 5.08 after rebasing on TTUN v8-econ, 5.10 with a short ground-path check.

## Ranked next builds

Gains are my estimates, not measurements. Each build is one mechanism behind one rollback flag.

| # | Build | Mechanism | Where | Expected gain | Confidence |
|---|---|---|---|---|---|
| 1 | **ARM-UP** | Spawn scan, 60 s pickup memory, and a nav walk to the best remembered laser or lightning within about 175 m while gun-only, with no 160 m enemy gate | `brain.ts:396-412` (loot block), `:742-746` (idle aim), new pickup memory beside `known` | +0.3 (0 to +0.5) | 0.5 |
| 2 | **STOP SNEAKING** | Remove the silent speed cap and the hide-from-sight move while not hurt, so the bot farms, arms and opens fire at full walk speed | `brain.ts:417`, `:619-625`, `:629-630`; `params.ts` `silentSpeed` | +0.15 (0.1 to 0.2) | 0.55 |
| 3 | **CALIBRATED RACE** | Replace the Build 14 hit-rate guesses with a by-range table: measured house rates for the enemy side, and hold a weapon standoff (110 m laser, 80 m gun) instead of closing to 60 m | `brain.ts:82-84` and `hitRate` at `:156`; the engage approach distance `GUN_NEAR_M` at `:81` | +0.2 (−0.1 to +0.4) | 0.4 |

**Why this order**

- **ARM-UP first:** it closes the largest measured gap that is still open. Laser against no laser is 14 kills and 2 deaths in 30 first fights; the reverse is 5 and 16 in 44. Reach goes from 12–16% of spawns to 58–65%. The rank-3 team's bot does exactly this. The risk is real: Build 8 lost 0.11 and another team lost 0.06 raising loot priority.
- **STOP SNEAKING second:** it is the cheapest and has the only official A/B evidence on this practice mode, from two other teams. It touches every match. It also supports ARM-UP, because a walking bot reaches weapons sooner. Our own log already says hiding does not work against a squad with shared vision (`coord/log.md:214`).
- **CALIBRATED RACE third:** Build 14 assumes the enemy hits 50% with the gun beyond 60 m and 90% with the laser (`brain.ts:82-84`). Measured house rates are 2–35% with the gun beyond 100 m and 15–27% with the laser. The log notes the TTK rule rarely fires (`coord/log.md:239`). The proxy is weaker here: public house types are not the practice difficulty mix, and our own hit rate is unknown until Build 15 scores.

**Not in the top 3**

- **Upgrade reorder** (section 3): right direction, small, use it for an empty slot.
- **Laser release tolerance** (`brain.ts:678`, `:733`): a one-line fix that belongs with Build 15's aim work or right after ARM-UP.
- **Strafing or dodge work:** no measured difference between winners and losers.

**Data gap worth closing:** nothing shows our own bot fighting. If the public `play.joinbuilders.org` queue accepts a bot, one match there would appear on the watch stream with house bots in it.
