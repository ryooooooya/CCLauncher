# project_bootstrap_guide_wordpress

SWELL 子テーマ開発用のローカル環境（wp-env / Docker）を立ち上げ、
Claude Code の限定ハーネス・セキュリティ設定・Codex 連携までセットアップする手順。
Phase 0 から順番に実行すれば完了する。

Next.js / Astro とは環境が大きく異なる点に注意:

- 言語: PHP + CSS（JS は補助的）
- ビルドツールなし（子テーマは素の PHP / CSS）
- ハーネスの範囲が限定的（Biome / Oxlint の恩恵が薄い）
- ローカル環境は wp-env（Docker）

各設定の背景・理由は以下を参照:

- セキュリティ（環境制御）→ `base_security_env.md` / `base_security_env_setup.md` / `base_security_env_guide.md`
- Codex 連携 → `base_codex_review.md`
- フレームワーク固有 → `framework_wordpress.md`

---

## 前提

- Docker Desktop がインストール済み・起動済み
- Node.js 20+（wp-env のために必要）
- pnpm がインストール済み
- SWELL 親テーマ zip 取得済み（SWELLER'S マイページからダウンロード）
- SWELL 子テーマ zip 取得済み（同上、無料）
- Claude Code がインストール済み
- Codex CLI がインストール済み・ChatGPT ログイン済み（下記参照）

### Codex CLI の認証

レビュー連携は ChatGPT ログインで使う（人間起点のローカル CLI 実行であり、
API の従量課金は発生しない）。

```bash
# ブラウザが開き ChatGPT の OAuth フローでログインする
codex login

# 認証方式を確認（ChatGPT になっていること）
codex login status
```

API キーでログイン済みの場合は `codex logout` してから `codex login` し直す。
環境に `OPENAI_API_KEY` が残っていると意図せず API キー認証になることがあるため、
`codex login status` が API key を示す場合は当該環境変数を外す。

---

## Phase 0: ローカル環境（wp-env）

### 0-1. テーマの配置

SWELL 親テーマと子テーマの zip を展開し、`.wp-env.json` から参照できる形に配置する。

```
project-root/
├── swell/          # SWELL 親テーマ（zip を展開）
├── swell-child/    # SWELL 子テーマ（zip を展開）
├── .wp-env.json
└── package.json
```

SWELL 親テーマ（`swell/`）は編集しない。カスタマイズはすべて子テーマ（`swell-child/`）で行う。

### 0-2. wp-env のインストール

```bash
pnpm add -D @wordpress/env
```

### 0-3. .wp-env.json の作成

プロジェクトルートに `.wp-env.json` を作成する。

```json
{
  "core": null,
  "phpVersion": "8.2",
  "themes": [
    "./swell",
    "./swell-child"
  ],
  "plugins": [
    "https://downloads.wordpress.org/plugin/wp-multibyte-patch.latest-stable.zip"
  ],
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "SCRIPT_DEBUG": true
  }
}
```

### 0-4. package.json に wp-env スクリプトを追加

```json
{
  "scripts": {
    "wp:start": "wp-env start",
    "wp:stop": "wp-env stop",
    "wp:reset": "wp-env clean all && wp-env start",
    "wp:logs": "wp-env logs"
  }
}
```

### 0-5. 起動確認

```bash
pnpm wp:start
```

- フロントエンド: `http://localhost:8888`
- 管理画面: `http://localhost:8888/wp-admin`
- ログイン: `admin` / `password`

### 0-6. git 初期化とコミット

```bash
git init
git add -A
git commit -m "init: WordPress (wp-env) + SWELL 子テーマ"
```

---

## Phase 1: SWELL 子テーマの構成

`swell-child/` を以下の構成にする。

```
swell-child/
├── style.css           # テーマ定義（必須）
├── functions.php       # フック・スクリプト読み込みのみ
├── css/
│   ├── tokens.css      # Figma MCP から生成したデザイントークン（任意）
│   └── custom.css      # カスタムスタイル
└── js/
    └── custom.js       # カスタムスクリプト（必要な場合）
```

### 1-1. style.css の最小構成

```css
/*
Theme Name: SWELL CHILD
Template: swell
Version: 1.0.0
*/
```

