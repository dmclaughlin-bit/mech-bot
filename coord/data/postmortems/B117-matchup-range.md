# B117 loadout/HP matchup-range post-mortem (`4e39389`, PR #123)

Site result (source of truth): **B117 scored 4.08 vs the B113 champion's 4.17** (receipt BB-A84FCC28). This note is a local-sim post-mortem of where the matchup-range rule changes games. Sim Δ is information only; it is not a veto and it does not rank builds. In this screen the sim is a small *positive* delta, so it does not by itself explain the 0.09 site drop.

Compared: B117 `4e393894ef69450a72dc67360bb532af1bbb74b6` vs champion `6182d29c673d99f5186d742a5f019c0b007234f2` (B113, site 4.17), seed bases 2000 and 3000, 96 seeds each (n=192). Official CSVs: `/workspace/tester/runs/{6182d29,4e39389}-{2000,3000}.csv`.

Written Saturday 21 Nov 2026, 4:01 PM ET. Not committed.

## Method

A read-only wrapper (`/workspace/tester/pm-b117/wrap.ts`) ran the unchanged B117 or champion bot and returned its actions as-is. It does not modify bot code, the sim engine, or house AI. On the same observation it also ran the other bot as a shadow and logged move and fire differences, visible enemies, and supply drops. Engine, house AI and geom were imported from `/workspace/wt-tester`.

Per-seed score, kills, place, death time, weapons and killer from the wrapper matched the official CSVs on all 192 seeds for both bots.

A **matchup-range decision** is a tick, on that bot's own trajectory, where the primary move vector differed from the shadow's by more than 0.05 and a living enemy was in view. **Back off** means the primary was walking away from that enemy (toward-component ≤ −0.3) and the shadow was not. **Close in** means the primary was walking toward it (≥ 0.3) and the shadow was not. Fire never differed on the same observation (0 ticks in 192 games). Windows are contiguous runs of the same kind, split when the gap is more than 1.2 s.

Drop-run **attempts** count approaches of at least 8 ticks toward a still-falling called drop within 200 m (DROP_RUN_M). A **completed** capture is an observation event of type `drop`. Fighting ticks are decisions with a visible enemy and either a shot or a toward-component ≥ 0.4. Survival uses official `death_t`.

### Limits (not guessed)

- Shadow actions are "what the other bot would do on this observation stream," so after the first move difference they are not an independent game. Game outcomes always come from the official paired CSVs.
- Mode strings (`engage, …, mu in/out`) are not in the protocol, so a move was classified from the two bots' move vectors, not from the bot's internal `want` / `note`.
- Farm walks to already-landed drops are not counted as drop-run attempts.
- If a field is not in a table below, it was not measured.

## Official paired results

Gate: PASS. 96/96 on bases 2000 and 3000 for both bots. Missed answers 0, bot not ready 0. Answers over 50 ms: champion 2 / 2, B117 2 / 0 on bases 2000 / 3000. All of those still applied. No crashes.

Flag-0: `MATCHUP_ON=false` in an uncommitted local temp copy of `params.ts` (not committed or pushed) is behavior-identical vs `6182d29` on all 96 seeds of base 2000 (score and all behavioral fields). 89/96 seeds differ only in timing fields (`bot_ms_mean`, `late_over_50ms`).

| Seed set | n | Sim Δ ± SE | Better / tied / worse (changed) | Kills/match (champ) |
|---|---:|---:|---|---:|
| 2000 | 96 | +0.188 ± 0.168 | 4 / 90 / 2 (6) | 3.46 (3.34) |
| 3000 | 96 | −0.042 ± 0.042 | 2 / 91 / 3 (5) | 3.27 (3.31) |
| 2000+3000 | 192 | +0.073 ± 0.087 | 6 / 181 / 5 (11) | 3.36 (3.33) |

B117 means (official): 3.667, 3.542. Champion means: 3.479, 3.583. Set totals (B117 / champ): kills 646 / 639, died <40 s 56 / 56, laser by 30 s 57 / 57.

## Survival, deaths, drop runs, engagements

