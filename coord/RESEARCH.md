# Mech Royale research dossier — Aristotle and Socrates

**Team:** Doug McLaughlin and Diego Bazan, site name "Aristotle and Socrates".
**Repo:** https://github.com/dmclaughlin-bit/mech-bot
**This file:** a self-contained brief so another researcher (including a fresh Claude) can decide the single best change to try next. Every number below is taken from a cited source. If a value is not in a source, it is marked **unknown**. Nothing here is a submission, a merge, or a change to bot code.

**Generated:** Saturday, November 21, 2026, afternoon America/New_York (ET), after the overnight push that ended at 9:00 AM ET. Champion and scores are unchanged since the last logged site result at 8:50 AM ET.

Companion tables (same commit):

- [`coord/research/site-submissions.csv`](research/site-submissions.csv) — every practice submission with score, receipt, sim, and sources
- [`coord/research/site-corr-2026-11-21.txt`](research/site-corr-2026-11-21.txt) — `site_corr.py` snapshot of 28 builds that have both a site score and 192 fresh-seed sim games (run from `/workspace/tester/` on this date)

---

## 1. Goal and current state

We need a change that moves us up the practice board, and eventually into the top 32, without giving up the current final entry. The official deadline in `AI-Structure-Development.md` is **Sunday, November 22, 2026, 11:00 AM ET**, with the final build **locked at 9:00 AM ET** that morning. Standing operating rules (coordinator / Doug): at most **4 submissions per hour**; **keep a build only if it beats the current best**; **never click "Pick as our final entry"** (the site auto-promotes a new high score, and on a tie the earlier submission keeps the final). The gate `(cd /workspace/mechfight-kit && python3 check/check.py --map-dir arena -- bun <path>/bot.ts)` must PASS before any submit. The local sim is a veto screen, not a ranking tool (see §6).

**Champion and final entry:** Build 80 "latelight", commit `28c3acc1a0f58571163e90b562da1c25067085c4`, PR #74, merged into main as `cb93980`. Site score **3.79**, receipt **BB-78A44AAF**, submitted Saturday 6:37 AM ET. Source: `coord/log.md` (entry at 6:37 AM ET). Bot code on main is still that merge; later main commits are log-only (tip at the time this dossier was written: `46d3eca`, "log: B94 3.73 closed").

**Board at the end of the overnight push (8:50 AM ET):** **129th of 239**. Rank 1 **6.00**, rank 32 **5.25**. Source: `coord/log.md` entries at 8:44 and 8:50 AM ET. The 8:44 and 8:50 log lines record those scores only. An older Friday 9:40 PM ET snapshot in `/workspace/leaderboard.txt` is stale (we were 81st of 108 at 2.23; the later leading team was 48th at 3.69) and must not be used as the current board.

**Gap:** we are **1.46 points** below the 32nd-place score recorded at 8:50 AM ET (3.79 vs 5.25), and **2.21** below then-first (6.00). Those two board numbers can move; 3.79 is our frozen practice best.

**What is not in the queue:** after 9:00 AM ET the overnight push ended. `/workspace/queue.md` line 2 (box file, not in the repo) says there is no slot lock, nothing queued, B96 is sim-inert and must not be submitted, and Lane A is paused. Do not submit anything from an open PR without a new decision.

---

## 2. How the game works, and how Build 80 is structured

### 2.1 Rules and scoring (kit)

Sources: `/workspace/mechfight-kit/protocol.md` and `/workspace/mechfight-kit/README.md`. Line pointers below are to `protocol.md`.

- **Format:** 16-mech battle royale. A bot is a program that reads JSON lines on stdin and writes JSON lines on stdout. A submission is a public GitHub repo whose Dockerfile the scorer builds. Each practice submission plays **48 matches** against built-in (house) bots (`README.md`; `protocol.md` §1).
- **Score:** placement is death order (last alive = 1st). Each match gives `16 - place` points (15 for a win, 0 for dying first). The reported score is the **mean over the matches you play**. "Surviving matters more than kills, though kills give you cubes." (`protocol.md` §4, lines 90–94). So 3.79 means we average a bit better than 13th place; 5.25 is average a bit better than 11th; 6.00 is average 10th. These are implications of the formula, not extra measurements.
- **Timing:** 50 ms action budget. Matches end when one mech is left or at 8:00. The zone starts at radius 560 m and shrinks 380 → 240 → 140 → 70 → 25 → 0 m; the last circle closes by about 6:55 (`protocol.md` §9).
- **Body:** 1400 HP at spawn. After 5 s without dealing or taking damage, regen is 45 HP/s, except outside the zone. Armor reduces weapon damage, not zone damage (`protocol.md` §7).
- **Weapons:** spawn with only the **gun** (slot 0). Lasers, lightning, and mortars are loot (floor spawns, crates, dead mechs). Two slots; cannot hold two of the same kind. Laser: hold to charge (up to 0.75 s), release to fire a 280 m hitscan; charging halves move speed and is visible and audible (charge sound 140 m, shot 380 m). Lightning: 45 m cone, chains, energy cost, shorts an enemy laser. Mortar / lightning / laser have a documented triangle (`protocol.md` §7).
- **Cubes / upgrades:** a cube is +4% max HP and +4% damage (cap 10 for those stats) and +5% size with no cap. Offers arrive at cube thresholds; if you do not pick in 5 s, choice 0 is applied (`protocol.md` §10).
- **Vision:** you see mechs in view; after they leave, you keep their current position for `memory_s` (5 s). Floor weapons, cubes, crates, and projectiles are listed only while seen (`protocol.md` §8). Practice house-bot composition, as logged Saturday 00:05 ET: 4 easy, 4 medium, 4 hard, 3 expert, and they hunt as one squad (`coord/log.md`; `coord/research-doug-0040.md` line 19).

The track page ranks each team's **best** practice score, and at cutoff that best submission is the final unless the team clicks "Pick as our final entry" (`coord/log.md` Fri 21:02, Q3). We have never clicked that button.

### 2.2 Repository layout (champion commit `28c3acc`)

| File | Role |
| --- | --- |
| `bot.ts` | Five-line entry: kit loop in `mechfight.ts` drives `createBot` from `brain.ts`. |
| `brain.ts` | All decisions (974 lines at `28c3acc`). |
| `params.ts` | Flags and knobs. Rolling a flag back is supposed to restore the parent exactly. |
| `nav.ts` | 2 m A\* pathfinding (`path`, `eta`, `stuck`). |
| `map.ts` | Terrain / buildings / `clearLine`. |
| `target.ts` | Target-value helpers used by Build 16. |
| `mechfight.ts` | Protocol wrapper (types, stdin/stdout). |

### 2.3 Build 80 decision logic (line pointers at `28c3acc:brain.ts`)

Ancestry still present as flags, all on in the champion: farm (B12/B13), engage TTK/finish (B14), kill-value targeting (B16), no-sneak when not hurt (B19), early laser rush in the first 45 s (B17), settings from B30 (`params.ts`: `aggression` 1.5, `retreatHp` 0.30, `LASER_TRIP_M` 250, `LASER_RUSH_S` 45, `LASER_CHASE_S` 20), crossfire break (B60, `CROSSFIRE_ON` at `brain.ts:124`), and the late gun-only walk (B80, `LATE_LIGHT_ON` at `brain.ts:131`).

