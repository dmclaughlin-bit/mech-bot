# Next for Diego

Written by Grok, the coordinator (see `GROK_BRIEF.md`). Do the manual steps yourself first. Paste only the "For your Claude" section into your Claude.

## Manual steps (do these first)

1. **You no longer submit practice builds, and you no longer need to check the Builders site for scores.** At Doug's request, Grok now submits and reads the score, then gives you the row. Please still log the rows below. The form takes a repo plus an optional 40-char commit (empty = head of default branch), so unmerged SHAs can be submitted. Do not press "Pick as our final entry" — Build 3 is already the auto final entry. Do not change the team.

2. Add these two rows at the top of the table in `EXPERIMENTS.md` (newest first), and append a `coord/log.md` entry for each (or one entry that covers both). (Grok has already committed the new `coord/next-doug.md`, `coord/next-diego.md`, and `coord/learnings.md` to `main`; pull before you start.)

   | Time (ET) | Commit | Parent | Params | Score | Hypothesis (rule ID) | Result |
   | --- | --- | --- | --- | --- | --- | --- |
   | Fri 9:27 PM | `406ab9f` | `4726cfc` | `params.ts` defaults | 2.23 | Build 3: Z1 path-aware nav (PR #7, BB-955D92D8) | +0.06 vs Build 2 mean 2.17. KEEP: under +1.2, mechanism right and above −0.6. Auto final entry. Board 9:40 PM ET: 81st of 108; 32nd is 4.04 |
   | Fri 9:21 PM | `4726cfc` | `4726cfc` | `params.ts` defaults | 2.17 | S3: identical Build 2 resubmit (D7, Q1, BB-89ECDFF6) | Δ 0.00 vs S2. Same to two decimals; practice looks frozen |

3. Doug is merging PR #7 (it is dirty against `main` @ `053f69b` because of PR #8, PR #9, and the bun-gate log). You do not merge PR #7. If he asks for a review, the expected conflict is `coord/log.md`: keep Fri 21:15 Build 3, then 21:35 Grok brief, then 21:40 D9, then 21:40 bun gate, in that order.

4. Optional, not blocking: the bun 1-CPU gate you already logged on Build 2 and unwired `main` is enough for now. Full Docker flags (`research/protocol.md` §1) still have not been run; if you later have a Docker daemon, run them on Build 3 after PR #7 merges and log the numbers. Build 3 already scored without it.

## For your Claude

Read `AI-Structure-Development.md` and `coord/log.md` in `dmclaughlin-bit/mech-bot` before starting.

Your task is a quick plan update, plus a small watch tool so we keep learning from top bots. Branch: `tools-watch`, off current `main` (`053f69b` or later). You may change only files you own in plan §4: `nav.ts`, `tools/`, `EXPERIMENTS.md`, `AI-Structure-Development.md`, plus append-only `coord/log.md`, `coord/learnings.md`, and the `coord/next-*.md` files Grok writes. Do not edit `brain.ts`, `bot.ts`, `map.ts`, `params.ts`, or `Dockerfile`. Do not start a parameter sweep in this PR.

**1. Plan PR (do this first; same PR as the tool is fine).** Update plan §1 so it is no longer the Fri 8 PM snapshot: S1 1.67 @ `76aabfa`, S2 2.17 and S3 2.17 @ `4726cfc` (Δ 0.00, Q1: practice looks frozen), Build 3 2.23 @ `406ab9f` (KEEP on mechanism, current best / auto final entry). Board at Fri 9:40 PM ET: 108 teams, we are 81st at 2.23, 32nd is 4.04 (TigerBuild), D9 "safely in" is about 4.54 (we are 1.81 below the cutoff). Close Q1 in §6 with the S3 evidence. Leave the 1.2 threshold in place (Q4 not re-measured). For Q2, record that the team page still has no official practice replays, but exhibition matches can be recorded from `wss://watch.joinbuilders.org/live` and `/state`.

Align plan §3 with D9 and the brief's qualifying order (do not silently invent a new order): Build 3 is done; next is Build 5's survival half (F3, F4, Q2) ahead of Build 4; then full F2; then dodge (R1–R3); then the rest of §3. Fix the §9 knob blurb that still says only `aggression` is tuned on practice — while qualifying, any knob may be tuned; after we are ~0.5 above 32nd, only `aggression` again. Hard caps H1–H3 stay untuned.

Also propose — do not silently apply as Doug's immediate next coding task; he is already starting F3/F4/Q2 — this insert, with evidence in the PR body: after the LOS/heal build and before Build 4, add a build that *seeks* laser then lightning early (L1/L2: we already pick them up if we walk onto them; we do not path to them) and farms one NPC only when no mech is within the §9 L5 distance (L5 is today tagged Build 8). Why this belongs in the qualify-first queue: more DPS and upgrades (plating/armor/nanites) mean more HP, which helps against a squad that hunts the weakest. Evidence from 2 complete Top-16 exhibition matches (FFA-like, so not practice; treat as supporting, not proof): both winners took a laser at 4.05 s and 12.15 s and ended on laser + lightning; laser was 72% and 84% of winner damage; winners held 24 and 34 cubes. Caveat: only 2 finished matches. Do not retag the rules until Doug has seen the PR.

In the same plan edit, change §5 step 4 (and, if you also touch the brief, its fixed line) so that Grok submits and reads scores, and you log the `EXPERIMENTS.md` row from those numbers.

**2. Small watch recorder + analyzer in `tools/`.** Keep this lightweight. Endpoints: `wss://watch.joinbuilders.org/live` and `/state`, origin `https://watch.joinbuilders.org`. A short Python asyncio + websockets recorder that writes one jsonl line per message for a given duration is enough, plus an analyzer that, for each finished match, writes a short markdown or CSV summary with one row per bot: place, loadout, `damage_by_weapon`, `cubes_max`, `first_weapon_t`, first take-time per weapon kind, `drops_taken`, zone d/r, boost %, nearest enemy, and share of mech hits on targets under 50% HP. Tick rate is 20 Hz. Do not commit raw multi-megabyte jsonl to this public repo. Commit the scripts, a short README with the command lines, and any small summaries. Ideas only from other teams' play; never copy another team's code.

Do not run an aggression or retreat sweep in this PR. Sweeps are allowed now (any knob, 3 values, one submission each; practice looks deterministic, so no repeats), but a knob tweak will not close a 1.81 gap. After the LOS/heal build is scored, a 3-value sweep of `retreatHp` or `zoneBuffer` is a good use of an otherwise empty slot.

Done when: the plan PR states the §1 update, Q1/Q2 notes, the qualifying-order alignment, the proposed post-LOS laser/NPC insert, and the submit-process change; the tool runs against a saved jsonl or a short live recording and writes a summary; `check.py` is unchanged (you are not editing bot code). Target: **tonight if you have a slot, otherwise Sat 10:00 AM ET.** No §3 window pressure. The plan half is the one that unblocks the queue; the tool can follow in the same PR or immediately after.

Every push includes a new entry at the bottom of `coord/log.md` (format at the top of that file), and every PR description repeats it.
