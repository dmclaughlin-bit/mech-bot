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
 *   max_slope_deg). Steep vertices block in both directions: on this grid, no planned drops and no jets (ground
 *   routes only); Build 33's jet grid below adds hops across them.
 * - 2 m planning cells; a cell is free only if all 4 of its vertices are free.
 * A* is 8-connected with no corner cutting, integer costs (10 straight, 14 diagonal, +4 per metre climbed), an
 * octile heuristic weighted ×1.1 (bounded-suboptimal, ≤10% longer), ties broken toward lower h, a typed-array binary heap and generation stamps instead of clears.
 * Connected components are labelled at build, so a query across components returns null at once.
 *
 * Build 33 (jet routes, JET_ROUTE_ON in params.ts): a second "jet" grid is built next to the ground grid above, which
 * stays exactly as it was. In the jet grid, buildings and stadium prisms standing on the ground no taller than the
 * climb limit (jump + jet with the energy reserve kept, capped at JET_CLIMB_MAX_M) are roofs you can stand on; their
 * edges are ledges grown by INFLATE_M on both sides, like walls. Hop links join two free cells across a band of
 * ledge cells (straight or diagonal, at most HOP_CELLS cells apart, never through a wall cell): climb up at most the
 * climb limit, drop down at most DROP_MAX_M (the config has no fall damage). A hop costs its length plus a time and
 * energy surcharge, so a ground route of similar length still wins. `path(..., jet = true)` plans on the jet grid;
 * the landing waypoint of a hop carries `hop` (see Hop) for the executor in brain.ts. Without `jet`, or with
 * JET_ROUTE_ON false, routes come from the ground grid only, exactly as before.
 */
import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import type { Hello, SelfObs, Vec3 } from "./mechfight.ts"
import { DROP_MAX_M, JET_CLIMB_MARGIN_M, JET_CLIMB_MAX_M, JET_ENERGY_RESERVE, JET_ROUTE_ON } from "./params.ts"

/** Build 33: a planned ledge crossing, carried by the waypoint that lands it (`Waypoint.hop`). Shared, never mutated. */
export type Hop = {
  /** Takeoff (center of the cell before the ledge band), and where the climb (or drop) starts on the line to the landing. */
  from: [number, number]
  ledge: [number, number]
  /** Highest surface under the band (m), and how far we climb up to it from the takeoff and drop from it to the landing. */
  top: number
  up: number
  down: number
}
export type Waypoint = Vec3 & { hop?: Hop }

export interface Nav {
  /**
   * Waypoints after `from`, ending at `to` (or the nearest reachable cell to it); null if no path within `budget` node
   * expansions. Build 33: `jet` plans on the jet grid (ledge hops allowed) when it was built; hop landings carry `hop`.
   */
  path(from: Vec3, to: Vec3, budget: number, jet?: boolean): Waypoint[] | null
  /** Seconds at walk speed along the path; straight-line distance when no path is found cheaply. */
  eta(from: Vec3, to: Vec3): number
  /** Stateful: call once per decision. True once the move command has been held for STUCK_S with almost no speed. */
  stuck(me: SelfObs, commanded: [number, number]): boolean
  /** Build 33: energy we must hold before planning on the jet grid (Infinity without one), and the climb limit it was built for (m). */
  jetNeed: number
  climbMax: number
}

const CELL = 2 // m per planning cell
const INFLATE_M = 2 // grow walls by this much (mech radius is 2.5; 2 keeps 5–6 m alleys open)
const SNAP_CELLS = 10 // search this far (cells) for a free cell when an endpoint sits in a blocked one
const ETA_BUDGET = 20000
const STUCK_S = 0.5
const STUCK_SPEED_FRAC = 0.15 // of walk speed
const COST_STRAIGHT = 10
const COST_DIAG = 14
const COST_PER_M_UP = 4
const H_WEIGHT_X10 = 11 // heuristic × 1.1: paths at most 10% longer than optimal, far fewer expansions
/** Build 33: longest hop (cells, 2 m each) across a ledge band. Two inflated sides (2 m each) plus a thin wall fit in 3. */
const HOP_CELLS = 5
/** Build 33: hop surcharge in cost units (10 = 2 m, about 0.17 s of walking): a climb's approach, jump and hover, then per metre climbed; a drop's fall. */
const HOP_UP_COST = 60
const HOP_PER_M_UP = 15
const HOP_DROP_COST = 30
/** Build 33: metres of jet beyond the climb itself that a crossing burns (hovering over the edge while we drift onto it). */
export const JET_HOVER_M = 3