| | B117 | Champion |
|---|---:|---:|
| Alive at 60 s | 86 | 86 |
| Alive at 120 s | 32 | 33 |
| Alive at 180 s | 23 | 24 |
| Died < 40 s | 56 | 56 |
| Called-drop attempts (games) | 14 (10) | 13 (9) |
| Completed drop captures (games) | 5 (4) | 5 (4) |
| Fighting ticks (share of decisions) | 52861 (0.352) | 52500 (0.349) |

Completed captures landed at the same five times in the same four games: 123.8, 141.2, 147.3, 169 and 285.2 s. Killer weapons over all 192 games were essentially the same (B117 / champ): gun 118 / 117, laser 33 / 32, mortar 23 / 23, lightning 10 / 11, survived 5 / 6, npc 2 / 2, zone 1 / 1.

On the 5 worse games B117 fought less (2133 vs 2609 ticks). On the 6 better games it fought more (2838 vs 1929). On the 181 tied games the counts were 47890 vs 47962.

## Where the rule actually changes a decision

The new rule is idle in most games. On B117's trajectory it changed the move in **17 of 192 games**: **18 back-off windows (101 ticks) in 11 games** and **13 close-in windows (71 ticks) in 6 games**. No game had both kinds. The first such window had a mean time of 52.9 s (median 43.2, range 16.5–121). The champion's trajectory showed the same 17 seeds (18 hold-vs-back windows, 8 hold-vs-close windows).

All **11** score-changing games had at least one of these windows. The other **6** games also moved differently and still tied on score: 2000/2004, 2000/2006, 2000/2048, 3000/3018, 3000/3035, 3000/3077.

## Worse seeds vs better seeds

Among the 11 games whose score changed:

| Group | n | Δscore ± SE | Δkills | Δplace | Δdeath_t (s) |
|---|---:|---:|---:|---:|---|
| Worse | 5 | −2.800 ± 1.114 | −2.600 | +2.800 | −12.28 (n=3; 2 games missing because the champion had no death time) |
| Better | 6 | +4.667 ± 1.667 | +3.333 | −4.667 | +42.44 (n=5; 1 game missing because B117 had no death time) |
| Tied | 181 | 0 | 0 | 0 | −0.04 (n=177; 4 missing) |

When the build changes a game, the swing is large either way. There are about as many better games as worse ones in this sim; the better swings are larger, which is why the paired mean is slightly positive.

| Seed | Δscore | Champ place / kills / death | B117 place / kills / death | First matchup move (B117 trajectory) |
|---|---:|---|---|---|
| 2000/2008 | +7 | 12 / 4 / 77.7 s gun | 5 / 5 / 221.95 s gun | back off 52.4 s, 71.6 m, our HP 144, gun foe |
| 2000/2019 | +1 | 12 / 3 / 68.4 s gun | 11 / 5 / 72.95 s gun | close in 33.0 s, 57.7 m, our HP 452, gun foe |
| 2000/2024 | +9 | 12 / 4 / 40.8 s gun | 3 / 11 / 100.45 s gun | back off 33.5 s, 80.4 m, our HP 375, gun foe |
| 2000/2025 | +9 | 10 / 6 / 189.85 s gun | 1 / 14 / survived | back off 61.8 s, 43.4 m, our HP 1320, gun+lightning foe |
| 2000/2034 | −7 | 1 / 14 / survived | 8 / 8 / 109.05 s gun | close in 53.8 s, 83.1 m, our HP 260, gun+laser foe at 40 HP |
| 2000/2038 | −1 | 11 / 5 / 58.8 s gun | 12 / 4 / 49.35 s gun | back off 38.1 s, 66.6 m, our HP 419, gun+mortar foe |
| 3000/3012 | −3 | 1 / 15 / survived | 4 / 12 / 86.05 s laser | back off 43.2 s, 65.9 m, our HP 444, gun foe |
| 3000/3037 | +1 | 13 / 3 / 189.35 s laser | 12 / 4 / 190.60 s mortar | back off 16.5 s, 61.1 m, our HP 350, gun foe |
| 3000/3038 | −2 | 9 / 7 / 103.35 s mortar | 11 / 5 / 75.80 s gun | close in 32.9 s, 40.8 m, our HP 403, gun+laser foe |
| 3000/3056 | +1 | 11 / 5 / 103.95 s laser | 10 / 6 / 106.45 s laser | back off 97.9 s, 39.5 m, our HP 785, gun+lightning foe |
| 3000/3088 | −1 | 9 / 7 / 90.60 s gun | 10 / 6 / 90.75 s gun | back off 63.5 s, 41.2 m, our HP 774, gun+lightning foe |

