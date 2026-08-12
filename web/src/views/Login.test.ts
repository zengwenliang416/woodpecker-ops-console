import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Forge } from '~/lib/api/types';

import Login from './Login.vue';

const state = vi.hoisted<{
  authenticate: ReturnType<typeof vi.fn>;
  getForges: ReturnType<typeof vi.fn>;
  query: Record<string, string>;
}>(() => ({
  query: {},
  getForges: vi.fn(),
  authenticate: vi.fn(),
}));

vi.mock('vue-router', () => ({ useRoute: () => ({ query: state.query }) }));
vi.mock('~/compositions/useApiClient', () => ({ default: () => ({ getForges: state.getForges }) }));
vi.mock('~/compositions/useAuthentication', () => ({
  default: () => ({ authenticate: state.authenticate }),
}));
vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const forge = (id: number, type: Forge['type'], url: string): Forge => ({ id, type, url });

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

function mountLogin() {
  return mount(Login, {
    global: {
      plugins: [i18n],
      stubs: {
        WoodpeckerLogo: true,
        Icon: true,
        Button: {
          props: ['text'],
          emits: ['click'],
          template: '<button @click="$emit(\'click\')"><slot>{{ text }}</slot></button>',
        },
      },
    },
  });
}

describe('login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.query = {};
    state.getForges.mockResolvedValue([forge(3, 'github', 'https://github.example.test')]);
  });

  it('loads real Forge providers and authenticates by Forge ID', async () => {
    const wrapper = mountLogin();
    await flushPromises();
    expect(wrapper.text()).toContain('github.example.test');
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('github.example.test'))!
      .trigger('click');
    expect(state.authenticate).toHaveBeenCalledWith(3);
  });

  it('renders OAuth query errors together with providers', async () => {
    state.query = {
      error: 'access_denied',
      error_description: 'membership required',
      error_uri: 'https://docs.example.test/oauth-help',
    };
    const wrapper = mountLogin();
    await flushPromises();
    expect(wrapper.text()).toContain('You are not allowed to access this instance');
    expect(wrapper.text()).toContain('membership required');
    expect(wrapper.text()).toContain('github.example.test');
    expect(wrapper.get('a').attributes('href')).toBe('https://docs.example.test/oauth-help');
  });

  it.each(['javascript:alert(1)', 'data:text/html,unsafe', 'not a url'])(
    'does not create a link for unsafe or malformed error URI %s',
    async (errorUri) => {
      state.query = { error: 'access_denied', error_uri: errorUri };
      const wrapper = mountLogin();
      await flushPromises();
      expect(wrapper.find('a').exists()).toBe(false);
      expect(wrapper.text()).toContain('You are not allowed to access this instance');
    },
  );

  it('falls back to the Forge type for malformed URLs instead of throwing', async () => {
    state.getForges.mockResolvedValueOnce([forge(5, 'gitlab', 'not a url')]);
    const wrapper = mountLogin();
    await flushPromises();
    expect(wrapper.text()).toContain('Gitlab');
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('renders error, retry, and empty provider states', async () => {
    state.getForges.mockRejectedValueOnce(new Error('forges offline')).mockResolvedValueOnce([]);
    const wrapper = mountLogin();
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('forges offline');
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No sign-in provider configured');
  });

  it('keeps obsolete and unmounted provider completions inert', async () => {
    const pending = deferred<Forge[]>();
    state.getForges.mockReturnValueOnce(pending.promise);
    const wrapper = mountLogin();
    wrapper.unmount();
    pending.reject(new Error('obsolete failure'));
    await flushPromises();
    expect(state.authenticate).not.toHaveBeenCalled();
  });
});
