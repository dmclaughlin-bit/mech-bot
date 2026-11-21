# Audit batch (PR #98 hypotheses H07, H09; Build 108 screen) on champion 42a19d7

Local sim only; no repo writes. origin/main is bec45aa (docs on top of the champion 42a19d7); the bot code screened is 42a19d7 in `/tmp/audit-main`.
**Build 108 (`build-108-finish-burst`) does not exist on origin** (branches there: build-96-latefinish, build-98-nofinish40; no ref or PR ref for 108 in `git ls-remote`), so the H01 hazard screen was skipped. Instead the same hazard counts are given for main 42a19d7 as a reference for when 108 lands.

**Weak evidence warning.** The sim's house squad is invented (`tools/sim/house.ts`, ASSUMPTIONS.md): house bots pick the nearest ground weapon for an empty slot (so mortar carrying is whatever the loot placement gives), they shoot on a made-up schedule, and hunter timing is assumed. Nothing below is a measurement of the real server.

How measured: 6 runs of main (SEED_BASE 0, 5000, 9000, 2000, 3000 at 96 seeds; 2147483600 at 48) = 528 matches. Bot wrapped by `/tmp/stress-harness/wrap-main.ts` (times `act`, records outputs and positions, behavior unchanged). H07/H09 ground truth comes from read-only probes in a copy of the sim driver, `/tmp/audit-sim/run.ts` (no state changes, no rng use; `tools/sim` untouched). Check: 8 seeds with the probes and without gave identical result rows. Source of a sound = nearest house mech within 4 m of the sound position (the bot never sees this; protocol sounds carry only kind, noisy bearing (sd 7 deg), near/mid/far band and age; own sounds are not reported).

## H07 sound-guided late hunt (after 120 s)
- Only 93 of 528 matches (17.6%) reach 120 s; 130.6 match-minutes in total.
- Sounds heard after 120 s, per match reaching 120 s: gun 62.6, laser 4.4, death 1.6 (lightning 2.4, mortar 4.9). Per minute: gun 44.6, laser 3.1, death 1.1.
- Pointing at an enemy we cannot see: gun 4.9% of gun sounds, laser 4.4%, lightning 2.7% (gun+laser+lightning 4.8%). Almost all sounds come from enemies already in view. All 145 death sounds are of course from a dead mech (nothing to see).
- Distance of those unseen sources (gun, laser, lightning, death): p25/median/p75 = 63/88/107 m; 95.6% within 160 m; 1.1% beyond 300 m. While idle (nothing in view, HP at least 90%, in zone): 91/104/133 m (n = 49).
- The H07 gate (idle, after 120 s) is open 56.9% of late decisions, but a gun/laser/lightning/death sound heard in the last 5 s occurs in only 2.2% of those (967 decisions, about 97 s in total) and in only 25 of the 93 matches; the median match has 0 s of it.
- Reading: in this sim the late-hunt trigger would fire rarely (about 1 match in 4 of those that get to 120 s, for seconds). The channel is thin; it is weak evidence because the house model sets how much the squad shoots while we cannot see it.

## H09 cook-off bonus (laser vs mortar holder)
- A house mech holds a mortar at some point in 98.7% of matches (521/528), 3.7 distinct holders per match on average; 23.8% of alive enemy-seconds hold a mortar (32.4% after 120 s); 244 mortar enemy-seconds per match.
- A mortar holder is visible to us in 16.4% of all decisions, 28.6% of decisions with any enemy in view; in 376 of 528 matches we see one at some point. 33,385 of those 68,522 visible-mortar decisions (48.7%) happen while we hold a laser, which is the case H09 rewards. A mortar holder is the nearest visible enemy in 57.9% of them. (The bot's actual target is not observable from outside the bot; nearest is a proxy.)
- 318 of our 1,682 kills (18.9%) were mortar holders. We took 357 mortar hits (69,466 damage, 195 per hit) and 59 of our 513 deaths (11.5%) were by mortar.
- Reading: mortar carriers are common in the sim, so the H09 change would touch many games in the sim. Whether real house bots carry mortars this often is the open question; the sim only says it does if loot works the way the sim assumes.

## Hazard screen counts on main 42a19d7 (B108 stand-in)
- No crash, exception, NaN or non-finite output, missed answer, answer over 50 ms or "bot not ready" in 528 matches; every match fired.
- Timing (in-process act, ms): max 25.3 (SEED_BASE 2000), worst per-match p99 8.5, 0 ticks over 30 ms in 418,206 ticks.
- Pinned in zone for 20 s or more: 14 matches; pinned outside the zone (zone escape not progressing) for 10 s or more: 7; zone deaths 5 (0: 1, 5000: 1, 9000: 1, 3000: 2); oscillation windows: 51 matches; death before 20 s: 16. On the four sets also screened for B80 (0, 5000, 9000, 2147483600) counts are in the same range as B80's (see the b80_count column).
- Seed lists and reproduce commands are in `/tmp/audit-hazard-screens.csv`.

Files: `/tmp/audit-hazard-screens.csv` (hazard_screens.csv columns), `/tmp/audit-h07-h09.csv` (columns: screen, hypothesis, seed_base, n_matches, metric, value, definition, caveat), per-seed probe JSON in `/tmp/audit-probe/`, run CSVs `/tmp/audit-main-<base>.csv`.
