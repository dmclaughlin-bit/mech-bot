# Seed 2021 first-60 s traces (P48 vs P49b)

Official-station share for Diego's lane to diff the P49b #177 disagreement on seed 2021. Extracted from the official trees-on screen traces; no extra sim was run for this file.

## Sim revision
- Working tree: `/workspace/wt-tester-trees`, HEAD `22f72a88d071bc949ccec6dbc9bd535b74844e3b` (`#148 22f72a8 tools/sim`).
- Uncommitted on top of that HEAD: `tools/sim/run.ts` (SEED_BASE) and `tools/sim/geom.ts` (+32 lines, shortcut-geom). `git diff --stat` vs HEAD: `geom.ts | 32 +++++`, `run.ts | 2 +-`.
- Those two files are byte-identical to branch `sim/trees-screen-patch-v1` at `4b8663e5eba49d34abf5d7c9055546a4fcfb187e` (sha256 of `run.ts` `ad7b217651910c9f1a71965e1e21e2369b423ac46b2f9a558597ea8ad2848117`, of `geom.ts` `8123adc4c5e8d7b517824ad1636b0df6a75b52f70e5c6aa8df64a30ed5787552`).
- The uncommitted `git diff 22f72a8 -- tools/sim/run.ts tools/sim/geom.ts` matches `/workspace/tester/patches/trees-screen-v1.patch` sha256 `7b0e3366bcf183fc4db87b205a2b262092a39ecd9b366cab88662df540d1db64`.

## Map and trees
- Kit: `/workspace/mechfight-kit`, `--kit /workspace/mechfight-kit`.
- Map: kit arena v2, hello `map.dir` = `<kit>/arena`, files `v2/world.json` and `v2/terrain.i16`.
  - `arena/v2/world.json` sha256 `e0302dd4777b527b00a6a4b2e02759915402a23c58839d921e9fcc6d58092445` (299948 bytes), version 2, origin lat 40.0005 lon -83.0165.
  - `arena/v2/terrain.i16` sha256 `3aa74308e096e36ed29230f135b0f3ff3ae09dfa164c2b687455b4f975b01d38` (1549360 bytes).
- Tree setting: `--trees` on (trees block sight). Official screens are trees-on.

## Bot commits
- P48 (champion): `b9492c6f122c549c705b69402157f078b4a57857`
- P49b: `0c6b1344c0948695dc865cfeffcdc52732cc47ec`

## How seeds are handled
In `tools/sim/run.ts`:

```
const SEED_BASE = Number(process.env.SEED_BASE ?? 1000)
const seeds = Array.from({ length: n }, (_, i) => SEED_BASE + i)
```

`--seeds 96` with `SEED_BASE=2000` therefore runs game seeds **2000, 2001, …, 2095** (index 0 → 2000, index 21 → 2021). That integer is the `createSim(..., seed)` match seed. The hello payload also sends a slot-derived bot seed, `Math.imul(S.meId + 1, 2654435761) >>> 0`, which is not the match seed.

The official 4000+5000 set is the same rule with `SEED_BASE=3000`, `4000`, and `5000` (3000–3095, 4000–4095, 5000–5095).

## Exact command (official screen)
These CSVs were sliced from traces written by the official P49b screen (rerun with the fixed wrapper, Sun Nov 22, 1:03:25–1:03:46 AM ET America/New_York for base 2000) and the cached official P48 baseline traces, not from a later one-seed rerun.

P49b base 2000 (wrapped head):

```
cd /workspace/wt-tester-trees
HAZ_BUILD=trees-0c6b134-2000 HAZ_DIR=/workspace/tester/traces/trees-0c6b134-2000 \
  SEED_BASE=2000 bun tools/sim/run.ts \
  --bot /workspace/tester/harness/wrapN-p49b.ts \
  --seeds 96 --jobs 4 --kit /workspace/mechfight-kit --trees \
  --out /workspace/tester/runs/trees-0c6b134-2000.csv
```

P48 baseline used the same sim, kit, `--trees`, `SEED_BASE=2000`, `--seeds 96 --jobs 4`, bot `/workspace/tester/harness/wrapN-p48.ts` (or the earlier equivalent champion wrap), output `/workspace/tester/runs/trees-b9492c6-2000.csv`, traces `/workspace/tester/traces/trees-b9492c6-2000/`.

Source traces:
- P48: `/workspace/tester/traces/trees-b9492c6-2000/18408-5-seed2021.json` (2124 ticks, game ended 212.3 s)
- P49b: `/workspace/tester/traces/trees-0c6b134-2000/554675-5-seed2021.json` (1128 ticks, game ended 112.7 s)

## Columns
`tick,t,x,y,z,hp,in_zone,move_mag,mode,jump,flag,heal_trees`

- `tick`: 0-based index in the trace (0.1 s steps).
- `t`: sim time in seconds.
- `x,y`: horizontal position (m). The official harness stores 2-D `pos`; `z` is blank.
- `hp`: hit points.
- `in_zone`: 1 if inside the current circle.
- `move_mag`: magnitude of the bot's `move` vector (not the heading). This is the action the official wrap recorded; fire, boost, aim, and the raw move components were not stored per tick.
- `mode`: debug mode label (`draw.d.label` after the last ` · `).
- `jump`: 1 if a grounded jump was issued at this `t`.
- `flag`: 1 if this `t` is in the wrap's `flagT` (for P49b, heal-walk ticks).
- `heal_trees`: 1 if this `t` is in `healTreesT` (`mode = "heal, trees"`). Always 0 on P48.

The official harness does not expose an RNG draw counter, so that field is omitted.

Each file has 601 data rows: t = 0 through 60.0 inclusive.

## First difference
Tick **524**, t = **52.4 s**. Position and HP still match (`x=48.1, y=233.1, hp=1578`, in zone). P48 is standing still in `heal` (`move_mag=0`, flag=0, heal_trees=0). P49b is in `heal, trees` and has started walking (`move_mag=0.38`, flag=1, heal_trees=1). 77 of 601 ticks in the first 60 s differ after that. The later 28 s pause on P49b is at t=84–112, after this 60 s window.
