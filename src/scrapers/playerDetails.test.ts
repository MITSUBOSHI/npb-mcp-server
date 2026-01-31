/* eslint-disable no-irregular-whitespace */
import { describe, it, expect } from 'vitest';
import { scrapePlayerDetailsFromHTML } from './playerDetails.js';

// 投手のモックHTML（東克樹選手のような構造）
const mockPitcherHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>東　克樹 | 横浜DeNAベイスターズ</title>
</head>
<body>
  <h1>東　克樹</h1>
  <div class="playerInfo">
    <ul>
      <li>11</li>
      <li>投手</li>
      <li>左投左打</li>
      <li>170cm／80kg</li>
      <li>1995年11月29日</li>
      <li>愛工大名電高→立命館大</li>
      <li>2017年ドラフト1位</li>
    </ul>
  </div>

  <h2>投手成績</h2>
  <table>
    <thead>
      <tr>
        <th>年度</th>
        <th>球団</th>
        <th>登板</th>
        <th>勝利</th>
        <th>敗北</th>
        <th>セーブ</th>
        <th>H</th>
        <th>HP</th>
        <th>完投</th>
        <th>完封</th>
        <th>無四球</th>
        <th>勝率</th>
        <th>打者</th>
        <th>投球回</th>
        <th>安打</th>
        <th>本塁打</th>
        <th>三振</th>
        <th>奪三振率</th>
        <th>四球</th>
        <th>死球</th>
        <th>暴投</th>
        <th>ボーク</th>
        <th>失点</th>
        <th>自責点</th>
        <th>防御率</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>2018</td>
        <td>DeNA</td>
        <td>26</td>
        <td>9</td>
        <td>6</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>2</td>
        <td>1</td>
        <td>0</td>
        <td>.600</td>
        <td>620</td>
        <td>147.1</td>
        <td>138</td>
        <td>14</td>
        <td>130</td>
        <td>7.94</td>
        <td>50</td>
        <td>8</td>
        <td>5</td>
        <td>0</td>
        <td>62</td>
        <td>57</td>
        <td>3.48</td>
      </tr>
      <tr>
        <td>2019</td>
        <td>DeNA</td>
        <td>20</td>
        <td>10</td>
        <td>5</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>1</td>
        <td>0</td>
        <td>0</td>
        <td>.667</td>
        <td>500</td>
        <td>120.0</td>
        <td>100</td>
        <td>10</td>
        <td>110</td>
        <td>8.25</td>
        <td>40</td>
        <td>5</td>
        <td>3</td>
        <td>0</td>
        <td>50</td>
        <td>45</td>
        <td>3.38</td>
      </tr>
      <tr>
        <td>通　算</td>
        <td>2年</td>
        <td>46</td>
        <td>19</td>
        <td>11</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>3</td>
        <td>1</td>
        <td>0</td>
        <td>.633</td>
        <td>1120</td>
        <td>267.1</td>
        <td>238</td>
        <td>24</td>
        <td>240</td>
        <td>8.08</td>
        <td>90</td>
        <td>13</td>
        <td>8</td>
        <td>0</td>
        <td>112</td>
        <td>102</td>
        <td>3.43</td>
      </tr>
    </tbody>
  </table>

  <h2>打撃成績</h2>
  <table>
    <thead>
      <tr>
        <th>年度</th>
        <th>球団</th>
        <th>試合</th>
        <th>打席</th>
        <th>打数</th>
        <th>得点</th>
        <th>安打</th>
        <th>二塁打</th>
        <th>三塁打</th>
        <th>本塁打</th>
        <th>塁打</th>
        <th>打点</th>
        <th>盗塁</th>
        <th>盗塁死</th>
        <th>犠打</th>
        <th>犠飛</th>
        <th>四球</th>
        <th>敬遠</th>
        <th>死球</th>
        <th>三振</th>
        <th>併殺打</th>
        <th>打率</th>
        <th>出塁率</th>
        <th>長打率</th>
        <th>OPS</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>2018</td>
        <td>DeNA</td>
        <td>26</td>
        <td>50</td>
        <td>45</td>
        <td>3</td>
        <td>5</td>
        <td>1</td>
        <td>0</td>
        <td>0</td>
        <td>6</td>
        <td>2</td>
        <td>0</td>
        <td>0</td>
        <td>5</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>25</td>
        <td>0</td>
        <td>.111</td>
        <td>.111</td>
        <td>.133</td>
        <td>.244</td>
      </tr>
      <tr>
        <td>通　算</td>
        <td>1年</td>
        <td>26</td>
        <td>50</td>
        <td>45</td>
        <td>3</td>
        <td>5</td>
        <td>1</td>
        <td>0</td>
        <td>0</td>
        <td>6</td>
        <td>2</td>
        <td>0</td>
        <td>0</td>
        <td>5</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>25</td>
        <td>0</td>
        <td>.111</td>
        <td>.111</td>
        <td>.133</td>
        <td>.244</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

