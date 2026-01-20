import { describe, it, expect, beforeEach } from 'vitest';
import { Cache } from './cache.js';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache(1000); // 1秒のTTL
  });

  it('データを保存して取得できる', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('存在しないキーはnullを返す', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('TTLが切れたデータはnullを返す', async () => {
    cache.set('key1', 'value1', 100); // 100msのTTL
    expect(cache.get('key1')).toBe('value1');

    // 150ms待つ
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(cache.get('key1')).toBeNull();
  });

  it('データを削除できる', () => {
    cache.set('key1', 'value1');
    expect(cache.delete('key1')).toBe(true);
    expect(cache.get('key1')).toBeNull();
  });

  it('存在しないキーの削除はfalseを返す', () => {
    expect(cache.delete('nonexistent')).toBe(false);
  });

  it('すべてのデータをクリアできる', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    cache.clear();

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('キャッシュサイズを取得できる', () => {
    expect(cache.size()).toBe(0);

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    expect(cache.size()).toBe(2);
  });

  it('期限切れエントリーをクリーンアップできる', async () => {
    cache.set('key1', 'value1', 100); // 100msのTTL
    cache.set('key2', 'value2', 5000); // 5秒のTTL

    expect(cache.size()).toBe(2);

    // 150ms待つ
    await new Promise(resolve => setTimeout(resolve, 150));

    cache.cleanup();

    expect(cache.size()).toBe(1);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
  });

  it('複雑なオブジェクトを保存できる', () => {
    const obj = { name: 'test', values: [1, 2, 3] };
    cache.set('obj', obj);

    const retrieved = cache.get<typeof obj>('obj');
    expect(retrieved).toEqual(obj);
  });
});
