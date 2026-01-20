import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { Player, Position, Hand, PlayerCategory, Team, TeamRoster } from '../types/npb.js';
import { fetchHTML } from '../utils/http.js';
import { globalCache } from '../utils/cache.js';

/**
 * ポジション名からPositionを判定
 */
function parsePosition(positionText: string): Position {
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
function parsePlayerRow($: cheerio.CheerioAPI, row: Element, position: Position, category: PlayerCategory, teamId: string): Player | null {
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
      teamId
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

  // テーブルを探す（実際の構造に応じて調整が必要）
  $('table').each((_, table) => {
    const $table = $(table);

    // テーブルのキャプションや見出しからポジションとカテゴリーを判定
    const caption = $table.find('caption').text();
    const previousHeading = $table.prevAll('h2, h3, h4').first().text();
    const contextText = caption + previousHeading;

    let position: Position = 'pitcher';
    let category: PlayerCategory = 'registered';

    // ポジション判定
    if (contextText.includes('投手')) position = 'pitcher';
    else if (contextText.includes('捕手')) position = 'catcher';
    else if (contextText.includes('内野手')) position = 'infielder';
    else if (contextText.includes('外野手')) position = 'outfielder';

    // カテゴリー判定
    if (contextText.includes('育成')) {
      category = 'development';
    }

    // テーブル内の各行を処理
    $table.find('tbody tr').each((_, row) => {
      const player = parsePlayerRow($, row, position, category, teamId);
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
    lastUpdated: new Date()
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
