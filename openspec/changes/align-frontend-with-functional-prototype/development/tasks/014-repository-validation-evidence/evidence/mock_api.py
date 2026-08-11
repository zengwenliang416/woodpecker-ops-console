#!/usr/bin/env python3
"""Deterministic repository-family fixture for task 014 browser evidence."""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
from copy import deepcopy
from http import HTTPStatus
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.dont_write_bytecode = True


EVIDENCE_ROOT = Path(__file__).resolve().parent
TASKS_ROOT = EVIDENCE_ROOT.parent.parent


def load_fixture(name: str, relative_path: str):
    path = TASKS_ROOT / relative_path
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load fixture module: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


pipeline_fixture = load_fixture(
    "task014_pipeline_fixture",
    "009-pipeline-validation-evidence/evidence/mock_api.py",
)
settings_fixture = load_fixture(
    "task014_settings_fixture",
    "012-repository-manual-run-settings/evidence/mock_api.py",
)

REPO_ID = pipeline_fixture.REPO_ID
PIPELINE_NUMBER = pipeline_fixture.PIPELINE_NUMBER
ORG_ID = settings_fixture.ORG_ID

PERMISSIONS = {
    "pull": True,
    "push": True,
    "admin": True,
    "synced": 1_786_415_400,
}

REPO = deepcopy(settings_fixture.REPO)
REPO.update(
    {
        "last_pipeline_number": PIPELINE_NUMBER,
        "require_approval": "none",
        "approval_allowed_users": [],
        "cancel_previous_pipeline_events": ["push", "pull_request"],
    }
)

AVAILABLE_REPO = {
    **deepcopy(REPO),
    "active": False,
    "id": 0,
    "forge_remote_id": "repo-202",
    "owner": "acme",
    "name": "frontend-console",
    "full_name": "acme/frontend-console",
    "clone_url": "https://forge.example/acme/frontend-console.git",
    "forge_url": "https://forge.example/acme/frontend-console",
    "last_pipeline_number": 0,
}

PUSH_PIPELINE = deepcopy(pipeline_fixture.PIPELINE)
PULL_REQUEST_PIPELINE = deepcopy(pipeline_fixture.PIPELINE)
PULL_REQUEST_PIPELINE.update(
    {
        "id": 8_419,
        "number": 841,
        "event": "pull_request",
        "status": "success",
        "message": "feat: harden repository evidence",
        "branch": "feature/repository-evidence",
        "ref": "refs/pull/92/head",
        "refspec": "refs/pull/92/head:refs/remotes/origin/pr/92",
        "created": PUSH_PIPELINE["created"] - 2_400,
        "updated": PUSH_PIPELINE["updated"] - 2_100,
        "started": PUSH_PIPELINE["started"] - 2_400,
        "finished": PUSH_PIPELINE["finished"] - 2_100,
    }
)

PULL_REQUESTS = [
    {
        "index": "92",
        "title": "Harden repository validation evidence",
    },
    {
        "index": "87",
        "title": "Improve pipeline diagnostics",
    },
]

FORGES = [
    {
        "id": 1,
        "type": "github",
        "url": "https://forge.example",
        "client": "",
        "skip_verify": False,
    }
]

pipeline_fixture.PERMISSIONS = PERMISSIONS
pipeline_fixture.REPO = REPO
pipeline_fixture.PIPELINE = PUSH_PIPELINE
pipeline_fixture.RELEASES[0]["pipeline_id"] = PUSH_PIPELINE["id"]


