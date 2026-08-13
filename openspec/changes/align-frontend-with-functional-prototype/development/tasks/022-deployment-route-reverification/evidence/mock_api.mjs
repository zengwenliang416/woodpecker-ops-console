#!/usr/bin/env node

import { createServer } from 'node:http';

const port = Number(process.env.TASK022_MOCK_PORT ?? 8222);
const runId = process.env.TASK022_RUN_ID ?? null;
const now = 1_786_582_800;

const applications = [
  {
    id: 1,
    name: 'backend-api',
    description: 'Backend API service',
    image: 'registry.example.test/backend-api',
    runtime: 'docker-compose',
    compose_file: 'compose.production.yml',
    service: 'api',
    health_path: '/health/ready',
    port: 8080,
    owner_team: 'Platform',
  },
  {
    id: 2,
    name: 'web-frontend',
    description: 'Customer-facing frontend',
    image: 'registry.example.test/web-frontend',
    runtime: 'docker-compose',
    service: 'web',
    health_path: '/health',
    port: 3000,
    owner_team: 'Frontend',
  },
];

const environments = [
  {
    id: 1,
    name: 'production',
    title: 'Production',
    protected: true,
    approval_required: true,
    minimum_approvers: 1,
    auto_rollback: true,
    deploy_window: 'Mon-Fri 09:00-18:00',
    domain: 'api.example.test',
    color: 'danger',
  },
  {
    id: 2,
    name: 'staging',
    title: 'Staging',
    protected: false,
    approval_required: false,
    minimum_approvers: 0,
    auto_rollback: true,
    domain: 'staging.example.test',
    color: 'warning',
  },
];

const releases = [
  {
    id: 301,
    application_id: 1,
    pipeline_id: 841,
    version: 'v1.4.1',
    commit: 'a1b2c3d',
    digest: 'sha256:11111111111111111111111111111111',
    image: 'registry.example.test/backend-api@sha256:1111',
    author: 'alice',
    status: 'ready',
    created: now - 1800,
  },
  {
    id: 302,
    application_id: 1,
    pipeline_id: 832,
    version: 'v1.4.0',
    commit: 'd4e5f6a',
    digest: 'sha256:22222222222222222222222222222222',
    author: 'bob',
    status: 'deployed',
    created: now - 86_400,
  },
  {
    id: 303,
    application_id: 2,
    pipeline_id: 892,
    version: 'v2.7.3',
    commit: 'e7f8a9b',
    digest: 'sha256:33333333333333333333333333333333',
    author: 'carol',
    status: 'deployed',
    created: now - 7200,
  },
];

const groups = [
  {
    id: 1,
    environment_id: 1,
    name: 'prod-api',
    description: 'Production API nodes',
    strategy: 'rolling',
    batch_size: 1,
    health_path: '/health/ready',
    port: 8080,
  },
  {
    id: 2,
    environment_id: 2,
    name: 'staging-api',
    description: 'Staging API nodes',
    strategy: 'all-at-once',
    batch_size: 2,
    health_path: '/health/ready',
    port: 8080,
  },
];

const servers = [
  {
    id: 201,
    group_id: 1,
    environment_id: 1,
    name: 'prod-api-01',
    region: 'asia-southeast-1',
    zone: 'sgp-1a',
    private_ip: '10.20.1.11',
    status: 'online',
    health: 'healthy',
    cpu: 31,
    memory: 48,
    disk: 62,
    load: 1.24,
    maintenance: false,
  },
  {
    id: 202,
    group_id: 1,
    environment_id: 1,
    name: 'prod-api-02',
    region: 'asia-southeast-1',
    zone: 'sgp-1b',
    private_ip: '10.20.1.12',
    status: 'online',
    health: 'warning',
    cpu: 72,
    memory: 81,
    disk: 86,
    load: 3.92,
    maintenance: false,
  },
  {
    id: 203,
    group_id: 2,
    environment_id: 2,
    name: 'staging-api-01',
    region: 'asia-southeast-1',
    zone: 'sgp-1a',
    private_ip: '10.30.1.11',
    status: 'online',
    health: 'healthy',
    cpu: 18,
    memory: 37,
    disk: 44,
    load: 0.61,
    maintenance: false,
  },
  {
    id: 204,
    group_id: 1,
    environment_id: 1,
    name: 'prod-api-03',
    region: 'asia-southeast-1',
    zone: 'sgp-1c',
    private_ip: '10.20.1.13',
    status: 'online',
    health: 'critical',
    cpu: 89,
    memory: 91,
    disk: 79,
    load: 5.14,
    maintenance: false,
  },
];

