# Ranked state-conditioned behaviors to test

> **Caveats (every file):** Showdowns are Top-16 teams in free-for-all exhibition matches, not the house hunting squad our practice site score is measured against. A behavior that lines up with high placement here is a correlation, not proof it causes the win, and it still has to pass the sim and then beat 4.38 on the site. Watcher ticks see every mech every frame; our bot does not (see STATES.md for what the protocol actually exposes). Numbers are counted from recordings; blank cells mean the value was not measurable or the bucket was too small.

Generated 2026-11-21 21:29 ET. Rules are written IF (our state and, where supported, enemy state) THEN behavior, compared with champion P34 lethal laser release (`0e6fadd1a30db4ee30c26114b8198f63d782b7c9`, merged `8c130ad7f0c81acb03508c40f20c31867f29d358`, champion.json `588557e`, site 4.38, `BB-ABEB42BF`), built on P29 midring settle (`2e1d03615f6e8faa7097ffcbd441be43b234c5b9`, site 4.35). Previous refresh 2026-11-21 15:43 ET used 93 complete showdowns against then-champion B113 at 4.17. This pass uses 128 complete showdowns (all recordings to date). Ranking starts with rules that are not already covered by later experiments, then by size of the high-vs-low difference, whether the slice is late / low-alive / under fire / third-party / final-circle (the things that move our site score), and whether the bot can observe the inputs (omniscient-only measurements rank lower). Covered and in-flight rules are listed separately. Expected impact is a direction, not an invented site-point value. Nothing here is a site submission.

Keep champion behaviors intact unless a sim test shows a gain: drop run at 200 m with a 5 s lead and a not-hurt gate, P29 midring settle (band 0.40–0.70, goal 0.55, off at r≤70), P34 lethal laser release (margin 0.8, min t 40 s, no release while a drop run/hold is possible), zone-first, B5b heal-and-fire, engage/target-pick, B60 crossfire break, B17/B80 laser walks, B103 lightning ambush, P-B-001 standoff break at 60 s.

## T01–T16 (anonymized)

| label | n | mean place | median | wins | top4 | mean life s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| T01 | 98 | 6.69 | 5.5 | 17 | 37 | 156.3 |
| T02 | 65 | 7.20 | 7 | 7 | 20 | 144.3 |
| T03 | 32 | 7.25 | 6.5 | 5 | 12 | 116.8 |
| T04 | 26 | 7.46 | 8.0 | 2 | 7 | 120.2 |
| T05 | 43 | 7.70 | 7 | 3 | 16 | 158.1 |
| T06 | 80 | 7.76 | 7.5 | 4 | 25 | 147.0 |
| T07 | 87 | 7.79 | 8 | 11 | 26 | 139.6 |
| T08 | 43 | 7.81 | 7 | 2 | 14 | 148.8 |
| T09 | 101 | 7.85 | 8 | 10 | 30 | 145.6 |
| T10 | 71 | 7.86 | 7 | 2 | 24 | 145.2 |
| T11 | 24 | 7.92 | 8.0 | 2 | 5 | 153.1 |
| T12 | 36 | 8.14 | 7.0 | 3 | 10 | 139.0 |
| T13 | 58 | 8.19 | 7.5 | 4 | 16 | 116.3 |
| T14 | 76 | 8.25 | 8.0 | 3 | 24 | 116.7 |
| T15 | 41 | 8.49 | 7 | 0 | 10 | 147.6 |
| T16 | 94 | 8.49 | 9.0 | 1 | 19 | 123.0 |

## Ranked rules (not already covered)

These are the highest-scoring slices that are not already a retired, lost, or assigned experiment. In-flight / research overlaps are in the next section. Implementable rules are listed before Watcher-omniscient ones with a similar raw score.

### 1. aggression: mean nearest enemy (m) [b_hp=hp_30_50]

**IF** hp is hp_30_50 **THEN** do more of / raise `mean nearest enemy (m)` (high 119.07 vs low 104.16, diff +14.91, d=0.26; 2041/2273 ticks, 116/124 matches; ok).

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs. Distance to unseen enemies is omniscient in this metric; also see the nearest_visible slice.

Champion today: Champion keeps fighting range via gunRange/standoff/ambush, but has no explicit 'hold 130 m' spacing rule.

