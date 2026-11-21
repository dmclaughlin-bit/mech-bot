# Coordinator learnings

Grok's memory between chats (see `GROK_BRIEF.md`). Grok writes the bullets in its "Learned" and "Process changes" sections; Diego's Claude commits them here. Keep it short: overwrite a line when it turns out wrong instead of adding a contradicting one.

## Game and scores
- Score ≈ how many mechs die before us, on average (protocol §4). At 2.17–2.23 only about 2 mechs die before we do, so we are usually among the first few eliminated.
- S1 `76aabfa` 1.67 (BB-92A5D3DC, Fri 7:50 PM). S2 `4726cfc` 2.17 (BB-91057C0A, Fri 8:55 PM, Build 2). S3 identical `4726cfc` 2.17 (BB-89ECDFF6, Fri 9:21 PM), Δ 0.00 vs S2. Build 3 `406ab9f` 2.23 (BB-955D92D8, Fri 9:27 PM, Z1 nav, PR #7), Δ +0.06 vs Build 2 mean; KEEP on mechanism. Current best and auto final entry.
- Board Fri 9:40 PM ET: 108 teams; we are 81st at 2.23; 32nd is 4.04 (TigerBuild; rank 33 tied at 4.04, earlier submission wins). Rank 1 AT 5.40, rank 5 4.92, rank 16 4.33, median 3.53. We are 1.81 below the cutoff and 2.31 below D9's "safely in" line (~4.54).
- Q1: practice looks frozen (same score to two decimals on one identical pair). Stop repeating a scored commit. Keep threshold 1.2 (need 3+ runs of one commit with a spread to re-measure Q4).
- Submit form: repo + optional 40-char commit (empty = default-branch head). No branch field. Unmerged SHAs work. Build 3 scored without the Docker gate after passing `check.py` (p99 2.3 ms, max 4.5 ms). Bun 1-CPU gate (Diego, bun 1.4.4, `taskset`): Build 2 `4726cfc` PASS p99 1.4–2.0 ms; unwired `main` PASS p99 1.1 ms. Full Docker flags still not run.

## Top performers
- Source: 2 complete Top-16 exhibition matches (+ 1 incomplete; a second recording duplicated the same two complete matches) from `wss://watch.joinbuilders.org/live` and `/state`. These are FFA-like, not practice vs the house squad. Useful for weapons, farming, and movement; weaker evidence for finish-wounded or third-partying. Only 2 finished matches: evidence, not new constants.
- Winners Mustikas (seed 594232844) and AT (seed 4038484795) both ended laser+lightning. Laser taken at 12.15 s and 4.05 s; lightning at 150.15 s and 30.95 s. Laser share of winner damage: 72% (7111/9847) and 84% (5048/6022). Mustikas 34 cubes, 7 upgrades (laser_damage ×2, plating, nanites, sensors, capacitor, gyros), all 3 supply drops. AT 24 cubes, 6 upgrades (laser_damage ×2, armor, nanites, servos, capacitor), 0 drops in a shorter win (final radius 380 m).
- Winners' mean zone d/r 0.39 and 0.43, 0% time outside the zone, nearest enemy 152 m and 159 m, boost 7% and 11%, air 0%. High-boost/high-air bots died early. 43% and 54% of winners' mech hits were on targets already under 50% HP. Gun-only end loadouts usually mid-to-late with 0 kills (best gun-only: Hishu 4th, 168 s, 0 kills). Several early gun-fight deaths in 9–30 s.
- Qualify-first map: next coding is F3/F4/Q2 (break LOS, heal, leave sight cones) vs the hunting squad — already in the brief's qualifying order, ahead of Build 4. Early laser seek and safe NPC farm (L1/L2/L5) would add DPS and HP and should be proposed as the following build, by plan PR, not as a silent reorder. F5/F6 wait.

## Process
- D9 (PR #9): qualify first. Until ~0.5 above 32nd, practice score is the target and any knob may be tuned; then back to final-first with only `aggression` on practice. Hard caps H1–H3 stay. Follow the brief's qualifying order; change it only with a stated reason and a plan PR for inserts the brief did not already authorize.
- Grok submits and reads scores on the Builders site (Doug's request). Diego logs the `EXPERIMENTS.md` row from those numbers. This overrides the brief's "Diego submits" line until that line is updated by PR.
- Ignore plan §3 time-of-day windows in prompts; still give a realistic target time. Lock Sun 9:00 AM ET and deadline 11:00 AM stay fixed.
- Knob sweeps (3 values, one submission per setting; no repeats while practice looks frozen) wait until a mechanism build is in, or a slot would sit empty. A small tweak will not close a 1.81 gap.
- No official practice replays (Q2). Exhibition matches can be recorded from the watch stream; keep a small recorder + analyzer in `tools/`. Do not commit raw multi-MB jsonl to the public repo.
