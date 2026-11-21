/**
 * The tuning knobs: six at most (plan §9). Every game number comes from hello.config, and every other
 * threshold is a fixed rule in brain.ts. Tuning sweeps change only this file.
 */
export const params = {
  /** D4, A2: the gun fires only inside this range (m), unless the target is hitting us, below half HP, or not moving sideways. */
  gunRange: 100,
  /** F2: retreat when HP is below this fraction of max while under fire. */
  retreatHp: 0.35,
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
  aggression: 1,
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
export const LASER_TRIP_M = 175
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
 * Build 31 (edge hold): when the bot would otherwise just stand where it is (mode "hold": no loot, farm, engage,
 * collect, retreat, heal, hide, laser rush or zone move) and no enemy in view has a line of sight to us, walk at normal
 * speed to a ground spot beside a wall (a building or cliff at least EDGE_HOLD_WALL_H m above the ground within
 * EDGE_HOLD_WALL_M m) where that wall blocks the line from the side hunters most likely come from, then stand there.
 * That side is the known enemies (seen in the last EDGE_HOLD_MEMORY_S), nearest first, else the most open direction
 * around us, with the outward side of the circle breaking ties. The spot is within EDGE_HOLD_RADIUS_M (about 3 s of
 * walking), reachable by a ground path of at most EDGE_HOLD_PATH_M, inside the circle the hide code keeps to, and
 * zone-safe. Re-planned every EDGE_HOLD_REPLAN_S or when the zone changes, keeping the old spot while it still
 * qualifies. With no spot, the old stand-in-place hold. Evidence: watch/findings.md (c), winners hold beside
 * buildings with the line to the nearest enemy blocked. Set EDGE_HOLD_ON to false to roll back to Build 17 behavior exactly.
 */
export const EDGE_HOLD_ON = true
/** Look for a spot this far (m) from where we stand, at most. */
export const EDGE_HOLD_RADIUS_M = 30
/** Longest ground path (m) to the spot (walk speed 11.7 m/s: about 3.5 s). */
export const EDGE_HOLD_PATH_M = 40
/** The spot's wall: at least this tall (m) above the spot's ground, and at most this far (m) from it. */
export const EDGE_HOLD_WALL_H = 4
export const EDGE_HOLD_WALL_M = 5
/** Re-plan at most this often (s). */
export const EDGE_HOLD_REPLAN_S = 2
/** Stand still once within this distance (m) of the spot. */
export const EDGE_HOLD_STOP_M = 2
/** Known enemies seen this recently (s) set the side to hide from. */
export const EDGE_HOLD_MEMORY_S = 15
