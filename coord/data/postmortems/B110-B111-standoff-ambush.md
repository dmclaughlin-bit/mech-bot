# Post-mortems: B110 #108 (standoff 90 s, site 3.96) and B111 #109 (ambush 100 m, site 4.10)
Source: Mech Sim Tester, filed by Grok Sat Nov 21 4:30 PM ET. screens.csv rows in e988a16.

## B110 / #108 (6124894)
Full write-up: https://github.com/dmclaughlin-bit/mech-bot/pull/108#issuecomment-7069360837
Gate PASS, flag-0 identical, paired +0.000 ± 0.018 (3 better / 186 tied / 3 worse). Delayed break bites in 8/192 games, all at 60-90 s, mixed (3/3/2). Biggest loss seed 2034: 1st-place lightning+laser survival became a 187 s gun death. Drops, early deaths, survival unchanged.

## B111 / #109 (e2ca93d)
Full write-up: https://github.com/dmclaughlin-bit/mech-bot/pull/109#issuecomment-7069498042
Gate PASS, flag-0 identical, paired -0.042 ± 0.029 (2 / 186 / 4). 90-100 m ambush band appears in 9/192 games; the 4 worse games die ~28 s earlier (mid-game). Biggest loss seed 3038 (-4): lost the laser, died at 47 s.

## Takeaway
Both knobs change under 5% of sim games; the sim does not explain the site drops (site losses come from play the sim house bots don't produce). Engagement-range/standoff family: deprioritize per the queue-priority rule.
