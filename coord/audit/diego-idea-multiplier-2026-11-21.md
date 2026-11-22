# Proposal for Grok: four ways to get more builds through the screen (Diego, 9:14 PM ET Sat Nov 21)

**From Diego (verbatim ask):** "articulate these ideas thoroughly and send to grokbot for evaluation. Have it respond
to the chat it operates in communicating with doug with a very large font that says DOUGGGG"

**So, Grok:** please evaluate the four proposals below. Then post your verdict in your chat with Doug, opening with
the line below as a very large heading:

# DOUGGGG

These proposals don't change the locked workflow. Each one still goes through an idea record, one flag or one change
per build, `coord/BUILD_CHECKLIST.md`, the paired screen and the slot rules. Doug and Grok decide.

## Why now (repo facts at 9:05 PM ET)
- **Site slots are idle.** The limit is 6/hour, 0 were used in the last 60 min, and the last submit was 8:04 PM ET
  (`coord/data/pipeline_view.json`).
- **Since 12:00 ET:** 21 site tests and 5 wins. 28 builds were retired unsubmitted and 13 lost. READY = 0.
- **Every recent build failed the screen:** P30, P29b, P34, P35, P37. Each was within noise of the champion, below
  it, or lower on drop arrivals.
- **The pipeline isn't short of builds or screen time. It's short of builds that pass the screen.** At roughly
  1 in 4 or 5 passing, filling 6 slots/hour would take over 20 builds/hour.
- **Screening is cheap now.** Sim Tester runs a 384-game screen in about 80 s with the #133 shortcut. Diego's Mac
  (14 cores) runs one in about 1.4 min on the plain sim (PR #152). Note that #152 found Mac numbers close to, but not
  bit-exact with, Sim Tester's, so build and champion must be screened on the same station.

## 1. Sweep existing numbers instead of inventing new behaviours
**What.**
- Take the 6 knobs in `params.ts`: `gunRange` 100, `retreatHp` 0.30, `zoneWalk` 0.8, `zoneBuffer` 10,
  `silentSpeed` 5, `aggression` 1.5.
- Then take the fixed thresholds in `brain.ts` that the champion's decisions hinge on, for example the drop-run
  distance, `farmOk` radii, laser charge and release thresholds, and the midring band 0.40-0.70 added by P29.
- For each, screen 3-5 values around the champion's on both seed sets, one value per build.

**Why it multiplies.**
- A new behaviour needs research, code, a hazard run and review. A value change needs a one-line edit, and flag 0
  stays byte-identical, because the flag selects the old value.
- One builder can stage many sweep builds in the time one behaviour takes.
- At 1.4 min per 384-game screen, the Mac can screen about 40 values per hour.

**Rules it already fits.**
- GROK_BRIEF line 90: "3 values per knob ... trust the trend across them, not the single best run."
- learnings.md line 26: sweeps wait until "a slot would sit empty". Slots are empty now.

**Guard against luck.**
- Only send a value to the site if its neighbours trend the same way (monotone, or a clear peak) on BOTH seed sets.
- Re-confirm on practice bases 6000+7000 (Doug 8:59 PM) before the slot.

**Cost.** CPU on the Mac, plus a small amount of builder time per sweep. No new infrastructure.

**Risk.** Tuning to the sim's house bots. The site score stays the judge.

## 2. Start ideas from where the champion loses, not from a catalogue
**What.**
- The champion baseline screen (2e1d036, 384 games) already records `death_t`, `killer`, `killer_weapon`,
  `damage_taken`, `place`, `cubes`, `weapons` and `upgrades` per game.
- Group the champion's deaths by cause: killer tier × weapon × time bucket (<40 s, 40-120 s, 120-240 s, >240 s) ×
  our loadout.
- Rank the buckets by placements lost. Each top bucket becomes one idea record with its evidence attached.

**Why it multiplies.**
- Ideas start with a measured target ("38 of our deaths are expert-gun at 40-120 s with no laser"), so fewer of
  them die at the screen.
- The bucket's own count also predicts the screen's ceiling. If a bucket only holds 6 games, no fix to it can move
  the set total.

**Cost.** One 384-game champion run, which Sim Tester or the Mac already has, plus a short table. It reuses existing
CSV columns and adds no new tracer.

## 3. Open the families that haven't been tried
**What.**
- Drop-run and laser-timing variants keep failing (P20, P21, P27, P29b, P34, P37 ...).
- Untouched so far:
  - **Sound.** `obs.sounds` is never read by `brain.ts` (0 references). Hearing gives bearing and near/mid/far for
    gun, laser, lightning, mortar, death, crate and drop sounds. Possible uses: turn toward unseen attackers, avoid
    a fight we hear, or finish a hurt enemy after a death sound nearby (audit H07 in PR #98).
  - **Trees.** PR #148 adds `--trees` (sight only, protocol §8: trees block sight, not shots). With it, concealment
    under canopy and blind fire into trees at a sound become screenable for the first time.

**Why it multiplies.** New families have untested headroom. Re-tuning a failed family mostly re-measures noise.

**Note.** Screening tree ideas needs `--trees` on for both build and champion. Adopting it is Doug's call (PR #148
table: champion +0.15/+0.21 with trees on, within noise, but about two-thirds of games change).

## 4. Use the 15-champions test as a second filter for spare slots
**What.**
- Doug's 8:44 PM rule: when no fully screened build is ready, a build that beats the champion's own
  15-champions baseline on BOTH seed sets, with no rise in deaths before 40 s, can fill a spare slot.
- `--vs-champions` is built (PR #151). It's running on Diego's Mac now: the 2e1d036 baseline, then P34.

**Why it multiplies.** Builds that are flat against house bots but stronger against copies of the champion still
reach the site, using slots that would otherwise sit empty. The final is an FFA against other teams' bots, so this
test is arguably closer to the final than the house-bot screen.

**Guard.** It only fills slots that would otherwise be empty, and it never replaces the house-bot screen for a keep.

## Suggested order
1. #2 first: one table from data that exists.
2. #1 next, aimed at the knobs #2 points to.
3. #4 in parallel, since it's already running.
4. #3 for builders who need a new behaviour.
