# README

Claude Code でのプロジェクト開発を支援するドキュメント群。
bootstrap guide の生成・更新と、各種設定の参照に使う。対象フレームワークは Next.js（App Router）。

---

## 配布と取得

ドキュメントは GitHub リポジトリで管理・配布する。

- リポジトリ: https://github.com/ryooooooya/ClaudeCodeLauncherDocs

ドキュメントの正本はこのリポジトリ。Claude のプロジェクトナレッジにはファイルを置かず、
参照・編集の際は raw URL（https://raw.githubusercontent.com/ryooooooya/ClaudeCodeLauncherDocs/main/<ファイル名>）
から常に最新版を取得する。

新規プロジェクトの開始は、次節の固定 bootstrap プロンプトを Claude Code に貼り付けるだけでよい。

---

## 固定 bootstrap プロンプト

新規 Next.js プロジェクトのディレクトリで Claude Code を起動し、以下をそのまま貼り付ける。

```
新規 Next.js プロジェクトをセットアップします。以下を順に実行してください。

1. 必須ドキュメントを取得して配置する:

BASE_URL="https://raw.githubusercontent.com/ryooooooya/ClaudeCodeLauncherDocs/main"
mkdir -p .claude/rules .claude/docs docs
curl -sL "${BASE_URL}/base_security_env.md" -o .claude/rules/base_security_env.md
curl -sL "${BASE_URL}/base_security_code.md" -o .claude/rules/base_security_code.md
curl -sL "${BASE_URL}/project_bootstrap_guide_nextjs.md" -o .claude/docs/project_bootstrap_guide_nextjs.md
curl -sL "${BASE_URL}/framework_nextjs.md" -o .claude/docs/framework_nextjs.md
curl -sL "${BASE_URL}/base_harness.md" -o .claude/docs/base_harness.md
curl -sL "${BASE_URL}/base_security_env_setup.md" -o .claude/docs/base_security_env_setup.md
curl -sL "${BASE_URL}/base_preflight.md" -o .claude/docs/base_preflight.md
curl -sL "${BASE_URL}/base_automation_roadmap.md" -o docs/base_automation_roadmap.md
curl -sL "${BASE_URL}/base_ops_incident.md" -o docs/base_ops_incident.md

2. 以下のオプション機能の要否を私に確認し、採用するものだけ同じ BASE_URL から追加取得して
   指定の配置先に置く:

- UI コンポーネントの実装がある
  → base_ux_checklist_critical.md（.claude/rules/）
    base_ux_checklist_high.md / base_ux_checklist_medium.md / base_ui_motion.md / base_chrome_devtools.md（.claude/docs/）
- アクセシビリティ対応が必要 → base_a11y.md（.claude/docs/）
- テスト戦略がほしい → base_testing.md（.claude/docs/）
- Codex でレビューしたい → base_codex_review.md（.claude/docs/）
- 外部 npm パッケージを多用する
  → base_security_npm.md（.claude/rules/）
    base_security_npm_setup.md / base_security_npm_incident.md（.claude/docs/）
- Supabase を使う → base_security_supabase.md（.claude/rules/）
- SEO 対応が必要 → base_seo.md（.claude/docs/）
- パフォーマンス基準を CI で守る → base_performance.md（.claude/docs/）
- エラー監視（Sentry）を入れる → base_sentry_setup.md（.claude/docs/）
- 個人情報を扱う → base_privacy_guide.md（docs/）
- Storybook でコンポーネント管理する → base_storybook.md（.claude/docs/）
- カスタム Skill を作る予定 → base_skill_md_prompt.md（.claude/docs/）
- CLAUDE.md の設計知識がほしい → base_claude_md_knowledge.md（docs/）
- 人間向けのセキュリティ解説もほしい → base_security_env_guide.md / base_security_code_guide.md（docs/）

3. 配置が終わったら .claude/docs/project_bootstrap_guide_nextjs.md を読み、
   Phase 0 から順にセットアップを進めてください。
```

### ドキュメントの配置先

固定プロンプトは以下のルールでドキュメントの配置先を決めている。

| 配置先 | 役割 | 読み込みタイミング |
|---|---|---|
| `.claude/rules/` | 常時適用されるルール | 毎セッション自動読み込み |
| `.claude/docs/` | セットアップ手順・参照ドキュメント | 必要に応じて参照 |
| `docs/` | 人間向け解説・リファレンス | Claude Code の指示ではない |

`.claude/rules/` に入るのは禁止事項・セキュアコーディング・npm セキュリティ・UX CRITICAL・Supabase 認可境界など「常時適用」のルールのみ。人間向け解説（`*_guide.md` 等）は `docs/`、その他はすべて `.claude/docs/`。

