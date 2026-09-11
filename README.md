# CCLauncher

CCLauncher is a model-agnostic development harness for building secure web applications with AI coding agents.

AIコーディングエージェントでセキュアなWebアプリを作るための、モデル非依存の開発ハーネスです。
プロジェクト固有の判断、必要なときだけ読む知識、コマンドで実行する検証をつなぎます。

## Install

Node.js 24 / pnpm 11.19.0を使用します。`@ryooooooya/cclauncher@0.1.0` は開発中・npm未公開です。
現在はレビュー済みcheckoutからtarballを作り、ローカルで利用できます。

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm verify
npm pack
```

既存アプリでは、作成したtarballを開発依存に追加します。

```sh
pnpm add -D --save-exact /absolute/path/to/ryooooooya-cclauncher-0.1.0.tgz
pnpm exec cclauncher --version
```

package.jsonとlockfileをcommitし、tarballもチーム・CIから同じ内容を参照できる場所に固定します。
ローカル絶対パスへの依存は、そのままでは他の環境に持ち運べません。
更新時も版とlockfileを明示的に変更します。詳細は [配布と公開](docs/distribution.md)。

## Initialize project docs

```sh
pnpm exec cclauncher init --yes --auth supabase --database supabase --pii true
```

AGENTS.md、project docs、検証設定・テスト・CIの雛形を配置します。既存ファイルは上書きしません。
既存package.jsonは保持するため、生成された検証に必要なscriptsと依存をアプリ側へ統合してください。
新しい空ディレクトリにはpackage.jsonとlockfileも配置します。通常のinitだけでは動作するアプリは完成しません。

| ファイル | 役割 |
|---|---|
| AGENTS.md | 直接保守する共通索引。AIで抽出・再生成しない |
| docs/PRODUCT.md | 目的・対象ユーザー・受け入れ条件 |
| docs/ARCHITECTURE.md | 構成と設計判断 |
| docs/SECURITY.md | 認証・所有権・アクセス行列・サービス固有の境界 |
| .cclauncher.json | stackとfeature設定。モデル割当を保存しない |

実行可能なNext.js＋Supabase例は `--example nextjs-supabase` で空ディレクトリに作成できます。
[Webapp guide](docs/webapp-template.md) に、ローカルDBとテストアカウントを含む導入手順があります。

## Load relevant context

```sh
pnpm exec cclauncher context auth
pnpm exec cclauncher context database
pnpm exec cclauncher context workflow
pnpm exec cclauncher recipe supabase
pnpm exec cclauncher doctor
```

standards / recipesはpackage内に保持し、consumerへ大量コピーしません。
同じpackage・設定・topicから同じcontextをオフラインで取得します。
project固有の判断を優先し、security regressionは報告します。
doctorは設定や必要ファイルを診断するもので、テスト実行や安全性の認証は行いません。
全オプションは [CLI guide](docs/cli.md)。

## Verify

```sh
pnpm verify
```

アプリへ接続したlint・型チェック・テスト・build・security・E2Eを実行します。
Supabase構成ではDBテストも必要です。未実装のチェックや利用できないサービスは失敗として扱います。
認可のdenyケースと所有者の正常操作を検証し、high-risk変更では独立reviewも必要です。
例のCIはHTTP認証・認可、Chromium、Postgres grants / RLSを実際に検証します。

## Optional integration

- `init --adapter claude`: `@AGENTS.md` のみのCLAUDE.mdを追加。Codex / genericはAGENTS.mdを直接読む。[Adapters](docs/agent-adapters.md)
- `init --method blueprint-printer`: product stories・design assets・prototype履歴を扱う手法を任意導入。[Blueprint / Printer](methods/blueprint-printer/README.md)

どちらもモデル選択・agent起動・権限設定を行いません。

## Architecture

| 場所 | 責務 |
|---|---|
| standards / recipes | 共通原則と技術別知識 |
| templates | project docs・テスト・CI |
| adapters | agent固有の薄い入口 |
| methods | 任意採用する開発手法 |
| src/cli / manifest.json | 決定論的な初期化・取得・診断と配布物の一覧 |

構成の詳細は [architecture](docs/architecture.md)、既存利用者向けの移行記録は [migration](docs/migration.md)。
CCLauncherは[MIT License](LICENSE)で提供します。生成先にはCCLauncher由来のファイルの表記として `LICENSE.cclauncher` を同梱し、アプリ自身のライセンスは変更しません。[出典確認の記録](docs/licensing/README.md)も参照してください。npm公開は引き続き保留しています。
