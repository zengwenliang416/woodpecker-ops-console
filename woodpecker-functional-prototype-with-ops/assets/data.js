(function () {
  const repositories = [
    { id: 101, name: 'backend-api', owner: 'acme', forge: 'GitHub', branch: 'main', status: 'success', visibility: 'private', updated: '2 分钟前', duration: '2m 47s', successRate: 96.3, language: 'Go', team: 'Platform', description: 'Backend API service with Go and PostgreSQL', stars: 28 },
    { id: 102, name: 'web-frontend', owner: 'acme', forge: 'GitLab', branch: 'main', status: 'success', visibility: 'private', updated: '5 分钟前', duration: '3m 18s', successRate: 97.1, language: 'Vue', team: 'Frontend', description: 'Customer-facing Vue application', stars: 41 },
    { id: 103, name: 'worker-service', owner: 'acme', forge: 'GitHub', branch: 'develop', status: 'failure', visibility: 'private', updated: '12 分钟前', duration: '6m 07s', successRate: 88.9, language: 'Go', team: 'Backend', description: 'Asynchronous job processing service', stars: 12 },
    { id: 104, name: 'mobile-app', owner: 'acme', forge: 'Bitbucket', branch: 'main', status: 'success', visibility: 'private', updated: '18 分钟前', duration: '7m 41s', successRate: 94.0, language: 'React Native', team: 'Mobile', description: 'Cross-platform mobile application', stars: 18 },
    { id: 105, name: 'infrastructure', owner: 'acme', forge: 'GitHub', branch: 'main', status: 'warning', visibility: 'private', updated: '24 分钟前', duration: '2m 02s', successRate: 91.2, language: 'Terraform', team: 'DevOps', description: 'Infrastructure as code and cluster configuration', stars: 33 },
    { id: 106, name: 'data-pipeline', owner: 'acme', forge: 'GitLab', branch: 'main', status: 'success', visibility: 'private', updated: '31 分钟前', duration: '8m 52s', successRate: 95.3, language: 'Python', team: 'Data', description: 'Batch and streaming data processing jobs', stars: 19 },
    { id: 107, name: 'auth-service', owner: 'acme', forge: 'GitHub', branch: 'feature/oauth2', status: 'running', visibility: 'private', updated: '1 分钟前', duration: '—', successRate: 86.7, language: 'Rust', team: 'Platform', description: 'Authentication and authorization service', stars: 25 },
    { id: 108, name: 'marketing-site', owner: 'acme', forge: 'GitHub', branch: 'main', status: 'success', visibility: 'public', updated: '1 小时前', duration: '1m 34s', successRate: 99.2, language: 'Astro', team: 'Marketing', description: 'Public website and documentation landing pages', stars: 8 },
    { id: 109, name: 'reports-api', owner: 'acme', forge: 'GitLab', branch: 'main', status: 'failure', visibility: 'private', updated: '1 小时前', duration: '5m 21s', successRate: 84.5, language: 'Java', team: 'Backend', description: 'Reporting and export APIs', stars: 14 },
    { id: 110, name: 'legacy-monolith', owner: 'acme', forge: 'Bitbucket', branch: 'release/1.4', status: 'success', visibility: 'private', updated: '2 小时前', duration: '9m 03s', successRate: 92.8, language: 'Java', team: 'Backend', description: 'Legacy application maintained during migration', stars: 6 },
    { id: 111, name: 'shared-libraries', owner: 'acme', forge: 'GitHub', branch: 'main', status: 'success', visibility: 'public', updated: '3 小时前', duration: '1m 08s', successRate: 98.6, language: 'TypeScript', team: 'Platform', description: 'Shared internal packages and design tokens', stars: 52 },
    { id: 112, name: 'notification-service', owner: 'acme', forge: 'Gitea', branch: 'main', status: 'queued', visibility: 'private', updated: '刚刚', duration: '—', successRate: 93.1, language: 'Go', team: 'Backend', description: 'Email, SMS and webhook notifications', stars: 16 },
  ];

  const pipelines = [
    { id: 842, repoId: 101, status: 'failure', branch: 'main', event: 'push', author: 'alice', avatar: 'A', commit: 'a1b2c3d', message: 'fix: correct null check in user service', duration: '2m 47s', queued: '18s', finished: '2 分钟前', created: '2026-08-05 10:12:43', errors: 1, warnings: 2 },
    { id: 841, repoId: 101, status: 'success', branch: 'main', event: 'pull_request', author: 'bob', avatar: 'B', commit: 'd4e5f6a', message: 'feat: add pagination to list endpoints', duration: '5m 12s', queued: '22s', finished: '18 分钟前', created: '2026-08-05 09:56:11', errors: 0, warnings: 0 },
    { id: 840, repoId: 101, status: 'success', branch: 'develop', event: 'push', author: 'carol', avatar: 'C', commit: 'e7f8g9h', message: 'chore: bump dependencies', duration: '3m 33s', queued: '15s', finished: '45 分钟前', created: '2026-08-05 09:29:50', errors: 0, warnings: 1 },
    { id: 839, repoId: 101, status: 'failure', branch: 'main', event: 'push', author: 'alice', avatar: 'A', commit: 'f1g2h3i', message: 'refactor: optimize query performance', duration: '1m 42s', queued: '19s', finished: '1 小时前', created: '2026-08-05 08:58:23', errors: 3, warnings: 0 },
    { id: 838, repoId: 101, status: 'warning', branch: 'main', event: 'schedule', author: 'dave', avatar: 'D', commit: 'b2c3d4e', message: 'chore: update dependencies', duration: '6m 21s', queued: '30s', finished: '2 小时前', created: '2026-08-05 08:01:08', errors: 0, warnings: 8 },
    { id: 837, repoId: 101, status: 'success', branch: 'release/1.4.0', event: 'tag', author: 'erin', avatar: 'E', commit: 'v1.4.0', message: 'release: v1.4.0', duration: '4m 02s', queued: '12s', finished: '3 小时前', created: '2026-08-05 07:12:05', errors: 0, warnings: 0 },
    { id: 836, repoId: 101, status: 'canceled', branch: 'main', event: 'push', author: 'alice', avatar: 'A', commit: 'c3d4e5f', message: 'WIP: experiment with new cache strategy', duration: '—', queued: '8s', finished: '3 小时前', created: '2026-08-05 06:44:20', errors: 0, warnings: 0 },
    { id: 835, repoId: 101, status: 'success', branch: 'develop', event: 'push', author: 'bob', avatar: 'B', commit: 'd5e6f7g', message: 'docs: update README', duration: '1m 54s', queued: '14s', finished: '5 小时前', created: '2026-08-05 05:10:18', errors: 0, warnings: 0 },
    { id: 834, repoId: 101, status: 'running', branch: 'feature/oidc', event: 'pull_request', author: 'frank', avatar: 'F', commit: 'e8f9a0b', message: 'feat: OIDC token exchange', duration: '1m 08s', queued: '5s', finished: '运行中', created: '2026-08-05 10:14:03', errors: 0, warnings: 0 },
    { id: 833, repoId: 101, status: 'queued', branch: 'main', event: 'manual', author: 'alice', avatar: 'A', commit: 'a9b0c1d', message: 'Manual production validation', duration: '—', queued: '42s', finished: '等待中', created: '2026-08-05 10:13:16', errors: 0, warnings: 0 },
  ];

  const steps = [
    { id: 1, name: 'Clone repository', slug: 'clone', status: 'success', duration: '18s', image: 'woodpeckerci/plugin-git' },
    { id: 2, name: 'Install dependencies', slug: 'install', status: 'success', duration: '2m 14s', image: 'node:22-alpine' },
    { id: 3, name: 'Run tests', slug: 'test', status: 'success', duration: '5m 36s', image: 'node:22-alpine', detail: '128 tests passed' },
    { id: 4, name: 'Build application', slug: 'build', status: 'failure', duration: '1m 42s', image: 'node:22-alpine', detail: 'Exit code 1' },
    { id: 5, name: 'Deploy to production', slug: 'deploy', status: 'queued', duration: '—', image: 'plugins/kubernetes' },
  ];

  const logs = [
    ['10:12:43', 'info', 'Running step: Build application'],
    ['10:12:43', 'muted', 'Using image: node:22-alpine'],
    ['10:12:43', 'muted', 'Working directory: /drone/src'],
    ['10:12:45', 'command', '$ npm ci'],
    ['10:12:45', 'info', 'added 342 packages, and audited 343 packages in 2s'],
    ['10:12:45', 'muted', '12 packages are looking for funding'],
    ['10:12:45', 'success', 'found 0 vulnerabilities'],
    ['10:12:45', 'command', '$ npm run build'],
    ['10:12:46', 'info', '> backend-api@1.4.0 build'],
    ['10:12:46', 'info', '> tsc -p tsconfig.build.json'],
    ['10:12:48', 'error', "src/routes/user.ts:42:15 - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'."],
    ['10:12:48', 'error-soft', '42       const userId = req.query.id.toString();'],
    ['10:12:48', 'error-soft', '                    ~~~~~~~~~~~~~'],
    ['10:12:48', 'warning', "src/utils/email.ts:17:9 - warning TS6133: 'debug' is declared but its value is never read."],
    ['10:12:48', 'warning-soft', "17   const debug = require('debug')('email');"],
    ['10:12:48', 'info', 'Found 1 error in src/routes/user.ts:42'],
    ['10:12:48', 'info', 'Found 1 warning in src/utils/email.ts:17'],
    ['10:12:48', 'error', 'error Command failed with exit code 1.'],
    ['10:12:48', 'error', 'Step failed'],
  ];

  const branches = [
    { name: 'main', default: true, protected: true, lastCommit: 'a1b2c3d', message: 'fix: correct null check in user service', author: 'alice', updated: '2 分钟前', status: 'failure', ahead: 0, behind: 0 },
    { name: 'develop', default: false, protected: true, lastCommit: 'e7f8g9h', message: 'chore: bump dependencies', author: 'carol', updated: '45 分钟前', status: 'success', ahead: 12, behind: 3 },
    { name: 'feature/oidc', default: false, protected: false, lastCommit: 'e8f9a0b', message: 'feat: OIDC token exchange', author: 'frank', updated: '1 小时前', status: 'running', ahead: 5, behind: 1 },
    { name: 'feature/user-preferences', default: false, protected: false, lastCommit: 'c4d5e6f', message: 'feat: add notification preferences', author: 'charlie', updated: '3 小时前', status: 'success', ahead: 8, behind: 2 },
    { name: 'hotfix/rate-limit', default: false, protected: false, lastCommit: 'd7e8f9a', message: 'fix: API rate limiting', author: 'eve', updated: '1 天前', status: 'failure', ahead: 1, behind: 4 },
    { name: 'release/1.4.0', default: false, protected: true, lastCommit: 'b2c3d4e', message: 'release: v1.4.0', author: 'erin', updated: '3 天前', status: 'success', ahead: 0, behind: 9 },
  ];

  const pullRequests = [
    { id: 92, title: 'Add OIDC token exchange', author: 'frank', source: 'feature/oidc', target: 'main', status: 'open', pipeline: 'running', updated: '1 小时前', comments: 6, approvals: 2, commit: 'e8f9a0b' },
    { id: 91, title: 'Add notification preferences', author: 'charlie', source: 'feature/user-preferences', target: 'develop', status: 'open', pipeline: 'success', updated: '3 小时前', comments: 3, approvals: 1, commit: 'c4d5e6f' },
    { id: 90, title: 'Fix API rate limiting', author: 'eve', source: 'hotfix/rate-limit', target: 'main', status: 'open', pipeline: 'failure', updated: '1 天前', comments: 11, approvals: 0, commit: 'd7e8f9a' },
    { id: 89, title: 'Refactor database query layer', author: 'alice', source: 'refactor/query-layer', target: 'develop', status: 'merged', pipeline: 'success', updated: '2 天前', comments: 14, approvals: 3, commit: 'f1g2h3i' },
    { id: 88, title: 'Upgrade runtime to Node 22', author: 'bob', source: 'chore/node-22', target: 'main', status: 'merged', pipeline: 'warning', updated: '4 天前', comments: 5, approvals: 2, commit: 'b2c3d4e' },
  ];

  const changedFiles = [
    { path: 'src/routes/user.ts', additions: 18, deletions: 4, status: 'modified' },
    { path: 'src/services/user-service.ts', additions: 42, deletions: 11, status: 'modified' },
    { path: 'src/utils/email.ts', additions: 7, deletions: 2, status: 'modified' },
    { path: 'tests/user.test.ts', additions: 64, deletions: 8, status: 'modified' },
    { path: 'docs/api/users.md', additions: 23, deletions: 0, status: 'added' },
    { path: '.woodpecker.yml', additions: 5, deletions: 1, status: 'modified' },
  ];

  const secrets = [
    { id: 1, name: 'DOCKER_PASSWORD', type: 'secret', scope: 'Repository', used: 12, updated: '2026-08-05 09:41', user: 'alice', permission: 'Write', value: 'w00dpecker-demo-secret', repositories: ['acme/webapp', 'acme/api', 'acme/worker'] },
    { id: 2, name: 'AWS_ACCESS_KEY_ID', type: 'secret', scope: 'Production', used: 8, updated: '2026-08-03 15:22', user: 'alice', permission: 'Admin', value: 'AKIADEMOACCESSKEY', repositories: ['acme/backend-api'] },
    { id: 3, name: 'AWS_SECRET_ACCESS_KEY', type: 'secret', scope: 'Production', used: 8, updated: '2026-08-03 15:22', user: 'alice', permission: 'Admin', value: 'demo-secret-access-key', repositories: ['acme/backend-api'] },
    { id: 4, name: 'NPM_TOKEN', type: 'secret', scope: 'Repository', used: 5, updated: '2026-08-01 11:02', user: 'bot', permission: 'Write', value: 'npm_demo_123456789', repositories: ['acme/web-frontend'] },
    { id: 5, name: 'SLACK_WEBHOOK_URL', type: 'secret', scope: 'Staging', used: 3, updated: '2026-07-30 16:15', user: 'alice', permission: 'Write', value: 'https://hooks.slack.test/demo', repositories: ['acme/backend-api'] },
    { id: 6, name: 'SONAR_TOKEN', type: 'secret', scope: 'Repository', used: 2, updated: '2026-07-28 08:33', user: 'alice', permission: 'Read', value: 'sonar_demo_token', repositories: ['acme/backend-api'] },
    { id: 7, name: 'DATABASE_URL', type: 'variable', scope: 'Production', used: 7, updated: '2026-07-26 14:11', user: 'alice', permission: 'Write', value: 'postgres://demo:demo@db:5432/api', repositories: ['acme/backend-api'] },
    { id: 8, name: 'FEATURE_FLAG_BETA', type: 'variable', scope: 'Staging', used: 1, updated: '2026-07-25 18:45', user: 'alice', permission: 'Read', value: 'true', repositories: ['acme/backend-api'] },
    { id: 9, name: 'SENTRY_DSN', type: 'secret', scope: 'Production', used: 4, updated: '2026-07-23 13:09', user: 'bot', permission: 'Write', value: 'https://public@sentry.test/42', repositories: ['acme/backend-api'] },
  ];

  const registries = [
    { id: 1, address: 'ghcr.io', username: 'acme-bot', scope: 'Repository', type: 'GitHub Container Registry', updated: '2 天前', verified: true },
    { id: 2, address: 'registry.gitlab.com', username: 'deploy-token', scope: 'Organization', type: 'GitLab Registry', updated: '5 天前', verified: true },
    { id: 3, address: 'registry.acme.internal', username: 'woodpecker', scope: 'Production', type: 'Private Registry', updated: '9 天前', verified: true },
    { id: 4, address: 'docker.io', username: 'acme-ci', scope: 'Global', type: 'Docker Hub', updated: '14 天前', verified: false },
  ];

  const crons = [
    { id: 1, name: 'nightly-tests', schedule: '0 2 * * *', branch: 'main', next: '今天 02:00', active: true, lastStatus: 'success' },
    { id: 2, name: 'dependency-audit', schedule: '0 6 * * 1', branch: 'main', next: '周一 06:00', active: true, lastStatus: 'warning' },
    { id: 3, name: 'staging-deploy', schedule: '0 10 * * 1-5', branch: 'develop', next: '明天 10:00', active: false, lastStatus: 'success' },
    { id: 4, name: 'cleanup-artifacts', schedule: '30 3 1 * *', branch: 'main', next: '9 月 1 日 03:30', active: true, lastStatus: 'success' },
  ];

  const agents = [
    { id: 1, name: 'agent-us-east-1a-01', backend: 'Docker', cpu: 32, memory: 48, jobs: 2, capacity: 10, os: 'Ubuntu 24.04', version: '3.10.0', heartbeat: '8 秒前', status: 'online', labels: ['linux', 'x64', 'docker'], ip: '10.0.1.15', region: 'us-east-1' },
    { id: 2, name: 'agent-us-east-1a-02', backend: 'Kubernetes', cpu: 18, memory: 37, jobs: 1, capacity: 8, os: 'Ubuntu 24.04', version: '3.10.0', heartbeat: '6 秒前', status: 'online', labels: ['linux', 'arm64', 'k8s'], ip: '10.0.1.16', region: 'us-east-1' },
    { id: 3, name: 'agent-us-east-1b-01', backend: 'Docker', cpu: 61, memory: 72, jobs: 3, capacity: 6, os: 'Ubuntu 24.04', version: '3.10.0', heartbeat: '9 秒前', status: 'busy', labels: ['linux', 'x64', 'gpu'], ip: '10.0.2.21', region: 'us-east-1' },
    { id: 4, name: 'agent-eu-west-1a-01', backend: 'Kubernetes', cpu: 24, memory: 41, jobs: 0, capacity: 10, os: 'Debian 13', version: '3.10.0', heartbeat: '12 秒前', status: 'online', labels: ['linux', 'x64', 'k8s'], ip: '10.1.1.10', region: 'eu-west-1' },
    { id: 5, name: 'agent-eu-west-1a-02', backend: 'Kubernetes', cpu: 9, memory: 22, jobs: 0, capacity: 8, os: 'Ubuntu 24.04', version: '3.9.1', heartbeat: '14 秒前', status: 'idle', labels: ['linux', 'arm64', 'spot'], ip: '10.1.1.11', region: 'eu-west-1' },
    { id: 6, name: 'agent-eu-west-1b-01', backend: 'Docker', cpu: 14, memory: 31, jobs: 1, capacity: 6, os: 'Windows Server 2025', version: '3.10.0', heartbeat: '10 秒前', status: 'online', labels: ['windows', 'x64'], ip: '10.1.2.15', region: 'eu-west-1' },
    { id: 7, name: 'agent-asia-southeast-1a-01', backend: 'Kubernetes', cpu: 35, memory: 55, jobs: 2, capacity: 10, os: 'Ubuntu 24.04', version: '3.10.0', heartbeat: '7 秒前', status: 'online', labels: ['linux', 'x64', 'k8s'], ip: '10.2.1.10', region: 'asia-southeast-1' },
    { id: 8, name: 'agent-asia-southeast-1a-02', backend: 'Kubernetes', cpu: 7, memory: 19, jobs: 0, capacity: 6, os: 'Alpine 3.22', version: '3.8.3', heartbeat: '3 分钟前', status: 'offline', labels: ['linux', 'arm64', 'spot'], ip: '10.2.1.11', region: 'asia-southeast-1' },
  ];

  const organizations = [
    { id: 1, name: 'Acme Corp', slug: 'acmecorp', repos: 128, members: 42, successRate: 98.7, activity: '2 分钟前', role: 'Owner' },
    { id: 2, name: 'Initech', slug: 'initech', repos: 64, members: 18, successRate: 96.1, activity: '12 分钟前', role: 'Admin' },
    { id: 3, name: 'Nova Ventures', slug: 'novaventures', repos: 42, members: 11, successRate: 93.8, activity: '1 小时前', role: 'Admin' },
    { id: 4, name: 'Orbital Inc.', slug: 'orbital', repos: 37, members: 9, successRate: 91.2, activity: '3 小时前', role: 'Maintainer' },
    { id: 5, name: 'Helios Labs', slug: 'helioslabs', repos: 23, members: 7, successRate: 89.4, activity: '5 小时前', role: 'Admin' },
    { id: 6, name: 'Zenith Systems', slug: 'zenithsystems', repos: 19, members: 6, successRate: 87.6, activity: '1 天前', role: 'Viewer' },
  ];

  const users = [
    { id: 1, login: 'alice', name: 'Alice Johnson', email: 'alice@acme.example', admin: true, active: true, forge: 'GitHub', lastLogin: '2 分钟前', pipelines: 184 },
    { id: 2, login: 'bob', name: 'Bob Chen', email: 'bob@acme.example', admin: false, active: true, forge: 'GitHub', lastLogin: '18 分钟前', pipelines: 98 },
    { id: 3, login: 'carol', name: 'Carol Wilson', email: 'carol@acme.example', admin: false, active: true, forge: 'GitLab', lastLogin: '45 分钟前', pipelines: 73 },
    { id: 4, login: 'dave', name: 'Dave Miller', email: 'dave@acme.example', admin: false, active: true, forge: 'GitHub', lastLogin: '2 小时前', pipelines: 51 },
    { id: 5, login: 'erin', name: 'Erin Davis', email: 'erin@acme.example', admin: false, active: true, forge: 'Bitbucket', lastLogin: '5 小时前', pipelines: 44 },
    { id: 6, login: 'frank', name: 'Frank Lopez', email: 'frank@acme.example', admin: false, active: true, forge: 'Gitea', lastLogin: '1 天前', pipelines: 29 },
    { id: 7, login: 'build-bot', name: 'Build Bot', email: 'ci-bot@acme.example', admin: false, active: false, forge: 'Service', lastLogin: '12 天前', pipelines: 1104 },
  ];

  const forges = [
    { id: 1, name: 'Acme GitHub', type: 'GitHub', url: 'https://github.com', client: 'Iv1.demo', status: 'connected', repos: 186, users: 76, webhook: true },
    { id: 2, name: 'Acme GitLab', type: 'GitLab', url: 'https://gitlab.com', client: 'demo-app-id', status: 'connected', repos: 82, users: 34, webhook: true },
    { id: 3, name: 'Internal Gitea', type: 'Gitea', url: 'https://git.acme.internal', client: 'woodpecker', status: 'connected', repos: 47, users: 22, webhook: true },
    { id: 4, name: 'Legacy Bitbucket', type: 'Bitbucket', url: 'https://bitbucket.org', client: 'demo-key', status: 'degraded', repos: 13, users: 8, webhook: false },
  ];

  const queue = [
    { id: 902, repo: 'acme/web-frontend', pipeline: '#902', task: 'build', priority: 90, labels: ['linux', 'x64'], waiting: '18s', status: 'queued' },
    { id: 901, repo: 'acme/backend-api', pipeline: '#901', task: 'test', priority: 80, labels: ['linux', 'x64'], waiting: '42s', status: 'queued' },
    { id: 900, repo: 'acme/mobile-app', pipeline: '#900', task: 'android-build', priority: 70, labels: ['linux', 'arm64'], waiting: '1m 16s', status: 'blocked' },
    { id: 899, repo: 'acme/shared-libs', pipeline: '#899', task: 'publish', priority: 60, labels: ['linux'], waiting: '2m 08s', status: 'queued' },
    { id: 898, repo: 'acme/data-pipeline', pipeline: '#898', task: 'integration', priority: 50, labels: ['linux', 'gpu'], waiting: '3m 31s', status: 'blocked' },
  ];

  const servers = [
    { id: 201, name: 'prod-api-01', status: 'online', health: 'healthy', groupId: 1, environmentId: 1, region: 'asia-southeast-1', zone: 'sgp-1a', ip: '10.20.1.11', publicIp: '203.0.113.11', os: 'Ubuntu 24.04', kernel: '6.8.0-40-generic', cpu: 31, memory: 48, disk: 62, load: 1.24, uptime: '48 天', heartbeat: '5 秒前', agentVersion: '1.2.0', runtime: 'Docker 27.1', containersRunning: 8, containersTotal: 8, currentReleaseId: 302, labels: ['production', 'api', 'singapore'], maintenance: false, metrics: { cpu: [22,28,25,31,36,29,33,31,27,34,32,31], memory: [43,44,45,44,46,47,48,48,49,48,47,48], disk: [58,58,59,59,60,60,60,61,61,61,62,62], network: [18,22,19,31,26,35,29,24,38,34,27,32] } },
    { id: 202, name: 'prod-api-02', status: 'online', health: 'warning', groupId: 1, environmentId: 1, region: 'asia-southeast-1', zone: 'sgp-1b', ip: '10.20.1.12', publicIp: '203.0.113.12', os: 'Ubuntu 24.04', kernel: '6.8.0-40-generic', cpu: 72, memory: 81, disk: 86, load: 3.92, uptime: '41 天', heartbeat: '7 秒前', agentVersion: '1.2.0', runtime: 'Docker 27.1', containersRunning: 8, containersTotal: 8, currentReleaseId: 302, labels: ['production', 'api', 'singapore'], maintenance: false, metrics: { cpu: [42,51,48,63,58,71,68,74,69,76,73,72], memory: [62,65,68,69,73,75,77,79,80,81,82,81], disk: [80,81,81,82,82,83,84,84,85,85,86,86], network: [26,31,33,42,38,47,45,39,52,48,43,46] } },
    { id: 203, name: 'prod-api-03', status: 'offline', health: 'critical', groupId: 1, environmentId: 1, region: 'asia-southeast-1', zone: 'sgp-1c', ip: '10.20.1.13', publicIp: '203.0.113.13', os: 'Ubuntu 24.04', kernel: '6.8.0-39-generic', cpu: 0, memory: 0, disk: 67, load: 0, uptime: '—', heartbeat: '3 分钟前', agentVersion: '1.1.4', runtime: 'Docker 26.1', containersRunning: 0, containersTotal: 8, currentReleaseId: 302, labels: ['production', 'api', 'singapore'], maintenance: false, metrics: { cpu: [29,31,35,42,38,44,39,40,0,0,0,0], memory: [48,49,50,52,53,54,55,55,0,0,0,0], disk: [65,65,65,66,66,66,66,67,67,67,67,67], network: [18,21,25,29,24,31,20,0,0,0,0,0] } },
    { id: 204, name: 'prod-web-01', status: 'online', health: 'healthy', groupId: 2, environmentId: 1, region: 'asia-southeast-1', zone: 'sgp-1a', ip: '10.20.2.11', publicIp: '203.0.113.21', os: 'Debian 13', kernel: '6.12.8-amd64', cpu: 24, memory: 39, disk: 44, load: 0.86, uptime: '72 天', heartbeat: '4 秒前', agentVersion: '1.2.0', runtime: 'Docker 27.1', containersRunning: 5, containersTotal: 5, currentReleaseId: 303, labels: ['production', 'web', 'singapore'], maintenance: false, metrics: { cpu: [18,22,21,25,27,23,19,24,28,23,21,24], memory: [35,36,36,37,38,38,39,39,39,40,39,39], disk: [41,41,41,42,42,42,43,43,43,44,44,44], network: [32,38,42,36,45,49,41,52,47,44,48,46] } },
    { id: 205, name: 'prod-web-02', status: 'maintenance', health: 'maintenance', groupId: 2, environmentId: 1, region: 'asia-southeast-1', zone: 'sgp-1b', ip: '10.20.2.12', publicIp: '203.0.113.22', os: 'Debian 13', kernel: '6.12.8-amd64', cpu: 8, memory: 22, disk: 49, load: 0.18, uptime: '9 天', heartbeat: '6 秒前', agentVersion: '1.2.0', runtime: 'Docker 27.1', containersRunning: 0, containersTotal: 5, currentReleaseId: 303, labels: ['production', 'web', 'maintenance'], maintenance: true, metrics: { cpu: [21,19,17,15,13,11,9,8,8,8,8,8], memory: [37,35,33,31,29,27,25,23,22,22,22,22], disk: [47,47,48,48,48,48,49,49,49,49,49,49], network: [39,35,31,26,20,16,8,4,2,2,2,2] } },
    { id: 206, name: 'staging-all-01', status: 'online', health: 'warning', groupId: 3, environmentId: 2, region: 'asia-southeast-1', zone: 'sgp-1a', ip: '10.30.1.11', publicIp: '198.51.100.11', os: 'Ubuntu 24.04', kernel: '6.8.0-40-generic', cpu: 54, memory: 63, disk: 51, load: 2.21, uptime: '18 天', heartbeat: '9 秒前', agentVersion: '1.2.0', runtime: 'Docker 27.1', containersRunning: 12, containersTotal: 13, currentReleaseId: 301, labels: ['staging', 'shared'], maintenance: false, metrics: { cpu: [41,47,43,52,58,49,61,57,52,60,56,54], memory: [55,57,58,58,60,60,61,62,62,63,64,63], disk: [48,48,49,49,49,50,50,50,51,51,51,51], network: [22,27,24,31,35,42,38,44,39,47,43,41] } },
    { id: 207, name: 'staging-all-02', status: 'online', health: 'healthy', groupId: 3, environmentId: 2, region: 'asia-southeast-1', zone: 'sgp-1b', ip: '10.30.1.12', publicIp: '198.51.100.12', os: 'Ubuntu 24.04', kernel: '6.8.0-40-generic', cpu: 21, memory: 34, disk: 37, load: 0.66, uptime: '18 天', heartbeat: '8 秒前', agentVersion: '1.2.0', runtime: 'Docker 27.1', containersRunning: 13, containersTotal: 13, currentReleaseId: 301, labels: ['staging', 'shared'], maintenance: false, metrics: { cpu: [19,17,21,24,22,20,18,23,25,22,20,21], memory: [31,32,32,33,33,34,34,35,34,34,34,34], disk: [35,35,35,35,36,36,36,36,37,37,37,37], network: [16,18,21,19,25,22,24,20,26,23,21,22] } },
    { id: 208, name: 'prod-worker-01', status: 'online', health: 'healthy', groupId: 4, environmentId: 1, region: 'eu-west-1', zone: 'fra-1a', ip: '10.40.1.11', publicIp: '192.0.2.31', os: 'Ubuntu 24.04', kernel: '6.8.0-40-generic', cpu: 43, memory: 58, disk: 46, load: 1.76, uptime: '31 天', heartbeat: '5 秒前', agentVersion: '1.2.0', runtime: 'Docker 27.1', containersRunning: 6, containersTotal: 6, currentReleaseId: 304, labels: ['production', 'worker', 'frankfurt'], maintenance: false, metrics: { cpu: [35,39,42,38,45,48,41,44,46,42,45,43], memory: [51,52,53,54,55,56,57,57,58,58,58,58], disk: [44,44,44,45,45,45,45,46,46,46,46,46], network: [12,15,18,14,21,19,24,22,18,23,20,21] } },
  ];

  const serverGroups = [
    { id: 1, name: 'prod-api', description: 'Production API nodes in Singapore', environmentId: 1, strategy: 'rolling', batchSize: 1, healthPath: '/health/ready', port: 8080, labels: ['production', 'api'], serverIds: [201,202,203] },
    { id: 2, name: 'prod-web', description: 'Production web and edge nodes', environmentId: 1, strategy: 'rolling', batchSize: 1, healthPath: '/health', port: 3000, labels: ['production', 'web'], serverIds: [204,205] },
    { id: 3, name: 'staging-shared', description: 'Shared staging application hosts', environmentId: 2, strategy: 'all-at-once', batchSize: 2, healthPath: '/health', port: 8080, labels: ['staging', 'shared'], serverIds: [206,207] },
    { id: 4, name: 'prod-workers', description: 'Background workers in Frankfurt', environmentId: 1, strategy: 'rolling', batchSize: 1, healthPath: '/health', port: 9090, labels: ['production', 'worker'], serverIds: [208] },
  ];

  const applications = [
    { id: 1, name: 'backend-api', repoId: 101, description: 'Customer and internal API service', image: 'ghcr.io/acme/backend-api', runtime: 'docker-compose', composeFile: 'deploy/docker-compose.yml', service: 'api', owner: 'Platform', environmentIds: [1,2], currentProductionReleaseId: 302, currentStagingReleaseId: 301, healthPath: '/health/ready' },
    { id: 2, name: 'web-frontend', repoId: 102, description: 'Vue customer web application', image: 'ghcr.io/acme/web-frontend', runtime: 'docker-compose', composeFile: 'deploy/docker-compose.yml', service: 'web', owner: 'Frontend', environmentIds: [1,2], currentProductionReleaseId: 303, currentStagingReleaseId: 305, healthPath: '/health' },
    { id: 3, name: 'worker-service', repoId: 103, description: 'Asynchronous background workers', image: 'ghcr.io/acme/worker-service', runtime: 'docker-compose', composeFile: 'deploy/worker.compose.yml', service: 'worker', owner: 'Backend', environmentIds: [1,2], currentProductionReleaseId: 304, currentStagingReleaseId: 306, healthPath: '/health' },
    { id: 4, name: 'notification-service', repoId: 112, description: 'Email, SMS and webhook delivery', image: 'ghcr.io/acme/notification-service', runtime: 'systemd', composeFile: '', service: 'notification', owner: 'Backend', environmentIds: [1,2], currentProductionReleaseId: 307, currentStagingReleaseId: 308, healthPath: '/ready' },
  ];

  const environments = [
    { id: 1, name: 'production', title: 'Production', protected: true, approvalRequired: true, minimumApprovers: 1, policyId: 1, groupIds: [1,2,4], color: 'danger', domain: '*.acme.example', deployWindow: 'Mon–Fri 09:00–18:00', autoRollback: true },
    { id: 2, name: 'staging', title: 'Staging', protected: false, approvalRequired: false, minimumApprovers: 0, policyId: 2, groupIds: [3], color: 'warning', domain: '*.staging.acme.example', deployWindow: 'Any time', autoRollback: true },
    { id: 3, name: 'development', title: 'Development', protected: false, approvalRequired: false, minimumApprovers: 0, policyId: 3, groupIds: [], color: 'info', domain: '*.dev.acme.example', deployWindow: 'Any time', autoRollback: false },
  ];

  const releases = [
    { id: 301, applicationId: 1, version: 'v1.4.1-rc.2', commit: 'd4e5f6a', digest: 'sha256:8dcf1c3a9d01', pipelineId: 841, status: 'ready', created: '18 分钟前', author: 'bob', size: '186 MB', environments: ['staging'] },
    { id: 302, applicationId: 1, version: 'v1.4.0', commit: 'b2c3d4e', digest: 'sha256:1ee6d72a21a8', pipelineId: 837, status: 'deployed', created: '3 天前', author: 'erin', size: '184 MB', environments: ['production'] },
    { id: 303, applicationId: 2, version: 'v3.8.2', commit: '9f8a7b6', digest: 'sha256:486b9c4e02aa', pipelineId: 892, status: 'deployed', created: '2 小时前', author: 'alice', size: '92 MB', environments: ['production'] },
    { id: 304, applicationId: 3, version: 'v2.6.0', commit: '4c3b2a1', digest: 'sha256:c511d8ab7c93', pipelineId: 888, status: 'deployed', created: '1 天前', author: 'dave', size: '211 MB', environments: ['production'] },
    { id: 305, applicationId: 2, version: 'v3.9.0-beta.1', commit: 'ca12fe3', digest: 'sha256:6972f1cc0b8a', pipelineId: 896, status: 'ready', created: '35 分钟前', author: 'carol', size: '94 MB', environments: ['staging'] },
    { id: 306, applicationId: 3, version: 'v2.7.0-rc.1', commit: '7d6c5b4', digest: 'sha256:76fc2d8149ea', pipelineId: 895, status: 'ready', created: '42 分钟前', author: 'dave', size: '214 MB', environments: ['staging'] },
    { id: 307, applicationId: 4, version: 'v1.9.3', commit: '1029abc', digest: 'sha256:3bc09911fe4d', pipelineId: 884, status: 'deployed', created: '4 天前', author: 'frank', size: '77 MB', environments: ['production'] },
    { id: 308, applicationId: 4, version: 'v2.0.0-rc.1', commit: 'f3e2d1c', digest: 'sha256:1b6217c350bf', pipelineId: 897, status: 'ready', created: '26 分钟前', author: 'frank', size: '79 MB', environments: ['staging'] },
  ];

  const deployments = [
    { id: 142, applicationId: 1, environmentId: 1, releaseId: 301, previousReleaseId: 302, pipelineId: 841, status: 'running', strategy: 'rolling', batchSize: 1, progress: 50, triggeredBy: 'alice', approvedBy: 'mike', created: '12 分钟前', started: '10 分钟前', finished: '—', duration: '10m 14s', groupIds: [1], currentTarget: 202, targets: [
      { serverId: 201, status: 'success', phase: 'healthy', duration: '3m 18s', message: 'Health check passed' },
      { serverId: 202, status: 'running', phase: 'deploying', duration: '1m 46s', message: 'Pulling immutable image digest' },
      { serverId: 203, status: 'queued', phase: 'waiting', duration: '—', message: 'Waiting for previous node' }
    ], logs: [
      ['10:22:03','info','Deployment DEP-142 approved by mike'],
      ['10:22:07','info','Resolved image to sha256:8dcf1c3a9d01'],
      ['10:22:10','info','Starting rolling deployment, batch size 1'],
      ['10:22:12','info','prod-api-01: preflight checks passed'],
      ['10:23:04','command','prod-api-01: docker compose pull api'],
      ['10:24:26','success','prod-api-01: container replaced'],
      ['10:25:18','success','prod-api-01: /health/ready returned 200'],
      ['10:25:24','info','prod-api-02: preflight checks passed'],
      ['10:26:02','command','prod-api-02: pulling sha256:8dcf1c3a9d01']
    ] },
    { id: 141, applicationId: 2, environmentId: 1, releaseId: 303, previousReleaseId: null, pipelineId: 892, status: 'success', strategy: 'rolling', batchSize: 1, progress: 100, triggeredBy: 'alice', approvedBy: 'alice', created: '2 小时前', started: '2 小时前', finished: '1 小时前', duration: '6m 42s', groupIds: [2], targets: [{serverId:204,status:'success',phase:'healthy',duration:'3m 12s',message:'Healthy'},{serverId:205,status:'success',phase:'healthy',duration:'3m 30s',message:'Healthy'}], logs: [['08:12:03','info','Deployment started'],['08:18:45','success','Deployment completed successfully']] },
    { id: 140, applicationId: 1, environmentId: 2, releaseId: 301, previousReleaseId: null, pipelineId: 841, status: 'success', strategy: 'all-at-once', batchSize: 2, progress: 100, triggeredBy: 'bob', approvedBy: null, created: '17 分钟前', started: '17 分钟前', finished: '14 分钟前', duration: '3m 03s', groupIds: [3], targets: [{serverId:206,status:'success',phase:'healthy',duration:'2m 48s',message:'Healthy'},{serverId:207,status:'success',phase:'healthy',duration:'2m 51s',message:'Healthy'}], logs: [['10:05:11','info','Staging deployment started'],['10:08:14','success','All targets healthy']] },
    { id: 139, applicationId: 3, environmentId: 1, releaseId: 306, previousReleaseId: 304, pipelineId: 895, status: 'failure', strategy: 'rolling', batchSize: 1, progress: 100, triggeredBy: 'dave', approvedBy: 'alice', created: '1 天前', started: '1 天前', finished: '1 天前', duration: '4m 19s', groupIds: [4], targets: [{serverId:208,status:'failure',phase:'health-check',duration:'4m 19s',message:'Health check timeout'}], logs: [['14:01:00','info','Deployment started'],['14:04:52','danger','Health check timed out after 60s'],['14:05:19','danger','Deployment failed; rollback available']] },
    { id: 138, applicationId: 4, environmentId: 1, releaseId: 308, previousReleaseId: 307, pipelineId: 897, status: 'waiting_approval', strategy: 'rolling', batchSize: 1, progress: 0, triggeredBy: 'frank', approvedBy: null, created: '8 分钟前', started: '—', finished: '—', duration: '—', groupIds: [4], targets: [{serverId:208,status:'queued',phase:'approval',duration:'—',message:'Waiting for production approval'}], logs: [['10:18:01','info','Deployment request created from pipeline #897'],['10:18:02','warning','Production approval required']] },
    { id: 137, applicationId: 1, environmentId: 1, releaseId: 302, previousReleaseId: null, pipelineId: 837, status: 'success', strategy: 'rolling', batchSize: 1, progress: 100, triggeredBy: 'erin', approvedBy: 'mike', created: '3 天前', started: '3 天前', finished: '3 天前', duration: '8m 11s', groupIds: [1], targets: [{serverId:201,status:'success',phase:'healthy',duration:'2m 40s',message:'Healthy'},{serverId:202,status:'success',phase:'healthy',duration:'2m 37s',message:'Healthy'},{serverId:203,status:'success',phase:'healthy',duration:'2m 54s',message:'Healthy'}], logs: [['09:12:00','info','Deployment started'],['09:20:11','success','Deployment completed successfully']] },
  ];

  const services = [
    { id: 501, serverId: 201, applicationId: 1, name: 'backend-api', kind: 'container', status: 'healthy', image: 'ghcr.io/acme/backend-api@sha256:1ee6d72a21a8', version: 'v1.4.0', cpu: 18, memory: 412, restarts: 0, port: '8080:8080', uptime: '3 天' },
    { id: 502, serverId: 201, applicationId: 1, name: 'postgres-exporter', kind: 'container', status: 'healthy', image: 'prometheuscommunity/postgres-exporter:v0.17', version: 'v0.17', cpu: 2, memory: 64, restarts: 0, port: '9187', uptime: '31 天' },
    { id: 503, serverId: 202, applicationId: 1, name: 'backend-api', kind: 'container', status: 'deploying', image: 'ghcr.io/acme/backend-api@sha256:8dcf1c3a9d01', version: 'v1.4.1-rc.2', cpu: 42, memory: 718, restarts: 1, port: '8080:8080', uptime: '2 分钟' },
    { id: 504, serverId: 203, applicationId: 1, name: 'backend-api', kind: 'container', status: 'unreachable', image: 'ghcr.io/acme/backend-api@sha256:1ee6d72a21a8', version: 'v1.4.0', cpu: 0, memory: 0, restarts: 0, port: '8080:8080', uptime: '—' },
    { id: 505, serverId: 204, applicationId: 2, name: 'web-frontend', kind: 'container', status: 'healthy', image: 'ghcr.io/acme/web-frontend@sha256:486b9c4e02aa', version: 'v3.8.2', cpu: 9, memory: 188, restarts: 0, port: '3000:3000', uptime: '2 小时' },
    { id: 506, serverId: 205, applicationId: 2, name: 'web-frontend', kind: 'container', status: 'stopped', image: 'ghcr.io/acme/web-frontend@sha256:486b9c4e02aa', version: 'v3.8.2', cpu: 0, memory: 0, restarts: 0, port: '3000:3000', uptime: '—' },
    { id: 507, serverId: 206, applicationId: 1, name: 'backend-api-staging', kind: 'container', status: 'degraded', image: 'ghcr.io/acme/backend-api@sha256:8dcf1c3a9d01', version: 'v1.4.1-rc.2', cpu: 24, memory: 536, restarts: 4, port: '8080:8080', uptime: '14 分钟' },
    { id: 508, serverId: 207, applicationId: 2, name: 'web-frontend-staging', kind: 'container', status: 'healthy', image: 'ghcr.io/acme/web-frontend@sha256:6972f1cc0b8a', version: 'v3.9.0-beta.1', cpu: 7, memory: 154, restarts: 0, port: '3000:3000', uptime: '35 分钟' },
    { id: 509, serverId: 208, applicationId: 3, name: 'worker-service', kind: 'container', status: 'healthy', image: 'ghcr.io/acme/worker-service@sha256:c511d8ab7c93', version: 'v2.6.0', cpu: 31, memory: 624, restarts: 0, port: '9090', uptime: '1 天' },
    { id: 510, serverId: 208, applicationId: 4, name: 'notification', kind: 'systemd', status: 'healthy', image: 'notification-service', version: 'v1.9.3', cpu: 8, memory: 132, restarts: 0, port: '9100', uptime: '4 天' },
  ];

  const alerts = [
    { id: 601, severity: 'critical', status: 'active', title: 'Node Agent heartbeat missing', serverId: 203, source: 'node-agent', value: '3m 04s', threshold: '> 60s', since: '3 分钟前', description: 'prod-api-03 has stopped reporting metrics and deployment status.' },
    { id: 602, severity: 'warning', status: 'active', title: 'Root disk usage above threshold', serverId: 202, source: 'node-exporter', value: '86%', threshold: '> 85%', since: '12 分钟前', description: 'Disk usage may block image pulls during the active deployment.' },
    { id: 603, severity: 'warning', status: 'acknowledged', title: 'Container restart rate elevated', serverId: 206, source: 'docker', value: '4 restarts', threshold: '> 3 / 15m', since: '18 分钟前', description: 'backend-api-staging restarted four times after the latest release.', acknowledgedBy: 'alice' },
    { id: 604, severity: 'info', status: 'resolved', title: 'TLS certificate expires soon', serverId: 204, source: 'certificate', value: '21 days', threshold: '< 30 days', since: '2 天前', description: 'Certificate renewal was completed automatically.', resolvedBy: 'cert-manager' },
  ];

  const deploymentPolicies = [
    { id: 1, name: 'Production safe rollout', description: 'Approval, rolling rollout and automatic rollback for protected environments.', environmentId: 1, approval: true, minimumApprovers: 1, strategy: 'rolling', batchSize: 1, concurrency: 1, healthTimeout: 60, autoRollback: true, minHealthyPercent: 66, active: true },
    { id: 2, name: 'Staging fast feedback', description: 'Deploy all staging nodes together after a successful pipeline.', environmentId: 2, approval: false, minimumApprovers: 0, strategy: 'all-at-once', batchSize: 2, concurrency: 2, healthTimeout: 45, autoRollback: true, minHealthyPercent: 50, active: true },
    { id: 3, name: 'Development preview', description: 'Manual preview deployments without automatic rollback.', environmentId: 3, approval: false, minimumApprovers: 0, strategy: 'all-at-once', batchSize: 1, concurrency: 4, healthTimeout: 30, autoRollback: false, minHealthyPercent: 0, active: true },
  ];

  const opsEvents = [
    { id: 701, serverId: 201, type: 'deployment', title: 'Release v1.4.1-rc.2 deployed', detail: 'Deployment #142 completed health check on this node.', time: '7 分钟前', tone: 'success' },
    { id: 702, serverId: 202, type: 'alert', title: 'Disk usage warning', detail: 'Root filesystem reached 86%.', time: '12 分钟前', tone: 'warning' },
    { id: 703, serverId: 203, type: 'heartbeat', title: 'Node Agent disconnected', detail: 'Last heartbeat received 3 minutes ago.', time: '3 分钟前', tone: 'danger' },
    { id: 704, serverId: 205, type: 'maintenance', title: 'Maintenance mode enabled', detail: 'alice drained workloads before kernel upgrade.', time: '36 分钟前', tone: 'info' },
    { id: 705, serverId: 206, type: 'container', title: 'Container restarted', detail: 'backend-api-staging restarted after failed liveness probe.', time: '18 分钟前', tone: 'warning' },
    { id: 706, serverId: 208, type: 'deployment', title: 'Rollback recommended', detail: 'Deployment #139 failed the worker health check.', time: '1 天前', tone: 'danger' },
  ];

  window.WP_DATA = {
    repositories,
    pipelines,
    steps,
    logs,
    branches,
    pullRequests,
    changedFiles,
    secrets,
    registries,
    crons,
    agents,
    organizations,
    users,
    forges,
    queue,
    servers,
    serverGroups,
    applications,
    environments,
    releases,
    deployments,
    services,
    alerts,
    deploymentPolicies,
    opsEvents,
  };
})();
