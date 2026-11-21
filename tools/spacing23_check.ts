/**
 * Build 23 offline check (early spacing, laser-safe). OFFLINE ONLY: it says whether the rule fires and that the
 * weapon walk is untouched, never how a match would go. Nothing here is a score.
 *
 *   git worktree add --detach /tmp/b23-main origin/main
 *   bun tools/spacing23_check.ts /tmp/b23-main [stream.jsonl[.gz]] [arenaDir] < /dev/null
 *   git worktree remove /tmp/b23-main
 *
 * `base` is a checkout of the parent build (origin/main); its brain.ts is loaded next to ours.
 * Part 1 feeds every kit-stream observation to three bots: base, ours with spacing off, ours with spacing on, and counts
 * the responses (action + debug drawing) that differ from base. With spacing off it must be 0.
 * Part 2 runs made-up scenes on a flat arena with no map (straight-line nav, no cover, enemies stand still), stepping
 * our position from each bot's own moves, and checks each rule against base. Slot 1 is the stream's gun; a taken pickup
 * goes into slot 2 as in the game, so "holding a laser" is real after a take. Exits 1 if any check fails.
 * stdin must be closed: map.ts imports mechfight.ts.
 */
import { existsSync, readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { createBot, type Flags } from "../brain.ts"
import { draw, type Bot, type BotAction, type Hello, type Observation, type Vec3, type WeaponObs } from "../mechfight.ts"
import { SPACING_M, SPACING_ON, SPACING_S } from "../params.ts"

const arg = process.argv.slice(2)
const baseDir = arg[0]
if (!baseDir || !existsSync(`${baseDir}/brain.ts`)) {
  console.error("usage: bun tools/spacing23_check.ts <base checkout dir> [stream.jsonl[.gz]] [arenaDir]")
  process.exit(2)
}
const base = (await import(`${baseDir}/brain.ts`)) as { createBot: (h: Hello) => Bot }
const baseDraw = ((await import(`${baseDir}/mechfight.ts`)) as { draw: typeof draw }).draw
const kit = ["../mechfight-kit", "/workspace/mechfight-kit"].find((d) => existsSync(`${d}/check/stream.jsonl.gz`))
const file = arg[1] ?? (kit ? `${kit}/check/stream.jsonl.gz` : "")
const arena = arg[2] ?? (kit ? `${kit}/arena` : "/arena")
const raw = readFileSync(file)
const lines = (file.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8").split("\n").filter(Boolean)
const hello = JSON.parse(lines[0]) as Hello
hello.map.dir = arena
const stream = lines.slice(1).map((l) => JSON.parse(l) as Observation).filter((o) => o.type === "obs")

const OFF: Flags = { spacing: false }
const ON: Flags = { spacing: true }
const flat = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1])
/** One bot under test: its act() plus the debug drawing it left, as one comparable response string. */
type Runner = { act: (o: Observation) => { act: BotAction; text: string; mode: string } }
function runner(bot: Bot, d: typeof draw): Runner {
  return {
    act(o) {
      const act = bot.act(structuredClone(o))
      const dbg = d.take()
      return { act, text: JSON.stringify([act, dbg]), mode: (dbg?.label ?? "").split(" · ").at(-1) ?? "?" }
    },
  }
}
const mk = (h: Hello, who: "base" | Flags) => (who === "base" ? runner(base.createBot(h), baseDraw) : runner(createBot(h, who), draw))

console.log(`OFFLINE check (numbers are not scores). SPACING_ON ${SPACING_ON}, SPACING_S ${SPACING_S}, SPACING_M ${SPACING_M}; base = ${baseDir}`)

