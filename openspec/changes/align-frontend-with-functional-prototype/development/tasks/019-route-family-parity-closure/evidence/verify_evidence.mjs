#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const evidenceRoot = process.env.TASK019_EVIDENCE_ROOT ? path.resolve(process.env.TASK019_EVIDENCE_ROOT) : scriptRoot;
const projectRoot = path.resolve(scriptRoot, '../../../../../../..');
const productionRoot = path.join(projectRoot, 'web');
const prototypeRoot = path.join(
  projectRoot,
  'openspec/changes/align-frontend-with-functional-prototype/prototype/artifact',
);
const summary = JSON.parse(await readFile(path.join(evidenceRoot, 'browser-replay-summary.json'), 'utf8'));

const contentOracle = {
  login: {
    production: [/欢迎回来|Welcome back/i, /forge\.example/i],
    prototype: [/欢迎回来/i, /使用 GitHub 登录/i],
  },
  'org-overview': {
    production: [/acme/i, /backend-api/i],
    prototype: [/acme/i],
  },
  'org-secrets': {
    production: [/ORG_SIGNING_KEY/i, /Secret|密钥/i],
    prototype: [/Secret|密钥/i],
  },
  'org-registries': {
    production: [/ghcr\.io\/acme/i, /Registry|注册表|镜像仓库/i],
    prototype: [/Registry|注册表|镜像仓库/i],
  },
  'org-agents': {
    production: [/agent-17/i, /Agent/i],
    prototype: [/Agent/i],
  },
  'admin-info': {
    production: [/3\.9\.0-task019/i, /管理入口|Administration destinations/i],
    prototype: [/系统管理/i],
  },
  'admin-secrets': {
    production: [/GLOBAL_MIRROR/i, /密钥|Secret/i],
    prototype: [/全局 Secrets/i],
  },
  'admin-registries': {
    production: [/docker\.io/i, /注册表|镜像仓库|Registry/i],
    prototype: [/全局镜像仓库/i],
  },
  'admin-repos': {
    production: [/acme\/backend-api/i, /仓库|Repositor/i],
    prototype: [/仓库管理/i],
  },
  'admin-users': {
    production: [/alice/i, /用户|Users/i],
    prototype: [/用户管理/i],
  },
  'admin-orgs': {
    production: [/acme/i, /组织|Organizations/i],
    prototype: [/组织管理/i],
  },
  'admin-agents': {
    production: [/agent-admin-1/i, /Agent/i],
    prototype: [/Agent 集群/i],
  },
  'admin-queue': {
    production: [/backend-build/i, /队列|Queue/i],
    prototype: [/任务队列/i],
  },
  'admin-forges': {
    production: [/forge\.example/i, /Forge/i],
    prototype: [/Forge 连接/i],
  },
  'admin-forge': {
    production: [/编辑代码托管平台|Edit forge/i, /URL/i],
    prototype: [/连接设置/i],
  },
  'admin-forge-create': {
    production: [/添加代码托管平台|Add forge/i, /URL/i],
    prototype: [/新建 Forge/i],
  },
  'user-general': {
    production: [/账户设置|Account/i, /alice@example\.test/i],
    prototype: [/个人设置/i, /个人资料/i],
  },
  'user-secrets': {
    production: [/ORG_SIGNING_KEY/i, /密钥|Secret/i],
    prototype: [/个人 Secrets/i],
  },
  'user-registries': {
    production: [/ghcr\.io\/acme/i, /注册表|Registry/i],
    prototype: [/个人镜像仓库/i],
  },
  'user-cli-api': {
    production: [/task017-personal-token/i, /CLI.*API/i],
    prototype: [/CLI 与 API/i],
  },
  'user-agents': {
    production: [/agent-17/i, /Agent/i],
    prototype: [/个人 Agents/i],
  },
  'cli-auth': {
    production: [/登录到 CLI|Sign in to CLI/i, /Woodpecker CLI/i],
    prototype: [/授权命令行访问/i],
  },
  'not-found': {
    production: [/页面不存在|Page not found/i, /404/i],
    prototype: [/页面不存在/i, /404/i],
  },
};
const healthKeys = ['consoleErrors', 'runtimeExceptions', 'networkFailures', 'httpErrors'];
const destinations = [
  ['login', 1, 'login', '/login'],
  ['org-overview', 24, 'org', '/orgs/1'],
  ['org-secrets', 25, 'org-settings-secrets', '/orgs/1/settings/secrets'],
  ['org-registries', 26, 'org-settings-registries', '/orgs/1/settings/registries'],
  ['org-agents', 27, 'org-settings-agents', '/orgs/1/settings/agents'],
  ['admin-info', 28, 'admin-settings', '/admin'],
  ['admin-secrets', 29, 'admin-settings-secrets', '/admin/secrets'],
  ['admin-registries', 30, 'admin-settings-registries', '/admin/registries'],
  ['admin-repos', 31, 'admin-settings-repos', '/admin/repos'],
  ['admin-users', 32, 'admin-settings-users', '/admin/users'],
  ['admin-orgs', 33, 'admin-settings-orgs', '/admin/orgs'],
  ['admin-agents', 34, 'admin-settings-agents', '/admin/agents'],
  ['admin-queue', 35, 'admin-settings-queue', '/admin/queue'],
  ['admin-forges', 36, 'admin-settings-forges', '/admin/forges'],
  ['admin-forge', 37, 'admin-settings-forge', '/admin/forges/1'],
  ['admin-forge-create', 38, 'admin-settings-forge-create', '/admin/forges/create'],
  ['user-general', 39, 'user', '/user'],
  ['user-secrets', 40, 'user-secrets', '/user/secrets'],
  ['user-registries', 41, 'user-registries', '/user/registries'],
  ['user-cli-api', 42, 'user-cli-and-api', '/user/cli-and-api'],
  ['user-agents', 43, 'user-agents', '/user/agents'],
  ['cli-auth', 44, null, '/cli/auth?port=49152'],
  ['not-found', 45, 'not-found', '/definitely-not-a-route'],
];
const viewports = [
  ['desktop', 1600, 1000],
  ['mobile', 390, 844],
];
const expectedStates = new Map(
  destinations.flatMap(([destination, row, routeName, routePath]) =>
    viewports.flatMap(([viewport, width, height]) =>
      ['production', 'prototype'].map((surface) => [
        `${surface}-dark-zh-${viewport}-${destination}`,
        { surface, destination, row, routeName, routePath, viewport, width, height },
      ]),
    ),
  ),
);
const expectedStateIds = [...expectedStates.keys()].sort();
const rows = destinations.map(([, row]) => row);

