/**
 * Every global knob of the sim that is NOT in hello.config. These are the only numbers that were tuned; none of
 * them is per-commit. See ASSUMPTIONS.md for where each comes from.
 */
export type Tier = "easy" | "medium" | "hard" | "expert"

export const TIER_COUNTS: [Tier, number][] = [["easy", 4], ["medium", 4], ["hard", 4], ["expert", 3]]

export const TIERS: Record<Tier, {
  /** std dev of the aim error (deg), resampled every AIM_RESAMPLE_S */
  aimSigmaDeg: number
  /** seconds of continuous sight before the first shot */
  reactS: number
  /** distance (m) a hunter closes to before it starts strafing */
  prefRange: number
  /** a house bot that is not a hunter still fights us inside this distance (m) when it sees us */
  engageR: number
  /** fraction of the tier's fights spent strafing instead of standing */
  strafe: number
  /** boosts while closing in */
  boostChase: boolean
}> = {
  easy: { aimSigmaDeg: 11.5, reactS: 1.2, prefRange: 85, engageR: 0, strafe: 0.3, boostChase: false },
  medium: { aimSigmaDeg: 8, reactS: 0.8, prefRange: 75, engageR: 30, strafe: 0.6, boostChase: false },
  hard: { aimSigmaDeg: 6, reactS: 0.5, prefRange: 65, engageR: 45, strafe: 0.85, boostChase: true },
  expert: { aimSigmaDeg: 4.3, reactS: 0.25, prefRange: 55, engageR: 60, strafe: 1, boostChase: true },
}

export const SQUAD = {
  /** hunters at t = 0 */
  huntersStart: 1,
  /** extra hunters per house bot that has died ("more as we thin them out") */
  huntersPerDeath: 1,
  /** one extra hunter per this many seconds after huntersTimeStartS */
  huntersEveryS: 75,
  huntersTimeStartS: 75,
  /** everyone hunts from this time on, or once this few house bots are left ("all of them late") */
  allAtS: 240,
  allWhenAliveLE: 8,
  /** a house bot we damaged fights back for this long */
  retaliateS: 10,
  /** house bots open fire with the gun inside this range (m) */
  gunOpenM: 140,
  /** the squad hears our gunfire: it refreshes our last known position within this range (m) of any house bot */
  hearGunM: 320,
}

export const AIM_RESAMPLE_S = 0.4
