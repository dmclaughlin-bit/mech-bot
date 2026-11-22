/**
 * Map geometry for the sim: prisms rasterised on the 1 m terrain grid (lowest base / highest top per cell, the
 * same reduction the bot's map.ts uses), bilinear ground, ray marching for line of sight and shots, and a coarse
 * 4 m walk grid with A* for the scripted house bots. Trees block sight only, and only with `--trees` (see ASSUMPTIONS.md).
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

export type Vec3 = [number, number, number]

export type Geo = {
  minX: number; minY: number; nx: number; ny: number
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
  base: Float32Array; top: Float32Array; ground: Float32Array
  /** coarse walk grid for house bots */
  cs: number; cnx: number; cny: number; blocked: Uint8Array
  /** cells with a roof low enough to stand on, for roof loot: [x, y, top] */
  roofs: number[]
  /** P-D-014: trees for sight (null unless the run uses --trees) */
  trees?: Trees | null
}

/** P-D-014: world.json trees, flat columns, plus a 16 m bucket grid for lookups. */
export type Trees = {
  n: number; x: Float32Array; y: Float32Array; z: Float32Array; top: Float32Array; cb: Float32Array
  cr: Float32Array; cx: Float32Array; cy: Float32Array; tr: Float32Array
  density: number; blockT: number; bs: number; bx0: number; by0: number; bnx: number; bny: number; buckets: number[][]
}

/** P-D-014: load world.json trees (protocol.md §8, §11). Heights are taken as metres above the tree's ground z. */
export function loadTrees(dir: string): Trees {
  const world = JSON.parse(readFileSync(join(dir, "v2/world.json"), "utf8"))
  const F: string[] = world.trees.fields, D: number[] = world.trees.data, w = F.length, n = Math.floor(D.length / w)
  const col = (k: string) => { const i = F.indexOf(k); const a = new Float32Array(n); for (let j = 0; j < n; j++) a[j] = D[j * w + i]; return a }
  const x = col("x"), y = col("y"), z = col("z"), h = col("height"), cbRel = col("crownBase"), cr = col("crownR"), tr = col("trunkR")
  const cx = F.includes("crownX") ? col("crownX") : x, cy = F.includes("crownY") ? col("crownY") : y
  const top = new Float32Array(n), cb = new Float32Array(n)
  for (let j = 0; j < n; j++) { top[j] = z[j] + h[j]; cb[j] = z[j] + cbRel[j] }
  const b = world.bounds, bs = 16, bnx = Math.ceil((b.maxX - b.minX) / bs) + 1, bny = Math.ceil((b.maxY - b.minY) / bs) + 1
  const buckets: number[][] = Array.from({ length: bnx * bny }, () => [])
  for (let j = 0; j < n; j++) {
    const r = Math.max(cr[j], tr[j]) + Math.hypot(cx[j] - x[j], cy[j] - y[j])
    const i0 = Math.max(0, Math.floor((x[j] - r - b.minX) / bs)), i1 = Math.min(bnx - 1, Math.floor((x[j] + r - b.minX) / bs))
    const k0 = Math.max(0, Math.floor((y[j] - r - b.minY) / bs)), k1 = Math.min(bny - 1, Math.floor((y[j] + r - b.minY) / bs))
    for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) buckets[k * bnx + i].push(j)
  }
  return { n, x, y, z, top, cb, cr, cx, cy, tr, density: Number(world.rules?.canopyDensity ?? 0), blockT: Number(world.rules?.canopyBlockT ?? 0), bs, bx0: b.minX, by0: b.minY, bnx, bny, buckets }
}

/**
 * P-D-014: does a tree stop sight from a to b? A trunk (vertical cylinder trunkR from ground z to crownBase) always
 * does. Crowns (ellipsoids: crownR across, crownBase..top tall, centred on crownX/crownY) fade the line by
 * exp(-canopyDensity × metres inside crowns); it is stopped when that falls below canopyBlockT. `canopy` false = trunks only.
 */
