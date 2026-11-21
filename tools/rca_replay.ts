/**
 * RCA measurement over spectator recordings (mechreplay/1 live.jsonl). Read-only; touches no bot code.
 * Usage: bun tools/rca_replay.ts <live.jsonl> [...]
 *
 * Measures, per complete match:
 *  - regen: after each mech's last hit (dealt or taken), the delay until HP first rises and the rise rate (Q8)
 *  - house-vs-human matches ("bots" header lists "human"/"house:*"): how many distinct house mechs hit each
 *    human, the gaps between hits taken (a gap >= regen_delay is a chance to regen), house-on-house kills (Q9)
 *  - cubes_max and place for every mech from the result payload (Q7)
 */
import { readFileSync } from "node:fs"

type Frame = { t: number; m: number[][]; ev?: any[] }
type Match = { header: any; frames: Frame[]; result: any | null; file: string }

function load(file: string): Match[] {
  const out: Match[] = []
  let cur: Match | null = null
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue
    let o: any
    try { o = JSON.parse(line) } catch { continue }
    if (o.type === "header") { cur = { header: o, frames: [], result: null, file }; out.push(cur) }
    else if (o.type === "result") { if (cur) cur.result = o }
    else if (o.type === undefined && cur && o.m) cur.frames.push(o)
  }
  return out.filter((m) => m.result && m.frames.length > 100)
}

const files = process.argv.slice(2)
const seen = new Set<number>()
const regenDelays: number[] = [], regenRates: number[] = []
const humanRows: any[] = []
let houseOnHouseKills = 0, houseDeaths = 0
const cubeRows: { place: number; cubes: number; human: boolean }[] = []

for (const f of files) for (const mt of load(f)) {
  if (seen.has(mt.header.seed)) continue
  seen.add(mt.header.seed)
  const hz = mt.header.tick_hz ?? 20
  const bots: string[] = mt.header.bots ?? []
  const isHuman = (id: number) => bots[id] === "human"
  const isHouse = (id: number) => (bots[id] ?? "").startsWith("house")
  const houseMatch = bots.some((b) => b === "human") && bots.some((b) => b.startsWith("house"))
  // hp series and last-combat tick per mech
  const lastCombat = new Map<number, number>() // tick of last hit dealt or taken (mech-on-anything)
  const hitsOn = new Map<number, { tick: number; src: number; amt: number }[]>()
  const prevHp = new Map<number, number>()
  const regenStart = new Map<number, { tick: number; hp: number; since: number }>()
  for (const fr of mt.frames) {
    for (const e of fr.ev ?? []) {
      if (e.e === "hit") {
        if (e.src != null && e.src < 16) lastCombat.set(e.src, e.t)
        if (e.dst < 16) {
          lastCombat.set(e.dst, e.t)
          const a = hitsOn.get(e.dst) ?? []
          a.push({ tick: e.t, src: e.src, amt: e.amt })
          hitsOn.set(e.dst, a)
        }
      }
    }
    for (const row of fr.m) {
      const [id, , , , , , hp] = row
      const p = prevHp.get(id)
      if (p !== undefined && hp > p + 0.5) {
        const lc = lastCombat.get(id)
        const r = regenStart.get(id)
        if (!r && lc !== undefined) regenStart.set(id, { tick: fr.t, hp: p, since: (fr.t - lc) / hz })
      } else if (p !== undefined && hp <= p) {
        const r = regenStart.get(id)
        if (r) {
          const dur = (fr.t - r.tick) / hz
          // ignore cube/drop jumps (instant) and short blips
          if (dur >= 1) { regenDelays.push(r.since); regenRates.push((p - r.hp) / dur) }
          regenStart.delete(id)
        }
      }
      prevHp.set(id, hp)
    }
  }
  for (const r of mt.result.mechs) {
    cubeRows.push({ place: r.place, cubes: r.cubes_max ?? 0, human: isHuman(r.id) })
    if (houseMatch && isHouse(r.id) && r.death_t != null) {
      houseDeaths++
      if (r.killed_by != null && isHouse(r.killed_by)) houseOnHouseKills++
    }
  }
  if (!houseMatch) continue
  for (const r of mt.result.mechs) {
    if (!isHuman(r.id)) continue
    const hs = (hitsOn.get(r.id) ?? []).filter((h) => h.src != null && h.src < 16)
    const attackers = new Set(hs.map((h) => h.src))
    let gaps5 = 0, maxGap = 0
    for (let i = 1; i < hs.length; i++) {
      const g = (hs[i].tick - hs[i - 1].tick) / hz
      if (g >= 5) gaps5++
      maxGap = Math.max(maxGap, g)
    }
    // concurrent attackers: max distinct sources within any 10 s window
    let conc = 0
    for (let i = 0; i < hs.length; i++) {
      const s = new Set<number>()
      for (let j = i; j < hs.length && hs[j].tick - hs[i].tick <= 10 * hz; j++) s.add(hs[j].src)
      conc = Math.max(conc, s.size)
    }
    const firstHit = hs.length ? hs[0].tick / hz : null
    humanRows.push({
      seed: mt.header.seed, name: r.name, place: r.place, life: r.death_t ?? mt.result.ticks / hz, kills: r.kills,
      dmgTaken: r.damage_taken, cubes: r.cubes_max, attackers: attackers.size, maxIn10s: conc, firstHit, gapsGe5s: gaps5, maxGap: +maxGap.toFixed(1),
    })
  }
}

const med = (a: number[]) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN }
console.log(`matches: ${seen.size}`)
console.log(`regen episodes: ${regenDelays.length}; delay since last hit dealt/taken: median ${med(regenDelays).toFixed(2)} s, min ${Math.min(...regenDelays).toFixed(2)} s, share <4.9 s ${(regenDelays.filter((d) => d < 4.9).length / regenDelays.length * 100).toFixed(1)}%`)
console.log(`regen rate: median ${med(regenRates).toFixed(1)} HP/s`)
console.log(`house-match house deaths: ${houseDeaths}, killed by another house bot: ${houseOnHouseKills}`)
console.log("humans vs house squad:")
console.table(humanRows)
const byPlace = (lo: number, hi: number, h?: boolean) => cubeRows.filter((r) => r.place >= lo && r.place <= hi && (h === undefined || r.human === h)).map((r) => r.cubes)
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / (a.length || 1)
console.log(`cubes_max mean: places 1-2 ${mean(byPlace(1, 2)).toFixed(1)} (n=${byPlace(1, 2).length}), 3-8 ${mean(byPlace(3, 8)).toFixed(1)}, 9-16 ${mean(byPlace(9, 16)).toFixed(1)}`)
