#!/usr/bin/env python3
"""Single query/update CLI for Grok (the sole coordinator).

  python3 pipeline/q.py brief                 decision brief for this 15-min tick
  python3 pipeline/q.py tested <keyword>      has this idea been tried? (repeat detection)
  python3 pipeline/q.py task HYP-008          implementation_task text for `claude -p`
  python3 pipeline/q.py add-exp --hyp HYP-008 --commit <sha> --change "..." [--branch b --pr 14]
  python3 pipeline/q.py set-check EXP-0010 pass --p99 0.9
  bash    pipeline/codex_review.sh <base> <cand> HYP-008 EXP-0010   (stores review)
  python3 pipeline/q.py eligible EXP-0010     kit PASS + no blocking review + free slot + not a repeat
  python3 pipeline/q.py eligible --pr 137      single-change, contains champion, both-set screen, no pending score
  python3 pipeline/q.py eligible --idea P27    same checks, resolved from coord/data/ideas/<id>.json
  python3 pipeline/q.py mark-submitted EXP-0010 --submission-id BB-XXXX
  python3 pipeline/q.py record-score EXP-0010 --score 2.51 --lesson "..." --next "..."
  python3 pipeline/q.py promote EXP-0010      updates champion.json only if score beats champion
  python3 pipeline/q.py slots | ingest-research | ingest-watch | add-hyp FILE | set-hyp | validate
All writes go through a file lock; data lives in pipeline/data/*.jsonl (PIPELINE_DATA_DIR overrides).
"""
import argparse, datetime as dt, json, os, re, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lib  # noqa: E402

EXP, HYP, EVI, REV, TSK, CHAMP = ("experiments.jsonl", "hypotheses.jsonl", "evidence.jsonl",
                                   "reviews.jsonl", "tasks.jsonl", "champion.json")
SCORED = {"keep", "adopted", "loss", "tie", "inconclusive", "baseline"}


def now():
    s = os.environ.get("PIPELINE_NOW")
    return lib.parse_ts(s) if s else dt.datetime.now(lib.ET)


def die(msg, code=1):
    print(msg, file=sys.stderr)
    sys.exit(code)


def get(rows, rid):
    for r in rows:
        if r.get("id") == rid:
            return r
    die(f"no record {rid}")


def champion():
    c = lib.read_json(CHAMP)
    if not c:
        die("champion.json missing")
    return c


# ---------------- ranking / repeats ----------------
def priority(h):
    """Diego's E3 formula (ordering only): impact x evidence_confidence x recurrence /
    (effort + test_burden + regression_risk). Returns (score, factors)."""
    f = {"impact": float(h.get("expected_gain", 0)), "conf": float(h.get("evidence_strength", 0)),
         "recur": float(h.get("recurrence", 0.5)), "effort": int(h.get("effort", 3)),
         "test": int(h.get("test_burden", 2)), "risk": float(h.get("regression_risk", 0))}
    den = f["effort"] + f["test"] + f["risk"]
    return round(f["impact"] * f["conf"] * f["recur"] / den, 4) if den else 0.0, f


def _words(s):
    return {x for x in re.findall(r"[a-z0-9]+", (s or "").lower()) if len(x) > 2}


def similar_tested(h, hyps, exps):
    """Tested hypotheses sharing keywords with h (cheap repeat warning)."""
    kw = set(map(str.lower, h.get("keywords", [])))
    out = []
    for o in hyps:
        if o["id"] == h["id"] or o["status"] == "untested":
            continue
        if kw & set(map(str.lower, o.get("keywords", []))):
            out.append(f"{o['id']}({o['status']})")
    return out


def find_tested(keyword, hyps, exps):
    k = keyword.lower()
    hits_h = [h for h in hyps if k in " ".join([h["id"], h["title"], h["change"], " ".join(h.get("keywords", []))]).lower()]
    hids = {h["id"] for h in hits_h}
    hits_e = [e for e in exps if e.get("hypothesis_id") in hids
              or k in " ".join([e["id"], e.get("change", ""), e.get("label") or "", e.get("candidate_commit", "")]).lower()]
    return hits_h, hits_e


# ---------------- slots / eligibility ----------------
def slots_used(exps, cfg, at=None):
    at = at or now()
    win = dt.timedelta(minutes=cfg["slot_window_minutes"])
    ts = sorted(t for t in (lib.parse_ts(e.get("submission", {}).get("timestamp")) for e in exps) if t and at - win < t <= at)
    nxt = (ts[0] + win) if len(ts) >= cfg["max_submissions_per_hour"] else at
    return len(ts), nxt


def eligibility(e, exps, cfg):
    reasons = []
    el = cfg["eligibility"]
    if el["require_kit_check_pass"] and e["kit_check"]["status"] != "pass":
        reasons.append(f"kit check is '{e['kit_check']['status']}' (needs pass)")
    cr = e["codex_review"]
    if el["block_on_codex_verdict_block"] and cr.get("verdict") == "block":
        reasons.append(f"codex review {cr.get('review_id')} verdict=block (critical finding)")
    if cr["status"] in ("unavailable", "timeout", "error", "not_run"):
        if cfg.get("codex_required") or not el.get("allow_codex_unavailable", True):
            reasons.append(f"codex review status '{cr['status']}' and codex_required=true")
    if e["submission"].get("timestamp"):
        reasons.append("already submitted")
    for o in exps:
        if o["id"] != e["id"] and o.get("score") is not None and o["candidate_commit"][:7] == e["candidate_commit"][:7]:
            reasons.append(f"commit {e['candidate_commit'][:7]} already scored in {o['id']} (identical code keeps its first score under the same scorer version)")
    used, nxt = slots_used(exps, cfg)
    if used >= cfg["max_submissions_per_hour"]:
        reasons.append(f"no free slot: {used}/{cfg['max_submissions_per_hour']} used; next free {nxt.strftime('%-I:%M %p')} ET")
    return reasons