const deployments = [
  {
    id: 142,
    application_id: 1,
    environment_id: 1,
    release_id: 301,
    previous_release_id: 302,
    pipeline_id: 841,
    group_id: 1,
    status: 'running',
    strategy: 'rolling',
    batch_size: 1,
    progress: 50,
    triggered_by: 'alice',
    approved_by: 'mike',
    approved_at: now - 660,
    created: now - 720,
    started_at: now - 600,
  },
  {
    id: 141,
    application_id: 2,
    environment_id: 2,
    release_id: 303,
    pipeline_id: 892,
    group_id: 2,
    status: 'success',
    strategy: 'all-at-once',
    batch_size: 2,
    progress: 100,
    triggered_by: 'carol',
    created: now - 7200,
    started_at: now - 7100,
    finished_at: now - 6700,
  },
  {
    id: 138,
    application_id: 1,
    environment_id: 1,
    release_id: 301,
    previous_release_id: 302,
    pipeline_id: 897,
    group_id: 1,
    status: 'pending_approval',
    strategy: 'rolling',
    batch_size: 1,
    progress: 0,
    triggered_by: 'frank',
    created: now - 480,
  },
];

const details = new Map([
  [
    142,
    {
      deployment: {
        ...deployments[0],
        logs: [
          { at: now - 590, level: 'info', message: 'Deployment controller started' },
          { at: now - 420, level: 'success', message: 'prod-api-01 health check passed' },
          { at: now - 180, level: 'info', message: 'Waiting for the next rolling batch' },
        ],
      },
      targets: [
        {
          deployment_id: 142,
          server_id: 201,
          status: 'healthy',
          phase: 'healthy',
          message: 'Health check passed',
          attempts: 1,
          started_at: now - 580,
          finished_at: now - 430,
        },
        {
          deployment_id: 142,
          server_id: 202,
          status: 'deploying',
          phase: 'pulling',
          message: 'Pulling immutable image',
          attempts: 1,
          started_at: now - 170,
        },
        {
          deployment_id: 142,
          server_id: 204,
          status: 'failed',
          phase: 'failed',
          message: 'Image pull failed after three attempts',
          attempts: 3,
          started_at: now - 320,
          finished_at: now - 210,
        },
      ],
      approvals: [
        {
          id: 901,
          created: now - 660,
          deployment_id: 142,
          approver: 'mike',
          approved: true,
          comment: 'Approved for production window',
        },
      ],
    },
  ],
  [
    138,
    {
      deployment: deployments[2],
      targets: [
        {
          deployment_id: 138,
          server_id: 201,
          status: 'queued',
          phase: 'waiting',
          message: 'Waiting for production approval',
        },
      ],
      approvals: [],
    },
  ],
]);

const policies = {
  health_check_retries: 3,
  health_check_interval: 10,
  batch_size_default: 1,
  auto_rollback: true,
};

const state = { role: 'admin', data: 'populated', requests: [] };

function json(response, payload, status = 200) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

function text(response, payload, type = 'text/plain; charset=utf-8', status = 200) {
  response.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  response.end(payload);
}

