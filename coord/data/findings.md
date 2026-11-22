# Positive findings ledger (Doug, Sun Nov 22 12:36 AM ET)

Doug: "rather than having a large amount of ideas, lets just have the system build on top of the information that you gather (positive findings)."

Rules:
- After every screen or site score, the coordinator or loop adds what WORKED here, even when the build was vetoed or lost. Each entry names the source build or PR, the exact numbers, and whether it's proven (site) or a sim/ladder signal.
- New idea records must cite at least one finding ID below (field `builds_on`). Ideas with no finding behind them go to the bottom of the queue.
- A rebuild that keeps a finding's good part and fixes the veto that killed it ranks ahead of a brand-new idea (example: P49 to P49b).
- One change per test (D3) still applies. A finding feeds the next single change; nothing gets bundled.

## Proven on the site (already in the champion)
- F1 Midring zone settle (P29): site 4.35 (BB-BAB3F961), +0.18 over 4.17. In the champion.
- F2 Lethal laser release (P34): site 4.38 (BB-ABEB42BF), +0.03 over P29. In the champion.
- F3 Tree-cover retreat under fire (P48): builders-3 4.44 (BB-94897D91), +0.06 over P34; builders-4 bar 3.75 (BB-5727119F). Current champion.

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
- F12 Tree rotate on the zone trip (P47 #171, 9d388ad): Mac screen had no veto, survivors 3 to 4 on 4000+5000, hazard counts flat, activation 13 and 15 of 192. Site test 12:40 AM ET: 4.35 vs 4.44 (BB-0B156FFA), LOSS (−0.09). Treat it as a negative finding: don't build on it. The sim-neutral screen did not transfer (see N2).

## Site pattern (added 12:43 AM ET)
- N2 Three different small single changes on P48 all scored exactly 4.35 on the site: P43b (upgrade tier), P40d (rooftop exit) and P47 (tree rotate; screened as sim-neutral, 13 and 15 of 192 activations). A sim-neutral change isn't a free test: so far each one cost about -0.09. Builds whose screens show no positive signal should rank below builds with a real positive (F4 survivors, F8/F11 early farming).

## Added by the 10-minute loop, 12:50 AM ET Sun
- N3 Early farming with enemies in view (P52 #169, 74b6ee4) scored 4.23 vs 4.44 on the site (BB-0AB39656), LOSS (-0.21). Site-proven negative: the sim's drop-ring loss (8 to 3 on 2000+3000) was real this time, and the sim gains in early deaths (48 to 45) did not carry over. Don't build on F11 as-is; F8 stays a ladder signal only. The drop-ring veto has now been wrong twice (P34, P48) and right twice (P43b small loss, P52 large loss): the bigger the drop loss, the worse the site score.
- N4 Zone-trip no-charge (P42, branch 39b342c, Mech Builder practice screen): negative on both bases (-0.083 on base 0, -0.240 on base 6000), and zone-trip kills fell 8 to 1 and 29 to 15. Laser charges during zone trips produce kills; don't suppress them. Retired before a PR. Sim signal.
- F13 P41 sound-cued look (#173, c21d23b): Mac screen found no veto, means +0.052/+0.005 and the 2021 pause gone; Sim Tester found 2 stall vetoes, and its verdict counts. Positive part to keep: removing the 2021 pause. Sim signal only.

## Added by the 10-minute loop, 12:58 AM ET Sun
- **F14 (Promising)** Late low-HP boost saving (P53 LOW_HP_BOOST_SAVE_ON c57e009, Diego's Mac screen vs Mac P48 baseline, #176): turned some long games into survivals or late gains: 2090, 4064, 5065 survived; 4001 7->3, 4007 8->3; survivors 2->2 and 3->4. Source P53, outcome B.
- **N5 (Verified on Mac)** Withholding boost below 35% HP during mid-game fights (40-145 s) costs more than the late gain: mean -0.016+/-0.063 and -0.047+/-0.107, kills 673->668 and 748->739, worse games outnumber better (20/12, 22/18), e.g. 5024 2->13 (death 143 s -> 56 s); new 20 s pause game 4007 (stall c, 4000+5000 2->3). Don't rebuild P53 as-is; refinement P53b gates the save on no enemy within gun range.

## Added by Mech Builder, 1:40 AM ET Sun (Coordinator request)
- **N6 (Sim, P58 Step A on P48 b9492c6, trees on, passivity 384/384)** Torso-view flip-flop: a cube more than 45 m away is visible only inside the torso's 120° view, and the torso turns with the walking direction, so walking to the midring settle point turns the cube out of view and turning back toward it brings it into view again. P48 then switches between "midring settle" and "farm, pickup". It's real but rare: more than 20 switches in 30 s in 2/192 games (2021: 63 switches at t 113-155; 3095: 55 at t 123-136) and 0/192 on 4000+5000. Neither game has a 20 s pause (2021: 11 stuck seconds; 3095: 0), and none of the champion's 20 s pause games (2047, 3060, 4087, 4090) switches. Don't build a settle/farm latch (P58, outcome D). Reuse: any goal that depends on a view-limited target can oscillate the same way.
- **N7 (Sim, P56 HELD_CHARGE_EARLY_RELEASE 12dc0eb, Mech Builder, outcome C)** P48 wastes few held laser charges: about 2% (27/1274 and 36/1627), all when cover breaks. About a third of early releases fired charges that would have landed anyway, and velocity is too noisy to predict a cover break. Base 6000: kills 358->356, laser hits 756->737. Base 0: kills 293->298, +0.010. Deaths before 40 s unchanged. Don't rebuild early charge release. F2 has little waste left to recover.
- **N8 (Sim, P57 RETREAT_FACE_ON e9ca4dc, Mech Builder, outcome C)** Retargeting the torso or aim during a retreat loses kills and doesn't save the bot. Base 0: -0.188 +/- 0.112, kills 293->279, retreat deaths 57->60. Base 6000: -0.062 +/- 0.059, kills 358->352, retreat deaths 60->62. Seed 44 went from 1st/survived to 11th. The safe version (switch only when our own target can't be shot) fired 0/192 because target.ts already does it. Supports F15: champion retreat deaths are 136/190 and 124/189. Retreat deaths have to be fixed through movement (route, tree, timing), not aim.
- **N9 (Sim, P59 RETREAT_SAFE_TREE Step A on P48, Mech Builder, outcome D)** Choosing a different tree almost never changes the retreat spot: 9/192 and 7/192. Most of P48's retreat deaths aren't in tree-retreat mode: only 19 of 136 and 16 of 124 happen there. The rest come during building-cover retreat or the plain back-away retreat. The next retreat fixes should target those two modes. Unmeasured note from Mech Builder: a 9 m mech behind a median 0.32 m trunk is rarely hidden by it.
- **F16 (Sim, Promising; P60 BACKAWAY_FAR_COVER_ON fe3c90c, Mech Builder practice bases 0 and 6000)** In P48, 337 of 379 deaths are retreat deaths: 218 in back-away, 71 in building-cover and 48 in tree retreat. The biggest group (79, 23%) is back-away deaths where no cover was ever reached. Walking to a cover spot 4-6 s away that's hidden from recent attackers brought those down 24->21 and 15->13, kills up 293->298 and 358->365, survivors 2->2 and 0->2, paired +0.052+/-0.034 and +0.083+/-0.067. Weaknesses: only 23 of the 79 had a far spot; building-cover deaths with no cover reached rose 4->8 on base 6000; and there was one new 20 s pin (6034) with the flag off, in a game that improved. Treat why it helps as a hypothesis until the official screen.
