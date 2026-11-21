/**
 * mech-bot brain.
 *
 * Build 1: keep track of every bot around, and aim each weapon so it actually hits.
 * Build 2 (survival-min): setup that cannot fail, terrain in the cover check, laser and lightning
 * only, a fire gate on the gun, zone travel that leaves just in time and holds silently,
 * unsticking, retreat when hurt, and an upgrade order. The rules are §9 of the team plan.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { type Bot, type BotAction, type Hello, type Observation, type Vec3, type WeaponKind, type WeaponObs, draw, log } from "./mechfight.ts"

// ------------------------------------------------------------------ geometry helpers
const flat = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1])
const span = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const yawTo = (from: number[], to: number[]) => Math.atan2(to[1] - from[1], to[0] - from[0])
const pitchTo = (from: number[], to: number[]) => Math.atan2(to[2] - from[2], flat(from, to))
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// ------------------------------------------------------------------ the map
/** Buildings, stadium and bridges on a grid: per cell, the lowest base and the highest top. */
type Solids = { minX: number; minY: number; step: number; nx: number; ny: number; base: Float32Array; top: Float32Array }

function inside(ring: number[], x: number, y: number): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i], yi = ring[i + 1], xj = ring[j], yj = ring[j + 1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

function loadSolids(hello: Hello): Solids | null {
  const dir = hello?.map?.dir
  if (typeof dir !== "string" || !dir) {
    log("no map folder in hello, firing without cover checks")
    return null
  }
  const file = hello.map.files?.find((f) => f.endsWith("world.json")) ?? "v2/world.json"
  for (const path of [join(dir, file), join(dir, "arena", file)]) {
    let text: string
    try {
      text = readFileSync(path, "utf8")
    } catch {
      continue
    }
    try {
      const world = JSON.parse(text)
      const { minX, minY, nx, ny } = world.terrain
      const step: number = world.terrain.step ?? 1
      const base = new Float32Array(nx * ny).fill(Infinity)
      const top = new Float32Array(nx * ny).fill(-Infinity)
      for (const p of world.prisms) {
        const ring: number[] = p.ring
        const holes: number[][] = p.holes ?? []
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
        for (let i = 0; i < ring.length; i += 2) {
          x0 = Math.min(x0, ring[i]); x1 = Math.max(x1, ring[i])
          y0 = Math.min(y0, ring[i + 1]); y1 = Math.max(y1, ring[i + 1])
        }
        const i0 = Math.max(0, Math.floor((x0 - minX) / step)), i1 = Math.min(nx - 1, Math.floor((x1 - minX) / step))
        const j0 = Math.max(0, Math.floor((y0 - minY) / step)), j1 = Math.min(ny - 1, Math.floor((y1 - minY) / step))
        for (let j = j0; j <= j1; j++) {
          const y = minY + (j + 0.5) * step
          for (let i = i0; i <= i1; i++) {
            const x = minX + (i + 0.5) * step
            if (!inside(ring, x, y) || holes.some((h) => inside(h, x, y))) continue
            const k = j * nx + i
            if (p.base < base[k]) base[k] = p.base
            if (p.top > top[k]) top[k] = p.top
          }
        }
      }
      return { minX, minY, step, nx, ny, base, top }
    } catch (e) {
      log("could not read the map, firing without cover checks:", e)
      return null
    }
  }
  log("map not found under", hello.map?.dir, "- firing without cover checks")
  return null
}

/** True when no building, stadium or bridge sits on the straight line from a to b. Trees never stop shots. */
function clearLine(s: Solids | null, a: Vec3, b: Vec3, skipStart = 3, skipEnd = 2.5): boolean {
  if (!s) return true
  const len = span(a, b)
  const usable = len - skipStart - skipEnd
  if (usable <= 0) return true
  const steps = Math.ceil(usable / 0.75)
  for (let n = 0; n <= steps; n++) {
    const f = (skipStart + (usable * n) / steps) / len
    const x = a[0] + (b[0] - a[0]) * f
    const y = a[1] + (b[1] - a[1]) * f
    const z = a[2] + (b[2] - a[2]) * f
    const i = Math.floor((x - s.minX) / s.step), j = Math.floor((y - s.minY) / s.step)
    if (i < 0 || j < 0 || i >= s.nx || j >= s.ny) continue
    const k = j * s.nx + i
    if (z >= s.base[k] && z <= s.top[k]) return false
  }
  return true
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
  const solids = loadSolids(hello)
  const growth = Number(cfg.cubes.size_per_cube ?? 0.05)
  const minPitch = cfg.mech.min_pitch ?? -0.7
  const maxPitch = cfg.mech.max_pitch ?? 1.3
  const known = new Map<number, Known>()
  let lastHit: { bearing: number; t: number } | null = null

  const scale = (cubes = 0) => 1 + growth * cubes
  const centerOf = (m: { pos: Vec3; cubes?: number }): Vec3 => [m.pos[0], m.pos[1], m.pos[2] + (cfg.mech.height / 2) * scale(m.cubes)]

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
      remember(obs)
      const me = obs.self
      const muzzle: Vec3 = [me.pos[0], me.pos[1], me.pos[2] + (me.stats.muzzle_height ?? cfg.mech.muzzle_height * scale(me.cubes))]
      const tube: Vec3 = [me.pos[0], me.pos[1], me.pos[2] + (me.stats.height ?? cfg.mech.height * scale(me.cubes)) + 0.5]
      const act: BotAction = {}
      const fire: [boolean, boolean] = [false, false]

      // Starter behavior, unchanged in build 1: default upgrade, grab a weapon, walk to the next circle.
      if (obs.offer) act.pick = 0
      const pickup = obs.pickups.find((p) => flat(p.pos, me.pos) < cfg.loot.pickup_radius && p.kind !== "gun")
      if (!me.weapons[1] && pickup) act.take = pickup.id
      const walk = yawTo(me.pos, obs.zone.next_center)
      act.move = [Math.cos(walk), Math.sin(walk)]
      act.boost = !me.in_zone
      act.jump = obs.tick % 40 === 0
      let aim: [number, number] = [walk, 0]

      // Target: the nearest enemy mech with a clear shot, else the nearest one we know is there.
      const slotOf = (kind: WeaponKind) => me.weapons.findIndex((w) => w?.kind === kind)
      const options = obs.mechs
        .filter((m) => m.kind === "mech")
        .map((m) => {
          const c = centerOf(m)
          return { m, c, d: span(muzzle, c), clear: clearLine(solids, muzzle, c) }
        })
        .sort((a, b) => Number(b.clear) - Number(a.clear) || a.d - b.d)
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

      act.aim = [aim[0], clamp(aim[1], minPitch, maxPitch)]
      act.fire = fire
      draw.label(label)
      return act
    },
  }
}
