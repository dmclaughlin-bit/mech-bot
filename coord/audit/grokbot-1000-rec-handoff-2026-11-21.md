# Grokbot handoff: 1,000-recommendation audit

**From:** Diego's Claude (read-only research). **Written:** Sat Nov 21, 2026, ~1:15 PM ET.
**Champion checked:** B80 `28c3acc`, site 3.79 (BB-78A44AAF). The bot code on `main` (`f7c12ba`) is byte-identical to B80 for `brain.ts`, `params.ts`, `target.ts` and `nav.ts`. All line numbers below are on that code.
**Inputs:** the uploaded catalog (MR-0001 to MR-1000, 40 themes × 25), `coord/data/site_results.csv`, `coord/data/screens.csv`, `coord/data/ideas.md`, `coord/log.md`, today's code and perf audits, `research/protocol.md`.
**Full traceable table:** `coord/audit/grokbot-1000-rec-classification-2026-11-21.csv`, with one row per ID (verdict, hypothesis, duplicate-of, failed build, evidence class, code location, rationale).

Nothing was built, committed to bot code, or submitted.

---

## 1. Executive summary

- **Most of the catalog is already in B80 or was already tried.** 472 of 1,000 entries are EXISTING and 93 are FAILED PREVIOUSLY. Of the rest, 45 are DUPLICATE, 331 UNSUPPORTED and 34 REJECT. Only **25 entries (18 NEW, 7 IMPROVE)** describe a mechanism that is both untested and grounded in the code.
- **The catalog's own shortlist is mostly closed.** 11 of its 19 picks sit in the opening family, where seven builds tied exactly at 3.79 (MR-0001, 0076, 0081, 0084, 0903 and others), or are already true of B80 (MR-0003, 0005, 0021, 0156, 0443, 0978). MR-0151 and MR-0427 are the in-flight P-D-002. Only MR-0402 survives as a shadow measurement.
- **The catalog's scoring premise is wrong for practice.** It says kills are only indirect value through cubes. In practice, house bots never fight each other, so every mech that dies before us is one we killed or one the zone killed. Score tracks our kills (sim r 0.989), and kill rate falls from 3.1/min to 1.5/min after 120 s. Entries that tell the bot to value survival *over* kills (MR-0056, 0791, 0830) are marked UNSUPPORTED.
- **Three new opportunities are grounded in the code (verified by reading, not by a run):**
  1. **Finishing under-counts our burst.** The finish rule commits only when target HP ≤ the *best single weapon's* magazine (`brain.ts:297-307`, `:591`). A gun+laser holder will not commit on a 600 HP target, even though 540 (gun mag) + 315 (full beam) = 855 is in reach.
  2. **The gun loses its lead while the laser aims.** When the laser leads, the torso goes to the beam aim with no bullet lead (`:887-889`). The gun fires only if that aim is within about 3 m of its own lead point (`:866`, `:916`). A target crossing at walk speed (11.7 m/s) is more than 3 m off beyond ~65 m, so the gun goes quiet for the whole charge.
  3. **Sound is never used.** `brain.ts` never reads `obs.sounds`. Gun (320 m), laser (380 m) and death (600 m) sounds could find house bots during the late game, when kills dry up.
- **My recommendation for the first experiment: H01 "finish burst"** (section 4). It goes straight at kills and is mid-game, not opening. It is a one-line threshold change behind a flag. B98, which removed early finishing, lost (3.63), and that is evidence finishing matters.

**Verified vs inferred.** Items marked *verified* were checked by reading the B80 code or protocol. No score effect has been measured for any new hypothesis here. The sim correlates weakly with the site (held-out r 0.19), and the site is the only keep/close truth. I give no score predictions.

---

## 2. Classification totals

| Verdict | Count | What it means here |
|---|---:|---|
| EXISTING | 472 | Already in B80 or already enforced by WORKFLOW / ideas.md (227 of the 284 guardrails land here) |
| UNSUPPORTED | 331 | No link to low-kill games, depends on unobservable state, or relies on the invented sim house model |
| FAILED PREVIOUSLY | 93 | Same mechanism as a site loss or tie, or as a sim-screened failure the coordinator listed |
| DUPLICATE | 45 | Same mechanism as another ID (the target is listed in the CSV) |
| REJECT | 34 | A rewrite, learning, or mortar play before the lock (we never loot mortars, and B76 lost) |
| NEW | 18 | Untested mechanism grounded in code or protocol |
| IMPROVE | 7 | Existing mechanism with a specific verified gap |
| **Total** | **1,000** | |

