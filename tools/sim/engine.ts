/**
 * The match: 20 Hz ticks, one decision every 2 ticks (10 Hz), rules from protocol.md and hello.config.
 * Everything that is a guess is listed in ASSUMPTIONS.md.
 */
import { type Geo, type Vec3, clear, floorAt, groundAt, rayDist, treeBlocks, walkable } from "./geom.ts"
import { TIER_COUNTS, type Tier } from "./tune.ts"

export const DT = 0.05
const TAU = Math.PI * 2
export const angDiff = (a: number, b: number) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d }
const r2 = (x: number) => Math.round(x * 100) / 100
const r3 = (x: number) => Math.round(x * 1000) / 1000
const v3 = (p: number[]) => [r2(p[0]), r2(p[1]), r2(p[2])]
export const hdist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1])

export function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export type Sim = any
export type Mech = any

/** `vsBots` (P-D-016 --vs-champions): every mech is a bot-driven player and there are no house bots. Off: unchanged. */
export function createSim(geo: Geo, cfg: any, seed: number, vsBots = false): Sim {
  const rng = mulberry32(seed * 7919 + 13)
  const S: Sim = {
    geo, cfg, seed, rng, tick: 0, t: 0, mechs: [], npcs: [], crates: [], cubes: [], pickups: [], projs: [], drops: [],
    ids: { cube: 5000, pickup: 8000, proj: 1, drop: 20000 }, sounds: [], beams: [], events: [], zoneDmgAcc: 0,
    upById: Object.fromEntries(cfg.upgrades.map((u: any) => [u.id, u])), seen: new Map<number, number>(), offerSeq: 0,
    stats: { ourShots: 0, ourHits: 0, houseShots: 0, houseHits: 0 }, deaths: [], dropIdx: 0, over: false, vsBots,
  }
  S.gauss = () => { let u = 0; while (u === 0) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * rng()) }
  // zone schedule
  const b = geo.bounds
  let c = cfg.zone.start_center.slice(), r = cfg.zone.start_radius, t = 0
  S.zone = []
  for (const ph of cfg.zone.phases) {
    const a = rng() * TAU, d = Math.sqrt(rng()) * (r - ph.radius)
    const c1 = [Math.min(b.maxX - 60, Math.max(b.minX + 60, c[0] + Math.cos(a) * d)), Math.min(b.maxY - 60, Math.max(b.minY + 60, c[1] + Math.sin(a) * d))]
    if (Math.hypot(c1[0] - c[0], c1[1] - c[1]) > r - ph.radius) { c1[0] = c[0]; c1[1] = c[1] }
    S.zone.push({ c0: c, r0: r, c1, r1: ph.radius, start: t + ph.hold_s, end: t + ph.hold_s + ph.shrink_s, dps: ph.dps })
    t += ph.hold_s + ph.shrink_s; c = c1; r = ph.radius
  }
  const margin = cfg.match.arena_margin
  const open = (x: number, y: number) => x > b.minX + margin && x < b.maxX - margin && y > b.minY + margin && y < b.maxY - margin && walkable(geo, x, y)
  const randOpen = (cx: number, cy: number, rad: number): Vec3 => {
    for (let i = 0; i < 4000; i++) {
      const a = rng() * TAU, d = Math.sqrt(rng()) * rad, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d
      if (open(x, y)) return [x, y, groundAt(geo, x, y)]
    }
    return [cx, cy, groundAt(geo, cx, cy)]
  }
  S.randOpen = randOpen
  const randRoof = (): Vec3 => { const k = Math.floor(rng() * (geo.roofs.length / 3)) * 3; return [geo.roofs[k], geo.roofs[k + 1], geo.roofs[k + 2]] }
  // spawns: inside spawn_zone_fraction of the first circle, at least spawn_min_separation apart
  const zc = cfg.zone.start_center, spawns: Vec3[] = []
  let sep = cfg.match.spawn_min_separation
  for (let tries = 0; spawns.length < cfg.match.mechs; tries++) {
    const p = randOpen(zc[0], zc[1], cfg.zone.start_radius * cfg.match.spawn_zone_fraction)
    if (spawns.every((q) => hdist(p, q) >= sep)) spawns.push(p)
    if (tries > 3000) { sep *= 0.95; tries = 0 }
  }
  S.meId = Math.floor(rng() * cfg.match.mechs)
  const tiers: Tier[] = []
  for (const [tier, n] of TIER_COUNTS) for (let i = 0; i < n; i++) tiers.push(tier)
  for (let i = tiers.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [tiers[i], tiers[j]] = [tiers[j], tiers[i]] }
  for (let id = 0; id < cfg.match.mechs; id++) {
    const pos = spawns[id]
    const yaw = Math.atan2(zc[1] - pos[1], zc[0] - pos[0])
    const m: Mech = {
      id, kind: "mech", pos: pos.slice(), vel: [0, 0, 0], aim: [yaw, 0], cmdAim: [yaw, 0], hp: cfg.mech.hp, maxHp: cfg.mech.hp, energy: cfg.mech.energy,
      grounded: true, cubes: 0, ups: {}, upList: [], weapons: [{ kind: "gun", cooldown: 0, ammo: cfg.weapons.gun.mag, reload: 0, charge: 0 }, null],
      alive: true, lastCombat: -99, lastSpend: -99, act: { move: [0, 0], boost: false, fire: [false, false] }, once: {}, tier: id === S.meId ? null : vsBots ? (tiers.pop(), null) : tiers.pop(),
      kills: 0, dmgDealt: 0, dmgTaken: 0, pendingOffers: 0, offer: null, shortUntil: 0, stepT: 0, inZone: true, charging: false, ai: {},
    }
    if (vsBots && id !== S.meId) { m.player = true; m.events = []; m.sounds = []; m.zacc = 0; m.seen = new Map<number, number>(); m.missedRun = 0 }
    recompute(S, m)
    S.mechs.push(m)
  }
  S.me = S.mechs[S.meId]
  for (let i = 0; i < cfg.npc.count; i++) {
    const home = randOpen(zc[0], zc[1], cfg.zone.start_radius * 0.9)
    S.npcs.push({ id: 100 + i, kind: "npc", home, pos: home.slice(), vel: [0, 0, 0], aim: [rng() * TAU - Math.PI, 0], hp: cfg.npc.hp, maxHp: cfg.npc.hp, alive: true, target: null, cooldown: rng(), wander: home.slice(), wanderT: 0 })
  }
  for (let i = 0; i < cfg.crates.count; i++) {
    const pos = rng() < cfg.crates.roof_fraction ? randRoof() : randOpen(zc[0], zc[1], cfg.zone.start_radius * 0.9)
    S.crates.push({ id: 1000 + i, kind: "crate", pos, hp: cfg.crates.hp, alive: true })
  }
  for (let i = 0; i < cfg.loot.floor_count; i++) {
    const pos = rng() < cfg.loot.floor_roof_fraction ? randRoof() : randOpen(zc[0], zc[1], cfg.zone.start_radius * 0.9)
    S.pickups.push({ id: S.ids.pickup++, kind: randWeapon(S), pos })
  }
  return S
}

