/**
 * P-B-008 movement measurement. Runs the same matches as run.ts (same engine, same seeds, same house squad) and
 * writes run.ts's CSV columns unchanged, followed by movement and evasion columns. It reads only the sim's state,
 * the observations and the bot's action lines: the bot needs no log and no change, so any commit can be measured.
 *
 *   SEED_BASE=2000 bun tools/sim/measure_movement.ts --bot <path/to/bot.ts> --seeds 96 --out move.csv [--jobs N] [--kit dir]
 *   bun tools/sim/measure_movement.ts --summary a.csv [b.csv ...]      # print the screen numbers of finished CSVs
 *
 * Added columns (per match):
 *  (a) opponent pressure on us
 *      hits_<w>, dmg_<w> for w in gun, laser, lightning, mortar, npc, zone: `damaged` events and their amounts
 *      (zone: one event per decision with zone damage). hits_mech / dmg_mech leave out npc and zone.
 *      house_gun_hit_rate = house_gun_hits / house_gun_shots (run.ts's counters; shots by house bots fighting us).
 *  (b) our aim while moving. "Moving" = ground speed at the tick of the shot >= MOVING_FRAC of walk speed (0.15, the
 *      same line as nav.ts STUCK_SPEED_FRAC).
 *      gun_shots_mov/still, gun_hits_mov/still (hits on mechs, credited to the state when that round was fired),
 *      gun_hits_unsplit (hits the script could not tie to one round), laser_hits_mov/still, lightning_hits_mov/still,
 *      mortar_hits_mov/still (beams land the tick they fire), moving_frac (share of decisions spent moving).
 *  (c) stuck and pin
 *      stuck_dec: decisions with commanded move > 0.3 and ground speed under 0.15 of walk speed.
 *      nav_stuck_trips: decisions where brain.ts's nav.stuck would return true, recomputed from the same inputs
 *      (obs.self.vel and the action's move; 5 such decisions in a row). jumps: actions with jump set.
 *      pin_windows: 10 s windows, one starting every second, with mean commanded move > 0.3 and under 3 m of
 *      displacement, inside the zone (Wild Sim's definition, /tmp/stress-an.py). pin_longest_s: longest run of them.
 *      osc_windows: 20 s windows, every second, with > 120 m of path and < 15 m net. osc_windows_quiet: those with no
 *      enemy mech in view for at least half the window (a combat strafe is an oscillation by this definition).
 *      collision_ticks: 20 Hz ticks where the wall stopped a horizontal velocity component the mech was commanding.
 *      failed_progress_dec: decisions with a steady commanded heading (within 60 degrees over 3 decisions) that moved
 *      under a quarter of the walk-speed distance along it.
 *  (d) run.ts's place, score, kills, death_t, plus kills_after_60, laser_by_30, attackers_at_death (house bots that
 *      damaged us in the last 3 s), and bot_ms_p99 / bot_ms_max (wall clock per answer, pipe included).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { availableParallelism } from "node:os"
import { dirname, join, resolve } from "node:path"
import { gunzipSync } from "node:zlib"
import { DT, buildObs, createSim, setAction, tick } from "./engine.ts"
import { loadGeo } from "./geom.ts"
import { squadDecide } from "./house.ts"

const args = process.argv.slice(2)
const opt = (name: string, def?: string) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : def }
const flag = (name: string) => args.includes("--" + name)
const SEED_BASE = Number(process.env.SEED_BASE ?? 1000)
const ANSWER_MS = 2000
const MOVING_FRAC = 0.15
const STUCK_DECISIONS = 5
const SOURCES = ["gun", "laser", "lightning", "mortar", "npc", "zone"]

class BotProc {
  proc: any
  lines: string[] = []
  wake: (() => void) | null = null
  dead = false
  constructor(path: string) {
    this.proc = Bun.spawn(["bun", path], { cwd: dirname(path), stdin: "pipe", stdout: "pipe", stderr: "ignore" })
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

/** The match loop is run.ts's, line for line; the measurement only reads around it. */
async function runMatch(geo: any, cfg: any, seed: number, botPath: string, arena: string) {
  const S = createSim(geo, cfg, seed)
  const me = S.me
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
  const houseAlive = () => S.mechs.filter((m: any) => m.alive && m.tier).length

  // ---- measurement state
  const M: Record<string, number> = {}
  const add = (k: string, n = 1) => { M[k] = (M[k] ?? 0) + n }
  for (const w of SOURCES) { M["hits_" + w] = 0; M["dmg_" + w] = 0 }
  for (const k of ["gun_shots_mov", "gun_shots_still", "gun_hits_mov", "gun_hits_still", "gun_hits_unsplit", "laser_hits_mov", "laser_hits_still", "lightning_hits_mov",
    "lightning_hits_still", "mortar_hits_mov", "mortar_hits_still", "moving_dec", "stuck_dec", "nav_stuck_trips", "jumps", "collision_ticks", "failed_progress_dec", "kills_after_60", "laser_by_30"]) M[k] = 0
  const msList: number[] = []
  const posLog: number[][] = [], cmdLog: number[] = [], tLog: number[] = [], zoneLog: number[] = [], seenLog: number[] = []
  const roundState = new Map<number, boolean>() // our gun round id -> fired while moving
  const hitBy = new Map<number, number>() // house id -> last time it damaged us
  let stuckRun = 0
  const headings: number[][] = []
  const speedOf = () => Math.hypot(me.vel[0], me.vel[1])
  const movingNow = () => speedOf() >= MOVING_FRAC * me.stats.walk_speed

  /** One engine tick, with the per-tick reads around it. */
  const step = (first: boolean) => {
    const a = me.act
    // the horizontal velocity moveMech will ask for this tick (engine.ts moveMech), to spot a wall stopping it
    let mx = a.move?.[0] ?? 0, my = a.move?.[1] ?? 0
    const ml = Math.hypot(mx, my)
    if (ml > 1) { mx /= ml; my /= ml }
    let speed = me.stats.walk_speed
    if (a.boost && me.grounded && ml > 0.01 && me.energy > 0) speed = me.stats.boost_speed
    if (me.charging) speed *= me.stats.charge_move_mult
    const acc = (me.grounded ? me.stats.ground_accel : me.stats.air_accel) * DT
    const dvx = mx * speed - me.vel[0], dvy = my * speed - me.vel[1], dv = Math.hypot(dvx, dvy)
    const wantX = dv <= acc ? mx * speed : me.vel[0] + (dvx / dv) * acc, wantY = dv <= acc ? my * speed : me.vel[1] + (dvy / dv) * acc
    const shots0 = S.stats.ourShots, ev0 = S.events.length, kills0 = me.kills
    const before = new Set<number>()
    for (const p of S.projs) if (p.owner === me && p.kind === "gun") before.add(p.id)
    const houseBefore = S.mechs.filter((m: any) => m.alive && m.tier).map((m: any) => ({ id: m.id, pos: m.pos.slice(), r: m.stats.radius, h: m.stats.height }))
    const flying = S.projs.filter((p: any) => p.owner === me && p.kind === "gun").map((p: any) => ({ id: p.id, pos: p.pos.slice(), vel: p.vel.slice() }))
    tick(S, first)
    if (ml > 0.3 && ((Math.abs(wantX) > 0.5 && me.vel[0] === 0) || (Math.abs(wantY) > 0.5 && me.vel[1] === 0))) add("collision_ticks")
    const moving = movingNow()
    // rounds fired this tick (moveMech ran before the gun, so the speed now is the speed at the shot)
    const fired = S.stats.ourShots - shots0
    if (fired > 0) add(moving ? "gun_shots_mov" : "gun_shots_still", fired)
    const after = new Set<number>()
    for (const p of S.projs) if (p.owner === me && p.kind === "gun") { after.add(p.id); if (!before.has(p.id)) roundState.set(p.id, moving) }
    const events = S.events.slice(ev0)
    // our hits this tick
    let gunMechHits = 0, gunAllHits = 0
    for (const e of events) {
      if (e.type !== "hit") continue
      const onMech = e.target < 100
      if (e.weapon === "gun") { gunAllHits++; if (onMech) gunMechHits++ }
      else if (onMech && (e.weapon === "laser" || e.weapon === "lightning" || e.weapon === "mortar")) add(`${e.weapon}_hits_${moving ? "mov" : "still"}`)
    }
    if (gunAllHits > 0 || before.size > after.size) {
      const gone = flying.filter((p: any) => !after.has(p.id))
      if (gunMechHits > 0) {
        // Rounds that ended this tick next to a house bot are the ones that hit. Exact when every ended round hit something.
        const near = gone.filter((p: any) => houseBefore.some((m: any) => {
          const l2 = (p.vel[0] * p.vel[0] + p.vel[1] * p.vel[1]) * DT * DT
          const s = l2 > 0 ? Math.max(0, Math.min(1, ((m.pos[0] - p.pos[0]) * p.vel[0] * DT + (m.pos[1] - p.pos[1]) * p.vel[1] * DT) / l2)) : 0
          return Math.hypot(p.pos[0] + p.vel[0] * DT * s - m.pos[0], p.pos[1] + p.vel[1] * DT * s - m.pos[1]) <= m.r + 1.5
        }))
        const pool = gone.length === gunAllHits ? (near.length >= gunMechHits ? near : gone) : near
        let left = gunMechHits
        for (const p of pool) {
          if (left <= 0) break
          const st = roundState.get(p.id)
          if (st === undefined) continue
          add(st ? "gun_hits_mov" : "gun_hits_still")
          left--
        }
        if (left > 0) add("gun_hits_unsplit", left)
      }
      for (const p of gone) roundState.delete(p.id)
    }
    // damage on us this tick (zone damage arrives once per decision, below)
    for (const e of events) {
      if (e.type !== "damaged") continue
      const w = SOURCES.includes(e.weapon) ? e.weapon : "npc"
      add("hits_" + w); add("dmg_" + w, e.amount)
      if (e.by !== null && e.by < 100) hitBy.set(e.by, S.t)
    }
    if (me.kills > kills0 && S.t >= 60) add("kills_after_60", me.kills - kills0)
  }

  while (me.alive && S.tick < maxTick && houseAlive() > 0) {
    const zone0 = S.zoneDmgAcc
    if (zone0 > 0) { add("hits_zone"); add("dmg_zone", zone0) }
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
    decisions++; botMs += ms; msList.push(ms)
    if (ms > cfg.bot.tick_budget_ms) late++
    if (action) { setAction(me, action); missedRun = 0 }
    else {
      missed++; missedRun += 0.1
      me.once = {}; me.act = { ...me.act, fire: [false, false] }
      if (missedRun > cfg.bot.coast_s) me.act = { move: [0, 0], boost: false, fire: [false, false], aim: me.cmdAim }
    }
    // ---- per-decision reads (what the bot saw and what it commanded)
    const mv: number[] = Array.isArray(action?.move) ? action.move : [0, 0]
    const cmd = Math.hypot(mv[0] ?? 0, mv[1] ?? 0)
    const seenSpeed = Math.hypot(obs.self.vel[0], obs.self.vel[1])
    const slow = cmd > 0.3 && seenSpeed < MOVING_FRAC * (cfg.mech.walk_speed ?? 11.7)
    if (slow) add("stuck_dec")
    stuckRun = slow ? stuckRun + 1 : 0
    if (stuckRun >= STUCK_DECISIONS) add("nav_stuck_trips")
    if (action?.jump) add("jumps")
    if (seenSpeed >= MOVING_FRAC * obs.self.stats.walk_speed) add("moving_dec")
    if (obs.t <= 30 && obs.self.weapons.some((w: any) => w?.kind === "laser")) M.laser_by_30 = 1
    posLog.push([me.pos[0], me.pos[1]]); cmdLog.push(cmd); tLog.push(S.t); zoneLog.push(me.inZone ? 1 : 0)
    seenLog.push(obs.mechs.some((m: any) => m.kind === "mech") ? 1 : 0)
    const p0 = [me.pos[0], me.pos[1]]
    squadDecide(S)
    step(true)
    step(false)
    // progress along a steady commanded heading
    headings.push(cmd > 0.3 ? [mv[0] / cmd, mv[1] / cmd] : [0, 0])
    const n = headings.length
    if (n >= 3 && cmd > 0.3) {
      const h = headings[n - 1], steady = [headings[n - 2], headings[n - 3]].every((g) => g[0] * h[0] + g[1] * h[1] > 0.5)
      const along = (me.pos[0] - p0[0]) * h[0] + (me.pos[1] - p0[1]) * h[1]
      if (steady && along < 0.25 * me.stats.walk_speed * 2 * DT) add("failed_progress_dec")
    }
  }
  if (S.zoneDmgAcc > 0) { add("hits_zone"); add("dmg_zone", S.zoneDmgAcc) }
  let place: number
  if (!me.alive) place = me.place
  else place = 1 + S.mechs.filter((m: any) => m.alive && m !== me && m.hp > me.hp).length
  await bot.close({ type: "end", place, kills: me.kills })

  // ---- window metrics (Wild Sim: a window starts every 10 decisions = 1 s)
  const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1])
  let pinWindows = 0, pinRun = 0, pinBest = 0, osc = 0, oscQuiet = 0
  const N = tLog.length
  for (let i = 0; i < N; i += 10) {
    let k = i
    while (k < N && tLog[k] - tLog[i] < 10) k++
    if (k >= N) break
    let pin = false
    if (zoneLog[i]) {
      let dmax = 0, cm = 0
      for (let m = i; m < k; m++) { dmax = Math.max(dmax, dist(posLog[m], posLog[i])); cm += cmdLog[m] }
      pin = dmax < 3 && cm / (k - i) > 0.3
    }
    pinRun = pin ? pinRun + 1 : 0
    pinBest = Math.max(pinBest, pinRun)
    if (pin) pinWindows++
  }
  for (let i = 0; i < N; i += 10) {
    let k = i
    while (k < N && tLog[k] - tLog[i] < 20) k++
    if (k >= N) break
    let path = 0, seen = 0
    for (let m = i; m < k - 1; m++) path += dist(posLog[m + 1], posLog[m])
    for (let m = i; m < k; m++) seen += seenLog[m]
    if (path > 120 && dist(posLog[k - 1], posLog[i]) < 15) { osc++; if (seen < (k - i) / 2) oscQuiet++ }
  }
  const sorted = [...msList].sort((a, b) => a - b)
  const q = (p: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : 0)
  const k = me.killer
  const r1 = (x: number) => Math.round(x * 10) / 10
  const out: Record<string, any> = {
    // run.ts's columns, same order
    seed, slot: S.meId, place, score: 16 - place, death_t: me.alive ? "" : me.deathT.toFixed(2),
    killer: me.alive ? "" : k ? (k.kind === "npc" ? "npc" : `house:${k.tier}#${k.id}`) : me.killWeapon ?? "", killer_weapon: me.alive ? "" : me.killWeapon ?? "",
    kills: me.kills, damage_dealt: Math.round(me.dmgDealt), damage_taken: Math.round(me.dmgTaken), cubes: me.cubes, upgrades: me.upList.join("+"),
    weapons: me.weapons.filter(Boolean).map((w: any) => w.kind).join("+"), house_dead: S.deaths.filter((d: any) => d.tier).length, hunters_at_end: S.huntersNow ?? 0,
    our_gun_shots: S.stats.ourShots, our_gun_hits: S.stats.ourHits, house_gun_shots: S.stats.houseShots, house_gun_hits: S.stats.houseHits,
    decisions, missed, late_over_50ms: late, bot_ms_mean: (botMs / Math.max(1, decisions)).toFixed(2), bot_ready: ready ? 1 : 0,
  }
  // (a)
  for (const w of SOURCES) { out["hits_" + w] = M["hits_" + w]; out["dmg_" + w] = r1(M["dmg_" + w]) }
  out.hits_mech = M.hits_gun + M.hits_laser + M.hits_lightning + M.hits_mortar
  out.dmg_mech = r1(M.dmg_gun + M.dmg_laser + M.dmg_lightning + M.dmg_mortar)
  out.house_gun_hit_rate = S.stats.houseShots ? (S.stats.houseHits / S.stats.houseShots).toFixed(3) : ""
  // (b)
  for (const key of ["gun_shots_mov", "gun_shots_still", "gun_hits_mov", "gun_hits_still", "gun_hits_unsplit", "laser_hits_mov", "laser_hits_still", "lightning_hits_mov", "lightning_hits_still", "mortar_hits_mov", "mortar_hits_still"]) out[key] = M[key]
  out.moving_frac = (M.moving_dec / Math.max(1, decisions)).toFixed(3)
  // (c)
  out.stuck_dec = M.stuck_dec; out.nav_stuck_trips = M.nav_stuck_trips; out.jumps = M.jumps
  out.pin_windows = pinWindows; out.pin_longest_s = pinBest ? pinBest + 9 : 0; out.osc_windows = osc; out.osc_windows_quiet = oscQuiet
  out.collision_ticks = M.collision_ticks; out.failed_progress_dec = M.failed_progress_dec
  // (d)
  out.kills_after_60 = M.kills_after_60; out.laser_by_30 = M.laser_by_30
  out.attackers_at_death = me.alive ? "" : [...hitBy.values()].filter((t) => me.deathT - t <= 3).length
  out.bot_ms_p99 = q(0.99).toFixed(2); out.bot_ms_max = (sorted[sorted.length - 1] ?? 0).toFixed(2)
  return out
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
  const bot = resolve(opt("bot")!)
  for (const seed of opt("seed-list")!.split(",").map(Number)) {
    const row = await runMatch(geo, cfg, seed, bot, arena)
    console.log("RESULT " + JSON.stringify(row))
  }
}

