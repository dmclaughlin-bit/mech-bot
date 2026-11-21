# Tactical Strategy: Survival, Tactics & Combat (Agent 4)

All numbers are `protocol.md` defaults; read the live values from `hello.config`. **[H]** marks a heuristic prior to be tuned.

## 1. Placement math

`place` equals `alive` at your death, so **score = the number of mechs that died before you**. A kill counts only through survival:

- **Kill value** ≈ P(victim would have outlived you) + loot value (their cubes +2, their weapons) − P(you lose) × (points you still expected to earn).
- At alive=16, an even fight (p_win 0.5) risks about 7.5 expected points to gain about 0.5. **Early even fights are strongly negative.** This matches TS-01: when kill reward is small next to placement reward, peaceful play dominates. Here the direct kill reward is zero.
- A kill turns positive with high p_win (target below 50% HP, rear angle, triangle counter), low third-party exposure, or late in the match.

**Practice ≠ final.** The house bots never fight each other. So in practice, score ≈ your kills + house deaths to zone or NPCs + your HP rank at the final collapse. The baseline of 1.15 is roughly "dies after about 1 house bot". A pure hider scores near 0 in practice but well in the final, so don't tune aggression on practice alone (§8).

**Endgame lever.** Zone damage ignores armor. After r reaches 0 (about 415 s), 260 HP/s kills a 1400 HP mech in 5.4 s, and a 1960 HP mech in 7.5 s. **Max HP and being the last mech inside the circle decide 1st vs 4th.** The final center is known once the 25 → 0 phase is announced.

## 2. Time-to-kill (100% hits, 1400 HP, cooldowns and reloads included)

| Weapon | Front | Rear ×1.5 | vs 1960 HP (10 cubes) | Note |
|---|---|---|---|---|
| Gun | **12.2 s** (32 shots) | 7.2 s | 17.5 s | Burst 187 DPS; **sustained ≈102** (mag of 12 = 540 dmg, then 2.4 s reload). 60% accuracy: 21.8 s |
| Laser | 10.35 s (5 shots) | 5.55 s | 15.2 s | ≈131 DPS (0.75 s charge + 1.65 s cooldown). **Vs mortar holder: 3 shots, 5.55 s** |
| Lightning ≤45 m | **5.75 s** (72 energy) | 3.75 s | 8.0 s (99 energy) | 240 DPS, but burns your escape energy |
| Mortar | ≥15.6 s direct | – | – | 1.4 s flight at 100 m; area denial |
| Gun + laser | ≈5.5 s | | | Both slots fire at once |
| Gun + lightning | ≈3.3 s | | | Brawl only |

At 10 cubes your TTKs fall about 29%, and HP × DPS ≈ 1.96× a fresh mech.

- **Rear hits nearly halve your survival time**, so facing the attacker is the cheapest defense. A 180° torso turn takes 0.8 s, and legs are independent, so retreat backwards while facing them.
- Regen heals **50% in ≈20 s** (5 s delay + 15.5 s). Breaking contact for 20 s undoes half a lost fight.
- Retreat if `TTK_them_on_me < 0.8 × TTK_me_on_them`, or HP < 35% under fire **[H]**.
- Push during an enemy gun reload (2.4 s; the `reload` sound carries 60 m).

## 3. Zone

- **Zone dps is 20/35/60/100/160/260, with no regen outside.** Re-entering restarts the 5 s regen timer, so every zone tick is pure loss.
- **Crossing cost = dps × distance / speed.** Walking is 11.7 m/s; boosting is 19.5 m/s for about 115 m on full energy.
  - Phase 1, 100 m: 171 HP walking, 103 boosting. Fine.
  - Phase 4, 50 m: 427 / 256 HP. Only to escape a lost fight.
  - Phase 5+: never.
- **Rule [H]:** cross only if the cost is under 15% of HP and the in-zone path is ≥2× longer or passes an enemy.
- **Rotation.** Phase-1 shrink is about 3.6 m/s, much slower than walking.
  - **Leave when `dist_to_next_inner / (0.8 × 11.7) + 10 s ≥ time_to_shrink_end` [H].**
  - Arrive early and silent: under 5 m/s, a move-vector length ≤0.42. Late rotators are noisy prey.
- **Edge vs center.**
  - Pro guidance (TS-03, TS-04) favors the centroid-facing edge: threats come from one side and rotators walk past you. The center is exposed from all sides.
  - Our 120° wedge suits the edge: zone at your back, wedge aimed inward.
  - At r ≤ 70, take cover nearest the announced final center before the 25 m phase. **The 25 m circle is entirely inside lightning range.**
- **Timeout at 480 s** (survivors ranked by HP) should be rare with the default zone. If the circle is still open late, avoid all damage after about 440 s.

## 4. Supply drops

Each drop is called at 70/140/210 s and lands 25 s later. It gives +3 cubes, full HP and full energy, and its landing makes a 600 m sound.

