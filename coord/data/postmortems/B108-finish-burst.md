# B108 finish-burst post-mortem (`aeb6f85`, PR #101)

Site result (source of truth): **B108 scored 3.75 vs the P-B-001 champion's 4.06**. This note is a local-sim post-mortem of why the finish-burst rule changes games. Sim Δ is information only; it is not a veto and it does not rank builds.

Compared: B108 `aeb6f85a12f319f2881281071332f9685871080a` vs champion `42a19d7f56770855d7583f569e1b2ebbae630822`, seed bases 2000, 3000, 4000 and 5000, 96 seeds each (n=384). Official CSVs: `/workspace/tester/runs/{42a19d7,aeb6f85}-{2000,3000,4000,5000}.csv`.

Written Saturday 21 Nov 2026, 2:00 PM ET. Not committed.

## Method

A read-only wrapper (`/workspace/tester/pm-b108/wrap.ts`) ran the unchanged B108 bot and returned its actions as-is. It does not modify bot code, the sim engine, or house AI. It imports `createBot` / `run` / `loadMap` / `clearLine` from `/tmp/sim-aeb6f85` and the official runner copy at `/workspace/tester/pm-b108/run.ts` (engine, house AI and geom still imported from `/workspace/wt-tester`).

Per-seed scores and kills from the wrapper matched the official B108 CSVs on all 384 seeds.

Two event types were logged, both using the bot's published formulas and finish guards (`in_zone`, `ENGAGE_FINISH_HP` 0.35 of max HP, `alone()`, `rested()`, `outlive()` / ttk < ttd):

1. **New-burst commit** — the summed `ourBurst` rule would take a finish and `ourMagazine` would not (`hp > magazine` and `hp <= burst`). A commit is the first tick of that window on a target (latch / give-up copied from the bot).
2. **Refused finish** — `ourMagazine` would take a finish and `ourBurst` would not (`hp <= magazine` and `hp > burst`). The new rule can be *tighter*: gun burst uses current ammo (a full mag only if a reload ends within 1 s); laser burst is 0 when cooldown > 0.5 s, while `ourMagazine` still counts one laser shot.

"Laser actually charged" means `charge > 0` on the held laser. "Laser in the burst" means cooldown ≤ 0.5 s (the term `ourBurst` adds). Enemies with line of sight on us are counted with the bot's `seenAt` (no FOV wedge: an attacker already looking at us, plus terrain via `clearLine`). Kill time is a `kill` event for that target minus commit time (the protocol only emits `kill` when we got the kill). Death within 10 s is official `death_t` minus event time, with `killer_weapon` from the official CSV.

### Limits (not guessed)

- Zone-leave (`leaveNow`) used the bot's straight-line trip and its 2×-path bound, without re-running nav. 5 of 113 new-burst commits were flagged `leaveNow_uncertain`.
- `engageGiveUp` / latch were reimplemented in the wrapper, so a small number of windows could be off the bot's internal state.
- The champion was not wrapped, so "the old rule would have finished" is the magazine predicate on B108's observations, not a watched champion action.
- If a field is not in a table below, it was not measured.

## Official paired results

| Seed set | n | Sim Δ ± SE | Better / tied / worse | B108 kills | Champ kills | Δkills / match |
|---|---:|---:|---|---:|---:|---:|
| 2000 | 96 | −0.010 ± 0.229 | 17 / 59 / 20 | 308 | 318 | −0.104 |
| 3000 | 96 | −0.177 ± 0.184 | 16 / 54 / 26 | 308 | 324 | −0.167 |
| 4000 | 96 | −0.146 ± 0.193 | 20 / 50 / 26 | 329 | 344 | −0.156 |
| 5000 | 96 | −0.208 ± 0.187 | 17 / 56 / 23 | 326 | 340 | −0.146 |
| 2000+3000 | 192 | −0.094 ± 0.147 | 33 / 113 / 46 | 616 | 642 | −0.135 |
| 4000+5000 | 192 | −0.177 ± 0.134 | 37 / 106 / 49 | 655 | 684 | −0.151 |
| all four | 384 | −0.135 ± 0.099 | 70 / 219 / 95 | 1271 | 1326 | −0.143 |

B108 means (official): 3.427, 3.417, 3.708, 3.583. Champion means: 3.438, 3.594, 3.854, 3.792. Died before 40 s: B108 104, champion 110.

## Worse seeds vs better seeds

Among the 165 games whose score changed:

