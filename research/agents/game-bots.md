# Game-bot architectures → Mech Royale (Research Agent 1)

**Caveat:** I found no public technical postmortem for any commercial BR bot (PUBG, Fortnite, Apex, Warzone, Free Fire). What exists is press and user research saying these bots are deliberately weak and rarely use cover or retreat [GB-14, GB-15]. Everything below is drawn from documented FPS AI and from contest write-ups.

## 1. Architecture comparison

| System | Decisions | Spatial | Perception / memory | Skill model | Src |
|---|---|---|---|---|---|
| Quake III | Four layers: AAS + actions → fuzzy goals → FSM "AI network" → team. Runs at **10 Hz** | Convex areas + reachabilities | Fuzzy desire. Rule: "in fight ∧ not fit → retreat" | Characteristic files at skills 1/4/5, interpolated between | GB-01, 02 |
| L4D / NextBot | Locomotion/Body/Vision/Intention. Action stack returns ChangeTo/SuspendFor/Done, each with a reason string | Nav mesh, flow distance, potentially-visible areas | Recognized set; `SelectMoreDangerousThreat` | Simulated senses and reaction (no numbers given) | GB-03 |
| CS:GO BT | Behavior trees | Nav mesh | Sensors; memory expires by time or distance | Per-difficulty reaction, aim lerp, dodge timing | GB-04 |
| Halo 2 | DAG of about 50 behaviors with binary relevancy, impulses, 1–2 s stimulus behaviors | Firing positions picked by LOS to the *presumed* target position and weapon range | "Props" = beliefs, which can be wrong | n/a | GB-05 |
| F.E.A.R. | GOAP (A* over world state) on a 2-state FSM | Sensors keep valid cover nodes; cover is dropped when shot at, then re-plan | Working memory; a separate system picks the target | n/a | GB-06 |
| Killzone | Position evaluation functions (PEFs) | Polar line-of-fire table: 4k waypoints in 64 KB. Weighted sum. Tactical A* | Threats with a presumed position | n/a | GB-07 |
| UE EQS / Perception | BT or StateTree calls queries | Generator → filter/score → normalize → curve → ×weight | Sight, hearing, damage, prediction; **Max Age** forgetting | n/a | GB-08, 09 |
| Robocode / Battlecode / Halite | Separate gun and movement modules; hand-tuned scored micro | Orbiting, greedy local moves | Bullet waves inferred from energy drops | GuessFactor histograms | GB-10–13 |

GOAP and HTN mainly solve *authoring complexity* across many enemy types. For a single agent with a 50 ms budget they add little.

## 2. Transferable techniques (ranked by fit)

1. **EQS/Killzone position scoring (very high).** Zone, cover, regen spots, supply rings, loot and flanks all reduce to one weighted score over candidate points [GB-07, GB-08].
2. **Belief-state threat tracks with decay (very high).** This is the pattern behind Halo props, UE Max Age and CS memory expiry [GB-04, GB-05, GB-09]. The game remembers true positions for only 5 s and sounds are noisy, so we need our own longer-horizon tracks.
3. **Projectile dodging (high).** Robocode bots *infer* bullets and still dodge them [GB-10]. We are *given* enemy projectiles with their velocities, which is strictly easier. Mortar shells take seconds to arrive; gun rounds take 0.2–0.9 s.
4. **Fit-to-fight retreat as the default (high).** Score depends only on death order, so make the Q3 rule [GB-01] and Halo-style retreat impulses [GB-05] the main behavior.
5. **Escape-angle aiming (high).** Max escape angle = asin(v/v_bullet) [GB-11]. For our gun that is **2.7° for a walking target and 4.4° for a boosting one**. At 150 m a target can end up 7–12 m from a linear lead, and a mech is about 5 m wide, so long gun duels are coin-flips.
6. **Medium fit:** L4D reason strings for log-based debugging [GB-03]; tactical A\* [GB-07]; contest lesson that simple tuned deterministic heuristics win [GB-12, GB-13].

## 3. Concrete algorithms

### 3.1 Threat track (per enemy id)
- **State:** `pos, vel, t_seen, hp, weapons, charging, src`.
- **On vision:** overwrite the track and set σ = 0.
- **Once out of the game's 5 s memory:** dead-reckon for 1 s, then hold the position fixed and grow uncertainty as σ = σ0 + v_max·Δt. Use v_max = 19.5, or 11.7 if the target was last heard moving silently.
- **Sounds** (also mark third-party fights): treat each as a bearing cone (±7°) with a near/mid/far band. Associate it with the nearest existing track or open a new one. The sound also reveals the weapon kind.
- **`damaged` events:** add a contact on the reported bearing. If the hit came from behind, turn the torso immediately.
- **Drop a track** when σ > 150 m or it is older than 30 s.
- **Threat weight:** `w = DPS(weapon)·1/(1+d/50)·P(LOS)·(1.5 if aimed at me)`.

