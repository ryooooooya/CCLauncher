# CCLauncher

CCLauncher is a model-agnostic development harness for building secure web applications with AI coding agents.

AIコーディングエージェントでセキュアなWebアプリを作るための、モデル非依存の開発ハーネスへ移行中です。

## Versioned package + CLI

`@ryooooooya/cclauncher@0.1.0` は開発中・npm未公開です。tarball配布、`init / recipe / context / doctor`、package内のstandards / recipesを実装しました。使い方は [CLI guide](docs/cli.md) を参照してください。initはproject docsと検証の土台を作り、実アプリ・provider別security testsのテンプレートは#6で追加します。

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
| `methods/` | 任意採用の開発手法。Blueprint / Printerはここへ移行 |
| `src/cli/` | 決定論的な初期化・知識取得・診断 |

境界と共存方針は [architecture](docs/architecture.md)、旧文書ごとの移行先は [migration map](docs/migration.md) を参照してください。#2では置き場と責務を定義し、本文の整理・移行は#3〜#8で行います。#3の [security / dependencies / testing / privacy標準](standards/README.md) と#4の [技術別recipes](recipes/README.md) は参照可能です。package収録とCLI取得は#5、consumer向け実行可能な検証は#6です。ディレクトリのREADMEは管理者向け索引で、consumerへ配布しません。

## Legacy documentation — migration reference only

以下は既存プロジェクトの移行用資料です。旧方式の配置・生成・更新ルールを新packageの開発に適用しないでください。旧文書本体は段階的な移行が終わるまで残します。

## ファイル構成

### base_*（フレームワーク非依存）

| ファイル | 内容 |
|---|---|
| `base_harness.md` | Biome + Oxlint + Lefthook + フック設定 |
| `base_preflight.md` | 実装前の前提確認（スコープ・LLM・コスト・法務・個人情報） |
| `base_security_env.md` | セキュリティ環境の禁止事項（常時適用ルール） |
| `base_security_env_setup.md` | サンドボックス, settings.json, セキュリティフック, Codex CLI 経路の防御, gitleaks/Semgrep CI のセットアップ手順（初期化時に一度だけ実行） |
| `base_security_env_guide.md` | セキュリティ設定の背景・理由（人間向け解説） |
| `base_security_code.md` | TypeScript / Node.js セキュアコーディングルール（Claude Code への指示） |
| `base_security_code_guide.md` | セキュアコーディングルールの背景・理由（人間向け解説） |
| `base_security_npm.md` | npm サプライチェーンセキュリティの常時ルール: 依存関係の追加・更新・lockfile・overrides |
| `base_security_npm_setup.md` | CI/GitHub 側の自動防御層（Dependabot, Dependency Review, CI audit）のセットアップ手順（初期化時に一度だけ実行） |
| `base_security_npm_incident.md` | npm インシデント情報を受けたときの影響確認・対処手順（オンデマンド参照） |
| `base_security_supabase.md` | Supabase セキュリティルール（RLS・キー管理・セッション検証・Storage）。Supabase 採用時のみ |
| `base_dev_pipeline.md` | 開発パイプライン（spec 作成→設計レビュー→凍結→実装→品質レビュー→仕様突合）。spec テンプレート・常時ルールに追記するゲートとレビュー観点を含む |
| `base_codex_review.md` | Codex CLI・@codex review の機構（認証・コマンド・レビュー判断基準） |
| `base_agents_md.md` | `AGENTS.md`（実装エージェント＝Codex への指示）の生成仕様・テンプレート・`/agents-md` の設置。CLAUDE.md + `.claude/rules/` からの一方向生成 |
| `base_a11y.md` | アクセシビリティセットアップ（Playwright + jest-axe） |
| `base_testing.md` | テスト戦略（vitest 単体 + Playwright E2E の層設計） |
| `base_ux_checklist_critical.md` | UX チェックリスト（CRITICAL: 常時適用） |
| `base_ux_checklist_high.md` | UX チェックリスト（HIGH: 節目の監査で判定） |
| `base_ux_checklist_medium.md` | UX チェックリスト（MEDIUM/LOW: 該当機能があるとき監査で併せて判定） |
| `base_ux_audit.md` | UX ヒューリスティック監査の運用と `/ux-audit` コマンドの設置（HIGH/MEDIUM の再実行手段） |
| `base_print.md` | 印刷コマンド `/print` の設置。story ＋ Printer 資産を入力に `src/prototypes/{slug}/` へ複数パターンを生成する（withAI 開発手法採用時） |
| `base_ui_motion.md` | UIの触感・質感（アニメーション・インタラクションフィードバック・ジェスチャー応答） |
| `base_storybook.md` | Storybook + AI 連携（MCP server + Manifest）のセットアップ。Story 作成ルールは Blueprint 側 |
| `base_chrome_devtools.md` | chrome-devtools-mcp の設定と使用方針（実行時デバッグ・パフォーマンス計測。UI 選択時に配布） |
| `base_claude_md_knowledge.md` | CLAUDE.md の設計・運用に関する知識まとめ |
| `base_skill_md_prompt.md` | SKILL.md 生成プロンプト |
| `base_seo.md` | SEO・メタデータ（Metadata API / sitemap / OGP / 構造化データ / noindex） |
| `base_performance.md` | パフォーマンス予算と Lighthouse CI による回帰検知 |
| `base_sentry_setup.md` | Sentry エラー監視のセットアップ手順（初期化時に一度だけ実行） |
| `base_privacy_guide.md` | 個人情報・プライバシー対応の実装チェックリスト（人間向け解説） |
| `base_automation_roadmap.md` | 運用自動化の仕分けロードマップ（今やる/条件付き/やらない・人間向け） |
| `base_ops_incident.md` | 本番障害発生時の対応手順・平時準備（人間向け、オンデマンド参照） |

