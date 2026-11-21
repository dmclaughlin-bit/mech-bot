/**
 * Build 15 offline check: replay the kit recording through the brain with AIM_LEAD_ON off (before) and on (after),
 * and report what fraction of gun shots are predicted to hit. OFFLINE ONLY, not a score.
 *
 *   bun tools/aim_check.ts [stream.jsonl[.gz]] [arenaDir] < /dev/null
 *
 * How a shot is judged: a bullet is flown from where the recorded mech really stood, in small steps, against where
 * the target really was at each later moment of the recording (positions between observations are interpolated).
 * It hits when it enters the target's cylinder (radius plus the bullet's radius) before its range runs out, with no
 * solid on the way. No random spread is drawn: this is the centre line of each shot.
 *
 * Two fractions per variant:
 *   aim solutions  every decision with a gun target in the open: a shot along the aim the brain commands.
 *   shots fired    every decision where the brain pulls the gun trigger: a shot along the recorded torso aim after
 *                  it has turned toward the commanded aim. This is the fire-discipline number.
 *
 * Limits: the recording does not react to us (the torso aim, cooldown and ammo are the recorded bot's, not ours),
 * it holds one enemy and no laser, and when a shot leaves within a decision is our own inference (aim.ts). So the
 * same numbers are printed for two other shot timings too, to show how much of the gain depends on that inference.
 * stdin must be closed: map.ts imports mechfight.ts.
 */
