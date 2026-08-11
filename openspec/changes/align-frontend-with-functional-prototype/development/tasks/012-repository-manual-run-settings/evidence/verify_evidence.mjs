import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(path.join(evidenceDir, 'manifest.json'), 'utf8'));
const routeNames = ['manual-run', 'general', 'secrets', 'badge', 'actions'];
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

assert(manifest.task_id === '012-repository-manual-run-settings', 'Unexpected task manifest');

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
    assert(measurement.pathname === routeDefinition.path, `${screenshotKey} route mismatch`);
    assert(measurement.document.page_level_horizontal_overflow === false, `${screenshotKey} document overflow`);
    assert(
      measurement.document.client_width === measurement.document.scroll_width,
      `${screenshotKey} document width mismatch`,
    );
    assert(measurement.main.client_width === measurement.main.scroll_width, `${screenshotKey} main overflow`);
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

    if (routeName === 'secrets') {
      assert(measurement.navigation_items === 7, `${screenshotKey} settings navigation count`);
      if (viewportName === 'mobile') {
        assert(
          measurement.local_scroll.scroll_width > measurement.local_scroll.client_width,
          `${screenshotKey} dense table does not use local horizontal scrolling`,
        );
        assert(
          measurement.local_scroll.overflow_x === 'auto',
          `${screenshotKey} dense table overflow mode is not auto`,
        );
        assert(
          measurement.local_scroll.scroll_left_before === 0,
          `${screenshotKey} local scroll did not start at zero`,
        );
        assert(
          measurement.local_scroll.scroll_left_after > measurement.local_scroll.scroll_left_before,
          `${screenshotKey} dense table did not accept horizontal scrolling`,
        );
      }
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
