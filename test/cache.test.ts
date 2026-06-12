import { describe, it, expect, beforeEach } from 'bun:test';
import Cache from '@/lib/cache';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache(10);
  });

  it('stores and retrieves values', () => {
    cache.set('key1', 'value1');
    expect(cache.get<string>('key1')).toBe('value1');
  });

  it('returns null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('respects TTL', async () => {
    cache.set('short', 'val', 0.001);
    await new Promise(r => setTimeout(r, 10));
    expect(cache.get('short')).toBeNull();
  });

  it('deletes values', () => {
    cache.set('key', 'val');
    expect(cache.delete('key')).toBe(true);
    expect(cache.get('key')).toBeNull();
  });

  it('returns false when deleting nonexistent key', () => {
    expect(cache.delete('nonexistent')).toBe(false);
  });

  it('clears all values', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('reports correct size', () => {
    expect(cache.size()).toBe(0);
    cache.set('a', 1);
    expect(cache.size()).toBe(1);
    cache.set('b', 2);
    expect(cache.size()).toBe(2);
  });

  it('checks key existence with has()', () => {
    cache.set('key', 'val');
    expect(cache.has('key')).toBe(true);
    expect(cache.has('nope')).toBe(false);
  });

  it('lists keys', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    const keys = cache.keys();
    expect(keys).toContain('a');
    expect(keys).toContain('b');
  });

  it('deleteMatching removes keys by pattern', () => {
    cache.set('tasks_all', []);
    cache.set('tasks_today', []);
    cache.set('app_lists', []);
    expect(cache.deleteMatching('tasks')).toBe(2);
    expect(cache.has('tasks_all')).toBe(false);
    expect(cache.has('tasks_today')).toBe(false);
    expect(cache.has('app_lists')).toBe(true);
  });

  it('getStats returns statistics', () => {
    cache.set('a', 1);
    const stats = cache.getStats();
    expect(stats.size).toBe(1);
    expect(stats.keys).toContain('a');
    expect(typeof stats.expired).toBe('number');
  });

  it('createCachedFetch caches fetch results', async () => {
    let callCount = 0;
    const fetchFn = async () => {
      callCount++;
      return 'data';
    };

    const result1 = await cache.createCachedFetch(fetchFn, 'test', 60);
    expect(result1).toBe('data');
    expect(callCount).toBe(1);

    const result2 = await cache.createCachedFetch(fetchFn, 'test', 60);
    expect(result2).toBe('data');
    expect(callCount).toBe(1);
  });
});
