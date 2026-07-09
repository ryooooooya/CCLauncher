# base_testing

Claude Code + TypeScript プロジェクトにおけるテスト戦略。
何を・どのツールで・どこまでテストするかを定義し、AI コーディング特有の「テストを勝手に消す/弱める」問題への対処を含む。

対象は TypeScript フレームワーク（Next.js / Astro）。WordPress（PHP）は対象外で、必要なら別途 PHPUnit 等で扱う。
E2E は `base_a11y.md` が導入する Playwright を流用する（テストランナーを二重に増やさない）。

---

## 基本方針

テスト層はツール都合で割れる。これは設計の好みではなく、現行のフレームワークとランナーの制約による。

- 単体テスト（vitest）: ロジック層を対象にする。Server Action、API route handler、Zod スキーマ、ユーティリティ、フックの純粋部分、同期コンポーネント
- E2E テスト（Playwright）: async Server Component、認証・cookie・middleware が絡むフロー。vitest では描画できない領域
- 見た目・インタラクション: Storybook + アクセシビリティチェック（`base_a11y.md`）+ 人手の確認に寄せる

「結合テストですべてを担保する」「カバレッジ 100%」という方針は採らない。フロント中心のクライアント案件では、UI に対する網羅的な単体テストはテストのための無意味なテストを増やし、ルールの矛盾コストが見合わない。ロジック層を厚く、UI は Storybook と人手で、が現実的な線。

---

## 前提

- Node.js 20+
- pnpm がインストール済み
- `base_harness.md` のハーネス（Biome + Oxlint + Lefthook）が設定済み
- E2E が必要な場合は `base_a11y.md` の Playwright が設定済み

---

## 1. vitest のインストール

```bash
pnpm add -D vitest @vitest/coverage-v8
```

React コンポーネントを単体テストする場合は、フレームワーク側でテスティングライブラリを追加する（`framework_*.md` を参照）。素の vitest だけでロジック層のテストは始められる。

---

## 2. vitest 設定

