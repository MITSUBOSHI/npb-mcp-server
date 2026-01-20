# NPB MCP Server

日本プロ野球（NPB）の選手情報を提供するModel Context Protocol (MCP) サーバーです。

## 機能

- NPB全12球団の情報取得
- 選手一覧の取得（球団別）
- 選手検索（名前、ポジション、背番号など）
- データキャッシング機能
- 2つのトランスポートモード対応（stdio / HTTP）

## インストール

### ローカル開発の場合

```bash
npm install
npm run build
```

### npxで直接使用する場合

パッケージを公開後は、インストール不要でnpxから直接実行できます：

```bash
# stdioモード
npx npb-mcp-server

# HTTPモード
MCP_TRANSPORT=http npx npb-mcp-server
```

ローカルでnpxテストする場合：

```bash
npm link
npx npb-mcp-server
```

## 使い方

このサーバーは2つのトランスポートモードで動作します：

### モード1: stdio（デフォルト）

Claude Desktopなどのstdioベースのクライアントで使用する場合。

Claude Desktopの設定ファイル `claude_desktop_config.json` に以下を追加：

**ローカルパスを指定する場合:**
```json
{
  "mcpServers": {
    "npb": {
      "command": "node",
      "args": ["/path/to/npb-mcp-server/dist/index.js"]
    }
  }
}
```

**npxを使用する場合（パッケージ公開後）:**
```json
{
  "mcpServers": {
    "npb": {
      "command": "npx",
      "args": ["npb-mcp-server"]
    }
  }
}
```

### モード2: HTTP（Streaming）

Honoを使用したHTTP Streaming Transportモード。より高速な通信が可能です。

**起動方法:**

```bash
# HTTPモードで起動（デフォルトポート: 3000）
MCP_TRANSPORT=http node dist/index.js

# npxを使用
MCP_TRANSPORT=http npx npb-mcp-server

# カスタムポートで起動
MCP_TRANSPORT=http PORT=8080 node dist/index.js
```

**Claude Desktopで使用する場合:**

**ローカルパスを指定:**
```json
{
  "mcpServers": {
    "npb": {
      "command": "node",
      "args": ["/path/to/npb-mcp-server/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "http",
        "PORT": "3000"
      }
    }
  }
}
```

**npxを使用（パッケージ公開後）:**
```json
{
  "mcpServers": {
    "npb": {
      "command": "npx",
      "args": ["npb-mcp-server"],
      "env": {
        "MCP_TRANSPORT": "http",
        "PORT": "3000"
      }
    }
  }
}
```

**エンドポイント:**
- `GET /health` - ヘルスチェック
- `POST /mcp` - MCPメッセージング（SSE）

### 利用可能なツール

#### 1. list_teams
NPB全12球団の一覧を取得します。

**パラメータ:**
- `league` (optional): フィルタリングするリーグ（`central` または `pacific`）

**例:**
```json
{
  "league": "central"
}
```

#### 2. get_team_players
指定された球団の選手一覧を取得します。

**パラメータ:**
- `team_id` (required): 球団ID

**球団ID一覧:**
- セ・リーグ: `g`(ジャイアンツ), `t`(タイガース), `db`(ベイスターズ), `c`(カープ), `s`(スワローズ), `d`(ドラゴンズ)
- パ・リーグ: `h`(ホークス), `f`(ファイターズ), `m`(マリーンズ), `e`(イーグルス), `bs`(バファローズ), `l`(ライオンズ)

**例:**
```json
{
  "team_id": "g"
}
```

#### 3. search_players
選手を検索します。

**パラメータ:**
- `name` (optional): 選手名（部分一致）
- `team_id` (optional): 球団ID
- `position` (optional): ポジション（`pitcher`, `catcher`, `infielder`, `outfielder`）
- `number` (optional): 背番号

**例:**
```json
{
  "name": "大谷",
  "position": "pitcher"
}
```

## データソース

このサーバーは [NPB公式サイト](https://npb.jp/) からWeb Scrapingでデータを取得しています。

## 開発

### テスト

```bash
# テスト実行
npm test

# ウォッチモードでテスト
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage
```

**テスト内容:**
- キャッシュ機能のテスト（9テスト）
- 球団データの検証（12テスト）
- MCPツール関数のテスト（5テスト）

合計26個のテストケースが含まれています。

### ビルド

```bash
# TypeScriptをビルド
npm run build

# ウォッチモードでビルド
npm run dev
```

## ライセンス

MIT
