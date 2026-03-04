# TypeScript Best Practices

## 型安全性

- `any` 型の使用を避け、`unknown` を使って明示的なバリデーションを行う
- 型アサーション (`as`) は最小限に留め、型ガードを優先する
- `strict: true` を `tsconfig.json` で有効にする

## 関数・変数

- 関数の引数と戻り値には型を明示的に記述する
- `const` を優先し、再代入が必要な場合のみ `let` を使う
- オブジェクトのスプレッド演算子でイミュータブルに更新する

## モジュール

- named export を優先し、default export は避ける
- barrel exports (`index.ts`) はパフォーマンスに注意して使用する
- 循環依存を避けるためにモジュール構成を整理する

## エラーハンドリング

- `Error` を継承したカスタムエラークラスを使う
- `catch` ブロックでは `unknown` 型として扱い、型ガードで処理する
- Promise のエラーは必ず `.catch()` か `try/catch` で処理する
