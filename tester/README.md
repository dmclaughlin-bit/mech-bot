# Station tools

Helpers for the official trees-on screen and the 96-fresh-game paired estimate. This branch is tooling only: no sim output, no traces, and not for main.

## `tester/check_complete.py`

Checks that a run finished every expected game exactly once. A partial, duplicated, or missing-seed run must be reported **INCOMPLETE**, never as a verdict.

### Usage

```
python3 tester/check_complete.py --csv <path> --base 2000
python3 tester/check_complete.py --csv <path> --base 2000 --n 96
python3 tester/check_complete.py --csv <path> --base 2000 --traces <trace-dir>
```

`--base` is `SEED_BASE`. Expected seeds are `SEED_BASE + 0 .. n-1` (default `n=96`), i.e. `--base 2000` expects 2000–2095. `--traces` is optional; if given, every expected seed must also appear once in a `*seed<N>.json` filename in that directory.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | COMPLETE: the CSV (and traces, if passed) contain each expected seed exactly once, and no extras. |
| 2 | INCOMPLETE: the CSV is missing, a traces directory is missing, or any expected seed is missing or duplicated, or an unexpected seed is present. Prints `INCOMPLETE` and must not be treated as a verdict. |

### What it checks

- The CSV exists and has a `seed` column.
- Row count, unique seeds, missing seeds, duplicates, and extra seeds against the expected list.
- If `--traces` is set: the directory exists, and the same seed accounting is applied to `*seed<N>.json` files (for example `554675-5-seed2021.json`).

It does not score the run, apply vetoes, or read per-tick fields.
