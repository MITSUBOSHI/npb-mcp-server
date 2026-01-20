import { describe, it, expect } from 'vitest';
import { TEAMS, getTeamById, getTeamsByLeague } from './teams.js';

describe('Teams', () => {
  describe('TEAMS定数', () => {
    it('12球団すべてが定義されている', () => {
      expect(TEAMS).toHaveLength(12);
    });

    it('各球団に必要なフィールドがある', () => {
      TEAMS.forEach((team) => {
        expect(team).toHaveProperty('id');
        expect(team).toHaveProperty('name');
        expect(team).toHaveProperty('fullName');
        expect(team).toHaveProperty('league');
        expect(team).toHaveProperty('rosterUrl');

        expect(typeof team.id).toBe('string');
        expect(typeof team.name).toBe('string');
        expect(typeof team.fullName).toBe('string');
        expect(['central', 'pacific']).toContain(team.league);
        expect(team.rosterUrl).toMatch(/^https:\/\/npb\.jp\/bis\/teams\/rst_/);
      });
    });

    it('セ・リーグは6球団', () => {
      const centralTeams = TEAMS.filter((t) => t.league === 'central');
      expect(centralTeams).toHaveLength(6);
    });

    it('パ・リーグは6球団', () => {
      const pacificTeams = TEAMS.filter((t) => t.league === 'pacific');
      expect(pacificTeams).toHaveLength(6);
    });

    it('球団IDが重複していない', () => {
      const ids = TEAMS.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(TEAMS.length);
    });
  });

  describe('getTeamById', () => {
    it('存在する球団IDで球団を取得できる', () => {
      const team = getTeamById('g');
      expect(team).toBeDefined();
      expect(team?.id).toBe('g');
      expect(team?.name).toBe('ジャイアンツ');
    });

    it('存在しない球団IDではundefinedを返す', () => {
      const team = getTeamById('nonexistent');
      expect(team).toBeUndefined();
    });

    it('すべての球団IDで取得できる', () => {
      const teamIds = ['g', 't', 'db', 'c', 's', 'd', 'h', 'f', 'm', 'e', 'bs', 'l'];

      teamIds.forEach((id) => {
        const team = getTeamById(id);
        expect(team).toBeDefined();
        expect(team?.id).toBe(id);
      });
    });
  });

  describe('getTeamsByLeague', () => {
    it('セ・リーグの球団を取得できる', () => {
      const teams = getTeamsByLeague('central');
      expect(teams).toHaveLength(6);
      teams.forEach((team) => {
        expect(team.league).toBe('central');
      });
    });

    it('パ・リーグの球団を取得できる', () => {
      const teams = getTeamsByLeague('pacific');
      expect(teams).toHaveLength(6);
      teams.forEach((team) => {
        expect(team.league).toBe('pacific');
      });
    });

    it('セ・リーグに正しい球団が含まれる', () => {
      const teams = getTeamsByLeague('central');
      const teamIds = teams.map((t) => t.id);

      expect(teamIds).toContain('g'); // ジャイアンツ
      expect(teamIds).toContain('t'); // タイガース
      expect(teamIds).toContain('db'); // ベイスターズ
      expect(teamIds).toContain('c'); // カープ
      expect(teamIds).toContain('s'); // スワローズ
      expect(teamIds).toContain('d'); // ドラゴンズ
    });

    it('パ・リーグに正しい球団が含まれる', () => {
      const teams = getTeamsByLeague('pacific');
      const teamIds = teams.map((t) => t.id);

      expect(teamIds).toContain('h'); // ホークス
      expect(teamIds).toContain('f'); // ファイターズ
      expect(teamIds).toContain('m'); // マリーンズ
      expect(teamIds).toContain('e'); // イーグルス
      expect(teamIds).toContain('bs'); // バファローズ
      expect(teamIds).toContain('l'); // ライオンズ
    });
  });
});
