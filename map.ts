/**
 * The map, for line-of-sight checks: solid volumes (buildings, stadium, bridges) from v2/world.json and
 * the ground from v2/terrain.i16. Loading never throws; without the map, every line counts as clear.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { type Hello, type Vec3, log } from "./mechfight.ts"

/** Solids on a grid (per cell: lowest base and highest top) plus the ground height at each grid vertex. */
export type GameMap = {
  minX: number
  minY: number
  step: number
  nx: number
  ny: number
  base: Float32Array
  top: Float32Array
  /** ground height in meters at each vertex, row-major; null when terrain.i16 can't be read */
  ground: Float32Array | null
}

function inside(ring: number[], x: number, y: number): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i], yi = ring[i + 1], xj = ring[j], yj = ring[j + 1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/** Read one map file, trying the folder itself and an `arena/` inside it. */
function readMapFile(dir: string, file: string): Buffer | null {
  for (const path of [join(dir, file), join(dir, "arena", file)]) {
    try {
      return readFileSync(path)
    } catch {
      // try the next place
    }
  }
  return null
}

export function loadMap(hello: Hello): GameMap | null {
  try {
    const dir = hello?.map?.dir
    if (typeof dir !== "string" || !dir) {
      log("no map folder in hello, firing without cover checks")
      return null
    }
    const files: string[] = hello.map.files ?? []
    const raw = readMapFile(dir, files.find((f) => f.endsWith("world.json")) ?? "v2/world.json")
    if (!raw) {
      log("map not found under", dir, "- firing without cover checks")
      return null
    }
    const world = JSON.parse(raw.toString("utf8"))
    const { minX, minY, nx, ny } = world.terrain
    const step: number = world.terrain.step ?? 1
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
      const i0 = Math.max(0, Math.floor((x0 - minX) / step)), i1 = Math.min(nx - 1, Math.floor((x1 - minX) / step))
      const j0 = Math.max(0, Math.floor((y0 - minY) / step)), j1 = Math.min(ny - 1, Math.floor((y1 - minY) / step))
      for (let j = j0; j <= j1; j++) {
        const y = minY + (j + 0.5) * step
        for (let i = i0; i <= i1; i++) {
          const x = minX + (i + 0.5) * step
          if (!inside(ring, x, y) || holes.some((h) => inside(h, x, y))) continue
          const k = j * nx + i
          if (p.base < base[k]) base[k] = p.base
          if (p.top > top[k]) top[k] = p.top
        }
      }
    }
    const ground = loadGround(dir, files, world.terrain.scale ?? 0.01, nx * ny)
    return { minX, minY, step, nx, ny, base, top, ground }
  } catch (e) {
    log("could not read the map, firing without cover checks:", e)
    return null
  }
}

/** Ground heights from terrain.i16: little-endian int16 centimeters, nx × ny vertices, row-major (protocol §11). */
function loadGround(dir: string, files: string[], scale: number, n: number): Float32Array | null {
  try {
    const raw = readMapFile(dir, files.find((f) => f.endsWith(".i16")) ?? "v2/terrain.i16")
    if (!raw || raw.length < n * 2) {
      log("terrain missing or short, cover checks ignore hills")
      return null
    }
    const ground = new Float32Array(n)
    for (let k = 0; k < n; k++) ground[k] = raw.readInt16LE(2 * k) * scale
    return ground
  } catch (e) {
    log("could not read the terrain, cover checks ignore hills:", e)
    return null
  }
}

/** Ground height at (x, y), sampled bilinearly. -Infinity off the map or without terrain. */
export function groundAt(m: GameMap, x: number, y: number): number {
  const g = m.ground
  if (!g) return -Infinity
  const fx = (x - m.minX) / m.step, fy = (y - m.minY) / m.step
  if (fx < 0 || fy < 0 || fx > m.nx - 1 || fy > m.ny - 1) return -Infinity
  const i = Math.min(m.nx - 2, Math.floor(fx)), j = Math.min(m.ny - 2, Math.floor(fy))
  const tx = fx - i, ty = fy - j
  const k = j * m.nx + i
  return (g[k] * (1 - tx) + g[k + 1] * tx) * (1 - ty) + (g[k + m.nx] * (1 - tx) + g[k + m.nx + 1] * tx) * ty
}