def _idea_records():
    folder = lib.REPO / "coord/data/ideas"
    out = []
    if not folder.exists():
        return out
    for p in sorted(folder.glob("*.json")):
        try:
            rec = json.loads(p.read_text())
        except (OSError, json.JSONDecodeError):
            continue
        if rec.get("id"):
            out.append(rec)
    return out


def _idea_by_pr(n):
    recs = [r for r in _idea_records() if r.get("pr") == n]
    if not recs:
        return None
    live = [r for r in recs if (r.get("stage") or "").lower() not in ("retired", "scored")]
    return (live or recs)[-1]


def _idea_by_id(i):
    for r in _idea_records():
        if r.get("id") == i:
            return r
    return None


def _idea_by_sha(sha):
    if not sha:
        return None
    for r in _idea_records():
        if r.get("sha") and (r["sha"] == sha or r["sha"].startswith(sha[:12]) or sha.startswith(r["sha"][:12])):
            return r
        for s in r.get("screens") or []:
            if s.get("sha") and (s["sha"] == sha or s["sha"].startswith(sha[:12])):
                return r
    return None


def _verdict_token(row):
    """First word of the verdict, uppercased (e.g. LOSS from 'LOSS builders-4 (3.49 < 3.75)')."""
    v = (row.get("verdict") or "").strip().upper()
    if not v:
        return ""
    return v.replace(";", " ").replace(",", " ").split()[0]


def _row_is_rejected(row):
    """Rejected receipts (e.g. BB-FB8CB5AE, P34 archive over 20 MB) are terminal, never pending."""
    return _verdict_token(row) == "REJECTED"


def _row_is_queued(row):
    """A genuinely queued unofficial receipt: no site_score, verdict pending/queued, not rejected."""
    if _row_is_rejected(row):
        return False
    sc = (row.get("site_score") or "").strip()
    if sc:
        return False
    tok = _verdict_token(row)
    return tok in ("PENDING", "QUEUED")


def _current_champion_sha():
    """Champion bot SHA from champion.json (current official bar), with a CSV fallback.

    Official gains are judged only within the same scorer version. champion.json.score is
    the highest confirmed builders-4 score (P48 3.75, BB-5727119F). Do not select the last
    KEEP row: later promotions were recorded as WIN (P29, P34, P48).
    """
    c = lib.read_json(CHAMP) or {}
    if c.get("commit"):
        return c["commit"]
    path = lib.REPO / "coord/data/site_results.csv"
    champ = None
    if path.exists():
        import csv
        for r in csv.DictReader(path.open()):
            tok = _verdict_token(r)
            if tok in ("KEEP", "WIN", "BASELINE") and r.get("commit_sha"):
                champ = r["commit_sha"]
    return champ


def _pr_body(n):
    if not n:
        return ""
    r = subprocess.run(["gh", "pr", "view", str(n), "--json", "body,title,headRefOid"],
                       cwd=lib.REPO, capture_output=True, text=True)
    if r.returncode != 0 or not r.stdout.strip():
        return ""
    try:
        return json.loads(r.stdout)
    except json.JSONDecodeError:
        return ""


def _template_field(body, label):
    if not body:
        return None
    m = re.search(r"\*\*" + re.escape(label) + r"\*\*\s*:?[ 	]*(.*)", body, re.I)
    if not m:
        return None
    v = m.group(1).strip()
    if not v or v.startswith("**") or v in ("_", "__", "n/a", "N/A"):
        return None
    return v


def _flags_behaviors(rec, pr_info=None):
    rec = rec or {}
    flags = list(rec.get("flags") or [])
    if rec.get("flag") and isinstance(rec["flag"], str) and rec["flag"] not in flags:
        flags = [rec["flag"]] + flags
    behaviors = list(rec.get("behaviors") or [])
    body = ""
    title = ""
    if isinstance(pr_info, dict):
        body = pr_info.get("body") or ""
        title = pr_info.get("title") or ""
    elif isinstance(pr_info, str):
        body = pr_info
    fl = _template_field(body, "The single flag") or _template_field(body, "The single flag:")
    beh = _template_field(body, "The ONE behavior changed")
    if fl and fl not in flags:
        # a filled template is a source; do not append passing mentions from the body
        if not flags:
            flags = [fl.split()[0].strip("`'\"")]
    if beh and not behaviors:
        behaviors = [beh]
    return flags, behaviors


