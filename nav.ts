/**
 * nav.ts: ground pathfinding for mech-bot (plan §4, Build 3).
 *
 * Standalone: depends only on the kit types. Doug wires it into brain.ts.
 *
 *   const nav = createNav(hello)            // at hello; never throws
 *   nav.path(me.pos, goal, 30000)           // waypoints after `from`, ending at `to`; null if none within budget
 *   nav.eta(me.pos, goal)                   // seconds at walk speed (path length, straight-line fallback)
 *   nav.stuck(me, commandedMove)            // call once per decision; true after ~0.5 s of commanded move with ~no speed
 *
 * The grid:
 * - 1 m vertex surface from v2/terrain.i16. Bridge decks raise the surface when their underside is too low to walk
 *   under (clearance < mech.height); otherwise the underside is walkable and the terrain stays.
 * - Buildings and stadium prisms block (unless low enough to step onto, or high enough to walk under). Blocked
 *   vertices are grown by `INFLATE_M` so paths keep the mech's body off walls.
 * - A vertex is steep when a 4-neighbour differs by more than mech.step_up (1.2 m per 1 m is also ~50°, the
 *   max_slope_deg). Steep vertices block in both directions: no planned drops, no jets (ground routes only).
 * - 2 m planning cells; a cell is free only if all 4 of its vertices are free.
 * A* is 8-connected with no corner cutting, integer costs (10 straight, 14 diagonal, +4 per metre climbed), an
 * octile heuristic weighted ×1.1 (bounded-suboptimal, ≤10% longer), ties broken toward lower h, a typed-array binary heap and generation stamps instead of clears.
 * Connected components are labelled at build, so a query across components returns null at once.
 */
import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import type { Hello, SelfObs, Vec3 } from "./mechfight.ts"

export interface Nav {
  /** Waypoints after `from`, ending at `to` (or the nearest reachable cell to it); null if no path within `budget` node expansions. */
  path(from: Vec3, to: Vec3, budget: number): Vec3[] | null
  /** Seconds at walk speed along the path; straight-line distance when no path is found cheaply. */
  eta(from: Vec3, to: Vec3): number
  /** Stateful: call once per decision. True once the move command has been held for STUCK_S with almost no speed. */
  stuck(me: SelfObs, commanded: [number, number]): boolean
}

const CELL = 2 // m per planning cell
const INFLATE_M = 2.5 // grow walls by this much: the mech radius, so planned paths keep the body off walls
const SNAP_CELLS = 10 // search this far (cells) for a free cell when an endpoint sits in a blocked one
const ETA_BUDGET = 20000
const STUCK_S = 0.5
const STUCK_SPEED_FRAC = 0.15 // of walk speed
const COST_STRAIGHT = 10
const COST_DIAG = 14
const COST_PER_M_UP = 4
const H_WEIGHT_X10 = 11 // heuristic × 1.1: paths at most 10% longer than optimal, far fewer expansions

/** The planning grid. Exported for tools/ (bench, scenario harness); brain.ts should only need `createNav`. */
export type NavGrid = {
  minX: number // world x of vertex (0, 0)
  minY: number
  vnx: number // 1 m vertex grid
  vny: number
  surf: Float32Array // walking surface height per vertex
  nx: number // 2 m cell grid
  ny: number
  free: Uint8Array // 1 = walkable cell
  h: Float32Array // mean surface height per cell
  comp: Int32Array // connected component id per free cell, -1 if blocked
  freeCells: Int32Array // every free cell index, for sampling
}

type Prism = { kind: string; base: number; top: number; ring: number[]; holes: number[][] }

