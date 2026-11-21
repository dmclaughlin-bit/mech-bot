#!/usr/bin/env python3
"""Turn the live watcher's recordings into validated watcher_event records.

Reuses the existing analyzer (/workspace/watch/ana.py) unchanged. Raw jsonl
stays on the box; this writes:
  <box_dir>/events.jsonl   observed: one record per mech per complete match
  <box_dir>/derived.jsonl  derived: mean/median/n per metric per placement group
  <box_dir>/summary.json   file list, match counts, generated_at
Run:  /workspace/venv/bin/python pipeline/watch_ingest.py [--box-dir DIR] [--files ...]
Then: python3 pipeline/q.py ingest-watch   (copies derived + winner rows into pipeline/data)
NOTE: these are Top-16 exhibition matches (FFA), not practice vs the house squad.
"""
import argparse, datetime as dt, json, os, statistics, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lib  # noqa: E402

WATCH = Path(os.environ.get("WATCH_DIR", "/workspace/watch"))

# metric -> short description (keys produced by ana.analyze_match)
METRICS = {
    "place": "final placement (1 = winner)",
    "life_s": "seconds alive",
    "kills": "mech kills",
    "npc_kills": "NPC (drone) kills",
    "damage_dealt": "damage dealt",
    "damage_taken": "damage taken",
    "laser_share": "% of damage from laser",
    "lightning_share": "% of damage from lightning",
    "gun_share": "% of damage from gun",
    "mortar_share": "% of damage from mortar",
    "laser_t": "seconds until laser picked up",
    "first_weapon_t": "seconds until first weapon",
    "cubes_max": "max cubes held",
    "first_cube_t": "seconds until first cube",
    "crates": "crates opened",
    "drops_taken": "supply drops taken",
    "zone_ratio": "mean distance-to-centre / zone radius",
    "outside_pct": "% of time outside the zone",
    "nearest": "mean distance to nearest enemy mech (m)",
    "boost_pct": "% of time boosting",
    "air_pct": "% of time airborne",
    "avg_hpfrac": "mean HP fraction",
    "gun_gt100_pct": "% of gun hits on mechs beyond 100 m",
    "gun_range_mean": "mean gun-hit range (m)",
    "tgt_hp50_pct": "% of mech hits on targets under 50% HP",
    "third_party_pct": "% of hits as third party",
    "silent_pct": "% of time silent (not firing)",
    "circ70_hpfrac": "HP fraction when final circle r<=70 began",
    # cover (report.cover_for_match on arena building prisms, ~1 Hz)
    "hold_open_pct": "% of hold time in the open (no building near, LOS to nearest enemy clear)",
    "hold_los_pct": "% of hold time with a building blocking LOS to nearest enemy",
    "cover_near_pct": "% of time within 12 m of a building",
}
GROUPS = ("winner", "top4", "bottom")


def _num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _ts_of(path):
    return dt.datetime.fromtimestamp(Path(path).stat().st_mtime, lib.ET).isoformat(timespec="seconds")


