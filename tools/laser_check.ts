/**
 * Build 17 offline check: does the early-laser rule go when it should, hold back when it should not, and does the
 * laser let go only on target? OFFLINE ONLY: the recording is not reactive (our actions do not change later
 * observations) and the kit has no engine, so these are yes/no answers about the rule. They are not scores.
 *
 *   bun tools/laser_check.ts [stream.jsonl[.gz]] [arenaDir] < /dev/null
 *
 * Pass 1 replays the recording as it is. Pass 2 replays it with every enemy mech and every hit removed and our HP
 * full (made up), to show what the rule does on the same ground when nobody is engaging. Pass 3 stands us still at
 * the recording's first position on the real arena and adds a made-up laser pickup, enemy, time or zone, one gate per
 * row, with the outcome we expect next to the one we got. Pass 4 gives us a fully charged laser and a made-up enemy
 * at 120 m on a clear line, with the torso a set fraction of the enemy's radius off its center.
 * The file holds one hello line, then obs lines (the kit's check/stream.jsonl.gz format). Defaults to the kit stream.
 * stdin must be closed: map.ts imports mechfight.ts.
 */
import { existsSync, readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { createBot } from "../brain.ts"
import { clearLine, groundAt, loadMap } from "../map.ts"
import { draw, type BotAction, type Hello, type Observation, type Vec3 } from "../mechfight.ts"
import { LASER_CHASE_S, LASER_DETOUR_M, LASER_RUSH_ON, LASER_RUSH_S } from "../params.ts"

const arg = process.argv.slice(2)
const kit = ["../mechfight-kit", "/workspace/mechfight-kit"].find((d) => existsSync(`${d}/check/stream.jsonl.gz`))
const file = arg[0] ?? (kit ? `${kit}/check/stream.jsonl.gz` : "")
const arena = arg[1] ?? (kit ? `${kit}/arena` : "/arena")
if (!file || !existsSync(file)) {
  console.error("usage: bun tools/laser_check.ts <stream.jsonl[.gz]> [arenaDir]")
  process.exit(2)
}
const raw = readFileSync(file)
const lines = (file.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8").split("\n").filter(Boolean)
const hello = JSON.parse(lines[0]) as Hello
if (hello.type !== "hello") throw new Error("first line is not a hello")
hello.map.dir = arena
const recorded = lines.slice(1).map((l) => JSON.parse(l) as Observation).filter((o) => o.type === "obs")
const solids = loadMap(hello)
const flat = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1])
const modeOf = () => (draw.take()?.label ?? "").split(" · ").at(-1) ?? "?"

console.log(`OFFLINE check of ${file} (non-reactive recording, no engine; these are not scores)`)
console.log(`LASER_RUSH_ON ${LASER_RUSH_ON}  window ${LASER_RUSH_S} s  detour ${LASER_DETOUR_M} m  give up after ${LASER_CHASE_S} s`)

