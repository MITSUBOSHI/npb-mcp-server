/* eslint-disable no-irregular-whitespace */
import { describe, it, expect } from 'vitest';
import { scrapePlayersFromHTML } from './players.js';

// 横浜DeNAベイスターズのような実際のHTML構造を模したモックHTML
const mockRosterHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>横浜DeNAベイスターズ 選手一覧</title>
</head>
<body>
  <h1>横浜DeNAベイスターズ</h1>
  <h2>2025年度 選手一覧</h2>
  
  <h3>■ 支配下選手</h3>
  <table class="rosterlisttbl">
    <tr>
      <td>No.</td>
      <td>監督</td>
      <td>生年月日</td>
      <td></td>
      <td>備考</td>
    </tr>
    <tr>
      <td>81</td>
      <td>三浦　大輔</td>
      <td>1973.12.25</td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>No.</td>
      <td>投手</td>
      <td>生年月日</td>
      <td>身長</td>
      <td>体重</td>
      <td>投</td>
      <td>打</td>
      <td>備考</td>
    </tr>
    <tr>
      <td>11</td>
      <td><a href="/bis/players/51155136.html">東　克樹</a></td>
      <td>1995.11.29</td>
      <td>170</td>
      <td>80</td>
      <td>左</td>
      <td>左</td>
      <td></td>
    </tr>
    <tr>
      <td>12</td>
      <td><a href="/bis/players/51234567.html">竹田　祐</a></td>
      <td>1999.07.05</td>
      <td>184</td>
      <td>96</td>
      <td>右</td>
      <td>右</td>
      <td></td>
    </tr>
    <tr>
      <td>No.</td>
      <td>捕手</td>
      <td>生年月日</td>
      <td>身長</td>
      <td>体重</td>
      <td>投</td>
      <td>打</td>
      <td>備考</td>
    </tr>
    <tr>
      <td>2</td>
      <td><a href="/bis/players/52345678.html">戸柱　恭孝</a></td>
      <td>1989.10.20</td>
      <td>178</td>
      <td>88</td>
      <td>右</td>
      <td>右</td>
      <td></td>
    </tr>
    <tr>
      <td>27</td>
      <td><a href="/bis/players/53456789.html">嶺井　博希</a></td>
      <td>1990.05.12</td>
      <td>175</td>
      <td>82</td>
      <td>右</td>
      <td>右</td>
      <td></td>
    </tr>
    <tr>
      <td>No.</td>
      <td>内野手</td>
      <td>生年月日</td>
      <td>身長</td>
      <td>体重</td>
      <td>投</td>
      <td>打</td>
      <td>備考</td>
    </tr>
    <tr>
      <td>6</td>
      <td><a href="/bis/players/54567890.html">牧　秀悟</a></td>
      <td>1994.11.20</td>
      <td>180</td>
      <td>88</td>
      <td>右</td>
      <td>右</td>
      <td></td>
    </tr>
    <tr>
      <td>25</td>
      <td><a href="/bis/players/55678901.html">大和</a></td>
      <td>1992.03.15</td>
      <td>175</td>
      <td>75</td>
      <td>右</td>
      <td>左</td>
      <td></td>
    </tr>
    <tr>
      <td>No.</td>
      <td>外野手</td>
      <td>生年月日</td>
      <td>身長</td>
      <td>体重</td>
      <td>投</td>
      <td>打</td>
      <td>備考</td>
    </tr>
    <tr>
      <td>7</td>
      <td><a href="/bis/players/56789012.html">佐野　恵太</a></td>
      <td>1994.02.06</td>
      <td>180</td>
      <td>88</td>
      <td>右</td>
      <td>左</td>
      <td></td>
    </tr>
    <tr>
      <td>8</td>
      <td><a href="/bis/players/57890123.html">桑原　将志</a></td>
      <td>1993.05.18</td>
      <td>178</td>
      <td>85</td>
      <td>右</td>
      <td>右</td>
      <td></td>
    </tr>
  </table>

  <h3>■ 育成選手</h3>
  <table class="rosterlisttbl">
    <tr>
      <td>No.</td>
      <td>投手</td>
      <td>生年月日</td>
      <td>身長</td>
      <td>体重</td>
      <td>投</td>
      <td>打</td>
      <td>備考</td>
    </tr>
    <tr>
      <td>043</td>
      <td><a href="/bis/players/58901234.html">深沢　鳳介</a></td>
      <td>2003.11.05</td>
      <td>177</td>
      <td>80</td>
      <td>右</td>
      <td>右</td>
      <td></td>
    </tr>
    <tr>
      <td>No.</td>
      <td>内野手</td>
      <td>生年月日</td>
      <td>身長</td>
      <td>体重</td>
      <td>投</td>
      <td>打</td>
      <td>備考</td>
    </tr>
    <tr>
      <td>101</td>
      <td><a href="/bis/players/59012345.html">草野　陽斗</a></td>
      <td>2004.06.07</td>
      <td>175</td>
      <td>87</td>
      <td>右</td>
      <td>右</td>
      <td></td>
    </tr>
  </table>
