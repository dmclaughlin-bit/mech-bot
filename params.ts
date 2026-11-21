/**
 * The tuning knobs: six at most (plan §9). Every game number comes from hello.config, and every other
 * threshold is a fixed rule in brain.ts. Tuning sweeps change only this file.
 */
export const params = {
  /** D4, A2: the gun fires only inside this range (m), unless the target is hitting us, below half HP, or not moving sideways. */
  gunRange: 100,
  /** F2: retreat when HP is below this fraction of max while under fire. */
  retreatHp: 0.30,
  /** Z1: plan the trip to the next circle at this fraction of walk speed. */
  zoneWalk: 0.8,
  /** Z1: seconds of buffer when deciding to leave for the next circle. */
  zoneBuffer: 10,
  /** H2, Q1: stay under this ground speed (m/s) inside the next circle, so our steps make no sound. Build 19: only while hurt (see NO_SNEAK_ON). */
  silentSpeed: 5,
  /**
   * F1 (Build 14): the fight-or-flee ratio. Hurt and under fire from exactly one enemy, we fight on instead of
   * retreating while ttk < aggression × ttd (our time to kill it vs its time to kill us, see ENGAGE_ON below).
   * 1 = fight only the races the estimate says we win. Above 1 is bolder (1.5 accepts a race we lose by up to 50%),
   * below 1 is more careful, and 0 never overrides the retreat on TTK (the finish rule, which tests ttk < ttd, still applies).
   */
  aggression: 1.5,
}

/**
 * Build 12 (farm): with no enemy mech within FARM_ENEMY_M or in view and no damage from a mech, shoot NPC drones
 * and crates in view and walk to visible cubes and landed supply drops within FARM_PICKUP_M. Zone safety always wins.
 * Set FARM_ON to false to roll back to Build 5b behavior exactly.
 */
export const FARM_ON = true
/** Farm only while no enemy mech is known within this distance (m). */
export const FARM_ENEMY_M = 160
/** Walk to cubes and drops at most this far (m). */
export const FARM_PICKUP_M = 80
/**
 * Build 13 (farm reach): under the same farm conditions, with no cube/drop to walk to and nothing to shoot, walk
 * toward the nearest drone or crate in view within FARM_HUNT_M until it is in clear gun range. Set FARM_HUNT_ON to
 * false to roll back to Build 12 behavior exactly.
 */
export const FARM_HUNT_ON = true
/** Hunt drones and crates in view up to this far (m). */
export const FARM_HUNT_M = 150

/**
 * Build 14 (engage): fight or flee by time-to-kill vs time-to-die instead of our HP alone.
 *   ttk = enemy hp / (DPS of the weapons we hold that reach it × hit-rate guess × our cube damage bonus)
 *   ttd = our hp / (sum of the DPS of every enemy with line of sight to us, from the weapons it is seen holding)
 * Weapon DPS comes from hello.config.weapons at hello. Hit-rate guesses, the same for us and for enemies: gun 0.8
 * within 60 m and 0.5 beyond, laser and lightning 0.9.
 * 1. TTK rule: when the HP retreat would trigger and exactly one enemy threatens us (has line of sight to us or
 *    damaged us in the last 2 s), keep fighting while ttk < params.aggression × ttd.
 * 2. Finish rule: commit to a target whose HP is at most one magazine of a weapon we hold (gun: mag × damage, laser:
 *    one full shot, lightning: what our energy pays for) while no second enemy has line of sight to us or is hitting
 *    us, and only if we survive it: our HP is at least ENGAGE_FINISH_HP of max and ttk < ttd against that target (the
 *    same ttk and ttd as rule 1). Then walk to the cubes it drops if nobody sees us.
 * Otherwise the Build 5 retreat runs unchanged. Zone safety always wins (leaving for the next circle and zone escape
 * rank first). Set ENGAGE_ON to false to roll back to Build 12 behavior exactly.
 */
export const ENGAGE_ON = true
/** Finish rule: commit only at or above this fraction of max HP. House bots hunt the weakest first and share vision. */
export const ENGAGE_FINISH_HP = 0.35

