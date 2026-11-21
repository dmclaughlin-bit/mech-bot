/**
 * Build 17 offline check: does the early arm-up rule go when it should, hold back when it should not, does the
 * laser let go only on target, and what does a charge do when its target is lost? OFFLINE ONLY: the recording is not reactive (our actions do not change later
 * observations) and the kit has no engine, so these are yes/no answers about the rule. They are not scores.
 *
 *   bun tools/laser_check.ts [stream.jsonl[.gz]] [arenaDir] < /dev/null
 *
 * Pass 1 replays the recording as it is. Pass 2 replays it with every enemy mech and every hit removed and our HP
 * full (made up), to show what the rule does on the same ground when nobody is engaging. Pass 3 stands us still at
 * the recording's first position on the real arena and adds a made-up laser pickup, enemy, time or zone, one gate per
 * row, with the outcome we expect next to the one we got. Pass 4 gives us a fully charged laser and a made-up enemy
 * at 120 m on a clear line, with the torso a set fraction of the enemy's radius off its center. Pass 5 takes that
 * charge's target away (behind a building, or gone) and adds a second enemy or a crate.
 * The file holds one hello line, then obs lines (the kit's check/stream.jsonl.gz format). Defaults to the kit stream.
 * stdin must be closed: map.ts imports mechfight.ts.
 */