**Movement priority** — first matching branch wins (`brain.ts:677–758`):

1. **Zone escape** if outside the circle (boost).
2. **Walk to the next circle** if `leaveNow`.
3. **Engage** (`ttk` or `finish`) — Build 14 (`brain.ts:688–700`). The finish rule needs HP ≥ `ENGAGE_FINISH_HP` (0.35) and ttk < ttd, and the target alone. Engage **outranks** the laser walk.
4. **Retreat to cover** if hurt (HP < 30%), hit in the last 2 s, and a hide spot exists (Build 5 / F3).
5. **Retreat** backwards if hurt and no cover.
6. **Claim** cubes from a kill for `CLAIM_S` = 12 s (`brain.ts:722–724`). Claim also requires 2 s quiet and not being seen (`brain.ts:628`).
7. **Laser rush / late walk** (`mode = "laser rush"`, `brain.ts:725–728`).
8. **Break crossfire** when 2+ known enemies have LOS (`brain.ts:729–735`, hide distances 1/2/3 s of walking).
9. **Heal** while HP < 90%; hide only if still "hurt" under Build 19's `noSneak`.
10. **Loot** a nearby weapon, then **farm** (capture / hunt / pickup), then **hide** (again only while hurt).

**Early arm-up (B17) and late walk (B80), `brain.ts:633–671`:** remember seen lasers and lightnings; forget one that is gone. A new trip starts only if: `LASER_RUSH_ON`; either `t < 45 s` or an in-progress `rush` or `lateLight`; we hold no laser; a slot is free (or no enemies listed and we can drop the gun — this is the gate B90 later tried to change); we are in the zone and not leaving; not already on a zone trip; **not engaging**; **no claim goal**; not hurt; no mech hit for `FARM_QUIET_S` = 3 s; and (unless `lateLight`) a nearby farm cube does not take priority. `fits()` caps the path at `LASER_TRIP_M` 250 m and requires zone time to spare. Lasers are preferred over lightnings; a lightning is allowed only while gun-only. A walk that takes longer than `LASER_CHASE_S` 20 s is permanently added to `laserSkip`. `lateLight` is `LATE_LIGHT_ON && gunOnly && t >= 45 s` (`brain.ts:640`). After 45 s the champion will **start** a new walk, not only continue one. If `lateLight` is on and 2+ enemies can see us, the late walk yields to B60 cover (`brain.ts:667–670`).

**What this means in practice:** the opening (first 45 s) still uses the B17 rush, but engage, a poke in the last 3 s, claim, or being hurt will cancel it. After 45 s, only a **gun-only**, **quiet**, **non-engaging** bot will go get a special, and only within 250 m. That is why B80 does not touch early deaths (the 56/192 who die before 40 s are the same games as under B60 — `proposals/20261121-0651-28c3acc.md`).

Upgrade preference is still L4: plating > armor > nanites > sensors > weapon upgrades > mobility (`brain.ts:136–144`).

---

## 3. Every site-tested build

The full table, including sources, is in [`coord/research/site-submissions.csv`](research/site-submissions.csv). Summary below, **newest last**. Sim pre-checks use the later paired method (SEED_BASE 2000 and 3000, 96 each, n=192) when that file exists in `/workspace/tester/results.txt`. Earlier Friday/early-Saturday builds have **unknown** paired numbers; the method was adopted after B23 (`coord/log.md` Sat 01:55 ET).

