## Refresh, Sun Nov 22 2:12 AM ET (coordinator, Doug's request). Champion P48 b9492c6 / edb729f, 3.75 under builders-4 (BB-5727119F)
All earlier sections are history (builders-3 bar 4.44 or older). Gains are judged only against 3.75 under builders-4. The 96-game figure is Sim Tester's advisory paired estimate (new seeds per candidate; only the paired difference is reliable, since a single build's mean moves about 0.2 between seed sets).

Ranked by expected gain on the site:
1. **P60, retreat-death fix (Mech Builder, RUNNING, no branch yet).** builds_on F15 + N8 + N9 + F3. It changes movement in building-cover or back-away retreat, where most of P48's retreat deaths happen (retreat deaths 136/190 and 124/189; only 19 and 16 of those in tree-retreat mode). Highest expected impact. On handoff it gets the safety screen plus the 96-game estimate.
2. **P61, second retreat bucket (Mech Builder, QUEUED after P60's counts).** Same evidence, a different bucket.
3. **P41 #173 c21d23b, near miss (eligible, NEUTRAL, last resort).** The 1:29 AM ruling stands: only stall (c) remains, and the Sim Tester stall calls are under re-check after P49b's 2021 pause failed to reproduce on two other stations. 96-game: 3.708 vs 3.740, difference -0.031 +/- 0.056. Submit only when a slot would otherwise sit idle and P60 isn't ready within about 10 min. N2 says neutral changes have cost about -0.09 on the site.
On the site now: P53b #178 52c2862 (BB-9617EF60, queued). 96-game: 3.552 vs 3.552, a difference of +0.000 +/- 0.026. Expect about P48's score, no win.

Out of the ranking:
- Scored losses: P49b 3.49 (builders-4; capped tree heal, F4 doesn't transfer), plus builders-3 losses P43b, P40d, P47, P49, P52.
- Retired: P42, P52b, P53, P54, P55, P56, P57, P58, P59, P49c, P41b, P50, P51.
- Exhausted ladder signals: F8 farming (N3), F9 low-HP boost (P53/P53b neutral), F10 spacing (P54; the bot sees about 78 m).
- Diego's EARLY_RETREAT_HIDE_ON: Diego's lane recommended outcome D, and the lane is on station work.
- Parked for Doug: re-testing builders-3 near-losers under builders-4 (never-resubmit rule).
Pipeline gap: after P60/P61 there are no evidence-backed candidates. Next evidence sources are P60's bucket counts and Watcher's questions (coord/data/watcher_builders4_questions.md).

## Update 12:42 AM ET Sun (champion P48 edb729f, 10-minute loop)

1. P52 EARLY_FARM_ON, PR #169, 74b6ee4: Diego's Mac full paired trees-on screen vs Mac P48 baseline fails exactly one veto (drop-ring set total 8->3 on 2000+3000; 4000+5000 4->5). Means +0.047±0.051 and +0.016±0.052 (both positive). Died<40 48->45 and 38->37. Pause games 2->2 both. Activation (different behaviour) 26 and 22 of 192. Builds on F8. Needs the loop's check.py rerun + archive check before submit. Eligible near miss behind READY P47.
U = 3 (11:54 P43b, 12:20 P40d, 12:33 P49), R = 1 (P47 READY), spare = (6-3)-(1+1) = 1, but a score is pending (P49) so no near-miss submit this tick.

## Update 11:55 PM ET (champion P48 edb729f)

1. P43b UPGRADE_DPS_TIER_ON, PR #162, e4879af: official trees-on screen vs P48, exactly one veto (drop-ring set total 7->5 on 2000+3000, seed 3086 still 1st and survived; 4000+5000 5->9). Means -0.010 +/- 0.010 and +0.031 +/- 0.040 (not lower on both). Changed pick 8/192 and 11/192. Archive 3,532,800 bytes. Blocker: activation 8/192 on one set (borderline vs ~10/192) and coordinator check.py re-run; Doug ruling requested.
Old P34-era pool below is stale (champion changed).

# Near-miss ranking

First ranking, Sat Nov 21 2026, 9:53 PM ET, by the coordinator after Doug confirmed the near-miss pathway at 9:47 PM ET. Champion at this ranking: P34 lethal release, code `0e6fadd1a30db4ee30c26114b8198f63d782b7c9`, merged to main as `8c130ad7f0c81acb03508c40f20c31867f29d358`, official score 4.38, receipt BB-ABEB42BF (`coord/data/site_results.csv`; `coord/STATUS.md` 9:17 PM ET update).

This file is the pool named in `coord/WORKFLOW_CHART.md` (Near-miss pathway, Doug confirmed Sat Nov 21 9:47 PM ET). Every number below is taken from a repo file, a commit, or a Sim Tester PR comment. If a number is not in those sources, this file says so. Sim deltas are recorded as information only; they are used here only for the written eligibility gate "never a lower overall mean on both seed sets."

## Spare-slot snapshot (9:53 PM ET)

`spare = (6 - U) - (R + 1)`

- **U = 2.** In the last 60 minutes: P34 `c281bf59e6276ffda376cc84a0c95f620331485e` submitted 9:07 PM ET and rejected unscored (BB-FB8CB5AE, archive over 20.0 MB); P34 rebuilt `0e6fadd1a30db4ee30c26114b8198f63d782b7c9` submitted 9:10 PM ET and scored 4.38 (BB-ABEB42BF). Source: `coord/data/site_results.csv`. The next slot frees at 10:07 PM EST. 4 of 6 tests remain in the rolling hour.
- **R = 1.** P40b PR #155 was opened at 9:47 PM ET (2026-11-22 02:47:47Z) after a trees-on four-base Builder checklist (items 2, 3, 5 pass; item 4 reported) on champion P34 (`origin/p40b-roof-jet-route` record; branch tip `ca549ae`). That is a normal-path build, not a near miss. As of 9:53 PM ET the official screen comment is not on the PR yet (0 comments). If Sim Tester started promptly, a 7–10 minute paired screen can finish before 10:07 PM EST, so this check counts it in R. No other build is expected to finish both the checklist and the official screen before 10:07: P45 Step A failed (11/192 on 2000+3000 and 5/192 on 4000+5000, commit `19fb4f7`); P37b has not started; P46 is assigned to Doug's Claude and is not built; no `p38b` branch or PR exists at this check.
- **spare = (6 - 2) - (1 + 1) = 2.** No official score is pending. No normal READY build is waiting. A near miss still cannot go to the site at this check, because no candidate is eligible (see below).

## Top 5 (evidence-ranked)

No candidate is eligible to submit tonight. None has a full paired trees-on screen versus current champion P34 on a SHA that contains main `8c130ad`. The pool below is the four builds that come closest to "exactly one veto" on existing evidence. The fifth slot is empty; excluded builds are in the inventory, not forced into the five.

| Rank | Build | Class | One-line justification |
|---|---|---|---|
| 1 | P35 unseen target first (`UNSEEN_TARGET_ON`), PR #150, `5778086d38a531d03f8d2940f5da1634f9ddd90e` | needs rebase onto `8c130ad` and a trees-on official screen | Official trees-off screen versus P29 (`2e1d036`) failed exactly one veto: drop-ring set total 8→7 on 2000+3000 only (4000+5000 stayed 7→7), all from seed 2089; activation 119 and 105 of 192; means +0.010 ± 0.056 and −0.068 ± 0.037 (not lower on both); deaths under 40 s 56→54 and 54→53; no new 20 s+ pin. Sources: `coord/data/screens.csv`; PR #150 comment [7072641748](https://github.com/dmclaughlin-bit/mech-bot/pull/150#issuecomment-7072641748); `coord/data/ideas/P35.json`. |
| 2 | P25b cube memory plus no-progress drop (`CUBE_MEMORY_ON`), PR #136, `47d0e6cecbe5df5432b6e604897a0bad9fd40f73` | needs rebase onto `8c130ad`, a trees-on official screen, and a D3 ruling | Official trees-off screen versus B113 (`6182d29`) failed the drop-ring veto on both official sets, 6→4 and 5→4, with activation 30 and 32 of 192 and means −0.109 ± 0.063 and +0.062 ± 0.101 (not lower on both). After Doug's 7:16 PM ET stall rule, `coord/WORKFLOW.md` left this SHA on hold for those drop losses, not for the new 20 s+ pins (0 memory ticks in those windows). A D3 question remains: memory plus the no-progress drop may be two behaviors under one flag (`coord/data/ideas/P25b.json`; `coord/data/ready_ledger.md`). Sources: PR #136 comment [7071108537](https://github.com/dmclaughlin-bit/mech-bot/pull/136#issuecomment-7071108537); `coord/data/screens.csv`. |
| 3 | P38 lull reload (`LULL_RELOAD_ON`), branch `p38-lull-reload`, flag-off `c6fdb6ca4f8bcdd9135e15587a0a4a3a36eeeb39`, flag-on head `e947614` | needs rebase onto `8c130ad`, the current four-base trees-on checklist, and an official trees-on screen | Builder practice run versus P29 (`b6f2f8b`), bases 0+1000 only, failed exactly one checklist item after the one allowed fix (quiet 1 s→2 s): drop-ring 3→1 on base 1000 (seed 1010, downstream of an earlier death); base 0 held 5=5. Activation 12/192; practice means +0.031 ± 0.023 and +0.000 ± 0.078; deaths under 40 s 33=33 and 30→29; no new 20 s+ pin. There is no official 2000+3000 / 4000+5000 screen. Source: `coord/data/ideas/P38.json` on `origin/p38-lull-reload`. `coord/data/watcher/RANKED.md` mentions a P38b rebuild as building; no `p38b` branch or PR is in the repo at this check. |
| 4 | P36 claim watched (`CLAIM_WATCHED_ON`), branch `p36-claim-watched`, final bot-code `f2d4e97` / flag-on `70a0228540868da255ec99ab521f915af77e4fc8` | needs rebase onto `8c130ad` and an official trees-on screen | Builder practice run versus P29 (`b6f2f8b`), bases 0+1000 only, failed checklist item 3 on base 1000 after the allowed MIN_T 10→40 fix: drop-ring set total 3→1 (seed 1010 died at 104.65 s versus 234.50 s). Base 0 passed (drops 8 vs 5, deaths 33=33, mean +0.031 ± 0.070, fired 9). Base 1000 also had mean −0.250 ± 0.118 and kills 309→287. Activation 9+13=22 of 192 across the two practice bases. There is no official 2000+3000 / 4000+5000 screen. Claim-family site losses already exist (B53, B94; `coord/data/ideas/P36.json`). |
| 5 | — | empty | No fifth build meets "exactly one veto" without also failing the lower-mean-on-both-sets gate, barely firing, or carrying multiple vetoes. P26 is the next official-screen case and is excluded below. |

## Best candidate and blockers

**Best candidate: P35** (PR #150, `5778086d38a531d03f8d2940f5da1634f9ddd90e`).

It is the only build with a complete official both-set screen that failed exactly one veto, did not crash, did not raise early deaths, did not lose the overall mean on both sets, and clearly changed behavior (unseen-target engagement in 119 and 105 of 192 games). The lost drop is a single arrival on seed 2089 (place 1→9, death at 121.45 s); the P35 record notes that the same seed also cost P34 and P37 a drop (`coord/data/ideas/P35.json`).

**It cannot be submitted until all of the following are done:**

1. Mech Builder rebases or rebuilds the single flag onto current `origin/main` (must contain merge `8c130ad` / bot code `0e6fadd`). Flag-off must be eqdrive byte-identical to that main. The PR head must be flag-ON. Archive size (`git archive --format=tar <SHA> | wc -c`) must be under 15,000,000 bytes; that figure is not in the repo for `5778086`.
2. Mech Builder re-runs the current trees-on four-base checklist (bases 0, 1000, 6000, 7000; `coord/BUILD_CHECKLIST.md`, Doug 8:59 PM ET). The existing Builder numbers for P35 are practice bases 0 and 1000, trees not stated as on, versus an older main.
3. Mech Sim Tester runs a new full paired trees-on screen on 2000+3000 and 4000+5000 versus current champion P34, on that exact SHA.
4. The coordinator re-ranks only after that screen. P35 becomes eligible only if the new screen still shows exactly one veto, activation of at least about 10 of 192, no crash, `check.py` max under 30 ms (the old PR body reported 2.9–3.2 ms on the previous base), and not a lower overall mean on both sets.

`check.py` and eqdrive on the old SHA are in the PR #150 body (flag-off identical to then-main; check.py PASS, flag off max 3.2 ms, flag on max 2.9 ms). Those checks do not carry over after a rebase.

## Inventory of sim-rejected or held builds

Unless noted, none of these SHAs contain main `8c130ad`, and none of the official screens below were trees-on (the trees-on switch is Doug 8:58 PM ET, `coord/WORKFLOW.md`). A trees-on rerun versus P34 is required before any of them can be eligible.

### Official both-set screens (Sim Tester)

- **P25** cube memory, PR #136, `b34271c15df17bac4fda4275a7928643034f5e83`, versus `6182d29` (site 4.17). Fired 30 and 32 of 192; means −0.073 ± 0.057 and +0.036 ± 0.102. New change-caused 21 s pin on seed 3043 (83 memory ticks). Combined drop-ring arrivals on 2000–5000: 11 in 10 games → 9 in 8. **Excluded:** superseded by P25b; change-caused pin; drop-ring set total also fell. Sources: `coord/data/screens.csv`; `coord/data/ready_ledger.md` 6:05 PM ET; PR #136 comment [7070616608](https://github.com/dmclaughlin-bit/mech-bot/pull/136#issuecomment-7070616608).

- **P25b** cube memory plus no-progress drop, PR #136, `47d0e6cecbe5df5432b6e604897a0bad9fd40f73`, versus `6182d29`. Testers rated PASS. Fired 30 and 32; pin windows 166→85 and 185→181; seed 3043 pin gone. New 20 s+ pins 72 (20 s), 4091 (26 s), 5048 (25 s), 5054 (20 s), 0 memory ticks in those windows. Drop-ring arrivals: base 0 5→5; 2000+3000 6→4; 4000+5000 5→4. Means −0.109 ± 0.063 and +0.062 ± 0.101. Deaths under 40 s 56=56 and 54=54. Flag-0 identical on all 96 base-2000 seeds. **Class: needs rebase + trees-on rerun + D3 ruling** (ranked 2). A separate `check.py` max for `47d0e6c` is not in `coord/data/ideas/P25b.json`; P25's earlier SHA was 3.3 ms (`coord/data/ready_ledger.md`). Sources: PR #136 comment [7071108537](https://github.com/dmclaughlin-bit/mech-bot/pull/136#issuecomment-7071108537); `coord/data/screens.csv`; `coord/WORKFLOW.md` 7:16 PM ET hold wording.

- **P26** healthy boost, PR #138, `c566fbadf65372c0de70d2ccd02e8f4c91a29ef0`, versus `6182d29`. Testers rated PASS. Fired 32 (968 ticks) and 40 (1195 ticks); different score 9 and 18. Means **−0.057 ± 0.032 and −0.031 ± 0.040** (lower on both official sets). Drop-ring arrivals: base 0 5→3; 2000+3000 6→5; 4000+5000 5→8. Deaths under 40 s 56=56 and 54=54. New 20 s+ pins 4018 (22 s) and 5053 (20 s), boost not active in those windows. Flag-0 identical on all 96 base-2000 seeds. Loop `check.py` re-run is recorded as not yet done (`coord/data/ideas/P26.json`). **Excluded:** lower overall mean on both official sets. It also failed the drop-ring veto on 2000+3000. Would still need a rebase and a trees-on rerun even without that gate. Sources: PR #138 comment [7071092977](https://github.com/dmclaughlin-bit/mech-bot/pull/138#issuecomment-7071092977); `coord/data/screens.csv`.

- **P30** front-arc facing, PR #144, screened SHA `9906286635c814f17c05d2d4237c23f828bd5c0f` (committed flag false, screened with an uncommitted flag-true copy; later flag-on head on `origin/p30-front-arc` is `32c50e75327fe474577138a81507a721fe568ae4`), versus `6182d29`. VETO both sets. Fired 62 and 50 of 192. Drop-ring 6→4 on 2000+3000 (seed 2078 lost both drops, place 1→7) and 5→7 on 4000+5000. Deaths under 40 s **56→59 and 54→57**. Survivors 6→4 and 5→5. Means **−0.125 ± 0.083 and −0.125 ± 0.103**. No new 20 s+ pin. **Excluded:** multiple vetoes (drop-ring, early deaths on both sets, survivors) and lower mean on both sets. Sources: `coord/data/screens.csv`; `coord/data/ideas/P30.json` (retired 7:57 PM ET).

- **P29b** midring settle fix, PR #146, `6ff499b8cc58132dcc6c723f65f8b9377e712854`, versus P29 `2e1d036`. VETO. Settle fired in **0 of 384** games and flag-0 differed from the champion (P29 already on). Drop-ring 8→6 and 7→5. Means −0.031 ± 0.037 and −0.021 ± 0.028. **Excluded:** barely fires, and it removes the champion P29 behavior. Source: `coord/data/screens.csv`; `coord/data/ideas/P29b.json` (retired 8:39 PM ET; comment 7072301136).

- **P34** lethal release, PR #147, screened `c281bf59e6276ffda376cc84a0c95f620331485e` (trees off, versus P29). VETO on drop-ring set total 8→5 on 2000+3000 (4000+5000 was 7→15). Fired 50 and 57 of 192. Rebuilt `0e6fadd` was site-tested on Doug's one-time order and scored 4.38. **Not a near miss:** already site-tested; it is the current champion. Sources: `coord/data/screens.csv`; `coord/data/site_results.csv`; `coord/data/ideas/P34.json`.

- **P35** unseen target first, PR #150, `5778086d38a531d03f8d2940f5da1634f9ddd90e`, trees off, versus P29. VETO, drop-ring 8→7 on 2000+3000 only (7→7 held-out). Survivors 6→5 on the first set, same seed 2089, "not a standalone survival veto" (`coord/data/screens.csv`). **Class: needs rebase + trees-on official screen** (ranked 1). Sources listed in the top-5 table.

- **P37** heal pickup, PR #149, `f174d5556025fc0bd35c73ef83c3438a7b964c6a`, trees off, versus P29. VETO. Fired 22 and 28 of 192. Drop-ring **8→7 and 7→4** (lost arrivals in games where the rule fired). Survivors 6→5 on 2000+3000 (seed 3012). Means **−0.115 ± 0.066 and −0.089 ± 0.086**. Deaths under 40 s 56→55 and 54→53 (not up). New 20 s+ pin seed 3074 (39 s) meets no stall clause. **Excluded:** lower overall mean on both official sets; drop-ring also fell on both sets. Sources: `coord/data/screens.csv`; PR #149 comment [7072563191](https://github.com/dmclaughlin-bit/mech-bot/pull/149#issuecomment-7072563191); `coord/data/ideas/P37.json`.

### Builder checklist only (no official 2000+3000 / 4000+5000 screen)

- **P25c** cube memory only, PR #142, `940b403fe55261950fb8a977c4f8ebae2872b7d1`, versus `6182d29`. Base-0 hazard: drop-ring 5→4 (item 3 FAIL); new ≥20 s pins including seed 3043 22 s with 89 memory ticks (item 4 FAIL); deaths 33=33; fired 14 of 96; mean −0.073 ± 0.084; check.py flag-on max 3.9 ms. The PR says items 3 and 4 cannot be fixed without bringing back the no-progress drop (a second behavior). **Excluded:** multiple checklist fails; no official screen. Source: [PR #142 body](https://github.com/dmclaughlin-bit/mech-bot/pull/142). The `coord/data/ideas/P25c.json` on main is stale (still "building," no SHA).

- **P26b** healthy boost drop-safe, SHA `2bb68462ea1541a4039142f615aae432fbe809fc` / activation run `69cfa88`, no PR. Fired **0/96** on base 0 (a drop is on the map 97.6% of ticks after 70 s). **Excluded:** barely fires. Source: `coord/data/ideas/P26b.json` (retired 8:00 PM ET).

- **P28** midring patrol. Retired 7:20 PM ET: still lost drop-ring arrivals (main 3/5 vs 1/3 on the P28c patch). Not pushed; no official both-set screen. **Excluded:** no complete official screen; practice drop-ring loss. Source: `coord/data/ideas/P28.json`.

- **P31** late hurt boost, SHA `25116645b3ac163cfc1f2298878cd5fefb8e4966` / run `7bf9942`, no PR. Fired **0/192** on bases 0 and 2000. **Excluded:** barely fires. Source: `coord/data/ideas/P31.json` (retired 7:35 PM ET).

- **P32** fight fade, SHA `d05f32533c8af8c0cb2bf3cc3d184b70d4e699a1`, no PR. Base 0 deaths under 40 s **33→35** (checklist item 5 FAIL) after the one allowed fix; a further "no fade before 45 s" gate would leave 1–4/96 activations, under the about-10/192 floor. **Excluded:** early-death fail, and the remaining fix would barely fire; no official screen. Source: `coord/data/ideas/P32.json` (retired 8:02 PM ET).

- **P33** hurt retreat far, SHA `92bfe9925b94ac259ddd9ff98b46f0e97b79901e` / run `c4a6164`, no PR. Fired **0/96** on base 0 (every mid-phase retreat end had a drop live). Without the drop gate, 5/96, under the floor. **Excluded:** barely fires. Source: `coord/data/ideas/P33.json` (retired 8:15 PM ET).

- **P34b / P34b2** lethal drop gate (`LETHAL_DROP_GATE_ON`), branch `p34b2-drop-gate`, SHA `c5bb83f94d9c4b6998bb42a8932ff2e2789d5a61`, tested against main `588557e` (contains merge `8c130ad`), trees on, bases 0+1000. Fired **0/192**; all 192 games equal to the champion except timing. check.py default max 2.7 ms, flag-on max 2.6 ms; eqdrive flag-off identical. **Excluded:** barely fires. This is the one reject already sitting on the current champion with trees on. Source: `coord/data/ideas/P34b.json` (retired 9:38 PM ET, also on main as commit `bdcff4a` from `bea04ad`).

- **P36** claim watched. Practice-only, ranked 4 above. Source: `coord/data/ideas/P36.json`.

- **P38** lull reload. Practice-only, ranked 3 above. Source: `origin/p38-lull-reload:coord/data/ideas/P38.json`.

### Not near-miss candidates (in progress, measurement-only, already tested, or idea-only)

- **P29** midring settle, `2e1d036`, site 4.35 (BB-BAB3F961). Already site-tested; previous champion. Source: `coord/data/site_results.csv`.
- **P39** regen guard (`REGEN_GUARD_ON`). Idea only, parked, never built. Source: `coord/data/ideas/P39.json`.
- **P40 / P40b** roof jet route (`ROOF_JET_ROUTE_ON`). P40b is on the **normal** path: rebuilt on P34, trees-on four-base checklist passed (ring arrivals 5=5, 2>1, 1=1, 3=3; deaths under 40 s 24=24, 14<15, 16=16, 22=22; two new pins with 0 flag ticks reported under item 4; activation 16/192 on 0+1000 and 9/7/18/7 by base; check.py flag-on max 2.9 ms; eqdrive flag-off identical). PR #155 opened 9:47 PM ET, waiting for Sim Tester's official trees-on screen. Not a reject. Source: `origin/p40b-roof-jet-route:coord/data/ideas/P40.json`; [PR #155](https://github.com/dmclaughlin-bit/mech-bot/pull/155).
- **P45** midring spot quality. Step A failed: real midring spot choice 11/192 on 2000+3000 but 5/192 on 4000+5000 (under 10). No build. Source: commit `19fb4f7`.
- **P46** mid-game unstuck. Assigned to Doug's Claude; not built. Source: `coord/data/ideas/P46.json`; `coord/next-doug.md`.

Older HOLD rows remain in `coord/data/ready_ledger.md` and the pipeline view (P-B-004, P-B-005, P18, P19, B112, B116, HEAL_COVER1, P-B-008, and others). They are stale versus current champion P34 (most were last screened against 4.10 or 4.17, and several were already site-tested). They were not re-ranked in this pass.

## What this ranking does not contain

- No fabricated official or sim scores. Where a screen or checklist was never run, the file says so.
- No trees-on official 2000+3000 / 4000+5000 numbers for P25b, P26, P30, P35, P37, or P38. Those reruns have not been done.
- Archive-size figures for the older near-miss SHAs are not in the repo; they must be measured on any rebased head before a submit.

## Coordinator ruling, Sun Nov 22 1:29 AM ET: P41 #173 (c21d23b) back in the pool
Mech Builder's P41b Step 1 trace log (branch p41b-sound-look-no-stall c3a5bef): the sound look was OFF during both veto pauses. 2021 (120-144 s) is a midring-settle/farm-pickup oscillation that P48 also does at the same time ~33 m away (P48 moves 3.08 m per 10 s, just above the 3 m pause counter). 5036 (271-300 s) happened only because P41 survived 166 s longer (8th to 2nd). So stall (b) does not apply (the champion does get stuck there and the game got better; the change was not active, so (a) fails too). Remaining veto: stall (c) only (pause games 2 to 3 on both sets). Mac means +0.052 / +0.005, deaths<40 48 to 47. P41 now fails exactly one veto, so it is an eligible near miss (the loop re-runs check.py + archive on c21d23b before any submit; the #173 head must be the flag-ON build). Ruling made under autonomous mode by the rules' intent.

## P62 d3c356a (3:09 AM ET)
In pool as near-miss data test, submitted BB-AD32CDFC. One veto type: stall (b on 2021, c 2->3 on both sets); look inactive during both pauses; means +0.036 / +0.057 vs P60.
