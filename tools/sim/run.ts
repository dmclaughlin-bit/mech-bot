/**
 * Local practice approximation. Runs our bot.ts as a subprocess speaking mechfight/1 against 15 scripted house
 * bots, for a fixed list of seeds, and writes one CSV row per match.
 *
 *   bun tools/sim/run.ts --bot <path/to/bot.ts> --seeds 48 --out sim.csv [--jobs N] [--kit /workspace/mechfight-kit] [--trees]
 *
 * This is a model of the house squad, not the house squad: read ASSUMPTIONS.md before trusting a number.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { availableParallelism } from "node:os"
import { dirname, join, resolve } from "node:path"
import { gunzipSync } from "node:zlib"
import { buildObs, createSim, hdist, setAction, tick } from "./engine.ts"
import { loadGeo, loadTrees } from "./geom.ts"
import { squadDecide } from "./house.ts"

const args = process.argv.slice(2)
const opt = (name: string, def?: string) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : def }
const flag = (name: string) => args.includes("--" + name)
const SEED_BASE = Number(process.env.SEED_BASE ?? 1000)
/** Wall-clock wait for one answer. Longer than the server's 50 ms so a loaded machine does not change results; late answers are counted. */
const ANSWER_MS = 2000

class BotProc {
  proc: any
  lines: string[] = []
  wake: (() => void) | null = null
  dead = false
  constructor(path: string) {
    this.proc = Bun.spawn(["bun", path], { cwd: dirname(path), stdin: "pipe", stdout: "pipe", stderr: "ignore", env: { ...process.env, INSTR_FILE: process.env.INSTR_DIR ? process.env.INSTR_DIR + "/" + (globalThis as any).__SEED + ".jsonl" : "" } })
    this.pump()
  }
  async pump() {
    const dec = new TextDecoder()
    let buf = ""
    try {
      for await (const chunk of this.proc.stdout) {
        buf += dec.decode(chunk, { stream: true })
        const parts = buf.split("\n")
        buf = parts.pop() ?? ""
        for (const p of parts) if (p.trim()) this.lines.push(p)
        this.wake?.()
      }
    } catch {}
    this.dead = true
    this.wake?.()
  }
  send(o: unknown) {
    if (this.dead) return
    try { this.proc.stdin.write(JSON.stringify(o) + "\n"); this.proc.stdin.flush() } catch { this.dead = true }
  }
  async next(ms: number): Promise<string | null> {
    if (this.lines.length) return this.lines.shift()!
    if (this.dead || ms <= 0) return null
    let timer: any
    await new Promise<void>((res) => { this.wake = res; timer = setTimeout(res, ms) })
    clearTimeout(timer); this.wake = null
    return this.lines.length ? this.lines.shift()! : null
  }
  async close(end: unknown) {
    this.send(end)
    try { this.proc.stdin.end() } catch {}
    const t = setTimeout(() => { try { this.proc.kill() } catch {} }, 2000)
    await this.proc.exited
    clearTimeout(t)
  }
}

