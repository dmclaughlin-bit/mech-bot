> Advisory only. Recommendation: do not shorten the official safety screen. The decision is Doug's.

# Short safety-screen study (advisory)

**Date:** Sun Nov 22, 2026, 3:18–3:20 AM ET (America/New_York).  
**Order:** Doug's 1:58 AM request, run in spare capacity. Advisory only; Doug decides whether to shorten.  
**Method:** no new sims. Existing complete official trees-on CSVs and wrap traces were re-scored under the **current** veto rules on seed subsets. Champion runs were subset identically.  
**Detector:** unchanged `hzlib.pins` (10 s windows, dmax < 3 m and mean move command > 0.3, duration r+9, counts time to death).

## Variants

Official screen: 96 seeds per base (`SEED_BASE + 0..95`) on 2000, 3000, 4000 and 5000 — 384 games, two paired sets of 192.

- **Variant A (main):** the seed lists in the brief — `2000–2023`, `3000–3023`, `4000–4023`, `5000–5023`. That is the first **24 of 96** seeds on each official base (96 games total, **25%** of the official games), still covering both sets. The brief called this the “first half”; it is one quarter of each 96-seed base.
- **Variant B (second check):** one set only — **2000+3000 full** (192 games, 50%). The held-out 4000+5000 set is dropped. Under the current drop-ring *block* rule (totals must fall on **both** sets, and the mean must be lower on both), this variant can never issue a drop-ring block.

Flag-0 (base 2000 identity) is a separate check and is not shortened here. Isolated wrap timing spikes were not automatic official vetoes and are not treated as vetoes here. A single-game survivor dip is a tester call, not an automatic veto, matching current practice. Drop-ring is a **WARNING**; it blocks only if drop totals fall on both sets and the mean is lower on both (LEARNING_STANDARD, 12:48 AM ET).

## Official truth

Comparison is against the **final official verdict** on the full 384-game screen.

**P49b #177:** the original official comment was a 1-veto (stall (c) 2→3 on seed 2021). It was **corrected to PASS at 2:12 AM ET** (comment 7075770859) after the 2021 re-check. **Corrected PASS is the truth.** The detector was not changed; it still flags that 28 s pause, which ends 0.75 s before death 112.75. The correction was a judgment on that one pause. This study applies the detector as-is, then compares PASS/VETO to the corrected official verdict.

## Local data

Complete official CSVs **and** traces (candidate + champion, all four bases) were on disk for the eight named screens, plus P50 #161, P43b #162, and P35c #163. Those were scored. No example was rerun.

**no local data** (not rerun):

- P37b #156 (`4275d89`): official CSVs are present; wrap traces are not (0/4). Champion at the time was P34 `0e6fadd`.
- P40b #155 (`ca549ae`): official CSVs are present; wrap traces are not (0/4). Champion was P34. (The P40d early-death seed 5083 is the same pattern; P40d *is* included below.)
- Earlier official screens.csv rows (P23, P23b, P24, P25, P25b, P26, P27, P29, P29b, P30, P34, P35, P37, P48’s own screen vs its then-champion, and similar): no complete four-base official traces+CSVs under the current `trees-<sha>-<base>` layout. **no local data.**
- Champion baseline rows (P48, P41, P60) are not paired screens and are not compared.

## Hazard seeds vs the two cuts

| Seed | Official screens it decided | In Variant A (first 24/base)? | In Variant B (2000+3000 only)? |
|---|---|---|---|
| 2021 | P41, P62 stall b+c; P49b (original stall c, later corrected) | yes | yes |
| 2022 | P49 stall c | yes | yes |
| 3066, 3086 | P49 stall b+c; P49 / P43b drop-ring | no | yes |
| 3089 | P35c stall a+c | no | yes |
| 4007 | P53 stall c | yes | no |
| 4061, 4093, 5011, 5036 | P50 stall a/c (5036 also P41, P62) | only **5011** | no |
| 4084, 5053 | P61 stall b+c | no | no |
| 5065 | P53 stall c | no | no |
| 5083 | P40d (and P40b) died &lt;40 s | no | no |

Champion official 20 s+ pauses 2047, 3060, 4087, 4090 all sit in the **second half** of their bases, so they are absent from Variant A on both sides. Stall (c) is “any increase in pause-game *count* on either set.” On Variant A a single new first-half pause therefore goes 0→1 and still trips (c). That is why some screens still match after a partner seed is cut. Variant A **cannot** catch a stall that lives only in the second half when no first-half pause appears (P61). Variant B cannot catch a stall or early death that lives only on 4000+5000 (P40d, P53, P61, P50).

## Primary results (the eight named screens)

### Variant A — first 24 seeds on all four bases: **5/8** official final verdicts

