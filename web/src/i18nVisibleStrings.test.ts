import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';

import FileTree from '~/components/FileTree.vue';

// Locale JSON imports are precompiled into message ASTs by
// @intlify/unplugin-vue-i18n, so raw string assertions read the files directly.
type Messages = Record<string, unknown>;

function loadLocale(name: string): Messages {
  return JSON.parse(readFileSync(`src/assets/locales/${name}.json`, 'utf8')) as Messages;
}

const en = loadLocale('en');
const zhHans = loadLocale('zh-Hans');

type I18nMessages = NonNullable<Parameters<typeof createI18n>[0]['messages']>;

function asI18nMessages(messages: Messages): I18nMessages {
  return messages as unknown as I18nMessages;
}

function flattenKeys(messages: Messages, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? flattenKeys(value as Messages, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

function messageAt(messages: Messages, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => (node as Messages | undefined)?.[key], messages);
}

function sourceFiles(): string[] {
  return execSync("find src -name '*.vue' -o -name '*.ts' | grep -v i18nVisibleStrings.test.ts")
    .toString()
    .trim()
    .split('\n');
}

function templateFiles(): string[] {
  return execSync("find src -name '*.vue'").toString().trim().split('\n');
}

describe('visible-string localization', () => {
  it('resolves every i18n key referenced in the source from both English and Simplified Chinese', () => {
    const enKeys = new Set(flattenKeys(en));
    const zhKeys = new Set(flattenKeys(zhHans));
    const pattern = /[$(\s.]t\(\s*['"]([\w.]+)['"]/g;
    const missing: string[] = [];
    for (const file of sourceFiles()) {
      for (const match of readFileSync(file, 'utf8').matchAll(pattern)) {
        if (!enKeys.has(match[1])) missing.push(`en missing ${match[1]} (${file})`);
        if (!zhKeys.has(match[1])) missing.push(`zh-Hans missing ${match[1]} (${file})`);
      }
    }
    expect(missing).toStrictEqual([]);
  });

  it('keeps template controls free of hardcoded English aria labels and multi-word text', () => {
    // Literal runtime identifiers rendered as select options stay untranslated by design.
    const allowed = new Set(['docker', 'kubernetes', 'systemd']);
    const offenders: string[] = [];
    for (const file of templateFiles()) {
      const source = readFileSync(file, 'utf8');
      const template = source.slice(source.indexOf('<template>'), source.lastIndexOf('</template>'));
      template.split('\n').forEach((line, index) => {
        if (/\$t\(|v-t/.test(line)) return;
        for (const match of line.matchAll(/\s(title|aria-label|label|placeholder|alt)="([a-z][a-z /_-]{2,})"/gi)) {
          offenders.push(`${file}:${index + 1}: static ${match[1]} "${match[2]}"`);
        }
        const text = line.match(/>\s*([a-z][a-z /&+.-]{2,30})\s*</i);
        if (text && !allowed.has(text[1].trim())) {
          offenders.push(`${file}:${index + 1}: text "${text[1].trim()}"`);
        }
      });
    }
    expect(offenders).toStrictEqual([]);
  });

  it('translates the file-tree control labels for Simplified Chinese and English', async () => {
    const directory = {
      name: 'docs',
      path: 'docs',
      isDirectory: true,
      children: [{ name: 'readme.md', path: 'docs/readme.md', isDirectory: false, children: [] }],
    };

    for (const locale of ['zh-Hans', 'en']) {
      const i18n = createI18n({
        legacy: false,
        locale,
        messages: { en: asI18nMessages(en), 'zh-Hans': asI18nMessages(zhHans) },
      });
      const wrapper = mount(FileTree, {
        props: { node: directory },
        global: { plugins: [i18n] },
      });
      const control = wrapper.get('[role="button"]');
      expect(control.attributes('aria-label')).toBe(locale === 'zh-Hans' ? '折叠文件夹 docs' : 'Collapse folder docs');
      await control.trigger('click');
      expect(control.attributes('aria-label')).toBe(locale === 'zh-Hans' ? '展开文件夹 docs' : 'Expand folder docs');
    }

    const file = { name: 'run.sh', path: 'run.sh', isDirectory: false, children: [] };
    for (const locale of ['zh-Hans', 'en']) {
      const i18n = createI18n({
        legacy: false,
        locale,
        messages: { en: asI18nMessages(en), 'zh-Hans': asI18nMessages(zhHans) },
      });
      const wrapper = mount(FileTree, {
        props: { node: file },
        global: { plugins: [i18n] },
      });
      expect(wrapper.get('[role="button"]').attributes('aria-label')).toBe(
        locale === 'zh-Hans' ? '文件 run.sh' : 'File run.sh',
      );
    }
  });

  it('exposes the operations filter and metric labels in both locales', () => {
    expect(messageAt(zhHans, 'ops.servers.filter_status')).toBe('服务器状态');
    expect(messageAt(zhHans, 'ops.servers.filter_group')).toBe('服务器分组');
    expect(messageAt(zhHans, 'ops.servers.filter_region')).toBe('服务器区域');
    expect(messageAt(en, 'ops.servers.filter_status')).toBe('Server status');
    expect(messageAt(en, 'ops.server.cpu')).toBe('CPU');
    expect(messageAt(zhHans, 'ops.server.cpu')).toBe('CPU');
    expect(messageAt(zhHans, 'ops.server.agent')).toBe('Agent');
    expect(messageAt(zhHans, 'ops.server_detail.agent_section')).toBe('Node Agent');
    expect(messageAt(en, 'ops.server_detail.agent_section')).toBe('Node Agent');
  });

  it('falls back to English when the active locale has no message', () => {
    const i18n = createI18n({
      legacy: false,
      locale: 'zh-Hans',
      fallbackLocale: 'en',
      messages: { en: asI18nMessages(en), 'zh-Hans': { ops: { servers: { filter_status: '服务器状态' } } } },
    });
    expect(i18n.global.t('ops.servers.filter_status')).toBe('服务器状态');
    expect(i18n.global.t('ops.server.cpu')).toBe('CPU');
    expect(i18n.global.t('cancel')).toBe(en.cancel);
  });

  it('translates the shared delete action into Simplified Chinese', () => {
    expect(messageAt(en, 'delete')).toBeDefined();
    expect(messageAt(zhHans, 'delete')).toBe('删除');
  });
});