By catalog priority: P1 has 181 E, 103 U, 47 F, 28 D, 8 N, 4 I, 4 R. P2 has 244 E, 204 U, 46 F, 17 D, 9 N, 3 I, 2 R. P3 has 47 E, 28 R, 25 U.
The most-closed themes are 04 early weapon (14 F, 11 E), 10 evasion (10 F), 22 supply drops (9 F), 06 first contact (9 F) and 31 positioning (7 F). The live themes are 19 sound (4 N), 32 finishing (1 I, 1 N), 11 gun (1 I, 1 N) and 07 hunter pressure (2 N, both already queued).

**Catalog facts I checked against `research/protocol.md`:**
- Correct: the score is 16 − place, rear hits deal ×1.5, regen needs 5 s without dealing or taking damage, the laser has no cancel, lightning shorts a charging laser, and cook-off adds +60%.
- Corrected: kills are the placement in practice (above).
- Corrected: the sim correlation is now held-out r 0.19 with 13/23 sign agreement, not 0.22. The −0.3 sim veto has been retired, so MR-0900 is REJECT.
- Corrected: a `reload` sound exists but carries only 60 m (MR-0414, 0465), and `npc_gun` is its own sound kind (MR-0464).

**External sources (S01–S25).** These support concepts only, and none gives evidence about Mech Royale. S04 (Option-Critic) and S19 (domain randomization) match the papers I know. I did not open the other URLs. No verdict depends on an external source.

---

## 3. Top 20 research hypotheses

Confidence is my judgement that the mechanism is real *and* reaches the low-kill games. It is not a predicted score. "In flight" items already have an owner, and the handoff must not start a second copy.