| Screen | Official | Short-screen | Result | Official hazard seeds |
|---|---|---|---|---|
| P40d #170 vs P48 | VETO (died&lt;40, 5083) | PASS | **false pass** | 5083 missed |
| P49 #172 vs P48 | VETO (drop 7→6; stall b 3086; stall c 2→5) | VETO (stall c 0→1 on 2022) | **MATCH** | seen 2022; missed 3066, 3086 |
| P41 #173 vs P48 | VETO (stall b 2021; stall c both sets) | VETO (stall b+c on 2021) | **MATCH** | seen 2021; missed 5036 |
| P53 #176 vs P48 | VETO (stall c 2→4; 4007, 5065) | VETO (stall c 0→1 on 4007) | **MATCH** | seen 4007; missed 5065 |
| P49b #177 vs P48 | **PASS** (corrected; original 1-veto on 2021) | VETO (stall c 0→1 on 2021) | **false veto** | seen 2021 |
| P60 #181 vs P48 | PASS | PASS | **MATCH** | — |
| P62 #182 vs P60 | VETO (stall b 2021; stall c both sets) | VETO (stall b+c on 2021) | **MATCH** | seen 2021; missed 5036 |
| P61 #183 vs P60 | VETO (stall b 5053; stall c 2→4) | PASS | **false pass** | 4084 and 5053 both missed |

Misses, in plain language:

- **P40d — false pass.** The only official veto is seed 5083 (14th death 51.35 s → 16th death 31.10 s) on 4000+5000. It is not in 5000–5023. The first-24 subset has deaths &lt;40 s 20=20 on that set. No other veto appears.
- **P61 — false pass.** Both new official pauses (4084 at t=113–137, 5053 at t=185–234) are outside the first 24 seeds of 4000 and 5000. Pause-game counts stay 0=0 on both subset sets. This is the clean example of a held-out-only stall that Variant A cannot see, even with stall (c)’s “any increase” rule.
- **P49b — false veto against the corrected PASS.** Seed 2021 is in 2000–2023. The unchanged detector flags the 28 s pause and stall (c) goes 0→1 (champion pauses 2047 and 3060 are also outside the subset, so the bar is 0). The **full** 384-game traces, scored with the same strict detector and no tester judgment, also still VETO on 2021 (2→3). So this miss is the official correction, not the seed cut. The original 1-veto would have “matched.”

Matches that still missed a listed official hazard seed, but kept the VETO for another reason:

- **P49:** missed 3066 and 3086 (including the stall-(b) / drop-ring game). 2022 alone still trips stall (c) because champion pauses are also gone from the subset (0→1). Under current rules the official drop-ring 7→6 is only a warning anyway; the stall vetoes were enough.
- **P41 and P62:** missed 5036 (held-out stall (c) on 4000+5000). 2021 still supplies stall (b) and stall (c) on 2000+3000.
- **P53:** missed 5065. 4007 still trips stall (c) 0→1 on 4000+5000 (champion pauses 4087 and 4090 are outside the subset). Official 4007 was a game that *improved*; stall (b) does not fire; stall (c) does.

### Variant B — 2000+3000 full only: **4/8** official final verdicts

| Screen | Official | Short-screen | Result | Official hazard seeds |
|---|---|---|---|---|
| P40d #170 vs P48 | VETO | PASS | **false pass** | 5083 missed (held-out only) |
| P49 #172 vs P48 | VETO | VETO (stall c 2→5 on 2022, 3066, 3086; drop warning 7→6) | **MATCH** | all three seen |
| P41 #173 vs P48 | VETO | VETO (stall b+c on 2021) | **MATCH** | seen 2021; missed 5036 |
| P53 #176 vs P48 | VETO | PASS | **false pass** | 4007 and 5065 both missed (held-out only) |
| P49b #177 vs P48 | PASS (corrected) | VETO (stall c 2→3 on 2021) | **false veto** | seen 2021 |
| P60 #181 vs P48 | PASS | PASS | **MATCH** | — |
| P62 #182 vs P60 | VETO | VETO (stall b+c on 2021) | **MATCH** | seen 2021; missed 5036 |
| P61 #183 vs P60 | VETO | PASS | **false pass** | 4084 and 5053 both missed (held-out only) |

Variant B is worse than Variant A on this set of screens: it adds a **false pass on P53** (both stall seeds are on 4000+5000) and still misses P40d and P61 for the same reason. It does keep every 2000+3000 hazard (2021, 2022, 3066, 3086). P49b is again a false veto for the same detector/judgment reason as on the full screen.

## Additional official screens that had local data

These were not in the named list. They are scored the same way. P43b is **not** folded into the headline fraction, because its official veto does not survive the current drop-ring rule even on the full traces.

| Screen | Official | Variant A | Variant B | Notes |
|---|---|---|---|---|
| P50 #161 vs P48 | VETO (4 vetoes; stall c 2→6 on 4000+5000: 4061, 4093, 5011, 5036; stall a on 4093) | **MATCH** (stall c 0→1 on **5011**, which is in 5000–5023) | **false pass** (all of those pauses are on 4000+5000) | Official 2000+3000 also cited a second pause on 2047 (stall b). 2047 is outside Variant A. |
| P35c #163 vs P48 | VETO (stall a+c on **3089**) | **false pass** (3089 is 3000+89, not in 3000–3023) | **MATCH** (3089 is in the full 2000+3000 set) | Full traces, current rules: still VETO. |
| P43b #162 vs P48 | Historical VETO (1 veto: drop-ring 7→5, seed 3086) | PASS (no stall; drop warning only if the subset even sees it) | PASS with drop-ring **WARNING** 7→5 | Under **current** rules the full 384-game screen is also PASS (warning on 2000+3000, drops *rose* 5→9 on 4000+5000, so not a block). This is a rule-change issue, not a short-screen miss. |

