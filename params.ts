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
 * Build 20 (lane A, standoff): while engaged (Build 14's engage branch), hold a range set by the best weapon we hold
 * instead of closing to GUN_NEAR_M: STANDOFF_LASER_M with a laser, else STANDOFF_ARC_M with lightning, else
 * STANDOFF_GUN_M (gun only). Inside the band (± STANDOFF_BAND_M) we stand; closer, we step back (away from the target,
 * leaning to the kept circle's center near its edge, only to a spot inside that circle with no wall in the way and a
 * clear line to the target); farther, we walk in along a path. With no clear line we still walk in, as before.
 * The hit-rate guesses and the fight-or-flee race are unchanged. Set STANDOFF_ON to false to roll back to Build 16 exactly.
 */
export const STANDOFF_ON = true
/** Standoff with a laser held (m). Winners' first hits land at a median 111 m. */
export const STANDOFF_LASER_M = 110
/** Standoff with only a gun (m). */
export const STANDOFF_GUN_M = 80
/** Standoff with lightning and no laser (m); lightning reaches 45 m. */
export const STANDOFF_ARC_M = 28
/** Dead band around the standoff (m): no move while the range is within this of it. */
export const STANDOFF_BAND_M = 10
/**
 * Build 22 (calibrated race): the Build 14 TTK-vs-TTD race (both the TTK rule and the finish rule's ttk < ttd test)
 * uses measured hit rates by range instead of the Build 14 guesses (gun 0.8 within 60 m, 0.5 beyond; laser 0.9).
 * Source: coord/research-doug-0040.md §2 "Hit rate by range (MEASURED)", public free-for-alls, not practice.
 *   Enemy side (RACE_HIT_HOUSE): the mean of the five house gun rows; house laser about 20% at all ranges.
 *   Our side (RACE_HIT_OURS): our own hit rate is not measured anywhere in the repo (tools/sim/ASSUMPTIONS.md), so it
 *   is the mean of the showdown rows: gun over winners, places 2-4 and bottom half; laser over winners and places 2-4.
 * Bands are RACE_BANDS_M: up to 60 m (the 30-60 row also covers under 30 m), 60-100, 100-150, beyond 150 (the 150-230
 * row). Weapons without measured rows (mortar, lightning) keep the Build 14 guesses. The Build 16 target pick still
 * reads the Build 14 guesses, so targeting, aim, fire and movement are unchanged. Set RACE_CAL_ON to false to roll
 * back to Build 16 behavior exactly.
 */
export const RACE_CAL_ON = true
/** Upper edge (m) of each hit-rate band but the last; a distance on an edge falls in the nearer band. */
export const RACE_BANDS_M = [60, 100, 150]
/** Our hit rate per band (showdown means): gun 88/71/48/29%, laser 56/63/77/75%. */
export const RACE_HIT_OURS: Partial<Record<"gun" | "laser" | "lightning" | "mortar", number[]>> = {
  gun: [0.88, 0.71, 0.48, 0.29],
  laser: [0.56, 0.63, 0.77, 0.75],
}
/** Enemy (house) hit rate on us per band: gun 73/43/22/8% (mean of expert, red-best, red-honest, astra-finalist, astra-skirmish), laser 20%. */
export const RACE_HIT_HOUSE: Partial<Record<"gun" | "laser" | "lightning" | "mortar", number[]>> = {
  gun: [0.73, 0.43, 0.22, 0.08],
  laser: [0.2, 0.2, 0.2, 0.2],
}
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