### blueprint_*（Blueprint 層の規約・テンプレ）

プロダクト固有層の「値を含まない部分」だけを配布する。プロジェクト固有の内容が入るファイル
（deck.md / content-list.md / {slug}.md）は配布しない。

| ファイル | 配置先 | 内容 |
|---|---|---|
| `blueprint_docs_rules.md` | `docs/_rules.md` | docs 全体規約（空テンプレ禁止・product/design の境界・仕様変更時の判断フロー） |
| `blueprint_deck_template.md` | `docs/product/_deck_template.md` | deck の構造と問い（deck インタビューの台本）。deck 本体は配布しない |
| `blueprint_stories_rules.md` | `docs/product/stories/_rules.md` | ストーリー規約（所有権・target/pages・条件 ID の粒度・プロトタイプのライフサイクル・Story 作成ルール） |
| `blueprint_stories_template.md` | `docs/product/stories/_template.md` | ストーリーのテンプレート（frontmatter・文脈層・規範層） |

### printer/（Printer 層のデザイン資産）

Printer 資産の正本。運用と別リポジトリへの切り出し条件は `printer/README.md` を参照。

| ファイル | 配置先 | 内容 |
|---|---|---|
| `printer/design_rules.md` | `docs/design/_rules.md` | 汎用資産の運用規約（同期・override・還元判断・非機能の横断ルール） |
| `printer/tokens_rules.md` | `docs/design/tokens/_rules.md` | トークンの層構造（`:root` / `@theme inline` の使い分け）・参照ルール・shadcn 変数名の規約・設計根拠・検証項目。値は `src/app/globals.css` が持つ |
| `printer/ui/_template.md` | `docs/design/ui/_template.md` | ui spec（usage / function / surface）のテンプレート |
| `printer/layout/_template.md` | `docs/design/layout/_template.md` | layout spec（画面パターン）のテンプレート |

ui spec / layout spec / コンポーネントの実体は未収録。プロジェクトで育ったものを還元して収録する。

これらの資産を使って出力する側（印刷コマンド `/print`）は `base_print.md` が持つ。
配置先が `.claude/commands/` であって `docs/design/` ではないため、`printer/` には入れていない。

### docs/（このリポジトリ内の参照ドキュメント。配布しない）

| ファイル | 参照タイミング |
|---|---|
| `docs/philosophy.md` | リポジトリ構成の変更・新しいドキュメント種別の追加・体系に関わる判断を行うとき（オンデマンド。常時読み込みにはしない） |

`docs/philosophy.md` は withAI 開発手法の設計思想（3層構造と各ドキュメントの役割分解）。
日々の運用手順は README と `base_*` が正で、矛盾した場合はそちらに従い `philosophy.md` を直す。

### framework_*（フレームワーク固有）

| ファイル | 内容 |
|---|---|
| `framework_nextjs.md` | Next.js (App Router) + shadcn/ui + Storybook 固有の設定 |

### bootstrap guide（組み立て済み成果物）

| ファイル | 対応 `framework_*` | 内容 |
|---|---|---|
| `project_bootstrap_guide_nextjs.md` | `framework_nextjs.md` | Next.js (App Router) + shadcn/ui |

---

## bootstrap guide の生成・更新方法

bootstrap guide は `base_*` と `framework_*` を組み合わせた成果物として生成する。
直接編集せず、元ファイルを更新してから再生成する。

### 新規生成

```
base_harness.md, base_security_env_setup.md, base_security_env.md, base_security_code.md,
base_dev_pipeline.md, base_codex_review.md, base_agents_md.md, base_a11y.md, base_ui_motion.md,
base_storybook.md, base_ux_audit.md, base_print.md, blueprint_deck_template.md,
framework_nextjs.md を参照して、
Next.js プロジェクトのセットアップ手順を Phase 0 から順番に実行できる
project_bootstrap_guide_nextjs.md を生成してください。

CLAUDE.md の Phase では、手順やルールを本体に直接書き込まないこと。
CLAUDE.md 本体は「タスク種別 → 参照ファイル」の読み分け表を中心に構成し、
常時適用ルールは .claude/rules/ 側に置く前提で書いてください。

AGENTS.md は手書きさせず、CLAUDE.md と .claude/rules/ を配置したあとの Phase で
base_agents_md.md に従って生成する手順にしてください（ソースより先に生成できないため順序に注意）。

ガイドの末尾に、以下を含めてください。
- 運用開始後の参照先として docs/base_automation_roadmap.md と docs/base_ops_incident.md への1行ずつのポインタ
- 「Launcher 工程の続き」（配置完了後の対話工程）。deck インタビュー → content-list.md →
  最初の story → tokens の値生成の順で、テンプレを埋めるサポートまでをガイドの責務に含める。
  deck は blueprint_deck_template.md の問いを台本にした対話で引き出し、埋め切った時点で
  deck.md を生成する（空の deck.md は置かない）
```