| # | Hypothesis | Original IDs | Code | Status / owner | Confidence |
|---|---|---|---|---|---|
| H01 | **Finish rule counts the combined burst of all held weapons in reach** | 0776, 0059, 0794, 0255, 0253, 0413, 0800, 0834 | `brain.ts:297-307`, `:589-591` | New. It fits Grok's #4 ("stay on wounded") for Diego's Claude | Medium |
| H02 | **Gun keeps its lead while the laser charges** | 0261, 0267, 0671, 0915, 0658 | `:866`, `:885-892`, `:916`, `:923-937` | New, measure first | Medium-low |
| H03 | Second-hunter forecast in engage viability | 0151, 0155, 0161, 0053, 0074, 0427, 0444, 0910 | `:562-615` | **In flight: P-D-002** | Medium-low |
| H04 | Mid-game standoff break | 0760, 0291 (and 0286 conflicts) | `:688-700` | **In flight: P-B-001** | Medium-low |
| H05 | Lightning idle at 45–90 m (ambush) | 0314, 0301, 0303, 0313 | `:891`, `:925-929` | **In flight: B103 (Doug's Claude)** | Low-medium |
| H06 | React to a visible enemy charging a laser | 0705, 0240, 0440, 0448, 0669 | `:562-615` | **Queued: P-B-002** (must not be B88 or B56) | Low |
| H07 | **Sound-guided hunt after 120 s** | 0152, 0451, 0452, 0454, 0464, 0470, 0488, 0159, 0475 | `:403-429` (sounds never read) | New | Low-medium |
| H08 | **Stay on wounded targets before they regenerate** | 0782, 0776, 0385, 0415 (and 0389 conflicts) | `:101-103`, `:572`, `:605-612`; `params.ts` TARGET_LOST_S | New. This is Grok's #4, assigned and not yet measured | Medium-low |
| H09 | **Cook-off bonus in target pick (laser vs mortar holder)** | 0287 | `target.ts:51-64` | New, narrow | Low |
| H10 | Lightning short aimed at laser chargers | 0302, 0322, 0285 | `:925-929` | New. Hand to Doug's Claude (lightning owner) | Low |
| H11 | `ourMagazine` uses current ammo (known defect D7) | 0253, 0255, 0263 | `:297-307` | Parked by Grok. Fold it into H01 | Low alone |
| H12 | Let `laserSkip` expire so the late walk can retry | 0048 | `:663` | New, tiny | Low |
| H13 | Two-horizon fight readiness in `race()` (shadow only) | 0002, 0402, 0401, 0410, 0383 | `:286-312`, `:573-580` | Shadow count first. B48 and B20+22 lost | Low |
| H14 | Supply-drop run | 0526–0549 cluster | `:533-536` | **In flight: B104 pending.** Sim-inert (11/384) | Low |
| H15 | Lightning cone soaked by a nearer drone or crate | 0315 | `:925-929` | Diagnostic, Doug's area | Low |
| H16 | Heal windows reset by our own fire (count only) | 0619, 0603, 0614 | `:736-741` | Diagnostic. B5's fire gate lost badly | Low |
| H17 | Site hill-climb discipline: one small mechanism per slot, strict > 3.79 | 0926, 0929–0931, 0943, 0944, 0847 | WORKFLOW | Process (already mostly in place) | High (process) |
| H18 | Downside-tail rows (worst-quartile placement, score after a first-fight win) | 0070, 0071, 0831 | tools | Diagnostic | Medium (cheap) |
| H19 | Practice-only flags settable to 0 for the FFA final | 0801, 0804, 0806, 0824 | `params.ts` | Process. Matters only after qualifying | High (process) |
| H20 | Mid/late event log (mode, LOS count, sounds heard, last 5 s before death) | 0901, 0918, 0923, 0917 | tools | Grok's #5, enabler for H07 and H08 | Medium (cheap) |

### Detail for the new hypotheses (H01, H02, H07, H08, H09)

#### H01: Finish burst
- **Sources:** MR-0776/0794. Data: score ≈ kills, and B98 (less finishing) lost (3.63 vs 3.79). Protocol §6 weapon numbers.
- **Root cause (verified by reading):** `ourMagazine()` returns the max over held weapons, not their sum. Gun 12 × 45 = 540, laser 315 at full, lightning = energy ÷ 3 × 60. A gun+laser holder stops at 540, so a 541–855 HP target is never a finish. The function also uses `stats.mag`, not current `ammo` (D7).
- **Proposed behavior:** flag `FINISH_BURST_ON` (0 = B80). The burst is the sum over weapons in reach of: gun = `ammo` rounds loaded (or a full mag if reloading finishes within ~1 s) × damage; laser = one full shot if `cooldown` ≤ 0.5 s; lightning as today. Apply cube scaling once. The guards stay as they are: HP ≥ 35%, `alone()`, `outlive()` (ttk < ttd) and `rested()`.
- **Expected advantage:** more commits on mid-HP lone targets, which means more kills. Mid-game, so outside the closed opening family.
- **Risks:** more walking toward targets, which means more exposure. A finish draws the squad (house bots hunt the weakest), and `outlive()` is the only brake.
- **Interactions:** it outranks the laser walk and the claim, so it can delay arming. B36 showed that order matters only weakly. It shares the engage latch with H03 and H08, so build them separately.
- **Difficulty:** about 10 lines in one function, plus the flag.
- **Test:** both seed sets, PR template. Primary rows: kills and kills/min after 60 s. Also report finish commits per game and died <40 s. Then one site slot; keep only if strictly > 3.79.
- **Rollback:** flag 0 is byte-identical.

#### H02: Gun lead during laser charge
- **Root cause (inferred from code):** see §1. Laser DPS ≈ 315 / 2.4 s ≈ 131 and gun ≈ 187, so a silent gun for the ~0.75–1 s charge out of every 2.4 s cycle is real lost damage on sideways movers at 65–100 m.
- **Measure first (one instrumentation pass on B80):** count ticks with the gun ready, a clear target in gun range, the laser leading, and no gun shot. Split by distance band and kills.
- **Proposed behavior:** flag `GUN_LEAD_CHARGE_ON`. While the laser charges and is not yet full, and the gun is ready and in range, aim at the gun's lead point. Switch to the beam aim at full charge (turn rate 4 rad/s, so the swing takes under one decision). Release still requires `beamOn`.
- **Risk:** laser release slips by up to one decision per cycle. A full charge still auto-fires after `hold_s` 2 s. This must not change B17's release-inside-outline rule.
- **Test:** same as H01. Build only if the pass shows at least ~10% of laser-leading ticks have the gun wrongly silent.

#### H07: Sound-guided hunt after 120 s
- **Root cause (verified):** `obs.sounds` is unused, and `enemies` and `threats` are visible-only (`:449`, `:515`). P-D-001 Step A found the late-hunt pool small (10 and 12 games) *using visible mechs only*.
- **Proposed behavior:** flag `SOUND_HUNT_S` (0 = off, 120 = on). After 120 s, at HP ≥ 90%, nothing in view, no LOS threat, in zone and not leaving: walk along a nav path toward the newest `gun`, `laser`, `lightning` or `death` sound heard in the last 5 s. Ignore `npc_gun`. Bearing only, about 80 m out, then re-read. Stop on first sight, and normal engage takes over. Sound never enters firing or `threats`.
- **Risks:** walking into a squad, and bearing noise (sensors halve it). In practice the house squad shares vision, so this hunts the hunters.
- **Test:** count first how many games have a usable sound while idle after 120 s, then the same screen. It needs its own slot. Do not stack it with P-D-002.

#### H08: Stay on wounded
- **Root cause (verified):** after 8 s of chasing without HP loss the target is dropped for 10 s (`ENGAGE_CHASE_S`, `ENGAGE_REST_S`). The lock ends after 3 s without a shot. House bots then regen 45 HP/s after 5 s quiet.
- **Proposed behavior:** this is Grok's assigned #4, so measure first. Count targets left below 50% HP that are seen again later above 80%. If common, build flag `WOUNDED_STAY`: for a target last seen below 50% HP, extend TARGET_LOST_S to ~6 s and skip the give-up while its hpLog fell in the last 4 s.
- **Conflict:** MR-0389 (don't reverse to chase a fleeing mech) argues the other way. Report the deaths during chases.

#### H09: Cook-off bonus
- **Verified:** protocol gives +60% laser damage to a mortar holder, and `target.ts` ignores it. Add a `cook` term (for example +1 to the score when we hold a laser and the target holds a mortar).
- **Value:** depends on how often house bots carry mortars, which is not measured yet. A cheap count first. If the change touches few games, it is a clean site test (see H17).

---

## 4. Five highest-value distinct experiments

None of these duplicates in-flight work (P-D-002, P-B-001, P-B-002, B103, B104).

1. **H01 Finish burst** (`FINISH_BURST_ON`). Mid-game, aimed at kills, one function. **Run first.**
2. **H02 Gun lead during charge** (`GUN_LEAD_CHARGE_ON`), after one measurement pass.
3. **H08 Stay on wounded** (`WOUNDED_STAY`). Already Grok's #4. Measure, then build.
4. **H07 Sound hunt after 120 s** (`SOUND_HUNT_S=120`). The only untouched input channel.
5. **H09 Cook-off target bonus** (`COOKOFF_W`). Narrow and low-variance.

Order and independence: H01 and H08 both touch the engage block, so site-test H01 alone first and rebase H08 on the winner. H02 is in the fire block and H09 in `target.ts`, so either can go in parallel slots. H07 is movement-only.

---

## 5. Three immediate priorities

1. **Don't disturb the queue.** Let P-D-002 (Diego's Claude), P-B-001 (Mech Builder) and the B103/B104 site runs finish, and record every receipt in `coord/data/site_results.csv`.
2. **Queue H01 as the next Diego prompt** (`P-D-003`) once P-D-002's PR is up. It is the concrete form of your #4 ("stay on wounded"). H08 becomes its follow-up.
3. **Put the H02 and H08 counts in one measurement pass** on B80, seeds 2000+3000 and 4000+5000. Report gun-silent ticks while the laser leads, and wounded targets that got away and regenerated. That decides whether either earns a build.

---

## 6. Major strategic shifts (the six questions)

| Question | Verdict | Why |
|---|---|---|
| 1. Fixed priority vs adaptive utility | **Keep the chain.** Allow a better estimate *inside* one branch (H01, H13) | The priority swaps B36 and B94 tied or lost, and S1 was dropped. A rewrite with ~20 h left has a large regression surface |
| 2. Reactive vs predictive survival | **Test once, engage-only** (P-D-002) | The cover-move form lost twice (B82 3.46, B100 3.50) |
| 3. Shortest path vs risk-aware routes | **No** | It mostly helps opening laser trips (a closed family). Measured detours are small (18/110 trips ≥ 30%). Nav tweaks B10 and B11b lost |
| 4. Static vs contextual loadout | **No** | Swaps B66, B68 and B90 lost, and so did upgrade order B21. The protocol already offers upgrades only for held weapons |
| 5. TTK vs short-horizon feasibility | **Partly.** H01 fixes the burst estimate; H13 is shadow-only | B48 and B20+22 TTK recalibrations lost |
| 6. Scripts vs a policy portfolio | **No before lock**, except an FFA-final flag set (H19) | No reliable sim to choose policies with |

**The shift that matters most is the objective, not the architecture.** B80 is built around surviving: it heals standing still, hides, and retreats. Practice pays for kills. The open mechanisms all *convert* fights we are already in (finish, stay on wounded, keep the gun firing, find the last house bots). Only one flag-gated change at a time.

**Process shift (H17).** An identical resubmit gave the same score (S3 2.17), and seven different builds tied exactly at 3.79. So the 48 practice matches look fixed per commit. A change that touches few games is then a clean test, and a keep needs only +1 placement point (183/48 = 3.81). Prefer small, mid/late-game mechanisms that touch few games. Ties never count.

---

## 7. Behaviors that should stay unchanged

These are the B80 stack's keeps, each with a site result: B1 aim and lead, B2/B3 nav and zone travel with the 30 ms guard, B5b heal-while-firing, B12/B13 farming, B14 TTK/finish engage with aggression 1.5 (B30), B16 kill-value target lock, B17 bounded laser walk with release-inside-outline, B19 no-sneak when not hurt, B60 two-LOS crossfire break, B80 late gun-only walk, the 100 m gun gate (B7 lost), never looting mortars (B76 lost), and zone escape and next-circle travel ranking first.

## 8. Previously failed strategies to avoid

Opening and first-30-s changes (seven 3.79 ties: B51, UF100, B86, B92 and others; B23, B43, B45 and B76 lost). Strafe and dodge (B27, B101, B56). Wider or earlier cover (B82, B100, B6, B41, B53). Laser pre-charge or charge suppression (B32, B88). Unbounded laser-first (B8, B40, B64, B39 dash). Slot swaps (B66, B68, B90). Upgrade order (B21). House-TTK calibration and standoff+race (B48, B20+22). Multi-threat race at any HP (B26). No-early-finish (B98). Late-walk distance and timing variants (B86, B92, B94). The six code-audit variants (heal yields when quiet −0.18, full speed under fire −0.21, lightning closes to 45 m −0.11, A* loot walk −0.11, no charge en route −0.07, reload behind cover −0.04). UF100. The heal-under-fire walk to cover (D5). The supply-drop run (P-D-001; B104 pending). **Never use or build on another team's bot** (against the rules).

## 9. Research gaps and uncertainty

- **No new hypothesis has a measured effect.** H01, H02 and H08 are verified code facts with inferred benefit.
- H02's size depends on how often laser holders fight sideways movers at 65–100 m. Not measured.
- H07 depends on house-bot sound behavior on the real server. The sim's house model is invented (`house.ts`), so a sim screen of H07 is weak evidence.
- H09 depends on the mortar-carry rate of house bots, which is unknown.
- The sim's correlation with the site is weak (held-out r 0.19), so screens show behavior change and catch crashes. They do not rank builds.
- Whether practice matches are fixed seeds is inferred from repeat scores, not documented.
- The 331 UNSUPPORTED entries are parked, not refuted. Most need data we lack (house tiers, enemy ammo, trustworthy sim aim).

## 10. Exact recommended actions for Grokbot

1. Read this file and the CSV. Spot-check the verdicts for MR-0776, 0261, 0152, 0553 and 0427.
2. Keep P-D-002 and P-B-001 as the active prompts. Record the B103 and B104 receipts.
3. When P-D-002's PR is up, write **P-D-003 = H01 Finish burst** in `coord/next-diego.md`: one flag `FINISH_BURST_ON`, the shape in §3, both seed sets, kills first, flag 0 byte-identical.
4. Add the H02 and H08 counts to Diego's next measurement pass (or to P-D-003 Step A). Build each only if its count clears the bar in §3.
5. Hand H10 and H15 (lightning) to Doug's Claude as notes for B103's follow-up. Don't open a second lightning builder.
6. Queue H07 and H09 behind H01 in `coord/data/ideas.md` as untested.
7. Close catalog entries marked FAILED PREVIOUSLY or REJECT without a slot. Re-open one only with a new mechanism written in its PR.

---

**What are the five strongest behavioral changes that could materially improve our current champion, and which single experiment should Grokbot prioritize first?**

My answer: (1) H01 finish burst, (2) H02 gun lead during laser charge, (3) H08 stay on wounded, (4) H07 sound-guided late hunt, (5) H09 cook-off target bonus. **Prioritize H01 first.**
