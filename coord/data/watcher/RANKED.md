# Ranked state-conditioned behaviors to test

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.17 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 15:43 ET. Rules are written IF (our state and, where supported, enemy state) THEN behavior, compared with champion B113 (`6182d29c673d99f5186d742a5f019c0b007234f2`, site 4.17). Ranking is by size of the high-vs-low difference, whether the slice is late / low-alive / under fire / third-party / final-circle (the things that move our site score), whether the bot can observe the inputs, and whether the idea is a re-test of a dead or recently lost family (those go last). Expected impact is a direction, not an invented site-point value. Nothing here is a site submission.

Keep champion behaviors intact unless a sim test shows a gain: drop run at 200 m with a 5 s lead and a not-hurt gate, zone-first, B5b heal-and-fire, engage/target-pick, B60 crossfire break, B17/B80 laser walks, B103 lightning ambush, P-B-001 standoff break at 60 s.

## T01–T16 (anonymized)

| label | n | mean place | median | wins | top4 | mean life s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| T01 | 67 | 7.10 | 7 | 12 | 26 | 142.5 |
| T02 | 65 | 7.20 | 7 | 7 | 20 | 144.3 |
| T03 | 32 | 7.25 | 6.5 | 5 | 12 | 116.8 |
| T04 | 26 | 7.46 | 8.0 | 2 | 7 | 120.2 |
| T05 | 21 | 7.62 | 6 | 0 | 6 | 156.3 |
| T06 | 64 | 7.78 | 7.0 | 3 | 18 | 139.5 |
| T07 | 78 | 7.83 | 7.5 | 4 | 24 | 144.0 |
| T08 | 68 | 7.94 | 8.0 | 7 | 19 | 142.9 |
| T09 | 54 | 7.94 | 7.0 | 6 | 15 | 142.5 |
| T10 | 58 | 8.19 | 7.5 | 4 | 16 | 116.3 |
| T11 | 76 | 8.25 | 8.0 | 3 | 24 | 116.7 |
| T12 | 56 | 8.25 | 8.0 | 4 | 13 | 125.7 |
| T13 | 50 | 8.40 | 8.0 | 1 | 14 | 126.4 |
| T14 | 53 | 8.60 | 9 | 4 | 13 | 112.2 |
| T15 | 39 | 8.62 | 9 | 2 | 11 | 124.8 |
| T16 | 61 | 8.67 | 9 | 0 | 14 | 120.0 |

## Ranked rules

Some late-game differences (especially cubes held once only 2–4 mechs remain, and to some extent spacing) are also what you see if a team already survived and farmed. They are listed because they are large and they show up late, which is when our site score is decided, but a sim test still has to change a *decision rule*, not just hope the number appears. Stuck-and-speed in the 5–8-alive window is closer to a controllable movement/pathing rule; keep the drop run intact if that is tested.

### 1. evasion: nearest enemy (m) while HP < 35% [b_alive=alive_2_4]

**IF** alive is alive_2_4 **THEN** do more of / raise `nearest enemy (m) while HP < 35%` (high 126.25 vs low 89.83, diff +36.42, d=0.71; 447/249 ticks, 43/43 matches; ok).

Observability: Not directly implementable as measured: the Watcher sees this for every mech, including ones we cannot see. Use only with a visible/sound proxy, or flag as research-only. Restrict to visible enemies in a later test if we implement this.

Champion B113 today: Hurt hide/retreat should increase spacing; not a fixed meter target.

Family overlap: Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Facing the attacker (front-arc discipline) has not been site-tested. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on B113, this state condition only, no other changes. Gate: `check.py` plus the usual screens; **keep drop-run reach and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 2. loadout: cubes held [b_alive=alive_2_4]