function randWeapon(S: Sim): string {
  const w = S.cfg.loot.weights, ks = Object.keys(w).filter((k) => w[k] > 0)
  let x = S.rng() * ks.reduce((s, k) => s + w[k], 0)
  for (const k of ks) { x -= w[k]; if (x <= 0) return k }
  return ks[ks.length - 1]
}

/** Mech and weapon numbers after upgrades and cubes. */
export function recompute(S: Sim, m: Mech) {
  const cfg = S.cfg
  const ms: any = { radius: cfg.mech.radius, height: cfg.mech.height, eye_height: cfg.mech.eye_height, muzzle_height: cfg.mech.muzzle_height, ...cfg.mech }
  const ws: any = {}
  for (const k of Object.keys(cfg.weapons)) ws[k] = { ...cfg.weapons[k] }
  for (const id of m.upList) for (const e of S.upById[id].effects) {
    const parts = e.path.split("."), key = parts[parts.length - 1], tgt = parts[0] === "mech" ? ms : ws[parts[1]]
    if (e.mul !== undefined) tgt[key] *= e.mul
    if (e.add !== undefined) tgt[key] += e.add
  }
  const sc = 1 + cfg.cubes.size_per_cube * m.cubes
  ms.radius = r3(ms.radius * sc); ms.height = r3(ms.height * sc); ms.eye_height = r3(ms.eye_height * sc); ms.muzzle_height = r3(ms.muzzle_height * sc)
  const capped = Math.min(m.cubes, cfg.cubes.stat_cap)
  const newMax = ms.hp * (1 + cfg.cubes.hp_per_cube * capped)
  if (m.stats && newMax > m.maxHp) m.hp += newMax - m.maxHp
  m.maxHp = newMax
  m.hp = Math.min(m.hp, m.maxHp)
  m.dmgMul = 1 + cfg.cubes.damage_per_cube * capped
  m.stats = ms; m.wstats = ws
  m.energy = Math.min(m.energy, ms.energy)
}

export function zoneAt(S: Sim, t: number) {
  const z = S.zone
  let i = 0
  while (i < z.length - 1 && t >= z[i].end) i++
  const p = z[i]
  if (t >= p.end) return { center: p.c1, radius: p.r1, next_center: p.c1, next_radius: p.r1, shrink_start: p.start, shrink_end: p.end, dps: p.dps }
  const f = t <= p.start ? 0 : (t - p.start) / (p.end - p.start)
  return { center: [p.c0[0] + (p.c1[0] - p.c0[0]) * f, p.c0[1] + (p.c1[1] - p.c0[1]) * f], radius: p.r0 + (p.r1 - p.r0) * f, next_center: p.c1, next_radius: p.r1, shrink_start: p.start, shrink_end: p.end, dps: p.dps }
}

/** Queue an event for a bot-driven mech: our bot (S.events) or, with --vs-champions, another player. */
const pushEv = (S: Sim, m: any, e: any) => { if (m === S.me) S.events.push(e); else if (m && m.player) m.events.push(e) }

export const dirOf = (aim: number[]): Vec3 => [Math.cos(aim[1]) * Math.cos(aim[0]), Math.cos(aim[1]) * Math.sin(aim[0]), Math.sin(aim[1])]
const isHouse = (e: any) => e && e.kind === "mech" && e.tier != null
const heightOf = (e: any, S: Sim) => (e.kind === "mech" ? e.stats.height : e.kind === "npc" ? S.cfg.npc.height : S.cfg.crates.height)
const radiusOf = (e: any, S: Sim) => (e.kind === "mech" ? e.stats.radius : e.kind === "npc" ? S.cfg.npc.radius : S.cfg.crates.radius)
export const centerOf = (e: any, S: Sim): Vec3 => [e.pos[0], e.pos[1], e.pos[2] + heightOf(e, S) / 2]

function sound(S: Sim, kind: string, pos: number[], src: number) {
  if (S.vsBots) for (const p of S.mechs) if (p.player && p.alive && p.id !== src && hdist(pos, p.pos) <= S.cfg.sound.range[kind]) p.sounds.push({ kind, pos: [pos[0], pos[1]], t: S.t })
  if (src === S.meId || !S.me.alive) return
  if (hdist(pos, S.me.pos) <= S.cfg.sound.range[kind]) S.sounds.push({ kind, pos: [pos[0], pos[1]], t: S.t })
}

// ---------- vision ----------
/** Protocol §8: eye has line of sight to the object's center or top, within near range, or within range inside the yaw wedge. */
export function sees(S: Sim, m: Mech, e: any): boolean {
  const cfg = S.cfg.vision
  const d = Math.hypot(e.pos[0] - m.pos[0], e.pos[1] - m.pos[1], e.pos[2] - m.pos[2])
  const near = cfg.near_range + (m.stats.near_range_bonus ?? 0), far = cfg.range + (m.stats.vision_bonus ?? 0)
  if (d > far) return false
  if (d > near) {
    const yaw = Math.atan2(e.pos[1] - m.pos[1], e.pos[0] - m.pos[0])
    if (Math.abs(angDiff(yaw, m.aim[0])) > (cfg.fov_deg * Math.PI) / 360) return false
  }
  const eye: Vec3 = [m.pos[0], m.pos[1], m.pos[2] + m.stats.eye_height]
  const h = e.kind ? heightOf(e, S) : 1
  const c: Vec3 = [e.pos[0], e.pos[1], e.pos[2] + h / 2], top: Vec3 = [e.pos[0], e.pos[1], e.pos[2] + h]
  // P-D-014 (--trees): trunks stop sight; canopy fades it, except inside near range (protocol §8: "canopy does not").
  const T = S.geo.trees
  if (T) { const canopy = d > near; return (clear(S.geo, eye, c, 1.5) && !treeBlocks(T, eye, c, canopy)) || (clear(S.geo, eye, top, 0.5) && !treeBlocks(T, eye, top, canopy)) }
  return clear(S.geo, eye, c, 1.5) || clear(S.geo, eye, top, 0.5)
}

