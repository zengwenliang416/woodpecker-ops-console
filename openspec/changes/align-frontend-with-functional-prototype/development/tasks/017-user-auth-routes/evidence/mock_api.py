#!/usr/bin/env python3
"""Deterministic user/auth fixture extending the task 015 API."""

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
BASE_PATH = TASKS_ROOT / "015-organization-routes/evidence/mock_api.py"

spec = importlib.util.spec_from_file_location("task017_base_fixture", BASE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Cannot load fixture module: {BASE_PATH}")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)


class FixtureHandler(base.FixtureHandler):
    server_version = "Task017MockAPI/1.0"

    def do_GET(self) -> None:
        if urlparse(self.path).path == "/":
            self.send_json(
                {
                    "fixture": "017-user-auth-routes",
                    "run_id": os.environ.get("TASK017_RUN_ID"),
                }
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
    parser.add_argument("--port", type=int, default=8172)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), FixtureHandler)
    print(f"task017 mock API listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()
