#!/usr/bin/env node

import { createServer } from 'node:http';

const port = Number(process.env.TASK021_MOCK_PORT ?? 8212);
const runId = process.env.TASK021_RUN_ID ?? null;
const now = 1_786_582_800;

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
  },
  {
    id: 2,
    name: 'staging',
    title: 'Staging',
    protected: false,
    approval_required: false,
    minimum_approvers: 0,
    auto_rollback: true,
  },
];

const groups = [
  {
    id: 1,
    environment_id: 1,
    name: 'prod-api',
    description: 'Production API nodes in Singapore',
    strategy: 'rolling',
    batch_size: 1,
    health_path: '/health/ready',
    port: 8080,
    labels: { tier: 'api', environment: 'production' },
  },
  {
    id: 2,
    environment_id: 1,
    name: 'prod-web',
    description: 'Production web nodes',
    strategy: 'rolling',
    batch_size: 1,
    health_path: '/health',
    port: 3000,
    labels: { tier: 'web', environment: 'production' },
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
    public_ip: '203.0.113.11',
    os: 'Ubuntu 24.04',
    kernel: '6.8.0-40-generic',
    runtime: 'Docker 27.1',
    agent_version: '1.2.0',
    cert_serial: 'WP-201-2026',
    status: 'online',
    health: 'healthy',
    cpu: 31,
    memory: 48,
    disk: 62,
    load: 1.24,
    uptime_seconds: 4_147_200,
    last_heartbeat: now - 5,
    current_release_id: 302,
    maintenance: false,
    labels: { production: 'true', role: 'api', region: 'singapore' },
    metrics: {
      cpu: [22, 28, 25, 31, 36, 29, 33, 31],
      memory: [43, 44, 45, 44, 46, 47, 48, 48],
      disk: [58, 58, 59, 59, 60, 60, 61, 62],
      network: [18, 22, 19, 31, 26, 35, 29, 32],
    },
  },
  {
    id: 202,
    group_id: 1,
    environment_id: 1,
    name: 'prod-api-02',
    region: 'asia-southeast-1',
    zone: 'sgp-1b',
    private_ip: '10.20.1.12',
    public_ip: '203.0.113.12',
    os: 'Ubuntu 24.04',
    kernel: '6.8.0-40-generic',
    runtime: 'Docker 27.1',
    agent_version: '1.2.0',
    status: 'online',
    health: 'warning',
    cpu: 72,
    memory: 81,
    disk: 86,
    load: 3.92,
    uptime_seconds: 3_542_400,
    last_heartbeat: now - 7,
    maintenance: false,
    labels: { production: 'true', role: 'api' },
    metrics: {
      cpu: [42, 51, 48, 63, 58, 71, 68, 72],
      memory: [62, 65, 68, 69, 73, 75, 79, 81],
      disk: [80, 81, 81, 82, 83, 84, 85, 86],
      network: [26, 31, 33, 42, 38, 47, 45, 46],
    },
  },
  {
    id: 204,
    group_id: 2,
    environment_id: 1,
    name: 'prod-web-01',
    region: 'asia-southeast-1',
    zone: 'sgp-1a',
    private_ip: '10.20.2.11',
    public_ip: '203.0.113.21',
    os: 'Debian 13',
    kernel: '6.12.8-amd64',
    runtime: 'Docker 27.1',
    agent_version: '1.2.0',
    status: 'maintenance',
    health: 'maintenance',
    cpu: 8,
    memory: 22,
    disk: 49,
    load: 0.18,
    uptime_seconds: 777_600,
    last_heartbeat: now - 6,
    maintenance: true,
    labels: { production: 'true', role: 'web' },
    metrics: {
      cpu: [21, 19, 17, 15, 13, 11, 9, 8],
      memory: [37, 35, 33, 31, 29, 27, 25, 22],
      disk: [47, 47, 48, 48, 48, 49, 49, 49],
      network: [39, 35, 31, 26, 20, 16, 8, 2],
    },
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
    created: now - 720,
    started_at: now - 600,
  },
  {
    id: 141,
    application_id: 2,
    environment_id: 1,
    release_id: 303,
    pipeline_id: 892,
    group_id: 2,
    status: 'success',
    strategy: 'rolling',
    batch_size: 1,
    progress: 100,
    triggered_by: 'alice',
    created: now - 7200,
    started_at: now - 7100,
    finished_at: now - 6700,
  },
];

