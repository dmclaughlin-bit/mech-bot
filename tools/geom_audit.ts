/**
 * Geometry / navigation correctness audit (Build 10, P0). Deterministic (seeded); reads the real arena files.
 *
 *   bun tools/geom_audit.ts [arenaDir] [losPairs] [pathQueries]
 *
 * 1. map.ts: cells whose prisms form disjoint vertical intervals (merged into one base..top by loadMap), and
 *    clearLine vs an exact test (segment × prism: ring minus holes, between base and top; terrain sampled the same
 *    way in both, so mismatches are prism-raster or interval-merge errors).
 * 2. nav.ts: random paths; every segment (from → waypoints) sampled every 0.25 m and checked against the exact
 *    footprint of every blocking prism (same block rule as nav: not walk-under, not step-on, not a bridge) at the
 *    real mech radius (2.5 m, 3.75 m at 10 cubes), and against nav's own free cells (steep ground).
 * 3. Unreachable / snapped endpoints.
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { clearLine, groundAt, loadMap } from "../map.ts"
import { buildNavGrid, createNav } from "../nav.ts"
import type { Hello, Vec3 } from "../mechfight.ts"

const arg = process.argv.slice(2)
const arena = arg[0] ?? ["../mechfight-kit/arena", "/workspace/mechfight-kit/arena", "/arena"].find((d) => existsSync(`${d}/v2/world.json`))
if (!arena) throw new Error("arena dir not found")
const LOS_PAIRS = Number(arg[1] ?? 20000)
const PATHS = Number(arg[2] ?? 1000)

const HEIGHT = 9, RADIUS = 2.5, STEP_UP = 1.2, EYE = 8, GROWTH = 0.05
const hello = {
  type: "hello", protocol: "mechfight/1", slot: 0, seed: 1,
  map: { dir: arena, files: ["v2/world.json", "v2/terrain.i16"] },
  config: { match: { tick_hz: 20, decide_every: 2 }, mech: { step_up: STEP_UP, height: HEIGHT, radius: RADIUS, walk_speed: 11.7 } },
} as unknown as Hello

let seed = 20261121
const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff)

const world = JSON.parse(readFileSync(join(arena, "v2/world.json"), "utf8"))
type P = { kind: string; base: number; top: number; ring: number[]; holes: number[][]; bb: number[] }
const prisms: P[] = world.prisms.map((p: any) => {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (let i = 0; i < p.ring.length; i += 2) {
    x0 = Math.min(x0, p.ring[i]); x1 = Math.max(x1, p.ring[i]); y0 = Math.min(y0, p.ring[i + 1]); y1 = Math.max(y1, p.ring[i + 1])
  }
  return { kind: p.kind, base: p.base, top: p.top, ring: p.ring, holes: p.holes ?? [], bb: [x0, y0, x1, y1] }
})
const m = loadMap(hello)!
const T = world.terrain

function inRing(r: number[], x: number, y: number) {
  let hit = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}
const inFoot = (p: P, x: number, y: number) => inRing(p.ring, x, y) && !p.holes.some((h) => inRing(h, x, y))
const inSolid = (x: number, y: number, z: number) => prisms.some((p) => z >= p.base && z <= p.top && x >= p.bb[0] && x <= p.bb[2] && y >= p.bb[1] && y <= p.bb[3] && inFoot(p, x, y))

function segX(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
  const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx)
  if (d === 0) return false
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d
  return t >= 0 && t <= 1 && u >= 0 && u <= 1
}
/** Exact: does segment a→b pass through prism p? */
function hitsPrism(p: P, a: Vec3, b: Vec3): boolean {
  let t0 = 0, t1 = 1
  const dz = b[2] - a[2]
  if (Math.abs(dz) < 1e-9) { if (a[2] < p.base || a[2] > p.top) return false }
  else {
    let u = (p.base - a[2]) / dz, v = (p.top - a[2]) / dz
    if (u > v) [u, v] = [v, u]
    t0 = Math.max(t0, u); t1 = Math.min(t1, v)
    if (t0 > t1) return false
  }
  const ax = a[0] + (b[0] - a[0]) * t0, ay = a[1] + (b[1] - a[1]) * t0
  const bx = a[0] + (b[0] - a[0]) * t1, by = a[1] + (b[1] - a[1]) * t1
  if (Math.max(ax, bx) < p.bb[0] || Math.min(ax, bx) > p.bb[2] || Math.max(ay, by) < p.bb[1] || Math.min(ay, by) > p.bb[3]) return false
  if (inFoot(p, ax, ay) || inFoot(p, bx, by)) return true
  for (const r of [p.ring, ...p.holes]) {
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) if (segX(ax, ay, bx, by, r[j], r[j + 1], r[i], r[i + 1])) return true
  }
  return false
}
function exactClear(a: Vec3, b: Vec3): { clear: boolean; byPrism: boolean } {
  for (const p of prisms) if (hitsPrism(p, a, b)) return { clear: false, byPrism: true }
  // terrain: same sampler as clearLine, but finer
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const n = Math.ceil(len / 0.25)
  for (let k = 0; k <= n; k++) {
    const f = k / n
    const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, z = a[2] + (b[2] - a[2]) * f
    if (z < groundAt(m, x, y)) return { clear: false, byPrism: false }
  }
  return { clear: true, byPrism: false }
}

