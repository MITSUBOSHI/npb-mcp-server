# NPB MCP Server

[![Test](https://github.com/MITSUBOSHI/npb-mcp-server/actions/workflows/test.yml/badge.svg)](https://github.com/MITSUBOSHI/npb-mcp-server/actions/workflows/test.yml)
[![npm version](https://badge.fury.io/js/@mitsuboshi%2Fnpb-mcp-server.svg)](https://badge.fury.io/js/@mitsuboshi%2Fnpb-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

### コード品質

このプロジェクトはESLintとPrettierでコード品質を管理しています。

**推奨コマンド:**

```bash
# すべての自動修正を一括実行（Prettier → ESLint）
npm run fix

# すべてのチェックを並列実行（Lint + Format + Test）
npm run check
```

**個別コマンド:**

```bash
# ESLintでコードチェック
npm run lint

# ESLintで自動修正
npm run lint:fix

# Prettierでフォーマットチェック
npm run format:check

# Prettierで自動フォーマット
npm run format
```

**設定ファイル:**
- `.prettierrc` - Prettier設定
- `eslint.config.js` - ESLint 9.x フラット設定

**コミット前の推奨フロー:**
```bash
npm run fix    # コードを自動修正
npm run check  # すべてのチェックを実行
```

### ビルド

```bash
# TypeScriptをビルド
npm run build

# ウォッチモードでビルド
npm run dev
```

## CI/CD

このプロジェクトはGitHub Actionsを使用して自動テストとデプロイを行っています。

### 自動テスト

**トリガー:**
- `main`、`develop`ブランチへのpush
- すべてのPull Request

**テスト内容:**
- Node.js 18.x, 20.x, 22.x でのテスト実行
- ビルドの確認
- テストカバレッジの生成

### 自動公開

**トリガー:**
- GitHubでリリースを作成

**リリース手順:**

通常のコミットではバージョン変更は不要です。リリース時のみ以下を実行：

```bash
# パッチバージョン更新（バグ修正: 0.1.0 → 0.1.1）
npm run release:patch

# マイナーバージョン更新（新機能: 0.1.0 → 0.2.0）
npm run release:minor

# メジャーバージョン更新（破壊的変更: 0.1.0 → 1.0.0）
npm run release:major
```

その後、GitHubでリリースを作成すると自動公開されます。

**必要な設定:**
- GitHub Secretsに`NPM_TOKEN`を設定（Automationトークン推奨）

## ライセンス

MIT
