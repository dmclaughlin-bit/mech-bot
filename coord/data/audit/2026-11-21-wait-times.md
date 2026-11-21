# Where builds actually waited (Sat 21 Nov 2026, afternoon)

Written Saturday 21 November 2026, about 6:03 PM ET. Read-only on workflow, routines, and bot code. Times below are converted to America/New_York (ET, UTC−5). This report does not guess. A timestamp marked **unknown** was not found in the records named here.

Sources: `coord/data/site_results.csv`, `coord/data/screens.csv`, `coord/data/ready_ledger.md`, GitHub PR create/commit/comment times (`gh pr view` / issue comments), Sim Tester logs and run CSV mtimes under `/workspace/tester/`, and journal logs under `/tmp/p23-screen`, `/tmp/p23b-screen`, `/tmp/p2021-screen`, `/tmp/b125-haz`. `#133` claims are from `coord/audit/sim-effectiveness-recs-2026-11-21.md` on PR #133 (not on `main`).

## How to read the times

- **PR opened / last push:** GitHub `createdAt` and the last commit's `committedDate` (UTC converted to ET).
- **Screen requested:** an exact “please screen” clock is usually missing. When no request comment exists, this is **unknown**; PR open is listed as the earliest moment the SHA was public.
- **Screen start / finish:** taken from Sim Tester `screen*.log` start/end lines when they exist. Otherwise, CSV mtimes are **end** times of that run only (the start of that run is unknown). A second measurement lane (journals under `/tmp/*-screen`) sometimes ran at the same time; both are listed when found.
- **Site submit:** `site_results.csv` `submitted_et`, minute precision (the second is unknown).
- **Score time:** no site-API score clock was found. The time used is the first PR comment or `coord/log.md` line that records the official score. That is when the result was written down, which is an **upper bound** on when the site finished scoring. `site_results.csv` notes that say “scored in about N min” are contemporaneous estimates, not exact clocks.
- **Wait for a screen:** PR ready (opened or last push that made the tested SHA) → screen start.
- **Screen run time:** screen start → last official-set finish. Hazard runs, write-ups, and a second overlapping lane are called out separately.
- **Wait for the site score:** submit → first recorded score. Because submit is minute-precision, these waits are ± about 1 minute.

A **complete both-set screen** here means paired 2000+3000 and 4000+5000 vs the current champion, which is the 5:41 PM ET rule. Many afternoon screens only finished one seed set.

## 1. Per-build timeline (since about 3:00 PM ET)

Also included: P20 and B117 (submitted after 3:00), P23 (screened, vetoed, never submitted), and P25 #136 (screened after 5:41, not submitted). B112 / P19 screens finished just before 3:00 PM ET and are noted at the end, not in the median set.

Current champion throughout this window: B113, bot `6182d29`, official score 4.17, receipt BB-09AE8A68, submitted 2:40 PM ET.

### P20 — PR #121, `dd18a74`, DROP_HURT_ON

| Event | Time (ET) | Source |
|---|---|---|
| Last push / PR opened | 2:57:03 PM / 2:58:11 PM | commit / `createdAt` |
| Screen requested | unknown | no request comment |
| Screen start | unknown (first official CSV ended 3:04:15 PM) | `/tmp/p2021-screen/runs/p20-2000.csv` mtime |
| Official 2000+3000 finished | 3:17:14 PM (`p20-3000.csv`) | same dir; comment posted 3:31:07 PM |
| Held-out 4000+5000 | not found | no row in `screens.csv` |
| Site submit | 3:07 PM | `site_results.csv`, BB-36A427E0, score 4.17 tie |
| Score first recorded | 3:12:52 PM | PR comment; `log.md` 3:12 PM. Note: “scored after about 4-5 min” |

**Waits:** screen-start wait unknown. Official 2000+3000 run time unknown (start missing); the 2000 and 3000 CSVs end 13 minutes apart, but other P20/P21 runs were interleaved. Score recorded 5–6 min after the 3:07 submit (contemporaneous estimate 4–5 min).