// ---------- damage ----------
export function hurt(S: Sim, tgt: any, amt: number, weapon: string, by: any, from: number[] | null, effect?: string) {
  if (!tgt.alive) return
  const me = S.me
  let rear = false
  if (tgt.kind === "mech") {
    if (from && weapon !== "zone") {
      const bearing = Math.atan2(from[1] - tgt.pos[1], from[0] - tgt.pos[0])
      if (Math.abs(angDiff(bearing, tgt.aim[0])) > (S.cfg.mech.front_arc_deg * Math.PI) / 360) { rear = true; amt *= tgt.stats.rear_mult }
    }
    if (weapon !== "zone") amt *= 1 - Math.min(0.9, tgt.stats.armor)
    tgt.hp -= amt; tgt.dmgTaken += amt; tgt.lastCombat = S.t
    if (weapon === "zone") { if (tgt === me) S.zoneDmgAcc += amt; else if (tgt.player) tgt.zacc += amt }
    else if (tgt === me || tgt.player) {
      const bearing = from ? r3(Math.atan2(from[1] - tgt.pos[1], from[0] - tgt.pos[0])) : null
      pushEv(S, tgt, { type: "damaged", amount: r2(amt), weapon, bearing, by: by ? by.id : null, ...(rear && { rear: true }) })
      if (tgt === me && isHouse(by) && weapon === "gun") S.stats.houseHits++
    }
    if (tgt.tier != null && by === me) tgt.ai.hitByMeT = S.t
    if (tgt.hp <= 0 && !tgt.dying) tgt.dying = { by, weapon }
  } else {
    tgt.hp -= amt
    if (tgt.kind === "npc" && by && by.kind === "mech") tgt.target = by
    if (tgt.hp <= 0) {
      tgt.alive = false
      const n = tgt.kind === "npc" ? S.cfg.npc.cubes : S.cfg.crates.cubes
      for (let i = 0; i < n; i++) S.cubes.push({ id: S.ids.cube++, pos: [tgt.pos[0] + (S.rng() - 0.5) * 2, tgt.pos[1] + (S.rng() - 0.5) * 2, tgt.pos[2]] })
      if (tgt.kind === "crate") {
        if (S.rng() < S.cfg.loot.crate_weapon_chance) S.pickups.push({ id: S.ids.pickup++, kind: randWeapon(S), pos: [tgt.pos[0] + 1.5, tgt.pos[1], tgt.pos[2]] })
        sound(S, "crate", tgt.pos, -1)
      }
    }
  }
  if (by && by.kind === "mech") {
    by.dmgDealt += amt; by.lastCombat = S.t
    if (by === me || by.player) {
      pushEv(S, by, { type: "hit", target: tgt.id, amount: r2(amt), weapon, ...(effect && { effect }), ...(rear && { rear: true }) })
      if (by === me && tgt.kind === "mech" && weapon === "gun") S.stats.ourHits++
    }
  }
}

/** Things a shot from `owner` can hit. House bots never hurt each other. */
function targetsFor(S: Sim, owner: any): any[] {
  const out: any[] = []
  for (const m of S.mechs) if (m.alive && m !== owner && !(isHouse(owner) && isHouse(m))) out.push(m)
  if (owner.kind === "mech") {
    for (const n of S.npcs) if (n.alive) out.push(n)
    for (const c of S.crates) if (c.alive) out.push(c)
  }
  return out
}

/** First target the segment a -> b touches: [target, fraction] or null. */
function segHit(S: Sim, a: number[], b: number[], targets: any[], pr: number): [any, number] | null {
  let best: [any, number] | null = null
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy
  for (const e of targets) {
    const R = radiusOf(e, S) + pr
    if (Math.abs(e.pos[0] - a[0]) > R + Math.abs(dx) || Math.abs(e.pos[1] - a[1]) > R + Math.abs(dy)) continue
    let s = l2 > 0 ? ((e.pos[0] - a[0]) * dx + (e.pos[1] - a[1]) * dy) / l2 : 0
    s = Math.max(0, Math.min(1, s))
    const px = a[0] + dx * s, py = a[1] + dy * s, pz = a[2] + (b[2] - a[2]) * s
    if (Math.hypot(px - e.pos[0], py - e.pos[1]) > R) continue
    if (pz < e.pos[2] - pr || pz > e.pos[2] + heightOf(e, S) + pr) continue
    if (!best || s < best[1]) best = [e, s]
  }
  return best
}

function muzzle(S: Sim, m: Mech, h: number): { o: Vec3; d: Vec3; ok: boolean } {
  const d = dirOf(m.aim)
  const base: Vec3 = [m.pos[0], m.pos[1], m.pos[2] + h]
  const out = m.stats.radius + 0.5
  const free = rayDist(S.geo, base, d, out, 0.5)
  return { o: [base[0] + d[0] * free, base[1] + d[1] * free, base[2] + d[2] * free], d, ok: free >= out }
}

function fireGun(S: Sim, m: Mech, st: any) {
  const sp = (st.spread_deg * Math.PI) / 180
  const saved = m.aim
  m.aim = [saved[0] + S.gauss() * sp, saved[1] + S.gauss() * sp]
  const { o, d, ok } = muzzle(S, m, m.stats.muzzle_height)
  m.aim = saved
  sound(S, "gun", m.pos, m.id)
  if (m === S.me) S.stats.ourShots++
  else if (m.ai.fightingMe) S.stats.houseShots++
  m.ai.firedT = S.t
  if (!ok) return
  S.projs.push({ id: S.ids.proj++, kind: "gun", pos: o, vel: [d[0] * st.speed, d[1] * st.speed, d[2] * st.speed], owner: m, left: st.range, dmg: st.damage * m.dmgMul })
}

function fireMortar(S: Sim, m: Mech, st: any) {
  const { o, d, ok } = muzzle(S, m, m.stats.height + 0.5)
  sound(S, "mortar", m.pos, m.id)
  if (!ok) return
  S.projs.push({ id: S.ids.proj++, kind: "mortar", pos: o, vel: [d[0] * st.speed, d[1] * st.speed, d[2] * st.speed], owner: m, ttl: st.ttl, st, dmgMul: m.dmgMul })
}

