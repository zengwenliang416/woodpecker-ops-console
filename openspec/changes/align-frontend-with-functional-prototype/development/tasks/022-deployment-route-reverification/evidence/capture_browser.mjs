#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const upstreamPath = path.resolve(
  evidenceRoot,
  '../../021-infrastructure-route-reverification/evidence/capture_browser.mjs',
);
const generatedPath = path.join(evidenceRoot, `.capture-browser-${process.pid}.generated.mjs`);

function replaceExact(source, before, after, label) {
  const matches = source.split(before).length - 1;
  assert.equal(matches, 1, `${label} anchor count`);
  return source.replace(before, after);
}

let source = await readFile(upstreamPath, 'utf8');
source = replaceExact(
  source,
  "import { expectedPatterns, states } from './matrix.mjs';",
  "import { expectedPatterns, readinessPatterns, states } from './matrix.mjs';",
  'matrix import',
);
source = source.replaceAll('TASK021_', 'TASK022_');
source = source.replaceAll('task021', 'task022');
source = source.replaceAll('021-infrastructure-route-reverification', '022-deployment-route-reverification');
source = source.replaceAll('8210', '8220').replaceAll('8211', '8221').replaceAll('8212', '8222');
source = replaceExact(source, 'assert.equal(states.length, 62);', 'assert.equal(states.length, 54);', 'state count');
source = replaceExact(
  source,
  'function expectedHttpErrors(state) {\n  return [];\n}',
  'function expectedHttpErrors(state) {\n  return state.expectedHttpErrors ?? [];\n}',
  'HTTP error contract',
);
source = replaceExact(
  source,
  "      const text = document.body?.innerText || '';\n      const denseContainers",
  `      const text = document.body?.innerText || '';
      const localizationRoot = document.body?.cloneNode(true);
      localizationRoot
        ?.querySelectorAll('code, pre, .log-console, .wp-mono, .target-copy p > span')
        .forEach((node) => node.remove());
      const localizationText = localizationRoot?.innerText || '';
      const denseContainers`,
  'localization text source',
);
source = replaceExact(
  source,
  "        bodyTextSample: text.trim().replace(/\\\\s+/g, ' ').slice(0, 2400),\n        document:",
  `        bodyTextSample: text.trim().replace(/\\\\s+/g, ' ').slice(0, 2400),
        localizationText: localizationText.trim().replace(/\\\\s+/g, ' '),
        rawEnumTokens: \${state.surface === 'production' && state.locale === 'zh-Hans'
          ? "[...new Set(localizationText.match(/(?<![A-Za-z0-9_])(?:draft|pending_approval|rejected|approved|running|paused|success|failed|cancelled|single|all-at-once|rolling|ready|deployed|superseded|rolled_back|queued|deploying|health_check|healthy|skipped|waiting|pulling|starting|system)(?![A-Za-z0-9_])/gi) || [])]"
          : '[]'},
        document:`,
  'raw enum measurement',
);
source = replaceExact(
  source,
  '  const patterns = expectedPatterns(state);\n  await waitForDocument(client, patterns);\n\n  const measurementResult',
  `  const patterns = expectedPatterns(state);
  await waitForDocument(client, readinessPatterns(state));
  if (state.interaction) {
    const clicked = await client.send('Runtime.evaluate', {
      expression: \`(() => {
        const expected = \${JSON.stringify(state.interaction.buttonText)};
        const button = [...document.querySelectorAll('button')].find(
          (node) => (node.textContent || '').trim() === expected
        );
        if (!button) return false;
        button.click();
        return true;
      })()\`,
      returnByValue: true,
    });
    assert.equal(clicked.result.value, true, \`\${state.id} interaction control\`);
  }
  await waitForDocument(client, patterns);

  const measurementResult`,
  'boundary interaction',
);
source = replaceExact(
  source,
  'fetch(`${productionUrl}/src/views/infrastructure/InfrastructureServer.vue`).then((response) => response.text()),',
  'fetch(`${productionUrl}/src/views/deployments/DeploymentDetail.vue`).then((response) => response.text()),',
  'production marker source',
);
source = replaceExact(
  source,
  'assert.match(productionView, /workload-restart-unsupported/);',
  'assert.match(productionView, /mutationPending/);',
  'production marker assertion',
);
source = replaceExact(
  source,
  "productionMarker: 'workload-restart-unsupported',",
  "productionMarker: 'mutationPending',",
  'production marker identity',
);
source = replaceExact(
  source,
  '    raw_i18n_states: measurements.filter((measurement) => measurement.rawI18nKeys.length > 0).map((m) => m.stateId),',
  `    raw_i18n_states: measurements.filter((measurement) => measurement.rawI18nKeys.length > 0).map((m) => m.stateId),
    raw_enum_states: measurements.filter((measurement) => measurement.rawEnumTokens.length > 0).map((m) => m.stateId),`,
  'raw enum manifest',
);
source = replaceExact(
  source,
  '        measurement.rawI18nKeys.length > 0 ||\n        measurement.contentAssertions.some',
  '        measurement.rawI18nKeys.length > 0 ||\n        measurement.rawEnumTokens.length > 0 ||\n        measurement.contentAssertions.some',
  'raw enum failed state',
);
source = replaceExact(
  source,
  "schema: 'woodpecker.infrastructure-browser-replay.v1',",
  "schema: 'woodpecker.deployment-browser-replay.v1',",
  'summary schema',
);
source = replaceExact(
  source,
  'async function stopChild(child) {',
  `async function stopProfileProcesses(profile) {
  for (const signal of ['TERM', 'KILL']) {
    const killer = spawn('pkill', [\`-\${signal}\`, '-f', profile], { stdio: 'ignore' });
    await new Promise((resolve) => killer.once('exit', resolve));
    await sleep(200);
  }
}

async function stopChild(child) {`,
  'profile cleanup helper',
);
source = replaceExact(
  source,
  `  await stopChild(chrome);
  for (let index = services.length - 1; index >= 0; index -= 1) await stopChild(services[index]);
  if (chromeProfile) await rm(chromeProfile, { recursive: true, force: true });`,
  `  await stopChild(chrome);
  if (chromeProfile) await stopProfileProcesses(chromeProfile);
  for (let index = services.length - 1; index >= 0; index -= 1) await stopChild(services[index]);
  if (chromeProfile) await rm(chromeProfile, { recursive: true, force: true });`,
  'profile cleanup call',
);
source = replaceExact(
  source,
  "    verify_evidence_mjs: sha256(await readFile(path.join(evidenceRoot, 'verify_evidence.mjs'))),",
  `    verify_evidence_mjs: sha256(await readFile(path.join(evidenceRoot, 'verify_evidence.mjs'))),
    redteam_verifier_mjs: sha256(await readFile(path.join(evidenceRoot, 'redteam_verifier.mjs'))),
    validate_task_mjs: sha256(await readFile(path.join(evidenceRoot, 'validate_task.mjs'))),`,
  'support checksums',
);

assert.match(source, /TASK022_PRODUCTION_URL/);
assert.match(source, /states\.length, 54/);
assert.match(source, /readinessPatterns\(state\)/);
assert.match(source, /woodpecker\.deployment-browser-replay\.v1/);
assert.match(source, /rawEnumTokens/);
assert.match(source, /raw_enum_states/);
assert.match(source, /stopProfileProcesses\(chromeProfile\)/);
assert.doesNotMatch(source, /TASK021_|task021|8210|8211|8212|infrastructure-browser-replay/);

await writeFile(generatedPath, source);
try {
  const child = spawn(process.execPath, [generatedPath], {
    cwd: path.resolve(evidenceRoot, '../../../../../../..'),
    env: process.env,
    stdio: 'inherit',
  });
  const result = await new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  assert.deepEqual(result, { code: 0, signal: null }, 'generated browser capture');
} finally {
  await rm(generatedPath, { force: true });
}
