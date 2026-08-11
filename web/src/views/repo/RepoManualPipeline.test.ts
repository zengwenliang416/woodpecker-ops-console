import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Repo, RepoPermissions } from '~/lib/api/types';

import RepoManualPipeline from './RepoManualPipeline.vue';

const mocks = vi.hoisted(() => ({
  getRepoBranches: vi.fn(),
  createPipeline: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  notify: vi.fn(),
  usePaginate: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getRepoBranches: mocks.getRepoBranches,
    createPipeline: mocks.createPipeline,
  }),
}));

vi.mock('~/compositions/usePaginate', () => ({
  usePaginate: mocks.usePaginate,
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({
      push: mocks.push,
      replace: mocks.replace,
    }),
  };
});

vi.mock('@kyvg/vue3-notification', () => ({
  useNotification: () => ({
    notify: mocks.notify,
  }),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

const SectionStub = defineComponent({
  setup(_, { slots }) {
    return () => h('section', [slots.default?.()]);
  },
});

const FeedbackStateStub = defineComponent({
  props: {
    kind: String,
    title: String,
    description: String,
  },
  setup(props, { slots }) {
    return () => h('div', { 'data-feedback-state': props.kind }, [props.title, props.description, slots.action?.()]);
  },
});

const KeyValueEditorStub = defineComponent({
  emits: ['update:is-valid'],
  setup() {
    return () => h('div', { 'data-testid': 'variables-editor' });
  },
});

function repo(): Repo {
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
    trusted: { network: false, volumes: false, security: false },
    timeout: 60,
    allow_pr: true,
    allow_deploy: true,
    config_file: '.woodpecker.yml',
    visibility: 'public',
    require_approval: 'none',
    approval_allowed_users: [],
    cancel_previous_pipeline_events: [],
    netrc_trusted: [],
    config_extension_endpoint: '',
    config_extension_exclusive: false,
    config_extension_netrc: false,
    registry_extension_endpoint: '',
    registry_extension_netrc: false,
    secret_extension_endpoint: '',
    secret_extension_netrc: false,
  } as Repo;
}

function mountManual(
  permissions: Partial<RepoPermissions> = {},
  repository = ref(repo()),
  repositoryPermissions = ref<RepoPermissions>({
    pull: true,
    push: true,
    admin: true,
    synced: 0,
    ...permissions,
  }),
) {
  return mount(RepoManualPipeline, {
    props: {
      open: true,
    },
    global: {
      plugins: [i18n],
      provide: {
        repo: repository,
        'repo-permissions': repositoryPermissions,
      },
      stubs: {
        FeedbackState: FeedbackStateStub,
        KeyValueEditor: KeyValueEditorStub,
        PrototypeIcon: true,
        RepoSettingsSection: SectionStub,
      },
    },
  });
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

describe('repository manual pipeline', () => {
  beforeEach(() => {
    mocks.getRepoBranches.mockReset();
    mocks.createPipeline.mockReset();
    mocks.push.mockReset();
    mocks.replace.mockReset();
    mocks.notify.mockReset();
    mocks.usePaginate.mockReset();
    mocks.usePaginate.mockImplementation(async (loader: (page: number) => Promise<string[]>) => loader(1));
  });

  it('loads real branches, prefers the default branch, and navigates to the created pipeline', async () => {
    mocks.getRepoBranches.mockResolvedValue(['release', 'main']);
    mocks.createPipeline.mockResolvedValue({ number: 73 });

    const wrapper = mountManual();
    await flushPromises();

    expect(wrapper.get('select').element.value).toBe('main');
    await wrapper.get('[data-testid="manual-pipeline-form"]').trigger('submit');
    await flushPromises();

    expect(mocks.createPipeline).toHaveBeenCalledWith(101, {
      branch: 'main',
      variables: {},
    });
    expect(mocks.push).toHaveBeenCalledWith({
      name: 'repo-pipeline',
      params: {
        repoId: 101,
        pipelineId: 73,
      },
    });
  });

  it('keeps the existing push permission redirect before loading branches', async () => {
    const wrapper = mountManual({ push: false });
    await flushPromises();

    expect(mocks.replace).toHaveBeenCalledWith({ name: 'home' });
    expect(mocks.usePaginate).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="manual-pipeline-form"]').exists()).toBe(false);
  });

  it('renders loading, retryable branch errors, and a confirmed empty state', async () => {
    const pending = deferred<string[]>();
    mocks.usePaginate.mockReturnValueOnce(pending.promise);

    const wrapper = mountManual();
    await nextTick();
    expect(wrapper.find('[data-feedback-state="loading"]').exists()).toBe(true);

    pending.reject(new Error('branches offline'));
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('branches offline');

    mocks.usePaginate.mockResolvedValueOnce([]);
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No branches available');
    expect(wrapper.find('[data-testid="manual-pipeline-form"]').exists()).toBe(false);
  });

  it('blocks invalid variables and duplicate submissions', async () => {
    const pending = deferred<{ number: number }>();
    mocks.getRepoBranches.mockResolvedValue(['main']);
    mocks.createPipeline.mockReturnValue(pending.promise);

    const wrapper = mountManual();
    await flushPromises();

    wrapper.findComponent(KeyValueEditorStub).vm.$emit('update:is-valid', false);
    await nextTick();
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();

    wrapper.findComponent(KeyValueEditorStub).vm.$emit('update:is-valid', true);
    await nextTick();
    await wrapper.get('[data-testid="manual-pipeline-form"]').trigger('submit');
    await wrapper.get('[data-testid="manual-pipeline-form"]').trigger('submit');
    expect(mocks.createPipeline).toHaveBeenCalledTimes(1);

    pending.resolve({ number: 73 });
    await flushPromises();
  });

  it('keeps the form open and avoids navigation when pipeline creation fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.getRepoBranches.mockResolvedValue(['main']);
    mocks.createPipeline.mockRejectedValue(new Error('create failed'));

    const wrapper = mountManual();
    await flushPromises();
    await wrapper.get('[data-testid="manual-pipeline-form"]').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[data-testid="manual-pipeline-form"]').exists()).toBe(true);
    expect(wrapper.emitted('close')).toBeUndefined();
    expect(mocks.push).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('preserves the existing no-manual-workflow warning path', async () => {
    mocks.getRepoBranches.mockResolvedValue(['main']);
    mocks.createPipeline.mockResolvedValue('no manual workflows');

    const wrapper = mountManual();
    await flushPromises();
    await wrapper.get('[data-testid="manual-pipeline-form"]').trigger('submit');
    await flushPromises();

    expect(mocks.push).toHaveBeenCalledWith({ name: 'repo', params: { repoId: 101 } });
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'warn',
      title: 'No matching workflows found. Make sure at least one workflow runs on the manual event.',
    });
  });

  it('reloads on repository changes and ignores an obsolete branch response', async () => {
    const oldRequest = deferred<string[]>();
    const newRequest = deferred<string[]>();
    mocks.usePaginate.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    const repository = ref(repo());
    const permissions = ref<RepoPermissions>({
      pull: true,
      push: true,
      admin: true,
      synced: 0,
    });

    const wrapper = mountManual({}, repository, permissions);
    await nextTick();
    repository.value = {
      ...repo(),
      id: 202,
      full_name: 'acme/frontend',
      name: 'frontend',
      default_branch: 'develop',
    };
    permissions.value = { ...permissions.value };
    await nextTick();

    newRequest.resolve(['develop']);
    await flushPromises();
    oldRequest.resolve(['main', 'release']);
    await flushPromises();

    expect(wrapper.get('select').element.value).toBe('develop');
    await wrapper.get('[data-testid="manual-pipeline-form"]').trigger('submit');
    await flushPromises();
    expect(mocks.createPipeline).toHaveBeenCalledWith(202, {
      branch: 'develop',
      variables: {},
    });
  });

  it('re-runs the push gate before loading a reused route for another repository', async () => {
    mocks.getRepoBranches.mockResolvedValue(['main']);
    const repository = ref(repo());
    const permissions = ref<RepoPermissions>({
      pull: true,
      push: true,
      admin: true,
      synced: 0,
    });
    const wrapper = mountManual({}, repository, permissions);
    await flushPromises();
    mocks.getRepoBranches.mockClear();

    repository.value = {
      ...repo(),
      id: 202,
      full_name: 'acme/frontend',
      name: 'frontend',
    };
    await nextTick();
    expect(wrapper.find('[data-testid="manual-pipeline-form"]').exists()).toBe(false);

    permissions.value = {
      ...permissions.value,
      push: false,
    };
    await flushPromises();

    expect(mocks.replace).toHaveBeenCalledWith({ name: 'home' });
    expect(mocks.getRepoBranches).not.toHaveBeenCalledWith(202, expect.anything());
    expect(wrapper.find('[data-testid="manual-pipeline-form"]').exists()).toBe(false);
  });

  it('does not navigate when an obsolete manual-run success completes after returning to the same repository', async () => {
    const pending = deferred<{ number: number }>();
    mocks.getRepoBranches.mockResolvedValue(['main']);
    mocks.createPipeline.mockReturnValue(pending.promise);
    const repository = ref(repo());
    const permissions = ref<RepoPermissions>({
      pull: true,
      push: true,
      admin: true,
      synced: 0,
    });
    const wrapper = mountManual({}, repository, permissions);
    await flushPromises();
    await wrapper.get('[data-testid="manual-pipeline-form"]').trigger('submit');

    repository.value = {
      ...repo(),
      id: 202,
      full_name: 'acme/frontend',
      name: 'frontend',
    };
    permissions.value = { ...permissions.value };
    await nextTick();
    repository.value = repo();
    permissions.value = { ...permissions.value };
    await flushPromises();
    pending.resolve({ number: 73 });
    await flushPromises();

    expect(mocks.push).not.toHaveBeenCalled();
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('does not navigate when an obsolete manual-run rejection completes after returning to the same repository', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const pending = deferred<{ number: number }>();
    mocks.getRepoBranches.mockResolvedValue(['main']);
    mocks.createPipeline.mockReturnValue(pending.promise);
    const repository = ref(repo());
    const permissions = ref<RepoPermissions>({
      pull: true,
      push: true,
      admin: true,
      synced: 0,
    });
    const wrapper = mountManual({}, repository, permissions);
    await flushPromises();
    await wrapper.get('[data-testid="manual-pipeline-form"]').trigger('submit');

    repository.value = {
      ...repo(),
      id: 202,
      full_name: 'acme/frontend',
      name: 'frontend',
    };
    permissions.value = { ...permissions.value };
    await nextTick();
    repository.value = repo();
    permissions.value = { ...permissions.value };
    await flushPromises();
    pending.reject(new Error('obsolete failure'));
    await flushPromises();

    expect(mocks.push).not.toHaveBeenCalled();
    expect(wrapper.emitted('close')).toBeUndefined();
    consoleError.mockRestore();
  });
});