### 1-2. functions.php の最小構成

`functions.php` にはすべての処理を書かず、フックと読み込みのみを記述する。
機能ごとにファイルを分けて `require_once` で読み込む。

```php
<?php
add_action('wp_enqueue_scripts', function() {
    $version = filemtime(get_stylesheet_directory() . '/css/custom.css');
    wp_enqueue_style(
        'swell-child-custom',
        get_stylesheet_directory_uri() . '/css/custom.css',
        [],
        $version
    );
}, 11);
```

### 1-3. SWELL CSS カスタムプロパティ

子テーマで色をハードコードせず、必ず SWELL の CSS 変数を経由する。
SWELL のカスタムプロパティはアンダースコア命名（`--color_main` 形式）。
`--swl-color-*` のようなハイフン形式は SWELL では使われていない。

```css
/* css/custom.css */
.my-component {
  color: var(--color_main);
  font-size: var(--font_size_base);
}
```

主要な変数: `--color_main` / `--color_main_thin` / `--color_text` / `--color_link` /
`--font_size_base` / `--font_size_s` / `--font_size_l` / `--content_width`。
カスタマイザーで設定した色はこれらの変数に自動的に反映される。

### 1-4. Figma MCP との連携（任意）

Figma Variables から SWELL のカスタムプロパティに CSS を伝播させる場合、
`get_variable_defs` でトークンを取得し、アンダースコア命名で `css/tokens.css` に出力する。

```
Figma ファイルの SWELL Tokens コレクションから get_variable_defs でトークンを取得し、
:root { --color_main: ... } の形式で swell-child/css/tokens.css に出力してください。
変数名はアンダースコア命名（--color_main 形式）を維持してください。
```

---

## Phase 2: ハーネス（限定）

PHP + 素の CSS 環境では Biome / Oxlint の恩恵が限定的。
PHP は PHP_CodeSniffer（WordPress Coding Standards）、JS は Oxlint でカバーする。

| ツール | 適用可否 | 備考 |
|---|---|---|
| Biome | △ | `.js` のみ。PHP / CSS には効かない |
| Oxlint | △ | `.js` のみ |
| Lefthook | ○ | PHP_CodeSniffer と組み合わせて使える |
| PostToolUse フック | ○ | PHP / CSS / JS に対応するスクリプトを使う（Phase 3 で配置） |

### 2-1. Oxlint のインストール（JS 用）

```bash
pnpm add -D oxlint lefthook
```

`.oxlintrc.json` をプロジェクトルートに作成する。

```json
{
  "rules": {
    "no-unused-vars": "error"
  }
}
```

### 2-2. PHP_CodeSniffer のインストール

PHP がインストールされている環境で実行する（一度だけ）。

```bash
composer global require squizlabs/php_codesniffer wp-coding-standards/wpcs
phpcs --config-set installed_paths $(composer config -g home)/vendor/wp-coding-standards/wpcs
```

### 2-3. package.json に lint スクリプトを追加

```json
{
  "scripts": {
    "lint:php": "phpcs --standard=WordPress swell-child/",
    "lint:js": "oxlint swell-child/js"
  }
}
```

### 2-4. Lefthook でプリコミットフックを設定

`lefthook.yml` をプロジェクトルートに作成する。

```yaml
pre-commit:
  parallel: true
  commands:
    lint-php:
      glob: "swell-child/**/*.php"
      run: pnpm lint:php
    lint-js:
      glob: "swell-child/**/*.js"
      run: pnpm lint:js
```

```bash
pnpm lefthook install
```

---

## Phase 3: セキュリティ設定

### 3-0. サンドボックスを有効化する（Docker 除外つき）

Claude Code のネイティブサンドボックス（macOS: Seatbelt、Linux: bubblewrap）を有効化する。
settings.json やフックよりも下のレイヤーで強制されるため、最初に設定する。

Linux / WSL2 の場合は先に依存をインストールする（macOS は不要、WSL1 は非対応）:

```bash
# Debian / Ubuntu
sudo apt install bubblewrap socat
# Fedora
sudo dnf install bubblewrap socat
```

Claude Code 内で有効化する:

```
/sandbox
```

