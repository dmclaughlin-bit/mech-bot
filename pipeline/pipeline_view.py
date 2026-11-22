#!/usr/bin/env python3
"""Rebuild coord/data/pipeline_view.json: the read-only data behind Doug's pipeline view.

Usage (from the repo root, after `git fetch origin`):
    python3 pipeline/pipeline_view.py            # writes coord/data/pipeline_view.json
    python3 pipeline/pipeline_view.py --since "2026-11-21 12:00"   # change the idea window
    python3 pipeline/pipeline_view.py --prs-cache /tmp/prs.json    # offline: reuse a saved `gh` dump

Read-only: it only reads repo files, git history and `gh` (PRs and their comments). It never
submits, merges, comments or edits anything except its own JSON output. Stdlib only.

What is derived from the repo (re-run to refresh): the site results, every timestamp, PR state,
screens (screens.csv rows + PR screen comments, matched to the exact SHA), whether a head
contains the champion, READY/HOLD from ready_ledger.md, slot counts, truth-consistency checks.
What is curated (CURATED below): the source, owner and "single decision" wording for ideas whose
assignment is not recorded in a structured file, and the declared number of behavior changes in
bundles. Every curated field carries a `basis`; anything not in a primary source is "unknown".
"""
import argparse, csv, json, re, subprocess, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    from zoneinfo import ZoneInfo
    ET = ZoneInfo("America/New_York")
except Exception:  # pragma: no cover
    ET = timezone(timedelta(hours=-5))

REPO = "dmclaughlin-bit/mech-bot"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "coord/data/pipeline_view.json"
STAGES = ["Idea", "Researched", "Assigned", "Built (PR)", "Screened", "READY", "Submitted", "Scored", "Merged", "Retired"]
SET_A, SET_B = "2000+3000", "4000+5000"


def sh(*a, check=False):
    r = subprocess.run(a, cwd=ROOT, capture_output=True, text=True)
    return r.stdout if r.returncode == 0 or not check else ""


def to_et(iso):
    if not iso:
        return None
    d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    return d.astimezone(ET)


def fmt(d):
    return d.strftime("%Y-%m-%d %H:%M ET") if d else None


def parse_site_time(s):  # "2026-11-21 17:33 ET"
    return datetime.strptime(s.replace(" ET", ""), "%Y-%m-%d %H:%M").replace(tzinfo=ET)


# ------------------------------------------------------------------ curated metadata
# (source, owner, declared_changes, basis). Only used where the repo has no structured record.
# declared_changes counts distinct behaviors in the build as its own text states them.
DECL = {
    "B1": (4, "summary lists gun lead, laser charge, lightning, mortar lob"),
    "B2": (3, "summary lists terrain in LOS, loot rules, basic retreat/zone"),
    "S3": (0, "identical resubmit of B2 (no change)"),
    "B3": (3, "summary lists path-aware zone travel, stuck recovery, 30 ms guard"),
    "B5": (3, "summary lists cover retreat, heal with fire gate, hide from sight cones"),
    "B5b": (3, "same three parts as B5 minus the fire gate"),
    "B8": (2, "summary: unbounded seek + charge-steers-torso"),
    "B14": (2, "summary: fight-or-flee by TTK vs TTD + finish-engage"),
    "B15": (2, "summary: aim lead + fire discipline"),
    "B20+22": (2, "summary: 'Weapon standoff + calibrated race (stacked)'"),
    "B30": (3, "summary: aggression, retreatHp and LASER_TRIP_M changed together"),
    "B40": (3, "summary: 'Stack: rush-first + pre-charge + backstab' (3 flags in diff)"),
    "B94": (2, "summary: P9 + P10 (late walk outranks claim AND late chase 30 s)"),
    "P24": (2, "one flag, two parts: HEAL_COVER=2 = noSneak-gap fix (level 1) + LOS-breaking hide walk (PR #130 body)"),
    "P23b": (2, "late-farm torso sweep + 3 s no-progress abort (PR #134 title)"),
    "B125": (6, "six TAC_* tactic flags ON in one head (PR #135 body)"),
}

# key -> dict. For site-tested builds the numbers come from site_results.csv; this adds who/why.
CURATED = {
    # --- site-tested since noon
    "B103": dict(source="Diego research (audit H1)", owner="Doug's Claude (H1; WORKFLOW.md)", pr=[94]),
    "B104": dict(source="Diego research (P-D-001 Step B)", owner="Diego's Claude (P-D-001)", pr=[95, 93]),
    "B105-PB001": dict(source="Grok queue (build on the 3.92 win)", owner="Mech Builder (ACK 12:43 PM ET)", pr=[96]),
    "B106": dict(source="Grok queue (P-B-003, from PR #94 data)", owner="Grok's Claude (Build 106)", pr=[97]),
    "B108": dict(source="Diego research (audit H01, P-D-004)", owner="Grok's Claude (Build 108)", pr=[101]),
    "P-D-002": dict(source="Grok strategy report S2", owner="Diego's Claude (P-D-002)", pr=[102]),
    "B107": dict(source="Site result (rebuild of B104 on a stronger champion, P-D-003)", owner="Grok's Claude", pr=[99]),
    "P-B-006": dict(source="Site result (tweak of the 4.06 win)", owner="Mech Builder (ACK)", pr=[107]),
    "B113": dict(source="Site result (tweak of the drop-run win)", owner="Grok's Claude", pr=[116]),
    "B115": dict(source="Site result (tweak of the drop-run win)", owner="Grok's Claude", pr=[118]),
    "B118": dict(source="Site result (tweak of the drop-run win)", owner="Grok's Claude", pr=[120]),
    "P20": dict(source="Site result (drop-family follow-up)", owner="Mech Builder (ACK P20)", pr=[121]),
    "B117": dict(source="Doug request (2:38 PM ET: loadout and HP)", owner="unknown (no ACK in PR or log)", pr=[123]),
    "P21": dict(source="Site result (drop-family follow-up)", owner="Mech Builder (ACK P21)", pr=[122]),
    "B110": dict(source="Site result (tweak of standoff break)", owner="Grok's Claude", pr=[108]),
    "B111": dict(source="Site result (tweak of lightning ambush)", owner="Grok's Claude", pr=[109]),
    "P24": dict(source="Grok research (heal positioning, Doug's question)", owner="Mech Builder (ACK P24)", pr=[130], research=["coord/data/research/heal-positioning.md"]),
    "P23b": dict(source="Builder diagnosis (instrumented main)", owner="Mech Builder (ACK P23b)", pr=[134, 127]),
    "B125": dict(source="Movement track (P-B-008) tactics", owner="unknown (no ACK in PR or log)", pr=[135]),
}