/**
 * Build 17 (early arm-up): in the first LASER_RUSH_S seconds, while we hold no laser, walk at full speed along a nav
 * path to a laser pickup we see or remember (pickups are listed only while in view), and while we hold only the gun
 * to a lightning too (a laser comes first), when all of these hold:
 *   - bounded trip: the path to it is at most LASER_TRIP_M long;
 *   - zone-safe: it lies inside the current circle and the trip there and on to the next circle fits before the shrink ends;
 *   - reachable on the ground (not on a roof, a path exists), given up after LASER_CHASE_S.
 * Fix round (research 0040, ARM-UP): there is no enemy test. 9 of 10 showdown winners walked to their laser with an
 * enemy inside 160 m, so an enemy nearer to the pickup or watching the route no longer stops the trip. Engage, retreat,
 * zone travel and collecting a kill's cubes still rank first, and any mech damage in the last 3 s stops the trip, so
 * Build 14's fight-or-flee choice is untouched while an enemy is engaging. Also: one torso turn at spawn to see the
 * pickups around us, a wanted weapon in reach is taken into a free slot whoever is in view, and once held the laser is
 * let go only when the torso is inside the target's outline (the beam has no spread), with a clear laser line holding
 * the finish rule at range instead of walking in. A charge that has lost its target is turned onto another enemy we
 * can hit, or held, instead of being let go at nothing (the protocol has no cancel: letting go always fires).
 * Set LASER_RUSH_ON to false to roll back to Build 16 behavior exactly.
 */
export const LASER_RUSH_ON = true
/** Start a trip only this early in the match (s). */
export const LASER_RUSH_S = 45
/** Longest path (m) to a weapon we walk for. Showdown winners' early laser trips: median 78 m of path, longest 176 m. */
export const LASER_TRIP_M = 250
/** Give up on a weapon we have walked toward this long (s) without reaching it. */
export const LASER_CHASE_S = 20
/**
 * Build 16 (target pick): instead of the nearest enemy with a clear line, lock the enemy mech with the best kill
 * value (target.ts: a shot from here, short time-to-kill from our DPS, low hp, weak weapons, alone) and keep it until
 * it dies or has had no shot for TARGET_LOST_S. An enemy outside the circle is picked only while we can shoot it from
 * where we stand. The enemy Build 14 is engaged with takes the lock. Movement is unchanged. Set TARGET_PICK_ON to false
 * to roll back to Build 14 behavior exactly.
 */
export const TARGET_PICK_ON = true
/** The lock ends after this long (s) with the target out of view or without a clear line. */
export const TARGET_LOST_S = 3
/** A target is alone when no other enemy mech is within this distance (m) of it. */
export const TARGET_ALONE_M = 40
/** Time-to-kill (s) at which the ttk term is worth half. About one gun magazine plus its reload. */
export const TARGET_TTK_REF_S = 5
/** Kill-value weights. `shot` is above the sum of hp, weak and alone, so an enemy we can shoot always outranks one we can't. */
export const TARGET_W = { shot: 4, ttk: 2, hp: 1.5, weak: 1, alone: 1 }

/**
 * Build 19 (stop sneaking): while not hurt, drop the silent speed cap (H2, Q1: params.silentSpeed inside the next
 * circle and on hide moves) and the hide-from-sight move (Q2: the hold-out-of-sight walk, and the walk to a hiding
 * spot while healing). Loot, farm and zone moves then go at full walk speed, and the bot stands and shoots an enemy
 * that sees it instead of creeping away first. Not hurt = HP at or above params.retreatHp of max and no damage of any
 * kind for NO_SNEAK_QUIET_S. While hurt, the retreat, the heal and their silent hiding run unchanged. Standing still
 * to heal under 90% HP is also unchanged. Practice house bots are one squad sharing vision, so hiding from one does
 * not hide us (research: coord/research-doug-0040.md). Set NO_SNEAK_ON to false to roll back to Build 16 behavior exactly.
 */
export const NO_SNEAK_ON = true
/** Not hurt needs no damage (mech, drone or zone) for this long (s). */
export const NO_SNEAK_QUIET_S = 3

/**
 * P-B-001 (standoff break): after STANDOFF_BREAK_S seconds of match time, stop sitting in a heal or hold standoff
 * against a lone enemy and close to our best weapon's effective range, then fight under the existing engage/target code.
 * It runs only where the champion would heal ("heal", "heal, hiding") or hold, and only when: exactly one enemy has line
 * of sight to us and it is 45–90 m away, no other enemy has been seen in the last 3 s, our HP is at least
 * params.retreatHp + 20% of max, that enemy is not charging a laser, and it stands inside the circle we keep to.
 * Best weapon = the held weapon with the highest sustained DPS; its effective range is the engage code's: lightning
 * 0.8 × its range, gun GUN_NEAR_M (60 m), laser and mortar their reach (so a laser-without-lightning holder already has
 * its range and never walks). Once walking at one enemy, it keeps closing on it below 45 m until that range.
 * Engage, hurt retreat, zone travel, crossfire break, the laser walk and the Build 103 lightning ambush all rank first.
 * Aim, nav and cover are unchanged.
 * Evidence (B103 Step A, PR #94): lightning holders spend 54%/51% of clear-target decisions at 45–90 m, half of it a
 * standoff where neither side closes, most often while we heal. 0 = Build 103 (champion) behavior exactly.
 */
export const STANDOFF_BREAK_S = 60

