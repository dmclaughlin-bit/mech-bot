# Root-cause audit: Build 5b (`100941f`, 2.38)

Fri 2026-11-21, Claude, branch `rca-report`. Read-only audit of `brain.ts`, `nav.ts`, `map.ts`, `params.ts`. The bot `.ts` files at `HEAD` (`235475a`) are identical to `100941f` (`git diff --stat 100941f HEAD -- '*.ts'` is empty). No bot code changed. Line numbers refer to that code.

Labels: **CODE** = read from source. **MEASURED** = output of a script in `tools/rca_*.ts`. **INFERRED** = reasoning, not observed. No practice match results are invented. Practice gives only an aggregate score, with no per-match data.

## Framing that drives everything

Each match pays `16 − place`, and place is the order of death. So **our score equals the mean number of mechs that die before we do**. 2.38 means about 2.4 deaths before ours, which is an average place of about 13.6. Two things add points: (a) our kills, while we stay alive, and (b) house bots dying to the zone or to each other before we die. Hiding pays only if (b) happens. (INFERRED, from protocol §4.)

## Measurements

| Script | What it measures | Result |
| --- | --- | --- |
| `tools/rca_replay.ts` over 14 recorded matches (`/workspace/watch/recordings`, `stream/*`, `/workspace/live*.jsonl`) | Regen timing from HP series and `hit` events | 328 regen episodes. HP starts rising a **median 5.00 s** after the mech last dealt or took a hit, at a **median 45.0 HP/s**. This matches `regen_delay` 5 / `regen_per_s` 45. Dealing damage resets the timer. MEASURED |
| same | Public matches (2 humans + 14 house bots, the closest proxy for practice) | **62 of 65 house-bot deaths were kills by other house bots.** Humans were hit by 0–3 distinct house bots in total, and at most 3 inside any 10 s window. No 15-bot pile-on was seen. MEASURED (public matches only. Practice house config is unverified.) |
| same | `cubes_max` by place, all 14 matches | Places 1–2: **17.3** (n=28). Places 3–8: 5.3. Places 9–16: 0.7. Showdown winners: 26.9 (watcher). MEASURED |
| `tools/rca_hide.ts 300 60,120,180` | `hideSpot`/`seenAt` (`brain.ts:211-251`) re-implemented on the kit arena. 300 random exposed in-zone positions per distance, with one enemy aiming at us | Enemy at 60 m and at 120 m: a spot is found in only **24%** of cases (median 23 m away), and the enemy sees that spot again after walking a median **48 m (4.1 s)** or **90 m (7.7 s)**. Enemy at 180 m: a spot is found in 95% of cases, but only because 23 m more puts us past the 200 m vision range. The enemy sees it again after **4 m (0.3 s)**. MEASURED (the bot's LOS ignores canopy, so real hiding is a little better) |

## Answers to the nine questions

1. **Flees from enemies it could kill? Yes.** Retreat triggers on our HP alone: a hit in the last 2 s and `hp < 0.35·max` (`brain.ts:359,365`, `params.ts:9`). It never compares the enemy's HP (`Known.hp` and `hpLog` are tracked at `:257-266` and never read), weapons or distance. A target at 10% HP still makes us turn away. Retreating to cover also breaks our own line of fire. CODE
2. **Hiding spots easy to approach? Yes.** The search covers 12 bearings at 1, 2 and 3 s of walking, takes the nearest spot, and has no scoring (`:62-63,231-251`). Measured above: a spot exists in 24% of cases at 60–120 m. When one exists, a walking enemy sees it again in 4–8 s. At 180 m the "cover" is just range. Healing from 35% to 90% needs 5 s plus about 17 s at 45 HP/s, so a spot that lasts 4–8 s cannot finish a heal. In the other 76% of cases at 60–120 m, the bot backs straight away in the open (`:365-379`). MEASURED + CODE
3. **Exposes its rear while fleeing? Mostly no.** Legs and torso are independent. While any enemy is in `obs.mechs` (including memory_s 5 s), aim is set by targeting (`:419-438`), so the torso stays on the target. With no target, aim follows `lastHit.bearing` for 2 s (`:491`), then falls back to the move direction (`:406`). Gap: if the attacker is unseen for more than 2 s (mortar, or out of view), we face our direction of travel. Low severity. CODE
4. **A\* routes through enemy concentrations? Yes, there is no threat cost.** Costs are distance and climb only (`nav.ts:19-20`). Enemies affect only the *departure time*: +2 s per enemy within 50 m of the route (`brain.ts:44-46,186-201,333`). The route itself never changes. CODE
5. **Enters unwinnable fights? No TTK/TTD estimate exists.** `params.aggression` is never read (grep finds it only in `params.ts:17`). Target choice is the nearest clear mech (`:408-419`), and we fire whenever lined up (`:466-484`). Engagement is never chosen or declined. The bot fights whatever is nearest and leaves only at 35% HP. CODE
6. **Too much time seeking weapons? No, if anything too little.** Loot runs only with no enemy within 160 m, only for laser or lightning pickups in view, and only within 80 m (`:33-36,297-313`). It ranks below retreat and heal (`:385`). Each trip is at most about 7 s of walking. Many matches likely run gun-only (INFERRED. Bottom-half mechs end gun-only 40.6% of the time, per the watcher). CODE
7. **Collects enough cubes? No. The bot never seeks cubes.** `brain.ts` never reads `obs.cubes`, `obs.crates`, `obs.drops` or NPC drones (targets are filtered to `kind === "mech"`, `:295`). Cubes arrive only by stepping within 3.5 m by chance. Winners have 17–27 cubes. The cube cap gives +40% HP and +40% damage at 10 cubes, plus upgrade offers at 1, 3, 6 and 10 (plating, armor). Our upgrade order (`:66`) is wasted if we never reach a threshold. CODE + MEASURED (benchmark)
8. **Does regen happen in heal state? Only while we are not landing hits.** Regen needs 5 s with no damage taken *or dealt* (MEASURED above, protocol §7). Build 5b keeps firing while healing (`:380-384` plus normal fire at `:466-484`), so every hit we land resets the 5 s timer. Heal mode also ends only on HP ≥ 90% (`:60,380`), with no time limit. If anyone stays in view, we keep trading and never regen. Still, 5b (fire while healing) beat 5 (gated) by +0.34. Firing is worth more than regen as currently implemented, which suggests the heal state rarely got its 5 quiet seconds anyway. CODE + MEASURED + INFERRED
9. **Does squad focus make passive survival ineffective? Probably, but the premise is unverified.** The handoff says practice house bots never kill each other. In *public* matches they do: 62 of 65 house deaths. If the handoff is right for practice, passive play earns points only from zone deaths, and kills are the only other lever. If it is wrong, outlasting is worth more than we think. Either way, a bot with no cubes, no upgrades and gun-only fights at 1400 HP / 45 dmg against squads that farm (house top-2 average 17 cubes), so it loses the 1v1s that come to it. INFERRED + MEASURED (public)

**Can a faithful local simulation be built? No.** The kit has no game engine. It has the protocol text, the schema, the map (`arena/v2`), a non-reactive 300-observation stream (`check/stream.jsonl.gz`), and our spectator replays. House-bot AI, loot and spawn RNG, and exact physics are not in the kit. What *can* be built offline: geometry and LOS studies (as in `rca_hide.ts`), nav benches, and rule checks against replays (as in `rca_replay.ts`). Any "sim" score would be our model of the house bots, not the house bots.

## Ranked bottlenecks

| # | Bottleneck | Severity | Evidence | Confidence | Impl. cost | Expected placement impact |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **No cube/upgrade economy**: never shoots drones or crates, never walks to cubes, never captures drops | High | CODE `brain.ts:295` (mech-only targets), no reads of `obs.cubes/crates/drops`. MEASURED cubes by place 17.3 / 5.3 / 0.7 | High that it's missing. Medium on size | Low–Med (one farming rule under the existing L2 gate) | + (more HP and damage means winning the 1v1s that bring kills and survival). Largest headroom |
| 2 | **Weak heal/hide loop**: 24% spot availability, re-seen in 4–8 s, regen reset by our own hits | High | MEASURED `rca_hide.ts`, `rca_replay.ts` regen. CODE `:231-251,380-384` | High | Med (scored search with path-distance, or "heal only when no enemy in view") | + but B6 (hold behind cover) lost −0.15, so the mechanism matters |
| 3 | **No engage/disengage logic** (no TTK, flee by own HP only) | Med–High | CODE `:359,365,408-419`, `aggression` unused | High it's missing. Low on sign | Med | ± Could add kills (finish weak targets) or lose fights |
| 4 | **Weapon acquisition too narrow** (80 m detour, enemy-free 160 m, in-view only) | Med | CODE `:33-36,297-313`. Watcher: winners 100% laser by 23 s | Medium (B8 laser-first lost −0.11) | Low (constants) | ± |
| 5 | **A\* has no threat cost** | Low–Med | CODE `nav.ts:19-20`, `brain.ts:44-46` | High it's missing. Low on impact | Med | Small. Zone trips are rare |
| 6 | Premise "house bots never kill each other" unverified | Meta | MEASURED: false in public matches (62/65) | Medium | Zero (ask, or check the practice config) | Changes which strategy pays |
| 7 | Rear exposure when the attacker is unseen for more than 2 s | Low | CODE `:406,491` | High | Low | Small |

## Recommended next experiment (one knob)

- **Change:** add a farming rule `FARM` (one constant, on). Under the existing L2 gate (no enemy mech within `LOOT_CLEAR` 160 m), (a) let NPC drones and crates within gun range and with a clear line become targets when no mech target exists, and (b) add visible `obs.cubes` within `LOOT_DETOUR` (80 m) to the loot targets, ahead of weapon pickups. Nothing else changes: fire gate, heal, retreat and zone logic stay as they are.
- **Parent:** `100941f` (Build 5b, 2.38). Bot code is identical on `main` `235475a`.
- **Hypothesis:** the 5b bot ends most matches with 0–2 cubes and no upgrades. Farming in quiet periods lifts cubes to roughly 4–10 by the first contact, so more 1v1s with lone hunters are won.
- **Mechanism:** each cube gives +4% max HP and +4% damage (cap 10), and thresholds at 1/3/6/10 give upgrade offers (plating/armor first, `:66`). 2 cubes per drone (12 drones) and 1 per crate (36 crates). The gun kills a drone in 8 hits, about 2 s. Winning more 1v1s means kills (+1 each) and later deaths.
- **Predicted direction:** up (score > 2.38). Risk: gunfire is heard at 320 m and may draw hunters early (the B7 lesson). The 160 m L2 gate is the guard.
- **Rollback condition:** practice is deterministic, so revert if the score is below 2.38. Keep if ≥ 2.38 + any gain (the team rule: keep on a raw gain or a mechanism-right ≥ −0.6, judged per `AI-Structure-Development.md`).

## Reproduce

```sh
bun tools/rca_replay.ts /workspace/watch/recordings/live-*.jsonl /workspace/watch/stream/*/live.jsonl /workspace/live.jsonl /workspace/live2.jsonl
bun tools/rca_hide.ts 300 60,120,180 < /dev/null   # stdin must be closed: map.ts imports mechfight.ts, which reads stdin
```
