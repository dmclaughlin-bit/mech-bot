/**
 * Build 16 (target pick): which enemy mech to shoot.
 *
 * Until Build 13 the bot shot the nearest enemy with a clear line. The practice house bots are one squad that never
 * fights itself, so a place is gained only when one of them dies, and damage spread over several of them regenerates
 * (regen starts after mech.regen_delay). So each enemy in view gets a kill value, the best one is locked, and the
 * lock holds until that enemy dies or has been lost (out of view, or no clear line) for TARGET_LOST_S.
 *
 * Kill value, higher is better (weights in TARGET_W):
 *   shot  : 1 when we have a clear line and a weapon that reaches it
 *   ttk   : 1 / (1 + ttk / TARGET_TTK_REF_S), ttk = its hp / our DPS on it (0 with no shot)
 *   hp    : 1 − hp / max_hp
 *   weak  : 1 − (DPS of the weapons it is seen holding) / (the best two-weapon DPS in the config)
 *   alone : 1 when no other enemy is within TARGET_ALONE_M of it
 * Every weapon number comes from hello.config.weapons (ours after upgrades, from self.weapons[].stats).
 *
 * Zone rule: an enemy outside the current circle can be picked only while we can shoot it from where we stand, so a
 * pick never asks us to leave the zone. This module only picks; it never moves the bot.
 */
import { TARGET_ALONE_M, TARGET_LOST_S, TARGET_TTK_REF_S, TARGET_W } from "./params.ts"
import type { WeaponKind, WeaponObs } from "./mechfight.ts"

type Stats = Record<string, number>
type WeaponTable = Record<string, Stats>

/** Sustained DPS of one weapon from its stats, with no range or accuracy factor. */
export function weaponDps(kind: WeaponKind, s: Stats): number {
  const dmg = s.damage ?? 0
  if (kind === "gun") {
    const mag = s.mag ?? 1
    return (dmg * mag) / (mag * (s.cooldown ?? 1) + (s.reload ?? 0))
  }
  if (kind === "laser") return dmg / ((s.charge ?? 0) + (s.cooldown ?? 1))
  return dmg / (s.cooldown ?? 1)
}

/**
 * Our DPS on a target `d` m away with a clear line. The gun fades past `gunGate` (D4: its fire gate closes there and
 * a sideways mover dodges), and a mortar rarely lands on a walking mech.
 */
export function ourDps(weapons: (WeaponObs | null)[], table: WeaponTable, d: number, gunGate: number): number {
  let sum = 0
  for (const w of weapons) {
    if (!w) continue
    const s = { ...table[w.kind], ...w.stats }
    if (w.kind === "mortar") {
      if (d > 15) sum += 0.3 * weaponDps(w.kind, s)
    } else if (d <= (s.range ?? Infinity)) sum += weaponDps(w.kind, s) * (w.kind === "gun" ? Math.min(1, gunGate / d) : 1)
  }
  return sum
}

/** The largest DPS any two different weapons in the config give together: the scale for "weak weapons". */
export function topPairDps(table: WeaponTable): number {
  const all = (Object.keys(table) as WeaponKind[]).map((k) => weaponDps(k, table[k])).sort((a, b) => b - a)
  return (all[0] ?? 0) + (all[1] ?? 0) || 1
}

export type Candidate = {
  id: number
  /** horizontal position, for the alone and zone tests */
  pos: number[]
  /** muzzle-to-center distance (m) */
  d: number
  /** clear line from our muzzle to its center */
  clear: boolean
  hp: number
  maxHp: number
  /** weapons it is seen holding; undefined when never seen */
  weapons?: WeaponKind[]
}
export type Scored = Candidate & {
  /** clear line and a weapon of ours reaches it */
  shot: boolean
  ttk: number
  alone: boolean
  /** false: outside the circle with no shot from here, so it can't be picked */
  eligible: boolean
  score: number
}
export type Zone = { center: number[]; radius: number }

