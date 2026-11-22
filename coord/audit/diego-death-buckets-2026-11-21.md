# Champion death buckets (idea factory step 1)

**Labels:** station: diego-mac, sim-only, not screened by Sim Tester. Run 9:30 PM ET Sat Nov 21.

**Data:** champion P29 `2e1d036`.
- 384 house-bot games (P-D-015, plain d548479 sim).
- 384 vs-15-champions games (P-D-016).
- Placements lost per game = place − 1, summed over the set.

P34 rebuilt (`0e6fadd`, site 4.38, main `8c130ad`) only adds the lethal laser release, which never fires before 40 s.
So these buckets still describe the current champion.

## House-bot set (n=384, 373 deaths, 4,331 placements lost)

Top fine buckets:

| # | killer tier | weapon | time | our loadout | n | placements lost | share |
|---|---|---|---|---|---|---|---|
| 1 | expert | gun | <40 s | gun only | 18 | 248 | 5.7% |
| 2 | hard | gun | <40 s | gun only | 18 | 245 | 5.7% |
| 3 | expert | gun | 40-120 s | gun+laser | 22 | 222 | 5.1% |
| 4 | hard | gun | 40-120 s | gun+laser | 16 | 154 | 3.6% |

Share of placements lost, one dimension at a time:

| dimension | split |
|---|---|
| loadout | gun only 44.7% (avg place 14.4), gun+laser 28.5%, gun+lightning 17.2% |
| time of death | 40-120 s 50.0%, <40 s 33.9%, 120-240 s 12.2%, >240 s 3.9% |
| killer weapon | gun 59.0%, laser 16.3%, mortar 14.8%, lightning 7.3% |
| killer tier | expert 36.0%, hard 33.1%, medium 17.7%, easy 10.6% |

## vs-15-champions set (n=384, 352 deaths, 2,961 placements lost)

| killer weapon | time | our loadout | n | placements lost | share |
|---|---|---|---|---|---|
| gun | <40 s | gun only | 107 | 1,270 | 42.9% |
| laser | <40 s | gun only | 34 | 406 | 13.7% |

Across the whole set, deaths before 40 s account for 71.8% of placements lost, and dying with the gun only for 69.4%.

## Reading

Both sets point at one weakness: **we lose most placements in the first 2 minutes, in gun fights, while still holding
only the gun.**

## Knobs behind the top situations

All references are file:line on 2e1d036 and are unchanged on main.

**A. Dying while still gun-only:**
- `LASER_RUSH_S` 45 (params.ts:82)
- `LASER_TRIP_M` 250 (params.ts:84)
- `LASER_CHASE_S` 20 (params.ts:86)

**B. Early gun fights lost to hard/expert:**
- `retreatHp` 0.30 (params.ts:9)
- `aggression` 1.5 (params.ts:22)
- `ENGAGE_FINISH_HP` 0.35 (params.ts:61)

**C. Gun fights at 40-120 s:**
- `gunRange` 100 (params.ts:7)
- `HEAL_HP` 0.9 (brain.ts:78)
- `STANDOFF_BREAK_S` 60 (params.ts:131)

## Step 2 (running)

Targeted sweeps on the current champion `8c130ad`, house-bot sim, against a fresh Mac baseline.
- **Order:** aggression, retreatHp, LASER_RUSH_S, ENGAGE_FINISH_HP, LASER_TRIP_M, gunRange.
- **Values:** 4-6 per knob.
- **Keep rule:** a value is kept only if the trend holds on both sets, it scores more than +0.05 on both sets, and died<40 is not higher.
- **Confirmation:** survivors are confirmed on bases 6000+7000.
- **Cap:** about 2 h.
- The ranked candidates will be added here for Grok to decide on.