**Click before the screen finished: yes.** Submitted at 3:07 PM, while `p20-3000.csv` was still running (ended 3:17:14 PM). The paired comment landed at 3:31:07 PM. The trigger never fired (0/192). No held-out set.

### B117 — PR #123, `4e39389`, MATCHUP_ON

| Event | Time (ET) | Source |
|---|---|---|
| Earlier SHA on an older base | 2:59:14–2:59:45 PM | three commits, including a builder screen row |
| PR opened / 4.17 merge (`4e39389`) | 3:10:58 PM / 3:11:46 PM | `createdAt` / merge commit |
| Rebase note | 3:11:56 PM | PR comment: head contains `6182d29` |
| Screen requested | unknown | no request comment |
| 4.17 screen start | unknown | first `4e39389-2000.csv` ended 3:51:58 PM (`/workspace/tester/runs`) |
| 2000+3000 + flag-0 finished | 3:52:53 PM / 3:53:27 PM | `4e39389-3000.csv`, `4e39389-flag0-2000.csv` |
| Held-out 4000+5000 | not found | no `screens.csv` row |
| Screen comment (post-mortem) | 4:02:12 PM | PR comment, after the site score |
| Site submit | 3:44 PM | `site_results.csv`, BB-A84FCC28, score 4.08 |
| Score first recorded | 3:47:50 PM | PR comment; `log.md` 3:47 PM. Note: “scored in about 3 min” |

**Waits:** 4.17 screen-start wait unknown (merge 3:11:46 PM; first CSV end 3:51:58 PM). 2000+3000 CSV ends are about 1 minute apart; flag-0 ended 34 s later; start is unknown. Score recorded about 3–4 min after submit.

**Click before the 4.17 screen finished: yes.** Submitted 3:44 PM; 4.17 CSVs ended 3:51:58–3:53:27 PM.

### P21 — PR #122, `1b692c9`, DROP_CONTEST_ON

| Event | Time (ET) | Source |
|---|---|---|
| Last push / PR opened | 2:57–2:58:13 PM | PR `createdAt` 2:58:13 PM |
| Screen requested | unknown | run together with P20 in `/tmp/p2021-screen` |
| Official 2000 CSV (rerun) ended | 3:14:30 PM | `p21-2000.csv` (an earlier high-load 2000 CSV ended 3:06:43 PM) |
| Official 3000 finished | 3:18:43 PM | `p21-3000.csv` |
| Held-out 4000+5000 | not found | no `screens.csv` row |
| Screen comment | 3:31:07 PM | same minute as the P20 screen comment |
| Site submit | 3:55 PM | `site_results.csv`, BB-1D97890A, score 4.17 tie |
| Score first recorded | 4:05:05 PM | PR comment; `log.md` 4:05 PM. Note: “scored in about 4-5 min” |

**Waits:** click was **after** the 2000+3000 screen comment (3:31:07 PM), so this is not a before-finish click for that one set. There was still no held-out set. Recorded score wait is about 10 min; that disagrees with the “about 4-5 min” note, so the exact site clock is **unknown** (the comment may have been posted late).

### B110 — PR #108, first `24d5b4d`, submitted `6124894` (standoff 90 s)

Two screens exist. The first is vs champion `4d6e71b` (4.10). The submitted SHA is the 2:51:29 PM merge onto 4.17, `6124894`.

| Event | Time (ET) | Source |
|---|---|---|
| First SHA / PR opened | 2:01:11 PM / 2:01:19 PM | commit / `createdAt` |
| Screen vs 4.10, first CSV end (flag-0) | 2:16:03 PM | `24d5b4d-flag0-2000.csv` |
| Screen vs 4.10, last official set | 2:21:15 PM | `24d5b4d-5000.csv`; comment 2:21:36 PM |
| Merge onto 4.17 (`6124894`) | 2:51:29 PM | last push |
| Site submit of `6124894` | 4:00 PM | `site_results.csv`, BB-4E063E2E, score 3.96 |
| Score first recorded | 4:05:07 PM | PR comment; `log.md` 4:05 PM. Note: “scored in about 5 min” |
| 4.17 re-screen start | unknown | first `6124894-2000.csv` ended 4:09:24 PM |
| 4.17 2000+3000 + flag-0 finished | 4:10:16 PM / 4:10:48 PM | tester CSVs; comment 4:16:45 PM |
| 4.17 held-out 4000+5000 | not found | `screens.csv` has only 2000+3000 for `6124894` |

