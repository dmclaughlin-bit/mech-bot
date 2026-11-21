/**
 * mech-bot brain.
 *
 * Build 1: keep track of every bot around, and aim each weapon so it actually hits.
 * Build 2 (survival-min): setup that cannot fail, terrain in the cover check, laser and lightning
 * only, a fire gate on the gun, zone travel that leaves just in time and holds silently,
 * unsticking, retreat when hurt, and an upgrade order. The rules are §9 of the team plan.
 */
import { clearLine, loadMap } from "./map.ts"
import { type Bot, type BotAction, type Hello, type Observation, type Vec3, type WeaponKind, type WeaponObs, draw, log } from "./mechfight.ts"

// ------------------------------------------------------------------ geometry helpers
const flat = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1])
const span = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const yawTo = (from: number[], to: number[]) => Math.atan2(to[1] - from[1], to[0] - from[0])
const pitchTo = (from: number[], to: number[]) => Math.atan2(to[2] - from[2], flat(from, to))
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// ------------------------------------------------------------------ rule constants (plan §9)
/** L2: loot only when no enemy mech is within this distance (m). */
const LOOT_CLEAR = 160
/** L2: walk at most this far (m) to a wanted weapon. */
const LOOT_DETOUR = 80
/** D4, A2: the gun fires only inside this range (m), unless the target is hitting us, below half HP, or not moving sideways. */
const GUN_GATE = 100
/** Z1: plan the trip to the next circle at this fraction of walk speed. */
const ZONE_WALK = 0.8
/** Z1: seconds of buffer when deciding to leave for the next circle. */
const ZONE_BUFFER = 10
/** H2, Q1: stay under this ground speed (m/s) inside the next circle, so our steps make no sound. */
const SILENT_SPEED = 5

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
  /** attacker id → last time it damaged us */
  const hitBy = new Map<number, number>()
  /** where we were over the last half second, and whether we were trying to move */
  const trail: { t: number; pos: Vec3; moving: boolean }[] = []

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
      if (e.type === "damaged" && e.by !== null) hitBy.set(e.by, obs.t)
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

      if (obs.offer) act.pick = 0
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
      const toEnter = Math.max(0, flat(me.pos, z.next_center) - (z.next_radius - margin))
      const timeLeft = z.shrink_end - obs.t
      const leaveNow = toEnter > 0 && toEnter / (ZONE_WALK * walkSpeed) + ZONE_BUFFER >= timeLeft
      const heading = (to: number[]): [number, number] => {
        const yaw = yawTo(me.pos, to)
        return [Math.cos(yaw), Math.sin(yaw)]
      }
      let move: [number, number] = [0, 0]
      let boost = false
      let mode = "hold"
      if (!me.in_zone) {
        // Outside the circle every tick costs HP and stops regen (Z2): head straight in, boosting.
        move = heading(z.center)
        boost = true
        mode = "zone escape"
      } else if (leaveNow) {
        move = heading(z.next_center)
        boost = toEnter / walkSpeed > timeLeft
        mode = "to next circle"
      } else if (lootTarget) {
        move = heading(lootTarget)
        mode = "loot"
      }
      // Inside the next circle, stay under 5 m/s so our steps make no sound (H2, Q1).
      if (toEnter === 0 && !boost) move = [move[0] * silent, move[1] * silent]
      // Unstick: jump, then jet, only when we've been trying to move but covered under 1 m in 0.5 s.
      trail.push({ t: obs.t, pos: me.pos, moving: Math.hypot(move[0], move[1]) > 0.2 })
      while (trail.length > 1 && obs.t - trail[0].t > 0.5) trail.shift()
      const stuck = obs.t - trail[0].t >= 0.45 && trail.every((s) => s.moving) && flat(trail[0].pos, me.pos) < 1
      if (stuck) {
        if (me.grounded) act.jump = true
        else if (me.energy > 15) boost = true
      }
      let aim: [number, number] = [Math.hypot(move[0], move[1]) > 0.05 ? Math.atan2(move[1], move[0]) : yawTo(me.pos, z.next_center), 0]

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
      return act
    },
  }
}
