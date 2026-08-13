import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { useConfirmedRequest } from './useConfirmedRequest';

function mountRequest() {
  let requestState = null as unknown as ReturnType<typeof useConfirmedRequest>;
  const wrapper = shallowMount({
    setup() {
      requestState = useConfirmedRequest();
      return {};
    },
    template: '<div />',
  });
  return { requestState, wrapper };
}

describe('useConfirmedRequest', () => {
  it('lets only the latest request confirm or finish state', () => {
    const { requestState, wrapper } = mountRequest();
    const obsolete = requestState.begin();
    const current = requestState.begin(true);

    obsolete.confirm();
    expect(requestState.hasConfirmedData.value).toBe(false);
    expect(obsolete.finish(true)).toBe(false);

    current.confirm();
    expect(current.finish()).toBe(true);
    expect(requestState.hasConfirmedData.value).toBe(true);
    expect(requestState.initialLoading.value).toBe(false);
    expect(requestState.refreshing.value).toBe(false);
    expect(requestState.loadError.value).toBe(false);
    wrapper.unmount();
  });

  it('preserves confirmed data while exposing a refresh failure', () => {
    const { requestState, wrapper } = mountRequest();
    const initial = requestState.begin();
    initial.confirm();
    initial.finish();

    const refresh = requestState.begin(true);
    refresh.finish(true);

    expect(requestState.hasConfirmedData.value).toBe(true);
    expect(requestState.refreshing.value).toBe(false);
    expect(requestState.loadError.value).toBe(true);
    wrapper.unmount();
  });

  it('invalidates active completion and resets route-owned confirmation', () => {
    const { requestState, wrapper } = mountRequest();
    const active = requestState.begin(true);
    requestState.invalidate();

    expect(active.finish(true)).toBe(false);
    expect(requestState.refreshing.value).toBe(false);

    requestState.resetConfirmed();
    expect(requestState.hasConfirmedData.value).toBe(false);
    expect(requestState.initialLoading.value).toBe(true);
    expect(requestState.loadError.value).toBe(false);
    wrapper.unmount();
  });

  it('rejects late completion after unmount', () => {
    const { requestState, wrapper } = mountRequest();
    const active = requestState.begin();
    wrapper.unmount();

    active.confirm();
    expect(active.finish()).toBe(false);
    expect(requestState.hasConfirmedData.value).toBe(false);
  });
});
