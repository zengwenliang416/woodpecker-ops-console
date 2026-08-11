#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const manifest = JSON.parse(await readFile(path.join(evidenceRoot, 'manifest.json'), 'utf8'));
const summary = JSON.parse(await readFile(path.join(evidenceRoot, 'browser-replay-summary.json'), 'utf8'));
const evidenceEntries = await readdir(evidenceRoot, { withFileTypes: true });
const rootFiles = evidenceEntries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort();
assert.deepEqual(
  evidenceEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
  [],
  'evidence directory must not contain subdirectories',
);

const destinations = [
  ['repos', 3, '/repos', '/#/repos', 'repos', 'verified', 2, 2],
  ['repo-add', 4, '/repos/add', '/#/repos/add', 'repo-add', 'blocked', 2, 3],
  ['activity', 5, '/repos/101', '/#/repos/101', 'repo', 'verified', 3, 3],
  ['branches', 6, '/repos/101/branches', '/#/repos/101/branches', 'repo-branches', 'verified', 2, 2],
  ['branch-detail', 7, '/repos/101/branches/main', '/#/repos/101/branches/main', 'repo-branch', 'verified', 2, 2],
  [
    'pull-requests',
    8,
    '/repos/101/pull-requests',
    '/#/repos/101/pull-requests',
    'repo-pull-requests',
    'verified',
    2,
    2,
  ],
  [
    'pull-request-detail',
    9,
    '/repos/101/pull-requests/92',
    '/#/repos/101/pull-requests/92',
    'repo-pull-request',
    'verified',
    2,
    2,
  ],
  ['manual', 10, '/repos/101/manual', '/#/repos/101/manual', 'repo-manual', 'verified', 2, 2],
  ['pipeline-overview', 11, '/repos/101/pipeline/842', '/#/repos/101/pipeline/842', 'repo-pipeline', 'verified', 2, 2],
  [
    'pipeline-log',
    12,
    '/repos/101/pipeline/842/2030',
    '/#/repos/101/pipeline/842?tab=logs',
    'repo-pipeline',
    'verified',
    2,
    2,
  ],
  [
    'pipeline-changed-files',
    13,
    '/repos/101/pipeline/842/changed-files',
    '/#/repos/101/pipeline/842/changed-files',
    'repo-pipeline-changed-files',
    'verified',
    2,
    2,
  ],
  [
    'pipeline-config',
    14,
    '/repos/101/pipeline/842/config',
    '/#/repos/101/pipeline/842/config',
    'repo-pipeline-config',
    'verified',
    2,
    2,
  ],
  [
    'pipeline-errors',
    15,
    '/repos/101/pipeline/842/errors',
    '/#/repos/101/pipeline/842/errors',
    'repo-pipeline-errors',
    'verified',
    2,
    2,
  ],
  [
    'pipeline-debug',
    16,
    '/repos/101/pipeline/842/debug',
    '/#/repos/101/pipeline/842/debug',
    'repo-pipeline-debug',
    'verified',
    2,
    2,
  ],
  ['settings-general', 17, '/repos/101/settings', '/#/repos/101/settings', 'repo-settings', 'verified', 2, 2],
  [
    'settings-secrets',
    18,
    '/repos/101/settings/secrets',
    '/#/repos/101/settings/secrets',
    'repo-settings-secrets',
    'verified',
    2,
    2,
  ],
  [
    'settings-registries',
    19,
    '/repos/101/settings/registries',
    '/#/repos/101/settings/registries',
    'repo-settings-registries',
    'verified',
    2,
    2,
  ],
  [
    'settings-crons',
    20,
    '/repos/101/settings/crons',
    '/#/repos/101/settings/crons',
    'repo-settings-crons',
    'verified',
    2,
    2,
  ],
  [
    'settings-badge',
    21,
    '/repos/101/settings/badge',
    '/#/repos/101/settings/badge',
    'repo-settings-badge',
    'verified',
    2,
    2,
  ],
  [
    'settings-actions',
    22,
    '/repos/101/settings/actions',
    '/#/repos/101/settings/actions',
    'repo-settings-actions',
    'verified',
    2,
    2,
  ],
  [
    'settings-extensions',
    23,
    '/repos/101/settings/extensions',
    '/#/repos/101/settings/extensions',
    'repo-settings-extensions',
    'verified',
    2,
    2,
  ],
].map(([id, row, productionPath, prototypePath, route, parityStatus, productionAssertions, prototypeAssertions]) => ({
  id,
  row,
  productionPath,
  prototypePath,
  route,
  parityStatus,
  productionAssertions,
  prototypeAssertions,
}));
const destinationById = new Map(destinations.map((destination) => [destination.id, destination]));
const viewports = {
  desktop: { width: 1600, height: 1000 },
  mobile: { width: 390, height: 844 },
};
const lightDestinations = ['repos', 'activity', 'branches', 'pull-requests', 'manual', 'settings-secrets'];
const readOnlyDestinations = ['activity', 'manual', 'settings-general', 'pipeline-debug'];