def site_eligibility_reasons(sha, rec=None, pr_info=None):
    """Single-change, contains-champion, both-set screen on this SHA, no pending score (D3, Doug 6:46 PM ET)."""
    reasons = []
    rec = rec or {}
    flags, behaviors = _flags_behaviors(rec, pr_info)
    waiver = rec.get("doug_waiver") in (True, "true", "yes", "YES")
    if not waiver and (len(flags) > 1 or len(behaviors) > 1):
        reasons.append(
            f"single-change: idea record or PR lists {len(flags)} flag(s) {flags or '[]'} "
            f"and {len(behaviors)} behavior(s); needs doug_waiver"
        )
    champ = _current_champion_sha()
    if not sha:
        reasons.append("no SHA to check")
    else:
        if champ:
            r = subprocess.run(["git", "merge-base", "--is-ancestor", champ, sha],
                               cwd=lib.REPO, capture_output=True, text=True)
            if r.returncode != 0:
                reasons.append(f"head does not contain champion {champ[:12]} (git merge-base --is-ancestor)")
        path = lib.REPO / "coord/data/screens.csv"
        sets = set()
        if path.exists():
            import csv
            for row in csv.DictReader(path.open()):
                cs = row.get("commit_sha") or ""
                if cs == sha or (len(sha) >= 7 and cs.startswith(sha[:40])):
                    ss = row.get("seed_set") or ""
                    if "2000" in ss and "3000" in ss:
                        sets.add("A")
                    if "4000" in ss and "5000" in ss:
                        sets.add("B")
        if sets < {"A", "B"}:
            reasons.append(f"no complete both-set screen in screens.csv for exact SHA {sha[:12]}")
    site = lib.REPO / "coord/data/site_results.csv"
    if site.exists():
        import csv
        scored_tok = {"KEEP", "CLOSE", "LOSS", "TIE", "WIN", "BASELINE", "SCORED"}
        for row in csv.DictReader(site.open()):
            tok = _verdict_token(row)
            sc = (row.get("site_score") or "").strip()
            if _row_is_queued(row):
                reasons.append(f"pending official score: {row.get('build_id')} {row.get('receipt_id') or ''}".strip())
                break
            if sha and (row.get("commit_sha") or "").startswith(sha[:12]) and tok in scored_tok and sc:
                reasons.append(f"already submitted and scored as {row.get('build_id')} ({row.get('verdict')} {sc}, {row.get('receipt_id')})")
    return reasons


# ---------------- commands ----------------
def cmd_brief(a):
    cfg = lib.config()
    c = champion()
    exps, hyps, evid = lib.read_jsonl(EXP), lib.read_jsonl(HYP), lib.read_jsonl(EVI)
    used, nxt = slots_used(exps, cfg)
    P = print
    P(f"# Decision brief · {now().strftime('%a %-I:%M %p')} ET")
    P(f"GOAL: practice score >= {c.get('target_score', cfg['target_score'])}. Champion {c['experiment_id']} "
      f"commit {c['commit'][:7]} score {c['score']} ({c.get('submission_id')}); gap {round(cfg['target_score'] - c['score'], 2)}.")
    P("Official data: aggregate practice score only (NO PER-MATCH OFFICIAL DATA); failure classes below are suspicions with confidence.")
    P(f"Slots: {used}/{cfg['max_submissions_per_hour']} used in the last {cfg['slot_window_minutes']} min; "
      f"next free: {'now' if used < cfg['max_submissions_per_hour'] else nxt.strftime('%-I:%M %p') + ' ET'}.")
    pend = [e for e in exps if e["outcome"] in ("candidate", "submitted")]
    if pend:
        P("\n## In flight")
        for e in pend:
            P(f"- {e['id']} {e['hypothesis_id']} {e['candidate_commit'][:7]} {e['outcome']} · kit {e['kit_check']['status']} · "
              f"codex {e['codex_review']['status']}/{e['codex_review'].get('verdict', 'none')} · sub {e['submission'].get('id') or '—'}")
    P(f"\n## Last {a.n} experiments")
    for e in [x for x in exps if x["outcome"] in SCORED][-a.n:]:
        d = e.get("delta_vs_baseline")
        P(f"- {e['id']} {e.get('label') or ''} {e['candidate_commit'][:7]} score {e.get('score')} "
          f"(Δ {'%+.2f' % d if d is not None else '—'}) {e['outcome'].upper()} · {(e.get('lesson') or '')[:110]}")
    P("\n## Adopted / failed hypotheses")
    for h in hyps:
        if h["status"] in ("adopted", "failed", "inconclusive", "supported"):
            P(f"- {h['id']} [{h['status']}] {h['title']}")
    P("\n## Untested, ranked: priority = impact x conf x recur / (effort + test + risk)  (subjective factors shown)")
    un = sorted([h for h in hyps if h["status"] == "untested"], key=lambda h: -priority(h)[0])
    for i, h in enumerate(un[: a.top], 1):
        sc, f = priority(h)
        sim = similar_tested(h, hyps, exps)
        fc = ",".join(x["class"] for x in h.get("failure_classes", []))
        P(f"{i}. {h['id']} p={sc:.3f} · {h['title']} [{h.get('priority_tag') or ''}] · impact {f['impact']} conf {f['conf']} "
          f"recur {f['recur']} / effort {f['effort']} test {f['test']} risk {f['risk']} · ev×{len(h.get('evidence_ids', []))} nov {h['novelty']}"
          + (f" · targets {fc}" if fc else "")
          + (f" · IN PROGRESS on {h['in_progress_branch']}" if h.get("in_progress_branch") else "")
          + (f" · similar tested: {', '.join(sim)}" if sim else ""))
    P("\n## Evidence (watcher = top-16 exhibition FFA, not practice)")
    by = {r["id"]: r for r in evid}
    key = ["laser_share", "laser_t", "cubes_max", "zone_ratio", "outside_pct", "nearest", "boost_pct", "gun_gt100_pct", "tgt_hp50_pct", "life_s"]
    shown = 0
    for k in key:
        r = by.get(f"EV-W-D-showdown-{k}")
        if not r:
            continue
        g = r["metrics"]["by_group"]
        f = lambda grp: f"{g[grp]['mean']:.1f}(n{g[grp]['n']})" if grp in g else "—"
        P(f"- {r['id']}: {r['metrics']['description']}: winner {f('winner')} top4 {f('top4')} bottom {f('bottom')}")
        shown += 1
    if not shown:
        P("- no watcher evidence ingested yet (run update.sh then q.py ingest-watch)")
    else:
        ts = max(r["timestamp"] for r in evid if r["id"].startswith("EV-W-D"))
        nm = len(by.get("EV-W-D-showdown-life_s", {}).get("match_ids", []))
        P(f"  ({nm} complete showdown matches; ingested {ts})")
    rc = sorted([r for r in evid if r["evidence_class"] == "research_claim"], key=lambda r: r.get("ingested_at") or r.get("timestamp", ""))[-5:]
    if rc:
        P("Latest research claims (unproven):")
        for r in rc:
            P(f"- {r['id']} [{r['topic']}, conf {r['confidence']}{', GUESS' if r.get('is_guess') else ''}] {r['claim'][:140]}")
    nv = sum(1 for r in evid if r["evidence_class"] == "validated")
    P(f"Validated facts (practice score deltas): {nv}")
    P("\n## Contradictions")
    con = []
    for h in hyps:
        if h["status"] == "failed":
            sup = [x for x in h.get("evidence_ids", []) if by.get(x, {}).get("evidence_class") in ("observed", "derived", "research_claim")]
            if sup:
                con.append(f"- {h['id']} FAILED in practice though supported by {', '.join(sup[:3])}: winners' habit did not transfer as implemented")
        if h.get("contradicting_evidence_ids"):
            con.append(f"- {h['id']} has contradicting evidence: {', '.join(h['contradicting_evidence_ids'])}")
    for r in evid:
        if r.get("contradicts"):
            con.append(f"- {r['id']} contradicts {', '.join(r['contradicts'])}")
    P("\n".join(con) if con else "- none recorded")


