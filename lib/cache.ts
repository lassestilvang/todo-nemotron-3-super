interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class Cache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTLSeconds: number = 30) {
    this.defaultTTL = defaultTTLSeconds * 1000; // Convert to milliseconds
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > this.defaultTTL) {
      // Expired
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  set(key: string, data: any, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Utility method to create cached fetch function
  createCachedFetch<T>(
    fetchFn: () => Promise<T>,
    key: string,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached) {
      return Promise.resolve(cached);
    }

    return fetchFn().then(data => {
      this.set(key, data, ttlSeconds);
      return data;
    });
  }
}

// Create a singleton instance for API calls
export const apiCache = new Cache(30); // 30 seconds TTL by default