export function treeBlocks(T: Trees, a: number[], b: number[], canopy: boolean): boolean {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz)
  if (len < 1e-6) return false
  const seen = new Set<number>()
  const steps = Math.ceil(Math.hypot(dx, dy) / (T.bs / 2)) + 1
  let inCrown = 0
  for (let s = 0; s <= steps; s++) {
    const px = a[0] + (dx * s) / steps, py = a[1] + (dy * s) / steps
    const bi = Math.floor((px - T.bx0) / T.bs), bk = Math.floor((py - T.by0) / T.bs)
    if (bi < 0 || bk < 0 || bi >= T.bnx || bk >= T.bny) continue
    for (const j of T.buckets[bk * T.bnx + bi]) {
      if (seen.has(j)) continue
      seen.add(j)
      // trunk: closest approach of the segment to the trunk axis, in plan
      const h2 = dx * dx + dy * dy
      let t = h2 > 0 ? ((T.x[j] - a[0]) * dx + (T.y[j] - a[1]) * dy) / h2 : 0
      t = Math.max(0, Math.min(1, t))
      const qx = a[0] + dx * t - T.x[j], qy = a[1] + dy * t - T.y[j], qz = a[2] + dz * t
      if (qx * qx + qy * qy < T.tr[j] * T.tr[j] && qz >= T.z[j] && qz <= T.cb[j]) return true
      if (!canopy) continue
      // crown: segment inside the ellipsoid, in unit-sphere coordinates
      const hz = (T.top[j] - T.cb[j]) / 2, r = T.cr[j]
      if (hz <= 0 || r <= 0) continue
      const ox = (a[0] - T.cx[j]) / r, oy = (a[1] - T.cy[j]) / r, oz = (a[2] - (T.cb[j] + hz)) / hz
      const vx = dx / r, vy = dy / r, vz = dz / hz
      const A = vx * vx + vy * vy + vz * vz, B = 2 * (ox * vx + oy * vy + oz * vz), C = ox * ox + oy * oy + oz * oz - 1
      const disc = B * B - 4 * A * C
      if (disc <= 0) continue
      const sq = Math.sqrt(disc), t1 = Math.max(0, (-B - sq) / (2 * A)), t2 = Math.min(1, (-B + sq) / (2 * A))
      if (t2 > t1) inCrown += (t2 - t1) * len
    }
  }
  return canopy && T.density > 0 && Math.exp(-T.density * inCrown) < T.blockT
}