</body>
</html>
`;

describe('scrapePlayersFromHTML', () => {
  describe('ポジション別の選手抽出', () => {
    it('投手を正しく抽出する', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');
      const pitchers = players.filter((p) => p.position === 'pitcher');

      expect(pitchers.length).toBeGreaterThan(0);
      expect(pitchers[0].name).toBe('東　克樹');
      expect(pitchers[0].position).toBe('pitcher');
      expect(pitchers[0].number).toBe('11');
    });

    it('捕手を正しく抽出する', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');
      const catchers = players.filter((p) => p.position === 'catcher');

      expect(catchers.length).toBe(2);
      expect(catchers[0].name).toBe('戸柱　恭孝');
      expect(catchers[0].position).toBe('catcher');
      expect(catchers[1].name).toBe('嶺井　博希');
    });

    it('内野手を正しく抽出する', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');
      const infielders = players.filter((p) => p.position === 'infielder');

      expect(infielders.length).toBeGreaterThan(0);
      expect(infielders[0].name).toBe('牧　秀悟');
      expect(infielders[0].position).toBe('infielder');
    });

    it('外野手を正しく抽出する', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');
      const outfielders = players.filter((p) => p.position === 'outfielder');

      expect(outfielders.length).toBe(2);
      expect(outfielders[0].name).toBe('佐野　恵太');
      expect(outfielders[0].position).toBe('outfielder');
      expect(outfielders[1].name).toBe('桑原　将志');
    });
  });

  describe('1つのテーブル内の複数ポジション処理', () => {
    it('1つのテーブル内でポジションが切り替わる場合に正しく処理する', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');

      // 支配下登録テーブルには投手、捕手、内野手、外野手が含まれている
      const registeredPlayers = players.filter((p) => p.category === 'registered');

      const pitchers = registeredPlayers.filter((p) => p.position === 'pitcher');
      const catchers = registeredPlayers.filter((p) => p.position === 'catcher');
      const infielders = registeredPlayers.filter((p) => p.position === 'infielder');
      const outfielders = registeredPlayers.filter((p) => p.position === 'outfielder');

      expect(pitchers.length).toBe(2); // 東、竹田
      expect(catchers.length).toBe(2); // 戸柱、嶺井
      expect(infielders.length).toBe(2); // 牧、大和
      expect(outfielders.length).toBe(2); // 佐野、桑原
    });
  });

  describe('カテゴリー判定', () => {
    it('支配下登録選手を正しく判定する', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');
      const registeredPlayers = players.filter((p) => p.category === 'registered');

      expect(registeredPlayers.length).toBeGreaterThan(0);
      expect(registeredPlayers[0].category).toBe('registered');
      expect(registeredPlayers[0].name).toBe('東　克樹');
    });

    it('育成選手を正しく判定する', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');
      const developmentPlayers = players.filter((p) => p.category === 'development');

      expect(developmentPlayers.length).toBe(2);
      expect(developmentPlayers[0].category).toBe('development');
      expect(developmentPlayers[0].name).toBe('深沢　鳳介');
    });
  });

  describe('選手情報の抽出', () => {
    it('選手IDを正しく抽出する', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');
      const player = players.find((p) => p.name === '東　克樹');

      expect(player).toBeDefined();
      expect(player?.playerId).toBe('51155136');
    });

    it('選手の基本情報を正しく抽出する', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');
      const player = players.find((p) => p.name === '東　克樹');

      expect(player).toBeDefined();
      expect(player?.number).toBe('11');
      expect(player?.birthDate).toBe('1995.11.29');
      expect(player?.height).toBe(170);
      expect(player?.weight).toBe(80);
      expect(player?.pitchingHand).toBe('左');
      expect(player?.battingHand).toBe('左');
      expect(player?.teamId).toBe('db');
    });

    it('投打の情報を正しく抽出する', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');
      const player = players.find((p) => p.name === '大和');

      expect(player).toBeDefined();
      expect(player?.pitchingHand).toBe('右');
      expect(player?.battingHand).toBe('左');
    });
  });

  describe('スキップ処理', () => {
    it('監督の行をスキップする', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');
      const manager = players.find((p) => p.name === '三浦　大輔');

      expect(manager).toBeUndefined();
    });

    it('ヘッダー行をスキップする', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');
      // ヘッダー行は選手として抽出されない
      const headerRow = players.find((p) => p.name === 'No.');

      expect(headerRow).toBeUndefined();
    });
  });

  describe('ポジションヘッダー行の検出', () => {
    it('「No. | 投手」のようなヘッダー行を検出してポジションを切り替える', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');

      // 投手ヘッダー行の後に投手が続く
      const pitcherIndex = players.findIndex((p) => p.name === '東　克樹');
      expect(players[pitcherIndex].position).toBe('pitcher');

      // 捕手ヘッダー行の後に捕手が続く
      const catcherIndex = players.findIndex((p) => p.name === '戸柱　恭孝');
      expect(players[catcherIndex].position).toBe('catcher');
    });
  });

  describe('全体の統計', () => {
    it('全ての選手を正しく抽出する', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');

      // 支配下登録: 投手2 + 捕手2 + 内野手2 + 外野手2 = 8名
      // 育成: 投手1 + 内野手1 = 2名
      // 合計: 10名
      expect(players.length).toBe(10);
    });

    it('ポジション別の人数が正しい', () => {
      const players = scrapePlayersFromHTML(mockRosterHTML, 'db');

      const positionCount = {
        pitcher: players.filter((p) => p.position === 'pitcher').length,
        catcher: players.filter((p) => p.position === 'catcher').length,
        infielder: players.filter((p) => p.position === 'infielder').length,
        outfielder: players.filter((p) => p.position === 'outfielder').length,
      };

      expect(positionCount.pitcher).toBe(3); // 支配下2 + 育成1
      expect(positionCount.catcher).toBe(2);
      expect(positionCount.infielder).toBe(3); // 支配下2 + 育成1
      expect(positionCount.outfielder).toBe(2);
    });
  });
});
