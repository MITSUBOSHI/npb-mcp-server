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
  playerId?: string; // 選手ID（8桁の数字、例: "51155136"）
}

/**
 * 球団別選手一覧
 */
export interface TeamRoster {
  team: Team;
  players: Player[];
  lastUpdated: Date;
}

/**
 * 投手成績
 */
export interface PitchingStats {
  year: string; // 年度
  team: string; // 所属球団
  games: number; // 試合数
  wins: number; // 勝利
  losses: number; // 敗北
  saves: number; // セーブ
  holds: number; // ホールド
  hp?: number; // ホールドポイント
  completeGames: number; // 完投
  shutouts: number; // 完封
  noWalks?: number; // 無四球
  winningPercentage: number; // 勝率
  batters: number; // 打者
  innings: number; // 投球回
  hits: number; // 被安打
  homeRuns: number; // 被本塁打
  strikeouts: number; // 奪三振
  strikeoutsPer9: number; // 奪三振率
  walks: number; // 与四球
  hitByPitch: number; // 与死球
  wildPitches: number; // 暴投
  balks: number; // ボーク
  runsAllowed: number; // 失点
  earnedRuns: number; // 自責点
  era: number; // 防御率
}

/**
 * 打撃成績
 */
export interface BattingStats {
  year: string; // 年度
  team: string; // 所属球団
  games: number; // 試合数
  plateAppearances: number; // 打席
  atBats: number; // 打数
  runs: number; // 得点
  hits: number; // 安打
  doubles: number; // 二塁打
  triples: number; // 三塁打
  homeRuns: number; // 本塁打
  totalBases: number; // 塁打
  rbi: number; // 打点
  stolenBases: number; // 盗塁
  caughtStealing: number; // 盗塁死
  sacrificeHits: number; // 犠打
  sacrificeFlies: number; // 犠飛
  walks: number; // 四球
  intentionalWalks: number; // 敬遠
  hitByPitch: number; // 死球
  strikeouts: number; // 三振
  groundedIntoDoublePlays: number; // 併殺打
  average: number; // 打率
  onBasePercentage: number; // 出塁率
  sluggingPercentage: number; // 長打率
  ops: number; // OPS
}

/**
 * 選手の詳細プロフィール
 */
export interface PlayerProfile {
  playerId: string; // 選手ID
  name: string; // 選手名
  nameKana?: string; // 選手名（かな）
  uniformNumber: string; // 背番号
  team: string; // 所属球団
  position: string; // ポジション
  throwingHand: string; // 投げ
  battingHand: string; // 打ち
  height: string; // 身長
  weight: string; // 体重
  birthDate: string; // 生年月日
  birthPlace?: string; // 出身地
  bloodType?: string; // 血液型
  career?: string; // 経歴
  draftInfo?: string; // ドラフト情報
}

/**
 * 選手の詳細情報（プロフィール + 成績）
 */
export interface PlayerDetails {
  profile: PlayerProfile; // プロフィール情報
  pitchingStats?: PitchingStats[]; // 投手成績（年度別）
  battingStats?: BattingStats[]; // 打撃成績（年度別）
  careerPitching?: Partial<PitchingStats>; // 通算投手成績
  careerBatting?: Partial<BattingStats>; // 通算打撃成績
}
