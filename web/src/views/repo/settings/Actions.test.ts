import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Repo } from '~/lib/api/types';

import Actions from './Actions.vue';

const mocks = vi.hoisted(() => ({
  repairRepo: vi.fn(),
  deleteRepo: vi.fn(),
  activateRepo: vi.fn(),
  replace: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    repairRepo: mocks.repairRepo,
    deleteRepo: mocks.deleteRepo,
    activateRepo: mocks.activateRepo,
  }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: mocks.notify,
  }),
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({
      replace: mocks.replace,
    }),
  };
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function deferred<T>() {
  let resolveValue!: (value: T) => void;
  let rejectValue!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveValue = resolve;
    rejectValue = reject;
  });
  return { promise, reject: rejectValue, resolve: resolveValue };
}

function mountActions(
  active = true,
  repository = ref({
    id: 101,
    active,
    forge_remote_id: 'forge-101',
    full_name: 'acme/backend',
  } as Repo),
) {
  return mount(Actions, {
    global: {
      plugins: [i18n],
      provide: {
        repo: repository,
      },
      stubs: {
        PrototypeIcon: true,
      },
    },
  });
}

describe('repository actions settings', () => {
  beforeEach(() => {
    mocks.repairRepo.mockReset();
    mocks.deleteRepo.mockReset();
    mocks.activateRepo.mockReset();
    mocks.replace.mockReset();
    mocks.notify.mockReset();
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
  });

  it('separates maintenance from destructive server-confirmed operations', async () => {
    const wrapper = mountActions(true);

    expect(wrapper.text()).toContain('Maintenance');
    expect(wrapper.text()).toContain('Danger zone');

    await wrapper.get('button:nth-of-type(1)').trigger('click');
    await flushPromises();
    expect(mocks.repairRepo).toHaveBeenCalledWith(101);

    const deleteButton = wrapper.findAll('button').find((button) => button.text() === 'Delete repository');
    expect(deleteButton).toBeDefined();
    await deleteButton!.trigger('click');
    await flushPromises();

    expect(mocks.deleteRepo).toHaveBeenCalledWith(101);
    expect(mocks.replace).toHaveBeenCalledWith({ name: 'repos' });
  });

  it('shows only the supported enable action for an inactive repository', async () => {
    const wrapper = mountActions(false);

    expect(wrapper.text()).toContain('Enable repository');
    expect(wrapper.text()).not.toContain('Disable repository');

    const enableButton = wrapper.findAll('button').find((button) => button.text() === 'Enable repository');
    await enableButton!.trigger('click');
    await flushPromises();

    expect(mocks.activateRepo).toHaveBeenCalledWith('forge-101');
  });

  it('blocks repeated destructive submission while the server request is pending', async () => {
    const pending = deferred<void>();
    mocks.deleteRepo.mockReturnValue(pending.promise);
    const wrapper = mountActions(true);
    const deleteButton = wrapper.findAll('button').find((button) => button.text() === 'Delete repository')!;

    await deleteButton.trigger('click');
    await deleteButton.trigger('click');
    expect(mocks.deleteRepo).toHaveBeenCalledTimes(1);

    pending.resolve();
    await flushPromises();
  });

  it('does not navigate or announce success when deletion fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.deleteRepo.mockRejectedValue(new Error('delete failed'));
    const wrapper = mountActions(true);
    const deleteButton = wrapper.findAll('button').find((button) => button.text() === 'Delete repository')!;

    await deleteButton.trigger('click');
    await flushPromises();

    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
      }),
    );
    consoleError.mockRestore();
  });

  it('does not apply obsolete deletion side effects after returning to the same repository', async () => {
    const pending = deferred<void>();
    mocks.deleteRepo.mockReturnValue(pending.promise);
    const repository = ref({
      id: 101,
      active: true,
      forge_remote_id: 'forge-101',
      full_name: 'acme/backend',
    } as Repo);
    const wrapper = mountActions(true, repository);
    const deleteButton = wrapper.findAll('button').find((button) => button.text() === 'Delete repository')!;

    await deleteButton.trigger('click');
    repository.value = {
      ...repository.value,
      id: 202,
      forge_remote_id: 'forge-202',
      full_name: 'acme/frontend',
    };
    await flushPromises();
    repository.value = {
      ...repository.value,
      id: 101,
      forge_remote_id: 'forge-101',
      full_name: 'acme/backend',
    };
    await flushPromises();
    pending.resolve();
    await flushPromises();

    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
      }),
    );
  });
});
