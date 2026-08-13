export const destinations = {
  overview: {
    row: 46,
    productionPath: '/infrastructure',
    prototypePath: '/#/infrastructure',
    productionRoute: 'infrastructure',
    productionZh: [/基础设施/, /prod-api-01/],
    productionEn: [/Infrastructure/, /prod-api-01/],
    prototypeZh: [/基础设施/, /prod-api-01/],
  },
  servers: {
    row: 47,
    productionPath: '/infrastructure/servers',
    prototypePath: '/#/infrastructure/servers',
    productionRoute: 'infrastructure-servers',
    productionZh: [/服务器/, /prod-api-01/],
    productionEn: [/Servers/, /prod-api-01/],
    prototypeZh: [/服务器/, /prod-api-01/],
  },
  serverOverview: {
    row: 48,
    productionPath: '/infrastructure/servers/201',
    prototypePath: '/#/infrastructure/servers/201',
    productionRoute: 'infrastructure-server',
    productionZh: [/prod-api-01/, /详情/],
    productionEn: [/prod-api-01/, /Details/],
    prototypeZh: [/prod-api-01/, /概览/],
  },
  serverMonitoring: {
    row: 49,
    productionPath: '/infrastructure/servers/201?tab=monitoring',
    prototypePath: '/#/infrastructure/servers/201?tab=monitoring',
    productionRoute: 'infrastructure-server',
    productionZh: [/prod-api-01/, /CPU 使用率/],
    productionEn: [/prod-api-01/, /CPU usage/],
    prototypeZh: [/prod-api-01/, /CPU 使用率/],
  },
  serverWorkloads: {
    row: 50,
    productionPath: '/infrastructure/servers/201?tab=workloads',
    prototypePath: '/#/infrastructure/servers/201?tab=workloads',
    productionRoute: 'infrastructure-server',
    productionZh: [/服务与容器/, /不支持/],
    productionEn: [/Services & containers/, /Unsupported/],
    prototypeZh: [/服务与容器/, /backend-api/],
  },
  serverDeployments: {
    row: 51,
    productionPath: '/infrastructure/servers/201?tab=deployments',
    prototypePath: '/#/infrastructure/servers/201?tab=deployments',
    productionRoute: 'infrastructure-server',
    productionZh: [/部署记录/, /DEP-142/],
    productionEn: [/Deployments/, /DEP-142/],
    prototypeZh: [/部署/, /DEP-142/],
  },
  serverEvents: {
    row: 52,
    productionPath: '/infrastructure/servers/201?tab=events',
    prototypePath: '/#/infrastructure/servers/201?tab=events',
    productionRoute: 'infrastructure-server',
    productionZh: [/节点事件/, /Node Agent/],
    productionEn: [/Node events/, /Node Agent/],
    prototypeZh: [/服务器事件/, /运行时变更/],
  },
  serverSettings: {
    row: 53,
    productionPath: '/infrastructure/servers/201?tab=settings',
    prototypePath: '/#/infrastructure/servers/201?tab=settings',
    productionRoute: 'infrastructure-server',
    productionZh: [/危险操作/, /移除服务器/],
    productionEn: [/Dangerous actions/, /Remove server/],
    prototypeZh: [/节点配置/, /Node Agent/],
  },
  groups: {
    row: 54,
    productionPath: '/infrastructure/groups',
    prototypePath: '/#/infrastructure/groups',
    productionRoute: 'infrastructure-groups',
    productionZh: [/服务器组/, /prod-api/],
    productionEn: [/Server groups/, /prod-api/],
    prototypeZh: [/服务器组/, /prod-api/],
  },
  group: {
    row: 55,
    productionPath: '/infrastructure/groups/1',
    prototypePath: '/#/infrastructure/groups/1',
    productionRoute: 'infrastructure-group',
    productionZh: [/prod-api/, /Production API nodes/],
    productionEn: [/prod-api/, /Production API nodes/],
    prototypeZh: [/prod-api/, /Production API nodes/],
  },
  services: {
    row: 56,
    productionPath: '/infrastructure/services',
    prototypePath: '/#/infrastructure/services',
    productionRoute: 'infrastructure-services',
    productionZh: [/服务与容器/, /prod-api-01/],
    productionEn: [/Services & containers/, /prod-api-01/],
    prototypeZh: [/服务与容器/, /backend-api/],
  },
  alerts: {
    row: 57,
    productionPath: '/infrastructure/alerts',
    prototypePath: '/#/infrastructure/alerts',
    productionRoute: 'infrastructure-alerts',
    productionZh: [/告警中心/, /Node Agent heartbeat delayed/],
    productionEn: [/Alert center/, /Node Agent heartbeat delayed/],
    prototypeZh: [/告警/, /Node Agent heartbeat missing/],
  },
};

export const viewports = {
  desktop: { width: 1600, height: 1000 },
  mobile: { width: 390, height: 844 },
};

const equivalentStates = Object.entries(viewports).flatMap(([viewportId, viewport]) =>
  Object.entries(destinations).flatMap(([destinationId, destination]) => [
    {
      id: `production-dark-zh-${viewportId}-${destinationId}`,
      surface: 'production',
      destinationId,
      destination,
      viewportId,
      viewport,
      theme: 'dark',
      locale: 'zh-Hans',
      role: 'admin',
      dataState: 'populated',
      class: 'equivalent',
    },
    {
      id: `prototype-dark-zh-${viewportId}-${destinationId}`,
      surface: 'prototype',
      destinationId,
      destination,
      viewportId,
      viewport,
      theme: 'dark',
      locale: 'zh-CN',
      role: 'prototype-administrator',
      dataState: 'populated',
      class: 'equivalent',
    },
  ]),
);

const representativeStates = Object.entries(destinations).map(([destinationId, destination]) => ({
  id: `production-light-en-desktop-${destinationId}`,
  surface: 'production',
  destinationId,
  destination,
  viewportId: 'desktop',
  viewport: viewports.desktop,
  theme: 'light',
  locale: 'en',
  role: 'admin',
  dataState: 'populated',
  class: 'representative',
}));

const boundaryStates = [
  {
    id: 'production-dark-zh-desktop-serverSettings-normal-user',
    surface: 'production',
    destinationId: 'serverSettings',
    destination: destinations.serverSettings,
    viewportId: 'desktop',
    viewport: viewports.desktop,
    theme: 'dark',
    locale: 'zh-Hans',
    role: 'normal',
    dataState: 'populated',
    class: 'boundary',
  },
  {
    id: 'production-dark-zh-desktop-services-empty',
    surface: 'production',
    destinationId: 'services',
    destination: destinations.services,
    viewportId: 'desktop',
    viewport: viewports.desktop,
    theme: 'dark',
    locale: 'zh-Hans',
    role: 'admin',
    dataState: 'empty',
    class: 'boundary',
  },
];

export const states = [...equivalentStates, ...representativeStates, ...boundaryStates];

if (states.length !== 62 || new Set(states.map((state) => state.id)).size !== 62) {
  throw new Error('Task 021 evidence matrix must contain 62 unique states');
}

export function expectedPatterns(state) {
  if (state.id.endsWith('serverSettings-normal-user')) return [/危险操作/, /重启 Node Agent/];
  if (state.id.endsWith('services-empty')) return [/服务与容器/, /未找到服务/];
  if (state.surface === 'prototype') return state.destination.prototypeZh;
  return state.locale === 'en' ? state.destination.productionEn : state.destination.productionZh;
}
