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
 */
import { clearLine, groundAt, loadMap } from "./map.ts"
import { createNav } from "./nav.ts"
import { params } from "./params.ts"
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
  const nav = createNav(hello)
  /** The current route: waypoints from nav.path toward `goal`, planned at time `at`. */
  let route: { goal: Vec3; at: number; points: Vec3[]; next: number } | null = null

  /** Follow a path to `goal`, re-planning at most once a second (Z1, Build 3). Returns the move and the distance left. */
  function travel(from: Vec3, goal: Vec3, t: number, canPlan: boolean): { move: [number, number]; dist: number; points: Vec3[] } {
    const stale = !route || t - route.at >= ROUTE_REPLAN_S || flat(route.goal, goal) > ROUTE_GOAL_SHIFT
    if (stale && canPlan) route = { goal, at: t, points: nav.path(from, goal, PATH_BUDGET) ?? [goal], next: 0 }
    const r = route ?? { goal, at: t, points: [goal], next: 0 }
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
      if (e.type === "kill") known.delete(e.target)
      if (e.type === "damaged" && e.bearing !== null) lastHit = { bearing: e.bearing, t: obs.t }
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
      } else if (me.hp < HEAL_HP * me.max_hp) {
        // Heal (F4, Build 5): until HP is over 90%, stand still (Build 5b: targeting and firing stay normal), and if an enemy can see us, walk silently to the nearest spot it can't (Q2).
        spot = threats.length && seenAt(me.pos, myHeight, threats, true) ? hideSpot(me, myHeight, walkSpeed, threats, true, zoneKeep, canPlan) : null
        if (spot) move = heading(spot)
        mode = spot ? "heal, hiding" : "heal"
      } else if (lootTarget) {
        move = heading(lootTarget)
        mode = "loot"
      } else if (threats.length && seenAt(me.pos, myHeight, threats, true)) {
        // Hold out of sight (Q2, Build 5): outside every enemy's 45 m ring and 120° wedge, moving silently.
        spot = hideSpot(me, myHeight, walkSpeed, threats, true, zoneKeep, canPlan)
        if (spot) {
          move = heading(spot)
          mode = "hide"
        }
      }
      // Inside the next circle, stay under 5 m/s so our steps make no sound (H2, Q1). Healing and hiding are always silent (F4, Q2).
      const sneaking = mode === "heal" || mode === "heal, hiding" || mode === "hide"
      if ((toEnter === 0 || sneaking) && !boost && !mode.startsWith("retreat")) move = [move[0] * silent, move[1] * silent]
      // Unstick (Build 3): nav.stuck is true after 0.5 s of a held move with almost no speed; call it once per
      // decision. Jump, jet if already in the air, and plan a fresh route next decision.
      if (nav.stuck(me, move)) {
        if (me.grounded) act.jump = true
        else if (me.energy > 15) boost = true
        route = null
      }
      let aim: [number, number] = [Math.hypot(move[0], move[1]) > 0.05 ? Math.atan2(move[1], move[0]) : yawTo(me.pos, z.next_center), 0]

      // Target: the nearest enemy mech with a clear shot, else the nearest one we know is there.
      const slotOf = (kind: WeaponKind) => me.weapons.findIndex((w) => w?.kind === kind)
      const options = enemies
        .map((m) => {
          const c = centerOf(m)
          return { m, c, d: span(muzzle, c), clear: false }
        })
        .sort((a, b) => a.d - b.d)
        .slice(0, LOS_TARGETS)
      for (const o of options) o.clear = clearLine(solids, muzzle, o.c)
      options.sort((a, b) => Number(b.clear) - Number(a.clear) || a.d - b.d)
      const target = options[0]
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

        // Pick the weapon that steers the aim this decision.
        let leading = "track"
        aim = gunAim
        if (clear && laser >= 0 && w(laser).cooldown <= 0 && d <= w(laser).stats.range) {
          leading = "laser"
          aim = direct
        } else if (clear && arc >= 0 && d <= w(arc).stats.range) {
          leading = "lightning"
          aim = direct
        } else if (clear && gun >= 0 && d <= w(gun).stats.range) {
          leading = "gun"
          aim = gunAim
        } else if (mortar >= 0 && w(mortar).cooldown <= 0.3 && d > 15) {
          const g = w(mortar).stats.gravity ?? cfg.weapons.mortar.gravity
          const shell = lob(tube, c, vel, w(mortar).stats.speed, g, !clear)
          if (shell && shell.pitch >= minPitch && shell.pitch <= maxPitch) {
            leading = "mortar"
            aim = [shell.yaw, shell.pitch]
          }
        }

        // Build 7 (practice): no 100 m gun gate. The gun fires at any clear target within its configured range
        // (stats.range from hello.config), still only when the torso is on the lead point.
        // Fire only what can hit from where the torso actually points.
        if (clear && gun >= 0) {
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
            fire[laser] = !(full && leading === "laser" && onTarget(direct[0], direct[1]))
          } else if (leading === "laser") fire[laser] = true
        }
        if (mortar >= 0 && leading === "mortar" && w(mortar).cooldown <= 0 && onTarget(aim[0], aim[1], 0.012)) fire[mortar] = true
        if (gun >= 0 && (w(gun).ammo ?? 1) === 0 && (w(gun).reload ?? 0) <= 0) act.reload = true

        draw.line(muzzle, c, clear ? "#ff5040" : "#888888")
        label += ` · ${leading} at ${m.id} ${d.toFixed(0)}m${clear ? "" : " (behind cover)"}`
      } else {
        // Nobody known nearby: face whoever hit us last (hits from behind do 1.5x), and top up the gun.
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
