import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(path.join(evidenceDir, 'manifest.json'), 'utf8'));
const expectedStates = ['desktop_populated', 'desktop_filtered_empty', 'mobile_populated', 'mobile_filtered_empty'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function pngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex');
  assert(signature === '89504e470d0a1a0a', 'Evidence file is not a PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

for (const state of expectedStates) {
  assert(manifest.screenshots[state], `Missing screenshot manifest entry: ${state}`);
}

for (const [state, screenshot] of Object.entries(manifest.screenshots)) {
  const buffer = await readFile(path.join(evidenceDir, screenshot.file));
  assert(sha256(buffer) === screenshot.sha256, `Checksum mismatch: ${state}`);
  const viewportName = state.startsWith('desktop_') ? 'desktop' : 'mobile';
  const expectedViewport =
    viewportName === 'desktop'
      ? { width: 1280, height: 720 }
      : {
          width: 390,
          height: 844,
        };
  const dimensions = pngDimensions(buffer);
  assert(
    dimensions.width === expectedViewport.width && dimensions.height === expectedViewport.height,
    `Screenshot dimensions mismatch: ${state}`,
  );
}

for (const [viewportName, states] of Object.entries(manifest.measurements)) {
  for (const [stateName, measurement] of Object.entries(states)) {
    assert(measurement.document.page_level_horizontal_overflow === false, `${viewportName}/${stateName} overflows`);
    assert(
      measurement.document.client_width === measurement.document.scroll_width,
      `${viewportName}/${stateName} width`,
    );
    assert(measurement.raw_locale_keys.length === 0, `${viewportName}/${stateName} has raw locale keys`);
  }

  assert(states.populated.pipeline_rows > 0, `${viewportName} populated state has no pipelines`);
  assert(
    states.populated.table_container.overflow_x === 'auto',
    `${viewportName} table does not own horizontal scroll`,
  );
  assert(
    states.populated.table_container.scroll_width > states.populated.table_container.client_width,
    `${viewportName} dense table is not locally scrollable`,
  );
  assert(states.filtered_empty.pipeline_rows === 0, `${viewportName} filtered state still has rows`);
  assert(states.filtered_empty.feedback_text?.includes('No matching pipelines'), `${viewportName} feedback is missing`);
}

console.log(
  JSON.stringify({
    ok: true,
    screenshots: expectedStates.length,
    desktop: manifest.measurements.desktop,
    mobile: manifest.measurements.mobile,
  }),
);
