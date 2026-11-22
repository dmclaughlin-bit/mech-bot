# Positive findings ledger (Doug, Sun Nov 22 12:36 AM ET)

Doug: "rather than having a large amount of ideas, lets just have the system build on top of the information that you gather (positive findings)."

Rules:
- After every screen or site score, the coordinator or loop adds what WORKED here, even when the build was vetoed or lost. Each entry names the source build or PR, the exact numbers, and whether it's proven (site) or a sim/ladder signal.
- New idea records must cite at least one finding ID below (field `builds_on`). Ideas with no finding behind them go to the bottom of the queue.
- A rebuild that keeps a finding's good part and fixes the veto that killed it ranks ahead of a brand-new idea (example: P49 to P49b).
- One change per test (D3) still applies. A finding feeds the next single change; nothing gets bundled.

## Proven on the site (already in the champion)
- F1 Midring zone settle (P29): site win.
- F2 Lethal laser release (P34): site win.
- F3 Tree-cover retreat under fire (P48): site 4.44, +0.06 over P34. Current champion.

## Sim positives from builds that didn't make it (reuse the good part)
- F4 Tree heal raises end-game survival (P49 #172, 38aa957): survivors 2 to 3 and 3 to 5; means +0.000 and +0.089; deaths before 40 s flat. It was killed by heal-hold pins (29 s on 3086; pause games 2 to 5). Follow-up: P49b, which caps each heal at 8 s. Site test on Doug's order 12:34 AM ET: 4.02 vs 4.44 (BB-A82B6F7A), a big loss. That confirms the heal-hold pins cost real placement, so the uncapped heal is a NEGATIVE finding. P49b must show the pins gone (2022, 3066, 3086) and no rise in pause games before it gets a slot.
- F5 Listening/look-around doesn't hurt early survival (P41 #173, c21d23b): deaths before 40 s 48 to 47 and 38 to 38; drops held 7 and 5; sim +0.052 and +0.042 (info only). It was killed by downstream stalls (2021, 5036) that happened while the look wasn't active. Useful only together with a stall guard.
- F6 Upgrade DPS tier (P43b): site 4.35, a loss. Treat it as a negative finding: don't build on it.
- F7 Rooftop jet route (P40d, P40b): site 4.35 and 4.29, losses. Negative finding: don't build on it.

## Signals from real matches (Mech Watcher ladder, correlation only)
- F8 Early farming (medium confidence): winners alive at 60 s had 4.2 cubes vs 2.2 and 1.9 upgrades vs 1.2. Feeds P52.
- F9 Saving boost at low HP: winners boost below 35% HP 19% of the time vs 37%. Feeds P53.
- F10 Early spacing: nearest enemy in the first 30 s is 145 m for winners vs 117 m.

## What the champion doesn't do (saves us building dead ideas)
- N1 P48 almost never just stands still mid-game (P46 Step A 0/192 and 1/192), so stuck-in-the-open fixes don't fire.

## Added by the 10-minute loop, 12:42 AM ET Sun
- F11 Early farming cuts early deaths (P52 #169, 74b6ee4, Diego's Mac sim): died<40 s 48 to 45 and 38 to 37; means +0.047 and +0.016; cost: drop-ring total 8 to 3 on 2000+3000. Sim signal; supports F8.
- F12 Tree rotate on the zone trip is safe (P47 #171, 9d388ad, Diego's Mac sim): no veto, survivors 3 to 4 on 4000+5000, all hazard counts flat; low activation (13 and 15 of 192). Sim signal; builds on F3.

## Site pattern (added 12:43 AM ET)
- N2 Three different small single changes on P48 all scored exactly 4.35 on the site: P43b (upgrade tier), P40d (rooftop exit) and P47 (tree rotate; screened as sim-neutral, 13 and 15 of 192 activations). A sim-neutral change isn't a free test: so far each one cost about -0.09. Builds whose screens show no positive signal should rank below builds with a real positive (F4 survivors, F8/F11 early farming).
