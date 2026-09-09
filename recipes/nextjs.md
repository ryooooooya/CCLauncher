---
id: nextjs
verified: 2026-09-09
applies:
  - nextjs-16
  - react
  - tailwindcss-4
topics:
  - framework
  - testing
  - deployment
  - quality
---

# Next.js

Next.js 16 App Router向け。採用版のNode.js要件と移行ガイドを確認し、既存構成への適用差分を作る。認可境界は [web security](../standards/web-security.md)、テストの責務は [testing](../standards/testing.md) を参照する。

## 構成と実装

- Server Componentsを基本にし、ブラウザ状態・イベントが必要な境界だけClient Componentsにする。server専用依存・秘密をclient importへ流さない。
- `cookies()`、`headers()`、動的な`params`等のrequest APIは採用版の非同期APIに合わせる。旧同期アクセス例を移植しない。
- Next.js 16のリクエスト前処理は`proxy.ts`の規約を確認する。リダイレクトを認可境界とせず、Server Actions / Route Handlers / data access点で認可する。
- 個人データのcache範囲と再検証条件を明示する。別ユーザーの応答を共有cacheから返さないことを実環境に近い条件で検証する。
- `src/app`はrouting、`src/features`は機能、`src/lib`はauth / db / validation等の境界に分ける。機能仕様はconsumerの`docs/specs/`に置く。

## Qualityと検証

- 初期構成はBiome・TypeScript・Vitest・Playwright。lint scriptは`biome check .`、ESLintを選ぶ場合は`eslint .`を直接実行する。Oxlint等を重ねる前に不足する検査を説明する。
- TypeScriptの`strict`を基本にする。外部入力は`unknown`から検証し、型の迂回・巨大関数は品質課題として扱う。機械的な行数制限をセキュリティ保証にしない。
- typecheckは`tsc --noEmit`。生成route型が必要なら採用版の`next typegen`を先に実行する。buildがlintも行うとは仮定しない。
- Vitestは純粋ロジック・validation、Playwrightは実際の認証cookie・navigation・非同期Server Componentsを含む主要経路で使う。mockだけでサーバー境界の完了を判定しない。
- consumerのverifyでlint / typecheck / tests / relevant security tests / `next build`を実行する。実行可能なテンプレートはIssue #6で追加する。

## UIを扱う場合だけ

Tailwind CSS 4ではCSSの`@theme`をtoken定義に使う。通常の変数は`:root`、別変数を参照するthemeは必要に応じて`@theme inline`へ分ける。旧版の設定ファイル例を混ぜず、既存design systemのsemantic tokenを優先する。Storybook等の追加は [UI tooling](ui-ux-tooling.md) を参照する。

## 公式参照

- [Next.js 16 migration](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [ESLint integration](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Async request APIs](https://nextjs.org/docs/messages/sync-dynamic-apis)
- [Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Tailwind theme variables](https://tailwindcss.com/docs/theme)
