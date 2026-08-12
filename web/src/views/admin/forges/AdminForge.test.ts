import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Forge } from '~/lib/api/types';

import AdminForge from './AdminForge.vue';

const state = vi.hoisted(() => ({
  route: undefined as unknown as { params: { forgeId: string }; fullPath: string },
  getForge: vi.fn(),
  updateForge: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => state.route,
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getForge: state.getForge,
    updateForge: state.updateForge,
  }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({ notify: state.notify }),
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const AdminForgeFormStub = defineComponent({
  props: {
    forge: {
      type: Object,
      required: true,
    },
    isSaving: Boolean,
  },
  emits: ['update:forge', 'submit'],
  setup(props, { emit }) {
    return () =>
      h('div', { 'data-testid': 'forge-form' }, [
        h('input', {
          'data-testid': 'forge-url',
          value: (props.forge as Forge).url,
          onInput: (event: Event) =>
            emit('update:forge', { ...(props.forge as Forge), url: (event.target as HTMLInputElement).value }),
        }),
        h(
          'button',
          {
            'data-testid': 'forge-save',
            'aria-busy': props.isSaving ? 'true' : undefined,
            onClick: () => emit('submit'),
          },
          'Save',
        ),
      ]);
  },
});

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function forge(id: number, url: string): Forge {
  return { id, type: 'github', url };
}

function deferred<T>() {
  let resolveValue!: (value: T) => void;
  let rejectValue!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveValue = resolve;
    rejectValue = reject;
  });
  return { promise, reject: rejectValue, resolve: resolveValue };
}

function mountForge() {
  return mount(AdminForge, {
    global: {
      plugins: [i18n],
      stubs: {
        AdminForgeForm: AdminForgeFormStub,
        PrototypeIcon: true,
        RouterLink: {
          props: ['to'],
          template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
        },
      },
    },
  });
}

describe('administration forge detail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.route = reactive({ params: { forgeId: '1' }, fullPath: '/admin/forges/1' });
  });

  it('uses the latest request across an A to B to A route sequence', async () => {
    const firstA = deferred<Forge>();
    const b = deferred<Forge>();
    const latestA = deferred<Forge>();
    state.getForge
      .mockReturnValueOnce(firstA.promise)
      .mockReturnValueOnce(b.promise)
      .mockReturnValueOnce(latestA.promise);
    const wrapper = mountForge();

    state.route.params.forgeId = '2';
    state.route.fullPath = '/admin/forges/2';
    await nextTick();
    state.route.params.forgeId = '1';
    state.route.fullPath = '/admin/forges/1';
    await nextTick();

    latestA.resolve(forge(1, 'https://current-a.example.com'));
    await flushPromises();
    b.resolve(forge(2, 'https://obsolete-b.example.com'));
    firstA.resolve(forge(1, 'https://obsolete-a.example.com'));
    await flushPromises();

    expect(wrapper.get('[data-testid="forge-url"]').attributes('value')).toBe('https://current-a.example.com');
  });

  it('renders an active load error and retries the current forge', async () => {
    state.getForge.mockRejectedValueOnce(new Error('forge offline')).mockResolvedValueOnce(forge(1, 'https://a.test'));
    const wrapper = mountForge();
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('forge offline');
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();

    expect(state.getForge).toHaveBeenCalledTimes(2);
    expect(wrapper.get('[data-testid="forge-url"]').attributes('value')).toBe('https://a.test');
  });

  it('preserves the editor and reports an active save failure', async () => {
    state.getForge.mockResolvedValue(forge(1, 'https://a.test'));
    state.updateForge.mockRejectedValueOnce(new Error('save failed'));
    const wrapper = mountForge();
    await flushPromises();

    await wrapper.get('[data-testid="forge-url"]').setValue('https://edited.test');
    await wrapper.get('[data-testid="forge-save"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-testid="forge-url"]').attributes('value')).toBe('https://edited.test');
    expect(state.notify).toHaveBeenCalledWith({ title: 'save failed', type: 'error' });
    expect(state.getForge).toHaveBeenCalledTimes(1);
  });

  it('keeps the confirmed editor when a successful save refresh fails', async () => {
    state.getForge.mockResolvedValueOnce(forge(1, 'https://a.test')).mockRejectedValueOnce(new Error('refresh failed'));
    state.updateForge.mockResolvedValueOnce(undefined);
    const wrapper = mountForge();
    await flushPromises();

    await wrapper.get('[data-testid="forge-url"]').setValue('https://edited.test');
    await wrapper.get('[data-testid="forge-save"]').trigger('click');
    await flushPromises();

    expect(state.updateForge).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://edited.test' }));
    expect(state.notify).toHaveBeenCalledWith({ title: 'Forge saved', type: 'success' });
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('refresh failed');
    expect(wrapper.get('[data-testid="forge-url"]').attributes('value')).toBe('https://edited.test');
  });

  it('ignores an obsolete save completion after A to B to A', async () => {
    const update = deferred<unknown>();
    state.getForge.mockImplementation(async (id: number) => forge(id, `https://${id}.test`));
    state.updateForge.mockReturnValue(update.promise);
    const wrapper = mountForge();
    await flushPromises();

    await wrapper.get('[data-testid="forge-save"]').trigger('click');
    state.route.params.forgeId = '2';
    state.route.fullPath = '/admin/forges/2';
    await nextTick();
    state.route.params.forgeId = '1';
    state.route.fullPath = '/admin/forges/1';
    await nextTick();
    update.resolve(undefined);
    await flushPromises();

    expect(state.notify).not.toHaveBeenCalled();
  });

  it('keeps an unmounted save completion inert', async () => {
    const update = deferred<unknown>();
    state.getForge.mockResolvedValue(forge(1, 'https://a.test'));
    state.updateForge.mockReturnValue(update.promise);
    const wrapper = mountForge();
    await flushPromises();

    await wrapper.get('[data-testid="forge-save"]').trigger('click');
    wrapper.unmount();
    update.resolve(undefined);
    await flushPromises();

    expect(state.notify).not.toHaveBeenCalled();
    expect(state.getForge).toHaveBeenCalledTimes(1);
  });
});
