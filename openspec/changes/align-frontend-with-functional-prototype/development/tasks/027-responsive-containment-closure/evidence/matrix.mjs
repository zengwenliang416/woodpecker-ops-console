/**
 * Task 027 responsive containment audit matrix.
 * 13 representative production routes x 3 viewports (desktop 1280x1000,
 * tablet 768x1024, mobile 390x844) in dark Simplified Chinese.
 */
export const viewports = {
  desktop: { width: 1280, height: 1000, id: 'desktop', mobile: false },
  tablet: { width: 768, height: 1024, id: 'tablet', mobile: false },
  mobile: { width: 390, height: 844, id: 'mobile', mobile: true },
};

const families = {
  overview: {
    row: 2,
    productionPath: '/overview',
    productionRoute: 'overview',
    productionZh: [/backend-api/, /fix failing typecheck/],
  },
  repos: {
    row: 3,
    productionPath: '/repos',
    productionRoute: 'repos',
    productionZh: [/acme\/backend-api/, /acme\/web-frontend/],
  },
  pipelineLogs: {
    row: 11,
    productionPath: '/repos/101/pipeline/842?tab=logs',
    productionRoute: 'repo-pipeline-logs',
    productionZh: [/backend-api/, /842/],
  },
  org: {
    row: 24,
    productionPath: '/orgs/1',
    productionRoute: 'org',
    productionZh: [/acme/],
  },
  admin: {
    row: 28,
    productionPath: '/admin',
    productionRoute: 'admin',
    productionZh: [/系统概览/, /Woodpecker 版本/],
  },
  adminUsers: {
    row: 32,
    productionPath: '/admin/users',
    productionRoute: 'admin-users',
    productionZh: [/alice/, /bob/, /carol/],
  },
  adminAgents: {
    row: 34,
    productionPath: '/admin/agents',
    productionRoute: 'admin-agents',
    productionZh: [/linux-amd64-01/, /linux-arm64-02/],
  },
  user: {
    row: 39,
    productionPath: '/user',
    productionRoute: 'user',
    productionZh: [/alice/],
  },
  infraServers: {
    row: 47,
    productionPath: '/infrastructure/servers',
    productionRoute: 'infrastructure-servers',
    productionZh: [/prod-api-01/, /prod-api-02/],
  },
  infraAlerts: {
    row: 57,
    productionPath: '/infrastructure/alerts',
    productionRoute: 'infrastructure-alerts',
    productionZh: [/告警中心/, /Memory usage above 75% on staging-web-01/],
  },
  deployments: {
    row: 58,
    productionPath: '/deployments',
    productionRoute: 'deployments',
    productionZh: [/142/, /139/],
  },
  login: {
    row: 1,
    productionPath: '/login',
    productionRoute: 'login',
    guest: true,
    productionZh: [/登录/],
  },
  notFound: {
    row: 45,
    productionPath: '/definitely-not-a-real-route',
    productionRoute: 'not-found',
    productionZh: [/404/],
  },
};

export const states = Object.entries(families).flatMap(([family, destination]) =>
  Object.values(viewports).map((viewport) => ({
    id: `${family}-${viewport.id}`,
    surface: 'production',
    theme: 'dark',
    locale: 'zh-Hans',
    row: destination.row,
    viewportId: viewport.id,
    viewport,
    guest: destination.guest === true,
    destination: {
      productionPath: destination.productionPath,
      productionRoute: destination.productionRoute,
    },
    productionZh: destination.productionZh,
  })),
);

export function expectedPatterns(state) {
  return state.productionZh;
}

export function readinessPatterns(state) {
  return state.productionZh;
}

export const routeFamilies = Object.keys(families);
