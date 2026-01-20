import { TEAMS } from '../constants/teams.js';
import { getAllPlayers } from '../scrapers/players.js';
import { Player } from '../types/npb.js';

/**
 * search_players ツールの実装
 * 選手名やその他の条件で選手を検索
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
    const searchName = name.toLowerCase();
    results = results.filter((p) => p.name.toLowerCase().includes(searchName));
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
