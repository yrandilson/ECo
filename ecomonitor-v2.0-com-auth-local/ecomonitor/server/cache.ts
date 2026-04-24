/**
 * Simple In-Memory Cache System
 * 
 * Uso:
 * - Cache para rankings (TTL: 5 minutos)
 * - Cache para weather data (TTL: 1 hora)
 * - Cache para FIRMS data (TTL: 3 horas)
 * 
 * Em produção, considere usar Redis para cache distribuído
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>>;

  constructor() {
    this.cache = new Map();
    
    // Limpar cache expirado a cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Armazenar dados no cache
   */
  set<T>(key: string, data: T, ttlSeconds: number = 3600): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiry });
    
    console.log(`[Cache] Set: ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * Recuperar dados do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Verificar se expirou
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      console.log(`[Cache] Expired: ${key}`);
      return null;
    }
    
    console.log(`[Cache] Hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Verificar se chave existe no cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Deletar chave específica
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`[Cache] Deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Limpar todas as chaves que correspondem a um padrão
   */
  clear(pattern?: string): number {
    if (!pattern) {
      const size = this.cache.size;
      this.cache.clear();
      console.log(`[Cache] Cleared all (${size} keys)`);
      return size;
    }
    
    let deletedCount = 0;
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    console.log(`[Cache] Cleared pattern '${pattern}' (${deletedCount} keys)`);
    return deletedCount;
  }

  /**
   * Limpar entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[Cache] Cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Executar uma função com cache
   * Se o resultado estiver em cache, retorna do cache
   * Senão, executa a função, cacheia e retorna
   */
  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    // Tentar cache primeiro
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Executar função
    const result = await fn();

    // Cachear resultado
    this.set(key, result, ttlSeconds);

    return result;
  }
}

// Singleton
export const cache = new CacheManager();

// Constantes de TTL
export const CacheTTL = {
  VERY_SHORT: 60,           // 1 minuto
  SHORT: 5 * 60,            // 5 minutos
  MEDIUM: 15 * 60,          // 15 minutos
  LONG: 60 * 60,            // 1 hora
  VERY_LONG: 3 * 60 * 60,   // 3 horas
  DAY: 24 * 60 * 60,        // 24 horas
};

// Prefixos de chave para organização
export const CacheKeys = {
  weather: (lat: number, lon: number) => `weather:current:${lat}:${lon}`,
  forecast: (lat: number, lon: number, days: number) => `weather:forecast:${lat}:${lon}:${days}`,
  fireIndex: (lat: number, lon: number) => `weather:fire-index:${lat}:${lon}`,
  firms: (lat: number, lon: number, radius: number, days: number) => `firms:detections:${lat}:${lon}:${radius}:${days}`,
  rankings: (type: 'global' | 'monthly', limit: number) => `rankings:${type}:${limit}`,
  occurrences: (type?: string, limit?: number) => `occurrences:${type || 'all'}:${limit || 20}`,
  stats: () => 'stats:global',
};
