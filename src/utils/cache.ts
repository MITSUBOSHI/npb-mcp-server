/**
 * キャッシュエントリー
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * シンプルなインメモリキャッシュ
 */
export class Cache {
  private store: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  /**
   * @param defaultTTL デフォルトのTTL（ミリ秒）、デフォルトは1時間
   */
  constructor(defaultTTL: number = 3600000) {
    this.store = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * キャッシュからデータを取得
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // TTLを超えている場合は削除して null を返す
    if (age > entry.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * キャッシュにデータを保存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    };

    this.store.set(key, entry);
  }

  /**
   * キャッシュからデータを削除
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * すべてのキャッシュをクリア
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * 期限切れのエントリーを削除
   */
  cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.store.delete(key);
      }
    }
  }

  /**
   * キャッシュサイズを取得
   */
  size(): number {
    return this.store.size;
  }
}

// グローバルキャッシュインスタンス
export const globalCache = new Cache();