### 3.2 Position query (every 0.5 s or on an event)
**Generate** about 60 points:
- rings at 8, 20, 40 and 70 m;
- building corners near us;
- supply-ring centers;
- roofs reachable with current energy (100 energy ≈ 60 m of climb).

**Filter** out points that are not walkable, or not inside `r_next − speed·3 s`, or not reachable before the zone edge passes them.

**Score** (each term normalized to 0–1, as in EQS):
```
S = 30·Cover      (share of threat weight with LOS blocked by buildings/terrain; trees count 0.3 — they block sight, not shots)
  + 20·ZoneSafety (1 − path_time_to_safe / time_until_zone_reaches_point)
  + 15·RangeFit   (gun ≤90 m, laser 150–280, lightning ≤40, mortar 60–200 with LOS blocked)
  + 10·Isolation  (min track distance / 100 m, capped at 1)
  − 15·Exposure   (share of tracks whose 200 m vision wedge covers the point)
  − 10·TravelTime/5 s
  + 25·[supply ring ∧ ETA ≤ landing ∧ nobody closer]
```
- **Choose** the argmax, with 10% hysteresis so the bot doesn't flip between near-equal points.
- **Weights** follow the pattern of Killzone's 20/40/20/10 example [GB-07]. They are starting values to tune.
- **Precompute** a Killzone-style polar LOS table over a 4 m grid: 268×181 cells × 16 sectors × 1 byte ≈ 780 KB, built from LiDAR plus building prisms. Build it offline and ship it in the repo (limit 20 MB).

### 3.3 Engagement selection
```
myTTK    = hp_j / (myDPS_vs_j · p_hit)
theirTTK = myHP / (DPS_j · p_hit_j · (1.5 if they get my rear))
p_hit ≈ min(1, 2.5 / (v⊥ · d / 252))     # ~0.9 when predicted miss < 2.5 m
```
Apply weapon-triangle multipliers (for example, laser gets +60% against a target holding a mortar).

- **Engage** when all three hold:
  - myTTK < 0.6·theirTTK;
  - no other track within 120 m has LOS to me;
  - my HP is ≥ 50%, or the target is one burst from death.
- **Disengage** (rerun the position query with the Cover weight doubled) when theirTTK < 1.2·myTTK or a second shooter appears.
- **Why retreat pays:** regen is 45 HP/s after 5 s without damage, so breaking contact for about 36 s restores full HP. That is worth more than any kill.
- **Practice-specific:** house bots hunt the weakest target, so expect pursuit when hurt. Value positions that break pursuit: buildings, height, boost around corners.

### 3.4 Projectile dodge
- For each projectile, compute closest approach (t\*, miss distance m) to my predicted path, treating mortar shells as ballistic with g = 22.
- If m < 2.5 + splash (7 m for mortar) + 1, simulate 8 directions × {walk, boost} to t\*. Take the move with the largest miss distance, breaking ties toward the position-query target.
- The laser is hitscan and cannot be dodged once fired. When a visible enemy's `charging` flag is set and its aim is within 3° of me, break LOS within the 0.75 s charge, or short the laser with lightning if within 45 m.

### 3.5 Aim
- **Intercept:** iterate `t ← |Δp + v·t| / 252` three times, using a velocity estimated from the last two samples.
- **Hold fire** when `v⊥·t > 4 m`. A 12-round magazine with a 2.4 s reload makes wasted shots expensive.
- **Facing:** keep the torso (which sets the front arc) on the highest-weight threat. The legs move independently.

### 3.6 Zone rotation (analogue of L4D flow distance)
- **On each zone update:** run Dijkstra outward from the next circle's boundary.
- **Leave** when path time ≥ time remaining − (10 s + 2 s per track in the corridor).
- **Route cost:** distance + 30·LOS-to-threat [GB-07].
- **Damage scaling:** at 20–35 dps, early zone crossings cost less than a gunfight. Late zones (100–260 dps) are lethal.

## 4. Limitations
- **BR internals:** nothing is primary-sourced. Claims about how PUBG, Fortnite or Apex bots rotate would be speculation.
- **Q3 coverage:** the part of the thesis I read covered architecture and AAS only. The aim and combat sections were not reached, and chars.h did not render.
- **Purpose mismatch:** commercial bots are tuned to be beatable, using aim error and reaction delay [GB-04]. Those models are useful only as a hypothesis about how the house bot tiers differ (easy/medium/hard/expert). This is unverified.

