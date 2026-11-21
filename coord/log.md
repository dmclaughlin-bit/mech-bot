# Coordination log

Append-only. **Each worker Claude adds one entry in the same push as every change**, newest at the bottom. Grok, the coordinator, reads only what is on GitHub: this file, open PRs, `EXPERIMENTS.md` and the plan. It then writes the next prompts, which Diego's Claude commits to `next-doug.md` and `next-diego.md`. Work on a branch counts: log it on that branch and in its PR description. Rules and roles: `../AI-Structure-Development.md`.

Format:

```
## <Day HH:MM ET> · <Doug|Diego> · <task>
- Did: <one or two lines, with PR or commit>
- Result: <check.py numbers, practice score, or "not submitted">
- Found: <anything the other side should know: a rule, a bug, a number>
- Blocked / next: <one line>
```

---

## Fri 20:00 ET · Diego · Align both Claudes on one plan
- Did: merged the team plan (#1) and research (#3) into one PR, rewrote `AI-Structure-Development.md` as the single source of truth, removed five redundant research docs, added `coord/`.
- Result: Build 1 (`main` @ `76aabfa`) re-checked: `check.py` PASS, 300/300 in time, p99 1.5 ms.
- Found: Build 1 picks up mortars, shoots any visible enemy up to 230 m, and ignores terrain in its cover check. Decisions D3 to D5 in the plan fix these in Build 2.
- Blocked / next: Diego submits S1 now. Doug starts Build 2 (`next-doug.md`).

## Fri 20:15 ET · Diego · Behavior rulebook
- Did: cross-referenced the tactics and game-bot research reports and added the ranked rulebook as §9 of the plan (PR #4).
- Result: docs only.
- Found: the tactics report's `U_fight` risk term `(16 − n)/8` is backwards (0 at 16 alive). Use the game-bots engagement gate (F1) instead, tighter while more than 8 are alive.
- Blocked / next: Doug builds the rules tagged Build 2.

## Fri 20:20 ET · Diego · Grok as coordinator
- Did: added `coord/GROK_BRIEF.md`, made Grok the coordinator in plan §4, and made a `coord/log.md` entry mandatory in every push (plan §5, both next prompts).
- Result: docs only (PR #4).
- Found: Grok can't push, so Diego's Claude commits Grok's prompts into `coord/next-*.md`. Grok reads raw files from `main`, so PR #4 must be merged first.
- Blocked / next: merge PR #4, then start Grok with the onboarding prompt.

## Fri 20:22 ET · Diego · S1 logged
- Did: logged S1 score for Build 1 (`76aabfa`)
- Result: 1.67 (+0.52 vs kit)
- Found: —
- Blocked / next: Doug starts Build 2; Diego starts nav.ts

## Fri 20:30 ET · Diego · nav.ts (Build 3 module)
- Did: added `nav.ts` (plan §4 interface: `createNav`, `path`, `eta`, `stuck`) and `tools/nav-bench.ts` on branch `nav`. 2 m A* with integer costs, typed-array heap, closed stamps, component labels, string-pulled waypoints, 20-query warm-up. No changes to Doug's files.
- Result: kit arena, bun 1.4.4, 1,000 random queries at budget 30k: median 0.33–0.36 ms, p99 6–8 ms, max 8.3–10.1 ms (3 runs). At budget 20k: max 6.3–7.1 ms. Grid build 90–110 ms, `createNav` with warm-up under 200 ms, 65 MB RSS. 448/448 checked paths stay on free cells.
- Found: worst case is set by `budget` (about 0.25 µs per expansion), so use 20k for in-tick calls. 72% of 2 m cells are walkable; the largest region holds 94% of them, so a cross-region query returns null at once. Ground only: no jets, no planned drops, no roofs. `stuck()` is stateful: call it once per decision.
- Blocked / next: Doug wires `nav.path` / `nav.eta` / `nav.stuck` into `brain.ts` for Build 3 (Sat AM).

## Fri 20:45 ET · Doug · Build 2: survival-min
- Did: 9 commits on `build-2` (head `3d53993`, one per change in `next-doug.md`): createBot never throws (fallback bot); terrain in `clearLine`, map code moved to `map.ts`; laser or lightning only, none with an enemy within 160 m, swap the gun out only with no enemy in view; gun fire gate (100 m, or hitting us, below 50% HP, or not moving sideways); zone travel Z1 plus silent hold; jump only when stuck; retreat walking backwards below 35% HP under fire; upgrade order L4; six knobs in `params.ts`.
- Result: `check.py --map-dir arena` PASS: 300/300 in time, p99 0.6 ms, max 0.8 ms, ready 339 ms. Run with node 24 because bun isn't installed on Doug's Mac. Replay of `check/stream.jsonl.gz` through `brain.ts`: 0 errors. Not submitted.
- Found: all 22 upgrade ids are in the kit's recorded hello (`check/stream.jsonl.gz`): plating, armor, servos, capacitor, reactor, jets, nanites, gyros, sensors, gun_damage, gun_rate, gun_velocity, gun_mag, mortar_splash, mortar_reload, mortar_velocity, laser_charge, laser_damage, laser_pierce, lightning_chain, lightning_range, lightning_efficiency. Doug's workspace has `tools/replay.ts` (plays the recorded match through `brain.ts`, prints decisions and timing); Diego owns `tools/`, so adding it is his call. The private repo `mech-bot-plan` is superseded by `coord/` here: nobody should write there. Doug's private notes differ from §9 on which fighter to third-party and on weapon picks; Doug will raise both with Diego directly.
- Blocked / next: Diego submits Build 2 and logs it; please run the gate once with bun and the Docker flags, which Doug can't. Doug waits for `next-doug.md`.

## Fri 20:53 ET · Diego · nav branch synced with Build 2
- Did: merged `main` (Build 2) into `nav` to clear the `coord/log.md` conflict on PR #5. No code changes; `nav.ts` still touches no file Doug owns.
- Result: not submitted. Bench numbers in PR #5 unchanged.
- Found: `next-diego.md` on `main` still holds the nav.ts task, which is done (PR #5).
- Blocked / next: Doug reviews and merges PR #5, then wires nav into Build 3. Grok writes the next Diego prompt.

## Fri 21:02 ET · Diego · S2 logged
- Did: logged S2, Build 2 (`4726cfc`), submitted Fri 8:55 PM ET, in `EXPERIMENTS.md`.
- Result: 2.17 (+0.50 vs S1's 1.67, +1.02 vs kit baseline 1.15). Answer wait 131 ms total. Board rank: 72nd of 94 (median team 3.27, top 5.23).
- Found: Q3 closed: the track page says the leaderboard ranks each team's best practice score, and at the cutoff the best submission is entered in the final unless the team picks another ("Pick as our final entry" button). Q2: the track page shows no replay links; still open. Limit is 4 submissions an hour.
- Blocked / next: S3 = identical `4726cfc` around midnight. PR #5 (nav) still waits to merge so Doug can wire Build 3.

## Fri 21:07 ET · Diego · PR #5 (nav) merged
- Did: brought `nav` up to date with `main` (merge, not rebase, since the branch already carried a merge of Build 2; the only conflict was `coord/log.md`, all entries kept in time order), then merged PR #5. Ground module as reviewed: no jet edges, no other behavior change. `nav.ts` and `tools/nav-bench.ts` are now on `main`.
- Result: not submitted. Bench re-run on the merged tree, numbers in the PR description still hold.
- Found: Grok's latest `next-doug.md` and `next-diego.md` were already committed on `main` (`bbc236e`), so step 4 had nothing new to commit.
- Blocked / next: Doug wires `nav.ts` into `brain.ts` for Build 3. Diego resubmits `4726cfc` unchanged as S3 around midnight.

## Fri 21:35 ET · Diego · Grok brief: test-to-test improvement loop
- Did: rewrote `coord/GROK_BRIEF.md` around a loop run after every practice score: find the parent, compute Δ, keep/revert by the noise table, repeat checks (S3 decides determinism, then threshold = 2 × SD of repeats), one §9-rule hypothesis per submission, and reading top teams' public bots for ideas (no code copying). Fixed constraints are listed; the rest Grok may adapt and record in the new `coord/learnings.md`. `EXPERIMENTS.md` gains a Parent column; plan §8 lists `learnings.md`.
- Result: docs only, not submitted.
- Found: a score is roughly how many mechs die before us (protocol §4), so 2.17 means we usually die 2nd to 4th of 16; survival rules should come before fight or loot rules.
- Blocked / next: merge this PR, then restart Grok with the new start prompt. Grok's output now has two more sections (Next submissions, optional Learned / Process changes) for Diego's Claude to commit.

## Fri 21:40 ET · Diego · D9: qualify first
- Did: changed plan D9 and `coord/GROK_BRIEF.md`: practice score is the target until we're about 0.5 above the 32nd team's best, then tune for the final again. Grok tracks the 32nd-place score each update.
  Brief also gives Grok a qualifying order: Build 3 (nav), then break LOS + heal + sight cones (F3, F4, Q2) ahead of Build 4, then full F2, then dodge.
- Result: docs only, not submitted.
- Found: only the top 32 practice teams play the final (buildathon brief). The brief's "any valid entry qualifies" held at ~31 teams; there are now 94 and we were 72nd.
- Blocked / next: Doug's Build 3 (nav) is the next submission after S3.
