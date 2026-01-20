/**
 * 名前の正規化ユーティリティ
 * 検索時に柔軟なマッチングを実現するための関数群
 */

/**
 * 名前を正規化（検索用）
 * - 全角・半角スペースを除去
 * - 中点（・）を除去
 * - ひらがなに統一
 * - 小文字に変換
 */
export function normalizeName(name: string): string {
  return (
    name
      // eslint-disable-next-line no-irregular-whitespace
      .replace(/[\s　・]/g, '') // 全角・半角スペース、中点を除去
      .toLowerCase() // 小文字に変換
      // カタカナをひらがなに変換
      .replace(/[\u30A1-\u30F6]/g, (match) => {
        const chr = match.charCodeAt(0) - 0x60;
        return String.fromCharCode(chr);
      })
  );
}

/**
 * 2つの名前が一致するかをチェック（正規化して比較）
 */
export function matchesName(name1: string, name2: string): boolean {
  const normalized1 = normalizeName(name1);
  const normalized2 = normalizeName(name2);
  return normalized1.includes(normalized2) || normalized2.includes(normalized1);
}

/**
 * 検索文字列が選手名またはふりがなにマッチするかチェック
 */
export function matchesPlayerName(
  searchQuery: string,
  playerName: string,
  playerNameKana?: string
): boolean {
  const normalizedQuery = normalizeName(searchQuery);

  // 選手名での検索
  if (normalizeName(playerName).includes(normalizedQuery)) {
    return true;
  }

  // ふりがなでの検索
  if (playerNameKana && normalizeName(playerNameKana).includes(normalizedQuery)) {
    return true;
  }

  return false;
}