// ------------------------------------------------------------------ passes 1 and 2: the recording
function replay(title: string, rewrite?: (o: Observation) => void) {
  const bot = createBot(hello)
  const modes = new Map<string, number>()
  const seen = new Set<number>()
  let rushTicks = 0, firstRush = -1, lastRush = -1, takes = 0, slowRush = 0
  for (const original of recorded) {
    const obs = structuredClone(original)
    rewrite?.(obs)
    for (const p of obs.pickups) if (p.kind === "laser") seen.add(p.id)
    const act = bot.act(obs)
    const mode = modeOf()
    modes.set(mode, (modes.get(mode) ?? 0) + 1)
    if (act.take !== undefined) takes++
    if (mode === "laser rush") {
      rushTicks++
      if (firstRush < 0) firstRush = obs.t
      lastRush = obs.t
      if (Math.hypot(act.move?.[0] ?? 0, act.move?.[1] ?? 0) < 0.95) slowRush++
    }
  }
  console.log(`\n${title}: ${recorded.length} observations (t ${recorded[0].t} to ${recorded.at(-1)!.t} s), ${seen.size} laser pickups seen`)
  console.log(`  laser rush ticks: ${rushTicks}${rushTicks ? ` (t ${firstRush} to ${lastRush} s; below full walk speed on ${slowRush})` : ""}  take actions: ${takes}`)
  for (const [m, n] of [...modes].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${m}`)
}
replay("Pass 1, recording as it is")
replay("Pass 2, what-if: no enemy mechs, no hits, full HP (made up)", (o) => {
  o.mechs = o.mechs.filter((m) => m.kind !== "mech")
  o.events = o.events.filter((e) => e.type !== "damaged")
  o.self.hp = o.self.max_hp
})

// ------------------------------------------------------------------ pass 3: one gate per row
const base = recorded[0]
const here = base.self.pos
const toNext = Math.atan2(base.zone.next_center[1] - here[1], base.zone.next_center[0] - here[0])
const ground = (x: number, y: number) => {
  const g = solids?.ground ? groundAt(solids, x, y) : here[2]
  return Number.isFinite(g) ? g : here[2]
}
/** A point `d` m from us at `turn` radians off the bearing to the next circle's center, on the ground. */
const spotAt = (d: number, turn: number): Vec3 => {
  const x = here[0] + Math.cos(toNext + turn) * d, y = here[1] + Math.sin(toNext + turn) * d
  return [x, y, ground(x, y)]
}
const foeShape = recorded.flatMap((o) => o.mechs).find((m) => m.kind === "mech")!
const foeAt = (pos: Vec3) => ({ ...structuredClone(foeShape), pos, vel: [0, 0, 0] as Vec3, hp: 1400 })
type Scene = { name: string; expect: string; t?: number; laser?: Vec3; edit?: (o: Observation) => void }
/** Stand still for five decisions from time `t` and return the last mode and whether a take was sent. */
function stand(s: Scene): { mode: string; take: boolean } {
  const bot = createBot(hello)
  let mode = "?", take = false
  for (let i = 0; i < 5; i++) {
    const obs = structuredClone(base)
    obs.t = (s.t ?? 5) + i * 0.1
    obs.tick = Math.round(obs.t * 20)
    obs.mechs = []
    obs.crates = []
    obs.cubes = []
    obs.events = []
    obs.pickups = s.laser ? [{ id: 8999, kind: "laser", pos: s.laser }] : []
    s.edit?.(obs)
    const act: BotAction = bot.act(obs)
    mode = modeOf()
    take ||= act.take !== undefined
  }
  return { mode, take }
}
/** The first spot `d` m away, from 90° off the next-circle bearing round to behind us, whose eye has a clear line to our center. */
const watcherAt = (d: number): Vec3 | null => {
  const mine: Vec3 = [here[0], here[1], here[2] + hello.config.mech.height / 2]
  for (let turn = Math.PI / 2; turn <= (3 * Math.PI) / 2; turn += Math.PI / 12) {
    const p = spotAt(d, turn)
    if (clearLine(solids, [p[0], p[1], p[2] + hello.config.mech.eye_height], mine, 0, 0)) return p
  }
  return null
}
const watcher = watcherAt(120)
const ahead = spotAt(60, 0)
const side = spotAt(80, -Math.PI / 2)
const back = spotAt(150, Math.PI)
const scenes: Scene[] = [
  { name: "laser 60 m toward the next circle, nobody around", expect: "laser rush", laser: ahead },
  { name: "laser 80 m to the side (path 89 m)", expect: "laser rush", laser: side },
  { name: "laser 150 m away from the next circle (detour about 300 m)", expect: "not rush", laser: back },
  { name: `same 60 m laser at t = ${LASER_RUSH_S + 5} s (window over)`, expect: "not rush", laser: ahead, t: LASER_RUSH_S + 5 },
  { name: "60 m laser on a roof (10 m above the ground)", expect: "not rush", laser: [ahead[0], ahead[1], ahead[2] + 10] },
  { name: "60 m laser, enemy 20 m from it (nearer than us)", expect: "not rush", laser: ahead, edit: (o) => void o.mechs.push(foeAt(spotAt(80, 0))) },
  { name: "60 m laser, enemy 250 m away beyond it", expect: "laser rush", laser: ahead, edit: (o) => void o.mechs.push(foeAt(spotAt(250, 0))) },
  ...(watcher
    ? [{ name: `60 m laser, enemy ${flat(watcher, ahead).toFixed(0)} m from it with a clear line to us at 120 m`, expect: "not rush", laser: ahead, edit: (o: Observation) => void o.mechs.push(foeAt(watcher)) }]
    : []),
  {
    name: "60 m laser, a mech hit us this second",
    expect: "not rush",
    laser: ahead,
    edit: (o) => void o.events.push({ type: "damaged", amount: 45, weapon: "gun", bearing: 0, by: foeShape.id }),
  },
  { name: "60 m laser, we already hold a laser", expect: "not rush", laser: ahead, edit: (o) => void (o.self.weapons[1] = { kind: "laser", cooldown: 0, charge: 0, stats: { ...hello.config.weapons.laser } }) },
  {
    name: "60 m laser, the shrink ends in 12 s (zone time)",
    expect: "not rush",
    laser: ahead,
    edit: (o) => void (o.zone.shrink_end = o.t + 12),
  },
  { name: "laser at our feet, enemy in view 100 m away", expect: "take sent", laser: spotAt(2, 0), edit: (o) => void o.mechs.push(foeAt(spotAt(100, Math.PI / 2))) },
]
console.log(`\nPass 3, one gate per row (made-up pickup, enemy, time; real arena, standing at the recording's first position, t = 5 s unless said)`)
console.log(`  detour of the three spots by straight lines: ahead ${detour(ahead)} m, side ${detour(side)} m, back ${detour(back)} m`)
function detour(p: Vec3): string {
  const inner = base.zone.next_radius - Math.min(15, base.zone.next_radius * 0.25)
  const leg = (q: number[]) => Math.max(0, flat(q, base.zone.next_center) - inner)
  return (flat(here, p) + leg(p) - leg(here)).toFixed(0)
}
let wrong = 0
for (const s of scenes) {
  const got = stand(s)
  const ok = s.expect === "take sent" ? got.take : s.expect === "laser rush" ? got.mode === "laser rush" : got.mode !== "laser rush"
  if (!ok) wrong++
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${s.name.padEnd(58)} expect ${s.expect.padEnd(10)} got mode "${got.mode}"${got.take ? ", take sent" : ""}`)
}
console.log(`  ${scenes.length - wrong} of ${scenes.length} rows as expected${LASER_RUSH_ON ? "" : " (LASER_RUSH_ON is false, so rush and take rows cannot pass)"}`)

// ------------------------------------------------------------------ pass 4: letting go of the charge
// A made-up enemy 120 m away on the first clear bearing, our laser fully charged, the torso off its center by a fraction of its radius.
console.log(`\nPass 4, letting go of a full charge (made-up enemy at 120 m, standing still; "let go" = beam fired)`)
const muzzle: Vec3 = [here[0], here[1], here[2] + hello.config.mech.muzzle_height]
let foePos: Vec3 | null = null
for (let b = 0; b < 24 && !foePos; b++) {
  const p = spotAt(120, (2 * Math.PI * b) / 24)
  if (clearLine(solids, muzzle, [p[0], p[1], p[2] + hello.config.mech.height / 2])) foePos = p
}
if (!foePos) console.log("  no clear 120 m line from this position; skipped")
else {
  const c: Vec3 = [foePos[0], foePos[1], foePos[2] + hello.config.mech.height / 2]
  const yaw = Math.atan2(c[1] - muzzle[1], c[0] - muzzle[0]), pitch = Math.atan2(c[2] - muzzle[2], flat(muzzle, c))
  const d = Math.hypot(c[0] - muzzle[0], c[1] - muzzle[1], c[2] - muzzle[2])
  for (const off of [0, 0.5, 0.7, 0.9, 1.1, 1.3]) {
    const bot = createBot(hello)
    const obs = structuredClone(base)
    obs.t = 60
    obs.mechs = [foeAt(foePos)]
    obs.crates = []
    obs.cubes = []
    obs.pickups = []
    obs.events = []
    obs.self.weapons[1] = { kind: "laser", cooldown: 0, charge: hello.config.weapons.laser.charge, stats: { ...hello.config.weapons.laser } }
    obs.self.aim = [yaw + Math.atan2(off * hello.config.mech.radius, d), pitch]
    const act = bot.act(obs)
    draw.take()
    console.log(`  torso ${off.toFixed(1)} radius off center (${(off * hello.config.mech.radius).toFixed(2)} m of ${hello.config.mech.radius} m): trigger ${act.fire?.[1] ? "held" : "let go"}`)
  }
}
process.exit(wrong && LASER_RUSH_ON ? 1 : 0)