**IF** alive is alive_2_4 **THEN** do more of / raise `cubes held` (high 16.50 vs low 9.34, diff +7.16, d=0.65; 5281/3133 ticks, 51/47 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Our cubes and upgrades are always known. Visible enemies expose `cubes` but not their upgrade list.

Champion B113 today: Farm (FARM_ENEMY_M=160, hunt 150 m) and the early laser rush (45 s, trip ≤ 250 m) plus LATE_LIGHT_ON after that for gun-only, are in the stack. A dedicated upgrade-order build (B21) lost on the site.

Family overlap: LASER_RUSH + LATE_LIGHT + LIGHT_AMBUSH are in the stack. B21 upgrade-order LOSS. Opening / first-30s family is dead. Do not spend a slot on early objective swaps.

Sim test proposal: one flag on B113, this state condition only, no other changes. Gate: `check.py` plus the usual screens; **keep drop-run reach and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 3. evasion: speed while HP < 35% (m/s) [b_alive=alive_2_4]

**IF** alive is alive_2_4 **THEN** do more of / raise `speed while HP < 35% (m/s)` (high 8.94 vs low 6.95, diff +2.00, d=0.35; 447/249 ticks, 43/43 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion B113 today: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Family overlap: Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Facing the attacker (front-arc discipline) has not been site-tested. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on B113, this state condition only, no other changes. Gate: `check.py` plus the usual screens; **keep drop-run reach and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 4. movement: stuck fraction (≈5 s almost unmoved, not in a drop ring) [b_alive=alive_5_8]

**IF** alive is alive_5_8 **THEN** do less of / lower `stuck fraction (≈5 s almost unmoved, not in a drop ring)` (high 14.0% vs low 40.7%, diff -26.7 pp, d=-0.63; 8475/7763 ticks, 72/68 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion B113 today: Nav paths exist; there is no separate unstuck policy in params. Movement builds that tried random strafe / combined movement are on hold and were sim-only as of this writing.

Family overlap: Family untested on the site (B116 movement is on hold). Sim-only strafe-only screened worse than the champion; combined movement was mixed and failed the drop-reach / late-survival bar. Any movement rule must keep the drop run intact and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on B113, this state condition only, no other changes. Gate: `check.py` plus the usual screens; **keep drop-run reach and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 5. movement: mean speed (m/s) [b_alive=alive_5_8]

**IF** alive is alive_5_8 **THEN** do more of / raise `mean speed (m/s)` (high 7.51 vs low 4.22, diff +3.29, d=0.61; 8475/7763 ticks, 72/68 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion B113 today: Healthy: full walk (NO_SNEAK_ON). Hurt (HP < 0.3 or recent damage): silent cap 5.0 m/s and hide/heal. Zone trips use zoneWalk=0.8 and a 10 s buffer.

Family overlap: Family untested on the site (B116 movement is on hold). Sim-only strafe-only screened worse than the champion; combined movement was mixed and failed the drop-reach / late-survival bar. Any movement rule must keep the drop run intact and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on B113, this state condition only, no other changes. Gate: `check.py` plus the usual screens; **keep drop-run reach and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 6. aggression: mean nearest enemy (m) [b_alive=alive_2_4]

**IF** alive is alive_2_4 **THEN** do more of / raise `mean nearest enemy (m)` (high 141.34 vs low 121.39, diff +19.95, d=0.27; 5281/3133 ticks, 51/47 matches; ok).

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs. Distance to unseen enemies is omniscient in this metric; also see the nearest_visible slice.

Champion B113 today: Champion keeps fighting range via gunRange/standoff/ambush, but has no explicit 'hold 130 m' spacing rule.

Family overlap: Engage family is alive (B14/B16/B30 in the stack). Dead or recently lost in this neighborhood: B108 finish-burst CLOSE −0.31, B26 multi-threat race LOSS, B98 no-early-finish LOSS. Do not resubmit those. A new rule has to be a different mechanism (for example a visible third-party / HP-vs-N condition the champion does not already have).

Sim test proposal: one flag on B113, this state condition only, no other changes. Gate: `check.py` plus the usual screens; **keep drop-run reach and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 7. aggression: mean nearest enemy (m) [b_hp=hp_30_50]

**IF** hp is hp_30_50 **THEN** do more of / raise `mean nearest enemy (m)` (high 119.07 vs low 103.74, diff +15.33, d=0.26; 1744/1306 ticks, 86/80 matches; ok).

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs. Distance to unseen enemies is omniscient in this metric; also see the nearest_visible slice.

Champion B113 today: Champion keeps fighting range via gunRange/standoff/ambush, but has no explicit 'hold 130 m' spacing rule.

Family overlap: Engage family is alive (B14/B16/B30 in the stack). Dead or recently lost in this neighborhood: B108 finish-burst CLOSE −0.31, B26 multi-threat race LOSS, B98 no-early-finish LOSS. Do not resubmit those. A new rule has to be a different mechanism (for example a visible third-party / HP-vs-N condition the champion does not already have).

Sim test proposal: one flag on B113, this state condition only, no other changes. Gate: `check.py` plus the usual screens; **keep drop-run reach and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 8. movement: stuck fraction (≈5 s almost unmoved, not in a drop ring) [b_alive=alive_2_4]

**IF** alive is alive_2_4 **THEN** do less of / lower `stuck fraction (≈5 s almost unmoved, not in a drop ring)` (high 11.0% vs low 30.9%, diff -19.9 pp, d=-0.53; 5281/3133 ticks, 51/47 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion B113 today: Nav paths exist; there is no separate unstuck policy in params. Movement builds that tried random strafe / combined movement are on hold and were sim-only as of this writing.

Family overlap: Family untested on the site (B116 movement is on hold). Sim-only strafe-only screened worse than the champion; combined movement was mixed and failed the drop-reach / late-survival bar. Any movement rule must keep the drop run intact and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on B113, this state condition only, no other changes. Gate: `check.py` plus the usual screens; **keep drop-run reach and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 9. movement: mean speed (m/s) [b_alive=alive_2_4]

**IF** alive is alive_2_4 **THEN** do more of / raise `mean speed (m/s)` (high 7.54 vs low 4.98, diff +2.57, d=0.46; 5281/3133 ticks, 51/47 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion B113 today: Healthy: full walk (NO_SNEAK_ON). Hurt (HP < 0.3 or recent damage): silent cap 5.0 m/s and hide/heal. Zone trips use zoneWalk=0.8 and a 10 s buffer.

Family overlap: Family untested on the site (B116 movement is on hold). Sim-only strafe-only screened worse than the champion; combined movement was mixed and failed the drop-reach / late-survival bar. Any movement rule must keep the drop run intact and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on B113, this state condition only, no other changes. Gate: `check.py` plus the usual screens; **keep drop-run reach and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 10. cover: hold (speed ≤ 2 m/s) fraction [b_alive=alive_5_8]

**IF** alive is alive_5_8 **THEN** do less of / lower `hold (speed ≤ 2 m/s) fraction` (high 27.3% vs low 50.8%, diff -23.5 pp, d=-0.50; 8475/7763 ticks, 72/68 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion B113 today: Champion holds/heals in place in several modes; NO_SNEAK_ON stops healthy hide-walks.

Family overlap: B5b is in the stack. Hold-behind-cover, post-kill cover, late 1+LOS cover, and wider/rear-step variants LOSS. Do not resubmit those. A cover rule only ranks if it is a clearly different, state-conditioned trigger.

Sim test proposal: one flag on B113, this state condition only, no other changes. Gate: `check.py` plus the usual screens; **keep drop-run reach and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 11. evasion: nearest enemy (m) while HP < 35% [b_phase=mid]

**IF** phase is mid **THEN** do more of / raise `nearest enemy (m) while HP < 35%` (high 119.17 vs low 94.61, diff +24.56, d=0.48; 488/333 ticks, 40/46 matches; ok).

Observability: Not directly implementable as measured: the Watcher sees this for every mech, including ones we cannot see. Use only with a visible/sound proxy, or flag as research-only. Restrict to visible enemies in a later test if we implement this.

Champion B113 today: Hurt hide/retreat should increase spacing; not a fixed meter target.

Family overlap: Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Facing the attacker (front-arc discipline) has not been site-tested. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on B113, this state condition only, no other changes. Gate: `check.py` plus the usual screens; **keep drop-run reach and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 12. evasion: speed while HP < 35% (m/s) [b_alive=alive_9_12]

**IF** alive is alive_9_12 **THEN** do more of / raise `speed while HP < 35% (m/s)` (high 8.77 vs low 6.13, diff +2.64, d=0.44; 509/490 ticks, 48/50 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion B113 today: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Family overlap: Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Facing the attacker (front-arc discipline) has not been site-tested. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on B113, this state condition only, no other changes. Gate: `check.py` plus the usual screens; **keep drop-run reach and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

## Already-tested families (do not recycle without a new mechanism)

From `coord/data/site_results.csv` and `ideas.md`, checked while writing this file:

- **drops:** B113 KEEP 4.17 (200 m). Later on this champion: B115 CLOSE 4.13 (−0.04, 10 s lead), B118 CLOSE 4.17 tie (260 m), P20 CLOSE 4.17 tie (hurt and unseen). Rank last if the idea is another reach/lead/hurt-gate tweak.
- **standoff:** P-B-001 KEEP 4.06 at 60 s (still in the stack). P-B-006 CLOSE 4.02 (−0.08 at 45 s). 90 s is a queued other value, not a Watcher finding.
- **engage:** finish-burst B108 CLOSE −0.31; multi-threat race B26 LOSS; no-early-finish B98 LOSS.
- **cover:** several hold / late-cover / wider-search LOSS after B5b KEEP.
- **lightning:** ambush widening to uncharged-laser holders (B106) CLOSE −0.21; late-walk distance/start tweaks tied or lost.
- **opening / first 30 s:** dead (ties at 3.79, later instruction to stop building first-30s fixes).
- **threat-forecast:** P-D-002 CLOSE −0.27.
- **movement:** not site-tested; B116 on hold; sim-only results mixed and not a site candidate yet.

## Conflicts with the champion (summary)

Any rule that asks us to abandon the 200 m drop run, the not-hurt drop gate, zone-first travel, or the 2-LOS crossfire break is in conflict with behaviors we should keep unless a sim test clearly beats them on end-game score. Rules that add a *new state condition* on top of those (for example, face the visible attacker, or take a visible low-HP busy target) are extensions, not automatic replacements.

## What this pass could not measure

- Enemy energy and enemy upgrade *choices* as the bot would (or would not) see them: energy is not in `ActorObs`; upgrades are not either (cubes are).
- Tree/canopy vision, 5 s memory tracks, and true planned paths.
- Independent body yaw (not in the stream).
- Practice-squad trigger frequencies (this corpus is exhibition FFA). Use the sim for that.
- 8:00 timeout tables (rare in these showdowns).