function explode(S: Sim, p: any, at: number[], direct: any) {
  const st = p.st, owner = p.owner
  sound(S, "explosion", at, -1)
  if (direct) hurt(S, direct, st.damage * p.dmgMul, "mortar", owner, at)
  const list = targetsFor(S, owner)
  list.push(owner)
  for (const e of list) {
    if (!e.alive) continue
    const h = heightOf(e, S)
    const cz = Math.max(e.pos[2], Math.min(e.pos[2] + h, at[2]))
    const d = Math.max(0, Math.hypot(e.pos[0] - at[0], e.pos[1] - at[1], cz - at[2]) - radiusOf(e, S))
    if (d > st.splash_radius) continue
    if (e !== direct && !clear(S.geo, [at[0], at[1], at[2] + 0.5], centerOf(e, S), radiusOf(e, S))) continue
    const fall = 1 - (1 - st.splash_edge) * (d / st.splash_radius)
    let amt = st.splash * fall * p.dmgMul
    if (e === owner) amt *= S.cfg.mech.self_damage_mult
    hurt(S, e, amt, "mortar", owner, at, e.kind === "mech" ? "concuss" : undefined)
    if (e.kind === "mech") {
      const a = Math.atan2(e.pos[1] - at[1], e.pos[0] - at[0])
      e.vel[0] += Math.cos(a) * st.knock * fall; e.vel[1] += Math.sin(a) * st.knock * fall; e.vel[2] = st.knock_up * fall; e.grounded = false
      e.energy = Math.max(0, e.energy - st.drain * fall)
      pushEv(S, e, { type: "effect", effect: "concuss", by: owner.id })
    }
  }
}

function fireLaser(S: Sim, m: Mech, w: any, st: any) {
  const frac = Math.min(1, w.charge / st.charge)
  const dmg = st.damage * (st.min_frac + (1 - st.min_frac) * frac) * m.dmgMul
  w.charge = 0; w.releasing = false; w.cooldown = st.cooldown
  const { o, d, ok } = muzzle(S, m, m.stats.muzzle_height)
  sound(S, "laser", m.pos, m.id)
  const reach = ok ? rayDist(S.geo, o, d, st.range) : 0
  const end: Vec3 = [o[0] + d[0] * reach, o[1] + d[1] * reach, o[2] + d[2] * reach]
  const hits: [any, number][] = []
  for (const e of targetsFor(S, m)) { const h = segHit(S, o, end, [e], 0); if (h) hits.push(h) }
  hits.sort((a, b) => a[1] - b[1])
  for (const [e] of hits.slice(0, 1 + (st.pierce ?? 0))) {
    const cook = e.kind === "mech" && e.weapons.some((x: any) => x && x.kind === "mortar")
    hurt(S, e, dmg * (cook ? 1 + st.cookoff : 1), "laser", m, m.pos, cook ? "cookoff" : undefined)
    if (cook) pushEv(S, e, { type: "effect", effect: "cookoff", by: m.id })
  }
  if (m !== S.me || S.vsBots) S.beams.push({ by: m.id, kind: "laser", path: [v3(o), v3(end)], t: S.t, src: m })
}

function fireLightning(S: Sim, m: Mech, st: any) {
  m.energy -= st.energy; m.lastSpend = S.t
  sound(S, "lightning", m.pos, m.id)
  const { o, d } = muzzle(S, m, m.stats.muzzle_height)
  const cone = (st.cone_deg * Math.PI) / 180
  const pool = targetsFor(S, m)
  const path: number[][] = [v3(o)]
  let from: Vec3 = o, cur: any = null, dmg = st.damage * m.dmgMul
  const done = new Set<any>()
  for (let jump = 0; jump <= st.chain; jump++) {
    let best: any = null, bd = Infinity
    for (const e of pool) {
      if (done.has(e) || !e.alive) continue
      const c = centerOf(e, S)
      const dd = Math.hypot(c[0] - from[0], c[1] - from[1], c[2] - from[2])
      if (dd > (jump === 0 ? st.range : st.chain_range) || dd >= bd) continue
      if (jump === 0 && Math.abs(angDiff(Math.atan2(e.pos[1] - m.pos[1], e.pos[0] - m.pos[0]), m.aim[0])) > cone) continue
      if (!clear(S.geo, from, c, radiusOf(e, S))) continue
      best = e; bd = dd
    }
    if (!best) break
    done.add(best); cur = best
    const short = best.kind === "mech" && best.weapons.some((x: any) => x && x.kind === "laser")
    hurt(S, best, dmg, "lightning", m, m.pos, short ? "short" : undefined)
    if (short) {
      best.shortUntil = S.t + st.short_s
      for (const x of best.weapons) if (x && x.kind === "laser") { x.charge = 0; x.releasing = false }
      pushEv(S, best, { type: "effect", effect: "short", by: m.id })
    }
    from = centerOf(best, S); path.push(v3(from)); dmg *= st.chain_falloff
  }
  if (!cur) { const reach = rayDist(S.geo, o, d, st.range); path.push(v3([o[0] + d[0] * reach, o[1] + d[1] * reach, o[2] + d[2] * reach])) }
  if (m !== S.me || S.vsBots) S.beams.push({ by: m.id, kind: "lightning", path, t: S.t, src: m })
}

function weaponsTick(S: Sim, m: Mech) {
  m.charging = false
  for (let slot = 0; slot < 2; slot++) {
    const w = m.weapons[slot]
    if (!w) continue
    const st = m.wstats[w.kind], held = !!m.act.fire?.[slot]
    w.cooldown = Math.max(-DT, w.cooldown - DT)
    if (w.kind === "gun") {
      if (w.reload > 0) { w.reload -= DT; if (w.reload <= 1e-9) { w.reload = 0; w.ammo = st.mag } }
      else if ((m.once.reload && w.ammo < st.mag) || w.ammo <= 0) { w.reload = st.reload; sound(S, "reload", m.pos, m.id) }
      else if (held && w.cooldown <= 1e-9) { fireGun(S, m, st); w.ammo--; w.cooldown += st.cooldown }
    } else if (w.kind === "laser") {
      if (S.t < m.shortUntil) { w.charge = 0; w.releasing = false }
      else if (w.cooldown <= 1e-9) {
        if (held && !w.releasing) {
          if (w.charge === 0) sound(S, "laser_charge", m.pos, m.id)
          w.charge += DT
          if (w.charge >= st.charge + st.hold_s) fireLaser(S, m, w, st)
        } else if (w.charge > 0) {
          if (w.charge >= st.min_charge - 1e-9) fireLaser(S, m, w, st)
          else { w.releasing = true; w.charge += DT }
        }
      }
      if (w.charge > 0) m.charging = true
    } else if (w.kind === "lightning") {
      if (held && w.cooldown <= 1e-9 && m.energy >= st.energy) { fireLightning(S, m, st); w.cooldown += st.cooldown }
    } else if (w.kind === "mortar") {
      if (held && w.cooldown <= 1e-9) { fireMortar(S, m, st); w.cooldown = st.cooldown }
    }
  }
}