def build(paths):
    sys.path.insert(0, str(WATCH))
    import ana  # the watcher's analyzer, unchanged
    matches = ana.load_matches(paths)
    reports, rows = ana.analyze_all(matches)
    kind_by_seed = {R["seed"]: R.get("kind") for R in reports}
    try:  # cover stats from the watcher's report.py (best effort)
        import report
        polys = report.load_buildings()
        cov = {}
        for M in matches:
            sd, seed = ana.match_key(M)
            cov[seed] = report.cover_for_match(M, polys)
        for m in rows:
            m.update(cov.get(m["seed"], {}).get(m["id"], {}))
    except Exception as ex:  # noqa: BLE001
        print(f"watch_ingest: cover stats skipped ({ex})", file=sys.stderr)
    src_by_seed = {R["seed"]: R.get("src") for R in reports}
    now = lib.now_et()
    observed = []
    for m in rows:
        seed = m["seed"]
        mid = f"{m.get('showdown_id') or kind_by_seed.get(seed) or 'match'}:{seed}"
        src = src_by_seed.get(seed) or ""
        metrics = {k: _num(m.get(k)) for k in METRICS if _num(m.get(k)) is not None}
        metrics["upgrades_n"] = len(m.get("upgrades") or [])
        rec = {
            "id": f"EV-W-O-{seed}-{m['id']}",
            "evidence_class": "observed",
            "source": {"type": "watcher", "ref": src, "url": "wss://watch.joinbuilders.org/live", "author": "watcher"},
            "timestamp": _ts_of(src) if src and Path(src).exists() else now,
            "match_ids": [mid], "match_kind": kind_by_seed.get(seed),
            "metric": "mech_match_summary", "group": m.get("group"), "subject": m.get("name"),
            "metrics": {**metrics, "loadout": m.get("loadout"), "upgrade_order": m.get("upgrade_order"),
                        "killed_by_kind": m.get("killed_by_kind"), "killed_with": m.get("killed_with")},
            "sample_size": 1, "confidence": 0.9, "notes": None, "contradicts": [],
        }
        lib.require_valid(rec, "watcher_event")
        observed.append(rec)

    derived = []
    for kind in ("showdown", "all"):
        pool = [m for m in rows if kind == "all" or kind_by_seed.get(m["seed"]) == kind]
        mids = sorted({f"{m.get('showdown_id') or kind_by_seed.get(m['seed'])}:{m['seed']}" for m in pool})
        if not pool:
            continue
        for metric, desc in METRICS.items():
            if metric == "place":
                continue
            stats = {}
            n_total = 0
            for g in GROUPS:
                xs = [_num(m.get(metric)) for m in pool if m.get("group") == g]
                xs = [x for x in xs if x is not None]
                if xs:
                    stats[g] = {"mean": round(statistics.fmean(xs), 3), "median": round(statistics.median(xs), 3),
                                "n": len(xs), "min": round(min(xs), 3), "max": round(max(xs), 3)}
                    n_total += len(xs)
            if not stats:
                continue
            n_w = stats.get("winner", {}).get("n", 0)
            rec = {
                "id": f"EV-W-D-{kind}-{metric}",
                "evidence_class": "derived",
                "source": {"type": "watcher", "ref": f"pipeline/watch_ingest.py over {len(paths)} live.jsonl files", "url": None, "author": "watcher"},
                "timestamp": now, "match_ids": mids, "match_kind": kind,
                "metric": metric, "group": "all", "subject": None,
                "metrics": {"description": desc, "by_group": stats,
                            "winner_minus_bottom": (round(stats["winner"]["mean"] - stats["bottom"]["mean"], 3)
                                                    if "winner" in stats and "bottom" in stats else None)},
                "sample_size": n_total,
                # heuristic: confidence grows with the number of winners observed
                "confidence": round(min(0.9, n_w / (n_w + 6)), 2) if n_w else 0.1,
                "notes": "Top-16 exhibition (FFA) matches, not practice vs house squad.",
                "contradicts": [],
            }
            lib.require_valid(rec, "watcher_event")
            derived.append(rec)
    summary = {"generated_at": now, "files": [str(p) for p in paths], "matches": len(reports),
               "complete": sum(1 for R in reports if R["complete"]),
               "showdown_complete": sum(1 for R in reports if R["complete"] and R.get("kind") == "showdown"),
               "observed_records": len(observed), "derived_records": len(derived)}
    return observed, derived, summary


def discover():
    sys.path.insert(0, str(WATCH))
    import report
    return report.discover_live_files()


def main():
    ap = argparse.ArgumentParser()
    cfg_dir = lib.config().get("watcher_box_dir", "/workspace/watch/pipeline")
    ap.add_argument("--box-dir", default=cfg_dir)
    ap.add_argument("--files", nargs="*")
    a = ap.parse_args()
    paths = [Path(p) for p in a.files] if a.files else discover()
    if not paths:
        raise SystemExit("watch_ingest: no live.jsonl files found")
    observed, derived, summary = build(paths)
    out = Path(a.box_dir)
    out.mkdir(parents=True, exist_ok=True)
    for name, rows in (("events.jsonl", observed), ("derived.jsonl", derived)):
        tmp = out / (name + ".tmp")
        tmp.write_text("".join(json.dumps(r) + "\n" for r in rows))
        os.replace(tmp, out / name)
    (out / "summary.json").write_text(json.dumps(summary, indent=1) + "\n")
    print(f"watch_ingest: {summary['complete']} complete matches ({summary['showdown_complete']} showdown) -> "
          f"{len(observed)} observed, {len(derived)} derived records in {out}")


if __name__ == "__main__":
    main()
