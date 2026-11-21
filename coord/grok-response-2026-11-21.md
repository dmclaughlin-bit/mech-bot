# Grok §18 response to Diego's master directive (Sat Nov 21, 11:45 AM ET)

Short by request. No audit was redone; this builds on `coord/audit/` and `coord/RESEARCH.md`. Every number below comes from those files, `coord/log.md`, or `coord/research/site-corr-2026-11-21.txt`.

## 1. Verified status
- **Champion:** B80 `28c3acc` (merged as `cb93980`), site **3.79**, receipt BB-78A44AAF. `pipeline/data/champion.json` was updated to match (commit `0d2444f`). Bot code on main hasn't changed since.
- **Board at 10:59 AM ET:** 137th of 256, #32 at 5.33, #1 at 6.31.
- **Today's site tests:** B26 multi-threat race 3.48 (closed); B51 corner duel 3.79, a tie (closed). Since B80, everything has tied or lost (B82, B86, B88, B43, B90, B92, B98, B100, B94, B26, B51).
- **UF100 (PR #88, head `3ee37ca`):** Grok is verifying it now: the kit gate, the flag-0 identity check (must change 0 of 192 games vs B80), and the 192-game screen with handoff §4's vetoes.

## 2. Audit plan (non-overlapping, no re-audit)
| Area | Owner | Output |
|---|---|---|
| Code audit / next finding after UF100 | Diego's Claude | `coord/audit/` |
| Gate, identity check, sim screen, submit, keep/close, ledger | Grok | PR comment, `coord/log.md`, `EXPERIMENTS.md` |
| Death analysis and proxy metrics on each new champion | Mech Sim Tester | `/workspace/tester/proposals/` |
| How top bots open (first 30 s) | Mech Watcher | `/workspace/watch/findings.md` |
| Settings and edge-case searches | Mech Wild Sim | only with Doug's yes per batch |

## 3. Architecture map (B80)
`bot.ts` -> kit loop (`mechfight.ts`) -> `createBot` in `brain.ts`, configured by `params.ts`, with `nav.ts` (A*), `map.ts` (LOS) and `target.ts` (target value). Each tick, movement takes the first matching branch: zone escape -> next circle -> engage (TTK / finish) -> retreat to cover -> retreat -> claim cubes -> laser rush / late walk -> crossfire break (B60) -> heal -> loot / farm / hide. The early laser trip (B17) is cancelled by engage, a claim goal, being hurt, or **any hit in the last 3 s** (`FARM_QUIET_S`). Details: `coord/RESEARCH.md` §2.3.

## 4. Top 10 suspected bottlenecks (ranked by expected placement impact)
| # | Bottleneck | Evidence |
|---|---|---|
| 1 | The 3 s "hit recently" gate blocks the early laser walk (62 of 76 blocked games) | Measured in sim, `coord/audit/perf-fix-handoff` |
| 2 | Under fire, the bot stands still in heal mode (`brain.ts:736`); 42% of damage taken in early deaths | Measured in sim, same file |
| 3 | Laser by 30 s: ours 29/96 (30%) vs ladder winners alive at 30 s, 60% laser / 74% special | Sim vs Watcher, `RESEARCH.md` §8 |
| 4 | Gun-only deaths before 45 s: 48 of 192, untouched by any keep | Measured in sim, `RESEARCH.md` §7 |
| 5 | Engage and claim outrank and cancel the laser trip | Verified in code; impact is a hypothesis |
| 6 | Our own hits reset regen, so healing rarely starts in a fight | Verified in code (0200 audit); unfixed |
| 7 | Stands still while shooting | Verified in code; the B27 strafe fix lost (3.38), so the right fix is unknown |
| 8 | Sim score barely predicts site score (r 0.22) | Measured, `site-corr` |
| 9 | No replays or per-match data for our practice runs | Fact (site) |
| 10 | Slots spent on near-copies and rematches (11 losses or ties since B80) | `coord/log.md` |

## 5. Strategy-gap table
| Framework area | Status |
|---|---|
| 6.1 Survival-first | Partial: retreat, cover and crossfire break exist; heal under fire is weak (#2, #6) |
| 6.2 Threat tracking | Partial: 5 s memory; a multi-hunter system is **unsuitable now** (the audit dropped it: early deaths start 1-on-1) |
| 6.3 Navigation | Implemented (A*); nav fixes are inert (3 of 192 games) |
| 6.4 Weapons | Partial: the early laser is gated off too often (#1); slot or weapon swaps lost (B66, B68, B90) |
| 6.5 Economy and upgrades | Partial: farm and claim exist, with a fixed upgrade order |
| 6.6 Adaptive objectives | Partial: a fixed priority list |
| 6.7 Endgame | Partial; see research PR #41 (zone collapse at 6:55) |
| Combat math / readiness | **Unsuitable now**: we were engaged in 0 of 56 early deaths |

## 6. Testing infrastructure
- The kit gate (`check.py`) and the local sim (`tools/sim`, paired seeds, reproduces 1 of 192 on rerun). The sim mean is a screen only: r 0.22 with the site.
- Better proxies for the site: laser share (r 0.46) and gun-only share at end (r -0.39). Before any slot, require handoff §3's table: games changed, laser by 30 s, died before 40 s, gun-only and lightning at end, 2+ attackers, stuck, decision p99/max.
- The site allows 4 submissions an hour, with no per-match data. Near-inert builds usually tie, but not always (B94: 6 of 192 games changed, scored 3.73).

## 7. Highest-priority first experiment
**UF100**: the early laser walk keeps going under fire (laser only, within 100 m, before 30 s). Sim vs B80 per the audit: +0.25 ± 0.14, laser by 30 s 58 -> 82, died before 40 s 56 -> 54. Keep only if the site score is above 3.79; otherwise close, and main and the final entry stay B80.

## 8. Execution assignments
| Task | Owner | Branch | Output | Review |
|---|---|---|---|---|
| UF100 build | Diego's Claude | `claude/project-thread-xyzfl3` (PR #88) | done | Grok verifies |
| UF100 verify + submit + log | Grok | none | PR comment, log, `EXPERIMENTS.md` | keep only if > 3.79 |
| Top code-audit finding after UF100 | Diego's Claude | new branch off main | PR with the §3 table | Grok gate + screen |
| Death analysis on the post-UF100 champion | Mech Sim Tester | none | proposal file | Grok |
| Top-bot opening study | Mech Watcher | none | findings.md | Grok |

## 9. Deadline strategy (lock Sun 9:00 AM ET, deadline 11:00 AM ET)
- One real change per slot. No more rematches of old PRs or late-walk / cover / charge tweaks.
- Today: UF100, then the audit's next finding. If UF100 keeps, the opening's follow-ups (heal under fire, #2) build on top of it. If it loses, try the same blocker another way (e.g. move to cover instead of standing still) before switching areas.
- Saturday night: keep 2-4 slots an hour only while there are candidates that pass the §3 table; don't fill slots with near-copies.
- **Sun 7:00-9:00 AM:** no new mechanisms. Readiness check: repo public, Docker builds, champion commit on main, final entry = best verified score. Never click "Pick as our final entry" unless Doug or Diego decides to.

## 10. Human decisions needed
1. **Doug:** approve Mech Sim Tester calibrating the sim against Watcher recordings (hit rates, time to kill), validated by rank-correlation against our site results.
2. **Doug:** a yes or no for each Mech Wild Sim batch, if we use it.
3. **Diego or Doug:** approve each new build after UF100 (Diego approved UF100).
