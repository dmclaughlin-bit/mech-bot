/**
 * Run with stdin closed (`< /dev/null`): importing map.ts pulls in mechfight.ts, which waits on stdin.
 * RCA measurement: how good are brain.ts hiding spots? Re-implements hideSpot/seenAt from brain.ts:211-251
 * (same constants, same map.ts LOS) offline against the kit arena. Read-only; touches no bot code.
 * Usage: bun tools/rca_hide.ts [samples=400] [dists=60] < /dev/null   (e.g. 40 60,120; slow: ~seconds per sample)
 *
 * For random in-zone standing points and one enemy at 60/120/180 m aiming at us:
 *  - found%: a spot exists (retreat mode, cone=false; heal/hide mode, cone=true)
 *  - wedgeOnly%: cone=true spots that are hidden only by the enemy's 120° wedge, i.e. still in its line of sight
 *    (the enemy sees us again by turning its torso, no walking needed)
 *  - reacquire_m: metres the enemy must walk straight toward the spot before it sees the spot again (LOS + near ring)
 */
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { clearLine, groundAt, loadMap } from "../map.ts"

const N = Number(process.argv[2] ?? 400)
const kit = "/workspace/mechfight-kit"
const hello = JSON.parse(gunzipSync(readFileSync(`${kit}/check/stream.jsonl.gz`)).toString("utf8").split("\n")[0])
hello.map.dir = `${kit}/arena`
const cfg = hello.config
const solids = loadMap(hello)!
const H = cfg.mech.height, EYE = cfg.mech.eye_height ?? 8, WALK = cfg.mech.walk_speed
const v = cfg.vision, halfFov = (v.fov_deg * Math.PI) / 360
type V3 = [number, number, number]
const flat = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1])
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const yawTo = (f: number[], t: number[]) => Math.atan2(t[1] - f[1], t[0] - f[0])

let seed = 12345
const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff)

type T = { pos: V3; aim: number }
function seenAt(p: V3, threats: T[], cone: boolean): boolean {
  const c: V3 = [p[0], p[1], p[2] + H / 2], top: V3 = [p[0], p[1], p[2] + H]
  for (const e of threats) {
    const d = flat(e.pos, p)
    if (d > v.range) continue
    if (cone && d > v.near_range && Math.abs(wrap(yawTo(e.pos, p) - e.aim)) > halfFov) continue
    const eye: V3 = [e.pos[0], e.pos[1], e.pos[2] + EYE]
    if (clearLine(solids, eye, c, 0, 0) || clearLine(solids, eye, top, 0, 0)) return true
  }
  return false
}
function hideSpot(me: V3, threats: T[], cone: boolean, keep: [number[], number]): V3 | null {
  const from: V3 = [me[0], me[1], me[2] + H / 2]
  for (const s of [1, 2, 3]) for (let b = 0; b < 12; b++) {
    const yaw = (2 * Math.PI * b) / 12
    const x = me[0] + Math.cos(yaw) * WALK * s, y = me[1] + Math.sin(yaw) * WALK * s
    if (Math.hypot(x - keep[0][0], y - keep[0][1]) > keep[1]) continue
    const g = groundAt(solids, x, y)
    if (g === -Infinity) continue
    const p: V3 = [x, y, g]
    if (threats.some((e) => flat(e.pos, p) < flat(e.pos, me))) continue
    if (!clearLine(solids, from, [x, y, g + H / 2], 0, 0)) continue
    if (!seenAt(p, threats, cone)) return p
  }
  return null
}
const blocked = (x: number, y: number) => {
  if (!Number.isFinite(groundAt(solids, x, y))) return true // off the map: clearLine would never end
  const i = Math.round((x - solids.minX) / solids.step), j = Math.round((y - solids.minY) / solids.step)
  const k = j * solids.nx + i
  return solids.base[k] !== Infinity && solids.base[k] < groundAt(solids, x, y) + H
}

const zoneC = [41.3, -72.8], zoneR = 380
const DISTS = (process.argv[3] ?? "60").split(",").map(Number)
for (const D of DISTS) {
  let attempts = 0
  let tried = 0, foundR = 0, foundH = 0, wedgeOnly = 0, visibleNow = 0
  const dist: number[] = [], reacq: number[] = []
  while (tried < N && attempts++ < 20 * N) {
    const a = rnd() * 2 * Math.PI, r = Math.sqrt(rnd()) * (zoneR - 40)
    const x = zoneC[0] + Math.cos(a) * r, y = zoneC[1] + Math.sin(a) * r
    if (blocked(x, y)) continue
    const me: V3 = [x, y, groundAt(solids, x, y)]
    const b = rnd() * 2 * Math.PI
    const ex = x + Math.cos(b) * D, ey = y + Math.sin(b) * D
    if (blocked(ex, ey)) continue
    const e: T = { pos: [ex, ey, groundAt(solids, ex, ey)], aim: yawTo([ex, ey], me) }
    if (!seenAt(me, [e], false)) continue // only cases where the enemy actually sees us
    tried++; visibleNow++
    const keep: [number[], number] = [zoneC, zoneR - 15]
    const sr = hideSpot(me, [e], false, keep)
    if (sr) {
      foundR++
      dist.push(flat(me, sr))
      // enemy walks straight toward the spot in 2 m steps until it sees it
      let m = 0
      const L = flat(e.pos, sr)
      for (; m < L; m += 2) {
        const f = m / L
        const px = ex + (sr[0] - ex) * f, py = ey + (sr[1] - ey) * f
        const gz = groundAt(solids, px, py)
        if (!Number.isFinite(gz)) continue
        const ep: T = { pos: [px, py, gz], aim: yawTo([px, py], sr) }
        if (seenAt(sr, [ep], false)) break
      }
      reacq.push(Math.min(m, L))
    }
    // heal/hide mode: enemy aims at us; spot may be outside its wedge only
    const sh = hideSpot(me, [e], true, keep)
    if (sh) { foundH++; if (seenAt(sh, [e], false)) wedgeOnly++ }
  }
  const med = (q: number[], p = 0.5) => { const s = q.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length * p)] : NaN }
  console.log(`enemy at ${D} m (n=${tried} exposed positions of ${attempts} draws): retreat spot found ${(100 * foundR / tried).toFixed(0)}%, spot dist median ${med(dist).toFixed(0)} m; ` +
    `enemy re-sees spot after walking median ${med(reacq).toFixed(0)} m (p25 ${med(reacq, 0.25).toFixed(0)} m) = ${(med(reacq) / WALK).toFixed(1)} s at walk; ` +
    `hide-mode spot found ${(100 * foundH / tried).toFixed(0)}%, of which hidden only by wedge (still in LOS) ${(100 * wedgeOnly / Math.max(1, foundH)).toFixed(0)}%`)
}
