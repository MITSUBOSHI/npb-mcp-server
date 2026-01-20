import { TEAMS } from '../constants/teams.js';

/**
 * list_teams ツールの実装
 * すべての球団一覧を返す
 */
export async function listTeams(args: { league?: string }) {
  const { league } = args;

  let teams = TEAMS;

  // リーグでフィルタリング
  if (league === 'central' || league === 'pacific') {
    teams = teams.filter((team) => team.league === league);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(teams, null, 2),
      },
    ],
  };
}
