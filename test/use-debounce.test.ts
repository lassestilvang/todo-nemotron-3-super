import { describe, it, expect } from 'bun:test';

describe('useDebounce', () => {
  it('hook can be imported', async () => {
    const mod = await import('@/hooks/use-debounce');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});