/** Build the grid from the map files named in hello. Throws on bad input; createNav catches. */
export function buildNavGrid(hello: Hello): NavGrid {
  const dir = resolve(hello.map.dir)
  const worldFile = hello.map.files.find((f) => f.endsWith("world.json")) ?? "v2/world.json"
  const world = JSON.parse(readFileSync(join(dir, worldFile), "utf8"))
  const T = world.terrain
  const terrFile = hello.map.files.find((f) => f.endsWith(".i16")) ?? join(worldFile, "..", T.file)
  const buf = readFileSync(join(dir, terrFile))
  const vnx: number = T.nx, vny: number = T.ny, minX: number = T.minX, minY: number = T.minY
  const scale: number = T.scale ?? 0.01
  if ((T.step ?? 1) !== 1) throw new Error("nav: terrain step must be 1 m")
  const V = vnx * vny
  if (buf.byteLength < V * 2) throw new Error("nav: terrain file too short")
  const raw = new Int16Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + V * 2))
  const terr = new Float32Array(V)
  for (let k = 0; k < V; k++) terr[k] = raw[k] * scale

  const mech = hello.config?.mech ?? {}
  const stepUp = mech.step_up ?? 1.2
  const height = mech.height ?? 9

  // --- rasterise prisms onto the vertex grid (scanline, even-odd over ring + holes)
  const surf = Float32Array.from(terr)
  const occ = new Uint8Array(V)
  for (const p of world.prisms as Prism[]) {
    const rings = [p.ring, ...(p.holes ?? [])]
    const ys = p.ring.filter((_, i) => i & 1)
    const j0 = Math.max(0, Math.ceil(Math.min(...ys) - minY)), j1 = Math.min(vny - 1, Math.floor(Math.max(...ys) - minY))
    const xs: number[] = []
    for (let j = j0; j <= j1; j++) {
      const y = minY + j
      xs.length = 0
      for (const r of rings) {
        for (let a = 0, b = r.length - 2; a < r.length; b = a, a += 2) {
          const y1 = r[b + 1], y2 = r[a + 1]
          if (y1 <= y !== y2 <= y) xs.push(r[b] + ((y - y1) * (r[a] - r[b])) / (y2 - y1))
        }
      }
      xs.sort((u, v) => u - v)
      for (let s = 0; s + 1 < xs.length; s += 2) {
        const i0 = Math.max(0, Math.ceil(xs[s] - minX)), i1 = Math.min(vnx - 1, Math.floor(xs[s + 1] - minX))
        for (let i = i0; i <= i1; i++) {
          const v = j * vnx + i, g = terr[v]
          if (p.base - g >= height) continue // walk under (bridge undersides, high overhangs)
          if (p.top - g <= stepUp || p.kind === "bridge") {
            if (p.top > surf[v]) surf[v] = p.top // a surface you stand on (deck, low plinth)
          } else occ[v] = 1
        }
      }
    }
  }

  // --- blocked vertices: walls grown by INFLATE_M, plus steep vertices
  const blocked = new Uint8Array(V)
  const R = INFLATE_M, Ri = Math.ceil(R), offs: number[] = []
  for (let dy = -Ri; dy <= Ri; dy++) for (let dx = -Ri; dx <= Ri; dx++) if (dx * dx + dy * dy <= R * R) offs.push(dx, dy)
  for (let j = 0; j < vny; j++) {
    for (let i = 0; i < vnx; i++) {
      const v = j * vnx + i
      if (!occ[v]) continue
      for (let o = 0; o < offs.length; o += 2) {
        const x = i + offs[o], y = j + offs[o + 1]
        if (x >= 0 && y >= 0 && x < vnx && y < vny) blocked[y * vnx + x] = 1
      }
    }
  }
  for (let j = 0; j < vny; j++) {
    for (let i = 0; i < vnx; i++) {
      const v = j * vnx + i
      if (occ[v]) continue
      const z = surf[v]
      if (i + 1 < vnx && !occ[v + 1] && Math.abs(surf[v + 1] - z) > stepUp) blocked[v] = blocked[v + 1] = 1
      if (j + 1 < vny && !occ[v + vnx] && Math.abs(surf[v + vnx] - z) > stepUp) blocked[v] = blocked[v + vnx] = 1
    }
  }
  // Map edge is a wall: keep one cell of margin.
  for (let i = 0; i < vnx; i++) blocked[i] = blocked[(vny - 1) * vnx + i] = 1
  for (let j = 0; j < vny; j++) blocked[j * vnx] = blocked[j * vnx + vnx - 1] = 1

  // --- 2 m cells
  const nx = vnx >> 1, ny = vny >> 1, N = nx * ny
  const free = new Uint8Array(N), h = new Float32Array(N)
  for (let J = 0; J < ny; J++) {
    for (let I = 0; I < nx; I++) {
      const v = 2 * J * vnx + 2 * I
      const c = J * nx + I
      h[c] = (surf[v] + surf[v + 1] + surf[v + vnx] + surf[v + vnx + 1]) * 0.25
      free[c] = blocked[v] | blocked[v + 1] | blocked[v + vnx] | blocked[v + vnx + 1] ? 0 : 1
    }
  }

  // --- components (same moves as A*: 8-connected, no corner cutting)
  const comp = new Int32Array(N).fill(-1)
  const stack = new Int32Array(N)
  let ncomp = 0, nfree = 0
  for (let s = 0; s < N; s++) {
    if (!free[s] || comp[s] >= 0) continue
    let sp = 0
    stack[sp++] = s
    comp[s] = ncomp
    while (sp > 0) {
      const c = stack[--sp]
      nfree++
      const cx = c % nx, cy = (c / nx) | 0
      for (let k = 0; k < 8; k++) {
        const x = cx + DX[k], y = cy + DY[k]
        if (x < 0 || y < 0 || x >= nx || y >= ny) continue
        const m = y * nx + x
        if (!free[m] || comp[m] >= 0) continue
        if (k >= 4 && (!free[cy * nx + x] || !free[y * nx + cx])) continue
        comp[m] = ncomp
        stack[sp++] = m
      }
    }
    ncomp++
  }
  const freeCells = new Int32Array(nfree)
  for (let c = 0, n = 0; c < N; c++) if (free[c]) freeCells[n++] = c
  return { minX, minY, vnx, vny, surf, nx, ny, free, h, comp, freeCells }
}

