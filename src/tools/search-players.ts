import { TEAMS } from '../constants/teams.js';
import { getAllPlayers } from '../scrapers/players.js';
import { Player } from '../types/npb.js';
import { matchesPlayerName } from '../utils/nameNormalizer.js';
import { getPlayerDetails } from '../scrapers/playerDetails.js';

/**
 * search_players ツールの実装
 * 選手名やその他の条件で選手を検索
 * スペースの有無やひらがな/カタカナでの検索にも対応
 */
export async function searchPlayers(args: {
  name?: string;
  team_id?: string;
  position?: string;
  number?: string;
}) {
  const { name, team_id, position, number } = args;

  // 対象の球団を決定
  const targetTeams = team_id ? TEAMS.filter((t) => t.id === team_id) : TEAMS;

  // すべての選手を取得
  const rostersMap = await getAllPlayers(targetTeams);
  let allPlayers: Player[] = [];

  for (const roster of rostersMap.values()) {
    allPlayers = allPlayers.concat(roster.players);
  }

  // フィルタリング
  let results = allPlayers;

  if (name) {
    // 名前とふりがなで柔軟に検索
    // ふりがな情報がない選手の場合は、詳細情報を取得して確認
    const filteredResults: Player[] = [];

    for (const player of results) {
      // まず既存のnameKanaで検索
      if (matchesPlayerName(name, player.name, player.nameKana)) {
        filteredResults.push(player);
        continue;
      }

      // ふりがな情報がなく、検索クエリがひらがなの場合は詳細情報を取得
      if (!player.nameKana && player.playerId && /[ぁ-ん]/.test(name)) {
        try {
          const details = await getPlayerDetails(player.playerId);
          // 取得したふりがなをキャッシュ
          player.nameKana = details.profile.nameKana;

          if (matchesPlayerName(name, player.name, player.nameKana)) {
            filteredResults.push(player);
          }
        } catch (error) {
          // 詳細情報の取得に失敗した場合はスキップ
          console.error(`Failed to fetch details for player ${player.playerId}:`, error);
        }
      }
    }

    results = filteredResults;
  }

  if (position) {
    results = results.filter((p) => p.position === position);
  }

  if (number) {
    results = results.filter((p) => p.number === number);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            resultCount: results.length,
            players: results,
          },
          null,
          2
        ),
      },
    ],
  };
}