/**
 * P-D-003 (supply-drop run, first built as P-D-001 on B80): the bot never takes a supply drop once enemies are
 * around (0 claims in 106 sim games reaching 95 s), because farming needs no enemy known within 160 m. With this set above 0: a called drop
 * within DROP_RUN_M (m), not held by another mech, zone-safe for the capture, and not hurt (HP at or above retreatHp),
 * we walk to it timed to arrive as it lands and stand in the ring until it is ours (full HP, full energy, +3 cubes).
 * Engage, retreat, kill-claim, the laser walk, B60's crossfire break and the Build 103 lightning ambush all rank
 * above it; firing is unchanged. The standoff break never replaces it (that runs only from heal or hold).
 * 0 = off, identical to the champion.
 */
export const DROP_RUN_M = 200

/**
 * B125 six-tactic package. Each flag gates one behavior; all six false = B113 (champion) behavior exactly.
 *
 * TAC_SPACE_EARLY: in the first SPACE_EARLY_S seconds, while walking to a laser/loot/farm item or holding idle, bias
 * the move away from the nearest known enemy mech closer than SPACE_EARLY_M: a sideways offset (SPACE_BIAS) on the
 * goal vector that keeps the forward progress, or with no goal a step away (SPACE_HOLD_MOVE). Wall- and zone-checked.
 * No change to gunRange, standoff, ambush, engage distances, or anything after SPACE_EARLY_S.
 */
export const TAC_SPACE_EARLY = true
export const SPACE_EARLY_S = 30
export const SPACE_EARLY_M = 145
export const SPACE_BIAS = 0.5
export const SPACE_HOLD_MOVE = 0.6
/**
 * TAC_FIRE_MOVE: in an engage where we would stand still with a clear shot in range, walk sideways at FIRE_MOVE_SPEED
 * (m/s) instead, the side held for a leg of FIRE_MOVE_LEGS_S (cycled, s) then reversed. Each step is checked for walls,
 * the circle we keep to, and the line of fire from where it ends. No boost, no jump.
 */
export const TAC_FIRE_MOVE = true
export const FIRE_MOVE_SPEED = 6
export const FIRE_MOVE_LEGS_S = [0.3, 0.4, 0.25, 0.35]
/** Fire-move and dodge steps are checked this far (m) ahead. */
export const TAC_STEP_CHECK_M = 3
/**
 * TAC_DODGE: a visible enemy projectile (obs.projectiles) predicted to hit our cylinder between DODGE_MIN_S and
 * DODGE_MAX_S from now: step sideways, perpendicular to its velocity, away from its line (the other side if blocked),
 * for DODGE_HOLD_S, then no new dodge for DODGE_COOLDOWN_S. Never during zone escape or travel to the next circle; a
 * drop-ring hold dodges only to a spot inside the ring. Beams are not dodged.
 */
export const TAC_DODGE = true
export const DODGE_MIN_S = 0.25
export const DODGE_MAX_S = 0.8
export const DODGE_HOLD_S = 0.4
export const DODGE_COOLDOWN_S = 0.6
/**
 * TAC_JET_LOOT: when a loot goal (laser/lightning rush target, farm cube or drop) has no ground path or sits on a
 * ledge/roof, and we are out of combat (no engage, not hurt, no mech damage for HOP_QUIET_S), walk straight at it and
 * hop the obstacle: jump at the edge, jet in the air until our feet clear it. Start only with HOP_ENERGY_MIN energy
 * (and enough for the height). Abort after HOP_ABORT_S without progress and skip that target. Never a combat move.
 */
export const TAC_JET_LOOT = true
export const HOP_QUIET_S = 2.5
export const HOP_ENERGY_MIN = 35
export const HOP_ABORT_S = 3
/** Hop logic takes over from the ground path within this distance (m) of an elevated goal. */
export const HOP_NEAR_M = 12
/**
 * TAC_LASER_REACH: on top of Build 17's laser rush (already: no enemy test, LASER_TRIP_M, spawn scan, take in reach):
 * (a) a laser/lightning on a roof or crate (>= 4 m above the terrain) is no longer skipped when a TAC_JET_LOOT hop or
 * a ground path that ends within reach can get it; (b) a rush in progress survives up to RUSH_GRAZE_HITS mech hits in
 * the last 3 s (a new rush still needs 3 s without mech damage). Engage, retreat, zone travel and crossfire rank first.
 */
export const TAC_LASER_REACH = true
export const RUSH_GRAZE_HITS = 2
/**
 * TAC_FINISH_AMMO: the finish rule's "one magazine" is what is loaded now (gun: ammo left, 0 while reloading; laser:
 * one shot only if ready or charging; lightning: energy), target.ts adds TARGET_W_LOADED to a target the loaded shots
 * kill, and the half-mag top-up reload is skipped while a finish target dies to the loaded shots.
 */
export const TAC_FINISH_AMMO = true
export const TARGET_W_LOADED = 1