def cmd_tested(a):
    hits_h, hits_e = find_tested(a.keyword, lib.read_jsonl(HYP), lib.read_jsonl(EXP))
    if not hits_h and not hits_e:
        print(f"NOT TESTED: nothing matches '{a.keyword}'")
        return
    for h in hits_h:
        print(f"{h['id']} [{h['status']}] {h['title']} · experiments {', '.join(h.get('related_experiments', [])) or '—'}")
    for e in hits_e:
        print(f"  {e['id']} {e['candidate_commit'][:7]} score {e.get('score')} Δ {e.get('delta_vs_baseline')} {e['outcome']} · {e.get('lesson') or ''}"[:220])
    if any(h["status"] != "untested" for h in hits_h):
        print("REPEAT WARNING: re-testing needs a new reason, changed implementation, or changed conditions (add-exp --repeat-reason).")


def cmd_add_hyp(a):
    src = sys.stdin.read() if a.file == "-" else Path(a.file).read_text()
    h = json.loads(src)
    with lib.locked():
        hyps = lib.read_jsonl(HYP)
        h.setdefault("id", lib.next_id(hyps, "HYP-", 3))
        h.setdefault("status", "untested")
        h.setdefault("created_at", lib.now_et())
        for k in ("evidence_ids", "keywords"):
            h.setdefault(k, [])
        lib.require_valid(h, "strategy_hypothesis")
        if any(x["id"] == h["id"] for x in hyps):
            die(f"{h['id']} exists")
        hyps.append(h)
        lib.write_jsonl(HYP, hyps)
    print(h["id"])


def cmd_set_hyp(a):
    with lib.locked():
        hyps = lib.read_jsonl(HYP)
        h = get(hyps, a.hyp)
        if a.status:
            h["status"] = a.status
        if a.note:
            h["notes"] = a.note
        h["updated_at"] = lib.now_et()
        lib.require_valid(h, "strategy_hypothesis")
        lib.write_jsonl(HYP, hyps)
    print(f"{a.hyp} -> {h['status']}")


def cmd_add_exp(a):
    with lib.locked():
        exps, hyps, c = lib.read_jsonl(EXP), lib.read_jsonl(HYP), champion()
        h = get(hyps, a.hyp)
        prior = [e for e in exps if e.get("hypothesis_id") == h["id"]]
        if (h["status"] != "untested" or prior) and not a.repeat_reason:
            die(f"REPEAT: {h['id']} is '{h['status']}' with experiments {[e['id'] for e in prior]}. "
                "Pass --repeat-reason (new reason, changed implementation, or changed conditions).", 2)
        for e in exps:
            if e["candidate_commit"][:7] == a.commit[:7] and e.get("score") is not None:
                die(f"commit {a.commit[:7]} already scored in {e['id']}; identical code keeps its first score under the same scorer version, don't resubmit.", 2)
        e = {
            "id": lib.next_id(exps, "EXP-"), "label": a.label, "hypothesis_id": h["id"],
            "change": a.change or h["change"], "evidence_ids": a.evidence or h.get("evidence_ids", []),
            "related_experiments": sorted(set([x["id"] for x in prior] + h.get("related_experiments", []))),
            "repeat_reason": a.repeat_reason, "baseline_commit": c["commit"], "baseline_score": c["score"],
            "candidate_commit": a.commit, "branch": a.branch, "pr": a.pr, "agent": a.agent,
            "kit_check": {"status": "pending"}, "codex_review": {"status": "not_run", "verdict": "none", "review_id": None},
            "submission": {"id": None, "timestamp": None}, "score": None, "delta_vs_baseline": None, "metrics": {},
            "evaluation": {"type": "official_site_score", "n_matches": 96, "deterministic": False, "comparable": True,
                           "note": "builders-4 official practice: 96 fresh private seeds; identical code keeps its first builders-4 score. Compare only within the same scorer version.", "per_match_data": "none"},
            "outcome": "candidate", "lesson": None, "next_action": None, "failure_classes": [], "backfilled": False,
            "synthetic": bool(a.synthetic), "created_at": lib.now_et(), "updated_at": None,
        }
        lib.require_valid(e, "experiment_result")
        exps.append(e)
        h["related_experiments"] = sorted(set(h.get("related_experiments", []) + [e["id"]]))
        lib.write_jsonl(EXP, exps)
        lib.write_jsonl(HYP, hyps)
    print(e["id"])


