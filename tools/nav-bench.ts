/**
 * Times nav.ts on the kit arena.
 *
 *   bun tools/nav-bench.ts [arenaDir] [queries] [budget]
 *
 * arenaDir defaults to ../mechfight-kit/arena (the kit unpacked next to this repo), then /arena (Docker).
 * Builds the Nav the way a match does (createNav, which includes the 20-query warm-up), then times `queries`
 * random queries between free ground cells, seeded so every run is the same set.
 */
import { existsSync } from "node:fs"
import { buildNavGrid, createNav } from "../nav.ts"
import type { Hello, Vec3 } from "../mechfight.ts"

const arg = process.argv.slice(2)
const arena = arg[0] ?? ["../mechfight-kit/arena", "../mechfight-kit/mechfight-kit/arena", "/arena"].find((d) => existsSync(`${d}/v2/world.json`))
if (!arena) {
  console.error("usage: bun tools/nav-bench.ts <arenaDir> [queries] [budget]  (dir that holds v2/world.json)")
  process.exit(2)
}
const Q = Number(arg[1] ?? 1000)
const BUDGET = Number(arg[2] ?? 30000)

// Kit defaults for the numbers nav reads; the real hello carries the live values.
const hello = {
  type: "hello",
  protocol: "mechfight/1",
  slot: 0,
  seed: 1,
  map: { dir: arena, files: ["v2/world.json", "v2/terrain.i16"] },
  config: { match: { tick_hz: 20, decide_every: 2 }, mech: { step_up: 1.2, height: 9, radius: 2.5, walk_speed: 11.7, max_slope_deg: 50 } },
} as unknown as Hello

let t = performance.now()
const grid = buildNavGrid(hello)
const gridMs = performance.now() - t
t = performance.now()
const nav = createNav(hello)
const createMs = performance.now() - t

const N = grid.nx * grid.ny
const sizes = new Map<number, number>()
for (const c of grid.freeCells) sizes.set(grid.comp[c], (sizes.get(grid.comp[c]) ?? 0) + 1)
const biggest = Math.max(...sizes.values())
console.log(`arena ${arena}`)
console.log(`grid ${grid.nx}x${grid.ny} (2 m), free ${grid.freeCells.length}/${N} (${((100 * grid.freeCells.length) / N).toFixed(1)}%), components ${sizes.size}, largest ${biggest} (${((100 * biggest) / grid.freeCells.length).toFixed(1)}% of free)`)
console.log(`buildNavGrid ${gridMs.toFixed(0)} ms; createNav incl. 20 warm-up queries ${createMs.toFixed(0)} ms`)

let seed = 0x5eed
const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff)
const pos = (c: number): Vec3 => [grid.minX + (c % grid.nx) * 2 + 0.5, grid.minY + ((c / grid.nx) | 0) * 2 + 0.5, grid.h[c]]
const F = grid.freeCells
const times: number[] = [], far: number[] = []
let nulls = 0, cross = 0, wps = 0
for (let q = 0; q < Q; q++) {
  const a = F[(rnd() * F.length) | 0], b = F[(rnd() * F.length) | 0]
  const from = pos(a), to = pos(b)
  const t0 = performance.now()
  const p = nav.path(from, to, BUDGET)
  const dt = performance.now() - t0
  times.push(dt)
  const d = Math.hypot(to[0] - from[0], to[1] - from[1])
  if (d >= 150 && d <= 400) far.push(dt)
  if (!p) { nulls++; if (grid.comp[a] !== grid.comp[b]) cross++ }
  else wps += p.length
}
const stats = (xs: number[]) => {
  const s = [...xs].sort((x, y) => x - y)
  const at = (f: number) => s[Math.min(s.length - 1, Math.floor(f * s.length))]
  return `median ${at(0.5).toFixed(3)} / p90 ${at(0.9).toFixed(3)} / p99 ${at(0.99).toFixed(3)} / max ${s[s.length - 1].toFixed(3)} ms`
}
console.log(`${Q} random queries, budget ${BUDGET}: ${stats(times)}`)
if (far.length) console.log(`  ${far.length} of them 150–400 m apart: ${stats(far)}`)
console.log(`  null ${nulls} (${cross} across components, ${nulls - cross} over budget); mean waypoints ${(wps / Math.max(1, Q - nulls)).toFixed(1)}`)
t = performance.now()
for (let q = 0; q < 200; q++) nav.eta(pos(F[(rnd() * F.length) | 0]), pos(F[(rnd() * F.length) | 0]))
console.log(`eta: ${((performance.now() - t) / 200).toFixed(3)} ms mean over 200`)
console.log(`rss ${(process.memoryUsage().rss / 1e6).toFixed(0)} MB`)
