#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.TASK014_MOCK_API ?? 'http://127.0.0.1:8142';
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
    assert.equal(identity.fixture, '014-repository-validation-evidence');
  } catch {
    child = spawn('python3', [path.join(evidenceRoot, 'mock_api.py')], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (chunk) => process.stderr.write(chunk));
    child.stderr.on('data', (chunk) => process.stderr.write(chunk));
    await waitForUrl(baseUrl);
  }

  const [identity, allRepos, ownedRepos, repo, pipelines, branches, pullRequests, secrets, registries, crons] =
    await Promise.all([
      json('/'),
      json('/api/user/repos?all=true'),
      json('/api/user/repos'),
      json('/api/repos/101'),
      json('/api/repos/101/pipelines?page=1'),
      json('/api/repos/101/branches?page=1'),
      json('/api/repos/101/pull_requests?page=1'),
      json('/api/repos/101/secrets?page=1'),
      json('/api/repos/101/registries?page=1'),
      json('/api/repos/101/cron?page=1'),
    ]);

  assert.equal(identity.fixture, '014-repository-validation-evidence');
  assert.equal(allRepos.length, 2);
  assert.equal(ownedRepos.length, 1);
  assert.equal(repo.full_name, 'acme/backend-api');
  assert.equal(pipelines.length, 2);
  assert.ok(pipelines.some((pipeline) => pipeline.number === 842));
  assert.ok(pipelines.some((pipeline) => pipeline.ref === 'refs/pull/92/head'));
  assert.ok(branches.includes('main'));
  assert.equal(pullRequests[0].index, '92');
  assert.equal(secrets[0].name, 'DEPLOY_TOKEN');
  assert.equal(registries[0].address, 'registry.example/acme');
  assert.equal(crons[0].name, 'nightly-main');

  const readonly = await json('/api/evidence/permissions?role=readonly');
  assert.equal(readonly.permissions.pull, true);
  assert.equal(readonly.permissions.push, false);
  assert.equal(readonly.permissions.admin, false);

  const admin = await json('/api/evidence/permissions?role=admin');
  assert.equal(admin.permissions.pull, true);
  assert.equal(admin.permissions.push, true);
  assert.equal(admin.permissions.admin, true);

  console.log(
    JSON.stringify({
      ok: true,
      fixture: identity.fixture,
      repositories: allRepos.length,
      pipelines: pipelines.length,
      branches: branches.length,
      pullRequests: pullRequests.length,
      settingsResources: {
        secrets: secrets.length,
        registries: registries.length,
        crons: crons.length,
      },
    }),
  );
} finally {
  if (child && child.exitCode == null) child.kill('SIGTERM');
}
