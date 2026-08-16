<template>
  <component
    :is="componentTag"
    v-bind="btnAttrs"
    class="relative flex shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-lg border font-semibold whitespace-nowrap transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45"
    :class="[
      sizeClasses,
      {
        'border-wp-border-200 bg-wp-control-neutral-100 text-wp-text-200 hover:border-wp-border-100 hover:bg-wp-control-neutral-200':
          color === 'gray',
        'from-wp-primary-100 to-wp-primary-200 hover:to-wp-primary-100 border-transparent bg-gradient-to-br text-white shadow-[0_8px_22px_rgba(var(--wp-primary-glow-rgb),0.18)] hover:from-[var(--wp-primary-hover-100)]':
          color === 'green',
        'border-wp-error-100/40 bg-wp-error-100/10 text-wp-error-100 hover:border-wp-error-100/60 hover:bg-wp-error-100/20':
          color === 'red',
        'border-wp-control-info-300 bg-wp-control-info-100 hover:bg-wp-control-info-200 text-white': color === 'blue',
        'active:translate-y-px': !interactiveDisabled,
        ...passedClasses,
      },
    ]"
    :title="title"
    :disabled="interactiveDisabled"
    :aria-disabled="interactiveDisabled || undefined"
    :aria-busy="isLoading || undefined"
  >
    <slot>
      <Icon v-if="startIcon" :name="startIcon" class="h-4.5! w-4.5!" :class="{ invisible: isLoading, 'mr-1': text }" />
      <span :class="{ invisible: isLoading }">{{ text }}</span>
      <Icon v-if="endIcon" :name="endIcon" class="ml-2 h-5 w-5" :class="{ invisible: isLoading }" />
      <div
        v-if="isLoading"
        class="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center"
        :class="{
          'bg-wp-control-neutral-200': color === 'gray',
          'bg-wp-control-ok-200': color === 'green',
          'bg-wp-control-info-200': color === 'blue',
          'bg-wp-error-200': color === 'red',
        }"
      >
        <Icon name="spinner" />
      </div>
    </slot>
  </component>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import type { IconNames } from '~/components/atomic/Icon.vue';
import Icon from '~/components/ops/PrototypeIcon.vue';

const props = withDefaults(
  defineProps<{
    text?: string;
    title?: string;
    disabled?: boolean;
    to?: RouteLocationRaw;
    color?: 'blue' | 'green' | 'red' | 'gray';
    size?: 'sm' | 'md' | 'lg';
    startIcon?: IconNames;
    endIcon?: IconNames;
    isLoading?: boolean;
  }>(),
  {
    text: undefined,
    title: undefined,
    to: undefined,
    color: 'gray',
    size: 'md',
    startIcon: undefined,
    endIcon: undefined,
  },
);

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'min-h-7.5 px-2 py-1 text-[11px]';
    case 'lg':
      return 'min-h-[43px] px-4 py-2.5 text-[13px]';
    default:
      return 'min-h-9 px-3 py-1.5 text-xs';
  }
});

const httpLink = computed(() => typeof props.to === 'string' && props.to.startsWith('http'));
const interactiveDisabled = computed(() => props.disabled || props.isLoading);
const componentTag = computed(() => {
  if (props.to == null || interactiveDisabled.value) {
    return 'button';
  }
  return httpLink.value ? 'a' : 'router-link';
});

const btnAttrs = computed(() => {
  if (props.to == null || interactiveDisabled.value) {
    return { type: 'button' };
  }

  if (httpLink.value) {
    return { href: props.to };
  }

  return { to: props.to };
});

const attrs = useAttrs();
const passedClasses = computed(() => {
  const classes: Record<string, boolean> = {};
  const origClass = (attrs.class as string) || '';
  origClass.split(' ').forEach((c) => {
    classes[c] = true;
  });
  return classes;
});
</script>
