/**
 * Build 18 offline check: how far the nearest enemy mech is over the first 40 s, before (earlySpace off, which is
 * Build 14) and after (earlySpace on), plus a synthetic test of each rule. OFFLINE ONLY: these numbers say whether the
 * rule fires and which way it moves us, never how a match would go. They are not scores.
 *
 *   bun tools/spacing_check.ts [stream.jsonl[.gz]] [arenaDir] < /dev/null
 *
 * Part 1 replays the recording as it is. The recording is not reactive (our actions do not change later
 * observations), so our position and the nearest-enemy distance are the recorded ones for both builds; the part
 * counts the decisions that differ and the ticks in "space" mode.
 * Part 2 is a rollout on the recording: our position is stepped from the brain's own move commands (walk or boost
 * speed, straight steps, blocked by the nav grid's walls, no jumps, a time step of at most 0.5 s), and every other
 * part of each observation stays as recorded: which enemies are in view and where, items, HP and damage. So the
 * enemy does not react to where we go and still "hits" us as recorded. Row "as recorded" keeps our HP; row "unhurt"
 * sets our HP to full and removes the damage events (made up), which leaves the bot idle near the enemy.
 * Part 3 runs made-up scenes on a flat arena with no map (straight-line nav, no cover) and checks each rule. It exits
 * with code 1 if a check fails.
 *
 * Nearest enemy = the nearest enemy mech in view or seen in the last 10 s, at its last seen position.
 * The file holds one hello line, then obs lines (the kit's check/stream.jsonl.gz format). Defaults to the kit stream.
 * stdin must be closed: map.ts imports mechfight.ts.
 */
import { existsSync, readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { createBot, type Flags } from "../brain.ts"
import { groundAt, loadMap } from "../map.ts"
import { draw, type BotAction, type Hello, type Observation, type Vec3 } from "../mechfight.ts"
import { buildNavGrid, type NavGrid } from "../nav.ts"
import { EARLY_SPACE_M, EARLY_SPACE_ON, EARLY_SPACE_S } from "../params.ts"

const arg = process.argv.slice(2)
const kit = ["../mechfight-kit", "/workspace/mechfight-kit"].find((d) => existsSync(`${d}/check/stream.jsonl.gz`))
const file = arg[0] ?? (kit ? `${kit}/check/stream.jsonl.gz` : "")
const arena = arg[1] ?? (kit ? `${kit}/arena` : "/arena")
if (!file || !existsSync(file)) {
  console.error("usage: bun tools/spacing_check.ts <stream.jsonl[.gz]> [arenaDir]")
  process.exit(2)
}
const raw = readFileSync(file)
const lines = (file.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8").split("\n").filter(Boolean)
const hello = JSON.parse(lines[0]) as Hello
if (hello.type !== "hello") throw new Error("first line is not a hello")
hello.map.dir = arena
const recorded = lines.slice(1).map((l) => JSON.parse(l) as Observation).filter((o) => o.type === "obs" && o.t < EARLY_SPACE_S)

const MEMORY_S = 10
const OFF: Flags = { earlySpace: false }
const ON: Flags = { earlySpace: true }
const flat = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1])
const modeOf = () => (draw.take()?.label ?? "").split(" · ").at(-1) ?? "?"

/** Nearest-enemy distance per tick, over the ticks with an enemy seen in the last MEMORY_S. */
type Gap = { ticks: number; sum: number; min: number; under: number; under100: number }
const newGap = (): Gap => ({ ticks: 0, sum: 0, min: Infinity, under: 0, under100: 0 })
function addGap(g: Gap, d: number) {
  if (!Number.isFinite(d)) return
  g.ticks++
  g.sum += d
  g.min = Math.min(g.min, d)
  if (d < EARLY_SPACE_M) g.under++
  if (d < 100) g.under100++
}
const showGap = (g: Gap) =>
  g.ticks
    ? `mean ${(g.sum / g.ticks).toFixed(0)} m, min ${g.min.toFixed(0)} m, under ${EARLY_SPACE_M} m on ${g.under} ticks, under 100 m on ${g.under100} (of ${g.ticks} ticks with an enemy known)`
    : "no enemy known"
/** Tracks where each enemy mech was last seen and gives the distance from `p` to the nearest one seen in the last MEMORY_S. */
function tracker() {
  const seen = new Map<number, { pos: Vec3; t: number }>()
  return (obs: Observation, p: number[]) => {
    for (const m of obs.mechs) if (m.kind === "mech") seen.set(m.id, { pos: m.pos, t: obs.t })
    let d = Infinity
    for (const k of seen.values()) if (obs.t - k.t < MEMORY_S) d = Math.min(d, flat(k.pos, p))
    return d
  }
}
const tally = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1)
const showModes = (m: Map<string, number>) => [...m].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(", ")

