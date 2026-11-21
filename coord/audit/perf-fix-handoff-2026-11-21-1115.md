# Mech Royale: performance fix handoff for Grokbot

**From:** Diego's Claude (audit thread). **Written:** Sat Nov 21, 11:15 AM ET. **Status:** audit and plan only. No repo changes, no branches, nothing submitted. Diego has not yet approved an experiment.

**Baseline, checked against `main` @ `fea0df4`:** champion is still **B80 `28c3acc`** (merged as `cb93980`), site **3.79**, receipt BB-78A44AAF. Bot code on main has not changed since that merge; every later main commit is a log or doc. Ties since then: B86, B92 and B51 (all 3.79). Losses: B82, B88, B43, B90, B98, B100, B94, B26 (3.48). The board at 10:59 AM ET had us **137th of 256**, with #32 at **5.33**. Slots: 2 of 4 were left in the 11 AM hour, and the next frees at 11:57 AM ET.

**Method:** I instrumented a scratch copy of B80, logging every decision. With the copy's flag off, it matches the champion on 191 of 192 games, and the one that differs comes from the sim's own timing jitter. I ran 192 paired local-sim games on **SEED_BASE 2000 + 3000**, which are fresh seeds, not the 1000–1191 set that PR #86 used. A champion-vs-champion rerun changed 1 of 192 games (−0.005 ± 0.005), so any change below is behavior, not sim noise. The sim is only a screen: its score has r ≈ 0.22 with the site score (`coord/RESEARCH.md` §6). The scripts and diffs are in `/mnt/project-files/mech-royale/audit/perf-audit-tools/`.

---

## 1. Three most important verified findings

**F1. A single hit cancels the early laser walk, and the bot then stands still under fire.** Of the 134 games without a laser by 30 s, 76 knew a laser within 250 m before 30 s. In **62 of those 76**, the main blocker was the rule "no mech hit in the last 3 s" (`brain.ts:643`, `obs.t - lastMechHit > FARM_QUIET_S`). When the walk is blocked, the bot falls through to **"heal" mode, which sets move [0,0] whenever HP is under 90%** (`brain.ts:736`). Regen can't start while we are being shot (it needs 5 s with no damage dealt or taken), so this is just standing still and trading. In the 56 early-death games, **42% of all damage we took landed in "heal" mode**, more than in any other mode (retreat 29%, finish-engage 5%). This independently confirms PR #86's result on different seeds.

**F2. Early deaths start as 1-on-1 fights, then a second hunter joins.** Died before 40 s: **56/192** (score 1.66). Only **18 of 56** had 2+ enemies with line of sight before we first took damage. The second attacker arrives a median **5.9 s** after the first hit, and death follows a median **15.4 s** after that. 31 of 56 early deaths had 2+ attackers in the last 5 s (110 of 188 across all deaths). So "a second hunter overwhelms us" is the end of a sequence that starts with F1. A new positioning system isn't what's missing. Rear damage is about 25% of early-death damage.

**F3. Combat estimates and nav are not where we lose games.** We were engaged (finish or TTK rule) in the last 3 s of **0 of 56** early deaths and **7 of 188** deaths overall. Nav: 7 failed paths in 5 games, 2 laser chase timeouts, and 3 games where a laser's path was over 250 m (re-planned every tick but never stalled). The bot was stuck for 1 s or more in 101 games, mostly on zone travel, retreat and kill-cube collection, not on weapon trips. Decision time is p99 1.3 ms, max 11.6 ms.

## 2. Three highest-priority potential fixes

