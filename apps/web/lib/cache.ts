// Cache utilities for performance optimization

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache<T> {
  private storage: Map<string, CacheEntry<T>> = new Map();

  set(key: string, data: T, ttl: number = 5 * 60 * 1000) {
    this.storage.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): T | null {
    const entry = this.storage.get(key);

    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.storage.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(key?: string) {
    if (key) {
      this.storage.delete(key);
    } else {
      this.storage.clear();
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Singleton cache instance
export const queryCache = new Cache();

// Cache keys generator
export const cacheKeys = {
  appointments: (providerId: string) => `appointments:${providerId}`,
  clients: (providerId: string) => `clients:${providerId}`,
  services: (providerId: string) => `services:${providerId}`,
  reviews: (providerId: string) => `reviews:${providerId}`,
  provider: (providerId: string) => `provider:${providerId}`,
  analytics: (providerId: string) => `analytics:${providerId}`,
};

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoize function
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