Family overlap: Engage family is alive (B14/B16/B30 in the stack). Dead or recently lost in this neighborhood: B108 finish-burst CLOSE −0.31, B26 multi-threat race LOSS, B98 no-early-finish LOSS, P35 unseen-target (UNSEEN_TARGET_ON) retired on a drop set-total VETO, P36 claim-cubes (CLAIM_WATCHED_ON) retired (paired sim loss after the t≥40 s fix). Do not resubmit those. A new rule has to be a different mechanism (for example a visible third-party / HP-vs-N condition the champion does not already have).

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 2. aggression: mean nearest enemy (m) [b_alive=alive_2_4]

**IF** alive is alive_2_4 **THEN** do more of / raise `mean nearest enemy (m)` (high 139.88 vs low 120.94, diff +18.94, d=0.26; 6076/3957 ticks, 64/58 matches; ok).

Observability: Implementable when the enemy is currently in `obs.mechs` (45 m any direction or 200 m inside the 120° torso FOV, with building LOS). Visible fields: pos, vel, aim, weapons, charging, cubes, and hp/max_hp if `vision.show_enemy_hp` is on (our champion already reads enemy HP for TTK, so this is on in practice). Enemy energy and enemy upgrade list are not in ActorObs. Distance to unseen enemies is omniscient in this metric; also see the nearest_visible slice.

Champion today: Champion keeps fighting range via gunRange/standoff/ambush, but has no explicit 'hold 130 m' spacing rule.

Family overlap: Engage family is alive (B14/B16/B30 in the stack). Dead or recently lost in this neighborhood: B108 finish-burst CLOSE −0.31, B26 multi-threat race LOSS, B98 no-early-finish LOSS, P35 unseen-target (UNSEEN_TARGET_ON) retired on a drop set-total VETO, P36 claim-cubes (CLAIM_WATCHED_ON) retired (paired sim loss after the t≥40 s fix). Do not resubmit those. A new rule has to be a different mechanism (for example a visible third-party / HP-vs-N condition the champion does not already have).

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 3. movement: mean speed (m/s) [b_alive=alive_5_8]

