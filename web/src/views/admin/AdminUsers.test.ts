import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import type { Ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Forge, User } from '~/lib/api/types';

import AdminUsers from './AdminUsers.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as Ref<User[]> | undefined,
  loading: undefined as Ref<boolean> | undefined,
  loadData: undefined as ((page: number) => Promise<User[] | null>) | undefined,
  resetPage: vi.fn(),
}));

const api = vi.hoisted(() => ({
  getUsers: vi.fn(),
  getForges: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => api,
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({ notify: api.notify }),
}));

vi.mock('~/compositions/usePaginate', async () => {
  const { ref: vueRef } = await import('vue');
  pagination.data = vueRef<User[]>([]);
  pagination.loading = vueRef(false);
  return {
    usePagination: (loadData: (page: number) => Promise<User[] | null>) => {
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
  props: ['title'],
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', { title: props.title, onClick: () => emit('click') });
  },
});

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function user(id: number, login: string, forgeId = 1): User {
  return {
    id,
    login,
    forge_id: forgeId,
    forge_remote_id: `${id}`,
    email: `${login}@example.com`,
    avatar_url: '',
    admin: false,
    admin_env: false,
    active: true,
    org_id: 0,
  };
}

function forge(id: number, type: Forge['type'], url: string): Forge {
  return { id, type, url };
}

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

function mountUsers() {
  return mount(AdminUsers, {
    global: {
      plugins: [i18n],
      stubs: {
        IconButton: IconButtonStub,
        PrototypeIcon: true,
      },
    },
  });
}

describe('administration users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    pagination.data!.value = [];
    pagination.loading!.value = false;
    pagination.resetPage.mockImplementation(async () => {
      pagination.data!.value = [];
      pagination.data!.value = (await pagination.loadData?.(1)) ?? [];
    });
    api.getUsers.mockResolvedValue([]);
    api.getForges.mockResolvedValue([forge(1, 'github', 'https://github.example.com')]);
    api.createUser.mockImplementation(async (value: Partial<User>) => ({
      ...user(10, value.login === undefined || value.login === '' ? 'new' : value.login),
      ...value,
    }));
    api.updateUser.mockResolvedValue(undefined);
    api.deleteUser.mockResolvedValue(undefined);
  });

  it('renders Forge labels and a contained user table', async () => {
    pagination.data!.value = [user(1, 'alice')];
    const wrapper = mountUsers();
    await flushPromises();

    expect(wrapper.find('.admin-resource-page').classes()).toContain('min-w-0');
    expect(wrapper.getComponent({ name: 'SettingsTable' }).props('minWidth')).toBe('760px');
    expect(wrapper.text()).toContain('alice');
    expect(wrapper.text()).toContain('github.example.com');
  });

  it('retries active failures and keeps confirmed rows during a rejected refresh', async () => {
    pagination.data!.value = [user(1, 'confirmed')];
    const wrapper = mountUsers();
    await flushPromises();

    pagination.data!.value = [];
    api.getUsers.mockRejectedValueOnce(new Error('users offline')).mockResolvedValueOnce([]);
    await pagination.loadData?.(1);
    await flushPromises();

    expect(wrapper.text()).toContain('confirmed');
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('users offline');
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(api.getUsers).toHaveBeenLastCalledWith({ page: 1 });
  });

  it('keeps the editor open when an active update fails', async () => {
    pagination.data!.value = [user(1, 'alice')];
    api.updateUser.mockRejectedValueOnce(new Error('user save failed'));
    const wrapper = mountUsers();
    await flushPromises();

    await wrapper.get('button[title="Edit user"]').trigger('click');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('form').exists()).toBe(true);
    expect(api.notify).toHaveBeenCalledWith({ title: 'user save failed', type: 'error' });
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('keeps confirmed rows when an active delete fails', async () => {
    pagination.data!.value = [user(1, 'alice')];
    api.deleteUser.mockRejectedValueOnce(new Error('user delete failed'));
    const wrapper = mountUsers();
    await flushPromises();

    await wrapper.get('button[title="Delete user"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('alice');
    expect(api.notify).toHaveBeenCalledWith({ title: 'user delete failed', type: 'error' });
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('keeps an unmounted save completion inert', async () => {
    const update = deferred<unknown>();
    api.updateUser.mockReturnValue(update.promise);
    pagination.data!.value = [user(1, 'alice')];
    const wrapper = mountUsers();
    await flushPromises();

    await wrapper.get('button[title="Edit user"]').trigger('click');
    await wrapper.get('form').trigger('submit');
    wrapper.unmount();
    update.resolve(undefined);
    await flushPromises();

    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('allows a new editor to save while an obsolete same-owner save is still pending', async () => {
    const obsolete = deferred<unknown>();
    const current = deferred<unknown>();
    api.createUser.mockReturnValueOnce(obsolete.promise).mockReturnValueOnce(current.promise);
    const wrapper = mountUsers();
    await flushPromises();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add user')!
      .trigger('click');
    await wrapper.get('form').trigger('submit');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Cancel')!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add user')!
      .trigger('click');
    await wrapper.get('form').trigger('submit');

    expect(api.createUser).toHaveBeenCalledTimes(2);

    obsolete.resolve(undefined);
    await flushPromises();
    expect(api.notify).not.toHaveBeenCalled();
    expect(wrapper.find('form').exists()).toBe(true);

    current.resolve(undefined);
    await flushPromises();
    expect(api.notify).toHaveBeenCalledWith({ title: 'User created', type: 'success' });
  });
});
