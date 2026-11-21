/**
 * Build 12 offline check: run the brain on recorded observations and count how often farm mode activates and what
 * it picks. OFFLINE ONLY: the recording is not reactive (our actions do not change later observations), so these
 * counts say whether the rule fires and on what, never how a match would go. They are not scores.
 *
 *   bun tools/farm_check.ts [stream.jsonl[.gz]] [arenaDir] < /dev/null
 *
 * The file holds one hello line, then obs lines (the kit's check/stream.jsonl.gz format). Defaults to the kit stream.
 * stdin must be closed: map.ts imports mechfight.ts.
 */
import { existsSync, readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { createBot } from "../brain.ts"
import { draw, type Hello, type Observation } from "../mechfight.ts"

const arg = process.argv.slice(2)
const kit = ["../mechfight-kit", "/workspace/mechfight-kit"].find((d) => existsSync(`${d}/check/stream.jsonl.gz`))
const file = arg[0] ?? (kit ? `${kit}/check/stream.jsonl.gz` : "")
const arena = arg[1] ?? (kit ? `${kit}/arena` : "/arena")
if (!file || !existsSync(file)) {
  console.error("usage: bun tools/farm_check.ts <stream.jsonl[.gz]> [arenaDir]")
  process.exit(2)
}
const raw = readFileSync(file)
const lines = (file.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8").split("\n").filter(Boolean)
const hello = JSON.parse(lines[0]) as Hello
if (hello.type !== "hello") throw new Error("first line is not a hello")
hello.map.dir = arena

const bot = createBot(hello)
const modes = new Map<string, number>()
const picks = new Map<string, number>()
let obsCount = 0, farmTicks = 0, shots = 0, quietTicks = 0
const kindOf = (id: number) => (id >= 20000 ? "drop" : id >= 5000 ? "cube" : id >= 1000 ? "crate" : id >= 100 ? "drone" : "mech")
for (const line of lines.slice(1)) {
  const obs = JSON.parse(line) as Observation
  if (obs.type !== "obs") continue
  obsCount++
  if (!obs.mechs.some((m) => m.kind === "mech")) quietTicks++
  const act = bot.act(obs)
  const label = draw.take()?.label ?? ""
  const mode = label.split(" · ").at(-1) ?? "?"
  modes.set(mode, (modes.get(mode) ?? 0) + 1)
  const shot = / · farm (\w+) at (\d+) (\d+)m/.exec(label)
  if (shot) {
    shots++
    const key = `shoot ${kindOf(Number(shot[2]))} (${shot[1]})${act.fire?.some(Boolean) ? " firing" : " aiming"}`
    picks.set(key, (picks.get(key) ?? 0) + 1)
  }
  if (mode.startsWith("farm")) picks.set(mode, (picks.get(mode) ?? 0) + 1)
  if (shot || mode.startsWith("farm")) farmTicks++
}
console.log(`OFFLINE replay of ${file} (non-reactive recording; counts are not scores)`)
console.log(`observations: ${obsCount}  with no enemy mech in view: ${quietTicks}  farm active (shooting or walking): ${farmTicks}  farm shots aimed: ${shots}`)
console.log("modes:")
for (const [m, n] of [...modes].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${m}`)
console.log("farm picks:")
if (!picks.size) console.log("  none")
for (const [m, n] of [...picks].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${m}`)