const expectedStateRecords = [
  ...Object.keys(viewports).flatMap((viewport) =>
    destinations.flatMap((destination) => [
      {
        stateId: `production-dark-zh-${viewport}-${destination.id}`,
        destination,
        surface: 'production',
        viewport,
        theme: 'dark',
        locale: 'zh-Hans',
        permission: 'admin',
      },
      {
        stateId: `prototype-dark-zh-${viewport}-${destination.id}`,
        destination,
        surface: 'prototype',
        viewport,
        theme: 'dark',
        locale: 'zh-CN',
        permission: 'prototype-administrator',
      },
    ]),
  ),
  ...Object.keys(viewports).flatMap((viewport) =>
    lightDestinations.map((destinationId) => {
      const destination = destinationById.get(destinationId);
      return {
        stateId: `production-light-en-${viewport}-${destination.id}`,
        destination,
        surface: 'production',
        viewport,
        theme: 'light',
        locale: 'en',
        permission: destination.id === 'settings-secrets' ? 'admin' : 'push',
      };
    }),
  ),
  ...readOnlyDestinations.map((destinationId) => ({
    stateId: `production-dark-zh-readonly-desktop-${destinationId}`,
    destination: destinationById.get(destinationId),
    surface: 'production',
    viewport: 'desktop',
    theme: 'dark',
    locale: 'zh-Hans',
    permission: 'readonly',
  })),
];
const expectedStateById = new Map(expectedStateRecords.map((state) => [state.stateId, state]));
const expectedStateIds = [...expectedStateById.keys()].sort();
const supportFiles = [
  'browser-replay-summary.json',
  'capture_browser.mjs',
  'manifest.json',
  'mock_api.py',
  'mock_api_smoke.mjs',
  'verify_evidence.mjs',
];

assert.equal(destinations.length, 21, 'repository destination count');
assert.equal(expectedStateRecords.length, 100, 'expected state count');
assert.equal(expectedStateById.size, 100, 'state ids must be unique');
assert.deepEqual(
  rootFiles,
  [
    ...supportFiles,
    ...expectedStateIds.map((stateId) => `${stateId}.json`),
    ...expectedStateIds.map((stateId) => `${stateId}.png`),
  ].sort(),
  'evidence root file inventory',
);
assert.deepEqual(
  destinations.map((destination) => destination.row),
  Array.from({ length: 21 }, (_, index) => index + 3),
  'repository rows must be 3 through 23',
);

const measurementFiles = rootFiles.filter((name) => /^(?:production|prototype)-.+\.json$/.test(name));
const screenshotFiles = rootFiles.filter((name) => /^(?:production|prototype)-.+\.png$/.test(name));
assert.deepEqual(
  measurementFiles,
  expectedStateIds.map((stateId) => `${stateId}.json`),
  'measurement matrix must contain exactly 100 JSON files',
);
assert.deepEqual(
  screenshotFiles,
  expectedStateIds.map((stateId) => `${stateId}.png`),
  'screenshot matrix must contain exactly 100 PNG files',
);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function aggregateChecksum(files) {
  const records = [];
  for (const file of files.toSorted()) {
    records.push(`${sha256(await readFile(path.join(evidenceRoot, file)))}  ./${file}\n`);
  }
  return sha256(records.join(''));
}