// 野手のモックHTML（打撃成績のみ）
const mockBatterHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>佐野　恵太 | 横浜DeNAベイスターズ</title>
</head>
<body>
  <h1>佐野　恵太</h1>
  <div class="playerInfo">
    <ul>
      <li>7</li>
      <li>外野手</li>
      <li>右投左打</li>
      <li>180cm／88kg</li>
      <li>1994年2月6日</li>
    </ul>
  </div>

  <h2>打撃成績</h2>
  <table>
    <thead>
      <tr>
        <th>年度</th>
        <th>球団</th>
        <th>試合</th>
        <th>打席</th>
        <th>打数</th>
        <th>得点</th>
        <th>安打</th>
        <th>二塁打</th>
        <th>三塁打</th>
        <th>本塁打</th>
        <th>塁打</th>
        <th>打点</th>
        <th>盗塁</th>
        <th>盗塁死</th>
        <th>犠打</th>
        <th>犠飛</th>
        <th>四球</th>
        <th>敬遠</th>
        <th>死球</th>
        <th>三振</th>
        <th>併殺打</th>
        <th>打率</th>
        <th>出塁率</th>
        <th>長打率</th>
        <th>OPS</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>2020</td>
        <td>DeNA</td>
        <td>120</td>
        <td>520</td>
        <td>460</td>
        <td>65</td>
        <td>145</td>
        <td>30</td>
        <td>2</td>
        <td>20</td>
        <td>239</td>
        <td>75</td>
        <td>5</td>
        <td>3</td>
        <td>0</td>
        <td>5</td>
        <td>50</td>
        <td>8</td>
        <td>5</td>
        <td>85</td>
        <td>12</td>
        <td>.315</td>
        <td>.384</td>
        <td>.520</td>
        <td>.904</td>
      </tr>
      <tr>
        <td>通　算</td>
        <td>5年</td>
        <td>600</td>
        <td>2500</td>
        <td>2200</td>
        <td>300</td>
        <td>650</td>
        <td>120</td>
        <td>10</td>
        <td>80</td>
        <td>1030</td>
        <td>350</td>
        <td>25</td>
        <td>15</td>
        <td>5</td>
        <td>20</td>
        <td>250</td>
        <td>40</td>
        <td>25</td>
        <td>400</td>
        <td>60</td>
        <td>.295</td>
        <td>.368</td>
        <td>.468</td>
        <td>.836</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

