import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Task 028 token-parity regression: no page-local color systems.
 *
 * Raw hex/rgb/rgba color values are only legal inside the token-definition
 * files (web/src/tailwind.css @theme, web/src/style.css --wp-* variables,
 * web/src/compositions/useTheme.ts documented mirrors) and test files (which
 * reference pipeline numbers like #842). Every var(--wp-*) referenced by
 * source must resolve to a definition, and the ANSI/syntax palettes must keep
 * their exact original light and dark values.
 */
const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ALLOWLIST = new Set([
  path.join(srcRoot, 'tailwind.css'),
  path.join(srcRoot, 'style.css'),
  path.join(srcRoot, 'compositions/useTheme.ts'),
]);

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist' || entry === 'coverage') continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectFiles(full));
    else if (/\.(?:vue|css|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/;

/** Original palette values pinned from the pre-tokenization files. */
const EXPECTED_PALETTE: Record<string, { light: string; dark?: string }> = {
  '--wp-ansi-black-fg': { light: '#374151', dark: '#666666' },
  '--wp-ansi-red-fg': { light: '#cc0000', dark: '#ff7070' },
  '--wp-ansi-green-fg': { light: '#4e9a06', dark: '#b0f986' },
  '--wp-ansi-yellow-fg': { light: '#c4a000', dark: '#c6c502' },
  '--wp-ansi-blue-fg': { light: '#729fcf', dark: '#8db7e0' },
  '--wp-ansi-magenta-fg': { light: '#75507b', dark: '#f271fb' },
  '--wp-ansi-cyan-fg': { light: '#06989a', dark: '#6bf7ff' },
  '--wp-ansi-white-fg': { light: '#d3d7cf', dark: '#9ca3af' },
  '--wp-ansi-bright-black-fg': { light: '#555753', dark: '#838887' },
  '--wp-ansi-bright-red-fg': { light: '#ef2929', dark: '#ff3333' },
  '--wp-ansi-bright-green-fg': { light: '#8ae234', dark: '#00ff00' },
  '--wp-ansi-bright-yellow-fg': { light: '#fce94f', dark: '#fffc67' },
  '--wp-ansi-bright-blue-fg': { light: '#32afff', dark: '#6871ff' },
  '--wp-ansi-bright-magenta-fg': { light: '#ad7fa8', dark: '#ff76ff' },
  '--wp-ansi-bright-cyan-fg': { light: '#34e2e2', dark: '#60fcff' },
  '--wp-ansi-bright-white-fg': { light: '#ffffff', dark: '#e6e3e3' },
  '--wp-ansi-black-bg': { light: '#374151', dark: '#666666' },
  '--wp-ansi-red-bg': { light: '#cc0000', dark: '#ff7070' },
  '--wp-ansi-green-bg': { light: '#4e9a06', dark: '#b0f986' },
  '--wp-ansi-yellow-bg': { light: '#c4a000', dark: '#c6c502' },
  '--wp-ansi-blue-bg': { light: '#729fcf', dark: '#8db7e0' },
  '--wp-ansi-magenta-bg': { light: '#75507b', dark: '#f271fb' },
  '--wp-ansi-cyan-bg': { light: '#06989a', dark: '#6bf7ff' },
  '--wp-ansi-white-bg': { light: '#d3d7cf', dark: '#9ca3af' },
  '--wp-ansi-bright-black-bg': { light: '#555753', dark: '#838887' },
  '--wp-ansi-bright-red-bg': { light: '#ef2929', dark: '#ff3333' },
  '--wp-ansi-bright-green-bg': { light: '#8ae234', dark: '#00ff00' },
  '--wp-ansi-bright-yellow-bg': { light: '#fce94f', dark: '#fffc67' },
  '--wp-ansi-bright-blue-bg': { light: '#32afff', dark: '#6871ff' },
  '--wp-ansi-bright-magenta-bg': { light: '#ad7fa8', dark: '#ff76ff' },
  '--wp-ansi-bright-cyan-bg': { light: '#34e2e2', dark: '#60fcff' },
  '--wp-ansi-bright-white-bg': { light: '#ffffff', dark: '#e6e3e3' },
  '--wp-syntax-atrule': { light: '#7c4dff', dark: '#c792ea' },
  '--wp-syntax-attr-name': { light: '#39adb5', dark: '#ffcb6b' },
  '--wp-syntax-attr-value': { light: '#f6a434', dark: '#a5e844' },
  '--wp-syntax-attribute': { light: '#f6a434', dark: '#a5e844' },
  '--wp-syntax-boolean': { light: '#7c4dff', dark: '#c792ea' },
  '--wp-syntax-builtin': { light: '#39adb5', dark: '#ffcb6b' },
  '--wp-syntax-cdata': { light: '#39adb5', dark: '#80cbc4' },
  '--wp-syntax-char': { light: '#39adb5', dark: '#80cbc4' },
  '--wp-syntax-class': { light: '#39adb5', dark: '#ffcb6b' },
  '--wp-syntax-class-name': { light: '#6182b8', dark: '#f2ff00' },
  '--wp-syntax-comment': { light: '#aabfc9', dark: '#616161' },
  '--wp-syntax-constant': { light: '#7c4dff', dark: '#c792ea' },
  '--wp-syntax-deleted': { light: '#e53935', dark: '#ff6666' },
  '--wp-syntax-doctype': { light: '#aabfc9', dark: '#616161' },
  '--wp-syntax-entity': { light: '#e53935', dark: '#ff6666' },
  '--wp-syntax-function': { light: '#7c4dff', dark: '#c792ea' },
  '--wp-syntax-hexcode': { light: '#f76d47', dark: '#f2ff00' },
  '--wp-syntax-id': { light: '#7c4dff', dark: '#c792ea' },
  '--wp-syntax-important': { light: '#7c4dff', dark: '#c792ea' },
  '--wp-syntax-inserted': { light: '#39adb5', dark: '#80cbc4' },
  '--wp-syntax-keyword': { light: '#7c4dff', dark: '#c792ea' },
  '--wp-syntax-number': { light: '#f76d47', dark: '#fd9170' },
  '--wp-syntax-operator': { light: '#39adb5', dark: '#89ddff' },
  '--wp-syntax-prolog': { light: '#aabfc9', dark: '#616161' },
  '--wp-syntax-property': { light: '#39adb5', dark: '#80cbc4' },
  '--wp-syntax-pseudo-class': { light: '#f6a434', dark: '#a5e844' },
  '--wp-syntax-pseudo-element': { light: '#f6a434', dark: '#a5e844' },
  '--wp-syntax-punctuation': { light: '#39adb5', dark: '#89ddff' },
  '--wp-syntax-regex': { light: '#6182b8', dark: '#f2ff00' },
  '--wp-syntax-selector': { light: '#e53935', dark: '#ff6666' },
  '--wp-syntax-string': { light: '#f6a434', dark: '#a5e844' },
  '--wp-syntax-symbol': { light: '#7c4dff', dark: '#c792ea' },
  '--wp-syntax-tag': { light: '#e53935', dark: '#ff6666' },
  '--wp-syntax-unit': { light: '#f76d47', dark: '#fd9170' },
  '--wp-syntax-url': { light: '#e53935', dark: '#ff6666' },
  '--wp-syntax-variable': { light: '#e53935', dark: '#ff6666' },
};

function themeBlocks(): { light: Map<string, string>; dark: Map<string, string> } {
  const style = readFileSync(path.join(srcRoot, 'style.css'), 'utf8');
  const light = new Map<string, string>();
  const dark = new Map<string, string>();
  let current: Map<string, string> | null = null;
  for (const line of style.split('\n')) {
    if (line.includes(":root[data-theme='dark']")) current = dark;
    else if (line.includes(":root[data-theme='light']") || line.trim() === ':root,') current = light;
    const trimmed = line.trim();
    if (trimmed.startsWith('--wp-') && trimmed.includes(';') && current !== null) {
      const colon = trimmed.indexOf(':');
      const semi = trimmed.indexOf(';');
      if (colon > 0 && semi > colon) {
        const name = trimmed.slice(0, colon).trim();
        if (/^--wp-[a-z0-9-]+$/.test(name)) {
          let value = trimmed.slice(colon + 1, semi).trim();
          const comment = value.indexOf('/*');
          if (comment !== -1) value = value.slice(0, comment).trim();
          current.set(name, value);
        }
      }
    }
  }
  return { light, dark };
}

describe('semantic token parity', () => {
  it('contains no raw color values outside the token-definition allowlist', () => {
    const offenders: string[] = [];
    for (const file of collectFiles(srcRoot)) {
      if (ALLOWLIST.has(file) || file.endsWith('.test.ts')) continue;
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (RAW_COLOR.test(line)) {
          offenders.push(`${path.relative(srcRoot, file)}:${index + 1}: ${line.trim().slice(0, 110)}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('keeps the ANSI console palette and syntax palette free of raw colors', () => {
    const consoleSource = readFileSync(path.join(srcRoot, 'style/console.css'), 'utf8');
    expect(RAW_COLOR.test(consoleSource)).toBe(false);
    expect(consoleSource).toContain('var(--wp-ansi-');
    const prismSource = readFileSync(path.join(srcRoot, 'style/prism.css'), 'utf8');
    expect(RAW_COLOR.test(prismSource)).toBe(false);
    expect(prismSource).toContain('var(--wp-syntax-');
  });

  it('preserves the exact ANSI and syntax palette values in both themes', () => {
    const { light, dark } = themeBlocks();
    for (const [token, expected] of Object.entries(EXPECTED_PALETTE)) {
      expect(light.get(token), `${token} light`).toBe(expected.light);
      if (expected.dark !== undefined) {
        expect(dark.get(token), `${token} dark`).toBe(expected.dark);
      }
    }
  });

  it('resolves every referenced --wp-* token to a definition', () => {
    const definitions = new Set<string>();
    for (const file of ['style.css', 'tailwind.css']) {
      const source = readFileSync(path.join(srcRoot, file), 'utf8');
      for (const match of source.matchAll(/--wp-[a-z0-9-]+/g)) definitions.add(match[0]);
    }
    const unresolved: string[] = [];
    for (const file of collectFiles(srcRoot)) {
      if (file.endsWith('.test.ts')) continue;
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/var\((--wp-[a-z0-9-]+)\)/g)) {
        if (!definitions.has(match[1])) unresolved.push(`${path.relative(srcRoot, file)}: ${match[1]}`);
      }
    }
    expect([...new Set(unresolved)].sort()).toEqual([]);
  });

  it('keeps the light and dark theme blocks with parallel structure', () => {
    const { light, dark } = themeBlocks();
    expect(light.size).toBeGreaterThan(50);
    expect(dark.size).toBeGreaterThan(50);
    expect(dark.get('--wp-background-100')).toBeDefined();
    expect(light.get('--wp-background-100')).toBeDefined();
  });
});
