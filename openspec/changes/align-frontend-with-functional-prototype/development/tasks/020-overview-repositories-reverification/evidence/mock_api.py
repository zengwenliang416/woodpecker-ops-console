#!/usr/bin/env python3
"""Deterministic Overview and Repositories fixture for task 020 evidence."""

from __future__ import annotations

import argparse
import json
import os
from copy import deepcopy
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from urllib.parse import parse_qs, urlparse


NOW = 1_786_582_800


def pipeline(number: int, status: str, repo_id: int, offset: int) -> dict[str, object]:
    started = NOW - offset
    finished = 0 if status in {"running", "pending"} else started + 385
    return {
        "id": 8_000 + number,
        "number": number,
        "parent": 0,
        "event": "push",
        "event_reason": [],
        "status": status,
        "errors": [],
        "created": started - 15,
        "updated": finished or NOW,
        "started": started,
        "finished": finished,
        "deploy_to": "production" if number % 2 == 0 else "staging",
        "commit": f"{number:040x}"[-40:],
        "branch": "main",
        "message": {
            "success": "publish verified release",
            "failure": "fix failing typecheck",
            "running": "build release candidate",
            "pending": "await available Agent",
        }[status],
        "timestamp": started - 30,
        "ref": "refs/heads/main",
        "refspec": "",
        "clone_url": f"https://forge.example/acme/repo-{repo_id}.git",
        "title": "",
        "sender": "alice",
        "author": "alice",
        "author_avatar": "",
        "author_email": "alice@example.test",
        "forge_url": f"https://forge.example/acme/repo-{repo_id}/commit/{number}",
        "reviewed_by": "",
        "reviewed": 0,
        "cancel_info": {"canceled_by_user": "", "canceled_by_step": "", "superseded_by": 0},
        "version": "3.9.0-task020",
        "repo_id": repo_id,
    }


PIPELINES = [
    pipeline(842, "failure", 101, 2_400),
    pipeline(841, "success", 101, 7_200),
    pipeline(840, "success", 101, 14_400),
    pipeline(632, "running", 102, 720),
    pipeline(631, "success", 102, 9_000),
    pipeline(455, "pending", 103, 240),
    pipeline(454, "success", 103, 18_000),
]


def repo(repo_id: int, name: str, visibility: str, last_pipeline: dict[str, object]) -> dict[str, object]:
    return {
        "active": True,
        "id": repo_id,
        "forge_remote_id": f"repo-{repo_id}",
        "forge_id": 1 if repo_id != 103 else 2,
        "scm": "git",
        "pr_enabled": True,
        "org_id": 1,
        "owner": "acme",
        "name": name,
        "full_name": f"acme/{name}",
        "avatar_url": "",
        "forge_url": f"https://forge.example/acme/{name}",
        "clone_url": f"https://forge.example/acme/{name}.git",
        "default_branch": "main",
        "private": visibility == "private",
        "trusted": {"network": False, "volumes": False, "security": False},
        "timeout": 60,
        "allow_pr": True,
        "allow_deploy": True,
        "config_file": ".woodpecker.yml",
        "visibility": visibility,
        "last_pipeline_number": last_pipeline["number"],
        "last_pipeline": deepcopy(last_pipeline),
        "require_approval": "none",
        "approval_allowed_users": [],
        "cancel_previous_pipeline_events": ["push"],
        "netrc_trusted": [],
        "config_extension_endpoint": "",
        "config_extension_exclusive": False,
        "config_extension_netrc": False,
        "registry_extension_endpoint": "",
        "registry_extension_netrc": False,
        "secret_extension_endpoint": "",
        "secret_extension_netrc": False,
    }


REPOS = [
    repo(101, "backend-api", "private", PIPELINES[0]),
    repo(102, "web-frontend", "internal", PIPELINES[3]),
    repo(103, "data-worker", "public", PIPELINES[5]),
]

FORGES = [
    {"id": 1, "type": "github", "url": "https://github.example", "client": "", "skip_verify": False},
    {"id": 2, "type": "gitlab", "url": "https://gitlab.example", "client": "", "skip_verify": False},
]

AGENTS = [
    {
        "id": 21,
        "name": "linux-amd64-01",
        "owner_id": 0,
        "org_id": 0,
        "token": "",
        "created": NOW - 100_000,
        "updated": NOW - 30,
        "last_contact": NOW - 30,
        "platform": "linux/amd64",
        "backend": "docker",
        "capacity": 4,
        "version": "3.9.0",
        "no_schedule": False,
        "custom_labels": {"region": "cn-east"},
    },
    {
        "id": 22,
        "name": "linux-arm64-02",
        "owner_id": 0,
        "org_id": 0,
        "token": "",
        "created": NOW - 80_000,
        "updated": NOW - 120,
        "last_contact": NOW - 120,
        "platform": "linux/arm64",
        "backend": "docker",
        "capacity": 2,
        "version": "3.9.0",
        "no_schedule": True,
        "custom_labels": {"region": "cn-south"},
    },
]