**Waits:** vs-4.10 start unknown; last official CSV is 5 min 12 s after the flag-0 CSV ended, so the official both-set portion lasted **at least** 5 min 12 s. Score recorded about 5 min after submit.

**Click before the 4.17 screen finished: yes.** Submitted 4:00 PM; 4.17 CSVs ended 4:09–4:10 PM. The earlier both-set screen was against the 4.10 champion, not `6182d29`.

### B111 — PR #109, first `1fb1f47`, submitted `e2ca93d` (ambush 100 m)

Same pattern as B110.

| Event | Time (ET) | Source |
|---|---|---|
| First SHA / PR opened | 2:01:14 PM / 2:01:26 PM | commit / `createdAt` |
| Screen vs 4.10, first CSV end (flag-0) | 2:24:16 PM | `1fb1f47-flag0-2000.csv` (after B110’s 4.10 screen) |
| Screen vs 4.10, last official set | 2:26:58 PM | `1fb1f47-5000.csv`; comment 2:27:13 PM |
| Merge onto 4.17 (`e2ca93d`) | 2:51:33 PM | last push |
| Site submit of `e2ca93d` | 4:05 PM | `site_results.csv`, BB-D985B698, score 4.10 |
| Score first recorded | 4:07:43 PM | PR comment; `log.md` 4:09 PM. Note: “scored in about 2 min” |
| 4.17 re-screen, first CSV end | 4:17:14 PM | `e2ca93d-2000.csv` |
| 4.17 2000+3000 + flag-0 finished | 4:18:24 PM / 4:19:19 PM | tester CSVs; comment 4:28:24 PM |
| 4.17 held-out 4000+5000 | not found | `screens.csv` has only 2000+3000 for `e2ca93d` |

**Click before the 4.17 screen finished: yes.** Submitted 4:05 PM; 4.17 CSVs ended 4:17–4:19 PM.

### P23 — PR #127, `76c3fa8`, LATE_FARM_ON (vetoed, not submitted)

Two complete both-set lanes ran, partly overlapping.

| Event | Time (ET) | Source |
|---|---|---|
| PR opened | 4:37:56 PM | `createdAt` (head `76c3fa8`) |
| Screen requested | unknown | no request comment |
| Measurement-lane official start / all-official done | 4:40:22 PM / 4:59:11 PM | `/tmp/p23-screen/journal.log` (main + P23 + flag-off, all four bases, `--jobs 3`) |
| Sim Tester lane start / finish | 4:57:46 PM / 5:05:13 PM | `/workspace/tester/screen127.log` (`--jobs 4`; flag-0, head 2000–5000, champ 4000–5000) |
| Both-set rows recorded | 5:09:52 PM | commit `c642ed2` to `screens.csv` |
| Veto comment | 5:09:33 PM | PR comment (seed-90 64 s pin) |
| Site submit | none | not submitted |

**Waits:** tester-lane wait for a screen = 4:37:56 PM → 4:57:46 PM = **19 min 50 s**. Tester-lane run time = **7 min 27 s**. Measurement-lane official package = 4:40:22–4:59:11 PM = **18 min 49 s** (includes champ, candidate, and flag-off on both sets, under load average about 16–23, and overlapping the tester lane).

### P24 — PR #130, `184bc1c`, HEAL_COVER=2

