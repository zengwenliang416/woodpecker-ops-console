import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(path.join(evidenceDir, 'manifest.json'), 'utf8'));
const routeNames = ['branches', 'branch-detail', 'pull-requests', 'pull-request-detail'];
const viewportSizes = {
  desktop: { width: 1280, height: 720 },
  mobile: { width: 390, height: 844 },
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function pngDimensions(buffer) {
  assert(buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a', 'Evidence file is not a PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

for (const [viewportName, viewport] of Object.entries(viewportSizes)) {
  for (const routeName of routeNames) {
    const screenshotKey = `${viewportName}_${routeName.replaceAll('-', '_')}`;
    const screenshot = manifest.screenshots[screenshotKey];
    assert(screenshot, `Missing screenshot: ${screenshotKey}`);
    const buffer = await readFile(path.join(evidenceDir, screenshot.file));
    assert(sha256(buffer) === screenshot.sha256, `Checksum mismatch: ${screenshotKey}`);
    const dimensions = pngDimensions(buffer);
    assert(
      dimensions.width === viewport.width && dimensions.height === viewport.height,
      `Dimensions mismatch: ${screenshotKey}`,
    );

    const measurement = manifest.measurements[viewportName][routeName];
    const routeDefinition = manifest.routes.find((route) => route.name === routeName);
    assert(measurement.document.page_level_horizontal_overflow === false, `${screenshotKey} document overflow`);
    assert(
      measurement.document.client_width === measurement.document.scroll_width,
      `${screenshotKey} document width mismatch`,
    );
    assert(measurement.target_count > 0, `${screenshotKey} target missing`);
    assert(measurement.target_text.includes(routeDefinition.expectedText), `${screenshotKey} expected text missing`);
    assert(measurement.raw_locale_keys.length === 0, `${screenshotKey} raw locale keys`);
    assert(measurement.console_errors.length === 0, `${screenshotKey} console errors`);
    assert(measurement.network_errors.length === 0, `${screenshotKey} HTTP errors`);
    assert(
      measurement.known_network_errors.every((error) => error.url.endsWith('/assets/custom.js')),
      `${screenshotKey} unexpected known HTTP error`,
    );
    assert(measurement.known_network_errors.length <= 2, `${screenshotKey} custom hook HTTP error count`);
    if (routeName.endsWith('detail')) {
      assert(measurement.summary_cards === 3, `${screenshotKey} summary card count`);
      assert(
        measurement.page.client_width === measurement.page.scroll_width,
        `${screenshotKey} main route container overflow`,
      );
    }
  }
}

console.log(
  JSON.stringify({
    ok: true,
    screenshots: Object.keys(manifest.screenshots).length,
    desktop: manifest.measurements.desktop,
    mobile: manifest.measurements.mobile,
  }),
);
