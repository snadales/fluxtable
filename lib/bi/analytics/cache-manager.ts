import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

export interface CacheEntry<T = any> {
  data: T[];
  columns: string[];
  durationMs: number;
  cachedAt: number;
}

class BiCacheManager {
  private static instance: BiCacheManager;
  private cache: LRUCache<string, CacheEntry>;

  private constructor() {
    this.cache = new LRUCache<string, CacheEntry>({
      max: 500, // Máximo 500 consultas cacheadas
      ttl: 60 * 1000, // 60 segundos TTL por defecto
      allowStale: false,
      updateAgeOnGet: false,
    });
  }

  public static getInstance(): BiCacheManager {
    if (!BiCacheManager.instance) {
      BiCacheManager.instance = new BiCacheManager();
    }
    return BiCacheManager.instance;
  }

  /**
   * Genera un hash determinista SHA-256 para la consulta
   */
  public generateKey(source: string, sql: string, params: any[] = [], filters: any = {}): string {
    const raw = `${source}:::${sql.trim()}:::${JSON.stringify(params)}:::${JSON.stringify(filters)}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public get<T = any>(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key) as CacheEntry<T> | undefined;
  }

  public set<T = any>(key: string, value: Omit<CacheEntry<T>, 'cachedAt'>, ttlMs?: number): void {
    this.cache.set(key, { ...value, cachedAt: Date.now() }, { ttl: ttlMs || 60 * 1000 });
  }

  public clear(): void {
    this.cache.clear();
  }

  public get size(): number {
    return this.cache.size;
  }
}

export const biCacheManager = BiCacheManager.getInstance();
