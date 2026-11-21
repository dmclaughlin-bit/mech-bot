"""Regenerates pipeline/schemas/*.json. Edit here, then run: python3 pipeline/gen_schemas.py"""
import json, os
from pathlib import Path
OUT = Path(__file__).resolve().parent / "schemas"
S = "https://json-schema.org/draft/2020-12/schema"
ts = {"type": "string", "pattern": r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}"}
conf = {"type": "number", "minimum": 0, "maximum": 1}
unit = {"type": "number", "minimum": 0, "maximum": 1}
strs = {"type": "array", "items": {"type": "string"}}
cls = {"type": "string", "enum": ["observed", "derived", "research_claim", "hypothesis", "validated"]}
hstatus = {"type": "string", "enum": ["untested", "failed", "supported", "inconclusive", "adopted"]}
sha = {"type": ["string", "null"], "pattern": "^[0-9a-f]{7,40}$"}
src = {"type": "object", "required": ["type", "ref"], "properties": {
    "type": {"type": "string", "enum": ["watcher", "research", "experiment", "repo_doc", "handoff", "practice_score", "synthetic"]},
    "ref": {"type": "string", "minLength": 1},
    "url": {"type": ["string", "null"]},
    "author": {"type": ["string", "null"]}}}
FAIL = ["NAV_COLLISION", "NAV_STUCK", "NAV_BAD_ROUTE", "ZONE_LATE", "MULTI_ENEMY_TRAP", "COVER_FAILURE", "REGEN_RESET",
        "OVER_AGGRESSION", "UNDER_AGGRESSION", "AIM_WEAPON", "RESOURCE_TRAP", "COMPUTE_FAILURE", "UNKNOWN"]
fclasses = {"type": "array", "description": "Diego's failure taxonomy (research/intake/diego-research-1105.md E2). Suspected, not proven, unless basis says otherwise.",
  "items": {"type": "object", "additionalProperties": False, "required": ["class", "confidence"], "properties": {
    "class": {"type": "string", "enum": FAIL}, "confidence": conf, "basis": {"type": ["string", "null"]}}}}
direction = {"type": ["string", "null"]}
schemas = {}
schemas["watcher_event"] = {
  "title": "watcher_event", "description": "One observation or derived statistic from the live watcher (top-16 exhibition matches, NOT practice).",
  "type": "object", "additionalProperties": False,
  "required": ["id", "evidence_class", "source", "timestamp", "match_ids", "metric", "metrics", "sample_size"],
  "properties": {
    "id": {"type": "string", "pattern": r"^EV-W-[A-Za-z0-9_.-]+$"},
    "evidence_class": {"type": "string", "enum": ["observed", "derived"]},
    "source": src, "timestamp": ts,
    "match_ids": strs, "metric": {"type": "string"},
    "group": {"type": ["string", "null"], "enum": ["winner", "top4", "mid", "bottom", "all", None]},
    "subject": {"type": ["string", "null"]},
    "metrics": {"type": "object"},
    "sample_size": {"type": "integer", "minimum": 0},
    "confidence": conf, "notes": {"type": ["string", "null"]},
    "contradicts": strs, "match_kind": {"type": ["string", "null"]}}}
schemas["research_finding"] = {
  "title": "research_finding", "description": "One claim from Diego's (or other) outside research. Ingested as evidence_class research_claim, never as proven mechanics.",
  "type": "object", "additionalProperties": False,
  "required": ["claim", "topic", "sources", "confidence", "suggested_change"],
  "properties": {
    "id": {"type": "string", "pattern": r"^EV-R-[0-9]{4}$"},
    "claim": {"type": "string", "minLength": 10},
    "topic": {"type": "string", "enum": ["strategy_mechanics", "top_team_behavior", "resource_upgrade", "our_weakness", "untested_opportunity", "contradiction"]},
    "sources": {"type": "array", "minItems": 1, "items": {"type": "object", "required": ["ref"], "properties": {
        "ref": {"type": "string", "minLength": 3}, "kind": {"type": "string", "enum": ["repo", "doc", "protocol", "video", "leaderboard", "watch_stream", "other"]}, "quote": {"type": ["string", "null"]}}}},
    "confidence": conf,
    "is_guess": {"type": "boolean"},
    "verification": {"type": "string", "enum": ["unverified", "verified", "refuted"]},
    "failure_classes": fclasses,
    "sample_size": {"type": ["integer", "null"], "minimum": 0},
    "suggested_change": {"type": "string"},
    "mechanism": {"type": ["string", "null"]},
    "expected_gain": {"type": ["number", "null"], "minimum": 0, "maximum": 3},
    "effort": {"type": ["integer", "null"], "minimum": 1, "maximum": 5},
    "regression_risk": {"type": ["number", "null"], "minimum": 0, "maximum": 1},
    "related_rule_ids": strs, "related_experiments": strs, "contradicts": strs,
    "keywords": strs,
    "author": {"type": ["string", "null"]}, "submitted_at": {"type": ["string", "null"]},
    "synthetic": {"type": "boolean"},
    "evidence_class": {"type": "string", "enum": ["research_claim"]},
    "dedupe_hash": {"type": "string"}, "intake_file": {"type": "string"}, "ingested_at": {"type": "string"}}}
