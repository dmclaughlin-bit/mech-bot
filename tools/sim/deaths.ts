/**
 * P-D-017: summarise `--death-report` CSVs into the top death causes.
 *
 *   bun tools/sim/deaths.ts --set 2000+3000 a.csv b.csv --set 4000+5000 c.csv d.csv [--md out.md] [--csv out.csv]
 *
 * A cause is mode × killer weapon × how many enemies saw us in the last 2 s (0, 1, 2+), counted per seed set, with
 * the timing split (<40 s, 40-120 s, late) and the placements lost (place − 1). Only our deaths are counted.
 */
import { readFileSync, writeFileSync } from "node:fs"

const args = process.argv.slice(2)
const sets: { name: string; files: string[] }[] = []
let md = "", csvOut = ""
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--set") sets.push({ name: args[++i], files: [] })
  else if (args[i] === "--md") md = args[++i]
  else if (args[i] === "--csv") csvOut = args[++i]
  else sets[sets.length - 1]?.files.push(args[i])
}
if (!sets.length) { console.error("usage: bun tools/sim/deaths.ts --set <name> <csv>... [--set ...] [--md out.md] [--csv out.csv]"); process.exit(2) }

function readCsv(f: string): Record<string, string>[] {
  const lines = readFileSync(f, "utf8").trim().split("\n")
  const split = (l: string) => { const out: string[] = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === "," && !q) { out.push(cur); cur = "" } else cur += ch } out.push(cur); return out }
  const head = split(lines[0])
  return lines.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [head[i], v])))
}
const seersB = (n: number) => (n >= 2 ? "2+ saw us" : n === 1 ? "1 saw us" : "unseen")
const timeB = (t: number) => (t < 40 ? "<40 s" : t < 120 ? "40-120 s" : "late")

type Agg = { n: number; lost: number; t: Record<string, number> }
const out: string[] = ["# Death causes (P-D-017 --death-report)", ""]
const csvRows: string[] = ["set,cause,mode,weapon,seers,deaths,placements_lost,lt40,t40_120,late,share_of_deaths"]
for (const set of sets) {
  const rows = set.files.flatMap(readCsv)
  if (rows.length && !("dr_mode_cat" in rows[0])) { console.error(`${set.name}: no dr_* columns; run with --death-report`); process.exit(1) }
  const deaths = rows.filter((r) => r.death_t !== "")
  const by = new Map<string, Agg>(), dim: Record<string, Map<string, Agg>> = { mode: new Map(), weapon: new Map(), seers: new Map(), time: new Map(), hit: new Map(), trees: new Map() }
  const add = (m: Map<string, Agg>, k: string, r: Record<string, string>) => {
    const a = m.get(k) ?? { n: 0, lost: 0, t: { "<40 s": 0, "40-120 s": 0, late: 0 } }
    a.n++; a.lost += Number(r.place) - 1; a.t[timeB(Number(r.death_t))]++; m.set(k, a)
  }
  for (const r of deaths) {
    const s = seersB(Number(r.dr_seers_2s || 0))
    add(by, `${r.dr_mode_cat} | ${r.killer_weapon || "?"} | ${s}`, r)
    add(dim.mode, r.dr_mode_cat, r); add(dim.weapon, r.killer_weapon || "?", r); add(dim.seers, s, r); add(dim.time, timeB(Number(r.death_t)), r)
    add(dim.hit, r.dr_hit || "n/a", r); add(dim.trees, r.dr_trees_blocked === "" ? "trees off" : r.dr_trees_blocked === "1" ? "a tree blocked a sightline (2 s)" : "no tree block", r)
  }
  const top = [...by.entries()].sort((a, b) => b[1].n - a[1].n)
  out.push(`## ${set.name}: ${rows.length} games, ${deaths.length} deaths`, "", "| # | mode | killer weapon | sightlines (2 s) | deaths | <40 s | 40-120 s | late | placements lost |", "|---|---|---|---|---|---|---|---|---|")
  top.slice(0, 5).forEach(([k, a], i) => { const [m, w, s] = k.split(" | "); out.push(`| ${i + 1} | ${m} | ${w} | ${s} | ${a.n} | ${a.t["<40 s"]} | ${a.t["40-120 s"]} | ${a.t.late} | ${a.lost} |`) })
  for (const [k, a] of top) { const [m, w, s] = k.split(" | "); csvRows.push([set.name, `"${k}"`, m, w, s, a.n, a.lost, a.t["<40 s"], a.t["40-120 s"], a.t.late, (a.n / Math.max(1, deaths.length)).toFixed(3)].join(",")) }
  out.push("")
  for (const [name, m] of Object.entries(dim)) out.push(`- **${name}:** ` + [...m.entries()].sort((a, b) => b[1].n - a[1].n).map(([k, a]) => `${k} ${a.n}`).join(", "))
  out.push("")
}
const text = out.join("\n") + "\n"
if (md) writeFileSync(md, text); else console.log(text)
if (csvOut) writeFileSync(csvOut, csvRows.join("\n") + "\n")
