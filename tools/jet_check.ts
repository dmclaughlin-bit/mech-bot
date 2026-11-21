/**
 * Build 33 check: the jet grid on the kit arena.
 *
 *   bun tools/jet_check.ts [arenaDir] [queries]
 *
 * Prints the climb numbers from the kit config, how many hop links the jet grid has (climbs, drops, over-the-wall),
 * how its components compare with the ground grid's, and times the same seeded random queries on both grids:
 * planning time percentiles, how many jet routes use a hop, and how much shorter they are than the ground route.
 */
import { existsSync } from "node:fs"
import { buildNavGrid, createNav, jetNumbers, type Waypoint } from "../nav.ts"
import { DROP_MAX_M } from "../params.ts"
import type { Hello, Vec3 } from "../mechfight.ts"

const arg = process.argv.slice(2)
const arena = arg[0] ?? ["../mechfight-kit/arena", "/workspace/mechfight-kit/arena", "/arena"].find((d) => existsSync(`${d}/v2/world.json`))
if (!arena) {
  console.error("usage: bun tools/jet_check.ts <arenaDir> [queries]")
  process.exit(2)
}
const Q = Number(arg[1] ?? 500)
const BUDGET = 20000
const hello = {
  type: "hello", protocol: "mechfight/1", slot: 0, seed: 1,
  map: { dir: arena, files: ["v2/world.json", "v2/terrain.i16"] },
  config: {
    match: { tick_hz: 20, decide_every: 2 },
    mech: { step_up: 1.2, height: 9, radius: 2.5, walk_speed: 11.7, max_slope_deg: 50, energy: 100, gravity: 22, jump_speed: 11, jet_accel: 34, max_rise_speed: 10, jet_drain: 15, boost_drain: 17 },
  },
} as unknown as Hello

const jn = jetNumbers(hello)
console.log(`climb: rise ${jn.rise.toFixed(2)} m/s, ${jn.perM.toFixed(2)} energy/m, limit ${jn.climbMax.toFixed(2)} m, plan on the jet grid at energy >= ${jn.need.toFixed(1)}; drops <= ${DROP_MAX_M} m`)
let t = performance.now()
const ground = buildNavGrid(hello)
const gMs = performance.now() - t
t = performance.now()
const jg = buildNavGrid(hello, { climbMax: jn.climbMax, dropMax: DROP_MAX_M })
const jMs = performance.now() - t
const L = jg.links!
let climbs = 0, drops = 0, overs = 0
for (const h of L.hop) {
  if (h.up > 1.2 && h.down > 1.2) overs++
  else if (h.up > 1.2) climbs++
  else drops++
}
const comps = (c: Int32Array) => {
  const n = new Map<number, number>()
  for (const x of c) if (x >= 0) n.set(x, (n.get(x) ?? 0) + 1)
  return [...n.values()].sort((a, b) => b - a)
}
const gc = comps(ground.comp), jc = comps(jg.comp)
console.log(`ground grid ${gMs.toFixed(0)} ms: free ${ground.freeCells.length}, components ${gc.length}, largest ${gc[0]}`)
console.log(`jet grid ${jMs.toFixed(0)} ms: free ${jg.freeCells.length}, components ${jc.length}, largest ${jc[0]}; links ${L.to.length} (climb ${climbs}, drop ${drops}, over a wall ${overs})`)

t = performance.now()
const nav = createNav(hello)
console.log(`createNav (both grids, warm-ups) ${(performance.now() - t).toFixed(0)} ms, jetNeed ${nav.jetNeed.toFixed(1)}`)

let seed = 777
const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff)
const F = ground.freeCells
const pos = (c: number): Vec3 => [ground.minX + (c % ground.nx) * 2 + 0.5, ground.minY + ((c / ground.nx) | 0) * 2 + 0.5, ground.h[c]]
const len = (from: Vec3, p: Waypoint[]) => { let d = 0, a: number[] = from; for (const w of p) { d += Math.hypot(w[0] - a[0], w[1] - a[1]); a = w } return d }
const tg: number[] = [], tj: number[] = []
let withHop = 0, hops = 0, gNull = 0, jNull = 0, saved = 0, savedN = 0, bothFound = 0
for (let q = 0; q < Q; q++) {
  const a = pos(F[(rnd() * F.length) | 0]), b = pos(F[(rnd() * F.length) | 0])
  let s = performance.now()
  const pg = nav.path(a, b, BUDGET, false)
  tg.push(performance.now() - s)
  s = performance.now()
  const pj = nav.path(a, b, BUDGET, true)
  tj.push(performance.now() - s)
  if (!pg) gNull++
  if (!pj) jNull++
  if (pj) {
    const n = pj.filter((w) => w.hop).length
    if (n) { withHop++; hops += n }
    if (pg && n) { const d = len(a, pg) - len(a, pj); saved += d; savedN++ }
    if (pg) bothFound++
  }
}
const pct = (xs: number[], p: number) => xs.slice().sort((x, y) => x - y)[Math.min(xs.length - 1, Math.floor(p * xs.length))]
const show = (xs: number[]) => `median ${pct(xs, 0.5).toFixed(3)} / p90 ${pct(xs, 0.9).toFixed(3)} / p99 ${pct(xs, 0.99).toFixed(3)} / max ${Math.max(...xs).toFixed(3)} ms`
console.log(`${Q} random queries, budget ${BUDGET}`)
console.log(`  ground: ${show(tg)}; null ${gNull}`)
console.log(`  jet:    ${show(tj)}; null ${jNull}`)
console.log(`  jet routes with a hop: ${withHop} (${hops} hops); where both found, hop routes are ${savedN ? (saved / savedN).toFixed(1) : "-"} m shorter on average (${savedN} of ${bothFound})`)
