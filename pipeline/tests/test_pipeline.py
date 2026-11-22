"""Pipeline tests. Run: python3 pipeline/tests/test_pipeline.py
Every test works on a scratch COPY of pipeline/data (PIPELINE_DATA_DIR), so real
records are never touched. Anything marked SYNTHETIC is a fixture, not real data."""
import json, os, shutil, subprocess, sys, tempfile, unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
PIPE = HERE.parent
REPO = PIPE.parent
sys.path.insert(0, str(PIPE))
import lib  # noqa: E402

FIX = PIPE / "fixtures" / "synthetic"


def run(*args, env=None, check=True):
    e = dict(os.environ, **(env or {}))
    p = subprocess.run([sys.executable, str(PIPE / "q.py"), *args], capture_output=True, text=True, env=e)
    if check and p.returncode != 0:
        raise AssertionError(f"q.py {args} failed: {p.stdout}\n{p.stderr}")
    return p


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="pipetest-")
        shutil.copytree(PIPE / "data", self.tmp, dirs_exist_ok=True)
        os.environ["PIPELINE_DATA_DIR"] = self.tmp
        self.env = {"PIPELINE_DATA_DIR": self.tmp}

    def tearDown(self):
        os.environ.pop("PIPELINE_DATA_DIR", None)
        shutil.rmtree(self.tmp, ignore_errors=True)


class TestSchemas(Base):
    def test_real_data_valid(self):
        p = run("validate", env=self.env)
        self.assertIn("OK", p.stdout)

    def test_rejects_bad_records(self):
        self.assertTrue(lib.validate({"id": "HYP-1"}, "strategy_hypothesis"))
        bad = {"claim": "short", "topic": "nonsense", "sources": [], "confidence": 2, "suggested_change": ""}
        errs = lib.validate(bad, "research_finding")
        self.assertTrue(any("topic" in e for e in errs) and any("confidence" in e for e in errs))
        e = lib.read_jsonl("experiments.jsonl")[1]
        self.assertEqual(lib.validate(e, "experiment_result"), [])
        e2 = dict(e, failure_classes=[{"class": "BOGUS", "confidence": 0.5}])
        self.assertTrue(lib.validate(e2, "experiment_result"))

    def test_all_seven_contracts_exist(self):
        for n in ("watcher_event", "research_finding", "strategy_hypothesis", "implementation_task",
                  "codex_review", "experiment_result", "champion_state"):
            self.assertTrue((PIPE / "schemas" / f"{n}.json").exists(), n)


class TestResearchIntake(Base):
    def test_validate_dedupe_ingest(self):
        d = Path(self.tmp) / "intake"
        d.mkdir()
        shutil.copy(FIX / "diego-SYNTHETIC.json", d)
        p = run("ingest-research", "--dir", str(d), env=self.env)
        self.assertIn("1 added, 1 duplicates skipped, 1 rejected", p.stdout)
        p = run("ingest-research", "--dir", str(d), env=self.env)
        self.assertIn("0 added, 2 duplicates skipped", p.stdout)
        rc = [r for r in lib.read_jsonl("evidence.jsonl") if r.get("synthetic")]
        self.assertEqual(len(rc), 1)
        self.assertEqual(rc[0]["evidence_class"], "research_claim")
        self.assertTrue(rc[0]["id"].startswith("EV-R-"))

    def test_real_diego_file_already_ingested(self):
        p = run("ingest-research", "--dir", str(REPO / "research" / "intake"), env=self.env)
        self.assertIn("0 added", p.stdout)


class TestRepeatsAndSlots(Base):
    def test_tested_keyword(self):
        p = run("tested", "gun gate", env=self.env)
        self.assertIn("HYP-007 [failed]", p.stdout)
        self.assertIn("REPEAT WARNING", p.stdout)
        self.assertIn("NOT TESTED", run("tested", "xyzzy-nothing", env=self.env).stdout)

    def test_add_exp_refuses_repeat_without_reason(self):
        p = run("add-exp", "--hyp", "HYP-006", "--commit", "abcdef1", "--synthetic", env=self.env, check=False)
        self.assertEqual(p.returncode, 2)
        self.assertIn("REPEAT", p.stderr)
        p = run("add-exp", "--hyp", "HYP-006", "--commit", "abcdef1", "--repeat-reason", "SYNTHETIC: new mechanism", "--synthetic", env=self.env)
        self.assertTrue(p.stdout.strip().startswith("EXP-"))

    def test_refuses_scored_commit(self):
        p = run("add-exp", "--hyp", "HYP-010", "--commit", "209539f", "--synthetic", env=self.env, check=False)
        self.assertEqual(p.returncode, 2)

    def test_slot_counting(self):
        # real history: submissions at 22:10, 22:21, 22:32, 22:37 ET
        p = run("slots", env=dict(self.env, PIPELINE_NOW="2026-11-20T23:05:00-05:00"))
        self.assertTrue(p.stdout.startswith("4/4"))
        self.assertIn("23:10", p.stdout)
        p = run("slots", env=dict(self.env, PIPELINE_NOW="2026-11-20T23:15:00-05:00"))
        self.assertTrue(p.stdout.startswith("3/4"))


