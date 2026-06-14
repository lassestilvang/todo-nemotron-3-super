interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
  lastAccessed: number;
}

interface CacheOptions {
  defaultTTL?: number;
  maxSize?: number;
  persist?: boolean;
}

class Cache {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number;
  private maxSize: number;
  private persist: boolean;
  private isClient: boolean;
  private hits: number = 0;
  private misses: number = 0;

  constructor(options: CacheOptions | number = {}) {
    if (typeof options === 'number') {
      this.defaultTTL = options * 1000;
      this.maxSize = 100;
      this.persist = false;
    } else {
      this.defaultTTL = (options.defaultTTL || 30) * 1000;
      this.maxSize = options.maxSize || 100;
      this.persist = options.persist || false;
    }
    this.cache = new Map();
    this.isClient = typeof window !== 'undefined';
  }

  private evictIfNeeded(): void {
    if (this.cache.size < this.maxSize) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (now > item.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    item.lastAccessed = now;
    return item.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds?: number): void {
    this.evictIfNeeded();

    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    const now = Date.now();
    const item: CacheItem<any> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      lastAccessed: now,
    };

    this.cache.set(key, item);

    if (this.persist && this.isClient) {
      try {
        sessionStorage.setItem(`cache_persist_${key}`, JSON.stringify(item));
      } catch {
        // Storage disabled or full
      }
    }
  }

  clearExpired(): number {
    let count = 0;
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (this.persist && this.isClient) {
      try {
        sessionStorage.removeItem(`cache_persist_${key}`);
      } catch {}
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    if (this.persist && this.isClient) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key?.startsWith('cache_persist_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
      } catch {}
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  deleteMatching(pattern: string): number {
    let count = 0;
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats(): { size: number; keys: string[]; expired: number; maxSize: number } {
    const now = Date.now();
    let expired = 0;
    const validKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expired++;
      } else {
        validKeys.push(key);
      }
    }

    return {
      size: this.cache.size,
      keys: validKeys,
      expired,
      maxSize: this.maxSize,
    };
  }

  getStatsDetailed(): {
    size: number;
    maxSize: number;
    expired: number;
    memoryUsage: number;
    hitRate: number;
  } {
    const stats = this.getStats();
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? Math.round((this.hits / totalRequests) * 100) : 0;
    return {
      ...stats,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length,
      hitRate,
    };
  }

  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return Promise.resolve(cached);
    }
    return fetchFn().then(data => {
      this.set(key, data, ttlSeconds);
      return data;
    });
  }

  createCachedFetch<T>(
    fetchFn: () => Promise<T>,
    key: string,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    return fetchFn().then(data => {
      this.set(key, data, ttlSeconds);
      return data;
    }).catch(error => {
      console.warn(`Cache fetch failed for key "${key}":`, error);
      return fetchFn().then(data => {
        this.set(key, data, ttlSeconds);
        return data;
      });
    });
  }

  createCachedFetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    key: string,
    ttlSeconds?: number,
    maxRetries: number = 3
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    const tryFetch = (attempt: number): Promise<T> => {
      return fetchFn()
        .then(data => {
          this.set(key, data, ttlSeconds);
          return data;
        })
        .catch(error => {
          if (attempt < maxRetries) {
            return new Promise(resolve => {
              setTimeout(() => resolve(tryFetch(attempt + 1)), 100 * Math.pow(2, attempt));
            });
          }
          console.warn(`Cache fetch failed for key "${key}" after ${maxRetries} retries:`, error);
          return fetchFn();
        });
    };

    return tryFetch(0);
  }

  invalidateTasks(): void {
    this.deleteMatching('tasks_');
  }

  invalidateLists(): void {
    this.delete('app_lists');
  }

  invalidateLabels(): void {
    this.delete('app_labels');
  }

  invalidateAllAppData(): void {
    this.invalidateTasks();
    this.invalidateLists();
    this.invalidateLabels();
  }
}

export const apiCache = new Cache({ defaultTTL: 30, maxSize: 100 });
export default Cache;