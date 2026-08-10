#!/usr/bin/env python3
"""Deterministic HTTP fixture for task 009 browser evidence."""

from __future__ import annotations

import argparse
import base64
import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse


REPO_ID = 101
PIPELINE_NUMBER = 842

PERMISSIONS = {
    "pull": True,
    "push": True,
    "admin": True,
    "synced": 1_786_329_600,
}

REPO = {
    "active": True,
    "id": REPO_ID,
    "forge_remote_id": "repo-101",
    "forge_id": 1,
    "scm": "git",
    "pr_enabled": True,
    "org_id": 1,
    "owner": "acme",
    "name": "backend-api",
    "full_name": "acme/backend-api",
    "avatar_url": "",
    "forge_url": "https://forge.example/acme/backend-api",
    "clone_url": "https://forge.example/acme/backend-api.git",
    "default_branch": "main",
    "private": True,
    "trusted": {"network": False, "volumes": False, "security": False},
    "timeout": 60,
    "allow_pr": True,
    "allow_deploy": True,
    "config_file": ".woodpecker.yml",
    "visibility": "private",
    "last_pipeline_number": PIPELINE_NUMBER,
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

PIPELINE = {
    "id": 8_420,
    "number": PIPELINE_NUMBER,
    "parent": 0,
    "event": "push",
    "event_reason": [],
    "status": "failure",
    "errors": [
        {
            "type": "linter",
            "message": "The debug variable is declared but never used.",
            "data": {"file": "src/utils/email.ts", "field": "debug"},
            "is_warning": True,
        }
    ],
    "created": 1_786_323_120,
    "updated": 1_786_323_460,
    "started": 1_786_323_138,
    "finished": 1_786_323_460,
    "deploy_to": "",
    "commit": "a1b2c3d4e5f678901234567890abcdef12345678",
    "branch": "main",
    "message": "fix null handling in user route",
    "timestamp": 1_786_323_100,
    "ref": "refs/heads/main",
    "refspec": "",
    "clone_url": REPO["clone_url"],
    "title": "",
    "sender": "alice",
    "author": "alice",
    "author_avatar": "",
    "author_email": "alice@example.test",
    "forge_url": "https://forge.example/acme/backend-api/commit/a1b2c3d4e5",
    "reviewed_by": "",
    "reviewed": 0,
    "changed_files": [
        "src/routes/user.ts",
        "src/services/user-service.ts",
        "src/utils/email.ts",
        "tests/routes/user.test.ts",
        "package.json",
        "pnpm-lock.yaml",
    ],
    "cancel_info": {
        "canceled_by_user": "",
        "canceled_by_step": "",
        "superseded_by": 0,
    },
    "version": "3.9.0-task009",
    "workflows": [
        {
            "id": 1_001,
            "pipeline_id": 8_420,
            "pid": 1_001,
            "name": "build-and-test",
            "state": "failure",
            "environ": {"CI": "true", "NODE_ENV": "test"},
            "started": 1_786_323_138,
            "finished": 1_786_323_458,
            "agent_id": 21,
            "error": "Cleanup failed after the typecheck command exited with status 1.",
            "children": [
                {
                    "id": 2_001,
                    "uuid": "step-clone",
                    "pipeline_id": 8_420,
                    "pid": 2_010,
                    "ppid": 1_001,
                    "name": "Clone repository",
                    "state": "success",
                    "exit_code": 0,
                    "started": 1_786_323_138,
                    "finished": 1_786_323_170,
                    "type": "clone",
                },
                {
                    "id": 2_002,
                    "uuid": "step-install",
                    "pipeline_id": 8_420,
                    "pid": 2_020,
                    "ppid": 1_001,
                    "name": "Install dependencies",
                    "state": "success",
                    "exit_code": 0,
                    "started": 1_786_323_171,
                    "finished": 1_786_323_290,
                    "type": "commands",
                },
                {
                    "id": 2_003,
                    "uuid": "step-typecheck",
                    "pipeline_id": 8_420,
                    "pid": 2_030,
                    "ppid": 1_001,
                    "name": "Typecheck application",
                    "state": "failure",
                    "exit_code": 1,
                    "started": 1_786_323_291,
                    "finished": 1_786_323_458,
                    "error": "Command exited with status 1",
                    "type": "commands",
                },
            ],
        },
        {
            "id": 1_002,
            "pipeline_id": 8_420,
            "pid": 1_002,
            "name": "release-verification",
            "state": "skipped",
            "environ": {"TARGET_ENV": "staging"},
            "started": 1_786_323_459,
            "finished": 1_786_323_460,
            "agent_id": 21,
            "children": [
                {
                    "id": 2_004,
                    "uuid": "step-release",
                    "pipeline_id": 8_420,
                    "pid": 2_040,
                    "ppid": 1_002,
                    "name": "Verify release",
                    "state": "skipped",
                    "exit_code": 0,
                    "started": 1_786_323_459,
                    "finished": 1_786_323_460,
                    "type": "plugin",
                }
            ],
        },
    ],
}

CONFIG_TEXT = """when:
  event: [push, pull_request]

steps:
  install:
    image: node:22-alpine
    commands:
      - pnpm install --frozen-lockfile
  typecheck:
    image: node:22-alpine
    commands:
      - pnpm typecheck
"""


def encode_text(value: str) -> str:
    return base64.b64encode(value.encode("utf-8")).decode("ascii")


PIPELINE_CONFIG = [
    {
        "hash": "task009-config-a1b2c3d4",
        "name": ".woodpecker.yml",
        "data": encode_text(CONFIG_TEXT),
    }
]


def log_line(step_id: int, line: int, seconds: int, text: str, source_type: int = 0) -> dict[str, object]:
    return {
        "id": step_id * 100 + line,
        "step_id": step_id,
        "time": seconds,
        "line": line,
        "data": encode_text(text),
        "type": source_type,
    }


LOGS = {
    2_001: [
        log_line(2_001, 0, 0, "+ git clone https://forge.example/acme/backend-api.git"),
        log_line(2_001, 1, 2, "Repository cloned successfully"),
    ],
    2_002: [
        log_line(2_002, 0, 0, "+ pnpm install --frozen-lockfile"),
        log_line(2_002, 1, 14, "Packages: +842"),
        log_line(2_002, 2, 18, "Dependencies installed"),
    ],
    2_003: [
        log_line(2_003, 0, 0, "+ pnpm typecheck"),
        log_line(2_003, 1, 8, "src/routes/user.ts:42:15 - error TS2345", 1),
        log_line(
            2_003,
            2,
            8,
            "Argument of type 'string | undefined' is not assignable to parameter of type 'string'.",
            1,
        ),
        log_line(2_003, 3, 9, "Found 1 error in src/routes/user.ts", 1),
    ],
}

APPLICATIONS = [
    {
        "id": 1,
        "repo_id": REPO_ID,
        "name": "backend-api",
        "description": "Primary API service",
        "image": "registry.example/acme/backend-api",
        "runtime": "docker",
        "service": "backend-api",
        "health_path": "/health",
        "port": 8080,
        "owner_team": "platform",
    }
]

ENVIRONMENTS = [
    {
        "id": 1,
        "name": "staging",
        "title": "Staging",
        "protected": False,
        "approval_required": False,
        "minimum_approvers": 0,
        "auto_rollback": True,
        "domain": "staging.example.test",
        "color": "blue",
    }
]

RELEASES = [
    {
        "id": 301,
        "application_id": 1,
        "pipeline_id": 8_419,
        "version": "v2.4.0",
        "commit": "9f8e7d6c5b",
        "digest": "sha256:task009release",
        "image": "registry.example/acme/backend-api:v2.4.0",
        "author": "alice",
        "status": "ready",
    }
]


class FixtureHandler(BaseHTTPRequestHandler):
    server_version = "Task009MockAPI/1.0"

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"[mock-api] {self.address_string()} {fmt % args}", flush=True)

    def send_json(self, payload: object, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
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

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/":
            self.send_json(
                {
                    "fixture": "009-pipeline-validation-evidence",
                    "repo_id": REPO_ID,
                    "pipeline_number": PIPELINE_NUMBER,
                    "push": PERMISSIONS["push"],
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
                        "window.WOODPECKER_VERSION = '3.9.0-task009';",
                        "window.WOODPECKER_SKIP_VERSION_CHECK = true;",
                        "window.WOODPECKER_CSRF = 'task009-csrf';",
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
            push = query.get("push", ["1"])[0] not in {"0", "false", "no"}
            PERMISSIONS["push"] = push
            PERMISSIONS["admin"] = push
            self.send_json({"ok": True, "permissions": PERMISSIONS})
            return

        if path == f"/api/repos/{REPO_ID}/permissions":
            self.send_json(PERMISSIONS)
            return

        if path == f"/api/repos/{REPO_ID}":
            self.send_json(REPO)
            return

        if path == f"/api/repos/{REPO_ID}/pipelines":
            self.send_json([PIPELINE])
            return

        if path == f"/api/repos/{REPO_ID}/pipelines/{PIPELINE_NUMBER}":
            self.send_json(PIPELINE)
            return

        if path == f"/api/repos/{REPO_ID}/pipelines/{PIPELINE_NUMBER}/config":
            self.send_json(PIPELINE_CONFIG)
            return

        if path == f"/api/repos/{REPO_ID}/pipelines/{PIPELINE_NUMBER}/metadata":
            self.send_json(
                {
                    "repo": {"id": REPO_ID, "full_name": REPO["full_name"]},
                    "pipeline": {
                        "id": PIPELINE["id"],
                        "number": PIPELINE_NUMBER,
                        "commit": PIPELINE["commit"],
                        "event": PIPELINE["event"],
                    },
                    "fixture": "009-pipeline-validation-evidence",
                }
            )
            return

        if path.startswith(f"/api/repos/{REPO_ID}/logs/{PIPELINE_NUMBER}/"):
            try:
                step_id = int(path.rsplit("/", 1)[-1])
            except ValueError:
                self.send_json({"error": "invalid step"}, HTTPStatus.BAD_REQUEST)
                return
            self.send_json(LOGS.get(step_id, []))
            return

        if path == "/api/user/repos":
            self.send_json([REPO])
            return

        if path == "/api/repos":
            self.send_json([REPO])
            return

        if path == "/api/user/feed":
            self.send_json([])
            return

        if path == "/api/forges/1":
            self.send_json({"id": 1, "type": "github", "url": "https://forge.example"})
            return

        if path == "/api/applications":
            self.send_json(APPLICATIONS)
            return

        if path == "/api/environments":
            self.send_json(ENVIRONMENTS)
            return

        if path == "/api/releases":
            self.send_json(RELEASES)
            return

        if path == "/api/stream/events":
            self.send_response(HTTPStatus.NO_CONTENT)
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return

        self.send_json({"error": "not found", "path": path}, HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if path == f"/api/repos/{REPO_ID}/pipelines/{PIPELINE_NUMBER}":
            restarted = dict(PIPELINE)
            restarted.update({"id": 8_421, "number": 843, "status": "pending"})
            self.send_json(restarted)
            return
        if path in {
            f"/api/repos/{REPO_ID}/pipelines/{PIPELINE_NUMBER}/cancel",
            f"/api/repos/{REPO_ID}/pipelines/{PIPELINE_NUMBER}/approve",
            f"/api/repos/{REPO_ID}/pipelines/{PIPELINE_NUMBER}/decline",
        }:
            self.send_json({"ok": True})
            return
        self.send_json({"error": "not found", "path": path}, HTTPStatus.NOT_FOUND)

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith(f"/api/repos/{REPO_ID}/logs/{PIPELINE_NUMBER}/"):
            self.send_json({"ok": True})
            return
        self.send_json({"error": "not found", "path": parsed.path}, HTTPStatus.NOT_FOUND)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8123, type=int)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), FixtureHandler)
    print(f"task009 mock API listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
