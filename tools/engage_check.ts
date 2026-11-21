/**
 * Build 14 offline check: run the brain on recorded observations and count how often the engage rule (TTK vs TTD, and
 * the finish rule) fires, and how often it overrides the HP retreat. OFFLINE ONLY: the recording is not reactive (our
 * actions do not change later observations), so these counts say whether the rule fires and on what, never how a
 * match would go. They are not scores.
 *
 *   bun tools/engage_check.ts [stream.jsonl[.gz]] [arenaDir] < /dev/null
 *
 * Pass 1 replays the recording as it is. Pass 2 is a what-if grid on the same recording: every observation is
 * rewritten so we are at a set HP fraction, the visible enemy mech is at a set HP, and that enemy damaged us this
 * tick. That exercises the rule on real positions, sight lines and weapons, with made-up HP numbers (labelled as such
 * below). The rows at 60% and 35% of our HP sit at or above the finish rule's HP floor (ENGAGE_FINISH_HP), where the
 * retreat does not trigger, so the finish rule shows there as engage ticks, not overrides.
 *
 * "Retreat would trigger" is the Build 5 condition, worked out here from the observations: a hit with a bearing in
 * the last 2 s and HP below params.retreatHp. An override is such a tick where the brain's mode is "engage, ttk" or
 * "engage, finish", counted per rule.
 * The file holds one hello line, then obs lines (the kit's check/stream.jsonl.gz format). Defaults to the kit stream.
 * stdin must be closed: map.ts imports mechfight.ts.
 */
import { existsSync, readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { createBot } from "../brain.ts"
import { draw, type Hello, type Observation } from "../mechfight.ts"
import { ENGAGE_FINISH_HP, ENGAGE_ON, params } from "../params.ts"

const arg = process.argv.slice(2)
const kit = ["../mechfight-kit", "/workspace/mechfight-kit"].find((d) => existsSync(`${d}/check/stream.jsonl.gz`))
const file = arg[0] ?? (kit ? `${kit}/check/stream.jsonl.gz` : "")
const arena = arg[1] ?? (kit ? `${kit}/arena` : "/arena")
if (!file || !existsSync(file)) {
  console.error("usage: bun tools/engage_check.ts <stream.jsonl[.gz]> [arenaDir]")
  process.exit(2)
}
const raw = readFileSync(file)
const lines = (file.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8").split("\n").filter(Boolean)
const hello = JSON.parse(lines[0]) as Hello
if (hello.type !== "hello") throw new Error("first line is not a hello")
hello.map.dir = arena
const recorded = lines.slice(1).map((l) => JSON.parse(l) as Observation).filter((o) => o.type === "obs")

type Tally = { obs: number; withEnemy: number; retreatWould: number; overTtk: number; overFinish: number; modes: Map<string, number> }

/** Replay `obs` through a fresh brain and tally its modes. `rewrite` may change each observation first. */
function replay(rewrite?: (o: Observation) => void): Tally {
  const bot = createBot(hello)
  const tally: Tally = { obs: 0, withEnemy: 0, retreatWould: 0, overTtk: 0, overFinish: 0, modes: new Map() }
  let lastHit = -Infinity
  for (const original of recorded) {
    const obs = structuredClone(original)
    rewrite?.(obs)
    tally.obs++
    if (obs.mechs.some((m) => m.kind === "mech")) tally.withEnemy++
    for (const e of obs.events) if (e.type === "damaged" && e.bearing !== null) lastHit = obs.t
    bot.act(obs)
    const mode = (draw.take()?.label ?? "").split(" · ").at(-1) ?? "?"
    tally.modes.set(mode, (tally.modes.get(mode) ?? 0) + 1)
    // The retreat ranks below zone escape and leaving for the next circle, so those ticks are not retreat ticks.
    const zoneFirst = mode === "zone escape" || mode === "to next circle"
    if (!zoneFirst && obs.t - lastHit < 2 && obs.self.hp < params.retreatHp * obs.self.max_hp) {
      tally.retreatWould++
      if (mode === "engage, ttk") tally.overTtk++
      if (mode === "engage, finish") tally.overFinish++
    }
  }
  return tally
}
const count = (t: Tally, prefix: string) => [...t.modes].filter(([m]) => m.startsWith(prefix)).reduce((n, [, c]) => n + c, 0)

console.log(`OFFLINE replay of ${file} (non-reactive recording; counts are not scores)`)
console.log(`ENGAGE_ON ${ENGAGE_ON}  aggression ${params.aggression}  retreatHp ${params.retreatHp}  finish HP floor ${ENGAGE_FINISH_HP}`)

const plain = replay()
console.log(`\nPass 1, recording as it is: ${plain.obs} observations, ${plain.withEnemy} with an enemy mech in view`)
console.log(`  retreat would trigger: ${plain.retreatWould}  overridden by TTK rule: ${plain.overTtk}  by finish rule: ${plain.overFinish}`)
console.log(`  engage ticks in all: TTK rule ${plain.modes.get("engage, ttk") ?? 0}, finish rule ${plain.modes.get("engage, finish") ?? 0}`)
for (const [m, n] of [...plain.modes].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${m}`)

console.log("\nPass 2, what-if grid (HP numbers made up; positions, sight lines and weapons from the recording).")
console.log("Each tick: we are at the given HP, the enemy in view is at the given HP and has just damaged us.")
console.log("  our HP  enemy HP  retreat would  override,ttk  override,finish  engage,ttk  engage,finish  retreat modes")
let wouldAll = 0, ttkAll = 0, finishAll = 0, ttkTicks = 0, finishTicks = 0
for (const mine of [0.6, 0.35, 0.3, 0.15]) {
  for (const theirs of [150, 300, 540, 800, 1400]) {
    const t = replay((o) => {
      o.self.hp = Math.round(mine * o.self.max_hp)
      const foe = o.mechs.find((m) => m.kind === "mech")
      if (!foe) return
      foe.hp = theirs
      const bearing = Math.atan2(foe.pos[1] - o.self.pos[1], foe.pos[0] - o.self.pos[0])
      o.events = [...o.events, { type: "damaged", amount: 45, weapon: "gun", bearing, by: foe.id }]
    })
    wouldAll += t.retreatWould
    ttkAll += t.overTtk
    finishAll += t.overFinish
    ttkTicks += t.modes.get("engage, ttk") ?? 0
    finishTicks += t.modes.get("engage, finish") ?? 0
    const cell = (n: number, w: number) => String(n).padStart(w)
    console.log(
      `  ${cell(Math.round(mine * 100), 5)}%  ${cell(theirs, 8)}  ${cell(t.retreatWould, 13)}  ${cell(t.overTtk, 12)}  ${cell(t.overFinish, 15)}  ${cell(t.modes.get("engage, ttk") ?? 0, 10)}  ${cell(t.modes.get("engage, finish") ?? 0, 13)}  ${cell(count(t, "retreat"), 13)}`,
    )
  }
}
const pct = (n: number) => (wouldAll ? ((100 * n) / wouldAll).toFixed(0) : 0)
console.log(`  grid total: retreat would trigger ${wouldAll}; overridden by the TTK rule ${ttkAll} (${pct(ttkAll)}%), by the finish rule ${finishAll} (${pct(finishAll)}%)`)
console.log(`  grid engage ticks in all: TTK rule ${ttkTicks}, finish rule ${finishTicks}`)