async function runMatch(geo: any, cfg: any, seed: number, botPath: string, arena: string) {
  const S = createSim(geo, cfg, seed)
  const me = S.me
  ;(globalThis as any).__SEED = seed
  const bot = new BotProc(botPath)
  bot.send({ type: "hello", protocol: "mechfight/1", slot: S.meId, seed: (Math.imul(S.meId + 1, 2654435761) >>> 0), map: { dir: arena, files: ["v2/world.json", "v2/terrain.i16"] }, config: cfg })
  let ready = false
  const t0 = performance.now()
  while (!ready && performance.now() - t0 < cfg.bot.hello_budget_ms) {
    const line = await bot.next(cfg.bot.hello_budget_ms - (performance.now() - t0))
    if (line === null) break
    try { ready = JSON.parse(line).type === "ready" } catch {}
  }
  const maxTick = cfg.match.duration_s * cfg.match.tick_hz
  let late = 0, missed = 0, botMs = 0, decisions = 0, missedRun = 0
  const trace = !!process.env.SIM_TRACE
  const HASH = process.env.SIM_HASH_DIR, hashes: string[] = []
  const pins: [number, number][] = []; let pinA: number[] | null = null, pinT = 0
  const houseAlive = () => S.mechs.filter((m: any) => m.alive && m.tier).length
  while (me.alive && S.tick < maxTick && houseAlive() > 0) {
    const obs = buildObs(S)
    const s0 = performance.now()
    let action: any = null
    if (ready && !bot.dead) {
      bot.send(obs)
      for (;;) {
        const line = await bot.next(ANSWER_MS - (performance.now() - s0))
        if (line === null) break
        try { const o = JSON.parse(line); if (o.tick === obs.tick) { action = o; break } } catch {}
      }
    }
    const ms = performance.now() - s0
    decisions++; botMs += ms
    if (ms > cfg.bot.tick_budget_ms) late++
    if (action) { setAction(me, action); missedRun = 0 }
    else {
      // no answer: coast on the continuous parts, then idle after coast_s
      missed++; missedRun += 0.1
      me.once = {}; me.act = { ...me.act, fire: [false, false] }
      if (missedRun > cfg.bot.coast_s) me.act = { move: [0, 0], boost: false, fire: [false, false], aim: me.cmdAim }
    }
    squadDecide(S)
    tick(S, true)
    tick(S, false)
    { const mv = Math.hypot(me.act?.move?.[0] ?? 0, me.act?.move?.[1] ?? 0)
      if (me.alive && mv > 0.5) { if (!pinA || hdist(pinA, me.pos) > 5) { if (pinA && S.t - pinT >= 20) pins.push([pinT, S.t]); pinA = me.pos.slice(); pinT = S.t } }
      else { if (pinA && S.t - pinT >= 20) pins.push([pinT, S.t]); pinA = null } }
    if (HASH) hashes.push(Bun.hash(JSON.stringify([S.tick, S.mechs.map((m: any) => [m.id, m.alive, m.pos, m.vel, m.hp, m.energy, m.cubes, m.weapons?.map((w: any) => w?.kind), m.kills]), me.act, S.deaths.length, (S.drops ?? []).map((d: any) => [d.taken, d.holder])])).toString(16))
    if (trace && S.tick % 100 === 0) {
      const near = S.mechs.filter((m: any) => m.alive && m.tier).map((m: any) => hdist(m.pos, me.pos)).sort((a: number, b: number) => a - b)
      console.error(`t=${S.t.toFixed(0)} hp=${me.hp.toFixed(0)}/${me.maxHp.toFixed(0)} pos=${me.pos.map((x: number) => x.toFixed(0))} cubes=${me.cubes} w=${me.weapons.map((w: any) => w?.kind)} hunters=${S.huntersNow} nearest=${near.slice(0, 3).map((x: number) => x.toFixed(0))} alive=${houseAlive() + 1} inZone=${me.inZone} deaths=${JSON.stringify(S.deaths)}`)
    }
  }
  let place: number
  if (!me.alive) place = me.place
  else place = 1 + S.mechs.filter((m: any) => m.alive && m !== me && m.hp > me.hp).length
  if (HASH) require("node:fs").writeFileSync(`${HASH}/${seed}.trace`, hashes.join("\n") + "\n")
  await bot.close({ type: "end", place, kills: me.kills })
  if (pinA && S.t - pinT >= 20) pins.push([pinT, S.t])
  const k = me.killer
  return {
    drop_arrivals: Object.keys(S.dropSt ?? {}).length, drop_claims: (S.dropLog ?? []).filter((x: any) => x.by === "me").length, drop_me_in: Object.values(S.dropSt ?? {}).filter((x: any) => x.meIn > 0).length,
    pins20: pins.map(([a, b]) => `${a.toFixed(0)}-${b.toFixed(0)}`).join(" "),
    seed, slot: S.meId, place, score: 16 - place, death_t: me.alive ? "" : me.deathT.toFixed(2),
    killer: me.alive ? "" : k ? (k.kind === "npc" ? "npc" : `house:${k.tier}#${k.id}`) : me.killWeapon ?? "", killer_weapon: me.alive ? "" : me.killWeapon ?? "",
    kills: me.kills, damage_dealt: Math.round(me.dmgDealt), damage_taken: Math.round(me.dmgTaken), cubes: me.cubes, upgrades: me.upList.join("+"),
    weapons: me.weapons.filter(Boolean).map((w: any) => w.kind).join("+"), house_dead: S.deaths.filter((d: any) => d.tier).length, hunters_at_end: S.huntersNow ?? 0,
    our_gun_shots: S.stats.ourShots, our_gun_hits: S.stats.ourHits, house_gun_shots: S.stats.houseShots, house_gun_hits: S.stats.houseHits,
    decisions, missed, late_over_50ms: late, bot_ms_mean: (botMs / Math.max(1, decisions)).toFixed(2), bot_ready: ready ? 1 : 0,
  }
}

