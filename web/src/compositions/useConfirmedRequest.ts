import { onBeforeUnmount, ref } from 'vue';

export interface ConfirmedRequest {
  confirm: () => void;
  finish: (error?: boolean) => boolean;
  isCurrent: () => boolean;
}

export function useConfirmedRequest() {
  const initialLoading = ref(true);
  const refreshing = ref(false);
  const loadError = ref(false);
  const hasConfirmedData = ref(false);
  let alive = true;
  let generation = 0;

  function begin(refresh = false): ConfirmedRequest {
    const requestGeneration = ++generation;
    loadError.value = false;
    if (refresh) refreshing.value = true;
    else initialLoading.value = !hasConfirmedData.value;

    const isCurrent = () => alive && requestGeneration === generation;

    return {
      isCurrent,
      confirm() {
        if (isCurrent()) hasConfirmedData.value = true;
      },
      finish(error = false) {
        if (!isCurrent()) return false;
        loadError.value = error;
        initialLoading.value = false;
        refreshing.value = false;
        return true;
      },
    };
  }

  function resetConfirmed() {
    generation += 1;
    hasConfirmedData.value = false;
    loadError.value = false;
    initialLoading.value = true;
    refreshing.value = false;
  }

  function invalidate() {
    generation += 1;
    initialLoading.value = false;
    refreshing.value = false;
  }

  onBeforeUnmount(() => {
    alive = false;
    generation += 1;
  });

  return {
    begin,
    hasConfirmedData,
    initialLoading,
    invalidate,
    loadError,
    refreshing,
    resetConfirmed,
  };
}