/** Score every candidate. `others` are the enemy positions used for the alone test (the candidates and remembered ones). */
export function scoreTargets(
  cands: Candidate[], others: { id: number; pos: number[] }[], weapons: (WeaponObs | null)[], table: WeaponTable, gunGate: number, zone: Zone,
): Scored[] {
  const pair = topPairDps(table)
  return cands.map((c) => {
    const dps = c.clear ? ourDps(weapons, table, c.d, gunGate) : 0
    const shot = dps > 0
    const ttk = shot ? c.hp / dps : Infinity
    const alone = !others.some((o) => o.id !== c.id && Math.hypot(o.pos[0] - c.pos[0], o.pos[1] - c.pos[1]) < TARGET_ALONE_M)
    const threat = c.weapons ? Math.min(1, c.weapons.reduce((a, k) => a + (table[k] ? weaponDps(k, table[k]) : 0), 0) / pair) : 0.5
    const inZone = Math.hypot(c.pos[0] - zone.center[0], c.pos[1] - zone.center[1]) <= zone.radius
    const score =
      TARGET_W.shot * Number(shot) +
      TARGET_W.ttk * (shot ? 1 / (1 + ttk / TARGET_TTK_REF_S) : 0) +
      TARGET_W.hp * (1 - Math.min(1, c.hp / (c.maxHp || 1))) +
      TARGET_W.weak * (1 - threat) +
      TARGET_W.alone * Number(alone)
    return { ...c, shot, ttk, alone, eligible: inZone || shot, score }
  })
}

export type Pick = {
  /** who to aim at this decision, or null for nobody */
  target: Scored | null
  /** lock: the locked target. interim: the lock has no shot right now, so shoot this one until it is back or lost. track: nobody can be picked, face the nearest. */
  role: "lock" | "interim" | "track" | "none"
  /** set on the decision a lock starts */
  locked?: "first" | "died" | "lost" | "zone"
}

/**
 * The lock (hysteresis). Call once per decision with this decision's scores and the ids killed since the last one.
 * A lock ends only when its target dies, has had no shot for TARGET_LOST_S, or can't be picked under the zone rule.
 */
export function createTargetLock() {
  let lock: { id: number; shotAt: number } | null = null
  let ended: "first" | "died" | "lost" | "zone" = "first"
  return {
    get id() {
      return lock?.id ?? null
    },
    pick(scored: Scored[], t: number, killed: number[]): Pick {
      const best = (list: Scored[]) => list.reduce<Scored | null>((a, b) => (!a || b.score > a.score || (b.score === a.score && b.d < a.d) ? b : a), null)
      const nearest = scored.reduce<Scored | null>((a, b) => (!a || b.d < a.d ? b : a), null)
      let held = lock ? scored.find((s) => s.id === lock!.id) ?? null : null
      if (lock) {
        if (killed.includes(lock.id)) (lock = null), (ended = "died"), (held = null)
        else if (held && !held.eligible) (lock = null), (ended = "zone"), (held = null)
        else if (held?.shot) lock.shotAt = t
        else if (t - lock.shotAt > TARGET_LOST_S) (lock = null), (ended = "lost"), (held = null)
      }
      if (lock) {
        if (held?.shot) return { target: held, role: "lock" }
        // Lost for under TARGET_LOST_S: the lock stays, and any other enemy we can shoot meanwhile is free damage.
        const other = best(scored.filter((s) => s.shot && s.id !== lock!.id))
        if (other) return { target: other, role: "interim" }
        return held ? { target: held, role: "lock" } : { target: nearest, role: nearest ? "track" : "none" }
      }
      const top = best(scored.filter((s) => s.eligible))
      if (!top) return { target: nearest, role: nearest ? "track" : "none" }
      lock = { id: top.id, shotAt: t }
      return { target: top, role: "lock", locked: ended }
    },
  }
}