Matchup windows in those groups (B117 trajectory): worse — 4 close-in windows in 2 games and 4 back-off windows in 3 games; better — 5 close-in windows in 1 game and 10 back-off windows in 5 games; the 6 tied-but-different games — 4 close-in in 3 games and 4 back-off in 3 games.

## The 3–5 main failure patterns

### 1. The rule rarely fires, and this sim does not explain the site drop

Only **17 of 192** games have any movement difference, and only **11** change the score. Fire is unchanged on the same tick (0 differences). The official paired delta is **+0.073 ± 0.087** (6 better, 181 tied, 5 worse). The site score went the other way (4.08 vs 4.17). This screen is a crash / timing / flag-0 check and a map of where the rule bites; it is not a reason the site score fell.

### 2. The two large losses flip a champion win into a mid-game death without lightning

In **2 of 5** worse games (2000/2034, Δ −7; 3000/3012, Δ −3) the champion survived in 1st place with lightning+laser (14 and 15 kills) and B117 died later with only gun+laser: 109.05 s to a gun, and 86.05 s to a laser. Those two games are the whole of the missing death-time rows in the worse-group table, and they account for −10 of the −14 total score across the five worse seeds. The other three worse games are small (−1, −2, −1) and both sides already died mid-game with the same final loadout.

### 3. Closing in on a laser-armed target while already hurt

Close-in is rarer (6 games, 13 windows) but appeared in **2 of 5** worse games, both against a gun+laser foe:

- 2000/2034: 2 ticks at 53.8 s, our HP 260 of 1739, walking in from 83.1 m on a target already at 40 HP.
- 3000/3038: 15 ticks from 32.9 s, our HP 403 of 1400, closing from 40.8 m; B117 then died 27.55 s earlier than the champion (75.80 s to a gun, vs 103.35 s to a mortar).

Close-in also occurred in 1 better game and 3 tied games, so it is not an automatic loss. It is the move in both of the worse games that closed rather than backed off.

### 4. Backing off is the common change, but it is not a consistent failure

Back-off is the usual bite: **11 of 17** affected games, **18 windows, 101 ticks**, including **5 of 6** better games and **3 of 5** worse games. In the large 3012 loss, the back-off at 43.2–45.8 s (HP 444 then 298, about 65 m from a gun) is the only matchup move in that game and precedes the loadout split in pattern 2. The same kind of step is also the first move in the two largest wins (2024 and 2025). The sim does not show back-off systematically hurting.

### 5. Drop runs, early deaths and end-game survival are not the difference

Called-drop attempts were 14 vs 13, and completed captures were **5 vs 5** in the same four games at the same times. Died before 40 s is **56 vs 56**. Survival is 86 vs 86 at 60 s, 32 vs 33 at 120 s, and 23 vs 24 at 180 s. Overall fighting time is almost the same. The 11 changed games, not a broad change in drops or early deaths, are what move the sim mean.

## Official screen (same numbers as above)

This is a screen only. Sim Δ is information, not a veto. The official site score is the only source of truth.

**Gate:** PASS. 96/96 on bases 2000 and 3000. Missed answers 0, bot not ready 0. Answers over 50 ms: 2 / 0 on bases 2000 / 3000 (champion 2 / 2). All of those answers still applied. No crashes.

**Flag-0:** behavior-identical vs `6182d29` on all 96 seeds of base 2000. Method: uncommitted local temp copy with `MATCHUP_ON = false` in `params.ts` (not committed or pushed). 89/96 seeds differ only in timing fields.

**Paired ON vs `6182d29`:**

| Seed set | n | Sim Δ ± SE | Better / tied / worse (changed) | Kills/match (champ) |
|---|---:|---:|---|---:|
| 2000+3000 | 192 | +0.073 ± 0.087 | 6 / 181 / 5 (11) | 3.36 (3.33) |

Set totals (build / champ): kills 646 / 639, died <40 s 56 / 56, laser by 30 s 57 / 57.
