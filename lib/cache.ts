interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class Cache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number;
  private isClient: boolean;

  constructor(defaultTTLSeconds: number = 30) {
    this.defaultTTL = defaultTTLSeconds * 1000;
    this.isClient = typeof window !== 'undefined';
  }

  private generateKey(key: string): string {
    return `cache_${key}`;
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

    return item.data as T;
  }

  set(key: string, data: any, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
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

  getStats(): { size: number; keys: string[]; expired: number } {
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

export const apiCache = new Cache(30);
export default Cache;