#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.TASK022_MOCK_API ?? 'http://127.0.0.1:8222';
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function wait(url, options = {}, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, options);
      if (response.ok || [409, 500].includes(response.status)) return response;
    } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

let child;
try {
  try {
    await wait(base, {}, 500);
  } catch {
    child = spawn(process.execPath, [path.join(root, 'mock_api.mjs')], { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (chunk) => process.stderr.write(chunk));
    child.stderr.on('data', (chunk) => process.stderr.write(chunk));
    await wait(base);
  }

  const identity = await (await wait(base)).json();
  assert.equal(identity.fixture, '022-deployment-route-reverification');
  await wait(`${base}/api/evidence/state?role=admin&data=populated`);
  const [applications, application, environments, releases, groups, servers, deployments, deployment, policies] =
    await Promise.all([
      wait(`${base}/api/applications?page=1&per_page=50`).then((response) => response.json()),
      wait(`${base}/api/applications/1`).then((response) => response.json()),
      wait(`${base}/api/environments?page=1&per_page=50`).then((response) => response.json()),
      wait(`${base}/api/releases?page=1&per_page=50`).then((response) => response.json()),
      wait(`${base}/api/infrastructure/groups?page=1&per_page=50`).then((response) => response.json()),
      wait(`${base}/api/infrastructure/servers?page=1&per_page=50`).then((response) => response.json()),
      wait(`${base}/api/deployments?page=1&per_page=50`).then((response) => response.json()),
      wait(`${base}/api/deployments/142`).then((response) => response.json()),
      wait(`${base}/api/ops/policies`).then((response) => response.json()),
    ]);
  assert.equal(applications.length, 2);
  assert.equal(application.application.id, 1);
  assert.equal(application.releases.length, 2);
  assert.equal(environments.length, 2);
  assert.equal(releases.length, 3);
  assert.equal(groups.length, 2);
  assert.equal(servers.length, 4);
  assert.equal(deployments.length, 3);
  assert.equal(deployment.deployment.id, 142);
  assert.equal(deployment.targets.length, 3);
  assert.equal(policies.health_check_retries, 3);

  await wait(`${base}/api/evidence/state?role=admin&data=empty`);
  assert.deepEqual(await wait(`${base}/api/deployments`).then((response) => response.json()), []);
  await wait(`${base}/api/evidence/state?role=admin&data=missing-app`);
  assert.equal(await wait(`${base}/api/applications/999`).then((response) => response.json()), null);
  await wait(`${base}/api/evidence/state?role=admin&data=error-applications`);
  assert.equal((await wait(`${base}/api/applications`)).status, 500);
  await wait(`${base}/api/evidence/state?role=admin&data=mutation-error`);
  assert.equal((await wait(`${base}/api/deployments/142/pause`, { method: 'POST' })).status, 409);
  const requests = await wait(`${base}/api/evidence/requests`).then((response) => response.json());
  assert.deepEqual(requests.requests, ['POST /api/deployments/142/pause']);

  console.log(
    JSON.stringify({
      ok: true,
      fixture: identity.fixture,
      applications: applications.length,
      environments: environments.length,
      releases: releases.length,
      deployments: deployments.length,
      states: ['populated', 'empty', 'missing-app', 'error-applications', 'mutation-error'],
    }),
  );
} finally {
  if (child?.exitCode == null) child.kill('SIGTERM');
}
