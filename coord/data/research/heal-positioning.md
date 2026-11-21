# Heal positioning: do we plant in the open, or move to a safe spot first?

Research only. Written Saturday 21 November 2026, 5:00 PM ET. Measurement of the current champion; no bot change, no site submission, and no implementation in this note. Other invited teams are not named.

Doug asked whether, when we heal on purpose, we heal out in the open while vulnerable, or first move to a safe area away from danger. He then asked for a verdict on whether a heal-positioning change (move to cover / away from enemies before healing) would be a positive implementation, judged on end-game survival and site score, not narrow metrics.

The short answer: **we usually stand still, and for most of that time someone can still see us.** We do have a walk-to-a-hiding-spot rule, but it is a small share of heal time, and a later rule turns it off once we are only moderately hurt and have not been hit for 3 s. Net HP during "heal" episodes is negative, because taking damage (and firing) resets regen. Late-circle deaths while healing are already uncommon; the score risk is earlier, when a stand-still heal in contact costs HP that we never get back.

## Champion logic (B113, origin/main bot code)

Read from `brain.ts` / `params.ts` on a copy of `origin/main`, whose bot files match B113 (`6182d29`, site 4.17, `DROP_RUN_M=200`). Later `main` commits after that SHA are coord/data only.

Heal is mode `"heal"` or `"heal, hiding"`. It is not the first thing the bot does when hurt.

1. Zone escape, walking to the next circle, and a 1v1 engage (fight-or-flee) all outrank it.
2. **Retreat to cover** runs only when HP is below `retreatHp` (30% of max), we were hit in the last 2 s, and at least one visible enemy has line of sight (no FOV wedge test). It walks in a straight line, at most 3 s of walk speed, to the nearest in-zone point that none of those enemies can see, without getting closer to any of them. Boost is allowed above 30% energy. If no such point exists, it backpedals from the hit bearing (**retreat**), leaning toward the zone center near the edge.
3. Claiming a kill's cubes, the early laser walk, breaking a 2-on-1 crossfire, a lightning ambush, and a supply-drop run also outrank heal.
4. **Only then**, if HP is under 90% of max, we enter heal. Default: **stand still** and keep firing (Build 5b). If an enemy can currently see us by the protocol test (inside 45 m, or inside 200 m and its 120° aim wedge) and a hiding spot exists, we walk there silently (`"heal, hiding"`).
5. That hide walk is **turned off** by Build 19 (`NO_SNEAK_ON`) whenever HP is at least 30% and we have taken no damage of any kind for 3 s. The file comment says retreat, heal, and their hiding "run unchanged" while hurt; the `noSneak` test does not match that comment. Between 30% and 90% HP, after 3 s quiet, we will plant even if someone can see us.
6. The hiding-spot search (`hideSpot`) is a 12-bearing × {1, 2, 3} s straight-line scan, nearest first, staying inside the circle we keep to. It is "out of their vision," not "behind a named building." It does not path around walls. If none of those 36 points works, or the 30 ms deadline is close, we stand still.
7. Healing and hiding are speed-capped at 5 m/s. After 60 s, a standoff break can replace a heal or hold against one lone enemy at 45–90 m, but only when we are well above the 30% retreat line.

Regen itself is a protocol rule, not the mode name: after `regen_delay` (5 s) without dealing or taking damage, we gain `regen_per_s` (45) HP/s, except outside the zone. Standing in `"heal"` while still shooting or still being shot does not start regen.

## Method

- Isolated copy of the champion bot under `/tmp/heal-bot` (not committed). After each action was built, the copy wrote a JSON line with mode, HP, commanded move, `noSneak`, whether visible threats had LOS or were in the vision cone, and a map `clearLine` cover flag to the nearest *known* enemy. The action itself was not changed.
- A local runner (`/tmp/heal-instr/measure_heal.ts`) played the standard practice house-bot sim and, in parallel, recorded omniscient facts: how many living enemies had protocol LOS (`sees()`), distance to the nearest living enemy, and whether a map obstacle blocked eye→center and eye→top to that nearest enemy (`geom.clear`, same end-skips as `sees()`).
- Primary set: seeds 2000–2095 and 3000–3095, 192 games, `--jobs 2` (box was already loaded). Held-out confirmation: 4000–4095 and 5000–5095, another 192 games, same jobs. Runtime 352.9 s and 475.5 s.
- A heal *episode* is a run of decisions whose mode is `"heal"` or `"heal, hiding"`, split when the gap is greater than 0.35 s. Decisions run at 10 Hz, so tick counts × 0.1 s are episode time.
- **Stopped in place:** the episode starts in `"heal"` with commanded move ≈ 0, and the previous 3 s had no retreat, hide, or `"heal, hiding"`.
- **Moved to a spot first:** the episode starts as `"heal, hiding"`, or the previous 3 s included retreat, retreat-to-cover, hide, or `"heal, hiding"`.
- **Exposed:** at least one living house mech has protocol LOS. **Geometry-covered:** a solid blocks both lines to the nearest living enemy. These can overlap (a wall to the nearest, while another still sees us). **Covered and unseen** is the strict safe bucket (no one has LOS, and the nearest is blocked).
- Deaths "during a heal episode" use the match `death_t` falling inside an episode; "within 2 s after" is reported separately. Episode HP gain is last HP minus start HP, including damage taken in the episode.
- Gate sanity on the instrumented copy: 0 missed answers on both 192-game sets; mean answer time about 1.1 ms.