# Items that never reached the site (or are not builds). id, title, kind, source, owner, changes, basis, prs, regex, extra
OTHER = [
    ("P-B-004", "Zone unpin (outside-zone nav pin)", "build", "Wild Sim hazard screen", "Mech Builder (ACK)", 1, "PR #104 body: one change", [104], r"P-B-004", {}),
    ("P-D-006", "Cook-off target bonus (H09)", "build", "Diego research (audit H09)", "Grok's Claude (Build 109)", 1, "PR #114 body: one flag COOKOFF_BONUS_ON", [114, 105], r"P-D-006", {}),
    ("P-B-005", "Gun lead during laser charge (H02)", "build", "Diego research (audit H02)", "Mech Builder (ACK)", 1, "PR #106 body: one flag", [106], r"P-B-005", {}),
    ("B112", "Standoff far edge STANDOFF_MAX_M 90->100", "build", "Site result (tweak of standoff break)", "Grok's Claude", 1, "PR #110 body: one knob", [110], r"B112", {}),
    ("P18", "Standoff max 120 m", "build", "Site result (tweak of standoff break)", "unknown", 1, "PR #111 title: one knob", [111], r"P18", {}),
    ("P19", "Standoff HP margin 0.2->0.1", "build", "Site result (tweak of standoff break)", "unknown", 1, "PR #112 title: one knob", [112], r"P19", {}),
    ("P-B-002", "Laser-charge react (break LOS when a laser charges at us)", "build", "Grok strategy report S6", "Grok's Claude (Build 105)", 1, "PR #113 body: one flag", [113, 103, 100], r"P-B-002", {}),
    ("P-B-008", "Movement & evasion track (sim-only, modes 1-6)", "track", "Doug request (1:52 PM ET)", "Claude on Grok's computer", 6, "PR #115: six EVADE_MODE variants (modes 1-6)", [115], r"P-B-008", dict(research=["coord/data/research/wildsim-movement-pb008.md", "coord/data/research/calibrated-movement.md"], sim_only=True)),
    ("B116", "Movement mode 6 ON as a site candidate", "build", "Movement track (P-B-008)", "Claude on Grok's computer", 4, "PR #119: mode 6 = jittered orbit + telegraph dodge + slide around cover + muzzle aim (4 parts)", [119], r"B116", dict(hold="ON HOLD by Doug 3:07 PM ET (PR #119 comment)")),
    ("P-B-008i3", "Movement iteration 3 (modes 30-44, sim-only)", "track", "Movement track (P-B-008)", "Claude on Grok's computer", None, "15 variants; not a site candidate (PR #129)", [129], r"iter(ation)? ?3", dict(sim_only=True)),
    ("B114", "Drop reach 150->110 m", "build", "Site result (tweak of the drop-run win)", "Grok's Claude", 1, "PR #117 body: one line", [117], r"B114", dict(retired_reason="superseded by B113 4.17 (shorter reach is the losing direction)")),
    ("P-D-007A", "Late deaths are multi-LOS; zone travel touches 28/37 games (measurement)", "research", "Diego research", "Diego's Claude (ACK P-D-007)", 0, "docs and probe only", [124], r"P-D-007", dict(researched=True)),
    ("P-D-007B", "ZONE_EARLY_S zone-travel timing", "build", "Diego research (P-D-007 Step B)", "Diego's Claude", 1, "PR #125 body: one flag", [125], r"ZONE_EARLY", dict(retired_reason="fails in sim; PR recommends no slot")),
    ("B122", "Mid-game unstuck (UNSTUCK_ON)", "build", "Watcher stuck gap -> Grok's Claude", "Grok's Claude", 1, "PR #126 body: one flag", [126], r"B122", dict(retired_reason="VETO: fires 5/192 and 6/192, drop-ring arrivals fell (PR #126 comment)")),
    ("B124", "No close-in while hurt on a laser holder (frequency check)", "build", "Grok's Claude candidate", "Grok's Claude", 1, "PR #126 comment (c); no PR of its own", [126], r"B124", dict(retired_reason="frequency check only, not a site candidate")),
    ("B123", "Late-game hurt kiting (HURT_KITE_ON)", "build", "Grok's Claude candidate", "Grok's Claude", 1, "PR #128 body: one flag", [128], r"B123", dict(retired_reason="VETO per PR title: do not site-test")),
    ("P23", "Late-game idle torso sweep (LATE_FARM_ON)", "build", "Builder diagnosis (instrumented main)", "Mech Builder (ACK P23)", 1, "PR #127 body: single flag", [127], r"P23", dict(retired_reason="Tester VETO 5:09 PM ET (new in-zone pin, seed 90); rebuilt as P23b")),
    ("P-D-008", "laserSkip expiry comeback (H12)", "research", "Diego research (audit H12)", "Diego's Claude (ACK P-D-008)", 0, "probe only", [131], r"P-D-008", dict(researched=True, retired_reason="comeback 4/192 and 3/192, below the ~10/192 bar; no Step B")),
    ("P-D-009", "Two-horizon race() (H13)", "research", "Diego research (audit H13)", "Diego's Claude (ACK P-D-009)", 0, "shadow count only", [132], r"P-D-009", dict(researched=True, retired_reason="disagreement 9/192 and 10/192, outcomes mixed; no build")),
    ("P-D-010", "En-route travel delay (healthy, unengaged travel)", "research", "Watcher SKILLS (healthy boost/travel) + Doug 5:38 PM overhaul", "Diego's Claude (assigned, NOT acknowledged)", 0, "measurement first", [], r"P-D-010", dict(assigned_only=True)),
    ("P25", "Cube memory: walk to remembered cubes out to 150 m (CUBE_MEMORY_ON)", "build", "Watcher SKILLS idea 1", "Mech Builder (ACK P25)", 1, "PR #136 body: one flag CUBE_MEMORY_ON", [136], r"P25", dict(research=["coord/data/watcher/SKILLS.md"], skills_idx=1)),
    ("P-D-005", "H08 (parked)", "research", "Diego research (audit H08)", "Diego's Claude", 0, "trigger count only", [], r"P-D-005", dict(researched=True, retired_reason="trigger count 2-4% fails the bar (log.md)")),
    ("B101", "Early dodge", "build", "Grok's Claude", "Grok's Claude", 1, "ideas.md: screened, no slot", [], r"B101", dict(retired_reason="screened sim -0.151, not submitted (ideas.md)")),
]

