#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.TASK021_MOCK_API ?? 'http://127.0.0.1:8212';
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function wait(url, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 204) return response;
    } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

let child;
try {
  try {
    await wait(base, 500);
  } catch {
    child = spawn(process.execPath, [path.join(root, 'mock_api.mjs')], { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (chunk) => process.stderr.write(chunk));
    child.stderr.on('data', (chunk) => process.stderr.write(chunk));
    await wait(base);
  }

  const identity = await (await wait(base)).json();
  assert.equal(identity.fixture, '021-infrastructure-route-reverification');
  await wait(`${base}/api/evidence/state?role=admin&data=populated`);
  const [overview, servers, server, deployments, groups, services, alerts, environments] = await Promise.all([
    wait(`${base}/api/infrastructure/overview`).then((response) => response.json()),
    wait(`${base}/api/infrastructure/servers?page=1&per_page=50`).then((response) => response.json()),
    wait(`${base}/api/infrastructure/servers/201`).then((response) => response.json()),
    wait(`${base}/api/infrastructure/servers/201/deployments`).then((response) => response.json()),
    wait(`${base}/api/infrastructure/groups?page=1&per_page=50`).then((response) => response.json()),
    wait(`${base}/api/infrastructure/services`).then((response) => response.json()),
    wait(`${base}/api/infrastructure/alerts?page=1&per_page=50`).then((response) => response.json()),
    wait(`${base}/api/environments?page=1&per_page=50`).then((response) => response.json()),
  ]);
  assert.equal(overview.server_count, 3);
  assert.equal(servers.length, 3);
  assert.equal(server.id, 201);
  assert.equal(deployments.length, 2);
  assert.equal(groups.length, 2);
  assert.equal(services.length, 3);
  assert.equal(alerts.length, 3);
  assert.equal(environments.length, 2);

  await wait(`${base}/api/evidence/state?role=normal&data=empty`);
  const config = await (await wait(`${base}/web-config.js`)).text();
  assert.match(config, /admin: false/);
  assert.deepEqual(await wait(`${base}/api/infrastructure/services`).then((response) => response.json()), []);
  console.log(
    JSON.stringify({
      ok: true,
      fixture: identity.fixture,
      servers: servers.length,
      groups: groups.length,
      services: services.length,
      alerts: alerts.length,
      environments: environments.length,
      states: ['admin/populated', 'normal/empty'],
    }),
  );
} finally {
  if (child?.exitCode == null) child.kill('SIGTERM');
}
