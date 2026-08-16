import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import IconButton from '~/components/atomic/IconButton.vue';
import PipelineRunningIcon from '~/components/repo/pipeline/PipelineRunningIcon.vue';

function vueFiles(): string[] {
  return execSync("find src -name '*.vue'").toString().trim().split('\n');
}

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

const RouterLinkStub = defineComponent({
  props: {
    to: [String, Object],
  },
  setup(props, { slots }) {
    return () => h('a', { 'data-to': JSON.stringify(props.to) }, slots.default?.());
  },
});

describe('accessibility interaction baseline', () => {
  it('guards every infinite animation and full-property transition with reduced-motion', () => {
    const offenders: string[] = [];
    for (const file of vueFiles()) {
      const style = readFileSync(file, 'utf8');
      const animates =
        /@keyframes/.test(style) || /animation:[^;]*infinite/.test(style) || /transition:\s*all\b/.test(style);
      if (animates && !style.includes('prefers-reduced-motion')) {
        offenders.push(file);
      }
    }
    expect(offenders).toStrictEqual([]);
  });

  it('keeps click handling on semantic controls', () => {
    // Explicitly allowed non-semantic click targets, each justified:
    // - App.vue drawer backdrop is aria-hidden with an Escape-key close path
    //   covered by App.test.ts.
    // - RepoAdd.vue wraps a real Button to stop ListItem navigation bubbling.
    const allowed = new Set(['src/App.vue', 'src/views/RepoAdd.vue']);
    const offenders: string[] = [];
    for (const file of vueFiles()) {
      const template = readFileSync(file, 'utf8');
      const start = template.indexOf('<template>');
      const body = template.slice(start, template.lastIndexOf('</template>'));
      body.split('\n').forEach((line, index) => {
        const isNonSemantic = /^\s*<(?:div|span|li|tr|td|p)\b/.test(line);
        if (isNonSemantic && /@click\b/.test(line) && !line.includes('role=') && !allowed.has(file)) {
          offenders.push(
            `${file}:${index + 1}: clickable non-semantic element without role: ${line.trim().slice(0, 40)}`,
          );
        }
      });
    }
    expect(offenders).toStrictEqual([]);
  });

  it('never removes the native focus outline globally', () => {
    const style = readFileSync('src/style.css', 'utf8');
    expect(style).not.toMatch(/outline:\s*(none|0)/);
  });

  it('exposes visible focus states on the shared form controls', () => {
    for (const file of [
      'src/components/form/Checkbox.vue',
      'src/components/form/TextField.vue',
      'src/components/form/RadioField.vue',
    ]) {
      expect(readFileSync(file, 'utf8')).toMatch(/focus-visible:|focus:/);
    }
  });

  it('renders icon buttons as semantic controls with accessible names', () => {
    const button = mount(IconButton, {
      props: { icon: 'close', title: 'Close panel' },
      global: { plugins: [i18n], stubs: { 'router-link': RouterLinkStub } },
    });
    expect((button.element as HTMLElement).tagName).toBe('BUTTON');
    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('aria-label')).toBe('Close panel');
    expect(button.attributes('title')).toBe('Close panel');

    const link = mount(IconButton, {
      props: { icon: 'close', title: 'Open settings', to: { name: 'user' } },
      global: {
        plugins: [i18n],
        stubs: { RouterLink: RouterLinkStub },
      },
    });
    expect(link.attributes('aria-label')).toBe('Open settings');

    const disabled = mount(IconButton, {
      props: { icon: 'close', title: 'Unavailable', disabled: true },
      global: { plugins: [i18n], stubs: { 'router-link': RouterLinkStub } },
    });
    expect(disabled.attributes('aria-disabled')).toBe('true');
    expect((disabled.element as HTMLButtonElement).disabled).toBe(true);
  });

  it('keeps the decorative running icon out of the accessibility tree', () => {
    const wrapper = mount(PipelineRunningIcon);
    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });
});