---

## ファイル構成

### base_*（フレームワーク非依存）

| ファイル | 内容 |
|---|---|
| `base_harness.md` | Biome + Oxlint + Lefthook + フック設定 |
| `base_preflight.md` | 実装前の前提確認（スコープ・LLM・コスト・法務・個人情報） |
| `base_security_env.md` | セキュリティ環境の禁止事項（常時適用ルール） |
| `base_security_env_setup.md` | サンドボックス, settings.json, セキュリティフック, Codex CLI 経路の防御のセットアップ手順（初期化時に一度だけ実行） |
| `base_security_env_guide.md` | セキュリティ設定の背景・理由（人間向け解説） |
| `base_security_code.md` | TypeScript / Node.js セキュアコーディングルール（Claude Code への指示） |
| `base_security_code_guide.md` | セキュアコーディングルールの背景・理由（人間向け解説） |
| `base_security_npm.md` | npm サプライチェーンセキュリティの常時ルール: 依存関係の追加・更新・lockfile・overrides |
| `base_security_npm_setup.md` | CI/GitHub 側の自動防御層（Dependabot, Dependency Review, CI audit）のセットアップ手順（初期化時に一度だけ実行） |
| `base_security_npm_incident.md` | npm インシデント情報を受けたときの影響確認・対処手順（オンデマンド参照） |
| `base_security_supabase.md` | Supabase セキュリティルール（RLS・キー管理・セッション検証・Storage）。Supabase 採用時のみ |
| `base_codex_review.md` | Codex による計画レビュー・コードレビュー連携（ChatGPT ログイン認証） |
| `base_a11y.md` | アクセシビリティセットアップ（Playwright + jest-axe） |
| `base_testing.md` | テスト戦略（vitest 単体 + Playwright E2E の層設計） |
| `base_ux_checklist_critical.md` | UX チェックリスト（CRITICAL: 常時適用） |
| `base_ux_checklist_high.md` | UX チェックリスト（HIGH: UI実装・レビュー時） |
| `base_ux_checklist_medium.md` | UX チェックリスト（MEDIUM/LOW: 該当機能の実装時） |
| `base_ui_motion.md` | UIの触感・質感（アニメーション・インタラクションフィードバック・ジェスチャー応答） |
| `base_storybook.md` | Storybook + AI 連携（MCP server + Manifest）セットアップ・Story 作成ルール |
| `base_chrome_devtools.md` | chrome-devtools-mcp の設定と使用方針（実行時デバッグ・パフォーマンス計測。UI 選択時に配布） |
| `base_claude_md_knowledge.md` | CLAUDE.md の設計・運用に関する知識まとめ |
| `base_skill_md_prompt.md` | SKILL.md 生成プロンプト |
| `base_seo.md` | SEO・メタデータ（Metadata API / sitemap / OGP / 構造化データ / noindex） |
| `base_performance.md` | パフォーマンス予算と Lighthouse CI による回帰検知 |
| `base_sentry_setup.md` | Sentry エラー監視のセットアップ手順（初期化時に一度だけ実行） |
| `base_privacy_guide.md` | 個人情報・プライバシー対応の実装チェックリスト（人間向け解説） |
| `base_automation_roadmap.md` | 運用自動化の仕分けロードマップ（今やる/条件付き/やらない・人間向け） |
| `base_ops_incident.md` | 本番障害発生時の対応手順・平時準備（人間向け、オンデマンド参照） |

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
base_codex_review.md, base_a11y.md, base_ui_motion.md, base_storybook.md, framework_nextjs.md を参照して、
Next.js プロジェクトのセットアップ手順を Phase 0 から順番に実行できる
project_bootstrap_guide_nextjs.md を生成してください。
ガイドの末尾に、運用開始後の参照先として docs/base_automation_roadmap.md と
docs/base_ops_incident.md への1行ずつのポインタを含めてください。
```

### base_* / framework_* 更新後の再生成

```
base_security_env.md を更新しました。
これを反映して project_bootstrap_guide_nextjs.md を再生成してください。
```

---

## 運用ルール

### ファイルの役割分担

- `base_*` と `framework_*` が「ソース」。直接編集してよい唯一のファイル群
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
https://raw.githubusercontent.com/ryooooooya/ClaudeCodeLauncherDocs/main/<ファイル名> から最新版を取得し、
ローカル版と差分があるファイルを一覧で提示してください。
私が承認したファイルだけ上書きしてください。ローカル側に独自変更があるファイルは上書きせず、
差分を示して相談してください。更新後のファイルに新しいセットアップ手順が含まれる場合は、
実行前に内容を提示してください。
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
