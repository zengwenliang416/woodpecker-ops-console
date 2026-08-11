import { describe, expect, it } from 'vitest';

import { buildRepoBadgeTargetUrl, buildRepoBadgeUrl, formatRepoBadgeEmbed } from './repoBadge';

describe('repository badge formatting', () => {
  it('omits default push and empty optional parameters', () => {
    expect(
      buildRepoBadgeUrl({
        rootPath: '/woodpecker',
        repoId: 42,
        branch: '',
        events: ['push'],
        workflow: '',
        step: 'ignored-without-workflow',
      }),
    ).toBe('/woodpecker/api/badges/42/status.svg');
  });

  it('encodes branch, event, workflow, and step values deterministically', () => {
    expect(
      buildRepoBadgeUrl({
        rootPath: '',
        repoId: 42,
        branch: 'release/next',
        events: ['push', 'manual'],
        workflow: ' deploy app ',
        step: ' publish/image ',
      }),
    ).toBe(
      '/api/badges/42/status.svg?branch=release%2Fnext&events=push%2Cmanual&workflow=deploy+app&step=publish%2Fimage',
    );
  });

  it('builds the existing repository or branch target route', () => {
    expect(buildRepoBadgeTargetUrl('/ci', 42, '')).toBe('/ci/repos/42');
    expect(buildRepoBadgeTargetUrl('/ci', 42, 'release/next')).toBe('/ci/repos/42/branches/release%2Fnext');
  });

  it.each([
    ['url', 'https://ci.example/api/badges/42/status.svg?events=manual'],
    [
      'markdown',
      '[![status-badge](https://ci.example/api/badges/42/status.svg?events=manual)](https://ci.example/repos/42)',
    ],
    [
      'html',
      '<a href="https://ci.example/repos/42" target="_blank">\n  <img src="https://ci.example/api/badges/42/status.svg?events=manual&amp;branch=main" alt="status-badge" />\n</a>',
    ],
  ] as const)('formats %s embed output', (format, expected) => {
    const badgeUrl =
      format === 'html'
        ? '/api/badges/42/status.svg?events=manual&branch=main'
        : '/api/badges/42/status.svg?events=manual';

    expect(
      formatRepoBadgeEmbed({
        format,
        baseUrl: 'https://ci.example',
        badgeUrl,
        repoUrl: '/repos/42',
      }),
    ).toBe(expected);
  });
});