| Event | Time (ET) | Source |
|---|---|---|
| PR opened | 5:05:53 PM | `createdAt` |
| Screen requested | unknown as a clock | PR path was “paired screen will follow”; research note in-repo at 5:00 PM ET is measurement of the champion, not this SHA |
| Site submit | 5:15 PM | `site_results.csv`, BB-BE220066, score 3.79. Notes: “paired screen still pending” |
| Score first recorded | 5:20:40 PM | PR comment |
| 2000+3000 CSVs ended | 5:22:27 PM / 5:23:26 PM | `184bc1c-2000.csv`, `184bc1c-3000.csv`; flag-0 ended 5:24:28 PM |
| Held-out 4000+5000 | not found | `screens.csv` has only 2000+3000, committed 5:48:50 PM (`72ef303`) |
| Post-mortem comment | 5:48:45 PM | PR comment |

**Waits:** screen start unknown. Score recorded about 5–6 min after submit.

**Click before the screen finished: yes.** Submitted 5:15 PM with the pending screen noted in `site_results.csv`. The only official set landed 5:22–5:24 PM, after the click. No held-out set was recorded.

### P23b — PR #134, `cf96cf5`, LATE_FARM_ON (stationary + abort)

Two lanes again, overlapping.

| Event | Time (ET) | Source |
|---|---|---|
| PR opened | 5:23:05 PM | `createdAt` |
| Screen requested | unknown | no request comment |
| Site submit | 5:24 PM | `site_results.csv`, BB-AEFC0FA8, score 4.00. Notes: “paired screen pending” |
| Score first recorded | 5:28:42 PM | PR comment |
| Sim Tester start / official sets done / hazard done | 5:25:48 PM / 5:31:42 PM / 5:33:33 PM | `screen134.log` (`--jobs 4`) |
| Measurement-lane official start / all-official done | 5:25:31 PM / 5:45:32 PM | `/tmp/p23b-screen/journal.log` (main + P23b + flag-off, both sets, `--jobs 3`) |
| Both-set rows recorded | 5:39:09 PM | commit `96fa589`; PASS comments 5:38:42 and 5:39:06 PM |

**Waits:** tester-lane wait = 5:23:05 → 5:25:48 PM = **2 min 43 s**. Tester official both-set run time (head 2000, flag-0, 3000, 4000, 5000) = **5 min 54 s**; including hazard = **7 min 45 s**. Measurement-lane official package = **20 min 1 s**. Score recorded about 4–5 min after submit.

**Click before the screen finished: yes.** Submitted 5:24 PM, about 1–2 minutes before either lane’s start, and 7–8 minutes before the tester official sets finished.

### B125 — PR #135, `ec50d23`, six-tactic package

| Event | Time (ET) | Source |
|---|---|---|
| Last push / PR opened | 5:24:54 PM / 5:27:12 PM | commit / `createdAt` |
| Screen requested | unknown | PR body now warns against a site test after a held-out ring loss; the time of that body edit is unknown, so it is not used as a pre-click clock |
| First finished haz CSV | 5:19:40 PM (`champ-2000.csv`) | `/tmp/b125-haz/` — start of that run is unknown (and it may have begun before the PR) |
| Last official both-set CSV | 5:36:08 PM | `cand-5000.csv` (champ/cand 2000–5000 ends: 5:19:40, 5:26:19, 5:29:22, 5:30:27, 5:31:48, 5:33:02, 5:34:47, 5:36:08) |
| Site submit | 5:33 PM | `site_results.csv`, BB-C6A19503, score 3.50. Notes mention a 96-game sim, not a finished both-set screen |
| Full-screen PR comment | 5:37:03 PM | after `cand-5000.csv` |
| Score first recorded | 5:37:56 PM | PR comment |
| Post-mortem | 5:51:50 PM | PR comment |

**Waits:** screen start unknown. Official both-set file ends span at least 5:19:40–5:36:08 PM (**16 min 28 s** of observed ends, plus an unknown first-run duration). Score recorded about 5 min after submit.

**Click before the screen finished: yes.** Submitted 5:33 PM; `cand-5000.csv` ended 5:36:08 PM; the full-screen comment is 5:37:03 PM. `screens.csv` still has no B125 row at the time of this write-up.

