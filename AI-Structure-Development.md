# AI Structure and Development Plan

**This is the single source of truth for the team (Diego and Doug) and both of our Claude sessions.** Read it, then your own `coord/next-*.md`, before every task. If this file disagrees with anything else in the repo, this file wins. Change it only by PR.

**Deadline:** Sun Nov 22, 11:00 AM ET. **Lock the final build at 9:00 AM ET.**
**Score:** mean of (16 − place) per match. Placement only; kills just give cubes. Kit example bot: 1.15. Leaderboard top at research time: about 4.8.
**Evidence:** `research/FINAL_RECOMMENDATION.md` (the why), `research/GAME_CONTEXT.md` (one-page fact sheet), `research/protocol.md` (the rules, identical to the kit's).

---

## 1. Where we are (Fri Nov 20, 8 PM ET)

| Item | State |
| --- | --- |
| `main` @ `76aabfa`: **Build 1** (Doug) | Tracks enemies, leads the gun, charges and releases the laser, fires lightning in range, lobs the mortar over cover, holds fire into buildings, turns toward the last hit. Movement, targeting and upgrades are still the kit starter's. `check.py` PASS, re-run Fri 8 PM ET: 300/300 in time, p99 1.5 ms, ready in 220 ms. |
| Research (Diego's Claude) | Done. Merged into this repo by this PR. |
| Practice submissions | None logged in `EXPERIMENTS.md` yet. |
| Doug's private notes (`mech-strategy.md`, `LOG.md`) | Gitignored, so the other Claude can't see them. See §7, rule 4. |

## 2. The path: one plan

Build **one deterministic, rule-based bot in TypeScript on bun**, grown one rule at a time from Build 1, judged only by `check.py` and practice submissions. No RL, no simulator, no learned parts, no language switch. This is what both sides were already doing; the research and Build 1 agree on the architecture. Where they differed, these decisions settle it:

| # | Question | Decision | Why |
| --- | --- | --- | --- |
| D1 | Code layout | **Keep Doug's flat layout** (`bot.ts`, `brain.ts`, `mechfight.ts` at the root). New code goes in sibling files (`map.ts`, `nav.ts`, `params.ts`, `tools/`). Drop the research's `src/` tree and `params/*.json` + env var. | Build 1 works and passes. A tree refactor costs hours and buys nothing in 39 h. Separate files are enough to stop the two Claudes editing the same lines. |
| D2 | Build order | **Survival before more combat.** Build 2 is the "survival-min" bundle in §3. After that, one change per submission, in the §3 order. | Build 1 did research rank 6 (aim) first. Ranks 1 to 5 (safety, zone, face/retreat, nav, engagement gating) carry more points. Aim is now done and stays. |
| D3 | Mortar | **Never pick one up.** Keep Build 1's lob code, since it only runs if a mortar is held. | Lasers do +60% to a mortar holder, your own splash hurts you, and the mortar loses to the laser. Build 1 takes any non-gun pickup, mortar included. |
| D4 | When to shoot | **Gate fire.** Build 1 shoots the nearest visible enemy at up to 230 m. From Build 2 on, the gun fires only inside 100 m, or at a target that is shooting us, below 50% HP, or not moving sideways. | A gunshot is heard 320 m away and draws the squad. Past about 100 m the escape angle makes gun duels coin flips. Unprovoked fights at 16 alive cost about 7.5 expected points to gain about 0.5. |
| D5 | Cover check | **Add terrain to `clearLine`** (sample `terrain.i16`, already in `hello.map.files`). | The map has about 59 m of relief and shots stop on terrain (protocol §7). Build 1 only checks buildings, stadium and bridges, so it fires into hills. |
| D6 | Crash safety | The kit wrapper already catches `act()` throws and re-sends the last action. **Still needed:** guard `hello.map` in `createBot` (a constructor throw leaves a null bot all match) and add the 30 ms deadline guard **when A\* lands**, not before. | Build 1's p99 is 1.5 ms. The guard matters once search runs per tick. |
| D7 | Determinism test | **Resubmit the identical commit** instead of building a time-seeded RNG variant. | The bot has no RNG, so a plain resubmission answers the same question with zero code. Same score twice means practice is frozen: weigh mechanism over score, and add seeded tie-breaks. |
| D8 | Experiment log | One file, `EXPERIMENTS.md` at the root. | The research mentioned `research/EXPERIMENTS.md`; that copy is not created. |
| D9 | Tuning target | Tune for the **free-for-all final**, not practice. Hard caps: no even fights before zone phase 3, hold the next circle's edge silently (under 5 m/s), reach the final circle at full HP. Only `aggression` is tuned on practice. | In practice the 15 house bots act as one squad and hunt us weakest-first. In the final, other bots kill each other for us, and the final is what pays. |

### What both sides already agree on (no action)
- TypeScript on bun, the kit wrapper unchanged, every number read from `hello.config`.
- Face the attacker (rear hits do 1.5x). Build 1 does this for 2 s after a hit.
- Gun lead by iterated intercept, mortar by the ballistic formula, laser hold-to-charge then release.
- One change per submission, measured against a fixed parent.

## 3. Build queue

One row = one PR = one practice submission, except Build 2, which is the baseline bundle. Keep a change only if it gains about **+1.2** or more, or is clearly right on mechanism and costs no more than **−0.6**. Re-submit a winner before trusting it.

| Build | Contents | Owner | Target time (ET) |
| --- | --- | --- | --- |
| **S1** | Submit `main` @ `76aabfa` (Build 1) as it is. Earlier submissions win ties, and it gives us the first real score. | Diego | **Now** |
| **2: survival-min** | D3 to D6, plus: zone-ETA travel (leave when path ETA / (0.8 × walk) + 10 s ≥ time to `shrink_end`; boost only when that fails); walk under 5 m/s once inside the next circle; jump only when stuck (commanded move but speed near 0 for 0.5 s) instead of every 40 ticks; retreat walking backwards with the torso on the attacker when HP < 35% under fire; take laser or lightning only; upgrade order plating > armor > nanites > sensors > weapon > mobility. Knobs in `params.ts` (6 at most). The §9 rules tagged Build 2 are the spec. | Doug | PR by **10:30 PM**, submit by 11 PM |
| **S3** | Re-submit Build 2 unchanged (D7). | Diego | ~midnight |
| 3 | `nav.ts`: A\* on a 2 m grid (flatqueue, integer costs, closed stamp), jump/jet edges, stuck recovery; add the 30 ms deadline guard. | Diego's Claude writes `nav.ts`; Doug wires it in | Sat 9 AM to 1 PM |
| 4 | Enemy tracking past the game's 5 s memory, and engagement utility (`p_win`, U_fight) replacing D4's simple gate. | Doug | Sat AM |
| 5 | Break line of sight and position query (about 60 candidates scored on cover, zone, exposure, travel). | Doug | Sat 1 to 6 PM |
| 6 | Dodge reflexes: shells (step more than 7 m off the impact point), `charging` lasers (break LOS within 0.75 s). | Doug | Sat 1 to 6 PM |
| 7 | Supply drops (contest rules in research §5), third-partying a fight about 10 s after it goes quiet. | Doug | Sat 6 to 11 PM |
| 8 | Endgame: cubes to 10, final-center hold. | Doug | Sat 6 to 11 PM |
| Sweeps | `aggression` ×3, retreat threshold ×3. Trust trends, not the single best. | Diego | Sat evening |
| Final | Fix the worst observed failure only. Submit the candidate 3 times, pick by mean. **Lock 9:00 AM.** | Both | Sun 7 to 9 AM |

**Not doing:** RL or self-play, a simulator, behavior cloning, GOAP/HTN, a behavior-tree library, a `src/` refactor, mortar play, exploiting house-squad quirks, any large change on Sunday.

## 4. Who does what

Ownership is by file, so the two Claudes never edit the same lines.

| Who | Owns | Does |
| --- | --- | --- |
| **Doug + his Claude** (5x plan) | `bot.ts`, `brain.ts`, `map.ts`, `params.ts`, `Dockerfile` | All bot behavior, Builds 2 and 4 to 8, wiring `nav.ts` in, latency. Merges his own PRs once `check.py` passes. |
| **Diego + his Claude** (lighter plan) | `nav.ts`, `tools/`, `EXPERIMENTS.md`, this file | Submits to practice and logs every result. Writes `nav.ts` as a standalone module against the interface below. Writes the scenario harness in `tools/` when there's time. Closes the open questions in §6. Can veto a merge. |
| **Coordinator** (separate Claude, never writes bot code) | `coord/next-doug.md`, `coord/next-diego.md` | Reads `coord/log.md`, open PRs, `EXPERIMENTS.md` and this file. Flags duplicated or conflicting work, and rewrites each person's next prompt. Until it is scheduled, Diego's project thread does this on request. |

**`nav.ts` interface** (agreed now so the two sides can work in parallel):

```ts
export function createNav(hello: Hello): Nav           // builds grids at hello; never throws (returns a straight-line Nav on failure)
export interface Nav {
  path(from: Vec3, to: Vec3, budget: number): Vec3[] | null   // waypoints; null if no path within `budget` node expansions
  eta(from: Vec3, to: Vec3): number                            // seconds at walk speed, straight-line fallback
  stuck(me: SelfObs, commanded: [number, number]): boolean
}
```

## 5. How a change gets in

1. Branch from `main`: `build-N` (Doug) or `nav`, `tools-*` (Diego).
2. **Offline gate:** `python3 check/check.py --map-dir arena -- bun ../mech-bot/bot.ts` passes. Before Build 3, also run it once under the Docker flags in protocol §1. Once `tools/` exists, its cases pass too.
3. Open the PR, merge when the gate passes. Diego can veto.
4. Diego submits the merged commit and adds a row to `EXPERIMENTS.md` when the score comes back: time, commit, change, score, keep or revert.
5. The worker appends one entry to `coord/log.md` (format in that file).

At 4 submissions an hour, plan on about 50 in total. Never submit two changes at once.

## 6. Open questions (whoever has a free slot closes these)

| # | Question | Why it matters | How to close it |
| --- | --- | --- | --- |
| Q1 | Is practice deterministic? | If so, practice deltas measure fit to 48 frozen worlds. | S3 (D7). |
| Q2 | Are match replays public? | They would be our best data: our deaths and the house bots' behavior. | Check the team page after S1. |
| Q3 | Does the leaderboard keep the latest or the best submission, and which goes to the final? | Decides whether a late weak build can hurt us. | Track page / FAQ, before Sunday. |
| Q4 | Per-match SD (assumed about 4). | Sets the detectable delta. | From S1, S3 and repeats. |
| Q5 | Does a pure hider score near 0 in practice? | Decides how much aggression practice rewards. | One deliberate turtle variant on Saturday. |
| Q6 | Is the judge CPU slower than ours? | Timing margins assume up to 2x. | Keep p99 ≤ 15 ms locally. |

## 7. Rules

1. **Read all numbers from `hello.config`.** Balance can change.
2. **Runtime limits:** 50 ms per decision (hard guard at 30 ms once A\* exists, target p99 ≤ 15 ms), `ready` within 20 s, 1 CPU, 512 MB, stdout for protocol lines only, logs to stderr.
3. **No large refactor on Sunday.** After 9:00 AM, only changes already validated.
4. **Findings go in the repo.** Strategy that only lives in a gitignored file or one person's chat doesn't exist for the other Claude. Put non-secret findings in `coord/log.md` or a PR. Nothing secret belongs in this public repo.
5. **README credits** before the final: the kit, and flatqueue / flatbush (ISC) if vendored, and Diamond (zlib) if its min-risk idea is used.

## 8. Docs map

| File | What | Who writes it |
| --- | --- | --- |
| `AI-Structure-Development.md` | This plan, including the behavior rulebook (§9) | PR only |
| `EXPERIMENTS.md` | One row per submission | Diego |
| `coord/log.md` | Append-only status from both workers | Both workers |
| `coord/next-doug.md`, `coord/next-diego.md` | The next prompt for each person | Coordinator |
| `research/FINAL_RECOMMENDATION.md` | Research synthesis (evidence) | Frozen |
| `research/GAME_CONTEXT.md`, `research/protocol.md` | Fact sheet and rules | Frozen |
| `research/agents/`, `research/SOURCE_REGISTRY.md`, `research/bench/` | Detail behind the synthesis | Frozen |

This PR removed `research/README.md`, `FINDINGS_SUMMARY.md`, `RESEARCH_PLAN.md`, `ARCHITECTURE_COMPARISON.md` and `RESEARCH_GAPS.md`. They were the research process's own bookkeeping, and their content is in `FINAL_RECOMMENDATION.md` (§1, §6) or §6 above.

## 9. Behavior rulebook

The rules the bot follows, picked from `research/agents/tactical-strategy.md` (T) and `research/agents/game-bots.md` (G) and checked against `research/protocol.md`. Where the two reports disagree, the pick and the reason are given. **[H]** marks a starting value to tune. The Build column says when each rule goes in (§3). All numbers come from `hello.config` at runtime.

### Priority order (when rules compete, the higher one wins)

**Dodge > Zone escape > Disengage / regen > Supply drop > Third-party > Loot > Hold position** (G §5). Hard caps H1 to H3 below override everything except Dodge.

### Hard caps (never tuned, FFA-safe)

| # | Rule | Source | Build |
| --- | --- | --- | --- |
| H1 | No even fights before zone phase 3. Fight only under F1 below. | T §1, §8 | 2 (simple), 4 (full) |
| H2 | Arrive at the next circle early and silent (ground speed ≤ 5 m/s, move vector length ≤ 0.42), and hold its centroid-facing edge with the torso aimed inward. | T §3, G §3.6 | 2 (silent), 5 (edge) |
| H3 | Be inside the final circle at full HP. At r ≤ 70, take cover nearest the announced final center. Phase 5 and later: never cross zone. | T §1, §3 | 8 |

### Fight or leave

| # | Rule | Source and pick | Build |
| --- | --- | --- | --- |
| F1 | **Engage** only when all hold: my time-to-kill on them < 0.6 × theirs on me; no other enemy within 120 m has line of sight to me; my HP ≥ 50% or the target is one burst from death. A target below 50% HP, already fighting someone, or showing its back is what usually passes. | **G §3.3**, cross-checked with T §9. T's `U_fight` formula has a bug: its risk term `(16 − n)/8` is 0 at 16 alive, which contradicts T's own §1 (an even fight at 16 alive risks ~7.5 points). The real risk grows with the number still alive, so early fights need a near-certain win. G's three conditions are simpler and closer to right. Tighten the 0.6 to ~0.4 while more than 8 are alive **[H]**. | 4 |
| F2 | **Disengage** when their time-to-kill on me < 1.2 × mine on them, **or a second shooter appears**, or HP < 35% under fire. | **G §3.3 + T §2.** G's 1.2 is more cautious than T's 0.8, and the second-shooter trigger is what saves you in a free-for-all, so take both. | 2 (HP < 35%), 4 (full) |
| F3 | **Retreat walking backwards**, torso on the attacker (legs and torso are independent; a 180° torso turn costs 0.8 s). Head for the nearest in-zone point that breaks line of sight. Boost only if energy > 30%. | T §2, §9 and G agree | 2 (backwards), 5 (break LOS) |
| F4 | **Then heal:** stay out of contact, move ≤ 5 m/s, until HP > 90%. Regen gives 50% in ~20 s and 100% in ~36 s. | T §2, §9, G §3.3 agree | 5 |
| F5 | **Pursue** only if the target is below 30% HP, can be finished before it breaks line of sight, and nobody else is near. Abort after 8 s or at the zone edge. | T §9 only | 4 |
| F6 | **Third-party** a fight heard within 160 m (two gun sounds on one bearing), arriving in the ~10 s window before the winner starts to regen. A `death` sound (600 m) marks a weak winner and dropped loot. | T §6 | 7 |
| F7 | **Practice only:** house bots hunt the weakest. When hurt, prefer positions that break pursuit (buildings, height, boosting around corners). | G §3.3 | 5 |

### Aim and fire

| # | Rule | Source and pick | Build |
| --- | --- | --- | --- |
| A1 | **Face the threat.** Torso on the highest-threat track; snap to `damaged.bearing` when `rear` is true (rear hits do 1.5x and nearly halve survival time). | T §7, G §3.5 agree. Build 1 has this for 2 s after a hit. | 1 ✓ |
| A2 | **Hold gun fire when the predicted miss is over 4 m** (the target's sideways speed × flight time). In practice that means shooting inside ~90 to 100 m, or at targets not moving sideways. | **G §3.5** (escape angle 2.7° walking, 4.4° boosting). T §6 adds: a gunshot is heard 320 m away, so fire only when you expect to finish or can break LOS right after. Use G's 4 m test; it is the precise form of the plan's 100 m rule (D4). | 2 (100 m), 4 (4 m test) |
| A3 | Gun lead: iterate the intercept time 3 times. Mortar: ballistic formula, g from config. | T, G agree. Build 1 has both. | 1 ✓ |
| A4 | Charge your own laser only next to cover (you move at half speed while charging). | T §7 | 5 |
| A5 | Push while an enemy reloads (2.4 s; the reload sound carries 60 m). | T §2 | 4 |

### Dodge (reflexes, one tick, highest priority)

| # | Rule | Source | Build |
| --- | --- | --- | --- |
| R1 | **Gun bullets:** dodge only beyond ~75 m (90 m at 10 cubes). Closer in, trade or break LOS. Use random-interval reversals and stop-and-go, not steady strafing. | T §7, G §3.4 agree | 6 |
| R2 | **Mortar shells:** solve the impact point and get more than 7 m away (about 1.4 s of flight at 100 m). | T §7, G §3.4 agree | 6 |
| R3 | **Laser `charging` with its aim within 3° of me:** break LOS within 0.75 s (8.8 m walking, 14.6 m boosting), or short it with lightning if within 45 m. With no cover, at least face the shooter. | T §7, G §3.4 agree | 6 |
| R4 | For each incoming projectile with closest approach < 2.5 m + splash + 1 m, try 8 directions × walk/boost and take the largest miss, tie-breaking toward the current destination. | G §3.4 | 6 |

### Zone

| # | Rule | Source and pick | Build |
| --- | --- | --- | --- |
| Z1 | **Leave for the next circle** when distance / (0.8 × walk speed) + 10 s ≥ time to `shrink_end`. Use path distance once `nav.ts` exists, and add 2 s per enemy track along the route. | T §3 for the formula, G §3.6 for the per-threat buffer | 2 (straight line), 3 (path) |
| Z2 | **Crossing zone** costs dps × distance / speed, and every tick outside is pure loss (no regen, timer resets). Cross only if that's under 15% of HP and the in-zone route is at least 2× longer or passes an enemy. Phases 1 and 2 are fine, phase 4 only to escape a lost fight, phase 5 and later never. | T §3 | 2 |
| Z3 | If the circle is still open late, avoid all damage after ~440 s (timeout at 480 s ranks survivors by HP). | T §3 | 8 |

### Loot, cubes, upgrades

| # | Rule | Source | Build |
| --- | --- | --- | --- |
| L1 | **Target loadout: laser + lightning.** Keep the gun until both are in hand (no energy cost, 230 m). Never take a mortar. Never swap with an enemy in view (1 to 1.65 s lockout). | T §5; FINAL §5 adds "keep the gun until both". Mortar rule = plan D3. | 2 |
| L2 | **Loot only when no enemy is within 160 m.** Order: laser or lightning (whichever is closer), then cubes up to 10, then crates. A crate takes 7 gun shots and the noise carries 220 m. | T §5, §9 | 2 (weapons), 8 (cubes) |
| L3 | **Cubes to 10, then stop** (above 10 they only make you bigger), except to reach the upgrade thresholds at 15 and 21 or to take a drop's heal. | T §5 | 8 |
| L4 | **Upgrades:** plating > armor > nanites > sensors > primary-weapon upgrade > mobility. Always answer before `expires`. | T §5 | 2 |
| L5 | NPC drones: route more than 50 m around them. Farm one (2 cubes) only if no mech is within 160 m. | T §7 | 8 |

### Supply drops

| # | Rule | Source | Build |
| --- | --- | --- | --- |
| S1 | **Contest** only when all hold: HP > worst case from visible shooters + 150; no rival within 80 m; at most one enemy known within 150 m; already in cover 30 to 60 m away before it lands. | T §4 | 7 |
| S2 | **Otherwise third-party it** from 100 to 200 m behind cover, or step into the ring to freeze a rival's clock (it freezes, it doesn't reset: protocol §7). | T §4, FINAL §5 | 7 |
| S3 | **Ignore it** when it is more than 250 m off the rotation path, HP < 40% with 2+ enemies near, phase ≥ 4 on open ground with 3+ converging, or you already have 10 cubes at full HP. | T §4 | 7 |

### Stealth

| # | Rule | Source | Build |
| --- | --- | --- | --- |
| Q1 | Stay silent by default (≤ 5 m/s on the ground). Steps carry 40 m, boost 90 m. | T §6 | 2 |
| Q2 | Stay more than 45 m from enemies and outside their 120° vision wedge (their `aim` is observed). Trees hide you but don't stop shots. | T §6, protocol §8 | 5 |
| Q3 | Fuse sound bearings (σ 7°) into tracks over 2 to 3 hearings; keep tracks after the game's 5 s memory, growing uncertainty at 19.5 m/s, and drop them at σ > 150 m or 30 s. | G §3.1, T §6 | 4 |

### The tuning knobs (in tuning order)

1. `aggression`: scales F1's ratio and the third-party cost. **The only knob tuned on practice.**
2. Retreat thresholds (F2: 1.2, 35%).
3. Rotation buffer (Z1: 10 s, 0.8).
4. Drop HP margin (S1: 150).
5. Gun miss limit (A2: 4 m).
6. Edge offset (H2).
