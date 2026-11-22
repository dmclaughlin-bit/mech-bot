#!/usr/bin/env python3
"""Fail a screen CSV/trace set as INCOMPLETE if any expected seed is missing or duplicated.

Use from a screen script:

    python3 tester/check_complete.py --csv <path> --base 2000
    python3 tester/check_complete.py --csv <path> --base 2000 --traces <dir>

Exit 0 if complete (exactly the expected seeds, once each).
Exit 2 and print INCOMPLETE if not (do not treat that as a verdict).
"""
from __future__ import annotations
import argparse, csv, collections, glob, json, os, sys

def expected_seeds(base: int, n: int) -> list[int]:
    return list(range(base, base + n))

def csv_seeds(path: str) -> list[int]:
    with open(path, newline="") as f:
        return [int(r["seed"]) for r in csv.DictReader(f)]

def trace_seeds(dirpath: str) -> list[int]:
    out = []
    for p in glob.glob(os.path.join(dirpath, "*seed*.json")):
        name = os.path.basename(p)
        # e.g. 554675-5-seed2021.json
        if "seed" not in name:
            continue
        try:
            out.append(int(name.split("seed")[-1].split(".")[0]))
        except ValueError:
            continue
    return out

def report(label: str, got: list[int], expect: list[int]) -> bool:
    c = collections.Counter(got)
    missing = [s for s in expect if c[s] == 0]
    dup = {s: c[s] for s in expect if c[s] > 1}
    extra = sorted(s for s in c if s not in expect)
    ok = not missing and not dup and not extra and len(got) == len(expect)
    print(f"{label}: n={len(got)} unique={len(c)} expected={len(expect)}"
          f" missing={missing or 'none'} dup={dup or 'none'} extra={extra or 'none'}"
          f" {'COMPLETE' if ok else 'INCOMPLETE'}")
    return ok

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--base", type=int, required=True)
    ap.add_argument("--n", type=int, default=96)
    ap.add_argument("--traces", default="")
    args = ap.parse_args()
    expect = expected_seeds(args.base, args.n)
    if not os.path.exists(args.csv):
        print(f"INCOMPLETE: missing CSV {args.csv}")
        return 2
    ok = report(f"csv {args.csv}", csv_seeds(args.csv), expect)
    if args.traces:
        if not os.path.isdir(args.traces):
            print(f"INCOMPLETE: missing traces dir {args.traces}")
            return 2
        ok = report(f"traces {args.traces}", trace_seeds(args.traces), expect) and ok
    if not ok:
        print("INCOMPLETE: partial or duplicated run; do not issue a verdict")
        return 2
    return 0

if __name__ == "__main__":
    sys.exit(main())