def _update_exp(eid, fn):
    with lib.locked():
        exps = lib.read_jsonl(EXP)
        e = get(exps, eid)
        fn(e, exps)
        e["updated_at"] = lib.now_et()
        lib.require_valid(e, "experiment_result")
        lib.write_jsonl(EXP, exps)
    return e


def cmd_set_check(a):
    def f(e, _):
        e["kit_check"] = {"status": a.status, "p99_ms": a.p99, "note": a.note}
        if a.status == "fail":
            e["outcome"] = "blocked"
    e = _update_exp(a.exp, f)
    print(f"{e['id']} kit_check={a.status}")


def store_review(rev, eid=None):
    """Validate and store a codex_review record; link it to the experiment."""
    with lib.locked():
        revs = lib.read_jsonl(REV)
        rev["id"] = lib.next_id(revs, "REV-")
        if eid:
            rev["experiment_id"] = eid
        lib.require_valid(rev, "codex_review")
        revs.append(rev)
        lib.write_jsonl(REV, revs)
    if eid:
        def f(e, _):
            e["codex_review"] = {"status": rev["status"], "verdict": rev["verdict"], "review_id": rev["id"]}
            if rev["verdict"] == "block" and lib.config()["eligibility"]["block_on_codex_verdict_block"]:
                e["outcome"] = "blocked"
        _update_exp(eid, f)
    return rev


def cmd_set_review(a):
    rev = json.loads(Path(a.file).read_text())
    rev = store_review(rev, a.exp)
    print(f"{rev['id']} status={rev['status']} verdict={rev['verdict']}")


def cmd_eligible(a):
    pr, idea, sha = getattr(a, "pr", None), getattr(a, "idea", None), getattr(a, "sha", None)
    if pr or idea or sha:
        rec = _idea_by_pr(pr) if pr else _idea_by_id(idea) if idea else _idea_by_sha(sha)
        if idea and not rec:
            rec = _idea_by_id(idea)
        pr_info = _pr_body(pr) if pr else None
        if not sha:
            if rec and rec.get("sha"):
                sha = rec["sha"]
            elif isinstance(pr_info, dict) and pr_info.get("headRefOid"):
                sha = pr_info["headRefOid"]
        if not rec and sha:
            rec = _idea_by_sha(sha)
        label = (f"PR #{pr}" if pr else idea or (sha[:12] if sha else "candidate"))
        if rec:
            label = f"{rec.get('id', label)} ({label})" if rec.get("id") and rec.get("id") not in label else label
        r = site_eligibility_reasons(sha, rec, pr_info)
        if r:
            print(f"NOT ELIGIBLE {label}: " + "; ".join(r))
            sys.exit(1)
        print(f"ELIGIBLE {label} commit {sha} (single-change, contains champion, both-set screen, no pending score)")
        return
    exps, cfg = lib.read_jsonl(EXP), lib.config()
    e = get(exps, a.exp)
    r = eligibility(e, exps, cfg)
    if r:
        print(f"NOT ELIGIBLE {e['id']}: " + "; ".join(r))
        sys.exit(1)
    note = "" if e["codex_review"]["status"] == "completed" else f" (codex review {e['codex_review']['status']}: proceeding under fallback policy, NOT reviewed)"
    print(f"ELIGIBLE {e['id']} commit {e['candidate_commit']}{note}")


def cmd_mark_submitted(a):
    exps, cfg = lib.read_jsonl(EXP), lib.config()
    e = get(exps, a.exp)
    r = eligibility(e, exps, cfg)
    if r and not a.force:
        die(f"refusing: {'; '.join(r)} (use --force only if the site already accepted it)")

    def f(e, _):
        e["submission"] = {"id": a.submission_id, "timestamp": a.at or now().isoformat(timespec="seconds")}
        e["outcome"] = "submitted"
    e = _update_exp(a.exp, f)
    print(f"{e['id']} submitted {e['submission']}")


def cmd_record_score(a):
    cfg, c = lib.config(), champion()
    mg = cfg["promotion"]["min_gain"]
    st = {}

    def f(e, _):
        e["score"] = a.score
        e["delta_vs_baseline"] = round(a.score - e["baseline_score"], 3) if e.get("baseline_score") is not None else None
        if a.metrics:
            e["metrics"].update(json.loads(a.metrics))
        comparable = e.get("evaluation", {}).get("comparable", True)
        if not comparable:
            e["outcome"] = "inconclusive"
        elif a.score > c["score"] + mg:
            e["outcome"] = "keep"
        elif abs(a.score - c["score"]) < 1e-9:
            e["outcome"] = "tie"
        else:
            e["outcome"] = "loss"
        for spec in a.failure or []:
            cls_, _, conf_ = spec.partition(":")
            e["failure_classes"].append({"class": cls_.upper(), "confidence": float(conf_ or 0.3), "basis": "suspected (aggregate score only)"})
        if a.per_match:
            e["evaluation"]["per_match_data"] = "available"
            e["evaluation"]["note"] = a.per_match
        e["lesson"] = a.lesson or e.get("lesson")
        e["next_action"] = a.next or e.get("next_action")
        if not e["submission"].get("timestamp"):
            e["submission"]["timestamp"] = now().isoformat(timespec="seconds")
        st["e"] = e
    e = _update_exp(a.exp, f)
    hs = {"keep": "supported", "loss": "failed", "tie": "inconclusive", "inconclusive": "inconclusive"}[e["outcome"]]
    with lib.locked():
        hyps, evid = lib.read_jsonl(HYP), lib.read_jsonl(EVI)
        h = get(hyps, e["hypothesis_id"])
        if h["status"] != "adopted" or hs == "supported":
            h["status"] = hs
        h["updated_at"] = lib.now_et()
        evid.append({"id": lib.next_id([r for r in evid if r["id"].startswith("EV-V-")], "EV-V-"),
                     "evidence_class": "validated", "timestamp": lib.now_et(),
                     "source": {"type": "practice_score", "ref": f"{e['id']} {e['submission'].get('id')}"},
                     "claim": f"{h['title']}: {e['candidate_commit'][:7]} scored {a.score} vs baseline {e['baseline_score']} "
                              f"(Δ {e['delta_vs_baseline']:+.2f}) vs champion {c['score']} ({c.get('scorer_version') or 'current scorer'})",
                     "experiment_id": e["id"], "hypothesis_id": h["id"], "sample_size": 48,
                     "confidence": 1.0 if e["evaluation"].get("deterministic") else 0.5,
                     "synthetic": e.get("synthetic", False),
                     "notes": "official score is comparable only within the same scorer version; builders-4 uses 96 fresh seeds and keeps the first score for identical code"})
        lib.write_jsonl(HYP, hyps)
        lib.write_jsonl(EVI, evid)
    print(f"{e['id']} score {a.score} Δ {e['delta_vs_baseline']:+.2f} vs champion {c['score']} -> {e['outcome'].upper()}; {h['id']} -> {h['status']}")
    if e["outcome"] == "keep":
        print(f"next: python3 pipeline/q.py promote {e['id']}  (then merge the PR)")


