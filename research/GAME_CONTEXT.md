# Mech Royale: game facts every research agent must design against

Full spec: `research/protocol.md` (copy of kit protocol.md). Brief: `../buildathon-brief.md`. Numbers are defaults from a recorded `hello.config`; the real bot reads them live.

## Competition
- 16-mech FFA on a fixed real-world map (Ohio State campus: 223 buildings, 27 stadium prisms, 9 bridges, 1560 trees, 1 m LiDAR terrain grid 1070x724). Spawns, loot, NPCs, zone, drops random per match.
- **Score = mean(16 − place).** Placement only = death order. Kills only give cubes. Timeout at 480 s ranks survivors by HP.
- Practice: 48 matches vs 15 house bots acting as ONE squad (4 easy/4 med/4 hard/3 expert), shared vision, never fight each other, hunt *you* weakest-first, more hunters as match goes on. Baseline example bot = 1.15. Leaderboard top ~4.8.
- Final: top 32 → 16 FFA qualifiers vs other teams' bots → top 16 play 64-match FFA series. Expert house bots fill slots. **Final is what pays ($5k winner-take-all).**
- Deadline Sun Nov 22 11:00 AM ET (~40 h from research start). Team of 2. 4 submissions/hour; each submission plays 48 practice matches → that is the only *real* evaluation signal (no local simulator in the kit).

## Runtime
- Docker, stdin/stdout JSON lines, lockstep. **50 ms wall per decision**, 10 decisions/s, >2% late fails check. 1 CPU, 512 MB, no network, read-only FS, /tmp 64 MB. `ready` within 20 s (precompute allowed here: map load, nav grid). Repo ≤20 MB, MIT.
- Python or TS wrappers provided (stdlib only). Any language OK in Docker.

## Mechanics (defaults)
- Mech: 1400 HP, cylinder r 2.5 h 9. Walk 11.7 m/s, boost 19.5 (drains 17 energy/s), energy 100, regen 18/s after 0.6 s. Jump 11 m/s, jet 34 m/s² up; 100 energy ≈ 60 m climb (most roofs). Torso turn 4 rad/s, pitch 3 rad/s; legs independent of torso.
- Regen 45 HP/s after 5 s with no damage dealt/taken (not outside zone).
- **Rear hits ×1.5** (outside 180° front arc centered on torso yaw). Facing your attacker matters.
- Weapons (start with gun only; slot 1 empty; loot others):
  - gun: 45 dmg, 0.24 s cd (~187 DPS), 252 m/s, range 230, spread 0.6°, mag 12, reload 2.4 s. Must lead targets.
  - mortar: 72 m/s ballistic (g 22), 200 direct + 160 splash r 7 m, cd 2.6 s; knockback + energy drain; self-splash 50%. Can lob over buildings.
  - laser: hold to charge ≤0.75 s → hitscan 315 dmg, range 280, cd 1.65 s; half move speed while charging; visible `charging` flag. +60% vs mech holding mortar.
  - lightning: instant, nearest target in 45 m / 30° cone with LOS, 60 dmg, chains 2 (×0.7), 3 energy/shot, cd 0.25 s (~240 DPS). Shorts lasers 2 s.
  - Triangle: laser > mortar > lightning > laser; gun neutral. Can't hold two of a kind.
- Loot: 40 floor weapons + 36 crates (300 HP, 50% weapon, 1 cube) + dead mechs' weapons. `take` within 4 m.
- 12 NPC drones (350 HP, 25 dmg/s-ish, aggro 45 m, leash) drop 2 cubes each.
- Cubes: +4% max HP and +4% dmg each (cap 10) but +5% size each (bigger target, no cap). Upgrade offers at 1,3,6,10,15… cubes: pick 1 of 3 (plating +15% HP, armor −8% dmg taken, servos, capacitor, reactor, jets, nanites regen, gyros turn, sensors vision/hearing, weapon-specific).
- **Supply drops** at t=70/140/210 s, land 25 s later inside next zone circle; stand alone in 8 m ring 4 s → +3 cubes, full HP, full energy. Contested ring freezes. Everyone knows drop positions.
- Zone: r 560 → 380 → 240 → 140 → 70 → 25 → 0; dps 20/35/60/100/160/260; current + next circle always known; closes by ~6:55, match max 8:00.
- Vision: 45 m 360° proximity (buildings block), 200 m in 120° wedge on torso aim. Trees block sight but **not shots**. Memory 5 s of seen mechs' true position. Enemy HP visible.
- Sound: gun 320 m, mortar/explosion 420, laser 380, death 600, step 40 (only when >5 m/s on ground), boost 90; bearing σ 7°, dist near/mid/far. Weapon kind revealed by sound. Standing still/slow walking is silent.
- Observation gives: self, visible mechs (pos, vel, aim, hp, weapons, charging), enemy projectiles w/ velocity, crates, cubes, pickups, sounds, beams, events (damaged w/ bearing, by, rear), drops, zone, offer.

## Implications already identified (brief)
Avoid early fights, stay in zone, third-party weakened mechs, face attackers, win supply drops for full heal. Practice ≠ final: don't overfit the house squad.

## Team repo (added Fri 7:28 PM ET)
github.com/dmclaughlin-bit/mech-bot (Doug). One commit: the kit's TS starter as it ships. bot.ts is example.ts, mechfight.ts is the kit wrapper unchanged, Dockerfile is `FROM oven/bun:1.4.4-slim`, entrypoint `bun /bot/bot.ts`, MIT. **The default language is TypeScript on bun.**