import { existsSync, readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { slewAim } from "../aim.ts"
import { createBot } from "../brain.ts"
import { clearLine, loadMap } from "../map.ts"
import { draw, type BotAction, type Hello, type Observation, type Vec3 } from "../mechfight.ts"

const arg = process.argv.slice(2)
const kit = ["../mechfight-kit", "/workspace/mechfight-kit"].find((d) => existsSync(`${d}/check/stream.jsonl.gz`))
const file = arg[0] ?? (kit ? `${kit}/check/stream.jsonl.gz` : "")
const arena = arg[1] ?? (kit ? `${kit}/arena` : "/arena")
if (!file || !existsSync(file)) {
  console.error("usage: bun tools/aim_check.ts <stream.jsonl[.gz]> [arenaDir]")
  process.exit(2)
}
const raw = readFileSync(file)
const lines = (file.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8").split("\n").filter(Boolean)
const hello = JSON.parse(lines[0]) as Hello
if (hello.type !== "hello") throw new Error("first line is not a hello")
hello.map.dir = arena
const all = lines.slice(1).map((l) => JSON.parse(l) as Observation).filter((o) => o.type === "obs")
const cfg = hello.config
const solids = loadMap(hello)
const tickS = 1 / (Number(cfg.match?.tick_hz) || 20)
const decideTicks = Number(cfg.match?.decide_every) || 2
const bulletR = Number(cfg.projectile?.gun_radius ?? 0)

// ---- where everything really was: recorded positions over time, interpolated between observations
type Point = { t: number; pos: Vec3 }
const paths = new Map<number, Point[]>()
const own: Point[] = []
const sizes = new Map<number, { r: number; h: number }>()
for (const o of all) {
  own.push({ t: o.t, pos: o.self.pos })
  for (const m of o.mechs) {
    if (!paths.has(m.id)) paths.set(m.id, [])
    paths.get(m.id)!.push({ t: o.t, pos: m.pos })
    const grow = 1 + Number(cfg.cubes.size_per_cube ?? 0.05) * (m.cubes ?? 0)
    sizes.set(m.id, m.kind === "mech" ? { r: cfg.mech.radius * grow, h: cfg.mech.height * grow } : { r: Number(cfg.npc.radius), h: Number(cfg.npc.height) })
  }
  for (const k of o.crates) {
    // A crate does not move: one point that holds for the whole recording.
    if (!paths.has(k.id)) paths.set(k.id, [{ t: -Infinity, pos: k.pos }, { t: Infinity, pos: k.pos }])
    sizes.set(k.id, { r: Number(cfg.crates.radius), h: Number(cfg.crates.height) })
  }
}
/** Position at time t, or null when the recording does not cover it (not in view then, or past the end). */
function where(path: Point[], t: number): Vec3 | null {
  for (let i = 0; i + 1 < path.length; i++) {
    const a = path[i], b = path[i + 1]
    if (t < a.t || t > b.t) continue
    if (!Number.isFinite(a.t)) return a.pos
    if (b.t - a.t > 3 * decideTicks * tickS) return null
    const f = (t - a.t) / (b.t - a.t)
    return [a.pos[0] + (b.pos[0] - a.pos[0]) * f, a.pos[1] + (b.pos[1] - a.pos[1]) * f, a.pos[2] + (b.pos[2] - a.pos[2]) * f]
  }
  return null
}

/**
 * Shot timing: the bullet leaves on sim tick k from where the shooter stands `standTicks` ticks after the decision,
 * and has flown for `t − flownFrom` seconds at time t after the decision.
 */
type Timing = { name: string; stand: (k: number) => number; flownFrom: (k: number) => number }
const timings: Timing[] = [
  { name: "inferred from the recording (aim.ts): leaves on tick k, already flying during it", stand: (k) => k, flownFrom: (k) => (k - 1) * tickS },
  { name: "one tick earlier: leaves at the decision from where we stand then", stand: (k) => k - 1, flownFrom: (k) => (k - 1) * tickS },
  { name: "one tick later: leaves at the end of tick k", stand: (k) => k, flownFrom: (k) => k * tickS },
]

/** Fly one bullet. True = hit, false = miss, null = the recording ends before we can tell. */
function fly(o: Observation, targetId: number, aim: [number, number], k: number, speed: number, range: number, timing: Timing): boolean | null {
  const path = paths.get(targetId), size = sizes.get(targetId)
  if (!path || !size) return null
  const feet = where(own, o.t + timing.stand(k) * tickS)
  if (!feet) return null
  const from: Vec3 = [feet[0], feet[1], feet[2] + (o.self.stats.muzzle_height ?? cfg.mech.muzzle_height)]
  const head = (o.self.stats.radius ?? cfg.mech.radius) + 0.5
  const u: Vec3 = [Math.cos(aim[1]) * Math.cos(aim[0]), Math.cos(aim[1]) * Math.sin(aim[0]), Math.sin(aim[1])]
  const start = timing.flownFrom(k)
  for (let t = Math.max(start, 0); ; t += 0.002) {
    const far = head + speed * (t - start)
    if (far > range) return false
    const at = where(path, o.t + t)
    if (!at) return null
    const b: Vec3 = [from[0] + u[0] * far, from[1] + u[1] * far, from[2] + u[2] * far]
    const inside = Math.hypot(b[0] - at[0], b[1] - at[1]) <= size.r + bulletR && b[2] >= at[2] - bulletR && b[2] <= at[2] + size.h + bulletR
    if (inside) return clearLine(solids, from, b, 3, size.r + bulletR + 0.5)
  }
}

type Tally = { scored: number; hit: number; unknown: number }
const tally = (): Tally => ({ scored: 0, hit: 0, unknown: 0 })
const add = (x: Tally, r: boolean | null) => {
  if (r === null) x.unknown++
  else {
    x.scored++
    if (r) x.hit++
  }
}
const bands = ["mech under 60 m", "mech 60 to 100 m", "mech 100 to 160 m", "mech over 160 m", "drone", "crate"]
const bandOf = (id: number, d: number) => (id >= 1000 ? 5 : id >= 100 ? 4 : d < 60 ? 0 : d < 100 ? 1 : d < 160 ? 2 : 3)

function replay(aimLead: boolean) {
  const bot = createBot(hello, { aimLead })
  const out = timings.map(() => ({ aim: tally(), fired: tally(), aimBand: bands.map(tally), firedBand: bands.map(tally) }))
  let targetTicks = 0, firedTicks = 0
  const acts: BotAction[] = []
  for (const o of all) {
    const act = bot.act(o)
    acts.push(act)
    const label = draw.take()?.label ?? ""
    const gun = o.self.weapons.findIndex((w) => w?.kind === "gun")
    const seen = / · (?:farm )?\w+ at (\d+) (\d+)m( \(behind cover\))?/.exec(label)
    if (!seen || gun < 0 || !act.aim) continue
    const id = Number(seen[1]), d = Number(seen[2])
    const g = o.self.weapons[gun]!
    const k = Math.min(decideTicks, Math.max(1, Math.ceil((g.cooldown ?? 0) / tickS - 1e-6)))
    const firing = !!act.fire?.[gun]
    const open = !seen[3] && d <= g.stats.range
    if (open) targetTicks++
    if (firing) firedTicks++
    const turn = (o.self.stats.turn_rate ?? cfg.mech.turn_rate) * tickS * k, tilt = (o.self.stats.pitch_rate ?? cfg.mech.pitch_rate) * tickS * k
    timings.forEach((timing, n) => {
      if (open) {
        const r = fly(o, id, act.aim!, k, g.stats.speed, g.stats.range, timing)
        add(out[n].aim, r)
        add(out[n].aimBand[bandOf(id, d)], r)
      }
      if (firing) {
        const r = fly(o, id, slewAim(o.self.aim, act.aim!, turn, tilt), k, g.stats.speed, g.stats.range, timing)
        add(out[n].fired, r)
        add(out[n].firedBand[bandOf(id, d)], r)
      }
    })
  }
  return { out, targetTicks, firedTicks, acts }
}

const before = replay(false), after = replay(true)
const show = (x: Tally) => (x.scored ? `${x.hit}/${x.scored} = ${((100 * x.hit) / x.scored).toFixed(0)}%` : "none").padEnd(18)
console.log(`OFFLINE replay of ${file} (non-reactive recording; predicted hits, not a score)`)
console.log(`observations: ${all.length}`)
console.log(`decisions with a gun target in the open: before ${before.targetTicks}, after ${after.targetTicks}`)
console.log(`decisions with the gun trigger pulled:   before ${before.firedTicks}, after ${after.firedTicks}`)
timings.forEach((timing, n) => {
  const b = before.out[n], a = after.out[n]
  console.log(`\nshot timing: ${timing.name}`)
  console.log(`  ${"".padEnd(28)}${"before".padEnd(18)}after`)
  console.log(`  ${"aim solutions".padEnd(28)}${show(b.aim)}${show(a.aim)}`)
  console.log(`  ${"shots fired".padEnd(28)}${show(b.fired)}${show(a.fired)}`)
  if (n === 0) {
    bands.forEach((band, i) => {
      if (b.aimBand[i].scored + a.aimBand[i].scored) console.log(`  ${`  aim, ${band}`.padEnd(28)}${show(b.aimBand[i])}${show(a.aimBand[i])}`)
    })
    bands.forEach((band, i) => {
      if (b.firedBand[i].scored + a.firedBand[i].scored) console.log(`  ${`  fired, ${band}`.padEnd(28)}${show(b.firedBand[i])}${show(a.firedBand[i])}`)
    })
    console.log(`  not judged (recording ends or target leaves view first): aim ${b.aim.unknown} / ${a.aim.unknown}, fired ${b.fired.unknown} / ${a.fired.unknown}`)
  }
})