| モード | 挙動 | 使いどころ |
|---|---|---|
| Auto-allow | サンドボックス内のコマンドは自動承認。境界外のアクセスのみ確認が出る | 推奨。承認プロンプトが大幅に減る |
| Regular permissions | サンドボックス内でも全コマンドが通常の承認フローを通る | 最大限の慎重さが必要な場面 |

**重要**: wp-env は Docker を使う。Docker コマンドはサンドボックス外で実行する必要があるため、
次の 3-2 の `~/.claude/settings.json` に `sandbox.excludedCommands` を設定する。
`/sandbox` で「Sandbox is enabled」と表示されれば完了。

### 3-1. .claudeignore

プロジェクトルートに `.claudeignore` を作成する。

```
.env*
*.pem
*.key
*.p12
*.pfx
credentials/
secrets/
.ssh/
.aws/
.config/gh/
*.token
*secret*
*credential*
```

### 3-2. ~/.claude/settings.json（ユーザーレベル）

既存の内容がある場合はバックアップを取ってから上書きすること。
wp-env のために `sandbox.excludedCommands` で Docker をサンドボックス外で許可する。

```json
{
  "enableAllProjectMcpServers": false,
  "sandbox": {
    "excludedCommands": ["docker", "docker-compose"]
  },
  "permissions": {
    "disableBypassPermissionsMode": "disable",
    "defaultMode": "ask",
    "allow": [
      "Read",
      "Bash(pnpm *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(git switch *)",
      "Bash(git commit *)",
      "Bash(git stash *)",
      "Bash(git fetch *)",
      "Bash(git pull *)",
      "Bash(gh issue *)",
      "Bash(gh pr *)",
      "Bash(echo *)",
      "Bash(ls *)",
      "Bash(jq *)",
      "Bash(grep *)",
      "Bash(sort *)",
      "Bash(find *)",
      "Bash(awk *)",
      "Bash(sed *)",
      "Bash(cut *)",
      "Bash(diff *)",
      "Bash(python3 --version)",
      "Bash(node --version)",
      "Bash(pnpm --version)",
      "Bash(git --version)",
      "Write(/tmp/**)"
    ],
    "deny": [
      "Bash(rm *)",
      "Bash(rm -r *)",
      "Bash(rm -rf *)",
      "Bash(rm -fr *)",
      "Bash(sudo *)",
      "Bash(su *)",
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(nc *)",
      "Bash(ncat *)",
      "Bash(telnet *)",
      "Bash(ssh *)",
      "Bash(scp *)",
      "Bash(rsync *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)",
      "Bash(git add .)",
      "Bash(git add -A)",
      "Bash(git add --all *)",
      "Bash(git checkout .)",
      "Bash(git clean -f *)",
      "Bash(osascript *)",
      "Bash(security *)",
      "Bash(pbcopy *)",
      "Bash(pbpaste *)",
      "Bash(open *)",
      "Bash(defaults write *)",
      "Bash(npm publish *)",
      "Bash(pnpm publish *)",
      "Bash(yarn publish *)",
      "Bash(* .env*)",
      "Bash(* ~/.ssh/*)",
      "Bash(* ~/.aws/*)",
      "Bash(* ~/.config/gh/*)",
      "Bash(* ~/.git-credentials)",
      "Bash(* ~/.netrc)",
      "Bash(* ~/.npmrc)",
      "Read(./.env)",
      "Edit(./.env)",
      "Write(./.env)",
      "Read(./.env.*)",
      "Edit(./.env.*)",
      "Write(./.env.*)",
      "Read(./**/.env)",
      "Read(./**/.env.*)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Read(~/.git-credentials)",
      "Read(~/.config/gh/**)",
      "Read(~/.netrc)",
      "Read(~/.npmrc)",
      "Edit(~/.zshrc)",
      "Write(~/.zshrc)",
      "Edit(~/.bashrc)",
      "Write(~/.bashrc)"
    ],
    "hooks": {
      "PreToolUse": [
        {
          "matcher": "Bash",
          "hooks": [
            { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/bash-firewall.sh" }
          ]
        },
        {
          "matcher": "Read|Edit|MultiEdit|Write",
          "hooks": [
            { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/protect-files.py" }
          ]
        }
      ]
    }
  }
}
```

構文チェック:

```bash
jq . ~/.claude/settings.json > /dev/null && echo "OK" || echo "JSON構文エラー"
```

`defaultMode` は `"ask"`（推奨。未知のリポジトリ・外部コンテンツを扱う場合は必ずこちら）。

### 3-3. .claude/settings.json（プロジェクトレベル）

PostToolUse フック（PHP / JS の自動チェック）と PreToolUse フック（設定・親テーマ保護）を登録する。

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/post-wp-lint.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/protect-config.sh"
          }
        ]
      }
    ]
  }
}
```

### 3-4. フックスクリプトの作成

`.claude/hooks/` ディレクトリを作成し、以下の4ファイルを配置する。

#### .claude/hooks/bash-firewall.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

if echo "$COMMAND" | grep -qE '(curl|wget).*\|.*(sh|bash|zsh)'; then
  echo "Blocked: pipe-to-shell is prohibited." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qE 'rm\s+-[a-z]*[rf]'; then
  echo "Blocked: rm with recursive/force flags is prohibited. Use trash or mv instead." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qP 'git\s+push\s+(origin\s+)?(main|master)\b'; then
  echo "Blocked: direct push to main/master is prohibited. Use a feature branch." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qE '^\s*sudo\s+'; then
  echo "Blocked: sudo is prohibited inside Claude Code sessions." >&2
  exit 2
fi

exit 0
```

#### .claude/hooks/protect-files.py

```python
#!/usr/bin/env python3
import sys, json
from pathlib import Path

SENSITIVE_PATTERNS = {
    '.env', '.pem', '.key', '.p12', '.pfx',
    '.credential', '.token', 'credentials.json',
    'service-account.json', 'id_rsa', 'id_ed25519', 'id_ecdsa'
}

def is_sensitive(path: str) -> bool:
    p = Path(path)
    name = p.name.lower()
    for pattern in SENSITIVE_PATTERNS:
        if name == pattern or name.endswith(pattern):
            return True
    if name.startswith('.env'):
        return True
    if any(kw in name for kw in ('secret', 'credential', 'private_key')):
        return True
    return False

def main():
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)
    file_path = data.get('tool_input', {}).get('path') \
             or data.get('tool_input', {}).get('file_path', '')
    if file_path and is_sensitive(file_path):
        print(
            f"SECURITY: Access to '{file_path}' is blocked.\n"
            "Credential files and .env must not be read or modified by Claude.",
            file=sys.stderr
        )
        sys.exit(2)
    sys.exit(0)

if __name__ == '__main__':
    main()
```

#### .claude/hooks/post-wp-lint.sh

ファイル編集後に PHP は PHP_CodeSniffer、JS は Oxlint を実行し、残った違反をエージェントに返す。

```bash
#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$input")"

case "$file" in
  *.php)
    diag="$(phpcs --standard=WordPress "$file" 2>&1 | head -30)"
    ;;
  *.js)
    npx oxlint --fix "$file" >/dev/null 2>&1 || true
    diag="$(npx oxlint "$file" 2>&1 | head -20)"
    ;;
  *)
    exit 0
    ;;
esac

if [ -n "$diag" ]; then
  jq -Rn --arg msg "$diag" '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: $msg
    }
  }'
fi
```

#### .claude/hooks/protect-config.sh

設定ファイルへの編集と、SWELL 親テーマ（`swell/`）への編集を物理的にブロックする。

```bash
#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$input")"

# 設定ファイルの保護
protected="lefthook.yml .wp-env.json composer.json .oxlintrc.json"
for p in $protected; do
  case "$file" in
    *$p*)
      echo "BLOCKED: $file は保護された設定ファイルです。" >&2
      exit 2
      ;;
  esac
done

# SWELL 親テーマの保護（カスタマイズは swell-child/ で行う）
case "$file" in
  swell/*|*/swell/*)
    echo "BLOCKED: SWELL 親テーマ(swell/)は編集禁止です。カスタマイズは swell-child/ で行ってください。" >&2
    exit 2
    ;;
esac

exit 0
```

実行権限を付与する:

```bash
chmod +x .claude/hooks/bash-firewall.sh
chmod +x .claude/hooks/protect-files.py
chmod +x .claude/hooks/post-wp-lint.sh
chmod +x .claude/hooks/protect-config.sh
```

