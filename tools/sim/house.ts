/**
 * The 15 house bots as one scripted squad (track rules): shared vision, no friendly fire, hunting our bot with one
 * hunter early, more as house bots die and as time passes, everyone late. Tiers differ in aim error, reaction
 * time and aggression (tune.ts). Bots that are not hunting pick up weapons and farm crates and drones.
 */
import { type Mech, type Sim, angDiff, centerOf, hdist, sees, zoneAt } from "./engine.ts"
import { clear, findPath, freeLine, groundAt, walkable } from "./geom.ts"
import { AIM_RESAMPLE_S, SQUAD, TIERS } from "./tune.ts"

const TAU = Math.PI * 2

function follow(S: Sim, h: Mech, gx: number, gy: number): [number, number] {
  const ai = h.ai
  const moved = !ai.pathGoal || Math.hypot(ai.pathGoal[0] - gx, ai.pathGoal[1] - gy) > 10
  if (!ai.path || moved || S.t - ai.pathT > 4) {
    ai.path = freeLine(S.geo, h.pos[0], h.pos[1], gx, gy) && walkable(S.geo, gx, gy) ? [h.pos[0], h.pos[1], gx, gy] : findPath(S.geo, h.pos[0], h.pos[1], gx, gy) ?? [h.pos[0], h.pos[1], gx, gy]
    ai.pathI = 1; ai.pathGoal = [gx, gy]; ai.pathT = S.t
  }
  const p = ai.path
  while (ai.pathI < p.length / 2 - 1 && Math.hypot(p[2 * ai.pathI] - h.pos[0], p[2 * ai.pathI + 1] - h.pos[1]) < 3) ai.pathI++
  const dx = p[2 * ai.pathI] - h.pos[0], dy = p[2 * ai.pathI + 1] - h.pos[1], d = Math.hypot(dx, dy)
  // stuck: sidestep and replan
  if (!ai.stuckP || S.t - ai.stuckT > 2) {
    if (ai.stuckP && hdist(ai.stuckP, h.pos) < 1.5 && d > 3) { ai.path = null; ai.sideT = S.t + 0.7; ai.sideA = S.rng() * TAU }
    ai.stuckP = h.pos.slice(); ai.stuckT = S.t
  }
  if (ai.sideT > S.t) return [Math.cos(ai.sideA), Math.sin(ai.sideA)]
  return d < 0.5 ? [0, 0] : [dx / d, dy / d]
}

/** Yaw and pitch from h's muzzle to where `e` will be when a shot of `speed` arrives (0 = hitscan). */
function solve(S: Sim, h: Mech, e: any, speed: number, mortar?: any): [number, number] {
  const o = [h.pos[0], h.pos[1], h.pos[2] + (mortar ? h.stats.height + 0.5 : h.stats.muzzle_height)]
  let c = centerOf(e, S)
  const v = e.vel ?? [0, 0, 0]
  if (speed > 0) for (let i = 0; i < 2; i++) {
    const t = Math.hypot(c[0] - o[0], c[1] - o[1], c[2] - o[2]) / (mortar ? speed * 0.85 : speed)
    const b = centerOf(e, S)
    c = [b[0] + v[0] * t, b[1] + v[1] * t, b[2]]
  }
  const hd = Math.hypot(c[0] - o[0], c[1] - o[1])
  if (mortar) {
    const x = Math.min(1, (mortar.gravity * hd) / (speed * speed))
    return [Math.atan2(c[1] - o[1], c[0] - o[0]), 0.5 * Math.asin(x)]
  }
  return [Math.atan2(c[1] - o[1], c[0] - o[0]), Math.atan2(c[2] - o[2], hd)]
}

