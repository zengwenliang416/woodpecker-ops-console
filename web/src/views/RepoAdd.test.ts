import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import RepoAdd from './RepoAdd.vue';

const api = vi.hoisted(() => ({
  getRepoList: vi.fn(),
  activateRepo: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => api,
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: vi.fn(),
  }),
}));

vi.mock('~/compositions/useRouteBack', () => ({
  useRouteBack: () => vi.fn(),
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const ScaffoldStub = defineComponent({
  setup(_, { slots }) {
    return () => h('main', slots.default?.());
  },
});

const FeedbackStateStub = defineComponent({
  props: {
    kind: String,
    title: String,
    description: String,
  },
  setup(props) {
    return () =>
      h('section', { 'data-feedback-state': props.kind }, [h('strong', props.title), h('p', props.description)]);
  },
});

const ListItemStub = defineComponent({
  setup(_, { slots }) {
    return () => h('article', { 'data-list-item': '' }, slots.default?.());
  },
});

const ButtonStub = defineComponent({
  props: {
    text: String,
  },
  setup(props) {
    return () => h('button', props.text);
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

describe('repository activation feedback', () => {
  it('explains a stale conflict without removing either real repository record', async () => {
    api.getRepoList.mockResolvedValue([
      {
        id: 7,
        forge_remote_id: 'new-remote-id',
        full_name: 'acme/repo',
        has_forge_name_conflict: true,
      },
    ]);

    const wrapper = mount(RepoAdd, {
      global: {
        plugins: [i18n],
        stubs: {
          Scaffold: ScaffoldStub,
          FeedbackState: FeedbackStateStub,
          ListItem: ListItemStub,
          Button: ButtonStub,
          Badge: true,
        },
      },
    });
    await flushPromises();

    const stale = wrapper.get('[data-feedback-state="stale"]');
    expect(stale.text()).toContain('Outdated data needs attention');
    expect(stale.text()).toContain('outdated entry with the same name');
    expect(wrapper.findAll('[data-list-item]')).toHaveLength(2);
    expect(wrapper.text()).toContain('Actions');
  });
});
