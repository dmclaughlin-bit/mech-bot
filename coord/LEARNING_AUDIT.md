# Learning-system audit (report only)

Written Sunday 22 November 2026, about 12:50 AM ET, from `origin/main` `c10bd7b`. This is the report Doug asked for before any substantive workflow change. It does not change workflow files, gameplay code, the routine, approvals, or submission policy. No sims were run. Every number below is copied from a repo file, a commit, or PR #154. Anything not found is marked unverified.

Champion at audit: P48 tree retreat, bot `b9492c6f122c549c705b69402157f078b4a57857`, main `edb729f`, site **4.44**, receipt BB-94897D91. Lock remains Sun 9:00 AM ET.

## A. Current-state audit

### What already supports cumulative learning
- Official truth lives in `coord/data/site_results.csv` (80 scored or rejected rows) and `screens.csv` (118 rows). The site score is the only keep/close rule.
- Idea records (`coord/data/ideas/`, 76 JSON files; D1/D2, Doug 6:46 PM ET) are the intended per-experiment file. Later records (P36–P48) often include a single decision and `what_would_disprove`.
- Five postmortems exist under `coord/data/postmortems/` (B108, B110–B111, B117, P27, P40d).
- Step A (Doug 10:06 PM ET) retires ideas that fire under 10/192 on either set (examples: P46 N1, P51 8/192, P38c, P45).
- The stall rule (Doug 7:16 PM ET) and near-miss pathway (Doug 9:47 PM ET) already let a one-veto build reach the site. That path produced P48 (drop-ring 9→7 and 8→5, then site 4.44).
- The positive-findings ledger `coord/data/findings.md` (Doug 12:36 AM ET, `b982837`, then `c981bdc`, `46a5149`, `c10bd7b`) is the new index: F1–F12 and N1–N2. The 10-minute loop added F11, F12, and N2 after screens and the P47 score. Rebuilds that keep a finding and fix the veto already rank first (P49→P49b).

### What is genuinely missing
- **The ledger is new and incomplete versus history.** F1 and F2 omit scores and receipts (P29 4.35 BB-BAB3F961; P34 4.38 BB-ABEB42BF). F6 and F7 sit under “sim positives” but are site losses. F12 still calls tree-rotate “safe” after P47 scored 4.35. Older site losses (P24, P23b, B125, P27, P35c, P50, P37/P37b, P30, and most pre-4.17 families) have no finding row.
- **`builds_on` is not in any idea record.** 0 of 76 JSON files have the field, including P52 (created 12:05 AM ET, before the 12:36 AM rule) and P47. No new idea JSON was added after `b982837`.
- **In-flight builds have no record:** P41, P42, P49, P49b, and P53 are missing. P43 (parent of P43b) is also missing. P43b is still staged “awaiting Doug ruling” after a 4.35 site loss. P47 and P52 are still staged “building” after screens and, for P47, a site score.
- **Index files are stale.** `ideas.md` and `ideas_queue.md` still describe champion B113 at 4.17 (last queue update ~5:50 PM ET). The body of `STATUS.md` still lists 4.17 as the keep bar; only the tick appendices are current. `ready_ledger.md` still opens as a 5:50 PM B113 snapshot, with later champion and P47 notes appended.
- **Outcome fields are not standard.** Only 6 records have `what_would_disprove`. Almost none have structured hypothesis, activation, positives, negatives, confidence, reuse, or outcome A/B/C/D.
- **Postmortems are rare.** 5 files cover a small slice of 35 LOSS + 16 CLOSE official results.
- The P34 death-cause summary lives on open PR #154, not on main. A P48 rerun (P-D-024) is assigned and was not on main at this audit.