| Rank | Fix | Evidence | Confidence | Verdict |
|---|---|---|---|---|
| 1 | **UF100: laser walk under fire, first 30 s, laser within 100 m** (PR #86's proposal) | Two independent seed sets agree (below) | Medium | **Build and submit first** |
| 2 | Early version of B100: under single-attacker fire before 45 s, walk to cover instead of "heal" stand-still | F1 + F2. But B100 (after 45 s), B82, B53, B6 and B41 all lost on the site | Low | Park. Only after #1 scores; re-measure first |
| 3 | `ourMagazine` uses the full magazine size, not the current ammo (`brain.ts:297–307`), so the finish rule can commit with an almost empty gun | Code defect, verified by reading | Low impact (F3) | Park. Likely inert |

**Dropped:** a new preemptive-positioning or 8-candidate cover search (it can't be told apart from the B82/B100 losses, and F2 says the gap starts earlier). A readiness-aware combat estimate (engagement is almost never in our death window, and B48/B26 already lost on rate and race changes). A nav "abandon unreachable detour" patch (3 of 192 games, inert).

## 3. Single-change specification (Experiment 1, UF100)

- **Where:** `brain.ts`, rush gate at lines 640–671 on main. Add one flag in `params.ts`: `UNDER_FIRE_RUSH_M = 100` (0 = champion).
- **Change:** `quiet = obs.t - lastMechHit > FARM_QUIET_S`. `ufLaser = obs.t < 30 && UNDER_FIRE_RUSH_M > 0 && some remembered laser within UNDER_FIRE_RUSH_M`. In the gate, replace the quiet test with `(quiet || ufLaser)`. In the options filter, while `!quiet`, keep only lasers within `UNDER_FIRE_RUSH_M` (no lightning under fire).
- **Unchanged:** the `hurt` retreat (HP < 30%), engage, claim, zone, `leaveNow`, `LASER_TRIP_M` 250, `LASER_CHASE_S` 20, `laserSkip`, B60 crossfire, B80 late walk, take, swap and drop. No boost.
- **Expected behavior:** in the first 30 s, after a poke, the bot keeps walking at full speed to a laser up to 100 m away, with the torso still aimed and firing, instead of standing in "heal".
- **How it differs from B64 (site 3.63, lost):** B64 dropped the quiet rule only when **no** enemy with LOS was within 100 m, for any laser at any distance. That skipped exactly the close-shooter cases where we stand and die. I re-ran a B64-style gate on B80 with the same seeds: sim +0.005 ± 0.112, laser by 30 s 58 → 66, **died before 40 s up 56 → 59**. UF100's profile is clearly different (table below).

**Screen results (192 paired games, SEED_BASE 2000 + 3000, vs B80):**

| Metric | B80 | UF100 | B64-style |
|---|---|---|---|
| Sim Δ | — | **+0.250 ± 0.136** (2000: +0.39, 3000: +0.12) | +0.005 ± 0.112 |
| Games changed | — | 37 (26 better, 11 worse) | 40 (19 / 21) |
| Laser by 30 s | 58 | **82 (+24)** | 66 |
| Died before 40 s | 56 | **54** | 59 |
| Gun-only at end | 77 | **60** | 68 |
| Laser at end | 79 | **99** | 86 |
| Lightning at end | 65 | 66 | 68 |
| 2+ attackers at death | 110 | 107 | 107 |
| Kills | 646 | 687 | 647 |
| Decision time p99 / max | 1.3 / 11.6 ms | 1.4 / 31 ms (one tick; recheck in the gate) | — |

PR #86 on seeds 1000–1191 (120 m variant): laser by 30 s 76 → 94, died before 40 s 51 → 47, sim −0.016. Both seed sets move laser by 30 s up and early deaths down. Only the sim score disagrees, and the sim score is the weakest signal.

## 4. Success and rollback thresholds

- **Gate before submitting:** `check.py --map-dir arena` PASS with max under 30 ms. With the flag at 0, actions must match B80 exactly.
- **Behavior veto before submitting:** died before 40 s must not rise by more than 3 of 192, lightning at end must not fall by more than 5, and the sim Δ must not be below −0.3.
- **Site:** keep only if the score is **above 3.79**. On 3.79 or lower, close the PR and set the flag to 0; main and the final entry stay B80. Never click "Pick as our final entry".
- **Minimum submissions:** 1. If it ties, the only follow-up worth a slot is `UNDER_FIRE_RUSH_M = 80` (PR #86's sim +0.016 variant). No third variant.

## 5. Source references

- `brain.ts` (main): rush gate 640–671, "heal" stand-still 736–741, crossfire 729–735, `ourMagazine` 297–307, `race` 574–579, `travel` 316–333.
- `coord/RESEARCH.md` §3, §5–§7; `coord/log.md` 10:57/10:59 AM ET; B64 diff `b889814..f171f20`.
- PR #86 branch `research-20261121-1058`: `research/intake/diego-2026-11-21-1058.json`.
- This audit's scripts: `/mnt/project-files/mech-royale/audit/perf-audit-tools/` (`an.py`, `an2.py`, `cmp.py`, `instrument-plus-uf100.diff`, `run-seedbase-instr.diff`).

## 6. Conflicts and duplicated work

- **PR #86 already proposes this build.** One thread should build it, not two. This audit adds an independent replication and the B64 contrast. It is not a new idea.
- `coord/WORKFLOW.md` says Grok's Claude (Doug's Max) is the only bot-code writer, and Diego's Claude only researches. Diego's prompt to this thread asks it to implement after his approval. **Grok decides which one builds it.**
- Doug's lane is resubmitting old open PRs on B80 (B26, B51 at 10:57–10:59). UF100 touches only the Lane B rush gate. It doesn't overlap any open build PR except #60 (B64, closed) and #55 (B54 "rushtough", open and never site-tested, so **don't submit B54** alongside this).

## 7. Exact recommended instructions for Grokbot

1. Merge PR #86 (intake only), or note that this audit supersedes its numbers on fresh seeds.
2. Assign **one** builder for UF100 per §3, branched from main `fea0df4`. Diego's Claude can build it as soon as Diego approves.
3. Builder runs the gate, a flag-off identity check, and the 192-game screen with §4's vetoes, then posts the table in the PR.
4. Submit in the next free slot (11:57 AM ET or later). Keep only if above 3.79.
5. Stop spending slots on rematches of old open PRs that change few games or are known near-copies (B26 and B51 already went 3.48 and a 3.79 tie). Before any slot, require §3's table: games changed, laser by 30 s, died before 40 s, gun-only and lightning at end, 2+ attackers, stuck, decision p99/max.
6. After UF100 scores, re-run this audit's instrumentation on the new champion before choosing fix #2.