const DX = [1, -1, 0, 0, 1, 1, -1, -1]
const DY = [0, 0, 1, -1, 1, -1, 1, -1]

/** Build the Nav at hello. Never throws: on any failure it logs and returns a straight-line Nav. */
export function createNav(hello: Hello): Nav {
  const walk = hello?.config?.mech?.walk_speed ?? 11.7
  const decideHz = (hello?.config?.match?.tick_hz ?? 20) / (hello?.config?.match?.decide_every ?? 2)
  const stuck = makeStuck(walk, Math.max(1, Math.round(STUCK_S * decideHz)))
  try {
    const g = buildNavGrid(hello)
    const nav = gridNav(g, walk, stuck)
    warmUp(g, nav)
    return nav
  } catch (e) {
    console.error("nav: grid build failed, using straight lines:", e)
    return straightNav(walk, stuck)
  }
}

function straightNav(walk: number, stuck: Nav["stuck"]): Nav {
  return {
    path: (_from, to) => [[to[0], to[1], to[2]]],
    eta: (from, to) => Math.hypot(to[0] - from[0], to[1] - from[1]) / walk,
    stuck,
  }
}

function makeStuck(walk: number, needed: number): Nav["stuck"] {
  let count = 0
  return (me, commanded) => {
    const cmd = Math.hypot(commanded[0], commanded[1])
    const speed = Math.hypot(me.vel[0], me.vel[1])
    if (cmd > 0.3 && speed < STUCK_SPEED_FRAC * walk) count++
    else count = 0
    return count >= needed
  }
}

function warmUp(g: NavGrid, nav: Nav) {
  let seed = 12345
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff)
  const F = g.freeCells
  if (F.length === 0) return
  for (let q = 0; q < 20; q++) {
    const a = F[(rnd() * F.length) | 0], b = F[(rnd() * F.length) | 0]
    nav.path(cellPos(g, a), cellPos(g, b), 20000)
  }
}

function cellPos(g: NavGrid, c: number): Vec3 {
  const I = c % g.nx, J = (c / g.nx) | 0
  return [g.minX + I * CELL + 0.5 * CELL - 0.5, g.minY + J * CELL + 0.5 * CELL - 0.5, g.h[c]]
}

