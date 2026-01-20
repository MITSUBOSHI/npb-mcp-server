import { describe, it, expect } from 'vitest';
import { normalizeName, matchesName, matchesPlayerName } from './nameNormalizer.js';

describe('nameNormalizer', () => {
  describe('normalizeName', () => {
    it('全角スペースを除去する', () => {
      expect(normalizeName('牧　秀悟')).toBe('牧秀悟');
    });

    it('半角スペースを除去する', () => {
      expect(normalizeName('牧 秀悟')).toBe('牧秀悟');
    });

    it('中点を除去する', () => {
      expect(normalizeName('まき・しゅうご')).toBe('まきしゅうご');
    });

    it('カタカナをひらがなに変換する', () => {
      expect(normalizeName('マキ')).toBe('まき');
      expect(normalizeName('シュウゴ')).toBe('しゅうご');
    });

    it('複数の正規化を同時に適用する', () => {
      expect(normalizeName('マキ　シュウゴ')).toBe('まきしゅうご');
      expect(normalizeName('まき・しゅう ご')).toBe('まきしゅうご');
    });

    it('漢字はそのまま残す', () => {
      expect(normalizeName('牧秀悟')).toBe('牧秀悟');
    });

    it('空文字列を扱える', () => {
      expect(normalizeName('')).toBe('');
    });
  });

  describe('matchesName', () => {
    it('完全一致する名前を検出する', () => {
      expect(matchesName('牧秀悟', '牧秀悟')).toBe(true);
    });

    it('スペースの有無に関わらずマッチする', () => {
      expect(matchesName('牧秀悟', '牧　秀悟')).toBe(true);
      expect(matchesName('牧 秀悟', '牧秀悟')).toBe(true);
    });

    it('部分一致を検出する', () => {
      expect(matchesName('牧秀悟', '牧')).toBe(true);
      expect(matchesName('牧', '牧秀悟')).toBe(true);
    });

    it('カタカナとひらがなでマッチする', () => {
      expect(matchesName('まき', 'マキ')).toBe(true);
      expect(matchesName('マキ', 'まき')).toBe(true);
    });

    it('一致しない名前を検出する', () => {
      expect(matchesName('牧秀悟', '佐野')).toBe(false);
    });
  });

  describe('matchesPlayerName', () => {
    it('選手名で検索できる（完全一致）', () => {
      expect(matchesPlayerName('牧秀悟', '牧秀悟')).toBe(true);
    });

    it('選手名で検索できる（スペースあり）', () => {
      expect(matchesPlayerName('牧 秀悟', '牧秀悟')).toBe(true);
      expect(matchesPlayerName('牧秀悟', '牧　秀悟')).toBe(true);
    });

    it('選手名で検索できる（部分一致）', () => {
      expect(matchesPlayerName('牧', '牧秀悟')).toBe(true);
      expect(matchesPlayerName('秀悟', '牧秀悟')).toBe(true);
    });

    it('ふりがなで検索できる', () => {
      expect(matchesPlayerName('まき', '牧秀悟', 'まき・しゅうご')).toBe(true);
      expect(matchesPlayerName('しゅうご', '牧秀悟', 'まき・しゅうご')).toBe(true);
    });

    it('ふりがなで検索できる（スペースあり）', () => {
      expect(matchesPlayerName('まき しゅうご', '牧秀悟', 'まき・しゅうご')).toBe(true);
    });

    it('ふりがなで検索できる（カタカナ）', () => {
      expect(matchesPlayerName('マキ', '牧秀悟', 'まき・しゅうご')).toBe(true);
      expect(matchesPlayerName('シュウゴ', '牧秀悟', 'まき・しゅうご')).toBe(true);
    });

    it('ふりがながない場合は選手名のみで検索', () => {
      expect(matchesPlayerName('牧', '牧秀悟')).toBe(true);
      expect(matchesPlayerName('まき', '牧秀悟')).toBe(false); // 漢字とひらがなはマッチしない
    });

    it('一致しない検索クエリを検出する', () => {
      expect(matchesPlayerName('佐野', '牧秀悟', 'まき・しゅうご')).toBe(false);
      expect(matchesPlayerName('さの', '牧秀悟', 'まき・しゅうご')).toBe(false);
    });
  });
});
