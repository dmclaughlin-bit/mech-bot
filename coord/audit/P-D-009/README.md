# P-D-009: two-horizon race() shadow count (audit H13) (Diego's Claude, Sat Nov 21 5:20 PM ET)

**Answer: the two estimates almost never disagree after 60 s, and when they do the outcomes don't point one way. 9/192 games (2000+3000) and 10/192 (4000+5000) have any disagreement: 11 and 14 fight episodes. Not enough to earn a build.**

Bot: current main bot code (6182d29, B113 4.17) plus a shadow probe (`race-shadow-probe.diff`), no behavior change. All 384 games match the plain main probe run seed for seed (0/384 changed).

## What was compared
At every `race()` use after 60 s (the finish rule's `outlive`, and the hurt TTK rule):
- **Sustained** (what the bot uses): `ttk = hp / ourDps` (mean DPS over a full cycle, including reloads).
- **Burst / state-aware**: simulate our held weapons that reach, from their current state (gun ammo, reload left, cooldown; laser cooldown and charge so far; lightning cooldown and the energy we hold, no regen; mortar cooldown), with the same hit-rate guess and cube bonus, and take the time the expected damage reaches the enemy HP.
- Both use the same `ttd` and the same threshold as the rule (finish: `ttk < ttd`; TTK rule: `ttk < aggression × ttd`).

An episode is a run of disagreeing decisions on the same enemy and rule with gaps of 2 s or less. Outcome means what happened within 10 s after the episode: we killed that enemy, we died, or neither.

## Results

| | 2000+3000 (n=192) | 4000+5000 (n=192) |
|---|---|---|
| Games with any race() use after 60 s | 47 | 57 |
| Games with a disagreement | **9** | **10** |
| Decisions evaluated / disagreeing | 1908 / 91 (4.8%) | 2428 / 79 (3.3%) |
| Finish rule: all episodes (kill / died / neither) | 83 (65 / 4 / 14) | 93 (58 / 2 / 33) |
| ... sustained yes, burst no | 2 (1 / 1 / 0) | 1 (1 / 0 / 0) |
| ... sustained no, burst yes | 2 (1 / 0 / 1) | 4 (1 / 0 / 3) |
| TTK rule: all episodes (kill / died / neither) | 33 (12 / 13 / 8) | 52 (27 / 16 / 9) |
| ... sustained yes, burst no | 4 (1 / 3 / 0) | 5 (3 / 1 / 1) |
| ... sustained no, burst yes | 3 (3 / 0 / 0) | 4 (2 / 2 / 0) |

## Reading
- The finish rule already filters to `hp <= ourMagazine`, so the burst estimate and the mean-DPS estimate land on the same side nearly always. Only 3 and 5 finish episodes disagree.
- The TTK rule (hurt, 1v1) is where a burst model could matter. "Sustained yes / burst no" (we fight on, but our current ammo/reload says the kill comes later) died in 3/4 on 2000+3000 but only 1/5 on 4000+5000. That flips between sets, and the counts are single digits.
- Even if every disagreement turned perfectly, it moves at most ~10 fights per 192 games, around 0.05 kills/game. That's below site noise, which fits B48 and B20+22 losing.

Recommendation: no build. Reproduce with `race-shadow-probe.diff` on main brain.ts (plus the SEED_BASE sim patch), 96 seeds per base with `INSTR_DIR`, then `python3 count.py <dir> <tag>`.
