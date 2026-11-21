/**
 * Build 20 offline check (standoff): replay recorded observations through this tree's brain and, optionally, a second
 * brain (another checkout), and report (1) how many responses differ between the two, (2) on engage ticks, the range to
 * the target and whether our move closes in, backs off, holds or goes sideways. OFFLINE ONLY: the recording is not
 * reactive (our moves do not change later observations), so the ranges are the recording's, not where the standoff
 * would put us. These counts say whether and how the rule fires, never how a match would go. They are not scores.
 *
 *   bun tools/standoff_check.ts [otherCheckoutDir] [stream.jsonl[.gz]] [arenaDir] < /dev/null
 *
 * Pass 1 replays the recording as it is. Pass 2 is the what-if from tools/engage_check.ts that makes the finish rule
 * fire: our HP at 60% of max, the enemy in view at 150 HP and it damaged us this tick (HP numbers made up; positions,
 * sight lines and weapons from the recording). A response is the brain's action plus its debug drawing, as the kit
 * would send it. Defaults to the kit stream. stdin must be closed: map.ts imports mechfight.ts.
 */
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { gunzipSync } from "node:zlib"
import type { Hello, Observation } from "../mechfight.ts"

const arg = process.argv.slice(2)
const other = arg[0] ? resolve(arg[0]) : ""
const kit = ["../mechfight-kit", "/workspace/mechfight-kit"].find((d) => existsSync(`${d}/check/stream.jsonl.gz`))
const file = arg[1] ?? (kit ? `${kit}/check/stream.jsonl.gz` : "")
const arena = arg[2] ?? (kit ? `${kit}/arena` : "/arena")
if (!file || !existsSync(file)) {
  console.error("usage: bun tools/standoff_check.ts [otherCheckoutDir] [stream.jsonl[.gz]] [arenaDir]")
  process.exit(2)
}
const raw = readFileSync(file)
const lines = (file.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8").split("\n").filter(Boolean)
const hello = JSON.parse(lines[0]) as Hello
if (hello.type !== "hello") throw new Error("first line is not a hello")
hello.map.dir = arena
const recorded = lines.slice(1).map((l) => JSON.parse(l) as Observation).filter((o) => o.type === "obs")

type Brain = { createBot: (h: Hello) => { act: (o: Observation) => unknown }; draw: { take: () => { label?: string } | null | undefined } }
async function load(dir: string): Promise<Brain> {
  const b = await import(`${dir}/brain.ts`)
  const m = await import(`${dir}/mechfight.ts`)
  return { createBot: b.createBot, draw: m.draw }
}
const here = await load(resolve(import.meta.dir, ".."))
const there = other ? await load(other) : null
const params = await import(resolve(import.meta.dir, "../params.ts"))

type Tick = { response: string; mode: string; move: [number, number]; obs: Observation }
function replay(b: Brain, rewrite?: (o: Observation) => void): Tick[] {
  const bot = b.createBot(structuredClone(hello))
  return recorded.map((original) => {
    const obs = structuredClone(original)
    rewrite?.(obs)
    const act = bot.act(obs) as { move?: [number, number] } | null
    const drawing = b.draw.take()
    const mode = (drawing?.label ?? "").split(" · ").at(-1) ?? "?"
    return { response: JSON.stringify([act, drawing ?? null]), mode, move: act?.move ?? [0, 0], obs }
  })
}

/** Where the move goes relative to the engaged enemy (the nearest enemy mech in view stands in for it). */
function classify(t: Tick): { d: number; kind: "in" | "back" | "hold" | "side" } | null {
  const me = t.obs.self.pos
  const foe = t.obs.mechs.filter((m) => m.kind === "mech").sort((a, b) => Math.hypot(a.pos[0] - me[0], a.pos[1] - me[1]) - Math.hypot(b.pos[0] - me[0], b.pos[1] - me[1]))[0]
  if (!foe) return null
  const dx = foe.pos[0] - me[0], dy = foe.pos[1] - me[1], d = Math.hypot(dx, dy)
  const speed = Math.hypot(t.move[0], t.move[1])
  if (speed < 0.05) return { d, kind: "hold" }
  const along = (t.move[0] * dx + t.move[1] * dy) / (speed * d)
  return { d, kind: along > 0.38 ? "in" : along < -0.38 ? "back" : "side" }
}

function report(name: string, rewrite?: (o: Observation) => void) {
  const a = replay(here, rewrite)
  console.log(`\n${name}: ${a.length} observations`)
  if (there) {
    const b = replay(there, rewrite)
    const diff = a.filter((t, i) => t.response !== b[i].response).length
    console.log(`  responses differing from ${other}: ${diff} of ${a.length}`)
    const engB = b.filter((t) => t.mode.startsWith("engage, ttk") || t.mode.startsWith("engage, finish"))
    summarize("  other checkout, engage ticks", engB)
  }
  summarize("  this tree, engage ticks", a.filter((t) => t.mode.startsWith("engage, ttk") || t.mode.startsWith("engage, finish")))
}
function summarize(label: string, ticks: Tick[]) {
  const n = { in: 0, back: 0, hold: 0, side: 0 }
  const ds: number[] = []
  for (const t of ticks) {
    const c = classify(t)
    if (!c) continue
    n[c.kind]++
    ds.push(c.d)
  }
  ds.sort((x, y) => x - y)
  const q = (p: number) => (ds.length ? ds[Math.min(ds.length - 1, Math.floor(p * ds.length))].toFixed(0) : "-")
  console.log(`${label}: ${ticks.length}  move: in ${n.in}, back ${n.back}, hold ${n.hold}, side ${n.side}  range m p10/p50/p90 ${q(0.1)}/${q(0.5)}/${q(0.9)}`)
}

console.log(`OFFLINE replay of ${file} (non-reactive recording; counts are not scores)`)
console.log(`STANDOFF_ON ${params.STANDOFF_ON}  laser: defers to Build 17 hold  gun ${params.STANDOFF_GUN_M} m  lightning ${params.STANDOFF_ARC_M} m  band ±${params.STANDOFF_BAND_M} m`)
report("Pass 1, recording as it is")
const finishWhatIf = (o: Observation) => {
  o.self.hp = Math.round(0.6 * o.self.max_hp)
  const foe = o.mechs.find((m) => m.kind === "mech")
  if (!foe) return
  foe.hp = 150
  const bearing = Math.atan2(foe.pos[1] - o.self.pos[1], foe.pos[0] - o.self.pos[0])
  o.events = [...o.events, { type: "damaged", amount: 45, weapon: "gun", bearing, by: foe.id }]
}
report("Pass 2, what-if: our HP 60%, enemy in view 150 HP and it just damaged us", finishWhatIf)
// Pass 3: as pass 2, and we also hold a laser in the empty slot (stats from hello.config), so the laser standoff applies.
const laserStats = (hello as unknown as { config: { weapons: Record<string, Record<string, number>> } }).config.weapons.laser
report("Pass 3, what-if: as pass 2, plus a laser in our second slot", (o) => {
  finishWhatIf(o)
  const free = o.self.weapons.findIndex((w) => !w)
  if (free >= 0) (o.self.weapons as unknown[])[free] = { kind: "laser", cooldown: 0, stats: laserStats, charge: 0 }
})