def cmd_promote(a):
    cfg = lib.config()
    with lib.locked():
        c, exps, hyps = champion(), lib.read_jsonl(EXP), lib.read_jsonl(HYP)
        e = get(exps, a.exp)
        mg = cfg["promotion"]["min_gain"]
        if e.get("score") is None:
            die(f"{e['id']} has no score")
        if cfg["promotion"]["require_comparable_evaluation"] and not e.get("evaluation", {}).get("comparable", True):
            die(f"{e['id']} evaluation not comparable; champion preserved")
        if not e["score"] > c["score"] + mg:
            die(f"NOT PROMOTED: {e['id']} score {e['score']} does not beat champion {c['experiment_id']} {c['score']} (+{mg}); champion preserved")
        c["history"].append({"experiment_id": c["experiment_id"], "commit": c["commit"], "score": c["score"], "at": c["updated_at"],
                             "scorer_version": c.get("scorer_version"), "submission_id": c.get("submission_id")})
        scorer = c.get("scorer_version") or "builders-4"
        c.update({"experiment_id": e["id"], "commit": e["candidate_commit"], "merge_commit": a.merge_commit,
                  "score": e["score"], "submission_id": e["submission"].get("id"), "updated_at": lib.now_et(),
                  "scorer_version": scorer})
        sbs = dict(c.get("scores_by_scorer") or {})
        sbs[scorer] = {"score": e["score"], "submission_id": e["submission"].get("id"), "at": c["updated_at"]}
        c["scores_by_scorer"] = sbs
        lib.require_valid(c, "champion_state")
        e["outcome"] = "adopted"
        e["updated_at"] = lib.now_et()
        get(hyps, e["hypothesis_id"])["status"] = "adopted"
        lib.write_json(CHAMP, c)
        lib.write_jsonl(EXP, exps)
        lib.write_jsonl(HYP, hyps)
    print(f"PROMOTED {e['id']} {e['candidate_commit'][:7]} score {e['score']} is champion. Merge: gh pr merge {e.get('pr') or '<pr>'} --merge")


def cmd_slots(a):
    cfg = lib.config()
    used, nxt = slots_used(lib.read_jsonl(EXP), cfg)
    print(f"{used}/{cfg['max_submissions_per_hour']} used in last {cfg['slot_window_minutes']} min; "
          f"next free {'now' if used < cfg['max_submissions_per_hour'] else nxt.isoformat(timespec='minutes')}")