### P25 — PR #136, `b34271c`, CUBE_MEMORY_ON (not submitted)

| Event | Time (ET) | Source |
|---|---|---|
| Last push / PR opened | 5:45:20 PM / 5:47:00 PM | commit / `createdAt` |
| Screen requested | no separate comment; PR / ledger said HOLD until Sim Tester’s both-set screen | `ready_ledger.md` 5:50 PM snapshot; PR body |
| Sim Tester start | 5:51:20 PM | `screen136.log` flag-0 2000 start; script uses `flock` on `sim.lock` and `--jobs 4` |
| Official both-set + champ reruns finished | 5:58:41 PM | head 2000–5000 and champ 2000–5000 |
| Hazard (base 0, head + champ) finished / script DONE | 6:01:46 PM | same log, last line `DONE` |
| `screens.csv` / PR comment / site submit | none as of 6:02 PM ET | 0 issue comments; no `screens.csv` row; not submitted |

**Waits:** wait for a screen = 5:47:00 → 5:51:20 PM = **4 min 20 s**. Official package (flag-0 + head both sets + champ both sets) = **7 min 21 s**. Full script including hazard = **10 min 26 s**. No site score (not submitted). This is the first complete both-set tester package after the 5:41 PM ET rules.

At 5:45 and 5:55 PM ET the 10-minute loop recorded unused slots because nothing was READY (`99aa2d1`, `20d03ae`). P25’s official sets were not done until 5:58:41 PM.

### Just before 3:00 PM ET (not in the medians)

B112 PR #110 (`869da49` vs 4.10): flag-0 CSV ended 2:28:48 PM, last official 2:34:06 PM, comment 2:34:41 PM. P19 PR #112 (`d24b82a` vs 4.10): flag-0 ended 2:35:32 PM, last official 2:40:05 PM, comments 2:40:29 and 2:50:42 PM. Both both-set screens are against the 4.10 champion, not 4.17.

## 2. Medians and what the new loop cannot yet tell

### Wait for a screen (tester lane, logged start only)

Only three tester-lane starts were logged after 3:00 PM:

| Build | Wait (PR ready → start) |
|---|---|
| P23 #127 | 19 min 50 s |
| P23b #134 | 2 min 43 s |
| P25 #136 | 4 min 20 s |

**Median: 4 min 20 s (n=3).** This is a small sample. P23’s ~20 min gap is real and may include `waitidle` / `sim.lock` contention (P23’s other lane was already running). It is not enough to describe a typical post-5:41 wait.

### Screen run time (tester lane, complete official package)

| Build | Official package | With hazard in the same script |
|---|---|---|
| P23 #127 | 7 min 27 s (flag-0, head 2000–5000, champ 4000–5000) | hazard was a separate later log (`haz127.log` mtime 5:08:00 PM); not combined here |
| P23b #134 | 5 min 54 s (flag-0 + head both sets; no champ rerun in that log) | 7 min 45 s |
| P25 #136 | 7 min 21 s (flag-0 + head both sets + champ both sets) | 10 min 26 s |

**Median official-package run time: 7 min 21 s (n=3).** With-hazard times exist for only two scripts (7:45 and 10:26), so no median is given.

A 96-game set at `--jobs 4` on this box often finishes in about 1–2 minutes when the machine is not overloaded (see the tester logs). Under load average 16–23, a 96-game set stretched to about 1.5–2.5 minutes. The ~7 minute official package is several of those sets run **one after another**, which is how `screen136.sh` and the other tester scripts work.

### Wait for the site score (submit → first recorded score)

Submit times are minute-precision, so each wait is ± about 1 minute.

