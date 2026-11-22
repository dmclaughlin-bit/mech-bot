/**
 * mech-bot brain.
 *
 * Build 1: keep track of every bot around, and aim each weapon so it actually hits.
 * Build 2 (survival-min): setup that cannot fail, terrain in the cover check, laser and lightning
 * only, a fire gate on the gun, zone travel that leaves just in time and holds silently,
 * unsticking, retreat when hurt, and an upgrade order. The rules are §9 of the team plan.
 * Build 3: zone travel along nav.ts paths, nav.stuck for unsticking, and a 30 ms deadline guard.
 * Build 5 (survival half): retreat to the nearest in-zone spot out of the attackers' line of sight (F3), then
 * heal there silently until HP is back over 90% (F4; Build 5b keeps normal fire while healing), and while holding, slip out of any
 * enemy's sight: its 45 m proximity ring and its 120° wedge around its aim (Q2). Q1 (silent hold) is unchanged.
 * Build 12 (farm): with no enemy mech near or in view, shoot drones and crates and walk to cubes and drops (see farmPlan).
 * Build 14 (engage): fight or flee by time-to-kill vs time-to-die (F1): against one enemy we would kill first, or one
 * within a magazine of dying, fight on instead of the HP retreat, then collect its cubes (see engageChoice, ENGAGE_ON).
 * Build 17 (early arm-up): in the first 45 s, walk to a laser we see or remember (gun only: a lightning too) when the
 * path is at most 175 m and the trip is zone-safe, whoever is around; let the beam go only inside the target's outline,
 * and turn a charge that lost its target onto another enemy instead of letting it go at nothing (LASER_RUSH_ON).
 * Build 16 (target pick): lock the enemy with the best kill value instead of the nearest one (see target.ts).
 * Build 19 (stop sneaking): while not hurt, no silent speed cap and no hide-from-sight move (see NO_SNEAK_ON).
 * Build 80 (late lightning): after 45 s, a gun-only bot may walk to a reachable ground lightning or laser
 * (see LATE_LIGHT_ON).
 * P-B-001 (standoff break): after 60 s, instead of healing or holding while one lone enemy stands 45–90 m away,
 * close to our best weapon's effective range (see STANDOFF_BREAK_S).
 * P-D-003 (drop run): walk to a called supply drop within 150 m, timed to arrive as it lands, and hold its ring
 * (see DROP_RUN_M).
 */
import { clearLine, groundAt, loadMap } from "./map.ts"
import { createNav } from "./nav.ts"
import {
  DROP_RUN_M, MIDRING_GOAL, MIDRING_HI, MIDRING_LO, MIDRING_MIN_R, MIDRING_SETTLE_ON, MIDRING_STUCK_S, ENGAGE_FINISH_HP, ENGAGE_ON, FARM_ENEMY_M, FARM_HUNT_M, FARM_HUNT_ON, FARM_ON, FARM_PICKUP_M,
  LASER_CHASE_S, LASER_RUSH_ON, LASER_RUSH_S, LASER_TRIP_M, NO_SNEAK_ON, NO_SNEAK_QUIET_S, ROOF_JET_ROUTE_ON, ROOF_MAX_H, ROOF_RANGE_M, ROOF_START_S,
  ROOF_STUCK_S, STANDOFF_BREAK_S, TARGET_PICK_ON, params,
} from "./params.ts"
import { createTargetLock, scoreTargets } from "./target.ts"
import { type Bot, type BotAction, type Hello, type Observation, type Vec3, type WeaponKind, type WeaponObs, draw, log } from "./mechfight.ts"