## 5. Recommendations
1. **Loop structure:** a 10 Hz pipeline of perception → belief tracks → Halo-style prioritized modes → position query → movement and aim controllers. Mode priority: Dodge > ZoneEscape > Disengage/Regen > SupplyDrop > ThirdParty > Loot > Hold. No GOAP or HTN.
2. **Default to survival.** Fight only with a TTK edge or a clean third-party chance.
3. **Precompute** the LOS table and nav grid offline and ship them. Keep per-tick work to about 60 points scored against a few tracks.
4. **Log the reason for every mode switch.** Keep the bot deterministic and the weights in config, to speed up tuning.
5. **Don't overfit the house squad.** A generic threat model is what carries over to the FFA final.

## Sources
- **GB-01** van Waveren, *The Quake III Arena Bot*, thesis, 2001. https://www.cs.rochester.edu/u/brown/242/docs/QuakeIII.pdf. Paper. Layered design, 10 Hz, fuzzy goals, retreat rule. Quality: paper (partially read).
- **GB-02** *Q3 bot manual: Characteristics*. https://icculus.org/gtkradiant/documentation/bot_manual/characteristics.html. Doc. Skill sets 1/4/5, interpolated. Quality: official doc.
- **GB-03** Booth, *The AI Systems of Left 4 Dead*, Valve, 2009. https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf. Action stack, reason strings, flow distance. Quality: talk (official).
- **GB-04** *Bot Behavior Trees* (CS:GO). https://developer.valvesoftware.com/wiki/Mp_bot_ai_bt. Sensors, expiring memory, per-difficulty reaction/aim. Quality: official/community wiki.
- **GB-05** Isla, *Handling Complexity in the Halo 2 AI*, GDC 2005. https://gamedeveloper.com/programming/gdc-2005-proceeding-handling-complexity-in-the-i-halo-2-i-ai. Relevancy, impulses, props. Quality: talk proceedings.
- **GB-06** Orkin, *Three States and a Plan*, GDC 2006. https://pages.cs.wisc.edu/~dyer/cs540/handouts/gdc2006_orkin_jeff_fear.pdf. GOAP; cover dropped when shot at. Quality: paper.
- **GB-07** Guerrilla, *Killzone's AI: Dynamic Procedural Combat Tactics*, GDC-E 2005. https://www.guerrilla-games.com/media/News/Files/gdce05_killzone_ai.pdf. LOF table, weighted position evaluation, tactical A\*. Quality: talk (official).
- **GB-08** Epic, *EQS Node Reference: Tests*. https://dev.epicgames.com/documentation/en-us/unreal-engine/eqs-node-reference-tests-in-unreal-engine. Normalize → curve → factor. Quality: official doc.
- **GB-09** Epic, *AI Perception*. https://dev.epicgames.com/documentation/en-us/unreal-engine/ai-perception-in-unreal-engine. Senses, Max Age, prediction. Quality: official doc.
- **GB-10** RoboWiki, *Wave Surfing Tutorial*. https://www.cse.chalmers.se/~bergert/robowiki-mirror/RoboWiki/robowiki.net/wiki/Wave_Surfing_Tutorial. Bullet waves, movement prediction. Quality: third-party (community).
- **GB-11** RoboWiki, *GuessFactor Targeting Tutorial*. https://www.cse.chalmers.se/~bergert/robowiki-mirror/RoboWiki/robowiki.net/wiki/GuessFactor_Targeting_Tutorial. Escape angle = asin(v/bullet speed). Quality: third-party.
- **GB-12** SPAARK, *Battlecode 2025 postmortem*. https://battlecode.org/assets/files/postmortem-2025-spaark.pdf. Weighted-score micro; avoid untested changes. Quality: third-party (competitor).
- **GB-13** *Halite III post-mortem* (rank 66). https://stonet2000.github.io/postmortem/. Simple tuned heuristic beat a complex one. Quality: third-party.
- **GB-14** Liu, *AI designs in Battle royale games*, Game Developer blog, 2021-06-18. https://gamedeveloper.com/design/-user-research-ai-designs-in-battle-royale-games. BR bots weak, rarely use cover or retreat. Quality: third-party/opinion.
- **GB-15** GamesRadar, *Fortnite bots explained*. https://gamesradar.com/uk/fortnite-bots-explained-along-with-new-matchmaking-system-in-epic-developer-blog. Matchmaking facts only, no behavior detail. Quality: press.
