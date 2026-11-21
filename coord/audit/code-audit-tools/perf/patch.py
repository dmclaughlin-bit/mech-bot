import re,sys
p='/tmp/claude-0/audit/brain.ts'; s=open(p).read()
def rep(a,b,count=1):
    global s
    assert s.count(a)>=1, a
    s=s.replace(a,b,count)
# header: instrumentation buffer
rep('function buildBot(hello: Hello): Bot {', '''import { appendFileSync } from "node:fs"
const __I = process.env.INSTR_FILE
const __buf: string[] = []
const __flush = () => { if (__I && __buf.length) { appendFileSync(__I, __buf.join("\\n") + "\\n"); __buf.length = 0 } }
process.on("exit", __flush)
function buildBot(hello: Hello): Bot {''')
rep("if ((planned && !route!.found) || obs.t - rush.since > LASER_CHASE_S) laserSkip.add(id)",
    "if ((planned && !route!.found) || obs.t - rush.since > LASER_CHASE_S) { laserSkip.add(id); __ev.push(planned && !route!.found ? 'skip_nopath' : 'skip_timeout') }\n          else if (planned && !fits(pos, go.dist)) __ev.push('path_too_long')")
rep("      remember(obs)\n", "      const __ev: string[] = []\n      remember(obs)\n")
rep("      if (nav.stuck(me, move)) {", "      if (nav.stuck(me, move)) {\n        __ev.push('stuck')")
# record at end
rep("      const took = performance.now() - started\n", '''      const took = performance.now() - started
      if (__I) {
        const losN = threats.filter((e) => seenAt(me.pos, myHeight, [e], false)).length
        const hitters2 = [...mechHitBy].filter(([, t]) => obs.t - t < 2).length
        const dmg = obs.events.filter((e: any) => e.type === "damaged" && e.weapon !== "npc" && e.weapon !== "zone").map((e: any) => [e.by, Math.round(e.amount), e.weapon, e.rear ? 1 : 0])
        const near100 = enemies.filter((m) => flat(m.pos, me.pos) < 100).length
        const near160 = enemies.filter((m) => flat(m.pos, me.pos) < 160).length
        const ls = [...arms].filter(([id, a]) => a.kind === "laser" && !laserSkip.has(id))
        const ld = ls.length ? Math.min(...ls.map(([, a]) => flat(a.pos, me.pos))) : -1
        const ltn = [...arms].filter(([id, a]) => a.kind === "lightning" && !laserSkip.has(id)).length
        const g = {
          win: +(obs.t < LASER_RUSH_S || !!rush || lateLight), slot: +rushSlot, zone: +me.in_zone, leave: +leaveNow, trip: +!!trip,
          eng: engage ? engage.why : 0, claim: +!!claimGoal, hurt: +hurt, cube: +(cubeFirst && !lateLight), quiet: +(obs.t - lastMechHit > FARM_QUIET_S),
        }
        __buf.push(JSON.stringify({ t: +obs.t.toFixed(2), hp: Math.round(me.hp), mhp: Math.round(me.max_hp), w: me.weapons.map((x) => x?.kind ?? null), mode, g, rm: +!!rushMove,
          ld: Math.round(ld), lc: ls.length, ltn, los: losN, h2: hitters2, inview: enemies.length, n100: near100, n160: near160, dmg, ev: __ev, ms: +took.toFixed(2), cubes: me.cubes }))
        if (__buf.length >= 200) __flush()
      }
''')
open(p,'w').write(s)
r='/tmp/claude-0/audit/tools/sim/run.ts'; t=open(r).read()
t=t.replace("const SEED_BASE = 1000","const SEED_BASE = Number(process.env.SEED_BASE ?? 1000)")
t=t.replace('this.proc = Bun.spawn(["bun", path], { cwd: dirname(path), stdin: "pipe", stdout: "pipe", stderr: "ignore" })',
 'this.proc = Bun.spawn(["bun", path], { cwd: dirname(path), stdin: "pipe", stdout: "pipe", stderr: "ignore", env: { ...process.env, INSTR_FILE: process.env.INSTR_DIR ? process.env.INSTR_DIR + "/" + (globalThis as any).__SEED + ".jsonl" : "" } })')
t=t.replace("  const bot = new BotProc(botPath)","  ;(globalThis as any).__SEED = seed\n  const bot = new BotProc(botPath)")
open(r,'w').write(t)
