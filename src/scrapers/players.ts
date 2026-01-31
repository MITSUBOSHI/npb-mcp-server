import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { Player, Position, Hand, PlayerCategory, Team, TeamRoster } from '../types/npb.js';
import { fetchHTML } from '../utils/http.js';
import { globalCache } from '../utils/cache.js';

/**
 * ポジション名からPositionを判定
 * @internal 現在は未使用だが、将来の拡張のために保持
 */
function _parsePosition(positionText: string): Position {
  if (positionText.includes('投手')) return 'pitcher';
  if (positionText.includes('捕手')) return 'catcher';
  if (positionText.includes('内野手')) return 'infielder';
  if (positionText.includes('外野手')) return 'outfielder';
  return 'pitcher'; // デフォルト
}

/**
 * 投打の文字列からHandを判定
 */
function parseHand(handText: string): Hand {
  const trimmed = handText.trim();
  if (trimmed === '右') return '右';
  if (trimmed === '左') return '左';
  if (trimmed === '両') return '両';
  return '右'; // デフォルト
}

/**
 * テーブル行から選手情報をパース
 */
function parsePlayerRow(
  $: cheerio.CheerioAPI,
  row: Element,
  position: Position,
  category: PlayerCategory,
  teamId: string
): Player | null {
  const cells = $(row).find('td');

  if (cells.length < 7) {
    return null; // データが不完全
  }

  try {
    const number = $(cells[0]).text().trim();
    const name = $(cells[1]).text().trim();
    const birthDate = $(cells[2]).text().trim();
    const heightText = $(cells[3]).text().trim();
    const weightText = $(cells[4]).text().trim();
    const pitchingHand = parseHand($(cells[5]).text());
    const battingHand = parseHand($(cells[6]).text());
    const note = cells.length > 7 ? $(cells[7]).text().trim() : undefined;

    const height = parseInt(heightText, 10);
    const weight = parseInt(weightText, 10);

    if (isNaN(height) || isNaN(weight)) {
      return null;
    }

    // 選手IDを抽出（リンクが存在する場合）
    let playerId: string | undefined;
    const link = $(cells[1]).find('a');
    if (link.length > 0) {
      const href = link.attr('href');
      if (href) {
        // /bis/players/12345678.html のようなパターンから選手IDを抽出
        const match = href.match(/\/bis\/players\/(\d{8})\.html/);
        if (match) {
          playerId = match[1];
        }
      }
    }

    return {
      number,
      name,
      birthDate,
      height,
      weight,
      pitchingHand,
      battingHand,
      position,
      category,
      note: note || undefined,
      teamId,
      playerId,
    };
  } catch (error) {
    console.error('Error parsing player row:', error);
    return null;
  }
}

/**
 * HTMLから選手一覧をスクレイピング
 */
