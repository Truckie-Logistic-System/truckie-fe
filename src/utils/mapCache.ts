/**
 * Global map cache to preserve map instances when switching tabs
 */
interface MapCacheItem {
  mapInstance: any;
  containerId: string;
  lastUsed: number;
}

class MapCache {
  private cache = new Map<string, MapCacheItem>();
  private readonly maxAge = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Clean up old maps every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Store a map instance in cache
   */
  set(key: string, mapInstance: any, containerId: string): void {
    this.cache.set(key, {
      mapInstance,
      containerId,
      lastUsed: Date.now()
    });
  }

  /**
   * Get a map instance from cache
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // Check if cache item is still valid
    if (Date.now() - item.lastUsed > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Update last used time
    item.lastUsed = Date.now();
    return item.mapInstance;
  }

  /**
   * Remove a map instance from cache
   */
  remove(key: string): void {
    const item = this.cache.get(key);
    if (item) {
      // Clean up the map instance
      try {
        if (item.mapInstance && item.mapInstance.remove) {
          item.mapInstance.remove();
        }
      } catch (error) {
        console.warn(`[MapCache] Error removing map instance:`, error);
      }
      this.cache.delete(key);
    }
  }

  /**
   * Clean up expired map instances
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.lastUsed > this.maxAge) {
        this.remove(key);
      }
    }
  }

  /**
   * Clear all cached maps
   */
  clear(): void {
    for (const key of this.cache.keys()) {
      this.remove(key);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const mapCache = new MapCache();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    mapCache.clear();
  });
}