function findKit(): string {
  const cands = [opt("kit"), process.env.MECHFIGHT_KIT, "/workspace/mechfight-kit", resolve(import.meta.dir, "../../../mechfight-kit")].filter(Boolean) as string[]
  for (const c of cands) if (existsSync(join(c, "arena/v2/world.json"))) return resolve(c)
  throw new Error("mechfight kit not found: pass --kit <dir> (needs arena/v2 and check/stream.jsonl.gz)")
}

async function worker() {
  const kit = findKit(), arena = join(kit, "arena")
  const cfg = JSON.parse(gunzipSync(readFileSync(join(kit, "check/stream.jsonl.gz"))).toString("utf8").split("\n")[0]).config
  const geo = loadGeo(arena)
  // P-D-014: trees block sight only with --trees (off by default, so screens are unchanged).
  if (flag("trees")) geo.trees = loadTrees(arena)
  const bot = resolve(opt("bot")!)
  for (const seed of opt("seed-list")!.split(",").map(Number)) {
    const row = await runMatch(geo, cfg, seed, bot, arena)
    console.log("RESULT " + JSON.stringify(row))
  }
}

async function main() {
  const botPath = opt("bot")
  if (!botPath || !existsSync(botPath)) { console.error("usage: bun tools/sim/run.ts --bot <path/to/bot.ts> [--seeds 48] [--out sim.csv] [--jobs N] [--kit dir]"); process.exit(2) }
  findKit()
  const n = Number(opt("seeds", "48")), out = opt("out", "sim.csv")!
  const jobs = Math.max(1, Math.min(Number(opt("jobs", String(Math.min(8, availableParallelism())))), n))
  const seeds = Array.from({ length: n }, (_, i) => SEED_BASE + i)
  const t0 = performance.now()
  const rows: any[] = []
  await Promise.all(Array.from({ length: jobs }, async (_, j) => {
    const mine = seeds.filter((_, i) => i % jobs === j)
    if (!mine.length) return
    const pass = ["--bot", botPath, "--seed-list", mine.join(","), ...(opt("kit") ? ["--kit", opt("kit")!] : []), ...(flag("trees") ? ["--trees"] : [])]
    const p = Bun.spawn(["bun", import.meta.path, "--worker", ...pass], { stdout: "pipe", stderr: "inherit" })
    const text = await new Response(p.stdout).text()
    for (const line of text.split("\n")) if (line.startsWith("RESULT ")) rows.push(JSON.parse(line.slice(7)))
    await p.exited
  }))
  rows.sort((a, b) => a.seed - b.seed)
  if (!rows.length) { console.error("no matches finished"); process.exit(1) }
  const cols = Object.keys(rows[0])
  writeFileSync(out, cols.join(",") + "\n" + rows.map((r) => cols.map((c) => r[c]).join(",")).join("\n") + "\n")
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length
  const sc = rows.map((r) => r.score), m = mean(sc)
  const se = Math.sqrt(mean(sc.map((x) => (x - m) ** 2)) / Math.max(1, sc.length - 1))
  const died = rows.filter((r) => r.death_t !== "").map((r) => Number(r.death_t)).sort((a, b) => a - b)
  const sum = (k: string) => rows.reduce((s, r) => s + Number(r[k]), 0)
  console.log(`matches ${rows.length}/${n}  mean(16-place) ${m.toFixed(3)}  (SE ${se.toFixed(2)})  kills/match ${mean(rows.map((r) => r.kills)).toFixed(2)}  median death ${died.length ? died[Math.floor(died.length / 2)].toFixed(0) : "-"} s  survived ${rows.length - died.length}`)
  console.log(`our gun hit rate ${(sum("our_gun_hits") / Math.max(1, sum("our_gun_shots"))).toFixed(2)}  house gun hit rate on us ${(sum("house_gun_hits") / Math.max(1, sum("house_gun_shots"))).toFixed(2)}  missed answers ${sum("missed")}  answers over 50 ms ${sum("late_over_50ms")}  bot not ready ${rows.filter((r) => !r.bot_ready).length}`)
  console.log(`wrote ${out}  runtime ${((performance.now() - t0) / 1000).toFixed(1)} s on ${jobs} job(s)`)
  if (flag("json")) console.log("SUMMARY " + JSON.stringify({ mean: m, se, n: rows.length }))
}

if (flag("worker")) await worker()
else await main()