| Time (ET) | Build | Idea (short) | Commit | PR | Site | Receipt | vs then-best | Sim (n=192) | Games changed |
| --- | --- | --- | --- | ---: | ---: | --- | --- | --- | ---: |
| Fri 7:50 PM | B1 | Aim + track | `76aabfa` | #2 | 1.67 | BB-92A5D3DC | +0.52 vs kit 1.15 | unknown | ? |
| Fri 8:55 PM | B2 / S2 | Survival-min | `4726cfc` | #6 | 2.17 | BB-91057C0A | +0.50 | unknown | ? |
| Fri 9:21 PM | S3 | Identical B2 resubmit | `4726cfc` | — | 2.17 | BB-89ECDFF6 | Δ 0.00 | n/a | n/a |
| Fri 9:27 PM | B3 | Wire nav | `406ab9f` | #7 | 2.23 | BB-955D92D8 | +0.06 KEEP | unknown | ? |
| Fri 10:10 PM | B5 | F3/F4/Q2 with heal fire-gate | `2a0cbad` | #10 | 2.04 | BB-AA244730 | −0.19 | unknown | ? |
| Fri 10:21 PM | B5b | B5, heal keeps firing | `100941f` | #11 | 2.38 | BB-54EDF93F | +0.15 KEEP | unknown | ? |
| Fri 10:32 PM | B6 | Hold behind cover | `1386dd1` | #12 | 2.23 | BB-BC5A52AB | −0.15 | unknown | ? |
| Fri 10:37 PM | B7 | Drop 100 m gun gate | `209539f` | #13 | 2.04 | BB-07153949 | −0.34 | unknown | ? |
| Fri 11:12 PM | B8 | Laser first (unbounded) | `beb9240` | #14 | 2.27 | BB-DB8A4479 | −0.11 | unknown | ? |
| Fri 11:21 PM | B10 | Nav nearest-reachable fallback | `b4a65ba` | #16 | 2.35 | BB-9A951653 | −0.03 | unknown | ? |
| Fri 11:33 PM | B11b | Nav inflate 2→2.5 m | `8bfc89e` | #19 | 2.10 | BB-5BB9D164 | −0.28 | unknown | ? |
| Fri 11:45 PM | B12 | Farm when safe | `8f2c7c8` | #21 | 2.44 | BB-35E5C75F | +0.06 KEEP | unknown | ? |
| Sat 12:12 AM | B13 | Farm reach 150 m | `c2e7f60` | #23 | 2.54 | BB-5573AA45 | +0.10 KEEP | unknown | ? |
| Sat 12:22 AM | B14 | TTK vs TTD + finish | `0ed6ffc` | #24 | 2.88 | BB-2897E011 | +0.34 KEEP | unknown | ? |
| Sat 12:34 AM | B16 | Kill-value target lock | `8887d80` | #26 | 2.98 | BB-340B47F3 | +0.10 KEEP | unknown | ? |
| Sat 12:47 AM | B15 | Aim lead | `3359e29` | #27 | 2.65 | BB-E5918214 | −0.33 | unknown | ? |
| Sat 1:16 AM | B19 | Stop sneaking | `0905b70` | #33 | 3.08 | BB-B23070D8 | +0.10 KEEP | unknown* | ? |
| Sat 1:23 AM | B17 | Early bounded laser rush | `38ce57b` | #32 | 3.50 | BB-FE8FEA0F | +0.42 KEEP | later abs. mean 3.36 | ? |
| Sat 1:35 AM | B21 | Upgrade order | `e0710b6` | #34 | 3.46 | BB-1AFE6423 | −0.04; log said −0.08 ± 0.17 pre-check | see log | ? |
| Sat 1:47 AM | B23 | Laser-safe early spacing | `5b36504` | #38 | 3.46 | BB-D6AC95A2 | −0.04; log said −0.06 pre-check | abs. mean 3.42 | ? |
| Sat 2:16 AM | B20+22 | Standoff + calibrated race | `1c05189` | #37 | 3.35 | BB-F9B0A975 | −0.15; log said −0.09 ± 0.12 | abs. mean 3.28 | ? |
| Sat 2:23 AM | B24 | Rear-glance | `9965c0c` | #40 | 3.40 | BB-F54B5674 | −0.10 | +0.057 ± 0.071 vs B17 code | 41 |
| Sat 2:35 AM | B27 | Strafe while holding | `d5fb49d` | #43 | 3.38 | BB-0D0F93D6 | −0.12 | −0.036 ± 0.158 vs B17 code | 121 |
| Sat 2:48 AM | **B30** | Settings comboA | `7b71e43` | #46 | **3.54** | BB-5E7DE301 | **+0.04 KEEP** | +0.161 ± 0.112 vs B17 code | 79 |
| Sat 3:17 AM | B36 | Trip before finish | `9a9cf10` | #50 | 3.54 | BB-285D47C5 | tie, not kept | +0.109 ± 0.071 vs B30 | 19 |
| Sat 3:23 AM | B40 | Rush-first + pre-charge + backstab | `34eefff` | #51 | 3.23 | BB-2F1AD6E9 | −0.31 | **+0.286 ± 0.130** (best sim) | 52 |
| Sat 3:36 AM | B32 | Laser pre-charge | `f478895` | #47 | 3.48 | BB-C5622A3A | −0.06 | +0.099 ± 0.089 vs B30 | 27 |
| Sat 3:48 AM | B48 | House hit rates in TTK | `51a5e10` | #54 | 3.50 | BB-D03F8790 | −0.04 | abs. mean 3.38; paired vs B30 unknown | ? |
| Sat 4:17 AM | **B60** | Break 2-on-1 LOS | `b889814` | #57 | **3.67** | BB-A0BBBFEE | **+0.13 KEEP** | paired vs B30 unknown; abs. mean 3.46 vs B30 3.53 | ? |
| Sat 4:24 AM | B39 | Boost during laser rush | `147f305` | #59 | 3.38 | BB-ECAB0443 | −0.29 | +0.042 ± 0.178 vs B60 | 80 |
| Sat 4:36 AM | B66 | Swap lightning for laser | `45d8073` | #61 | 3.58 | BB-4E471C6E | −0.09 | +0.000 ± 0.054 vs B60 | 13 |
| Sat 4:49 AM | B41 | Rear-hit step | `95af0bc` | #63 | 3.65 | BB-411B5ADB | −0.02 | +0.031 ± 0.120 vs B60 | 55 |
| Sat 5:19 AM | B74 | Finish last 30 m of laser walk | `153b7bd` | #68 | 3.67 | BB-CD0FED5C | tie, not kept | +0.182 ± 0.099 vs B60 | 27 |
| Sat 5:26 AM | B68 | Keep a free slot; refuse lightning | `a117939` | #62 | 3.21 | BB-ABA74C24 | −0.46 | +0.005 ± 0.121 vs B60 | 57 |
| Sat 5:37 AM | B64 | Start trip through a distant poke | `f171f20` | #60 | 3.63 | BB-061D8305 | −0.04 | −0.016 ± 0.119 vs B60 | 42 |
| Sat 5:49 AM | B45 | Track-sweep for a laser | `a34996d` | #65 | 3.35 | BB-CB222B29 | −0.32 | +0.000 ± 0.057 vs B60 | 16 |
| Sat 6:19 AM | B76 | Any-special early trip (incl. mortar) | `56cb559` | #71 | 3.25 | BB-3AB97F36 | −0.42 | −0.109 ± 0.093 vs B60 | 36 |
| Sat 6:26 AM | B53 | Post-kill cover | `dc7f26f` | #73 | 3.50 | BB-290B6BD3 | −0.17 | −0.057 ± 0.073 vs B60 | 35 |
| Sat 6:37 AM | **B80** | Late gun-only walk after 45 s | `28c3acc` | #74 | **3.79** | BB-78A44AAF | **+0.12 KEEP; still final** | +0.078 ± 0.054 vs B60 | **8** |
| Sat 6:49 AM | B82 | Wider crossfire cover | `e7df41f` | #76 | 3.46 | BB-4023B260 | −0.33 | +0.010 ± 0.104 vs B80 | 59 |
| Sat 7:20 AM | B86 | Late walk 400 m after 60 s | `b93ae6d` | #78 | 3.79 | BB-7A43732D | tie | +0.016 ± 0.017 vs B80 | **3** |
| Sat 7:27 AM | B88 | No laser-charge start under fire | `2c52220` | #79 | 3.52 | BB-485F96CC | −0.27 | −0.109 ± 0.056 vs B80 | 28 |
| Sat 7:37 AM | B43 | Laser scout (idle aim), on B80 | `1c8f8df` | #64 | 3.69 | BB-69DCBAF9 | −0.10 | −0.016 ± 0.026 vs B80 | 11 |
| Sat 7:50 AM | B90 | Keep lightning, drop gun for laser | `dd716d3` | #80 | 3.73 | BB-D3165A39 | −0.06 | −0.021 ± 0.038 vs B80 | 9 |
| Sat 8:22 AM | B92 | Late walk from 35 s | `a941607` | #81 | 3.79 | BB-ECD38FB6 | tie | +0.000 ± 0.010 vs B80 | **4** |
| Sat 8:28 AM | B98 | No early finish-engage without laser | `39b2fe9` | #84 | 3.63 | BB-970E5B69 | −0.16 | −0.042 ± 0.120 vs B80 | 62 |
| Sat 8:44 AM | B100 | Late cover at 1+ LOS when just hit | `8ec3946` | #85 | 3.50 | BB-813FFACF | −0.29 | −0.052 ± 0.053 vs B80 (queue) | 21 |
| Sat 8:50 AM | B94 | P9+P10 late walk beats claim, 30 s chase | `1657334` | #82 | 3.73 | BB-EA74B72B | −0.06 | +0.000 ± 0.028 vs B80 | **6** |

\*B19 had a local 48-seed model (+0.46 ± 0.36 SE) in `EXPERIMENTS.md`; that is not the later paired method and is not a site prediction.

