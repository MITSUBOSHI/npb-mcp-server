# 貢献ガイド

NPB MCP Serverへの貢献ありがとうございます！

## 開発フロー

1. **リポジトリをフォーク**
2. **ブランチを作成**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **変更を実装**
4. **テストを実行**
   ```bash
   npm test
   ```
5. **コミット**
   ```bash
   git commit -m "feat: add your feature"
   ```
6. **プルリクエストを作成**

## テスト

すべてのPRはテストが成功する必要があります。

```bash
# テスト実行
npm test

# ウォッチモードでテスト
npm run test:watch

# カバレッジ確認
npm run test:coverage
```

## コミットメッセージ

Conventional Commitsの規約に従ってください：

- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `test:` テスト追加・修正
- `refactor:` リファクタリング

## CI/CD

- すべてのPRは自動的にテストされます
- `main`ブランチへのマージ後、リリースタグを作成すると自動的にnpmに公開されます