console.log(`OFFLINE check of ${file} (non-reactive recording; numbers are not scores)`)
console.log(`EARLY_SPACE_ON ${EARLY_SPACE_ON}  EARLY_SPACE_S ${EARLY_SPACE_S}  EARLY_SPACE_M ${EARLY_SPACE_M}  before = earlySpace off (Build 14), after = on`)

// ------------------------------------------------------------------ part 1: the recording as it is
{
  const before = createBot(hello, OFF), after = createBot(hello, ON)
  const gap = newGap(), near = tracker(), modes = new Map<string, number>()
  let differ = 0
  for (const o of recorded) {
    addGap(gap, near(o, o.self.pos))
    const a = JSON.stringify(before.act(structuredClone(o)))
    draw.take()
    const b = JSON.stringify(after.act(structuredClone(o)))
    tally(modes, modeOf())
    if (a !== b) differ++
  }
  console.log(`\nPart 1, recording as it is: ${recorded.length} observations in the first ${EARLY_SPACE_S} s`)
  console.log(`  nearest enemy (recorded positions, the same for both builds): ${showGap(gap)}`)
  console.log(`  decisions that differ, after vs before: ${differ}; ticks in "space" mode: ${modes.get("space") ?? 0}`)
  console.log(`  modes after: ${showModes(modes)}`)
}

// ------------------------------------------------------------------ part 2: rollout on the recording
const solids = loadMap(hello)
let grid: NavGrid | null = null
try {
  grid = buildNavGrid(hello)
} catch {
  grid = null
}
/** Is (x, y) on a walkable cell of the nav grid? True without a grid. */
function walkable(x: number, y: number): boolean {
  if (!grid) return true
  const i = Math.floor((x - grid.minX + 0.5) / 2), j = Math.floor((y - grid.minY + 0.5) / 2)
  return i >= 0 && j >= 0 && i < grid.nx && j < grid.ny && grid.free[j * grid.nx + i] === 1
}
type Roll = { gap: Gap; modes: Map<string, number>; end: Vec3; path: number }
/** Step our position from the brain's moves through `frames`; everything else in each observation stays as it is. */
function rollout(frames: Observation[], h: Hello, flags: Flags, rewrite?: (o: Observation) => void, onTick?: (o: Observation, act: BotAction, mode: string) => void): Roll {
  const bot = createBot(h, flags)
  const out: Roll = { gap: newGap(), modes: new Map(), end: [0, 0, 0], path: 0 }
  const near = tracker()
  const walk = h.config.mech.walk_speed, fast = h.config.mech.boost_speed ?? walk
  let pos: Vec3 = [...frames[0].self.pos] as Vec3
  let vel: Vec3 = [0, 0, 0]
  for (let n = 0; n < frames.length; n++) {
    const obs = structuredClone(frames[n])
    rewrite?.(obs)
    obs.self.pos = [...pos] as Vec3
    obs.self.vel = vel
    obs.self.in_zone = flat(pos, obs.zone.center) < obs.zone.radius
    addGap(out.gap, near(obs, pos))
    const act = bot.act(obs)
    const mode = modeOf()
    tally(out.modes, mode)
    onTick?.(obs, act, mode)
    const dt = n + 1 < frames.length ? Math.min(0.5, frames[n + 1].t - obs.t) : 0
    const speed = act.boost ? fast : walk
    const mv = act.move ?? [0, 0]
    const len = Math.max(1, Math.hypot(mv[0], mv[1]))
    let dx = (mv[0] / len) * speed * dt, dy = (mv[1] / len) * speed * dt
    // Walls: stop the step if it ends on a blocked cell, sliding along x or y when one of them is free.
    if (walkable(pos[0], pos[1]) && !walkable(pos[0] + dx, pos[1] + dy)) {
      if (walkable(pos[0] + dx, pos[1])) dy = 0
      else if (walkable(pos[0], pos[1] + dy)) dx = 0
      else dx = dy = 0
    }
    out.path += Math.hypot(dx, dy)
    const x = pos[0] + dx, y = pos[1] + dy
    const g = solids?.ground && h.map.dir ? groundAt(solids, x, y) : pos[2]
    pos = [x, y, Number.isFinite(g) ? g : pos[2]]
    vel = dt > 0 ? [dx / dt, dy / dt, 0] : [0, 0, 0]
  }
  out.end = pos
  return out
}
{
  const unhurt = (o: Observation) => {
    o.self.hp = o.self.max_hp
    o.events = o.events.filter((e) => e.type !== "damaged")
  }
  console.log(`\nPart 2, rollout on the recording (our position stepped from the brain's moves; enemies, items and damage as recorded).`)
  for (const [name, rewrite] of [["as recorded", undefined], ["unhurt (HP made up: full, no damage events)", unhurt]] as const) {
    const a = rollout(recorded, hello, OFF, rewrite), b = rollout(recorded, hello, ON, rewrite)
    console.log(`  ${name}`)
    console.log(`    before: ${showGap(a.gap)}; walked ${a.path.toFixed(0)} m; modes: ${showModes(a.modes)}`)
    console.log(`    after:  ${showGap(b.gap)}; walked ${b.path.toFixed(0)} m; modes: ${showModes(b.modes)}`)
  }
}

