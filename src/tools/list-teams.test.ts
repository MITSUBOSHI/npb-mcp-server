import { describe, it, expect } from 'vitest';
import { listTeams } from './list-teams.js';

describe('listTeams', () => {
  it('リーグ指定なしで全12球団を返す', async () => {
    const result = await listTeams({});

    expect(result).toHaveProperty('content');
    expect(result.content).toHaveLength(1);
    expect(result.content[0]).toHaveProperty('type', 'text');

    const teams = JSON.parse(result.content[0].text);
    expect(teams).toHaveLength(12);
  });

  it('セ・リーグを指定すると6球団を返す', async () => {
    const result = await listTeams({ league: 'central' });

    const teams = JSON.parse(result.content[0].text);
    expect(teams).toHaveLength(6);

    teams.forEach((team: any) => {
      expect(team.league).toBe('central');
    });
  });

  it('パ・リーグを指定すると6球団を返す', async () => {
    const result = await listTeams({ league: 'pacific' });

    const teams = JSON.parse(result.content[0].text);
    expect(teams).toHaveLength(6);

    teams.forEach((team: any) => {
      expect(team.league).toBe('pacific');
    });
  });

  it('各球団に必要なフィールドが含まれる', async () => {
    const result = await listTeams({});

    const teams = JSON.parse(result.content[0].text);

    teams.forEach((team: any) => {
      expect(team).toHaveProperty('id');
      expect(team).toHaveProperty('name');
      expect(team).toHaveProperty('fullName');
      expect(team).toHaveProperty('league');
      expect(team).toHaveProperty('rosterUrl');
    });
  });

  it('不正なリーグ指定は無視される', async () => {
    const result = await listTeams({ league: 'invalid' });

    const teams = JSON.parse(result.content[0].text);
    // 不正なリーグ指定は無視されて全球団が返される
    expect(teams).toHaveLength(12);
  });
});
