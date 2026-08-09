# Route Parity Matrix

Status values: `not-started`, `in-progress`, `verified`, `blocked`.
Verification requires equivalent theme, locale, viewport, permission role, and
data state.

| # | Prototype route/state | Production route/state | Current assessment | Status |
| ---: | --- | --- | --- | --- |
| 1 | `#/login` | `/login` | Legacy route not parity-reviewed | not-started |
| 2 | `#/overview` | `/overview` | Rebuilt; equivalent-state re-review required | in-progress |
| 3 | `#/repos` | `/repos` | Rebuilt; equivalent-state re-review required | in-progress |
| 4 | `#/repos/add` | `/repos/add` | Legacy wizard not parity-reviewed | not-started |
| 5 | `#/repos/101` | `/repos/:repoId` | Legacy list structure | not-started |
| 6 | `#/repos/101/branches` | `/repos/:repoId/branches` | Legacy route | not-started |
| 7 | `#/repos/101/branches/main` | `/repos/:repoId/branches/:branch` | Legacy route | not-started |
| 8 | `#/repos/101/pull-requests` | `/repos/:repoId/pull-requests` | Legacy route | not-started |
| 9 | `#/repos/101/pull-requests/92` | `/repos/:repoId/pull-requests/:pullRequest` | Legacy route | not-started |
| 10 | `#/repos/101/manual` | `/repos/:repoId/manual` | Legacy route | not-started |
| 11 | `#/repos/101/pipeline/842` | `/repos/:repoId/pipeline/:pipelineId` | Largest CI visual gap | not-started |
| 12 | `#/repos/101/pipeline/842?tab=logs` | pipeline step/log state | Existing behavior, legacy structure | not-started |
| 13 | `#/repos/101/pipeline/842/changed-files` | `/repos/:repoId/pipeline/:pipelineId/changed-files` | Legacy route | not-started |
| 14 | `#/repos/101/pipeline/842/config` | `/repos/:repoId/pipeline/:pipelineId/config` | Legacy route | not-started |
| 15 | `#/repos/101/pipeline/842/errors` | `/repos/:repoId/pipeline/:pipelineId/errors` | Existing newer content, parity pending | not-started |
| 16 | `#/repos/101/pipeline/842/debug` | `/repos/:repoId/pipeline/:pipelineId/debug` | Existing newer content, parity pending | not-started |
| 17 | `#/repos/101/settings` | `/repos/:repoId/settings` | Legacy settings layout | not-started |
| 18 | `#/repos/101/settings/secrets` | `/repos/:repoId/settings/secrets` | Legacy settings layout | not-started |
| 19 | `#/repos/101/settings/registries` | `/repos/:repoId/settings/registries` | Legacy settings layout | not-started |
| 20 | `#/repos/101/settings/crons` | `/repos/:repoId/settings/crons` | Legacy settings layout | not-started |
| 21 | `#/repos/101/settings/badge` | `/repos/:repoId/settings/badge` | Legacy settings layout | not-started |
| 22 | `#/repos/101/settings/actions` | `/repos/:repoId/settings/actions` | Legacy settings layout | not-started |
| 23 | `#/repos/101/settings/extensions` | `/repos/:repoId/settings/extensions` | Legacy settings layout | not-started |
| 24 | `#/orgs/1` | `/orgs/:orgId` | Legacy route | not-started |
| 25 | `#/orgs/1/settings/secrets` | `/orgs/:orgId/settings/secrets` | Legacy settings layout | not-started |
| 26 | `#/orgs/1/settings/registries` | `/orgs/:orgId/settings/registries` | Legacy settings layout | not-started |
| 27 | `#/orgs/1/settings/agents` | `/orgs/:orgId/settings/agents` | Legacy settings layout | not-started |
| 28 | `#/admin` | `/admin` | Legacy info/settings layout | not-started |
| 29 | `#/admin/secrets` | `/admin/secrets` | Legacy settings layout | not-started |
| 30 | `#/admin/registries` | `/admin/registries` | Legacy settings layout | not-started |
| 31 | `#/admin/repos` | `/admin/repos` | Legacy settings layout | not-started |
| 32 | `#/admin/users` | `/admin/users` | Legacy settings layout | not-started |
| 33 | `#/admin/orgs` | `/admin/orgs` | Legacy settings layout | not-started |
| 34 | `#/admin/agents` | `/admin/agents` | Existing dense domain UI, parity pending | not-started |
| 35 | `#/admin/queue` | `/admin/queue` | Existing dense domain UI, parity pending | not-started |
| 36 | `#/admin/forges` | `/admin/forges` | Legacy settings layout | not-started |
| 37 | `#/admin/forges/1` | `/admin/forges/:forgeId` | Legacy settings layout | not-started |
| 38 | `#/admin/forges/create` | `/admin/forges/create` | Legacy form layout | not-started |
| 39 | `#/user` | `/user` | Legacy settings layout | not-started |
| 40 | `#/user/secrets` | `/user/secrets` | Legacy settings layout | not-started |
| 41 | `#/user/registries` | `/user/registries` | Legacy settings layout | not-started |
| 42 | `#/user/cli-and-api` | `/user/cli-and-api` | Legacy settings layout | not-started |
| 43 | `#/user/agents` | `/user/agents` | Legacy settings layout | not-started |
| 44 | `#/cli/auth` | `/cli/auth` | Legacy authorization state | not-started |
| 45 | unknown route | catch-all not-found route | Legacy not-found state | not-started |
| 46 | `#/infrastructure` | `/infrastructure` | Rebuilt; equivalent-state re-review required | in-progress |
| 47 | `#/infrastructure/servers` | `/infrastructure/servers` | Rebuilt; parity review incomplete | in-progress |
| 48 | `#/infrastructure/servers/201` | `/infrastructure/servers/:serverId` | Rebuilt; overview state pending review | in-progress |
| 49 | server tab `monitoring` | `?tab=monitoring` | Rebuilt; prior screenshot exists | in-progress |
| 50 | server tab `workloads` | `?tab=workloads` | Rebuilt; parity review incomplete | in-progress |
| 51 | server tab `deployments` | `?tab=deployments` | Rebuilt; parity review incomplete | in-progress |
| 52 | server tab `events` | `?tab=events` | Rebuilt; parity review incomplete | in-progress |
| 53 | server tab `settings` | `?tab=settings` | Rebuilt; parity review incomplete | in-progress |
| 54 | `#/infrastructure/groups` | `/infrastructure/groups` | Rebuilt; parity review incomplete | in-progress |
| 55 | `#/infrastructure/groups/1` | `/infrastructure/groups/:groupId` | Rebuilt; parity review incomplete | in-progress |
| 56 | `#/infrastructure/services` | `/infrastructure/services` | Rebuilt; parity review incomplete | in-progress |
| 57 | `#/infrastructure/alerts` | `/infrastructure/alerts` | Rebuilt; parity review incomplete | in-progress |
| 58 | `#/deployments` | `/deployments` | Rebuilt; parity review incomplete | in-progress |
| 59 | `#/deployments/new` | `/deployments/new` | Rebuilt five-step wizard; re-review required | in-progress |
| 60 | `#/deployments/142` | `/deployments/:deploymentId` | Rebuilt; visible time/data defect observed | in-progress |
| 61 | `#/deployments/approvals` | `/deployments/approvals` | Rebuilt; parity review incomplete | in-progress |
| 62 | `#/deployments/apps` | `/deployments/apps` | Rebuilt; parity review incomplete | in-progress |
| 63 | `#/deployments/apps/1` | `/deployments/apps/:applicationId` | Rebuilt; parity review incomplete | in-progress |
| 64 | `#/deployments/environments` | `/deployments/environments` | Rebuilt; parity review incomplete | in-progress |
| 65 | `#/deployments/environments/1` | `/deployments/environments/:environmentId` | Rebuilt; parity review incomplete | in-progress |
| 66 | `#/deployments/releases` | `/deployments/releases` | Rebuilt; parity review incomplete | in-progress |
| 67 | `#/deployments/policies` | `/deployments/policies` | Rebuilt; parity review incomplete | in-progress |
