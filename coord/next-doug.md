# Next for Doug

Written by Grok, the coordinator (see `GROK_BRIEF.md`); committed here at Doug's request. Paste everything below the line into your Claude.

---

Read `AI-Structure-Development.md` and `coord/log.md` in `dmclaughlin-bit/mech-bot` before starting.

Build 2 is already on `main` @ `4726cfc`. Your task is **Build 3: wire `nav.ts`**, on a branch `build-3` off current `main` **after PR #5 is merged**. If `nav.ts` is not yet on `main`, wait. Do not edit `nav.ts`, and do not start Build 4.

Change only files you own in plan §4: `brain.ts`, and `bot.ts` / `params.ts` / `Dockerfile` only if the wiring requires it. Do not edit `nav.ts` or `tools/`.

Spec: the plan §4 `Nav` interface (`createNav`, `path`, `eta`, `stuck`) and the §9 rules tagged Build 3 — **Z1** (switch zone travel from straight-line distance to path distance via `nav.eta` / `nav.path`, and add the per-track route buffer written in Z1). Also add the **30 ms deadline guard** required by D6 and §7 rule 2 once A* can run in a tick (target p99 ≤ 15 ms). Use `nav.stuck` for stuck recovery. Diego's PR #5 log says in-tick calls should use a 20k expansion budget; use that, don't pick a new one. Read every game number from `hello.config` or from existing `params.ts`. Do not add a new tuning knob (Build 2 already has six).

Keep Build 2 behavior otherwise. This PR is one change: path-aware navigation plus the deadline guard. Jump/jet edges are not in PR #5; do not add them in `nav.ts` (Diego owns that file).

Done when: from the kit, `python3 check/check.py --map-dir arena -- bun ../mech-bot/bot.ts` passes (if bun is still missing on your Mac, say so in the log and use the node command you already have). Paste the check numbers in the PR. The Docker-flagged gate in `research/protocol.md` §1 should also be run before this build is submitted — ask Diego if you cannot run Docker. Merge your own PR once the gate passes (§4). Target: **PR by Sat 1:00 PM ET** (plan window Sat 9 AM to 1 PM; you may start tonight once PR #5 is on `main`). Do not start Build 4, and do not treat this as submittable until Diego has finished S3 (the identical Build 2 resubmit).

Every push includes a new entry at the bottom of `coord/log.md` (format at the top of that file), and every PR description repeats it.
