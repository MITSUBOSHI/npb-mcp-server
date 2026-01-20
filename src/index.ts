#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';

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
                description:
                  '球団ID (例: g=ジャイアンツ, t=タイガース, db=ベイスターズ, c=カープ, s=スワローズ, d=ドラゴンズ, h=ホークス, f=ファイターズ, m=マリーンズ, e=イーグルス, bs=バファローズ, l=ライオンズ)',
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
              throw new McpError(ErrorCode.InvalidParams, 'team_id is required');
            }
            return await getTeamPlayersHandler(args as { team_id: string });

          case 'search_players':
            return await searchPlayers(args || {});

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
      }
    });
  }

  /**
   * stdioモードで起動
   */
  async runStdio() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('NPB MCP server running on stdio');
  }

  /**
   * HTTPモードで起動（Hono）
   */
  async runHTTP(port: number = 3000) {
    const app = new Hono();

    // ヘルスチェックエンドポイント
    app.get('/health', (c) => {
      return c.json({ status: 'ok', name: 'npb-mcp-server', version: '0.1.0' });
    });

    // MCPエンドポイント（JSON-RPC over HTTP）
    app.post('/mcp', async (c) => {
      try {
        const request = await c.req.json();

        // リクエストのメソッドに応じて処理を分岐
        if (request.method === 'tools/list') {
          const tools = {
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
                      description: '球団ID',
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
                    name: { type: 'string', description: '選手名（部分一致）' },
                    team_id: { type: 'string', description: '球団IDでフィルタリング' },
                    position: {
                      type: 'string',
                      enum: ['pitcher', 'catcher', 'infielder', 'outfielder'],
                      description: 'ポジションでフィルタリング',
                    },
                    number: { type: 'string', description: '背番号でフィルタリング' },
                  },
                },
              },
            ],
          };

          return c.json({
            jsonrpc: '2.0',
            id: request.id,
            result: tools,
          });
        } else if (request.method === 'tools/call') {
          const { name, arguments: args } = request.params;
          let result;

          switch (name) {
            case 'list_teams':
              result = await listTeams(args || {});
              break;
            case 'get_team_players':
              if (!args || !args.team_id) {
                throw new McpError(ErrorCode.InvalidParams, 'team_id is required');
              }
              result = await getTeamPlayersHandler(args as { team_id: string });
              break;
            case 'search_players':
              result = await searchPlayers(args || {});
              break;
            default:
              throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
          }

          return c.json({
            jsonrpc: '2.0',
            id: request.id,
            result,
          });
        } else {
          return c.json(
            {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: ErrorCode.MethodNotFound,
                message: `Unknown method: ${request.method}`,
              },
            },
            404
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = error instanceof McpError ? error.code : ErrorCode.InternalError;

        return c.json(
          {
            jsonrpc: '2.0',
            id: (await c.req.json()).id,
            error: {
              code: errorCode,
              message: errorMessage,
            },
          },
          500
        );
      }
    });

    // サーバー起動
    console.error(`NPB MCP server running on http://localhost:${port}`);
    serve({
      fetch: app.fetch,
      port,
    });
  }
}

// メイン処理
async function main() {
  const server = new NPBServer();
  const transport = process.env.MCP_TRANSPORT || 'stdio';

  if (transport === 'http') {
    const port = parseInt(process.env.PORT || '3000', 10);
    await server.runHTTP(port);
  } else {
    await server.runStdio();
  }
}

main().catch(console.error);
