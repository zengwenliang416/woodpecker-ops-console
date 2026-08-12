import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Forge } from '~/lib/api/types';

import AdminForgeForm from './AdminForgeForm.vue';

vi.mock('~/compositions/useConfig', () => ({
  default: () => ({ rootPath: 'woodpecker' }),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function mountForm(initial: Partial<Forge>, isNew = true) {
  const host = defineComponent({
    components: { AdminForgeForm },
    setup() {
      const forge = ref<Partial<Forge>>({ ...initial });
      const submitted = ref(false);
      return { forge, isNew, submitted };
    },
    template: '<AdminForgeForm v-model:forge="forge" :is-new="isNew" @submit="submitted = true" />',
  });

  return mount(host, {
    global: {
      plugins: [i18n],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
        },
      },
    },
  });
}

describe('administration forge form', () => {
  it('preserves the current fields and applies the existing type defaults', async () => {
    const wrapper = mountForm({});

    expect((wrapper.vm as unknown as { forge: Partial<Forge> }).forge).toMatchObject({
      type: 'github',
      url: 'github.com',
    });
    expect(wrapper.find('input[placeholder="OAuth Client ID"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="OAuth Client Secret"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="URL"]').exists()).toBe(true);

    await wrapper.get('select').setValue('gitlab');
    expect((wrapper.vm as unknown as { forge: Partial<Forge> }).forge).toMatchObject({
      type: 'gitlab',
      url: 'gitlab.com',
    });
  });

  it('keeps a customized URL when the forge type changes', async () => {
    const wrapper = mountForm({ type: 'github', url: 'code.example.com' });

    await wrapper.get('select').setValue('gitlab');

    expect((wrapper.vm as unknown as { forge: Partial<Forge> }).forge).toMatchObject({
      type: 'gitlab',
      url: 'code.example.com',
    });
  });

  it('preserves existing additional options for GitHub and addon forges', async () => {
    const github = mountForm({
      type: 'github',
      url: 'github.com',
      additional_options: { 'merge-ref': false, 'public-only': true, retained: 'value' },
    });
    await github.findAll('input[type="checkbox"]')[0].trigger('click');
    expect((github.vm as unknown as { forge: Partial<Forge> }).forge.additional_options).toEqual({
      'merge-ref': true,
      'public-only': true,
      retained: 'value',
    });

    const addon = mountForm({
      type: 'addon',
      url: '',
      additional_options: { retained: 'value' },
    });
    await addon.get('input[placeholder="Executable"]').setValue('/usr/local/bin/forge-addon');
    expect((addon.vm as unknown as { forge: Partial<Forge> }).forge.additional_options).toEqual({
      executable: '/usr/local/bin/forge-addon',
      retained: 'value',
    });
  });

  it('normalizes URL and OAuth host before emitting submit', async () => {
    const wrapper = mountForm({
      type: 'gitlab',
      url: 'git.example.com',
      oauth_host: 'oauth.example.com',
      client: 'client-id',
      oauth_client_secret: 'secret',
    });

    await wrapper.get('form').trigger('submit');

    expect((wrapper.vm as unknown as { forge: Partial<Forge>; submitted: boolean }).forge).toMatchObject({
      url: 'https://git.example.com',
      oauth_host: 'https://oauth.example.com',
    });
    expect((wrapper.vm as unknown as { submitted: boolean }).submitted).toBe(true);
  });

  it('clears an OAuth host that exactly matches the normalized forge URL', async () => {
    const wrapper = mountForm({
      type: 'gitlab',
      url: 'https://git.example.com',
      oauth_host: 'https://git.example.com',
      client: 'client-id',
      oauth_client_secret: 'secret',
    });

    await wrapper.get('form').trigger('submit');

    expect((wrapper.vm as unknown as { forge: Partial<Forge> }).forge.oauth_host).toBe('');
  });
});