### Doug’s eight audit questions
1. **How positives from unsuccessful builds are recorded.** After 12:36 AM ET, in `findings.md` (F4, F5, F11; N2). Before that, only in scattered idea `decision` text, a few postmortems, and PR comments. Not in a single queryable field.
2. **Whether those findings influence selection.** The rule is written, and P49b / P52 / P53 / P47 were already aimed at F4 / F8 / F9 / F3. But no idea JSON cites `builds_on`, so enforcement is by coordinator memory, not the record. `ideas_queue.md` has not been reranked onto the ledger.
3. **Whether we repeat investigated ideas.** Yes in some families. After B113’s 4.17 drop-reach keep, the same drop lever was tested again (B115 4.13, B118 4.17 tie, P20 4.17 tie, P21 4.17 tie, P27 4.13). Rooftop jet was tested twice (P40b 4.29 on P34, P40d 4.35 on P48) and lost both times. Uncapped tree heal (P49) is a different trigger from P24 heal-in-cover (3.79), but both are heal-hold losses.
4. **Whether useful behaviors are abandoned because the overall build failed.** Partly, until tonight. P49’s survivor rise (2→3 and 3→5) is now F4 and is being refined as P49b. P41’s early-survival hold is F5 with no follow-up build yet. Many earlier screens (P25/P25b cube memory, P26 healthy boost, P37 heal pickup) were never extracted into the ledger and were not re-screened on P48.
5. **Refine vs replace.** Mixed. B5 (2.04 LOSS) → B5b (2.38 KEEP) and B104 → B107 (4.10 KEEP) are real refinements that raised the official score. P40d refined P40b and still lost. P49b is the current refinement pattern. The 5:50 PM queue still lists several unrelated ideas against the old 4.17 champion.
6. **Overlooked by conservative screening, including the drop-veto record.** Confirmed mixed. P34 and P48 **won** after a drop-ring set-total veto (P34 8→5 on 2000+3000, then 4.38; P48 9→7 and 8→5, then 4.44). P43b **lost** 4.35 with the same kind of one-veto (drop-ring 7→5 on 2000+3000). The early-death veto that flagged P40b (38→39) and P40d (38→39) was followed by two official losses (4.29, 4.35); the P40d postmortem treats that veto as still trusted. P47 was a no-veto READY build and still scored 4.35, so a clean screen is not a site win. The drop-veto change remains parked for Doug (P48 notes; WORKFLOW.md). Builder checklist 11:59 PM ET already reports drop dips and no longer blocks handoff on them.
7. **Research-to-builder handoff delays.** The afternoon wait-times audit (`coord/data/audit/2026-11-21-wait-times.md`, ~6:03 PM ET) is stale versus tonight’s two stations and trees-on screens. At the 12:42 AM ET tick, builder slots were full (P42, P49b, P53). The clearer current gap is record lag (missing or stale idea files), not idle builders.
8. **Reuse without added overhead.** Yes: extend the existing idea JSON + `findings.md` as the index. Do not add agents, parallel ledgers, or extra sims. Fill fields from the screen comment and site row already produced.

## B. Root-cause assessment

### Confirmed (files and numbers)
- Since P48 became champion (submitted 10:27 PM ET), **4 official tests, 0 wins, 4 losses** (100% of scored attempts): P43b 4.35 (BB-447742C7, −0.09), P40d 4.35 (BB-97019487, −0.09), P49 4.02 (BB-A82B6F7A, −0.42), P47 4.35 (BB-0B156FFA, −0.09). Source: `site_results.csv`.
- Three of those four landed on **exactly 4.35** (N2). P47 had no screen veto and only 13 and 15 of 192 activations. Small, sim-neutral single changes on P48 have so far cost about −0.09 official points.
- P49’s 3-veto screen (heal-hold pins; pause games 2→5; drops 7→6) was confirmed on the site (−0.42). The sim was directionally right when the regression was large.
- The sim is a weak official predictor (WORKFLOW.md: r = 0.22 over 28 earlier builds). Drop-ring set totals vetoed two later winners (P34, P48) and one later loser (P43b).
- Knowledge is fragmented: the live ledger is `findings.md`; `ideas.md`, `ideas_queue.md`, and most idea stages do not yet use it. That lets a “next idea” start without citing what already failed or worked.
- Across the whole board: 80 site rows, **17 KEEP + 3 WIN = 20 official score rises**, 7 TIE, 16 CLOSE, 35 LOSS, 1 REJECTED (P34’s first archive reject, unscored). Champion path 1.15 → 4.44.