function projectilesTick(S: Sim) {
  const g = S.geo
  const keep: any[] = []
  for (const p of S.projs) {
    if (p.kind === "mortar") p.vel[2] -= p.st.gravity * DT
    const a = p.pos, b: Vec3 = [a[0] + p.vel[0] * DT, a[1] + p.vel[1] * DT, a[2] + p.vel[2] * DT]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    const d: Vec3 = [(b[0] - a[0]) / len, (b[1] - a[1]) / len, (b[2] - a[2]) / len]
    const wallAt = rayDist(g, a, d, len)
    const hit = segHit(S, a, b, p.owner.kind === "npc" ? S.mechs.filter((m: Mech) => m.alive) : targetsFor(S, p.owner), S.cfg.projectile.gun_radius)
    const hitAt = hit ? hit[1] * len : Infinity
    if (hit && hitAt <= wallAt) {
      const at = [a[0] + d[0] * hitAt, a[1] + d[1] * hitAt, a[2] + d[2] * hitAt]
      if (p.kind === "mortar") explode(S, p, at, hit[0])
      else hurt(S, hit[0], p.dmg, p.kind, p.owner, [a[0] - p.vel[0], a[1] - p.vel[1], a[2]])
      continue
    }
    if (wallAt < len) {
      if (p.kind === "mortar") explode(S, p, [a[0] + d[0] * (wallAt - 0.5), a[1] + d[1] * (wallAt - 0.5), a[2] + d[2] * (wallAt - 0.5)], null)
      continue
    }
    p.pos = b
    if (p.kind === "mortar") { p.ttl -= DT; if (p.ttl <= 0) continue }
    else { p.left -= len; if (p.left <= 0) continue }
    keep.push(p)
  }
  S.projs = keep
}

// ---------- movement ----------
const RING = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [Math.cos((i * TAU) / 8), Math.sin((i * TAU) / 8)])
function passable(S: Sim, m: Mech, x: number, y: number): number {
  const st = m.stats, g = S.geo, b = g.bounds
  if (x < b.minX + st.radius || x > b.maxX - st.radius || y < b.minY + st.radius || y > b.maxY - st.radius) return NaN
  const f = floorAt(g, x, y, m.pos[2], st.step_up, st.height)
  if (Number.isNaN(f)) return NaN
  if (f > m.pos[2] + st.step_up) return NaN
  for (const [cx, cy] of RING) if (Number.isNaN(floorAt(g, x + cx * st.radius, y + cy * st.radius, m.pos[2], st.step_up, st.height))) return NaN
  return f
}

function moveMech(S: Sim, m: Mech) {
  const st = m.stats, a = m.act
  let mx = a.move?.[0] ?? 0, my = a.move?.[1] ?? 0
  const ml = Math.hypot(mx, my)
  if (ml > 1) { mx /= ml; my /= ml }
  const moving = ml > 0.01
  let speed = st.walk_speed
  if (a.boost && m.grounded && moving && m.energy > 0) { speed = st.boost_speed; m.energy = Math.max(0, m.energy - st.boost_drain * DT); m.lastSpend = S.t; m.boosting = true } else m.boosting = false
  if (m.charging) speed *= st.charge_move_mult
  const acc = (m.grounded ? st.ground_accel : st.air_accel) * DT
  const dvx = mx * speed - m.vel[0], dvy = my * speed - m.vel[1], dv = Math.hypot(dvx, dvy)
  if (dv <= acc) { m.vel[0] = mx * speed; m.vel[1] = my * speed } else { m.vel[0] += (dvx / dv) * acc; m.vel[1] += (dvy / dv) * acc }
  if (m.once.jump && m.grounded) { m.vel[2] = st.jump_speed; m.grounded = false }
  if (!m.grounded) {
    if (a.boost && m.energy > 0) { m.vel[2] = Math.min(st.max_rise_speed, m.vel[2] + st.jet_accel * DT); m.energy = Math.max(0, m.energy - st.jet_drain * DT); m.lastSpend = S.t }
    m.vel[2] -= st.gravity * DT
  }
  const x = m.pos[0], y = m.pos[1], nx = x + m.vel[0] * DT, ny = y + m.vel[1] * DT
  let f = passable(S, m, nx, ny)
  if (!Number.isNaN(f)) { m.pos[0] = nx; m.pos[1] = ny }
  else {
    f = passable(S, m, nx, y)
    if (!Number.isNaN(f)) { m.pos[0] = nx; m.vel[1] = 0 }
    else {
      f = passable(S, m, x, ny)
      if (!Number.isNaN(f)) { m.pos[1] = ny; m.vel[0] = 0 }
      else { m.vel[0] = 0; m.vel[1] = 0; f = floorAt(S.geo, x, y, m.pos[2], st.step_up, st.height); if (Number.isNaN(f)) f = m.pos[2] }
    }
  }
  if (m.grounded) {
    if (f < m.pos[2] - 0.6) { m.grounded = false; m.vel[2] = 0 } else m.pos[2] = f
  } else {
    m.pos[2] += m.vel[2] * DT
    if (m.pos[2] <= f && m.vel[2] <= 0) { m.pos[2] = f; m.vel[2] = 0; m.grounded = true }
  }
  // aim slews toward the commanded aim
  const want = a.aim ?? m.cmdAim
  m.cmdAim = want
  const dy = angDiff(want[0], m.aim[0]), maxY = st.turn_rate * DT
  m.aim[0] = angDiff(m.aim[0] + Math.max(-maxY, Math.min(maxY, dy)), 0)
  const wp = Math.max(st.min_pitch, Math.min(st.max_pitch, want[1] ?? 0)), dp = wp - m.aim[1], maxP = st.pitch_rate * DT
  m.aim[1] += Math.max(-maxP, Math.min(maxP, dp))
  // footsteps
  const sp = Math.hypot(m.vel[0], m.vel[1])
  if (m.grounded && sp > S.cfg.sound.step_speed && S.t - m.stepT >= S.cfg.sound.step_every) { m.stepT = S.t; sound(S, m.boosting ? "boost" : "step", m.pos, m.id) }
}

