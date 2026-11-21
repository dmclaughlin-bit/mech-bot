#!/usr/bin/env bash
# End-to-end dry run of one full cycle on a SCRATCH copy of pipeline/data.
# Real: watcher records (box), Diego's real intake, experiment history, codex availability check.
# SYNTHETIC (labeled): a second Diego file, the kit-check result, submission id/time and score.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE/.."
export PIPELINE_DATA_DIR=$(mktemp -d /tmp/pipeline-e2e.XXXXXX)
cp -r pipeline/data/. "$PIPELINE_DATA_DIR/"
BEFORE=$(cat pipeline/data/*.json* | sha256sum)
Q="python3 pipeline/q.py"
echo "== scratch data: $PIPELINE_DATA_DIR"
echo "== 1. watcher -> evidence (real recordings)"
if [[ -x /workspace/venv/bin/python && -d /workspace/watch ]]; then
  /workspace/venv/bin/python pipeline/watch_ingest.py --box-dir "$PIPELINE_DATA_DIR/box-watch"
  $Q ingest-watch --box-dir "$PIPELINE_DATA_DIR/box-watch"
else echo "(no watcher on this machine; skipped)"; fi
echo "== 2. research intake (real dir + SYNTHETIC fixture)"
$Q ingest-research
mkdir -p "$PIPELINE_DATA_DIR/intake" && cp pipeline/fixtures/synthetic/diego-SYNTHETIC.json "$PIPELINE_DATA_DIR/intake/"
$Q ingest-research --dir "$PIPELINE_DATA_DIR/intake"
echo "== 3. decision brief"; $Q brief --top 4
echo "== 4. repeat check + task for top non-in-progress hypothesis (HYP-010)"
$Q tested farm; $Q task HYP-010 | head -12
echo "== 5. candidate (SYNTHETIC: reuses Build 8 commit beb9240 as a stand-in candidate)"
EXP=$($Q add-exp --hyp HYP-010 --commit beb9240f4104cdb6eefb9e3dfd621d67e94a0ed3 --label "SYNTHETIC e2e" --synthetic)
echo "$EXP"
$Q set-check "$EXP" pass --p99 0.9 --note "SYNTHETIC"
echo "== 6. codex review (real availability check)"; bash pipeline/codex_review.sh 100941f beb9240 HYP-010 "$EXP" | tail -1
echo "== 7. eligibility + submission (SYNTHETIC id/time)"
export PIPELINE_NOW=2026-11-21T01:00:00-05:00
$Q eligible "$EXP"
$Q mark-submitted "$EXP" --submission-id BB-SYNTHETIC --at 2026-11-21T01:00:00-05:00
$Q slots
echo "== 8. score (SYNTHETIC 2.50) + promote"
$Q record-score "$EXP" --score 2.50 --lesson "SYNTHETIC e2e" --next "SYNTHETIC"
$Q promote "$EXP"
$Q validate
python3 -c "import json;print('champion now', json.load(open('$PIPELINE_DATA_DIR/champion.json'))['score'], '(scratch copy only)')"
[[ "$(cat pipeline/data/*.json* | sha256sum)" == "$BEFORE" ]] && echo "== real pipeline/data untouched (checksum unchanged)" || { echo "!! real data changed"; exit 1; }
