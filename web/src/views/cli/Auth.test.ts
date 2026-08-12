import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';

import en from '~/assets/locales/en.json';

import Auth from './Auth.vue';

const state = vi.hoisted(
  (): {
    close: () => void;
    getToken: ReturnType<typeof vi.fn>;
  } => ({
    getToken: vi.fn(),
    close: vi.fn(() => undefined),
  }),
);

vi.mock('~/compositions/useApiClient', () => ({ default: () => ({ getToken: state.getToken }) }));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const RouteStub = defineComponent({ template: '<div />' });

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}

async function mountAuth(port?: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/cli/auth', component: RouteStub },
      { path: '/user/cli-and-api', name: 'user-cli-and-api', component: RouteStub },
    ],
  });
  await router.push({ path: '/cli/auth', query: port === undefined ? {} : { port } });
  await router.isReady();
  const wrapper = mount(Auth, {
    global: {
      plugins: [i18n, router],
      stubs: {
        WoodpeckerLogo: true,
        Button: {
          props: ['text', 'disabled', 'isLoading'],
          emits: ['click'],
          template:
            '<button :disabled="disabled || isLoading" :data-loading="isLoading" @click="$emit(\'click\')">{{ text }}</button>',
        },
      },
    },
  });
  return { router, wrapper };
}

describe('cli authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.getToken.mockResolvedValue('CLI_TOKEN');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: 'true' }) }));
    vi.spyOn(window, 'close').mockImplementation(() => {
      state.close();
    });
  });

  it.each(['', '0', '-1', '65536', '12.5', 'abc'])('rejects invalid port %s before token or fetch', async (port) => {
    const { wrapper } = await mountAuth(port || undefined);
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Invalid CLI callback');
    expect(state.getToken).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('posts the token only to the validated localhost callback and succeeds', async () => {
    const { wrapper } = await mountAuth('49152');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Sign in to CLI')!
      .trigger('click');
    await flushPromises();
    expect(state.getToken).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('http://localhost:49152/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'CLI_TOKEN' }),
    });
    expect(wrapper.text()).toContain('Sign-in to CLI successful');
  });

  it('locks duplicate approval while the token request is pending', async () => {
    const pending = deferred<string>();
    state.getToken.mockReturnValueOnce(pending.promise);
    const { wrapper } = await mountAuth('49152');
    const approve = wrapper.findAll('button').find((button) => button.text() === 'Sign in to CLI')!;
    await approve.trigger('click');
    await approve.trigger('click');
    expect(state.getToken).toHaveBeenCalledTimes(1);
    pending.resolve('CLI_TOKEN');
    await flushPromises();
  });

  it('reports token, HTTP, and response failures without claiming success', async () => {
    state.getToken.mockRejectedValueOnce(new Error('token rejected'));
    const { wrapper } = await mountAuth('49152');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Sign in to CLI')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('token rejected');

    state.getToken.mockResolvedValueOnce('CLI_TOKEN');
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Try again')!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Sign in to CLI')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('local CLI callback rejected');
  });

  it('sends an empty token on denial and closes only after callback success', async () => {
    const { wrapper } = await mountAuth('49152');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Abort')!
      .trigger('click');
    await flushPromises();
    expect(state.getToken).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:49152/token',
      expect.objectContaining({ body: JSON.stringify({ token: '' }) }),
    );
    expect(state.close).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain('Sign-in to CLI denied');
  });

  it('keeps an unmounted completion inert', async () => {
    const pending = deferred<string>();
    state.getToken.mockReturnValueOnce(pending.promise);
    const { wrapper } = await mountAuth('49152');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Sign in to CLI')!
      .trigger('click');
    wrapper.unmount();
    pending.resolve('OBSOLETE_TOKEN');
    await flushPromises();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('invalidates a pending token request when the callback port owner changes', async () => {
    const pending = deferred<string>();
    state.getToken.mockReturnValueOnce(pending.promise);
    const { router, wrapper } = await mountAuth('49152');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Sign in to CLI')!
      .trigger('click');

    await router.push({ path: '/cli/auth', query: { port: '49153' } });
    await flushPromises();
    expect(wrapper.text()).toContain('Sign in to CLI');

    pending.resolve('OBSOLETE_TOKEN');
    await flushPromises();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('resets to invalid when the query changes and keeps an old callback completion inert', async () => {
    const callback = deferred<Response>();
    vi.mocked(fetch).mockReturnValueOnce(callback.promise);
    const { router, wrapper } = await mountAuth('49152');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Sign in to CLI')!
      .trigger('click');
    await flushPromises();
    expect(fetch).toHaveBeenCalledWith('http://localhost:49152/token', expect.any(Object));

    await router.push({ path: '/cli/auth', query: { port: 'invalid' } });
    await flushPromises();
    expect(wrapper.text()).toContain('Invalid CLI callback');

    callback.resolve({ ok: true, json: async () => ({ ok: 'true' }) } as Response);
    await flushPromises();
    expect(wrapper.text()).toContain('Invalid CLI callback');
    expect(wrapper.text()).not.toContain('Sign-in to CLI successful');
  });

  it('recovers from an invalid query when the same component receives a valid port', async () => {
    const { router, wrapper } = await mountAuth('invalid');
    expect(wrapper.text()).toContain('Invalid CLI callback');

    await router.push({ path: '/cli/auth', query: { port: '49154' } });
    await flushPromises();
    expect(wrapper.text()).toContain('Sign in to CLI');

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Sign in to CLI')!
      .trigger('click');
    await flushPromises();
    expect(fetch).toHaveBeenCalledWith('http://localhost:49154/token', expect.any(Object));
    expect(wrapper.text()).toContain('Sign-in to CLI successful');
  });
});