function npcTick(S: Sim, n: any) {
  const cfg = S.cfg.npc
  n.cooldown -= DT
  const homeD = hdist(n.pos, n.home)
  let tgt = n.target
  if (tgt && (!tgt.alive || hdist(tgt.pos, n.pos) > cfg.deaggro_range || homeD > cfg.chase_leash)) { tgt = n.target = null; n.returning = true }
  if (homeD < cfg.leash) n.returning = false
  if (!tgt && !n.returning && homeD <= cfg.leash && S.tick % 4 === n.id % 4) {
    let bd: number = cfg.aggro_range
    for (const m of S.mechs) {
      if (!m.alive) continue
      const d = hdist(m.pos, n.pos)
      if (d < bd && clear(S.geo, [n.pos[0], n.pos[1], n.pos[2] + 2.5], centerOf(m, S), m.stats.radius)) { bd = d; tgt = m }
    }
    n.target = tgt
  }
  let gx = n.wander[0], gy = n.wander[1]
  if (tgt) {
    const c = centerOf(tgt, S)
    n.aim = [Math.atan2(c[1] - n.pos[1], c[0] - n.pos[0]), Math.atan2(c[2] - n.pos[2] - 2.5, hdist(c, n.pos))]
    const d = hdist(tgt.pos, n.pos)
    if (d > 35) { gx = tgt.pos[0]; gy = tgt.pos[1] } else { gx = n.pos[0]; gy = n.pos[1] }
    if (n.cooldown <= 0 && d < 120 && clear(S.geo, [n.pos[0], n.pos[1], n.pos[2] + 2.5], c, tgt.stats.radius)) {
      n.cooldown = cfg.cooldown
      const sp = (cfg.spread_deg * Math.PI) / 180
      const dir = dirOf([n.aim[0] + S.gauss() * sp, n.aim[1] + S.gauss() * sp])
      S.projs.push({ id: S.ids.proj++, kind: "npc", pos: [n.pos[0] + dir[0] * 2.3, n.pos[1] + dir[1] * 2.3, n.pos[2] + 2.5 + dir[2] * 2.3], vel: [dir[0] * cfg.projectile_speed, dir[1] * cfg.projectile_speed, dir[2] * cfg.projectile_speed], owner: n, left: 150, dmg: cfg.damage })
      sound(S, "npc_gun", n.pos, n.id)
    }
  } else if (n.returning) { gx = n.home[0]; gy = n.home[1] }
  else if (S.t >= n.wanderT || hdist(n.pos, n.wander) < 2) {
    const a = S.rng() * TAU, d = S.rng() * cfg.leash * 0.8
    n.wander = [n.home[0] + Math.cos(a) * d, n.home[1] + Math.sin(a) * d]; n.wanderT = S.t + 4 + S.rng() * 6
  }
  const dx = gx - n.pos[0], dy = gy - n.pos[1], d = Math.hypot(dx, dy)
  if (d > 1) {
    const nx = n.pos[0] + (dx / d) * cfg.speed * DT, ny = n.pos[1] + (dy / d) * cfg.speed * DT
    if (walkable(S.geo, nx, ny)) { n.vel = [(dx / d) * cfg.speed, (dy / d) * cfg.speed, 0]; n.pos = [nx, ny, groundAt(S.geo, nx, ny)]; if (!tgt) n.aim = [Math.atan2(dy, dx), 0] }
    else { n.vel = [0, 0, 0]; n.wanderT = 0 }
  } else n.vel = [0, 0, 0]
}

function gainCubes(S: Sim, m: Mech, n: number) {
  const th = S.cfg.cubes.upgrade_thresholds
  for (let i = 0; i < n; i++) { m.cubes++; if (th.includes(m.cubes)) m.pendingOffers++ }
  recompute(S, m)
}

function drawOffer(S: Sim, m: Mech) {
  const held = new Set(m.weapons.filter(Boolean).map((w: any) => w.kind))
  const avail = S.cfg.upgrades.filter((u: any) => (m.ups[u.id] ?? 0) < u.max && (!u.requires || held.has(u.requires)))
  for (let i = avail.length - 1; i > 0; i--) { const j = Math.floor(S.rng() * (i + 1)); [avail[i], avail[j]] = [avail[j], avail[i]] }
  if (!avail.length) { m.pendingOffers = 0; return }
  m.pendingOffers--
  m.offer = { id: ++S.offerSeq, expires: r2(S.t + S.cfg.bot.offer_timeout_s), choices: avail.slice(0, 3).map((u: any) => ({ id: u.id, name: u.name, desc: u.desc })) }
}

function applyUpgrade(S: Sim, m: Mech, i: number) {
  const ch = m.offer.choices[Math.max(0, Math.min(m.offer.choices.length - 1, i))]
  m.ups[ch.id] = (m.ups[ch.id] ?? 0) + 1; m.upList.push(ch.id); m.offer = null
  recompute(S, m)
  pushEv(S, m, { type: "upgrade", id: ch.id })
}

function dropWeapon(S: Sim, m: Mech, slot: number): boolean {
  const w = m.weapons[slot]
  if (!w) return false
  if (w.kind === "laser" && w.charge > 0) return false
  const id = S.ids.pickup++
  S.pickups.push({ id, kind: w.kind, pos: m.pos.slice(), ammo: w.ammo, cooldown: w.cooldown, reload: w.reload })
  m.weapons[slot] = null
  pushEv(S, m, { type: "dropped", id, kind: w.kind, slot })
  return true
}

