#!/usr/bin/env bash
# Independent read-only Codex review of one candidate commit.
#   pipeline/codex_review.sh <base_sha> <candidate_sha> <HYP-id> [EXP-id]
# - Runs `codex exec` non-interactively with --sandbox read-only in a throwaway
#   detached worktree of the candidate (Codex can read files but cannot write).
# - Bounded by config.json codex_timeout_s (default 480 s).
# - Output must match schemas/codex_output.json; wrapped into a codex_review record.
# - If Codex is missing / not logged in / times out / errors, writes a record with
#   status unavailable|timeout|error and verdict none. That is NOT a pass.
# Exit: 0 = pass, or not reviewed but allowed by fallback (codex_required=false)
#       2 = verdict block (critical finding)    3 = not reviewed and codex_required=true
# Env: REPO (default: repo containing this script), CODEX_BIN, NO_STORE=1 (print only).
set -uo pipefail
BASE=${1:?base sha}; CAND=${2:?candidate sha}; HYP=${3:?HYP id}; EXP=${4:-}
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=${REPO:-$(cd "$HERE/.." && pwd)}
CFG=${PIPELINE_CONFIG:-$HERE/config.json}
PY=python3
TIMEOUT=$($PY -c "import json;print(json.load(open('$CFG')).get('codex_timeout_s',480))")
REQUIRED=$($PY -c "import json;print(str(json.load(open('$CFG')).get('codex_required',False)).lower())")
MODEL=$($PY -c "import json;m=json.load(open('$CFG')).get('codex_model');print(m or '')")
CODEX=${CODEX_BIN:-$(command -v codex || echo "$HOME/.local/bin/codex")}
WORK=$(mktemp -d /tmp/codex-review.XXXXXX)
trap 'git -C "$REPO" worktree remove --force "$WORK/wt" >/dev/null 2>&1; rm -rf "$WORK"' EXIT
START=$(date +%s)

emit() {  # status verdict reason [codex_output.json]
  STATUS="$1" VERDICT="$2" REASON="$3" OUT="${4:-}" BASE="$BASE" CAND="$CAND" HYP="$HYP" \
  START="$START" REQUIRED="$REQUIRED" MODEL="$MODEL" $PY - <<'PYEOF' > "$WORK/review.json"
import json, os, sys, time
sys.path.insert(0, os.environ.get("HERE_DIR", "."))
from datetime import datetime
from zoneinfo import ZoneInfo
out = {"verdict": None, "summary": None, "findings": []}
p = os.environ.get("OUT")
status, verdict, reason = os.environ["STATUS"], os.environ["VERDICT"], os.environ["REASON"]
if p:
    try:
        out = json.load(open(p))
        f = out.get("findings", [])
        # policy: any critical finding blocks regardless of what the model said
        verdict = "block" if any(x.get("severity") == "critical" for x in f) else out.get("verdict", "pass")
    except Exception as e:
        status, verdict, reason = "error", "none", f"unparseable codex output: {e}"
        out = {"summary": None, "findings": []}
rev = {"id": "REV-0000", "experiment_id": None, "status": status, "verdict": verdict,
       "base_commit": os.environ["BASE"], "candidate_commit": os.environ["CAND"], "hypothesis_id": os.environ["HYP"],
       "findings": out.get("findings", []), "summary": out.get("summary"), "reason": reason or None,
       "fallback_policy": "codex_required=" + os.environ["REQUIRED"],
       "duration_s": round(time.time() - int(os.environ["START"]), 1), "model": os.environ.get("MODEL") or None,
       "synthetic": False, "timestamp": datetime.now(ZoneInfo("America/New_York")).isoformat(timespec="seconds")}
print(json.dumps(rev))
PYEOF
}