class FixtureHandler(pipeline_fixture.FixtureHandler):
    server_version = "Task014MockAPI/1.0"

    @staticmethod
    def first_page(values: list[object], query: dict[str, list[str]]) -> list[object]:
        return values if query.get("page", ["1"])[0] == "1" else []

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/":
            self.send_json(
                {
                    "fixture": "014-repository-validation-evidence",
                    "run_id": os.environ.get("TASK014_RUN_ID"),
                    "repo_id": REPO_ID,
                    "pipeline_number": PIPELINE_NUMBER,
                    "permissions": PERMISSIONS,
                }
            )
            return

        if path == "/web-config.js":
            self.send_text(
                "\n".join(
                    [
                        "window.WOODPECKER_USER = {",
                        "  id: 1, forge_id: 1, forge_remote_id: 'user-1',",
                        "  login: 'alice', email: 'alice@example.test', avatar_url: '',",
                        "  admin: true, admin_env: false, active: true, org_id: 1",
                        "};",
                        "window.WOODPECKER_VERSION = '3.9.0-task014';",
                        "window.WOODPECKER_SKIP_VERSION_CHECK = true;",
                        "window.WOODPECKER_CSRF = 'task014-csrf';",
                        "window.WOODPECKER_ROOT_PATH = '';",
                        "window.WOODPECKER_ENABLE_SWAGGER = false;",
                        "window.WOODPECKER_USER_REGISTERED_AGENTS = true;",
                        "window.WOODPECKER_MAX_PIPELINE_LOG_LINE_COUNT = 5000;",
                        "window.WOODPECKER_DEFAULT_CONFIG_PATHS = ['.woodpecker.yml'];",
                    ]
                ),
                "application/javascript; charset=utf-8",
            )
            return

        if path == "/api/evidence/permissions":
            role = query.get("role", ["admin"])[0]
            PERMISSIONS["pull"] = role != "denied"
            PERMISSIONS["push"] = role in {"push", "admin"}
            PERMISSIONS["admin"] = role == "admin"
            self.send_json({"ok": True, "role": role, "permissions": PERMISSIONS})
            return

        if path == f"/api/repos/{REPO_ID}/permissions":
            self.send_json(PERMISSIONS)
            return

        if path == "/api/user/repos":
            repos = [REPO, AVAILABLE_REPO] if query.get("all", ["false"])[0] == "true" else [REPO]
            self.send_json(repos)
            return

        if path == "/api/repos":
            self.send_json([REPO])
            return

        if path == "/api/forges":
            self.send_json(self.first_page(FORGES, query))
            return

        if path == "/api/forges/1":
            self.send_json(FORGES[0])
            return

        if path == f"/api/repos/{REPO_ID}":
            self.send_json(REPO)
            return

        if path == f"/api/repos/{REPO_ID}/pipelines":
            self.send_json(self.first_page([PUSH_PIPELINE, PULL_REQUEST_PIPELINE], query))
            return

        if path == f"/api/repos/{REPO_ID}/branches":
            self.send_json(self.first_page(settings_fixture.BRANCHES, query))
            return

        if path == f"/api/repos/{REPO_ID}/pull_requests":
            self.send_json(self.first_page(PULL_REQUESTS, query))
            return

        if path == f"/api/repos/{REPO_ID}/secrets":
            self.send_json(self.first_page(settings_fixture.REPO_SECRETS, query))
            return

        if path == f"/api/orgs/{ORG_ID}/secrets":
            self.send_json(self.first_page(settings_fixture.ORG_SECRETS, query))
            return

        if path == "/api/secrets":
            self.send_json(self.first_page(settings_fixture.GLOBAL_SECRETS, query))
            return

        if path == f"/api/repos/{REPO_ID}/registries":
            self.send_json(self.first_page(settings_fixture.REPO_REGISTRIES, query))
            return

        if path == f"/api/orgs/{ORG_ID}/registries":
            self.send_json(self.first_page(settings_fixture.ORG_REGISTRIES, query))
            return

        if path == "/api/registries":
            self.send_json(self.first_page(settings_fixture.GLOBAL_REGISTRIES, query))
            return

        if path == f"/api/repos/{REPO_ID}/cron":
            self.send_json(self.first_page(settings_fixture.CRONS, query))
            return

        if path == "/api/signature/public-key":
            self.send_json("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITask014EvidenceKey")
            return

        if path == "/api/agents":
            self.send_json([])
            return

        if path == "/api/queue/info":
            self.send_json(
                {
                    "pending": [],
                    "waiting_on_deps": [],
                    "running": [],
                    "stats": {
                        "worker_count": 0,
                        "pending_count": 0,
                        "waiting_on_deps_count": 0,
                        "running_count": 0,
                        "completed_count": 0,
                    },
                    "paused": False,
                }
            )
            return

        if path == f"/api/badges/{REPO_ID}/status.svg":
            self.send_text(
                '<svg xmlns="http://www.w3.org/2000/svg" width="86" height="20">'
                '<rect width="86" height="20" rx="3" fill="#1f9d55"/>'
                '<text x="43" y="14" text-anchor="middle" font-size="11" fill="white">passing</text>'
                "</svg>",
                "image/svg+xml",
            )
            return

        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/repos":
            activated = deepcopy(AVAILABLE_REPO)
            activated.update({"active": True, "id": 202})
            self.send_json(activated)
            return

        if path == f"/api/repos/{REPO_ID}/pipelines":
            pipeline = deepcopy(PUSH_PIPELINE)
            pipeline.update({"id": 8_421, "number": 843, "status": "pending"})
            self.send_json(pipeline)
            return

        if path.endswith("/repair") or path.endswith("/run"):
            self.send_json({"ok": True})
            return

        super().do_POST()

    def do_PATCH(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith(f"/api/repos/{REPO_ID}"):
            self.send_json({"ok": True})
            return
        self.send_json({"error": "not found", "path": parsed.path}, HTTPStatus.NOT_FOUND)

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith(f"/api/repos/{REPO_ID}/") or path == f"/api/repos/{REPO_ID}":
            self.send_json({"ok": True})
            return
        super().do_DELETE()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8142, type=int)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), FixtureHandler)
    print(f"task014 mock API listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