// ---------------------------------------------------------------- 1. map.ts
console.log(`arena ${arena}: ${prisms.length} prisms (${prisms.filter((p) => p.kind === "bridge").length} bridges)`)
{
  // disjoint vertical intervals per 1 m cell (same cell centers as loadMap)
  const ivs = new Map<number, [number, number][]>()
  for (const p of prisms) {
    const i0 = Math.max(0, Math.floor(p.bb[0] - T.minX)), i1 = Math.min(T.nx - 1, Math.floor(p.bb[2] - T.minX))
    const j0 = Math.max(0, Math.floor(p.bb[1] - T.minY)), j1 = Math.min(T.ny - 1, Math.floor(p.bb[3] - T.minY))
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (!inFoot(p, T.minX + i + 0.5, T.minY + j + 0.5)) continue
      const k = j * T.nx + i
      const a = ivs.get(k) ?? []
      a.push([p.base, p.top]); ivs.set(k, a)
    }
  }
  let multi = 0, gapCells = 0, gapWalk = 0, maxGap = 0
  for (const [k, a] of ivs) {
    if (a.length < 2) continue
    multi++
    a.sort((u, v) => u[0] - v[0])
    let hi = a[0][1], gap = 0
    for (let q = 1; q < a.length; q++) { if (a[q][0] > hi) gap = Math.max(gap, a[q][0] - hi); hi = Math.max(hi, a[q][1]) }
    if (gap > 0) { gapCells++; maxGap = Math.max(maxGap, gap); if (gap >= HEIGHT) gapWalk++ }
  }
  // bridge undersides: cells whose interval starts above the ground by >= mech height (walk-under): ok if isolated
  console.log(`map.ts: ${ivs.size} solid cells; ${multi} with >1 prism; ${gapCells} merge DISJOINT intervals (max gap ${maxGap.toFixed(2)} m; ${gapWalk} with a gap >= ${HEIGHT} m)`)

  // LOS pairs: random spots on the ground (not inside solids), eye of A (+8) to center (+4.5) / top (+9) of B
  let n = 0, mismatch = 0, falseBlock = 0, falseClear = 0, fbPrism = 0, fcPrism = 0, blockedExact = 0
  const t0 = performance.now()
  while (n < LOS_PAIRS) {
    const ax = T.minX + 5 + rnd() * (T.nx - 10), ay = T.minY + 5 + rnd() * (T.ny - 10)
    const d = 10 + rnd() * 240, yaw = rnd() * 2 * Math.PI
    const bx = ax + Math.cos(yaw) * d, by = ay + Math.sin(yaw) * d
    if (bx < T.minX + 5 || by < T.minY + 5 || bx > T.minX + T.nx - 5 || by > T.minY + T.ny - 5) continue
    const ga = groundAt(m, ax, ay), gb = groundAt(m, bx, by)
    if (inSolid(ax, ay, ga + 0.5) || inSolid(ax, ay, ga + EYE) || inSolid(bx, by, gb + 0.5) || inSolid(bx, by, gb + HEIGHT / 2)) continue
    n++
    for (const hz of [HEIGHT / 2, HEIGHT]) {
      const a: Vec3 = [ax, ay, ga + EYE], b: Vec3 = [bx, by, gb + hz]
      const got = clearLine(m, a, b, 0, 0)
      const ex = exactClear(a, b)
      if (!ex.clear) blockedExact++
      if (got === ex.clear) continue
      mismatch++
      if (!got) { falseBlock++; if (!ex.clear || true) { /* exact clear */ } }
      else { falseClear++; if (ex.byPrism) fcPrism++ }
    }
  }
  // classify false blocks: was it a prism cell or terrain?
  console.log(`LOS: ${2 * n} lines (${blockedExact} exactly blocked) in ${((performance.now() - t0) / 1000).toFixed(1)} s; mismatches ${mismatch} (${((100 * mismatch) / (2 * n)).toFixed(2)}%): false-block ${falseBlock}, false-clear ${falseClear} (${fcPrism} through a prism)`)

  // targeted: lines that pass UNDER bridges (both ends on the ground, 0..60 m apart across a bridge footprint)
  let ub = 0, ubFalse = 0, ubFalseClear = 0
  for (const p of prisms.filter((q) => q.kind === "bridge")) {
    for (let s = 0; s < 400; s++) {
      const cx = p.bb[0] + rnd() * (p.bb[2] - p.bb[0]), cy = p.bb[1] + rnd() * (p.bb[3] - p.bb[1])
      if (!inFoot(p, cx, cy)) continue
      const yaw = rnd() * 2 * Math.PI, d = 10 + rnd() * 30
      const a0x = cx - Math.cos(yaw) * d, a0y = cy - Math.sin(yaw) * d, b0x = cx + Math.cos(yaw) * d, b0y = cy + Math.sin(yaw) * d
      const ga = groundAt(m, a0x, a0y), gb = groundAt(m, b0x, b0y)
      if (ga === -Infinity || gb === -Infinity) continue
      for (const [za, zb] of [[ga + EYE, gb + HEIGHT / 2], [ga + 4.5, gb + 4.5], [ga + 2, gb + 2]]) {
        const a: Vec3 = [a0x, a0y, za], b: Vec3 = [b0x, b0y, zb]
        if (inSolid(a[0], a[1], a[2]) || inSolid(b[0], b[1], b[2])) continue
        ub++
        const got = clearLine(m, a, b, 0, 0), ex = exactClear(a, b)
        if (!got && ex.clear) ubFalse++
        if (got && !ex.clear) ubFalseClear++
      }
    }
  }
  console.log(`LOS across bridge footprints: ${ub} lines; false-block ${ubFalse}, false-clear ${ubFalseClear}`)
}

