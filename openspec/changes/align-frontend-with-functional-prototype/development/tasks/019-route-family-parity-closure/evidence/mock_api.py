#!/usr/bin/env python3
"""Deterministic route-family fixture extending task 016 coverage."""

from __future__ import annotations

import argparse
import importlib.util
import os
import sys
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

sys.dont_write_bytecode = True

EVIDENCE_ROOT = Path(__file__).resolve().parent
TASKS_ROOT = EVIDENCE_ROOT.parent.parent
BASE_PATH = TASKS_ROOT / "016-administration-routes/evidence/mock_api.py"

spec = importlib.util.spec_from_file_location("task019_base_fixture", BASE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Cannot load fixture module: {BASE_PATH}")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)


class FixtureHandler(base.FixtureHandler):
    server_version = "Task019MockAPI/1.0"

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/":
            self.send_json(
                {
                    "fixture": "019-route-family-parity-closure",
                    "run_id": os.environ.get("TASK019_RUN_ID"),
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
                        "window.WOODPECKER_VERSION = '3.9.0-task019';",
                        "window.WOODPECKER_SKIP_VERSION_CHECK = true;",
                        "window.WOODPECKER_CSRF = 'task019-csrf';",
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
        super().do_GET()

    def do_POST(self) -> None:
        if urlparse(self.path).path == "/api/user/token":
            self.send_json("task017-personal-token")
            return
        super().do_POST()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8192)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), FixtureHandler)
    print(f"task019 mock API listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()