| Group | n | Δscore ± SE | Δkills | Δplace | Δdeath_t (s) |
|---|---:|---:|---:|---:|---|
| Worse | 95 | −2.305 ± 0.185 | −2.168 | +2.305 | −15.36 (n=92; 3 games missing because one side had no death time) |
| Better | 70 | +2.386 ± 0.225 | +2.186 | −2.386 | +24.29 (n=69; 1 game missing a death time) |
| Tied | 219 | 0 | −0.009 | 0 | −1.20 (n=212; 7 missing) |

When the build changes a game, the swing is large either way. There are more worse games than better ones, and on worse games B108 gets about two fewer kills and dies about 15 s earlier.

Every one of those 165 changed games had at least one **refused** finish (old magazine rule would have fired, burst would not). Only 29 of 165 also had a **new-burst** commit.

| Group | Games | Games with a new-burst commit | Games with a refused finish |
|---|---:|---:|---:|
| Worse | 95 | 20 | 95 |
| Better | 70 | 9 | 69 |
| Tied | 219 | 36 | 134 |
| All | 384 | 65 | 298 |

## The 3–5 main failure patterns

### 1. The new rule often *refuses* a finish the champion would take (this is the common change)

`ourBurst` is frequently smaller than `ourMagazine`. That produced **786 refused-finish windows in 298 of 384 games**. It showed up in **95 of 95 worse games** and 69 of 70 better games. This is the event that actually appears in every changed game.

At those windows: mean target HP 439, mean magazine 585, mean burst 210, mean distance 83 m. B108 later got the kill in only 29 of 786. In 40 of 786, B108 died within 10 s (34 to another enemy: 19 gun, 10 laser, 5 lightning; 6 to a mortar; 0 to the zone).

Why burst was below the magazine (mutually exclusive, n=786):

| Reason | Windows |
|---|---:|
| Gun in reach, ammo below a full magazine (laser not the blocker) | 439 |
| Laser held but on cooldown > 0.5 s, and gun ammo was partial/low | 155 |
| Burst was 0 and the laser was not in the burst (typically an empty gun) | 75 |
| Laser on cooldown > 0.5 s and gun ammo 0 | 74 |
| Laser on cooldown > 0.5 s, no gun in reach | 43 |

Gun ammo was recorded in 743 of 786 windows, mean 3.9 rounds. Ammo was 0 in 182 windows. `ourMagazine` still prices a full gun magazine and, when a laser is in range, one laser shot even if it cannot start charging yet.

Refused windows were earlier in the match than new-burst commits (median 24.8 s vs 38.3 s). Counts by seed set: 365 windows in 141 of 192 games on 2000+3000; 421 windows in 157 of 192 on 4000+5000.

This pattern alone does not say "refusing a finish always hurts": it also happens in better and tied games. Combined with the worse/better table, the net effect of changing those finish decisions is more lost games than gained, with lost games short on kills and earlier deaths.

### 2. Extra summed-burst commits are uncommon, and most of them do not get the kill

The rule the build advertised — finish when HP is above a single magazine but inside the summed burst — fired **113 times in 65 of 384 games**. B108 got the kill in **44 of 113** (mean time to kill 2.45 s, median 2.45 s). **69 of 113** ended in a disengage / give-up without a kill (1 of those was a switch to another target).

Typical snapshot at commit (n=113):

- Target HP mean 793.5 (median 762, range 545–1915)
- Our HP mean 1167 (median 1153; 0.752 of max). 14 commits were below 50% of our max HP.
- Magazine mean 650, burst mean 969 (burst − magazine mean +319). Target was on average 144 HP above the old magazine and 176 HP inside the burst.
- Distance mean 88 m, median 76.5 m
- Weapons in reach: gun+laser 104, gun+lightning 7, lightning+laser 2
- Enemies with line of sight on us: 93 commits with 1, 20 with 0 (the finish rule allows a target that does not itself have LOS, as long as no *second* enemy does)
- Laser held: 106/113. Laser counted in the burst (cooldown ≤ 0.5 s): 106/113. Laser actually charging (`charge > 0`): **34/113**

So the usual extra commit is "gun plus an in-range laser that is allowed in the sum but is not yet charging," often at long range.

Kill rate by whether the laser was already charging:

- Laser in the burst but not charging: 31 kills, 41 no kill, 9 died within 10 s (of 72)
- Laser actually charging: 13 kills, 21 no kill, 1 died within 10 s (of 34)

Gun+lightning extra commits: 0 of 7 got the kill.