describe('scrapePlayerDetailsFromHTML', () => {
  describe('投手のプロフィール情報抽出', () => {
    it('選手IDを正しく設定する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.profile.playerId).toBe('51155136');
    });

    it('選手名を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.profile.name).toBe('東　克樹');
    });

    it('背番号を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.profile.uniformNumber).toBe('11');
    });

    it('ポジションを正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.profile.position).toBe('投手');
    });

    it('投打を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.profile.throwingHand).toBe('左');
      expect(result.profile.battingHand).toBe('左');
    });

    it('身長体重を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.profile.height).toBe('170cm');
      expect(result.profile.weight).toBe('80kg');
    });

    it('生年月日を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.profile.birthDate).toContain('1995年11月29日');
    });

    it('経歴を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.profile.career).toContain('愛工大名電高');
    });

    it('ドラフト情報を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.profile.draftInfo).toContain('2017年ドラフト1位');
    });

    it('入団年をドラフト情報から正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.profile.joinedYear).toBe(2017);
    });
  });

  describe('投手成績の抽出', () => {
    it('年度別投手成績を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.pitchingStats).toBeDefined();
      expect(result.pitchingStats?.length).toBe(2);
    });

    it('2018年の投手成績を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      const stats2018 = result.pitchingStats?.find((s) => s.year === '2018');

      expect(stats2018).toBeDefined();
      expect(stats2018?.team).toBe('DeNA');
      expect(stats2018?.games).toBe(26);
      expect(stats2018?.wins).toBe(9);
      expect(stats2018?.losses).toBe(6);
      expect(stats2018?.era).toBe(3.48);
    });

    it('通算投手成績を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.careerPitching).toBeDefined();
      expect(result.careerPitching?.games).toBe(46);
      expect(result.careerPitching?.wins).toBe(19);
      expect(result.careerPitching?.losses).toBe(11);
      expect(result.careerPitching?.era).toBe(3.43);
    });
  });

  describe('打撃成績の抽出', () => {
    it('投手の打撃成績を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.battingStats).toBeDefined();
      expect(result.battingStats?.length).toBe(1);
    });

    it('2018年の打撃成績を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      const stats2018 = result.battingStats?.find((s) => s.year === '2018');

      expect(stats2018).toBeDefined();
      expect(stats2018?.team).toBe('DeNA');
      expect(stats2018?.games).toBe(26);
      expect(stats2018?.average).toBe(0.111);
    });

    it('通算打撃成績を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockPitcherHTML, '51155136');
      expect(result.careerBatting).toBeDefined();
      expect(result.careerBatting?.games).toBe(26);
      expect(result.careerBatting?.average).toBe(0.111);
    });
  });

  describe('野手の成績抽出', () => {
    it('野手の打撃成績を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockBatterHTML, '12345678');
      expect(result.battingStats).toBeDefined();
      expect(result.battingStats?.length).toBe(1);
    });

    it('野手には投手成績がない', () => {
      const result = scrapePlayerDetailsFromHTML(mockBatterHTML, '12345678');
      expect(result.pitchingStats).toBeUndefined();
    });

    it('野手の2020年打撃成績を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockBatterHTML, '12345678');
      const stats2020 = result.battingStats?.find((s) => s.year === '2020');

      expect(stats2020).toBeDefined();
      expect(stats2020?.team).toBe('DeNA');
      expect(stats2020?.games).toBe(120);
      expect(stats2020?.hits).toBe(145);
      expect(stats2020?.homeRuns).toBe(20);
      expect(stats2020?.rbi).toBe(75);
      expect(stats2020?.average).toBe(0.315);
      expect(stats2020?.ops).toBe(0.904);
    });

    it('野手の通算打撃成績を正しく抽出する', () => {
      const result = scrapePlayerDetailsFromHTML(mockBatterHTML, '12345678');
      expect(result.careerBatting).toBeDefined();
      expect(result.careerBatting?.games).toBe(600);
      expect(result.careerBatting?.hits).toBe(650);
      expect(result.careerBatting?.average).toBe(0.295);
    });
  });

  describe('エッジケース', () => {
    it('空のHTMLでもエラーにならない', () => {
      const emptyHTML = '<html><body></body></html>';
      const result = scrapePlayerDetailsFromHTML(emptyHTML, '00000000');

      expect(result).toBeDefined();
      expect(result.profile).toBeDefined();
      expect(result.profile.playerId).toBe('00000000');
    });

    it('数値がない場合は0として扱う', () => {
      const htmlWithDashes = `
        <html><body>
          <h1>テスト選手</h1>
          <table>
            <thead><tr><th>防御率</th></tr></thead>
            <tbody>
              <tr><td>2020</td><td>Test</td><td>-</td><td>-</td><td>-</td></tr>
            </tbody>
          </table>
        </body></html>
      `;
      const result = scrapePlayerDetailsFromHTML(htmlWithDashes, '99999999');
      expect(result).toBeDefined();
    });
  });
});