- **Damage taken during the 4 s capture is refunded** if you finish. One shooter's worst case in 4 s: gun 750 front (1125 rear), laser 630 (2 shots), lightning 960.
- **Contest [H]** when all of these hold:
  - HP > worst-case damage from visible shooters + 150
  - no rival within 80 m (4 s × 19.5 m/s, how far a contester can travel during capture)
  - at most 1 enemy known within 150 m
  - you are pre-positioned 30–60 m away in cover before it lands
- **Third-party** when ≥2 rivals are near the ring: wait 100–200 m out, behind cover, off their wedges. **But a lone survivor finishes the capture within 4 s at full HP.** So either kill them in under 4 s (rear hits or laser + gun on a target below 30% HP), or step into the ring to freeze the clock. Test whether re-freezing resumes or restarts the clock (the protocol is ambiguous).
- **Ignore** when any of these hold:
  - the drop is >250 m off your rotation path
  - HP < 40% with ≥2 enemies near
  - phase ≥4, open ground, ≥3 enemies converging
  - you have ≥10 cubes and full HP (above the cap, cubes only add size)
- **In practice**, the squad shares vision and will likely converge on drops. Verify with replays.

## 5. Weapons, loot, upgrades

- **Best survival loadout: laser + lightning (drop the gun).** It counters the whole triangle:
  - the laser punishes mortar holders (+60%) and outranges the gun (280 vs 230 m);
  - lightning shorts lasers within 45 m and owns the 25 m final circle.
- Runner-up: **gun + laser** (versatile, no energy cost).
- **Don't carry a mortar.** A third of loot is lasers, which deal +60% to mortar holders, and the mortar has self-splash. Exception: lobbing over buildings at final-circle campers.
- **Loot order:** laser or lightning (whichever is closer), then cubes up to 10, then crates.
  - A crate takes 7 gun shots, and the crate sound carries 220 m.
  - A taken weapon can't fire for 1–1.65 s, so never swap with an enemy in view.
- **Cubes.** Up to 10, each gives +4% HP and damage, a clear win. Size grows +5% per cube with no cap: at 10 cubes the silhouette is about 2.25×, which hurts dodging (§7). **Beyond 10, cubes are net negative**, except for upgrade thresholds (15, 21) and drop heals.
- **Upgrade priority [H]:**
  1. Plating (+15% HP; it also counts against zone)
  2. Armor (−8% = +8.7% effective HP against weapons only)
  3. Nanites
  4. Sensors (best for hiding and third-partying)
  5. A primary-weapon upgrade
  6. Mobility upgrades

  Score each choice as Δ effective HP or Δ DPS from `config.upgrades`, and always pick before `expires` (otherwise choice 0 applies).

## 6. Stealth and sound

- **Silent:** ground speed ≤5 m/s. Steps carry 40 m, boost 90 m.
- **Unseen:**
  - Stay more than 45 m from enemies, and outside their 120° wedge or behind buildings. Enemy `aim` is observed, so plan paths through gaps between wedges.
  - Trees hide you from sight but not from shots.
  - The first gun shot reveals you to 320 m, so **fire only when you expect to finish or can break LOS right after.**
- **Hearing:**
  - Bearing σ 7° means about ±20 m at 160 m. Fuse 2–3 bearings over time and use the distance class (<60 / <160 / ≥160 m).
  - Two gunfire sounds from one bearing mean a fight. A `death` sound (600 m) marks a weakened winner plus dropped loot and cubes.
  - **The third-party window is about 10 s**, before the winner's regen starts. Act only on near or mid-range fights (≤160 m).
  - `laser_charge` (140 m) means a beam is incoming.

## 7. Combat micro

- **Face attackers.** Snap aim to `damaged.bearing` whenever `rear` is true.
- **Strafing against the gun (252 m/s).** A reversal (58.5 m/s²) moves you off the predicted spot by 0.5·a·t²: 1.2 m at 50 m (less than the 2.5 m radius, so it fails) and 4.6 m at 100 m (it works). **Dodging works beyond about 75 m** (about 90 m at 10 cubes). Closer in, trade damage or break LOS. Random-interval reversals and stop-and-go beat head-on, linear and circular aim (TS-05, TS-06).
- **Laser.** It is hitscan, so strafing can't dodge it: one tick only moves you about 1.2 m.
  - When an enemy shows `charging`, **break LOS within 0.75 s** (8.8 m walking, 14.6 m boosting), so stay near cover.
  - With no cover: face the shooter, or get within 45 m and short them with lightning.
  - Charging your own laser halves your speed, so only charge next to cover.
- **Mortar.** Shells are visible, so solve the impact point and move more than 7 m away (1.4 s of flight at 100 m). Concussion drains 45 energy. Lob your own shells at targets located by sound.
- **NPC drones.**
  - Route more than 50 m around them.
  - Farm one (350 HP: about 1.9 s of gun fire, for 2 cubes) only if no mech is within 160 m.
  - Kite pursuers into drones.

## 8. Practice squad vs final FFA

| | Practice squad | Final FFA |
|---|---|---|
| Who dies before you | Mainly your victims | Others kill each other |
| Hiding | Weak (shared vision) | Strong |
| Threat | Focused, growing, weakest-first | Diffuse, mixed quality |
| Third-party chances | Rare | Common |

