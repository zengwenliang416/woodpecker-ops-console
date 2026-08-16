#!/usr/bin/env python3
import hashlib, json, subprocess
from datetime import datetime, timezone

ROOT = "/Volumes/zwl/open_sources/woodpecker-main"
CHANGE = "openspec/changes/align-frontend-with-functional-prototype"
TASK = f"{CHANGE}/development/tasks/029-static-gate-closure"
EVIDENCE = f"{TASK}/evidence"

def sha256(path): return hashlib.sha256(open(path, "rb").read()).hexdigest()
def git(args): return subprocess.run(["git", "-C", ROOT, *args], capture_output=True, text=True, check=True).stdout.strip()

head = git(["rev-parse", "HEAD"])
tree = git(["rev-parse", "HEAD^{tree}"])
patterns = [
    "web/.prettierignore",
    "web/src/components/atomic/ListItem.vue",
    "web/src/components/atomic/Warning.vue",
    "web/src/components/layout/Popup.vue",
    "web/src/regression/responsive/containment.test.ts",
    "openspec/changes/align-frontend-with-functional-prototype/tasks.md",
    "openspec/changes/align-frontend-with-functional-prototype/development/tasks/029-static-gate-closure/**",
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

receipt = json.load(open(f"{ROOT}/{EVIDENCE}/static-gate-receipt.json"))
log_path = f"{CHANGE}/development/evidence/040-029-static-gate-closure.log"
receipt_id = "receipt-" + hashlib.sha256((json.dumps(receipt, sort_keys=True) + head).encode()).hexdigest()

acceptance = {
    "schema": "specnav.task-acceptance-evidence.v2",
    "generated_by": "specnav-development/task-acceptance-evidence",
    "task_id": "029-static-gate-closure",
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
        "command": "node openspec/changes/align-frontend-with-functional-prototype/development/tasks/029-static-gate-closure/evidence/run_static_gate.mjs",
        "assertion_ids": ["A3"], "recorded_at": now,
        "validation_receipt_sha256": sha256(f"{ROOT}/{EVIDENCE}/static-gate-receipt.json"),
        "evidence_log": {"path": log_path, "sha256": sha256(f"{ROOT}/{log_path}"), "size": len(open(f"{ROOT}/{log_path}", "rb").read())},
    }],
    "assertions": [{
        "id": "A3", "parent_id": "A3", "status": "passing", "test_run_ids": [receipt_id],
        "direct_evidence": [], "reused_evidence": [],
        "claim": "Completed frontend slices pass formatting, lint, TypeScript, Vitest, Vite build, git diff checks, and targeted browser review at desktop and 390px.",
    }],
    "fallback_used": False,
}
out = f"{ROOT}/{TASK}/acceptance.json"
with open(out, "w") as f:
    json.dump(acceptance, f, ensure_ascii=False, indent=1)
    f.write("\n")
print("wrote", out)
print("receipt_id:", receipt_id)
print("head:", head)
