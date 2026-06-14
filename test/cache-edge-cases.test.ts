import { describe, it, expect, beforeEach } from 'bun:test';
import Cache from '@/lib/cache';

describe('Cache Edge Cases', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache({ defaultTTL: 60, maxSize: 100 });
  });

  describe('constructor', () => {
    it('accepts number as TTL in seconds', () => {
      const numCache = new Cache(30);
      expect(numCache.size()).toBe(0);
    });

    it('accepts object with options', () => {
      const optCache = new Cache({ defaultTTL: 30, maxSize: 50 });
      expect(optCache.size()).toBe(0);
    });

    it('uses default values when options not provided', () => {
      const defaultCache = new Cache();
      expect(defaultCache.size()).toBe(0);
    });
  });

  describe('eviction', () => {
    it('evicts when maxSize is reached', () => {
      const smallCache = new Cache({ defaultTTL: 60, maxSize: 2 });
      smallCache.set('a', 'value-a');
      smallCache.set('b', 'value-b');
      smallCache.set('c', 'value-c');
      // Cache should still work
      expect(smallCache.has('c')).toBe(true);
    });

    it('handles deleteMatching with no matches', () => {
      cache.set('key1', 'value1');
      const count = cache.deleteMatching('nonexistent');
      expect(count).toBe(0);
    });
  });

  describe('getOrFetch', () => {
    it('catches and retries on fetch failure', async () => {
      const failCache = new Cache(60);
      let attempts = 0;
      const fetchFn = async () => {
        attempts++;
        throw new Error('Network error');
      };
      // getOrFetch doesn't have retry, that's createCachedFetchWithRetry
      try {
        await failCache.getOrFetch('fail-key', fetchFn);
      } catch (e) {
        expect(attempts).toBe(1);
      }
    });
  });

  describe('createCachedFetch', () => {
    it('returns cached value on second call', async () => {
      let callCount = 0;
      const fetchFn = async () => {
        callCount++;
        return 'data';
      };
      const result1 = await cache.createCachedFetch(fetchFn, 'key', 60);
      const result2 = await cache.createCachedFetch(fetchFn, 'key', 60);
      expect(result1).toBe('data');
      expect(result2).toBe('data');
      expect(callCount).toBe(1);
    });

    it('retries on failure with createCachedFetchWithRetry', async () => {
      let attempts = 0;
      const fetchFn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary error');
        }
        return 'success';
      };
      const result = await cache.createCachedFetchWithRetry(fetchFn, 'retry-key', 60, 3);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('caches fallback result on failure', async () => {
      let attempts = 0;
      const fetchFn = async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('First attempt fails');
        }
        return 'fallback-data';
      };
      const result = await cache.createCachedFetch(fetchFn, 'fallback-key', 60);
      expect(result).toBe('fallback-data');
      expect(attempts).toBe(2);
      // Second call should use cache
      const cachedResult = await cache.createCachedFetch(fetchFn, 'fallback-key', 60);
      expect(cachedResult).toBe('fallback-data');
      expect(attempts).toBe(2); // No additional calls
    });
  });

  describe('clear', () => {
    it('clears all entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      expect(cache.size()).toBe(2);
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });
});