class TestPromotion(Base):
    def _cand(self, sha):
        eid = run("add-exp", "--hyp", "HYP-010", "--commit", sha, "--synthetic", "--repeat-reason", "synthetic test of promotion", env=self.env).stdout.strip()
        run("set-check", eid, "pass", "--p99", "1.0", env=self.env)
        return eid

    def test_failed_check_not_eligible_and_no_slot_used(self):
        eid = run("add-exp", "--hyp", "HYP-010", "--commit", "aaaaaaa", "--synthetic", "--repeat-reason", "synthetic test of eligibility", env=self.env).stdout.strip()
        run("set-check", eid, "fail", env=self.env)
        env = dict(self.env, PIPELINE_NOW="2026-11-21T01:00:00-05:00")
        p = run("eligible", eid, env=env, check=False)
        self.assertEqual(p.returncode, 1)
        self.assertIn("kit check", p.stdout)
        self.assertEqual(run("mark-submitted", eid, "--submission-id", "BB-SYNTH", env=env, check=False).returncode, 1)
        self.assertTrue(run("slots", env=env).stdout.startswith("0/"), run("slots", env=env).stdout)

    def test_lower_score_preserves_champion(self):
        eid = self._cand("bbbbbbb")
        bar = lib.read_json("champion.json")["score"]
        p = run("record-score", eid, "--score", str(round(bar - 0.08, 2)), "--failure", "NAV_STUCK:0.3", env=self.env)
        self.assertIn("LOSS", p.stdout)
        p = run("promote", eid, env=self.env, check=False)
        self.assertEqual(p.returncode, 1)
        self.assertEqual(lib.read_json("champion.json")["score"], bar)
        e = [x for x in lib.read_jsonl("experiments.jsonl") if x["id"] == eid][0]
        self.assertEqual(e["failure_classes"][0]["class"], "NAV_STUCK")
        self.assertEqual(e["evaluation"]["per_match_data"], "none")

    def test_equal_score_is_tie_not_promoted(self):
        eid = self._cand("ccccccc")
        bar = lib.read_json("champion.json")["score"]
        self.assertIn("TIE", run("record-score", eid, "--score", str(bar), env=self.env).stdout)
        self.assertEqual(run("promote", eid, env=self.env, check=False).returncode, 1)

    def test_higher_score_promotes(self):
        eid = self._cand("ddddddd")
        before = lib.read_json("champion.json")
        bar = before["score"]
        prev_id = before["experiment_id"]
        new_score = round(bar + 0.13, 2)
        self.assertIn("KEEP", run("record-score", eid, "--score", str(new_score), env=self.env).stdout)
        run("promote", eid, env=self.env)
        c = lib.read_json("champion.json")
        self.assertEqual((c["score"], c["commit"], c["experiment_id"]), (new_score, "ddddddd", eid))
        self.assertEqual(c["history"][-1]["experiment_id"], prev_id)
        self.assertEqual(c["history"][-1]["score"], bar)
        h = [x for x in lib.read_jsonl("hypotheses.jsonl") if x["id"] == "HYP-010"][0]
        self.assertEqual(h["status"], "adopted")


class TestTaskAndBrief(Base):
    def test_task_has_diego_fields(self):
        t = json.loads(run("task", "HYP-010", "--json", env=self.env).stdout)
        self.assertEqual(lib.validate(t, "implementation_task"), [])
        for k in ("parent_commit", "single_hypothesis", "observed_failure", "mechanism", "predicted_metric_direction", "rollback_condition"):
            self.assertTrue(t[k], k)
        self.assertEqual(t["parent_commit"], "100941f")

    def test_brief_sections(self):
        out = run("brief", env=self.env).stdout
        for s in ("GOAL", "Slots", "NO PER-MATCH OFFICIAL DATA", "Untested, ranked", "impact", "Contradictions"):
            self.assertIn(s, out)

    def test_priority_formula(self):
        import q
        sc, f = q.priority({"expected_gain": 0.5, "evidence_strength": 0.8, "recurrence": 0.5, "effort": 2, "test_burden": 1, "regression_risk": 0.5})
        self.assertAlmostEqual(sc, 0.5 * 0.8 * 0.5 / 3.5, places=4)


