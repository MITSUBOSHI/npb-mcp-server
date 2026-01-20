import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPlayerDetailsHandler } from './get-player-details.js';
import type { PlayerDetails } from '../types/npb.js';

// スクレイパーモジュールをモック化
vi.mock('../scrapers/playerDetails.js', () => ({
  getPlayerDetails: vi.fn(),
}));

import { getPlayerDetails } from '../scrapers/playerDetails.js';

describe('getPlayerDetailsHandler', () => {
  const mockPlayerDetails: PlayerDetails = {
    profile: {
      playerId: '51155136',
      name: '東　克樹',
      uniformNumber: '11',
      team: '横浜DeNAベイスターズ',
      position: '投手',
      throwingHand: '左',
      battingHand: '左',
      height: '170cm',
      weight: '80kg',
      birthDate: '1995年11月29日',
      career: '愛工大名電高→立命館大',
      draftInfo: '2017年ドラフト1位',
    },
    pitchingStats: [
      {
        year: '2018',
        team: 'DeNA',
        games: 26,
        wins: 9,
        losses: 6,
        saves: 0,
        holds: 0,
        hp: 0,
        completeGames: 2,
        shutouts: 1,
        noWalks: 0,
        winningPercentage: 0.6,
        batters: 620,
        innings: 147.1,
        hits: 138,
        homeRuns: 14,
        strikeouts: 130,
        strikeoutsPer9: 7.94,
        walks: 50,
        hitByPitch: 8,
        wildPitches: 5,
        balks: 0,
        runsAllowed: 62,
        earnedRuns: 57,
        era: 3.48,
      },
    ],
    battingStats: [
      {
        year: '2018',
        team: 'DeNA',
        games: 26,
        plateAppearances: 50,
        atBats: 45,
        runs: 3,
        hits: 5,
        doubles: 1,
        triples: 0,
        homeRuns: 0,
        totalBases: 6,
        rbi: 2,
        stolenBases: 0,
        caughtStealing: 0,
        sacrificeHits: 5,
        sacrificeFlies: 0,
        walks: 0,
        intentionalWalks: 0,
        hitByPitch: 0,
        strikeouts: 25,
        groundedIntoDoublePlays: 0,
        average: 0.111,
        onBasePercentage: 0.111,
        sluggingPercentage: 0.133,
        ops: 0.244,
      },
    ],
    careerPitching: {
      games: 120,
      wins: 60,
      losses: 30,
      era: 2.43,
    },
    careerBatting: {
      games: 100,
      average: 0.114,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系', () => {
    it('正しい選手IDで選手詳細を取得できる', async () => {
      vi.mocked(getPlayerDetails).mockResolvedValue(mockPlayerDetails);

      const result = await getPlayerDetailsHandler({ player_id: '51155136' });

      expect(getPlayerDetails).toHaveBeenCalledWith('51155136');
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBe(1);
      expect(result.content[0].type).toBe('text');

      // JSONレスポンスをパースして検証
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.profile.playerId).toBe('51155136');
      expect(responseData.profile.name).toBe('東　克樹');
    });

    it('レスポンスに投手成績が含まれる', async () => {
      vi.mocked(getPlayerDetails).mockResolvedValue(mockPlayerDetails);

      const result = await getPlayerDetailsHandler({ player_id: '51155136' });
      const responseData = JSON.parse(result.content[0].text);

      expect(responseData.pitchingStats).toBeDefined();
      expect(responseData.pitchingStats.length).toBe(1);
      expect(responseData.pitchingStats[0].year).toBe('2018');
    });

    it('レスポンスに打撃成績が含まれる', async () => {
      vi.mocked(getPlayerDetails).mockResolvedValue(mockPlayerDetails);

      const result = await getPlayerDetailsHandler({ player_id: '51155136' });
      const responseData = JSON.parse(result.content[0].text);

      expect(responseData.battingStats).toBeDefined();
      expect(responseData.battingStats.length).toBe(1);
    });

    it('レスポンスに通算成績が含まれる', async () => {
      vi.mocked(getPlayerDetails).mockResolvedValue(mockPlayerDetails);

      const result = await getPlayerDetailsHandler({ player_id: '51155136' });
      const responseData = JSON.parse(result.content[0].text);

      expect(responseData.careerPitching).toBeDefined();
      expect(responseData.careerPitching.games).toBe(120);
      expect(responseData.careerBatting).toBeDefined();
      expect(responseData.careerBatting.games).toBe(100);
    });
  });

  describe('バリデーション', () => {
    it('選手IDが8桁の数字でない場合エラーになる - 7桁', async () => {
      await expect(getPlayerDetailsHandler({ player_id: '1234567' })).rejects.toThrow(
        'Invalid player ID format: 1234567'
      );

      expect(getPlayerDetails).not.toHaveBeenCalled();
    });

    it('選手IDが8桁の数字でない場合エラーになる - 9桁', async () => {
      await expect(getPlayerDetailsHandler({ player_id: '123456789' })).rejects.toThrow(
        'Invalid player ID format: 123456789'
      );

      expect(getPlayerDetails).not.toHaveBeenCalled();
    });

    it('選手IDが数字以外の文字を含む場合エラーになる', async () => {
      await expect(getPlayerDetailsHandler({ player_id: '1234567a' })).rejects.toThrow(
        'Invalid player ID format: 1234567a'
      );

      expect(getPlayerDetails).not.toHaveBeenCalled();
    });

    it('選手IDが空文字の場合エラーになる', async () => {
      await expect(getPlayerDetailsHandler({ player_id: '' })).rejects.toThrow(
        'Invalid player ID format'
      );

      expect(getPlayerDetails).not.toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('スクレイパーがエラーを投げた場合、適切なエラーメッセージを返す', async () => {
      const errorMessage = 'Network error';
      vi.mocked(getPlayerDetails).mockRejectedValue(new Error(errorMessage));

      await expect(getPlayerDetailsHandler({ player_id: '51155136' })).rejects.toThrow(
        'Failed to fetch player details for ID 51155136: Network error'
      );
    });

    it('スクレイパーがHTTP 404エラーを投げた場合、適切なエラーメッセージを返す', async () => {
      vi.mocked(getPlayerDetails).mockRejectedValue(new Error('HTTP 404: Not Found'));

      await expect(getPlayerDetailsHandler({ player_id: '99999999' })).rejects.toThrow(
        'Failed to fetch player details for ID 99999999: HTTP 404: Not Found'
      );
    });

    it('スクレイパーがタイムアウトした場合、適切なエラーメッセージを返す', async () => {
      vi.mocked(getPlayerDetails).mockRejectedValue(new Error('Request timeout'));

      await expect(getPlayerDetailsHandler({ player_id: '51155136' })).rejects.toThrow(
        'Failed to fetch player details for ID 51155136: Request timeout'
      );
    });
  });

  describe('様々な選手IDでの動作', () => {
    it('先頭が0の選手IDでも正しく処理できる', async () => {
      const mockDetails = {
        ...mockPlayerDetails,
        profile: { ...mockPlayerDetails.profile, playerId: '01234567' },
      };
      vi.mocked(getPlayerDetails).mockResolvedValue(mockDetails);

      const result = await getPlayerDetailsHandler({ player_id: '01234567' });

      expect(getPlayerDetails).toHaveBeenCalledWith('01234567');
      expect(result).toBeDefined();
    });

    it('すべて0の選手IDでも形式チェックは通る', async () => {
      const mockDetails = {
        ...mockPlayerDetails,
        profile: { ...mockPlayerDetails.profile, playerId: '00000000' },
      };
      vi.mocked(getPlayerDetails).mockResolvedValue(mockDetails);

      const result = await getPlayerDetailsHandler({ player_id: '00000000' });

      expect(getPlayerDetails).toHaveBeenCalledWith('00000000');
      expect(result).toBeDefined();
    });

    it('最大値の選手IDでも正しく処理できる', async () => {
      const mockDetails = {
        ...mockPlayerDetails,
        profile: { ...mockPlayerDetails.profile, playerId: '99999999' },
      };
      vi.mocked(getPlayerDetails).mockResolvedValue(mockDetails);

      const result = await getPlayerDetailsHandler({ player_id: '99999999' });

      expect(getPlayerDetails).toHaveBeenCalledWith('99999999');
      expect(result).toBeDefined();
    });
  });
});
