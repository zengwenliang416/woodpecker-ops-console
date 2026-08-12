import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Org, OrgPermissions } from '~/lib/api/types';

import OrgWrapper from './OrgWrapper.vue';

const state = vi.hoisted(() => ({
  route: { meta: { orgHeader: true } },
  getOrg: vi.fn(),
  getOrgPermissions: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => state.route,
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getOrg: state.getOrg,
    getOrgPermissions: state.getOrgPermissions,
  }),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const ScaffoldStub = defineComponent({
  setup(_, { slots }) {
    return () => h('main', [h('header', slots.title?.()), slots.headerActions?.(), slots.default?.()]);
  },
});

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

function organization(id: number): Org {
  return { id, name: `org-${id}`, is_user: false };
}

function permissions(admin = true): OrgPermissions {
  return { member: true, admin };
}

function mountWrapper(orgId = '1') {
  return mount(OrgWrapper, {
    props: { orgId },
    global: {
      plugins: [i18n],
      stubs: {
        FeedbackState: {
          props: ['kind', 'title', 'description'],
          template:
            '<section :data-feedback-state="kind">{{ title }} {{ description }}<slot name="action" /></section>',
        },
        IconButton: true,
        RouterView: { template: '<div data-testid="org-view" />' },
        Scaffold: ScaffoldStub,
      },
    },
  });
}

describe('organization wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.getOrg.mockImplementation(async (id: number) => organization(id));
    state.getOrgPermissions.mockResolvedValue(permissions());
  });

  it('loads the organization and permission owner before rendering the route', async () => {
    const wrapper = mountWrapper('17');
    await flushPromises();

    expect(state.getOrg).toHaveBeenCalledWith(17);
    expect(state.getOrgPermissions).toHaveBeenCalledWith(17);
    expect(wrapper.text()).toContain('org-17');
    expect(wrapper.find('[data-testid="org-view"]').exists()).toBe(true);
  });

  it('renders a retryable active load error', async () => {
    state.getOrg.mockRejectedValueOnce(new Error('organization offline')).mockResolvedValueOnce(organization(17));
    const wrapper = mountWrapper('17');
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('organization offline');
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('org-17');
  });

  it('discards obsolete A completions across A to B to A', async () => {
    const firstA = deferred<Org>();
    const secondA = deferred<Org>();
    state.getOrg
      .mockReturnValueOnce(firstA.promise)
      .mockResolvedValueOnce(organization(2))
      .mockReturnValueOnce(secondA.promise);

    const wrapper = mountWrapper('1');
    await wrapper.setProps({ orgId: '2' });
    await flushPromises();
    expect(wrapper.text()).toContain('org-2');

    await wrapper.setProps({ orgId: '1' });
    secondA.resolve(organization(1));
    await flushPromises();
    expect(wrapper.text()).toContain('org-1');

    firstA.resolve({ ...organization(1), name: 'obsolete-org-1' });
    await flushPromises();
    expect(wrapper.text()).not.toContain('obsolete-org-1');
    expect(wrapper.text()).toContain('org-1');
  });

  it('discards obsolete permission completion across A to B to A', async () => {
    const firstPermissions = deferred<OrgPermissions>();
    state.getOrgPermissions
      .mockReturnValueOnce(firstPermissions.promise)
      .mockResolvedValueOnce(permissions(false))
      .mockResolvedValueOnce(permissions(true));

    const wrapper = mountWrapper('1');
    await flushPromises();
    expect(state.getOrgPermissions).toHaveBeenCalledWith(1);

    await wrapper.setProps({ orgId: '2' });
    await flushPromises();
    expect(wrapper.text()).toContain('org-2');

    await wrapper.setProps({ orgId: '1' });
    await flushPromises();
    expect(wrapper.text()).toContain('org-1');

    firstPermissions.reject(new Error('obsolete permissions failed'));
    await flushPromises();
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('org-1');
  });
});
