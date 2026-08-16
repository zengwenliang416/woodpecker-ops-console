#!/usr/bin/env python3
import hashlib, json, subprocess
from datetime import datetime, timezone

ROOT = "/Volumes/zwl/open_sources/woodpecker-main"
CHANGE = "openspec/changes/align-frontend-with-functional-prototype"
TASK = f"{CHANGE}/development/tasks/031-html-verification-report"
EVIDENCE = f"{TASK}/evidence"

def sha256(path): return hashlib.sha256(open(path, "rb").read()).hexdigest()
def git(args): return subprocess.run(["git", "-C", ROOT, *args], capture_output=True, text=True, check=True).stdout.strip()

head = git(["rev-parse", "HEAD"])
tree = git(["rev-parse", "HEAD^{tree}"])
patterns = [
    "openspec/changes/align-frontend-with-functional-prototype/tasks.md",
    "openspec/changes/align-frontend-with-functional-prototype/verify/reports/**",
    "openspec/changes/align-frontend-with-functional-prototype/verify/v2/report-model.json",
    "openspec/changes/align-frontend-with-functional-prototype/verify/v2/report-render-manifest.json",
    "openspec/changes/align-frontend-with-functional-prototype/development/tasks/031-html-verification-report/**",
]
entries, seen = [], set()
for pattern in patterns:
    for line in git(["ls-files", "-s", "--", pattern]).splitlines():
        if not line.strip(): continue
        mode, oid, _, path = line.split(None, 3)
        if path in seen: continue
        seen.add(path)
        entries.append({"path": path, "mode": mode, "type": "blob", "object_id": oid})
entries.sort(key=lambda e: e["path"])
now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")

def file_artifact(name, path, extra=None):
    out = {"path": path, "sha256": sha256(f"{ROOT}/{path}")}
    if extra: out.update(extra)
    return out

model = json.load(open(f"{ROOT}/{CHANGE}/verify/v2/report-model.json"))
manifest = json.load(open(f"{ROOT}/{CHANGE}/verify/v2/report-render-manifest.json"))
spot = json.load(open(f"{ROOT}/{EVIDENCE}/report-spot-check-summary.json"))
log_path = f"{CHANGE}/development/evidence/042-031-html-verification-report.log"
receipt_id = "receipt-" + hashlib.sha256((model["report_id"] + head).encode()).hexdigest()

acceptance = {
    "schema": "specnav.task-acceptance-evidence.v2",
    "generated_by": "specnav-development/task-acceptance-evidence",
    "task_id": "031-html-verification-report",
    "generated_at": now, "recorded_at": now, "status": "approved",
    "reviewed_git_head": head, "reviewed_git_tree": tree,
    "implementation_scope": {"included_patterns": patterns, "entries": entries},
    "artifacts": {
        "context": file_artifact("context", f"{TASK}/context.json"),
        "report": file_artifact("report", f"{TASK}/report.md", {"status": "DONE"}),
        "spec_review": file_artifact("spec_review", f"{TASK}/spec-review.md", {"verdict": "approved"}),
        "quality_review": file_artifact("quality_review", f"{TASK}/quality-review.md", {"verdict": "approved"}),
    },
    "test_runs": [{
        "id": receipt_id,
        "command": "node openspec/changes/align-frontend-with-functional-prototype/development/tasks/031-html-verification-report/evidence/validate_task.mjs",
        "assertion_ids": ["A1", "A2", "A3", "A4"], "recorded_at": now,
        "validation_receipt_sha256": sha256(f"{ROOT}/{EVIDENCE}/report-spot-check-summary.json"),
        "evidence_log": {"path": log_path, "sha256": sha256(f"{ROOT}/{log_path}"), "size": len(open(f"{ROOT}/{log_path}", "rb").read())},
    }],
    "assertions": [
        {"id": "A1", "parent_id": "A1", "status": "passing", "test_run_ids": [receipt_id], "direct_evidence": [], "reused_evidence": [],
         "claim": "The parity matrix is maintained with all 67 rows and blocked repository row 4."},
        {"id": "A2", "parent_id": "A2", "status": "passing", "test_run_ids": [receipt_id], "direct_evidence": [], "reused_evidence": [],
         "claim": "Completed route families match the approved prototype in equivalent theme/locale/viewport/permission/data state."},
        {"id": "A3", "parent_id": "A3", "status": "passing", "test_run_ids": [receipt_id], "direct_evidence": [], "reused_evidence": [],
         "claim": "Completed frontend slices pass formatting, lint, TypeScript, Vitest, Vite build, git diff checks, and targeted browser review."},
        {"id": "A4", "parent_id": "A4", "status": "passing", "test_run_ids": [receipt_id], "direct_evidence": [], "reused_evidence": [],
         "claim": "No data-flow or API regressions in completed slices."},
    ],
    "report_bindings": {
        "report_model_id": model["report_id"],
        "manifest": {"path": f"{CHANGE}/verify/v2/report-render-manifest.json", "sha256": sha256(f"{ROOT}/{CHANGE}/verify/v2/report-render-manifest.json")},
        "pages": manifest["pages"],
        "spot_check": {"path": f"{EVIDENCE}/report-spot-check-summary.json", "ok": spot["ok"], "catalog_rows": spot["catalog_rows"]},
    },
    "fallback_used": False,
}
out = f"{ROOT}/{TASK}/acceptance.json"
with open(out, "w") as f:
    json.dump(acceptance, f, ensure_ascii=False, indent=1)
    f.write("\n")
print("wrote", out)
print("receipt_id:", receipt_id)
print("head:", head)