schemas["strategy_hypothesis"] = {
  "title": "strategy_hypothesis", "type": "object", "additionalProperties": False,
  "required": ["id", "title", "change", "mechanism", "status", "evidence_ids", "keywords", "expected_gain", "evidence_strength", "novelty", "effort", "regression_risk", "testability", "created_at"],
  "properties": {
    "id": {"type": "string", "pattern": r"^HYP-[0-9]{3}$"},
    "title": {"type": "string"}, "change": {"type": "string"}, "mechanism": {"type": "string"},
    "rule_ids": strs, "keywords": strs, "status": hstatus,
    "evidence_ids": strs, "contradicting_evidence_ids": strs, "related_experiments": strs,
    "parent_hypothesis": {"type": ["string", "null"]},
    "expected_gain": {"type": "number", "minimum": 0, "maximum": 3, "description": "estimated practice score delta"},
    "evidence_strength": unit, "novelty": unit,
    "effort": {"type": "integer", "minimum": 1, "maximum": 5, "description": "1 = <10 min one-liner, 5 = multi-hour"},
    "regression_risk": unit, "testability": unit,
    "acceptance": {"type": ["string", "null"]},
    "recurrence": {"type": "number", "minimum": 0, "maximum": 1, "description": "how often the targeted failure is believed to occur (0-1)"},
    "test_burden": {"type": "integer", "minimum": 1, "maximum": 5, "description": "1 = one submission settles it, 5 = needs many runs/instrumentation"},
    "failure_classes": fclasses,
    "observed_failure": {"type": ["string", "null"]},
    "predicted_metric_direction": direction,
    "rollback_condition": {"type": ["string", "null"]},
    "priority_tag": {"type": ["string", "null"], "description": "e.g. Diego P0-P4"},
    "in_progress_branch": {"type": ["string", "null"]},
    "created_at": ts, "updated_at": {"type": ["string", "null"]},
    "source": {"type": ["string", "null"]}, "notes": {"type": ["string", "null"]}}}
schemas["implementation_task"] = {
  "title": "implementation_task", "type": "object", "additionalProperties": False,
  "required": ["id", "hypothesis_id", "baseline_commit", "parent_commit", "baseline_score", "single_hypothesis", "what_to_change", "why", "mechanism", "observed_failure", "predicted_metric_direction", "rollback_condition", "evidence_ids", "constraints", "acceptance_criteria", "measure", "created_at"],
  "properties": {
    "id": {"type": "string", "pattern": r"^TASK-[0-9]{4}$"},
    "hypothesis_id": {"type": "string"}, "experiment_id": {"type": ["string", "null"]},
    "baseline_commit": {"type": "string"}, "baseline_score": {"type": "number"},
    "branch": {"type": ["string", "null"]},
    "what_to_change": {"type": "string"}, "why": {"type": "string"},
    "evidence_ids": strs, "related_experiments": strs, "known_failures": strs,
    "constraints": strs, "acceptance_criteria": strs, "measure": {"type": "string"},
    "time_budget_min": {"type": "integer"}, "created_at": ts,
    "parent_commit": {"type": "string"}, "single_hypothesis": {"type": "string"},
    "observed_failure": {"type": ["string", "null"]}, "mechanism": {"type": "string"},
    "predicted_metric_direction": {"type": "string"}, "rollback_condition": {"type": "string"},
    "failure_classes": fclasses, "owner": {"type": "string"}, "changed_files": strs}}
finding = {"type": "object", "additionalProperties": False, "required": ["severity", "title", "detail", "file", "line"],
  "properties": {"severity": {"type": "string", "enum": ["critical", "major", "minor"]}, "title": {"type": "string"}, "detail": {"type": "string"},
                 "file": {"type": ["string", "null"]}, "line": {"type": ["integer", "null"]}}}
schemas["codex_review"] = {
  "title": "codex_review", "description": "Independent read-only review. status=unavailable/error/timeout is NOT a pass.",
  "type": "object", "additionalProperties": False,
  "required": ["id", "status", "verdict", "base_commit", "candidate_commit", "hypothesis_id", "findings", "timestamp"],
  "properties": {
    "id": {"type": "string", "pattern": r"^REV-[0-9]{4}$"},
    "experiment_id": {"type": ["string", "null"]},
    "status": {"type": "string", "enum": ["completed", "unavailable", "timeout", "error", "not_run"]},
    "verdict": {"type": "string", "enum": ["pass", "block", "none"]},
    "base_commit": {"type": "string"}, "candidate_commit": {"type": "string"},
    "hypothesis_id": {"type": ["string", "null"]},
    "findings": {"type": "array", "items": finding},
    "summary": {"type": ["string", "null"]}, "reason": {"type": ["string", "null"]},
    "fallback_policy": {"type": ["string", "null"]}, "duration_s": {"type": ["number", "null"]},
    "model": {"type": ["string", "null"]}, "synthetic": {"type": "boolean"}, "timestamp": ts}}