/**
 * Build 33: jet climbing numbers from hello.config.mech. Jetting holds the rise near max_rise_speed less one tick of
 * gravity (protocol §7: 100 energy climbs about 60 m). A climb of h metres burns jet_drain × (h + margin + hover) / rise.
 * The climb limit is what (energy - JET_ENERGY_RESERVE) pays for, capped at JET_CLIMB_MAX_M; `need` is the energy that
 * pays for a climb at the limit and still keeps the reserve.
 */
export function jetNumbers(hello: Hello): { rise: number; climbMax: number; need: number; perM: number } {
  const mech = hello?.config?.mech ?? {}
  const hz = hello?.config?.match?.tick_hz ?? 20
  const rise = Math.max(1, (mech.max_rise_speed ?? 10) - (mech.gravity ?? 22) / hz)
  const perM = (mech.jet_drain ?? 15) / rise
  const spare = (mech.energy ?? 100) - JET_ENERGY_RESERVE
  const climbMax = Math.max(0, Math.min(JET_CLIMB_MAX_M, spare / perM - JET_CLIMB_MARGIN_M - JET_HOVER_M))
  return { rise, climbMax, perM, need: JET_ENERGY_RESERVE + perM * (climbMax + JET_CLIMB_MARGIN_M + JET_HOVER_M) }
}

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
  /** Build 33, jet grid only: hop links per cell (CSR: cell c's links are start[c] .. start[c + 1] - 1). */
  links?: { start: Int32Array; to: Int32Array; cost: Int32Array; hop: Hop[] }
}

type Prism = { kind: string; base: number; top: number; ring: number[]; holes: number[][] }

/**
 * Build the grid from the map files named in hello. Throws on bad input; createNav catches.
 * Build 33: with `jet` (climb limit and drop limit, m), build the jet grid instead (see the header).
 */
export function buildNavGrid(hello: Hello, jet?: { climbMax: number; dropMax: number }): NavGrid {
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
  // Build 33 (jet grid): vertices on a climbable roof, whose edges are ledges grown like walls.
  const roof = jet ? new Uint8Array(V) : null
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
          } else if (roof && p.base - g <= stepUp && p.top - g <= jet!.climbMax) {
            if (p.top > surf[v]) surf[v] = p.top // Build 33: a roof we can jet onto
            roof[v] = 1
          } else occ[v] = 1
        }
      }
    }
  }

  // --- blocked vertices: walls grown by INFLATE_M, plus steep vertices
  const blocked = new Uint8Array(V)
  const R = INFLATE_M, offs: number[] = []
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dy * dy <= R * R) offs.push(dx, dy)
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
  // Build 33 (jet grid): walls and the map edge are `hard` (no hop crosses them); steep vertices and roof edges are not.
  const hard = roof ? Uint8Array.from(blocked) : null
  const edge = roof ? new Uint8Array(V) : null
  for (let j = 0; j < vny; j++) {
    for (let i = 0; i < vnx; i++) {
      const v = j * vnx + i
      if (occ[v]) continue
      const z = surf[v]
      if (i + 1 < vnx && !occ[v + 1] && Math.abs(surf[v + 1] - z) > stepUp) {
        blocked[v] = blocked[v + 1] = 1
        if (roof && (roof[v] || roof[v + 1])) edge![v] = edge![v + 1] = 1
      }
      if (j + 1 < vny && !occ[v + vnx] && Math.abs(surf[v + vnx] - z) > stepUp) {
        blocked[v] = blocked[v + vnx] = 1
        if (roof && (roof[v] || roof[v + vnx])) edge![v] = edge![v + vnx] = 1
      }
    }
  }
  // Build 33: grow roof edges by INFLATE_M on both sides, as walls are, so the body stays off the wall below and on the roof above.
  if (edge) {
    for (let j = 0; j < vny; j++) {
      for (let i = 0; i < vnx; i++) {
        if (!edge[j * vnx + i]) continue
        for (let o = 0; o < offs.length; o += 2) {
          const x = i + offs[o], y = j + offs[o + 1]
          if (x >= 0 && y >= 0 && x < vnx && y < vny) blocked[y * vnx + x] = 1
        }
      }
    }
  }
  // Map edge is a wall: keep one cell of margin.
  for (let i = 0; i < vnx; i++) blocked[i] = blocked[(vny - 1) * vnx + i] = 1
  for (let j = 0; j < vny; j++) blocked[j * vnx] = blocked[j * vnx + vnx - 1] = 1
  if (hard) {
    for (let i = 0; i < vnx; i++) hard[i] = hard[(vny - 1) * vnx + i] = 1
    for (let j = 0; j < vny; j++) hard[j * vnx] = hard[j * vnx + vnx - 1] = 1
  }

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

  const links = hard ? buildLinks(jet!, stepUp, minX, minY, vnx, surf, hard, nx, ny, free, h) : undefined

  // --- components (same moves as A*: 8-connected, no corner cutting; Build 33: plus hops usable both ways)
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
      if (links) {
        for (let e = links.start[c]; e < links.start[c + 1]; e++) {
          const m = links.to[e], hp = links.hop[e]
          if (comp[m] >= 0 || Math.max(hp.up, hp.down) > Math.min(jet!.climbMax, jet!.dropMax)) continue
          comp[m] = ncomp
          stack[sp++] = m
        }
      }
    }
    ncomp++
  }
  const freeCells = new Int32Array(nfree)
  for (let c = 0, n = 0; c < N; c++) if (free[c]) freeCells[n++] = c
  return links ? { minX, minY, vnx, vny, surf, nx, ny, free, h, comp, freeCells, links } : { minX, minY, vnx, vny, surf, nx, ny, free, h, comp, freeCells }
}