### base_* / framework_* 更新後の再生成

```
base_security_env.md を更新しました。
これを反映して project_bootstrap_guide_nextjs.md を再生成してください。
```

---

## 運用ルール

### ファイルの役割分担

- `base_*`、`framework_*`、`blueprint_*`、`printer/` が「ソース」。直接編集してよいファイル群
- `docs/philosophy.md` は配布しないが正本主義の対象。体系の判断を変えたらここも直す
  （運用手順が正なので、矛盾に気づいたら README・`base_*` 側を正として philosophy を合わせる）
- `blueprint_*` と `printer/` は配布先でリネームされる（対応表は「ファイル構成」を参照）。
  配布先プロジェクトでは直接編集せず、`printer/` 由来のものは `_override.md` に逸脱を書く
- bootstrap guide は「生成物」。直接編集しない。変更は必ず元ファイルに入れてから再生成する
- このルールを守らないと `base_*` と bootstrap guide の内容が乖離して、次の再生成時に意図しない差分が出る

### base_* / framework_* を更新したとき

1. 該当ファイルを更新する
2. `project_bootstrap_guide_nextjs.md` を再生成する（生成プロンプトの参照ファイルに含まれないものは再生成不要）
3. GitHub リポジトリに push する

### ファイルを追加・削除・リネームしたとき

1. このREADMEのファイル一覧を更新する
2. 固定 bootstrap プロンプト（必須セット・オプション一覧）に影響する場合は更新する
3. GitHub リポジトリに push する

### ベストプラクティス・外部情報を反映したとき

1. 反映先の `base_*` を特定して更新する
2. 影響する場合は bootstrap guide を再生成する
3. GitHub リポジトリに push する

「どの `base_*` に反映すべきか」判断に迷う場合はこのプロジェクトで相談すること。

### ドキュメントの鮮度管理

外部仕様（ツールのバージョン・デフォルト設定・API・サービス仕様）に依存する記述を含むファイルは、
末尾に「最終検証日: YYYY-MM-DD」を記載する。新規作成時に付与し、既存ファイルは編集したついでに付与する
（全ファイルの一括改修はしない）。

四半期に一度、以下をこのプロジェクトで実行して突き合わせを行う:

```
README のファイル一覧のうち「最終検証日」が90日以上前または未記載のファイルを対象に、
外部仕様に依存する記述（コマンド・デフォルト値・設定キー・サービス仕様）を web 検索で
最新仕様と突き合わせ、乖離があるものだけ修正案を提示してください。
```

### 既存プロジェクトへの更新反映（再同期）

配布済みプロジェクトのドキュメントは配布時点で凍結され、上流の改善は自動では届かない。
上流を更新したら、影響の大きい変更（セキュリティルール等）については既存プロジェクト側で
以下のプロンプトを Claude Code に貼って再同期する:

```
このプロジェクトの .claude/rules/ .claude/docs/ docs/ に配置済みの base_*・framework_* ファイルについて、
https://raw.githubusercontent.com/ryooooooya/CCLauncher/main/<ファイル名> から最新版を取得し、
ローカル版と差分があるファイルを一覧で提示してください。
docs/_rules.md, docs/product/_deck_template.md, docs/product/stories/_rules.md,
docs/product/stories/_template.md, docs/design/_rules.md, docs/design/tokens/_rules.md,
docs/design/ui/_template.md, docs/design/layout/_template.md が存在する場合は、
各ファイル冒頭の「正本」行に書かれた上流ファイル名から同様に取得して比較してください。
docs/design/ 配下の逸脱は docs/design/_override.md に記録されているはずなので、
override に載っている変更は「独自変更」として扱い、上書き候補から外してください。
私が承認したファイルだけ上書きしてください。ローカル側に独自変更があるファイルは上書きせず、
差分を示して相談してください。更新後のファイルに新しいセットアップ手順が含まれる場合は、
実行前に内容を提示してください。
最後に、上書きしたファイルに .claude/rules/ 配下のものが含まれる場合は、
AGENTS.md が古くなるので /agents-md で再生成してください（AGENTS.md は手編集せず再生成する生成物）。
```

### このREADMEを更新するタイミング

- ファイルの追加・削除・リネームをしたとき
- 運用の考え方が変わったとき
- 配置先マッピング・固定 bootstrap プロンプトを変更したとき

---

## 参考

- Zenn: Claude Code / MCP を安全に使うための実践ガイド
- Trail of Bits / claude-code-config
- owayo: Claude Code と Codex の連携を MCP から Skill に変えたら体験が劇的に改善した