function inside(ring: number[], x: number, y: number): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i], yi = ring[i + 1], xj = ring[j], yj = ring[j + 1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

export function loadGeo(dir: string): Geo {
  const world = JSON.parse(readFileSync(join(dir, "v2/world.json"), "utf8"))
  const { minX, minY, nx, ny } = world.terrain
  const base = new Float32Array(nx * ny).fill(Infinity)
  const top = new Float32Array(nx * ny).fill(-Infinity)
  for (const p of world.prisms) {
    const ring: number[] = p.ring
    const holes: number[][] = p.holes ?? []
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    for (let i = 0; i < ring.length; i += 2) {
      x0 = Math.min(x0, ring[i]); x1 = Math.max(x1, ring[i])
      y0 = Math.min(y0, ring[i + 1]); y1 = Math.max(y1, ring[i + 1])
    }
    const i0 = Math.max(0, Math.floor(x0 - minX)), i1 = Math.min(nx - 1, Math.floor(x1 - minX))
    const j0 = Math.max(0, Math.floor(y0 - minY)), j1 = Math.min(ny - 1, Math.floor(y1 - minY))
    for (let j = j0; j <= j1; j++) {
      const y = minY + j + 0.5
      for (let i = i0; i <= i1; i++) {
        const x = minX + i + 0.5
        if (!inside(ring, x, y) || holes.some((h) => inside(h, x, y))) continue
        const k = j * nx + i
        if (p.base < base[k]) base[k] = p.base
        if (p.top > top[k]) top[k] = p.top
      }
    }
  }
  const raw = readFileSync(join(dir, "v2/terrain.i16"))
  const ground = new Float32Array(nx * ny)
  for (let k = 0; k < nx * ny; k++) ground[k] = raw.readInt16LE(2 * k) * 0.01
  // coarse walk grid: a cell is blocked when any 1 m cell within 3 m of it is a wall for a mech on the ground
  const wall = new Uint8Array(nx * ny)
  const roofs: number[] = []
  for (let k = 0; k < nx * ny; k++) {
    if (top[k] === -Infinity) continue
    if (base[k] < ground[k] + 9 && top[k] > ground[k] + 1.2) wall[k] = 1
    if (top[k] - ground[k] > 4 && top[k] - ground[k] < 45 && k % 7 === 0) roofs.push(minX + (k % nx) + 0.5, minY + Math.floor(k / nx) + 0.5, top[k])
  }
  const cs = 4, cnx = Math.ceil(nx / cs), cny = Math.ceil(ny / cs)
  const blocked = new Uint8Array(cnx * cny)
  for (let cj = 0; cj < cny; cj++) for (let ci = 0; ci < cnx; ci++) {
    let b = 0
    const i0 = Math.max(0, ci * cs - 3), i1 = Math.min(nx - 1, ci * cs + cs + 2)
    const j0 = Math.max(0, cj * cs - 3), j1 = Math.min(ny - 1, cj * cs + cs + 2)
    for (let j = j0; j <= j1 && !b; j++) for (let i = i0; i <= i1; i++) if (wall[j * nx + i]) { b = 1; break }
    if (!b && (ci === 0 || cj === 0 || ci === cnx - 1 || cj === cny - 1)) b = 1
    blocked[cj * cnx + ci] = b
  }
  return { minX, minY, nx, ny, bounds: world.bounds, base, top, ground, cs, cnx, cny, blocked, roofs }
}

export function groundAt(g: Geo, x: number, y: number): number {
  const fx = Math.min(g.nx - 1.001, Math.max(0, x - g.minX)), fy = Math.min(g.ny - 1.001, Math.max(0, y - g.minY))
  const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j, k = j * g.nx + i, a = g.ground
  return (a[k] * (1 - tx) + a[k + 1] * tx) * (1 - ty) + (a[k + g.nx] * (1 - tx) + a[k + g.nx + 1] * tx) * ty
}

const cell = (g: Geo, x: number, y: number) => {
  const i = Math.floor(x - g.minX), j = Math.floor(y - g.minY)
  return i < 0 || j < 0 || i >= g.nx || j >= g.ny ? -1 : j * g.nx + i
}

export function solidAt(g: Geo, x: number, y: number, z: number): boolean {
  const k = cell(g, x, y)
  if (k < 0) return true
  if (z >= g.base[k] && z <= g.top[k]) return true
  return z < groundAt(g, x, y)
}

/** Distance along the ray from `o` in unit direction `d` to the first solid, or `max` when clear. */
export function rayDist(g: Geo, o: Vec3, d: Vec3, max: number, step = 1): number {
  for (let s = step * 0.5; s < max; s += step) if (solidAt(g, o[0] + d[0] * s, o[1] + d[1] * s, o[2] + d[2] * s)) return s
  return max
}

/** True when the straight line a -> b is clear, ignoring the last `skipEnd` meters. */
export function clear(g: Geo, a: Vec3, b: Vec3, skipEnd = 1.5): boolean {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]
  const len = Math.hypot(dx, dy, dz)
  if (len <= skipEnd + 0.5) return true
  return rayDist(g, a, [dx / len, dy / len, dz / len], len - skipEnd) >= len - skipEnd
}

/**
 * Surface a mech with feet at height z stands on at (x, y): the roof when the feet are at or above it (within
 * stepUp), the ground when the prism clears the head, NaN when the prism is a wall here.
 */
export function floorAt(g: Geo, x: number, y: number, z: number, stepUp: number, height: number): number {
  const k = cell(g, x, y)
  if (k < 0) return NaN
  const gr = groundAt(g, x, y)
  const tp = g.top[k]
  if (tp === -Infinity || tp <= gr) return gr
  if (z >= tp - stepUp) return tp
  if (g.base[k] >= Math.max(z, gr) + height) return gr
  return NaN
}

// ---- coarse A* for house bots ----
const cellOf = (g: Geo, x: number, y: number) => {
  const ci = Math.min(g.cnx - 1, Math.max(0, Math.floor((x - g.minX) / g.cs))), cj = Math.min(g.cny - 1, Math.max(0, Math.floor((y - g.minY) / g.cs)))
  return cj * g.cnx + ci
}
export const walkable = (g: Geo, x: number, y: number) => !g.blocked[cellOf(g, x, y)]

function nearestFree(g: Geo, c: number): number {
  if (!g.blocked[c]) return c
  const ci = c % g.cnx, cj = Math.floor(c / g.cnx)
  for (let r = 1; r < 40; r++) {
    let best = -1, bd = Infinity
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue
      const i = ci + di, j = cj + dj
      if (i < 0 || j < 0 || i >= g.cnx || j >= g.cny) continue
      const k = j * g.cnx + i
      if (!g.blocked[k] && di * di + dj * dj < bd) { bd = di * di + dj * dj; best = k }
    }
    if (best >= 0) return best
  }
  return c
}