### 3. After an extra commit, death within 10 s is uncommon; when it happens it is always another enemy

**11 of 113** new-burst commits were followed by our death within 10 s (mean 7.40 s). **10 of those 11 did not get the kill.** Cause from the official CSV, all 11: **another enemy** (9 gun, 1 laser, 1 lightning). **None were the zone or a mortar.**

These 11 are listed in the appendix. They are not the main volume of the drop (most extra commits neither kill nor get us killed in 10 s; they just fail to finish).

### 4. Close-range extra commits fail more often than long-range ones

| Distance at commit | n | Kills | Died within 10 s |
|---|---:|---:|---:|
| < 45 m | 20 | 3 | 4 |
| 45–65 m | 19 | 8 | 3 |
| 65–90 m | 28 | 13 | 2 |
| 90 m or more | 45 | 20 | 2 |

Walking in under a summed burst that includes an uncharged laser, at short range, is the worst extra-commit bucket by kill rate and by deaths inside 10 s. Long-range extra commits still miss more often than they hit (20 of 45), but they rarely get us killed in 10 s.

### 5. On worse seeds the match ends earlier and with fewer kills; extra commits are not required for that swing

Worse seeds (n=95): Δkills −2.168, Δplace +2.305, die 15.36 s earlier (n=92). Better seeds (n=70): Δkills +2.186, Δplace −2.386, live 24.29 s longer (n=69).

Only 20 of 95 worse games had a new-burst commit (those 20 were a bit worse than the other 75: Δscore −2.950 vs −2.133; Δkills −2.750 vs −2.013). The other 75 worse games still all had at least one refused finish. So the sim drop is not mainly "we over-committed into a 2-on-1." It is mainly "we passed up magazine finishes the champion would have taken, and sometimes we also added a summed-burst commit that often did not kill."

## New-burst commit field summary (all 113)

| Field | Value |
|---|---|
| Games with ≥1 commit | 65 / 384 |
| Commits | 113 |
| Got the kill | 44 (mean 2.45 s) |
| No kill | 69 (68 disengage, 1 switch) |
| Died within 10 s | 11 (10 without a kill); all another enemy |
| Laser charged / in burst / held | 34 / 106 / 106 |
| LOS on us = 0 / 1 | 20 / 93 |
| `leaveNow_uncertain` | 5 |

Raw per-commit JSON (including target HP, our HP, weapons in reach, laser charge and cooldown, LOS count, kill time, close reason): `/workspace/tester/pm-b108/out/{2000,3000,4000,5000}/s<seed>-p*.json`. Pass-1 JSON without refused windows is under `/workspace/tester/pm-b108/out-pass1/`.

## Appendix: the 11 new-burst commits followed by death within 10 s

| Base | Seed | Commit t (s) | Death Δt (s) | Got kill | Killer weapon | Our HP | Target HP | Dist (m) | LOS on us | Laser charged | Score Δ |
|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---|---:|
| 2000 | 2025 | 107.10 | 8.65 | no | gun | 1663 | 1915 | 37.29 | 1 | yes | 0 |
| 2000 | 2042 | 41.10 | 9.80 | yes | gun | 860 | 698 | 94.39 | 1 | no | 0 |
| 2000 | 2040 | 24.40 | 7.35 | no | laser | 1018 | 815 | 50.81 | 1 | no | −2 |
| 3000 | 3039 | 26.40 | 8.05 | no | gun | 846 | 838 | 94.21 | 1 | no | 0 |
| 4000 | 4019 | 247.60 | 4.90 | no | lightning | 1932 | 1456 | 66.87 | 0 | no | +8 |
| 4000 | 4048 | 230.90 | 8.20 | no | gun | 933 | 1206 | 41.22 | 0 | no | +3 |
| 4000 | 4011 | 29.60 | 4.45 | no | gun | 590 | 716 | 33.93 | 1 | no | 0 |
| 5000 | 5075 | 33.10 | 8.25 | no | gun | 1245 | 547 | 83.24 | 1 | no | −2 |
| 5000 | 5043 | 65.80 | 4.50 | no | gun | 1464 | 754 | 32.48 | 0 | no | 0 |
| 5000 | 5029 | 44.20 | 8.85 | no | gun | 644 | 590 | 62.09 | 0 | no | −2 |
| 5000 | 5029 | 44.70 | 8.35 | no | gun | 644 | 590 | 60.56 | 0 | no | −2 |

Seed 5029 is two commits 0.5 s apart on the same match, both followed by the same death.
