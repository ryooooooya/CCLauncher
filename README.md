# CCLauncher

CCLauncher is a model-agnostic development harness for building secure web applications with AI coding agents.

AIコーディングエージェントでセキュアなWebアプリを作るための、モデル非依存の開発ハーネスへ移行中です。

## Versioned package + CLI

`@ryooooooya/cclauncher@0.1.0` は開発中・npm未公開です。tarball配布、`init / recipe / context / doctor`、package内のstandards / recipesを実装しました。使い方は [CLI guide](docs/cli.md) を参照してください。initはproject docsと検証基盤を作ります。#6の [Webapp guide](docs/webapp-template.md) では、実行可能なNext.js＋Supabaseの実例とsecurity testsを利用できます。

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm verify
npm pack
```

導入・更新・公開・protected-main運用は [配布方針](docs/distribution.md) を参照してください。新方式ではexact versionとlockfileで配布物を固定します。mainのraw URL取得による新規bootstrapは廃止方針です。

## 新しいディレクトリ構成

| ディレクトリ | 責務 |
|---|---|
| `standards/` | フレームワーク非依存の原則 |
| `recipes/` | 技術別・タスク別に読む知識 |
| `templates/` | consumerへ生成する最小ファイル |
| `adapters/` | エージェント・ツール固有の設定 |
| `methods/` | 任意採用の開発手法。Blueprint / Printerを任意採用 |
| `src/cli/` | 決定論的な初期化・知識取得・診断 |

境界と共存方針は [architecture](docs/architecture.md)、旧文書ごとの移行先は [migration map](docs/migration.md) を参照してください。#2では置き場と責務を定義し、本文の整理・移行は#3〜#8で行います。#3の [security / dependencies / testing / privacy標準](standards/README.md) と#4の [技術別recipes](recipes/README.md) は参照可能です。package収録とCLI取得は#5、consumer向け実行可能な検証は#6です。ディレクトリのREADMEは管理者向け索引で、consumerへ配布しません。

## Shared instructions and adapters

AGENTS.mdを直接保守する共通の正本とします。`init --adapter claude` は
`@AGENTS.md` のみのCLAUDE.mdを配置します。Codex / genericはAGENTS.mdを直接読みます。
`cclauncher context workflow` でrole・risk・verification・独立reviewの標準を取得できます。
使い方と既存projectの移行は [adapter guide](docs/agent-adapters.md) を参照してください。

## Migration status

#1〜#8のpackage・standards・recipes・CLI・Webapp template・adaptersを実装しました。
Blueprint / Printerは `init --method blueprint-printer` で任意採用できます。[method guide](methods/blueprint-printer/README.md) を参照してください。残るlegacy文書の撤去とREADMEの最終整理は #9です。
旧ルート文書は移行資料です。新規bootstrapには上記CLIを使ってください。
AGENTS.mdのAI抽出生成方式と旧bootstrap promptは廃止しました。