function assertPng(buffer, viewport, stateId) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${stateId} PNG signature`);
  assert.equal(buffer.readUInt32BE(16), viewport.width, `${stateId} PNG width`);
  assert.equal(buffer.readUInt32BE(20), viewport.height, `${stateId} PNG height`);
}

function controlText(control) {
  return [control.text, control.href, control.title, control.ariaLabel].filter(Boolean).join(' ');
}

function classifyWarnings(consoleMessages) {
  const categories = {
    vue_i18n: 0,
    vue_extraneous_props: 0,
    vue_router_deprecation: 0,
    other: 0,
  };
  for (const entry of consoleMessages.filter((candidate) => candidate.level === 'warning')) {
    if (entry.message.startsWith('[intlify]')) categories.vue_i18n += 1;
    else if (entry.message.startsWith('[Vue warn]: Extraneous non-props attributes')) {
      categories.vue_extraneous_props += 1;
    } else if (entry.message.startsWith('[VUE_ROUTER_')) categories.vue_router_deprecation += 1;
    else categories.other += 1;
  }
  return categories;
}

const mutationControlPattern =
  /(?:^|\s)(?:add|delete|save|repair|retry|run pipeline)(?:\s|$)|添加|删除|保存|修复|重试|运行流水线/i;
const measurements = [];

for (const stateId of expectedStateIds) {
  const expected = expectedStateById.get(stateId);
  const viewport = viewports[expected.viewport];
  const measurement = JSON.parse(await readFile(path.join(evidenceRoot, `${stateId}.json`), 'utf8'));
  const screenshot = await readFile(path.join(evidenceRoot, `${stateId}.png`));
  measurements.push(measurement);

  assert.equal(measurement.runId, manifest.run_id, `${stateId} capture run id`);
  assert.equal(measurement.stateId, stateId, `${stateId} state id`);
  assert.equal(measurement.row, expected.destination.row, `${stateId} row`);
  assert.equal(measurement.destination, expected.destination.id, `${stateId} destination`);
  assert.equal(measurement.surface, expected.surface, `${stateId} surface`);
  assert.equal(measurement.parityStatus, expected.destination.parityStatus, `${stateId} parity status`);
  assert.equal(measurement.permission, expected.permission, `${stateId} permission`);
  assert.deepEqual(measurement.viewport, { devicePixelRatio: 1, ...viewport }, `${stateId} viewport`);
  assert.deepEqual(measurement.screenshotDimensions, viewport, `${stateId} recorded PNG dimensions`);
  assert.equal(measurement.document.dataTheme, expected.theme, `${stateId} theme`);
  assert.equal(measurement.document.lang, expected.locale, `${stateId} locale`);
  assert.ok(
    measurement.document.clientWidth <= viewport.width && measurement.document.clientWidth >= viewport.width - 20,
    `${stateId} document width`,
  );
  assert.equal(measurement.document.clientHeight, viewport.height, `${stateId} document height`);
  assert.equal(measurement.pageLevelHorizontalOverflow, false, `${stateId} page-level horizontal overflow`);
  assert.deepEqual(measurement.rawI18nKeys, [], `${stateId} raw i18n keys`);
  assert.equal(typeof measurement.bodyText, 'string', `${stateId} body text`);
  assert.ok(measurement.bodyText.length > 20, `${stateId} body text content`);
  assert.equal(measurement.health.errorCount, 0, `${stateId} browser error count`);
  assert.equal(
    measurement.health.warningCount,
    measurement.health.console.filter((entry) => entry.level === 'warning').length,
    `${stateId} warning count`,
  );
  assert.deepEqual(
    measurement.health.warningCategories,
    classifyWarnings(measurement.health.console),
    `${stateId} warning categories`,
  );
  assert.deepEqual(measurement.health.runtimeExceptions, [], `${stateId} runtime exceptions`);
  assert.deepEqual(measurement.health.networkFailures, [], `${stateId} network failures`);
  assert.deepEqual(measurement.health.httpErrors, [], `${stateId} HTTP errors`);
  assert.ok(Array.isArray(measurement.controls), `${stateId} controls`);
  assert.ok(Array.isArray(measurement.denseContainers), `${stateId} dense containers`);

  const assertionCount =
    expected.permission === 'readonly'
      ? expected.destination.id === 'pipeline-debug'
        ? 2
        : expected.destination.id === 'activity'
          ? expected.destination.productionAssertions
          : 1
      : expected.surface === 'production'
        ? expected.destination.productionAssertions
        : expected.destination.prototypeAssertions;
  assert.equal(measurement.contentAssertions.length, assertionCount, `${stateId} content assertion count`);
  assert.ok(
    measurement.contentAssertions.every(
      (contentAssertion) =>
        typeof contentAssertion.pattern === 'string' && contentAssertion.pattern && contentAssertion.passed === true,
    ),
    `${stateId} content assertions`,
  );

  const redirectsToOverview =
    expected.permission === 'readonly' && ['manual', 'settings-general'].includes(expected.destination.id);
  const expectedPath = redirectsToOverview
    ? '/overview'
    : expected.surface === 'production'
      ? expected.destination.productionPath
      : expected.destination.prototypePath;
  const expectedRoute = redirectsToOverview
    ? 'overview'
    : expected.surface === 'production'
      ? expected.destination.route
      : null;
  const baseUrl = expected.surface === 'production' ? manifest.runtime.production_url : manifest.runtime.prototype_url;
  assert.equal(measurement.url, `${baseUrl}${expectedPath}`, `${stateId} URL`);
  assert.equal(measurement.terminalRouteName, expectedRoute, `${stateId} terminal route`);

  for (const container of measurement.denseContainers.filter((candidate) => candidate.locallyScrollable)) {
    assert.ok(['auto', 'scroll'].includes(container.overflowX), `${stateId} local scroll overflow mode`);
    assert.ok(container.scrollWidth > container.clientWidth, `${stateId} local scroll dimensions`);
  }
  if (expected.permission === 'readonly') {
    assert.equal(
      measurement.controls.some((control) => mutationControlPattern.test(controlText(control))),
      false,
      `${stateId} read-only mutation controls`,
    );
  }

  assertPng(screenshot, viewport, stateId);
}

const requiredLocalScrollStates = [
  'production-dark-zh-mobile-activity',
  'production-dark-zh-mobile-pipeline-overview',
  'production-dark-zh-mobile-repos',
  'production-dark-zh-mobile-settings-badge',
  'production-dark-zh-mobile-settings-crons',
  'production-dark-zh-mobile-settings-extensions',
  'production-dark-zh-mobile-settings-registries',
  'production-dark-zh-mobile-settings-secrets',
  'production-light-en-mobile-activity',
  'production-light-en-mobile-repos',
  'production-light-en-mobile-settings-secrets',
  'prototype-dark-zh-mobile-activity',
  'prototype-dark-zh-mobile-pipeline-overview',
  'prototype-dark-zh-mobile-repos',
  'prototype-dark-zh-mobile-settings-crons',
  'prototype-dark-zh-mobile-settings-registries',
  'prototype-dark-zh-mobile-settings-secrets',
];
for (const stateId of requiredLocalScrollStates) {
  const measurement = measurements.find((candidate) => candidate.stateId === stateId);
  assert.ok(
    measurement.denseContainers.some((container) => container.locallyScrollable),
    `${stateId} must contain a local horizontal scroll owner`,
  );
}

const readOnlyManual = measurements.find(
  (measurement) => measurement.stateId === 'production-dark-zh-readonly-desktop-manual',
);
const readOnlySettings = measurements.find(
  (measurement) => measurement.stateId === 'production-dark-zh-readonly-desktop-settings-general',
);
for (const measurement of [readOnlyManual, readOnlySettings]) {
  assert.equal(measurement.url, `${manifest.runtime.production_url}/overview`, `${measurement.stateId} redirect`);
  assert.equal(measurement.terminalRouteName, 'overview', `${measurement.stateId} redirect route`);
  assert.match(measurement.bodyText, /没有权限|permission/i, `${measurement.stateId} permission feedback`);
}

const readOnlyDebug = measurements.find(
  (measurement) => measurement.stateId === 'production-dark-zh-readonly-desktop-pipeline-debug',
);
assert.equal(
  readOnlyDebug.url,
  `${manifest.runtime.production_url}/repos/101/pipeline/842/debug`,
  'read-only Debug preserves direct URL',
);
assert.equal(readOnlyDebug.terminalRouteName, 'repo-pipeline-debug', 'read-only Debug terminal route');
assert.match(readOnlyDebug.bodyText, /842/, 'read-only Debug pipeline identity');
assert.match(readOnlyDebug.bodyText, /无权访问调试信息|not allowed|permissions do not allow/i);

for (const viewport of Object.keys(viewports)) {
  const productionAdd = measurements.find(
    (measurement) => measurement.stateId === `production-dark-zh-${viewport}-repo-add`,
  );
  const prototypeAdd = measurements.find(
    (measurement) => measurement.stateId === `prototype-dark-zh-${viewport}-repo-add`,
  );
  assert.equal(productionAdd.semanticMarkers.wizardStepCount, 0, `${viewport} production add wizard steps`);
  assert.equal(prototypeAdd.semanticMarkers.wizardStepCount, 4, `${viewport} prototype add wizard steps`);
}

const warningCategories = measurements.reduce(
  (aggregate, measurement) => {
    for (const [category, count] of Object.entries(measurement.health.warningCategories)) {
      aggregate[category] += count;
    }
    return aggregate;
  },
  { vue_i18n: 0, vue_extraneous_props: 0, vue_router_deprecation: 0, other: 0 },
);

assert.equal(manifest.schema_version, 1, 'manifest schema');
assert.equal(manifest.task_id, '014-repository-validation-evidence', 'manifest task');
assert.equal(typeof manifest.run_id, 'string', 'manifest run id');
assert.equal(summary.runId, manifest.run_id, 'summary run id');
assert.deepEqual(
  manifest.matrix.repository_rows,
  Array.from({ length: 21 }, (_, index) => index + 3),
);
assert.equal(manifest.matrix.primary_states, 84, 'manifest primary states');
assert.equal(manifest.matrix.secondary_states, 16, 'manifest secondary states');
assert.equal(manifest.matrix.expected_states, 100, 'manifest expected states');
assert.deepEqual(manifest.expected_outcome.verified_rows, summary.verifiedRows, 'verified rows');
assert.deepEqual(manifest.expected_outcome.blocked_rows, [4], 'blocked rows');
assert.match(manifest.expected_outcome.blocked_reason['4'], /four-step configuration wizard/i);
assert.equal(manifest.actual.states, 100, 'manifest actual states');
assert.equal(manifest.actual.production_states, 58, 'manifest production states');
assert.equal(manifest.actual.prototype_states, 42, 'manifest prototype states');
assert.deepEqual(manifest.actual.error_states, [], 'manifest error states');
assert.equal(
  manifest.actual.warning_count,
  measurements.reduce((total, measurement) => total + measurement.health.warningCount, 0),
  'manifest warning count',
);
assert.deepEqual(manifest.actual.warning_categories, warningCategories, 'manifest warning categories');
assert.deepEqual(summary.warningCategories, warningCategories, 'summary warning categories');
assert.equal(warningCategories.other, 0, 'unexpected warning categories');

assert.equal(summary.ok, true, 'browser replay summary');
assert.equal(summary.states, 100, 'summary state count');
assert.equal(summary.primaryStates, 84, 'summary primary state count');
assert.equal(summary.secondaryStates, 16, 'summary secondary state count');
assert.equal(summary.productionStates, 58, 'summary production state count');
assert.equal(summary.prototypeStates, 42, 'summary prototype state count');
assert.deepEqual(summary.verifiedRows, manifest.expected_outcome.verified_rows, 'summary verified rows');
assert.deepEqual(summary.blockedRows, [4], 'summary blocked rows');
assert.deepEqual(summary.errorStates, [], 'summary error states');

const { stdout: gitHeadOutput } = await execFile('git', ['rev-parse', 'HEAD'], { cwd: projectRoot });
const gitHead = gitHeadOutput.trim();
assert.equal(manifest.commit, gitHead, 'manifest commit');
assert.equal(summary.serviceIdentity.sourceBaseCommit, gitHead, 'summary source base commit');
assert.equal(summary.serviceIdentity.gitHead, gitHead, 'summary Git head');
assert.deepEqual(manifest.service_identity, summary.serviceIdentity, 'service identity correspondence');
assert.equal(manifest.service_identity.productionRuntimeUnchangedFromBase, true, 'production runtime drift');
assert.equal(manifest.service_identity.serviceOwnership, 'task-started-exclusive-ports', 'service ownership');
assert.equal(manifest.service_identity.runId, manifest.run_id, 'service run id');
assert.equal(manifest.service_identity.mockFixture, '014-repository-validation-evidence', 'mock fixture');
assert.equal(manifest.service_identity.proxiedRepository, 'acme/backend-api', 'proxied repository identity');
assert.equal(manifest.service_identity.productionEntrypoint, '/src/main.ts', 'production entrypoint');
assert.equal(manifest.service_identity.productionRouterMarker, 'repo-settings-extensions', 'router identity');
assert.equal(manifest.service_identity.prototypeMarker, 'approved-user-design', 'prototype identity');
const prototypeRelativePath = 'openspec/changes/align-frontend-with-functional-prototype/prototype/artifact';
const [{ stdout: productionTree }, { stdout: prototypeTree }] = await Promise.all([
  execFile('git', ['rev-parse', `${gitHead}:web`], { cwd: projectRoot }),
  execFile('git', ['rev-parse', `${gitHead}:${prototypeRelativePath}`], { cwd: projectRoot }),
]);
assert.equal(manifest.service_identity.productionTree, productionTree.trim(), 'production tree identity');
assert.equal(manifest.service_identity.prototypeTree, prototypeTree.trim(), 'prototype tree identity');
assert.equal(
  manifest.service_identity.prototypeIndexSha256,
  sha256(await readFile(path.join(projectRoot, prototypeRelativePath, 'index.html'))),
  'prototype index identity',
);
await execFile('git', ['diff', '--quiet', gitHead, '--', 'web', prototypeRelativePath], {
  cwd: projectRoot,
});
const { stdout: protectedStatus } = await execFile(
  'git',
  ['status', '--porcelain', '--', 'web', prototypeRelativePath],
  { cwd: projectRoot },
);
assert.equal(protectedStatus.trim(), '', 'production or approved-prototype worktree status');

for (const [relativePath, expectedChecksum] of Object.entries(manifest.service_identity.dependencyChecksums)) {
  assert.equal(
    sha256(await readFile(path.join(projectRoot, relativePath))),
    expectedChecksum,
    `${relativePath} dependency checksum`,
  );
}

assert.equal(manifest.checksums.all_png_files, await aggregateChecksum(screenshotFiles), 'aggregate PNG checksum');
assert.equal(
  manifest.checksums.all_measurement_files,
  await aggregateChecksum(measurementFiles),
  'aggregate measurement checksum',
);
for (const [manifestKey, fileName] of [
  ['mock_api_py', 'mock_api.py'],
  ['mock_api_smoke_mjs', 'mock_api_smoke.mjs'],
  ['capture_browser_mjs', 'capture_browser.mjs'],
  ['verify_evidence_mjs', 'verify_evidence.mjs'],
  ['browser_replay_summary_json', 'browser-replay-summary.json'],
]) {
  assert.equal(
    manifest.checksums[manifestKey],
    sha256(await readFile(path.join(evidenceRoot, fileName))),
    `${fileName} checksum`,
  );
}

console.log(
  JSON.stringify({
    ok: true,
    runId: manifest.run_id,
    states: measurements.length,
    productionStates: measurements.filter((measurement) => measurement.surface === 'production').length,
    prototypeStates: measurements.filter((measurement) => measurement.surface === 'prototype').length,
    verifiedRows: manifest.expected_outcome.verified_rows,
    blockedRows: manifest.expected_outcome.blocked_rows,
    pageOverflowStates: measurements
      .filter((measurement) => measurement.pageLevelHorizontalOverflow)
      .map((measurement) => measurement.stateId),
    rawI18nStates: measurements
      .filter((measurement) => measurement.rawI18nKeys.length > 0)
      .map((measurement) => measurement.stateId),
    browserErrorStates: measurements
      .filter((measurement) => measurement.health.errorCount > 0)
      .map((measurement) => measurement.stateId),
    warningCategories,
    checksumsVerified: true,
  }),
);