**IF** alive is alive_5_8 **THEN** do more of / raise `mean speed (m/s)` (high 8.06 vs low 5.05, diff +3.01, d=0.53; 10858/10766 ticks, 97/95 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Healthy: full walk (NO_SNEAK_ON). Hurt (HP < 0.3 or recent damage): silent cap 5.0 m/s and hide/heal. Zone trips use zoneWalk=0.8 and a 10 s buffer.

Family overlap: No dedicated unstuck or mid-game pathing rule has been site-tested (B116 movement is still on hold; sim-only strafe-only screened worse than the then-champion; combined movement was mixed and failed the drop-reach / late-survival bar). P32 fight-fade (FIGHT_FADE_ON) retired: deaths <40 s rose 33→35 at base 0. P40b roof jet route (ROOF_JET_ROUTE_ON) is building — that is roof-loot pathing, not an unstuck policy. Any movement rule must keep the drop run, the P29 midring settle, and P34 lethal release intact, and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 4. movement: mean speed (m/s) [b_hp=hp_lt_30]

**IF** hp is hp_lt_30 **THEN** do more of / raise `mean speed (m/s)` (high 9.16 vs low 5.93, diff +3.23, d=0.53; 1644/1678 ticks, 117/127 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Healthy: full walk (NO_SNEAK_ON). Hurt (HP < 0.3 or recent damage): silent cap 5.0 m/s and hide/heal. Zone trips use zoneWalk=0.8 and a 10 s buffer.

Family overlap: No dedicated unstuck or mid-game pathing rule has been site-tested (B116 movement is still on hold; sim-only strafe-only screened worse than the then-champion; combined movement was mixed and failed the drop-reach / late-survival bar). P32 fight-fade (FIGHT_FADE_ON) retired: deaths <40 s rose 33→35 at base 0. P40b roof jet route (ROOF_JET_ROUTE_ON) is building — that is roof-loot pathing, not an unstuck policy. Any movement rule must keep the drop run, the P29 midring settle, and P34 lethal release intact, and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 5. movement: silent (speed ≤ 5 m/s) fraction [b_hp=hp_lt_30]

**IF** hp is hp_lt_30 **THEN** do less of / lower `silent (speed ≤ 5 m/s) fraction` (high 28.0% vs low 51.3%, diff -23.3 pp, d=-0.49; 1644/1678 ticks, 117/127 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Champion applies the 5.0 m/s cap only while hurt (NO_SNEAK_ON).

Family overlap: No dedicated unstuck or mid-game pathing rule has been site-tested (B116 movement is still on hold; sim-only strafe-only screened worse than the then-champion; combined movement was mixed and failed the drop-reach / late-survival bar). P32 fight-fade (FIGHT_FADE_ON) retired: deaths <40 s rose 33→35 at base 0. P40b roof jet route (ROOF_JET_ROUTE_ON) is building — that is roof-loot pathing, not an unstuck policy. Any movement rule must keep the drop run, the P29 midring settle, and P34 lethal release intact, and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 6. movement: stuck fraction (≈5 s almost unmoved, not in a drop ring) [b_alive=alive_5_8]

**IF** alive is alive_5_8 **THEN** do less of / lower `stuck fraction (≈5 s almost unmoved, not in a drop ring)` (high 12.0% vs low 30.8%, diff -18.8 pp, d=-0.47; 10858/10766 ticks, 97/95 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Nav paths exist; there is no separate unstuck policy in params. Movement builds that tried random strafe / combined movement are on hold and were sim-only as of this writing. Mid-game unstuck has never been site-tested.

Family overlap: No unstuck policy has been site-tested. P40b is roof-loot jet routing, not mid-game unstuck. Keep the drop run and midring settle intact. No dedicated unstuck or mid-game pathing rule has been site-tested (B116 movement is still on hold; sim-only strafe-only screened worse than the then-champion; combined movement was mixed and failed the drop-reach / late-survival bar). P32 fight-fade (FIGHT_FADE_ON) retired: deaths <40 s rose 33→35 at base 0. P40b roof jet route (ROOF_JET_ROUTE_ON) is building — that is roof-loot pathing, not an unstuck policy. Any movement rule must keep the drop run, the P29 midring settle, and P34 lethal release intact, and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 7. movement: mean speed (m/s) [b_alive=alive_2_4]

**IF** alive is alive_2_4 **THEN** do more of / raise `mean speed (m/s)` (high 7.88 vs low 5.74, diff +2.14, d=0.38; 6076/3957 ticks, 64/58 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Healthy: full walk (NO_SNEAK_ON). Hurt (HP < 0.3 or recent damage): silent cap 5.0 m/s and hide/heal. Zone trips use zoneWalk=0.8 and a 10 s buffer.

Family overlap: No dedicated unstuck or mid-game pathing rule has been site-tested (B116 movement is still on hold; sim-only strafe-only screened worse than the then-champion; combined movement was mixed and failed the drop-reach / late-survival bar). P32 fight-fade (FIGHT_FADE_ON) retired: deaths <40 s rose 33→35 at base 0. P40b roof jet route (ROOF_JET_ROUTE_ON) is building — that is roof-loot pathing, not an unstuck policy. Any movement rule must keep the drop run, the P29 midring settle, and P34 lethal release intact, and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 8. movement: stuck fraction (≈5 s almost unmoved, not in a drop ring) [b_alive=alive_2_4]

**IF** alive is alive_2_4 **THEN** do less of / lower `stuck fraction (≈5 s almost unmoved, not in a drop ring)` (high 9.6% vs low 21.0%, diff -11.4 pp, d=-0.33; 6076/3957 ticks, 64/58 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Nav paths exist; there is no separate unstuck policy in params. Movement builds that tried random strafe / combined movement are on hold and were sim-only as of this writing. Mid-game unstuck has never been site-tested.

Family overlap: No unstuck policy has been site-tested. P40b is roof-loot jet routing, not mid-game unstuck. Keep the drop run and midring settle intact. No dedicated unstuck or mid-game pathing rule has been site-tested (B116 movement is still on hold; sim-only strafe-only screened worse than the then-champion; combined movement was mixed and failed the drop-reach / late-survival bar). P32 fight-fade (FIGHT_FADE_ON) retired: deaths <40 s rose 33→35 at base 0. P40b roof jet route (ROOF_JET_ROUTE_ON) is building — that is roof-loot pathing, not an unstuck policy. Any movement rule must keep the drop run, the P29 midring settle, and P34 lethal release intact, and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 9. cover: hold (speed ≤ 2 m/s) fraction [b_hp=hp_lt_30]

**IF** hp is hp_lt_30 **THEN** do less of / lower `hold (speed ≤ 2 m/s) fraction` (high 20.2% vs low 43.2%, diff -23.0 pp, d=-0.51; 1644/1678 ticks, 117/127 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Champion holds/heals in place in several modes; NO_SNEAK_ON stops healthy hide-walks.

Family overlap: B5b is in the stack. Hold-behind-cover, post-kill cover, late 1+LOS cover, and wider/rear-step variants LOSS. P24 heal-in-cover CLOSE 3.79. Do not resubmit those. P45 Step A may use building/tree cover only as one input to midring *spot choice* — that is a different mechanism, and it is already assigned. A cover rule only ranks if it is a clearly different, state-conditioned trigger. Watcher cover here is still buildings only; trees are not this proxy.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 10. movement: silent (speed ≤ 5 m/s) fraction [b_hp=hp_30_50]

**IF** hp is hp_30_50 **THEN** do less of / lower `silent (speed ≤ 5 m/s) fraction` (high 33.5% vs low 48.6%, diff -15.1 pp, d=-0.31; 2041/2273 ticks, 116/124 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Champion applies the 5.0 m/s cap only while hurt (NO_SNEAK_ON).

Family overlap: No dedicated unstuck or mid-game pathing rule has been site-tested (B116 movement is still on hold; sim-only strafe-only screened worse than the then-champion; combined movement was mixed and failed the drop-reach / late-survival bar). P32 fight-fade (FIGHT_FADE_ON) retired: deaths <40 s rose 33→35 at base 0. P40b roof jet route (ROOF_JET_ROUTE_ON) is building — that is roof-loot pathing, not an unstuck policy. Any movement rule must keep the drop run, the P29 midring settle, and P34 lethal release intact, and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 11. movement: mean speed (m/s) [b_hp=hp_30_50]

**IF** hp is hp_30_50 **THEN** do more of / raise `mean speed (m/s)` (high 8.10 vs low 6.24, diff +1.86, d=0.31; 2041/2273 ticks, 116/124 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Healthy: full walk (NO_SNEAK_ON). Hurt (HP < 0.3 or recent damage): silent cap 5.0 m/s and hide/heal. Zone trips use zoneWalk=0.8 and a 10 s buffer.

Family overlap: No dedicated unstuck or mid-game pathing rule has been site-tested (B116 movement is still on hold; sim-only strafe-only screened worse than the then-champion; combined movement was mixed and failed the drop-reach / late-survival bar). P32 fight-fade (FIGHT_FADE_ON) retired: deaths <40 s rose 33→35 at base 0. P40b roof jet route (ROOF_JET_ROUTE_ON) is building — that is roof-loot pathing, not an unstuck policy. Any movement rule must keep the drop run, the P29 midring settle, and P34 lethal release intact, and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### 12. movement: stuck fraction (≈5 s almost unmoved, not in a drop ring) [b_hp=hp_30_50]

**IF** hp is hp_30_50 **THEN** do less of / lower `stuck fraction (≈5 s almost unmoved, not in a drop ring)` (high 5.7% vs low 14.7%, diff -9.0 pp, d=-0.30; 2041/2273 ticks, 116/124 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Nav paths exist; there is no separate unstuck policy in params. Movement builds that tried random strafe / combined movement are on hold and were sim-only as of this writing. Mid-game unstuck has never been site-tested.

Family overlap: No unstuck policy has been site-tested. P40b is roof-loot jet routing, not mid-game unstuck. Keep the drop run and midring settle intact. No dedicated unstuck or mid-game pathing rule has been site-tested (B116 movement is still on hold; sim-only strafe-only screened worse than the then-champion; combined movement was mixed and failed the drop-reach / late-survival bar). P32 fight-fade (FIGHT_FADE_ON) retired: deaths <40 s rose 33→35 at base 0. P40b roof jet route (ROOF_JET_ROUTE_ON) is building — that is roof-loot pathing, not an unstuck policy. Any movement rule must keep the drop run, the P29 midring settle, and P34 lethal release intact, and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

## Overlaps an in-flight or research idea

Do not start a duplicate. These still show a high-vs-low gap, so the assigned owner should keep them in mind.

### F1. loadout: cubes held [b_phase=mid] — overlaps an in-flight or research idea

**IF** phase is mid **THEN** do more of / raise `cubes held` (high 13.67 vs low 9.47, diff +4.20, d=0.40; 8207/7323 ticks, 77/71 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Our cubes and upgrades are always known. Visible enemies expose `cubes` but not their upgrade list.

Champion today: Farm (FARM_ENEMY_M=160, hunt 150 m) and the early laser rush (45 s, trip ≤ 250 m) plus LATE_LIGHT_ON after that for gun-only, are in the stack. P34 lethal release is on. A dedicated upgrade-order build (B21) lost on the site. P43 (UPGRADE_DPS_TIER_ON) is research only. Late cubes-held at 2–4 alive is partly a survival confound.

Family overlap: Farm and laser rush are in the stack. P25/P25b cube memory is HOLD; P25c is a follow-up in the queue. P43 is research. Do not start a second cube-memory build. LASER_RUSH + LATE_LIGHT + LIGHT_AMBUSH are in the stack. P34 lethal release (LETHAL_RELEASE_ON, margin 0.8, min t 40 s, no release while a drop run/hold is possible) is the champion, site 4.38. B21 upgrade-order LOSS. P38b lull reload (LULL_RELOAD_ON) is building. Research, not yet built: P41 sound look (EARS_LOOK_ON), P42 no new laser charge on a zone trip (ZONE_TRIP_NO_CHARGE_ON), P43 upgrade pick by DPS gain (UPGRADE_DPS_TIER_ON), P44 no laser charge into a lightning holder within 54 m (LASER_SHORT_GUARD_ON). Opening / first-30s family is dead. Do not spend a slot on early objective swaps, and do not start a fourth laser change that overlaps P34b2 / P42 / P44.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### F2. movement: boost fraction of ticks [b_eng=eng_0] — overlaps an in-flight or research idea

**IF** eng is eng_0 **THEN** do more of / raise `boost fraction of ticks` (high 10.3% vs low 3.9%, diff +6.4 pp, d=0.25; 26639/27690 ticks, 122/128 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Boost is available. No state-conditioned boost policy is written down beyond ordinary travel; NO_SNEAK_ON means healthy movement is full walk speed. Hurt movement is capped at 5.0 m/s.

Family overlap: P26 (HEALTHY_BOOST_ON) is HOLD on new 20 s+ pins (Doug decides). P26b retired: the drop-safe gate left 0/96 activations. No dedicated unstuck or mid-game pathing rule has been site-tested (B116 movement is still on hold; sim-only strafe-only screened worse than the then-champion; combined movement was mixed and failed the drop-reach / late-survival bar). P32 fight-fade (FIGHT_FADE_ON) retired: deaths <40 s rose 33→35 at base 0. P40b roof jet route (ROOF_JET_ROUTE_ON) is building — that is roof-loot pathing, not an unstuck policy. Any movement rule must keep the drop run, the P29 midring settle, and P34 lethal release intact, and beat the champion on end-game survival in the sim before a slot is used.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

## Already covered by later experiments (do not re-test)

These slices would have ranked highly on raw high-vs-low size, but a later build already tested (and usually retired or absorbed) the mechanism.

### C1. evasion: speed while HP < 35% (m/s) [b_alive=alive_5_8] — COVERED, do not re-test

**IF** alive is alive_5_8 **THEN** do more of / raise `speed while HP < 35% (m/s)` (high 9.05 vs low 4.95, diff +4.10, d=0.68; 673/685 ticks, 70/76 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Family overlap: P31 (LATE_HURT_BOOST_ON) retired: fired in 0/192 games. Hurt-evasion P30–P33 all retired. Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Hurt-evasion P30–P33 are all retired: P30 FACE_ATTACKER_ON (front-arc) screen VETO on drop arrivals and early deaths; P31 LATE_HURT_BOOST_ON fired 0/192; P32 FIGHT_FADE_ON retired on early deaths; P33 HURT_RETREAT_FAR_ON fired 0/96 with the drop gate. P37 HEAL_PICKUP_ON retired on drop set-total losses. P24 heal-in-cover CLOSE 3.79 vs then-champion 4.17. Do not resubmit that family without a new mechanism. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### C2. evasion: speed while HP < 35% (m/s) [b_alive=alive_2_4] — COVERED, do not re-test

**IF** alive is alive_2_4 **THEN** do more of / raise `speed while HP < 35% (m/s)` (high 9.18 vs low 5.32, diff +3.86, d=0.66; 551/417 ticks, 54/56 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Family overlap: P31 (LATE_HURT_BOOST_ON) retired: fired in 0/192 games. Hurt-evasion P30–P33 all retired. Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Hurt-evasion P30–P33 are all retired: P30 FACE_ATTACKER_ON (front-arc) screen VETO on drop arrivals and early deaths; P31 LATE_HURT_BOOST_ON fired 0/192; P32 FIGHT_FADE_ON retired on early deaths; P33 HURT_RETREAT_FAR_ON fired 0/96 with the drop gate. P37 HEAL_PICKUP_ON retired on drop set-total losses. P24 heal-in-cover CLOSE 3.79 vs then-champion 4.17. Do not resubmit that family without a new mechanism. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### C3. evasion: speed while HP < 35% (m/s) [b_eng=eng_0] — COVERED, do not re-test

**IF** eng is eng_0 **THEN** do more of / raise `speed while HP < 35% (m/s)` (high 7.37 vs low 3.35, diff +4.02, d=0.73; 1020/1018 ticks, 73/87 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Family overlap: P31 (LATE_HURT_BOOST_ON) retired: fired in 0/192 games. Hurt-evasion P30–P33 all retired. Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Hurt-evasion P30–P33 are all retired: P30 FACE_ATTACKER_ON (front-arc) screen VETO on drop arrivals and early deaths; P31 LATE_HURT_BOOST_ON fired 0/192; P32 FIGHT_FADE_ON retired on early deaths; P33 HURT_RETREAT_FAR_ON fired 0/96 with the drop gate. P37 HEAL_PICKUP_ON retired on drop set-total losses. P24 heal-in-cover CLOSE 3.79 vs then-champion 4.17. Do not resubmit that family without a new mechanism. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### C4. evasion: speed while HP < 35% (m/s) [b_phase=mid] — COVERED, do not re-test

**IF** phase is mid **THEN** do more of / raise `speed while HP < 35% (m/s)` (high 9.26 vs low 5.17, diff +4.09, d=0.70; 667/603 ticks, 62/68 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Family overlap: P31 (LATE_HURT_BOOST_ON) retired: fired in 0/192 games. Hurt-evasion P30–P33 all retired. Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Hurt-evasion P30–P33 are all retired: P30 FACE_ATTACKER_ON (front-arc) screen VETO on drop arrivals and early deaths; P31 LATE_HURT_BOOST_ON fired 0/192; P32 FIGHT_FADE_ON retired on early deaths; P33 HURT_RETREAT_FAR_ON fired 0/96 with the drop gate. P37 HEAL_PICKUP_ON retired on drop set-total losses. P24 heal-in-cover CLOSE 3.79 vs then-champion 4.17. Do not resubmit that family without a new mechanism. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### C5. evasion: speed while HP < 35% (m/s) [b_near=near80_0] — COVERED, do not re-test

**IF** near is near80_0 **THEN** do more of / raise `speed while HP < 35% (m/s)` (high 9.33 vs low 5.56, diff +3.77, d=0.63; 1446/1366 ticks, 105/104 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Family overlap: P31 (LATE_HURT_BOOST_ON) retired: fired in 0/192 games. Hurt-evasion P30–P33 all retired. Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Hurt-evasion P30–P33 are all retired: P30 FACE_ATTACKER_ON (front-arc) screen VETO on drop arrivals and early deaths; P31 LATE_HURT_BOOST_ON fired 0/192; P32 FIGHT_FADE_ON retired on early deaths; P33 HURT_RETREAT_FAR_ON fired 0/96 with the drop gate. P37 HEAL_PICKUP_ON retired on drop set-total losses. P24 heal-in-cover CLOSE 3.79 vs then-champion 4.17. Do not resubmit that family without a new mechanism. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### C6. loadout: cubes held [b_alive=alive_2_4] — COVERED, do not re-test

**IF** alive is alive_2_4 **THEN** do more of / raise `cubes held` (high 16.36 vs low 12.59, diff +3.78, d=0.33; 6076/3957 ticks, 64/58 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count). Our cubes and upgrades are always known. Visible enemies expose `cubes` but not their upgrade list.

Champion today: Farm (FARM_ENEMY_M=160, hunt 150 m) and the early laser rush (45 s, trip ≤ 250 m) plus LATE_LIGHT_ON after that for gun-only, are in the stack. P34 lethal release is on. A dedicated upgrade-order build (B21) lost on the site. P43 (UPGRADE_DPS_TIER_ON) is research only. Late cubes-held at 2–4 alive is partly a survival confound.

Family overlap: Late cubes-held is partly a survival confound (teams that already lived and farmed). P36 (CLAIM_WATCHED_ON) retired on a paired sim loss. P43 (UPGRADE_DPS_TIER_ON) is research on upgrade *choice*, not a 'hold more cubes' rule. LASER_RUSH + LATE_LIGHT + LIGHT_AMBUSH are in the stack. P34 lethal release (LETHAL_RELEASE_ON, margin 0.8, min t 40 s, no release while a drop run/hold is possible) is the champion, site 4.38. B21 upgrade-order LOSS. P38b lull reload (LULL_RELOAD_ON) is building. Research, not yet built: P41 sound look (EARS_LOOK_ON), P42 no new laser charge on a zone trip (ZONE_TRIP_NO_CHARGE_ON), P43 upgrade pick by DPS gain (UPGRADE_DPS_TIER_ON), P44 no laser charge into a lightning holder within 54 m (LASER_SHORT_GUARD_ON). Opening / first-30s family is dead. Do not spend a slot on early objective swaps, and do not start a fourth laser change that overlaps P34b2 / P42 / P44.

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### C7. evasion: speed while HP < 35% (m/s) [b_eng=eng_1] — COVERED, do not re-test

**IF** eng is eng_1 **THEN** do more of / raise `speed while HP < 35% (m/s)` (high 10.97 vs low 8.01, diff +2.96, d=0.50; 931/1064 ticks, 114/125 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Family overlap: P31 (LATE_HURT_BOOST_ON) retired: fired in 0/192 games. Hurt-evasion P30–P33 all retired. Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Hurt-evasion P30–P33 are all retired: P30 FACE_ATTACKER_ON (front-arc) screen VETO on drop arrivals and early deaths; P31 LATE_HURT_BOOST_ON fired 0/192; P32 FIGHT_FADE_ON retired on early deaths; P33 HURT_RETREAT_FAR_ON fired 0/96 with the drop gate. P37 HEAL_PICKUP_ON retired on drop set-total losses. P24 heal-in-cover CLOSE 3.79 vs then-champion 4.17. Do not resubmit that family without a new mechanism. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### C8. evasion: speed while HP < 35% (m/s) [b_alive=alive_9_12] — COVERED, do not re-test

**IF** alive is alive_9_12 **THEN** do more of / raise `speed while HP < 35% (m/s)` (high 9.01 vs low 6.45, diff +2.57, d=0.42; 558/537 ticks, 56/77 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Family overlap: P31 (LATE_HURT_BOOST_ON) retired: fired in 0/192 games. Hurt-evasion P30–P33 all retired. Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Hurt-evasion P30–P33 are all retired: P30 FACE_ATTACKER_ON (front-arc) screen VETO on drop arrivals and early deaths; P31 LATE_HURT_BOOST_ON fired 0/192; P32 FIGHT_FADE_ON retired on early deaths; P33 HURT_RETREAT_FAR_ON fired 0/96 with the drop gate. P37 HEAL_PICKUP_ON retired on drop set-total losses. P24 heal-in-cover CLOSE 3.79 vs then-champion 4.17. Do not resubmit that family without a new mechanism. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### C9. evasion: speed while HP < 35% (m/s) [b_alive=alive_13_16] — COVERED, do not re-test

**IF** alive is alive_13_16 **THEN** do more of / raise `speed while HP < 35% (m/s)` (high 9.44 vs low 7.06, diff +2.38, d=0.37; 249/531 ticks, 44/76 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Family overlap: P31 (LATE_HURT_BOOST_ON) retired: fired in 0/192 games. Hurt-evasion P30–P33 all retired. Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Hurt-evasion P30–P33 are all retired: P30 FACE_ATTACKER_ON (front-arc) screen VETO on drop arrivals and early deaths; P31 LATE_HURT_BOOST_ON fired 0/192; P32 FIGHT_FADE_ON retired on early deaths; P33 HURT_RETREAT_FAR_ON fired 0/96 with the drop gate. P37 HEAL_PICKUP_ON retired on drop set-total losses. P24 heal-in-cover CLOSE 3.79 vs then-champion 4.17. Do not resubmit that family without a new mechanism. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

### C10. evasion: speed while HP < 35% (m/s) [b_near=near80_1] — COVERED, do not re-test

**IF** near is near80_1 **THEN** do more of / raise `speed while HP < 35% (m/s)` (high 8.70 vs low 6.40, diff +2.30, d=0.36; 514/679 ticks, 82/108 matches; ok).

Observability: Implementable: uses only our own obs (hp, energy, loadout, pos, zone, alive count).

Champion today: Champion retreats when HP < 0.3 and under fire, unless the 1v1 TTK rule keeps it in the fight; heal at ≤5 m/s until HP > 0.9, and standing still to heal under 90% is unchanged by NO_SNEAK_ON.

Family overlap: P31 (LATE_HURT_BOOST_ON) retired: fired in 0/192 games. Hurt-evasion P30–P33 all retired. Retreat/heal is in the stack (B5b, retreatHp, NO_SNEAK_ON while healthy). Crossfire break (B60) already leaves a 2-LOS fight. Hurt-evasion P30–P33 are all retired: P30 FACE_ATTACKER_ON (front-arc) screen VETO on drop arrivals and early deaths; P31 LATE_HURT_BOOST_ON fired 0/192; P32 FIGHT_FADE_ON retired on early deaths; P33 HURT_RETREAT_FAR_ON fired 0/96 with the drop gate. P37 HEAL_PICKUP_ON retired on drop set-total losses. P24 heal-in-cover CLOSE 3.79 vs then-champion 4.17. Do not resubmit that family without a new mechanism. Random torso sway is the wrong mechanism (rear armor is 180° front / 180° back).

Sim test proposal: one flag on P34, this state condition only, no other changes. Gate: `check.py` plus the usual 4-base trees-on screens and the size check; **keep drop-run reach, midring settle, lethal release, and late survival at or above the champion**, and look at end-game survival and score, not this metric alone. Trigger frequency in our house-sim is not auto-counted in this folder (Watcher n is the showdown slice above); estimate frequency from `/workspace/tester` or a paired sim log when the builder runs the flag.

## Already-tested families (do not recycle without a new mechanism)

From `coord/data/site_results.csv` and `coord/data/ideas/`, checked while writing this file:

- **midring / zone sit:** P29 KEEP 4.35 (MIDRING_SETTLE_ON, now in the champion). P29b retired (0/384 fires). P28 midring patrol retired on drop-arrival losses. P45 midring spot quality is Step A, already assigned.
- **lethal laser release:** P34 KEEP 4.38 (LETHAL_RELEASE_ON), current champion. Follow-ups already assigned: P34b2 lethal drop gate (building), P42 no charge on a zone trip (research), P44 lightning-holder guard (research). Do not start a fourth overlapping laser change.
- **hurt-evasion:** P30–P33 all retired (front-arc VETO; late hurt boost 0/192; fight fade early deaths; hurt retreat-far 0/96). P37 heal-pickup retired on drop set totals. P24 heal-in-cover CLOSE 3.79.
- **drops:** B113 KEEP 4.17 (200 m, still in the stack). Later: B115 CLOSE 4.13 (−0.04, 10 s lead), B118 CLOSE 4.17 tie (260 m), P20 CLOSE 4.17 tie (hurt and unseen), P27 CLOSE 4.13 (drop-crossfire skip). Rank last if the idea is another reach/lead/hurt-gate tweak.
- **standoff:** P-B-001 KEEP 4.06 at 60 s (still in the stack). P-B-006 CLOSE 4.02 (−0.08 at 45 s).
- **engage / claim:** finish-burst B108 CLOSE −0.31; multi-threat race B26 LOSS; no-early-finish B98 LOSS; P35 unseen-target retired (drop set-total VETO); P36 claim-cubes retired (paired sim loss).
- **cover:** several hold / late-cover / wider-search LOSS after B5b KEEP; P24 CLOSE 3.79.
- **lightning:** ambush widening to uncharged-laser holders (B106) CLOSE −0.21; late-walk distance/start tweaks tied or lost.
- **opening / first 30 s:** dead (ties at 3.79, later instruction to stop building first-30s fixes).
- **threat-forecast:** P-D-002 CLOSE −0.27.
- **cube memory / healthy boost:** P25/P25b HOLD (new 20 s+ pins; Doug decides); P25c in the queue; P26 HOLD on pins; P26b retired (0/96 fires).
- **movement unstuck:** not site-tested; B116 on hold; sim-only results mixed and not a site candidate yet. P40b is roof-loot jet routing, not unstuck.

## Conflicts with the champion (summary)

Any rule that asks us to abandon the 200 m drop run, the not-hurt drop gate, the P29 midring settle, P34 lethal release, zone-first travel, or the 2-LOS crossfire break is in conflict with behaviors we should keep unless a sim test clearly beats them on end-game score. Rules that add a *new state condition* on top of those (for example, pick a better midring *spot*, or unstick mid-game pathing without dropping the settle) are extensions, not automatic replacements.

## What this pass could not measure

- Enemy energy and enemy upgrade *choices* as the bot would (or would not) see them: energy is not in `ActorObs`; upgrades are not either (cubes are).
- Tree/canopy vision, 5 s memory tracks, and true planned paths. Official screens now run with trees on; this Watcher cover proxy is still buildings only.
- Independent body yaw (not in the stream).
- Practice-squad trigger frequencies (this corpus is exhibition FFA). Use the sim for that.
- 8:00 timeout tables (rare in these showdowns).