function serializedPattern(pattern) {
  return pattern.toString();
}

async function listFiles(root, relativeRoot = '') {
  const entries = await readdir(path.join(root, relativeRoot), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeRoot, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(root, relativePath)));
    else if (entry.isFile()) files.push(relativePath);
  }
  return files;
}

async function digestTree(root, includedFiles) {
  const hash = createHash('sha256');
  const files = includedFiles ?? (await listFiles(root));
  for (const relativePath of [...files].sort()) {
    hash.update(relativePath);
    hash.update('\0');
    hash.update(await readFile(path.join(root, relativePath)));
    hash.update('\0');
  }
  return { algorithm: 'sha256', digest: hash.digest('hex'), files: files.length };
}

async function currentSourceIdentity() {
  const productionFiles = (await listFiles(productionRoot)).filter(
    (file) =>
      (file.startsWith('src/') ||
        file === 'index.html' ||
        file === 'package.json' ||
        file === 'pnpm-lock.yaml' ||
        file === 'vite.config.ts' ||
        file === 'tsconfig.json') &&
      !file.includes('/__snapshots__/'),
  );
  return {
    production: await digestTree(productionRoot, productionFiles),
    prototype: await digestTree(prototypeRoot),
  };
}

assert.equal(summary.schema, 'woodpecker.route-family-browser-replay.v1');
assert.equal(summary.ok, true);
assert.equal(summary.states, 92);
assert.equal(summary.productionStates, 46);
assert.equal(summary.prototypeStates, 46);
assert.deepEqual(summary.rows, rows);
assert.deepEqual(summary.failedStates, []);
assert.deepEqual(summary.stateIds, expectedStateIds);
assert.deepEqual(summary.serviceIdentity, {
  fixture: '019-route-family-parity-closure',
  runId: summary.runId,
});
assert.deepEqual(summary.sourceIdentity, await currentSourceIdentity());

const files = await readdir(evidenceRoot);
const measurements = files.filter((file) => /^(?:production|prototype)-.+\.json$/.test(file)).sort();
const screenshots = files.filter((file) => /^(?:production|prototype)-.+\.png$/.test(file)).sort();
assert.equal(measurements.length, 92);
assert.equal(screenshots.length, 92);
assert.deepEqual(measurements.map((file) => file.replace(/\.json$/, '')).sort(), expectedStateIds);
assert.deepEqual(screenshots.map((file) => file.replace(/\.png$/, '')).sort(), expectedStateIds);

