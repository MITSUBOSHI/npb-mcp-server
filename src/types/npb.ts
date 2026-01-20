/**
 * NPB球団のリーグ
 */
export type League = 'central' | 'pacific';

/**
 * 選手のポジション
 */
export type Position = 'pitcher' | 'catcher' | 'infielder' | 'outfielder';

/**
 * 選手の投打
 */
export type Hand = '右' | '左' | '両';

/**
 * 選手の分類
 */
export type PlayerCategory = 'registered' | 'development';

/**
 * NPB球団情報
 */
export interface Team {
  id: string; // 球団ID (例: 'g' for Giants)
  name: string; // 球団名
  fullName: string; // 正式名称
  league: League; // 所属リーグ
  rosterUrl: string; // 選手一覧ページURL
}

/**
 * 選手情報
 */
export interface Player {
  number: string; // 背番号
  name: string; // 選手名
  birthDate: string; // 生年月日
  height: number; // 身長（cm）
  weight: number; // 体重（kg）
  pitchingHand: Hand; // 投げ
  battingHand: Hand; // 打ち
  position: Position; // ポジション
  category: PlayerCategory; // 選手分類（支配下/育成）
  note?: string; // 備考
  teamId: string; // 所属球団ID
}

/**
 * 球団別選手一覧
 */
export interface TeamRoster {
  team: Team;
  players: Player[];
  lastUpdated: Date;
}
