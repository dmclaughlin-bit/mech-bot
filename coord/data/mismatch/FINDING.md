# Station mismatch, seed 2021 (Diego's Claude, Sun Nov 22 ~2:10 AM ET)

Sim: hazard sim `diego/mac-hazard-sim` 39c7894 (SIM_DUMP_DIR per-tick dump), trees on, `--jobs 1`, seed 2021.
Bots: P48 b9492c6, P49b 0c6b134. Cloud dumps are in `cloud/`. Mac dumps stay on the Mac (no push access) at ~/Developer/MechRoyale/mac-screens/mismatch/.

| bot | cloud (Xeon x86, bun 1.4.4) | Mac (Apple M4 Pro ARM, bun 1.4.5 and 1.4.4) |
|---|---|---|
| P48 | 11th, died 212.40, pause20 120–161 (= official row) | 11th, died 209.30, pause20 120–161 |
| P49b | 10th, died 112.75, no pause20 | 10th, died 112.75, no pause20 (identical) |

**First diverging tick: 36 (t = 1.8 s), the same for both bots.** Only one field differs: our `act.aim[1]` = −0.11205140009202387 (Mac) vs …386 (cloud), a 1-ulp float difference. Move, boost, fire and every mech/death/drop field are identical.
- Bot answer time there: Mac 0.11–0.15 ms, cloud 0.28–0.93 ms (deadline 30 ms). **Timing is not the cause.**
- P48 growth: 247/2093 ticks with ulp-level aim noise. First world-state diff at tick 3002 (~150 s): house mech 10's y is 53.130 vs 53.131. First real act diff at tick 3918 (~196 s): aim yaw −1.743 vs −1.824. After that the games split.
- **bun version ruled out:** the Mac rerun on bun 1.4.4 gives a dump identical to 1.4.5 (died 209.30).

**Finding (Verified for seed 2021):** the mismatch is CPU architecture. ARM vs x86 `Math` functions (trig/sqrt/pow) differ by 1 ulp. That noise builds up over ~150–200 s until a decision flips, which is why every Mac-vs-Tester difference has been late-game, while each station repeats itself exactly. Neither the wall-clock deadline nor the bun version explains it.

**Consequences:**
- Judge Mac builds only against the Mac champion baseline (already the rule).
- A single game's late-game result is not comparable across stations.
- Bit-exact stations would need one CPU architecture, or rounding at decision points in bot and sim (a big change; not proposed).

**P49b game 2021:** the Mac and the cloud (which matches Sim Tester 384/384 on P48) agree on P49b 2021: no pause20, died 112.75. If Sim Tester's stall (c) was on 2021, it isn't the station split. It is more likely a different metric or setting (e.g. `--jobs` or the sim revision). Compare with Sim Tester's posted trace.
