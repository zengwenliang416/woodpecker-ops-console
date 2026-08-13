#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.TASK020_MOCK_API ?? 'http://127.0.0.1:8202';
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForUrl(url, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 204) return response;
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(150);
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

async function json(pathname) {
  const response = await waitForUrl(`${baseUrl}${pathname}`);
  return response.json();
}

let child;
try {
  try {
    const identity = await json('/');
    assert.equal(identity.fixture, '020-overview-repositories-reverification');
  } catch {
    child = spawn('python3', [path.join(evidenceRoot, 'mock_api.py')], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (chunk) => process.stderr.write(chunk));
    child.stderr.on('data', (chunk) => process.stderr.write(chunk));
    await waitForUrl(baseUrl);
  }

  const identity = await json('/');
  assert.equal(identity.fixture, '020-overview-repositories-reverification');

  await json('/api/evidence/state?role=admin&data=populated');
  const [repos, feed, forges, agents, queue, pipelines] = await Promise.all([
    json('/api/user/repos'),
    json('/api/user/feed'),
    json('/api/forges?page=1'),
    json('/api/agents?page=1'),
    json('/api/queue/info'),
    json('/api/repos/101/pipelines?page=1'),
  ]);
  assert.equal(repos.length, 3);
  assert.equal(feed.length, 7);
  assert.equal(forges.length, 2);
  assert.equal(agents.length, 2);
  assert.equal(queue.stats.worker_count, 2);
  assert.equal(pipelines.length, 3);

  await json('/api/evidence/state?role=normal&data=populated');
  const normalConfig = await (await waitForUrl(`${baseUrl}/web-config.js`)).text();
  assert.match(normalConfig, /admin: false/);

  await json('/api/evidence/state?role=admin&data=empty');
  assert.deepEqual(await json('/api/user/repos'), []);

  await json('/api/evidence/state?role=admin&data=partial');
  const forgeFailure = await fetch(`${baseUrl}/api/forges?page=1`);
  const agentFailure = await fetch(`${baseUrl}/api/agents?page=1`);
  assert.equal(forgeFailure.status, 503);
  assert.equal(agentFailure.status, 503);

  console.log(
    JSON.stringify({
      ok: true,
      fixture: identity.fixture,
      repositories: repos.length,
      feed: feed.length,
      forges: forges.length,
      agents: agents.length,
      pipelines: pipelines.length,
      states: ['admin/populated', 'normal/populated', 'admin/empty', 'admin/partial'],
    }),
  );
} finally {
  if (child && child.exitCode == null) child.kill('SIGTERM');
}
