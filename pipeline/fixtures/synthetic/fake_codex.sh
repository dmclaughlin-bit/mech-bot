#!/usr/bin/env bash
# SYNTHETIC stand-in for the codex CLI, used only by tests. FAKE_CODEX_MODE=pass|critical|fail
if [[ "$1" == "login" ]]; then exit 0; fi
out=""; while [[ $# -gt 0 ]]; do [[ "$1" == "-o" ]] && out="$2"; shift; done
cat > /dev/null
case "${FAKE_CODEX_MODE:-pass}" in
  pass) echo '{"verdict":"pass","summary":"SYNTHETIC ok","findings":[{"severity":"minor","title":"nit","detail":"x","file":"brain.ts","line":1}]}' > "$out";;
  critical) echo '{"verdict":"pass","summary":"SYNTHETIC model said pass but listed a critical","findings":[{"severity":"critical","title":"stdout pollution","detail":"console.log","file":"brain.ts","line":2}]}' > "$out";;
  fail) echo "boom" >&2; exit 1;;
esac
