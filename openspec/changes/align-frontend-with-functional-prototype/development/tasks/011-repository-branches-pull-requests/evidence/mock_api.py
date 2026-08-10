#!/usr/bin/env python3
"""Deterministic repository-reference fixture for task 011 browser evidence."""

from __future__ import annotations

import argparse
import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse


REPO_ID = 101

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
    "last_pipeline_number": 842,
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


def pipeline(
    number: int,
    *,
    event: str,
    status: str,
    branch: str,
    ref: str,
    commit: str,
    message: str,
    title: str = "",
) -> dict[str, object]:
    created = 1_786_323_120 - (842 - number) * 900
    return {
        "id": number * 10,
        "number": number,
        "parent": 0,
        "event": event,
        "event_reason": [],
        "status": status,
        "created": created,
        "updated": created + 320,
        "started": created + 18,
        "finished": 0 if status == "running" else created + 320,
        "deploy_to": "",
        "commit": commit,
        "branch": branch,
        "message": message,
        "timestamp": created - 20,
        "ref": ref,
        "refspec": "",
        "clone_url": REPO["clone_url"],
        "title": title,
        "sender": "alice",
        "author": "alice",
        "author_avatar": "",
        "author_email": "alice@example.test",
        "forge_url": f"https://forge.example/acme/backend-api/pipelines/{number}",
        "reviewed_by": "",
        "reviewed": 0,
        "cancel_info": {
            "canceled_by_user": "",
            "canceled_by_step": "",
            "superseded_by": 0,
        },
        "version": "3.9.0-task011",
    }


PIPELINES = [
    pipeline(
        842,
        event="push",
        status="success",
        branch="main",
        ref="refs/heads/main",
        commit="a1b2c3d4e5f678901234567890abcdef12345678",
        message="stabilize repository reference views",
    ),
    pipeline(
        841,
        event="push",
        status="failure",
        branch="release/2026.08",
        ref="refs/heads/release/2026.08",
        commit="b2c3d4e5f678901234567890abcdef1234567890",
        message="prepare August release",
    ),
    pipeline(
        840,
        event="pull_request",
        status="running",
        branch="feature/pipeline-diagnostics",
        ref="refs/pull/42/merge",
        commit="c3d4e5f678901234567890abcdef1234567890ab",
        message="run diagnostics checks",
        title="Improve pipeline diagnostics",
    ),
    pipeline(
        839,
        event="pull_request_metadata",
        status="failure",
        branch="docs/reference-guide",
        ref="refs/merge-requests/7/from",
        commit="d4e5f678901234567890abcdef1234567890abcd",
        message="validate documentation updates",
        title="Update repository guide",
    ),
]

BRANCHES = ["main", "release/2026.08", "feature/pipeline-diagnostics", "docs/reference-guide"]
PULL_REQUESTS = [
    {"index": "42", "title": "Improve pipeline diagnostics"},
    {"index": "7", "title": "Update repository guide"},
    {"index": "105", "title": "Add deployment audit metadata"},
]


class FixtureHandler(BaseHTTPRequestHandler):
    server_version = "Task011MockAPI/1.0"

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

    def send_text(self, payload: str, content_type: str) -> None:
        body = payload.encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def page_one(self, values: list[object], query: dict[str, list[str]]) -> list[object]:
        return values if query.get("page", ["1"])[0] == "1" else []

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/":
            self.send_json({"fixture": "011-repository-branches-pull-requests", "repo_id": REPO_ID})
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
                        "window.WOODPECKER_VERSION = '3.9.0-task011';",
                        "window.WOODPECKER_SKIP_VERSION_CHECK = true;",
                        "window.WOODPECKER_CSRF = 'task011-csrf';",
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
        if path == f"/api/badges/{REPO_ID}/status.svg":
            self.send_text(
                '<svg xmlns="http://www.w3.org/2000/svg" width="86" height="20">'
                '<rect width="86" height="20" rx="3" fill="#1f9d55"/>'
                '<text x="43" y="14" text-anchor="middle" font-size="11" fill="white">passing</text>'
                "</svg>",
                "image/svg+xml",
            )
            return

        if path == f"/api/repos/{REPO_ID}/permissions":
            self.send_json(PERMISSIONS)
            return
        if path == f"/api/repos/{REPO_ID}":
            self.send_json(REPO)
            return
        if path == f"/api/repos/{REPO_ID}/pipelines":
            self.send_json(self.page_one(PIPELINES, query))
            return
        if path == f"/api/repos/{REPO_ID}/branches":
            self.send_json(self.page_one(BRANCHES, query))
            return
        if path == f"/api/repos/{REPO_ID}/pull_requests":
            self.send_json(self.page_one(PULL_REQUESTS, query))
            return
        if path == "/api/user/repos" or path == "/api/repos":
            self.send_json([REPO])
            return
        if path == "/api/user/feed":
            self.send_json([])
            return
        if path == "/api/forges/1":
            self.send_json({"id": 1, "type": "github", "url": "https://forge.example"})
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
    parser.add_argument("--port", default=8123, type=int)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), FixtureHandler)
    print(f"task011 mock API listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
