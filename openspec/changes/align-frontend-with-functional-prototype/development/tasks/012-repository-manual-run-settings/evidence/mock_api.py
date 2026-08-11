#!/usr/bin/env python3
"""Deterministic repository settings fixture for task 012 browser evidence."""

from __future__ import annotations

import argparse
import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse


REPO_ID = 101
ORG_ID = 1

PERMISSIONS = {
    "pull": True,
    "push": True,
    "admin": True,
    "synced": 1_786_415_400,
}

REPO = {
    "active": True,
    "id": REPO_ID,
    "forge_remote_id": "repo-101",
    "forge_id": 1,
    "scm": "git",
    "pr_enabled": True,
    "org_id": ORG_ID,
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
    "require_approval": "forks",
    "approval_allowed_users": ["release-manager"],
    "cancel_previous_pipeline_events": ["push", "pull_request"],
    "netrc_trusted": ["docker.io/library/alpine"],
    "config_extension_endpoint": "https://extensions.example/config",
    "config_extension_exclusive": False,
    "config_extension_netrc": True,
    "registry_extension_endpoint": "https://extensions.example/registry",
    "registry_extension_netrc": False,
    "secret_extension_endpoint": "https://extensions.example/secret",
    "secret_extension_netrc": False,
}

BRANCHES = ["main", "release/2026.08", "feature/pipeline-diagnostics", "docs/reference-guide"]

REPO_SECRETS = [
    {
        "id": "repo-secret-1",
        "repo_id": REPO_ID,
        "org_id": 0,
        "name": "DEPLOY_TOKEN",
        "value": "",
        "events": ["push", "manual"],
        "images": [],
        "note": "Production deployment credential",
    },
    {
        "id": "repo-secret-2",
        "repo_id": REPO_ID,
        "org_id": 0,
        "name": "NPM_TOKEN",
        "value": "",
        "events": ["push"],
        "images": ["node:*"],
        "note": "Package publishing",
    },
]

ORG_SECRETS = [
    {
        "id": "org-secret-1",
        "repo_id": 0,
        "org_id": ORG_ID,
        "name": "ORG_SIGNING_KEY",
        "value": "",
        "events": ["push", "tag"],
        "images": [],
        "note": "Inherited signing material",
    }
]

GLOBAL_SECRETS = [
    {
        "id": "global-secret-1",
        "repo_id": 0,
        "org_id": 0,
        "name": "GLOBAL_MIRROR",
        "value": "",
        "events": ["push"],
        "images": [],
        "note": "System mirror credential",
    }
]

REPO_REGISTRIES = [
    {
        "id": "repo-registry-1",
        "repo_id": REPO_ID,
        "org_id": 0,
        "address": "registry.example/acme",
        "username": "release-bot",
        "password": "",
        "readonly": False,
    }
]

ORG_REGISTRIES = [
    {
        "id": "org-registry-1",
        "repo_id": 0,
        "org_id": ORG_ID,
        "address": "ghcr.io/acme",
        "username": "org-reader",
        "password": "",
        "readonly": True,
    }
]

GLOBAL_REGISTRIES = [
    {
        "id": "global-registry-1",
        "repo_id": 0,
        "org_id": 0,
        "address": "docker.io",
        "username": "mirror-reader",
        "password": "",
        "readonly": True,
    }
]

CRONS = [
    {
        "id": 7,
        "name": "nightly-main",
        "branch": "main",
        "schedule": "0 2 * * *",
        "timezone": "UTC",
        "enabled": True,
        "next_exec": 1_786_492_800,
        "variables": {"SUITE": "nightly"},
    },
    {
        "id": 8,
        "name": "release-audit",
        "branch": "release/2026.08",
        "schedule": "30 6 * * 1",
        "timezone": "Asia/Shanghai",
        "enabled": False,
        "next_exec": 0,
        "variables": {},
    },
]


class FixtureHandler(BaseHTTPRequestHandler):
    server_version = "Task012MockAPI/1.0"

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

    @staticmethod
    def first_page(values: list[object], query: dict[str, list[str]]) -> list[object]:
        return values if query.get("page", ["1"])[0] == "1" else []

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/":
            self.send_json({"fixture": "012-repository-manual-run-settings", "repo_id": REPO_ID})
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
                        "window.WOODPECKER_VERSION = '3.9.0-task012';",
                        "window.WOODPECKER_SKIP_VERSION_CHECK = true;",
                        "window.WOODPECKER_CSRF = 'task012-csrf';",
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
            self.send_json([])
            return
        if path == f"/api/repos/{REPO_ID}/branches":
            self.send_json(self.first_page(BRANCHES, query))
            return
        if path == f"/api/repos/{REPO_ID}/secrets":
            self.send_json(self.first_page(REPO_SECRETS, query))
            return
        if path == f"/api/orgs/{ORG_ID}/secrets":
            self.send_json(self.first_page(ORG_SECRETS, query))
            return
        if path == "/api/secrets":
            self.send_json(self.first_page(GLOBAL_SECRETS, query))
            return
        if path == f"/api/repos/{REPO_ID}/registries":
            self.send_json(self.first_page(REPO_REGISTRIES, query))
            return
        if path == f"/api/orgs/{ORG_ID}/registries":
            self.send_json(self.first_page(ORG_REGISTRIES, query))
            return
        if path == "/api/registries":
            self.send_json(self.first_page(GLOBAL_REGISTRIES, query))
            return
        if path == f"/api/repos/{REPO_ID}/cron":
            self.send_json(self.first_page(CRONS, query))
            return
        if path == "/api/signature/public-key":
            self.send_json("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITask012EvidenceKey")
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
    print(f"task012 mock API listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