schemas["codex_output"] = {
  "title": "codex_output", "description": "What codex exec must return (strict structured output). Wrapped into codex_review by codex_review.sh.",
  "type": "object", "additionalProperties": False, "required": ["verdict", "summary", "findings"],
  "properties": {"verdict": {"type": "string", "enum": ["pass", "block"]}, "summary": {"type": "string"},
                 "findings": {"type": "array", "items": finding}}}
check = {"type": "object", "required": ["status"], "properties": {
    "status": {"type": "string", "enum": ["pass", "fail", "pending", "not_run", "unknown"]},
    "p99_ms": {"type": ["number", "null"]}, "note": {"type": ["string", "null"]}}}
schemas["experiment_result"] = {
  "title": "experiment_result", "type": "object", "additionalProperties": False,
  "required": ["id", "hypothesis_id", "change", "evidence_ids", "related_experiments", "baseline_commit", "candidate_commit", "agent", "kit_check", "codex_review", "submission", "score", "outcome", "lesson", "next_action", "created_at"],
  "properties": {
    "id": {"type": "string", "pattern": r"^EXP-[0-9]{4}$"},
    "label": {"type": ["string", "null"]},
    "hypothesis_id": {"type": ["string", "null"]},
    "change": {"type": "string"}, "evidence_ids": strs, "related_experiments": strs,
    "repeat_reason": {"type": ["string", "null"]},
    "baseline_commit": sha, "baseline_score": {"type": ["number", "null"]},
    "candidate_commit": {"type": "string", "pattern": "^[0-9a-f]{7,40}$"},
    "branch": {"type": ["string", "null"]}, "pr": {"type": ["integer", "null"]},
    "agent": {"type": "string"},
    "kit_check": check,
    "codex_review": {"type": "object", "required": ["status"], "properties": {
        "status": {"type": "string", "enum": ["completed", "unavailable", "timeout", "error", "not_run"]},
        "verdict": {"type": "string", "enum": ["pass", "block", "none"]}, "review_id": {"type": ["string", "null"]}}},
    "submission": {"type": "object", "required": ["id", "timestamp"], "properties": {
        "id": {"type": ["string", "null"]}, "timestamp": {"type": ["string", "null"]}}},
    "score": {"type": ["number", "null"]}, "delta_vs_baseline": {"type": ["number", "null"]},
    "metrics": {"type": "object"},
    "evaluation": {"type": "object", "properties": {"type": {"type": "string"}, "n_matches": {"type": ["integer", "null"]},
        "deterministic": {"type": ["boolean", "null"]}, "comparable": {"type": ["boolean", "null"]}, "note": {"type": ["string", "null"]},
        "per_match_data": {"type": "string", "enum": ["none", "available"], "description": "'none' = NO PER-MATCH OFFICIAL DATA (aggregate score only)"}}},
    "outcome": {"type": "string", "enum": ["candidate", "submitted", "keep", "adopted", "loss", "tie", "inconclusive", "baseline", "blocked", "abandoned"]},
    "lesson": {"type": ["string", "null"]}, "next_action": {"type": ["string", "null"]},
    "failure_classes": fclasses,
    "backfilled": {"type": "boolean"}, "synthetic": {"type": "boolean"},
    "created_at": ts, "updated_at": {"type": ["string", "null"]}}}
schemas["champion_state"] = {
  "title": "champion_state", "type": "object", "additionalProperties": False,
  "required": ["experiment_id", "commit", "score", "submission_id", "updated_at", "history"],
  "properties": {
    "experiment_id": {"type": "string"}, "commit": {"type": "string"}, "merge_commit": {"type": ["string", "null"]},
    "branch": {"type": "string"}, "score": {"type": "number"}, "submission_id": {"type": ["string", "null"]},
    "target_score": {"type": "number"}, "updated_at": ts,
    "history": {"type": "array", "items": {"type": "object", "required": ["experiment_id", "commit", "score", "at"]}}}}
schemas["evidence_record"] = {
  "title": "evidence_record", "description": "Line format of data/evidence.jsonl: a watcher_event, an ingested research_finding, or a validated experiment fact.",
  "type": "object", "required": ["id", "evidence_class", "timestamp"],
  "properties": {"id": {"type": "string", "pattern": r"^EV-(W|R|V)-"}, "evidence_class": cls, "timestamp": ts}}
for k, v in schemas.items():
    v = {"$schema": S, "$id": f"{k}.json", **v}
    with open(OUT / f"{k}.json", "w") as f:
        json.dump(v, f, indent=1); f.write("\n")
print(sorted(schemas))