class TestCodex(Base):
    def _run(self, mode=None, required=False, missing=False):
        cfg = json.loads((PIPE / "config.json").read_text())
        cfg["codex_required"] = required
        cp = Path(self.tmp) / "config.json"
        cp.write_text(json.dumps(cfg))
        env = dict(os.environ, PIPELINE_CONFIG=str(cp), PIPELINE_DATA_DIR=self.tmp)
        env["CODEX_BIN"] = "/nonexistent/codex" if missing else str(FIX / "fake_codex.sh")
        if mode:
            env["FAKE_CODEX_MODE"] = mode
        p = subprocess.run(["bash", str(PIPE / "codex_review.sh"), "100941f", "beb9240", "HYP-008", "EXP-0009"],
                           capture_output=True, text=True, env=env, cwd=REPO)
        return p, json.loads(p.stdout.strip().splitlines()[-1])

    def test_unavailable_fallback(self):
        p, r = self._run(missing=True)
        self.assertEqual((p.returncode, r["status"], r["verdict"]), (0, "unavailable", "none"))
        e = [x for x in lib.read_jsonl("experiments.jsonl") if x["id"] == "EXP-0009"][0]
        self.assertEqual(e["codex_review"]["status"], "unavailable")

    def test_unavailable_required_exits_3(self):
        p, r = self._run(missing=True, required=True)
        self.assertEqual(p.returncode, 3)

    def test_synthetic_pass_and_critical_block(self):
        p, r = self._run(mode="pass")
        self.assertEqual((p.returncode, r["status"], r["verdict"]), (0, "completed", "pass"))
        p, r = self._run(mode="critical")
        self.assertEqual((p.returncode, r["verdict"]), (2, "block"))
        e = [x for x in lib.read_jsonl("experiments.jsonl") if x["id"] == "EXP-0009"][0]
        self.assertEqual(e["codex_review"]["verdict"], "block")
        env = dict(self.env, PIPELINE_NOW="2026-11-21T01:00:00-05:00")
        self.assertIn("verdict=block", run("eligible", "EXP-0009", env=env, check=False).stdout)

    def test_codex_error_recorded(self):
        p, r = self._run(mode="fail")
        self.assertEqual((p.returncode, r["status"]), (0, "error"))


class TestSiteEligibilityRecords(unittest.TestCase):
    """Read-only checks against saved coord/data/site_results.csv (no site calls)."""

    def test_checker_selects_p48(self):
        import q
        sha = q._current_champion_sha()
        self.assertTrue(sha.startswith("b9492c6f122c549c705b69402157f078b4a57857"), sha)
        c = q.champion()
        self.assertEqual(c["experiment_id"], "P48")
        self.assertEqual(c["score"], 3.75)
        self.assertEqual(c["submission_id"], "BB-5727119F")
        self.assertEqual(c.get("scorer_version"), "builders-4")
        self.assertEqual(c["scores_by_scorer"]["builders-3"]["score"], 4.44)
        self.assertEqual(c["scores_by_scorer"]["builders-3"]["submission_id"], "BB-94897D91")

    def test_rejected_p34_receipt_is_terminal(self):
        import q, csv
        path = REPO / "coord/data/site_results.csv"
        with path.open() as fh:
            rows = list(csv.DictReader(fh))
        rejected = [r for r in rows if (r.get("receipt_id") or "") == "BB-FB8CB5AE"]
        self.assertEqual(len(rejected), 1)
        self.assertEqual(rejected[0]["build_id"], "P34")
        self.assertEqual(q._verdict_token(rejected[0]), "REJECTED")
        self.assertTrue(q._row_is_rejected(rejected[0]))
        self.assertFalse(q._row_is_queued(rejected[0]))
        reasons = q.site_eligibility_reasons("0" * 40)
        self.assertFalse(any("BB-FB8CB5AE" in r or "pending official score: P34" in r for r in reasons))

    def test_queued_receipt_blocks_second_submission(self):
        import q, csv
        # Saved record: P53b BB-9617EF60 is PENDING with no score.
        path = REPO / "coord/data/site_results.csv"
        with path.open() as fh:
            rows = list(csv.DictReader(fh))
        queued = [r for r in rows if q._row_is_queued(r)]
        self.assertTrue(queued, "expected a queued receipt in the saved ledger")
        self.assertEqual(queued[0]["receipt_id"], "BB-9617EF60")
        reasons = q.site_eligibility_reasons("0" * 40)
        self.assertTrue(any("pending official score: P53b BB-9617EF60" in r for r in reasons), reasons)
        # Fixture: a rejected row plus a queued row — rejected must not hide the queue block.
        fake = [
            {"verdict": "REJECTED", "site_score": "", "build_id": "P34", "receipt_id": "BB-FB8CB5AE", "commit_sha": "c281bf59e6276ffda376cc84a0c95f620331485e"},
            {"verdict": "PENDING", "site_score": "", "build_id": "SYNTH", "receipt_id": "BB-SYNTHQUEUE", "commit_sha": "abc"},
        ]
        self.assertFalse(q._row_is_queued(fake[0]))
        self.assertTrue(q._row_is_queued(fake[1]))


if __name__ == "__main__":
    unittest.main(verbosity=2)