Caveats: this is the local house-bot sim, not the site, and house bots hunt as one squad that shares vision (`tools/sim/ASSUMPTIONS.md`). A wall that breaks one line of sight may not end the fight the way it would against independent teams. The site practice score is also against house bots, so the numbers still matter for 4.17, but they are not a Watcher showdown. Trees and canopy are a known cover-proxy limit (the Watcher notes exclude trees; the sim's `clear` follows its own geo). The bot only lists enemies *it* can see; an enemy behind us at 45–200 m can have LOS to us without appearing in `obs.mechs`. Omniscient `losN` captures that; the champion's own hide check does not.

## Sim results

### Primary set (seeds 2000+3000, n = 192)

Mean sim score 3.542 (SE 0.22), 7 survived. 188 games had at least one heal episode. 1,125 episodes, 42,044 heal ticks (4,204.4 s of heal time).

| Quantity | Value |
| --- | ---: |
| Heal time with at least one enemy LOS (exposed) | 80.2% (33,709 / 42,044) |
| Heal time with a solid between us and the nearest enemy | 32.0% (13,458 / 42,044) |
| …of which covered *and* unseen | 18.4% (7,724 / 42,044) |
| Open and unseen (no wall; no one has LOS) | 1.5% (611 / 42,044) |
| Heal time standing still (`heal`, move ≈ 0) | 87.5% (36,768 / 42,044) |
| Heal time walking to a hide spot (`heal, hiding`) | 12.5% (5,276 / 42,044) |
| Episodes that stopped in place | 42.1% (474 / 1,125) |
| Episodes that moved to a hide or retreat spot first | 57.9% (651 / 1,125) |
| Non-zone damage taken while in a heal mode | 146,574.6 |
| Deaths during a heal episode | 30 |
| Deaths within 2 s after a heal episode ended | 63 |
| Mean episode duration / start HP / HP change / nearest enemy | 3.79 s, 802.8 HP, **−104.6 HP**, 81.1 m |

Start-HP bins: 606 episodes at 50–90%, 179 at 30–50%, 340 under 30%.

The walk-to-cover rule we already have is not how most heal *time* is spent. Even among the 57.9% of episodes that tried to move first, a lot of the subsequent stand is still in someone's LOS. Stopped-in-place episodes start healthier (mean start HP 1,037), last longer (5.3 s), and still lose HP (mean −156.9; 274 / 474 take damage). Episodes that already tried to move start much lower (mean 632.3 HP) and account for 19 of 20 episodes whose last tick is a death; they are often a last stand, not a calm heal.

Regen is working when we are actually left alone: the 546 episodes that took no damage gained a mean +43.0 HP (mean 2.4 s). The 579 that took damage lost a mean −243.8 HP (mean 5.1 s, 93% of their ticks exposed). "Heal" in contact is a stand-and-trade, not a heal.

By game time (heal ticks):

| Window | Ticks | Exposed | Geometry cover | Standing | Damage / tick |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0–30 s | 15,124 | 87.9% | 20.0% | 84.4% | 4.5 |
| 30–60 s | 14,881 | 81.9% | 31.2% | 88.2% | 3.2 |
| 60–120 s | 9,120 | 77.6% | 41.3% | 88.0% | 2.6 |
| 120 s+ | 2,919 | 39.6% | 69.2% | 97.7% | 2.3 |

Late-circle healing is already much safer (more cover, less exposure). Deaths during a heal episode at t ≥ 60 s: 11; at t ≥ 120 s: 2. The same windows within 2 s after a heal: 21 and 4. This is not mainly a final-circle problem.

Full-HP `"hold"` (idle, not heal) on the same games is a different picture: 43,914 ticks, 29.6% exposed, 77.7% geometry-covered. The open-and-vulnerable behavior is specifically the heal stand, not every time we stop.

A "walk to a LOS-breaking spot before standing to heal" rule, defined as: episode starts as a stand-still `"heal"` while at least one enemy has LOS and we are not geometry-covered vs the nearest, would have fired in **520 episodes in 167 of 192 games**. 515 of those 520 were later damaged, died, or stayed mostly exposed. The `NO_SNEAK` slice alone (stand-still heal, `noSneak` on, still visible, no geometry cover) is **106 episodes in 54 of 192 games**.

### Held-out set (seeds 4000+5000, n = 192)

Mean sim score 3.859 (SE 0.24), 5 survived. 188 games with a heal episode, 1,232 episodes, 40,586 ticks (4,058.6 s).

| Quantity | 2000+3000 | 4000+5000 |
| --- | ---: | ---: |
| Heal time exposed | 80.2% | 77.2% (31,322 / 40,586) |
| Geometry cover vs nearest | 32.0% | 33.3% (13,498 / 40,586) |
| Covered and unseen | 18.4% | 20.1% (8,153 / 40,586) |
| Standing still | 87.5% | 87.7% (35,586 / 40,586) |
| Walking to hide | 12.5% | 12.3% (5,000 / 40,586) |
| Stopped in place | 42.1% | 44.1% (543 / 1,232) |
| Moved first | 57.9% | 55.9% (689 / 1,232) |
| Damage while healing | 146,574.6 | 138,873.0 |
| Deaths during / within 2 s | 30 / 63 | 38 / 52 |
| Cover-first would fire | 520 in 167 / 192 | 562 in 165 / 192 |
| `NO_SNEAK` exposed stand | 106 in 54 / 192 | 158 in 60 / 192 |
| Deaths during heal, t ≥ 60 s / t ≥ 120 s | 11 / 2 | 17 / 1 |

The two sets agree. Per 192 games, a cover-first rule of the form above would fire in about **166 games**, and the `NO_SNEAK` gap alone in about **57 games**. Both are well above the "about 10 of 192" trigger bar. A change that fires in ~166 of 192 is also a large behavior change, so the screen has to watch early deaths, drop-ring arrivals, and late survival, not just "less damage in heal mode."

## Watcher comparison (top-16 showdowns)

Sources, already in the repo, used first: `coord/data/watcher/STATES.md`, `RANKED.md`, `cover.md`, `evasion.md`, `movement.md` (generated 21 November 2026, 3:43 PM ET). High group is T01–T04, low group is T13–T16. Ticks are 1 Hz samples from labeled mechs in complete showdowns. These are invited-team exhibitions, not the house hunting squad. Blank or `small n` buckets are not used as conclusions. Real team names stay out of this file.

When HP is low, high-group teams **keep moving, stand still less, keep a little more distance, and sit in slightly more cover** than low-group teams. They do not plant.

- Mean speed at `hp_lt_30`: **8.82 vs 7.63 m/s** (d = 0.19, 1,405 / 1,087 ticks, 85 / 84 matches, ok). While HP < 35% overall: **8.82 vs 7.46** (1,746 / 1,385 ticks, 87 / 86 matches, ok); when *not* in a recent exchange (`eng_0`): **7.14 vs 5.02** (872 / 606 ticks, 59 / 59, ok). High-group bots still move when hurt and alone.
- Hold (speed ≤ 2 m/s) at `hp_lt_30`: **22.6% vs 29.9%** (d = −0.17, 1,405 / 1,087, 85 / 84, ok); at `hp_30_50`: **27.1% vs 36.1%** (d = −0.20, 1,744 / 1,306, 86 / 80, ok). High-group stands still less when hurt, not more.
- Near-building cover at `hp_lt_30`: **60.1% vs 54.8%** (d = 0.11, same n, ok); at `hp_30_50`: **58.7% vs 54.2%** (d = 0.09). LOS to the nearest blocked at `hp_lt_30`: **63.0% vs 57.6%** (d = 0.11); at `hp_50_90`: **65.2% vs 60.4%** (d = 0.10). The cover edge is real but modest.
- Nearest enemy while HP < 35%: **114.35 vs 104.50 m** (d = 0.18, 1,746 / 1,385 ticks, 87 / 86, ok). Mid-game gap is larger: 119.17 vs 94.61 m (d = 0.48, 488 / 333 ticks, 40 / 46, ok). Late and final buckets are `small n — no conclusion`.
- Stuck (≈ 5 s almost unmoved, not in a drop ring) at `hp_lt_30`: 4.3% vs 6.7% (d = −0.11). The famous mid-game "standing still" gap is mostly when healthy; when hurt, everyone moves more, and the high group still moves more.

Our champion, in the sim, stands still for **87–88% of heal time**. That is a different denominator than "all low-HP Watcher ticks," but the direction is the same: we plant to "heal," and the teams that place well do not. The late-game kiting idea already in the queue is the distance half of the same Watcher picture; this note is the "do not stand in contact" half.

`RANKED.md` already flags the overlap: B5b heal-and-fire is in the stack; dedicated hold-behind-cover, post-kill cover, late 1+LOS cover, and wider/rear-step variants **lost on the site**. A new cover rule only ranks if the trigger is clearly different.

## Verdict

**Yes, narrowly — not a remake of hold-behind-cover.**

Judged on end-game survival and score:

- Reaching the end-game with more HP is the path. In both 192-game sets, most heal-time damage and exposure are in the first 60 s, and damaged heal episodes *lose* about 150–240 HP instead of topping up. That is HP we do not have later. Late-circle heal deaths are already rare (2 and 1 deaths during a heal episode at t ≥ 120 s on the two sets). A change sold as "final-circle healing" is the wrong frame.
- Standing still in contact is the failure, not the idea of healing. When a heal episode is actually left alone, HP goes up. When it is not, we stand in someone's LOS (about four fifths of heal time) and bleed. Watcher high-group teams, when hurt, move more and stand still less; they do not show a large "park behind a wall and wait" gap.
- A generic "hold behind cover" or "always go to a building before healing" is not recommended. Those mechanisms already lost on the site (B6 and later cover-family losses). House bots share vision, so one wall often will not end the fight. Full-HP hold is already mostly covered; changing that is the old, failed idea.

The implementation that is worth building is a **break-LOS-then-stand** patch on the existing F4 heal, with firing kept on (B5b), and with `noSneak` no longer able to disable hiding while HP is under 90%.

### Recommended build spec

- Flag, default off, flag-0 identical to the champion (byte-identical actions when the flag is 0). Base on current `main` (B113 bot code).
- **Trigger:** the champion would otherwise choose stand-still `"heal"` (HP < 90%, all higher-priority modes already declined), **and** at least one visible or just-shot-us enemy has line of sight using the *no-wedge* test (`seenAt(..., cone=false)`, same as retreat-to-cover), **and** we are not already behind a map solid to that enemy, **and** `hideSpot(..., cone=false)` returns a point (same 12 × 3 s, in-zone, not closer to any threat, straight line).
- **Action:** walk to that point under the existing silent cap (`"heal, hiding"` or a new `"heal, to cover"` label). Keep Build 5b targeting and firing. Once no living threat has LOS, stand and regen as today. If `hideSpot` returns null, keep today's stand-and-shoot; do not wander.
- **Also:** while HP is under 90%, `noSneak` must not disable this hide walk. That closes the 30–90% / 3 s-quiet gap the current comment already claims is unchanged.
- **Optional, same flag or a follow-up:** if we take non-zone damage during a stand-still heal, use the damage bearing (we may not see the shooter) and try `hideSpot` again rather than remaining planted. This is the case an enemy behind us at 45–200 m can produce, because they never appear in `obs.mechs` until they enter our own vision.
- **Do not change:** zone travel, engage, retreat under 30%, drop run, farm, healthy hold, standoff break, crossfire, ambush, or "hold behind cover" once HP is back over 90%.
- **Screen, before any site slot:** flag-0 identity, gate (max < 30 ms), paired 2000+3000 and 4000+5000. Keep an eye on early deaths (< 30 s), drop-ring arrivals, and survival past 120 s, not only "damage while in heal mode." Expected trigger rate is high (see below); if drop arrives or late survival get worse, stop.

Expected trigger count, from this measurement, not a guess:

- Full rule (stand-still heal starts while an enemy has LOS and we are not geometry-covered): **167 of 192 games** (520 episodes) on 2000+3000, **165 of 192** (562 episodes) on 4000+5000. Call it **about 166 of 192 games**.
- `NO_SNEAK`-only slice, if someone wants a smaller first step: **54 of 192** (106 episodes) and **60 of 192** (158 episodes). Still above the ~10-game bar, and a safer first PR if the full rule feels too broad.

A late-game-only cut (t ≥ 60 s) would shrink the full rule to 109 episodes on the first set and 163 on the second, still many games, but it would leave most of the HP loss on the table (the 0–60 s windows hold the majority of heal damage). That cut is not the one I would lead with if the goal is end-game survival through *arriving* with more HP.

Raw logs and episode tables from this run live on the box only (`/tmp/heal-pos`, `/tmp/heal-pos-4000`); they are not committed, because they are large and are not needed to reproduce the method.
