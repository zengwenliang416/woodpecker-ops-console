import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import NotFound from './NotFound.vue';

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

describe('not found page', () => {
  it('renders truthful recovery routes without page-level overflow styling', () => {
    const wrapper = mount(NotFound, {
      global: {
        plugins: [i18n],
        stubs: {
          Button: {
            props: ['text', 'to'],
            template: '<a :data-to="JSON.stringify(to)">{{ text }}</a>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Page not found');
    expect(wrapper.text()).toContain('This address does not match a Woodpecker page');
    const links = wrapper.findAll('a');
    expect(links[0].attributes('data-to')).toContain('"overview"');
    expect(links[1].attributes('data-to')).toContain('"repos"');
    expect(wrapper.find('.not-found-card').exists()).toBe(true);
  });
});
