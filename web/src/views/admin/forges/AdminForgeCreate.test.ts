import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Forge } from '~/lib/api/types';

import AdminForgeCreate from './AdminForgeCreate.vue';

const state = vi.hoisted(() => ({
  route: undefined as unknown as { fullPath: string },
  createForge: vi.fn(),
  notify: vi.fn(),
  push: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => state.route,
  useRouter: () => ({ push: state.push }),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({ createForge: state.createForge }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({ notify: state.notify }),
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const AdminForgeFormStub = defineComponent({
  props: {
    forge: {
      type: Object,
      required: true,
    },
    isSaving: Boolean,
  },
  emits: ['update:forge', 'submit'],
  setup(props, { emit }) {
    return () =>
      h('div', { 'data-testid': 'forge-form' }, [
        h('input', {
          'data-testid': 'forge-url',
          value: (props.forge as Partial<Forge>).url ?? '',
          onInput: (event: Event) =>
            emit('update:forge', {
              ...(props.forge as Partial<Forge>),
              url: (event.target as HTMLInputElement).value,
            }),
        }),
        h(
          'button',
          {
            'data-testid': 'forge-create',
            'aria-busy': props.isSaving ? 'true' : undefined,
            onClick: () => emit('submit'),
          },
          'Create',
        ),
      ]);
  },
});

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function deferred<T>() {
  let resolveValue!: (value: T) => void;
  let rejectValue!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveValue = resolve;
    rejectValue = reject;
  });
  return { promise, reject: rejectValue, resolve: resolveValue };
}

function mountCreate() {
  return mount(AdminForgeCreate, {
    global: {
      plugins: [i18n],
      stubs: {
        AdminForgeForm: AdminForgeFormStub,
        PrototypeIcon: true,
        RouterLink: {
          props: ['to'],
          template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
        },
      },
    },
  });
}

describe('administration forge create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.route = reactive({ fullPath: '/admin/forges/create' });
  });

  it('preserves the form and reports an active create failure', async () => {
    state.createForge.mockRejectedValueOnce(new Error('create failed'));
    const wrapper = mountCreate();

    await wrapper.get('[data-testid="forge-url"]').setValue('https://new.test');
    await wrapper.get('[data-testid="forge-create"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-testid="forge-url"]').attributes('value')).toBe('https://new.test');
    expect(state.notify).toHaveBeenCalledWith({ title: 'create failed', type: 'error' });
    expect(state.push).not.toHaveBeenCalled();
  });

  it('does not notify or navigate for an obsolete create completion', async () => {
    const creation = deferred<Forge>();
    state.createForge.mockReturnValue(creation.promise);
    const wrapper = mountCreate();

    await wrapper.get('[data-testid="forge-url"]').setValue('https://new.test');
    await wrapper.get('[data-testid="forge-create"]').trigger('click');
    state.route.fullPath = '/admin/forges';
    await nextTick();
    creation.resolve({ id: 9, type: 'github', url: 'https://new.test' });
    await flushPromises();

    expect(state.notify).not.toHaveBeenCalled();
    expect(state.push).not.toHaveBeenCalled();
  });

  it('keeps an unmounted create completion inert', async () => {
    const creation = deferred<Forge>();
    state.createForge.mockReturnValue(creation.promise);
    const wrapper = mountCreate();

    await wrapper.get('[data-testid="forge-create"]').trigger('click');
    wrapper.unmount();
    creation.resolve({ id: 9, type: 'github', url: 'https://new.test' });
    await flushPromises();

    expect(state.notify).not.toHaveBeenCalled();
    expect(state.push).not.toHaveBeenCalled();
  });
});
