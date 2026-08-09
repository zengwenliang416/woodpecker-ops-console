import { afterEach, describe, expect, it, vi } from 'vitest';

describe('router base path', () => {
  afterEach(() => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: undefined });
    vi.resetModules();
  });

  it('keeps application routes base-relative when Woodpecker uses a root path', async () => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: '/woodpecker' });
    const { default: router } = await import('./router');

    expect(router.resolve('/overview').href).toBe('/woodpecker/overview');
    expect(router.resolve('/deployments/new').href).toBe('/woodpecker/deployments/new');
    expect(router.resolve('/infrastructure/servers/7').href).toBe('/woodpecker/infrastructure/servers/7');
  });
});