**Robust strategy for both:**
1. No even fights before phase 3.
2. Take only high-p_win kills (target below 50% HP, already engaged, or rear angle).
3. Build to 10 cubes plus HP upgrades safely.
4. Hold the edge, silent and early.
5. Reach the final center at full HP.

Use one `aggression` knob tuned on practice, with rules 1, 4 and 5 hard-capped so the bot stays FFA-safe.

## 9. Decision framework (utility, all weights [H])

Recompute every tick and take argmax U. Add +0.15 hysteresis to the current action **[H]**.

**Inputs**

| Input | Meaning |
|---|---|
| `h` | HP fraction |
| `e` | energy fraction |
| `n` | alive |
| `ph` | zone phase |
| `t_rot` | rotation time needed − time left |
| `c` | cubes |
| `R` | TTK_them_on_me / TTK_me_on_them, from sustained DPS × triangle × rear factor × accuracy prior (gun 0.5 at 150 m, 0.8 at 50 m) |
| `p_win` | 1 / (1 + R^(−2.5)) |
| `N_near` | number of enemies seen or heard within 160 m |
| `exposed` | number of enemies whose wedge or proximity range covers you |

**Rules**

| Action | Rule | Knobs |
|---|---|---|
| **Fight** | U = p_win·(0.5 + 0.1·loot) − (1 − p_win)·(16 − n)/8 − 0.15·N_near_other. Engage if U > 0. Forced if exposed with no cover within 15 m. | slope 2.5, 0.15 |
| **Retreat** | When R < 0.8, or h < 0.35 under fire. Legs to the nearest in-zone LOS-break, torso on the attacker, boost if e > 0.3. | 0.8, 0.35 |
| **Hide/heal** | U = 1 − h when undamaged and exposed = 0. Move ≤5 m/s until h > 0.9. | 0.9 |
| **Rotate** | Ramps up from t_rot > −10 s. Dominant at t_rot > 0, unless a fight is forced. | 10 s, 0.8 |
| **Loot** | value / (1 + dist/50), only if N_near = 0. Weapon 0.8 for an empty slot; cube 0.5 (−0.1 if c ≥ 10); crate 0.3; drone 0.4. | values, 50 m |
| **Drop** | Contest, third-party or ignore per §4. | 150 HP, 80 m, 250 m |
| **Pursue** | Only if target h < 0.3, they are close enough to finish before they break LOS, and N_near_other = 0. Abort after 8 s or at the zone edge. | 0.3, 8 s |
| **Reposition** | Default: silent move to the cover cell at the edge of the next circle that maximizes cover − exposure − distance. | weights |

**Tune first, in this order:**
1. aggression and the third-party cost
2. retreat thresholds
3. rotation buffer
4. drop HP margin
5. gun accuracy priors
6. edge offset
7. loot values

Judge changes by the placement distribution in replays, not the mean alone.

## Sources

| ID | Title / URL | Type | Finding | Quality |
|---|---|---|---|---|
| TS-01 | Chen & Liu, "Strategy in Battle Royale Games" (2021), https://aochen.netlify.app/uploads/Strategy_Battle_Royale.pdf | Preprint | A low kill-to-placement reward ratio makes peaceful play optimal; mutual retreat is never an equilibrium | Medium (unvalidated) |
| TS-02 | Kotaku, PUBG tournament rules and upsets, https://kotaku.com/battlegrounds-tournament-rules-result-in-confusing-upse-1798434823 | News | Placement-heavy scoring led to passive play (search result only, not read) | Low |
| TS-03 | Guild Order, Apex zone prediction, https://guildorder.com/games/apex/guides/zone-prediction-and-map-reading | Guide | Centroid-facing edge is safest; third parties arrive 30–90 s after the first shot; time-box fights | Medium |
| TS-04 | Guild Order, PUBG circle rotations, https://guildorder.com/games/pubg/guides/circle-prediction-and-rotations | Guide | Edge spots rotators and allows ambushes; center is exposed | Low–Med |
| TS-05 | RoboWiki "Dodging Bullets", https://www.cse.chalmers.se/~bergert/robowiki-mirror/RoboWiki/robowiki.net/wiki/Dodging_Bullets | Wiki | Random/flat movement beats head-on, linear and circular aim | Med–High |
| TS-06 | RoboWiki "Stop And Go", https://www.cse.chalmers.se/~bergert/robowiki-mirror/RoboWiki/robowiki.net/wiki/Stop_And_Go | Wiki | Beats simple aim; loses to velocity-averaging aim | Med–High |
| TS-07 | RoboWiki "Melee Surfing", https://www.cse.chalmers.se/~bergert/robowiki-mirror/RoboWiki/robowiki.net/wiki/Melee_Surfing.html | Wiki | Pick the minimum-danger reachable point | Medium |
| TS-08 | `research/protocol.md`, `GAME_CONTEXT.md` | Primary spec | Every number used here; TTK and dodge values computed from it | High |