`vitest.config.ts` をプロジェクトルートに作成する。

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // ロジック層に閾値を置く。UI・生成物・設定・バレルは除外する
      include: ["src/lib/**", "src/app/**/actions.ts", "src/app/api/**"],
      exclude: [
        "**/*.stories.{ts,tsx}",
        "**/*.config.{js,ts}",
        "**/index.ts",
        "**/*.d.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

`include` と `thresholds` はプロジェクトのロジック層の構成に合わせて調整する。網羅率の数値は目的ではなく、ロジックの重要箇所が検証されていることの目安として扱う。

---

## 3. package.json にスクリプトを追加

`base_harness.md` の基本スクリプトに加えて、以下を追加する。

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 4. テスト層の振り分け

| 対象 | ツール | 備考 |
|---|---|---|
| ユーティリティ・純粋関数 | vitest 単体 | 入出力が決まるものは必ず書く |
| Server Action / API route handler | vitest 単体 | 依存はモックし、純粋な async 関数として検証する |
| Zod スキーマ | vitest 単体 | 正常系と境界・異常系を含める |
| 同期 Server / Client Component | vitest + RTL（任意） | 過剰に網羅しない。ロジックを含むものに限る |
| async Server Component | Playwright E2E | vitest では描画できない |
| 認証・cookie・middleware フロー | Playwright E2E | ブラウザ文脈が必要 |
| アクセシビリティ | `base_a11y.md` | jest-axe / Playwright |
| 見た目・インタラクション | Storybook + 人手 | 自動テストに過度に寄せない |

---

## 5. AI コーディング特有のルール

LLM はランダムに「重要なテストを勝手に消す」「アサーションを弱める」「実装に合わせてテストを書き換えて緑にする」をやる。これは確率的な振る舞いなので、プロンプトの強調だけでは防ぎきれない。次の3点をルールとして固定する。

### 重要なテストの固定

消してはいけない・弱めてはいけないテストには、明示のマーカーコメントを付ける。

```ts
// CRITICAL TEST: このテストの削除・スキップ・アサーション緩和を禁止する。
// 仕様変更でこのテストが落ちる場合は、まずユーザーに確認すること。
it("未認証ユーザーは課金エンドポイントにアクセスできない", () => {
  // ...
});
```

CLAUDE.md 側に「`CRITICAL TEST` マーカーの付いたテストは、ユーザーの明示的な指示なしに削除・スキップ・緩和してはならない」というルールを置く。マーカーは認証・課金・権限・データ整合性など、壊れると影響が大きい箇所に限定する（多用すると効果が薄れる）。

### テスト変更と実装変更のフェーズ分離

リファクタや修正の際、テストと実装を同時に変更させない。同時に変えると「実装に合わせてテストを書き換えただけ」になり、検証の意味が失われる。

CLAUDE.md またはタスク指示に次を含める。

```
- ソースコードを変更するときは、同じフェーズでテストを変更しない
- テストを変更するときは、同じフェーズでソースコードを変更しない
- 仕様変更で両方の変更が必要な場合は、フェーズを分けて、各フェーズの境界でテストの状態（緑/赤）を報告する
```

### テストのコメント規律

テストは、プロジェクト外のエンジニアが読んでも挙動が分かる状態にする。

- 前提条件・事前条件・検証項目をコメントで明記する
- テストデータの文字列リテラルは、意味がすぐ分かるものを使う（`"foo"` ではなく `"未払いの注文"` など）
- 何を検証しているかをテスト名（`it` の説明）で日本語で明確にする

なお、テスト以外の一般的な TSDoc・コメント規律はコード品質の関心事であり、このファイルではなく `base_harness.md` のコード品質ルール（セクション 7-2）で扱う。

---

## 5-2. CI でテストを強制する

カバレッジ閾値は `pnpm test:coverage` を実行したときにしか働かない。実行を強制する層として、
PR ごとにテストを回す GitHub Actions を1本入れる。これにより「新規ロジックにテストがない」状態が
閾値割れとして機械的に検知される。

`.github/workflows/test.yml`:

```yaml
name: Test
on: [pull_request]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4        # 適用時にフルレングス SHA へピン留めする
      - uses: pnpm/action-setup@v4       # 同上（base_security_npm_setup.md のルール）
      - uses: actions/setup-node@v4      # 同上
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:coverage
```

- Actions は `base_security_npm_setup.md` のルールに従い、適用時にフルレングスのコミット SHA でピン留めする（上記 `@v4` はプレースホルダ）
- lefthook（pre-commit / pre-push）にはテストを入れない。コミット・プッシュの速度を保ち、強制は CI に一本化する
- `vitest.config.ts` は protect-config.sh の保護対象（閾値の改ざん防止）。CI が赤のとき閾値を下げて緑にする提案はしない

---

## 6. CLAUDE.md に追記するセクション

以下を CLAUDE.md の適切な箇所に追記する。既存のコマンド・ルール・完了の定義のセクションがあれば統合する。

```markdown
## コマンド（テスト）

\`\`\`bash
pnpm test           # テスト実行（vitest run）
pnpm test:watch     # ウォッチモード
pnpm test:coverage  # カバレッジ計測
\`\`\`

## テストのルール

- ロジック層（ユーティリティ、Server Action、API route handler、Zod スキーマ）は単体テストを書く
- async Server Component と認証・cookie・middleware が絡むフローは E2E（Playwright）で検証する
- 見た目・インタラクションは Storybook と人手の確認に寄せ、UI の網羅的な単体テストは書かない
- `CRITICAL TEST` マーカーの付いたテストは、ユーザーの明示的な指示なしに削除・スキップ・アサーション緩和をしてはならない。仕様変更で落ちる場合はまず確認する
- ソースコードの変更とテストの変更は同じフェーズで同時に行わない。両方必要ならフェーズを分け、各境界でテストの緑/赤を報告する
- テストには前提条件・事前条件・検証項目をコメントで書く。テストデータは意味の分かる文字列を使う
- 新しいページ・ルートを追加したら、Playwright の対象ページリスト（PAGES 配列等）への追加を同じタスク内で行う

## 完了の定義（テスト）

- `pnpm test` がすべて通ること
- ロジック層のカバレッジ閾値を下回らないこと
```

---

## 動作確認

- [ ] `pnpm test` が実行でき、テストが認識される
- [ ] `pnpm test:coverage` でロジック層のカバレッジが計測される
- [ ] `CRITICAL TEST` マーカーのルールが CLAUDE.md に入っている
- [ ] テスト/実装のフェーズ分離ルールが CLAUDE.md に入っている
- [ ] E2E が必要なプロジェクトで Playwright（`base_a11y.md`）が併用されている
- [ ] PR でテスト CI（test.yml）が実行され、カバレッジ閾値がチェックされる

---

## 運用ルール

- エージェントがテストで新しい種類のミス（重要テストの削除、アサーション緩和、実装に合わせた書き換え）をしたら、`CRITICAL TEST` マーカーの対象を広げるか、フェーズ分離の指示を強める
- `vitest.config.ts` は `base_harness.md` の `protect-config.sh` の保護対象に追加することを検討する（エージェントが閾値を勝手に下げて緑にするのを防ぐ）
- カバレッジ閾値は「下回ったら赤」の最低ラインとして扱い、数値を上げること自体を目的にしない

---

## 参考

- Next.js 公式 Vitest ガイド: https://nextjs.org/docs/app/guides/testing/vitest
- Next.js 公式 Testing 概要: https://nextjs.org/docs/app/guides/testing

---

最終検証日: 2026-07-08
