interface CacheItem<T> {
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

  private generateKey(key: string): string {
    return `cache_${key}`;
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
      return null;
    }

    const now = Date.now();
    if (now > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    item.lastAccessed = now;
    try {
      return item.data as T;
    } catch (error) {
      console.warn(`Cache get error for key "${key}":`, error);
      this.cache.delete(key);
      return null;
    }
  }

  set(key: string, data: any, ttlSeconds?: number): void {
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
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('cache_persist_')) {
            sessionStorage.removeItem(k);
          }
        });
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
    for (const key of this.cache.keys()) {
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
      return fetchFn();
    });
  }
}

export const apiCache = new Cache({ defaultTTL: 30, maxSize: 100 });
export default Cache;