import { existsSync, readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { createBot } from "../brain.ts"
import { clearLine, groundAt, loadMap } from "../map.ts"
import { draw, type BotAction, type Hello, type Observation, type Vec3 } from "../mechfight.ts"
import { LASER_CHASE_S, LASER_RUSH_ON, LASER_RUSH_S, LASER_TRIP_M } from "../params.ts"

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
console.log(`LASER_RUSH_ON ${LASER_RUSH_ON}  window ${LASER_RUSH_S} s  longest path ${LASER_TRIP_M} m  give up after ${LASER_CHASE_S} s`)

// ------------------------------------------------------------------ passes 1 and 2: the recording
function replay(title: string, rewrite?: (o: Observation) => void) {
  const bot = createBot(hello)
  const modes = new Map<string, number>()
  const seen = new Set<number>()
  let rushTicks = 0, firstRush = -1, lastRush = -1, takes = 0, slowRush = 0
  for (const original of recorded) {
    const obs = structuredClone(original)
    rewrite?.(obs)
    for (const p of obs.pickups) if (p.kind === "laser" || p.kind === "lightning") seen.add(p.id)
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
  console.log(`\n${title}: ${recorded.length} observations (t ${recorded[0].t} to ${recorded.at(-1)!.t} s), ${seen.size} laser and lightning pickups seen`)
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
type Scene = { name: string; expect: string; t?: number; laser?: Vec3; arc?: Vec3; edit?: (o: Observation) => void }
/** Stand still for five decisions from time `t` and return the last mode, whether a take was sent, and the last walk bearing. */
function stand(s: Scene): { mode: string; take: boolean; walk: number } {
  const bot = createBot(hello)
  let mode = "?", take = false, walk = NaN
  for (let i = 0; i < 5; i++) {
    const obs = structuredClone(base)
    obs.t = (s.t ?? 5) + i * 0.1
    obs.tick = Math.round(obs.t * 20)
    obs.mechs = []
    obs.crates = []
    obs.cubes = []
    obs.events = []
    obs.pickups = [...(s.laser ? [{ id: 8999, kind: "laser" as const, pos: s.laser }] : []), ...(s.arc ? [{ id: 8998, kind: "lightning" as const, pos: s.arc }] : [])]
    s.edit?.(obs)
    const act: BotAction = bot.act(obs)
    mode = modeOf()
    take ||= act.take !== undefined
    walk = Math.atan2(act.move?.[1] ?? 0, act.move?.[0] ?? 0)
  }
  return { mode, take, walk }
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
/** 120 m away from the next circle: the first bearing near straight back that has ground under it (straight back runs off the arena). */
const back = [0, 1, -1, 2, -2, 3, -3, 4, -4].map((k) => Math.PI + (k * Math.PI) / 12)
  .map((turn) => [here[0] + Math.cos(toNext + turn) * 120, here[1] + Math.sin(toNext + turn) * 120])
  .filter(([x, y]) => !solids?.ground || Number.isFinite(groundAt(solids, x, y)))
  .map(([x, y]) => [x, y, ground(x, y)] as Vec3)[0] ?? spotAt(120, Math.PI / 2)
const far = spotAt(200, 0)
const mortarHeld = (o: Observation) => void (o.self.weapons[1] = { kind: "mortar", cooldown: 0, stats: { ...hello.config.weapons.mortar } })
const scenes: Scene[] = [
  { name: "laser 60 m toward the next circle, nobody around", expect: "laser rush", laser: ahead },
  { name: "laser 80 m to the side (path 89 m)", expect: "laser rush", laser: side },
  { name: "laser 120 m away from the next circle (was: not rush, detour 240 m)", expect: "laser rush", laser: back },
  { name: `laser 200 m toward the next circle (over ${LASER_TRIP_M} m of path)`, expect: "not rush", laser: far },
  { name: `same 60 m laser at t = ${LASER_RUSH_S + 5} s (window over)`, expect: "not rush", laser: ahead, t: LASER_RUSH_S + 5 },
  { name: "60 m laser on a roof (10 m above the ground)", expect: "not rush", laser: [ahead[0], ahead[1], ahead[2] + 10] },
  { name: "60 m laser, enemy 20 m from it (nearer than us; was: not rush)", expect: "laser rush", laser: ahead, edit: (o) => void o.mechs.push(foeAt(spotAt(80, 0))) },
  { name: "60 m laser, enemy 250 m away beyond it", expect: "laser rush", laser: ahead, edit: (o) => void o.mechs.push(foeAt(spotAt(250, 0))) },
  ...(watcher
    ? [{ name: `60 m laser, enemy ${flat(watcher, ahead).toFixed(0)} m from it, clear line to us at 120 m (was: not rush)`, expect: "laser rush", laser: ahead, edit: (o: Observation) => void o.mechs.push(foeAt(watcher)) }]
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
  { name: "lightning 60 m ahead, gun only", expect: "laser rush", arc: ahead },
  { name: "lightning 60 m ahead, gun only, enemy 20 m from it", expect: "laser rush", arc: ahead, edit: (o) => void o.mechs.push(foeAt(spotAt(80, 0))) },
  { name: "lightning 60 m ahead, we hold gun and mortar (not gun only)", expect: "not rush", arc: ahead, edit: mortarHeld },
  { name: "lightning 60 m ahead and laser 80 m to the side, gun only", expect: "walk to laser", arc: ahead, laser: side },
  { name: "lightning at our feet, gun only, enemy in view 100 m away", expect: "take sent", arc: spotAt(2, 0), edit: (o) => void o.mechs.push(foeAt(spotAt(100, Math.PI / 2))) },
]
console.log(`\nPass 3, one gate per row (made-up pickup, enemy, time; real arena, standing at the recording's first position, t = 5 s unless said)`)
const turnOff = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))
const bearing = (p: Vec3) => Math.atan2(p[1] - here[1], p[0] - here[0])
let wrong = 0
for (const s of scenes) {
  const got = stand(s)
  const ok =
    s.expect === "take sent" ? got.take
    : s.expect === "walk to laser" ? got.mode === "laser rush" && turnOff(got.walk, bearing(s.laser!)) < turnOff(got.walk, bearing(s.arc!))
    : s.expect === "laser rush" ? got.mode === "laser rush"
    : got.mode !== "laser rush"
  if (!ok) wrong++
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${s.name.padEnd(72)} expect ${s.expect.padEnd(13)} got mode "${got.mode}"${got.take ? ", take sent" : ""}`)
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

// ------------------------------------------------------------------ pass 5: a charge that lost its target
// The protocol has no cancel: letting go always fires, and a full charge fires on its own hold_s after it is full.
console.log(`\nPass 5, a full charge whose target is lost (made up; "held" = not fired this decision; it still fires on its own ${hello.config.weapons.laser.hold_s} s after full)`)
const center = (p: Vec3): Vec3 => [p[0], p[1], p[2] + hello.config.mech.height / 2]
let hidden: Vec3 | null = null
for (let b = 0; b < 48 && !hidden; b++) {
  const p = spotAt(120, (2 * Math.PI * b) / 48)
  if (!clearLine(solids, muzzle, center(p))) hidden = p
}
let second: Vec3 | null = null
for (let b = 0; b < 48 && !second; b++) {
  const p = spotAt(100, (2 * Math.PI * b) / 48)
  if ((!foePos || flat(p, foePos) > 40) && clearLine(solids, muzzle, center(p))) second = p
}
if (!hidden || !second || !foePos) console.log("  no hidden or no second clear spot from this position; skipped")
else {
  const aimAt = (c: Vec3): [number, number] => [Math.atan2(c[1] - muzzle[1], c[0] - muzzle[0]), Math.atan2(c[2] - muzzle[2], flat(muzzle, c))]
  const crateC: Vec3 = [second[0], second[1], second[2] + hello.config.crates.height / 2]
  type Case = { name: string; expect: string; mechs: Vec3[]; crate?: boolean; aim: [number, number]; fullFor?: number; toward?: Vec3 }
  const cases: Case[] = [
    { name: "target behind a building, nobody else", expect: "held", mechs: [hidden], aim: aimAt(center(hidden)) },
    { name: "target behind a building, second enemy clear at 100 m, torso still on the first", expect: "held, turning", mechs: [hidden, second], aim: aimAt(center(hidden)), toward: center(second) },
    { name: "target behind a building, second enemy clear at 100 m, torso on the second", expect: "let go", mechs: [hidden, second], aim: aimAt(center(second)) },
    { name: "no enemy listed any more (was: let go at nothing)", expect: "held", mechs: [], aim: aimAt(center(foePos)) },
    { name: "no enemy, crate clear at 100 m, torso on the crate, full for 0.1 s", expect: "held", mechs: [], crate: true, aim: aimAt(crateC), fullFor: 0.1 },
    { name: "no enemy, crate clear at 100 m, torso off the crate, full for 1.5 s", expect: "held, turning", mechs: [], crate: true, aim: aimAt(center(foePos)), fullFor: 1.5, toward: crateC },
    { name: "no enemy, crate clear at 100 m, torso on the crate, full for 1.5 s", expect: "let go", mechs: [], crate: true, aim: aimAt(crateC), fullFor: 1.5 },
  ]
  let bad = 0
  for (const k of cases) {
    const bot = createBot(hello)
    let act: BotAction = {}
    // First decision: the charge is full with a clear target (so the bot knows when it became full); second: the case.
    for (const step of [0, 1]) {
      const obs = structuredClone(base)
      obs.t = 60 + (step ? (k.fullFor ?? 0.05) : 0)
      obs.tick = Math.round(obs.t * 20)
      obs.mechs = step ? k.mechs.map((p, i) => ({ ...foeAt(p), id: foeShape.id + i })) : [foeAt(foePos)]
      obs.crates = step && k.crate ? [{ id: 7001, pos: second, hp: hello.config.crates.hp }] : []
      obs.cubes = []
      obs.pickups = []
      obs.events = []
      obs.self.weapons[1] = { kind: "laser", cooldown: 0, charge: hello.config.weapons.laser.charge, stats: { ...hello.config.weapons.laser } }
      // Step 0 points well off the target so the full charge is kept, not fired.
      obs.self.aim = step ? k.aim : [aimAt(center(foePos))[0] + 0.5, 0]
      act = bot.act(obs)
      draw.take()
    }
    const held = !!act.fire?.[1]
    const turning = k.toward ? turnOff(act.aim?.[0] ?? NaN, aimAt(k.toward)[0]) < 0.02 : true
    const got = held ? (k.toward && turning ? "held, turning" : "held") : "let go"
    const ok = got === k.expect
    if (!ok) bad++
    console.log(`  ${ok ? "ok  " : "FAIL"}  ${k.name.padEnd(80)} expect ${k.expect.padEnd(14)} got ${got}`)
  }
  console.log(`  ${cases.length - bad} of ${cases.length} rows as expected${LASER_RUSH_ON ? "" : " (LASER_RUSH_ON is false, so the fix rows cannot pass)"}`)
  wrong += bad
}
process.exit(wrong && LASER_RUSH_ON ? 1 : 0)
