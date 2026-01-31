import * as cheerio from 'cheerio';
import type { PlayerDetails, PlayerProfile, PitchingStats, BattingStats } from '../types/npb.js';
import { fetchHTML } from '../utils/http.js';
import { globalCache } from '../utils/cache.js';

/**
 * 数値文字列をパースする（空文字列や'-'の場合は0を返す）
 */
function parseNumber(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '----') {
    return 0;
  }
  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * HTMLから選手プロフィールを抽出
 */
function scrapePlayerProfile($: cheerio.CheerioAPI, playerId: string): PlayerProfile {
  const profile: Partial<PlayerProfile> = {
    playerId,
  };

  // 選手名を取得
  const nameElement = $('h1').first();
  profile.name = nameElement.text().trim();

  // プロフィール情報を抽出
  const profileItems = $('table tr, dl dd, .playerInfo li');
  profileItems.each((_, elem) => {
    const text = $(elem).text().trim();

    // ふりがな（ひらがなと中点のパターン）
    if (text.match(/^[ぁ-ん・]+$/)) {
      profile.nameKana = text;
    }

    // 背番号
    if (text.match(/^\d{1,3}$/)) {
      profile.uniformNumber = text;
    }

    // ポジション（完全一致でチェック）
    if (text === '投手') {
      profile.position = '投手';
    } else if (text === '捕手') {
      profile.position = '捕手';
    } else if (text === '内野手') {
      profile.position = '内野手';
    } else if (text === '外野手') {
      profile.position = '外野手';
    }

    // 投打
    if (text.includes('投') && text.includes('打')) {
      const match = text.match(/([左右両])投([左右両])打/);
      if (match) {
        profile.throwingHand = match[1];
        profile.battingHand = match[2];
      }
    }

    // 身長体重
    if (text.includes('cm') && text.includes('kg')) {
      const match = text.match(/(\d+)cm[／/](\d+)kg/);
      if (match) {
        profile.height = `${match[1]}cm`;
        profile.weight = `${match[2]}kg`;
      }
    }

    // 生年月日
    if (text.match(/\d{4}年\d{1,2}月\d{1,2}日/)) {
      profile.birthDate = text;
    }

    // 経歴
    if (text.includes('高') || text.includes('大')) {
      if (!profile.career) {
        profile.career = text;
      }
    }

    // ドラフト情報
    if (text.includes('ドラフト')) {
      profile.draftInfo = text;

      // ドラフト情報から入団年を抽出（例: "2017年ドラフト1位" → 2017）
      const yearMatch = text.match(/(\d{4})年ドラフト/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1], 10);
        if (!isNaN(year) && year >= 1965 && year <= 2100) {
          // 妥当な年の範囲をチェック
          profile.joinedYear = year;
        }
      }
    }
  });

  // 入団年がまだ取得できていない場合、成績テーブルの最初の年度から推測
  if (!profile.joinedYear) {
    // 投手成績または打撃成績の最初の年度を取得
    const firstYearRow = $('table tbody tr')
      .filter((_, row) => {
        const firstCell = $(row).find('td').first().text().trim();
        return /^\d{4}$/.test(firstCell); // 4桁の数字（年度）
      })
      .first();

    if (firstYearRow.length > 0) {
      const firstYearText = firstYearRow.find('td').first().text().trim();
      const firstYear = parseInt(firstYearText, 10);
      if (!isNaN(firstYear) && firstYear >= 1965 && firstYear <= 2100) {
        // 最初の年度の前年が入団年（ドラフト年）の可能性が高い
        // ただし、確実ではないので、ドラフト情報がない場合はnullのまま
      }
    }
  }

  // 球団名を取得
  profile.team = $('title').text().split('|')[1]?.trim() || '';

  return profile as PlayerProfile;
}

/**
 * テーブルから投手成績を抽出
 */
function scrapePitchingStats($: cheerio.CheerioAPI): {
  stats: PitchingStats[];
  career?: Partial<PitchingStats>;
} {
  const stats: PitchingStats[] = [];
  let career: Partial<PitchingStats> | undefined;

  // 投手成績テーブルを探す
  $('table').each((_, table) => {
    const $table = $(table);
    const headerText = $table.find('th').text();

    // 投手成績のテーブルかチェック
    if (
      headerText.includes('防御率') ||
      headerText.includes('勝利') ||
      headerText.includes('登板')
    ) {
      const headers: string[] = [];
      $table.find('thead th, tr:first-child th').each((_, th) => {
        headers.push($(th).text().trim());
      });

      $table.find('tbody tr, tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length === 0) return;

        const yearText = $(cells[0]).text().trim();

        // 通算成績の行
        if (yearText.includes('通') || yearText.includes('通算')) {
          career = {
            games: parseNumber($(cells[2]).text()),
            wins: parseNumber($(cells[3]).text()),
            losses: parseNumber($(cells[4]).text()),
            saves: parseNumber($(cells[5]).text()),
            holds: parseNumber($(cells[6]).text()),
            era: parseNumber($(cells[cells.length - 1]).text()),
          };
          return;
        }

        // 年度別成績
        if (yearText.match(/^\d{4}$/)) {
          const stat: PitchingStats = {
            year: yearText,
            team: $(cells[1]).text().trim(),
            games: parseNumber($(cells[2]).text()),
            wins: parseNumber($(cells[3]).text()),
            losses: parseNumber($(cells[4]).text()),
            saves: parseNumber($(cells[5]).text()),
            holds: parseNumber($(cells[6]).text()),
            hp: parseNumber($(cells[7]).text()),
            completeGames: parseNumber($(cells[8]).text()),
            shutouts: parseNumber($(cells[9]).text()),
            noWalks: parseNumber($(cells[10]).text()),
            winningPercentage: parseNumber($(cells[11]).text()),
            batters: parseNumber($(cells[12]).text()),
            innings: parseNumber($(cells[13]).text()),
            hits: parseNumber($(cells[14]).text()),
            homeRuns: parseNumber($(cells[15]).text()),
            strikeouts: parseNumber($(cells[16]).text()),
            strikeoutsPer9: parseNumber($(cells[17]).text()),
            walks: parseNumber($(cells[18]).text()),
            hitByPitch: parseNumber($(cells[19]).text()),
            wildPitches: parseNumber($(cells[20]).text()),
            balks: parseNumber($(cells[21]).text()),
            runsAllowed: parseNumber($(cells[22]).text()),
            earnedRuns: parseNumber($(cells[23]).text()),
            era: parseNumber($(cells[24]).text()),
          };
          stats.push(stat);
        }
      });
    }
  });

  return { stats, career };
}

