"""Shared helpers for the mech-bot pipeline: paths, JSONL store, a tiny
stdlib JSON-Schema validator (subset we use), IDs, ET timestamps, locking.
No third-party deps so it runs anywhere python3 >= 3.9 exists."""
import contextlib, datetime as dt, fcntl, hashlib, json, os, re
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent            # pipeline/
REPO = ROOT.parent
SCHEMAS = ROOT / "schemas"
ET = ZoneInfo("America/New_York")


def data_dir() -> Path:
    # PIPELINE_DATA_DIR lets tests / dry runs use a scratch copy.
    return Path(os.environ.get("PIPELINE_DATA_DIR") or (ROOT / "data"))


def config() -> dict:
    p = Path(os.environ.get("PIPELINE_CONFIG") or (ROOT / "config.json"))
    return json.loads(p.read_text())


def now_et() -> str:
    return dt.datetime.now(ET).isoformat(timespec="seconds")


def parse_ts(s):
    if not s:
        return None
    d = dt.datetime.fromisoformat(s)
    return d if d.tzinfo else d.replace(tzinfo=ET)


# ---------------- store ----------------
def read_jsonl(name):
    p = data_dir() / name
    if not p.exists():
        return []
    out = []
    for i, line in enumerate(p.read_text().splitlines(), 1):
        line = line.strip()
        if line:
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError as e:
                raise SystemExit(f"{p}:{i}: bad JSON: {e}")
    return out


def write_jsonl(name, rows):
    p = data_dir() / name
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text("".join(json.dumps(r, ensure_ascii=False, sort_keys=False) + "\n" for r in rows))
    os.replace(tmp, p)


def read_json(name, default=None):
    p = data_dir() / name
    return json.loads(p.read_text()) if p.exists() else default


def write_json(name, obj):
    p = data_dir() / name
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text(json.dumps(obj, indent=1, ensure_ascii=False) + "\n")
    os.replace(tmp, p)


@contextlib.contextmanager
def locked():
    """Single-writer lock so two agents never interleave writes to data/."""
    d = data_dir()
    d.mkdir(parents=True, exist_ok=True)
    with open(d / ".lock", "w") as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(fh, fcntl.LOCK_UN)


def next_id(rows, prefix, width=4):
    n = 0
    for r in rows:
        m = re.match(rf"^{re.escape(prefix)}(\d+)$", str(r.get("id", "")))
        if m:
            n = max(n, int(m.group(1)))
    return f"{prefix}{n + 1:0{width}d}"


def claim_hash(claim, sources):
    norm = lambda s: re.sub(r"\s+", " ", str(s).strip().lower())
    refs = sorted(norm(s.get("ref", "")) for s in sources or [])
    return hashlib.sha256((norm(claim) + "|" + "|".join(refs)).encode()).hexdigest()[:16]


# ---------------- validation ----------------
_SCHEMA_CACHE = {}


def schema(name):
    if name not in _SCHEMA_CACHE:
        _SCHEMA_CACHE[name] = json.loads((SCHEMAS / f"{name}.json").read_text())
    return _SCHEMA_CACHE[name]


_TYPES = {"string": str, "object": dict, "array": list, "boolean": bool, "null": type(None)}


def _is_type(v, t):
    if t == "integer":
        return isinstance(v, int) and not isinstance(v, bool)
    if t == "number":
        return isinstance(v, (int, float)) and not isinstance(v, bool)
    return isinstance(v, _TYPES[t])


def validate(obj, sch, path="$"):
    """Return a list of error strings ([] = valid). Supports type, enum,
    required, properties, additionalProperties(false), items, minItems,
    minimum, maximum, minLength, pattern."""
    if isinstance(sch, str):
        sch = schema(sch)
    errs = []
    t = sch.get("type")
    if t is not None:
        ts = t if isinstance(t, list) else [t]
        if not any(_is_type(obj, x) for x in ts):
            return [f"{path}: expected {t}, got {type(obj).__name__}"]
    if "enum" in sch and obj not in sch["enum"]:
        errs.append(f"{path}: {obj!r} not in {sch['enum']}")
    if isinstance(obj, str):
        if "minLength" in sch and len(obj) < sch["minLength"]:
            errs.append(f"{path}: shorter than {sch['minLength']}")
        if "pattern" in sch and not re.search(sch["pattern"], obj):
            errs.append(f"{path}: {obj!r} does not match {sch['pattern']}")
    if _is_type(obj, "number"):
        if "minimum" in sch and obj < sch["minimum"]:
            errs.append(f"{path}: {obj} < {sch['minimum']}")
        if "maximum" in sch and obj > sch["maximum"]:
            errs.append(f"{path}: {obj} > {sch['maximum']}")
    if isinstance(obj, dict):
        for k in sch.get("required", []):
            if k not in obj:
                errs.append(f"{path}: missing '{k}'")
        props = sch.get("properties", {})
        for k, v in obj.items():
            if k in props:
                errs += validate(v, props[k], f"{path}.{k}")
            elif sch.get("additionalProperties") is False:
                errs.append(f"{path}: unexpected field '{k}'")
    if isinstance(obj, list):
        if "minItems" in sch and len(obj) < sch["minItems"]:
            errs.append(f"{path}: fewer than {sch['minItems']} items")
        if "items" in sch:
            for i, v in enumerate(obj):
                errs += validate(v, sch["items"], f"{path}[{i}]")
    return errs


def require_valid(obj, name):
    errs = validate(obj, name)
    if errs:
        raise ValueError(f"{name} invalid: " + "; ".join(errs[:8]))
    return obj
