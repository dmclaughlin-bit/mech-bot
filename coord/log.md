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

## Fri 21:15 ET · Doug · Build 3: wire nav.ts
- Did: 3 commits on `build-3` (head `1194f90`). Zone travel follows `nav.path` waypoints to where the line to the next center crosses the circle, re-planning at most once a second, and leaves when path distance / (0.8 × walk) + 10 s + 2 s per enemy known within 50 m of the route reaches the time left to `shrink_end` (Z1). Zone escape follows a path too. `nav.stuck` replaces Build 2's stuck check (jump, jet if airborne, then re-plan). 30 ms deadline guard: a path search (20k budget) starts only while the decision is under 20 ms, line of sight is checked for the nearest 8 enemies, and any decision over 30 ms is logged to stderr. No new knobs; `nav.ts` and `tools/` untouched.
- Result: `check.py --map-dir arena` PASS: 300/300 in time, p99 2.3 ms, max 4.5 ms, ready 476 ms (node 24; bun still not installed). Replays on Doug's Mac (node): normal p99 0.5 ms; forced trip to a circle ~280 m away, all 300 decisions traveling, p99 1.2 ms, max 2.0 ms; 15 enemies in view while traveling, p99 3.2 ms, with one 28 ms spike that two reruns didn't reproduce (max 1.4 ms). Not submitted.
- Found: `nav.eta` runs a full A* on every call, so Build 3 takes the ETA from the planned route's length instead (same number, half the searches). While twice the straight-line time plus buffers is still under the time left, the bot holds without planning at all.
- Blocked / next: **PR not merged on purpose.** Merging moves `main` to Build 3, and if the track page builds `main`'s head, S3 (the identical Build 2 resubmit) would test Build 3 instead. Diego: merge this PR right after S3 is in, or say if the form can take a commit and Doug's Claude merges now. The Docker-flagged gate (protocol §1) isn't run (no Docker on Doug's Mac): Diego, please run it before Build 3 is submitted.

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