/**
 * テーブルから打撃成績を抽出
 */
function scrapeBattingStats($: cheerio.CheerioAPI): {
  stats: BattingStats[];
  career?: Partial<BattingStats>;
} {
  const stats: BattingStats[] = [];
  let career: Partial<BattingStats> | undefined;

  // 打撃成績テーブルを探す
  $('table').each((_, table) => {
    const $table = $(table);
    const headerText = $table.find('th').text();

    // 打撃成績のテーブルかチェック（投手成績テーブルを除外）
    if (
      (headerText.includes('打率') || headerText.includes('安打') || headerText.includes('打席')) &&
      !headerText.includes('防御率') &&
      !headerText.includes('勝利')
    ) {
      $table.find('tbody tr, tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length === 0) return;

        const yearText = $(cells[0]).text().trim();

        // 通算成績の行
        if (yearText.includes('通') || yearText.includes('通算')) {
          career = {
            games: parseNumber($(cells[2]).text()),
            plateAppearances: parseNumber($(cells[3]).text()),
            atBats: parseNumber($(cells[4]).text()),
            hits: parseNumber($(cells[6]).text()),
            average: parseNumber($(cells[21]).text()),
          };
          return;
        }

        // 年度別成績
        if (yearText.match(/^\d{4}$/)) {
          const stat: BattingStats = {
            year: yearText,
            team: $(cells[1]).text().trim(),
            games: parseNumber($(cells[2]).text()),
            plateAppearances: parseNumber($(cells[3]).text()),
            atBats: parseNumber($(cells[4]).text()),
            runs: parseNumber($(cells[5]).text()),
            hits: parseNumber($(cells[6]).text()),
            doubles: parseNumber($(cells[7]).text()),
            triples: parseNumber($(cells[8]).text()),
            homeRuns: parseNumber($(cells[9]).text()),
            totalBases: parseNumber($(cells[10]).text()),
            rbi: parseNumber($(cells[11]).text()),
            stolenBases: parseNumber($(cells[12]).text()),
            caughtStealing: parseNumber($(cells[13]).text()),
            sacrificeHits: parseNumber($(cells[14]).text()),
            sacrificeFlies: parseNumber($(cells[15]).text()),
            walks: parseNumber($(cells[16]).text()),
            intentionalWalks: parseNumber($(cells[17]).text()),
            hitByPitch: parseNumber($(cells[18]).text()),
            strikeouts: parseNumber($(cells[19]).text()),
            groundedIntoDoublePlays: parseNumber($(cells[20]).text()),
            average: parseNumber($(cells[21]).text()),
            onBasePercentage: parseNumber($(cells[22]).text()),
            sluggingPercentage: parseNumber($(cells[23]).text()),
            ops: parseNumber($(cells[24]).text()),
          };
          stats.push(stat);
        }
      });
    }
  });

  return { stats, career };
}

/**
 * HTMLから選手詳細情報をスクレイピング
 */
export function scrapePlayerDetailsFromHTML(html: string, playerId: string): PlayerDetails {
  const $ = cheerio.load(html);

  // プロフィール情報を抽出
  const profile = scrapePlayerProfile($, playerId);

  // 投手成績を抽出
  const { stats: pitchingStats, career: careerPitching } = scrapePitchingStats($);

  // 打撃成績を抽出
  const { stats: battingStats, career: careerBatting } = scrapeBattingStats($);

  return {
    profile,
    pitchingStats: pitchingStats.length > 0 ? pitchingStats : undefined,
    battingStats: battingStats.length > 0 ? battingStats : undefined,
    careerPitching,
    careerBatting,
  };
}

/**
 * 選手詳細情報を取得（キャッシュあり）
 */
export async function getPlayerDetails(playerId: string): Promise<PlayerDetails> {
  const cacheKey = `player-details:${playerId}`;

  // キャッシュをチェック
  const cached = globalCache.get<PlayerDetails>(cacheKey);
  if (cached) {
    return cached;
  }

  // URLを構築してHTMLを取得
  const url = `https://npb.jp/bis/players/${playerId}.html`;
  const html = await fetchHTML(url);

  // HTMLをスクレイピング
  const details = scrapePlayerDetailsFromHTML(html, playerId);

  // キャッシュに保存（24時間）
  globalCache.set(cacheKey, details, 86400000);

  return details;
}
