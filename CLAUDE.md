# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # tsup でビルド → dist/cli.js
npm run dev            # tsx で直接実行（例: npm run dev -- add typescript）
npm run typecheck      # 型チェックのみ

npm run test           # Vitest ウォッチモード
npm run test:run       # Vitest 1回実行
npm run test:coverage  # カバレッジレポート生成（v8）

npm run check          # Biome lint + format チェック
npm run check:fix      # Biome 自動修正
npm run ci             # typecheck + check + test:run（CI 用）
```

単一テストファイルの実行: `npx vitest run src/__tests__/utils/rules.test.ts`

## アーキテクチャ

### エントリーポイント
`src/cli.ts` が commander でサブコマンド (`add` / `list` / `manage`) を登録し、各コマンド関数に委譲する。

### コマンド層 (`src/commands/`)
- **`add.ts`** — インタラクティブ / 直接指定 / GitHub ソースの3モードを持つ。`--source` があれば GitHub、なければ組み込みルール、どちらの引数もなければフル対話 UI を起動する。
- **`list.ts`** — ワークスペース・ユーザー両レベルのインストール済みルールと、`--bundled` で組み込みルール一覧を表示。
- **`manage.ts`** — @clack/prompts で対話 UI を構築し、コピー・移動・削除・paths 編集を行う。

### ソース層 (`src/sources/`)
- **`bundled.ts`** — `rules/*.md` をファイルシステムから読み込む。`dist/` からも `src/` からも動作するよう候補パスを2つ試す。
- **`github.ts`** — GitHub REST API (`/repos/{owner}/{repo}/contents/`) 経由で `rules/` と `.claude/rules/` の両方を探索しマージする。認証には `GITHUB_TOKEN` 環境変数を使用。

### ユーティリティ層 (`src/utils/`)
- **`paths.ts`** — `findWorkspaceRoot()` が `.claude/` ディレクトリを上位ディレクトリへ向かって探索し、ワークスペースルートを決定する。`getRulesDir()` と `getConfigPath()` はこれを使って実際のパスを返す。
- **`rules.ts`** — ルールファイルの read / write / copy / move / delete。
- **`config.ts`** — `.claude/ccr.json` でインストール履歴（ソース・日時）を管理する。
- **`frontmatter.ts`** — YAMLフロントマターのパース・生成。glob の `*` が YAML エイリアス記号と衝突するため、gray-matter のパースに失敗した場合は正規表現でフォールバックする。`buildContent()` は glob 特殊文字を含む `paths` 値を常にダブルクォートで包む。

### 国際化 (`src/i18n/`)
`process.env.LANGUAGE / LC_ALL / LANG` の順に参照し、`ja` で始まれば日本語、それ以外は英語。すべての UI 文字列は `t(key)` 経由で取得する。`en.ts` の `MessageKey` 型が正規のキー一覧として機能する。

### データフロー
```
rules/*.md
    ↓ parseFrontmatter()
Rule { name, filename, content, paths }
    ↓ writeRule() + buildContent()
.claude/rules/<name>.md  (paths あれば YAML フロントマター付き)
    + .claude/ccr.json   (インストール記録)
```

### インストール先
| location | ルールディレクトリ | 設定ファイル |
|---|---|---|
| `workspace` | `<workspace-root>/.claude/rules/` | `<workspace-root>/.claude/ccr.json` |
| `user` | `~/.claude/rules/` | `~/.claude/ccr.json` |

ワークスペースルートは `.claude/` ディレクトリの有無で判定する（`git` は使わない）。

## テスト構成

**ツール:** Vitest + Biome（lint/format）

### テストヘルパー (`src/__tests__/helpers/`)
- **`fs-mock.ts`** — `VirtualFs` クラス（インメモリ仮想 fs）と `setupFsMock()`。`rules.test.ts` / `config.test.ts` で使用。`bindTo(fsMock)` で `vi.mock('node:fs')` のモック実装を一括注入する。
- **`clack-mock.ts`** — `createClackMock()` ファクトリ。`@clack/prompts` の全関数をモックし `spinner()` は呼び出しごとに新オブジェクトを返す。

### テスト上の注意点
- **`bundled.ts`** は `import.meta.url` をモジュールトップレベルで評価するため fs をモックできない。実際の `rules/` ディレクトリを使うハイブリッドアプローチを採用し、各テストの `beforeEach` で `vi.resetModules()` + 動的 import を行う。
- **`i18n/index.ts`** はモジュールロード時に `locale` を確定するため、同じく `vi.resetModules()` + 動的 import パターンを使用する。`vi.stubEnv` は値を `''` に設定するため `??` 演算子をすり抜けない点に注意（`undefined` にしたい場合は `delete process.env.LANGUAGE` を使う）。
- **`process.exit` のモック** は `mockImplementation((code) => { throw new Error(\`process.exit(\${code})\`) })` とし、後続コードの実行を防ぐ。テストは `.rejects.toThrow('process.exit(1)')` で検証する。

## 組み込みルールの追加

`rules/` に `.md` ファイルを置くだけで自動的に組み込みルールとして認識される。ファイル先頭に YAML フロントマターで `paths:` を書くとデフォルトの paths フィルタになる。