## Fri 21:40 ET · Diego · Offline gate with bun
- Did: ran `check/check.py` with bun 1.4.4 (the Dockerfile's version) on Build 2 `4726cfc` and on current `main` (Build 2 + `nav.ts`, not yet wired), pinned to one CPU with `taskset`.
- Result: `4726cfc` PASS: 300/300 in time, p99 1.4–2.0 ms, max 3.3–4.0 ms, ready 272 ms. `main` PASS: 300/300, p99 1.1 ms, ready 171 ms.
- Found: the full Docker run (`--cpus 1 --memory 512m --read-only --user 65534`) could not run here: no Docker daemon in the cloud container. Someone with Docker should still run it once before Build 3 (plan §5). `next-diego.md` is unchanged: its nav task is done (PR #5 merged).
- Blocked / next: Diego resubmits `4726cfc` as S3 around midnight. Doug wires nav for Build 3.

## Fri 21:55 ET · Grok (for Doug) · Merge Build 3 + log S3/Build 3
- Did: merged PR #7 (Build 3, nav wired) into main, log conflict resolved keeping all entries; added S3 and Build 3 rows to EXPERIMENTS.md; committed new coord/next-doug.md, coord/next-diego.md, coord/learnings.md (bedde4f).
- Result: S3 BB-89ECDFF6 2.17 @4726cfc (same as S2); Build 3 BB-955D92D8 2.23 @406ab9f, +0.06, KEEP, auto final entry; board 9:40 PM ET 81st of 108, 32nd place 4.04.
- Found: submit form takes an optional 40-char commit, so unmerged SHAs can be submitted; practice looks deterministic.
- Blocked / next: Doug starts build-5-survive (F3/F4/Q2); Diego opens the plan PR + tools/ watch recorder.

## Fri 22:09 ET · Doug (via Grok's Claude) · Build 5 survival half: F3/F4/Q2
- Did: one commit on `build-5-survive` (off `main` @ `12697c8`, parent build `406ab9f`), `brain.ts` only, no new knobs. F3: hurt (< 35%) under fire and seen by a visible enemy → walk/boost (energy > 30% only) to the nearest in-zone spot no enemy has line of sight to, torso still on the attacker; no such spot, or hit by someone unseen → Build 2's backwards retreat. F4: below 90% HP → heal: stand still, ≤ 5 m/s, no new shots unless hit in the last 2 s, no looting; if seen, sneak to the nearest hidden spot. Q2: when holding and an enemy sees us (within `vision.near_range`, or within `vision.range` and its `fov_deg` wedge around its observed `aim`, eye at `mech.eye_height`, buildings + terrain via `clearLine`; trees ignored), sneak silently to the nearest spot it can't see. Spots: 12 bearings × walk distance in 1/2/3 s, nearest first, straight-line reachable, inside the current circle (inside the next circle once there), never closer to an enemy; stops at the 20 ms planning guard. Q1 unchanged (silent inside the next circle; heal/hide moves are silent everywhere).
- Result: `check.py --map-dir arena` (bun 1.4.4) PASS ×2: 300/300 in time, p99 0.9 / 1.1 ms, max 1.4–1.8 ms, ready 221–228 ms; pinned to 1 CPU (`taskset -c 0`): PASS, p99 3.6 ms, max 5.8 ms, ready 357 ms. `tsc --strict --noEmit` clean, `bun build` OK. Replay of `check/stream.jsonl.gz` through `brain.ts`: every new mode fires (hide, heal, heal+hiding, retreat to cover), p99 ≤ 0.6 ms, max 1.2 ms even with HP forced to 20%. Docker gate not run (no Docker here). Not submitted.
- Found: the hide search costs only while we are seen (one LOS check per nearby enemy otherwise). Heal now holds fire unless we're being hit: a deliberate F4 reading (dealing damage restarts the 5 s regen timer, protocol §7), worth watching in the score.
- Blocked / next: Grok submits by SHA.

## Fri 22:11 ET · Doug (via Grok's Claude) · Build 5b: F4 keeps firing (staged A/B variant)
- Did: one commit on new branch `build-5b-f4-fire` (off `build-5-survive` @ `2a0cbad`), `brain.ts` only: removed the F4 `quiet` gate, so while healing (HP < 90%) targeting and firing stay normal instead of shooting only when hit in the last 2 s. F3, Q2, silent moves and hiding spots identical to Build 5. Code commit `34e778a`. Staged A/B variant of Build 5: to be submitted by SHA, no PR, not merged.
- Result: `check.py --map-dir arena` (bun) PASS ×2: 300/300 in time, p99 0.9 / 0.7 ms, max 2.2 / 1.7 ms, ready 256 / 249 ms. `bun build bot.ts --target=bun` OK. Not submitted.
- Found: the A/B isolates the F4 fire choice (dealing damage restarts the 5 s regen timer vs. trading shots while hurt); compare against Build 5's score.
- Blocked / next: Grok submits this branch's head SHA alongside Build 5 (`2a0cbad`).

## Fri 22:16 ET · Grok · Submit Build 5, stage A/B
- Did: submitted PR #10 head `2a0cbad` by SHA (BB-AA244730). Not merged. Staged variant branch `build-5b-f4-fire` (same as Build 5 but heals without the F4 fire gate) for the next slot.
- Result: 2.04 vs parent Build 3 2.23 (−0.19), inconclusive. Board 10:15 PM ET: 89th of 119 on best 2.23; 1st 5.48, 16th 4.52, 32nd 4.13.
- Found: the F4 "only fire if hit in the last 2 s" gate is the likeliest cost. Loop now runs every 15 min (4 submissions/hour); a match watcher is collecting top-team data.
- Blocked / next: Grok submits `build-5b-f4-fire` at the 10:21 PM slot; keep whichever scores higher, revert both if neither beats 2.23 + noise.

## Fri 22:28 ET · Grok · Doug's Claude handoff; deterministic scoring rule
- Did: committed `coord/handoff-doug-claude.md` (Doug's Claude stopped; nothing uncommitted). Grok's Claude builds from now on.
- Result: rule change: practice is deterministic, so a change is judged by its raw score delta (any drop is a loss); Build 5 (2.04, −0.19) is a LOSS and PR #10 will be closed unless `build-5b-f4-fire` beats 2.23. Docker-gate item closed.
- Found: house bots never kill each other; we only gain places by kills or outlasting them in the collapse. Watch recorder now runs continuously.
- Blocked / next: after 5b scores, next single changes in order: hold behind cover; then drop D4's 100 m gun gate in practice (H1-H3 stay per D9).

## Fri 22:35 ET · Grok · Build 5b kept and merged
- Did: merged PR #11 (`build-5b-f4-fire`) as `516f3b3`; closed PR #10 (Build 5 with the F4 fire gate).
- Result: 5b scored 2.38 (BB-54EDF93F) vs Build 3 2.23 (+0.15) and Build 5 2.04. KEEP. Board 10:24 PM ET: 88th of 121; 1st 5.48, 16th 4.52, 32nd 4.15.
- Found: fire gates cost practice points (F4 gate was −0.34), which supports the handoff's point 3.
- Blocked / next: Build 6 "hold behind cover" rebuilt off the new main; after it, drop D4's 100 m gun gate in practice.

## Fri 22:40 ET · Grok · Build 6 reverted
- Did: submitted PR #12 head `1386dd1` (BB-BC5A52AB); closed it without merging.
- Result: 2.23 vs parent 5b 2.38 (−0.15), a loss. Board 10:36 PM ET: 93rd of 127; 1st 5.48, 16th 4.54, 32nd 4.17.
- Found: moving to cover while holding cost points as implemented. Winners hold behind buildings, but repositioning likely cost shots or exposure. Don't retry without a different mechanism (e.g. only reposition when no enemy is visible).
- Blocked / next: Build 7 (drop the 100 m gun gate) off main at the 11:10 PM slot.

## Fri 22:45 ET · Grok · Build 7 reverted
- Did: submitted PR #13 head `209539f` (BB-07153949); closed it without merging.
- Result: 2.04 vs parent 5b 2.38 (−0.34), a loss. Board 10:39 PM ET: 95th of 130; 1st 5.48→5.58, 16th 4.54, 32nd 4.17.
- Found: our guns beyond 100 m hurt us (likely misses, wasted energy, or drawing hunters early); winners' long-range hits come with laser + upgrades, which we lack. Keep the D4 gate.
- Blocked / next: Build 8 (laser first) at the 11:10 PM slot.

## Fri 22:50 ET · Grok · Workflow simplified to one goal
- Did: added `coord/WORKFLOW.md` (one goal, roles, rules, diagram); retired `next-doug.md`; `next-diego.md` is now the research-only prompt for Diego's Claude.
- Result: docs only.
- Found: regressions (Build 6 −0.15, Build 7 −0.34) both added exposure: moving while holding, and long-range shots heard ~320 m away at sideways movers. Build 5b kept shots on close/committed targets and won.
- Blocked / next: Build 8 (laser first) at 23:10 ET. Diego: run the research prompt in `next-diego.md`.

## Fri 23:15 ET · Grok (pipeline) · Pipeline: evidence, experiment memory, Codex review
- Did: added `pipeline/` (7 JSON Schema contracts, JSONL store seeded with all real history EXP-0000..0009 and 22 hypotheses incl. Diego's P0-P4 as HYP-018..022, `q.py` brief/tested/task/add-exp/set-check/eligible/mark-submitted/record-score/promote/ingest-*, `watch_ingest.py`, `codex_review.sh`, tests, e2e dry run); `research/intake/` with Diego's 11:05 handoff + its 13 claims as unverified evidence and the reusable prompt/JSON format; `next-diego.md` points there; `.dockerignore` excludes `pipeline/`.
- Result: 20/20 tests pass; e2e dry run passes on a scratch copy (synthetic score/submission labeled); `q.py validate` OK. No bot code changed.
- Found: Codex CLI 0.171.0 installed on the box but not logged in, so reviews record `unavailable` and the loop continues (`codex_required=false`). Ranking now uses Diego's priority formula; practice results are aggregate only (NO PER-MATCH OFFICIAL DATA), so failure classes are stored as suspicions with confidence.
- Blocked / next: Doug runs `codex login` (or `printenv OPENAI_API_KEY | codex login --with-api-key`) on the box to enable reviews. Grok: merge this PR, then record Build 8 (EXP-0009) with `q.py mark-submitted` / `record-score`.

## Fri 23:17 ET · Grok · Build 8 reverted
- Did: submitted PR #14 head `beb9240` (BB-DB8A4479) at 23:12 ET; closed it without merging.
- Result: 2.27 vs champion 5b 2.38 (−0.11), a loss. Board 11:17 PM ET: 104th of 136; 1st 5.58, 16th 4.73, 32nd 4.23.
- Found: laser-first alone doesn't pay even though 8/8 watched winners carry a laser; the laser likely needs the upgrades/positioning behind it, or costs us the early-game weapon we used. Build 9 (laser upgrades) sits on this losing parent and is parked. Site confirmed: no per-match data for practice submissions.
- Blocked / next: Build 10 (nav fallback, PR #16, `b4a65ba`) at the 23:21 ET slot; Build 11 (inflation 2.5 m, PR #18) only after Build 10 scores.

## Fri 23:24 ET · Grok · Build 10 reverted
- Did: submitted PR #16 head `b4a65ba` (BB-9A951653) at 23:21 ET; closed it without merging.
- Result: 2.35 vs champion 5b 2.38 (−0.03), a loss (smallest drop so far). Board 11:24 PM ET: 108th of 140; 1st 5.58, 16th 4.73, 32nd 4.23.
- Found: fixing failed paths (179→85 of 2,000 offline) doesn't move practice score; path failures aren't the bottleneck. Build 11 (inflation 2.5 m) was stacked on Build 10, so it must be re-based on main before scoring.
- Blocked / next: root-cause audit (branch rca-report) running; next slot 23:32 ET.

## Fri 23:30 ET · Grok · Diego research #2 filed
- Did: added `research/intake/diego-match-data-1129.md` (analysis of 208 opponent rows / 13 recorded matches) and `diego-experiments-1129.csv` (EXP-A..G backlog).
- Result: docs only; all claims associative (our team absent from recordings).
- Found: laser acquired >15 s scores better than <=15 s (10.51 vs 7.60 mean points, n=43/57), consistent with Build 8 laser-first losing; winners stand in the open 6.2% vs bottom-8 36.6%. Top hypotheses: conditional engage on isolated threats (EXP-A), threat-aware path costs (EXP-B), regen verification (EXP-F).
- Blocked / next: fold into root-cause audit result before picking the next experiment.

## Fri 23:36 ET · Grok · Build 11b reverted
- Did: submitted PR #19 head `8bfc89e` (BB-5BB9D164) at 23:33 ET; closed it without merging.
- Result: 2.10 vs champion 5b 2.38 (−0.28), a loss. Board 11:36 PM ET: 110th of 142; 1st 5.58, 16th 4.75, 32nd 4.25.
- Found: wider wall padding hurts (offline: more cut-off goals 210→230, more null paths); narrower routes/gaps matter. Nav changes (B10 −0.03, B11b −0.28) are not where the ceiling is. Five straight losses vs 5b: stop blind variants; next build comes from the root-cause audit + Diego/watcher evidence.
- Blocked / next: RCA report (branch rca-report); public-match entry research.

## Fri 23:45 ET · Grok · Diego back in the loop
- Did: rewrote `coord/next-diego.md` as a catch-up + autonomous research loop (git pull, read state, one question per run, JSON intake PR every ~45 min).
- Result: docs only.
- Found: Diego's research lands via `research/intake/` PRs, which Grok merges and ingests each tick.
- Blocked / next: Diego starts the loop on his machine (needs `gh` auth + push access).

## Fri 23:48 ET · Grok · Goal reframed (Doug)
- Did: `coord/WORKFLOW.md` goal now says pick the system change with the largest expected impact on total score, ranked by gap size × reach × confidence ÷ cost/risk; prefer closing whole missing systems over parameter nudges.
- Result: docs only. Promotion rule unchanged (keep only if it beats the best).
- Found: the last five losses were small tweaks (nav, gates, laser order); B12 FARM is the first build to add a whole missing system (cube economy).
- Blocked / next: score B12; next candidates ranked by impact: engagement decision (fight vs flee using enemy HP/count), upgrade spending once cubes are in hand, healing that works.
## Fri 23:45 ET · Doug · Build 12: farm cubes when safe
- Did: one mechanism on top of 5b (`100941f`) on branch `build-12-farm`: with no enemy mech within `FARM_ENEMY_M` (160 m) or in view and no damage from a mech for 3 s, shoot the nearest clear drone or crate within the 100 m gun gate through the existing aim/fire code (no mortar), and walk via nav to visible cubes and landed, unheld supply drops within `FARM_PICKUP_M` (80 m), standing in the ring to capture. Zone safety: only in the zone, never while leaving for the next circle, item inside the current circle and still reaching the next circle's inner ring by shrink end with the 10 s buffer. Farm movement ranks after retreat, heal and weapon loot. `FARM_ON` in `params.ts` rolls it back exactly.
- Result: `bun build` OK; `check.py --map-dir arena` PASS, 300/300 in time, p99 1.1 ms. Offline `tools/farm_check.ts` on the kit stream (non-reactive, not a score): farm active 8 of 300 ticks, all crate shots; the stream has no drones in view and cubes in only 2 observations. Not submitted.
- Found: drone return fire (weapon `npc`) does not exit farm, or drones could never be farmed; any other damage does. A cube or drop chased for 15 s without reaching it is dropped (roof items).
- Blocked / next: submit the PR head on practice; keep if ≥ 2.38, else `FARM_ON = false` / close.

## Fri 23:48 ET · Grok · Build 12 FARM kept, new champion
- Did: submitted PR #21 head `8f2c7c8` (BB-35E5C75F) at 23:45 ET; merged into main as `12a26df`.
- Result: 2.44 vs champion 5b 2.38 (+0.06), a KEEP. New best and automatic final entry. Board 11:48 PM ET: 112th of 144; 1st 5.58, 16th 4.77, 32nd 4.29.
- Found: first gain after five losses, and the first build that adds a missing system (cube economy). Offline, farm fired in only 8/300 ticks (crates only), so there's room to widen it: spend cubes on upgrades, farm drones, a larger radius.
- Blocked / next: next slot 00:12 ET. Candidates by expected impact: upgrade spending/order with cubes in hand; farm radius/drones; engagement decision.
## Fri 23:50 ET · Diego (research) · Engagement: fight vs flee
- Did: filed `research/intake/diego-2026-11-20-2346.json` (4 findings, EV-R-0020..0023 on a scratch ingest: 4 ACCEPT, 0 reject). Question: when to fight instead of flee, using only fields our bot observes. B12 FARM isn't scored yet, so question 1 was skipped.
- Result: research only, no bot code, not submitted.
- Found: the track page's rules settle RCA meta-question 6: practice house bots "never fight each other" and send hunters one at a time early (weakest first). So practice points come only from our kills and house zone deaths, and each kill is close to a point. Enemy `hp`, `weapons` and `charging` are observable (`show_enemy_hp` true), yet `brain.ts` never reads `Known.hp` and `params.aggression` is unread. From config: gun 187.5 DPS burst / ~102 sustained, laser ~131, lightning 240 within 45 m; at our 35% retreat line (490 HP) we die to 11 gun hits (~2.6 s), while a target at ≤540 HP dies to one magazine. Kills drop all cubes + 2.
- Blocked / next: Grok: after B12 FARM scores, consider one engage rule (skip the 35% retreat while exactly one enemy is known and ttk < aggression × ttd; always finish a target at ≤ one magazine). Next research run in ~45 min.
## Sat 2026-11-21 · Claude · Root-cause audit (read-only)
- Did: audited `brain.ts`/`nav.ts`/`map.ts`/`params.ts` at `100941f` (identical to `main` bot code); added `tools/rca_replay.ts` (regen + house-squad + cubes over 14 replays) and `tools/rca_hide.ts` (offline hideSpot geometry on the kit arena); wrote `coord/rca-report.md`. No bot code changed.
- Result: MEASURED regen = 45 HP/s after 5.0 s without dealing or taking damage; hide spots exist only 24% of the time vs an enemy at 60–120 m and are re-seen after 4–8 s of walking; places 1–2 average 17.3 cubes vs 0.7 for 9–16; in public matches 62/65 house deaths were house-on-house kills. CODE: bot never seeks cubes/drones/crates/drops, has no TTK logic, A* has no threat cost.
- Found: the kit has no engine, so a faithful local sim is not possible (geometry/rule studies only). The "house bots never kill each other" premise is unverified for practice and false in public matches.
- Blocked / next: recommended experiment `FARM` (drones/crates/cubes under the L2 160 m gate) off `100941f`; revert if < 2.38.

## Sat 00:05 ET: house bots confirmed as one squad (Grok)
Source: track page https://www.joinbuilders.org/buildathon/tracks/builders, Rules: "Practice plays 48 matches against 15 house bots (4 easy, 4 medium, 4 hard, 3 expert) acting as one squad: they share vision, never fight each other, and hunt you weakest first (one early, more as you thin them out, all of them late)." This settles the RCA premise flag: in practice nobody else kills house bots, so placement = outliving the squad's hunt. Hide/heal does not work; the priorities are winning fights 1v1 early, avoiding being the weakest target, and getting strong (cubes/upgrades). Builds 13 (farm reach) and 14 (TTK vs TTD engagement) follow from this.

## Sat 00:08 ET · Diego (research) · Verdict: do house bots kill each other? (fight, not hide)
- Did: rechecked the "house bots never kill each other" question against the track page, the kit (`protocol.md`, `README.md`, `check/stream.jsonl.gz`) and the RCA's public-match numbers. Filed `research/intake/diego-2026-11-21-0006.json` (1 finding, ACCEPT on a scratch ingest).
- Result: research only, not submitted.
- Found: no contradiction, two match modes. The track rules (read 00:05 ET) say practice house bots act "as one squad: they share vision, never fight each other". The RCA's 62/65 house-on-house kills come from public play.joinbuilders.org matches (humans + house bots), which the RCA itself labels "public matches only". The kit says only "48 practice matches against built-in bots", and its recorded stream has no kill events, so it can't settle anything either way. **Verdict for practice (and so for reaching top 32): fight.** Win the early 1v1s against lone hunters, finish wounded targets, farm cubes. Hiding can't add places when no house bot dies to another. Hiding may matter again in the final, which is team-bot free-for-alls.
- Blocked / next: Grok: the engagement builds (TTK vs TTD, finish the wounded) stand on this; EV-R-0020..0023 still apply.

## Sat 00:05 ET · Grok's Claude · Build 13: farm reach (hunt drones and crates)
- Did: picked (b) farm reach over (a) upgrade spending. (a) already exists: `brain.ts` answers every offer in survival-first order (plating > armor > nanites > sensors > weapon > mobility), and those ids match `hello.config.upgrades` in the kit. Offers only come at cube thresholds (1, 3, 6, 10, …), so cube income is the binding constraint and reordering picks would be a parameter nudge. Implemented one mechanism on main (`8f2c7c8`): under the existing farm conditions (in zone, not leaving, no enemy mech within 160 m or in view, no mech damage for 3 s), HP ≥ 90%, and with no cube or drop to walk to, walk via nav toward the nearest zone-safe drone or crate in view within `FARM_HUNT_M` (150 m). Stop once it's within 60 m with a clear line, outside drone aggro range (45 m), so the existing farm shot code fires. Give up after 25 s. `FARM_HUNT_ON` in `params.ts` rolls it back to Build 12 exactly. Combat, retreat, heal and nav are unchanged.
- Result: `bun build` OK; `check.py --map-dir arena` PASS, 300/300 in time, p99 0.9 ms. Offline `tools/farm_check.ts` (now also prints ticks active / times entered per farm activity; OFFLINE, not scores): hunt active 8/300 ticks (2 entries), on the same 8 crate-shot ticks as Build 12. The recording is 192/300 ticks in heal mode and has no drones in view, so it can't show the wider reach.
- Found: the offline stream can't tell us how often hunting would trigger in a live match; only the practice score can.
- Blocked / next: submit the PR head; keep if > 2.44, else set `FARM_HUNT_ON = false` / close.

## Sat 00:16 ET: Build 13 (farm reach) scored 2.54, KEEP (Grok)
Commit c2e7f6017341296cff7d0b5bb34c6397148bd967, receipt BB-5573AA45, submitted 00:12 ET. Parent Build 12 (8f2c7c8) scored 2.44, so +0.10 and it becomes the new champion (auto final entry; Pick-as-final never clicked). Board: 123rd of 159, rank 1 5.58, rank 16 4.90, rank 32 4.38. Signed-in submissions list and team page checked: no replay, debug or per-match data, only the score.

## Sat 00:00 ET · Doug · Build 14: fight-or-flee (TTK vs TTD)
- Did: one mechanism on top of champion Build 12 (`8f2c7c8`, 2.44) on branch `build-14-engage`. Weapon DPS and reach are read from `hello.config.weapons` at hello (gun sustained over a magazine plus reload, laser per charge plus cooldown, lightning per cooldown). `ttk` = enemy HP / (DPS of the weapons we hold that reach it × hit-rate guess × our cube bonus; gun 0.8 within 60 m, 0.5 beyond, laser and lightning 0.9). `ttd` = our HP / (sum of the full DPS of every enemy with line of sight to us, by the weapons it is seen holding, × its cube bonus). (1) TTK rule: when the HP retreat would trigger and exactly one enemy threatens us (line of sight, or damaged us in the last 2 s), fight on while `ttk < params.aggression × ttd`. (2) Finish rule: commit to a target at or below one magazine of a weapon we hold (gun 540, laser 315, lightning by our energy; × cube bonus) while no second enemy sees or hits us: hold the line of fire, close to 60 m along a nav path, then after the kill walk to its cubes if nobody sees us and the farm zone test passes. Otherwise the Build 5 retreat runs unchanged; zone escape and leaving for the next circle rank first. `ENGAGE_ON` in `params.ts` rolls it back; `aggression` stays 1.0 and is now documented. Farm, nav, heal and upgrade code untouched.
- Result: `bun build` OK; `check.py --map-dir arena` PASS, 300/300 in time, p99 1.5 ms. Offline `tools/engage_check.ts` on the kit stream (non-reactive, not a score): as recorded, 0 of 29 retreat ticks overridden (the lone enemy has 1,029+ HP and gun + laser, so retreating is the right call); what-if grid (our HP 30% and 15%, enemy HP 150 to 1,400, enemy hitting us): 690 of 2,070 retreat ticks overridden, all by the finish rule at enemy HP ≤ 540, none at 800 or 1,400. With `ENGAGE_ON` false, 600 decisions (recorded plus what-if) are identical to `8f2c7c8`. Not submitted.
- Found: at `aggression` 1.0 the TTK rule adds nothing beyond the finish rule in the gun cases. Enemies are assumed to hit every shot and we 50–80%, so below 35% HP against a gun + laser enemy we only "win" when it has under about 150 HP, which the finish rule already covers. The TTK rule starts to matter with lightning in hand, more cubes than the enemy, or `aggression` near 2 (about the same as giving enemies our 50% hit rate). An engagement with no HP taken off the target for 8 s is dropped for 10 s (uses `Known.hpLog`), so a target we cannot hit does not hold us.
- Blocked / next: submit the PR head on practice; keep if above 2.44, else `ENGAGE_ON = false` / close. If kept, the next single knob is `aggression` (try 2.0).
## Sat 00:05 ET · Doug · Build 14 fix round: finish survival check, enemy hit rate
- Did: two fixes on `build-14-engage` (PR #24), nothing else changed. (1) Finish rule: house bots are one squad that hunts the weakest first and shares vision, so it now commits only when our HP ≥ 35% of max (`ENGAGE_FINISH_HP` in `params.ts`) and `ttk < ttd` against that target, with the same `ttk` and `ttd` as the TTK rule. Otherwise the retreat runs as before. (2) Enemy DPS takes the same hit-rate guesses as ours (gun 0.8 within 60 m, 0.5 beyond; laser and lightning 0.9; mortar 0.5) instead of 100%. The 8 s no-damage drop, the 1 s latch, `ENGAGE_ON` and `aggression` 1.0 are unchanged. `tools/engage_check.ts` now counts overrides per rule and has grid rows at 60% and 35% of our HP.
- Result: `bun build` OK; `check.py --map-dir arena` PASS, 300/300 in time, p99 1.2 ms. Offline `tools/engage_check.ts` on the kit stream (non-reactive, not a score). Recording as it is: 29 retreat ticks, overridden 0 by the TTK rule, 0 by the finish rule. What-if grid at our HP 30% and 15% (enemy HP 150 to 1,400, enemy hitting us): 2,070 retreat ticks, overridden 4 by the TTK rule, 0 by the finish rule (before the fix: 0 and 690). Grid rows at or above the 35% floor, where no retreat triggers: the finish rule engages on 123 ticks (our HP 60%: 115 at enemy 150 HP, 4 at 300; our HP 35%: 4 at 150), none at enemy HP 540 or more. With `ENGAGE_ON` false, 1,200 decisions (recorded plus three what-if replays) are identical to `8f2c7c8`. Not submitted.
- Found: the finish floor equals `retreatHp` (both 35%), so the finish rule can no longer override the HP retreat at all; below 35% only the TTK rule can, and it has no HP floor of its own. The TTK rule now fires but rarely on this recording: we hold a gun (about 51 DPS beyond 60 m, 82 within) against a gun + laser enemy (about 169 and 200 after hit rates), and only 4 of 169 enemy ticks are within 60 m. A second weapon or `aggression` above 1 would widen it. The 1 s latch can hold a finish engagement for up to 1 s after our HP drops below 35%.
- Blocked / next: submit the PR head on practice; keep if above 2.44, else `ENGAGE_ON = false` or close. Grok to decide whether the TTK rule also needs an HP floor.

## Sat 00:18 ET · Doug · Build 14 moved onto Build 13 main
- Did: merged `origin/main` @ `3a00ba2` (Build 13 farm reach) into `build-14-engage`; kept both sides in `coord/log.md`, `EXPERIMENTS.md`, `params.ts` (FARM_HUNT_* and ENGAGE_*) and the `brain.ts` import. Parent now `3a00ba2`, champion 2.54.
- Result: `bun build` OK; `check.py` PASS, 300/300 in time. With `ENGAGE_ON = false`, all 302 responses on the kit stream are identical to `3a00ba2`. Not submitted.
- Found: on the kit stream, `ENGAGE_ON = true` also matches `3a00ba2` exactly (the engage rules never trigger there).
- Blocked / next: Coordinator scores it at the 00:21 ET slot.

## Sat 00:26 ET: Build 14 (fight-or-flee, TTK vs TTD + finish) scored 2.88, KEEP (Grok)
Commit 0ed6ffcab023247e862c4293de1a3bb7436d4a3b, receipt BB-2897E011, submitted 00:22 ET. Parent Build 13 (3a00ba2) scored 2.54, so +0.34, the biggest gain so far; new champion (auto final entry; Pick-as-final never clicked). Board: 112th of 159, rank 1 5.58, rank 16 4.92, rank 32 4.44. Confirms kills-first: deciding to fight beats fleeing on our own HP. Next free slot 00:33 ET.

## Sat 00:40 ET · Claude (lane B) · Build 16: kill-value target selection
- Did: one mechanism, target selection only, on branch `build-16-target` (PR #26). Started on `3a00ba2` (Build 13, 2.54). Main moved to Build 14 (`d58cdf9`, 2.88) at 00:26, so the branch was merged onto it and both features are kept. New `target.ts` scores every enemy mech in view by kill value: a shot from here (clear line and a weapon of ours in range, weight 4), time-to-kill from Build 14's `ourDps` (weight 2), low hp/max_hp (1.5), weak weapons from Build 14's `baseDps` (1) and alone, no other enemy within 40 m (1). `brain.ts` locks the best one and keeps it until it dies or has had no shot (out of view or behind cover) for 3 s. While the lock is lost for under 3 s, any other enemy we can shoot is shot without moving the lock. The enemy Build 14 is engaged with takes the lock, so the aim never disagrees with the fight-or-flee choice. Zone rule: an enemy outside the current circle can be picked only while we can shoot it from where we stand. Movement, retreat, engage, heal, farm and the fire gates are unchanged. `TARGET_PICK_ON` in `params.ts` rolls it back to Build 14.
- Result: `bun build` OK; `check.py --map-dir arena` PASS, 300/300 in time, p99 1.0 ms, 0 debug drawings over the caps. With `TARGET_PICK_ON = false` the actions are identical to `origin/main` (`d58cdf9`) on all 300 recorded observations, with and without a synthetic second enemy. Offline `tools/target_check.ts` (non-reactive, not a score): the kit recording never has two enemy mechs in view (169 ticks with one, 131 with none), so the pick equals the nearest-clear pick on every tick, with 0 target switches. With `--synth` (a made-up second enemy 60 m from the first, 40% HP, gun only, hidden 1 s in 5): 138 ticks with a choice, pick differs from the nearest-clear pick on 21, 3 switches, 6 interim ticks. Not submitted.
- Found: the bar is now Build 14's 2.88, not 2.54. Outside a Build 14 engagement the bot never walks toward a target, so the zone rule only stops a lock on an out-of-zone enemy we can't shoot. The `kill` event reports only our own kills, so a target that dies to the zone is released by the 3 s lost rule. The lock does not break for a nearer enemy that starts hitting us while the lock still has a clear line, unless Build 14 engages it; that is the hysteresis as specified and the main risk of this build.
- Blocked / next: submit the PR #26 head on practice; keep if above 2.88, else `TARGET_PICK_ON = false` / close.

## Sat 00:38 ET: Build 16 (kill-value target lock) scored 2.98, KEEP (Grok)
Commit 8887d80c4815d67c91ebe49b5e0c888c0ec089c3, receipt BB-340B47F3, submitted 00:34 ET. Parent Build 14 (d58cdf9) scored 2.88, so +0.10; new champion (auto final entry; Pick-as-final never clicked). Board: 107th of 162, rank 1 5.58, rank 16 4.96, rank 32 4.50. Third straight gain from kill-focused systems. Next free slot 00:45 ET. Queue: Build 17 (laser) > Build 15 (aim, no offline gain) ; Build 18 (spacing) in progress.
