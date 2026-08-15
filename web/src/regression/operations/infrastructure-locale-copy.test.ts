import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Operations regression: locale-owned operations copy (repaired by task 021,
 * baseline task 6.2/6.4).
 *
 * Repaired behavior under test: "All visible infrastructure copy is owned by
 * the English and Simplified-Chinese locale dictionaries. The final production
 * infrastructure SFC scan contains no hardcoded Chinese user-facing string."
 *
 * The scan strips comments, script blocks, and style blocks, then asserts that
 * the remaining template text of every infrastructure and deployment SFC
 * contains no CJK characters outside the locale dictionaries.
 */
const viewRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../views');
const INFRA_DIR = path.join(viewRoot, 'infrastructure');
const DEPLOY_DIR = path.join(viewRoot, 'deployments');

function templateText(filePath: string): string {
  let text = readFileSync(filePath, 'utf8');
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style\b[\s\S]*?<\/style>/gi, '');
  return text;
}

function listVueFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.vue'))
    .sort()
    .map((name) => path.join(dir, name));
}

function scanCjk(filePath: string): Array<{ line: number; text: string }> {
  const hits: Array<{ line: number; text: string }> = [];
  templateText(filePath)
    .split('\n')
    .forEach((line, index) => {
      if (/[\u3400-\u9FFF]/.test(line)) {
        hits.push({ line: index + 1, text: line.trim().slice(0, 120) });
      }
    });
  return hits;
}

describe('operations regression: locale-owned infrastructure copy', () => {
  it('contains no hardcoded Chinese in infrastructure view templates', () => {
    const failures: string[] = [];
    for (const file of listVueFiles(INFRA_DIR)) {
      for (const hit of scanCjk(file)) {
        failures.push(`${path.relative(viewRoot, file)}:${hit.line}: ${hit.text}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('contains no hardcoded Chinese in deployment view templates', () => {
    const failures: string[] = [];
    for (const file of listVueFiles(DEPLOY_DIR)) {
      for (const hit of scanCjk(file)) {
        failures.push(`${path.relative(viewRoot, file)}:${hit.line}: ${hit.text}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
