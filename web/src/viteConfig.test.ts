// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { getSupportedLocales } from '../vite.config';

describe('supported locale discovery', () => {
  it('keeps JSON dictionaries and excludes AppleDouble or unrelated files', () => {
    expect(
      getSupportedLocales(['en.json', 'zh-Hans.json', '._ar.json', 'README.md', '.DS_Store', 'nested']),
    ).toStrictEqual(['en', 'zh-Hans']);
  });
});