let gs: Float32Array | null = null, stamp: Int32Array, from: Int32Array, closed: Int32Array, curStamp = 0
/** Straight coarse-grid walk check between two points. */
export function freeLine(g: Geo, ax: number, ay: number, bx: number, by: number): boolean {
  const len = Math.hypot(bx - ax, by - ay), n = Math.ceil(len / 2)
  for (let i = 0; i <= n; i++) {
    const f = n ? i / n : 0
    if (g.blocked[cellOf(g, ax + (bx - ax) * f, ay + (by - ay) * f)]) return false
  }
  return true
}

/** A* on the coarse grid. Returns waypoints [x0, y0, x1, y1, ...] from start to goal (string-pulled), or null. */
export function findPath(g: Geo, sx: number, sy: number, tx: number, ty: number): number[] | null {
  const n = g.cnx * g.cny
  if (!gs) { gs = new Float32Array(n); stamp = new Int32Array(n); from = new Int32Array(n); closed = new Int32Array(n) }
  curStamp++
  const s = nearestFree(g, cellOf(g, sx, sy)), t = nearestFree(g, cellOf(g, tx, ty))
  const ti = t % g.cnx, tj = Math.floor(t / g.cnx)
  const h = (c: number) => { const dx = Math.abs((c % g.cnx) - ti), dy = Math.abs(Math.floor(c / g.cnx) - tj); return Math.max(dx, dy) + 0.4142 * Math.min(dx, dy) }
  const heapC: number[] = [s], heapF: number[] = [h(s)]
  gs[s] = 0; stamp[s] = curStamp; from[s] = -1
  let found = false, iter = 0
  while (heapC.length && iter++ < 60000) {
    // pop min
    const c = heapC[0]
    const lc = heapC.pop()!, lf = heapF.pop()!
    if (heapC.length) {
      let i = 0
      const len = heapC.length
      for (;;) {
        let m = i
        const l = 2 * i + 1, r = l + 1
        const fm = lf
        let best = fm
        if (l < len && heapF[l] < best) { m = l; best = heapF[l] }
        if (r < len && heapF[r] < best) { m = r }
        if (m === i) break
        heapC[i] = heapC[m]; heapF[i] = heapF[m]; i = m
      }
      heapC[i] = lc; heapF[i] = lf
    }
    if (closed[c] === curStamp) continue
    closed[c] = curStamp
    if (c === t) { found = true; break }
    const ci = c % g.cnx, cj = Math.floor(c / g.cnx)
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue
      const i2 = ci + di, j2 = cj + dj
      if (i2 < 0 || j2 < 0 || i2 >= g.cnx || j2 >= g.cny) continue
      const k = j2 * g.cnx + i2
      if (g.blocked[k] || closed[k] === curStamp) continue
      if (di && dj && (g.blocked[cj * g.cnx + i2] || g.blocked[j2 * g.cnx + ci])) continue
      const ng = gs[c] + (di && dj ? 1.4142 : 1)
      if (stamp[k] === curStamp && gs[k] <= ng) continue
      gs[k] = ng; stamp[k] = curStamp; from[k] = c
      // push
      let i = heapC.length
      const f = ng + h(k)
      heapC.push(k); heapF.push(f)
      while (i > 0) {
        const p = (i - 1) >> 1
        if (heapF[p] <= f) break
        heapC[i] = heapC[p]; heapF[i] = heapF[p]; i = p
      }
      heapC[i] = k; heapF[i] = f
    }
  }
  if (!found) return null
  const cells: number[] = []
  for (let c = t; c !== -1; c = from[c]) cells.push(c)
  cells.reverse()
  const pts: number[] = []
  for (const c of cells) pts.push(g.minX + ((c % g.cnx) + 0.5) * g.cs, g.minY + (Math.floor(c / g.cnx) + 0.5) * g.cs)
  // string pull
  const out: number[] = [pts[0], pts[1]]
  let a = 0
  while (a < cells.length - 1) {
    let b = Math.min(cells.length - 1, a + 40)
    while (b > a + 1 && !freeLine(g, pts[2 * a], pts[2 * a + 1], pts[2 * b], pts[2 * b + 1])) b--
    out.push(pts[2 * b], pts[2 * b + 1])
    a = b
  }
  if (walkable(g, tx, ty)) { out[out.length - 2] = tx; out[out.length - 1] = ty }
  return out
}