| Build | Submit | First recorded score | Recorded wait | Contemporaneous note |
|---|---|---|---|---|
| P20 | 3:07 PM | 3:12:52 PM | ~6 min | “about 4-5 min” |
| B117 | 3:44 PM | 3:47:50 PM | ~4 min | “about 3 min” |
| P21 | 3:55 PM | 4:05:05 PM | ~10 min | “about 4-5 min” (disagrees; site clock unknown) |
| B110 | 4:00 PM | 4:05:07 PM | ~5 min | “about 5 min” |
| B111 | 4:05 PM | 4:07:43 PM | ~3 min | “about 2 min” |
| P24 | 5:15 PM | 5:20:40 PM | ~6 min | none |
| P23b | 5:24 PM | 5:28:42 PM | ~5 min | none |
| B125 | 5:33 PM | 5:37:56 PM | ~5 min | none |

**Median recorded wait: about 5 minutes (n=8).** Dropping P21’s outlier (the only row that disagrees with its own note) still leaves a median of about 5 minutes (n=7). This supports the planning figure of a ~5 min one-at-a-time score wait, as a recorded-comment interval, not a site-API clock.

### The 5:41 PM ET loop is too new to tell

There have been **no site submissions after 5:41 PM ET**. The 5:45 and 5:55 ticks left the slots unused because no build was READY. P25’s tester official sets finished at 5:58:41 PM, after those ticks, and had not been written to `screens.csv` or a PR comment as of 6:02 PM ET. We therefore cannot measure, under the new rules, how long a fully screened READY build waits for a click, or how long a post-5:41 score takes. The afternoon numbers above were earned under the earlier, looser click rule.

### Clicks that landed before the comparable screen finished

P20, B117 (4.17 screen), B110 (4.17 re-screen), B111 (4.17 re-screen), P24, P23b, and B125. P21 is the exception: its 2000+3000 screen was already posted at 3:31 PM, before the 3:55 PM click, but it still lacked the held-out set. Since B113 became champion, every afternoon submission in this window failed the 5:41 “both seed sets before the click” rule.

## 3. Complete both-set screens per hour — three options

Hardware on this box, measured now: **8 CPUs** (`nproc`), one socket. `tools/sim/run.ts` already parallelizes one run: default `--jobs` is `min(8, availableParallelism())`, so 8 on this box if the flag is omitted. Sim Tester scripts (`screen125.sh`, `screen127.sh`, `screen134.sh`, `screen136.sh`) **hard-code `--jobs 4`**, and they run seed-base sets **sequentially**, with `flock` on `/workspace/tester/sim.lock` (P25) or `waitidle` (P23-era) so two tester screens do not share the box on purpose. In the afternoon a second measurement lane sometimes ran at the same time anyway, which is why load averages of 16–23 show up in the journals.

This box is **one shared machine for all agents**. There is no second computer visible here. “More computers” would only exist if Doug added one.

`#133` claims, from the recs file on PR #133, measured on a **4-core** box, not this 8-core box: skipping A\* when start and goal are in different `geom.ts` components is estimated **about 2× faster** on full screens; defaulting `--jobs` to 2× cores (cap 8) was measured **about 17% faster** (24 seeds: jobs 4 = 26.2 s, jobs 6 = 23.1 s, jobs 8 = 21.8 s) with identical results. Those two figures are claims pending Diego’s P-D-011 benchmark (same build, same seeds, same hardware, current vs proposed `geom.ts` skip only). They are not re-measured in this report.

Historical afternoon **completion** rate of finished both-set official screens (P23, P23b, P25, and B125’s late both-set files) is about **one per hour**, because screens were often one-set only, queued or overlapped with other work, and written up after the fact. That is not the same as the **run time**, which is about **7 minutes** for a tester official package.

### Option 1 — keep the current setup

- **Compute capacity, this box, current scripts:** a median 7 min 21 s official package implies about **8 complete official packages per hour** if Sim Tester runs them back-to-back on a free box, with no second overlapping lane and no hazard. Including hazard as in the P25 script (~10 min 26 s) implies about **5–6 per hour**.
- **What actually happened this afternoon:** about **1 finished both-set screen per hour**, plus several one-set screens.
- **What would still limit site submissions:** the 6/hour site cap; the READY gate (a screen that is not both-set, or not yet recorded, cannot be clicked after 5:41); build rate (Mech Builder and Grok’s Claude share one usage pool; Diego’s Claude is a smaller separate pool, now on P-D-011 plus backup builds); the about 21% hit rate since noon (most tests will not raise 4.17); and one-at-a-time scoring (~5 min recorded wait), which fits inside a 10-minute slot and is usually not the binding limit if a READY build is waiting.