function gridNav(g: NavGrid, walk: number, stuck: Nav["stuck"]): Nav {
  const { nx, ny, free, h, comp, minX, minY, vnx, vny, surf } = g
  const N = nx * ny
  const gcost = new Int32Array(N)
  const came = new Int32Array(N)
  const seen = new Uint32Array(N) // gcost/came valid when seen[c] === gen
  const closed = new Uint32Array(N)
  let gen = 0
  // Allowed moves per free cell as a bitmask over DX/DY (in bounds, target free, no corner cutting).
  const DOFF = DX.map((dx, k) => DY[k] * nx + dx)
  const moves = new Uint8Array(N)
  for (let c = 0; c < N; c++) {
    if (!free[c]) continue
    const cx = c % nx, cy = (c / nx) | 0
    for (let k = 0; k < 8; k++) {
      const x = cx + DX[k], y = cy + DY[k]
      if (x < 0 || y < 0 || x >= nx || y >= ny || !free[y * nx + x]) continue
      if (k >= 4 && (!free[cy * nx + x] || !free[y * nx + cx])) continue
      moves[c] |= 1 << k
    }
  }
  let hk = new Int32Array(1 << 16), hv = new Int32Array(1 << 16), hn = 0
  const heapPush = (k: number, v: number) => {
    if (hn >= hk.length) {
      const k2 = new Int32Array(hk.length * 2); k2.set(hk); hk = k2
      const v2 = new Int32Array(hv.length * 2); v2.set(hv); hv = v2
    }
    let i = hn++
    while (i > 0) {
      const p = (i - 1) >> 1
      if (hk[p] <= k) break
      hk[i] = hk[p]; hv[i] = hv[p]; i = p
    }
    hk[i] = k; hv[i] = v
  }
  const heapPop = () => {
    const top = hv[0]
    const k = hk[--hn], v = hv[hn]
    let i = 0
    for (;;) {
      let c = 2 * i + 1
      if (c >= hn) break
      if (c + 1 < hn && hk[c + 1] < hk[c]) c++
      if (hk[c] >= k) break
      hk[i] = hk[c]; hv[i] = hv[c]; i = c
    }
    hk[i] = k; hv[i] = v
    return top
  }

  const cellOf = (x: number, y: number) => {
    const I = Math.min(nx - 1, Math.max(0, Math.floor((x - minX + 0.5) / CELL)))
    const J = Math.min(ny - 1, Math.max(0, Math.floor((y - minY + 0.5) / CELL)))
    return J * nx + I
  }
  const surfaceZ = (x: number, y: number) => {
    const fx = Math.min(vnx - 1.001, Math.max(0, x - minX)), fy = Math.min(vny - 1.001, Math.max(0, y - minY))
    const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j, v = j * vnx + i
    return (surf[v] * (1 - tx) + surf[v + 1] * tx) * (1 - ty) + (surf[v + vnx] * (1 - tx) + surf[v + vnx + 1] * tx) * ty
  }
  /** Nearest free cell to c (in component `want` if >= 0), within SNAP_CELLS; -1 if none. */
  const snap = (c: number, want: number) => {
    if (free[c] && (want < 0 || comp[c] === want)) return c
    const cx = c % nx, cy = (c / nx) | 0
    let best = -1, bestD = Infinity
    for (let r = 1; r <= SNAP_CELLS && r * r < bestD; r++) {
      for (let y = cy - r; y <= cy + r; y++) {
        if (y < 0 || y >= ny) continue
        const edge = y === cy - r || y === cy + r
        for (let x = cx - r; x <= cx + r; x += edge ? 1 : 2 * r) {
          if (x < 0 || x >= nx) continue
          const m = y * nx + x
          if (!free[m] || (want >= 0 && comp[m] !== want)) continue
          const d = (x - cx) ** 2 + (y - cy) ** 2
          if (d < bestD) { bestD = d; best = m }
        }
      }
    }
    return best
  }
  /** Nearest free cell to c in component `want`, over the whole map (one linear scan, under 1 ms); -1 if none. */
  const nearestInComp = (c: number, want: number) => {
    const cx = c % nx, cy = (c / nx) | 0, F = g.freeCells
    let best = -1, bestD = Infinity
    for (let n = 0; n < F.length; n++) {
      const m = F[n]
      if (comp[m] !== want) continue
      const d = (m % nx - cx) ** 2 + (((m / nx) | 0) - cy) ** 2
      if (d < bestD) { bestD = d; best = m }
    }
    return best
  }
  /** Every cell the segment a→b touches is free (a conservative supercover walk). */
  const clear = (a: number, b: number) => {
    let x = a % nx, y = (a / nx) | 0
    const x1 = b % nx, y1 = (b / nx) | 0
    const dx = Math.abs(x1 - x), dy = Math.abs(y1 - y), sx = x1 > x ? 1 : -1, sy = y1 > y ? 1 : -1
    let err = dx - dy
    for (let n = dx + dy; n > 0; n--) {
      const e2 = 2 * err
      if (e2 > -dy && e2 < dx) {
        // diagonal step: require both side cells free too
        if (!free[y * nx + x + sx] || !free[(y + sy) * nx + x]) return false
        err += -dy + dx; x += sx; y += sy; n--
      } else if (e2 > -dy) { err -= dy; x += sx }
      else { err += dx; y += sy }
      if (!free[y * nx + x]) return false
    }
    return true
  }

  const astar = (s: number, t: number, budget: number): number[] | null => {
    if (++gen === 0xffffffff) { seen.fill(0); closed.fill(0); gen = 1 }
    hn = 0
    const tx = t % nx, ty = (t / nx) | 0
    const heur = (x: number, y: number) => {
      const ex = Math.abs(x - tx), ey = Math.abs(y - ty)
      return ex > ey ? 10 * ex + 4 * ey : 10 * ey + 4 * ex
    }
    seen[s] = gen; gcost[s] = 0; came[s] = -1
    heapPush(heur(s % nx, (s / nx) | 0) * 8192, s)
    let exp = 0
    while (hn > 0) {
      const c = heapPop()
      if (closed[c] === gen) continue
      if (c === t) {
        const out: number[] = []
        for (let k = c; k >= 0; k = came[k]) out.push(k)
        return out.reverse()
      }
      closed[c] = gen
      if (++exp > budget) return null
      const cx = c % nx, cy = (c / nx) | 0, gc = gcost[c], hc = h[c]
      const mask = moves[c]
      for (let k = 0; k < 8; k++) {
        if (!(mask & (1 << k))) continue
        const m = c + DOFF[k]
        if (closed[m] === gen) continue
        const x = cx + DX[k], y = cy + DY[k]
        const up = h[m] - hc
        const nd = gc + (k < 4 ? COST_STRAIGHT : COST_DIAG) + (up > 0 ? Math.round(up * COST_PER_M_UP) : 0)
        if (seen[m] !== gen || nd < gcost[m]) {
          seen[m] = gen; gcost[m] = nd; came[m] = c
          const hh = (heur(x, y) * H_WEIGHT_X10) / 10 | 0
          heapPush((nd + hh) * 8192 + Math.min(hh, 8191), m)
        }
      }
    }
    return null
  }

  const path = (from: Vec3, to: Vec3, budget: number): Vec3[] | null => {
    const s = snap(cellOf(from[0], from[1]), -1)
    if (s < 0) return null
    const t0 = cellOf(to[0], to[1])
    let t = snap(t0, comp[s])
    if (t < 0) t = nearestInComp(t0, comp[s]) // goal deep in a solid or in another region: nearest reachable cell
    if (t < 0) return null
    const exact = t === t0 || (free[t0] && comp[t0] === comp[s])
    const end: Vec3 = exact ? [to[0], to[1], surfaceZ(to[0], to[1])] : cellPos(g, t)
    if (s === t) return [end]
    const cells = astar(s, t, budget)
    if (!cells) return null
    // String-pull: keep a cell only when the straight line from the last kept cell can't reach the next one.
    const out: Vec3[] = []
    let anchor = 0
    for (let i = 2; i < cells.length; i++) {
      if (!clear(cells[anchor], cells[i])) {
        anchor = i - 1
        out.push(cellPos(g, cells[anchor]))
      }
    }
    out.push(end)
    return out
  }

  const eta = (from: Vec3, to: Vec3): number => {
    const p = path(from, to, ETA_BUDGET)
    if (!p) return Math.hypot(to[0] - from[0], to[1] - from[1]) / walk
    let d = 0, px = from[0], py = from[1]
    for (const w of p) { d += Math.hypot(w[0] - px, w[1] - py); px = w[0]; py = w[1] }
    return d / walk
  }

  return { path, eta, stuck }
}
