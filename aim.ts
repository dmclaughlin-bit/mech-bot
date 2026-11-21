/**
 * Build 15 (aim): target leading and the hit test behind fire discipline. Pure math, no state, so brain.ts and
 * tools/aim_check.ts share it.
 *
 * Timing, measured on the kit recording (enemy bullets back-projected to their shooter, and our gun's cooldown
 * after each shot): a shot leaves on the first sim tick after the decision, from where the shooter stands after
 * that tick's move, and the bullet already flies during that tick. So for a shot on tick k (1 = first tick) of a
 * decision made at time 0, the bullet is `head + speed × (t − (k−1) × tick)` from the shooter's tick-k position
 * at time t. A beam is instant: it meets the target where the target is on tick k.
 */
import { type Vec3 } from "./mechfight.ts"

/** One observation of a target. */
export type Sample = { t: number; pos: Vec3; vel: Vec3 }
/** A target's motion as estimated from its last observations. */
export type Motion = { pos: Vec3; vel: Vec3; airborne: boolean }

/** A vertical speed (m/s) above this means the target is in the air. */
const AIRBORNE_VZ = 0.5
/** Only samples this recent (s) count as "the last observations". */
const TRACK_S = 0.25
/** Flight times are capped here (s): past it a constant-velocity guess means nothing. */
const MAX_FLIGHT_S = 3

/**
 * Velocity of a target from its last observations (newest last).
 * The newest observed velocity is the estimate: on the kit recording it predicts the position 0.1 to 0.6 s ahead
 * better than a mean over the last 2, 3 or 5 observations and better than extrapolating the acceleration. The
 * older samples are used for two things: a position difference when the target reports no velocity but moved, and
 * to tell a target in the air (vertical speed now or one observation ago) from one walking.
 */
export function estimateMotion(track: Sample[]): Motion {
  const now = track[track.length - 1]
  const before = track.length > 1 ? track[track.length - 2] : null
  const recent = before && now.t - before.t > 0 && now.t - before.t <= TRACK_S ? before : null
  let vel: Vec3 = [now.vel[0] || 0, now.vel[1] || 0, now.vel[2] || 0]
  if (recent && Math.hypot(vel[0], vel[1], vel[2]) < 0.01) {
    const dt = now.t - recent.t
    const moved: Vec3 = [(now.pos[0] - recent.pos[0]) / dt, (now.pos[1] - recent.pos[1]) / dt, (now.pos[2] - recent.pos[2]) / dt]
    if (Math.hypot(moved[0], moved[1], moved[2]) > 0.5) vel = moved
  }
  const airborne = Math.abs(vel[2]) > AIRBORNE_VZ || (!!recent && Math.abs(recent.vel[2] || 0) > AIRBORNE_VZ)
  return { pos: now.pos, vel, airborne }
}

/**
 * Where the target's feet are `t` seconds from now: steady horizontal velocity; a target in the air also rises
 * and falls under `gravity`, never below `floorAt` (the ground there). A walking target keeps its height.
 */
export function predictFeet(m: Motion, t: number, gravity: number, floorAt?: (x: number, y: number) => number): Vec3 {
  const x = m.pos[0] + m.vel[0] * t, y = m.pos[1] + m.vel[1] * t
  if (!m.airborne) return [x, y, m.pos[2]]
  let z = m.pos[2] + m.vel[2] * t - 0.5 * gravity * t * t
  const floor = floorAt ? floorAt(x, y) : -Infinity
  if (Number.isFinite(floor) && z < floor) z = Math.min(floor, Math.max(z, m.pos[2]))
  return [x, y, z]
}

/**
 * When a shot from `shooter` meets a target whose center is at `centerAt(t)`. The shot starts `head` m out and
 * covers `speed` m/s from time `delay` on (speed Infinity = a beam, which meets the target at `delay`).
 */
export function intercept(shooter: Vec3, centerAt: (t: number) => Vec3, speed: number, head: number, delay: number): { t: number; point: Vec3 } {
  let t = delay
  for (let n = 0; n < 4; n++) {
    const p = centerAt(t)
    const d = Math.hypot(p[0] - shooter[0], p[1] - shooter[1], p[2] - shooter[2])
    t = Math.min(MAX_FLIGHT_S, delay + Math.max(0, d - head) / speed)
  }
  return { t, point: centerAt(t) }
}

/**
 * How far a shot along (yaw, pitch) passes from the target: the horizontal distance from the target's axis, plus
 * whatever it clears the top or the feet by. A shot hits when this is at most the target's radius (plus the
 * bullet's). `at` is the point of the shot's path nearest the target, for the cover check.
 */
export function shotMiss(
  shooter: Vec3, yaw: number, pitch: number, centerAt: (t: number) => Vec3, halfHeight: number, speed: number, head: number, delay: number,
): { miss: number; t: number; at: Vec3 } {
  const ux = Math.cos(pitch) * Math.cos(yaw), uy = Math.cos(pitch) * Math.sin(yaw), uz = Math.sin(pitch)
  let t = intercept(shooter, centerAt, speed, head, delay).t
  let along = 0
  let c = centerAt(t)
  for (let n = 0; n < 3; n++) {
    c = centerAt(t)
    along = Math.max(0, (c[0] - shooter[0]) * ux + (c[1] - shooter[1]) * uy + (c[2] - shooter[2]) * uz)
    t = Math.min(MAX_FLIGHT_S, delay + Math.max(0, along - head) / speed)
  }
  const at: Vec3 = [shooter[0] + ux * along, shooter[1] + uy * along, shooter[2] + uz * along]
  const side = Math.hypot(at[0] - c[0], at[1] - c[1])
  const over = Math.max(0, Math.abs(at[2] - c[2]) - halfHeight)
  return { miss: Math.hypot(side, over), t, at }
}

/** The torso's aim after turning from `aim` toward `want` by at most `yawStep` and `pitchStep` (rad). */
export function slewAim(aim: [number, number], want: [number, number], yawStep: number, pitchStep: number): [number, number] {
  const dy = Math.atan2(Math.sin(want[0] - aim[0]), Math.cos(want[0] - aim[0]))
  const dp = want[1] - aim[1]
  return [aim[0] + Math.sign(dy) * Math.min(Math.abs(dy), yawStep), aim[1] + Math.sign(dp) * Math.min(Math.abs(dp), pitchStep)]
}