// ---------------------------------------------------------------- 2/3. nav.ts
{
  const g = buildNavGrid(hello)
  const nav = createNav(hello)
  const blocking = (p: P, x: number, y: number) => {
    if (p.kind === "bridge") return false
    const gr = groundAt(m, x, y)
    if (p.base - gr >= HEIGHT) return false
    if (p.top - gr <= STEP_UP) return false
    return true
  }
  function edgeDist(r: number[], x: number, y: number) {
    let best = Infinity
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      const ax = r[j], ay = r[j + 1], bx = r[i], by = r[i + 1]
      const vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy
      const t = L > 0 ? Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / L)) : 0
      best = Math.min(best, Math.hypot(x - ax - t * vx, y - ay - t * vy))
    }
    return best
  }
  /** Distance from (x,y) to the nearest blocking footprint (0 if inside), checked within `within` m. */
  function wallDist(x: number, y: number, within: number) {
    let best = Infinity
    for (const p of prisms) {
      if (x < p.bb[0] - within || x > p.bb[2] + within || y < p.bb[1] - within || y > p.bb[3] + within) continue
      if (!blocking(p, x, y)) continue
      if (inFoot(p, x, y)) return 0
      let d = edgeDist(p.ring, x, y)
      for (const h of p.holes) d = Math.min(d, edgeDist(h, x, y))
      best = Math.min(best, d)
    }
    return best
  }
  const cellAt = (x: number, y: number) => {
    const I = Math.min(g.nx - 1, Math.max(0, Math.floor((x - g.minX + 0.5) / 2)))
    const J = Math.min(g.ny - 1, Math.max(0, Math.floor((y - g.minY + 0.5) / 2)))
    return J * g.nx + I
  }
  const F = g.freeCells
  let ok = 0, nul = 0, crossComp = 0, snapped = 0, segs = 0, segInside = 0, segUnderR = 0, segUnderR10 = 0, segNonFree = 0
  let pathsInside = 0, pathsUnderR = 0, pathsUnderR10 = 0, pathsNonFree = 0, minClear = Infinity, gridOnlyClip = 0
  const clipLen: number[] = []
  const pos = (c: number): Vec3 => [g.minX + (c % g.nx) * 2 + 0.5, g.minY + ((c / g.nx) | 0) * 2 + 0.5, g.h[c]]
  for (let q = 0; q < PATHS; q++) {
    // half the queries: random free→free; half: free→any point (endpoints that may sit in walls)
    const a = F[(rnd() * F.length) | 0]
    const from = pos(a)
    let to: Vec3
    if (q % 2 === 0) to = pos(F[(rnd() * F.length) | 0])
    else to = [T.minX + 5 + rnd() * (T.nx - 10), T.minY + 5 + rnd() * (T.ny - 10), 0]
    const tc = cellAt(to[0], to[1])
    if (g.free[tc] && g.comp[tc] !== g.comp[a]) crossComp++
    const p = nav.path(from, to, 30000)
    if (!p) { nul++; continue }
    ok++
    const end = p[p.length - 1]
    if (Math.hypot(end[0] - to[0], end[1] - to[1]) > 0.5) snapped++
    let px = from[0], py = from[1], inside = false, under = false, under10 = false, nonfree = false
    for (const w of p) {
      segs++
      const L = Math.hypot(w[0] - px, w[1] - py), n = Math.max(1, Math.ceil(L / 0.25))
      let sIn = false, sR = false, sR10 = false, sNF = false, clip = 0
      for (let k = 0; k <= n; k++) {
        const x = px + ((w[0] - px) * k) / n, y = py + ((w[1] - py) * k) / n
        const d = wallDist(x, y, 4)
        minClear = Math.min(minClear, d)
        if (d === 0) sIn = true
        if (d < RADIUS) { sR = true; clip += L / n }
        if (d < RADIUS * (1 + 10 * GROWTH)) sR10 = true
        if (!g.free[cellAt(x, y)]) sNF = true
      }
      if (sIn) segInside++
      if (sR) { segUnderR++; clipLen.push(clip) }
      if (sR10) segUnderR10++
      if (sNF) segNonFree++
      if (sNF && !sR) gridOnlyClip++
      inside ||= sIn; under ||= sR; under10 ||= sR10; nonfree ||= sNF
      px = w[0]; py = w[1]
    }
    if (inside) pathsInside++
    if (under) pathsUnderR++
    if (under10) pathsUnderR10++
    if (nonfree) pathsNonFree++
  }
  clipLen.sort((u, v) => u - v)
  const pct = (k: number) => `${((100 * k) / Math.max(1, ok)).toFixed(1)}%`
  console.log(`nav: ${PATHS} queries -> ${ok} paths, ${nul} null (${crossComp} targets in another free component), ${snapped} ended snapped >0.5 m from the target`)
  console.log(`  ${segs} segments: ${segInside} pass THROUGH a blocking footprint; ${segUnderR} come within ${RADIUS} m of a wall; ${segUnderR10} within ${(RADIUS * 1.5).toFixed(2)} m (10 cubes); ${segNonFree} cross a non-free nav cell (steep/inflated)`)
  console.log(`  paths: through-solid ${pathsInside} (${pct(pathsInside)}), clip@2.5 m ${pathsUnderR} (${pct(pathsUnderR)}), clip@3.75 m ${pathsUnderR10} (${pct(pathsUnderR10)}), cross non-free ${pathsNonFree} (${pct(pathsNonFree)}); min wall clearance on any path ${minClear.toFixed(2)} m`)
  if (clipLen.length) console.log(`  clipping length per clipping segment (m): median ${clipLen[clipLen.length >> 1].toFixed(2)}, p90 ${clipLen[Math.floor(clipLen.length * 0.9)].toFixed(2)}, max ${clipLen[clipLen.length - 1].toFixed(2)}`)
}
