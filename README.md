# NPB MCP Server

日本プロ野球（NPB）の選手情報を提供するModel Context Protocol (MCP) サーバーです。

## 機能

- NPB全12球団の情報取得
- 選手一覧の取得（球団別）
- 選手検索（名前、ポジション、背番号など）
- データキャッシング機能

## インストール

```bash
npm install
npm run build
```

## 使い方

### Claude Desktopで使用する場合

Claude Desktopの設定ファイル `claude_desktop_config.json` に以下を追加：

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

## ライセンス

MIT