# Idea-only rows with no PR: Watcher SKILLS ideas 2-5 are parsed from SKILLS.md; assignment is unknown.
WATCHER_SKILLS_NOTE = "Watcher SKILLS.md (generated 2026-11-21 17:25 ET): not assigned, no record of an owner"


def gh_json(path, paginate=True):
    cmd = ["gh", "api", path] + (["--paginate"] if paginate else [])
    out = sh(*cmd)
    if not out:
        return []
    # --paginate concatenates JSON arrays: "][" -> ","
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return json.loads("[" + re.sub(r"\]\s*\[", ",", out).strip("[]") + "]")


def load_prs(cache):
    if cache and Path(cache).exists():
        return {int(k): v for k, v in json.load(open(cache)).items()}
    prs = gh_json(f"repos/{REPO}/pulls?state=all&per_page=100")
    data = {}
    for p in prs:
        data[p["number"]] = dict(number=p["number"], title=p["title"], state=("merged" if p.get("merged_at") else p["state"]),
                                 head=p["head"]["sha"], branch=p["head"]["ref"], created=p["created_at"], closed=p.get("closed_at"),
                                 merged=p.get("merged_at"), body=p.get("body") or "", url=p["html_url"], comments=[])
    for n in sorted(data):
        if n < PR_MIN:
            continue
        cs = gh_json(f"repos/{REPO}/issues/{n}/comments?per_page=100")
        data[n]["comments"] = [dict(at=c["created_at"], url=c["html_url"], body=c["body"], user=c["user"]["login"]) for c in cs]
    if cache:
        json.dump(data, open(cache, "w"))
    return {int(k): v for k, v in data.items()}


PR_MIN = 93


def sha_prefixes(text):
    return {m[:7] for m in re.findall(r"\b[0-9a-f]{7,40}\b", text)}


def screen_events(prs, screens_rows):
    """All screen evidence: [{at, sets, shas, src, url}]; sets subset of {A,B}."""
    ev = []
    for n, p in prs.items():
        for c in p["comments"]:
            b = c["body"]
            if not re.search(r"screen|paired", b, re.I) or "2000" not in b:
                continue
            if re.match(r"\s*(Site |Grok: site|Rebased)", b):
                continue
            sets = set()
            if "2000" in b and "3000" in b:
                sets.add("A")
            if "4000" in b:
                sets.add("B")
            ev.append(dict(at=c["at"], sets=sorted(sets), shas=sorted(sha_prefixes(b)), src=f"PR #{n} comment", url=c["url"], pr=n))
    for n, p in prs.items():
        b = p["body"]
        if (re.search(r"screen|paired", b, re.I) and "2000" in b and "3000" in b
                and not re.search(r"will follow|will be posted|follows as|not run|to follow|will be a comment|not for the site until|until the .{0,40}screen|waiting on|awaiting", b, re.I)):
            sets = {"A"} | ({"B"} if "4000" in b else set())
            ev.append(dict(at=p["created"], sets=sorted(sets), shas=[], src=f"PR #{n} body table (time = PR opened; body may have been edited)", url=p["url"], pr=n, body=True))
    seen = {}
    for r in screens_rows:
        s = r["seed_set"]
        sets = set()
        if "2000" in s:
            sets.add("A")
        if "4000" in s:
            sets.add("B")
        if not sets:
            continue
        sha7 = r["commit_sha"][:7]
        if sha7 not in seen:
            out = sh("git", "log", "origin/main", "--reverse", "-S" + sha7, "--format=%aI", "--", "coord/data/screens.csv").split()
            seen[sha7] = out[0] if out else None
        ev.append(dict(at=seen[sha7], sets=sorted(sets), shas=[sha7], src="screens.csv " + r["build_id"], url=None, pr=None))
    return ev


def first_mention(regex):
    pat = r"(^|[^A-Za-z0-9-])(" + regex + r")([^A-Za-z0-9]|$)"
    out = sh("git", "log", "origin/main", "--reverse", "-G" + pat, "--format=%aI", "--", "coord/log.md", "coord/next-doug.md", "coord/next-diego.md", "coord/STATUS.md", "coord/data/ideas.md").split()
    return out[0] if out else None


def contains(champ, head):
    return subprocess.run(["git", "merge-base", "--is-ancestor", champ, head], cwd=ROOT, capture_output=True).returncode == 0


def diff_switches(parent, commit):
    d = sh("git", "diff", "--no-color", "-U0", parent, commit, "--", "*.ts")
    add, rem = {}, set()
    for l in d.splitlines():
        m = re.match(r"^([+-])\s*(?:export\s+)?const\s+([A-Z][A-Z0-9_]{2,})\b\s*(?::[^=]+)?=\s*(.*)", l)
        if m:
            if m.group(1) == "+":
                add[m.group(2)] = m.group(3).strip().rstrip(";").split()[0] if m.group(3).strip() else ""
            else:
                rem.add(m.group(2))
    bools = [k for k, v in add.items() if k not in rem and v.lower().rstrip(",") in ("true", "false", "1", "0") and (k.endswith("_ON") or k.startswith("TAC_") or v.lower() in ("true", "false"))]
    knobs = [k for k in add if k in rem]
    return bools, knobs