function readCsv(file: string): Record<string, string>[] {
  const lines = readFileSync(file, "utf8").trim().split("\n")
  const cols = lines[0].split(",")
  return lines.slice(1).map((l) => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v])))
}

/** The screen numbers of one or more CSVs taken together (e.g. SEED_BASE 2000 and 3000). */
export function summarize(rows: Record<string, any>[]) {
  const n = rows.length
  const sum = (k: string) => rows.reduce((s, r) => s + Number(r[k] || 0), 0)
  const mean = (k: string) => sum(k) / Math.max(1, n)
  const rate = (a: number, b: number) => (b > 0 ? a / b : NaN)
  const perGame = rows.filter((r) => Number(r.house_gun_shots) > 0).map((r) => Number(r.house_gun_hits) / Number(r.house_gun_shots))
  const sc = rows.map((r) => Number(r.score)), m = sc.reduce((a, b) => a + b, 0) / Math.max(1, n)
  return {
    games: n, score_mean: m, score_se: Math.sqrt(sc.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, n - 1) / Math.max(1, n)),
    kills_per_game: mean("kills"), kills_after_60_per_game: mean("kills_after_60"),
    house_gun_hit_rate_pooled: rate(sum("house_gun_hits"), sum("house_gun_shots")),
    house_gun_hit_rate_mean_of_games: perGame.reduce((a, b) => a + b, 0) / Math.max(1, perGame.length),
    house_gun_shots_per_game: mean("house_gun_shots"), house_gun_hits_per_game: mean("house_gun_hits"),
    damage_taken_per_game: mean("damage_taken"), dmg_gun: mean("dmg_gun"), dmg_laser: mean("dmg_laser"), dmg_lightning: mean("dmg_lightning"), dmg_mortar: mean("dmg_mortar"),
    dmg_npc: mean("dmg_npc"), dmg_zone: mean("dmg_zone"), hits_gun: mean("hits_gun"), hits_laser: mean("hits_laser"), hits_lightning: mean("hits_lightning"), hits_mortar: mean("hits_mortar"),
    our_gun_hit_rate: rate(sum("our_gun_hits"), sum("our_gun_shots")),
    our_gun_hit_rate_moving: rate(sum("gun_hits_mov"), sum("gun_shots_mov")), our_gun_hit_rate_still: rate(sum("gun_hits_still"), sum("gun_shots_still")),
    gun_shots_mov: sum("gun_shots_mov"), gun_shots_still: sum("gun_shots_still"), gun_hits_mov: sum("gun_hits_mov"), gun_hits_still: sum("gun_hits_still"), gun_hits_unsplit: sum("gun_hits_unsplit"),
    laser_hits_mov: sum("laser_hits_mov"), laser_hits_still: sum("laser_hits_still"), lightning_hits_mov: sum("lightning_hits_mov"), lightning_hits_still: sum("lightning_hits_still"),
    moving_frac: mean("moving_frac"), damage_dealt_per_game: mean("damage_dealt"),
    stuck_dec: sum("stuck_dec"), nav_stuck_trips: sum("nav_stuck_trips"), jumps: sum("jumps"), pin_windows: sum("pin_windows"), games_with_pin: rows.filter((r) => Number(r.pin_windows) > 0).length,
    pin_longest_s: Math.max(0, ...rows.map((r) => Number(r.pin_longest_s))), osc_windows: sum("osc_windows"), osc_windows_quiet: sum("osc_windows_quiet"),
    collision_ticks: sum("collision_ticks"), failed_progress_dec: sum("failed_progress_dec"),
    died_before_40: rows.filter((r) => r.death_t !== "" && Number(r.death_t) < 40).length,
    lightning_at_end: rows.filter((r) => String(r.weapons).includes("lightning")).length, gun_only_at_end: rows.filter((r) => r.weapons === "gun").length,
    laser_by_30: sum("laser_by_30"), two_plus_attackers_at_death: rows.filter((r) => Number(r.attackers_at_death) >= 2).length,
    missed: sum("missed"), late_over_50ms: sum("late_over_50ms"), bot_ms_p99_worst: Math.max(0, ...rows.map((r) => Number(r.bot_ms_p99))), bot_ms_max: Math.max(0, ...rows.map((r) => Number(r.bot_ms_max))),
  }
}