// ------------------------------------------------------------------ part 3: synthetic scenes
console.log(`\nPart 3, synthetic scenes (made up; flat arena with no map, straight-line nav, enemies stand still).`)
const flatHello = structuredClone(hello)
flatHello.map = { ...flatHello.map, dir: "" }
type Foe = { id: number; pos: Vec3; hp?: number; seenUntil?: number }
type Scene = {
  t0: number
  seconds: number
  at?: Vec3
  foes: Foe[]
  cubes?: Vec3[]
  pickups?: { kind: "laser" | "lightning"; pos: Vec3 }[]
  zone?: Partial<Observation["zone"]>
}
/** The scene as a list of observations 0.1 s apart, on the recording's first observation as the template. */
function frames(s: Scene): Observation[] {
  const out: Observation[] = []
  const at = s.at ?? [0, 0, 0]
  for (let n = 0; n <= s.seconds * 10; n++) {
    const t = s.t0 + n / 10
    const o = structuredClone(recorded[0])
    o.t = t
    o.tick = Math.round(t * 20)
    o.self.pos = [...at] as Vec3
    o.zone = { ...o.zone, center: [0, 0], radius: 560, next_center: [0, 0], next_radius: 380, shrink_start: 60, shrink_end: 110, ...s.zone }
    o.mechs = s.foes
      .filter((f) => t <= (f.seenUntil ?? Infinity))
      .map((f) => ({ id: f.id, kind: "mech" as const, pos: f.pos, vel: [0, 0, 0] as Vec3, aim: [Math.atan2(at[1] - f.pos[1], at[0] - f.pos[0]), 0] as [number, number], hp: f.hp ?? 1400, max_hp: 1400, cubes: 0, weapons: ["gun"], charging: false })) as Observation["mechs"]
    o.cubes = (s.cubes ?? []).map((pos, i) => ({ id: 5000 + i, pos })) as Observation["cubes"]
    o.pickups = (s.pickups ?? []).map((p, i) => ({ id: 8000 + i, kind: p.kind, pos: p.pos })) as Observation["pickups"]
    o.crates = []
    o.drops = []
    o.events = []
    out.push(o)
  }
  return out
}
let failed = 0
function check(name: string, ok: boolean, detail: string) {
  if (!ok) failed++
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}: ${detail}`)
}
/** Run a scene on both builds; `same` is true when every action matches. */
function both(s: Scene) {
  const f = frames(s)
  const acts: string[][] = [[], []]
  const far: number[] = [0, 0]
  const center = s.zone?.center ?? [0, 0]
  const run = (flags: Flags, i: number) =>
    rollout(f, flatHello, flags, undefined, (o, act) => {
      acts[i].push(JSON.stringify(act))
      far[i] = Math.max(far[i], flat(o.self.pos, center))
    })
  const before = run(OFF, 0), after = run(ON, 1)
  const gapAt = (p: Vec3) => Math.min(...s.foes.map((e) => flat(e.pos, p)))
  return { before, after, same: acts[0].join() === acts[1].join(), far, gapEnd: [gapAt(before.end), gapAt(after.end)] }
}
const xy = (p: Vec3) => `(${p[0].toFixed(0)}, ${p[1].toFixed(0)})`

// Two enemies 175 m east, seen on the first tick only. Cube A is 70 m east (105 m from them), cube B 75 m west.
{
  const r = both({ t0: 1, seconds: 8, foes: [{ id: 1, pos: [175, 10, 0], seenUntil: 1 }, { id: 2, pos: [175, -10, 0], seenUntil: 1 }], cubes: [[70, 0, 0], [-75, 0, 0]] })
  check("farm target", r.before.end[0] > 5 && r.after.end[0] < -5 && r.gapEnd[1] > r.gapEnd[0],
    `before walks to ${xy(r.before.end)}, nearest enemy ${r.gapEnd[0].toFixed(0)} m; after walks to ${xy(r.after.end)}, nearest enemy ${r.gapEnd[1].toFixed(0)} m (the near cube sits inside the ring, so the far-side cube wins)`)
}
// The same enemies 165 m east. A laser lies 60 m east (105 m from them), a lightning 70 m west.
{
  const r = both({ t0: 1, seconds: 8, foes: [{ id: 1, pos: [165, 10, 0], seenUntil: 1 }, { id: 2, pos: [165, -10, 0], seenUntil: 1 }], pickups: [{ kind: "laser", pos: [60, 0, 0] }, { kind: "lightning", pos: [-70, 0, 0] }] })
  check("weapon pickup", r.before.end[0] > 5 && r.after.end[0] < -5 && (r.after.modes.get("loot") ?? 0) > 0,
    `before walks to ${xy(r.before.end)}, nearest enemy ${r.gapEnd[0].toFixed(0)} m; after walks to ${xy(r.after.end)}, nearest enemy ${r.gapEnd[1].toFixed(0)} m (loot ticks after: ${r.after.modes.get("loot") ?? 0})`)
}
// A cluster of two enemies about 92 m east, in view the whole time, nothing to pick up, full HP.
const cluster: Foe[] = [{ id: 1, pos: [90, 15, 0] }, { id: 2, pos: [95, -15, 0] }]
{
  const r = both({ t0: 1, seconds: 10, foes: cluster })
  check("idle spacing", r.gapEnd[0] < 100 && r.gapEnd[1] >= EARLY_SPACE_M - 1 && r.after.end[0] < -5 && (r.after.modes.get("space") ?? 0) > 0,
    `before ends at ${xy(r.before.end)}, nearest enemy ${r.gapEnd[0].toFixed(0)} m (${showModes(r.before.modes)}); after ends at ${xy(r.after.end)}, nearest enemy ${r.gapEnd[1].toFixed(0)} m (${showModes(r.after.modes)})`)
}
// The same scene after the window: nothing may change.
{
  const r = both({ t0: EARLY_SPACE_S + 5, seconds: 10, foes: cluster })
  check("window over", r.same && !r.after.modes.has("space"), `from t = ${EARLY_SPACE_S + 5} s every action matches Build 14: ${r.same}; modes after: ${showModes(r.after.modes)}`)
}
// Zone first: outside the circle, and when it is time to leave for the next circle, the zone modes run on both builds.
{
  const r = both({ t0: 1, seconds: 5, foes: cluster, zone: { center: [-700, 0], radius: 560, next_center: [-700, 0] } })
  check("zone escape first", r.same && !r.after.modes.has("space") && (r.after.modes.get("zone escape") ?? 0) > 0, `every action matches Build 14: ${r.same}; modes after: ${showModes(r.after.modes)}`)
}
{
  const r = both({ t0: 1, seconds: 5, foes: cluster, zone: { next_center: [500, 0], next_radius: 100, shrink_end: 50 } })
  check("next circle first", r.same && !r.after.modes.has("space") && (r.after.modes.get("to next circle") ?? 0) > 0, `every action matches Build 14: ${r.same}; modes after: ${showModes(r.after.modes)}`)
}
// Zone keep: we stand 15 m inside the ring we keep to (next circle, radius 380 less the 15 m margin) with the enemies on the center side.
{
  const zone = { center: [350, 0] as [number, number], radius: 560, next_center: [350, 0] as [number, number], next_radius: 380 }
  const r = both({ t0: 1, seconds: 10, foes: [{ id: 1, pos: [90, 15, 0] }, { id: 2, pos: [95, -15, 0] }], zone })
  check("spacing stays in the circle", r.far[1] <= 365.5 && (r.after.modes.get("space") ?? 0) > 0 && r.gapEnd[1] > r.gapEnd[0],
    `after: farthest from the next center ${r.far[1].toFixed(1)} m (limit 365), ends at ${xy(r.after.end)}, nearest enemy ${r.gapEnd[1].toFixed(0)} m vs ${r.gapEnd[0].toFixed(0)} m before (${showModes(r.after.modes)})`)
}
// Engage unchanged: one enemy 50 m away at 300 HP (within a gun magazine). Build 14's finish rule decides on both builds.
{
  const r = both({ t0: 1, seconds: 4, foes: [{ id: 1, pos: [50, 0, 0], hp: 300 }] })
  check("engage unchanged", r.same && (r.after.modes.get("engage, finish") ?? 0) > 0 && !r.after.modes.has("space"), `every action matches Build 14: ${r.same}; modes after: ${showModes(r.after.modes)}`)
}
console.log(failed ? `\n${failed} synthetic check(s) FAILED` : "\nAll synthetic checks passed")
process.exit(failed ? 1 : 0)