def cmd_task(a):
    cfg, c = lib.config(), champion()
    hyps, exps, evid, tasks = lib.read_jsonl(HYP), lib.read_jsonl(EXP), lib.read_jsonl(EVI), lib.read_jsonl(TSK)
    h = get(hyps, a.hyp)
    by = {r["id"]: r for r in evid}
    related = [e for e in exps if e.get("hypothesis_id") == h["id"] or e["id"] in h.get("related_experiments", [])]
    failures = [f"{x['id']} {x['title']}" for x in hyps if x["status"] == "failed"]
    t = {
        "id": lib.next_id(tasks, "TASK-"), "hypothesis_id": h["id"], "experiment_id": None,
        "baseline_commit": c["commit"], "baseline_score": c["score"],
        "branch": a.branch or f"exp-{h['id'].lower()}",
        "what_to_change": h["change"], "why": h["mechanism"], "evidence_ids": h.get("evidence_ids", []),
        "related_experiments": [e["id"] for e in related], "known_failures": failures,
        "constraints": cfg["constraints"],
        "acceptance_criteria": [
            "Kit check PASS (300/300 decisions in time, p99 well under 15 ms).",
            "Only the named change; diff limited to brain.ts unless stated.",
            h.get("acceptance") or "Behavior is visible in the recorded kit match or a unit state test.",
            f"Practice success = score > {c['score']} (champion {c['experiment_id']}); any lower or equal score = revert.",
        ],
        "measure": f"One official submission compared with the current {c.get('scorer_version') or 'scorer'} champion bar {c['score']} (same scorer version only).",
        "time_budget_min": 12, "created_at": lib.now_et(),
        "parent_commit": c["commit"], "single_hypothesis": f"{h['id']}: {h['title']}",
        "observed_failure": h.get("observed_failure") or "NO PER-MATCH OFFICIAL DATA; targeted failure inferred from watcher/research evidence",
        "mechanism": h["mechanism"],
        "predicted_metric_direction": h.get("predicted_metric_direction") or "practice score up",
        "rollback_condition": h.get("rollback_condition") or f"practice score <= {c['score']}, kit check fail, or p99 regression -> close PR; champion preserved",
        "failure_classes": h.get("failure_classes", []), "owner": "Grok's Claude (Doug's Max)", "changed_files": ["brain.ts"],
    }
    lib.require_valid(t, "implementation_task")
    if not a.no_save:
        with lib.locked():
            tasks = lib.read_jsonl(TSK)
            t["id"] = lib.next_id(tasks, "TASK-")
            tasks.append(t)
            lib.write_jsonl(TSK, tasks)
    if a.json:
        print(json.dumps(t, indent=1))
        return
    L = [f"IMPLEMENTATION TASK {t['id']} for {h['id']}: {h['title']}",
         f"Branch `{t['branch']}` off champion commit {c['commit']} (score {c['score']}). Main goal: practice score >= {cfg['target_score']}.",
         f"Parent commit: {t['parent_commit']} · Owner: {t['owner']} · Files: {', '.join(t['changed_files'])}",
         f"Single hypothesis: {t['single_hypothesis']}",
         f"\nWHAT TO CHANGE (one change only):\n{h['change']}",
         f"\nOBSERVED FAILURE: {t['observed_failure']}"
         + (f"  (suspected classes: {', '.join(x['class'] + ' ' + str(x['confidence']) for x in t['failure_classes'])})" if t["failure_classes"] else ""),
         f"\nWHY (expected causal mechanism):\n{h['mechanism']}",
         f"\nPREDICTED METRIC DIRECTION: {t['predicted_metric_direction']}",
         f"ROLLBACK CONDITION: {t['rollback_condition']}", "\nEVIDENCE:"]
    for x in t["evidence_ids"]:
        r = by.get(x)
        if not r:
            L.append(f"- {x}")
        elif r["evidence_class"] == "derived":
            g = r["metrics"]["by_group"]
            L.append(f"- {x} [derived, watcher FFA]: {r['metrics']['description']}: winner {g.get('winner', {}).get('mean')} vs bottom {g.get('bottom', {}).get('mean')} (n={r['sample_size']})")
        else:
            L.append(f"- {x} [{r['evidence_class']}]: {(r.get('claim') or r.get('metric') or '')[:160]}")
    L.append("\nRELATED EXPERIMENTS:" if related else "\nRELATED EXPERIMENTS: none")
    for e in related:
        L.append(f"- {e['id']} {e['candidate_commit'][:7]} score {e.get('score')} {e['outcome']}: {e.get('lesson') or ''}")
    L.append("\nKNOWN FAILED IDEAS (do not reintroduce): " + "; ".join(failures))
    L.append("\nCONSTRAINTS:\n" + "\n".join(f"- {x}" for x in t["constraints"]))
    L.append("\nACCEPTANCE CRITERIA:\n" + "\n".join(f"- {x}" for x in t["acceptance_criteria"]))
    L.append(f"\nMEASURE: {t['measure']}\nTime budget: ~{t['time_budget_min']} min. When done: commit, push the branch, open a PR, "
             f"and print the head SHA and the kit check p99.")
    print("\n".join(L))


def cmd_ingest_research(a):
    d = Path(a.dir)
    files = sorted(p for p in d.glob("*.json"))
    added, dup, bad = 0, 0, 0
    with lib.locked():
        evid = lib.read_jsonl(EVI)
        seen = {r.get("dedupe_hash") for r in evid if r.get("dedupe_hash")}
        for p in files:
            try:
                doc = json.loads(p.read_text())
            except json.JSONDecodeError as ex:
                print(f"REJECT {p.name}: bad JSON ({ex})"); bad += 1; continue
            items = doc.get("findings") if isinstance(doc, dict) and "findings" in doc else (doc if isinstance(doc, list) else [doc])
            meta = doc if isinstance(doc, dict) and "findings" in doc else {}
            for i, f in enumerate(items):
                if not isinstance(f, dict):
                    print(f"REJECT {p.name}[{i}]: not an object"); bad += 1; continue
                f = dict(f)
                f.setdefault("author", meta.get("author"))
                f.setdefault("submitted_at", meta.get("submitted_at"))
                if meta.get("synthetic"):
                    f["synthetic"] = True
                errs = lib.validate(f, "research_finding")
                if errs:
                    print(f"REJECT {p.name}[{i}]: {'; '.join(errs[:4])}"); bad += 1; continue
                hsh = lib.claim_hash(f["claim"], f["sources"])
                if hsh in seen:
                    dup += 1; continue
                seen.add(hsh)
                f.update({"id": lib.next_id([r for r in evid if r["id"].startswith("EV-R-")], "EV-R-"),
                          "evidence_class": "research_claim", "dedupe_hash": hsh,
                          "intake_file": f"{d.name}/{p.name}", "ingested_at": lib.now_et()})
                f["timestamp"] = f["ingested_at"]
                f.setdefault("contradicts", [])
                lib.require_valid({k: v for k, v in f.items() if k != "timestamp"}, "research_finding")
                evid.append(f)
                added += 1
                print(f"ACCEPT {p.name}[{i}] -> {f['id']} [{f['topic']}] {f['claim'][:90]}")
        lib.write_jsonl(EVI, evid)
    print(f"research intake: {added} added, {dup} duplicates skipped, {bad} rejected ({len(files)} files)")
    if bad and a.strict:
        sys.exit(1)


