#!/usr/bin/env python3
"""Deterministic administration fixture extending the task 015 API."""

from __future__ import annotations

import argparse
import importlib.util
import os
import sys
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.dont_write_bytecode = True

EVIDENCE_ROOT = Path(__file__).resolve().parent
TASKS_ROOT = EVIDENCE_ROOT.parent.parent
BASE_PATH = TASKS_ROOT / "015-organization-routes/evidence/mock_api.py"

spec = importlib.util.spec_from_file_location("task016_base_fixture", BASE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Cannot load fixture module: {BASE_PATH}")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

USERS = [
    {
        "id": 1,
        "forge_id": 1,
        "forge_remote_id": "user-1",
        "login": "alice",
        "email": "alice@example.test",
        "avatar_url": "",
        "admin": True,
        "admin_env": False,
        "active": True,
        "org_id": 1,
    }
]
ORGS = [{"id": 1, "name": "acme", "is_user": False}]
AGENTS = [
    {
        "id": 21,
        "name": "agent-admin-1",
        "owner_id": 0,
        "org_id": 0,
        "token": "",
        "created": 1_786_410_000,
        "updated": 1_786_415_000,
        "last_contact": 1_786_415_300,
        "platform": "linux/amd64",
        "backend": "docker",
        "capacity": 4,
        "version": "3.9.0",
        "no_schedule": False,
        "custom_labels": {"pool": "administration"},
    }
]
QUEUE_INFO = {
    "pending": [
        {
            "id": 31,
            "pid": 2,
            "name": "backend-build",
            "labels": {"platform": "linux/amd64", "org-id": "1"},
            "dependencies": [],
            "dep_status": {},
            "run_on": [],
            "agent_id": 0,
            "agent_name": "",
            "pipeline_id": 8419,
            "pipeline_number": 842,
            "repo_id": 101,
        }
    ],
    "waiting_on_deps": [],
    "running": [],
    "stats": {
        "worker_count": 3,
        "pending_count": 1,
        "waiting_on_deps_count": 0,
        "running_count": 0,
        "completed_count": 418,
    },
    "paused": False,
}


class FixtureHandler(base.FixtureHandler):
    server_version = "Task016MockAPI/1.0"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        page = query.get("page", ["1"])[0]

        if path == "/":
            self.send_json(
                {
                    "fixture": "016-administration-routes",
                    "run_id": os.environ.get("TASK016_RUN_ID"),
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
                        "window.WOODPECKER_VERSION = '3.9.0-task016';",
                        "window.WOODPECKER_SKIP_VERSION_CHECK = true;",
                        "window.WOODPECKER_CSRF = 'task016-csrf';",
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

        if path == "/api/users":
            self.send_json(USERS if page == "1" else [])
            return

        if path == "/api/orgs":
            self.send_json(ORGS if page == "1" else [])
            return

        if path == "/api/agents":
            self.send_json(AGENTS if page == "1" else [])
            return

        if path == "/api/queue/info":
            self.send_json(QUEUE_INFO)
            return

        super().do_GET()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8162)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), FixtureHandler)
    print(f"task016 mock API listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()