// ------------------------------------------------------------------ geometry helpers
const flat = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1])
const span = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const yawTo = (from: number[], to: number[]) => Math.atan2(to[1] - from[1], to[0] - from[0])
const pitchTo = (from: number[], to: number[]) => Math.atan2(to[2] - from[2], flat(from, to))
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
/** Horizontal distance from p to the segment a-b. */
const segmentDistance = (p: number[], a: number[], b: number[]) => {
  const vx = b[0] - a[0], vy = b[1] - a[1], len2 = vx * vx + vy * vy
  const s = len2 > 0 ? clamp(((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / len2, 0, 1) : 0
  return Math.hypot(p[0] - a[0] - s * vx, p[1] - a[1] - s * vy)
}

// ------------------------------------------------------------------ rule constants (plan §9)
/** L2: loot only when no enemy mech is within this distance (m). */
const LOOT_CLEAR = 160
/** L2: walk at most this far (m) to a wanted weapon. */
const LOOT_DETOUR = 80
// The tunable thresholds live in params.ts (six knobs at most); its comments say what each one does.
const GUN_GATE = params.gunRange
const ZONE_WALK = params.zoneWalk
const ZONE_BUFFER = params.zoneBuffer
const SILENT_SPEED = params.silentSpeed
const RETREAT_HP = params.retreatHp

/** Z1 (Build 3): seconds added to the trip for each enemy known within ROUTE_TRACK_M (m) of the route. */
const ROUTE_TRACK_S = 2
const ROUTE_TRACK_M = 50
/** In-tick A* budget in node expansions, from Diego's nav bench (about 7 ms worst case on bun). */
const PATH_BUDGET = 20000
/** Re-plan at most this often (s), or sooner when the goal moves more than ROUTE_GOAL_SHIFT (m). */
const ROUTE_REPLAN_S = 1
const ROUTE_GOAL_SHIFT = 10
/** Move on to the next waypoint within this distance (m). */
const WAYPOINT_REACHED = 4
/** D6, §7 rule 2: hard per-decision guard (ms). A path search starts only while its worst case still fits. */
const DEADLINE_MS = 30
const PLAN_RESERVE_MS = 10
/** Line-of-sight checks per decision go to the nearest few enemies only. */
const LOS_TARGETS = 8
/** F4: heal (silent, out of contact) until HP is above this fraction of max. */
const HEAL_HP = 0.9
/** F3, Q2 hiding spots: this many bearings around us, at the distances we walk in 1, 2 and 3 s, nearest first. */
const HIDE_BEARINGS = 12
const HIDE_STEPS_S = [1, 2, 3]
/** Build 12 (farm): no farming for this long (s) after damage from anything but a drone. */
const FARM_QUIET_S = 3
/** Build 12: known enemies seen this recently (s) count against the FARM_ENEMY_M ring. */
const FARM_MEMORY_S = 10
/** Build 12: give up on a cube or drop we have chased this long (s) without reaching it (roofs, blocked paths). */
const FARM_CHASE_S = 15
/** Build 13 (hunt): stop walking at this distance (m) from a hunted drone or crate with a clear line (outside drone aggro, 45 m). */
const HUNT_STAND_M = 60
/** Build 13: give up on a hunted drone or crate after this long (s) without getting it in clear range. */
const HUNT_CHASE_S = 25
/** Build 12: stand this far (m) inside a drop's ring while capturing. */
const DROP_INSET = 1.5

/** Build 14 (engage): hit-rate guesses, the same for us and for enemies. Gun inside GUN_NEAR_M and beyond it, laser and lightning, mortar. */
const GUN_NEAR_M = 60
const HIT_GUN_NEAR = 0.8
const HIT_GUN_FAR = 0.5
const HIT_BEAM = 0.9
const HIT_MORTAR = 0.5
/** Build 14: an enemy that damaged us this recently (s) threatens us even without line of sight (same window as the retreat). */
const THREAT_HIT_S = 2
/** Build 14: once the test passes, stay engaged this long (s) so the choice does not flip tick to tick. A second threat ends it at once. */
const ENGAGE_LATCH_S = 1
/** Build 14: drop a target we have engaged this long (s) with no HP lost over the hpLog window, and leave it alone for ENGAGE_REST_S. */
const ENGAGE_CHASE_S = 8
const ENGAGE_REST_S = 10
/** Build 14: after a kill, walk to cubes within CLAIM_M (m) of where the target died, for at most CLAIM_S (s). */
const CLAIM_M = 12
const CLAIM_S = 12
/** Build 17 (early laser): turn the torso once around for this long (s) at spawn, to see the pickups on every side (the view is a 120° wedge). */
const LASER_SCAN_S = 1.8
/** Build 17: a remembered laser we stand this close to (m) with a clear line and no longer see has been taken. */
const LASER_GONE_M = 30
/** Build 17: change to another laser only if it is this much nearer (m). */
const LASER_SWITCH_M = 15
/** Build 17: a cube this close (m) is picked up first (farm pickup) when farming would run. */
const LASER_CUBE_M = 20
/** Build 17: let the beam go when the torso points within this fraction of the target's radius and half height (it has no spread). */
const LASER_RELEASE = 0.8
/** Build 17: aim the beam this far ahead (s) of a moving target: about the delay between an observation and our action taking effect (a guess: 1 to 2 ticks). */
const LASER_LEAD_S = 0.075
/** Build 60 (break crossfire): when two or more enemies have line of sight to us, walk to cover that breaks those
 * lines instead of standing still and trading. Zone travel, hurt retreat, and the Build 17 laser trip still rank
 * first (and the finish/TTK rules already require alone()). false = champion. New vs B26 (that also committed into
 * multi-threat fights when the race looked winning, and changed hit rates). Against real house bots that share
 * vision and hit harder than the sim, a 2-on-1 stand-and-shoot is a fight we cannot finish. */
const CROSSFIRE_ON = true
/** Build 80 (late lightning for gun-only): the champion's Build 17 trip stops starting new walks at LASER_RUSH_S
 * (45 s), so a bot still holding only the gun after the opening never goes for a known lightning. When this is on,
 * past 45 s, while gun-only, lightning and laser stay trip targets under the existing "no mech hit for 3 s" and
 * LASER_TRIP_M gates (not B49's four-part gate). B60's crossfire break and the hurt retreat stay ahead of the walk.
 * Take, swap, and drop are unchanged (B66 and B68 lost on the site). Different from B76/B78 (first 45 s only).
 * false = champion. */
const LATE_LIGHT_ON = true
/** Build 103 (H1, lightning ambush): lightning reaches 45 m, but house bots hold at their preferred range (55 to 95 m)
 * and strafe, so a gun+lightning holder spends most of a fight in a standoff the lightning can't reach (local paired
 * sim of B80, seeds 2000 and 3000: 54% of lightning holders' clear-target decisions at 45 to 90 m, 55% of those a
 * standoff where neither side closes, most often while we stand in "heal"). When this is on, a holder of lightning and no laser that is
 * seen by exactly one enemy at lightning range to AMBUSH_MAX_M steps out of that enemy's sight (B60's hideSpot) and
 * waits there. A hunter that loses sight walks to where it last saw us, so it comes back inside lightning range; the
 * normal target code then fires the lightning. Not a walk-in (H1's walk-in screened -0.109). Engage, the hurt retreat,
 * zone travel, the laser walks and the crossfire break all rank first. false = champion. */
const LIGHT_AMBUSH_ON = true
/** Build 103: the far edge (m) of the standoff band the ambush answers. */
const AMBUSH_MAX_M = 90
/** Build 17 fix: with this long (s) left before a held full charge fires on its own and no enemy to hit, turn it onto a drone or crate (a half turn of the torso takes 0.8 s). */
const LASER_REAIM_S = 0.8
/** P-B-001 (standoff break, see STANDOFF_BREAK_S): the lone enemy's distance window (m), no other enemy seen for this
 * long (s), and our HP at least this far above params.retreatHp (fraction of max). */
const STANDOFF_MIN_M = 45
const STANDOFF_MAX_M = 90
const STANDOFF_SECOND_S = 3
const STANDOFF_HP_MARGIN = 0.2
/** P40 (roof jet route, see ROOF_JET_ROUTE_ON): an item at least this far (m) above the terrain is on a roof. */
const ROOF_MIN_H = 4
/** P40: bearings searched from a roof item for the nearest wall edge, and how far (m) out along each. */
const ROOF_BEARINGS = 16
const ROOF_EDGE_M = 40
/** P40: stand this far (m) out from the wall edge to start the climb, and start it within ROOF_AT_BASE_M of that spot. */
const ROOF_STAND_OFF = 4
const ROOF_AT_BASE_M = 6
/** P40: energy for the climb: jets drain 15/s and rise about 9 m/s, so ~1.75 per metre, plus ROOF_JET_SPARE to get over the edge. */
const ROOF_JET_PER_M = 1.75
const ROOF_JET_SPARE = 15
/** P40: seconds of climbing and walking on the roof added to the zone test, the longest wait for energy at the wall,
 * the longest stand by a crate, and the whole-trip cap (s). Remembered roof items we stand this close to (m) with a clear
 * line and no longer see are gone. A crate is shot from this far (m); cubes and weapons are walked onto. */
const ROOF_CLIMB_S = 10
const ROOF_WAIT_S = 8
const ROOF_CRATE_S = 10
const ROOF_TRIP_S = 40
const ROOF_GONE_M = 40
const ROOF_CRATE_STAND_M = 6

/** L4: plating > armor > nanites > sensors > weapon upgrade > mobility, matched on the ids in hello.config.upgrades. */
const UPGRADE_FIRST = ["plating", "armor", "nanites", "sensors"]
const MOBILITY = ["servos", "jets", "capacitor", "reactor"]
function upgradeRank(id: string): number {
  const i = UPGRADE_FIRST.indexOf(id)
  if (i >= 0) return i
  if (/^(gun|laser|lightning|mortar)_/.test(id) || id === "gyros") return 4
  if (MOBILITY.includes(id)) return 5
  return 6
}

// ------------------------------------------------------------------ aiming
/** Where to aim a straight-flying shot so it meets a target moving at a steady velocity. */
function lead(from: Vec3, at: Vec3, vel: Vec3, speed: number): Vec3 {
  const dx = at[0] - from[0], dy = at[1] - from[1], dz = at[2] - from[2]
  const a = vel[0] * vel[0] + vel[1] * vel[1] + vel[2] * vel[2] - speed * speed
  const b = 2 * (dx * vel[0] + dy * vel[1] + dz * vel[2])
  const c = dx * dx + dy * dy + dz * dz
  let t = Math.sqrt(c) / speed
  const disc = b * b - 4 * a * c
  if (a < 0 && disc >= 0) {
    const r = Math.sqrt(disc)
    const times = [(-b - r) / (2 * a), (-b + r) / (2 * a)].filter((x) => x > 0)
    if (times.length) t = Math.min(...times)
  }
  t = Math.min(t, 3)
  return [at[0] + vel[0] * t, at[1] + vel[1] * t, at[2] + vel[2] * t]
}

/** Yaw and pitch that drop a mortar shell on a moving target. `high` picks the lob over cover. */
function lob(from: Vec3, at: Vec3, vel: Vec3, speed: number, g: number, high: boolean): { yaw: number; pitch: number } | null {
  let p: Vec3 = at
  let out: { yaw: number; pitch: number } | null = null
  for (let n = 0; n < 3; n++) {
    const x = flat(from, p), y = p[2] - from[2], v2 = speed * speed
    const disc = v2 * v2 - g * (g * x * x + 2 * y * v2)
    if (disc < 0 || x < 1) return null
    const pitch = Math.atan((v2 + (high ? 1 : -1) * Math.sqrt(disc)) / (g * x))
    const time = x / (speed * Math.cos(pitch))
    out = { yaw: yawTo(from, p), pitch }
    p = [at[0] + vel[0] * time, at[1] + vel[1] * time, at[2]]
  }
  return out
}

// ------------------------------------------------------------------ weapon numbers (Build 14)
const WEAPON_KINDS: WeaponKind[] = ["gun", "mortar", "laser", "lightning"]
const finite = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0)
/** Sustained damage per second of one weapon from its config numbers: before hit rate, cube scaling and armor. */
function weaponDps(kind: WeaponKind, s: Record<string, number>): number {
  if (kind === "gun") return finite((s.damage * s.mag) / (s.mag * s.cooldown + s.reload)) || finite(s.damage / s.cooldown)
  if (kind === "laser") return finite(s.damage / ((s.charge ?? 0) + s.cooldown))
  return finite(s.damage / s.cooldown)
}
/** How far one weapon reaches (m). The mortar's is its flat-ground maximum, v²/g. */
function weaponReach(kind: WeaponKind, s: Record<string, number>): number {
  return finite(kind === "mortar" ? (s.speed * s.speed) / s.gravity : s.range)
}
const hitRate = (kind: WeaponKind, d: number) =>
  kind === "gun" ? (d <= GUN_NEAR_M ? HIT_GUN_NEAR : HIT_GUN_FAR) : kind === "mortar" ? HIT_MORTAR : HIT_BEAM

// ------------------------------------------------------------------ the bot
/** What the bot knows about one enemy mech. Kept for a while after it leaves view. */
type Known = {
  id: number
  pos: Vec3
  vel: Vec3
  hp: number
  maxHp: number
  cubes: number
  weapons: WeaponKind[]
  lastSeen: number
  /** [time, hp] over the last few seconds, to spot bots that are losing health */
  hpLog: [number, number][]
}

/** Never throws: a failed setup gets the fallback bot instead of idling the whole match (plan D6). */
export function createBot(hello: Hello): Bot {
  try {
    return buildBot(hello)
  } catch (e) {
    log("bot setup failed, using the fallback bot:", e)
    return fallbackBot()
  }
}

/** A bare bot with no setup to fail: walk to the next circle, shoot the gun at the nearest mech. */
function fallbackBot(): Bot {
  return {
    name: "mech-bot",
    act(obs: Observation): BotAction {
      const me = obs.self
      const goal = obs.zone?.next_center ?? [me.pos[0], me.pos[1]]
      const walk = yawTo(me.pos, goal)
      const act: BotAction = { move: [Math.cos(walk), Math.sin(walk)], aim: [walk, 0], boost: !me.in_zone }
      const enemy = obs.mechs.filter((m) => m.kind === "mech").sort((a, b) => flat(a.pos, me.pos) - flat(b.pos, me.pos))[0]
      if (enemy) {
        act.aim = [yawTo(me.pos, enemy.pos), 0]
        act.fire = [true, false]
      }
      if (obs.offer) act.pick = 0
      return act
    },
  }
}

function buildBot(hello: Hello): Bot {
  const cfg = hello.config
  const solids = loadMap(hello)
  const growth = Number(cfg.cubes.size_per_cube ?? 0.05)
  const minPitch = cfg.mech.min_pitch ?? -0.7
  const maxPitch = cfg.mech.max_pitch ?? 1.3
  const known = new Map<number, Known>()
  let lastHit: { bearing: number; t: number } | null = null
  /** attacker id → last time it damaged us */
  const hitBy = new Map<number, number>()
  const nav = createNav(hello)
  /** The current route: waypoints from nav.path toward `goal`, planned at time `at`. */
  let route: { goal: Vec3; at: number; points: Vec3[]; next: number; found: boolean } | null = null
  /** Build 17 (early arm-up): laser and lightning pickups seen so far (they are listed only while in view), the ones we gave up on, and the one we are walking to. */
  const arms = new Map<number, { kind: "laser" | "lightning"; pos: Vec3 }>()
  /** Build 17 fix: when the laser's charge was first seen full (it fires on its own hold_s later), and where the beam last led. */
  let beamFull: number | null = null
  let beamAt: Vec3 | null = null
  const laserSkip = new Set<number>()
  let rush: { id: number; since: number } | null = null
  /** Build 12: last time a mech (or the zone) damaged us, the item we are walking to, and items we gave up on. */
  let lastMechHit = -Infinity
  /** Build 19: the last time we took damage from anything (mech, drone or zone). */
  let lastDamaged = -Infinity
  let farmChase: { id: number; since: number } | null = null
  const farmGiveUp = new Set<number>()
  /** P-D-003: the drop we are walking to, and drops we gave up on. */
  let dropRun: { id: number; since: number } | null = null
  const dropSkip = new Set<number>()
  /** Build 14 (engage): each weapon's DPS and reach from hello.config, read once here. */
  const baseDps = {} as Record<WeaponKind, number>
  const baseReach = {} as Record<WeaponKind, number>
  for (const kind of WEAPON_KINDS) {
    baseDps[kind] = weaponDps(kind, cfg.weapons[kind] ?? {})
    baseReach[kind] = weaponReach(kind, cfg.weapons[kind] ?? {})
  }
  /** Build 16: the enemy we are focusing, kept until it dies or is lost for TARGET_LOST_S, and the scale for "weak weapons". */
  const targetLock = createTargetLock()
  const topPairDps = WEAPON_KINDS.map((k) => baseDps[k]).sort((a, b) => b - a).slice(0, 2).reduce((a, b) => a + b, 0) || 1
  const cubeDamage = (cubes = 0) => 1 + Number(cfg.cubes.damage_per_cube ?? 0) * Math.min(cubes, Number(cfg.cubes.stat_cap ?? cubes))
  /** Build 14: mech attacker id → last time it damaged us (drones and the zone left out). */
  const mechHitBy = new Map<number, number>()
  /** Build 14: the enemy we are fighting on against, why, since when, and until when the choice holds without a fresh pass. */
  let engaged: { id: number; why: "ttk" | "finish"; since: number; until: number } | null = null
  /** Build 14: targets we gave up on (id → time), and where our last kill died, to collect its cubes. */
  const engageGiveUp = new Map<number, number>()
  let claim: { pos: Vec3; until: number } | null = null
  /** P-B-001: the enemy the standoff break walked at last decision (null when it did not run). */
  let standoffId: number | null = null
  /** P-D-012 (P29): the midring settle walk in progress, and the hold phases (by shrink_start) it gave up on. */
  let settle: { goal: Vec3; phase: number; best: number; at: number } | null = null
  const settleSkip = new Set<number>()
  /** P40 (ROOF_JET_ROUTE_ON): roof items seen so far (crates, cubes, weapons are listed only while in view), the roof
   * trip in progress (target, roof height, the ground spot to climb from, progress for the give-up), and targets given up on. */
  const roofSeen = new Map<number, { kind: "crate" | "cube" | "laser" | "lightning"; pos: Vec3 }>()
  let roofRun: {
    id: number; pos: Vec3; base: Vec3; since: number; phase: string; best: number; bestAt: number; climbing: boolean; waitAt: number | null; standAt: number | null
  } | null = null
  const roofSkip = new Set<number>()

  /** P-B-001: the effective range (m) of our held weapon with the highest sustained DPS, as the engage code closes to:
   * lightning 0.8 × its range, gun GUN_NEAR_M, laser and mortar their reach. */
  function bestWeaponRange(me: Observation["self"]): number {
    let best = -1, range = 0
    for (const w of me.weapons) {
      if (!w) continue
      const stats = { ...cfg.weapons[w.kind], ...w.stats }
      const dps = weaponDps(w.kind, stats), reach = weaponReach(w.kind, stats)
      if (dps <= best) continue
      best = dps
      range = w.kind === "lightning" ? 0.8 * reach : w.kind === "gun" ? Math.min(GUN_NEAR_M, reach) : reach
    }
    return range
  }

  /** Build 14: what we deal per second to a target `d` m away: every held weapon that reaches, × its hit-rate guess × our cube bonus. */
  function ourDps(me: Observation["self"], d: number): number {
    let sum = 0
    for (const w of me.weapons) {
      if (!w) continue
      const stats = { ...cfg.weapons[w.kind], ...w.stats }
      if (weaponReach(w.kind, stats) >= d) sum += weaponDps(w.kind, stats) * hitRate(w.kind, d)
    }
    return sum * cubeDamage(me.cubes)
  }
  /** Build 14: the most damage one magazine of a held weapon that reaches `d` m can do (gun: a full mag; laser: one full shot; lightning: what our energy pays for). */
  function ourMagazine(me: Observation["self"], d: number): number {
    let best = 0
    for (const w of me.weapons) {
      if (!w) continue
      const stats = { ...cfg.weapons[w.kind], ...w.stats }
      if (weaponReach(w.kind, stats) < d) continue
      const shots = w.kind === "gun" ? (stats.mag ?? 1) : w.kind === "lightning" ? Math.floor(me.energy / (stats.energy || 1)) : 1
      best = Math.max(best, finite(stats.damage * shots))
    }
    return best * cubeDamage(me.cubes)
  }
  /** Build 14: what an enemy `d` m away deals per second: each weapon it is seen holding that reaches us, × the same hit-rate guess as ours, × its cube bonus. */
  function enemyDps(e: { weapons?: WeaponKind[]; cubes?: number }, d: number): number {
    let sum = 0
    for (const kind of e.weapons ?? ["gun"]) if (baseReach[kind] >= d) sum += baseDps[kind] * hitRate(kind, d)
    return sum * cubeDamage(e.cubes)
  }

  /** Follow a path to `goal`, re-planning at most once a second (Z1, Build 3). Returns the move and the distance left. */
  function travel(from: Vec3, goal: Vec3, t: number, canPlan: boolean): { move: [number, number]; dist: number; points: Vec3[] } {
    const stale = !route || t - route.at >= ROUTE_REPLAN_S || flat(route.goal, goal) > ROUTE_GOAL_SHIFT
    if (stale && canPlan) {
      const found = nav.path(from, goal, PATH_BUDGET)
      route = { goal, at: t, points: found ?? [goal], next: 0, found: !!found }
    }
    const r = route ?? { goal, at: t, points: [goal], next: 0, found: false }
    while (r.next < r.points.length - 1 && flat(from, r.points[r.next]) < WAYPOINT_REACHED) r.next++
    const rest = r.points.slice(r.next)
    let dist = 0
    let prev: number[] = from
    for (const w of rest) {
      dist += flat(prev, w)
      prev = w
    }
    const yaw = yawTo(from, rest[0])
    return { move: [Math.cos(yaw), Math.sin(yaw)], dist, points: rest }
  }

  /** How many enemies seen in the last 10 s are within ROUTE_TRACK_M of the route. */
  function tracksAlong(from: Vec3, points: Vec3[], t: number): number {
    let n = 0
    for (const k of known.values()) {
      if (t - k.lastSeen > 10) continue
      let prev: number[] = from
      for (const w of points) {
        if (segmentDistance(k.pos, prev, w) < ROUTE_TRACK_M) {
          n++
          break
        }
        prev = w
      }
    }
    return n
  }

  const scale = (cubes = 0) => 1 + growth * cubes
  const centerOf = (m: { pos: Vec3; cubes?: number }): Vec3 => [m.pos[0], m.pos[1], m.pos[2] + (cfg.mech.height / 2) * scale(m.cubes)]

  /**
   * F3, Q2: can any of `threats` see a mech standing at `p` (feet)? Protocol §8: its eye (pos.z + eye_height) needs a
   * line to our center or top, and we must be within near_range, or within range and its fov wedge around its aim yaw.
   * `cone` false drops the wedge test: an attacker already aiming at us sees us wherever it looks (F3).
   */
  function seenAt(p: Vec3, height: number, threats: { pos: Vec3; aim: [number, number]; cubes?: number }[], cone: boolean): boolean {
    const v = cfg.vision
    const halfFov = (v.fov_deg * Math.PI) / 360
    const center: Vec3 = [p[0], p[1], p[2] + height / 2]
    const top: Vec3 = [p[0], p[1], p[2] + height]
    for (const e of threats) {
      const d = flat(e.pos, p)
      if (d > v.range) continue
      if (cone && d > v.near_range && Math.abs(wrap(yawTo(e.pos, p) - e.aim[0])) > halfFov) continue
      const eye: Vec3 = [e.pos[0], e.pos[1], e.pos[2] + (cfg.mech.eye_height ?? cfg.mech.height) * scale(e.cubes)]
      if (clearLine(solids, eye, center, 0, 0) || clearLine(solids, eye, top, 0, 0)) return true
    }
    return false
  }

  /**
   * F3, Q2: the nearest spot we can walk to in a straight line, inside `keepIn` (center, radius), no closer to any
   * threat than we are now, where no threat sees us. Nearest first, no scoring (the full position query is later in
   * Build 5). Null when there is none or the deadline is near.
   */
  function hideSpot(
    me: Observation["self"], height: number, walk: number, threats: { pos: Vec3; aim: [number, number]; cubes?: number }[],
    cone: boolean, keepIn: [number[], number], timeOk: () => boolean,
  ): Vec3 | null {
    const from: Vec3 = [me.pos[0], me.pos[1], me.pos[2] + height / 2]
    for (const s of HIDE_STEPS_S) {
      for (let b = 0; b < HIDE_BEARINGS; b++) {
        if (!timeOk()) return null
        const yaw = (2 * Math.PI * b) / HIDE_BEARINGS
        const x = me.pos[0] + Math.cos(yaw) * walk * s, y = me.pos[1] + Math.sin(yaw) * walk * s
        if (Math.hypot(x - keepIn[0][0], y - keepIn[0][1]) > keepIn[1]) continue
        const g = solids?.ground ? groundAt(solids, x, y) : me.pos[2]
        if (g === -Infinity) continue
        const p: Vec3 = [x, y, g]
        if (threats.some((e) => flat(e.pos, p) < flat(e.pos, me.pos))) continue
        if (!clearLine(solids, from, [x, y, p[2] + height / 2], 0, 0)) continue
        if (!seenAt(p, height, threats, cone)) return p
      }
    }
    return null
  }

  /** P40: true when `p` sits ROOF_MIN_H or more above the terrain on a solid's top (a roof or deck), not on a hill. */
  function onRoof(p: Vec3): boolean {
    const m = solids
    if (!m?.ground) return false
    const g = groundAt(m, p[0], p[1])
    const i = Math.floor((p[0] - m.minX) / m.step), j = Math.floor((p[1] - m.minY) / m.step)
    if (g === -Infinity || i < 0 || j < 0 || i >= m.nx || j >= m.ny) return false
    return p[2] - g >= ROOF_MIN_H && Math.abs(m.top[j * m.nx + i] - p[2]) < 1.5
  }
  /** P40: open ground at (x, y): no solid there, or one low enough to step onto. */
  function openGround(x: number, y: number): boolean {
    const m = solids!
    const i = Math.floor((x - m.minX) / m.step), j = Math.floor((y - m.minY) / m.step)
    if (i < 0 || j < 0 || i >= m.nx || j >= m.ny) return false
    const top = m.top[j * m.nx + i]
    return top === -Infinity || top - groundAt(m, x, y) <= cfg.mech.step_up
  }
  /** P40: the ground spot to climb from for a roof item at `p`: walk out from it along ROOF_BEARINGS bearings to the first
   * open ground (no taller block on the way), step ROOF_STAND_OFF further out, and keep the open spot nearest to `me`. */
  function roofBase(p: Vec3, me: Vec3): Vec3 | null {
    const m = solids!
    let best: Vec3 | null = null, bestD = Infinity
    for (let b = 0; b < ROOF_BEARINGS; b++) {
      const ux = Math.cos((2 * Math.PI * b) / ROOF_BEARINGS), uy = Math.sin((2 * Math.PI * b) / ROOF_BEARINGS)
      for (let r = 1; r <= ROOF_EDGE_M; r++) {
        const x = p[0] + ux * r, y = p[1] + uy * r
        const i = Math.floor((x - m.minX) / m.step), j = Math.floor((y - m.minY) / m.step)
        if (i < 0 || j < 0 || i >= m.nx || j >= m.ny || m.top[j * m.nx + i] > p[2] + cfg.mech.step_up) break
        if (!openGround(x, y)) continue
        const bx = x + ux * ROOF_STAND_OFF, by = y + uy * ROOF_STAND_OFF
        if (openGround(bx, by) && openGround(bx + uy * 2, by - ux * 2) && openGround(bx - uy * 2, by + ux * 2)) {
          const d = Math.hypot(bx - me[0], by - me[1])
          if (d < bestD) { bestD = d; best = [bx, by, groundAt(m, bx, by)] }
        }
        break
      }
    }
    return best
  }

  /** Keep track of every enemy mech seen, and of where the last hit came from. */
  function remember(obs: Observation) {
    for (const m of obs.mechs) {
      if (m.kind !== "mech") continue
      const k: Known = known.get(m.id) ?? { id: m.id, pos: m.pos, vel: m.vel, hp: m.max_hp ?? 1400, maxHp: m.max_hp ?? 1400, cubes: 0, weapons: [], lastSeen: obs.t, hpLog: [] }
      k.pos = m.pos
      k.vel = m.vel
      k.lastSeen = obs.t
      if (m.hp !== undefined) k.hp = m.hp
      if (m.max_hp !== undefined) k.maxHp = m.max_hp
      if (m.cubes !== undefined) k.cubes = m.cubes
      if (m.weapons) k.weapons = m.weapons
      k.hpLog.push([obs.t, k.hp])
      while (k.hpLog.length && obs.t - k.hpLog[0][0] > 4) k.hpLog.shift()
      known.set(m.id, k)
    }
    for (const e of obs.events) {
      // Build 14: our kill drops its cubes plus two where it died; remember the place before forgetting the mech.
      if (e.type === "kill" && ENGAGE_ON && known.has(e.target)) claim = { pos: known.get(e.target)!.pos, until: obs.t + CLAIM_S }
      if (e.type === "kill") known.delete(e.target)
      if (e.type === "damaged" && e.by !== null && e.weapon !== "npc") mechHitBy.set(e.by, obs.t)
      if (e.type === "damaged" && e.bearing !== null) lastHit = { bearing: e.bearing, t: obs.t }
      if (e.type === "damaged" && e.by !== null) hitBy.set(e.by, obs.t)
      if (e.type === "damaged" && e.weapon !== "npc") lastMechHit = obs.t
      if (e.type === "damaged") lastDamaged = obs.t
    }
    for (const [id, k] of known) if (obs.t - k.lastSeen > 30) known.delete(id)
  }

  return {
    name: "mech-bot",
    act(obs: Observation): BotAction {
      const started = performance.now()
      // Deadline guard (D6, §7 rule 2): start a path search only while its worst case still fits in 30 ms.
      const canPlan = () => performance.now() - started < DEADLINE_MS - PLAN_RESERVE_MS
      remember(obs)
      const me = obs.self
      const muzzle: Vec3 = [me.pos[0], me.pos[1], me.pos[2] + (me.stats.muzzle_height ?? cfg.mech.muzzle_height * scale(me.cubes))]
      const tube: Vec3 = [me.pos[0], me.pos[1], me.pos[2] + (me.stats.height ?? cfg.mech.height * scale(me.cubes)) + 0.5]
      const act: BotAction = {}
      const fire: [boolean, boolean] = [false, false]

      // Upgrades (L4): always answer, in the plan's order.
      if (obs.offer?.choices?.length) {
        const ranks = obs.offer.choices.map((c) => upgradeRank(c.id))
        act.pick = ranks.indexOf(Math.min(...ranks))
      }
      const enemies = obs.mechs.filter((m) => m.kind === "mech")

      // Loot (D3, L1, L2): laser and lightning only, never a mortar, and only with no enemy within 160 m.
      // Keep the gun until the second of the two shows up, then swap the gun out, never with an enemy in view.
      let lootTarget: Vec3 | null = null
      if (!enemies.some((m) => flat(m.pos, me.pos) < LOOT_CLEAR)) {
        const held = me.weapons.map((x) => x?.kind ?? null)
        const free = held.indexOf(null)
        const swapSlot = free < 0 && enemies.length === 0 && (held.includes("laser") || held.includes("lightning")) ? held.indexOf("gun") : -1
        const want = obs.pickups
          .filter((p) => (p.kind === "laser" || p.kind === "lightning") && !held.includes(p.kind))
          .sort((a, b) => flat(a.pos, me.pos) - flat(b.pos, me.pos))[0]
        if (want && (free >= 0 || swapSlot >= 0)) {
          if (flat(want.pos, me.pos) < cfg.loot.pickup_radius && Math.abs(want.pos[2] - me.pos[2]) < 4) {
            act.take = want.id
            if (free < 0) act.drop = swapSlot
          } else if (flat(want.pos, me.pos) < LOOT_DETOUR) lootTarget = want.pos
        }
      }
      // Early arm-up (Build 17): remember every laser and lightning seen, forget one that is gone, and take a laser in
      // reach (holding only the gun: a lightning too, the laser first) into a free slot whoever is in view (taking
      // costs nothing; the 160 m rule above would leave us standing on it).
      const holdsLaser = me.weapons.some((x) => x?.kind === "laser")
      const gunOnly = me.weapons.every((x) => !x || x.kind === "gun") && me.weapons.some((x) => x?.kind === "gun")
      if (LASER_RUSH_ON) {
        const eye: Vec3 = [me.pos[0], me.pos[1], me.pos[2] + (me.stats.eye_height ?? cfg.mech.eye_height ?? cfg.mech.height)]
        for (const p of obs.pickups) if (p.kind === "laser" || p.kind === "lightning") arms.set(p.id, { kind: p.kind, pos: p.pos })
        for (const e of obs.events) if (e.type === "take_failed" && e.reason === "gone") arms.delete(e.id)
        for (const [id, a] of arms)
          if (!obs.pickups.some((p) => p.id === id) && flat(a.pos, me.pos) < LASER_GONE_M && clearLine(solids, eye, a.pos, 0, 0)) arms.delete(id)
        const reach = (kind: string) => obs.pickups.find((p) => p.kind === kind && flat(p.pos, me.pos) < cfg.loot.pickup_radius && Math.abs(p.pos[2] - me.pos[2]) < 4)
        const here = holdsLaser || !me.weapons.includes(null) ? undefined : (reach("laser") ?? (gunOnly ? reach("lightning") : undefined))
        if (here) {
          act.take = here.id
          lootTarget = null
        }
      }
      // Zone (Z1, Z2, H2, Q1): leave for the next circle just in time, walk there, then hold silently.
      const z = obs.zone
      const walkSpeed = me.stats.walk_speed ?? cfg.mech.walk_speed
      const silent = Math.min(1, (SILENT_SPEED * 0.9) / walkSpeed)
      const margin = Math.min(15, z.next_radius * 0.25)
      const fromNext = flat(me.pos, z.next_center)
      const inner = Math.max(0, z.next_radius - margin)
      const toEnter = Math.max(0, fromNext - inner)
      const timeLeft = z.shrink_end - obs.t
      // Z1 with path distance (Build 3): aim where the straight line to the next center crosses the circle we want, and
      // plan a path only once there might be little slack (a path is rarely more than twice the straight line).
      const entry: Vec3 =
        fromNext > 1e-6
          ? [z.next_center[0] + ((me.pos[0] - z.next_center[0]) * inner) / fromNext, z.next_center[1] + ((me.pos[1] - z.next_center[1]) * inner) / fromNext, me.pos[2]]
          : [z.next_center[0], z.next_center[1], me.pos[2]]
      let trip: { move: [number, number]; dist: number; points: Vec3[] } | null = null
      let needed = toEnter / (ZONE_WALK * walkSpeed) + ZONE_BUFFER
      if (toEnter > 0 && (2 * toEnter) / (ZONE_WALK * walkSpeed) + ZONE_BUFFER + ROUTE_TRACK_S * known.size >= timeLeft) {
        trip = travel(me.pos, entry, obs.t, canPlan())
        needed = trip.dist / (ZONE_WALK * walkSpeed) + ZONE_BUFFER + ROUTE_TRACK_S * tracksAlong(me.pos, trip.points, obs.t)
      }
      const leaveNow = toEnter > 0 && needed >= timeLeft
      const heading = (to: number[]): [number, number] => {
        const yaw = yawTo(me.pos, to)
        return [Math.cos(yaw), Math.sin(yaw)]
      }
      // F3, Q2 (Build 5): the enemies in view (or remembered for memory_s), nearest first, and where we may hide:
      // inside the circle we are in, and inside the next one once we are there, so hiding never undoes Z1.
      const myHeight = me.stats.height ?? cfg.mech.height * scale(me.cubes)
      const threats = enemies.slice().sort((a, b) => flat(a.pos, me.pos) - flat(b.pos, me.pos)).slice(0, LOS_TARGETS)
      const zoneKeep: [number[], number] = toEnter === 0 ? [z.next_center, inner] : [z.center, Math.max(0, z.radius - margin)]
      // Farm (Build 12): only in the zone, not leaving for the next circle, no enemy mech in view or known within
      // FARM_ENEMY_M, and no damage from a mech for FARM_QUIET_S. Drone fire does not stop farming.
      const farmOk =
        FARM_ON && me.in_zone && !leaveNow && enemies.length === 0 && obs.t - lastMechHit > FARM_QUIET_S &&
        ![...known.values()].some((k) => obs.t - k.lastSeen < FARM_MEMORY_S && flat(k.pos, me.pos) < FARM_ENEMY_M)
      let farmGoal: { id: number; pos: Vec3 } | null = null
      let farmHold = false
      let farmHunt = false
      if (farmOk) {
        // Zone safety: the item is inside the current circle (with margin), and from it we still reach the next
        // circle's inner ring before the shrink ends, with the usual buffer (plus the capture time for a drop).
        const pace = ZONE_WALK * walkSpeed
        const zoneSafe = (p: number[], stay: number) =>
          flat(p, z.center) < Math.max(0, z.radius - margin) &&
          (flat(me.pos, p) + Math.max(0, flat(p, z.next_center) - inner)) / pace + ZONE_BUFFER + stay < timeLeft
        const near = (p: number[]) => flat(p, me.pos) < FARM_PICKUP_M
        const drop = obs.drops
          .filter((d) => d.lands_in <= 0 && (d.holder === null || d.holder === hello.slot) && !farmGiveUp.has(d.id) && near(d.pos) && zoneSafe(d.pos, d.capture_s - d.progress))
          .sort((a, b) => flat(a.pos, me.pos) - flat(b.pos, me.pos))[0]
        const cube = obs.cubes
          .filter((c) => !farmGiveUp.has(c.id) && near(c.pos) && zoneSafe(c.pos, 0))
          .sort((a, b) => flat(a.pos, me.pos) - flat(b.pos, me.pos))[0]
        if (drop && flat(drop.pos, me.pos) < drop.radius - DROP_INSET) farmHold = true
        else if (drop || cube) farmGoal = drop ?? cube
        // Hunt (Build 13): nothing to pick up, so walk toward the nearest drone or crate in view within FARM_HUNT_M
        // (zone-safe, not given up) until it is within HUNT_STAND_M with a clear line; the farm shot code fires.
        if (FARM_HUNT_ON && !farmGoal && !farmHold && me.hp >= HEAL_HP * me.max_hp) {
          const prey = [
            ...obs.mechs.filter((m) => m.kind === "npc").map((m) => ({ id: m.id, pos: m.pos, c: [m.pos[0], m.pos[1], m.pos[2] + cfg.npc.height / 2] as Vec3 })),
            ...obs.crates.map((k) => ({ id: k.id, pos: k.pos, c: [k.pos[0], k.pos[1], k.pos[2] + cfg.crates.height / 2] as Vec3 })),
          ]
            .filter((x) => !farmGiveUp.has(x.id) && flat(x.pos, me.pos) < FARM_HUNT_M && zoneSafe(x.pos, 0))
            .sort((a, b) => flat(a.pos, me.pos) - flat(b.pos, me.pos))[0]
          if (prey && (flat(prey.pos, me.pos) > HUNT_STAND_M || !clearLine(solids, muzzle, prey.c))) {
            farmGoal = prey
            farmHunt = true
          }
        }
      }
      if (farmGoal && farmChase?.id !== farmGoal.id) farmChase = { id: farmGoal.id, since: obs.t }
      if (!farmGoal && !farmHold) farmChase = null
      if (farmGoal && farmChase && obs.t - farmChase.since > (farmHunt ? HUNT_CHASE_S : FARM_CHASE_S)) {
        farmGiveUp.add(farmGoal.id)
        farmGoal = null
      }
      // Engage (F1, Build 14): fight or flee by time-to-kill vs time-to-die. Only in the zone and not leaving for the
      // next circle, so zone safety always wins. `hurt` is the Build 5 retreat trigger, unchanged.
      const hurt = !!lastHit && obs.t - lastHit.t < 2 && me.hp < RETREAT_HP * me.max_hp
      let engage: { m: (typeof enemies)[number]; why: "ttk" | "finish"; clear: boolean } | null = null
      if (ENGAGE_ON && me.in_zone && !leaveNow && threats.length) {
        // Who threatens us: enemies with line of sight to us (wherever they look), and mechs that hit us in the last 2 s.
        const los = threats.filter((e) => seenAt(me.pos, myHeight, [e], false))
        const hitters: number[] = []
        for (const [id, t] of mechHitBy) if (obs.t - t < THREAT_HIT_S) hitters.push(id)
        const alone = (id: number) => !los.some((e) => e.id !== id) && !hitters.some((h) => h !== id)
        const rested = (id: number) => obs.t - (engageGiveUp.get(id) ?? -Infinity) > ENGAGE_REST_S
        // Our time to kill `e` and its time to kill us (s), both sides at their hit-rate guess. Both rules use it.
        const race = (e: (typeof enemies)[number]) => {
          const d = flat(e.pos, me.pos)
          const out = ourDps(me, d)
          const taken = enemyDps(e, d) * (1 - clamp(me.stats.armor ?? 0, 0, 0.9))
          return { ttk: out > 0 ? e.hp! / out : Infinity, ttd: taken > 0 ? me.hp / taken : Infinity }
        }
        const outlive = (e: (typeof enemies)[number]) => {
          const r = race(e)
          return r.ttk < r.ttd
        }
        let pick: (typeof enemies)[number] | undefined
        let why: "ttk" | "finish" = "finish"
        // Finish rule: the weakest enemy within one magazine of dying, while no second enemy sees us or is hitting us,
        // and only if we survive it: our HP at or above ENGAGE_FINISH_HP and the kill coming before our death (ttk < ttd).
        // House bots hunt the weakest first as one squad with shared vision, so a low-HP commit draws the rest.
        if (me.hp >= ENGAGE_FINISH_HP * me.max_hp)
          pick = threats
            .filter((e) => e.hp !== undefined && rested(e.id) && alone(e.id) && e.hp <= ourMagazine(me, flat(e.pos, me.pos)) && outlive(e))
            .sort((a, b) => a.hp! - b.hp!)[0]
        // TTK rule: where the HP retreat would trigger, with exactly one threat and it in sight, fight on if we kill it first.
        if (!pick && hurt && los.length === 1 && los[0].hp !== undefined && alone(los[0].id) && rested(los[0].id)) {
          const e = los[0]
          const { ttk, ttd } = race(e)
          if (ttk < params.aggression * ttd) {
            pick = e
            why = "ttk"
          }
        }
        if (pick) engaged = { id: pick.id, why, since: engaged?.id === pick.id ? engaged.since : obs.t, until: obs.t + ENGAGE_LATCH_S }
        else if (engaged && obs.t < engaged.until && (pick = threats.find((e) => e.id === engaged!.id && alone(e.id)))) why = engaged.why
        else engaged = null
        // Give up on a target we have engaged for ENGAGE_CHASE_S without taking any HP off it over the hpLog window.
        if (pick && engaged && obs.t - engaged.since > ENGAGE_CHASE_S) {
          const seen = known.get(pick.id)?.hpLog
          if (!seen?.length || seen[0][1] <= (pick.hp ?? Infinity)) {
            engageGiveUp.set(pick.id, obs.t)
            engaged = null
            pick = undefined
          }
        }
        if (pick) engage = { m: pick, why, clear: clearLine(solids, muzzle, centerOf(pick)) }
      } else engaged = null
      // Collect (Build 14): after our kill, walk to the cubes it dropped (all of its cubes plus two) if it is safe:
      // nobody has line of sight to us, no mech hit us in the last 2 s, and the same zone test as farming.
      let claimGoal: Vec3 | null = null
      if (claim && obs.t > claim.until) claim = null
      if (claim && me.in_zone && !leaveNow && !engage) {
        const at = claim.pos
        const cube = obs.cubes.filter((c) => flat(c.pos, at) < CLAIM_M).sort((a, b) => flat(a.pos, me.pos) - flat(b.pos, me.pos))[0]
        const goal = cube?.pos ?? at
        const zoneSafe =
          flat(goal, z.center) < Math.max(0, z.radius - margin) &&
          (flat(me.pos, goal) + Math.max(0, flat(goal, z.next_center) - inner)) / (ZONE_WALK * walkSpeed) + ZONE_BUFFER < timeLeft
        if (!cube && flat(me.pos, at) < Number(cfg.cubes.pickup_radius ?? cfg.loot.pickup_radius)) claim = null
        else if (zoneSafe && obs.t - lastMechHit > THREAT_HIT_S && !seenAt(me.pos, myHeight, threats, false)) claimGoal = goal
      }
      // Stop sneaking (Build 19): not hurt (HP at or above the retreat line, no damage for NO_SNEAK_QUIET_S), so no
      // silent speed cap and no walk to a hiding spot. While hurt, the retreat, the heal and their hiding are unchanged.
      const noSneak = NO_SNEAK_ON && me.hp >= RETREAT_HP * me.max_hp && obs.t - lastDamaged > NO_SNEAK_QUIET_S
      // Early arm-up (Build 17): see LASER_RUSH_ON in params.ts. Only while nothing above it is active: in the zone with
      // slack before leaving, not engaging or collecting a kill, not hurt, and no mech damage for FARM_QUIET_S.
      // Fix round: no enemy test (an enemy nearer to the pickup or watching the route no longer stops the trip).
      let rushMove: [number, number] | null = null
      const rushSlot = me.weapons.includes(null) || (enemies.length === 0 && me.weapons.some((x) => x?.kind === "gun"))
      const cubeFirst = me.hp >= HEAL_HP * me.max_hp && (farmHold || (!!farmGoal && !farmHunt && flat(farmGoal.pos, me.pos) < LASER_CUBE_M))
      // Build 80: after the opening, a gun-only bot may start a new lightning/laser walk (champion only continues one).
      const lateLight = LATE_LIGHT_ON && gunOnly && obs.t >= LASER_RUSH_S
      if (
        LASER_RUSH_ON && (obs.t < LASER_RUSH_S || rush || lateLight) && !holdsLaser && rushSlot && me.in_zone && !leaveNow && !trip && !engage &&
        !claimGoal && !hurt && !(cubeFirst && !lateLight) && obs.t - lastMechHit > FARM_QUIET_S
      ) {
        const pace = ZONE_WALK * walkSpeed
        const onward = (p: Vec3) => Math.max(0, flat(p, z.next_center) - inner)
        // `len` m of walking to the weapon at p: a bounded trip, and back in the next circle in time.
        const fits = (p: Vec3, len: number) => len <= LASER_TRIP_M && (len + onward(p)) / pace + ZONE_BUFFER < timeLeft
        // A laser always counts; a lightning only while we hold nothing but the gun. Lasers first, then the nearest.
        const options = [...arms]
          .filter(([id, a]) =>
            (a.kind === "laser" || gunOnly) && !laserSkip.has(id) && flat(a.pos, z.center) < Math.max(0, z.radius - margin) &&
            !(solids?.ground && Math.abs(a.pos[2] - groundAt(solids, a.pos[0], a.pos[1])) >= 4) && fits(a.pos, flat(me.pos, a.pos)))
          .sort((a, b) => Number(a[1].kind !== "laser") - Number(b[1].kind !== "laser") || flat(a[1].pos, me.pos) - flat(b[1].pos, me.pos))
        const kept = rush ? options.find(([id]) => id === rush!.id) : undefined
        const pick = kept && kept[1].kind === options[0][1].kind && flat(kept[1].pos, me.pos) - flat(options[0][1].pos, me.pos) < LASER_SWITCH_M ? kept : options[0]
        if (pick && (obs.t < LASER_RUSH_S || pick === kept || lateLight)) {
          const [id, { pos }] = pick
          if (rush?.id !== id) rush = { id, since: obs.t }
          const go = travel(me.pos, pos, obs.t, canPlan())
          const planned = !!route && flat(route.goal, pos) <= ROUTE_GOAL_SHIFT
          // No path (a ledge, a walled yard) or a walk that has taken too long: leave this one for good.
          if ((planned && !route!.found) || obs.t - rush.since > LASER_CHASE_S) laserSkip.add(id)
          else if (planned && fits(pos, go.dist)) rushMove = go.move
        }
      }
      // Build 80: a late walk yields to B60's crossfire break when two or more enemies can see us.
      if (lateLight && rushMove && CROSSFIRE_ON) {
        const los = threats.filter((e) => seenAt(me.pos, myHeight, [e], false))
        if (los.length >= 2 && hideSpot(me, myHeight, walkSpeed, los, false, zoneKeep, canPlan)) rushMove = null
      }
      if (!rushMove) rush = null
      else farmChase = null
      // Build 103: the ambush is for a lightning holder without a laser (a laser fights at range anyway).
      const arcHeld = LIGHT_AMBUSH_ON ? me.weapons.find((w) => w?.kind === "lightning") : undefined
      const ambushArc = !!arcHeld && !me.weapons.some((w) => w?.kind === "laser")
      const arcReach = Number(arcHeld?.stats.range ?? baseReach.lightning)
      // P-D-003 (DROP_RUN_M): walk to a called supply drop, timed to arrive as it lands, then hold the ring.
      let dropMove: [number, number] | null = null
      let dropHold = false
      if (DROP_RUN_M > 0) {
        const pace = ZONE_WALK * walkSpeed
        const safe = (p: number[], stay: number) =>
          flat(p, z.center) < Math.max(0, z.radius - margin) &&
          (flat(me.pos, p) + Math.max(0, flat(p, z.next_center) - inner)) / pace + ZONE_BUFFER + stay < timeLeft
        const d = me.in_zone && !leaveNow && !trip && !engage && !claimGoal && !hurt && me.hp >= RETREAT_HP * me.max_hp
          ? (obs.drops ?? [])
            .filter((x) => !dropSkip.has(x.id) && (x.holder === null || x.holder === hello.slot) && flat(x.pos, me.pos) <= DROP_RUN_M &&
              safe(x.pos, x.lands_in + x.capture_s - x.progress))
            .sort((a, b) => flat(a.pos, me.pos) - flat(b.pos, me.pos))[0]
          : undefined
        if (!d) dropRun = null
        else {
          if (dropRun?.id !== d.id) dropRun = { id: d.id, since: obs.t }
          const dist = flat(d.pos, me.pos)
          if (dist < d.radius - DROP_INSET) dropHold = true
          else if (obs.t - dropRun.since > d.lands_in + DROP_RUN_M / walkSpeed + 10) { dropSkip.add(d.id); dropRun = null }
          else if (dist / walkSpeed + 5 >= d.lands_in) dropMove = travel(me.pos, d.pos, obs.t, canPlan()).move
          else dropRun = null
        }
      }
      let spot: Vec3 | null = null
      let move: [number, number] = [0, 0]
      let boost = false
      let mode = "hold"
      if (!me.in_zone) {
        // Outside the circle every tick costs HP and stops regen (Z2): head in along a path, boosting.
        move = travel(me.pos, [z.center[0], z.center[1], me.pos[2]], obs.t, canPlan()).move
        boost = true
        mode = "zone escape"
      } else if (leaveNow) {
        const go = trip ?? travel(me.pos, entry, obs.t, canPlan())
        move = go.move
        boost = go.dist / walkSpeed > timeLeft
        mode = "to next circle"
      } else if (engage) {
        // Engage (F1, Build 14): fight on instead of the HP retreat. Hold the line of fire, and close in along a path
        // when the target is behind cover, or (finish rule) beyond our best range. Never walk outside the circle we keep to.
        const d = flat(engage.m.pos, me.pos)
        const arc = me.weapons.find((w) => w?.kind === "lightning")
        const close = arc ? 0.8 * (arc.stats.range ?? baseReach.lightning) : GUN_NEAR_M
        // Build 17: with a laser in hand and a clear line inside its range, the finish rule holds its ground: the beam
        // hits as well at range, and walking in while charging is at half speed.
        const beam = LASER_RUSH_ON ? me.weapons.find((w) => w?.kind === "laser") : undefined
        const standOff = !!beam && engage.clear && d <= (beam.stats.range ?? baseReach.laser)
        if ((!engage.clear || (engage.why === "finish" && d > close && !standOff)) && flat(engage.m.pos, zoneKeep[0]) < zoneKeep[1])
          move = travel(me.pos, engage.m.pos, obs.t, canPlan()).move
        mode = `engage, ${engage.why}`
      } else if (lastHit && obs.t - lastHit.t < 2 && me.hp < RETREAT_HP * me.max_hp && seenAt(me.pos, myHeight, threats, false) && (spot = hideSpot(me, myHeight, walkSpeed, threats, false, zoneKeep, canPlan))) {
        // Retreat (F2, F3, Build 5): hurt and under fire, so head for the nearest in-zone spot out of every visible
        // enemy's line of sight, torso still on the attacker (legs and torso are independent). Boost only above 30% energy.
        move = heading(spot)
        boost = me.energy > 0.3 * me.max_energy
        mode = "retreat to cover"
      } else if (lastHit && obs.t - lastHit.t < 2 && me.hp < RETREAT_HP * me.max_hp) {
        // Retreat (F2, F3) with no cover in reach, or hit by someone we can't see: back away from the attacker with the torso still on it.
        // Lean toward the center near the circle's edge; boost only above 30% energy.
        const away = lastHit.bearing + Math.PI
        let mx = Math.cos(away), my = Math.sin(away)
        const edge = clamp((flat(me.pos, z.center) - (z.radius - 40)) / 40, 0, 1)
        if (edge > 0) {
          const [cx, cy] = heading(z.center)
          mx += 1.5 * edge * cx
          my += 1.5 * edge * cy
        }
        const n = Math.hypot(mx, my) || 1
        move = [mx / n, my / n]
        boost = me.energy > 0.3 * me.max_energy
        mode = "retreat"
      } else if (claimGoal) {
        move = travel(me.pos, claimGoal, obs.t, canPlan()).move
        mode = "engage, collect"
      } else if (rushMove) {
        // Early arm-up (Build 17): full walk speed (steps carry only 40 m), no boost. Walking does not stop regen.
        move = rushMove
        mode = "laser rush"
      } else if (CROSSFIRE_ON && (spot = (() => {
        const los = threats.filter((e) => seenAt(me.pos, myHeight, [e], false))
        return los.length >= 2 ? hideSpot(me, myHeight, walkSpeed, los, false, zoneKeep, canPlan) : null
      })())) {
        move = heading(spot)
        boost = me.energy > 0.3 * me.max_energy
        mode = "break crossfire"
      } else if (LIGHT_AMBUSH_ON && ambushArc && (spot = (() => {
        // Build 103 (H1): one enemy sees us from beyond lightning range but inside the standoff band: step out of its
        // sight and wait for it to come round. No boost: the lightning needs the energy when it does.
        const los = threats.filter((e) => seenAt(me.pos, myHeight, [e], false))
        if (los.length !== 1) return null
        const d = flat(los[0].pos, me.pos)
        return d > arcReach && d <= AMBUSH_MAX_M ? hideSpot(me, myHeight, walkSpeed, los, false, zoneKeep, canPlan) : null
      })())) {
        move = heading(spot)
        mode = "lightning ambush"
      } else if (dropHold) {
        // P-D-003: inside a called drop's ring, stand still until it lands and the capture completes.
        mode = "drop, hold"
      } else if (dropMove) {
        move = dropMove
        mode = "drop, run"
      } else if (me.hp < HEAL_HP * me.max_hp) {
        // Heal (F4, Build 5): until HP is over 90%, stand still (Build 5b: targeting and firing stay normal), and if an enemy can see us, walk silently to the nearest spot it can't (Q2).
        // Build 19: the walk to a hiding spot only while hurt.
        spot = !noSneak && threats.length && seenAt(me.pos, myHeight, threats, true) ? hideSpot(me, myHeight, walkSpeed, threats, true, zoneKeep, canPlan) : null
        if (spot) move = heading(spot)
        mode = spot ? "heal, hiding" : "heal"
      } else if (lootTarget) {
        move = heading(lootTarget)
        mode = "loot"
      } else if (farmHold) {
        // Build 12: inside a landed drop's ring, stand still for capture_s to take its cubes, full HP and energy.
        mode = "farm, capture"
      } else if (farmGoal) {
        move = travel(me.pos, farmGoal.pos, obs.t, canPlan()).move
        mode = farmHunt ? "farm, hunt" : "farm, pickup"
      } else if (!noSneak && threats.length && seenAt(me.pos, myHeight, threats, true)) {
        // Hold out of sight (Q2, Build 5): outside every enemy's 45 m ring and 120° wedge, moving silently. Build 19: only while hurt.
        spot = hideSpot(me, myHeight, walkSpeed, threats, true, zoneKeep, canPlan)
        if (spot) {
          move = heading(spot)
          mode = "hide"
        }
      }
      // Roof jet route (P40, see ROOF_JET_ROUTE_ON): where we would hold, or the farm/loot goal is up on a roof.
      if (ROOF_JET_ROUTE_ON && solids?.ground) {
        const eye: Vec3 = [me.pos[0], me.pos[1], me.pos[2] + (me.stats.eye_height ?? cfg.mech.eye_height ?? cfg.mech.height)]
        for (const k of obs.crates) if (onRoof(k.pos)) roofSeen.set(k.id, { kind: "crate", pos: k.pos })
        for (const c of obs.cubes) if (onRoof(c.pos)) roofSeen.set(c.id, { kind: "cube", pos: c.pos })
        for (const p of obs.pickups) if ((p.kind === "laser" || p.kind === "lightning") && onRoof(p.pos)) roofSeen.set(p.id, { kind: p.kind, pos: p.pos })
        const listed = (id: number) => obs.crates.some((k) => k.id === id) || obs.cubes.some((c) => c.id === id) || obs.pickups.some((p) => p.id === id)
        for (const [id, x] of roofSeen)
          if (!listed(id) && flat(x.pos, me.pos) < ROOF_GONE_M && clearLine(solids, eye, [x.pos[0], x.pos[1], x.pos[2] + 1], 0, 0)) roofSeen.delete(id)
        const held = me.weapons.map((x) => x?.kind ?? null)
        const canTake = held.includes(null) || ((held.includes("laser") || held.includes("lightning")) && held.includes("gun"))
        const wanted = (x: { kind: string }) => x.kind === "crate" || x.kind === "cube" || (canTake && !held.includes(x.kind as WeaponKind))
        const goalUp = (mode === "farm, hunt" || mode === "farm, pickup") && !!farmGoal && onRoof(farmGoal.pos) || (mode === "loot" && !!lootTarget && onRoof(lootTarget))
        // Drop gate: no supply drop called or on the map, and no drop run or ring hold (they rank above and take over).
        const dropBusy = (obs.drops ?? []).length > 0 || !!dropRun || !!dropMove || dropHold || farmHold
        const pace = ZONE_WALK * walkSpeed
        const safe = (p: Vec3) =>
          flat(p, z.center) < Math.max(0, z.radius - margin) &&
          (flat(me.pos, p) + Math.max(0, flat(p, z.next_center) - inner)) / pace + ZONE_BUFFER + ROOF_CLIMB_S < timeLeft
        // A climb already in the air is finished rather than dropped for a farm or loot goal on the ground.
        const inAir = !!roofRun?.climbing && !me.grounded && (mode === "farm, hunt" || mode === "farm, pickup" || mode === "loot")
        const can = obs.t >= ROOF_START_S && farmOk && !dropBusy && (mode === "hold" || goalUp || inAir)
        const fits = (id: number, x: { kind: string; pos: Vec3 }) =>
          !roofSkip.has(id) && wanted(x) && flat(x.pos, me.pos) <= ROOF_RANGE_M && x.pos[2] - me.pos[2] <= ROOF_MAX_H && safe(x.pos)
        if (!can) roofRun = null
        else {
          // Keep the current target while it is still there and fits; otherwise the nearest one that fits.
          const cur = roofRun && roofSeen.get(roofRun.id)
          if (!(roofRun && cur && fits(roofRun.id, cur))) {
            roofRun = null
            const next = [...roofSeen].filter(([id, x]) => fits(id, x)).sort((a, b) => flat(a[1].pos, me.pos) - flat(b[1].pos, me.pos))[0]
            if (next) {
              const base = roofBase(next[1].pos, me.pos)
              if (!base) roofSkip.add(next[0])
              else roofRun = { id: next[0], pos: next[1].pos, base, since: obs.t, phase: "", best: Infinity, bestAt: obs.t, climbing: false, waitAt: null, standAt: null }
            }
          }
        }
        if (roofRun) {
          const run = roofRun
          const top = run.pos[2]
          const kind = roofSeen.get(run.id)!.kind
          // On the roof: standing on it (in the air beside the wall we keep jetting until our feet clear the edge).
          const up = me.grounded && me.pos[2] >= top - 1.5
          const need = ROOF_JET_PER_M * Math.max(0, top - me.pos[2]) + ROOF_JET_SPARE
          if (!run.climbing && !up && flat(me.pos, run.base) < ROOF_AT_BASE_M) run.climbing = true
          let giveUp = obs.t - run.since > ROOF_TRIP_S
          let roofMove: [number, number] = [0, 0]
          let roofBoost = false
          let roofMode = ""
          // Progress for the give-up: path length left while walking to the wall, else distance plus height left to the item.
          let left = flat(me.pos, run.pos) + Math.max(0, top - me.pos[2])
          if (up && kind === "crate" && flat(me.pos, run.pos) <= ROOF_CRATE_STAND_M) {
            // On the roof by a crate: stand; the farm shot code breaks it, then its cube is the next target.
            run.standAt ??= obs.t
            if (obs.t - run.standAt > ROOF_CRATE_S) giveUp = true
            run.bestAt = obs.t
            roofMode = "roof, take"
          } else if (up) {
            run.standAt = null
            roofMove = heading(run.pos)
            roofMode = "roof, top"
          } else if (!run.climbing) {
            const go = travel(me.pos, run.base, obs.t, canPlan())
            if (route && flat(route.goal, run.base) <= ROUTE_GOAL_SHIFT && !route.found) giveUp = true
            roofMove = go.move
            left = go.dist
            roofMode = "roof, walk"
          } else if (me.grounded && me.energy < need) {
            // At the wall without the energy for the climb: wait (energy regenerates while we stand).
            run.waitAt ??= obs.t
            if (obs.t - run.waitAt > ROOF_WAIT_S) giveUp = true
            run.bestAt = obs.t
            roofMode = "roof, wait"
          } else {
            // Climb: jump, then jet while in the air, pushing toward the item until our feet clear the roof edge.
            roofMove = heading(run.pos)
            if (me.grounded) act.jump = true
            else roofBoost = me.pos[2] < top + 1.5
            roofMode = "roof, climb"
          }
          // Waiting for energy and climbing count as one phase, so a climb that keeps falling back still gives up.
          const phase = roofMode === "roof, wait" ? "roof, climb" : roofMode
          if (phase !== run.phase) { run.phase = phase; run.best = Infinity; run.bestAt = obs.t }
          if (left < run.best - 1) { run.best = left; run.bestAt = obs.t }
          if (giveUp || obs.t - run.bestAt > ROOF_STUCK_S) {
            roofSkip.add(run.id)
            roofRun = null
            draw.text("roof give-up")
          } else {
            move = roofMove
            boost = roofBoost
            mode = roofMode
          }
        }
      }
      // Midring settle (P-D-012, idea P29, see MIDRING_SETTLE_ON): only where we would hold after a shrink.
      if (MIDRING_SETTLE_ON) {
        const phase = z.shrink_start
        const r = z.radius
        const afterShrink = r < Number(cfg.zone.start_radius) - 1 && obs.t < z.shrink_start
        const dropNear = (obs.drops ?? []).some((x) => (x.holder === null || x.holder === hello.slot) && flat(x.pos, me.pos) <= DROP_RUN_M)
        const d = flat(me.pos, z.center)
        if (settle && settle.phase !== phase) settle = null
        const can = mode === "hold" && farmOk && !farmGoal && !farmHold && afterShrink && r > MIDRING_MIN_R && !dropNear && !settleSkip.has(phase)
        if (!can) settle = null
        else if (!settle && (d < MIDRING_LO * r || d > MIDRING_HI * r)) {
          const [ux, uy] = d > 1 ? [(me.pos[0] - z.center[0]) / d, (me.pos[1] - z.center[1]) / d] : [Math.cos(yawTo(z.center as any, z.next_center)), Math.sin(yawTo(z.center as any, z.next_center))]
          const goal: Vec3 = [z.center[0] + ux * MIDRING_GOAL * r, z.center[1] + uy * MIDRING_GOAL * r, me.pos[2]]
          const pace = ZONE_WALK * walkSpeed
          const safe = (flat(me.pos, goal) + Math.max(0, flat(goal, z.next_center) - inner)) / pace + ZONE_BUFFER < timeLeft
          if (safe) settle = { goal, phase, best: flat(me.pos, goal), at: obs.t }
        }
        if (settle) {
          const left = flat(me.pos, settle.goal)
          if (left < settle.best - 1) { settle.best = left; settle.at = obs.t }
          if (left < 5) settle = null
          else if (obs.t - settle.at > MIDRING_STUCK_S) { settleSkip.add(phase); settle = null }
          else {
            move = travel(me.pos, settle.goal, obs.t, canPlan()).move
            mode = "midring settle"
          }
        }
      }
      // Standoff break (P-B-001, see STANDOFF_BREAK_S): where we would heal or hold, late in the match, against one lone
      // enemy 45–90 m away that is not charging a laser, while we are well above the retreat line: walk at it along a
      // path until our best weapon reaches it. Everything above (engage, retreat, zone, crossfire, laser walk, lightning
      // ambush) ranks first, and the target/aim/fire code below is unchanged. Named "engage, ..." so the silent cap does not apply.
      if (STANDOFF_BREAK_S > 0) {
        let foe: (typeof enemies)[number] | undefined
        if (obs.t >= STANDOFF_BREAK_S && (mode === "heal" || mode === "heal, hiding" || mode === "hold") && me.hp >= (RETREAT_HP + STANDOFF_HP_MARGIN) * me.max_hp) {
          const los = threats.filter((e) => seenAt(me.pos, myHeight, [e], false))
          const e = los.length === 1 ? los[0] : undefined
          const d = e ? flat(e.pos, me.pos) : Infinity
          const reach = bestWeaponRange(me)
          // A new break starts inside 45–90 m; one already walking at this enemy keeps closing until our weapon reaches it.
          const from = e && e.id === standoffId ? reach : Math.max(STANDOFF_MIN_M, reach)
          if (
            e && !e.charging && d <= STANDOFF_MAX_M && d >= from && d > reach && flat(e.pos, zoneKeep[0]) < zoneKeep[1] &&
            ![...known.values()].some((k) => k.id !== e.id && obs.t - k.lastSeen < STANDOFF_SECOND_S)
          ) foe = e
        }
        if (foe) {
          move = travel(me.pos, foe.pos, obs.t, canPlan()).move
          boost = false
          mode = "engage, standoff"
        }
        standoffId = foe?.id ?? null
      }
      // Inside the next circle, stay under 5 m/s so our steps make no sound (H2, Q1). Healing and hiding are always silent (F4, Q2).
      // Engaging and collecting a kill's cubes go at full walk speed (Build 14): we are already firing or were just heard.
      // Build 19: no cap at all while not hurt, so loot and farm moves inside the next circle go at full walk speed.
      const sneaking = mode === "heal" || mode === "heal, hiding" || mode === "hide"
      if (!noSneak && (toEnter === 0 || sneaking) && !boost && !mode.startsWith("retreat") && !mode.startsWith("engage") && mode !== "laser rush") move = [move[0] * silent, move[1] * silent]
      // Unstick (Build 3): nav.stuck is true after 0.5 s of a held move with almost no speed; call it once per
      // decision. Jump, jet if already in the air, and plan a fresh route next decision.
      if (nav.stuck(me, move)) {
        if (me.grounded) act.jump = true
        else if (me.energy > 15) boost = true
        route = null
      }
      let aim: [number, number] = [Math.hypot(move[0], move[1]) > 0.05 ? Math.atan2(move[1], move[0]) : yawTo(me.pos, z.next_center), 0]

      // Target: the nearest enemy mech with a clear shot, else the nearest one we know is there (Build 16 re-picks below).
      const slotOf = (kind: WeaponKind) => me.weapons.findIndex((w) => w?.kind === kind)
      const options = enemies
        .map((m) => {
          const c = centerOf(m)
          return { m, c, d: span(muzzle, c), clear: false }
        })
        .sort((a, b) => a.d - b.d)
        // Line-of-sight checks go to the nearest few, plus the locked target however far it is (Build 16).
        .filter((o, i) => i < LOS_TARGETS || (TARGET_PICK_ON && o.m.id === targetLock.id))
      for (const o of options) o.clear = clearLine(solids, muzzle, o.c)
      // Build 14: among equally clear targets, the one we are engaged with comes first.
      const engagedId = engage?.m.id
      options.sort((a, b) => Number(b.clear) - Number(a.clear) || Number(b.m.id === engagedId) - Number(a.m.id === engagedId) || a.d - b.d)
      // Build 17 fix (Diego's intake 0035): a charge in progress whose target can no longer be hit. Letting go always
      // fires (the protocol has no cancel) and a full charge fires on its own hold_s later, so `rescue` finds something
      // else for it: the nearest other enemy mech with a clear line in laser range, or, in the last LASER_REAIM_S before
      // it goes off, a drone or crate. It returns where to aim and whether the torso is inside that outline yet.
      const beamSlot = LASER_RUSH_ON ? slotOf("laser") : -1
      const beam = beamSlot >= 0 ? (me.weapons[beamSlot] as WeaponObs) : null
      const beamCharge = beam?.charge ?? 0
      if (beamCharge <= 0) beamFull = null
      else if (beamFull === null && beamCharge >= beam!.stats.charge - 0.03) beamFull = obs.t
      const beamLeft = beamFull === null ? Infinity : Number(beam!.stats.hold_s ?? cfg.weapons.laser.hold_s ?? 2) - (obs.t - beamFull)
      const rescue = (not?: number): { id: number; aim: [number, number]; on: boolean } | null => {
        const at = (id: number, c: Vec3, vel: number[], r: number, h: number) => {
          const p: Vec3 = [c[0] + vel[0] * LASER_LEAD_S, c[1] + vel[1] * LASER_LEAD_S, c[2]]
          const a: [number, number] = [yawTo(muzzle, p), pitchTo(muzzle, p)]
          const d = span(muzzle, c)
          return { id, aim: a, on: Math.abs(wrap(me.aim[0] - a[0])) < Math.atan2(r * LASER_RELEASE, d) && Math.abs(me.aim[1] - a[1]) < Math.atan2(h * LASER_RELEASE, d) }
        }
        const foe = options.filter((o) => o.m.id !== not && o.clear && o.d <= beam!.stats.range).sort((a, b) => a.d - b.d)[0]
        if (foe) return at(foe.m.id, foe.c, foe.m.vel, cfg.mech.radius * scale(foe.m.cubes), (cfg.mech.height / 2) * scale(foe.m.cubes))
        if (beamLeft > LASER_REAIM_S) return null
        const mark = [
          ...obs.mechs.filter((m) => m.kind === "npc").map((m) => ({ id: m.id, vel: m.vel as number[], r: cfg.npc.radius ?? 1.8, h: cfg.npc.height / 2, c: [m.pos[0], m.pos[1], m.pos[2] + cfg.npc.height / 2] as Vec3 })),
          ...obs.crates.map((k) => ({ id: k.id, vel: [0, 0, 0], r: cfg.crates.radius ?? 1.4, h: cfg.crates.height / 2, c: [k.pos[0], k.pos[1], k.pos[2] + cfg.crates.height / 2] as Vec3 })),
        ]
          .filter((x) => x.id !== not && span(muzzle, x.c) <= beam!.stats.range)
          .sort((a, b) => span(muzzle, a.c) - span(muzzle, b.c))
          .slice(0, LOS_TARGETS)
          .find((x) => clearLine(solids, muzzle, x.c))
        return mark ? at(mark.id, mark.c, mark.vel, mark.r, mark.h) : null
      }
      // Farm targets (Build 12): with no enemy mech to shoot, the nearest drone or crate in view with a clear line,
      // within the gun gate, unless we are hurt to retreat level. They go through the same aim and fire code.
      let farmShot = false
      let target = options[0]
      let pickNote = ""
      if (TARGET_PICK_ON) {
        // Build 16: score every option by kill value and hold a lock on the best one (target.ts). Our DPS is Build 14's
        // ourDps, so the pick and the fight-or-flee test read one estimate, and the enemy Build 14 is engaged with takes
        // the lock. The pick runs every decision, also with nobody in view, so the lost timer keeps counting.
        const scored = scoreTargets(
          options.map((o) => {
            const k = known.get(o.m.id)
            const held = o.m.weapons ?? (k?.weapons.length ? k.weapons : undefined)
            return {
              id: o.m.id, pos: o.m.pos, d: o.d, clear: o.clear,
              hp: o.m.hp ?? k?.hp ?? cfg.mech.hp, maxHp: o.m.max_hp ?? k?.maxHp ?? cfg.mech.hp,
              threat: held ? Math.min(1, held.reduce((a, kind) => a + (baseDps[kind] ?? 0), 0) / topPairDps) : 0.5,
            }
          }),
          [...known.values()].filter((k) => obs.t - k.lastSeen <= (cfg.vision.memory_s ?? 5)),
          (d) => ourDps(me, d), z,
        )
        const killed = obs.events.flatMap((e) => (e.type === "kill" ? [e.target] : []))
        const pick = targetLock.pick(scored, obs.t, killed, engagedId)
        target = options.find((o) => o.m.id === pick.target?.id)!
        // Kept short: the debug label is capped at debug.max_text_chars (80).
        if (pick.target) pickNote = ` [${pick.role}${pick.locked ? `+${pick.locked}` : ""} ${pick.target.score.toFixed(2)}]`
      }
      if (!target && farmOk && me.hp >= RETREAT_HP * me.max_hp) {
        const marks = [
          ...obs.mechs.filter((m) => m.kind === "npc").map((m) => ({ m, c: [m.pos[0], m.pos[1], m.pos[2] + cfg.npc.height / 2] as Vec3 })),
          ...obs.crates.map((k) => ({
            m: { id: k.id, kind: "npc" as const, pos: k.pos, vel: [0, 0, 0] as Vec3, aim: [0, 0] as [number, number], hp: k.hp, max_hp: cfg.crates.hp },
            c: [k.pos[0], k.pos[1], k.pos[2] + cfg.crates.height / 2] as Vec3,
          })),
        ]
          .map((x) => ({ ...x, d: span(muzzle, x.c), clear: false }))
          .filter((x) => x.d <= GUN_GATE)
          .sort((a, b) => a.d - b.d)
          .slice(0, LOS_TARGETS)
        target = marks.find((x) => (x.clear = clearLine(solids, muzzle, x.c)))!
        farmShot = !!target
      }
      let label = `knows ${known.size}`

      if (target) {
        const { m, c, d, clear } = target
        const vel: Vec3 = [m.vel[0], m.vel[1], 0]
        const size = scale(m.cubes)
        const yawTol = Math.max(0.015, Math.atan2(cfg.mech.radius * size * 1.2, d))
        const pitchTol = Math.max(0.02, Math.atan2((cfg.mech.height / 2) * size, d))
        const onTarget = (yaw: number, pitch: number, pTol = pitchTol) =>
          Math.abs(wrap(me.aim[0] - yaw)) < yawTol && Math.abs(me.aim[1] - pitch) < pTol
        const gun = slotOf("gun"), laser = slotOf("laser"), arc = slotOf("lightning"), mortar = slotOf("mortar")
        const w = (i: number) => me.weapons[i] as WeaponObs
        const led = lead(muzzle, c, vel, gun >= 0 ? w(gun).stats.speed : cfg.weapons.gun.speed)
        const gunAim: [number, number] = [yawTo(muzzle, led), pitchTo(muzzle, led)]
        const direct: [number, number] = [yawTo(muzzle, c), pitchTo(muzzle, c)]
        // Build 17: the beam is instant and has no spread, so aim it where the target will be when our action lands,
        // and let go only when the torso is inside the target's outline (its own radius and height, not the gun's wider cone).
        const ahead: Vec3 = LASER_RUSH_ON ? [c[0] + vel[0] * LASER_LEAD_S, c[1] + vel[1] * LASER_LEAD_S, c[2]] : c
        const beamAim: [number, number] = [yawTo(muzzle, ahead), pitchTo(muzzle, ahead)]
        const body = farmShot ? [Math.min(cfg.crates.radius ?? 1.4, cfg.npc.radius ?? 1.8), Math.min(cfg.crates.height, cfg.npc.height) / 2] : [cfg.mech.radius * size, (cfg.mech.height / 2) * size]
        const beamOn = LASER_RUSH_ON
          ? Math.abs(wrap(me.aim[0] - beamAim[0])) < Math.atan2(body[0] * LASER_RELEASE, d) && Math.abs(me.aim[1] - beamAim[1]) < Math.atan2(body[1] * LASER_RELEASE, d)
          : onTarget(direct[0], direct[1])

        // Pick the weapon that steers the aim this decision.
        let leading = "track"
        aim = gunAim
        if (clear && laser >= 0 && w(laser).cooldown <= 0 && d <= w(laser).stats.range) {
          leading = "laser"
          aim = beamAim
        } else if (clear && arc >= 0 && d <= w(arc).stats.range) {
          leading = "lightning"
          aim = direct
        } else if (clear && gun >= 0 && d <= w(gun).stats.range) {
          leading = "gun"
          aim = gunAim
        } else if (!farmShot && mortar >= 0 && w(mortar).cooldown <= 0.3 && d > 15) {
          const g = w(mortar).stats.gravity ?? cfg.weapons.mortar.gravity
          const shell = lob(tube, c, vel, w(mortar).stats.speed, g, !clear)
          if (shell && shell.pitch >= minPitch && shell.pitch <= maxPitch) {
            leading = "mortar"
            aim = [shell.yaw, shell.pitch]
          }
        }

        // Fire gate on the gun (D4, A2): inside 100 m, or at a target that is hitting us, is below half HP, or is
        // moving mostly toward or away from us. Past that a sideways mover dodges, and a shot is heard 320 m away.
        const dx = c[0] - muzzle[0], dy = c[1] - muzzle[1], dl = Math.hypot(dx, dy) || 1
        const radial = Math.abs((m.vel[0] * dx + m.vel[1] * dy) / dl)
        const sideways = Math.abs((m.vel[0] * dy - m.vel[1] * dx) / dl)
        const hittingUs = obs.t - (hitBy.get(m.id) ?? -Infinity) < 2
        const weak = (m.hp ?? 1) / (m.max_hp ?? 1) < 0.5
        const gunOpen = d <= GUN_GATE || hittingUs || weak || sideways <= radial
        // Fire only what can hit from where the torso actually points.
        if (clear && gun >= 0 && gunOpen) {
          const g = w(gun)
          if ((g.ammo ?? 1) > 0 && (g.reload ?? 0) <= 0 && d <= g.stats.range && onTarget(gunAim[0], gunAim[1])) fire[gun] = true
        }
        if (clear && arc >= 0) {
          const l = w(arc)
          const halfCone = ((l.stats.cone_deg ?? 30) * Math.PI) / 360
          if (d <= l.stats.range && Math.abs(wrap(me.aim[0] - direct[0])) < halfCone && me.energy >= (l.stats.energy ?? 3)) fire[arc] = true
        }
        if (laser >= 0) {
          const l = w(laser)
          const charge = l.charge ?? 0
          if (charge > 0) {
            // Charging: let go to fire once it is full and lined up.
            const full = charge >= l.stats.charge - 0.03
            let lined = leading === "laser" && beamOn
            // Build 17 fix: this target is behind cover or out of laser range now, so turn the charge onto something we can hit.
            const other = LASER_RUSH_ON && leading !== "laser" ? rescue(m.id) : null
            if (other) {
              leading = "re-aim"
              aim = other.aim
              lined = other.on
            }
            fire[laser] = !(full && lined)
          } else if (leading === "laser") fire[laser] = true
          if (LASER_RUSH_ON && leading === "laser") beamAt = c
        }
        if (mortar >= 0 && leading === "mortar" && w(mortar).cooldown <= 0 && onTarget(aim[0], aim[1], 0.012)) fire[mortar] = true
        if (gun >= 0 && (w(gun).ammo ?? 1) === 0 && (w(gun).reload ?? 0) <= 0) act.reload = true

        draw.line(muzzle, c, clear ? "#ff5040" : "#888888")
        label += ` · ${farmShot ? "farm " : ""}${leading} at ${m.id} ${d.toFixed(0)}m${clear ? "" : " (behind cover)"}${pickNote}`
      } else {
        // Nobody known nearby: face whoever hit us last (hits from behind do 1.5x), and top up the gun.
        // Build 17: at spawn, with no laser yet, turn the torso once around to see the pickups on every side.
        if (LASER_RUSH_ON && obs.t < LASER_SCAN_S && !holdsLaser) aim = [wrap(me.aim[0] + 1.5), 0]
        // Build 17 fix: a charge in progress and nobody left to aim at. Letting go here would fire it at nothing, so keep
        // it (unless we have to travel: charging halves the walk), on something else we can hit or facing where the
        // beam last led, and let go only inside an outline. It still fires on its own hold_s after it is full.
        if (beam && beamCharge > 0 && me.in_zone && !leaveNow) {
          const other = rescue()
          if (other) aim = other.aim
          else if (beamAt) aim = [yawTo(muzzle, beamAt), pitchTo(muzzle, beamAt)]
          fire[beamSlot] = !(other?.on && beamFull !== null)
        }
        if (lastHit && obs.t - lastHit.t < 2) aim = [lastHit.bearing, 0]
        const g = me.weapons.find((x) => x?.kind === "gun")
        if (g && (g.ammo ?? 0) < (g.stats.mag ?? 12) / 2 && (g.reload ?? 0) <= 0) act.reload = true
      }

      act.move = move
      act.boost = boost
      act.aim = [aim[0], clamp(aim[1], minPitch, maxPitch)]
      act.fire = fire
      draw.label(`${label} · ${mode}`)
      const took = performance.now() - started
      if (took > DEADLINE_MS) log(`decision at tick ${obs.tick} took ${took.toFixed(1)} ms`)
      return act
    },
  }
}