const alerts = [
  {
    id: 601,
    created: now - 180,
    type: 'node-heartbeat',
    severity: 'critical',
    status: 'active',
    server_id: 202,
    deployment_id: 142,
    message: 'Node Agent heartbeat delayed',
  },
  {
    id: 602,
    created: now - 720,
    type: 'disk',
    severity: 'warning',
    status: 'acknowledged',
    server_id: 202,
    message: 'Root disk usage above threshold',
    acknowledged_by: 'alice',
  },
  {
    id: 603,
    created: now - 86_400,
    type: 'certificate',
    severity: 'info',
    status: 'resolved',
    server_id: 204,
    message: 'TLS certificate renewed',
    resolved_by: 'cert-manager',
    resolved_at: now - 80_000,
  },
];

const services = [
  {
    server_id: 201,
    server_name: 'prod-api-01',
    runtime: 'Docker 27.1',
    status: 'healthy',
    containers: 8,
    cpu: 31,
    memory: 48,
  },
  {
    server_id: 202,
    server_name: 'prod-api-02',
    runtime: 'Docker 27.1',
    status: 'degraded',
    containers: 8,
    cpu: 72,
    memory: 81,
  },
  {
    server_id: 204,
    server_name: 'prod-web-01',
    runtime: 'Docker 27.1',
    status: 'stopped',
    containers: 0,
    cpu: 8,
    memory: 22,
  },
];

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

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
  const path = url.pathname;

  if (path === '/') {
    json(response, { fixture: '021-infrastructure-route-reverification', run_id: runId, ...state });
    return;
  }
  if (path === '/api/evidence/state') {
    const role = url.searchParams.get('role') ?? 'admin';
    const data = url.searchParams.get('data') ?? 'populated';
    if (!['admin', 'normal'].includes(role) || !['populated', 'empty'].includes(data)) {
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
        "window.WOODPECKER_VERSION = '3.9.0-task021';",
        "window.WOODPECKER_CSRF = 'task021-csrf';",
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

  if (request.method === 'GET' && path === '/api/infrastructure/overview') {
    const currentServers = empty ? [] : servers;
    const currentAlerts = empty ? [] : alerts;
    json(response, {
      server_count: currentServers.length,
      server_online: currentServers.filter((item) => item.status === 'online').length,
      server_maintenance: currentServers.filter((item) => item.maintenance).length,
      server_offline: currentServers.filter((item) => item.status === 'offline').length,
      avg_cpu: currentServers.length
        ? currentServers.reduce((sum, item) => sum + item.cpu, 0) / currentServers.length
        : 0,
      avg_memory: currentServers.length
        ? currentServers.reduce((sum, item) => sum + item.memory, 0) / currentServers.length
        : 0,
      avg_disk: currentServers.length
        ? currentServers.reduce((sum, item) => sum + item.disk, 0) / currentServers.length
        : 0,
      active_alerts: currentAlerts.filter((item) => item.status === 'active').length,
      group_count: empty ? 0 : groups.length,
      servers: currentServers,
      groups: empty ? [] : groups,
      alerts: currentAlerts,
    });
    return;
  }
  if (request.method === 'GET' && path === '/api/infrastructure/servers') {
    json(response, page(empty ? [] : servers, url));
    return;
  }
  if (request.method === 'GET' && /^\/api\/infrastructure\/servers\/\d+$/.test(path)) {
    json(response, empty ? null : (servers.find((item) => item.id === Number(path.split('/').at(-1))) ?? null));
    return;
  }
  if (request.method === 'GET' && /^\/api\/infrastructure\/servers\/\d+\/deployments$/.test(path)) {
    json(response, empty ? [] : deployments);
    return;
  }
  if (request.method === 'GET' && path === '/api/infrastructure/groups') {
    json(response, page(empty ? [] : groups, url));
    return;
  }
  if (request.method === 'GET' && path === '/api/infrastructure/services') {
    json(response, empty ? [] : services);
    return;
  }
  if (request.method === 'GET' && path === '/api/infrastructure/alerts') {
    json(response, page(empty ? [] : alerts, url));
    return;
  }
  if (request.method === 'GET' && path === '/api/environments') {
    json(response, page(empty ? [] : environments, url));
    return;
  }
  if (request.method === 'GET' && path === '/api/deployments') {
    json(response, page(empty ? [] : deployments, url));
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
  if (request.method === 'POST' && /^\/api\/infrastructure\/alerts\/\d+\/(acknowledge|resolve)$/.test(path)) {
    const id = Number(path.split('/')[4]);
    const nextStatus = path.endsWith('/resolve') ? 'resolved' : 'acknowledged';
    const alert = alerts.find((item) => item.id === id);
    json(response, alert ? { ...alert, status: nextStatus } : null);
    return;
  }

  json(response, { error: 'not found', path }, 404);
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`task021 mock API listening on http://127.0.0.1:${port}\n`);
});
