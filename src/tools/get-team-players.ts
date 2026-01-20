import { getTeamById } from '../constants/teams.js';
import { getTeamPlayers } from '../scrapers/players.js';

/**
 * get_team_players ツールの実装
 * 指定された球団の選手一覧を返す
 */
export async function getTeamPlayersHandler(args: { team_id: string }) {
  const { team_id } = args;

  const team = getTeamById(team_id);

  if (!team) {
    throw new Error(`Team not found: ${team_id}`);
  }

  const roster = await getTeamPlayers(team);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            team: roster.team,
            playerCount: roster.players.length,
            players: roster.players,
            lastUpdated: roster.lastUpdated,
          },
          null,
          2
        ),
      },
    ],
  };
}