function page(items, url) {
  return url.searchParams.get('page') === '1' || !url.searchParams.has('page') ? items : [];
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
  const path = url.pathname;

  if (path === '/') {
    json(response, { fixture: '022-deployment-route-reverification', run_id: runId, ...state });
    return;
  }
  if (path === '/api/evidence/state') {
    const role = url.searchParams.get('role') ?? 'admin';
    const data = url.searchParams.get('data') ?? 'populated';
    if (
      !['admin', 'normal'].includes(role) ||
      !['populated', 'empty', 'missing-app', 'error-applications', 'mutation-error'].includes(data)
    ) {
      json(response, { error: 'invalid evidence state' }, 400);
      return;
    }
    state.role = role;
    state.data = data;
    state.requests = [];
    json(response, { ok: true, role, data });
    return;
  }
  if (path === '/api/evidence/requests') {
    json(response, { requests: state.requests });
    return;
  }
  if (path === '/web-config.js') {
    text(
      response,
      [
        'window.WOODPECKER_USER = {',
        "id: 1, forge_id: 1, forge_remote_id: 'user-1', login: 'alice',",
        "email: 'alice@example.test', avatar_url: '',",
        `admin: ${state.role === 'admin'}, admin_env: false, active: true, org_id: 1`,
        '};',
        "window.WOODPECKER_VERSION = '3.9.0-task022';",
        "window.WOODPECKER_CSRF = 'task022-csrf';",
        "window.WOODPECKER_ROOT_PATH = '';",
        'window.WOODPECKER_SKIP_VERSION_CHECK = true;',
        'window.WOODPECKER_ENABLE_SWAGGER = false;',
        'window.WOODPECKER_USER_REGISTERED_AGENTS = true;',
        'window.WOODPECKER_MAX_PIPELINE_LOG_LINE_COUNT = 5000;',
        "window.WOODPECKER_DEFAULT_CONFIG_PATHS = ['.woodpecker.yml'];",
      ].join('\n'),
      'application/javascript; charset=utf-8',
    );
    return;
  }

  if (path.startsWith('/api/')) state.requests.push(`${request.method} ${path}${url.search}`);
  const empty = state.data === 'empty';

  if (request.method === 'GET' && path === '/api/applications') {
    if (state.data === 'error-applications') {
      json(response, { error: 'fixture application failure' }, 500);
      return;
    }
    json(response, page(empty ? [] : applications, url));
    return;
  }
  if (request.method === 'GET' && /^\/api\/applications\/\d+$/.test(path)) {
    const id = Number(path.split('/').at(-1));
    if (state.data === 'missing-app' || id === 999) {
      json(response, null);
      return;
    }
    const application = applications.find((item) => item.id === id);
    json(
      response,
      application
        ? { application, releases: releases.filter((release) => release.application_id === application.id) }
        : null,
    );
    return;
  }
  if (request.method === 'GET' && path === '/api/environments') {
    json(response, page(empty ? [] : environments, url));
    return;
  }
  if (request.method === 'GET' && path === '/api/releases') {
    json(response, page(empty ? [] : releases, url));
    return;
  }
  if (request.method === 'GET' && path === '/api/infrastructure/groups') {
    json(response, page(empty ? [] : groups, url));
    return;
  }
  if (request.method === 'GET' && path === '/api/infrastructure/servers') {
    json(response, page(empty ? [] : servers, url));
    return;
  }
  if (request.method === 'GET' && path === '/api/infrastructure/alerts') {
    json(response, []);
    return;
  }
  if (request.method === 'GET' && path === '/api/deployments') {
    json(response, page(empty ? [] : deployments, url));
    return;
  }
  if (request.method === 'GET' && /^\/api\/deployments\/\d+$/.test(path)) {
    const id = Number(path.split('/').at(-1));
    json(response, empty ? null : (details.get(id) ?? null));
    return;
  }
  if (request.method === 'GET' && path === '/api/ops/policies') {
    json(response, empty ? null : policies);
    return;
  }
  if (request.method === 'POST' && path === '/api/deployments/142/pause') {
    json(response, { error: 'fixture mutation rejected' }, state.data === 'mutation-error' ? 409 : 200);
    return;
  }
  if (request.method === 'GET' && ['/api/user/repos', '/api/user/feed', '/api/repos'].includes(path)) {
    json(response, []);
    return;
  }
  if (request.method === 'GET' && path === '/api/stream/events') {
    response.writeHead(204, { 'Cache-Control': 'no-store' });
    response.end();
    return;
  }

  json(response, { error: 'not found', path }, 404);
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`task022 mock API listening on http://127.0.0.1:${port}\n`);
});
