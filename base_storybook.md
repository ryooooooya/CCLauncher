# base_storybook

Storybook + AI 連携（MCP server + Manifest）のセットアップと運用ルール。
フレームワーク非依存。フレームワーク固有の手順は `framework_*.md` を参照。

Storybook 10 の AI 機能を前提としている。

---

## 前提

- Node.js 20+
- pnpm がインストール済み
- Claude Code がインストール済み
- TypeScript プロジェクトが存在する
- Storybook がサポートするフレームワーク（Next.js / Vite 等）を使用している

---

## 1. Storybook のインストール

```bash
pnpm dlx storybook@latest init
```

対話プロンプトでフレームワークが自動検出される。必要に応じて手動で選択する。

---

## 2. addon-mcp のインストール

```bash
pnpm dlx storybook add @storybook/addon-mcp
```

これにより以下が有効になる:

- `http://localhost:6006/mcp` で MCP server が起動する
- Manifest（components / docs）が自動生成される
- AI エージェントがコンポーネントの情報を参照・テスト実行できるようになる

---

## 3. react-docgen-typescript の設定

Manifest の Props 情報精度を上げるため、`.storybook/main.ts` で `react-docgen-typescript` を指定する。

```ts
const config: StorybookConfig = {
  // ...
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};
```

`react-docgen-typescript` は `react-docgen` より遅いが、Props の型情報がより正確になる。
Manifest 生成が遅い場合は `react-docgen` に切り替えてもよい。

---

## 4. Claude Code の MCP 接続

Storybook の dev server を起動した状態で、Claude Code に MCP server を登録する。

```bash
npx mcp-add --type http --url "http://localhost:6006/mcp" --scope project
```

名前は `{project-name}-sb-mcp` のように、プロジェクトを特定できる命名にする。

手動で `.mcp.json` に追加する場合:

```json
{
  "mcpServers": {
    "{project-name}-sb-mcp": {
      "type": "http",
      "url": "http://localhost:6006/mcp"
    }
  }
}
```

ポート番号はプロジェクトの Storybook 設定に合わせる。

---

## 5. CLAUDE.md への追記

MCP server の名前（前ステップで決めたもの）を使い、以下を CLAUDE.md に追記する。
`{project-name}-sb-mcp` はプロジェクトごとに置き換える。

```markdown
## Storybook

UI コンポーネントの実装・修正時は `{project-name}-sb-mcp` MCP ツールを使って
Storybook のコンポーネント・ドキュメント情報を確認してから作業すること。

- コンポーネントのプロパティを使う前に必ず `get-documentation` で確認する。推測で Props を使わない
- `list-all-documentation` で利用可能なコンポーネント一覧を取得できる
- Story の書き方は `get-storybook-story-instructions` で最新のルールを取得する
- 作業後は `run-story-tests` でテストを実行し、失敗があれば修正してから完了とする
```

---

## 6. Story 作成ルール

Story の書き方（基本方針・JSDoc・Manifest 管理・プロトタイプの story 化）は Blueprint 側が持つ。
`docs/product/stories/_rules.md`（正本: CCLauncher の `blueprint_stories_rules.md`）を参照すること。
このファイルの責務は Storybook 環境のセットアップまでで、story の内容規約には踏み込まない。

理由: プロトタイプを `src/prototypes/{slug}/` に story として置く運用と密結合しており、
slug・adopted・受け入れ条件といったプロダクト固有の概念に依存するため。

---

## 7. MDX ドキュメントのベストプラクティス

デザイントークン・ガイドラインなどの MDX ドキュメントを書く場合:

- `<Meta>` に `summary` を付けて、エージェントが概要を把握できるようにする
- トークン値やカラーコードなど具体的な情報は MDX ファイル内に直接記述する。外部ソースの動的参照は Manifest に含まれない
- エージェント不要のドキュメントは `tags={['!manifest']}` で除外する

```mdx
import { Meta } from '@storybook/addon-docs/blocks';

<Meta title="Design Tokens/Colors" summary="カラートークンの一覧と使い分け" />
```

---

## 8. package.json スクリプト

既存の `scripts` に以下を追加する:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

---

## 動作確認

- [ ] `pnpm storybook` で Storybook が起動する
- [ ] `http://localhost:6006/mcp` にアクセスすると MCP server のページが表示される
- [ ] `http://localhost:6006/manifests/components.html` で Manifest デバッガーが表示される
- [ ] Claude Code から `list-all-documentation` ツールを呼び出してコンポーネント一覧が返る
- [ ] `docs/product/stories/_rules.md` が配置されている（Story 作成ルールの参照先）

---

## Storybook Composition（複数 Storybook の統合）

デザインシステムと アプリケーションで Storybook を分けている場合、Composition を設定すると
MCP server が compose 先の Manifest も自動で取り込む。
エージェントは複数の Storybook にまたがるコンポーネントをまとめて参照できる。

設定方法は Storybook 公式ドキュメントの Composition を参照。

---

## 運用ルール

- Storybook の MCP server は開発中常時起動しておく。エージェントがコンポーネント情報にアクセスできる状態を維持する
- 新しいコンポーネントを作ったら必ず Story を書く。Story がないコンポーネントは Manifest に載らず、エージェントから見えない
- JSDoc の summary は「このコンポーネントをいつ使うか」がわかる内容にする。実装詳細ではなく用途を書く
- Manifest デバッガー（`/manifests/components.html`）でエラーや警告が出ていないか定期的に確認する
