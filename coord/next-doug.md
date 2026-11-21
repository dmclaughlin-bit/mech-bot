# Next for Doug

Written by the coordinator. Paste everything below the line into your Claude.

---

Read `AI-Structure-Development.md` (the team's single source of truth, sections 2 to 5) and `coord/log.md` in `dmclaughlin-bit/mech-bot` before starting. Your task is **Build 2: survival-min**, on a branch `build-2` off `main`. PR by 10:30 PM ET so it can be submitted by 11 PM.

Change only `brain.ts`, plus new `map.ts` and `params.ts` if you want them. Keep Build 1's aiming and tracking. The rules marked Build 2 in section 9 (behavior rulebook) are the spec. Make these changes, one commit each:

1. **Constructor safety:** `createBot` must never throw. Guard `hello.map` and fall back to a no-map mode.
2. **Terrain in `clearLine`:** load `v2/terrain.i16` (int16 cm, bilinear, protocol §11) and treat a sample point below the ground as blocked.
3. **Pickups:** take only laser or lightning, and only when no enemy is within 160 m. Never take a mortar. Don't swap weapons while an enemy is in view.
4. **Fire gate:** fire the gun only inside 100 m, or at a target that is damaging us, below 50% HP, or moving mostly toward or away from us. Laser and lightning keep Build 1's rules.
5. **Zone travel:** leave for the next circle when ETA / (0.8 × walk_speed) + 10 s ≥ time left to `zone.shrink_end`. Boost only when walking can't make it. Once inside the next circle, move under 5 m/s (silent).
6. **Unstick:** replace "jump every 40 ticks" with a jump (and jet if needed) only when we've commanded movement but moved under 1 m in 0.5 s.
7. **Retreat:** when HP < 35% and we took damage in the last 2 s, walk away from the attacker with the torso still facing them (legs and torso are independent).
8. **Upgrades:** pick by order plating > armor > nanites > sensors > weapon upgrade > mobility, matched on choice `id` (look the ids up in `hello.config.upgrades`; only `armor` and `sensors` are confirmed in the protocol).
9. Put the thresholds (100 m, 35%, 0.8, 10 s, 5 m/s, aggression) in `params.ts`. Six knobs at most.

Read every game number from `hello.config`. Then run `python3 check/check.py --map-dir arena -- bun ../mech-bot/bot.ts` from the kit, paste the result into the PR, merge it once it passes, and append an entry to `coord/log.md` in the format at the top of that file. Don't start Build 3; Diego's Claude is writing `nav.ts` against the interface in section 4 of the plan.

If you have findings in your private `mech-strategy.md` or `LOG.md` that the plan doesn't cover, add the non-secret ones to `coord/log.md` under "Found".