finish() {
  export HERE_DIR="$HERE"
  if [[ -z "${NO_STORE:-}" ]]; then
    if [[ -n "$EXP" ]]; then $PY "$HERE/q.py" set-review "$EXP" --file "$WORK/review.json" >&2
    else $PY -c "import sys,json;sys.path.insert(0,'$HERE');import q;r=q.store_review(json.load(open('$WORK/review.json')));print(r['id'],file=sys.stderr)"
    fi
  fi
  cat "$WORK/review.json"; echo
  V=$($PY -c "import json;print(json.load(open('$WORK/review.json'))['verdict'])")
  S=$($PY -c "import json;print(json.load(open('$WORK/review.json'))['status'])")
  if [[ "$V" == "block" ]]; then exit 2; fi
  if [[ "$S" != "completed" && "$REQUIRED" == "true" ]]; then exit 3; fi
  exit 0
}

# ---- availability: binary + auth (never prints tokens) ----
if [[ ! -x "$CODEX" ]]; then emit unavailable none "codex CLI not installed"; finish; fi
if ! "$CODEX" login status >/dev/null 2>&1 && [[ -z "${CODEX_API_KEY:-}" ]]; then
  emit unavailable none "codex not authenticated: run 'codex login' (ChatGPT plan) or 'printenv OPENAI_API_KEY | codex login --with-api-key' on the box"; finish
fi

# ---- build prompt ----
if ! git -C "$REPO" worktree add --detach "$WORK/wt" "$CAND" >/dev/null 2>&1; then
  emit error none "cannot check out candidate $CAND in $REPO"; finish
fi
DIFF=$(git -C "$REPO" diff "$BASE" "$CAND" -- . ':(exclude)pipeline' ':(exclude)coord' ':(exclude)*.md' | head -c 60000)
HYPTXT=$($PY "$HERE/q.py" task "$HYP" --no-save 2>/dev/null | head -c 8000)
cat > "$WORK/prompt.md" <<PROMPT
You are an independent, READ-ONLY code reviewer for a Mech Royale battle bot (Bun/TypeScript, mechfight/1 JSON-lines protocol).
Do not modify files. Review ONLY the candidate change below against its hypothesis. Be concise.

Check for: implementation mistakes; behavior that contradicts the hypothesis; regressions in existing behavior
(aiming, survival, zone moves, healing while still firing); missing edge cases (no target, target lost, zone shrinking,
stuck navigation, laser charging); stdout pollution (stdout must be protocol lines only); runtime cost
(50 ms per decision hard limit, p99 target <= 15 ms; nav.eta is full A* and must not run every decision; nav.stuck exactly once per decision);
violations of hard caps H1-H3; more than one strategic change in the diff.

Severity: critical = would crash, time out, break the protocol, or clearly invert the intended behavior (blocks submission);
major = likely score regression or unintended behavior; minor = style, small inefficiency.
Return ONLY JSON matching the provided schema: verdict "block" if any critical finding else "pass".

## Hypothesis and task
$HYPTXT

## Diff ($BASE..$CAND, bot files only)
\`\`\`diff
$DIFF
\`\`\`
PROMPT

ARGS=(exec --sandbox read-only --skip-git-repo-check --ephemeral -C "$WORK/wt"
      --output-schema "$HERE/schemas/codex_output.json" -o "$WORK/out.json")
[[ -n "$MODEL" ]] && ARGS+=(-m "$MODEL")
timeout "$TIMEOUT" "$CODEX" "${ARGS[@]}" - < "$WORK/prompt.md" > "$WORK/codex.log" 2>&1
RC=$?
if [[ $RC -eq 124 ]]; then emit timeout none "codex exceeded ${TIMEOUT}s"; finish; fi
if [[ $RC -ne 0 || ! -s "$WORK/out.json" ]]; then
  emit error none "codex exec exit $RC: $(tail -c 300 "$WORK/codex.log" | tr '\n' ' ' | sed 's/[A-Za-z0-9_-]\{32,\}/[redacted]/g')"; finish
fi
emit completed pass "" "$WORK/out.json"; finish
