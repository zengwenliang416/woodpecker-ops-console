#!/usr/bin/env python3
"""Deterministic cross-family fixture for task 027 responsive containment audit.

Extends the task 016 fixture chain (009 -> 014 -> 015 -> 016) with the
overview, user-token, infrastructure, and deployment endpoints needed to load
populated states for every completed route family at three viewports.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
from copy import deepcopy
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.dont_write_bytecode = True

EVIDENCE_ROOT = Path(__file__).resolve().parent
TASKS_ROOT = EVIDENCE_ROOT.parent.parent
BASE_PATH = TASKS_ROOT / "016-administration-routes/evidence/mock_api.py"

spec = importlib.util.spec_from_file_location("task027_base_fixture", BASE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Cannot load fixture module: {BASE_PATH}")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

NOW = 1_786_582_800
REPO_ID = 101
ORG_ID = getattr(base, 'ORG_ID', 1)


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
        "version": "3.9.0-task027",
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

FEED = [deepcopy(PIPELINES[0]), deepcopy(PIPELINES[3])]

USERS = [
    {"id": 1, "forge_id": 1, "forge_remote_id": "user-1", "login": "alice", "email": "alice@example.test", "avatar_url": "", "admin": True, "admin_env": False, "active": True, "org_id": 1},
    {"id": 2, "forge_id": 1, "forge_remote_id": "user-2", "login": "bob", "email": "bob@example.test", "avatar_url": "", "admin": False, "admin_env": False, "active": True, "org_id": 1},
    {"id": 3, "forge_id": 1, "forge_remote_id": "user-3", "login": "carol", "email": "carol@example.test", "avatar_url": "", "admin": False, "admin_env": False, "active": True, "org_id": 1},
    {"id": 4, "forge_id": 2, "forge_remote_id": "user-4", "login": "dave", "email": "dave@example.test", "avatar_url": "", "admin": False, "admin_env": False, "active": False, "org_id": 1},
    {"id": 5, "forge_id": 2, "forge_remote_id": "user-5", "login": "erin", "email": "erin@example.test", "avatar_url": "", "admin": False, "admin_env": False, "active": True, "org_id": 1},
]

AGENTS = [
    {"id": 21, "name": "linux-amd64-01", "owner_id": 0, "org_id": 0, "token": "", "created": NOW - 100_000, "updated": NOW - 30, "last_contact": NOW - 30, "platform": "linux/amd64", "backend": "docker", "capacity": 4, "version": "3.9.0", "no_schedule": False, "custom_labels": {"region": "cn-east"}},
    {"id": 22, "name": "linux-arm64-02", "owner_id": 0, "org_id": 0, "token": "", "created": NOW - 80_000, "updated": NOW - 120, "last_contact": NOW - 120, "platform": "linux/arm64", "backend": "docker", "capacity": 2, "version": "3.9.0", "no_schedule": False, "custom_labels": {"region": "cn-east"}},
    {"id": 23, "name": "windows-amd64-03", "owner_id": 0, "org_id": 0, "token": "", "created": NOW - 60_000, "updated": NOW - 300, "last_contact": NOW - 300, "platform": "windows/amd64", "backend": "docker", "capacity": 8, "version": "3.9.0", "no_schedule": False, "custom_labels": {"region": "cn-east"}},
    {"id": 24, "name": "linux-amd64-04", "owner_id": 0, "org_id": 0, "token": "", "created": NOW - 40_000, "updated": NOW - 15, "last_contact": NOW - 15, "platform": "linux/amd64", "backend": "docker", "capacity": 4, "version": "3.9.0", "no_schedule": True, "custom_labels": {"region": "cn-west"}},
]

INFRA_OVERVIEW = {"servers": 4, "groups": 2, "services": 2, "alerts": 5, "online": 3, "warning": 1, "offline": 0, "maintenance": 0}

INFRA_SERVERS = [
    {"id": 201, "group_id": 1, "environment_id": 1, "name": "prod-api-01", "region": "asia-southeast-1", "zone": "sgp-1a", "private_ip": "10.20.1.11", "public_ip": "203.0.113.11", "os": "Ubuntu 24.04", "kernel": "6.8.0-40-generic", "runtime": "Docker 27.1", "agent_version": "1.2.0", "cert_serial": "WP-201-2026", "status": "online", "health": "healthy", "cpu": 31, "memory": 48, "disk": 62, "load": 1.24, "uptime_seconds": 4_147_200, "last_heartbeat": NOW - 5, "current_release_id": 302, "maintenance": False, "labels": {"production": "true", "role": "api", "region": "singapore"}, "metrics": {"cpu": [22, 28, 25, 31, 36, 29, 33, 31], "memory": [43, 44, 45, 44, 46, 47, 48, 48], "disk": [58, 58, 59, 59, 60, 60, 61, 62], "network": [18, 22, 19, 31, 26, 35, 29, 32]}},
    {"id": 202, "group_id": 1, "environment_id": 1, "name": "prod-api-02", "region": "asia-southeast-1", "zone": "sgp-1b", "private_ip": "10.20.1.12", "public_ip": "203.0.113.12", "os": "Ubuntu 24.04", "kernel": "6.8.0-40-generic", "runtime": "Docker 27.1", "agent_version": "1.2.0", "status": "online", "health": "warning", "cpu": 72, "memory": 81, "disk": 86, "load": 3.92, "uptime_seconds": 3_542_400, "last_heartbeat": NOW - 7, "current_release_id": 301, "maintenance": False, "labels": {"production": "true", "role": "api"}, "metrics": {"cpu": [42, 51, 48, 63, 58, 71, 68, 72], "memory": [62, 65, 68, 69, 73, 75, 79, 81], "disk": [80, 81, 81, 82, 83, 84, 85, 86], "network": [26, 31, 33, 42, 38, 47, 45, 46]}},
    {"id": 204, "group_id": 2, "environment_id": 1, "name": "prod-web-01", "region": "asia-southeast-1", "zone": "sgp-1a", "private_ip": "10.20.2.21", "public_ip": "203.0.113.21", "os": "Ubuntu 24.04", "kernel": "6.8.0-40-generic", "runtime": "Docker 27.1", "agent_version": "1.2.0", "status": "online", "health": "healthy", "cpu": 18, "memory": 34, "disk": 41, "load": 0.62, "uptime_seconds": 6_912_000, "last_heartbeat": NOW - 3, "current_release_id": 401, "maintenance": False, "labels": {"production": "true", "role": "web"}, "metrics": {"cpu": [12, 15, 14, 18, 21, 17, 19, 18], "memory": [28, 29, 31, 30, 33, 32, 34, 34], "disk": [38, 38, 39, 40, 40, 41, 41, 41], "network": [9, 12, 11, 15, 13, 16, 14, 15]}},
    {"id": 205, "group_id": 2, "environment_id": 2, "name": "staging-web-01", "region": "asia-southeast-1", "zone": "sgp-1b", "private_ip": "10.30.2.21", "public_ip": "203.0.113.31", "os": "Ubuntu 24.04", "kernel": "6.8.0-40-generic", "runtime": "Docker 27.1", "agent_version": "1.2.0", "status": "online", "health": "healthy", "cpu": 9, "memory": 22, "disk": 33, "load": 0.31, "uptime_seconds": 1_209_600, "last_heartbeat": NOW - 4, "current_release_id": 0, "maintenance": False, "labels": {"production": "false", "role": "web"}, "metrics": {"cpu": [6, 8, 7, 9, 10, 8, 9, 9], "memory": [18, 19, 20, 21, 22, 21, 22, 22], "disk": [29, 30, 31, 32, 32, 33, 33, 33], "network": [4, 5, 6, 5, 7, 6, 5, 6]}},
]

INFRA_GROUPS = [
    {"id": 1, "environment_id": 1, "name": "prod-api", "strategy": "rolling", "batch_size": 1},
    {"id": 2, "environment_id": 1, "name": "prod-web", "strategy": "rolling", "batch_size": 1},
]

INFRA_ALERTS = [
    {"id": 11, "server_id": 202, "environment_id": 1, "deployment_id": 142, "severity": "warning", "status": "open", "name": "disk-usage-high", "message": "Disk usage at or above 85% on prod-api-02", "created": NOW - 900, "updated": NOW - 900, "acknowledged": False, "resolved": False},
    {"id": 12, "server_id": 201, "environment_id": 1, "deployment_id": 0, "severity": "info", "status": "acknowledged", "name": "agent-heartbeat-restored", "message": "Agent heartbeat restored for prod-api-01", "created": NOW - 3_600, "updated": NOW - 3_400, "acknowledged": True, "resolved": False},
    {"id": 13, "server_id": 204, "environment_id": 1, "deployment_id": 141, "severity": "critical", "status": "open", "name": "deployment-failed", "message": "Deployment 141 failed on prod-web-01", "created": NOW - 300, "updated": NOW - 300, "acknowledged": False, "resolved": False},
    {"id": 14, "server_id": 0, "environment_id": 1, "deployment_id": 0, "severity": "info", "status": "resolved", "name": "queue-backlog-cleared", "message": "Pipeline queue backlog cleared", "created": NOW - 86_400, "updated": NOW - 84_600, "acknowledged": True, "resolved": True},
    {"id": 15, "server_id": 205, "environment_id": 2, "deployment_id": 0, "severity": "warning", "status": "open", "name": "memory-pressure", "message": "Memory usage above 75% on staging-web-01", "created": NOW - 1_800, "updated": NOW - 1_800, "acknowledged": False, "resolved": False},
]

DEPLOYMENTS = [
    {"id": 142, "application_id": 1, "environment_id": 1, "release_id": 302, "group_id": 1, "status": "failed", "phase": "failed", "strategy": "rolling", "batch_size": 1, "progress": 100, "created": NOW - 2_000, "updated": NOW - 1_700, "started": NOW - 1_900, "finished": NOW - 1_700, "cancel_info": {"canceled_by_user": "", "canceled_by_step": "", "superseded_by": 0}, "author": "alice", "triggered_by": "alice", "reviewed_by": "", "deployment_approvals": []},
    {"id": 141, "application_id": 1, "environment_id": 1, "release_id": 301, "group_id": 1, "status": "success", "phase": "completed", "strategy": "rolling", "batch_size": 1, "progress": 100, "created": NOW - 86_400, "updated": NOW - 86_000, "started": NOW - 86_300, "finished": NOW - 86_000, "cancel_info": {"canceled_by_user": "", "canceled_by_step": "", "superseded_by": 0}, "author": "alice", "triggered_by": "alice", "reviewed_by": "", "deployment_approvals": []},
    {"id": 140, "application_id": 2, "environment_id": 2, "release_id": 501, "group_id": 2, "status": "running", "phase": "deploying", "strategy": "rolling", "batch_size": 1, "progress": 40, "created": NOW - 600, "updated": NOW - 200, "started": NOW - 550, "finished": 0, "cancel_info": {"canceled_by_user": "", "canceled_by_step": "", "superseded_by": 0}, "author": "bob", "triggered_by": "bob", "reviewed_by": "", "deployment_approvals": []},
    {"id": 139, "application_id": 1, "environment_id": 2, "release_id": 300, "group_id": 2, "status": "paused", "phase": "paused", "strategy": "single", "batch_size": 1, "progress": 25, "created": NOW - 172_800, "updated": NOW - 171_600, "started": NOW - 172_600, "finished": 0, "cancel_info": {"canceled_by_user": "", "canceled_by_step": "", "superseded_by": 0}, "author": "alice", "triggered_by": "alice", "reviewed_by": "", "deployment_approvals": []},
]

DEPLOYMENT_DETAIL = {
    "deployment": deepcopy(DEPLOYMENTS[0]),
    "approvals": [],
    "targets": [
        {"deployment_id": 142, "server_id": 201, "status": "success", "phase": "completed", "exit_code": 0},
        {"deployment_id": 142, "server_id": 202, "status": "failed", "phase": "failed", "exit_code": 1},
    ],
}


GUEST = False


class FixtureHandler(base.FixtureHandler):
    server_version = "Task027MockAPI/1.0"

    @staticmethod
    def first_page(values: list[object], query: dict[str, list[str]]) -> list[object]:
        return values if query.get("page", ["1"])[0] == "1" else []

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/api/evidence/state":
            global GUEST
            role = query.get("role", ["admin"])[0]
            GUEST = role == "guest"
            self.send_json({"ok": True, "role": role})
            return

        if path == "/web-config.js":
            lines = [
                "window.WOODPECKER_VERSION = '3.9.0-task027';",
                "window.WOODPECKER_SKIP_VERSION_CHECK = true;",
                "window.WOODPECKER_CSRF = 'task027-csrf';",
                "window.WOODPECKER_ROOT_PATH = '';",
                "window.WOODPECKER_ENABLE_SWAGGER = false;",
                "window.WOODPECKER_USER_REGISTERED_AGENTS = true;",
                "window.WOODPECKER_MAX_PIPELINE_LOG_LINE_COUNT = 5000;",
                "window.WOODPECKER_DEFAULT_CONFIG_PATHS = ['.woodpecker.yml'];",
            ]
            if not GUEST:
                lines = [
                    "window.WOODPECKER_USER = {",
                    "  id: 1, forge_id: 1, forge_remote_id: 'user-1',",
                    "  login: 'alice', email: 'alice@example.test', avatar_url: '',",
                    "  admin: true, admin_env: false, active: true, org_id: 1",
                    "};",
                ] + lines
            self.send_text("\n".join(lines), "application/javascript; charset=utf-8")
            return

        if path == "/":
            self.send_json(
                {
                    "fixture": "027-responsive-containment-closure",
                    "run_id": os.environ.get("TASK027_RUN_ID"),
                    "repo_id": REPO_ID,
                }
            )
            return

        if path == "/api/user/repos":
            self.send_json(REPOS)
            return

        if path == "/api/repos":
            self.send_json(REPOS)
            return

        if path == "/api/user/feed":
            self.send_json(FEED)
            return

        if path == "/api/users":
            self.send_json(self.first_page(USERS, query))
            return

        if path == "/api/agents":
            self.send_json(self.first_page(AGENTS, query))
            return

        if path == "/api/user/token":
            self.send_json({"token": "task027-user-token", "created": NOW, "updated": NOW, "active": True})
            return

        if path == f"/api/repos/102/pipelines":
            self.send_json(self.first_page([PIPELINES[3], PIPELINES[4]], query))
            return

        if path == f"/api/repos/103/pipelines":
            self.send_json(self.first_page([PIPELINES[5], PIPELINES[6]], query))
            return

        if path == "/api/infrastructure/overview":
            self.send_json(INFRA_OVERVIEW)
            return

        if path == "/api/infrastructure/servers":
            self.send_json(self.first_page(INFRA_SERVERS, query))
            return

        if path == "/api/infrastructure/groups":
            self.send_json(self.first_page(INFRA_GROUPS, query))
            return

        if path == "/api/infrastructure/alerts":
            self.send_json(self.first_page(INFRA_ALERTS, query))
            return

        if path == "/api/deployments":
            self.send_json(self.first_page(DEPLOYMENTS, query))
            return

        if path == "/api/deployments/142":
            self.send_json(DEPLOYMENT_DETAIL)
            return

        if path == "/api/deployments/142/logs":
            self.send_json(
                [
                    {"id": 1, "server_id": 201, "time": NOW - 1_900, "level": "info", "message": "pulling image registry.example.test/backend-api:v302"},
                    {"id": 2, "server_id": 201, "time": NOW - 1_850, "level": "success", "message": "container backend-api-201 started"},
                    {"id": 3, "server_id": 202, "time": NOW - 1_800, "level": "warning", "message": "health check delayed on prod-api-02"},
                    {"id": 4, "server_id": 202, "time": NOW - 1_750, "level": "danger", "message": "container exited with code 1"},
                ]
            )
            return

        super().do_GET()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8272)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), FixtureHandler)
    print(f"task027 mock API listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()