async function main() {
  if (flag("summary")) {
    const files = args.slice(args.indexOf("--summary") + 1).filter((a) => !a.startsWith("--"))
    const s = summarize(files.flatMap(readCsv))
    for (const [k, v] of Object.entries(s)) console.log(`${k.padEnd(34)} ${typeof v === "number" && !Number.isInteger(v) ? v.toFixed(3) : v}`)
    return
  }
  const botPath = opt("bot")
  if (!botPath || !existsSync(botPath)) { console.error("usage: bun tools/sim/measure_movement.ts --bot <path/to/bot.ts> [--seeds 48] [--out move.csv] [--jobs N] [--kit dir] | --summary a.csv [b.csv]"); process.exit(2) }
  findKit()
  const n = Number(opt("seeds", "48")), out = opt("out", "move.csv")!
  const jobs = Math.max(1, Math.min(Number(opt("jobs", String(Math.min(8, availableParallelism())))), n))
  const seeds = Array.from({ length: n }, (_, i) => SEED_BASE + i)
  const t0 = performance.now()
  const rows: any[] = []
  await Promise.all(Array.from({ length: jobs }, async (_, j) => {
    const mine = seeds.filter((_, i) => i % jobs === j)
    if (!mine.length) return
    const pass = ["--bot", botPath, "--seed-list", mine.join(","), ...(opt("kit") ? ["--kit", opt("kit")!] : [])]
    const p = Bun.spawn(["bun", import.meta.path, "--worker", ...pass], { stdout: "pipe", stderr: "inherit" })
    const text = await new Response(p.stdout).text()
    for (const line of text.split("\n")) if (line.startsWith("RESULT ")) rows.push(JSON.parse(line.slice(7)))
    await p.exited
  }))
  rows.sort((a, b) => a.seed - b.seed)
  if (!rows.length) { console.error("no matches finished"); process.exit(1) }
  const cols = Object.keys(rows[0])
  writeFileSync(out, cols.join(",") + "\n" + rows.map((r) => cols.map((c) => r[c]).join(",")).join("\n") + "\n")
  const s = summarize(rows)
  const f = (x: number) => (Number.isFinite(x) ? x.toFixed(3) : "-")
  console.log(`matches ${rows.length}/${n}  mean(16-place) ${s.score_mean.toFixed(3)} (SE ${s.score_se.toFixed(2)})  kills/match ${s.kills_per_game.toFixed(2)}  died<40s ${s.died_before_40}`)
  console.log(`house gun hit rate on us ${f(s.house_gun_hit_rate_pooled)}  damage taken/match ${s.damage_taken_per_game.toFixed(0)} (gun ${s.dmg_gun.toFixed(0)} laser ${s.dmg_laser.toFixed(0)} lightning ${s.dmg_lightning.toFixed(0)} mortar ${s.dmg_mortar.toFixed(0)} npc ${s.dmg_npc.toFixed(0)} zone ${s.dmg_zone.toFixed(0)})`)
  console.log(`our gun hit rate ${f(s.our_gun_hit_rate)}  moving ${f(s.our_gun_hit_rate_moving)} (${s.gun_shots_mov} shots)  still ${f(s.our_gun_hit_rate_still)} (${s.gun_shots_still} shots)  unsplit hits ${s.gun_hits_unsplit}`)
  console.log(`stuck decisions ${s.stuck_dec}  nav.stuck trips ${s.nav_stuck_trips}  pin windows ${s.pin_windows}  osc windows ${s.osc_windows} (quiet ${s.osc_windows_quiet})  collision ticks ${s.collision_ticks}  failed progress ${s.failed_progress_dec}`)
  console.log(`missed answers ${s.missed}  answers over 50 ms ${s.late_over_50ms}  wrote ${out}  runtime ${((performance.now() - t0) / 1000).toFixed(1)} s on ${jobs} job(s)`)
}

if (flag("worker")) await worker()
else await main()