/** One-shot parts of an action: take, drop, pick. Applied once per decision. */
function oneShots(S: Sim, m: Mech) {
  const a = m.once, ev = (e: any) => pushEv(S, m, e)
  if (m.offer && a.pick != null) applyUpgrade(S, m, a.pick | 0)
  if (a.take != null) {
    const p = S.pickups.find((q: any) => q.id === a.take)
    const fail = (reason: string) => ev({ type: "take_failed", id: a.take, reason })
    if (!p) fail("gone")
    else if (hdist(p.pos, m.pos) > S.cfg.loot.pickup_radius || Math.abs(p.pos[2] - m.pos[2]) > 4) fail("range")
    else if (m.weapons.some((w: any) => w && w.kind === p.kind)) fail("have")
    else {
      let slot = m.weapons.findIndex((w: any) => !w)
      if (slot < 0 && (a.drop === 0 || a.drop === 1)) { if (dropWeapon(S, m, a.drop)) slot = a.drop; else { fail("busy"); slot = -2 } }
      if (slot === -1) fail("full")
      if (slot >= 0) {
        const st = m.wstats[p.kind]
        m.weapons[slot] = { kind: p.kind, cooldown: Math.max(S.cfg.loot.equip_s, p.kind === "gun" ? p.cooldown ?? 0 : st.cooldown ?? 0), ammo: p.ammo ?? st.mag, reload: p.reload ?? 0, charge: 0 }
        S.pickups = S.pickups.filter((q: any) => q !== p)
        ev({ type: "took", id: p.id, kind: p.kind, slot })
      }
    }
  } else if (a.drop === 0 || a.drop === 1) dropWeapon(S, m, a.drop)
}

function die(S: Sim, m: Mech, place: number) {
  m.alive = false; m.deathT = S.t; m.place = place; m.killer = m.dying.by; m.killWeapon = m.dying.weapon
  const k = m.dying.by
  if (k && k.kind === "mech") { k.kills++; pushEv(S, k, { type: "kill", target: m.id }) }
  for (let i = 0; i < m.cubes + S.cfg.cubes.death_drop_extra; i++) S.cubes.push({ id: S.ids.cube++, pos: [m.pos[0] + (S.rng() - 0.5) * 4, m.pos[1] + (S.rng() - 0.5) * 4, m.pos[2]] })
  for (const w of m.weapons) if (w && w.kind !== "gun") S.pickups.push({ id: S.ids.pickup++, kind: w.kind, pos: [m.pos[0] + (S.rng() - 0.5) * 3, m.pos[1] + (S.rng() - 0.5) * 3, m.pos[2]] })
  sound(S, "death", m.pos, m.id)
  S.deaths.push({ id: m.id, t: S.t, tier: m.tier, by: k ? k.id : null, weapon: m.dying.weapon })
}

/** One 20 Hz tick. `first` is true on the first tick after a decision (one-shot action parts apply there). */
export function tick(S: Sim, first: boolean) {
  const cfg = S.cfg
  S.tick++; S.t = S.tick * DT
  const z = zoneAt(S, S.t)
  for (const m of S.mechs) {
    if (!m.alive) continue
    if (!first) m.once = {}
    else oneShots(S, m)
    if (m.offer && S.t >= m.offer.expires) applyUpgrade(S, m, 0)
    if (!m.offer && m.pendingOffers > 0) drawOffer(S, m)
    moveMech(S, m)
    weaponsTick(S, m)
    m.inZone = hdist(m.pos, z.center) <= z.radius
    if (!m.inZone) hurt(S, m, z.dps * DT, "zone", null, null)
    else if (S.t - m.lastCombat >= m.stats.regen_delay) m.hp = Math.min(m.maxHp, m.hp + m.stats.regen_per_s * DT)
    if (S.t - m.lastSpend >= m.stats.energy_regen_delay) m.energy = Math.min(m.stats.energy, m.energy + m.stats.energy_regen * DT)
  }
  // overlapping mechs are pushed apart
  for (let i = 0; i < S.mechs.length; i++) for (let j = i + 1; j < S.mechs.length; j++) {
    const a = S.mechs[i], b = S.mechs[j]
    if (!a.alive || !b.alive || Math.abs(a.pos[2] - b.pos[2]) > 9) continue
    const d = hdist(a.pos, b.pos), min = a.stats.radius + b.stats.radius
    if (d >= min || d < 1e-6) continue
    const push = (min - d) / 2, ux = (b.pos[0] - a.pos[0]) / d, uy = (b.pos[1] - a.pos[1]) / d
    if (!Number.isNaN(passable(S, a, a.pos[0] - ux * push, a.pos[1] - uy * push))) { a.pos[0] -= ux * push; a.pos[1] -= uy * push }
    if (!Number.isNaN(passable(S, b, b.pos[0] + ux * push, b.pos[1] + uy * push))) { b.pos[0] += ux * push; b.pos[1] += uy * push }
  }
  projectilesTick(S)
  for (const n of S.npcs) if (n.alive) npcTick(S, n)
  // cubes go to the closest mech in reach
  if (S.cubes.length) S.cubes = S.cubes.filter((c: any) => {
    let best: Mech | null = null, bd: number = cfg.cubes.pickup_radius
    for (const m of S.mechs) { if (!m.alive || Math.abs(m.pos[2] - c.pos[2]) > 4) continue; const d = hdist(m.pos, c.pos); if (d < bd) { bd = d; best = m } }
    if (!best) return true
    gainCubes(S, best, 1)
    pushEv(S, best, { type: "pickup", cubes: best.cubes })
    return false
  })
  // supply drops
  while (S.dropIdx < cfg.drops.times.length && S.t >= cfg.drops.times[S.dropIdx]) {
    const zz = zoneAt(S, S.t)
    const pos = S.randOpen(zz.next_center[0], zz.next_center[1], Math.max(10, zz.next_radius * cfg.drops.spread))
    S.drops.push({ id: S.ids.drop++, pos, lands: S.t + cfg.drops.fall_s, progress: 0, holder: null, landed: false })
    S.dropIdx++
  }
  for (const d of S.drops) {
    if (S.t < d.lands) continue
    if (!d.landed) { d.landed = true; sound(S, "drop", d.pos, -1) }
    const inRing = S.mechs.filter((m: Mech) => m.alive && hdist(m.pos, d.pos) <= cfg.drops.radius && Math.abs(m.pos[2] - d.pos[2]) < 6)
    if (inRing.length === 1) {
      if (d.holder !== inRing[0].id) { d.holder = inRing[0].id; d.progress = 0 }
      d.progress += DT
      if (d.progress >= cfg.drops.capture_s) {
        const m = inRing[0]
        gainCubes(S, m, cfg.drops.cubes); m.hp = m.maxHp; m.energy = m.stats.energy; d.taken = true
        pushEv(S, m, { type: "drop", id: d.id, cubes: m.cubes })
      }
    } else if (inRing.length === 0) { d.holder = null; d.progress = 0 }
  }
  S.drops = S.drops.filter((d: any) => !d.taken)
  S.crates = S.crates.filter((c: any) => c.alive)
  S.npcs = S.npcs.filter((n: any) => n.alive)
  // deaths: mechs that die on the same tick share a place
  const dying = S.mechs.filter((m: Mech) => m.alive && m.dying)
  if (dying.length) {
    const alive = S.mechs.filter((m: Mech) => m.alive).length
    for (const m of dying) die(S, m, alive - dying.length + 1)
  }
}

