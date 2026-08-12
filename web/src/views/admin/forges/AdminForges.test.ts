import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import type { Ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Forge } from '~/lib/api/types';

import AdminForges from './AdminForges.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as Ref<Forge[]> | undefined,
  loading: undefined as Ref<boolean> | undefined,
  loadData: undefined as ((page: number) => Promise<Forge[] | null>) | undefined,
  resetPage: vi.fn(),
}));

const api = vi.hoisted(() => ({
  getForges: vi.fn(),
  deleteForge: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => api,
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({ notify: api.notify }),
}));

vi.mock('~/compositions/usePaginate', async () => {
  const { ref } = await import('vue');
  pagination.data = ref<Forge[]>([]);
  pagination.loading = ref(false);
  return {
    usePagination: (loadData: (page: number) => Promise<Forge[] | null>) => {
      pagination.loadData = loadData;
      return {
        data: pagination.data,
        loading: pagination.loading,
        resetPage: pagination.resetPage,
      };
    },
  };
});

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const IconButtonStub = defineComponent({
  props: {
    title: String,
    to: Object,
    isLoading: Boolean,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h('button', {
        title: props.title,
        'data-to': props.to === undefined ? undefined : JSON.stringify(props.to),
        'aria-busy': props.isLoading ? 'true' : undefined,
        onClick: () => emit('click'),
      });
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

function mountForges() {
  return mount(AdminForges, {
    global: {
      plugins: [i18n],
      stubs: {
        IconButton: IconButtonStub,
        PrototypeIcon: true,
        RouterLink: {
          props: ['to'],
          template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
        },
      },
    },
  });
}

describe('administration forges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    pagination.data!.value = [];
    pagination.loading!.value = false;
    api.getForges.mockResolvedValue([]);
    pagination.resetPage.mockImplementation(async () => {
      pagination.data!.value = (await pagination.loadData?.(1)) ?? [];
    });
  });

  it('renders explicit loading and empty states', async () => {
    pagination.loading!.value = true;
    const wrapper = mountForges();

    expect(wrapper.find('[data-feedback-state="loading"]').exists()).toBe(true);

    pagination.loading!.value = false;
    await flushPromises();
    expect(wrapper.find('[data-feedback-state="empty"]').exists()).toBe(true);
  });

  it('keeps confirmed rows through a rejected refresh and retries it', async () => {
    pagination.data!.value = [forge(1, 'https://forge.example.com')];
    const wrapper = mountForges();
    await flushPromises();

    api.getForges.mockRejectedValueOnce(new Error('forges offline')).mockResolvedValueOnce([]);
    await pagination.loadData?.(2);
    await flushPromises();

    expect(wrapper.text()).toContain('forge.example.com');
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('forges offline');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(api.getForges).toHaveBeenLastCalledWith({ page: 1 });
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('preserves the confirmed row and reports an active delete failure', async () => {
    pagination.data!.value = [forge(1, 'https://forge.example.com')];
    api.deleteForge.mockRejectedValueOnce(new Error('delete failed'));
    const wrapper = mountForges();
    await flushPromises();

    await wrapper.get('button[title="Delete forge"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('forge.example.com');
    expect(api.notify).toHaveBeenCalledWith({ title: 'delete failed', type: 'error' });
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('keeps a delete completion inert after unmount', async () => {
    const deletion = deferred<unknown>();
    pagination.data!.value = [forge(1, 'https://forge.example.com')];
    api.deleteForge.mockReturnValue(deletion.promise);
    const wrapper = mountForges();
    await flushPromises();

    await wrapper.get('button[title="Delete forge"]').trigger('click');
    wrapper.unmount();
    deletion.resolve(undefined);
    await flushPromises();

    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });
});