export function scrapePlayersFromHTML(html: string, teamId: string): Player[] {
  const $ = cheerio.load(html);
  const players: Player[] = [];

  // テーブルを探す（rosterlisttblクラスのテーブルを優先）
  $('table.rosterlisttbl, table').each((_, table) => {
    const $table = $(table);

    // カテゴリー判定: まず前の見出しを探す
    let category: PlayerCategory = 'registered';
    const previousHeading = $table.prevAll('h2, h3, h4').first().text();

    if (previousHeading.includes('育成')) {
      category = 'development';
    } else if (previousHeading.includes('支配下')) {
      category = 'registered';
    } else {
      // 前の見出しが見つからない場合、親要素内の見出しを探す
      let parent = $table.parent();
      let foundHeading = false;

      // 最大5階層まで遡って見出しを探す
      for (let i = 0; i < 5 && parent.length > 0 && !foundHeading; i++) {
        // テーブルの前にある見出しを探す
        const headingsBeforeTable = parent.find('h3').filter((_, h) => {
          const $h = $(h);
          const headingText = $h.text().trim();
          // 見出しがテーブルの前にあるかチェック
          const headingIndex = $h.index();
          const tableIndex = $table.index();
          return (
            (headingText.includes('育成') || headingText.includes('支配下')) &&
            headingIndex < tableIndex
          );
        });

        if (headingsBeforeTable.length > 0) {
          const headingText = $(headingsBeforeTable.first()).text().trim();
          if (headingText.includes('育成')) {
            category = 'development';
            foundHeading = true;
          } else if (headingText.includes('支配下')) {
            category = 'registered';
            foundHeading = true;
          }
        }

        parent = parent.parent();
      }

      // 見出しが見つからない場合、背番号のパターンで判定（3桁の背番号は育成選手の可能性が高い）
      if (!foundHeading) {
        const firstDataRow = $table
          .find('tr')
          .filter((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
              const number = $(cells[0]).text().trim();
              return /^\d{3}$/.test(number); // 3桁の数字
            }
            return false;
          })
          .first();

        if (firstDataRow.length > 0) {
          category = 'development';
        }
      }
    }

    let currentPosition: Position = 'pitcher';

    // テーブル内の各行を処理
    $table.find('tbody tr, tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td, th');

      // セル数が少ない行（ヘッダー行や区切り行）をスキップ
      if (cells.length < 7) {
        // ただし、ポジションヘッダー行の可能性がある場合はチェック
        const rowText = $row.text();
        if (rowText.includes('投手')) {
          currentPosition = 'pitcher';
          return;
        } else if (rowText.includes('捕手')) {
          currentPosition = 'catcher';
          return;
        } else if (rowText.includes('内野手')) {
          currentPosition = 'infielder';
          return;
        } else if (rowText.includes('外野手')) {
          currentPosition = 'outfielder';
          return;
        }
        return;
      }

      // ポジションヘッダー行のチェック（「No. | 投手」のような行）
      const firstCellText = $(cells[0]).text().trim();
      const secondCellText = $(cells[1]).text().trim();

      // ヘッダー行のパターン: 「No.」で始まり、2番目のセルにポジション名がある
      if (firstCellText === 'No.' || firstCellText.includes('No.')) {
        if (secondCellText.includes('投手')) {
          currentPosition = 'pitcher';
          return;
        } else if (secondCellText.includes('捕手')) {
          currentPosition = 'catcher';
          return;
        } else if (secondCellText.includes('内野手')) {
          currentPosition = 'infielder';
          return;
        } else if (secondCellText.includes('外野手')) {
          currentPosition = 'outfielder';
          return;
        }
        // 監督などの行はスキップ
        if (secondCellText.includes('監督') || secondCellText.includes('コーチ')) {
          return;
        }
      }

      // 選手データ行をパース
      const player = parsePlayerRow($, row, currentPosition, category, teamId);
      if (player) {
        players.push(player);
      }
    });
  });

  return players;
}

/**
 * 指定された球団の選手一覧を取得
 */
export async function getTeamPlayers(team: Team): Promise<TeamRoster> {
  const cacheKey = `roster:${team.id}`;

  // キャッシュをチェック
  const cached = globalCache.get<TeamRoster>(cacheKey);
  if (cached) {
    return cached;
  }

  // HTMLを取得してスクレイピング
  const html = await fetchHTML(team.rosterUrl);
  const players = scrapePlayersFromHTML(html, team.id);

  const roster: TeamRoster = {
    team,
    players,
    lastUpdated: new Date(),
  };

  // キャッシュに保存（1時間）
  globalCache.set(cacheKey, roster, 3600000);

  return roster;
}

/**
 * すべての球団の選手を取得
 */
export async function getAllPlayers(teams: Team[]): Promise<Map<string, TeamRoster>> {
  const rosters = new Map<string, TeamRoster>();

  // 並列で取得
  const promises = teams.map(async (team) => {
    try {
      const roster = await getTeamPlayers(team);
      rosters.set(team.id, roster);
    } catch (error) {
      console.error(`Error fetching players for ${team.name}:`, error);
    }
  });

  await Promise.all(promises);
  return rosters;
}
