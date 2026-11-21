# System proposal: tools, truth, intake, one change at a time, steering view

Written Sat Nov 21 2026, about 6:00 PM ET, for Doug (his five questions of 5:50 PM ET). **A proposal only. Nothing in the rules, routine, workflow docs, `WORKFLOW_CHART.md` (locked) or agent assignments was changed.** Codex was retired by Doug at 5:50 PM ET (it was never logged in; REV-0002 is recorded as `unavailable`) and is not part of any option below.

This builds on, and does not repeat, the loop audit (`coord/data/audit/2026-11-21-loop-audit.md`) and the idea queue (`coord/data/ideas_queue.md`). Numbers come from `coord/data/site_results.csv`, `screens.csv`, PR comments (`gh`), and `pipeline/pipeline_view.py` (output: `coord/data/pipeline_view.json`). Where the repo does not say, this document says **unknown**. The visual view is a Page in Doug's Library (linked from the chat); `pipeline/pipeline_view.py` rebuilds its data.

## Headline findings

1. **Multi-change builds.** Counting the behaviors each submitted build's own text lists: 15 of the 69 scored tests (not counting the S3 resubmit) bundled 2 or more changes (6 won, 9 lost). 54 were single changes (11 won). **Since noon**, 3 of 19 submissions were bundles and all three lost: P24 (2 parts), P23b (2 parts), B125 (**six** tactics, 3.50 against 4.17). Those 3 tests spent 10 distinct changes, so a loss tells us almost nothing about which part hurt.
2. **No complete screen before the click.** Of the 19 submissions since noon, only 1 (B104) has a both-seed-set screen with a timestamp before the click (the loop audit's "at most 2/19" counts B103 too: its rows landed 7 minutes after its click). 3 more have a builder's PR-body table only, 4 have a full screen that appeared **after** the click (P20, P24, P23b, B125), 5 have only the 2000+3000 set, 6 have none on record. The 5:41 PM ET rule (full screen first) already fixes the future; this is the evidence for why.
3. **The record is split four ways and the pieces disagree.** `pipeline/data/experiments.jsonl` (what `q.py eligible` reads) has 13 records, the last from 4:49 AM; `site_results.csv` has 70. `champion.json` says B113 but its history stops at P-D-003. `STATUS.md` says "updated 3:44 PM". `ideas.md` has no row for the loadout, movement or threat-forecast families. `coord/log.md` stamped UTC times as "ET" for about 12:34 to 2:00 PM ET (for example "Sat 5:59 PM ET: P-B-001 4.06" was committed at 12:59 PM ET).
4. **Ideas are assigned in chat, not in the repo.** For 14 of the 19 submitted builds, the first mention in `log.md`, `next-*.md`, `STATUS.md` or `ideas.md` is later than the time the PR was opened. B122, B123, B124, P23 and P25 are not in `log.md` or `next-doug.md` at all. `coord/data/ideas_queue.md` only landed at 5:54 PM ET, hand-written. Git authorship cannot tell the actors apart (83 of 90 commits since noon ET are by the same identity).
5. **The eligibility checker does not check the things that cost us slots.** `q.py eligible` checks kit pass, Codex, "already submitted", duplicate SHA and the hourly count. It does not check that the build contains the champion, has a complete screen, is a single change, or that no score is pending.
6. **Data bug:** `site_results.csv` records B104's champion as 3.79, but B103 (3.92) was already the champion at click time. The view uses the champion actually standing at each click.

## 1. Tool and model allocation

**What is verified on the box (checked 6 PM ET):** Claude Code 2.1.330 is installed. 31 launcher scripts in `/workspace` call `claude -p ... --model opus --effort high --dangerously-skip-permissions`; none use Sonnet. One login directory, `/home/box/.claude`, exists on the box (I did not open its credentials). **Taken from the brief, not verifiable from the box:** that Grok's lanes, Mech Builder and the routine all share that login; that Diego's Claude is a separate account; that the Sim Tester, Wild Sim and Watcher are Grok Bot agents. **Not verifiable:** "Fable". No script, log or tool on the box names a model called that, so it is not in the plan. **Unknown:** the shared login's usage level and remaining limit (the box does not expose it).

| Actor | Uses today | Good at (assumed, not measured here) | Proposed fit |
|---|---|---|---|
| Claude on Grok's computer (Opus, high effort, shared login) | Builds, debugging, gates | Careful multi-file code changes | Keep Opus for hard build/debug and single-change implementation |
| Mech Builder | Same shared login | Same | Opus, same pool: the shared pool is the bottleneck |
| The 10-minute routine | Same shared login | Mostly bookkeeping | **Candidate to move to Sonnet** for mechanical steps (regenerate views, parse PR comments, fill ledgers). Keep the submit decision a plain script check |
| Diego's Claude | Separate account | Measurement, research, backup builder | Keep; it is a second pool, so route reserve builds and measurements here first |
| Grok | Coordination, ranking, the routine | Ranking, writing, web/X research | Coordinator, ranking, Watcher/X research, receipts |
| Sim Tester, Wild Sim, Watcher | Grok Bot agents | Running screens, strange tactics, stream analysis | Unchanged. Sim Tester writes the only screen record |
| Codex | Retired by Doug | n/a | n/a |

**Options.** (A) Leave everything on Opus: simplest, zero risk to builds, but every log-parse and bookkeeping call draws on the same pool that builds need. (B, recommended) Opus for builds and debugging only; Sonnet for mechanical lanes (screen summaries, parsing, view regeneration) as a pilot until the lock, with an identical-output check against the current script output; Grok and Diego's Claude as above. (C) Move more build work to a cheaper model: not recommended, a wasted build costs a slot and the lock is about 15 hours away.
**Tradeoff:** B saves pool for builds but adds a second model to supervise; whether it saves enough is unknown until we measure. **Why:** the shared pool is the one constraint that has a handover rule already (5:41 PM), so protecting it is the cheapest win.

## 2. What is the truth

| Source | What it is | Problem seen |
|---|---|---|
| Official site (joinbuilders.org) | The only truth for score | Not machine-readable; receipts copied by hand |
| `coord/data/site_results.csv` | One row per submission | Champion column wrong for B104; no scored-at time; PR-merge and result times live only in comments |
| `coord/data/screens.csv` | Sim screens, one row per seed set | 16 of the 19 submissions since noon have no complete (both-set) rows for their exact SHA; rows are written after the fact; screens also live in PR comments |
| PR comments (`gh`) | Tester and builder screens, post-mortems, ACKs | Only place for B122/B123/B124 and most owner ACKs; not in `coord/data` |
| `coord/data/ready_ledger.md` | READY/HOLD per candidate | Written 5:45 PM; says P25 has no PR, PR #136 opened 5:47 PM |
| `coord/data/ideas.md` | Family status | Missing loadout, movement and threat-forecast families; no per-idea rows for P20-P25 |
| `coord/STATUS.md`, `next-*.md`, `log.md` | Hand-written status and inboxes | STATUS stale since 3:44 PM; log mixes UTC labelled ET |
| `pipeline/data/*.jsonl`, `champion.json` | Structured store behind `q.py` | experiments.jsonl stops at 4:49 AM (13 records); champion history stops at 4.10 |
| `coord/data/watcher/*`, `research/*` | Watcher and research notes | Ideas live inside prose (SKILLS, RANKED); no record that says "assigned" or "tested" |

**Proposed canonical record: one JSON file per idea, `coord/data/ideas/<id>.json`** (`P25.json`, `B125.json`, `SKILLS-2.json`). Required fields: `id`, `title`, `source` (Watcher / site result / Diego / Wild Sim / Grok / builder / Doug), `situation`, `evidence` (links), `single_decision_changed` (one sentence, one flag), `why_it_helps`, `expected_firing_rate` (games of 192, measured or "unknown"), `closest_prior_test` (+ receipt), `disproof_test`, `owner` (set **before** a PR exists), `stage`, `stage_times` (ET, one per stage), `pr`, `head_sha`, `champion_sha_tested_against`, `screens[]` (SHA, champion, seed set, counts fired/different-behavior/different-score, link), `site{submitted, score, receipt}`. Everything else (`site_results.csv` rows, `ideas.md`, `SOURCE_OF_TRUTH.md`, `ready_ledger.md`, `pipeline_view.json`) becomes **generated** from these records plus the site receipts, so nobody edits a copy.
**Options.** (A, recommended) one file per idea: one writer per file, easy diffs, easy for the generator. (B) one ledger file (CSV/JSONL): easiest to read in a spreadsheet, but every agent edits the same file and merge conflicts follow. (C) Keep the current files and add a checker that flags disagreement: cheapest now, but the four-way split stays.
**Tradeoff:** A needs a one-time backfill (the generator already holds most fields) and a rule that Grok is the only writer of `stage` and `owner`. **Why:** the disagreements in the table above all come from one fact being typed in several places.
**Time-boxed version before the lock:** backfill records only for ideas since noon and for every new idea; leave older history in the existing files.

## 3. Where ideas go

Today ideas arrive in this chat, builder chats, Diego's chat, PR comments and Watcher notes. **Proposed intake: every idea from any agent or person becomes a record first** (stage `Idea`, source tagged). Grok is the only agent that sets `stage` and `owner`; chat is only a notification. A person without repo access drops a note in `coord/inbox/<date>-<name>.md` (one paragraph, one PR or one message to Grok); Grok converts it within one 10-minute tick.
**Options.** (A, recommended) record-first intake, as above. (B) GitHub Issues as the queue (one issue per idea, labels for stage): easy to see and comment, but it adds a second system next to `coord/data`, so truth splits again. (C) Status quo: chat first, repo later (14 of 19 recent builds were recorded after the PR existed).
**Tradeoff:** A adds one step before a builder starts, about one tick. **Why:** "owner recorded before coding" is already the 5:41 PM rule; this is the mechanism that makes it checkable (the view flags a PR opened with no owner on record).

## 4. One change at a time

**Audit** (declared from each build's own text; mechanical diff counts are shown beside them in the data and disagree for 12 builds because they miss settings that are object properties, such as B30's aggression and retreat HP, and count only boolean constants):

| Build | Changes | Site vs champion then | Note |
|---|---|---|---|
| B125 | **6** | 3.50 vs 4.17 | Six TAC_* flags ON in one head; no way to know which hurt |
| B30 | 3 | 3.54 vs 3.50 (win) | aggression, retreatHp and LASER_TRIP_M together |
| B40 | 3 | 3.23 vs 3.54 | rush-first + pre-charge + backstab |
| B20+22 | 2 | 3.35 vs 3.50 | "stacked" |
| B94 | 2 | 3.73 vs 3.79 | P9 + P10 |
| P24 | 2 | 3.79 vs 4.17 | one flag with two parts |
| P23b | 2 | 4.00 vs 4.17 | sweep + abort |
| B1, B2, B3, B5, B5b, B8, B14, B15 | 2-4 | mixed | Friday structure builds, when the baseline was low |

Bundles are not always worse (6 of 15 won, mostly early structure builds). The problem is what a loss teaches: B125's six tactics each have their own flag, so the Sim Tester can screen each flag alone **in the sim at no site-slot cost**.

**Proposed enforceable check (all four pieces):**
1. **PR template fields:** "Decision changed (one sentence)", "Flag added (name)", "Knobs changed (list)". Builder fills them before screening.
2. **One flag per PR:** the diff may add or change exactly one switch (one new boolean/`_ON`, or one changed constant). A package is split into one PR per switch; each is screened alone.
3. **Eligibility checker rejects multi-flag builds:** `q.py eligible` (and the routine's pre-click check) counts new boolean constants plus changed constants in `*.ts` against the parent; more than 1 returns NOT ELIGIBLE unless the record carries a waiver written by Doug. The same check also verifies: head contains the champion, flag-0 identity recorded, complete both-set screen on this SHA, no score pending.
4. **View flags it:** `pipeline_view.py` already shows changes per test and marks bundles red.
**Options.** (A, recommended) hard block with a Doug-only waiver. (B) warn only: no slots lost, but the habit stays. (C) hard block with no waiver: cleanest, but a legitimate two-part fix would have to be split artificially.
**Tradeoff:** A makes some builds take one extra screen; the mechanical check can miss object-property settings, so the PR template field is the second line of defence. **Why:** since noon, 3 of the 12 losses (P24, P23b, B125) were bundles, and a bundle's loss cannot retire any single idea.

## 5. Steering view

The Page delivered with this proposal shows, per idea since noon: source, the single decision it changes, owner, current stage (Idea, Researched, Assigned, Built (PR), Sim screened, READY, Submitted, Scored, Merged or Retired), stage times in ET, and links to the PR, receipt, screen comment and post-mortem; a stage board with counts; a timeline of site scores against the champion line; and changes-per-test with bundles in red. It is read-only, with the data embedded at write time (a Page cannot fetch live data).
**Refresh.** `python3 pipeline/pipeline_view.py` rebuilds `coord/data/pipeline_view.json` from the repo and `gh`. Options: (A) Grok runs it by hand after each result (today). (B, recommended) the 10-minute loop runs it each tick and commits only `coord/data/pipeline_view.json` (read-only: it never submits or edits other files), and Grok refreshes the Page hourly alongside the five-point report. (C) Page refreshed every tick: more current, more usage. **B needs Doug's yes because it gives the loop a new automatic duty.**

## Decisions for Doug (each a separate yes or no)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Make one JSON record per idea (`coord/data/ideas/<id>.json`) the canonical record, with the other files generated from it. Backfill since noon plus all new ideas. | **Yes** |
| D2 | Record-first intake: every idea from any agent or person becomes a record first, Grok sets stage and owner, chat is only a notification. | **Yes** |
| D3 | One-change enforcement: PR template fields, one flag per PR, and the eligibility checker rejects multi-flag builds unless Doug writes a waiver. | **Yes** |
| D4 | Have the Sim Tester screen each of B125's six tactic flags alone, in the sim only (no site slots), before any of them goes to the site. | **Yes** |
| D5 | Pilot Sonnet for mechanical lanes (screen summaries, parsing, view regeneration) until the lock, Opus stays on builds, with an identical-output check. | **Yes** |
| D6 | Let the 10-minute loop regenerate `pipeline_view.json` each tick (read-only) and let Grok refresh the Page hourly. | **Yes** |
| D7 | Add a dated correction note to `coord/log.md` about UTC-labelled-ET entries (no history rewrite), refresh `STATUS.md`, and fix B104's champion column in `site_results.csv`. | **Yes** |

Answers are needed before the next builder assignment for D1 to D4 (they change what a builder is asked to deliver) and before the 6:45 PM report for D6 if Doug wants the Page in that report. D5 and D7 can wait until after the lock.
