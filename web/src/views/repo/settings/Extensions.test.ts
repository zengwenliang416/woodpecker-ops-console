import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Repo } from '~/lib/api/types';

import Extensions from './Extensions.vue';

const mocks = vi.hoisted(() => ({
  getSignaturePublicKey: vi.fn(),
  updateRepo: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getSignaturePublicKey: mocks.getSignaturePublicKey,
    updateRepo: mocks.updateRepo,
  }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: mocks.notify,
  }),
}));

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

describe('repository extension settings', () => {
  beforeEach(() => {
    mocks.getSignaturePublicKey.mockReset();
    mocks.updateRepo.mockReset();
    mocks.notify.mockReset();
  });

  it('loads the real signature key and submits only supported endpoint fields', async () => {
    mocks.getSignaturePublicKey.mockResolvedValue('ssh-ed25519 AAAATEST');

    const repo = ref({
      id: 101,
      config_extension_endpoint: 'https://config.example',
      config_extension_exclusive: true,
      config_extension_netrc: false,
      registry_extension_endpoint: 'https://registry.example',
      registry_extension_netrc: true,
      secret_extension_endpoint: 'https://secret.example',
      secret_extension_netrc: false,
    } as Repo);

    const wrapper = mount(Extensions, {
      global: {
        plugins: [i18n],
        provide: {
          repo,
        },
        stubs: {
          PrototypeIcon: true,
        },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('ssh-ed25519 AAAATEST');

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mocks.updateRepo).toHaveBeenCalledWith(101, {
      config_extension_endpoint: 'https://config.example',
      config_extension_exclusive: true,
      config_extension_netrc: false,
      registry_extension_endpoint: 'https://registry.example',
      registry_extension_netrc: true,
      secret_extension_endpoint: 'https://secret.example',
      secret_extension_netrc: false,
    });
  });

  it('renders a retryable explicit error when the signature key request fails', async () => {
    mocks.getSignaturePublicKey.mockRejectedValue(new Error('signature offline'));

    const wrapper = mount(Extensions, {
      global: {
        plugins: [i18n],
        provide: {
          repo: ref({
            id: 101,
            config_extension_endpoint: '',
            config_extension_exclusive: false,
            config_extension_netrc: false,
            registry_extension_endpoint: '',
            registry_extension_netrc: false,
            secret_extension_endpoint: '',
            secret_extension_netrc: false,
          } as Repo),
        },
        stubs: {
          PrototypeIcon: true,
        },
      },
    });
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('signature offline');
    expect(wrapper.text()).toContain('Retry');
  });

  it('replaces endpoint fields before submitting a different repository', async () => {
    mocks.getSignaturePublicKey.mockResolvedValue('ssh-ed25519 AAAATEST');
    const repo = ref({
      id: 101,
      config_extension_endpoint: 'https://old.example',
      config_extension_exclusive: false,
      config_extension_netrc: false,
      registry_extension_endpoint: '',
      registry_extension_netrc: false,
      secret_extension_endpoint: '',
      secret_extension_netrc: false,
    } as Repo);

    const wrapper = mount(Extensions, {
      global: {
        plugins: [i18n],
        provide: {
          repo,
        },
        stubs: {
          PrototypeIcon: true,
        },
      },
    });
    repo.value = {
      ...repo.value,
      id: 202,
      config_extension_endpoint: 'https://new.example',
    };
    await nextTick();
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mocks.updateRepo).toHaveBeenCalledWith(
      202,
      expect.objectContaining({
        config_extension_endpoint: 'https://new.example',
      }),
    );
  });

  it('does not notify or overwrite current fields when an obsolete save succeeds after returning to the same repository', async () => {
    const pending = deferred<unknown>();
    mocks.getSignaturePublicKey.mockResolvedValue('ssh-ed25519 AAAATEST');
    mocks.updateRepo.mockReturnValue(pending.promise);
    const repo = ref({
      id: 101,
      config_extension_endpoint: 'https://old.example',
      config_extension_exclusive: false,
      config_extension_netrc: false,
      registry_extension_endpoint: '',
      registry_extension_netrc: false,
      secret_extension_endpoint: '',
      secret_extension_netrc: false,
    } as Repo);
    const wrapper = mount(Extensions, {
      global: {
        plugins: [i18n],
        provide: {
          repo,
        },
        stubs: {
          PrototypeIcon: true,
        },
      },
    });
    await flushPromises();

    await wrapper.get('form').trigger('submit');
    repo.value = {
      ...repo.value,
      id: 202,
      config_extension_endpoint: 'https://new.example',
    };
    await nextTick();
    repo.value = {
      ...repo.value,
      id: 101,
      config_extension_endpoint: 'https://current-a.example',
    };
    await nextTick();
    pending.resolve(undefined);
    await flushPromises();

    expect(mocks.notify).not.toHaveBeenCalled();
    expect(wrapper.get('input').element.value).toBe('https://current-a.example');
  });

  it('does not notify or overwrite current fields when an obsolete save rejects after returning to the same repository', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const pending = deferred<unknown>();
    mocks.getSignaturePublicKey.mockResolvedValue('ssh-ed25519 AAAATEST');
    mocks.updateRepo.mockReturnValue(pending.promise);
    const repo = ref({
      id: 101,
      config_extension_endpoint: 'https://old.example',
      config_extension_exclusive: false,
      config_extension_netrc: false,
      registry_extension_endpoint: '',
      registry_extension_netrc: false,
      secret_extension_endpoint: '',
      secret_extension_netrc: false,
    } as Repo);
    const wrapper = mount(Extensions, {
      global: {
        plugins: [i18n],
        provide: {
          repo,
        },
        stubs: {
          PrototypeIcon: true,
        },
      },
    });
    await flushPromises();

    await wrapper.get('form').trigger('submit');
    repo.value = {
      ...repo.value,
      id: 202,
      config_extension_endpoint: 'https://new.example',
    };
    await nextTick();
    repo.value = {
      ...repo.value,
      id: 101,
      config_extension_endpoint: 'https://current-a.example',
    };
    await nextTick();
    pending.reject(new Error('obsolete extension save failure'));
    await flushPromises();

    expect(mocks.notify).not.toHaveBeenCalled();
    expect(wrapper.get('input').element.value).toBe('https://current-a.example');
    consoleError.mockRestore();
  });
});
