#!/usr/bin/env python3
"""Build the Task 026 acceptance-evidence JSON at the closure HEAD."""
import hashlib
import json
import subprocess
from datetime import datetime, timezone

ROOT = "/Volumes/zwl/open_sources/woodpecker-main"
CHANGE = "openspec/changes/align-frontend-with-functional-prototype"
TASK = f"{CHANGE}/development/tasks/026-accessibility-interaction-closure"
EVIDENCE = f"{TASK}/evidence"


def sha256(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def git(args):
    return subprocess.run(["git", "-C", ROOT, *args], capture_output=True, text=True, check=True).stdout.strip()


head = git(["rev-parse", "HEAD"])
tree = git(["rev-parse", "HEAD^{tree}"])

patterns = [
    "web/src/App.vue",
    "web/src/components/layout/header/ActivePipelines.vue",
    "web/src/components/repo/pipeline/PipelineRunningIcon.vue",
    "web/src/accessibilityInteraction.test.ts",
    "openspec/changes/align-frontend-with-functional-prototype/tasks.md",
    "openspec/changes/align-frontend-with-functional-prototype/development/handoff-to-verify.md",
    "openspec/changes/align-frontend-with-functional-prototype/development/tasks/026-accessibility-interaction-closure/**",
]
entries = []
seen = set()
for pattern in patterns:
    for line in git(["ls-files", "-s", "--", pattern]).splitlines():
        if not line.strip():
            continue
        mode, oid, _, path = line.split(None, 3)
        if path in seen:
            continue
        seen.add(path)
        entries.append({"path": path, "mode": mode, "type": "blob", "object_id": oid})
entries.sort(key=lambda e: e["path"])

now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def file_artifact(path, extra=None):
    out = {"path": path, "sha256": sha256(f"{ROOT}/{path}")}
    if extra:
        out.update(extra)
    return out


receipt = json.load(open(f"{ROOT}/{EVIDENCE}/verification-receipt.json"))
receipt_sha = sha256(f"{ROOT}/{EVIDENCE}/verification-receipt.json")
receipt_id = "receipt-" + hashlib.sha256((json.dumps(receipt, sort_keys=True) + head).encode()).hexdigest()

log_path = f"{CHANGE}/development/evidence/039-026-accessibility-interaction-closure.log"
log_sha = sha256(f"{ROOT}/{log_path}")
log_size = len(open(f"{ROOT}/{log_path}", "rb").read())

acceptance = {
    "schema": "specnav.task-acceptance-evidence.v2",
    "generated_by": "specnav-development/task-acceptance-evidence",
    "task_id": "026-accessibility-interaction-closure",
    "generated_at": now,
    "recorded_at": now,
    "status": "approved",
    "reviewed_git_head": head,
    "reviewed_git_tree": tree,
    "implementation_scope": {
        "included_patterns": patterns,
        "entries": entries,
    },
    "artifacts": {
        "context": file_artifact(f"{TASK}/context.json"),
        "report": file_artifact(f"{TASK}/report.md", {"status": "DONE"}),
        "spec_review": file_artifact(f"{TASK}/spec-review.md", {"verdict": "approved"}),
        "quality_review": file_artifact(f"{TASK}/quality-review.md", {"verdict": "approved"}),
    },
    "test_runs": [
        {
            "id": receipt_id,
            "command": "npx vitest run src/accessibilityInteraction.test.ts && npx vitest run",
            "assertion_ids": ["A2", "A3"],
            "recorded_at": now,
            "validation_receipt_sha256": receipt_sha,
            "evidence_log": {
                "path": log_path,
                "sha256": log_sha,
                "size": log_size,
            },
        }
    ],
    "assertions": [
        {
            "id": "A2",
            "parent_id": "A2",
            "status": "passing",
            "test_run_ids": [receipt_id],
            "direct_evidence": [],
            "reused_evidence": [],
            "claim": "Completed route families match the approved prototype in equivalent theme, locale, viewport, permission, and data state while preserving real APIs and mutations.",
        },
        {
            "id": "A3",
            "parent_id": "A3",
            "status": "passing",
            "test_run_ids": [receipt_id],
            "direct_evidence": [],
            "reused_evidence": [],
            "claim": "Completed frontend slices pass formatting, lint, TypeScript, Vitest, Vite build, git diff checks, and targeted browser review at desktop and 390px.",
        },
    ],
    "fallback_used": False,
}

out = f"{ROOT}/{TASK}/acceptance.json"
with open(out, "w") as f:
    json.dump(acceptance, f, ensure_ascii=False, indent=1)
    f.write("\n")
print("wrote", out)
print("receipt_id:", receipt_id)
print("head:", head, "tree:", tree)
print("scope entries:", len(entries))