Including P50 and P35c (current-rule official VETO, full traces agree) with the eight named screens:

- Variant A: **6/10**
- Variant B: **5/10**

## Station minutes saved

Measured official **head-run** wall times (wrapped 96 seeds, `--jobs 4`, trees-on) from the station logs. Flag-0 is not included. Shorter-screen estimates assume time scales with seed count at the same job count: Variant A = 24/96 = 25% of the four-base head-run; Variant B = the measured 2000+3000 pair (~50%).

| Screen | Measured 4-base head-run | ≈ Variant A (25%) | Saved | ≈ Variant B (2000+3000) | Saved |
|---|---|---|---|---|---|
| P40d #170 | 94 s (1.57 min) | 24 s (0.39 min) | 1.18 min | 47 s (0.78 min) | 0.78 min |
| P49 #172 | 90 s (1.50 min) | 22 s (0.38 min) | 1.12 min | 41 s (0.68 min) | 0.82 min |
| P41 #173 | 85 s (1.42 min) | 21 s (0.35 min) | 1.06 min | 40 s (0.67 min) | 0.75 min |
| P53 #176 | 89 s (1.48 min) | 22 s (0.37 min) | 1.11 min | 41 s (0.68 min) | 0.80 min |
| P49b #177 | 91 s (1.52 min) | 23 s (0.38 min) | 1.14 min | 44 s (0.73 min) | 0.78 min |
| P60 #181 | 82 s (1.37 min) | 20 s (0.34 min) | 1.02 min | 41 s (0.68 min) | 0.68 min |
| P62 #182 | 85 s (1.42 min) | 21 s (0.35 min) | 1.06 min | 41 s (0.68 min) | 0.73 min |
| P61 #183 | 91 s (1.52 min) | 23 s (0.38 min) | 1.14 min | 45 s (0.75 min) | 0.77 min |

Average four-base head-run on those eight screens: **88 s (1.47 min)**. Variant A would have taken about **22 s (0.37 min)** of head-run, saving about **1.10 min** per screen. Variant B would have taken about **42–45 s (0.70–0.75 min)**, saving about **0.73 min**. Flag-0 (~20 s) and analysis time are unchanged. The 96-fresh estimate (~40–45 s, advisory) is out of scope for this shortening.

For the record: P62 head runs were 3:03:10–3:04:35 AM ET (85 s); P61 were 3:12:06–3:13:38 AM ET (92 s). About 20–25 s per 96-seed base at `--jobs 4`.

## Context: full 384-game traces under the same strict detector

This is not a new screen. It only shows that a P49b “false veto” is the official correction, not the seed cut, and that P43b’s historical drop-ring veto is already gone under current rules.

| Screen | Official final | Full traces, current rules + unchanged detector |
|---|---|---|
| P40d | VETO | VETO (died&lt;40, 5083) |
| P49 | VETO | VETO (stall c 2→5) |
| P41 | VETO | VETO (stall b 2021; stall c both sets) |
| P53 | VETO | VETO (stall c 2→4) |
| P49b | PASS (corrected) | VETO (stall c 2→3 on 2021) |
| P60 | PASS | PASS |
| P62 | VETO | VETO (stall b 2021; stall c both sets) |
| P61 | VETO | VETO (stall b 5053; stall c 2→4) |
| P50 | VETO | VETO (stall c 2→6) |
| P35c | VETO | VETO (stall a+c on 3089) |
| P43b | historical VETO (drop-ring) | PASS (warning only, current rule) |

## Takeaway

On the eight named screens, **Variant A matches 5/8** official final verdicts and **Variant B matches 4/8**.

Variant A **false passes** P40d (missed 5083) and P61 (missed 4084 and 5053). It **false-vetoes** P49b against the corrected PASS, for the same 2021 detector flag the full screen originally used. It still catches P49, P41, P53, and P62 even when a partner hazard seed is cut, because stall (c)’s “any increase” rule fires on the remaining first-half pause once champion second-half pauses also drop out.

Variant B **false passes** P40d, P53, and P61 — every official veto that lived only on 4000+5000 — and has the same P49b false veto. It is the weaker cut on this history.

Adding P50 and P35c (complete local data, official VETO, current rules agree on the full traces) makes Variant A **6/10** and Variant B **5/10**. P43b is not counted in those fractions.

Time saved is about **1.1 min** of head-run per screen for Variant A, and about **0.7 min** for Variant B, versus a measured ~1.5 min official four-base head-run. Flag-0 and the 96-game estimate would still be on top of that.

Doug decides whether to shorten.
