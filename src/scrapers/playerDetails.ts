import * as cheerio from 'cheerio';
import type {
  PlayerDetails,
  PlayerProfile,
  PitchingStats,
  BattingStats,
  Transfer,
  // 注意: ファーム成績はNPB公式サイトの選手詳細ページに掲載されていないため、
  // 現時点では取得できません。
  // FarmPitchingStats,
  // FarmBattingStats,
} from '../types/npb.js';
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

// 注意: 表彰歴の抽出機能は削除されました。
// NPB公式サイトの選手詳細ページには表彰歴セクションが存在しないため、
// 現時点では取得できません。

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
      // ヘッダー行から列の位置を特定
      const headerRow = $table.find('thead tr, tr:first-child').first();
      const headerCells = headerRow.find('th, td');
      const columnMap: Record<string, number> = {};
      headerCells.each((index, cell) => {
        const headerText = $(cell).text().trim();
        if (headerText) {
          columnMap[headerText] = index;
        }
      });

      $table.find('tbody tr, tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length === 0) return;

        const yearText = $(cells[0]).text().trim();

        // 通算成績の行
        if (yearText.includes('通') || yearText.includes('通算')) {
          career = {
            games: parseNumber($(cells[columnMap['登板'] || 2]).text()),
            wins: parseNumber($(cells[columnMap['勝利'] || 3]).text()),
            losses: parseNumber($(cells[columnMap['敗北'] || 4]).text()),
            saves: parseNumber($(cells[columnMap['セーブ'] || 5]).text()),
            holds: parseNumber($(cells[columnMap['H'] || 6]).text()),
            era: parseNumber($(cells[cells.length - 1]).text()),
          };
          return;
        }

        // 年度別成績
        if (yearText.match(/^\d{4}$/)) {
          // セルインデックスを動的に取得（ヘッダー行から列位置を特定）
          const getCellValue = (columnName: string, defaultIndex: number): number => {
            const index = columnMap[columnName];
            if (index !== undefined && index < cells.length) {
              return parseNumber($(cells[index]).text());
            }
            return parseNumber($(cells[defaultIndex] || cells[0]).text());
          };

          const getCellValueWithDecimal = (columnName: string, defaultIndex: number): number => {
            const index = columnMap[columnName];
            if (index !== undefined && index < cells.length) {
              let text = $(cells[index]).text().trim();
              // 次のセルが小数部分（.1, .2など）の場合は結合
              if (index + 1 < cells.length) {
                const nextCellText = $(cells[index + 1])
                  .text()
                  .trim();
                if (nextCellText.match(/^\.\d+$/)) {
                  text += nextCellText;
                }
              }
              return parseNumber(text);
            }
            // フォールバック: デフォルトインデックスから取得
            if (defaultIndex < cells.length) {
              let text = $(cells[defaultIndex]).text().trim();
              if (defaultIndex + 1 < cells.length) {
                const nextCellText = $(cells[defaultIndex + 1])
                  .text()
                  .trim();
                if (nextCellText.match(/^\.\d+$/)) {
                  text += nextCellText;
                }
              }
              return parseNumber(text);
            }
            return 0;
          };

          const stat: PitchingStats = {
            year: yearText,
            team: $(cells[columnMap['所属球団'] ?? 1])
              .text()
              .trim(),
            games: getCellValue('登板', 2),
            wins: getCellValue('勝利', 3),
            losses: getCellValue('敗北', 4),
            saves: getCellValue('セーブ', 5),
            holds: getCellValue('H', 6),
            hp: getCellValue('HP', 7),
            completeGames: getCellValue('完投', 8),
            shutouts: getCellValue('完封勝', 9),
            noWalks: getCellValue('無四球', 10),
            winningPercentage: getCellValue('勝率', 11),
            batters: getCellValue('打者', 12),
            innings: getCellValueWithDecimal('投球回', 13),
            hits: getCellValueWithDecimal('安打', 14),
            homeRuns: getCellValue('本塁打', 15),
            strikeouts: getCellValue('三振', 18),
            strikeoutsPer9: getCellValue('奪三振率', 17),
            walks: getCellValue('四球', 16),
            hitByPitch: getCellValue('死球', 17),
            wildPitches: getCellValue('暴投', 19),
            balks: getCellValue('ボーク', 20),
            runsAllowed: getCellValue('失点', 21),
            earnedRuns: getCellValue('自責点', 22),
            era: parseNumber($(cells[columnMap['防御率'] ?? cells.length - 1]).text()),
          };

          // 詳細統計情報を計算
          if (stat.innings > 0) {
            stat.whip = (stat.walks + stat.hits) / stat.innings;
            stat.homeRunsPer9 = (stat.homeRuns * 9) / stat.innings;
            stat.walksPer9 = (stat.walks * 9) / stat.innings;
            if (stat.walks > 0) {
              stat.strikeoutWalkRatio = stat.strikeouts / stat.walks;
            }
          }
          if (stat.batters > 0) {
            // 被打率 = 被安打 / (打者数 - 与四球 - 与死球)
            const atBatsAgainst = stat.batters - stat.walks - stat.hitByPitch;
            if (atBatsAgainst > 0) {
              stat.battingAverageAgainst = stat.hits / atBatsAgainst;
            }
          }

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

          // 詳細統計情報を計算
          stat.iso = stat.sluggingPercentage - stat.average;
          if (stat.atBats > 0) {
            const ballsInPlay = stat.atBats - stat.strikeouts - stat.homeRuns;
            if (ballsInPlay > 0) {
              stat.babip = (stat.hits - stat.homeRuns) / ballsInPlay;
            }
          }
          if (stat.plateAppearances > 0) {
            stat.strikeoutRate = stat.strikeouts / stat.plateAppearances;
            stat.walkRate = stat.walks / stat.plateAppearances;
            stat.homeRunRate = stat.homeRuns / stat.plateAppearances;
          }
          if (stat.stolenBases + stat.caughtStealing > 0) {
            stat.stolenBasePercentage = stat.stolenBases / (stat.stolenBases + stat.caughtStealing);
          }

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
/**
 * 成績テーブルから移籍履歴を抽出
 * メジャーリーグ期間（データが存在しない年度）も検出
 */
function scrapeTransfers(
  $: cheerio.CheerioAPI,
  pitchingStats?: PitchingStats[],
  battingStats?: BattingStats[]
): Transfer[] {
  const transfers: Transfer[] = [];
  const teamHistory = new Map<string, string>(); // 年度 -> 球団名
  const allYears = new Set<string>(); // 成績テーブルに存在する全年度

  // 投手成績から球団履歴を取得
  if (pitchingStats) {
    pitchingStats.forEach((stat) => {
      if (stat.team && stat.year) {
        teamHistory.set(stat.year, stat.team);
        allYears.add(stat.year);
      }
    });
  }

  // 打撃成績から球団履歴を取得（投手成績と統合）
  if (battingStats) {
    battingStats.forEach((stat) => {
      if (stat.team && stat.year) {
        teamHistory.set(stat.year, stat.team);
        allYears.add(stat.year);
      }
    });
  }

  // 年度順にソート
  const sortedYears = Array.from(teamHistory.keys())
    .map((y) => parseInt(y, 10))
    .filter((y) => !isNaN(y))
    .sort((a, b) => a - b)
    .map((y) => y.toString());

  // 球団の変遷を検出
  let previousTeam: string | undefined;
  let previousYear: number | undefined;

  sortedYears.forEach((year) => {
    const currentTeam = teamHistory.get(year);
    const currentYear = parseInt(year, 10);

    // 前回の年度との間にギャップがある場合、NPB1軍稼働無し期間として記録
    if (previousYear !== undefined && currentYear - previousYear > 1) {
      // ギャップ期間をNPB1軍稼働無し期間として記録
      for (let gapYear = previousYear + 1; gapYear < currentYear; gapYear++) {
        transfers.push({
          year: gapYear.toString(),
          fromTeam: previousTeam,
          toTeam: 'NPB1軍稼働無し', // 成績データが存在しない年度（怪我・メジャーリーグ移籍・その他の可能性）
          type: 'npb_inactive',
        });
      }
      // NPB1軍に戻ってきた移籍も記録
      if (currentTeam) {
        transfers.push({
          year: currentYear.toString(),
          fromTeam: 'NPB1軍稼働無し',
          toTeam: currentTeam,
          type: 'other',
        });
      }
    } else if (currentTeam && currentTeam !== previousTeam && previousTeam) {
      // 球団が変わった場合、移籍として記録
      transfers.push({
        year,
        fromTeam: previousTeam,
        toTeam: currentTeam,
        type: 'other', // 詳細な移籍種別は成績テーブルからは判断できない
      });
    }

    previousTeam = currentTeam;
    previousYear = currentYear;
  });

  return transfers;
}

// 注意: ファーム成績の抽出機能は削除されました。
// NPB公式サイトの選手詳細ページにはファーム成績のセクションが存在しないため、
// 現時点では取得できません。将来的に別のデータソースから取得する可能性があります。
//
// /**
//  * HTMLからファーム投手成績を抽出
//  */
// function scrapeFarmPitchingStats($: cheerio.CheerioAPI): FarmPitchingStats[] { ... }
//
// /**
//  * HTMLからファーム打撃成績を抽出
//  */
// function scrapeFarmBattingStats($: cheerio.CheerioAPI): FarmBattingStats[] { ... }

export function scrapePlayerDetailsFromHTML(html: string, playerId: string): PlayerDetails {
  const $ = cheerio.load(html);

  // プロフィール情報を抽出
  const profile = scrapePlayerProfile($, playerId);

  // 投手成績を抽出
  const { stats: pitchingStats, career: careerPitching } = scrapePitchingStats($);

  // 打撃成績を抽出
  const { stats: battingStats, career: careerBatting } = scrapeBattingStats($);

  // 注意: 表彰歴はNPB公式サイトの選手詳細ページに存在しないため取得できません

  // 移籍履歴を抽出
  const transfers = scrapeTransfers($, pitchingStats, battingStats);

  // 注意: ファーム成績はNPB公式サイトの選手詳細ページに掲載されていないため、
  // 現時点では取得できません。

  return {
    profile,
    pitchingStats: pitchingStats.length > 0 ? pitchingStats : undefined,
    battingStats: battingStats.length > 0 ? battingStats : undefined,
    careerPitching,
    careerBatting,
    transfers: transfers.length > 0 ? transfers : undefined,
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
