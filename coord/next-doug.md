# Next for Doug

Written by Grok, the coordinator (see `GROK_BRIEF.md`). Paste everything below the line into your Claude.

---

Read `AI-Structure-Development.md` and `coord/log.md` in `dmclaughlin-bit/mech-bot` before starting.

Two steps, in order. Do not start a new behavior change until PR #7 is on `main`.

**Step A — merge PR #7 (Build 3).** `main` is now `053f69b` (PR #8, PR #9, and Diego's bun-gate log). PR #7 (`build-3` @ `406ab9f6cb16c3f401646cd22930bceae7e93b3e`) is open and dirty against `main`. The likely conflict is `coord/log.md` only; `brain.ts` does not overlap those docs commits. Merge `main` into `build-3` (or rebase). Keep every log entry and leave them in time order: Fri 21:15 ET Build 3, then Fri 21:35 ET Grok brief, then Fri 21:40 ET D9, then Fri 21:40 ET bun offline gate. Do not drop any. Then merge PR #7 yourself (plan §4). That makes `main` match our best practice score (2.23, BB-955D92D8). The coordinator already submitted this commit by SHA, so the merge is for a clean parent, not for the score we already have.

**Step B — Build 5 survival half, not Build 4.** After PR #7 is merged, branch `build-5-survive` off that `main`. Parent commit: `406ab9f` (score 2.23). Change only files you own in plan §4: `brain.ts`, and `bot.ts` / `params.ts` / `map.ts` / `Dockerfile` only if this build requires it. Do not edit `nav.ts`, `tools/`, `EXPERIMENTS.md`, or the plan.

Why not Build 4: plan D9 (PR #9) is now "qualify first." Only the top 32 practice teams play the final. We are 81st of 108 at 2.23; 32nd is 4.04; the "safely in" line is about 4.54. Practice opponents are 15 house bots acting as one squad that hunt the weakest first and never fight each other, so F1/F5 engagement and finishing wounded (Build 4) are the wrong next spend. The brief's qualifying order, which you should follow until a later plan PR says otherwise, is: after Build 3, pull Build 5's survival half ahead of Build 4. If Diego merges a plan PR that instead makes early laser-seek the next build *before* you open this PR, switch to that build and log the reason. Otherwise do this one.

This is one submission. The §9 spec is **F3** (head for the nearest in-zone point that breaks line of sight; Build 2 already has backwards retreat and the energy gate), **F4** (then heal: stay out of contact, move ≤ 5 m/s, until HP > 90%), and **Q2** (stay more than 45 m from enemies and outside their 120° vision wedge; their `aim` is observed; trees hide you but do not stop shots). Also confirm **Q1** still holds (silent ≤ 5 m/s once inside the next circle) — it is already in Build 2. Read every game number from `hello.config` or from existing `params.ts` and from §9; do not invent new constants. Do not add a pile of new knobs.

Do not include the rest of Build 5 (the ~60-candidate position query) or Build 4 (Q3 tracking, F1 engagement, F5 pursue), laser-seeking, NPC farming, supply-drop logic, or dodge in this PR. Those are later rows or a plan-PR insert.

Watch evidence to respect, not to hard-code (only 2 complete Top-16 exhibition matches, FFA-like, so weaker as practice evidence; source in `coord/learnings.md`):
- Early death is still the bottleneck (we usually die among the first few). Breaking LOS and leaving sight cones is the rule that should help most against a shared-vision hunting squad.
- Winners boosted only 7% and 11% of frames; several high-boost bots died early. Do not add new boost-into-fight behavior. F3 already allows boost only above the §9 energy gate.
- Winners stayed in zone (0% time outside) and about 0.4 of the zone radius from center. Zone escape and Z1 still outrank this work (priority order in §9).
- Both winners grabbed a laser in the first 4–12 s and farmed many cubes. That is evidence for a later seek-laser / safe-NPC build (Diego is proposing it), not a second change in this PR.

Done when: from the kit, `python3 check/check.py --map-dir arena -- bun ../mech-bot/bot.ts` passes with p99 ≤ 15 ms (if bun is still missing on your Mac, say so in the log and use the node command you already have). Paste the check numbers in the PR. Diego already ran the bun 1-CPU gate on Build 2 (`4726cfc`: p99 1.4–2.0 ms) and on unwired `main` (p99 1.1 ms); both passed. You do not need to rerun bun for this PR. The full Docker-flagged gate has still not been run and is not required to submit — Build 3 already scored without it. Open the PR; the coordinator can submit by SHA even before it is merged. Merge your own PR once `check.py` passes. Target: **PR by Sat 10:00 AM ET** (no §3 window pressure; sooner is better if it is ready tonight, but do not rush a broken build into a tight slot).

Every push includes a new entry at the bottom of `coord/log.md` (format at the top of that file), and every PR description repeats it.
