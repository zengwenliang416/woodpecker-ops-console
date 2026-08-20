import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Org, OrgPermissions } from '~/lib/api/types';

import OrgSettingsWrapper from './OrgSettingsWrapper.vue';

const state = vi.hoisted(() => ({
  replace: vi.fn(),
  notify: vi.fn(),
  userRegisteredAgents: true,
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: state.replace }),
}));

vi.mock('~/compositions/useConfig', () => ({
  default: () => ({
    userRegisteredAgents: state.userRegisteredAgents,
  }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({ notify: state.notify }),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function mountSettings(admin = true) {
  const org = ref({ id: 17, name: 'acme', is_user: false } as Org);
  const orgPermissions = ref({ member: true, admin } as OrgPermissions);
  const wrapper = mount(OrgSettingsWrapper, {
    props: { orgId: '17' },
    global: {
      plugins: [i18n],
      provide: { org, 'org-permissions': orgPermissions },
      stubs: {
        FeedbackState: {
          props: ['kind', 'title'],
          template: '<section :data-feedback-state="kind">{{ title }}</section>',
        },
        OrgSettingsNav: { template: '<nav data-testid="org-settings-nav" />' },
        RouterLink: { template: '<a><slot /></a>' },
        RouterView: { template: '<div data-testid="settings-view" />' },
        Scaffold: {
          props: ['goBack'],
          template:
            '<main><button data-testid="go-back" @click="goBack">Back</button><slot name="title" /><slot /></main>',
        },
      },
    },
  });
  return { org, orgPermissions, wrapper };
}

describe('organization settings wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.userRegisteredAgents = true;
  });

  it('renders settings only for organization administrators', async () => {
    const { wrapper } = mountSettings(true);
    await flushPromises();

    expect(wrapper.find('[data-testid="org-settings-nav"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="settings-view"]').exists()).toBe(true);
    expect(state.replace).not.toHaveBeenCalled();
  });

  it('re-evaluates permission changes and redirects to the active organization', async () => {
    const { orgPermissions } = mountSettings(true);
    orgPermissions.value = { member: true, admin: false };
    await flushPromises();

    expect(state.notify).toHaveBeenCalledWith({
      type: 'error',
      title: 'You are not allowed to access the settings of this organization',
    });
    expect(state.replace).toHaveBeenCalledWith({ name: 'org', params: { orgId: 17 } });
  });

  it('returns to the current organization after an organization switch', async () => {
    const { org, wrapper } = mountSettings(true);
    org.value = { id: 23, name: 'next-org', is_user: false };
    await flushPromises();

    await wrapper.get('[data-testid="go-back"]').trigger('click');
    expect(state.replace).toHaveBeenLastCalledWith({ name: 'org', params: { orgId: 23 } });
  });

  it('keeps organization settings navigation in the main content flow', () => {
    const wrapperSource = readFileSync(resolve(process.cwd(), 'src/views/org/settings/OrgSettingsWrapper.vue'), 'utf8');
    const navigationSource = readFileSync(
      resolve(process.cwd(), 'src/components/org/settings/OrgSettingsNav.vue'),
      'utf8',
    );

    expect(wrapperSource).toContain('flex-col');
    expect(wrapperSource).not.toContain('lg:grid-cols-[220px_minmax(0,1fr)]');
    expect(navigationSource).toContain('lg:flex-wrap');
    expect(navigationSource).not.toContain('lg:flex-col');
  });
});