for (const file of measurements) {
  const stateId = file.replace(/\.json$/, '');
  const expected = expectedStates.get(stateId);
  assert.ok(expected, `${file}: expected state`);
  const measurement = JSON.parse(await readFile(path.join(evidenceRoot, file), 'utf8'));
  assert.equal(measurement.stateId, stateId, `${file}: state ID`);
  assert.equal(measurement.runId, summary.runId, `${file}: run ID`);
  assert.equal(measurement.row, expected.row, `${file}: row`);
  assert.equal(measurement.surface, expected.surface, `${file}: surface`);
  assert.equal(measurement.document.theme, 'dark', `${file}: theme`);
  assert.equal(measurement.document.lang, expected.surface === 'production' ? 'zh-Hans' : 'zh-CN', `${file}: language`);
  assert.deepEqual(
    measurement.viewport,
    { id: expected.viewport, width: expected.width, height: expected.height },
    `${file}: viewport`,
  );
  assert.equal(measurement.document.height, expected.height, `${file}: document height`);
  if (expected.surface === 'production') {
    assert.equal(measurement.document.width, expected.width, `${file}: document width`);
    assert.equal(measurement.terminalRouteName, expected.routeName, `${file}: terminal route`);
    assert.equal(measurement.terminalPath, expected.routePath, `${file}: terminal path`);
  } else {
    assert.ok(
      measurement.document.width <= expected.width && measurement.document.width >= expected.width - 10,
      `${file}: prototype document width`,
    );
    assert.equal(measurement.terminalRouteName, null, `${file}: prototype route`);
    assert.equal(measurement.terminalPath, expected.routePath, `${file}: prototype path`);
  }
  assert.equal(measurement.pageLevelHorizontalOverflow, false, `${file}: overflow`);
  assert.deepEqual(measurement.rawI18nKeys, [], `${file}: raw i18n keys`);
  assert.equal(typeof measurement.bodyText, 'string', `${file}: body text`);
  const expectedPatterns = contentOracle[expected.destination]?.[expected.surface];
  assert.ok(expectedPatterns, `${file}: content oracle`);
  assert.ok(Array.isArray(measurement.contentAssertions), `${file}: content assertion array`);
  assert.equal(measurement.contentAssertions.length, expectedPatterns.length, `${file}: content assertion count`);
  assert.deepEqual(
    measurement.contentAssertions.map(({ pattern }) => pattern),
    expectedPatterns.map(serializedPattern),
    `${file}: content assertion inventory`,
  );
  assert.equal(
    new Set(measurement.contentAssertions.map(({ pattern }) => pattern)).size,
    expectedPatterns.length,
    `${file}: duplicate content assertions`,
  );
  for (const [index, pattern] of expectedPatterns.entries()) {
    const assertion = measurement.contentAssertions[index];
    assert.deepEqual(Object.keys(assertion).sort(), ['passed', 'pattern'], `${file}: content assertion keys`);
    assert.equal(assertion.passed, true, `${file}: producer content assertion`);
    assert.equal(pattern.test(measurement.bodyText), true, `${file}: verifier content oracle`);
  }
  if (Object.hasOwn(measurement, 'bodyTextSample')) {
    assert.equal(measurement.bodyTextSample, measurement.bodyText.slice(0, 2200), `${file}: body text sample`);
  }
  assert.equal(measurement.health !== null && typeof measurement.health === 'object', true, `${file}: health object`);
  assert.deepEqual(Object.keys(measurement.health).sort(), [...healthKeys].sort(), `${file}: health keys`);
  for (const key of healthKeys) {
    assert.ok(Array.isArray(measurement.health[key]), `${file}: ${key} array`);
    assert.deepEqual(measurement.health[key], [], `${file}: ${key}`);
  }

  const screenshotPath = path.join(evidenceRoot, file.replace(/\.json$/, '.png'));
  const screenshotStat = await stat(screenshotPath);
  assert.ok(screenshotStat.size > 10_000, `${file}: screenshot size`);
  const screenshot = await readFile(screenshotPath);
  assert.equal(screenshot.toString('ascii', 1, 4), 'PNG', `${file}: PNG signature`);
  assert.equal(screenshot.readUInt32BE(16), expected.width, `${file}: screenshot width`);
  assert.equal(screenshot.readUInt32BE(20), expected.height, `${file}: screenshot height`);
}

console.log(
  JSON.stringify({
    ok: true,
    runId: summary.runId,
    measurements: measurements.length,
    screenshots: screenshots.length,
    rows,
  }),
);
