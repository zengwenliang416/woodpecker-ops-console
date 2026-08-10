#!/usr/bin/env node

import assert from 'node:assert/strict';

const baseUrl = process.env.TASK009_MOCK_API ?? 'http://127.0.0.1:8123';

async function request(path, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`);
  assert.equal(response.status, expectedStatus, `${path} returned ${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}

const repo = await request('/api/repos/101');
assert.equal(repo.id, 101);
assert.equal(repo.full_name, 'acme/backend-api');

const pipeline = await request('/api/repos/101/pipelines/842');
assert.equal(pipeline.number, 842);
assert.equal(pipeline.status, 'failure');
assert.equal(pipeline.workflows.length, 2);
assert.equal(pipeline.workflows.flatMap((workflow) => workflow.children).length, 4);

const config = await request('/api/repos/101/pipelines/842/config');
assert.equal(config.length, 1);
assert.equal(config[0].name, '.woodpecker.yml');

const logs = await request('/api/repos/101/logs/842/2003');
assert.equal(logs.length, 4);
assert.equal(logs.filter((line) => line.type === 1).length, 3);

await request('/api/repos/101/pipelines/842/metadata');
await request('/api/forges/1');
await request('/api/applications?page=1&perPage=50');
await request('/api/environments?page=1&perPage=50');
await request('/api/releases?page=1&perPage=50');
await request('/api/stream/events', 204);
await request('/api/repos/101/logs/842/not-a-number', 400);
await request('/api/not-supported', 404);

const readOnly = await request('/api/evidence/permissions?push=0');
assert.equal(readOnly.permissions.pull, true);
assert.equal(readOnly.permissions.push, false);
assert.equal(readOnly.permissions.admin, false);

const restored = await request('/api/evidence/permissions?push=1');
assert.equal(restored.permissions.pull, true);
assert.equal(restored.permissions.push, true);
assert.equal(restored.permissions.admin, true);

console.log(
  JSON.stringify({
    ok: true,
    baseUrl,
    endpoints: 14,
    permissionStateRestored: 'push',
  }),
);
