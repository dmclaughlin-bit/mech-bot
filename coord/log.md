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

## Fri 22:40 ET · Grok's Claude · Build 8: laser first
- Did: one commit `08f1f45` on `build-8-laser-first` (off `main` @ `52a601a`, Build 5b), `brain.ts` only, no new knobs or numbers. Until a laser is held, walk along a nav path to the nearest laser pickup that is inside the circle we may hide in, on the ground (within the 4 m take height, not a roof), with no enemy mech within 160 m of us or of it, and whose trip there plus on to the next circle fits Z1's leave time at 2x the straight line; it beats a nearer lightning and ignores the 80 m detour (lightning keeps the old 80 m rule). A charging laser (can't be cancelled; auto-fires after `hold_s`) keeps steering the torso onto its target even past range, behind cover, or when lightning/gun would lead; it holds while the target is behind cover; with nobody in view it keeps the trigger held and aims at the last-seen enemy instead of releasing along the walk direction. No fire gates added; cover/hold, heal, zone and upgrades untouched.
- Result: `check.py --map-dir arena` PASS with bun (300/300, p99 0.9 ms, max 1.5 ms, ready 249 ms) and node (300/300, p99 0.9 ms, max 2.2 ms, ready 268 ms). `tsc --strict` clean on `brain.ts`. Replay of `check/stream.jsonl.gz`: "loot laser" fires at 3.8 s toward a laser 134 m away (Build 5b ignored it, past 80 m). Synthetic charging-laser obs (target past range / in range / gone): trigger held, aim on the enemy. Not submitted.
- Found: watch findings: 6/6 showdown winners had a laser, 5/6 ended laser+lightning, 0 ended with a mortar, laser 76% of winner damage, laser taken at 4–12 s. Previously a charging laser whose target left view was released at once along the walking direction.
- Blocked / next: Grok submits PR head by SHA; compare raw against 5b's 2.38.
