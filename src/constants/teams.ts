import { Team } from '../types/npb.js';

/**
 * NPB全12球団の定義
 */
export const TEAMS: Team[] = [
  // セントラル・リーグ
  {
    id: 'g',
    name: 'ジャイアンツ',
    fullName: '読売ジャイアンツ',
    league: 'central',
    rosterUrl: 'https://npb.jp/bis/teams/rst_g.html',
  },
  {
    id: 't',
    name: 'タイガース',
    fullName: '阪神タイガース',
    league: 'central',
    rosterUrl: 'https://npb.jp/bis/teams/rst_t.html',
  },
  {
    id: 'db',
    name: 'ベイスターズ',
    fullName: '横浜DeNAベイスターズ',
    league: 'central',
    rosterUrl: 'https://npb.jp/bis/teams/rst_db.html',
  },
  {
    id: 'c',
    name: 'カープ',
    fullName: '広島東洋カープ',
    league: 'central',
    rosterUrl: 'https://npb.jp/bis/teams/rst_c.html',
  },
  {
    id: 's',
    name: 'スワローズ',
    fullName: '東京ヤクルトスワローズ',
    league: 'central',
    rosterUrl: 'https://npb.jp/bis/teams/rst_s.html',
  },
  {
    id: 'd',
    name: 'ドラゴンズ',
    fullName: '中日ドラゴンズ',
    league: 'central',
    rosterUrl: 'https://npb.jp/bis/teams/rst_d.html',
  },
  // パシフィック・リーグ
  {
    id: 'h',
    name: 'ホークス',
    fullName: '福岡ソフトバンクホークス',
    league: 'pacific',
    rosterUrl: 'https://npb.jp/bis/teams/rst_h.html',
  },
  {
    id: 'f',
    name: 'ファイターズ',
    fullName: '北海道日本ハムファイターズ',
    league: 'pacific',
    rosterUrl: 'https://npb.jp/bis/teams/rst_f.html',
  },
  {
    id: 'm',
    name: 'マリーンズ',
    fullName: '千葉ロッテマリーンズ',
    league: 'pacific',
    rosterUrl: 'https://npb.jp/bis/teams/rst_m.html',
  },
  {
    id: 'e',
    name: 'イーグルス',
    fullName: '東北楽天ゴールデンイーグルス',
    league: 'pacific',
    rosterUrl: 'https://npb.jp/bis/teams/rst_e.html',
  },
  {
    id: 'bs',
    name: 'バファローズ',
    fullName: 'オリックス・バファローズ',
    league: 'pacific',
    rosterUrl: 'https://npb.jp/bis/teams/rst_bs.html',
  },
  {
    id: 'l',
    name: 'ライオンズ',
    fullName: '埼玉西武ライオンズ',
    league: 'pacific',
    rosterUrl: 'https://npb.jp/bis/teams/rst_l.html',
  },
];

/**
 * 球団IDから球団情報を取得
 */
export function getTeamById(teamId: string): Team | undefined {
  return TEAMS.find((team) => team.id === teamId);
}

/**
 * リーグから球団リストを取得
 */
export function getTeamsByLeague(league: 'central' | 'pacific'): Team[] {
  return TEAMS.filter((team) => team.league === league);
}
