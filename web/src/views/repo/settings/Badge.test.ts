import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Repo } from '~/lib/api/types';

import Badge from './Badge.vue';

const mocks = vi.hoisted(() => ({
  getRepoBranches: vi.fn(),
  usePaginate: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getRepoBranches: mocks.getRepoBranches,
  }),
}));

vi.mock('~/compositions/usePaginate', () => ({
  usePaginate: mocks.usePaginate,
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
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

function mountBadge(repository = ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo)) {
  return mount(Badge, {
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

describe('repository badge settings', () => {
  beforeEach(() => {
    mocks.getRepoBranches.mockReset();
    mocks.usePaginate.mockReset();
    mocks.usePaginate.mockImplementation(async (loader: (page: number) => Promise<string[]>) => loader(1));
    window.WOODPECKER_ROOT_PATH = '/ci';
    localStorage.clear();
  });

  it('loads real branches and renders the pure formatter output and server preview', async () => {
    mocks.getRepoBranches.mockResolvedValue(['release/next', 'main']);

    const wrapper = mountBadge();
    await flushPromises();

    const branchOptions = wrapper
      .findAll('select')[0]
      .findAll('option')
      .map((option) => option.text());
    expect(branchOptions).toEqual(['main', 'release/next']);
    expect(wrapper.get('.badge-code').text()).toContain('/ci/api/badges/101/status.svg');
    expect(wrapper.get('.badge-preview img').attributes('src')).toBe('/ci/api/badges/101/status.svg');
  });

  it('renders a confirmed empty state without fabricating the default branch', async () => {
    mocks.getRepoBranches.mockResolvedValue([]);

    const wrapper = mountBadge();
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No badge branches available');
    expect(wrapper.find('select').exists()).toBe(false);
  });

  it('ignores an obsolete branch fulfillment after a repository change', async () => {
    const oldRequest = deferred<string[]>();
    const newRequest = deferred<string[]>();
    mocks.getRepoBranches.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    const repository = ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo);

    const wrapper = mountBadge(repository);
    await nextTick();
    repository.value = {
      ...repository.value,
      id: 202,
      default_branch: 'develop',
      full_name: 'acme/frontend',
    };
    await nextTick();

    newRequest.resolve(['develop', 'feature']);
    await flushPromises();
    oldRequest.resolve(['main', 'release']);
    await flushPromises();

    expect(
      wrapper
        .findAll('select')[0]
        .findAll('option')
        .map((option) => option.text()),
    ).toEqual(['develop', 'feature']);
  });

  it('ignores an obsolete branch rejection after a repository change', async () => {
    const oldRequest = deferred<string[]>();
    const newRequest = deferred<string[]>();
    mocks.getRepoBranches.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    const repository = ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo);

    const wrapper = mountBadge(repository);
    await nextTick();
    repository.value = {
      ...repository.value,
      id: 202,
      default_branch: 'develop',
      full_name: 'acme/frontend',
    };
    await nextTick();

    newRequest.resolve(['develop']);
    await flushPromises();
    oldRequest.reject(new Error('obsolete error'));
    await flushPromises();

    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
    expect(
      wrapper
        .findAll('select')[0]
        .findAll('option')
        .map((option) => option.text()),
    ).toEqual(['develop']);
  });
});
