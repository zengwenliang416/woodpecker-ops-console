import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Ref } from 'vue';

const INVALID_ELAPSED_TIME = -1;

function normalizeElapsedTime(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
    return undefined;
  }

  return value;
}

export function useElapsedTime(running: Ref<boolean>, startTime: Ref<number | undefined>) {
  const time = ref<number | undefined>(normalizeElapsedTime(startTime.value));
  const timer = ref<ReturnType<typeof setInterval>>();

  function stopTimer() {
    if (timer.value !== undefined) {
      clearInterval(timer.value);
      timer.value = undefined;
    }
  }

  function startTimer() {
    stopTimer();

    if (time.value === undefined || !running.value) {
      return;
    }

    timer.value = setInterval(() => {
      if (time.value !== undefined) {
        const nextTime = normalizeElapsedTime(time.value + 1000);
        if (nextTime === undefined) {
          time.value = undefined;
          stopTimer();
          return;
        }
        time.value = nextTime;
      }
    }, 1000);
  }

  watch([running, startTime], () => {
    time.value = normalizeElapsedTime(startTime.value);

    // should run, has a start-time and is not running atm
    if (running.value && time.value !== undefined && timer.value === undefined) {
      startTimer();
    }

    // should not run or has no start-time and is running atm
    if ((!running.value || time.value === undefined) && timer.value !== undefined) {
      stopTimer();
    }
  });

  onMounted(startTimer);

  onBeforeUnmount(stopTimer);

  return {
    time: computed(() => time.value ?? INVALID_ELAPSED_TIME),
    running,
  };
}
