<template>
  <svg
    v-if="shapes"
    v-bind="$attrs"
    width="1.3rem"
    height="1.3rem"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-for="(shape, index) in shapes" :key="index">
      <path v-if="shape.type === 'path'" :d="shape.d" />
      <circle v-else-if="shape.type === 'circle'" :cx="shape.cx" :cy="shape.cy" :r="shape.r" />
      <rect
        v-else-if="shape.type === 'rect'"
        :x="shape.x"
        :y="shape.y"
        :width="shape.width"
        :height="shape.height"
        :rx="shape.rx"
      />
      <ellipse v-else :cx="shape.cx" :cy="shape.cy" :rx="shape.rx" :ry="shape.ry" />
    </template>
  </svg>
  <Icon v-else v-bind="$attrs" :name="name" :bg-circle="bgCircle" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import Icon from '~/components/atomic/Icon.vue';
import type { IconNames } from '~/components/atomic/Icon.vue';

interface PathShape {
  type: 'path';
  d: string;
}
interface CircleShape {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}
interface RectShape {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
}
interface EllipseShape {
  type: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}
type Shape = PathShape | CircleShape | RectShape | EllipseShape;

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  name: IconNames;
  bgCircle?: boolean;
}>();

const path = (d: string): PathShape => ({ type: 'path', d });
const circle = (cx: number, cy: number, r: number): CircleShape => ({ type: 'circle', cx, cy, r });
const rect = (x: number, y: number, width: number, height: number, rx?: number): RectShape => ({
  type: 'rect',
  x,
  y,
  width,
  height,
  rx,
});
const ellipse = (cx: number, cy: number, rx: number, ry: number): EllipseShape => ({ type: 'ellipse', cx, cy, rx, ry });