/** The observation for our bot, per protocol §6 and §8. With --vs-champions, `viewer` is another player: build
 *  every other player's obs first, then ours, because ours clears the shared beam list. */
export function buildObs(S: Sim, viewer?: Mech): any {
  const me = viewer ?? S.me, cfg = S.cfg, mine = me === S.me
  const seenMap: Map<number, number> = mine ? S.seen : me.seen
  const mechs: any[] = []
  for (const e of [...S.mechs, ...S.npcs]) {
    if (e === me || !e.alive) continue
    if (sees(S, me, e)) seenMap.set(e.id, S.t)
    const last = seenMap.get(e.id)
    if (last === undefined || S.t - last > cfg.vision.memory_s) continue
    if (e.kind === "mech") mechs.push({ id: e.id, kind: "mech", pos: v3(e.pos), vel: v3(e.vel), aim: [r3(e.aim[0]), r3(e.aim[1])], hp: Math.round(e.hp), max_hp: Math.round(e.maxHp), cubes: e.cubes, weapons: e.weapons.filter(Boolean).map((w: any) => w.kind), charging: !!e.charging })
    else mechs.push({ id: e.id, kind: "npc", pos: v3(e.pos), vel: v3(e.vel), aim: [r3(e.aim[0]), r3(e.aim[1])], hp: Math.round(e.hp), max_hp: e.maxHp })
  }
  const vis = (list: any[]) => list.filter((e) => sees(S, me, e))
  const hearing = ((cfg.sound.bearing_noise_deg * Math.PI) / 180) * (me.stats.hearing ?? 1)
  const sounds = (mine ? S.sounds : me.sounds).map((s: any) => {
    const d = hdist(s.pos, me.pos)
    return { kind: s.kind, bearing: r3(angDiff(Math.atan2(s.pos[1] - me.pos[1], s.pos[0] - me.pos[0]) + S.gauss() * hearing, 0)), dist: d < cfg.sound.near ? "near" : d < cfg.sound.mid ? "mid" : "far", age: r2(S.t - s.t) }
  })
  const beams = S.beams.filter((b: any) => b.by !== me.id && (sees(S, me, b.src) || hdist(b.path[b.path.length - 1], me.pos) < cfg.vision.near_range)).map((b: any) => ({ by: b.by, kind: b.kind, path: b.path, age: r2(S.t - b.t) }))
  const events = mine ? S.events : me.events, zacc = mine ? S.zoneDmgAcc : me.zacc
  if (zacc > 0) events.push({ type: "damaged", amount: r2(zacc), weapon: "zone", bearing: null, by: null })
  if (mine) { S.sounds = []; S.beams = []; S.events = []; S.zoneDmgAcc = 0 }
  else { me.sounds = []; me.events = []; me.zacc = 0 }
  const z = zoneAt(S, S.t)
  const weapons = me.weapons.map((w: any) => {
    if (!w) return null
    const o: any = { kind: w.kind, cooldown: r2(Math.max(0, w.cooldown)), stats: me.wstats[w.kind] }
    if (w.kind === "gun") { o.ammo = w.ammo; o.reload = r2(Math.max(0, w.reload)) }
    if (w.kind === "laser") o.charge = r2(w.charge)
    return o
  })
  return {
    type: "obs", tick: S.tick, t: r2(S.t), alive: S.mechs.filter((m: Mech) => m.alive).length,
    self: {
      id: me.id, pos: v3(me.pos), vel: v3(me.vel), aim: [r3(me.aim[0]), r3(me.aim[1])], hp: Math.round(me.hp), max_hp: Math.round(me.maxHp), energy: Math.round(me.energy), max_energy: me.stats.energy,
      grounded: me.grounded, cubes: me.cubes, upgrades: me.upList.slice(), weapons, in_zone: me.inZone, stats: me.stats,
    },
    mechs,
    projectiles: S.projs.filter((p: any) => p.owner !== me && sees(S, me, p)).map((p: any) => ({ id: p.id, kind: p.kind, pos: v3(p.pos), vel: v3(p.vel) })),
    crates: vis(S.crates).map((c: any) => ({ id: c.id, pos: v3(c.pos), hp: Math.round(c.hp) })),
    cubes: vis(S.cubes).map((c: any) => ({ id: c.id, pos: v3(c.pos) })),
    pickups: vis(S.pickups).map((p: any) => ({ id: p.id, kind: p.kind, pos: v3(p.pos) })),
    sounds, beams, events,
    zone: { center: [r2(z.center[0]), r2(z.center[1])], radius: r2(z.radius), next_center: [r2(z.next_center[0]), r2(z.next_center[1])], next_radius: z.next_radius, shrink_start: z.shrink_start, shrink_end: z.shrink_end, dps: z.dps },
    offer: me.offer,
    drops: S.drops.map((d: any) => ({ id: d.id, pos: v3(d.pos), radius: cfg.drops.radius, lands_in: r2(Math.max(0, d.lands - S.t)), capture_s: cfg.drops.capture_s, progress: r2(d.progress), holder: d.holder })),
  }
}

/** Apply a bot's action line to its mech (continuous parts stay, one-shot parts last one decision). */
export function setAction(m: Mech, a: any) {
  const num = (x: any) => typeof x === "number" && Number.isFinite(x)
  const act: any = { move: [0, 0], boost: !!a.boost, fire: [!!a.fire?.[0], !!a.fire?.[1]], aim: m.cmdAim }
  if (Array.isArray(a.move) && num(a.move[0]) && num(a.move[1])) act.move = [a.move[0], a.move[1]]
  if (Array.isArray(a.aim) && num(a.aim[0]) && num(a.aim[1])) act.aim = [a.aim[0], a.aim[1]]
  m.act = act
  m.once = { jump: !!a.jump, reload: !!a.reload, pick: num(a.pick) ? a.pick : null, take: num(a.take) ? a.take : null, drop: num(a.drop) ? a.drop : null }
}