/** True when no building, stadium, bridge or hill sits on the straight line from a to b. Trees never stop shots. */
export function clearLine(m: GameMap | null, a: Vec3, b: Vec3, skipStart = 3, skipEnd = 2.5): boolean {
  if (!m) return true
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const usable = len - skipStart - skipEnd
  if (usable <= 0) return true
  const steps = Math.ceil(usable / 0.75)
  for (let n = 0; n <= steps; n++) {
    const f = (skipStart + (usable * n) / steps) / len
    const x = a[0] + (b[0] - a[0]) * f
    const y = a[1] + (b[1] - a[1]) * f
    const z = a[2] + (b[2] - a[2]) * f
    const i = Math.floor((x - m.minX) / m.step), j = Math.floor((y - m.minY) / m.step)
    if (i < 0 || j < 0 || i >= m.nx || j >= m.ny) continue
    const k = j * m.nx + i
    if (z >= m.base[k] && z <= m.top[k]) return false
    if (z < groundAt(m, x, y)) return false
  }
  return true
}

/**
 * P48 (TREE_RETREAT_ON): map trees for sight checks only (protocol §8, §11: trees block vision, never shots or walking).
 * Flat columns from v2/world.json `trees` plus a 16 m bucket grid. Null when the file has no trees or can't be read.
 */
export type Trees = {
  x: number[]; y: number[]; z: number[]; top: number[]; cb: number[]; cr: number[]; cx: number[]; cy: number[]; tr: number[]
  density: number; blockT: number; bs: number; bx0: number; by0: number; bnx: number; bny: number; buckets: number[][]
}

export function loadTrees(hello: Hello): Trees | null {
  try {
    const dir = hello?.map?.dir
    if (typeof dir !== "string" || !dir) return null
    const files: string[] = hello.map.files ?? []
    const raw = readMapFile(dir, files.find((f) => f.endsWith("world.json")) ?? "v2/world.json")
    if (!raw) return null
    const world = JSON.parse(raw.toString("utf8"))
    const F: string[] = world.trees?.fields ?? [], D: number[] = world.trees?.data ?? [], w = F.length
    const n = w ? Math.floor(D.length / w) : 0
    if (!n) return null
    const col = (k: string, dflt?: number[]) => {
      const i = F.indexOf(k)
      if (i < 0) return dflt ?? new Array(n).fill(0)
      const a: number[] = []
      for (let j = 0; j < n; j++) a.push(D[j * w + i])
      return a
    }
    const x = col("x"), y = col("y"), z = col("z"), h = col("height"), cbRel = col("crownBase"), cr = col("crownR"), tr = col("trunkR")
    const cx = col("crownX", x), cy = col("crownY", y)
    const top = x.map((_, j) => z[j] + h[j]), cb = x.map((_, j) => z[j] + cbRel[j])
    const b = world.bounds, bs = 16, bnx = Math.ceil((b.maxX - b.minX) / bs) + 1, bny = Math.ceil((b.maxY - b.minY) / bs) + 1
    const buckets: number[][] = Array.from({ length: bnx * bny }, () => [])
    for (let j = 0; j < n; j++) {
      const r = Math.max(cr[j], tr[j]) + Math.hypot(cx[j] - x[j], cy[j] - y[j])
      const i0 = Math.max(0, Math.floor((x[j] - r - b.minX) / bs)), i1 = Math.min(bnx - 1, Math.floor((x[j] + r - b.minX) / bs))
      const k0 = Math.max(0, Math.floor((y[j] - r - b.minY) / bs)), k1 = Math.min(bny - 1, Math.floor((y[j] + r - b.minY) / bs))
      for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) buckets[k * bnx + i].push(j)
    }
    return {
      x, y, z, top, cb, cr, cx, cy, tr, density: Number(world.rules?.canopyDensity ?? 0), blockT: Number(world.rules?.canopyBlockT ?? 0),
      bs, bx0: b.minX, by0: b.minY, bnx, bny, buckets,
    }
  } catch (e) {
    log("could not read the trees:", e)
    return null
  }
}

/**
 * P48: does a tree stop sight from a to b? A trunk (vertical cylinder trunkR from ground z to crownBase) always does.
 * With `canopy` (the viewer is beyond near_range), crowns (ellipsoids) fade it: transmittance exp(-canopyDensity ×
 * metres inside crowns), stopped below canopyBlockT (protocol §8).
 */
export function treeBlocks(T: Trees, a: Vec3, b: Vec3, canopy: boolean): boolean {
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
      const h2 = dx * dx + dy * dy
      let t = h2 > 0 ? ((T.x[j] - a[0]) * dx + (T.y[j] - a[1]) * dy) / h2 : 0
      t = Math.max(0, Math.min(1, t))
      const qx = a[0] + dx * t - T.x[j], qy = a[1] + dy * t - T.y[j], qz = a[2] + dz * t
      if (qx * qx + qy * qy < T.tr[j] * T.tr[j] && qz >= T.z[j] && qz <= T.cb[j]) return true
      if (!canopy) continue
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
