export const destinations = {
  deployments: {
    row: 58,
    productionPath: '/deployments',
    prototypePath: '/#/deployments',
    productionRoute: 'deployments',
    productionZh: [/部署中心/, /DEP-142/],
    productionEn: [/Deployments/, /DEP-142/],
    prototypeZh: [/部署中心/, /DEP-142/],
  },
  deploymentNew: {
    row: 59,
    productionPath: '/deployments/new',
    prototypePath: '/#/deployments/new',
    productionRoute: 'deployment-new',
    productionZh: [/新建部署/, /backend-api/],
    productionEn: [/New deployment/, /backend-api/],
    prototypeZh: [/新建部署/, /选择应用和 Release/],
  },
  deployment: {
    row: 60,
    productionPath: '/deployments/142',
    prototypePath: '/#/deployments/142',
    productionRoute: 'deployment',
    productionZh: [/DEP-142/, /部署失败/],
    productionEn: [/DEP-142/, /Deployment failed/],
    prototypeZh: [/DEP-142/, /backend-api/],
  },
  approvals: {
    row: 61,
    productionPath: '/deployments/approvals',
    prototypePath: '/#/deployments/approvals',
    productionRoute: 'deployment-approvals',
    productionZh: [/生产审批/, /DEP-138/],
    productionEn: [/Production approvals/, /DEP-138/],
    prototypeZh: [/部署审批/, /DEP-138/],
  },
  applications: {
    row: 62,
    productionPath: '/deployments/apps',
    prototypePath: '/#/deployments/apps',
    productionRoute: 'applications',
    productionZh: [/应用/, /backend-api/],
    productionEn: [/Applications/, /backend-api/],
    prototypeZh: [/应用/, /backend-api/],
  },
  application: {
    row: 63,
    productionPath: '/deployments/apps/1',
    prototypePath: '/#/deployments/apps/1',
    productionRoute: 'application',
    productionZh: [/backend-api/, /详情/],
    productionEn: [/backend-api/, /Details/],
    prototypeZh: [/backend-api/, /应用配置/],
  },
  environments: {
    row: 64,
    productionPath: '/deployments/environments',
    prototypePath: '/#/deployments/environments',
    productionRoute: 'environments',
    productionZh: [/环境/, /Production/],
    productionEn: [/Environments/, /Production/],
    prototypeZh: [/环境/, /Production/],
  },
  environment: {
    row: 65,
    productionPath: '/deployments/environments/1',
    prototypePath: '/#/deployments/environments/1',
    productionRoute: 'environment',
    productionZh: [/Production/, /详情/],
    productionEn: [/Production/, /Details/],
    prototypeZh: [/Production/, /保护策略/],
  },
  releases: {
    row: 66,
    productionPath: '/deployments/releases',
    prototypePath: '/#/deployments/releases',
    productionRoute: 'releases',
    productionZh: [/Releases/, /v1\.4\.1/],
    productionEn: [/Releases/, /v1\.4\.1/],
    prototypeZh: [/Release/, /backend-api/],
  },
  policies: {
    row: 67,
    productionPath: '/deployments/policies',
    prototypePath: '/#/deployments/policies',
    productionRoute: 'deployment-policies',
    productionZh: [/部署策略/, /API 范围/],
    productionEn: [/Deployment policies/, /API scope/],
    prototypeZh: [/部署策略/, /审批/],
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
    id: 'production-dark-zh-desktop-deployments-empty',
    surface: 'production',
    destinationId: 'deployments',
    destination: destinations.deployments,
    viewportId: 'desktop',
    viewport: viewports.desktop,
    theme: 'dark',
    locale: 'zh-Hans',
    role: 'admin',
    dataState: 'empty',
    class: 'boundary',
  },
  {
    id: 'production-dark-zh-desktop-application-missing',
    surface: 'production',
    destinationId: 'application',
    destination: { ...destinations.application, productionPath: '/deployments/apps/999' },
    viewportId: 'desktop',
    viewport: viewports.desktop,
    theme: 'dark',
    locale: 'zh-Hans',
    role: 'admin',
    dataState: 'missing-app',
    class: 'boundary',
  },
  {
    id: 'production-dark-zh-desktop-applications-error',
    surface: 'production',
    destinationId: 'applications',
    destination: destinations.applications,
    viewportId: 'desktop',
    viewport: viewports.desktop,
    theme: 'dark',
    locale: 'zh-Hans',
    role: 'admin',
    dataState: 'error-applications',
    class: 'boundary',
    expectedHttpErrors: [{ path: '/api/applications', status: 500 }],
  },
  {
    id: 'production-dark-zh-desktop-deployment-mutation-error',
    surface: 'production',
    destinationId: 'deployment',
    destination: destinations.deployment,
    viewportId: 'desktop',
    viewport: viewports.desktop,
    theme: 'dark',
    locale: 'zh-Hans',
    role: 'admin',
    dataState: 'mutation-error',
    class: 'boundary',
    interaction: { buttonText: '暂停' },
    expectedHttpErrors: [{ path: '/api/deployments/142/pause', status: 409 }],
  },
];

export const states = [...equivalentStates, ...representativeStates, ...boundaryStates];

if (states.length !== 54 || new Set(states.map((state) => state.id)).size !== 54) {
  throw new Error('Task 022 evidence matrix must contain 54 unique states');
}

export function readinessPatterns(state) {
  if (state.id.endsWith('deployment-mutation-error')) return [/DEP-142/, /暂停/];
  return expectedPatterns(state);
}

export function expectedPatterns(state) {
  if (state.id.endsWith('deployments-empty')) return [/部署中心/, /暂无部署/];
  if (state.id.endsWith('application-missing')) return [/未找到应用/, /不存在或已不可用/];
  if (state.id.endsWith('applications-error')) return [/无法加载应用/, /重试/];
  if (state.id.endsWith('deployment-mutation-error')) return [/DEP-142/, /部署操作失败/];
  if (state.surface === 'prototype') return state.destination.prototypeZh;
  return state.locale === 'en' ? state.destination.productionEn : state.destination.productionZh;
}
