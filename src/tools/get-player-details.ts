import { getPlayerDetails } from '../scrapers/playerDetails.js';

/**
 * get_player_details ツールの実装
 * 指定された選手IDの詳細情報を返す
 */
export async function getPlayerDetailsHandler(args: { player_id: string }) {
  const { player_id } = args;

  // 選手IDの形式チェック（8桁の数字）
  if (!player_id.match(/^\d{8}$/)) {
    throw new Error(`Invalid player ID format: ${player_id}. Expected 8 digits.`);
  }

  try {
    const details = await getPlayerDetails(player_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(details, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch player details for ID ${player_id}: ${errorMessage}`);
  }
}