QUEUE = {
    "pending": [],
    "waiting_on_deps": [],
    "running": [],
    "stats": {
        "worker_count": 2,
        "pending_count": 1,
        "waiting_on_deps_count": 0,
        "running_count": 1,
        "completed_count": 48,
    },
    "paused": False,
}

STATE = {"role": "admin", "data": "populated", "requests": []}
STATE_LOCK = Lock()


class FixtureHandler(BaseHTTPRequestHandler):
    server_version = "Task020MockAPI/1.0"

    def log_message(self, _format: str, *_args: object) -> None:
        return

    def send_json(self, payload: object, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_text(self, payload: str, content_type: str, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = payload.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    @staticmethod
    def current() -> dict[str, object]:
        with STATE_LOCK:
            return {"role": STATE["role"], "data": STATE["data"]}

    @staticmethod
    def record(path: str) -> None:
        if path.startswith("/api/evidence/"):
            return
        with STATE_LOCK:
            STATE["requests"].append(path)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/":
            self.send_json(
                {
                    "fixture": "020-overview-repositories-reverification",
                    "run_id": os.environ.get("TASK020_RUN_ID"),
                    **self.current(),
                }
            )
            return

        if path == "/api/evidence/state":
            role = query.get("role", ["admin"])[0]
            data = query.get("data", ["populated"])[0]
            if role not in {"admin", "normal"} or data not in {"populated", "empty", "partial"}:
                self.send_json({"error": "invalid evidence state"}, HTTPStatus.BAD_REQUEST)
                return
            with STATE_LOCK:
                STATE.update({"role": role, "data": data, "requests": []})
            self.send_json({"ok": True, "role": role, "data": data})
            return

        if path == "/api/evidence/requests":
            with STATE_LOCK:
                requests = list(STATE["requests"])
            self.send_json({"requests": requests})
            return

        state = self.current()
        role = str(state["role"])
        data = str(state["data"])
        self.record(path)

        if path == "/web-config.js":
            admin = "true" if role == "admin" else "false"
            self.send_text(
                "\n".join(
                    [
                        "window.WOODPECKER_USER = {",
                        "  id: 1, forge_id: 1, forge_remote_id: 'user-1',",
                        "  login: 'alice', email: 'alice@example.test', avatar_url: '',",
                        f"  admin: {admin}, admin_env: false, active: true, org_id: 1",
                        "};",
                        "window.WOODPECKER_VERSION = '3.9.0-task020';",
                        "window.WOODPECKER_SKIP_VERSION_CHECK = true;",
                        "window.WOODPECKER_CSRF = 'task020-csrf';",
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

        if path == "/api/user/repos":
            self.send_json([] if data == "empty" else REPOS)
            return

        if path == "/api/repos":
            page = query.get("page", ["1"])[0]
            self.send_json([] if data == "empty" or page != "1" else REPOS)
            return

        if path == "/api/user/feed":
            self.send_json([] if data == "empty" else PIPELINES)
            return

        if path == "/api/forges":
            if data == "partial":
                self.send_json({"error": "Forge inventory unavailable"}, HTTPStatus.SERVICE_UNAVAILABLE)
            else:
                self.send_json(FORGES)
            return

        if path == "/api/agents":
            if data == "partial":
                self.send_json({"error": "Agent inventory unavailable"}, HTTPStatus.SERVICE_UNAVAILABLE)
            else:
                self.send_json(AGENTS)
            return

        if path == "/api/queue/info":
            self.send_json(QUEUE)
            return

        if path.startswith("/api/repos/") and path.endswith("/pipelines"):
            try:
                repo_id = int(path.split("/")[3])
            except (IndexError, ValueError):
                self.send_json({"error": "invalid repository"}, HTTPStatus.BAD_REQUEST)
                return
            rows = [item for item in PIPELINES if item["repo_id"] == repo_id]
            self.send_json(rows)
            return

        if path == "/api/stream/events":
            self.send_response(HTTPStatus.NO_CONTENT)
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return

        self.send_json({"error": "not found", "path": path}, HTTPStatus.NOT_FOUND)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8202, type=int)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), FixtureHandler)
    print(f"task020 mock API listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