def parse_ready(path):
    txt = path.read_text() if path.exists() else ""
    ready, hold = [], []
    sec = None
    for l in txt.splitlines():
        if l.startswith("### READY"):
            ready.append(l[4:].strip())
            continue
        if l.startswith("### HOLD"):
            hold.append(l[4:].strip())
            continue
        if l.startswith("## READY"):
            sec = "r"
        elif l.startswith("## HOLD"):
            sec = "h"
            if "—" in l and "remaining names" not in l:
                hold.append(l[l.index("—") + 1:].strip())
        elif l.startswith("## "):
            sec = None
        elif l.startswith("### ") and sec == "h" and not l.startswith("### Not eligible"):
            hold.append(l[4:].strip())
        elif sec == "r" and l.strip() and not l.strip().lower().startswith("none"):
            ready.append(l.strip())
    return ready, hold, txt



def load_idea_records():
    folder = ROOT / "coord/data/ideas"
    out = {}
    if not folder.exists():
        return out
    for p in folder.glob("*.json"):
        try:
            rec = json.loads(p.read_text())
        except (OSError, json.JSONDecodeError):
            continue
        if rec.get("id"):
            out[rec["id"]] = rec
    return out


IDEA_STAGE = {
    "idea": "Researched",
    "building": "Built (PR)",
    "screening": "Screened",
    "ready": "READY",
    "hold": "Screened",
    "submitted": "Submitted",
    "retired": "Retired",
}


