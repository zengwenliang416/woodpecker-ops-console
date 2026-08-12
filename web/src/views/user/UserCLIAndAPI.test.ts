import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import UserCLIAndAPI from './UserCLIAndAPI.vue';

const api = vi.hoisted(() => ({
  getToken: vi.fn(),
  resetToken: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({ default: () => api }));
vi.mock('~/compositions/useConfig', () => ({
  default: () => ({ rootPath: '/woodpecker', enableSwagger: true }),
}));
vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}

function mountPage() {
  return mount(UserCLIAndAPI, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: {
          props: ['text', 'disabled', 'isLoading'],
          emits: ['click'],
          template:
            '<button :disabled="disabled || isLoading" :data-loading="isLoading" @click="$emit(\'click\')">{{ text }}</button>',
        },
      },
    },
  });
}

describe('user CLI and API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getToken.mockResolvedValue('CURRENT_TOKEN');
    api.resetToken.mockResolvedValue('NEXT_TOKEN');
  });

  it('does not render undefined into API examples while loading', async () => {
    const pending = deferred<string>();
    api.getToken.mockReturnValueOnce(pending.promise);
    const wrapper = mountPage();

    expect(wrapper.text()).not.toContain('undefined');
    expect(wrapper.text()).toContain('Load your Personal Access Token');
    pending.resolve('CURRENT_TOKEN');
    await flushPromises();
    expect(wrapper.text()).toContain('CURRENT_TOKEN');
  });

  it('retries a failed token load and publishes only the successful token', async () => {
    api.getToken.mockRejectedValueOnce(new Error('token offline')).mockResolvedValueOnce('RECOVERED_TOKEN');
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('token offline');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(api.getToken).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('RECOVERED_TOKEN');
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('keeps the confirmed token and page location after reset failure', async () => {
    api.resetToken.mockRejectedValueOnce(new Error('reset rejected'));
    const wrapper = mountPage();
    await flushPromises();
    const before = window.location.href;

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Reset token')!
      .trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('CURRENT_TOKEN');
    expect(wrapper.text()).toContain('reset rejected');
    expect(window.location.href).toBe(before);
  });

  it('keeps an unmounted token request inert', async () => {
    const pending = deferred<string>();
    api.getToken.mockReturnValueOnce(pending.promise);
    const wrapper = mountPage();
    wrapper.unmount();
    pending.resolve('OBSOLETE_TOKEN');
    await flushPromises();
    expect(api.resetToken).not.toHaveBeenCalled();
  });
});
