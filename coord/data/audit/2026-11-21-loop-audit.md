# Loop audit — Saturday 21 Nov 2026

Written Saturday 21 November 2026, about 5:50 PM ET, from recorded repo data only. No bot code was changed. No site submission, merge, or workflow-rule edit is in this commit. Champion at audit time: **B113**, bot code `6182d29c673d99f5186d742a5f019c0b007234f2`, merge `8b6e7b2841f5d26402d19fc4b28d16d2d6760550`, official score **4.17**, receipt **BB-09AE8A68**.

Doug asked for this overhaul audit at 5:38 PM ET. Already fixed before this write-up (not repeated here as new rule changes): `GROK_BRIEF.md` obsolete resubmit / final-pick / 4-per-hour text and `pipeline/config.json` `max_submissions_per_hour` 4→6 (commit `221e6c5`, 5:45 PM ET); later `bb0a43e` (5:41 PM ET rules, committed 5:41–5:42 PM ET) records full paired screens, the 10-minute routine as sole submitter, the rebuild policy, and the two-build reserve. This document only reports.

## 0. Hourly-report baseline (first snapshot)

Source: `coord/data/site_results.csv` as of main `72ef303` (5:48 PM ET). “Win” means verdict **KEEP** (strictly above the champion at keep/close time). Ties are not wins.

| Metric | Since 12:00 PM ET Sat | Since B113 went live (submitted 2:40 PM ET, scored 2:43:56 PM ET) |
|---|---|---|
| Scored official tests | 19 | 10 (B115, B118, P20, B117, P21, B110, B111, P24, P23b, B125) |
| Wins (KEEP) | 4 (B103 3.92, P-B-001 4.06, B107 4.10, B113 4.17) | **0** |
| Hit rate | **4/19 = 21%** | **0/10 = 0%** |
| Planning prior | 20% | 20% |
| Official score gain | **+0.38** (B80 3.79 at noon → 4.17) | **+0.00** (still 4.17) |
| Verified winners implemented / total winners | **4/4 = 100%** (all four KEEPs are in the B113 stack) | n/a (no new winner) |
| Submissions with all required evidence on the ledger *before* the click / total | **At most 2/19**; only B103 and B104 have both 2000+3000 and 4000+5000 rows in `screens.csv`. Every later noon-to-now submission is missing a held-out row, a standard row, or both, in the official ledger at the time of this audit (several screens were added *after* the score). | **0/10** in `screens.csv` with both seed sets recorded before the click |

Notes on the “all required evidence” count: the required pack is “contains the current champion, flag-0 identity, `check.py` max strictly under 30 ms, and a complete paired screen vs that champion on 2000+3000 *and* 4000+5000,” plus the ~10/192 fire bar and hazard checks. This baseline counts only what `screens.csv` plus dated PR comments can prove was on the ledger **before** the click. It does not invent screens that may have lived only in a chat. B104’s 3.88 vs a 3.79 `champion_score_at_time` is logged CLOSE (B103 had already become 3.92); it is not counted as a KEEP. It was later rebuilt as B107 and kept.

Empty-slot tally for the 12:00–6:00 PM ET window is in §1. After 4:10 PM ET the allowed cap is 6 per rolling hour. From 4:09 PM to 5:15 PM ET the site had free slots and nothing eligible under the full-screen rule went in; three later clicks in that hour used incomplete screens (see §7).

Because we learned that three 5:15–5:33 PM ET clicks went out on incomplete screens and all lost, the gate now (Doug, 5:41 PM ET) requires both seed sets before a click, and the routine is the sole submitter. Nothing in this audit changes that.

## 1. Slot trace (12:00 PM–6:00 PM ET Saturday)

Allowed cap: **4 per rolling hour until 4:10 PM ET** (Doug confirmed 6 at 4:10 PM ET, `4788184` / WORKFLOW_CHART note). The live site counter already showed 6/hour at 4:05 PM ET (`coord/log.md` 16:09 entry).

Clock-hour counts from `site_results.csv`:

| Clock hour ET | Used | Cap | Submissions (time, id, score, receipt, verdict) |
|---|---:|---:|---|
| 12:00–1:00 | 4 | 4 | 12:39 B103 3.92 BB-DE1ADA05 KEEP; 12:47 B104 3.88 BB-A6C704B4 CLOSE; 12:55 P-B-001 4.06 BB-6EA7D518 KEEP; 12:58 B106 3.85 BB-EC8326F0 CLOSE |
| 1:00–2:00 | 3 | 4 | 1:39 B108 3.75 BB-26BA2735 CLOSE; 1:48 P-D-002 3.79 BB-8DA0CF9D CLOSE; 1:55 B107 4.10 BB-DA9AC664 KEEP |
| 2:00–3:00 | 4 | 4 | 2:04 P-B-006 4.02 BB-A1312E8D CLOSE; 2:40 B113 4.17 BB-09AE8A68 KEEP; 2:54 B115 4.13 BB-D76FEDCF CLOSE; 2:57 B118 4.17 BB-BAC9670C CLOSE (tie) |
| 3:00–4:00 | 3 | 4 | 3:07 P20 4.17 BB-36A427E0 CLOSE (tie); 3:44 B117 4.08 BB-A84FCC28 CLOSE; 3:55 P21 4.17 BB-1D97890A CLOSE (tie) |
| 4:00–5:00 | 2 | 4 until 4:10, then 6 | 4:00 B110 3.96 BB-4E063E2E CLOSE; 4:05 B111 4.10 BB-D985B698 CLOSE |
| 5:00–6:00 | 3 | 6 | 5:15 P24 3.79 BB-BE220066 CLOSE; 5:24 P23b 4.00 BB-AEFC0FA8 CLOSE; 5:33 B125 3.50 BB-C6A19503 CLOSE |

Gaps longer than 10 minutes, with the cause supported by the record:

| Gap | Length | Cause in the record |
|---|---|---|
| 12:00–12:39 | 39 min | First afternoon click. Morning work had ended; B103 was the first KEEP of the afternoon. Not a rolling-cap wait. |
| 12:58–1:39 | 41 min | **Waiting on the 4/hour rolling cap.** The 12:39 click frees a slot at 1:39, and B108 went in then. |
| 2:04–2:40 | 36 min | **Waiting on the 4/hour rolling cap.** 1:39 + 60 min = 2:39; B113 went in at 2:40. |
| 2:57–3:07 | 10 min | At the 10-minute line. 2:40 + 60 min = 3:40 would have been the *next* cap opening after four in the window; actually 2:40/2:54/2:57/3:07 fill as earlier 2:04 ages out at 3:04. P20 at 3:07 is a ~3-minute delay after 3:04. |
| 3:07–3:44 | 37 min | **Waiting on the 4/hour rolling cap.** 2:40 + 60 min = 3:40; B117 went in at 3:44. |
| 4:09–5:15 | **66–70 min** | **Production failure: free slots, nothing fully qualified went in, then incomplete screens were clicked anyway.** After B111, the log says “2 of 6 left at 4:05 PM ET” and “next slot 4:07 PM ET.” Cap is 6 from 4:10. No submission until P24 at 5:15. Causes that *are* in the record: B116 (PR #119) on hold (Doug, 3:07 PM ET); queued reserves (#104, #106, #110–#114, P18/P19) had been merge-updated onto 4.17 around 2:51 PM ET but their comparable screens in `screens.csv` are still against 4.10 or 4.06 parents, or are missing the held-out set; P24’s own PR, opened 5:05 PM ET, said the paired screen “will follow as a comment.” At 5:14 PM ET the 10-minute loop was started and the screen-before-click rule was relaxed (`952f42e`). P24, P23b, and B125 then went out on incomplete screens and all lost. `coord/log.md` itself stops at 4:09 PM ET, so the loop also lost its live written queue after that. |
| 5:33–6:00 | 27 min (and counting at audit time) | After B125’s 3.50, the 5:41/5:45 fix restored the full-screen gate. No candidate was READY (see `ready_ledger.md`). An empty slot here is a supply failure, not permission to waive a check. |

A formal “Doug 3:58–4:01 PM ET hold” was **not found** in `coord/log.md`, `WORKFLOW.md`, or dated commits. The nearby timestamps in the repo are: B117 post-mortem “Written … 4:01 PM ET”; log “Next slot 4:07 PM ET” after the 4:05 results; Doug’s 3:07 PM ET hold of B116. Those are not a recorded pause of the queue at 3:58–4:01.

### 1.1 One submission, end to end: P23b (PR #134, `cf96cf5`)

1. **Idea.** P23 (`LATE_FARM_ON`): when idle after 60 s, sweep the torso so the existing B12/B13 farm can see cubes. Assigned to Mech Builder.
2. **PR / screen.** PR #127 (`76c3fa8`) opened 4:37 PM ET. Sim Tester recorded both seed sets in `screens.csv` (`c642ed2`, 5:09 PM ET) and **VETOED** a new in-zone pin on base-0 seed 90 (64 s vs 10 s on the champion; pin windows 190→271).
3. **Fix.** Mech Builder opened PR #134 at 5:23 PM ET (`cf96cf5`, on `76c3fa8`, contains `6182d29`). Root cause in the PR: the bot cycled two farm targets every 0.4 s and reset the 15 s/25 s give-up timers. Fixes: sweep only while still, plus a 3 s no-progress abort (the abort is what removes the pin; it also applies all game, not only after 60 s).
4. **Partial screen at click.** Builder reported pin windows 190→108 and long pins 6→2 of 96 on base 0, gate PASS (max 4.5 ms in the Builder note; a later coordinator re-check said 2.6 ms), flag-0 identical. The official 2000+3000 and 4000+5000 rows later in `screens.csv` show 19 games changed on each set. The held-out row was committed at 5:39 PM ET (`96fa589`), **after** the click.
5. **Submit.** 5:24 PM ET, during the 5:14–5:45 relaxed-screen window.
6. **Receipt / score.** BB-AEFC0FA8, official **4.00** vs 4.17 (−0.17), CLOSE.
7. **Ledger.** `site_results.csv` and `SOURCE_OF_TRUTH.md` were updated (`19df2e1`, 5:28 PM ET). **`coord/log.md` was not** (still ends at 4:09 PM ET). `ideas.md` was not updated for the farm-family loss. `STATUS.md` is still dated 3:44 PM ET.
8. **Next decision.** Closed. Cube *memory* (P25) was rebuilt on 4.17 without the look-around. Pin measure improved in the sim and the official score still fell; the aggregate score cannot name the cause. Another farm variant needs a distinct mechanism and a complete screen (P25 is that attempt, still HOLD).

### 1.2 One unused slot: 4:15 PM ET (first free 6/hour slot after B111)

1. **Slot opens.** Log at 4:09 PM ET: B111 is in, counter “2 of 6 left at 4:05,” next slot 4:07. By 4:15 the rolling hour is under the new cap of 6 and no score is pending.
2. **What was on the queue.** STATUS (3:44 PM ET) and the 3:12–3:44 notes list B112, P19, P18 to bring onto 4.17; reserves P-B-004/005/002 and P-D-006; B116 on hold. None of those have a complete paired screen vs `6182d29` on both seed sets in `screens.csv`.
3. **Assignment.** No new “next click” line was written after 4:09. `log.md` goes silent. Diego’s Claude was back from 3:42 PM ET on measurement prompts (P-D-007 then 008/009), not on a site build.
4. **Outcome.** The 4:15, 4:25, 4:35, 4:45, and 4:55 slots expire unused. P24 is only opened at 5:05, with its screen still promised later, and is clicked at 5:15 after the 5:14 relaxation.
5. **Next decision that should have been logged at 4:15.** “Slot free, nothing qualifies: blocker = no complete 4.17 screen on a novel build; owners = Sim Tester (re-screen reserves) and Mech Builder / Doug’s Claude (cut a new flagged build); next action = do not click.” That sentence is missing from the record. An empty slot is a production failure, not permission to waive a check. The 5:14 waiver is what filled the next slots, and it failed.

## 2. Records the live loop actually uses

### 2.1 What the afternoon “site:” commits actually touch

Sample of official-result commits (author in git is “D McLaughlin” for all of them, so git **cannot** tell a routine tick from a coordinator tick):

- Through 4:09 PM ET (P20, B117, P21, B110, B111): `coord/data/site_results.csv`, `coord/data/SOURCE_OF_TRUTH.md`, and `coord/log.md`.
- 5:15–5:33 PM ET (P24, P23b, B125): **only** `site_results.csv` and `SOURCE_OF_TRUTH.md`. `log.md`, `ideas.md`, and `STATUS.md` were not updated. That is a logging gap.

Sim Tester / coordinator screen backfills write `coord/data/screens.csv` (and sometimes `hazard_screens.csv`, post-mortems). Those often land **after** the click (P23b held-out at 5:39; P24 2000+3000 row at 5:48 PM ET, commit `72ef303`, which also has no 4000+5000 row).

`pipeline/q.py` and `pipeline/data/experiments.jsonl` are **not used** by the live afternoon loop. `experiments.jsonl` stops at EXP-0012 (Build 12, Friday night). `q.py brief / eligible / add-exp / promote` is described in `WORKFLOW.md` as the tick tool, but no Saturday KEEP or CLOSE after Build 12 appears there. `champion.json` is at B113 4.17 (correct current pointer) but its `history` array stops at P-D-003 4.10 — B113 is the current object, not a history row.

**Implication:** the live source of truth for clicks is `coord/data/site_results.csv` (plus the site itself). The live source of truth for screens is `screens.csv`, and it lags. After 5:45 PM ET the 10-minute loop also writes `coord/data/ready_ledger.md` and an empty-slot block on `coord/STATUS.md` (commit `99aa2d1`; the commit message says the blocker was logged, but the files touched were STATUS and the ledger, not `log.md`). `q.py` is a dormant parallel ledger. A restart of a tick that only looked at `q.py` would not see Saturday receipts.

### 2.2 Does today’s `q.py` eligibility distinguish the four required cases? (replay, no code change)

`eligibility()` in `pipeline/q.py` today checks only: kit-check pass, Codex block verdict, already-submitted timestamp on *that* experiment, the same candidate commit already scored in `experiments.jsonl`, and the hourly slot cap from `experiments.jsonl` timestamps. It does **not** read `site_results.csv` or `screens.csv`. It does **not** check trigger count, complete paired screens, whether the SHA contains the live champion, or whether some *other* experiment has a pending unscored receipt.

Replay on recorded facts, **as current `q.py` would behave** if someone added the experiment with a passing kit check and ran `q.py eligible`:

| Case | Recorded facts | Current `q.py` | What the gate should say |
|---|---|---|---|
| P21 (`1b692c9`, PR #122) | Paired 2000+3000 vs `6182d29`: contest trigger **1/192** (seed 2032, 27 decisions); games with different behavior 1; different score 0 (place tied). Held-out 4000+5000 **not** in the PR or in `screens.csv`. Gate max 3.0 ms, flag-0 eqdrive identical, contains `6182d29`. Site later 4.17 tie (BB-1D97890A). | **ELIGIBLE** (no fire-count check, no held-out check) | **HOLD** — fires in 1/192, under the ~10/192 bar Doug kept at 4:38 PM ET; held-out screen missing |
| P24 (`184bc1c`, PR #130) at 5:15 PM ET click | PR opened 5:05 PM ET: gate PASS max 4.6 ms, flag-0 eqdrive identical, contains `6182d29`, “The paired screen of both values on 2000+3000 and 4000+5000 vs 6182d29 will follow as a comment.” The 2000+3000 row was only written at 5:48 PM ET (fired 85 / different behavior 85 / different score 52, 18 better / 34 worse). Held-out still absent at audit time. Site 3.79 (BB-BE220066). | **ELIGIBLE** (screen is not a check) | **HOLD** at 5:15 — screen incomplete. This *was* a control failure. After the late 2000+3000 row the sim also moved in the same direction as the official drop; that information arrived too late to protect the slot. |
| Stale approval: P-B-002 PR #113 (`0e4985a`) and P-D-006 PR #114 (`e853889`) | Both branches were merge-updated onto 4.17 main around 2:51 PM ET, so `6182d29` *is* an ancestor of the current heads. The comparable screens in `screens.csv` are still vs **`42a19d7` (4.06)**, “not built on drop-run `4d6e71b`,” let alone vs `6182d29`. | **ELIGIBLE** if kit is marked pass and the row is not yet “submitted” — `eligibility()` never compares the screen’s champion SHA to `champion.json` | **HOLD (stale)** — a merge of 4.17 into the branch is not a re-screen against 4.17. Old approvals expire when the champion changes. |
| Genuinely eligible candidate | See `ready_ledger.md`. | n/a | **None exists at 5:50 PM ET.** Closest is mode 36 on PR #129 (complete 384-game research screen, both seed sets, contains `6182d29`, check.py max 3.4 ms, flag 0 identical) but it is **sim-only** (`EVADE_MODE` stays 0; PR title says not a site candidate) and has no one-flag site SHA in the official ledger. Runner-up P25 (`b34271c`, PR #136, opened 5:47 PM ET) has only a 96-game base-0 hazard, plus a new 30 s pin on seed 72, and no official both-set screen. |

Double-submit / restarted tick:

- `q.py mark-submitted` will refuse if *that experiment already has* `submission.timestamp`, unless `--force`.
- `add-exp` and `eligibility()` will refuse a candidate commit whose first 7 characters already have a **score** in `experiments.jsonl`.
- They will **not** see a `PENDING` or already-scored row in `site_results.csv`.
- Because `experiments.jsonl` stops at Build 12, a restarted tick that trusted only `q.py` could try to click a Saturday SHA (including B125 `ec50d23`) a second time. The protection that actually exists is operational: the site itself, `site_results.csv` if the operator reads it, and (after 5:41) the instruction that the routine must reconcile receipts against `coord/data` before a click. That reconcile step is **not implemented inside `q.py` today**.

### 2.3 Proposed `q.py` patch (report only; not applied)

Do not ship this without a replay on recorded data (this section is that replay) and Doug’s yes, because it would change the tool that declares builds eligible.

1. Read `coord/data/site_results.csv` and `coord/data/screens.csv` (and `champion.json`) in `eligibility()`, not only `experiments.jsonl`.
2. HOLD if `site_results` already has this `commit_sha` or a `PENDING` row for any build (sequence rule + no double submit).
3. HOLD if no complete paired rows exist for this exact SHA vs the *current* champion SHA on **both** `2000+3000` and `4000+5000`.
4. HOLD if recorded fires are under about 10/192 (P21).
5. HOLD if the candidate does not contain the live champion (`merge-base --is-ancestor`).
6. Slot cap should count `site_results.submitted_et` in the rolling 60 minutes, not the stale JSONL.

Until that lands, treat `q.py eligible` as **not authoritative**.

## 3. Who actually controls submission today

The approved rule (Doug, 5:41 PM ET, recorded in WORKFLOW_CHART / WORKFLOW): the 10-minute routine **`mech-royale-self-improvement-loop`** is the sole submitter, via a computer-use browser click, and it must reconcile site receipts against `coord/data` before each submit.

**What this audit could verify:**

- The routine **id** is not present in the public repo, on this box’s worktrees, or in any committed prompt file this session could read. There is no `ListRoutine` tool in the available tool catalog here, and a search for `mech-royale-self-improvement-loop` returned no file.
- Git authors on the 5:15–5:33 site-result commits are all “D McLaughlin,” same as coordinator doc commits, so they do not prove which operator clicked.
- `WORKFLOW.md` still also says “Grok submits the commit SHA” in the mermaid diagram and still describes `python3 pipeline/q.py brief` as the tick tool. Those lines are stale relative to the 5:41 chart note. They are a documentation drift risk, not a second verified submitter.
- Pre-click checks the routine is *supposed* to perform, from the 5:41 writing: READY (`coord/data/ready_ledger.md` was first created as a stub by the 5:45 PM ET loop tick, `99aa2d1`; this audit expands that stub), a free slot, no pending score, receipt reconcile against `coord/data`.
- Pre-click checks it **actually** performed at 5:33 PM ET, from the outcome: it clicked B125 after a 96-game seed-2000 run, while the held-out screen that later showed drop-ring arrivals 6→1 was not yet in. So at that tick it did **not** require a complete paired screen or a READY record. That was under the 5:14 relaxation, which 5:41/5:45 reversed.

Observed after the 5:45 reversal: the 5:45 PM ET tick **did not click**, and it recorded “No READY candidate” plus the empty-slot blocker (owners: Mech Builder then Sim Tester). That is consistent with a blocking READY check, but it is not a reading of the prompt itself. The 5:45 tick did not yet see P25’s SHA `b34271c` (commit 5:45:20 PM ET, ledger commit 5:45:42 PM ET — nearly simultaneous). The 5:55 tick (`20d03ae`) recorded PR #136 (`b34271c`) as HOLD, waiting on the full paired screen, and still did not click. That is two consecutive post-reversal ticks that held an empty slot correctly.

**Gap:** this auditor cannot read the live routine prompt for `mech-royale-self-improvement-loop`, so it cannot confirm the post-5:45 text includes all four checks (READY, free slot, no pending score, receipt reconcile) as blocking rather than advisory, or that no other operator can click. The authorized operator (Grok coordinator, who can open the routine) should paste or export the current prompt and tick log against this list. Until that is verified, treat “sole submitter with those four pre-click checks” as **written into the workflow docs and consistent with the 5:45 hold, not independently verified from the prompt text.**

## 4. Mode 36 verdict (PR #129, branch `build-121-movement-iter3`, head `11826aee02`)

Claim in the PR body and in `coord/data/research/movement-iter3.md` on that branch (not yet on main): over 384 games, ring arrivals 12→14, captures 10→12. **Verified**, with the exact split:

| Set | Games changed | Rings | Holds done | Captures | Alive at end | Surv 120 s | Surv 180 s | Died <40 s | Pins (windows) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2000+3000 (n=192) | 11 | 6→7 | 5→5 | 5→6 | 6→6 | 0.172→0.172 | 0.125→0.115 | 56→56 | 166→137 |
| 4000+5000 (n=192) | 11 | 6→7 | 5→6 | 5→6 | 5→5 | 0.214→0.214 | 0.156→0.146 | 54→54 | 186→190 |
| Pooled 384 | 22, score −0.016 ± 0.024 | 12→14 | 10→11 | 10→12 | 11→11 | 0.193→0.193 | 0.141→0.130 | 110→110 | 352→327 |

Pin seeds 41/43/72/92 are identical to mode 0. Drop-run → crossfire flips 211→39 (the mechanism). `check.py` max 3.4 ms (flag 0 and mode 36). Flag 0 is eqdrive-identical to `origin/main` at `1781116` (bot code of that main still equals `6182d29`; `6182d29` **is an ancestor** of `11826aee`). Sim late-50 ms spikes on set 2000+3000 are called out in the note as machine load; `check.py` is the timing gate.

**Novelty vs the drop family already tested:** Mode 36 does not change `DROP_RUN_M` (B104 150 m, B107 same rule on 4.06, B113 200 m, B118 260 m tie) and does not add a new start condition (P20 hurt+unseen tie, P21 lone contest 1/192 tie). It changes one decision: while a drop run or ring hold is active, **skip `break crossfire` unless a mech damaged us in the last 2 s.** That is a new trigger and a new behavior in the games where the champion would have aborted the run for two lines of sight without a recent hit.

**Does it deserve a candidate build?** **Yes**, as a *future* one-flag site cut (`EVADE_MODE=36` or a dedicated flag) on `6182d29`, then a fresh official screen of *that exact SHA* on both seed sets, logged in `screens.csv` before any click. It is **not READY today**: PR #129 is labeled SIM-ONLY, `EVADE_MODE` stays 0, and there is no site-candidate SHA. Headline late survival is flat at the end (11→11) but survival at 180 s dips slightly (0.141→0.130); that must be in the site-screen pack, not hidden. A sim score dip alone is not a veto.

## 5. PR #133 (sim effectiveness, docs only, head `1703c0c5`)

Diego’s Claude, docs only, nothing implemented. Profile: house AI is about 90% of sim time in long games; most of that is failed A* in `geom.ts findPath` (987 failures, 6.1 s of a 7.3 s game). First recommendation: skip A* when start and goal are in different grid components (claimed exact by construction; estimated ~2× faster screens). Also: default `--jobs` to 2× cores (~17% faster, claimed identical results), `--seed-base`, extra CSV columns, `--vs` paired diff, optional house profiles.

**Benchmark required before any screening-lane change** (do not change the lane now):

1. Freeze a bundle of already-recorded official screens: the same bot SHAs (at least champion `6182d29` and two known candidates, e.g. P23 `76c3fa8` and P23b `cf96cf5`), the same kit, and the same seed sets 2000+3000 and 4000+5000.
2. Run the current engine and the patched engine on those identical games.
3. Require **byte-identical or field-identical game outcomes**: place, score, kills, deaths, drop-ring arrivals, holds, captures, death time, and the paired better/worse/changed counts. Wall-clock and `bot_ms_*` may change; outcome columns may not.
4. Report wall-clock ratio and any non-identical row. A single mismatched game is a fail.
5. Only if outcomes match, consider using the shortcut in new screens. Old screens remain valid for the same SHA. This still needs Doug’s yes before the screening lane changes, because it is an automation / screening-path change.

## 6. Lane throughput

From GitHub PR timestamps (UTC converted to ET) for Saturday afternoon site-or-near-site work. Idea-to-PR is often only visible from PR open time minus a handoff note, so some rows are PR-to-screen only.

| Lane | What it actually shipped this afternoon | Idea / handoff → PR | PR → complete both-set screen | Fully screened site builds per hour |
|---|---|---|---|---|
| Mech Builder | P20 #121, P21 #122, P23 #127, P24 #130, P23b #134; P25 branch `b34271c` at 5:45 PM ET, **no PR** | P21 PR 2:58 PM; P23 PR 4:37 PM; P24 PR 5:05 PM (heal-positioning note 5:02); P23b PR 5:23 PM (~15–20 min after the P23 veto report) | P21: 2000+3000 comment at 3:31 PM (~33 min), **no held-out** before the 3:55 click. P23: both sets were done (veto). P23b held-out landed 5:39, **15 min after** the 5:24 click. P24 2000+3000 landed 5:48, **33 min after** the 5:15 click; held-out still missing. | Well under 1 qualified build per hour. Burst of PRs is faster than complete screens. |
| Doug’s Claude (Grok’s computer) | B122/B123 veto PRs; B125 #135 at 5:27 PM ET | B125 PR 5:27, click 5:33 (~6 min) | Full 384-game table appeared as a PR comment *around or after* the click; held-out drop rings 6→1 were the late warning. | Not a source of *qualified* builds this hour. |
| Diego’s Claude | Docs/measurement: #124, #125, #131 (5:08 PM), #132 (5:13), #133 (5:18). P-D-008/009 correctly recommended no build (<10/192). P-D-010 (en-route delay) assigned 5:40–5:50, **not ACKed** at audit time. Diego was out ~1:18–3:42 PM ET. | Measurement PRs in a tight 10-minute burst once started. | Not site builds. | **0** site-qualified builds / hour (correctly, given the counts). |
| Mech Sim Tester | Official both-set screens when assigned (P23 veto is the clean example); several rows backfilled after clicks. | n/a | A complete both-set screen is typically **30–60+ minutes**, and sometimes lands after the click. | About **0.5–1** complete both-set screens per hour in this window, not 6. |

**Distance from the 6/hour target:** one qualified build is needed about every 10 minutes. The screening lane currently produces on the order of **one complete both-set screen every 30–60 minutes**, and the READY reserve at 5:50 PM ET is **zero**. That is roughly **3–6× too slow**, and the afternoon’s unused 4:09–5:15 window plus the three incomplete clicks are the visible cost. Filling Doug’s approved reserve (2 fully screened + 1 researched) is the supply fix; waiving the screen is not.

## 7. Four worked control cases (also in §2.2 and `ready_ledger.md`)

1. **P21 — HOLD.** Fires in 1/192. The ~10/192 bar is a keep-out, not a suggestion. Official result later: 4.17 tie. Current `q.py` would have missed this.
2. **P24 at 5:15 — control failure; the gate should have said HOLD.** Screen was explicitly “will follow.” The late 2000+3000 row (fired 85, different score 52, 18/34, sim −0.286 ± 0.133) and the official 3.79 agree in direction, and arrived after the slot was spent. Held-out is still missing.
3. **Stale approval — HOLD.** PR #113 / #114 current heads contain `6182d29` because main was merged at 2:51 PM ET, but the recorded screens are vs `42a19d7` (4.06). A new champion expires those approvals until they are re-screened on both seed sets vs `6182d29`.
4. **Fully eligible — none.** Closest is mode 36 (missing a site-candidate SHA and an official ledger screen of that SHA). Runner-up is P25 PR #136 (missing a full official screen; new pin on seed 72).

## 8. Top 5 problems

1. **Clicks on incomplete screens (5:15–5:33 PM ET).** P24 3.79, P23b 4.00, B125 3.50. Direct score waste, and B125’s held-out later showed the drop-ring regression (6→1) that 4.17 was built on. The 5:14 relaxation was the process cause. (Already reversed at 5:41/5:45; this audit does not change the rule.)
2. **No READY reserve, and the screening lane cannot feed 6 clicks an hour.** After 4:10 PM ET the cap was 6, but from 4:09–5:15 free slots sat empty, then unfinished builds were clicked. Zero READY candidates at 5:50 PM ET.
3. **The live ledger and the tool that is supposed to declare eligibility are not the same system.** `q.py` is stale (Build 12) and would have passed P21, P24-unscreened, and stale 4.06 screens. The routine’s prompt is not readable from this box; the 5:45 tick did hold when the new ledger said no READY, which is encouraging. `log.md` still ends at 4:09 PM ET; `ideas.md` is stale; `STATUS.md` was only appended at 5:45 for the empty slot and still has a 3:44 PM ET body (site table stops at P20).
4. **Screens and receipts are often written after the click, and some families never get a `screens.csv` row at all** (P20, P21, B113, B115, B118, B125, and P24 held-out, as of this audit). The hourly “evidence before the click” target of 100% is currently 0/10 against the champion.
5. **Idea supply is not recorded as a ranked, disprovable queue** (this commit adds `ideas_queue.md` and `ready_ledger.md` to start that). Without those records, ranking by “biggest expected impact” cannot be audited, and a new champion cannot cleanly expire old approvals.

## 9. Ranked fixes (who changes what)

Items that change operating rules, ownership, screening requirements, submission authority, or automation need **Doug’s explicit yes**. This audit does not apply them.

1. **Grok / routine operator — verify, do not assume, the live routine prompt.** Export the current `mech-royale-self-improvement-loop` text and tick log. Confirm it blocks (not just mentions) READY + free slot + no pending + receipt reconcile, and that only that routine can click. If any check is missing, stop clicking until it is present. (Verification, not a new rule. If the prompt still has to be edited, that edit needs Doug’s yes only if it changes authority or checks beyond what he already approved at 5:41.)
2. **Grok — keep `ready_ledger.md`, `ideas_queue.md`, `site_results.csv`, `screens.csv`, and `log.md` current on every tick.** A 4:09-style silence is a production bug. `STATUS.md` and `ideas.md` should be refreshed or clearly marked stale. No Doug yes required; this is the existing “nothing gets lost in coord/data” rule.
3. **Mech Sim Tester + builders — finish the official both-set screen before a SHA is marked READY, and reuse a valid screen only for the same SHA, champion, and seeds.** Immediate work: screen P25 once it has a PR; cut mode 36 as a one-flag site SHA and screen that. No Doug yes for doing the screens. Changing the screening *engine* (#133 shortcut) needs the §5 benchmark and then Doug’s yes.
4. **Grok, with Doug’s yes — patch or replace `q.py` eligibility** as in §2.3, or formally retire it so WORKFLOW does not point at a dormant tool. Replay already done on the four cases above.
5. **Grok + Doug’s Claude / Mech Builder — stock the approved two-READY + one-researched reserve.** First researched replacement is already assigned: P-D-010 (Diego’s Claude, not ACKed). Top candidate to cut as a site SHA: mode 36. Runner-up: P25. The reserve *target* was already approved at 5:41; executing it does not need a new yes. A changelog that would let a previously tested idea qualify only because the champion changed is already decided (5:41: only if the sim shows the new champion changes where/how often it fires, and it ranks below new ideas).

Fixes that are already done and should not be re-litigated: 6/hour in config and brief; no resubmits; never click “Pick as our final entry”; full screens; sole submitter as a *written* rule; rebuild policy; two-build reserve with Diego’s Claude as backup.