const iconShapes = {
  home: [path('M3 11.5 12 4l9 7.5'), path('M5.5 10.5V20h13v-9.5'), path('M9 20v-6h6v6')],
  repo: [path('M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z'), path('M4 5.5v15'), path('M8 7h8')],
  branch: [circle(6, 5, 2), circle(18, 6, 2), circle(6, 19, 2), path('M6 7v10'), path('M8 7c5 0 4-1 8-1')],
  agent: [rect(3, 4, 18, 12, 2), path('M8 20h8'), path('M12 16v4'), path('M7 9h.01M11 9h.01')],
  lock: [rect(4, 10, 16, 11, 2), path('M8 10V7a4 4 0 0 1 8 0v3')],
  key: [circle(8, 15, 4), path('m11 12 8-8'), path('m17 6 2 2'), path('m14 9 2 2')],
  settings: [
    circle(12, 12, 3),
    path(
      'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.2H9.6V21a1.7 1.7 0 0 0-.4-1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.9.3l-.1.1L3.4 17l.1-.1A1.7 1.7 0 0 0 3.8 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H2V9.6h.2a1.7 1.7 0 0 0 1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L6.2 3.4l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V2h4v.2a1.7 1.7 0 0 0 .4 1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1 .4h.2v4H21a1.7 1.7 0 0 0-1 .4 1.7 1.7 0 0 0-.6 1z',
    ),
  ],
  users: [circle(9, 8, 3), circle(17, 9, 2.5), path('M3 20a6 6 0 0 1 12 0'), path('M14 16a5 5 0 0 1 7 4')],
  user: [circle(12, 8, 4), path('M4 21a8 8 0 0 1 16 0')],
  queue: [path('M4 6h12M4 12h16M4 18h10'), path('m17 4 3 2-3 2M15 16l3 2-3 2')],
  forge: [
    path('M12 3v4M12 17v4M3 12h4M17 12h4'),
    circle(12, 12, 5),
    path('m5.6 5.6 2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8'),
  ],
  search: [circle(11, 11, 7), path('m20 20-4-4')],
  plus: [path('M12 5v14M5 12h14')],
  chevronRight: [path('m9 18 6-6-6-6')],
  more: [circle(5, 12, 1), circle(12, 12, 1), circle(19, 12, 1)],
  bell: [path('M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9'), path('M10 21h4')],
  moon: [path('M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5z')],
  sun: [
    circle(12, 12, 4),
    path('M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'),
  ],
  play: [path('m8 5 11 7-11 7z')],
  refresh: [path('M20 11a8 8 0 1 0-2.3 5.7'), path('M20 4v7h-7')],
  stop: [rect(6, 6, 12, 12, 2)],
  check: [path('m5 12 4 4L19 6')],
  x: [path('M6 6l12 12M18 6 6 18')],
  warning: [
    path('M10.3 3.7 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0z'),
    path('M12 9v4M12 17h.01'),
  ],
  info: [circle(12, 12, 9), path('M12 11v5M12 8h.01')],
  clock: [circle(12, 12, 9), path('M12 7v5l3 2')],
  file: [path('M5 3h9l5 5v13H5z'), path('M14 3v6h6')],
  list: [path('M8 6h13M8 12h13M8 18h13'), circle(4, 6, 1), circle(4, 12, 1), circle(4, 18, 1)],
  trash: [path('M3 6h18M8 6V3h8v3M6 6l1 15h10l1-15M10 10v7M14 10v7')],
  edit: [path('M12 20h9'), path('M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z')],
  external: [path('M14 3h7v7M10 14 21 3'), path('M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6')],
  shield: [path('M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5z'), path('m9 12 2 2 4-4')],
  terminal: [rect(3, 4, 18, 16, 2), path('m7 9 3 3-3 3M13 15h4')],
  menu: [path('M4 7h16M4 12h16M4 17h16')],
  server: [rect(3, 3, 18, 7, 2), rect(3, 14, 18, 7, 2), path('M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6')],
  cpu: [rect(6, 6, 12, 12, 2), path('M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3'), rect(9, 9, 6, 6, 1)],
  memory: [rect(4, 6, 16, 12, 2), path('M8 10h8M8 14h5M7 3v3M12 3v3M17 3v3M7 18v3M12 18v3M17 18v3')],
  disk: [
    ellipse(12, 5, 8, 3),
    path('M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5'),
    path('M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7'),
  ],
  container: [path('m12 2 9 5-9 5-9-5z'), path('m3 7 9 5 9-5v10l-9 5-9-5z'), path('M12 12v10')],
  rocket: [
    path('M4.5 16.5c-1.5 1.5-2 5-2 5s3.5-.5 5-2'),
    path('M9 15 4 10c4-7 10-8 17-7-1 7-2 13-9 17z'),
    circle(15, 9, 2),
    path('M8 18H4v-4M14 12l-5 5'),
  ],
  app: [rect(3, 3, 7, 7, 1), rect(14, 3, 7, 7, 1), rect(3, 14, 7, 7, 1), rect(14, 14, 7, 7, 1)],
  environment: [path('M12 21s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12Z'), circle(12, 9, 2.5)],
  package: [path('m12 2 8 4-8 4-8-4z'), path('m4 6 8 4 8-4v10l-8 4-8-4z'), path('M12 10v10')],
  alert: [path('M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9'), path('M10 21h4M12 5v5M12 13h.01')],
  activity: [path('M3 12h4l2-6 4 12 2-6h6')],
  rollback: [path('M9 14 4 9l5-5'), path('M4 9h10a6 6 0 0 1 0 12h-3')],
  layers: [path('m12 2 9 5-9 5-9-5z'), path('m3 12 9 5 9-5M3 17l9 5 9-5')],
  pause: [path('M8 5v14M16 5v14')],
} satisfies Record<string, Shape[]>;

const nameMap: Partial<Record<IconNames, keyof typeof iconShapes>> = {
  overview: 'home',
  repo: 'repo',
  branch: 'branch',
  agent: 'agent',
  secret: 'lock',
  settings: 'settings',
  'settings-outline': 'settings',
  org: 'users',
  user: 'user',
  'tray-full': 'queue',
  forge: 'forge',
  search: 'search',
  plus: 'plus',
  'chevron-right': 'chevronRight',
  dots: 'more',
  bell: 'alert',
  moon: 'moon',
  sun: 'sun',
  play: 'play',
  'play-outline': 'play',
  refresh: 'refresh',
  stop: 'stop',
  check: 'check',
  x: 'x',
  warning: 'warning',
  info: 'info',
  duration: 'clock',
  file: 'file',
  list: 'queue',
  trash: 'trash',
  edit: 'edit',
  external: 'external',
  shield: 'shield',
  console: 'terminal',
  menu: 'menu',
  server: 'server',
  infrastructure: 'activity',
  cpu: 'cpu',
  memory: 'memory',
  disk: 'disk',
  docker: 'container',
  rocket: 'rocket',
  app: 'app',
  environment: 'environment',
  package: 'package',
  alert: 'alert',
  activity: 'activity',
  rollback: 'rollback',
  'list-group': 'layers',
  pause: 'pause',
  'visibility-private': 'lock',
  'visibility-internal': 'key',
  close: 'x',
};

const shapes = computed(() => {
  const mappedName = nameMap[props.name];
  return mappedName ? iconShapes[mappedName] : undefined;
});
</script>