### Hypotheses (not proven)
- P48 may already be near a local ceiling against the house squad, so only changes that move a frequent, high-cost failure (early deaths, retreat under fire on P48 itself) can beat 4.44. Unverified until more than four post-P48 tests, and until the P48 death study (P-D-024) is in.
- Combining several “small positives” might help. This is deliberately untested (D3: one change). Do not bundle.
- P34 death counts (retreat 253/379, 2+ sightlines 330/379; PR #154, house trees-on, both sets) may still describe P48. Unverified: P48 already changed retreat and won +0.06. Wait for P-D-024.

## C. Smallest process changes (proposed, not applied here)

Prefer extending files that already exist. No new agents, no second queue, no extra mandatory sims.

1. Keep `findings.md` as the index (already approved). After each screen or site score, add or **revise** the finding (F12 should now record the 4.35 loss, not “safe”). Give F1/F2 their scores and receipts. Put site-negative rows in a negatives section, not under sim positives.
2. Add optional fields to the idea JSON schema in `coord/data/ideas/README.md`, and fill them when a record is created or a screen/score lands, using information already in the PR and CSVs:
   - `hypothesis`, `mechanism`, `activation`
   - `positives`, `negatives`
   - `confidence`: Verified / Promising / Uncertain / Disproven
   - `reuse`: already-in-champion / narrow-follow-up / research / conflicts / retire
   - `outcome`: A (official win) / B (promising but flawed) / C (unsuccessful or inconclusive) / D (redundant)
   - `builds_on`: finding IDs
   - `what_would_disprove` (already used on 6 records)
3. Create the missing records (P41, P42, P49, P49b, P53) and restage stale ones (P43b, P47, P52) as part of ordinary D2 logging, not a new process.
4. Do not auto-resurrect retired code, do not combine findings, and do not treat a sim gain as an official win.

Updating the locked chart (`WORKFLOW_CHART.md`) or any veto/submission rule is **not** in this minimum set.

## D. Ranked reusable findings

Ranked by evidence and likely official-placement impact. In-flight work is flagged so it is not duplicated.

1. **Early farm / fewer deaths before 40 s (F8, F11) — in flight: P52 #169 `74b6ee4`.** Mac screen: died<40 s 48→45 and 38→37; means +0.047 and +0.016; drop-ring 8→3 on 2000+3000 (the only veto); activation 26 and 22 of 192. Watcher lead (findings F8; P52.json cites PR #152 comment 11:38 PM ET). Confidence: Promising (sim + ladder; no official score). Why a prior build isn’t the champion: not yet site-tested. Narrow test: submit P52 as the near-miss already queued, do not start a second early-farm flag. Disproof: official score ≤ 4.44, or deaths before 40 s not lower, or a large site drop that tracks the missed rings.
2. **Capped tree heal (F4) — in flight: P49b.** P49 #172 `38aa957` raised survivors 2→3 and 3→5 with deaths<40 s flat, then scored **4.02**. Uncapped heal-holds are a negative. Confidence: Promising only for an 8 s cap that removes pins on 2022, 3066, and 3086 and does not raise pause games; Disproven for the uncapped rule. Narrow test: P49b only. Disproof: those pins remain, pause games rise, or official score ≤ 4.44.
3. **Low-HP boost save (F9) — in flight: P53.** Ledger only: winners boost below 35% HP 19% vs 37% (Watcher correlation; exact figures not re-found in committed `coord/data/watcher/*.md` in this audit). Confidence: Uncertain. No P48 screen numbers on main. Do not start a second boost-save build. Disproof: Step A under 10/192, more deaths before 40 s, empty energy into late fights, or official score ≤ 4.44.
4. **P34 deaths in retreat under many sightlines — research, not a build yet.** PR #154 summary (not on main): house trees-on, 190+189=379 deaths; retreat mode 137+116=**253/379**; 2+ sightlines 168+162=**330/379**; top cause retreat × gun × 2+ at 40–120 s (62 and 55 deaths). Confidence: Verified on **P34**, Uncertain on **P48**. P48 already retargeted no-cover retreat into trees and won +0.06. Narrow next step: P-D-024 on P48, then one finding-backed change only if the same pattern remains. Disproof: P-D-024 shows retreat / 2+ sightline shares no longer dominate.
5. **Look-around without early-death harm (F5) — not in flight.** P41 #173 `c21d23b`: deaths<40 s 48→47 and 38→38; drops held 7 and 5; two stall vetoes (2021, 5036) while the look was inactive. Confidence: Uncertain (the “positive” is mainly “no early-death regression”). Narrow follow-up only with a stall guard; not a near miss (two vetoes). Disproof: any rebuild still raises 20 s+ pause games on either set.
6. **Tree rotate (F12) — just site-tested, do not repeat.** P47 #171 `9d388ad`, no screen veto, then **4.35** (BB-0B156FFA). Confidence: Disproven as an official improvement. F12’s “safe” wording is outdated (see N2).

Do not build on F6 (P43b 4.35), F7 (P40b 4.29, P40d 4.35), uncapped F4, or N1 (stuck-in-the-open does not fire). P25/P26 remain parked on a pre-P48 screen; they are not auto-resurrected here.

## E. Integration plan

- Lane pick uses the existing loop rank, with `findings.md` as the evidence index. A new idea is assigned only if its record cites `builds_on` and names a disproof test. Rebuilds that keep a finding and fix the failing veto go first (already approved).
- Independent work continues while a score or screen is pending (already the practice: P49b / P53 / P42 while tests run).
- Champion protection is unchanged: start from current main (P48), one flagged change, flag-0 byte-identical, Step A, full paired trees-on screen, archive under 15 MB, and a keep only if the official score is strictly above 4.44. Do not merge two findings in one SHA.
- When the champion changes, re-evaluate open findings against the new bot (P-D-024 is the model for the death data).

## F. Ownership and approvals

| Task | Owner | Needs Doug’s yes? |
|---|---|---|
| After each screen/score, update `findings.md` and the idea record (including `builds_on`, outcome, confidence) | Coordinator loop | No (ledger rule already approved 12:36 AM ET; D1/D2 already require records) |
| Build the next single change from a cited finding | Mech Builder or Diego’s Claude, as assigned | No, if it follows existing assignment rules |
| Official trees-on screen and veto call | Mech Sim Tester (Mac is a second station; tester wins ties) | No |
| P-D-024 P48 death study | Diego’s Mac / Diego’s Claude | No (already assigned) |
| Ladder signals only, no submits | Mech Watcher | No |
| Site submit of READY or eligible near miss | Coordinator loop (sole submitter) | No, under existing rules |
| Change `WORKFLOW_CHART.md`, vetoes, slot cap, or keep/close policy | Coordinator proposes only | **Yes** (chart locked Sat 3:09 PM ET) |
| Drop-ring veto rewrite (false-negative record above) | — | **Yes** (already parked) |
| Making `builds_on` a hard eligibility gate in the locked chart | — | **Yes** |
| Schema fields in `ideas/README.md` and filling missing records | Coordinator | No, unless someone wants that schema written into the locked chart |

## G. Success metrics (Doug’s list, with baselines)

| Metric | Baseline at this audit | Source |
|---|---|---|
| Meaningful, nonduplicative official experiments | 80 site rows; 20 official rises (17 KEEP + 3 WIN). After B113 4.17: 20 later rows, 3 wins (P29, P34, P48), 1 unscored reject, 16 non-wins. After P48: 4 rows, 0 wins. | `site_results.csv` |
| Share of tested mechanisms with a useful recorded conclusion | Ledger covers the 3 late wins plus the last few failures and two Watcher leads (F1–F12, N1–N2). 5 postmortems vs 51 LOSS+CLOSE rows (~10%). 0/76 idea files have `builds_on` or outcome A–D. | `findings.md`, `postmortems/`, `ideas/` |
| Official improvements derived from an earlier failed or incomplete test | Two clear cases: B5 2.04 LOSS → B5b 2.38 KEEP; B104 3.88 → B107 4.10 KEEP. P40d refined P40b and lost. P49b is not scored yet. | `site_results.csv` |
| Repeated / redundant research | After the 4.17 drop keep, five further drop-lever tests did not raise the score. Roof-jet tested twice, both losses. | `site_results.csv`, `ideas.md` |
| Time from a promising mechanism to a refinement test | P49 screen and 12:34 AM site loss; P49b already in the builder queue the same hour. P40b loss 10:00 PM ET → P40d site 12:20 AM ET (~2.3 h), also a loss. | `site_results.csv`, `STATUS.md` 12:42 AM tick |
| Candidates that beat the official champion | 20 all-time; 3 after 4.17; **0 after 4.44** | `site_results.csv` |
| Magnitude of verified official gains | Path 1.15 → 4.44 (+3.29). Late wins: P29 +0.18, P34 +0.03, P48 +0.06. Post-P48 deltas: −0.09, −0.09, −0.42, −0.09. | `site_results.csv` |
| Resource per meaningful official improvement | 80 site tests / 20 rises = 4.0 tests per rise all-time; 20 tests / 3 rises after 4.17; 4 tests / 0 rises after 4.44. Builder-minutes per rise were not totaled in the repo. | `site_results.csv` |
| Official vs sim | Keep using the official score as truth. Sim r = 0.22 (28 builds, WORKFLOW.md). N2: three sim-neutral or one-veto P48 changes each scored 4.35. | WORKFLOW.md, `findings.md`, `site_results.csv` |

The measure that matters is a new official score strictly above 4.44, produced by a finding-backed single change, not a larger pile of idea files.
