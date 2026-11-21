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
