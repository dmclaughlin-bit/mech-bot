# Learning standard: every agent (Doug, Sun Nov 22 12:40–12:48 AM ET)

The shared repo is the team's memory. A new session must be able to work from these files alone, without the chat history.

## Read first, every task
1. `coord/STATUS.md`: the current champion and what's in flight. **Champion: P48 tree retreat, code b9492c6, main edb729f, site 4.44 (BB-94897D91).** Every build contains edb729f. Ignore older champion lines in the inbox files.
2. `coord/data/findings.md`: what worked and what didn't (F = positive, N = negative). This is the index of what we know.
3. `coord/data/ideas/<id>.json`: one record per idea. Check for similar past ideas before proposing or building one.
4. `coord/LEARNING_AUDIT.md`: the audit behind this standard.

## Principle
Keep knowledge from failed builds, not their code. A failed build can hold a real strength, and one improved number doesn't make a mechanic good. Every build still starts from the current champion, with one change, and is kept only if its official score is strictly higher.

Confidence labels: **Verified** (site-proven, or repeated on both seed sets), **Promising** (meaningful evidence, needs confirmation), **Uncertain** (few cases, noisy, unclear cause), **Disproven** (tested enough and not supported).
Outcome per experiment: **A** win (promote), **B** promising but flawed (keep the strength, fix the weakness), **C** unsuccessful or inconclusive (stop unless new evidence appears), **D** redundant (don't build).

## Idea record fields (hard rule for new builds, Doug 12:48 AM ET)
`builds_on`: finding IDs, or `NEW: <evidence>` for a genuinely new hypothesis (new ideas are allowed, but they need evidence). Also: `hypothesis`, `mechanism`, `activation`, `positives`, `negatives`, `confidence`, `reuse`, `outcome`, `disproof` (written BEFORE the build). Unknown values stay null; never invent a number or a link.
A refinement of a retired idea also states: the strength kept, the weakness fixed, how it differs from the failed version, and what result would count as success. Re-testing the same mechanism under a new name is not allowed.

## By role
- **Coordinator (Grok and its loop):** keeps findings.md, ideas and STATUS current; picks each lane's next idea by rank (1. refinement of a finding that fixes its veto, 2. new single change with evidence, 3. the rest); stops duplicate assignments; makes sure every experiment has an owner and a recorded outcome; adds findings after every screen and score.
- **Builders (Mech Builder, Diego's Claude when building):** read the record and its findings before coding; make the smallest change; keep champion behavior outside it byte-identical with the flag off; in each handoff, include a "What worked / what failed" line and the record's `builds_on`.
- **Testers (Mech Sim Tester, Diego's Mac):** report more than PASS/FAIL, using numbers from the screen you already ran (no extra sims): intended behavior, activation (3 counts per set), positives, regressions, the required veto table, the conditions where it helped or hurt, whether it's repeatable across sets, and whether it deserves a refinement. Vetoes and independence stay.
- **Research (Watcher, Wild Sim, Grok's helpers, P-D-0xx studies):** check findings and ideas first; answer open gaps only; return a testable hypothesis with evidence and a disproof test, not lists of ideas.

## Gates still mandatory
Record first (D2), one change (D3), log-only Step A (10/192) for a new trigger, `coord/BUILD_CHECKLIST.md`, a full paired trees-on screen on both sets, the loop as the only submitter (Doug may order directly), never resubmit, never click "Pick as our final entry", and the champion changes only on a strictly higher site score. Mech Wild Sim batches need Doug's yes.

## Reporting to Grok
Grok reads the repo and PRs, not your chat. Report by PR (ID in the title) or a comment on PR #152 (Diego's lane). Acknowledge new standards in `coord/log.md` as `ACK LEARNING-STANDARD (<agent>) <time ET>`.