def apply_idea_records(items, ready, hold):
    """Overlay coord/data/ideas/*.json onto the view (D1/D6). Missing records are added."""
    recs = load_idea_records()
    if not recs:
        return items, ready, hold
    by = {it["id"]: it for it in items}
    repo = "https://github.com/dmclaughlin-bit/mech-bot"

    def view_stage(rec):
        st = (rec.get("stage") or "").lower()
        if st == "scored":
            dec = (rec.get("decision") or "").upper()
            return "Merged" if dec.startswith("KEEP") else "Retired"
        return IDEA_STAGE.get(st)

    for iid, rec in recs.items():
        st = view_stage(rec)
        ts = rec.get("timestamps") or {}
        prn = rec.get("pr")
        it = by.get(iid)
        if not it:
            scr = rec.get("screens") or []
            sets = []
            for s in scr:
                ss = s.get("seed_set") or ""
                if "2000" in ss and "A" not in sets:
                    sets.append("A")
                if "4000" in ss and "B" not in sets:
                    sets.append("B")
            flags = rec.get("flags") or ([] if not rec.get("flag") else [rec["flag"]] if isinstance(rec.get("flag"), str) else rec.get("flag") or [])
            it = dict(
                id=iid, title=rec.get("title") or iid, kind="build",
                source=rec.get("source"), owner=rec.get("owner"),
                decision=rec.get("decision"), changes=len(flags) or None,
                changes_basis="idea record flags" if flags else "unknown",
                multi=len(flags) > 1, site=None,
                screen=dict(both=set(sets) >= {"A", "B"}, status="both" if set(sets) >= {"A", "B"} else ("none" if not sets else "partial"), sets=sets, when_both=ts.get("screened"), events=[]),
                screened_before_click=False, postmortems=[], first_mention=ts.get("first_mention"),
                sha=rec.get("sha"), champion_sha_note=rec.get("champion_sha_tested_against") or rec.get("champion_sha"),
                research=[], prs=[], pr_opened=ts.get("pr_opened"), primary_pr=prn,
                pr_url=(f"{repo}/pull/{prn}" if prn else None), pr_state=None, head=rec.get("sha"),
                pr_closed=ts.get("pr_closed"), pr_merged=ts.get("pr_merged"),
                contains_champion=None, stage_idx=None, stage=st or "Researched",
                outcome=None, blocker=rec.get("blocker"), from_idea_record=True,
            )
            if rec.get("site_score") is not None:
                it["site"] = dict(submitted_et=ts.get("submitted"), score=rec.get("site_score"),
                                  receipt=rec.get("receipt"), verdict=rec.get("decision"), outcome=None)
            items.append(it)
            by[iid] = it
        else:
            if rec.get("sha"):
                it["sha"] = rec["sha"]
                it["head"] = rec["sha"]
            if rec.get("owner"):
                it["owner"] = rec["owner"]
            if rec.get("blocker") is not None:
                it["blocker"] = rec["blocker"]
            if rec.get("decision"):
                it["record_decision"] = rec["decision"]
            if st:
                it["stage"] = st
            if prn:
                it["primary_pr"] = prn
                it["pr_url"] = it.get("pr_url") or f"{repo}/pull/{prn}"
            it["from_idea_record"] = True
        if (rec.get("stage") or "").lower() == "hold":
            label = f"{iid}: {rec.get('decision') or rec.get('blocker') or 'HOLD'}"
            if not any(str(x).startswith(iid) or iid in str(x) for x in hold):
                hold.append(label)
    # Idea records win over a stale ledger heading (e.g. a ### READY line left after the score lands).
    ready = []
    for iid, rec in recs.items():
        if (rec.get("stage") or "").lower() == "ready":
            prn = rec.get("pr")
            ready.append(f"{iid}" + (f" PR #{prn}" if prn else "") + (f" {rec.get('decision')}" if rec.get("decision") else ""))
    # mode 36 was cut as P27
    if "P27" in recs and "MODE36" in by:
        by["MODE36"]["stage"] = "Retired"
        by["MODE36"]["blocker"] = "built as P27 (PR #137); see that record"
        by["MODE36"]["record_decision"] = "superseded by P27"
    return items, ready, hold


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since", default="2026-11-21 12:00")
    ap.add_argument("--prs-cache")
    ap.add_argument("--now", help="override 'now' as 'YYYY-MM-DD HH:MM' ET (tests)")
    a = ap.parse_args()
    since = datetime.strptime(a.since, "%Y-%m-%d %H:%M").replace(tzinfo=ET)
    now = datetime.strptime(a.now, "%Y-%m-%d %H:%M").replace(tzinfo=ET) if a.now else datetime.now(ET)

    champ = json.load(open(ROOT / "pipeline/data/champion.json"))
    champ_sha = champ["commit"]
    site = list(csv.DictReader(open(ROOT / "coord/data/site_results.csv")))
    screens = list(csv.DictReader(open(ROOT / "coord/data/screens.csv")))
    prs = load_prs(a.prs_cache)
    sev = screen_events(prs, screens)
    ready, hold, ready_txt = parse_ready(ROOT / "coord/data/ready_ledger.md")
    head = sh("git", "rev-parse", "origin/main").strip()

    # ---------------- site tests (all) with change audit
    tests = []
    site.sort(key=lambda r: parse_site_time(r["submitted_et"]))
    running = 1.15  # published kit baseline; later the best KEEP so far
    mismatch = []
    for i, r in enumerate(site):
        t = parse_site_time(r["submitted_et"])
        score = float(r["site_score"]) if r["site_score"] else None
        recorded = float(r["champion_score_at_time"])
        champ_then = running  # the verdict is judged against the real champion at click time
        if abs(recorded - running) > 1e-9:
            mismatch.append(f"{r['build_id']} (recorded {recorded}, champion then {running})")
        if score is not None and r["verdict"] == "KEEP" and score > running:
            running = score
        bools, knobs = diff_switches(r["parent_sha"], r["commit_sha"]) if r["parent_sha"] != r["commit_sha"] else ([], [])
        decl, basis = DECL.get(r["build_id"], (1, "one behavior in the summary"))
        if score is None:
            outcome = "pending"
        elif score > champ_then + 1e-9:
            outcome = "win"
        elif abs(score - champ_then) < 1e-9:
            outcome = "tie"
        else:
            outcome = "loss"
        tests.append(dict(
            build=r["build_id"], submitted_et=fmt(t), sub_dt=t.isoformat(), sha=r["commit_sha"], parent=r["parent_sha"],
            champion_then=champ_then, champion_recorded=recorded, score=score, delta=(round(score - champ_then, 2) if score is not None else None),
            outcome=outcome, receipt=r["receipt_id"], pr_url=r["pr_url"], pr=(int(r["pr_url"].rstrip("/").split("/")[-1]) if r["pr_url"] else None),
            summary=r["change_summary"], family=r["idea_family"], verdict=r["verdict"],
            changes=decl, changes_basis=basis, diff_bool_flags=len(bools), diff_knobs_changed=len(knobs),
            diff_flag_names=sorted(bools)[:12], multi=decl >= 2,
        ))

    # ---------------- items
    items = []
    pr_to_site = {t["pr"]: t for t in tests if t["pr"]}

    def screen_state(shas, nums=(), before=None):
        """status: both_before_click | both_body_only | both_after_click | partial | none (before=None: open item, no click)."""
        shas7 = {x[:7] for x in shas if x}
        rel = []
        got = {"exact": {"A": None, "B": None}, "body": {"A": None, "B": None}, "late": {"A": None, "B": None}}
        for e in sev:
            exact = bool(shas7 & set(e["shas"])) and (e.get("pr") is None or e.get("pr") in nums)
            body = bool(e.get("body")) and e.get("pr") in nums
            if not (exact or body):
                continue
            at = to_et(e["at"]) if e["at"] else None
            late = bool(before and at and at >= before)
            rel.append(dict(src=e["src"], sets=e["sets"], at=fmt(at), url=e["url"], after_click=late, exact_sha=exact))
            bucket = "late" if late else ("exact" if exact else "body")
            for x in e["sets"]:
                if at and (got[bucket][x] is None or at < got[bucket][x]):
                    got[bucket][x] = at
        def both(b):
            return bool(got[b]["A"] and got[b]["B"])
        sets_any = {x for b in got for x in got[b] if got[b][x]}
        if both("exact"):
            status = "both_before_click" if before is not None else "both"
        elif both("body"):
            status = "both_body_only"
        elif before is not None and (both("late") or {x for b in ("exact", "body", "late") for x in got[b] if got[b][x]} >= {"A", "B"}):
            status = "both_after_click"
        elif sets_any:
            status = "partial"
        else:
            status = "none"
        ok = status in ("both_before_click", "both")
        when = fmt(max(got["exact"]["A"], got["exact"]["B"])) if ok else None
        if status == "none" and before is None and both("body"):
            status = "both_body_only"
        return dict(both=ok, status=status, sets=sorted(sets_any), when_both=when, events=rel)

    def pr_fields(nums, primary):
        pr = prs.get(primary) if primary else None
        created = min((to_et(prs[n]["created"]) for n in nums if n in prs), default=None)
        out = dict(prs=[dict(n=n, url=prs[n]["url"], state=prs[n]["state"], head=prs[n]["head"], title=prs[n]["title"]) for n in nums if n in prs],
                   pr_opened=fmt(created))
        if pr:
            out.update(primary_pr=primary, pr_url=pr["url"], pr_state=pr["state"], head=pr["head"],
                       pr_closed=fmt(to_et(pr["closed"])) if pr["closed"] else None,
                       pr_merged=fmt(to_et(pr["merged"])) if pr["merged"] else None,
                       contains_champion=contains(champ_sha, pr["head"]))
        return out

    def result_logged(nums, receipt):
        for n in nums:
            if n in prs:
                for c in prs[n]["comments"]:
                    if receipt and receipt in c["body"]:
                        return fmt(to_et(c["at"])), c["url"]
        return None, None

    def postmortems(nums):
        out = []
        for n in nums:
            if n in prs:
                for c in prs[n]["comments"]:
                    if re.search(r"post-?mortem", c["body"][:400], re.I):
                        out.append(dict(label=f"PR #{n} comment {fmt(to_et(c['at']))[11:16]} ET", url=c["url"]))
        return out

    # site-tested items since the window start
    for t in tests:
        if parse_site_time(t["submitted_et"]) < since:
            continue
        cur = CURATED.get(t["build"], {})
        nums = cur.get("pr", [t["pr"]] if t["pr"] else [])
        primary = t["pr"] if t["pr"] in prs else (nums[0] if nums else None)
        sc = screen_state([t["sha"]], nums, before=parse_site_time(t["submitted_et"]))
        logged, logged_url = result_logged(nums, t["receipt"])
        if not logged and t["build"] == champ["experiment_id"] and champ.get("updated_at"):
            logged, logged_url = fmt(to_et(champ["updated_at"])), None  # champion.json updated_at = site score time
        it = dict(id=t["build"], title=t["summary"][:160], kind="build", source=cur.get("source", "unknown"), owner=cur.get("owner", "unknown"),
                  decision=t["summary"], changes=t["changes"], changes_basis=t["changes_basis"], multi=t["multi"],
                  site=dict(submitted_et=t["submitted_et"], score=t["score"], champion_then=t["champion_then"], delta=t["delta"], outcome=t["outcome"], receipt=t["receipt"], verdict=t["verdict"], result_logged_et=logged, result_url=logged_url),
                  screen=sc, screened_before_click=(sc["status"] == "both_before_click"), postmortems=postmortems(nums) + [dict(label=p.name, url=f"https://github.com/{REPO}/blob/main/coord/data/postmortems/{p.name}") for p in (ROOT / "coord/data/postmortems").glob("*.md") if t["build"] in p.name or (t["build"] == "B117" and "B117" in p.name)],
                  first_mention=fmt(to_et(first_mention(re.escape(t["build"])))) if first_mention(re.escape(t["build"])) else None,
                  sha=t["sha"], champion_sha_note=t["parent"], research=cur.get("research", []))
        it.update(pr_fields(nums, primary))
        items.append(it)

    # other PR-backed and idea items
    for (iid, title, kind, source, owner, changes, basis, nums, regex, extra) in OTHER:
        primary = nums[0] if nums else None
        fm = first_mention(regex)
        sc = screen_state([prs[primary]["head"]] if primary in prs else [], nums)
        it = dict(id=iid, title=title, kind=kind, source=source, owner=owner, decision=title, changes=changes, changes_basis=basis,
                  multi=bool(changes and changes >= 2), site=None, screen=sc, screened_before_click=False,
                  postmortems=postmortems(nums), first_mention=fmt(to_et(fm)) if fm else None, sha=(prs[primary]["head"] if primary in prs else None),
                  research=extra.get("research", []), hold=extra.get("hold"), retired_reason=extra.get("retired_reason"),
                  sim_only=extra.get("sim_only", False), researched=extra.get("researched", False), assigned_only=extra.get("assigned_only", False))
        it.update(pr_fields(nums, primary))
        items.append(it)

    # Watcher SKILLS ideas (parsed) and ranked rules (parsed) and strategy S-items (parsed)
    skills = (ROOT / "coord/data/watcher/SKILLS.md").read_text()
    m = re.search(r"## Ranked build ideas.*?(?=\n## )", skills, re.S)
    for hm in re.finditer(r"^### (\d+)\. (.+)$", m.group(0) if m else "", re.M):
        idx = int(hm.group(1))
        if idx == 1:
            continue  # idea 1 is P25
        items.append(dict(id=f"SKILLS-{idx}", title=hm.group(2).strip(), kind="idea", source="Watcher SKILLS.md (17:25 ET)", owner="unassigned (no record)",
                          decision=hm.group(2).strip(), changes=None, changes_basis="not built", multi=False, site=None,
                          screen=dict(both=False, status="none", sets=[], when_both=None, events=[]), screened_before_click=False, postmortems=[],
                          first_mention="2026-11-21 17:25 ET", sha=None, research=["coord/data/watcher/SKILLS.md"], prs=[], researched=True,
                          pr_opened=None))
    ranked = (ROOT / "coord/data/watcher/RANKED.md").read_text()
    for hm in re.finditer(r"^### (\d+)\. (.+)$", ranked, re.M):
        items.append(dict(id=f"RANKED-{hm.group(1)}", title=hm.group(2).strip(), kind="idea", source="Watcher RANKED.md (15:43 ET)", owner="unassigned (no record)",
                          decision=hm.group(2).strip(), changes=None, changes_basis="not built", multi=False, site=None,
                          screen=dict(both=False, status="none", sets=[], when_both=None, events=[]), screened_before_click=False, postmortems=[],
                          first_mention="2026-11-21 15:43 ET", sha=None, research=["coord/data/watcher/RANKED.md"], prs=[], researched=True, pr_opened=None))
    ideas_md = (ROOT / "coord/data/ideas.md").read_text()
    for l in ideas_md.splitlines():
        sm = re.match(r"^\| (S\d) \| (.+?) \| (.+?) \|$", l)
        if sm:
            status = sm.group(3)
            sid = sm.group(1)
            mapped = {"S2": "P-D-002", "S6": "P-B-002"}.get(sid)
            if mapped:
                continue  # already tracked through its build
            items.append(dict(id=sid, title=sm.group(2).strip(), kind="idea", source="Grok strategy report (research/strategy-report-2026-11-21.md)", owner="unassigned (no record)",
                              decision=sm.group(2).strip(), changes=None, changes_basis="not built", multi=False, site=None,
                              screen=dict(both=False, status="none", sets=[], when_both=None, events=[]), screened_before_click=False, postmortems=[],
                              first_mention="2026-11-21 12:30 ET (report)", sha=None, research=["coord/research/strategy-report-2026-11-21.md"], prs=[], researched=True,
                              pr_opened=None, retired_reason=("dead / dropped per ideas.md" if "dead" in status else None), ideas_status=status[:140]))

    # ideas_queue.md (Grok's ranked queue): attach rank to existing rows, add rows for new ones
    qpath = ROOT / "coord/data/ideas_queue.md"
    queue = []
    if qpath.exists():
        for hm in re.finditer(r"^## (\d+)\. (.+?) — (High|Medium(?: / Low)?|Low)(?: \((.*?)\))?\s*$", qpath.read_text(), re.M):
            queue.append(dict(pos=int(hm.group(1)), title=hm.group(2).strip(), rank=hm.group(3) + (f" ({hm.group(4)})" if hm.group(4) else "")))
    keymap = [("P25", "P25"), ("Midring patrol", "SKILLS-2"), ("Boost on healthy", "SKILLS-3"), ("settle in the midring", "SKILLS-5"), ("Orbit and fade", "SKILLS-4")]
    byid = {it["id"]: it for it in items}
    for qi in queue:
        tgt = next((byid[i] for k, i in keymap if k.lower() in qi["title"].lower() and i in byid), None)
        if tgt:
            tgt["queue_rank"], tgt["queue_pos"] = qi["rank"], qi["pos"]
            continue
        if "Mode 36" in qi["title"]:
            nid, src, own, res = "MODE36", "Movement track (PR #129) + Sim Tester screen", "unassigned (needs a one-flag site SHA)", ["coord/data/research/movement-iter3.md (on branch build-121-movement-iter3)"]
        elif "HEAL_COVER=1" in qi["title"]:
            nid, src, own, res = "HEAL_COVER1", "P24 follow-up (level 1 only)", "unassigned (no PR)", ["coord/data/research/heal-positioning.md"]
        elif "P-D-010" in qi["title"]:
            if "P-D-010" in byid:
                byid["P-D-010"]["queue_rank"], byid["P-D-010"]["queue_pos"] = qi["rank"], qi["pos"]
            continue
        else:
            continue
        items.append(dict(id=nid, title=qi["title"], kind="build" if nid == "MODE36" else "idea", source=src, owner=own, decision=qi["title"], changes=1, changes_basis="queue entry: one flag", multi=False, site=None,
                          screen=dict(both=False, status="none", sets=[], when_both=None, events=[]), screened_before_click=False, postmortems=[], first_mention="2026-11-21 17:54 ET (ideas_queue.md)",
                          sha=None, research=res, prs=[],
                          researched=True, pr_opened=None, queue_rank=qi["rank"], queue_pos=qi["pos"], blocker="needs a one-flag site SHA and a both-set screen of that exact SHA"))

    # ---------------- stage + outcome
    ready_ids = " ".join(ready)
    champ_id = champ["experiment_id"]
    for it in items:
        s = it.get("site")
        st = 0
        reasons = []
        if it.get("first_mention") or it["kind"] == "idea":
            st = 0
        if it.get("researched") or it.get("research"):
            st = max(st, 1)
        if it.get("owner") and not str(it["owner"]).startswith("unassigned") and it["owner"] != "unknown":
            st = max(st, 2)
        if it.get("primary_pr") or it.get("prs"):
            st = max(st, 3)
        if it["screen"]["both"]:
            st = max(st, 4)
        if it["id"] in ready_ids:
            st = 5
        if s:
            st = 6 if s["score"] is None else 7
        terminal = None
        if it.get("pr_state") == "merged":
            terminal = "Merged"
        elif s and s["score"] is not None and s["outcome"] in ("loss", "tie"):
            terminal = "Retired"
        elif it.get("pr_state") == "closed" or it.get("retired_reason"):
            terminal = "Retired"
        it["stage_idx"] = st
        it["stage"] = terminal or STAGES[st]
        if s:
            it["outcome"] = s["outcome"]
        elif terminal == "Retired":
            it["outcome"] = "retired" if not it.get("pr_state") == "closed" or it.get("retired_reason") else "closed"
        else:
            it["outcome"] = "open"
        # blocker for anything not yet submitted and still alive
        if it["stage"] not in ("Merged", "Retired") and not s and it["kind"] in ("build", "track"):
            b = []
            if it.get("sim_only"):
                b.append("sim-only track, not a site candidate")
            if it.get("hold"):
                b.append(it["hold"])
            if it.get("head") and it.get("contains_champion") is False:
                b.append("head does not contain the champion " + champ_sha[:7] + " (stale)")
            if not it["screen"]["both"]:
                b.append("no complete screen on both seed sets for the current head")
            if it["stage"] == "Screened":
                b = ["both-set screen rows recorded; the READY/HOLD verdict (fire count, hazards, timing, veto) is decided by the routine in ready_ledger.md, not computed here"]
            it["blocker"] = it.get("blocker") or "; ".join(b) or "none found"
        elif it.get("assigned_only"):
            it["blocker"] = "owner has not acknowledged"
        else:
            it["blocker"] = None

    items, ready, hold = apply_idea_records(items, ready, hold)

    # ---------------- header
    board = {s: 0 for s in STAGES}
    board_detail = {"Retired_loss": 0, "Retired_tie": 0, "Retired_unsubmitted": 0}
    for it in items:
        key = it["stage"]
        if key == "Scored":
            key = "Submitted" if (it.get("site") and it["site"]["score"] is None) else "Scored"
        board[key] += 1
        if key == "Retired":
            if it.get("site") and it["site"]["outcome"] == "loss":
                board_detail["Retired_loss"] += 1
            elif it.get("site") and it["site"]["outcome"] == "tie":
                board_detail["Retired_tie"] += 1
            else:
                board_detail["Retired_unsubmitted"] += 1
    pending = [t["build"] for t in tests if t["outcome"] == "pending"]
    sub_times = [parse_site_time(t["submitted_et"]) for t in tests]
    rolling = [x for x in sub_times if now - timedelta(minutes=60) < x <= now]
    clock_hour = [x for x in sub_times if x.replace(minute=0, second=0, microsecond=0) == now.replace(minute=0, second=0, microsecond=0)]
    since_noon = [t for t in tests if parse_site_time(t["submitted_et"]) >= since]
    scored = [t for t in since_noon if t["score"] is not None]
    wins = [t for t in scored if t["outcome"] == "win"]
    cfg = json.load(open(ROOT / "pipeline/config.json"))
    champ_since = parse_site_time(next(t for t in tests if t["build"] == champ_id)["submitted_et"]) if any(t["build"] == champ_id for t in tests) else since
    vs_cur = [t for t in tests if parse_site_time(t["submitted_et"]) > champ_since and t["score"] is not None]
    header = dict(
        champion=dict(build=champ_id, score=champ["score"], sha=champ_sha, receipt=champ.get("submission_id"), scored_at=champ.get("updated_at")),
        pending=pending,
        slots=dict(limit=cfg["max_submissions_per_hour"], used_rolling_60=len(rolling), used_clock_hour=len(clock_hour),
                   last_submit=fmt(max(sub_times)) if sub_times else None),
        ready_count=len(ready), ready_items=ready, hold_items=hold, reserve_target="2 fully screened + 1 researched (WORKFLOW.md, Doug 5:41 PM ET)",
        since=fmt(since), tests_since=len(since_noon), wins_since=len(wins), scored_since=len(scored),
        wins_vs_champion_at_time=[t["build"] for t in wins],
        tests_vs_current_champion=len(vs_cur), wins_vs_current_champion=sum(1 for t in vs_cur if t["outcome"] == "win"),
        pre_click_screen_complete=sum(1 for it in items if it.get("site") and it["screened_before_click"]), site_items_since=sum(1 for it in items if it.get("site")),
    )

    # ---------------- change audit
    multi_all = [t for t in tests if t["multi"]]
    def rate(lst):
        sc = [t for t in lst if t["score"] is not None and t["build"] != "S3"]
        return dict(n=len(sc), wins=sum(1 for t in sc if t["outcome"] == "win"))
    single = [t for t in tests if not t["multi"] and t["build"] != "S3"]
    audit = dict(
        multi_change_builds=[dict(build=t["build"], changes=t["changes"], score=t["score"], champion_then=t["champion_then"], outcome=t["outcome"], basis=t["changes_basis"], submitted_et=t["submitted_et"]) for t in multi_all],
        all_tests=len(tests), single=rate(single), multi=rate(multi_all),
        since_noon_multi=[t["build"] for t in since_noon if t["multi"]],
        since_noon_single=rate([t for t in since_noon if not t["multi"]]), since_noon_multi_rate=rate([t for t in since_noon if t["multi"]]),
        mech_vs_declared_mismatch=[t["build"] for t in tests if t["changes"] != max(1, t["diff_bool_flags"] + t["diff_knobs_changed"]) and t["changes"] >= 2],
        note="Declared count is from the build's own text (see changes_basis). diff_bool_flags/diff_knobs_changed are a mechanical cross-check (new boolean consts and changed constants in *.ts); they miss object-property settings such as B30's aggression/retreatHp.",
    )

    # ---------------- truth checks (derived)
    checks = []
    checks.append(dict(id="champion_at_time", ok=not mismatch, text="site_results.csv champion_score_at_time disagrees with the champion actually standing at click time for: " + (", ".join(mismatch) or "none")))
    hist = champ.get("history", [])
    last_hist = hist[-1]["experiment_id"] if hist else None
    checks.append(dict(id="champion_history", ok=(last_hist == champ_id), text=f"pipeline/data/champion.json top says {champ_id} but its history ends at {last_hist}"))
    exps = sum(1 for _ in open(ROOT / "pipeline/data/experiments.jsonl"))
    checks.append(dict(id="q_py_store", ok=(exps >= len(tests) - 2), text=f"pipeline/data/experiments.jsonl (what q.py eligible reads) has {exps} records; coord/data/site_results.csv has {len(tests)}"))
    have_screen = 0
    miss = []
    for it in items:
        if it.get("site"):
            sha7 = it["sha"][:7]
            rows = [r for r in screens if r["commit_sha"].startswith(sha7)]
            sets = {("A" if "2000" in r["seed_set"] else "B" if "4000" in r["seed_set"] else "") for r in rows} - {""}
            if sets >= {"A", "B"}:
                have_screen += 1
            else:
                miss.append(it["id"])
    n_site = sum(1 for it in items if it.get("site"))
    checks.append(dict(id="screens_csv", ok=(not miss), text=f"{n_site - have_screen} of {n_site} site-tested builds since noon have no complete (both-set) screens.csv rows for their exact SHA: {', '.join(miss)}"))
    fams = {t["family"] for t in tests}
    fam_missing = sorted(f for f in fams if f and f not in ideas_md)
    checks.append(dict(id="ideas_md_families", ok=not fam_missing, text=f"site_results families not named in ideas.md: {', '.join(fam_missing) or 'none'}"))
    status_txt = (ROOT / "coord/STATUS.md").read_text()
    sm_ = re.search(r"Updated by Grok, (.+?)\.", status_txt)
    checks.append(dict(id="status_stale", ok=False if sm_ and "3:44 PM" in sm_.group(1) else True, text=f"coord/STATUS.md says 'Updated {sm_.group(1) if sm_ else '?'}'; the newest site result is {max(sub_times).strftime('%-I:%M %p')} ET"))
    logtxt = (ROOT / "coord/log.md").read_text()
    utc_lines = [l for l in logtxt.splitlines() if re.search(r"Sat (Nov 21 )?5:59 PM ET Grok: P-B-001", l)]
    checks.append(dict(id="log_utc_as_et", ok=not utc_lines, text="coord/log.md lines written at 17:34-18:43 UTC are labelled 'ET' (for example 'Sat 5:59 PM ET: P-B-001 4.06' was committed 12:59 PM ET)"))
    qx = (ROOT / "coord/data/ideas_queue.md").exists()
    checks.append(dict(id="ideas_queue", ok=qx, text=("coord/data/ideas_queue.md exists (landed 5:54 PM ET) and ranks 8 ideas; it is a hand-written file, not generated from per-idea records" if qx else "coord/data/ideas_queue.md does not exist on origin/main")))
    unrecorded = [i for i in ("B122", "B123", "B124", "P23", "P25") if i not in logtxt and i not in (ROOT / "coord/next-doug.md").read_text()]
    checks.append(dict(id="assignment_records", ok=not unrecorded, text=f"no assignment/owner record in coord/log.md or next-doug.md for: {', '.join(unrecorded)}"))
    stale_led = "P25" in ready_txt and "no PR" in ready_txt and 136 in prs
    checks.append(dict(id="ledger_vs_pr", ok=not stale_led, text=("ready_ledger.md still says P25 has no PR; PR #136 exists" if stale_led else "ready_ledger.md matches the open PRs (P25 / PR #136 recorded)")))

    out = dict(generated_at_et=fmt(now), origin_main=head, since=fmt(since), stages=STAGES, header=header, board=board, board_detail=board_detail,
               items=items, site_tests=tests, change_audit=audit, truth_checks=checks,
               sources=["coord/data/site_results.csv", "coord/data/screens.csv", "coord/data/ready_ledger.md", "coord/data/ideas/", "coord/data/ideas.md", "coord/data/watcher/SKILLS.md",
                        "coord/data/watcher/RANKED.md", "coord/STATUS.md", "coord/log.md", "pipeline/data/champion.json", f"gh pulls + comments ({REPO})"])
    OUT.write_text(json.dumps(out, indent=1, default=str))
    print(f"wrote {OUT.relative_to(ROOT)}: {len(items)} items, {len(tests)} site tests, champion {champ_id} {champ['score']}, board {board}")


if __name__ == "__main__":
    main()
