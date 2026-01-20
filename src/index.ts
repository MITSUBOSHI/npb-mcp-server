#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { listTeams } from './tools/list-teams.js';
import { getTeamPlayersHandler } from './tools/get-team-players.js';
import { searchPlayers } from './tools/search-players.js';

/**
 * NPB MCP Server
 * 日本プロ野球（NPB）の選手情報を提供するMCPサーバー
 */
class NPBServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'npb-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    // エラーハンドリング
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // ツール一覧を返すハンドラー
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_teams',
          description: 'NPB全12球団の一覧を取得します。リーグでフィルタリング可能です。',
          inputSchema: {
            type: 'object',
            properties: {
              league: {
                type: 'string',
                enum: ['central', 'pacific'],
                description: 'フィルタリングするリーグ（省略可）',
              },
            },
          },
        },
        {
          name: 'get_team_players',
          description: '指定された球団の選手一覧を取得します。',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: {
                type: 'string',
                description: '球団ID (例: g=ジャイアンツ, t=タイガース, db=ベイスターズ, c=カープ, s=スワローズ, d=ドラゴンズ, h=ホークス, f=ファイターズ, m=マリーンズ, e=イーグルス, bs=バファローズ, l=ライオンズ)',
              },
            },
            required: ['team_id'],
          },
        },
        {
          name: 'search_players',
          description: '選手名、ポジション、背番号などで選手を検索します。',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: '選手名（部分一致）',
              },
              team_id: {
                type: 'string',
                description: '球団IDでフィルタリング',
              },
              position: {
                type: 'string',
                enum: ['pitcher', 'catcher', 'infielder', 'outfielder'],
                description: 'ポジションでフィルタリング',
              },
              number: {
                type: 'string',
                description: '背番号でフィルタリング',
              },
            },
          },
        },
      ],
    }));

    // ツール実行ハンドラー
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_teams':
            return await listTeams(args || {});

          case 'get_team_players':
            if (!args || !args.team_id) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'team_id is required'
              );
            }
            return await getTeamPlayersHandler(args as { team_id: string });

          case 'search_players':
            return await searchPlayers(args || {});

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${errorMessage}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('NPB MCP server running on stdio');
  }
}

// サーバー起動
const server = new NPBServer();
server.run().catch(console.error);