---

## Phase 4: CLAUDE.md

以下の内容をプロジェクトルートの `CLAUDE.md` として配置する。

````markdown
# CLAUDE.md

## プロジェクト概要

WordPress + SWELL 子テーマ

## コマンド

```bash
pnpm wp:start     # ローカル WordPress 起動（http://localhost:8888）
pnpm wp:stop      # ローカル WordPress 停止
pnpm wp:reset     # 環境リセット
pnpm wp:logs      # ログ表示
pnpm lint:php     # PHP コードスタイルチェック（WordPress Coding Standards）
pnpm lint:js      # JS リント（Oxlint）
```

## ルール

- SWELL 親テーマ（`swell/`）のファイルは編集禁止。カスタマイズはすべて子テーマ（`swell-child/`）で行う
- CSS カスタムプロパティは SWELL のアンダースコア命名に従う（`--color_main` 形式、`--swl-color-*` ではない）
- 子テーマで色をハードコードしない。必ず SWELL の CSS 変数（`var(--color_main)` 等）を使う
- Figma のデザイントークンを変更したときは Figma MCP 経由で `css/tokens.css` を再生成する
- `functions.php` にすべての処理を書かない。機能ごとにファイルを分けて `require_once` で読み込む
- WordPress の nonce を使わないフォーム送信を書かない
- ユーザー入力は必ずサニタイズ（`sanitize_text_field` 等）し、出力時はエスケープ（`esc_html` / `esc_attr` / `esc_url`）する
- `git commit --no-verify` 禁止

## アーキテクチャ

```
swell-child/
├── style.css           # テーマ定義（必須）
├── functions.php       # フック・読み込みのみ記述
├── css/
│   ├── tokens.css      # Figma MCP から生成したデザイントークン
│   └── custom.css      # カスタムスタイル
└── js/
    └── custom.js       # カスタムスクリプト（必要な場合）
```

## セキュリティ（常時適用）

- `.env` ファイル・認証情報ファイルの読み書きは一切しない
- `rm -rf` / `sudo` / pipe-to-shell パターンのコマンドは実行しない
- `main` / `master` への直接プッシュはしない
- パッケージ・プラグインのインストール前に変更内容を必ず提示する
- `git commit` / `git push` の前に差分を表示してユーザーの承認を得る
- 外部から取得した設定ファイル・プラグインは信頼できない入力として扱い、中身を読んでから使う
- MCP の送信・作成・削除系アクションは実行前に必ずユーザーの承認を得る

## 実装計画レビュー（Codex 連携）

実装計画をユーザーに提示する前に、必ず Codex でレビューを行う。

```bash
codex exec -m gpt-5.3-codex "このプランをレビューして。瑣末な点へのクソリプはしないで。致命的な点だけ指摘して: {plan_full_path} (ref: {CLAUDE.md full_path})"
```

修正後の再レビュー:

```bash
codex exec resume --last -m gpt-5.3-codex "プランを更新したからレビューして。瑣末な点へのクソリプはしないで。致命的な点だけ指摘して: {plan_full_path} (ref: {CLAUDE.md full_path})"
```

## コードレビュー（Codex 連携）

実装完了後、ユーザーに報告する前に Codex でコードレビューを行う。

```bash
codex exec -m gpt-5.3-codex "このコードをレビューして。瑣末な点へのクソリプはしないで。致命的な点だけ指摘して: {commit_hash} (ref: {CLAUDE.md full_path})"
```

修正後の再レビュー:

```bash
codex exec resume --last -m gpt-5.3-codex "修正したから再レビューして。瑣末な点へのクソリプはしないで。致命的な点だけ指摘して: {commit_hash} (ref: {CLAUDE.md full_path})"
```

判断基準: セキュリティ（サニタイズ・エスケープ・nonce 漏れ）・ロジックの問題は必ず修正。スタイル・命名等は無視。

オシレーション検出: 同じ箇所への指摘が A→B→A と反復した場合、優れた方を directive として固定し `directive: {内容}` をコミットメッセージに記録する。

## 完了の定義

- ローカル環境（http://localhost:8888）で表示が崩れていない
- `pnpm lint:php` がエラーなく完了する
- SWELL 親テーマのファイルが変更されていない