// ------------------------------------------------------------------ part 1: kit stream vs base
let failed = 0
function check(name: string, ok: boolean, detail: string) {
  if (!ok) failed++
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}: ${detail}`)
}
{
  const b = mk(hello, "base"), off = mk(hello, OFF), on = mk(hello, ON)
  let dOff = 0, dOn = 0, early = 0
  const modes = new Map<string, number>()
  for (const o of stream) {
    const rb = b.act(o).text, ro = off.act(o).text, rn = on.act(o)
    if (o.t < SPACING_S) early++
    modes.set(rn.mode, (modes.get(rn.mode) ?? 0) + 1)
    if (ro !== rb) dOff++
    if (rn.text !== rb) dOn++
  }
  console.log(`\nPart 1, kit stream: ${stream.length} observations (${early} before ${SPACING_S} s)`)
  check("spacing off = base", dOff === 0, `${dOff} of ${stream.length} responses differ`)
  console.log(`  spacing on: ${dOn} of ${stream.length} responses differ from base; modes on: ${[...modes].map(([k, n]) => `${k} ${n}`).join(", ")}`)
}

// ------------------------------------------------------------------ part 2: synthetic scenes vs base
console.log(`\nPart 2, synthetic scenes (made up; flat arena, no map, enemies stand still, our HP full).`)
const flatHello = structuredClone(hello)
flatHello.map = { ...flatHello.map, dir: "" }
/** `inView(t, took)`: whether the foe is in obs.mechs at time t (`took`: we have taken a pickup); default always. */
type Foe = { id: number; pos: Vec3; hp?: number; inView?: (t: number, took: boolean) => boolean }
type Arm = "laser" | "lightning"
/** `held`: a weapon already in slot 2 at the start (slot 1 is the stream's gun). */
type Scene = { t0: number; seconds: number; foes: Foe[]; cubes?: Vec3[]; pickups?: { kind: Arm; pos: Vec3 }[]; held?: Arm; zone?: Partial<Observation["zone"]> }
type Run = { acts: string[]; modes: Map<string, number>; end: Vec3; took: number }
/** Step our position from the bot's own moves (walk or boost speed, 0.1 s ticks). A taken pickup leaves the scene and goes
 * into our empty slot 2 with its config stats (protocol: `take` fills the empty slot), with a `took` event next tick. */
function play(s: Scene, who: "base" | Flags): Run {
  const bot = mk(flatHello, who)
  const out: Run = { acts: [], modes: new Map(), end: [0, 0, 0], took: -1 }
  const walk = flatHello.config.mech.walk_speed, fast = flatHello.config.mech.boost_speed ?? walk
  let pos: Vec3 = [0, 0, 0]
  let pickups = (s.pickups ?? []).map((p, i) => ({ id: 8000 + i, kind: p.kind, pos: p.pos }))
  const arm = (kind: Arm): WeaponObs => ({ kind, cooldown: 0, ...(kind === "laser" ? { charge: 0 } : {}), stats: { ...flatHello.config.weapons[kind] } })
  let slot2: WeaponObs | null = s.held ? arm(s.held) : null
  let events: Observation["events"] = []
  for (let n = 0; n <= s.seconds * 10; n++) {
    const t = s.t0 + n / 10
    const o = structuredClone(stream[0])
    o.t = t
    o.tick = Math.round(t * 20)
    o.self = { ...o.self, pos: [...pos] as Vec3, vel: [0, 0, 0], hp: o.self.max_hp, weapons: [o.self.weapons[0], slot2] }
    o.zone = { ...o.zone, center: [0, 0], radius: 560, next_center: [0, 0], next_radius: 380, shrink_start: 60, shrink_end: 110, ...s.zone }
    o.self.in_zone = flat(pos, o.zone.center) < o.zone.radius
    o.mechs = s.foes.filter((f) => f.inView?.(t, out.took >= 0) ?? true).map((f) => ({ id: f.id, kind: "mech" as const, pos: f.pos, vel: [0, 0, 0] as Vec3, aim: [Math.atan2(pos[1] - f.pos[1], pos[0] - f.pos[0]), 0] as [number, number], hp: f.hp ?? 1400, max_hp: 1400, cubes: 0, weapons: ["gun"], charging: false })) as Observation["mechs"]
    o.cubes = (s.cubes ?? []).map((p, i) => ({ id: 5000 + i, pos: p })) as Observation["cubes"]
    o.pickups = pickups as Observation["pickups"]
    o.crates = []
    o.drops = []
    o.events = events
    events = []
    o.offer = null as unknown as Observation["offer"]
    const r = bot.act(o)
    out.acts.push(JSON.stringify(r.act))
    out.modes.set(r.mode, (out.modes.get(r.mode) ?? 0) + 1)
    if (r.act.take !== undefined && out.took < 0) {
      const got = pickups.find((p) => p.id === r.act.take)
      if (got && slot2 === null) {
        out.took = n
        slot2 = arm(got.kind)
        events = [{ type: "took", id: got.id, kind: got.kind, slot: 1 }] as Observation["events"]
        pickups = pickups.filter((p) => p !== got)
      }
    }
    const mv = r.act.move ?? [0, 0]
    const speed = (r.act.boost ? fast : walk) * 0.1
    pos = [pos[0] + mv[0] * speed, pos[1] + mv[1] * speed, 0]
  }
  out.end = pos
  return out
}
const xy = (p: Vec3) => `(${p[0].toFixed(0)}, ${p[1].toFixed(0)})`
const showModes = (m: Map<string, number>) => [...m].map(([k, n]) => `${k} ${n}`).join(", ")
const gapAt = (s: Scene, p: Vec3) => Math.min(...s.foes.map((e) => flat(e.pos, p)))
const vsBase = (s: Scene) => {
  const b = play(s, "base"), on = play(s, ON)
  return { b, on, same: b.acts.join() === on.acts.join() }
}

// Laser next to an enemy: laser 60 m east, enemy 100 m east (40 m from the laser, deep inside its 155 m ring). The enemy
// is in view on the first tick, out of view during the walk (still known, so inside spacing's crowd; were it in view, the
// 160 m loot gate would stop base and ours at the start, so there would be no walk or take to test), and back in view
// from the take to the end: from then on we hold a laser with an enemy in view, so spacing is off and ours must match
// base tick for tick, with no `space` tick.
{
  const s: Scene = { t0: 2, seconds: 14, foes: [{ id: 1, pos: [100, 0, 0], inView: (t, took) => t <= 2 || took }], pickups: [{ kind: "laser", pos: [60, 0, 0] }] }
  const r = vsBase(s)
  check("laser next to an enemy is walked to and taken as on main", r.same && r.on.took >= 0 && (r.on.modes.get("loot") ?? 0) > 0 && !r.on.modes.has("space"),
    `identical actions on all ${r.on.acts.length} ticks: ${r.same}; modes ${showModes(r.on.modes)} (base ${showModes(r.b.modes)}); take at tick ${r.on.took} (base ${r.b.took}); loot ticks ${r.on.modes.get("loot") ?? 0} (base ${r.b.modes.get("loot") ?? 0}); ends ${xy(r.on.end)}, ${gapAt(s, r.on.end).toFixed(0)} m from the enemy`)
}
// Enemy 170 m east in view (just outside the 160 m loot gate), laser 50 m east (120 m from it, inside the ring): base
// walks toward it until the gate closes at 160 m; ours must match tick for tick.
{
  const s: Scene = { t0: 2, seconds: 14, foes: [{ id: 1, pos: [170, 0, 0] }], pickups: [{ kind: "laser", pos: [50, 0, 0] }] }
  const r = vsBase(s)
  check("laser walk toward an enemy in view = base", r.same && (r.on.modes.get("loot") ?? 0) > 0, `identical actions: ${r.same}; loot ticks ${r.on.modes.get("loot") ?? 0}; ends ${xy(r.on.end)} (base ${xy(r.b.end)})`)
}
// The same with a lightning to the west as a second choice: base picks the nearer laser on the enemy side; so must we.
{
  const s: Scene = { t0: 2, seconds: 14, foes: [{ id: 1, pos: [170, 10, 0] }, { id: 2, pos: [170, -10, 0] }], pickups: [{ kind: "laser", pos: [50, 0, 0] }, { kind: "lightning", pos: [-70, 0, 0] }] }
  const r = vsBase(s)
  check("weapon choice not reordered", r.same && r.on.end[0] > 0, `identical actions: ${r.same}; ends ${xy(r.on.end)} (base ${xy(r.b.end)})`)
}
// Enemy 100 m away (inside the loot gate and the ring), laser 60 m away: base holds (loot gated); idle spacing must not
// walk us away from the laser, so we hold too.
{
  const s: Scene = { t0: 2, seconds: 8, foes: [{ id: 1, pos: [100, 0, 0] }], pickups: [{ kind: "laser", pos: [40, 40, 0] }] }
  const r = vsBase(s)
  check("no spacing away from a laser in reach", r.same && !r.on.modes.has("space"), `identical actions: ${r.same}; modes ${showModes(r.on.modes)}`)
}
// Idle with a cluster about 92 m east and nothing to pick up: base holds, ours opens the distance.
const cluster: Foe[] = [{ id: 1, pos: [90, 15, 0] }, { id: 2, pos: [95, -15, 0] }]
{
  const s: Scene = { t0: 2, seconds: 10, foes: cluster }
  const r = vsBase(s)
  check("idle spacing opens the distance", gapAt(s, r.on.end) > gapAt(s, r.b.end) + 20 && (r.on.modes.get("space") ?? 0) > 0,
    `base ends ${xy(r.b.end)}, ${gapAt(s, r.b.end).toFixed(0)} m (${showModes(r.b.modes)}); ours ends ${xy(r.on.end)}, ${gapAt(s, r.on.end).toFixed(0)} m (${showModes(r.on.modes)})`)
}
// Laser held (slot 2), one enemy in view 120 m east (inside the 155 m ring), nothing to pick up: spacing is off, the
// engage logic decides, so no `space` tick and the same actions as base.
const lone: Foe[] = [{ id: 1, pos: [120, 0, 0] }]
{
  const r = vsBase({ t0: 2, seconds: 8, foes: lone, held: "laser" })
  check("laser held, enemy in view: no spacing", r.same && !r.on.modes.has("space"), `identical actions: ${r.same}; modes ${showModes(r.on.modes)} (base ${showModes(r.b.modes)})`)
}
// The same scene gun-only: spacing still walks us away.
{
  const s: Scene = { t0: 2, seconds: 8, foes: lone }
  const r = vsBase(s)
  check("gun only, enemy in view: still spaces", (r.on.modes.get("space") ?? 0) > 0 && gapAt(s, r.on.end) > gapAt(s, r.b.end) + 20,
    `base ends ${gapAt(s, r.b.end).toFixed(0)} m (${showModes(r.b.modes)}); ours ends ${gapAt(s, r.on.end).toFixed(0)} m (${showModes(r.on.modes)})`)
}
// Farm: one enemy seen once 175 m east, then out of view (farm stays on: nobody in view or known within 160 m).
// Cube A lies 70 m east (105 m from the enemy), cube B 75 m west. Base walks to the nearer cube A; ours to B.
{
  const s: Scene = { t0: 2, seconds: 8, foes: [], cubes: [[70, 0, 0], [-75, 0, 0]] }
  const seen = { id: 1, pos: [175, 0, 0] as Vec3 }
  const withSeen = (who: "base" | Flags) => {
    const bot = mk(flatHello, who)
    const o = structuredClone(stream[0])
    o.t = 1.9
    o.tick = 38
    o.self = { ...o.self, pos: [0, 0, 0], hp: o.self.max_hp }
    o.mechs = [{ id: seen.id, kind: "mech", pos: seen.pos, vel: [0, 0, 0], aim: [Math.PI, 0], hp: 1400, max_hp: 1400, cubes: 0, weapons: ["gun"], charging: false }] as Observation["mechs"]
    o.events = []
    bot.act(o)
    return bot
  }
  // play() builds a fresh bot, so run the farm scene here on bots that have seen the enemy once.
  const stepFarm = (who: "base" | Flags) => {
    const bot = withSeen(who)
    let pos: Vec3 = [0, 0, 0]
    const walk = flatHello.config.mech.walk_speed
    for (let n = 0; n <= s.seconds * 10; n++) {
      const o = structuredClone(stream[0])
      o.t = s.t0 + n / 10
      o.tick = Math.round(o.t * 20)
      o.self = { ...o.self, pos: [...pos] as Vec3, hp: o.self.max_hp }
      o.zone = { ...o.zone, center: [0, 0], radius: 560, next_center: [0, 0], next_radius: 380, shrink_start: 60, shrink_end: 110 }
      o.self.in_zone = true
      o.mechs = []
      o.cubes = s.cubes!.map((p, i) => ({ id: 5000 + i, pos: p })) as Observation["cubes"]
      o.pickups = []
      o.crates = []
      o.drops = []
      o.events = []
      const mv = bot.act(o).act.move ?? [0, 0]
      pos = [pos[0] + mv[0] * walk * 0.1, pos[1] + mv[1] * walk * 0.1, 0]
    }
    return pos
  }
  const b = stepFarm("base"), on = stepFarm(ON)
  check("farm cube on the far side", b[0] > 5 && on[0] < -5, `base walks to ${xy(b)} (${flat(b, seen.pos).toFixed(0)} m from the enemy); ours to ${xy(on)} (${flat(on, seen.pos).toFixed(0)} m)`)
}
// After the window nothing changes.
{
  const r = vsBase({ t0: SPACING_S + 2, seconds: 8, foes: cluster })
  check("window over = base", r.same && !r.on.modes.has("space"), `identical actions: ${r.same}; modes ${showModes(r.on.modes)}`)
}
// Zone escape, next circle and engage rank first and match base.
{
  const r = vsBase({ t0: 2, seconds: 5, foes: cluster, zone: { center: [-700, 0], radius: 560, next_center: [-700, 0] } })
  check("zone escape = base", r.same && (r.on.modes.get("zone escape") ?? 0) > 0, `identical actions: ${r.same}; modes ${showModes(r.on.modes)}`)
}
{
  const r = vsBase({ t0: 2, seconds: 5, foes: cluster, zone: { next_center: [500, 0], next_radius: 100, shrink_end: 50 } })
  check("next circle = base", r.same && (r.on.modes.get("to next circle") ?? 0) > 0, `identical actions: ${r.same}; modes ${showModes(r.on.modes)}`)
}
{
  const r = vsBase({ t0: 2, seconds: 4, foes: [{ id: 1, pos: [50, 0, 0], hp: 300 }] })
  check("engage = base", r.same && (r.on.modes.get("engage, finish") ?? 0) > 0, `identical actions: ${r.same}; modes ${showModes(r.on.modes)}`)
}
console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll checks passed")
process.exit(failed ? 1 : 0)
