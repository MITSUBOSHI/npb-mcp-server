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
  nameKana?: string; // 選手名（ふりがな、例: "あずま・かつき"）
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
  joinedYear?: number; // 入団年（ドラフト年、例: 2017）
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
  // 詳細統計情報
  whip?: number; // WHIP（Walks + Hits per Inning Pitched）
  battingAverageAgainst?: number; // 被打率
  homeRunsPer9?: number; // 被本塁打率（9イニングあたり）
  walksPer9?: number; // 与四球率（9イニングあたり）
  strikeoutWalkRatio?: number; // 奪三振/与四球比
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
  // 詳細統計情報
  iso?: number; // ISO（Isolated Power = 長打率 - 打率）
  babip?: number; // BABIP（Batting Average on Balls In Play）
  strikeoutRate?: number; // 三振率
  walkRate?: number; // 四球率
  homeRunRate?: number; // 本塁打率
  stolenBasePercentage?: number; // 盗塁成功率
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
  career?: string; // 経歴
  draftInfo?: string; // ドラフト情報
  joinedYear?: number; // 入団年（ドラフト年、例: 2017）
  // 注意: 以下の情報はNPB公式サイトの選手詳細ページに掲載されていないため取得できません
  // birthPlace?: string; // 出身地
  // bloodType?: string; // 血液型
  // awards?: Award[]; // 表彰歴
}

/**
 * 移籍情報
 */
export interface Transfer {
  year: string; // 年度
  fromTeam?: string; // 移籍元球団
  toTeam: string; // 移籍先球団（'NPB1軍稼働無し'の場合はNPB1軍での成績データが存在しない年度）
  type?: 'draft' | 'trade' | 'free_agent' | 'waiver' | 'other' | 'npb_inactive'; // 移籍種別
  // 注意: 成績データが存在しない年度は、怪我・メジャーリーグ移籍・その他の理由により
  // NPB1軍で稼働していない可能性があります。具体的な理由は成績テーブルからは判断できません。
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
  transfers?: Transfer[]; // 移籍履歴
  // 注意: ファーム成績はNPB公式サイトの選手詳細ページに掲載されていないため、
  // 現時点では取得できません。将来的に別のデータソースから取得する可能性があります。
  // farmPitchingStats?: FarmPitchingStats[]; // ファーム投手成績（年度別）
  // farmBattingStats?: FarmBattingStats[]; // ファーム打撃成績（年度別）
}
