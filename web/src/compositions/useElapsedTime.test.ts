import { shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useElapsedTime } from './useElapsedTime';

function mountElapsedTime(runningValue: boolean, startValue: number | undefined) {
  const running = ref(runningValue);
  const startTime = ref<number | undefined>(startValue);
  let elapsed = null as unknown as ReturnType<typeof useElapsedTime>;

  const wrapper = shallowMount({
    setup() {
      elapsed = useElapsedTime(running, startTime);
      return {};
    },
    template: '<div />',
  });

  return { elapsed, running, startTime, wrapper };
}

describe('useElapsedTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('preserves a missing value as an invalid sentinel instead of converting it to zero', () => {
    const { elapsed, wrapper } = mountElapsedTime(false, undefined);

    expect(elapsed.time.value).toBe(-1);
    wrapper.unmount();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1, Number.MAX_SAFE_INTEGER + 1])(
    'normalizes invalid elapsed input %s to a missing value',
    (invalidValue) => {
      const { elapsed, wrapper } = mountElapsedTime(true, invalidValue);

      expect(elapsed.time.value).toBe(-1);
      expect(vi.getTimerCount()).toBe(0);
      wrapper.unmount();
    },
  );

  it('increments valid running elapsed time and stops when running becomes false', async () => {
    const { elapsed, running, wrapper } = mountElapsedTime(true, 1_000);

    await vi.advanceTimersByTimeAsync(2_000);
    expect(elapsed.time.value).toBe(3_000);

    running.value = false;
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(2_000);

    expect(elapsed.time.value).toBe(1_000);
    expect(vi.getTimerCount()).toBe(0);
    wrapper.unmount();
  });

  it('stops before elapsed time exceeds the safe integer boundary', async () => {
    const { elapsed, wrapper } = mountElapsedTime(true, Number.MAX_SAFE_INTEGER - 500);

    await vi.advanceTimersByTimeAsync(1_000);

    expect(elapsed.time.value).toBe(-1);
    expect(vi.getTimerCount()).toBe(0);
    wrapper.unmount();
  });
});
