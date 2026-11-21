/**
 * Build 16 offline check: run the brain on recorded observations and count which enemy it targets, how often the
 * target switches, and how often the pick differs from Build 13's (nearest with a clear line, else nearest).
 * OFFLINE ONLY: the recording is not reactive (our actions do not change later observations), so these counts say
 * whether the rule fires and on what, never how a match would go. They are not scores.
 *
 *   bun tools/target_check.ts [--synth] [stream.jsonl[.gz]] [arenaDir] < /dev/null
 *
 * --synth adds a made-up second enemy (id 99) to every observation that has an enemy mech in view: a copy of the
 * first one, SYNTH_OFFSET_M further along +x, at 40% HP, gun only, and hidden one second in every five. The kit
 * recording never has two enemies in view, so without it there is no choice to count. Synthetic counts exercise the
 * code path only.
 *
 * The file holds one hello line, then obs lines (the kit's check/stream.jsonl.gz format). Defaults to the kit stream.
 * stdin must be closed: map.ts imports mechfight.ts.
 */
import { existsSync, readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { createBot } from "../brain.ts"
import { clearLine, loadMap } from "../map.ts"
import { draw, type ActorObs, type Hello, type Observation, type Vec3 } from "../mechfight.ts"
import { TARGET_LOST_S, TARGET_PICK_ON } from "../params.ts"

const SYNTH_ID = 99
const SYNTH_OFFSET_M = 60
const arg = process.argv.slice(2).filter((a) => a !== "--synth")
const synth = process.argv.includes("--synth")
const kit = ["../mechfight-kit", "/workspace/mechfight-kit"].find((d) => existsSync(`${d}/check/stream.jsonl.gz`))
const file = arg[0] ?? (kit ? `${kit}/check/stream.jsonl.gz` : "")
const arena = arg[1] ?? (kit ? `${kit}/arena` : "/arena")
if (!file || !existsSync(file)) {
  console.error("usage: bun tools/target_check.ts [--synth] <stream.jsonl[.gz]> [arenaDir]")
  process.exit(2)
}
const raw = readFileSync(file)
const lines = (file.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8").split("\n").filter(Boolean)
const hello = JSON.parse(lines[0]) as Hello
if (hello.type !== "hello") throw new Error("first line is not a hello")
hello.map.dir = arena
const cfg = hello.config
const solids = loadMap(hello)
const bot = createBot(hello)

/** Build 13's pick, recomputed here: the nearest enemy mech with a clear line from our muzzle, else the nearest. */
function build13Pick(obs: Observation): number | null {
  const me = obs.self
  const growth = Number(cfg.cubes.size_per_cube ?? 0.05)
  const muzzle: Vec3 = [me.pos[0], me.pos[1], me.pos[2] + (me.stats.muzzle_height ?? cfg.mech.muzzle_height * (1 + growth * me.cubes))]
  const options = obs.mechs
    .filter((m) => m.kind === "mech")
    .map((m) => {
      const c: Vec3 = [m.pos[0], m.pos[1], m.pos[2] + (cfg.mech.height / 2) * (1 + growth * (m.cubes ?? 0))]
      return { id: m.id, c, d: Math.hypot(c[0] - muzzle[0], c[1] - muzzle[1], c[2] - muzzle[2]), clear: false }
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, 8)
  for (const o of options) o.clear = clearLine(solids, muzzle, o.c)
  options.sort((a, b) => Number(b.clear) - Number(a.clear) || a.d - b.d)
  return options[0]?.id ?? null
}

const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1)
const inView = new Map<string, number>()
const roles = new Map<string, number>()
const targets = new Map<string, number>()
const newLocks = new Map<string, number>()
const firingAt = new Map<string, number>()
let obsCount = 0, withTarget = 0, switches = 0, backAndForth = 0, differs = 0, choiceTicks = 0, notLowestHp = 0
let prev: number | null = null, prevPrev: number | null = null
let held = 0, longestHold = 0
for (const line of lines.slice(1)) {
  const obs = JSON.parse(line) as Observation
  if (obs.type !== "obs") continue
  obsCount++
  const first = obs.mechs.find((m) => m.kind === "mech")
  if (synth && first && Math.floor(obs.t) % 5 !== 4) {
    const ghost: ActorObs = { ...first, id: SYNTH_ID, pos: [first.pos[0] + SYNTH_OFFSET_M, first.pos[1], first.pos[2]], hp: 0.4 * (first.max_hp ?? cfg.mech.hp), weapons: ["gun"] }
    obs.mechs.push(ghost)
  }
  const enemies = obs.mechs.filter((m) => m.kind === "mech")
  bump(inView, String(enemies.length))
  const baseline = build13Pick(obs)
  const act = bot.act(obs)
  const label = draw.take()?.label ?? ""
  // "… · gun at 10 57m [lock+first 6.31] · hold": role, +cause on the decision a lock starts, kill value.
  // Farm shots ("farm gun at …") are not mech targets.
  const hit = / · (?!farm )(\w+) at (\d+) \d+m(?: \(behind cover\))?(?: \[(\w+)(?:\+(\w+))?)?/.exec(label)
  const id = hit ? Number(hit[2]) : null
  if (id === null) {
    held = 0
    prevPrev = prev = null
    continue
  }
  withTarget++
  bump(targets, String(id))
  bump(roles, hit![3] ?? "build 13 pick")
  if (hit![4]) bump(newLocks, hit![4])
  if (act.fire?.some(Boolean)) bump(firingAt, String(id))
  if (enemies.length > 1) {
    choiceTicks++
    if (id !== baseline) differs++
    const lowest = enemies.reduce((a, b) => ((a.hp ?? Infinity) <= (b.hp ?? Infinity) ? a : b))
    if (id !== lowest.id) notLowestHp++
  }
  if (prev !== null && id !== prev) {
    switches++
    if (id === prevPrev) backAndForth++
    prevPrev = prev
    held = 0
  } else if (prev === null) prevPrev = null
  held++
  longestHold = Math.max(longestHold, held)
  prev = id
}

const show = (title: string, m: Map<string, number>) => {
  console.log(title)
  if (!m.size) console.log("  none")
  for (const [k, n] of [...m].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${k}`)
}
console.log(`OFFLINE replay of ${file}${synth ? " + SYNTHETIC enemy 99" : ""} (non-reactive recording; counts are not scores)`)
console.log(`TARGET_PICK_ON = ${TARGET_PICK_ON}, lock lost after ${TARGET_LOST_S} s`)
console.log(`observations: ${obsCount}  with a mech target: ${withTarget}  with a choice (2+ enemy mechs in view): ${choiceTicks}`)
console.log(`target switches (target id changed between consecutive targeted ticks): ${switches}  of which straight back to the previous target: ${backAndForth}`)
console.log(`longest run on one target: ${longestHold} ticks`)
console.log(`with a choice: pick differs from Build 13's nearest-clear pick on ${differs} ticks; pick is not the lowest-hp enemy on ${notLowestHp} ticks`)
show("enemy mechs in view (ticks):", inView)
show("target by id (ticks):", targets)
show("fired at, by id (ticks):", firingAt)
show("pick role (ticks):", roles)
show("new locks by cause:", newLocks)