## 参照ドキュメント索引

IMPORTANT: 以下の作業を始める前に、対応するファイルを必ず読むこと。

| 作業 | 読むファイル |
|---|---|
| UI コンポーネントの実装・レビュー | `.claude/docs/base_ux_checklist_high.md` |
| アニメーション・インタラクションの実装 | `.claude/docs/base_ui_motion.md` |
| 実装計画・コミット前のレビュー | `.claude/docs/base_codex_review.md` |
| フレームワーク固有の規約・設定の確認 | `.claude/docs/framework_wordpress.md` |

配置していないファイルの行はセットアップ時に削除する。

## プロジェクト属性（preflight の結果）

`base_preflight.md` を実行した結果をここに記録する。属性が変わる機能追加（例：問い合わせフォームで個人情報を扱い始める、外部 API 連携を足す）を行う際は、該当 Step のみ再実行してこのセクションを更新する。

- scope: production / prototype のいずれか
- 外部 API 連携: あり / なし（あればサービス名とスペンディングキャップの設定状況）
- 個人情報: 扱うデータと適用法（APPI / GDPR 等）・プライバシーポリシー掲載状況
- フォーム: 該当フォームと nonce / reCAPTCHA 等のスパム対策状況
- プロトタイプ省略項目: prototype で省略した Step があれば列挙
- preflight 実行日: YYYY-MM-DD
````

---

## Phase 5: 動作確認

### WordPress / SWELL の確認

- [ ] `pnpm wp:start` で `http://localhost:8888` が表示される
- [ ] SWELL 親テーマと SWELL CHILD が管理画面のテーマ一覧に表示される
- [ ] SWELL CHILD が有効化されている
- [ ] `css/custom.css` の変更がブラウザに反映される
- [ ] SWELL の CSS 変数（`--color_main` 等）が子テーマから参照できている

### ハーネスの確認

- [ ] `pnpm lint:php` が実行できる（PHP_CodeSniffer + WordPress 標準）
- [ ] `pnpm lint:js` が実行できる（Oxlint）
- [ ] `.php` を編集すると PostToolUse フックで phpcs が走り、違反がコンテキストに注入される
- [ ] SWELL 親テーマ（`swell/`）を編集しようとするとブロックされる
- [ ] コミット時に Lefthook が lint を実行する

### セキュリティの確認

- [ ] サンドボックスが有効化されている（`/sandbox` で確認）
- [ ] `~/.claude/settings.json` の `sandbox.excludedCommands` に `docker` が入っている
- [ ] `.claudeignore` が存在し、機密ファイルパターンが記載されている
- [ ] `~/.claude/settings.json` の JSON 構文が正しい（`jq .` で確認）
- [ ] `disableBypassPermissionsMode` が `"disable"` になっている
- [ ] `enableAllProjectMcpServers` が `false` になっている
- [ ] `.claude/hooks/` の4ファイルが存在し、実行権限がある

### MCP サーバーの確認

- [ ] `~/.claude.json` に不要な MCP サーバーが登録されていない
- [ ] `.mcp.json` に不審な MCP サーバーがない（Figma MCP を使う場合は確認のうえ許可）

### CLAUDE.md の確認

- [ ] プロジェクトルートに `CLAUDE.md` が配置されている
- [ ] 参照ドキュメント索引の、配置していないファイルの行を削除済み
- [ ] Codex 連携のセクションが含まれている

---

## 運用ルール

- SWELL 親テーマは絶対に編集しない。SWELL 本体のアップデートで上書きされ、変更が消える
- CSS の色・サイズは SWELL の CSS 変数を経由する。カスタマイザー設定との一貫性を保つため
- フォーム・管理画面処理を書くときは nonce 検証・サニタイズ・エスケープを必ず入れる
- プラグインを追加する前に出所と中身を確認し、ユーザーの承認を得る
- 外部から取得した設定ファイル・プラグイン zip は信頼できない入力として扱う
- wp-env の Docker コマンドはサンドボックス外で実行されるため、`excludedCommands` の設定を消さない
- お金が動くサービス（決済プラグイン等）の認証情報は AI がアクセスできる環境から完全に隔離する