def cmd_ingest_watch(a):
    box = Path(a.box_dir or lib.config()["watcher_box_dir"])
    der = [json.loads(x) for x in (box / "derived.jsonl").read_text().splitlines() if x.strip()]
    obs = [json.loads(x) for x in (box / "events.jsonl").read_text().splitlines() if x.strip()]
    keep = [r for r in der if r.get("match_kind") == "showdown"]
    keep += [r for r in obs if r.get("group") == "winner" and r.get("match_kind") == "showdown"]
    for r in keep:
        lib.require_valid(r, "watcher_event")
    with lib.locked():
        evid = lib.read_jsonl(EVI)
        ids = {r["id"] for r in keep}
        evid = [r for r in evid if r["id"] not in ids] + keep
        lib.write_jsonl(EVI, evid)
    print(f"ingest-watch: {len(keep)} watcher records upserted from {box} (showdown derived + winners' observed)")


def cmd_validate(a):
    n, errs = 0, []
    for name, sch in ((EXP, "experiment_result"), (HYP, "strategy_hypothesis"), (REV, "codex_review"), (TSK, "implementation_task")):
        for r in lib.read_jsonl(name):
            n += 1
            errs += [f"{name} {r.get('id')}: {x}" for x in lib.validate(r, sch)]
    for r in lib.read_jsonl(EVI):
        n += 1
        sch = {"derived": "watcher_event", "observed": "watcher_event"}.get(r.get("evidence_class"), "evidence_record")
        if r.get("evidence_class") == "research_claim":
            errs += [f"evidence {r.get('id')}: {x}" for x in lib.validate({k: v for k, v in r.items() if k != "timestamp"}, "research_finding")]
        else:
            errs += [f"evidence {r.get('id')}: {x}" for x in lib.validate(r, sch)]
    c = lib.read_json(CHAMP)
    if c:
        n += 1
        errs += [f"champion: {x}" for x in lib.validate(c, "champion_state")]
    ids = [r["id"] for f in (EXP, HYP, EVI, REV, TSK) for r in lib.read_jsonl(f)]
    dups = {i for i in ids if ids.count(i) > 1}
    errs += [f"duplicate id {i}" for i in dups]
    print("\n".join(errs) if errs else f"OK: {n} records valid")
    sys.exit(1 if errs else 0)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("brief"); p.add_argument("--n", type=int, default=6); p.add_argument("--top", type=int, default=6); p.set_defaults(fn=cmd_brief)
    p = sp.add_parser("tested"); p.add_argument("keyword"); p.set_defaults(fn=cmd_tested)
    p = sp.add_parser("add-hyp"); p.add_argument("file", help="JSON file or - for stdin"); p.set_defaults(fn=cmd_add_hyp)
    p = sp.add_parser("set-hyp"); p.add_argument("hyp"); p.add_argument("--status", choices=["untested", "failed", "supported", "inconclusive", "adopted"]); p.add_argument("--note"); p.set_defaults(fn=cmd_set_hyp)
    p = sp.add_parser("add-exp"); p.add_argument("--hyp", required=True); p.add_argument("--commit", required=True)
    p.add_argument("--change"); p.add_argument("--label"); p.add_argument("--branch"); p.add_argument("--pr", type=int)
    p.add_argument("--agent", default="grok-claude (Doug's Max)"); p.add_argument("--evidence", nargs="*")
    p.add_argument("--repeat-reason"); p.add_argument("--synthetic", action="store_true"); p.set_defaults(fn=cmd_add_exp)
    p = sp.add_parser("set-check"); p.add_argument("exp"); p.add_argument("status", choices=["pass", "fail", "pending", "not_run"])
    p.add_argument("--p99", type=float); p.add_argument("--note"); p.set_defaults(fn=cmd_set_check)
    p = sp.add_parser("set-review"); p.add_argument("exp"); p.add_argument("--file", required=True); p.set_defaults(fn=cmd_set_review)
    p = sp.add_parser("eligible"); p.add_argument("exp", nargs="?")
    p.add_argument("--pr", type=int, help="check a GitHub PR against idea records, screens.csv, and the champion")
    p.add_argument("--idea", help="check coord/data/ideas/<id>.json")
    p.add_argument("--sha", help="check a commit SHA")
    p.set_defaults(fn=cmd_eligible)
    p = sp.add_parser("mark-submitted"); p.add_argument("exp"); p.add_argument("--submission-id", required=True)
    p.add_argument("--at"); p.add_argument("--force", action="store_true"); p.set_defaults(fn=cmd_mark_submitted)
    p = sp.add_parser("record-score"); p.add_argument("exp"); p.add_argument("--score", type=float, required=True)
    p.add_argument("--lesson"); p.add_argument("--next"); p.add_argument("--metrics", help="JSON object, e.g. board rank")
    p.add_argument("--failure", nargs="*", help="suspected failure classes, e.g. NAV_STUCK:0.4 COVER_FAILURE:0.3")
    p.add_argument("--per-match", help="only if the site actually shows per-match results: describe/cite them"); p.set_defaults(fn=cmd_record_score)
    p = sp.add_parser("promote"); p.add_argument("exp"); p.add_argument("--merge-commit"); p.set_defaults(fn=cmd_promote)
    p = sp.add_parser("slots"); p.set_defaults(fn=cmd_slots)
    p = sp.add_parser("task"); p.add_argument("hyp"); p.add_argument("--branch"); p.add_argument("--json", action="store_true")
    p.add_argument("--no-save", action="store_true"); p.set_defaults(fn=cmd_task)
    p = sp.add_parser("ingest-research"); p.add_argument("--dir", default=str(lib.REPO / "research" / "intake")); p.add_argument("--strict", action="store_true"); p.set_defaults(fn=cmd_ingest_research)
    p = sp.add_parser("ingest-watch"); p.add_argument("--box-dir"); p.set_defaults(fn=cmd_ingest_watch)
    p = sp.add_parser("validate"); p.set_defaults(fn=cmd_validate)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
