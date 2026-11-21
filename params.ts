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
  /** H2, Q1: stay under this ground speed (m/s) inside the next circle, so our steps make no sound. */
  silentSpeed: 5,
  /** F1 (Build 4): scales the engagement ratio, and is the only knob tuned on practice. Not read yet in Build 2. */
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
 * Build 16 (target pick): instead of the nearest enemy with a clear line, lock the enemy mech with the best kill
 * value (target.ts: a shot from here, short time-to-kill from our DPS, low hp, weak weapons, alone) and keep it until
 * it dies or has had no shot for TARGET_LOST_S. An enemy outside the circle is picked only while we can shoot it from
 * where we stand. Movement is unchanged. Set TARGET_PICK_ON to false to roll back to Build 13 behavior exactly.
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
