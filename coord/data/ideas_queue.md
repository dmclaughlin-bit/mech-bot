# Idea queue (ranked)

Current champion is P48 `b9492c6`, official builders-4 bar 3.75 (BB-5727119F, Entered in the final). builders-3 history for the same code is 4.44 (BB-94897D91). The ranking below was last updated Saturday 21 November 2026, about 5:50 PM ET, when the champion was B113 `6182d29`, official 4.17, receipt BB-09AE8A68, and has not been reranked against P48. Ranking is High / Medium / Low from (games the change can affect) × (size of the possible benefit) × (confidence in the evidence). No invented official-score point estimates. Families that just lost on the site are ranked down. A new name or commit is not enough to make an old intervention new.

**Top choice: mode 36 isolated drop commitment** (cut as a new one-flag site SHA; PR #129 is not itself that SHA). **Runner-up: P25 cube memory.** Reason for the order: mode 36 already has a complete 384-game paired screen on both seed sets, a clearly new decision, and a clean pin-seed picture; P25 is the right *next* farm mechanism after P23/P23b, but it has only a 96-game hazard so far, and a new 30 s pin on seed 72, and the farm-walk family just scored 4.00. Evidence confidence is therefore higher for mode 36 today.

## 1. Mode 36 — isolated drop commitment — High

- **Situation where the champion loses value.** During an active supply-drop run or ring hold, the champion still takes `break crossfire` when two enemies have line of sight, even if neither has hit us in the last 2 s. That aborts the run. In the sim this flickers a lot: drop-run → crossfire flips 211→39 when the skip is on (384 games).
- **Evidence + n.** PR #129 research note `movement-iter3.md`, 384 paired games vs mode 0 on bot code that contains `6182d29`. Rings 12→14, holds 10→11, captures 10→12, games changed 22 (11 per 192-game set), alive at end 11→11, surv 180 s 0.141→0.130, died <40 s 110→110, pin seeds 41/43/72/92 unchanged. Sim score −0.016 ± 0.024 (information only).
- **Single decision changed.** While `dropMove` or `dropHold` is active, skip `break crossfire` unless a mech damaged us in the last 2 s. All other drop gates stay as the champion has them.
- **Why it should help late survival / placement.** Drops are the family that raised the official score from 4.06 to 4.17. Keeping a started run when we are not actually being hit should raise ring arrivals and captures. The sim is known to be almost blind to drop value (only ~53/192 alive at the first landing), so only the site can judge the gain. The 180 s survival dip is a real uncertainty to watch, not a sim veto.
- **How often it could matter.** 11 of 192 games change score or outcome on each official seed set. The underlying flip count is larger (211→39 over 384). Above the ~10/192 bar.
- **Closest previous test + receipt.** B113 reach 200 m, 4.17 KEEP (BB-09AE8A68); B118 260 m, 4.17 tie (BB-BAC9670C); B115 lead 10 s, 4.13 CLOSE (BB-D76FEDCF); P20 hurt+unseen, 4.17 tie (BB-36A427E0); P21 lone contest, 4.17 tie (BB-1D97890A), trigger 1/192. None of those skipped crossfire during a run.
- **What would disprove it.** A complete official screen of the site SHA that loses drop-ring arrivals, adds long pins, or raises deaths before 40 s; or an official score at or below 4.17.
- **Rank note.** Drop *tweaks of the same lever* just tied or lost; this is a different lever, so it is not automatically parked, but it must stay a single isolated flag.

## 2. P25 — cube memory (`CUBE_MEMORY_ON`) — Medium (runner-up)

- **Situation.** The champion’s farm (B12/B13) only walks to a cube that is in view, with a short radius (hunt 80 m for cubes in the original stack, later hunt 150 m for drones/crates). A cube that was seen and then left the 120° wedge is forgotten.
- **Evidence + n.** Watcher SKILLS.md idea 1, 93 showdown matches: idle cubes/min 3.94 vs 2.27 (high vs low), mid-phase 5.11 vs 3.12, detour not the issue (1.34 vs 1.28). Site history: B12 +0.06 and B13 +0.10 were official keeps. PR #136, branch `p25-cube-memory` `b34271c` (PR opened 5:47 PM ET) reports gate PASS max 3.3 ms, flag-0 eqdrive identical, base-0 96-game hazard: fired in 14/96 games, 14 different outcomes, 11 different scores, pins 190→160, longest 49 s unchanged, **new 30 s pin on seed 72**, drop rings 3/5 unchanged, died <40 s 33→33, paired −0.052 ± 0.088 (info only). No 2000+3000 / 4000+5000 screen yet.
- **Single decision.** With the existing `farmOk` gate and nothing for B12/B13 to walk to, walk to the nearest remembered or visible zone-safe ground cube within 150 m, with TTL, sticky target, and a strict give-up / skip list.
- **Why it should help.** More mid/late cubes without inventing a new fight rule. Distinct from P23’s standing torso sweep (vetoed for a 64 s pin) and from P23b’s sweep-plus-abort (official 4.00, BB-AEFC0FA8).
- **How often it could matter.** Not yet measured on 192+192. Unknown until the full screen. Do not invent a count.
- **Closest previous test + receipt.** P23 veto (no site receipt); P23b 4.00 CLOSE (BB-AEFC0FA8); B12/B13 earlier keeps in the stack.
- **What would disprove it.** Full screen shows fires under ~10/192, new long pins (seed 72 is already a warning), fewer drop-ring arrivals, more deaths before 40 s, or an official score ≤ 4.17.
- **Rank note.** Farm-walk family just lost. Mechanism is distinct, so it stays on the queue, but below mode 36 until the pin and the full screen are clean.

## 3. Midring patrol when farm is open and the list is empty — Medium

- **Situation.** When `farmOk` and nothing is in view (or in memory, once P25 exists), the champion holds. Watcher: high teams hold 24.6% vs 40.1% (mid-phase 28.5% vs 48.2%), and speed while healthy and not engaged is 7.21 vs 4.35 m/s (n: 54/56 matches in the mid-phase hold bucket; SKILLS.md).
- **Single decision.** Walk a short zone-safe midring path (zratio about 0.40–0.70) instead of holding, and break for zone, drop, engage, or a new item.
- **Why it should help.** Idle pickup rate is the same skill as P25; standing still is when high teams pull away on cubes. Not mid-game unstuck (B122 was vetoed) and not a standing sweep (P23).
- **How often.** Not measured vs house bots. P-D-010 (en-route delay) should inform this before a build if it reports how often a hold/delay changes arrival or survival.
- **Closest previous test.** B122 unstuck VETO (do not site-test); P23 / P23b (different trigger). No official receipt for a midring patrol.
- **Disprove.** Pins, drop-ring regressions, early deaths, or fires under ~10/192 on the official screen.
- **Depends on.** Better with P25’s memory list so the patrol has somewhere to go; can be specified alone.

## 4. Boost on healthy farm and travel, keeping an energy reserve — Medium

- **Situation.** Watcher: boost while healthy and not engaged is 8.1% vs 1.8% of ticks (15938/17643 ticks, 88/86 matches). High teams spend energy (mean 88.2 vs 94.2). The gap shrinks in a fight (34.6% vs 32.7%).
- **Single decision.** When HP ≥ retreat line, no recent damage, not engaged, and the goal is farm, hunt, zone travel, or a drop approach, boost if energy is above a 40–50% reserve.
- **Why it should help.** Faster safe trips to the same objectives that already scored (drops, farm). Not a general “move faster.”
- **How often.** Unknown against house bots. **P-D-010 is the measurement** (assigned 5:50 PM ET, not ACKed): count games where healthy unengaged travel delay changes arrival or survival; build only if ~10/192 on both sets.
- **Closest previous test.** No site receipt for a healthy-travel boost flag. Movement modes 32/34 (sprint/hops) failed sim drop-rings and late survival — those were combat sprints, not this gate.
- **Disprove.** P-D-010 finds the delay rarely changes arrival/survival; or a build arrives at fights with an empty bar and loses late.

## 5. After a shrink, settle in the midring and farm — Medium / Low

- **Situation.** After we are already inside the circle, the champion can walk toward the exact center or hold there. Watcher: overall center share is a tie (36.9% vs 37.4%). Among mechs alive ≥60 s, the 20–40% center-time bin has mean place 4.14 and 12.01 cubes vs 6.29 and 7.42 at ≥60% center time (115 mech-matches, 66 matches). Most high-team cubes are midring (909) not center (638).
- **Single decision.** Prefer a midring sit/patrol (zratio ~0.40–0.70) over camping the origin or hugging the edge, under `farmOk`, with drop run and zone-first travel still above it.
- **Why it should help.** This is the alternative to a center-hold, which the same Watcher pass does not support. Combine with ideas 1–2 to actually pick up cubes.
- **How often.** Not measured in the sim. Final-circle samples are too small (SKILLS.md); any rule should stay off or loose at r ≤ 70.
- **Closest previous test.** No official center-camp or midring-settle receipt. Zone-early timing (P-D-007 Step B, PR #125) failed in sim and got no slot — different decision (when to leave, not where to stand).
- **Disprove.** Midring sits miss drops or the next shrink, or add pins.

## 6. Orbit and fade in a gun or laser fight — Low

- **Situation.** In a fight we have already chosen, the champion walks down the bearing. Watcher: while engaged and moving, radial speed is −1.12 m/s (high) vs +0.53 m/s (low), d=−0.49 (127/114 mech-matches, 66/63 matches). Lateral speed 5.79 vs 5.16. Strafe-*aim* is already a tie, so the skill is “don’t close,” not “strafe more.”
- **Single decision.** With a clear gun or laser shot, visible target, and not in a lightning-commit or finish-rule walk, add a lateral offset with a slight fade. Leave ambush, finish, standoff break, and retreat alone.
- **Why it might help.** House bots also shoot a target that walks straight in. More matchup-dependent than ideas 1–3, so it ranks lower (SKILLS.md’s own caveat).
- **How often.** Not measured.
- **Closest previous test.** Danger-strafe / hops (movement modes 31/32/34) failed oscillation, drop rings, and late survival. B123 late-hurt kiting was VETO, do not site-test. B27 strafe lost on an earlier official test (3.38).
- **Disprove.** Drop-ring regression, pins, early deaths, or never closing when a finish/lightning walk is required.
- **Rank note.** Recently failed cousins in the movement/evasion family. Park until a screen can isolate this exact fade without the failed strafe package.

## 7. HEAL_COVER=1 (noSneak gap only, `c3a5d11`) — Low

- **Situation.** While healing, the champion stands still most of the time and is often seen; `noSneak` can turn off the existing hide walk. Research (`heal-positioning.md`): the noSneak exposed-stand slice is 54/192 and 60/192 games on the two seed sets (~57/192). The full rule (HEAL_COVER=2) would fire in ~166/192.
- **Single decision.** `noSneak` no longer turns off the existing heal hide walk. No new hide search.
- **Why it was thought to help.** Fewer exposed stand-still heals, more HP into the end game.
- **How often.** Research says ~57/192 (champion instrumentation, not a paired screen of `c3a5d11`).
- **Closest previous test + receipt.** **P24 HEAL_COVER=2, official 3.79, BB-BE220066, CLOSE (−0.38).** Late 2000+3000 screen of that SHA: fired 85, different score 52 (18 better / 34 worse), sim −0.286 ± 0.133.
- **Disprove.** Already strongly challenged by the official loss of the larger rule. A smaller cut in the same family would need a distinct reason it avoids whatever P24 did in those 34 worse games, plus a complete screen of `c3a5d11`. Until that exists, this is parked.

## 8. En-route travel delay (P-D-010) — measurement, not a build

- **Situation.** Healthy, unengaged travel to a safe objective may be slow (replans, detours, no boost). Watcher travel/boost numbers are in SKILLS.md and in item 4 above.
- **Single decision.** None yet. Step A measures where the delay is and in how many games/192 it changes arrival or survival. Step B, only if ~10/192 on both sets, proposes one decision. Assigned to Diego’s Claude, 5:50 PM ET, **not ACKed** at audit time.
- **Disprove.** Delay rarely changes arrival or survival — then do not build a “move faster” flag.
- **This is the researched replacement behind the reserve**, not a competitor to mode 36 or P25 for the next click.

## Parked / not a site idea

- P23 / P23b late farm sweep: veto, then official 4.00. Do not recycle the sweep.
- B125 six-tactic package: official 3.50; held-out drop rings 6→1. Do not resubmit the package. Any surviving tactic must be isolated.
- P-D-008 laserSkip comeback: 4/192 and 3/192, no Step B (PR #131).
- P-D-009 two-horizon race disagreement: 9/192 and 10/192, mixed outcomes, Diego recommended no build (PR #132).
- PR #133: sim-tooling, not a bot idea.
- B116 movement mode 6: on hold (Doug, 3:07 PM ET).