Not submitted, but built and sim-checked (do not treat as site results): **B49** `5136a32` (P1 mid-laser hunt) 2–3/192 changed; **B55** `fafcedf` (P4 pause rush under crossfire) 2/192; **B96** `4420886` (P11 late walk outranks finish-engage) 1/192, sim −0.005 ± 0.005. Sources: tester proposals and `/workspace/queue.md`. **B9** (laser upgrade order, PR #15) and original **B11** (PR #18) and **B18** (early spacing, PR #31) were **not site-tested**.

Kit published baseline: `7a22fee` **1.15** (`EXPERIMENTS.md`).

---

## 4. What won, and why we think so

Three practice keeps after the early climb (B1→B19→B17) actually moved the champion past 3.50:

### B30 settings — 3.54 (BB-5E7DE301), +0.04 over B17 3.50

`params.ts` only, on the B17 tree: `aggression` 1.0 → 1.5, `retreatHp` 0.35 → 0.30, `LASER_TRIP_M` 175 → 250 (PR #46; `coord/log.md` 2:48 AM ET). Sim vs B17 code was **+0.161 ± 0.112**, 79/192 games changed (`tester/results.txt`). We do **not** have a clean A/B of the three knobs on the site; singles were later screened in B38 work vs B30 and not submitted (`queue.md` item 38: a200 −0.02, r25 −0.03, sim only). A further settings step (B84: aggression 2.0, retreatHp 0.25) was **not submitted** because seed 3000 sat on the −0.3 veto line (sim −0.177 ± 0.095 vs B60). So we think B30 helped, but we cannot say which of the three knobs did the work on the site.

### B60 crossfire cover — 3.67 (BB-A0BBBFEE), +0.13 over B30 3.54

When 2+ enemies have line of sight, walk to a hide spot instead of standing and trading (`CROSSFIRE_ON`, distances [1,2,3] seconds of walking). Rationale in `28c3acc:brain.ts:118–126`: practice house bots share vision and hit harder than the sim, so a 2-on-1 stand-and-shoot is a fight we cannot finish. The **paired** sim delta vs B30 is **unknown** (not in `tester/results.txt`). On the same 192 fresh seeds, B60's **absolute** sim mean is **3.46** vs B30's **3.53** (`site_corr.py` snapshot) — i.e. the sim slightly preferred the previous champion, and the site went the other way. Widening that search (B82, 3.46) and firing cover at 1+ LOS after 45 s (B100, 3.50) both lost, so the win looks tied to the original 2+ / [1,2,3] rule, not to "more cover."

### B80 late walk — 3.79 (BB-78A44AAF), +0.12 over B60 3.67

Tester **P6**: after 45 s, a still-gun-only bot may walk up to 250 m to a remembered lightning or laser, if quiet (no mech hit for 3 s), not engaging, not claiming, not hurt. Take/swap/drop unchanged. Sim **+0.078 ± 0.054**, only **8 of 192** games changed: laser at end 74 → 79, gun-only 82 → 77, gun-only alive at 60 s 21 → 16, first laser held at t≥45 s 3 → 8 (PR #74 body; `proposals/20261121-0651-28c3acc.md`). This is the **only Tester proposal that won on the site**. We think the mechanism is "cut leftover gun-only endings **after the opening**," not "grab any special as early as possible" (that was B76, 3.25). Confidence is medium, not proof: one site win, the site's own noise is not measured, and later near-copies of this walk never beat 3.79 (see §5 and §6).

**Earlier keeps that built the floor (all in `EXPERIMENTS.md` / `coord/log.md`):** B2 survival +0.50, B3 nav +0.06, B5b heal-without-fire-gate +0.15, B12 farm +0.06, B13 farm reach +0.10, B14 fight-or-flee **+0.34**, B16 target pick +0.10, B19 stop sneaking +0.10, B17 early laser **+0.42** (biggest single gain). Those are why we have a bot at all; they are not the remaining lever.

---

## 5. What lost, grouped by theme

All comparisons below are against the champion **at the time of the test**. After 6:37 AM ET the bar is B80 3.79; between 4:17 and 6:37 it is B60 3.67; between 2:48 and 4:17 it is B30 3.54.

### Early specials / early-grab openings

| Build | Site | Note |
| --- | ---: | --- |
| B8 laser first | 2.27 | −0.11 vs B5b 2.38. Seek almost never ran (12–16% of spawns); cost side (charge-steers-torso) ran whenever we held a laser. `coord/research-doug-0040.md`. |
| B76 any-special early trip | 3.25 | −0.42 vs B60. Highest special rate of any scored build in that report (65.1% at end) and took mortars (17 vs 0). `proposals/20261121-0651-28c3acc.md`. |
| B39 laserdash (boost during rush) | 3.38 | −0.29 vs B60. |

B17 is the exception in this theme: a **bounded**, memory-based early laser walk **won** (+0.42). The losses are unbounded or "grab anything" variants, and boosting through the rush.

### Slot or weapon swaps

| Build | Site | Note |
| --- | ---: | --- |
| B68 keep a free slot / refuse lightning | **3.21** | −0.46 vs B60. Sim was a tie (+0.005 ± 0.121) but lightning held 28.6% → 11.5%, gun-only 42.7% → 54.2%. Worst post-B17 score. |
| B66 swap lightning for laser | 3.58 | −0.09 vs B60. Lightning share also fell. |
| B90 keep lightning, drop gun for laser (P5, opposite of B66) | 3.73 | −0.06 vs B80. Lightning share in sim did not fall (56/192 vs 56/192 in queue.md; site_corr still 29.17%). Did not win. |

Conclusion logged at 5:26 AM ET and restated in the 08:55 proposal: slot/weapon-swap changes have not beaten the champion; forcing a lightning-preserving swap also failed.

### Early fight changes (pre-charge, stacks, finish order, spacing-adjacent combat)

| Build | Site | Note |
| --- | ---: | --- |
| B40 rush-first + pre-charge + backstab | **3.23** | Best sim of that night (+0.286 ± 0.130), second-worst site score. |
| B32 pre-charge behind cover | 3.48 | −0.06 vs B30. |
| B36 trip before finish | 3.54 | Tie with B30, not kept. Not in B80's ancestry. |
| B98 no finish-engage before 40 s without laser (P12) | 3.63 | −0.16 vs B80. Sim −0.042 ± 0.120, **62/192** changed; died<40s **unchanged** at 29.2% (`proposals/20261121-0855-28c3acc.md`). Idea dropped. |
| B20+22 standoff + calibrated race | 3.35 | −0.15 vs B17. |
| B27 strafe while holding | 3.38 | −0.12 vs B17. |
| B24 rear-glance | 3.40 | −0.10 vs B17. |
| B48 house hit rates in TTK | 3.50 | −0.04 vs B30. |
| B15 aim lead | 2.65 | −0.33 vs B16. |

### Wider or looser cover / more defensive under fire

| Build | Site | Note |
| --- | ---: | --- |
| B82 wider crossfire search | 3.46 | −0.33 vs B80. 59/192 changed. |
| B100 late cover at 1+ LOS when just hit | 3.50 | −0.29 vs B80. 21/192 changed, all after 45 s; early deaths unchanged. |
| B53 post-kill cover | 3.50 | −0.17 vs B60. |
| B6 hold behind cover | 2.23 | −0.15 vs B5b, early in the night. |
| B41 rear-hit step | 3.65 | −0.02 vs B60 (closest non-tie miss under B60). |

The 08:55 proposal: "making the bot more defensive under fire after 45 s costs on site. Avoid defensive gating under fire."

### Charge hold

| Build | Site | Note |
| --- | ---: | --- |
| B88 no charge start under 2+ LOS + recent fire (P8) | 3.52 | −0.27 vs B80. Mid-charge deaths in the sim were 10/96 and those 10 already scored well (mean 6.00). Do not retry charge-hold variants (`proposals/20261121-0738-28c3acc-p9.md`). |

B32/B40 (adding more charging) also lost, above.

### Near-inert late-walk variants of B80

| Build | Site | Games changed | Note |
| --- | ---: | ---: | --- |
| B86 400 m after 60 s (P7) | **3.79 tie** | 3 | Almost never fired. Do not extend distance again. |
| B92 start late walk at 35 s | **3.79 tie** | 4 | Earlier tie keeps the final. |
| B94 P9+P10 (walk beats claim, 30 s chase) | **3.73** | 6 | Sim +0.000 ± 0.028, yet −0.06 on site. This is the important counterexample to "near-inert ⇒ same site score." |
| B49 mid-laser hunt (P1) | not submitted | 2–3 | Safety gates almost never all passed. |
| B55 pause rush under crossfire (P4) | not submitted | 2 | Rush already stops on a hit in 3 s. |
| B96 late walk outranks finish (P11) | not submitted | 1 | Called sim-inert; do not submit. |

B74 (finish last 30 m of the **early** walk) tied B60 at 3.67 with a **large** sim gain (+0.182). More sim lasers did not move the site.

### Other misses worth keeping in the record

- B7 drop 100 m gun gate: 2.04, −0.34 vs B5b (largest early collapse).
- B11b nav inflation: 2.10, −0.28.
- B21 upgrade order: 3.46 vs B17 3.50.
- B23 spacing: 3.46.
- B43 laserscout on B80: 3.69.
- B45 tracksweep: 3.35.
- B64 poke-through-trip start: 3.63.

---

## 6. Sim reliability

**Method** (from `/workspace/queue.md` line 1, `coord/log.md` Sat 01:55 ET, and tester scripts): paired games on **fresh** seeds, `SEED_BASE` **2000** and **3000**, **96 each** (n=192), versus the then-champion. Report mean difference ± SE, plus better / tied / worse. **Veto at −0.3** (or when a half-set sits on that line). Gate is `check.py` PASS. CSVs live in `/workspace/tester/runs/<sha>-{2000,3000}.csv`; a 96-seed **detail** run of B80 is `/workspace/tester/runs-detail/28c3acc-2000.csv` (score column matches the plain 2000 run on all 96 seeds — `proposals/20261121-0651-28c3acc.md`).

**The sim mean does not predict the site score.** Correlations of sim mean vs site, computed by `/workspace/tester/site_corr.py` from `site_scores.txt` + those CSVs:

| When | N builds | sim mean r | lightning-held r | laser r | gun-only r |
| --- | ---: | ---: | ---: | ---: | ---: |
| 5:58 AM ET (`proposals/20261121-0558-b889814.md`) | 14 | **−0.14** | **0.61** | 0.01 | −0.50 |
| 6:51 AM ET (`...0651-28c3acc.md`) | 17 | 0.05 | 0.48 | 0.28 | −0.27 |
| 7:38 AM ET (`...0738-28c3acc-p9.md`) | 21 | 0.16 | 0.48 | 0.37 | −0.34 |
| This dossier (`site-corr-2026-11-21.txt`) | **28** | **0.22** | **0.50** | 0.46 | −0.39 |

Lightning held at end has been the most stable (if modest) correlate. The sim score itself never ranks builds well. Headline mismatches:

- B40: best sim (+0.286 ± 0.130, abs. mean 3.81), site **3.23**.
- B68: sim tie, site **3.21**, because it cut lightning.
- B74: sim +0.182, site tie 3.67.
- B60: abs. sim mean 3.46 vs B30 3.53, site **+0.13**.
- B80: sim +0.078 (under 1.5 SE), only 8 games changed, site **+0.12**.

**Known sim biases** (0504 and 0558 proposals; `coord/research-doug-0040.md`): our gun hit rate in this sim is **82.4%** vs about **23%** in public recordings; house bots in the sim ignore charging lasers, do not turn to rear hits, and die too easily to lightning; non-hunters are passive, so long quiet walks look safer than they are on the site. Practice house bots share vision and hunt the weak; showdown recordings are FFA among team bots, not the practice squad.

**08:55 ET Tester finding** (`proposals/20261121-0855-28c3acc.md`): of the five B80 follow-up pre-checks in that table (B90, B92, B94, B98, B100), **all sat within 1 SE of zero**, and **none predicted the site drop**. "The more sim games a build changed, the bigger its site drop":

- ≤4 games changed → 3.79 tie (B86, B92)
- 6–9 → 3.73 (B90, B94)
- 21–62 → 3.50–3.63 (B100, B98; B88 3.52 with 28)

That pattern is an observation on this set, not a law. **B94 is the critical exception to determinism:** it changed only **6 of 192** sim games, sim **+0.000 ± 0.028**, and still scored **3.73** (−0.06). B86 and B92, even closer to inert, tied at 3.79. An earlier log note at 8:28 AM ET ("sim-inert builds scored exactly 3.79, so the site looks deterministic per behavior") was **corrected** after B94 (`coord/log.md` 8:50 AM ET). Practice still looks frozen on a **byte-identical** resubmit (S2=S3=2.17). Near-identical behavior is not guaranteed to reproduce 3.79.

Use the sim to catch broken builds (veto −0.3, or a huge early-death spike). Do not pick the next idea by sim mean or by "it only changed a few games."

---

## 7. Death analysis (slices, and what is still untouched)

Primary sources, all vs the B80 or B60 fresh-seed CSVs:

- `/workspace/tester/proposals/20261121-0504-b889814.md` (B60, includes the first detail run)
- `/workspace/tester/proposals/20261121-0651-28c3acc.md` (B80, n=192 plus a new 96-seed detail run)
- `/workspace/tester/proposals/20261121-0738-28c3acc-p9.md` (B80 leftover slices)

B80 **does not change the first 45 s**, and early-death counts match B60.

### Loadout at end (B80, n=192 unless noted)

| Slice | n | Share | Mean score | Contrast |
| --- | ---: | ---: | ---: | --- |
| No laser at end | 113 | 58.9% | **2.04** | with a laser: **5.68** (stake +2.15) |
| Gun-only at end | 77 | 40.1% | **1.74** | B60 was 82/192 |
| Lived ≥90 s with a laser | 32 | 16.7% | **8.06** | lived ≥90 s, no laser: 25/192 at **2.36** (14 gun+lightning, 11 gun-only) |
| Laser by 30 s (detail, 96 seeds) | 29 | 30.2% | **6.28** | after 30 s: 7/96 at 5.14; never: 60/96 at 1.78 |

On B60's earlier detail run, laser-by-30 s was also **29/96 (30.2%)** at score 6.28; after 45 s only **1/96** got a first laser (`proposals/20261121-0504-b889814.md`). B80 raised post-45 s laser takes (detail: 3/96 at 7:38 AM; PR #74: first held at t≥45 s, laser 8 vs 3 on the 192). It did **not** move laser-by-30 s.

### When we die

| Slice (B80, n=192) | n | Score | Notes |
| --- | ---: | ---: | --- |
| Died before 40 s | **56 (29.2%)** | **1.66** vs 4.31 | Same 56 games as B60. Of them: gun-only 37, killed by gun 39, hard/expert killer 42, 0 cubes 44. |
| Gun-only deaths before 45 s | **48** | **1.46** (median 32.3 s) | **The late walk cannot help these.** Largest slice B80 does not touch. |
| Gun-only, lived ≥45 s, still gun-only at end | **29** | **2.21** | 13 die at 45–60 s (score 2.46, median 52.5 s); 5 at 60–90 s; 11 after 90 s (score 1.82). 21/29 have 2+ kills; 15/29 still have 0 cubes. This was the pool P9–P11 / P13 aimed at. P9+P10 as B94 scored 3.73. |
| Almost no deaths in the first 15 s | 0/192 on B60 | — | Pile-up is 20–40 s (B60: 7 at 20–25 s, 11 at 25–30 s, 21 at 30–35 s). |

### How we die (detail runs)

- B80 detail (96 seeds): at death, 2+ attackers in the last 5 s in **62/96**. Early deaths (n=39): 2+ house bots seeing us in **32/39**; killer behind us **14/39** (20/96 overall). Mid laser charge at death: **10/96** (2+ seeing us in 8 of 10) — but those already score well (mean 6.00), and P8/B88 lost on the site.
- Early gun-only fights on the B80 detail run start at median HP **1400** (only 2 of 30 started that fight below 400 HP) — these are not desperate retreats (`proposals/20261121-0738-28c3acc-p9.md`).
- Not main causes on B60 (0504): zone 2/192, NPC 2/192, mortar slightly *better* than average, mid-charge deaths already high-scoring.

### What remains untouched or failed when touched

- **Early gun-only deaths (48/192 before 45 s)** — biggest remaining slice. P12/B98 tried "don't finish-engage early without a laser" and **lost** (3.63) without moving died<40s. B76 tried "grab any special early" and **lost** (3.25). B36 only tied. This slice is open, but every direct attempt so far has failed on the site.
- **Late gun-only leftover (29/192)** — B80 helped a little; B86/B92/B94 did not beat B80. P13 (2 s quiet instead of 3 s, late walks only) was **never built**.
- **Gun+lightning, no laser, long-lived** — B90 tried dropping the gun to keep lightning and take a laser: site 3.73. Still open as a problem, closed as that specific swap.
- **Crossfire / rear / mid-charge** — cover widening, late 1+ LOS cover, charge-hold, rear step, and strafe have all been tested and have not beaten the then-champion.

Walk arithmetic, if anyone revisits late walks (`0738` proposal): `walk_speed` 11.7 m/s, so 250 m is **21.4 s** in a straight line, longer on a path, and `LASER_CHASE_S` is 20 s (a timeout also blacklists the pickup). B94 already lengthened late chase to 30 s and lost.

---

## 8. The gap to the top: laser-or-special by 30 s, and how winners play

### 8.1 The 30-second loadout gap (find the source; do not reuse a paraphrase)

A coordinator paraphrase used "about 67–81% vs about 30%." That **exact range is not a single measured statistic** in the sources below. The measured numbers are:

**Our bot (local sim, not the site — the site has no per-match logs).** B80 and B60 detail runs, SEED_BASE 2000, 96 seeds: **laser held by 30 s = 29/96 = 30.2%**, score 6.28 vs 2.01 without (`proposals/20261121-0504-b889814.md` lines 36–41; confirmed on the B80 detail CSV and in `proposals/20261121-0651-28c3acc.md` line 31). The 0504 note also cites an earlier `queue.md` line, since overwritten: "ours ~30%, winners ~69%." We have **no site measurement** of our own laser-by-30 s. Our bot does not appear in any watcher recording (`/workspace/watch/ladder.md` line 7).

**Top-16 exhibition (showdown) bots, not the practice house squad:**

| Source | Sample | Special by 30 s (alive at 30 s) | Laser by 30 s (alive at 30 s) |
| --- | --- | --- | --- |
| `/workspace/watch/ladder.md` §1.3, generated Sat 10:23 AM ET | 62 complete showdowns | Winners **74%** (62/62), places 2–4 **69%** (186), bottom half 53% (239) | Winners **60%**, places 2–4 **47%**, bottom 28% |
| `/workspace/watch/prev/ladder.md` §1.3 (earlier refresh) | 60 showdowns | Winners **75%**, 2–4 **70%**, bottom 53% | Winners **60%**, 2–4 **48%**, bottom 29% |
| `coord/research-doug-0040.md` §1, Sat 12:40 AM ET | 14 showdowns | (not reported as "special") | Winners **10/14 (71%)**, places 2–4 18/42 (43%), bottom 10/37 (27%), of those alive at 30 s |
| `EXPERIMENTS.md` B17 row (cites an older `ladder.md` 1.3) | then-current ladder | — | "laser held by 30 s in **77%** of winners vs **26%** of the bottom half" — that snapshot is no longer in the current `ladder.md` |

Confidence on the ladder "special/laser by 30 s" rows is **low** in the current file (winner-vs-bottom consistency 39/57 and 34/57; see `ladder.md` "How to read"). The **laser in the final loadout** row is **high** confidence: winners **95%** (62/62) vs bottom half **27%** (`ladder.md` §1.3).

Showdowns are FFA among invited teams. They do **not** count toward the practice board and are **not** practice vs the 15-bot house hunting squad (`watch/findings.md` header). Useful for weapons, farming, and movement; weaker for "what beats the house squad in the opening."

### 8.2 How showdown winners actually get a laser (MEASURED, `coord/research-doug-0040.md`)

From 14 complete showdowns at 12:40 AM ET (scripts in `/workspace/watch/research-doug-0040/`; n is small):

- Of 10 winner lasers taken by 30 s: **7 were on the floor at match start, 3 dropped from a crate the winner shot, none from a roof.** 6 of the 7 floor lasers were the nearest to that winner's spawn.
- Distance: straight-line median **58 m**, maximum **176 m**. Path walked median **78 m**.
- **9 of 10 trips had an enemy inside 160 m** at some point (our loot gate). Closest enemy during the trip, median 97 m.
- Only 2 of 10 had dealt mech damage before the take. Boost was 16% of trip frames (bottom half 28%).
- When a ground laser was within 80 m of spawn, almost everyone took it by 30 s (winners 5/5, 2–4 12/14, bottom 3/4). The gap opens at **80–200 m**: winners 4/4, places 2–4 4/21, bottom 5/25. Two winners walked 124 m and 176 m.
- Lasers are not scarce: of 196 floor lasers in those showdowns, 67 were taken by 30 s and **121 were never taken**.
- Scanning is not the difference: every group sweeps about 200° or more in the first 3 s.
- Holding a laser early is not enough: bottom-half mechs that take a laser take it at a median 6.0 s and still finish bottom half.

B17 was designed from this (drop the 160 m gate, remember pickups, cap the walk ~175–250 m, stop only when hit). It won +0.42. Later "try harder in the opening" builds (B76, B39, B8's unbounded seek, B68 leaving a slot empty) lost.

### 8.3 Other winner-vs-bottom patterns (current `ladder.md`, 62 showdowns)

Treat these as showdown evidence, not practice-squad facts. Stronger rows first:

- **Nearest enemy, first 30 s:** winners 146 m vs bottom 117 m, d=+0.86, conf **high** (`ladder.md` §3.2). Enemies within 100 m: 0.21 vs 0.45, conf med. Winners are simply farther from people early.
- **Boost in the first 30 s:** winners 12% of frames vs bottom 19%, conf med. High-boost / high-air bots dying early was already in `coord/learnings.md` from the first two exhibition matches.
- **Laser in final loadout:** 95% vs 27%, conf high (above).
- First special pickup time, whole life, is **confounded by life length** (bottom-half median life 29.2 s) and is flagged ⚠ in the ladder. Prefer the "alive at 30 s" rows.
- Winner end loadouts in the current `findings.md` aggregate: gun+laser dominates winners (51), with a handful of lightning+laser / gun+lightning. Bottom half still has many gun-only endings (214 of 496 in that listing). See `findings.md` near the end-loadout bullets.
- Upgrades: first upgrade among winners in the 10:20 AM findings dump is most often plating (21/61), then servos, gun_damage, armor, nanites. Not a tight script.
- Current findings also report, for winners vs bottom, first-30-s-adjacent loot: nearest enemy at laser take ~140 m (winners) vs ~128 m (bottom) in the aggregate table; special takes often happen with an enemy inside 160 m (winners 62.9%). That agrees with the 0040 trip study.

We have **no recording of the then-leading team or of the current 32nd-place practice bot in a practice (house-squad) match.** Showdown appearances (e.g. another team winning a 3 AM showdown in `/workspace/watch/prev/findings.md`) are not the 8:50 AM ET practice board.

### 8.4 Why our 30% is where it is (inferred, with evidence)

B17's rush can only start when we are not engaging, not hurt, and have not been hit for 3 s, and only toward a **remembered or currently seen** ground pickup that fits in 250 m. Engage ranks above the rush. A poke at 20–30 s can cancel the trip and leave us gun-only in front of a hard/expert (`proposals/20261121-0504-b889814.md` §2). We do not have practice replays to confirm that sequence on the site (Q2, `coord/learnings.md`). Build 8's earlier rule was even narrower (12–16% of spawns). Any new opening has to raise laser-or-special-by-30 s **without** recreating B76/B39/B40.

---

## 9. Ideas proposed but never built, and open questions

### Tester proposals (P1–P13) — status

| ID | Idea | Built as | Site / sim | Status |
| --- | --- | --- | --- | --- |
| P1 | Mid-game laser hunt after 45 s (tight safety gates) | B49 | not submitted; 2–3/192 | Inert as gated. Do not spend a slot. |
| P2 | Walk to swap lightning for laser | — | — | Advised against after B66/B68. |
| P3 | No early finish without a laser | refreshed as P12 / B98 | site 3.63 | **Failed.** Drop. |
| P4 | Pause rush under crossfire, then resume | B55 | not submitted; 2/192 | Near-inert (rush already stops on a hit). |
| P5 | Keep lightning, drop gun for laser | B90 | site 3.73 | Failed to beat B80. |
| P6 | Late gun-only walk after 45 s, 250 m | **B80** | **site 3.79** | Only proposal win. Champion. |
| P7 | 400 m after 60 s | B86 | site 3.79 tie; 3/192 | Do not extend distance again. |
| P8 | Hold charge under fire | B88 | site 3.52 | Do not retry. |
| P9 | Late walk outranks cube claim | B94 (with P10) | site 3.73 | Failed as a pair. |
| P10 | Late chase 30 s, don't blacklist on timeout | B94 (with P9) | site 3.73 | Failed as a pair. Untested alone. |
| P11 | Late walk outranks a finish-engage | B96 | not submitted; 1/192 | Sim-inert. Do not submit. |
| P12 | No finish-engage in first 40 s without laser | B98 | site 3.63 | Failed. |
| **P13** | **For late walks only, start after 2 s quiet instead of 3 s** | **never built** | — | `proposals/20261121-0738-28c3acc-p9.md`. Use `THREAT_HIT_S` (2 s) instead of `FARM_QUIET_S` (3 s) when `lateLight`. Do not loosen the gate in the first 45 s. Build only if P9 was inert because the extra second was the blocker — and P9+P10 as B94 was **not** inert enough to tie, it lost. Treat as a leftover, low-medium, possibly small (if a pre-check comes back 2–3/192, treat as inert). |

The 08:55 fire added **no new proposals.** Quote: "every small rule tweak on B80 has tied or lost. Next ideas need a new champion or new site data, not more variations of the late walk, cover, or charge rules."

### Built but not submitted, or still open as PRs (do not submit without a new decision)

Open PRs as of this writing (`gh pr list --state all`, 22 open). Notable leftovers: B78 (early lightning if no laser can arrive by 30 s, sim −0.099 ± 0.073 vs B60, 6/192 — related to the early-special theme that already lost as B76), B84 (more aggression / lower retreatHp, sim −0.177, veto-adjacent), B49/B55/B96 (inert), B26, B28, B29, B31, B33, B34, B38, B42, B47, B51, B54, B56, B72, plus two research-intake PRs (#39, #41). Full titles are in the index of PRs below. The coordinator's queue marked B84, B78, B55, B96 as LOW / do not submit.

### Open questions

1. **What do top practice bots actually do in the first 30 s against the house squad?** We have showdown FFA evidence, not practice replays (Q2 still open). Mech Watcher recordings are under `/workspace/watch/stream/` and `/workspace/watch/recordings/` (not in the repo; do not commit the jsonl). Our bot is in none of them.
2. **Is there an opening that raises laser-or-special-by-30 s without raising early deaths?** Every direct attempt after B17 has failed on the site. The remaining design space is "how winners walk 80–200 m to a floor laser while enemies are at ~100–160 m, and still live," not "grab mortar/lightning too" and not "boost through the rush."
3. **How noisy is the site?** S3 proved a byte-identical resubmit is stable to two decimals. B94 proved a 6-game behavioral change can still move the score 0.06. The site's SE is **unknown**. One test is not a distribution.
4. **Which B30 knob mattered?** Never A/B'd on the site.
5. **P10 alone, or P13 alone,** were not tested. Given B94 and the 08:55 advice, these are weak candidates unless a new analysis shows a large, distinct game pool.
6. **Gun hit-rate mismatch.** If we ever retune fight rules, the sim will overstate gun-only duels. That is already why P12 looked more promising in the sim story than it was.
7. **Sunday lock.** After 9:00 AM ET Sunday, the plan says no large change; only already-validated fixes (`AI-Structure-Development.md`).

---

## 10. Suggested research brief (questions to answer)

Frame: **the late-walk lever is tapped out.** The leftover with a real score gap is the opening — specifically, getting a laser (or a special) by 30 s **without** raising the 48/192 early gun-only deaths. Showdown winners do this by walking a moderate distance to a known floor laser and accepting enemies at 100–160 m, not by fighting first and not by grabbing mortars. Our B17 rush already tries a bounded version of that and won once; later, looser or more aggressive openings lost. The job is to find **one** new opening plan that is genuinely different from B17/B76/B39/B36/B98, then spend scarce site tests on that, not on near-copies of B80.

Please answer, in order, with evidence and a recommended first build:

1. **Diagnosis of our 30.2% laser-by-30 s.** Using champion code at `28c3acc` and the detail CSV `/workspace/tester/runs-detail/28c3acc-2000.csv` (and the 192-seed pair), plus any watcher recordings you re-analyze: in the games where we do **not** have a laser by 30 s, what stopped B17's rush? (Never saw/remembered a laser in range; engage cancelled the trip; a hit in the last 3 s; no free slot; path/timeout/`laserSkip`; died first; zone; something else.) Give counts. If the CSV cannot answer a part, say so and name what would.
2. **How the current top practice bots open**, as far as evidence allows. Do not assume showdown FFA equals practice-vs-house. If you only have showdowns, label it. Prefer recent `/workspace/watch/stream/` files. Contrast the leading team and other high scores with bottom-half and with us. Extract: first special time and kind, path length, whether they fought first, boost, distance to nearest enemy, whether they ignored the 160 m bubble, crate-vs-floor source.
3. **Three genuinely different opening plans** (not parameter tweaks of B80's late walk, not P13-unless-you-argue-otherwise, not another slot swap, not charge-hold, not wider cover). For each: exact rule, what it changes in `brain.ts`/`params.ts`, which of the 48 early gun-only games it could touch, how it avoids B76/B39/B98, a predicted effect on (a) laser-or-special-by-30 s, (b) died<40 s, and the **one** you would build first. Keep B80's late walk, B60 cover, and B30 settings unless you have a measured reason to drop them.
4. **A site-test policy** for Saturday into Sunday: which of those plans deserve a scarce slot, what pre-check would veto them (keep −0.3, but also name behavioral vetoes such as "died<40 s up" or "lightning share down"), and what you would **not** test. Remember: the sim will not rank them; even 6/192 can move the site; keep only a score that beats 3.79; never click "Pick as our final entry"; B80 stays the final the whole time.
5. **What you would measure on a detail run** before spending a slot, in the language of `deaths.py` / the detail columns (`laser_by_30s`, `laser_t`, `sees_us`, `fight_hp`, loadout, death time).

If the evidence says the opening cannot be moved without more early deaths, say that plainly and name the next-best non-opening lever that has **not** already lost on the site.

---

## 11. Index of sources

### In the repo (this commit / main)

| Path | What it is |
| --- | --- |
| `coord/log.md` | Append-only coordination log. Authoritative site scores, receipts, ranks, and keep/close decisions. Compact entries from 2:35 AM ET onward are the overnight scoreboard. |
| `EXPERIMENTS.md` | Practice-submission table, newest first. Complete through B17's "pending" row; **not updated** for later Saturday builds — use `coord/log.md` after that. |
| `AI-Structure-Development.md` | Team plan: roles, deadline Sun 11:00 AM ET, lock 9:00 AM ET, rule IDs, behavior rulebook. |
| `coord/GROK_BRIEF.md` | Coordinator brief (loop, keep/revert rules as originally written; later tightened by Doug to "beat the best"). |
| `coord/learnings.md` | Early-night coordinator memory: S1–B3 scores, first exhibition notes, Q1–Q3. Not updated for Saturday afternoon. |
| `coord/WORKFLOW.md` | How work is logged and prompted. |
| `coord/research-doug-0040.md` | Doug research, Sat 12:40 AM ET: how winners get a laser, why B8 failed, ARM-UP design, first-fight stats, public-repo notes. |
| `coord/rca-report.md` | Earlier root-cause audit (pre-B80). |
| `coord/next-doug.md`, `coord/next-diego.md`, `coord/handoff-doug-claude.md` | Prompt/handoff files; may be stale relative to this dossier. |
| `research/` | Older architecture/tactics research from Friday (agents, recommendation, intake JSONs). |
| `params.ts`, `brain.ts` | Champion flags and logic; read them at commit `28c3acc` (or `cb93980`) for line-stable pointers. |
| `tools/sim/` | The local practice sim used for pre-checks (house bots, seeds, scoring). |

### On the box (not all committed; do not commit raw jsonl or secrets)

| Path | What it is |
| --- | --- |
| `/workspace/queue.md` | Operational candidate queue. Line 2 is current champion / do-not-submit state. Item 46 has the B100 sim numbers that never landed in `tester/results.txt`. |
| `/workspace/tester/results.txt` | Raw paired sim lines (challenger vs baseline, ± SE, better/tied/worse). |
| `/workspace/tester/site_scores.txt` | Commit prefix, site score, build name — input to `site_corr.py`. |
| `/workspace/tester/site_corr.py` | Correlation script. Snapshot of a 28-build run: `coord/research/site-corr-2026-11-21.txt`. |
| `/workspace/tester/deaths.py` | Slice analysis. Compare: `python3 deaths.py 28c3acc b889814`. |
| `/workspace/tester/runs/` and `runs-detail/` | Per-seed CSVs (plain and detail). |
| `/workspace/tester/proposals/20261121-0504-b889814.md` | First death analysis (B60) and P1–P4. |
| `/workspace/tester/proposals/20261121-0558-b889814.md` | Sim-vs-site correlation; P5–P6; lightning hint. |
| `/workspace/tester/proposals/20261121-0651-28c3acc.md` | B80 death analysis; P7–P8. |
| `/workspace/tester/proposals/20261121-0738-28c3acc-p9.md` | P9–P13; leftover 29-game late gun-only pool. |
| `/workspace/tester/proposals/20261121-0855-28c3acc.md` | Final scorecard: games-changed vs site drop; no new proposals. |
| `/workspace/mechfight-kit/protocol.md` | Official rules and protocol. |
| `/workspace/mechfight-kit/README.md` | Kit usage, 48 practice matches, `check.py`. |
| `/workspace/watch/ladder.md` | Skill ladder from showdowns (regenerated Sat 10:23 AM ET). |
| `/workspace/watch/findings.md` | Aggregate watcher tables (Sat 10:20 AM ET, 62 showdowns + public matches). |
| `/workspace/watch/tables-partial.md` | Partial older tables. |
| `/workspace/watch/research-doug-0040/` | `q1.py` / `q2.py` and `.out` behind research-0040. |
| `/workspace/watch/stream/`, `/workspace/watch/recordings/` | Raw live/state jsonl. Useful, large, not in the repo. |
| `/workspace/leaderboard.txt` | Friday ~9:40 PM ET board only. Stale. |
| `/workspace/plan.md` | Local plan copy; prefer the repo `AI-Structure-Development.md`. |

No separate "Mech Wild Sim" output tree was found under `/workspace` for this dossier (the name did not match a directory). Tester paired runs and `tools/sim/` are the sim record that exists.

### GitHub pull requests

85 PRs in `dmclaughlin-bit/mech-bot` at the time of writing (27 merged, 36 closed unmerged, 22 open). Site-tested build PRs are in §3. Open build PRs (not a to-do list): #35 B20, #36 B22, #42 B26, #44 B28, #45 B29, #48 B31, #49 B34, #52 B42, #53 B38, #55 B54, #56 B56, #58 B33, #66 B72, #67 B47, #69 B49, #70 B51, #72 B78, #75 B55, #77 B84, #83 B96, plus research intakes #39 and #41. **Do not merge or close these as part of reading this file.**

### Gaps (data that is missing)

- Rank-32 **team name** at 8:50 AM ET is not in `coord/log.md` (score 5.25 is).
- The paraphrase "67–81%" is not a single cited measurement; use §8.1.
- Our **site** laser-by-30 s is unknown (no practice replays).
- Paired sim delta of **B60 vs B30** is not in `tester/results.txt` (absolute means are).
- Paired sim of **B48 vs B30**, and of most pre-B24 builds, is unknown.
- B21/B23 pre-check figures in the log are not fully reconstructed as `results.txt` pairs vs `38ce57b`.
- Site noise / SE is unknown.
- P10 alone and P13 were never tested.
- No committed snapshot of the 8:50 AM ET full leaderboard (only the log's rank 1 / 32 / our place).
- Wild Sim outputs under that name were not found.
- `EXPERIMENTS.md` stops being authoritative after early Saturday morning.

---

*End of dossier. If a later site score or a new champion exists, this file is stale — check `coord/log.md` first.*