Current compute is already in the same range as the 6/hour cap, **if** the tester lane stays busy on complete both-set packages. The afternoon shortfall was process contention and clicks on incomplete screens, not a 60-minute runtime.

### Option 2 — adopt #133’s shortcut (conditional on Diego’s P-D-011 benchmark)

Give this estimate only **if** the benchmark shows identical game results (outcome columns, not just final scores) on the same SHA, same seeds, and same hardware.

- If the ~2× `geom.ts` claim holds and run time scales that way, a 7 min 21 s official package becomes about **3.5–4 minutes**, or about **15–16 official packages per hour** of raw compute (about 11–12 if the longer with-hazard script also halves).
- If item 2 (jobs default) is also adopted: tester scripts today force `--jobs 4` on an 8-core box. The 17% figure was 4→8 jobs on a 4-core box. The same change here is “raise the tester from 4 to 8 jobs,” not “add machines.” A 17% gain on top of 2× would be about 2.3×, but that 17% has not been measured on this 8-core box and should not be treated as a fact until P-D-011 (or a follow-up) measures it here.
- **What would still limit site submissions:** the 6/hour cap still caps official tests. Faster screens add headroom for hazard checks, less pain under load, and a reserve of READY builds. They do not raise the site cap, the 21% hit rate, or the shared builder-usage pool. Process overhead (write-up, ledger, lock) also does not automatically shrink by 2×.

Do not adopt this until the benchmark says the games match, and until Doug says yes.

### Option 3 — split each screen across more machines

- **Not available on this box.** Agents share this one 8-core machine. Splitting 2000+3000 and 4000+5000 across two processes on the *same* box is just more `--jobs` / overlapping sets, which fights the existing `sim.lock` / `waitidle` design and is the same lever as #133 item 2, not “more computers.”
- If Doug added a second computer of similar speed and split the two seed sets, official wall-clock *could* fall to roughly half of today’s ~7 min package (about 3–4 min), or two candidates could be screened at once. That second computer is not here, so the rate on **this** machine stays the Option 1 (or Option 2) number.
- **What would still limit site submissions:** the same 6/hour cap, ~5 min serial score wait, ~21% hit rate, and builder-usage pool. A second machine only helps if screening, not those limits, is what is leaving slots empty.

### Recommendation (for Doug’s decision, no rule change in this commit)

Keep the current screening engine until Diego’s P-D-011 benchmark is in. Raw runtime on this box already supports on the order of **6 complete both-set screens per hour** if Sim Tester runs one official package at a time and the second overlapping lane is kept off the same cores. The afternoon’s ~1 finished both-set screen per hour was contention and incomplete screens, not a one-hour runtime. Adopting #133 is worth it for headroom **after** identical-game proof, but it is not required to make 6 screens/hour of compute possible. Do not plan on “more computers” unless Doug actually adds one.

**Decision needed from Doug (after the benchmark, not before):** whether to adopt the #133 `geom.ts` component skip in the screening lane, and optionally whether tester scripts should raise `--jobs` from 4 toward 8 on this box. Until then, leave the gates as they are and keep the tester queue on complete both-set screens so READY builds exist for the 10-minute loop.

## 4. Records

- `#133` recs: https://github.com/dmclaughlin-bit/mech-bot/pull/133 and `coord/audit/sim-effectiveness-recs-2026-11-21.md` on that branch.
- Diego assignment for the benchmark: `coord/next-diego.md` (P-D-011), approved by Doug at 5:57 PM ET in chat.
- Loop audit (eligibility and afternoon empty slots): `coord/data/audit/2026-11-21-loop-audit.md`.
- READY/HOLD snapshot used as context: `coord/data/ready_ledger.md` (about 5:50 PM ET; P25 still HOLD, no both-set row yet).