export function squadDecide(S: Sim) {
  const me = S.me
  const house: Mech[] = S.mechs.filter((m: Mech) => m.alive && m.tier)
  const sq = (S.squad ??= { known: me.pos.slice(), knownT: 0, hunters: new Set<number>(), total: house.length })
  let seen = false
  for (const h of house) {
    const s = me.alive && sees(S, h, me)
    if (s && !h.ai.seesMe) h.ai.seeSince = S.t
    h.ai.seesMe = s
    if (s) seen = true
  }
  if (seen) { sq.known = me.pos.slice(); sq.knownT = S.t }
  else if (me.ai.firedT !== undefined && S.t - me.ai.firedT < 0.15 && house.some((h) => hdist(h.pos, me.pos) < SQUAD.hearGunM)) {
    sq.known = [me.pos[0] + S.gauss() * 12, me.pos[1] + S.gauss() * 12, me.pos[2]]; sq.knownT = S.t
  }
  const dead = sq.total - house.length
  let want = SQUAD.huntersStart + dead * SQUAD.huntersPerDeath + (S.t < SQUAD.huntersTimeStartS ? 0 : 1 + Math.floor((S.t - SQUAD.huntersTimeStartS) / SQUAD.huntersEveryS))
  if (S.t >= SQUAD.allAtS || house.length <= SQUAD.allWhenAliveLE) want = house.length
  want = Math.min(want, house.length)
  for (const id of [...sq.hunters]) if (!S.mechs[id].alive) sq.hunters.delete(id)
  while (sq.hunters.size < want) {
    let best: Mech | null = null, bd = Infinity
    for (const h of house) { if (sq.hunters.has(h.id)) continue; const d = hdist(h.pos, sq.known); if (d < bd) { bd = d; best = h } }
    if (!best) break
    sq.hunters.add(best.id)
  }
  S.huntersNow = sq.hunters.size
  for (const h of house) decide(S, h, sq)
}

