import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Repo } from '~/lib/api/types';
import { RepoRequireApproval, RepoVisibility, WebhookEvents } from '~/lib/api/types';

import General from './General.vue';

const mocks = vi.hoisted(() => ({
  updateRepo: vi.fn(),
  loadRepo: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    updateRepo: mocks.updateRepo,
  }),
}));

vi.mock('~/compositions/useAuthentication', () => ({
  default: () => ({
    user: ref({ admin: true }),
  }),
}));

vi.mock('~/compositions/useConfig', () => ({
  default: () => ({
    defaultConfigPaths: ['.woodpecker/*.yml', '.woodpecker.yml'],
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

vi.mock('~/store/repos', () => ({
  useRepoStore: () => ({
    loadRepo: mocks.loadRepo,
  }),
}));

const SectionStub = defineComponent({
  setup(_, { slots }) {
    return () => h('section', slots.default?.());
  },
});

const ListEditorStub = defineComponent({
  setup(_, { expose }) {
    expose({
      commitPendingItem: vi.fn(),
    });
    return () => h('div');
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function repository(): Repo {
  return {
    id: 101,
    active: true,
    forge_remote_id: 'remote-101',
    forge_id: 1,
    scm: 'git',
    pr_enabled: true,
    org_id: 1,
    owner: 'acme',
    name: 'backend',
    full_name: 'acme/backend',
    avatar_url: '',
    forge_url: '',
    clone_url: '',
    default_branch: 'main',
    private: false,
    trusted: { network: true, volumes: false, security: false },
    timeout: 45,
    allow_pr: true,
    allow_deploy: false,
    config_file: '.woodpecker/*.yml',
    visibility: RepoVisibility.Internal,
    require_approval: RepoRequireApproval.Forks,
    approval_allowed_users: ['alice'],
    cancel_previous_pipeline_events: [WebhookEvents.Push],
    netrc_trusted: ['plugins/git'],
    config_extension_endpoint: '',
    config_extension_exclusive: false,
    config_extension_netrc: false,
    registry_extension_endpoint: '',
    registry_extension_netrc: false,
    secret_extension_endpoint: '',
    secret_extension_netrc: false,
  };
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

describe('repository general settings', () => {
  beforeEach(() => {
    mocks.updateRepo.mockReset();
    mocks.loadRepo.mockReset();
    mocks.notify.mockReset();
  });

  it('submits only the established RepoSettings payload and reloads confirmed state', async () => {
    const repo = ref(repository());
    const wrapper = mount(General, {
      global: {
        plugins: [i18n],
        provide: {
          repo,
        },
        stubs: {
          CheckboxesField: true,
          FeedbackState: true,
          ListEditor: ListEditorStub,
          NumberField: true,
          RadioField: true,
          RepoSettingsSection: SectionStub,
          TextField: true,
        },
      },
    });

    await flushPromises();
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mocks.updateRepo).toHaveBeenCalledWith(101, {
      config_file: '.woodpecker/*.yml',
      timeout: 45,
      visibility: RepoVisibility.Internal,
      require_approval: RepoRequireApproval.Forks,
      trusted: { network: true, volumes: false, security: false },
      approval_allowed_users: ['alice'],
      allow_pr: true,
      allow_deploy: false,
      cancel_previous_pipeline_events: [WebhookEvents.Push],
      netrc_trusted: ['plugins/git'],
    });
    expect(mocks.loadRepo).toHaveBeenCalledWith(101);
    expect(mocks.notify).toHaveBeenCalledWith({
      title: 'Project settings updated',
      type: 'success',
    });
  });

  it('replaces the editable snapshot before submitting a different repository', async () => {
    const repo = ref(repository());
    const wrapper = mount(General, {
      global: {
        plugins: [i18n],
        provide: {
          repo,
        },
        stubs: {
          CheckboxesField: true,
          FeedbackState: true,
          ListEditor: ListEditorStub,
          NumberField: true,
          RadioField: true,
          RepoSettingsSection: SectionStub,
          TextField: true,
        },
      },
    });

    repo.value = {
      ...repository(),
      id: 202,
      full_name: 'acme/frontend',
      timeout: 90,
      config_file: '.woodpecker/frontend.yml',
    };
    await nextTick();
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mocks.updateRepo).toHaveBeenCalledWith(
      202,
      expect.objectContaining({
        config_file: '.woodpecker/frontend.yml',
        timeout: 90,
      }),
    );
  });

  it('does not reload or notify when an obsolete save succeeds after returning to the same repository', async () => {
    const pending = deferred<unknown>();
    mocks.updateRepo.mockReturnValue(pending.promise);
    const repo = ref(repository());
    const wrapper = mount(General, {
      global: {
        plugins: [i18n],
        provide: {
          repo,
        },
        stubs: {
          CheckboxesField: true,
          FeedbackState: true,
          ListEditor: ListEditorStub,
          NumberField: true,
          RadioField: true,
          RepoSettingsSection: SectionStub,
          TextField: true,
        },
      },
    });

    await wrapper.get('form').trigger('submit');
    repo.value = {
      ...repository(),
      id: 202,
      full_name: 'acme/frontend',
      timeout: 90,
      config_file: '.woodpecker/frontend.yml',
    };
    await nextTick();
    repo.value = {
      ...repository(),
      timeout: 120,
      config_file: '.woodpecker/current-a.yml',
    };
    await nextTick();
    expect(
      (wrapper.vm as unknown as { repoSettings: { config_file: string; timeout: number } }).repoSettings,
    ).toMatchObject({
      config_file: '.woodpecker/current-a.yml',
      timeout: 120,
    });
    pending.resolve(undefined);
    await flushPromises();

    expect(mocks.loadRepo).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(
      (wrapper.vm as unknown as { repoSettings: { config_file: string; timeout: number } }).repoSettings,
    ).toMatchObject({
      config_file: '.woodpecker/current-a.yml',
      timeout: 120,
    });
  });

  it('does not reload or notify when an obsolete save rejects after returning to the same repository', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const pending = deferred<unknown>();
    mocks.updateRepo.mockReturnValue(pending.promise);
    const repo = ref(repository());
    const wrapper = mount(General, {
      global: {
        plugins: [i18n],
        provide: {
          repo,
        },
        stubs: {
          CheckboxesField: true,
          FeedbackState: true,
          ListEditor: ListEditorStub,
          NumberField: true,
          RadioField: true,
          RepoSettingsSection: SectionStub,
          TextField: true,
        },
      },
    });

    await wrapper.get('form').trigger('submit');
    repo.value = {
      ...repository(),
      id: 202,
      full_name: 'acme/frontend',
    };
    await nextTick();
    repo.value = {
      ...repository(),
      timeout: 120,
      config_file: '.woodpecker/current-a.yml',
    };
    await nextTick();
    pending.reject(new Error('obsolete general save failure'));
    await flushPromises();

    expect(mocks.loadRepo).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(
      (wrapper.vm as unknown as { repoSettings: { config_file: string; timeout: number } }).repoSettings,
    ).toMatchObject({
      config_file: '.woodpecker/current-a.yml',
      timeout: 120,
    });
    consoleError.mockRestore();
  });
});