/**
 * Build 33: hop links. From each free cell, in each of the 8 directions, step over non-free cells (never a hard one,
 * nor, on a diagonal, past a hard side cell) up to HOP_CELLS; the first free cell found 2 or more cells away is the
 * landing. `top` is the highest vertex surface of the band cells and of their side neighbours (the body is 5 m wide).
 * A link is kept when it climbs at most climbMax, drops at most dropMax, and is a real ledge (one of them > step_up).
 */
function buildLinks(
  jet: { climbMax: number; dropMax: number }, stepUp: number, minX: number, minY: number, vnx: number,
  surf: Float32Array, hard: Uint8Array, nx: number, ny: number, free: Uint8Array, h: Float32Array,
): NonNullable<NavGrid["links"]> {
  const N = nx * ny
  const cellHard = new Uint8Array(N), cellTop = new Float32Array(N)
  for (let J = 0; J < ny; J++) {
    for (let I = 0; I < nx; I++) {
      const v = 2 * J * vnx + 2 * I, c = J * nx + I
      cellHard[c] = hard[v] | hard[v + 1] | hard[v + vnx] | hard[v + vnx + 1]
      cellTop[c] = Math.max(surf[v], surf[v + 1], surf[v + vnx], surf[v + vnx + 1])
    }
  }
  const surfAt = (x: number, y: number) => surf[Math.round(y - minY) * vnx + Math.round(x - minX)]
  const start = new Int32Array(N + 1)
  const to: number[] = [], cost: number[] = [], hops: Hop[] = []
  const center = (c: number): [number, number] => [minX + (c % nx) * CELL + 0.5 * CELL - 0.5, minY + ((c / nx) | 0) * CELL + 0.5 * CELL - 0.5]
  for (let c = 0; c < N; c++) {
    start[c] = to.length
    if (!free[c]) continue
    const cx = c % nx, cy = (c / nx) | 0
    for (let k = 0; k < 8; k++) {
      const dx = DX[k], dy = DY[k]
      let top = -Infinity
      for (let L = 1; L <= HOP_CELLS; L++) {
        const x = cx + dx * L, y = cy + dy * L
        if (x < 1 || y < 1 || x >= nx - 1 || y >= ny - 1) break
        const m = y * nx + x
        if (free[m]) {
          if (L < 2) break
          const up = top - h[c], down = top - h[m]
          if (up > jet.climbMax || down > jet.dropMax || Math.max(up, down) <= stepUp) break
          // Where the climb (or the drop) starts on the line from the takeoff: the first metre whose surface is past step_up.
          const a = center(c), b = center(m), len = Math.hypot(b[0] - a[0], b[1] - a[1])
          let ledge: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
          for (let s = 0.5; s < len; s += 0.5) {
            const px = a[0] + ((b[0] - a[0]) * s) / len, py = a[1] + ((b[1] - a[1]) * s) / len
            if (Math.abs(surfAt(px, py) - h[c]) > stepUp) { ledge = [px, py]; break }
          }
          to.push(m)
          cost.push(L * (k < 4 ? COST_STRAIGHT : COST_DIAG) + (up > stepUp ? HOP_UP_COST + Math.round(up * HOP_PER_M_UP) : 0) + (down > stepUp ? HOP_DROP_COST : 0))
          hops.push({ from: a, ledge, top, up: Math.max(0, up), down: Math.max(0, down) })
          break
        }
        if (cellHard[m]) break
        if (k >= 4 && (cellHard[y * nx + x - dx] || cellHard[(y - dy) * nx + x])) break
        // The band cell and its side neighbours across the line (both sides of a diagonal step).
        top = Math.max(top, cellTop[m])
        if (k < 4) {
          const sx = dy !== 0 ? 1 : 0, sy = dx !== 0 ? 1 : 0
          for (const s of [-1, 1]) {
            const n = (y + s * sy) * nx + x + s * sx
            if (!cellHard[n]) top = Math.max(top, cellTop[n])
          }
        } else {
          for (const n of [y * nx + x - dx, (y - dy) * nx + x]) top = Math.max(top, cellTop[n])
        }
      }
    }
  }
  start[N] = to.length
  return { start, to: Int32Array.from(to), cost: Int32Array.from(cost), hop: hops }
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
    if (!JET_ROUTE_ON) return nav
    // Build 33: the jet grid, used for path(..., jet = true). A failure here keeps the ground nav.
    try {
      const jn = jetNumbers(hello)
      if (jn.climbMax <= (hello?.config?.mech?.step_up ?? 1.2)) return nav
      const jg = buildNavGrid(hello, { climbMax: jn.climbMax, dropMax: DROP_MAX_M })
      const jnav = gridNav(jg, walk, stuck)
      warmUp(jg, jnav)
      return {
        path: (from, to, budget, jet) => (jet ? jnav : nav).path(from, to, budget),
        eta: nav.eta,
        stuck,
        jetNeed: jn.need,
        climbMax: jn.climbMax,
      }
    } catch (e) {
      console.error("nav: jet grid build failed, ground routes only:", e)
      return nav
    }
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
    jetNeed: Infinity,
    climbMax: 0,
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
  const { nx, ny, free, h, comp, minX, minY, vnx, vny, surf, links } = g
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
      // Build 33 (jet grid): hops across ledge bands.
      if (links) {
        for (let e = links.start[c]; e < links.start[c + 1]; e++) {
          const m = links.to[e]
          if (closed[m] === gen) continue
          const nd = gc + links.cost[e]
          if (seen[m] !== gen || nd < gcost[m]) {
            seen[m] = gen; gcost[m] = nd; came[m] = c
            const hh = (heur(m % nx, (m / nx) | 0) * H_WEIGHT_X10) / 10 | 0
            heapPush((nd + hh) * 8192 + Math.min(hh, 8191), m)
          }
        }
      }
    }
    return null
  }

  const path = (from: Vec3, to: Vec3, budget: number): Vec3[] | null => {
    const s = snap(cellOf(from[0], from[1]), -1)
    if (s < 0) return null
    const t0 = cellOf(to[0], to[1])
    const t = snap(t0, comp[s])
    if (t < 0) return null
    const exact = t === t0 || (free[t0] && comp[t0] === comp[s])
    const end: Vec3 = exact ? [to[0], to[1], surfaceZ(to[0], to[1])] : cellPos(g, t)
    if (s === t) return [end]
    const cells = astar(s, t, budget)
    if (!cells) return null
    if (links) return pullHops(cells, end)
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

  /** Build 33: the hop link from cell a to cell b, if b is not a neighbour of a. */
  const hopOf = (a: number, b: number): Hop | null => {
    if (!links || (Math.abs((a % nx) - (b % nx)) <= 1 && Math.abs(((a / nx) | 0) - ((b / nx) | 0)) <= 1)) return null
    for (let e = links.start[a]; e < links.start[a + 1]; e++) if (links.to[e] === b) return links.hop[e]
    return null
  }
  /**
   * Build 33: the string-pull above, except that a hop is never pulled across: its takeoff cell is kept as a waypoint
   * and its landing cell (or `end`, when the hop lands in the last cell) is the next one, carrying `hop`.
   */
  const pullHops = (cells: number[], end: Vec3): Waypoint[] => {
    const out: Waypoint[] = []
    let anchor = 0
    for (let i = 1; i < cells.length; i++) {
      const hop = hopOf(cells[i - 1], cells[i])
      if (hop) {
        if (anchor !== i - 1) out.push(cellPos(g, cells[i - 1]))
        const land: Waypoint = i === cells.length - 1 ? [end[0], end[1], end[2]] : cellPos(g, cells[i])
        land.hop = hop
        out.push(land)
        anchor = i
        continue
      }
      if (i >= anchor + 2 && !clear(cells[anchor], cells[i])) {
        anchor = i - 1
        out.push(cellPos(g, cells[anchor]))
      }
    }
    if (anchor !== cells.length - 1) out.push(end)
    return out
  }

  const eta = (from: Vec3, to: Vec3): number => {
    const p = path(from, to, ETA_BUDGET)
    if (!p) return Math.hypot(to[0] - from[0], to[1] - from[1]) / walk
    let d = 0, px = from[0], py = from[1]
    for (const w of p) { d += Math.hypot(w[0] - px, w[1] - py); px = w[0]; py = w[1] }
    return d / walk
  }

  return { path, eta, stuck, jetNeed: Infinity, climbMax: 0 }
}
