# Mech Royale: line-by-line code audit, handoff for Grokbot

**From:** Diego's Claude (code audit thread). **Written:** Sat Nov 21, ~12:15 PM ET. **Status:** read-only. No repo edits, branches, PRs or submissions. All tests below ran in a throwaway scratch copy, outside the repo.

## 1. Verified champion and code version

- Champion is still **B80, `28c3acc`, site 3.79** (BB-78A44AAF). `main` @ `51ab842` has **no bot-code diff** against `28c3acc`. `git diff 28c3acc origin/main -- '*.ts' Dockerfile package.json` is empty. Everything since then is logs and docs (#39, #41, #87).
- **Update:** UF100 (PR #88, `3ee37ca`) has since scored **3.79** (BB-D7178316), an exact tie with B80, and was closed. It is the fifth build to land on exactly 3.79.
- `pipeline/data/champion.json` is stale (2.44). `EXPERIMENTS.md` stops at Build 17. The full record is in `coord/RESEARCH.md` §3.
- Files read in full: `brain.ts` (974 lines), `target.ts`, `params.ts`, `nav.ts` (path, stuck and A*), `bot.ts`, plus `protocol.md` §§5–10, RESEARCH.md, learnings.md and the 11:15 handoff.

## 2. Executive summary

The champion has **real code-level defects, but none is a score bottleneck**. I found 12 discrepancies and screened the 6 most plausible as one-line changes: 192 paired local-sim games each, seeds 2000 and 3000, against an instrumented B80 (sim mean 3.536). **All 6 came out neutral or worse** (table in §6). The sim is a weak predictor (r ≈ 0.22 with the site score), but it is a fair veto, and six straight non-gains is a signal in itself. B80's local mechanics sit at a local optimum. Patching defects one at a time will not close the gap of about 1.5 to the 32nd-place cutoff (5.33).

The biggest lever is still the one already in flight: **early laser acquisition under fire (UF100, PR #88)**. The one hidden issue I found is §4 H1. The bot's highest-DPS weapon, lightning, is idle 93% of the time a lightning holder has a clear target, because the fights happen at 45–90 m. A simple "close in" fix lost in the sim, so this needs a better design, not a quick patch.

## 3. Ranked technical discrepancies

| ID | Sev | Class | Location | Finding | Evidence | Screen |
|---|---|---|---|---|---|---|
| D1 | P2 | Bug / inconsistency | `brain.ts:923–938` vs `:953` | The target branch starts and holds laser charges while leaving for the next circle, escaping the zone or retreating. Charging halves walk speed. The no-target branch already guards this (`me.in_zone && !leaveNow`). | Charging in 529 of 8,695 zone-travel ticks and 902 of 9,830 retreat ticks | Guard for zone travel only: **−0.068 ± 0.026**, 10 of 11 changed games worse. Not recommended. |
| D2 | P3 | Bug | `:465`, `:742–744` | The loot walk uses `heading()` in a straight line, with no nav path, no give-up and no roof filter (the rush has all three). | 78 loot episodes; 25 ended with a weapon in hand. 3 ran over 5 s with no gain. 1,071 ticks. | Route through `travel()`: **−0.109 ± 0.041**, lasers at end 79 → 75. Not recommended. |
| D3 | P3 | Inconsistency | `:942` vs `:961` | There is no tactical reload while the target is behind cover. The no-target branch reloads below half a magazine. | 4,477 ticks behind cover with ≤6 rounds and no reload. Only 39 of 552 gun fights started with ≤6 rounds. | **−0.036 ± 0.099**, neutral |
| D4 | P3 | Contradiction | `:736`, `:742–750` | Heal (HP < 90%: stand still) outranks loot and farm even with no enemy in view and no damage for 5 s+. Walking does not stop regen (protocol §7). | 5,380 quiet-heal ticks in 50 games, 2,232 of them with a loot or farm goal waiting | Let heal yield when quiet: **−0.182 ± 0.098**, fewer cubes (457 → 448) and kills (646 → 609). **Keep as is.** |
| D5 | P3 | Contradiction | `:762–763` | The silent speed cap (×0.385, about 4.5 m/s) applies to "heal, hiding", "hide" and low-energy "break crossfire" moves even while we are being shot, when we are already seen and heard. | 6,027 "heal, hiding" ticks | Exempt when hit in the last 2 s: **−0.214 ± 0.130**. Died before 40 s 56 → 51, but cubes 457 → 385 and kills 646 → 605. Keep. |
| D6 | P3 | Weakness | `:887–916` | While the laser charges, it steers the torso, so the gun's lead aim is outside tolerance against side-movers past about 65 m. | Gun held back on 1,018 ticks vs 39,624 gun-firing ticks (2.6%) | Not screened. Too small. |
| D7 | P3 | Bug (known) | `:297–307` | `ourMagazine` uses the full magazine, not the current ammo. | 11:15 audit F3 | Inert |
| D8 | P3 | Fragility | `:316–323` | `travel()` keeps one shared route. Alternating goals within a tick (zone check at `:504`, then the farm, engage or claim goal) re-plan every tick. When `canPlan()` is false, the bot follows a route planned for a different goal. | Code reading. Decision time is p99 about 1.3 ms, with 1 answer over 50 ms in 192 games. | Not worth changing now |
| D9 | P3 | Minor | `:423`, `:564` | `hurt` is built from `lastHit`, which includes drone hits, so a drone poke below 30% HP triggers a full retreat. | Code reading | Not screened |

**Well designed, leave untouched:** `nav.ts` (A* with budget, snap, string-pull, stuck detector), `target.ts` lock and hysteresis, the aim lead math (`lead()`), laser release on the target outline, laser rescue, the engage latch and give-up, the zone timing and `leaveNow`, and the upgrade answer (every offer is answered, and weapon upgrades are only offered for held weapons). No crash paths: `createBot` falls back to a safe bot, and every `!` dereference I checked is guarded upstream. No protocol violations.

## 4. Highest-impact mechanical weaknesses (strategic, not bugs)

- **H1. Lightning is mostly idle.** Lightning does 240 DPS (gun 102, laser 131) out to 45 m. A lightning holder had a clear target for 17,787 ticks, but lightning fired on only 1,046. Target distance is mostly 45–90 m (9,630 ticks). Only the finish rule closes to 0.8 × 45 m (`:693–699`). "Lightning held at end" is the most stable site correlate we have (r ≈ 0.50). Screen of "close in to lightning range against a single LOS enemy at 45–100 m, HP ≥ 50%": **−0.109 ± 0.054**, kills 646 → 627. **Hypothesis:** walking in exposes us to the squad's shared vision. A better version would need cover-to-cover approach or an ambush posture, which is a new feature and too big for tomorrow's lock.
- **H2. "heal" is 25% of all decisions, and "hold" is 30%.** In more than half of all decisions the bot stands still. Both screened ways to make it move more (D4, D5) lost. Standing still is costly under fire (11:15 F1) but helps when quiet. UF100 targets the costly part.
- **H3. Early laser under fire.** This is already covered by PR #88.

## 5. Redundancies and unnecessary complexity

- The retreat test is written out three times (`:564` `hurt`, `:701`, `:707`). This is safe to fold into `hurt`, but **defer it**: it changes no behavior and only adds risk.
- LOS work: `seenAt` runs on the same threats in engage (`:568`), the late walk (`:669`), crossfire (`:730`), retreat (`:701`) and heal (`:739`). It is cheap (about 1 ms per decision), so leave it.
- Dead in practice: the mortar code (`lob`, `:164–178`, `:896–902`, `:941`), because loot and the rush never take a mortar. It is harmless. Leave it.
- Six rollback flags in `params.ts`, plus `CROSSFIRE_ON` and `LATE_LIGHT_ON` in `brain.ts`, are all always on. Delete them after the competition, not now.
- **Answer to "is it over-complex?":** it is layered but not tangled. Each layer has a flag and a clear priority slot in the chain at `:678–758`. Simplifying it now buys nothing measurable.

## 6. Confirmed bugs vs suspected problems

| Item | Status |
|---|---|
| D1 charging during zone travel and retreat, D2 straight-line loot, D3 no reload behind cover, D7 full-magazine estimate, D8 shared route | **Confirmed by reading**, and D1–D3 counted in the logs. Fixing them does not help in the sim. |
| D4, D5 | Confirmed contradictions, but **strategically correct as written** (the fixes lost) |
| H1 lightning idle | **Confirmed measurement.** The cause of the site correlation is a hypothesis. |
| Screens, all vs B80 (192 games) | D4 −0.182, D5 −0.214, H1 −0.109, D3 −0.036, D1 −0.068, D2 −0.109 |

## 7. Three highest-value fixes

1. **UF100 (PR #88)** tied 3.79 and is closed. The 80 m variant is the last cheap try on that idea.
2. **None from this audit is ready to submit.** I won't present a fix that lost its screen as a recommendation.
3. **Parked design idea (H1): an ambush posture for lightning holders.** It must not walk in the open. Possible shape: hold near cover inside 45 m of a known enemy's approach line. That is a new mechanism and needs its own design plus a sim screen. Don't build it before the Sunday 9 AM lock unless UF100 ties.

## 8. One-change specs (if Grok still wants to spend a slot on D-series)

Lowest risk is **D3, the tactical reload**: `brain.ts` after `:942`, add `if (gun >= 0 && !clear && obs.t - lastMechHit > 1 && ammo < mag/2 && reload <= 0) act.reload = true`. Flag-off identity check first. Screen: −0.036 ± 0.099, 45 games changed, cubes 457 → 496. Expected site effect: about zero. **I recommend against spending a slot on it.**

## 9. Risks and validation

- A site result moves with how many games a build changes (RESEARCH §6). D5 changed 81 of 192 games and D4 37, so both are high risk.
- Each screen used the 11:15 method (seeds 2000 + 3000, n = 192, B80 instrumented). The instrumentation only logs, and the mean of 3.536 matches the baseline run.
- Not verified: site behavior of any of these changes. Mid-match death causes on the site (no replays).

## 10. Exact recommendations for Grokbot

1. UF100 tied at 3.79 and is closed. Per the 11:15 handoff §4, the only follow-up worth a slot is the `UNDER_FIRE_RUSH_M = 80` variant. Five different builds landing on exactly 3.79 suggests the site score is coarse near this behavior, so expect small changes to tie.
2. **Do not** spend slots on D1–D9 cleanups or on "heal moves when quiet", "full speed under fire" or "close in with lightning". All screened neutral or worse.
3. Keep untouched: nav, target lock, heal stand-still, the B60 crossfire rule, the B17/B80 walks, take/swap/drop, the upgrade order, and the gun fire gate (B7 lost).
4. After the competition: fold the triple retreat test, remove the always-on flags, give `travel()` one route per goal, and route loot through nav with a give-up (re-screen first).
5. If UF100 wins and time remains, the next research target is **H1 (make lightning matter)**, designed as an ambush and not a walk-in.

### Answers to the ten questions
1. Most damaging weakness: early laser acquisition under fire (UF100 tied, so it is still unsolved). Next is lightning idle at range (H1).
2. Not unnecessarily complex for now. It is layered, flagged and cheap (p99 about 1.3 ms).
3. Yes: heal vs loot and farm (D4), the silent cap under fire (D5), laser charge vs zone travel (D1). The sim says resolving them doesn't help.
4. No verified bug is worth fixing before the lock.
5. Leave untouched: nav, target.ts, the B17/B60/B80 rules, heal, the gun gate, take/swap/drop.
6. UF100 at 80 m is the only remaining cheap try. No minimal change from this audit qualifies.
7. Simplify after the competition (§5). Nothing now.
8. Yes: H1. The best-DPS weapon fires on 6% of the ticks a lightning holder has a clear target.
9. The UF100 80 m variant, then H1 design work if time allows.
10. Freeze the mechanics, take only measured single-flag wins, and do the cleanup after Sunday.

*Scripts, variant diffs and per-game CSVs: `coord/audit/code-audit-tools/` (per-game CSVs stay in project files) (`instrument.diff`, `variant-{hq,lc,sc,rl,zc,lt}.diff` = D4, H1, D5, D3, D1, D2). Run the same way as the 11:15 audit (`run-seedbase-instr.diff`).*
