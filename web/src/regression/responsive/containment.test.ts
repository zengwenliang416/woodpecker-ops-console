import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

function vueFiles(): string[] {
  return execSync("find src -name '*.vue'").toString().trim().split('\n');
}

const containment = /wp-table-scroll|overflow-x-auto|overflow-auto|overflow-hidden|table-scroll/;

describe('responsive containment baseline', () => {
  it('wraps every table in a scroll containment context', () => {
    const offenders: string[] = [];
    for (const file of vueFiles()) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (!/^\s*<table\b/.test(line)) {
          return;
        }
        const context = lines.slice(Math.max(0, index - 4), index).join(' ');
        if (!containment.test(context)) {
          offenders.push(`${file}:${index + 1}: <table> without scroll containment`);
        }
      });
    }
    expect(offenders).toStrictEqual([]);
  });

  it('keeps the shared table-scroll primitive horizontally scrollable', () => {
    const style = readFileSync('src/style.css', 'utf8');
    expect(style).toMatch(/\.wp-table-scroll\s*\{[^}]*overflow-x:\s*auto/);
  });

  it('keeps the app shell full-width with a contained vertical scroll region', () => {
    const style = readFileSync('src/style.css', 'utf8');
    expect(style).toMatch(/html,\s*\nbody,\s*\n#app\s*\{[^}]*width:\s*100%/);

    const app = readFileSync('src/App.vue', 'utf8');
    expect(app).toMatch(/id="scroll-component"[^>]*overflow-y-auto/);
  });

  it('pairs dense fixed-min-width tables with the shared scroll wrapper', () => {
    const offenders: string[] = [];
    for (const file of vueFiles()) {
      const source = readFileSync(file, 'utf8');
      if (!source.includes('min-w-[940px]') && !source.includes('min-w-[1080px]')) {
        continue;
      }
      const template = source.slice(source.indexOf('<template>'), source.lastIndexOf('</template>'));
      if (!template.includes('wp-table-scroll')) {
        offenders.push(`${file}: dense min-width table without wp-table-scroll wrapper`);
      }
    }
    expect(offenders).toStrictEqual([]);
  });

  it('contains the pipeline log surface inside its own scroll region', () => {
    const log = readFileSync('src/components/repo/pipeline/PipelineLog.vue', 'utf8');
    expect(log).toMatch(/overflow-hidden/);
    expect(log).toMatch(/class="[^"]*overflow-auto/);
  });
});
