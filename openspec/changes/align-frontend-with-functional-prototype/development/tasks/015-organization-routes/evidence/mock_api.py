#!/usr/bin/env python3
"""Deterministic organization fixture extending the task 014 API."""

from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.dont_write_bytecode = True

EVIDENCE_ROOT = Path(__file__).resolve().parent
TASKS_ROOT = EVIDENCE_ROOT.parent.parent
BASE_PATH = TASKS_ROOT / "014-repository-validation-evidence/evidence/mock_api.py"

spec = importlib.util.spec_from_file_location("task015_base_fixture", BASE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Cannot load fixture module: {BASE_PATH}")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

ORG_ID = base.ORG_ID
ORG = {"id": ORG_ID, "name": "acme", "is_user": False}
ORG_PERMISSIONS = {"member": True, "admin": True}
ORG_AGENTS = [
    {
        "id": 17,
        "name": "agent-17",
        "owner_id": 0,
        "org_id": ORG_ID,
        "token": "",
        "created": 1_786_410_000,
        "updated": 1_786_415_000,
        "last_contact": 1_786_415_300,
        "platform": "linux/amd64",
        "backend": "docker",
        "capacity": 4,
        "version": "3.9.0",
        "no_schedule": False,
        "custom_labels": {"pool": "organization"},
    }
]


class FixtureHandler(base.FixtureHandler):
    server_version = "Task015MockAPI/1.0"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/":
            self.send_json(
                {
                    "fixture": "015-organization-routes",
                    "run_id": os.environ.get("TASK015_RUN_ID"),
                    "org_id": ORG_ID,
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
                        "window.WOODPECKER_VERSION = '3.9.0-task015';",
                        "window.WOODPECKER_SKIP_VERSION_CHECK = true;",
                        "window.WOODPECKER_CSRF = 'task015-csrf';",
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

        if path == f"/api/orgs/{ORG_ID}":
            self.send_json(ORG)
            return

        if path == f"/api/orgs/{ORG_ID}/permissions":
            self.send_json(ORG_PERMISSIONS)
            return

        if path == f"/api/orgs/{ORG_ID}/agents":
            self.send_json(ORG_AGENTS if query.get("page", ["1"])[0] == "1" else [])
            return

        super().do_GET()


if __name__ == "__main__":
    parser = base.argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8152)
    args = parser.parse_args()
    server = base.ThreadingHTTPServer((args.host, args.port), FixtureHandler)
    print(f"task015 mock API listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()
