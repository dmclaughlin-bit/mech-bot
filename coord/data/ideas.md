# Idea families

Status: **alive** = a keep that is still in the champion stack, or a build in flight on the site. **dead** = site-tested and did not beat the then-champion; do not recycle without a genuinely new mechanism. **untested** = not yet site-tested (includes queued and deferred work).

The official site score is the only keep/close truth. Best site result is blank when the family has no official submission.

Champion stack still on main (bot code of B80 `28c3acc1a0f58571163e90b562da1c25067085c4`, site 3.79, receipt BB-78A44AAF): B1 aim, B2/B3 nav, B5b cover/heal, B12/B13 farm, B14/B16 engage and target pick, B19 no-sneak, B17 bounded laser rush, B30 settings, B60 crossfire, B80 late gun-only walk.

## Site-tested families

| Family | Builds that tested it (site score) | Best site result | Status |
|---|---|---|---|
| aim | B1 (1.67 KEEP), B7 (2.04 LOSS), B15 (2.65 LOSS), B24 (3.40 LOSS) | 1.67 (B1, now part of the stack) | alive (B1); later aim tweaks dead |
| nav | B2 (2.17 KEEP), S3 (2.17 TIE, identical resubmit), B3 (2.23 KEEP), B10 (2.35 LOSS), B11b (2.10 LOSS), B19 (3.08 KEEP) | 3.08 (B19, in the stack) | alive (B2/B3/B19); inflate and nearest-reachable fallback dead |
| cover | B5 (2.04 LOSS), B5b (2.38 KEEP), B6 (2.23 LOSS), B41 (3.65 LOSS), B53 (3.50 LOSS), B100 (3.50 LOSS) | 2.38 (B5b, in the stack) | alive (B5b heal-and-fire); hold-behind-cover, post-kill cover, late 1+LOS cover, and wider/rear-step variants dead |
| farm | B12 (2.44 KEEP), B13 (2.54 KEEP) | 2.54 (B13, in the stack) | alive |
| engage | B14 (2.88 KEEP), B16 (2.98 KEEP), B20+22 (3.35 LOSS), B27 (3.38 LOSS), B30 (3.54 KEEP), B48 (3.50 LOSS), B98 (3.63 LOSS), B26 (3.48 LOSS, rematch on B80) | 3.54 (B30, in the stack) | alive (B14/B16/B30); standoff+race stack, strafe, house-TTK calibration, no-early-finish, and multi-threat race rematch dead |
| laser-rush | B8 (2.27 LOSS), B17 (3.50 KEEP), B36 (3.54 TIE), B40 (3.23 LOSS), B32 (3.48 LOSS), B39 (3.38 LOSS), B74 (3.67 TIE), B64 (3.63 LOSS) | 3.50 (B17, in the stack) | alive (B17 bounded early walk); unbounded laser-first, pre-charge, dash, rush-start, rush-first, and "finish last 30 m" dead or ties |
| opening | B23 (3.46 LOSS), B45 (3.35 LOSS), B76 (3.25 LOSS), B43 (3.69 LOSS), B51 (3.79 TIE), UF100 (3.79 TIE); B101 screened, no slot | 3.79 tie (B51, UF100) — did not beat B80 | dead for new first-30s / opening tweaks (per 11:57 AM ET receipt check: stop building first-30s fixes). B101 early dodge was screened at sim −0.151 ± 0.129 and was not submitted |
| upgrades | B21 (3.46 LOSS) | 3.46 | dead |
| crossfire | B60 (3.67 KEEP), B82 (3.46 LOSS), B88 (3.52 LOSS) | 3.67 (B60, in the stack) | alive (B60 2-on-1 LOS break); wider cover search and "don't start a laser charge under fire" dead |
| lightning | B80 (3.79 KEEP), B66 (3.58 LOSS), B68 (3.21 LOSS), B86 (3.79 TIE), B90 (3.73 LOSS), B92 (3.79 TIE), B94 (3.73 LOSS), B103 (3.92 KEEP), B106 (3.85 LOSS) | 3.92 (B103, in the stack) | alive (B80 late walk + B103 ambush). Distance/start-time/claim-priority variants tied or lost. Widening the ambush to uncharged-laser holders (B106) lost. Do not extend late-walk distance again (B86) or start it at 35 s (B92) |
| drops | B104 (3.88 CLOSE, +0.09 over B80 parent) | 3.88 | alive: rebuilding on 4.06 as Build 107 (P-D-003) |
| standoff | P-B-001 (4.06 KEEP) | 4.06 (current champion and final entry) | alive (in the stack) |

Screened on the sim but **not** site-submitted (do not treat as a site result): B28, B34, B38, B42, B49, B54, B56, B78, B84, B96, B101, and earlier SHAs of B39/B43/B51/B64/B66/B82. See `screens.csv`. B56 (sidestep off a charging laser line) was screened vs B30 at sim −0.214 ± 0.119 and was not submitted; P-B-002 is a later, narrower engagement check and must explain why it is not the same mechanism.

## Queued and research candidates (S1–S9 and current prompts)

From `coord/research/strategy-report-2026-11-21.md`, with later coordinator decisions. These have **no site score** unless a build above already tested a close cousin.

| ID | Idea | Status |
|---|---|---|
| S1 | Context-sensitive early objective choice (claim vs laser rush) | **dead / dropped** — opening family; seven documented 3.79 ties include opening changes (B51, UF100). Do not spend a slot on first-30s objective swaps |
| S2 | Threat-forecast: warn before a second hunter gets LOS, mid-game only (after 60 s, engage decision only) | **untested / queued as P-D-002** (`FORECAST2_S=60`). Do not reuse B82/B100 cover search or B98 blanket no-early-finish |
| S3 | Exposure-budgeted routes | **untested** (test later, after route-exposure data) |
| S4 | Two-horizon combat selection (burst vs sustained) | **untested** (diagnostic first) |
| S5 | Full threat-conditioned behavior modes | **untested / defer** (architecture change before the lock) |
| S6 | Opponent archetype memory and online adaptation | **untested / later** as written in the report. A narrow slice — react when a visible enemy is charging a laser — is **queued as P-B-002** (`LASER_CHARGE_REACT_ON`). That is not B88 (charge suppression), and it is not the full S6 memory system |
| S7 | Placement-aware survival value instead of raw kills | **untested / later**. Real site evidence on *our* bot is that practice score tracks our kills almost exactly (sim r 0.989); treat this candidate with that in mind |
| S8 | Small tactical lookahead / MCTS-style search | **untested / defer** |
| S9 | Offline policy portfolio / multiagent RL | **untested / post-lock** |
| P-B-001 | Mid-game standoff break after 60 s (`STANDOFF_BREAK_S=60`) | **untested / current prompt** in `coord/next-doug.md` |

When a queued item is submitted, add its row to `site_results.csv` and update this table the same day.