function decide(S: Sim, h: Mech, sq: any) {
  const T = TIERS[h.tier as keyof typeof TIERS], ai = h.ai, me = S.me, rng = S.rng
  const act: any = { move: [0, 0], boost: false, fire: [false, false], aim: h.cmdAim }
  const once: any = {}
  if (h.offer) once.pick = Math.floor(rng() * h.offer.choices.length)
  const dMe = hdist(h.pos, me.pos)
  const hunter = sq.hunters.has(h.id)
  const fight = me.alive && (hunter || (ai.hitByMeT !== undefined && S.t - ai.hitByMeT < SQUAD.retaliateS) || (ai.seesMe && dMe < T.engageR))
  ai.fightingMe = fight
  if (ai.errT === undefined || S.t >= ai.errT) {
    const s = (T.aimSigmaDeg * Math.PI) / 180
    ai.err = [S.gauss() * s, S.gauss() * s * 0.5]; ai.errT = S.t + AIM_RESAMPLE_S
  }
  // zone: leave for the next circle in time
  const z = zoneAt(S, S.t)
  const dNext = hdist(h.pos, z.next_center)
  const mustMove = !h.inZone || (dNext > z.next_radius - 15 && S.t > z.shrink_start - (dNext - z.next_radius + 30) / h.stats.walk_speed - 10)
  let target: any = null, sigmaMul = 1, mv: [number, number] = [0, 0]

  if (fight) {
    target = ai.seesMe ? me : null
    if (ai.seesMe) {
      if (ai.strafeT === undefined || S.t >= ai.strafeT) { ai.strafeT = S.t + 1.2 + rng() * 1.8; ai.strafeDir = rng() < T.strafe ? (rng() < 0.5 ? 1 : -1) : 0 }
      const a = Math.atan2(me.pos[1] - h.pos[1], me.pos[0] - h.pos[0])
      if (dMe > T.prefRange + 10) { mv = freeLine(S.geo, h.pos[0], h.pos[1], me.pos[0], me.pos[1]) ? [Math.cos(a), Math.sin(a)] : follow(S, h, me.pos[0], me.pos[1]); act.boost = T.boostChase && dMe > T.prefRange + 40 && h.energy > 40 }
      else if (dMe < T.prefRange - 25) mv = [-Math.cos(a), -Math.sin(a)]
      else mv = [Math.cos(a + (ai.strafeDir * Math.PI) / 2) * Math.abs(ai.strafeDir), Math.sin(a + (ai.strafeDir * Math.PI) / 2) * Math.abs(ai.strafeDir)]
    } else {
      if (hdist(h.pos, sq.known) < 25 && S.t - sq.knownT > 3) { sq.known = me.pos.slice(); sq.knownT = S.t }
      mv = follow(S, h, sq.known[0], sq.known[1])
      act.boost = T.boostChase && h.energy > 50
    }
  } else {
    // farm: cubes nearby, then a weapon for an empty slot, then crates and drones, else wander inside the next circle
    const inNext = (p: number[]) => hdist(p, z.next_center) < z.next_radius - 10
    const low = (p: number[]) => Math.abs(p[2] - groundAt(S.geo, p[0], p[1])) < 2 && walkable(S.geo, p[0], p[1])
    let cube: any = null, cd = 40
    for (const c of S.cubes) { const d = hdist(c.pos, h.pos); if (d < cd && low(c.pos)) { cd = d; cube = c } }
    const g = ai.goal
    if (g && (S.t > g.until || (g.ref && g.ref.alive === false) || (g.kind === "pickup" && !S.pickups.includes(g.ref)) || !inNext(g.pos))) ai.goal = null
    if (!ai.goal) {
      let best: any = null, bd = 260
      if (h.weapons.some((w: any) => !w)) for (const p of S.pickups) { const d = hdist(p.pos, h.pos); if (d < bd && low(p.pos) && inNext(p.pos) && !h.weapons.some((w: any) => w && w.kind === p.kind)) { bd = d; best = { kind: "pickup", ref: p, pos: p.pos } } }
      if (!best) for (const e of [...S.crates, ...S.npcs]) { const d = hdist(e.pos, h.pos); if (d < bd && low(e.pos) && inNext(e.pos)) { bd = d; best = { kind: "shoot", ref: e, pos: e.pos } } }
      if (!best) { const a = rng() * TAU, d = Math.sqrt(rng()) * z.next_radius * 0.7; best = { kind: "walk", pos: [z.next_center[0] + Math.cos(a) * d, z.next_center[1] + Math.sin(a) * d, 0] } }
      best.until = S.t + 25
      ai.goal = best
    }
    const goal = ai.goal
    if (cube) mv = follow(S, h, cube.pos[0], cube.pos[1])
    else if (goal.kind === "shoot") {
      const d = hdist(goal.ref.pos, h.pos)
      const open = d < 60 && clear(S.geo, [h.pos[0], h.pos[1], h.pos[2] + h.stats.muzzle_height], centerOf(goal.ref, S), 2)
      if (open) { target = goal.ref; sigmaMul = 0.3 }
      if (!open || d > 35) mv = follow(S, h, goal.ref.pos[0], goal.ref.pos[1])
    } else {
      mv = follow(S, h, goal.pos[0], goal.pos[1])
      if (hdist(goal.pos, h.pos) < 3) { if (goal.kind === "pickup") once.take = goal.ref.id; else ai.goal = null }
    }
  }
  if (mustMove && !(fight && h.inZone && dNext < z.next_radius + 40 && S.t < z.shrink_start)) {
    const a = Math.atan2(h.pos[1] - z.next_center[1], h.pos[0] - z.next_center[0]), r = z.next_radius * 0.6
    mv = follow(S, h, z.next_center[0] + Math.cos(a) * r, z.next_center[1] + Math.sin(a) * r)
    act.boost = !h.inZone && h.energy > 20
  }
  act.move = mv

  // aim and triggers
  if (target) {
    const d = hdist(target.pos, h.pos)
    const reacted = target !== me || S.t - (ai.seeSince ?? S.t) >= T.reactS
    const muzzleClear = clear(S.geo, [h.pos[0], h.pos[1], h.pos[2] + h.stats.muzzle_height], centerOf(target, S), 2.6)
    const mi = h.weapons.findIndex((w: any) => w && w.kind === "mortar")
    const useMortar = mi >= 0 && target === me && h.weapons[mi].cooldown <= 0.3 && d > 25 && d < 180
    let want: [number, number]
    if (useMortar) want = solve(S, h, target, h.wstats.mortar.speed, h.wstats.mortar)
    else {
      const gun = h.weapons.find((w: any) => w && w.kind === "gun")
      const laser = h.weapons.find((w: any) => w && w.kind === "laser")
      want = solve(S, h, target, laser && laser.charge > 0 ? 0 : gun ? h.wstats.gun.speed : 0)
    }
    want = [want[0] + ai.err[0] * sigmaMul, want[1] + ai.err[1] * sigmaMul]
    act.aim = want
    const aligned = Math.abs(angDiff(h.aim[0], want[0])) < 0.04 && Math.abs(h.aim[1] - want[1]) < 0.05
    for (let s = 0; s < 2; s++) {
      const w = h.weapons[s]
      if (!w || !reacted) continue
      const st = h.wstats[w.kind]
      if (w.kind === "gun") act.fire[s] = !useMortar && aligned && muzzleClear && d <= (target === me ? SQUAD.gunOpenM : 60)
      else if (w.kind === "laser") act.fire[s] = target === me && muzzleClear && d < 200 && !useMortar && (w.charge < st.charge - 1e-6 || !aligned) && (w.charge > 0 || w.cooldown <= 0)
      else if (w.kind === "lightning") act.fire[s] = muzzleClear && d < st.range - 3 && Math.abs(angDiff(h.aim[0], want[0])) < 0.3
      else if (w.kind === "mortar") act.fire[s] = useMortar && aligned
    }
  } else if (Math.hypot(mv[0], mv[1]) > 0.1) act.aim = [Math.atan2(mv[1], mv[0]), 0]
  h.act = act; h.once = once
}
