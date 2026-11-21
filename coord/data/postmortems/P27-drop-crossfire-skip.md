# P27 drop crossfire skip (PR #137, 7df3a4a6), BB-004FA2FF, 4.13 (Sat Nov 21, submitted 6:50 PM ET)
1. Expected: about neutral. Sim paired -0.010 +/- 0.029 (2000+3000) and -0.021 +/- 0.038 (4000+5000); fired in 11 of 192 games on each set; hoped for more drop captures (PR #129 sim: rings 12->14, captures 10->12).
2. What happened: site 4.13 vs champion 4.17 (-0.04), wait 95 ms. The sim was slightly negative on both sets, the same direction.
3. Supported: staying in a drop while 2+ enemies can see us does not raise the site score. Only possible: the 2 s no-hit window is too permissive against house bots that hit harder than the sim; -0.04 is within one test's noise.
4. Moved down: drop-family tweaks with no new mechanism (0 wins in 5 tries on 4.17: lead 10 s 4.13, reach 260 m tie, hurt drop tie, contest tie, crossfire skip 4.13). Retired: crossfire-skip variants. Moved up: none; P26 and P25b wait on Doug's pin ruling.
5. Next action: Doug rules on whether new 20 s+ pins with the feature inactive veto P26/P25b; Mech Builder (Diego's Claude as backup) builds a new non-drop, non-dead-family idea to refill the reserve. Settled by a complete both-set screen and the next site score.
