# project_bootstrap_guide_nextjs

空のリポジトリから Next.js (App Router) プロジェクトを立ち上げ、
Claude Code のハーネス・セキュリティ・テスト・アクセシビリティ・Storybook・UI モーション・開発パイプライン（Codex 連携）まで
一気にセットアップする手順。Phase 0 から順番に実行すれば完了する。

各設定の背景・理由は以下を参照:

- ハーネスの設計思想 → `base_harness.md`
- セキュリティ（環境制御）→ `base_security_env.md` / `base_security_env_setup.md` / `base_security_env_guide.md`
- セキュリティ（生成コード）→ `base_security_code.md` / `base_security_code_guide.md`
- アクセシビリティ → `base_a11y.md`
- UI モーション → `base_ui_motion.md`
- Storybook → `base_storybook.md`
- 開発パイプライン → `base_dev_pipeline.md`
- Codex CLI・@codex review の機構 → `base_codex_review.md`
- AGENTS.md（実装エージェントへの指示）の生成 → `base_agents_md.md`
- UX 監査の運用 → `base_ux_audit.md`
- フレームワーク固有 → `framework_nextjs.md`

---

## 前提

- Node.js 20+
- pnpm がインストール済み
- Claude Code がインストール済み
- Codex CLI がインストール済み・ChatGPT ログイン済み（下記参照）
- 空のディレクトリまたは git init 済みのリポジトリ

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

## Phase 0: Next.js プロジェクト初期化

### 0-1. プロジェクト作成

```bash
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm
```

- App Router (`--app`)
- `src/` ディレクトリ (`--src-dir`)
- TypeScript, Tailwind CSS, ESLint を有効化

`create-next-app` は git を初期化して初回コミットまで作成する。

### 0-2. shadcn/ui の初期化

```bash
pnpm dlx shadcn@latest init
```

対話プロンプトの推奨設定:

- Style: Default
- Base color: Slate
- CSS variables: Yes

初期化後、よく使うコンポーネントを追加する:

```bash
pnpm dlx shadcn@latest add button input label card dialog
```

### 0-3. tsconfig.json の確認

`create-next-app` が生成した `tsconfig.json` に以下が含まれていることを確認する。
`noUncheckedIndexedAccess` はデフォルトに含まれないため手動で追加する。
セキュアコーディング上 `strict` 系は必須（`base_security_code.md`）。

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 0-4. ディレクトリ構成の確認

```
src/
├── app/              # App Router（page, layout, route）
├── components/       # UI コンポーネント
│   └── ui/           # shadcn/ui コンポーネント
├── lib/              # ユーティリティ・ヘルパー
├── hooks/            # カスタムフック
└── types/            # 型定義
```

`components`, `lib`, `hooks`, `types` が無ければ作成する。

### 0-5. コミット

```bash
git add -A
git commit -m "init: Next.js (App Router) + Tailwind + shadcn/ui"
```

---

## Phase 1: ハーネス

### 1-1. ツールのインストール

```bash
pnpm add -D @biomejs/biome oxlint lefthook
```

### 1-2. Biome 設定

`biome.json` をプロジェクトルートに作成する。

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": {
          "level": "warn",
          "options": { "maxAllowedComplexity": 15 }
        }
      }
    }
  }
}
```

可読性系のルールは warn にとどめ、正当な例外は許容する（後述の 1-6 コード品質ルールを参照）。

### 1-3. Oxlint 設定

`.oxlintrc.json` をプロジェクトルートに作成する。

```json
{
  "rules": {
    "no-explicit-any": "error",
    "no-unused-vars": "error",
    "max-lines-per-function": ["warn", { "max": 100, "skipBlankLines": true, "skipComments": true }],
    "max-depth": ["warn", 4],
    "max-nested-callbacks": ["warn", 3]
  }
}
```

### 1-4. package.json にスクリプトを追加

既存の `scripts`（`dev`, `build`, `start` 等）は残し、以下を追加する。
`lint` は Oxlint（Claude Code のハーネスが使う）、`lint:next` は Next.js 標準の ESLint
（`eslint-plugin-jsx-a11y` 等）。

```json
{
  "scripts": {
    "lint": "oxlint src",
    "lint:next": "next lint",
    "format": "biome format --write src",
    "typecheck": "tsc --noEmit"
  }
}
```

### 1-5. Lefthook でプリコミットフックを設定

`lefthook.yml` をプロジェクトルートに作成する。

```yaml
pre-commit:
  parallel: true
  commands:
    typecheck:
      run: pnpm typecheck
    lint:
      run: pnpm lint
    format-check:
      run: pnpm biome format src --diagnostic-level=error
```

```bash
pnpm lefthook install
```

### 1-6. コード品質ルール（可読性）

機械的に判定できる可読性はリンターに任せる（複雑度・関数長・ネスト深度は 1-2 / 1-3 の warn ルール）。
閾値は絶対の上限ではなく検知のトリガーであり、正当な理由がある場合は例外を許容する。

- warn を無視して積み上げない。超過したらまず分割・早期リターンを検討する
- 例外にする場合は `biome-ignore` / `oxlint-disable` コメントに理由を1行書く。理由のない抑制コメントは Codex レビューの指摘対象
- コメントは WHAT ではなく WHY を書く。コードを読めば分かることを繰り返さない
- 重複コードは3回目で共通化を検討する。2回の重複を先回りして抽象化しない
- 使われなくなったコード・export は削除する。コメントアウトで残さない

TSDoc は公開 API（`lib/` の export 関数等）にのみ書き、内部関数には強制しない。

---

## Phase 2: セキュリティ設定

### 2-0. サンドボックスを有効化する

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

どちらのモードでも settings.json の allow/deny ルールとフックは引き続き適用される。
`/sandbox` で「Sandbox is enabled」と表示されれば完了。

### 2-1. 機密ファイル保護の方式を確認する

注意: `.claudeignore` は Claude Code ではサポートされておらず、作成しても機能しない。
「保護されている」という誤解のもとになるため、過去に作成していた場合は削除してよい。

機密ファイル（`.env*` / 鍵ファイル / 認証情報）の保護は、次の2層で確定的に担保する。
このステップ自体で作成するファイルはなく、後続のステップで両層を設定する。

- `settings.json` の `permissions.deny`（2-2 の Read deny ルール）
- `protect-files.py` フック（2-4 の PreToolUse）

### 2-2. ~/.claude/settings.json（ユーザーレベル）

既存の内容がある場合はバックアップを取ってから上書きすること。

```json
{
  "enableAllProjectMcpServers": false,
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
タスクの方向性が信頼できて毎回クリックしたくない場面では `"autoEdit"` も選べるが、
外部コンテンツ・信頼できないリポジトリの作業時は `"ask"` に戻す。

### 2-3. .claude/settings.json（プロジェクトレベル）

PostToolUse フック（リンター自動実行）と PreToolUse フック（設定保護）を登録する。

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/post-ts-lint.sh"
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

### 2-4. フックスクリプトの作成

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

if echo "$COMMAND" | grep -qE 'rm[[:space:]]+-[a-z]*[rf]'; then
  echo "Blocked: rm with recursive/force flags is prohibited. Use trash or mv instead." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qE 'git[[:space:]]+push[[:space:]]+(origin[[:space:]]+)?(main|master)([[:space:]]|$)'; then
  echo "Blocked: direct push to main/master is prohibited. Use a feature branch." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qE '^[[:space:]]*sudo[[:space:]]+'; then
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

#### .claude/hooks/post-ts-lint.sh

ファイル編集後に Biome と Oxlint を自動実行し、残った違反をエージェントのコンテキストに注入する。

```bash
#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$input")"

case "$file" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

# 自動修正を先に実行
npx biome format --write "$file" >/dev/null 2>&1 || true
npx oxlint --fix "$file" >/dev/null 2>&1 || true

# 残った違反をエージェントに返す
diag="$(npx oxlint "$file" 2>&1 | head -20)"

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

リンター・ビルド・テスト・Storybook 設定ファイルへの編集を物理的にブロックする。

```bash
#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$input")"

protected="eslint.config biome.json pyproject.toml .prettierrc tsconfig.json lefthook.yml .oxlintrc.json next.config .storybook/main.ts vitest.config"

for p in $protected; do
  case "$file" in
    *$p*)
      echo "BLOCKED: $file は保護された設定ファイルです。リンター設定ではなくコードを修正してください。" >&2
      exit 2
      ;;
  esac
done
```

実行権限を付与する:

```bash
chmod +x .claude/hooks/bash-firewall.sh
chmod +x .claude/hooks/protect-files.py
chmod +x .claude/hooks/post-ts-lint.sh
chmod +x .claude/hooks/protect-config.sh
```

### 2-5. .claude/rules/security_code.md

コード生成・編集時に常時適用するセキュアコーディングルール（`base_security_code.md` の要約）。

```markdown
# セキュアコーディングルール

コードを生成・編集するすべての場面で常に適用する。
strict は絶対に生成しない・代替を提示する。warning は警告を添えて代替案。advisory は言及にとどめる。

## strict（必ず守る）

- TypeScript: `strict` / `noImplicitAny` / `strictNullChecks` / `noUncheckedIndexedAccess` を有効に保つ。`any` 禁止、不明な外部データは `unknown` + 型ガード
- 入力バリデーション: リクエストボディ・クエリ・ヘッダー・環境変数は必ず Zod の `safeParse` で検証。クライアントサイドのみの検証は禁止
- SQL: 文字列結合・テンプレートリテラルでクエリを組まない。パラメータ化クエリ / ORM の安全なメソッドを使う
- コマンド実行: `exec`/`execSync` にユーザー入力を渡さない。`spawn`/`spawnSync` に配列で渡す（`shell: true` 禁止）。`eval`/`new Function(string)` 禁止
- プロトタイプ汚染: 外部入力を `Object.assign`/`merge` に渡さない。`__proto__`/`constructor`/`prototype` を除去するかキーをサニタイズ
- XSS: HTML 挿入は DOMPurify でサニタイズ。`innerHTML` への直接代入禁止。テンプレートリテラルで HTML を組まない
- パストラバーサル: `path.resolve` で正規化し、ベースディレクトリ内に収まるか確認
- 認証: パスワードハッシュは `argon2`（`bcrypt` 可、`md5`/`sha1` 禁止）。比較は `crypto.timingSafeEqual`
- JWT: `alg: 'none'` 禁止。`algorithms` を明示して検証。シークレットは環境変数から
- シークレット: API キー・接続文字列をハードコードしない。環境変数から取得し起動時に検証
- クライアント露出: `NEXT_PUBLIC_` にシークレットを入れない（ビルド成果物に埋め込まれ全公開される）。サーバー専用モジュールには `import 'server-only'`。Server Component から Client Component への props にシークレット・内部情報を含めない
- 認可（アクセス制御 / IDOR）: ログイン確認だけでリソースアクセスを許さない。ユーザー入力（URL パラメータ・body の id 等）で特定されるリソースは、所有者・許可された役割かをデータアクセス点で検証する（Prisma は `findFirst({ where: { id: params.id, userId: session.user.id } })`。`findUnique` で id 直指定しない）。認可チェックは middleware / レイアウトに集約せず、各 Server Action / Route Handler / データアクセス関数で行う。一覧取得は where 句・RLS で絞り、全件取得後にアプリ側で filter しない。役割による分岐はクライアント送信値ではなくサーバー側セッション / DB 上の役割を根拠にする
- Cookie・CSRF: セッション Cookie は `httpOnly: true` / `secure: true` / `sameSite: 'lax'`。トークンの localStorage / sessionStorage 保存禁止。状態変更は Server Actions か POST の Route Handler で行い、Cookie 認証の Route Handler には Origin 検証か CSRF トークンを実装。GET / HEAD で状態変更しない
- ファイルアップロード: 拡張子・Content-Type は信頼せずマジックバイトで検証（`file-type` 等）。保存名はサーバーで生成（UUID）。サイズ上限必須。`public/` に直接保存せずオブジェクトストレージへ。ユーザー由来の SVG / HTML を同一オリジンでそのまま配信しない
- SSRF: ユーザー入力 URL のサーバーサイド fetch は allowlist（許可ドメイン列挙）で検証。プライベート IP・`169.254.169.254`・localhost を遮断。リダイレクトは `redirect: 'manual'` で止めるか追跡後に再検証

## warning

- HTTP セキュリティヘッダー: `next.config.ts` の `headers()` で HSTS / `X-Content-Type-Options: nosniff` / `X-Frame-Options: DENY` / `Referrer-Policy` / `Permissions-Policy` を全ルートに設定。CSP は nonce ベース推奨、最低限 `frame-ancestors 'none'` / `object-src 'none'`
- Express/Fastify には `helmet`。CORS は `origin: '*'` 禁止、許可オリジンを列挙
- 認証エンドポイントにはレート制限
- スタックトレース・内部パス・DB エラーをクライアントに返さない

## advisory

- 新規パッケージ追加前に `npm audit`、install 前後に差分提示、lockfile はコミット
- `postinstall` を含むパッケージは中身を提示して承認を得る

## セキュリティレビュー

以下のタイミングで `/security-review` を実行して報告する:
認証・認可コード / 外部入力を DB・shell に渡す処理 / 新規 API エンドポイント / 依存パッケージの追加・更新。

## 禁止パターン一覧（即時拒否）

\`\`\`
eval(...)
new Function(string)
exec(`...${userInput}...`)
innerHTML = userInput
Object.assign(target, JSON.parse(untrustedInput))
alg: 'none'
md5 / sha1 でのパスワードハッシュ
const secret = '...'
`SELECT ... WHERE id = ${userInput}`
findUnique({ where: { id: params.id } })  // 所有者条件のない id 直指定アクセス
NEXT_PUBLIC_XXX=<シークレット>  // 公開プレフィックスへのシークレット格納
localStorage.setItem('token', ...)  // 認証トークンの localStorage 保存
fetch(userProvidedUrl)  // 検証なしのユーザー指定 URL 取得（SSRF）
\`\`\`
```

### 2-6. Codex CLI 経路の防御設定

2-0〜2-5 の防御層はすべて Claude Code のフック機構に乗っており、`codex exec` で動く実装経路には効かない。
Phase 7 の開発パイプライン（Codex を実装エージェントに使う）を採用する場合は、
`base_security_env_setup.md` Step 5 に従って以下を設定する。

`~/.codex/config.toml`（ユーザーレベル。プロジェクト側の `.codex/config.toml` ではセキュリティ設定を
オーバーライドできない仕様のため、必ずユーザーレベルに置く）:

```toml
# 実装エージェントとしての既定: ワークスペース内のみ書き込み可・ネットワーク遮断
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = false   # デフォルトだが明示する

[shell_environment_policy]
inherit = "core"         # サブプロセスへ渡す環境変数を最小化
```

- Codex サンドボックスは `.git` / `.codex` / `.agents` を常時 read-only 化する。コミットは人間または Claude Code 側で行う
- `--dangerously-bypass-approvals-and-sandbox` と `--sandbox danger-full-access` での実装実行は禁止
- パス単位の制御（`.env*` の読み取り禁止・変更禁止領域の書き込み禁止）まで倒す場合の
  permissions プロファイルは `base_security_env_setup.md` Step 5 を参照
- GitHub 側の最終防衛線として、main の branch protection（直接 push 禁止・PR 必須・required checks）と
  CI の禁止パスチェック（変更禁止領域に diff があれば fail）を設定する

### 2-7. シークレットスキャンと SAST の CI

コミットされたコードに対する決定論的な検査として、gitleaks（シークレットスキャン）と
Semgrep（SAST）を CI に置く。どのエージェント・人間がコードを書いても効く層になる。

`.github/workflows/security-scan.yml`:

```yaml
name: security-scan
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # 履歴全体をスキャンするため
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # 組織（Organization）リポジトリでは GITLEAKS_LICENSE の設定が必要。個人リポジトリは不要

  semgrep:
    runs-on: ubuntu-latest
    container:
      image: semgrep/semgrep
    steps:
      - uses: actions/checkout@v4
      - run: semgrep scan --config p/default --config p/typescript --error
        env:
          SEMGREP_SEND_METRICS: "off"
```

- Actions は SHA でピン留めする（`base_security_npm_setup.md` セクション5）。`@v4` / `@v2` は
  可読性のための表記で、配置時にコミット SHA に置き換える
- 設定後、両ジョブを main の branch protection の required status checks に追加する
- ローカルの第一線として lefthook の pre-commit に `gitleaks git --pre-commit --staged --redact` を
  追加してもよい（`--no-verify` で回避できるため、強制は CI 側に置く）
- 誤検知は `# gitleaks:allow` / `// nosemgrep: <ルールID>` で個別に抑制。実際に検出された
  シークレットは履歴除去だけでなく必ず失効・ローテーションする

---

## Phase 3: テスト

`base_testing.md` の方針に加えて、Next.js（App Router + React）固有の設定を行う。

### 3-1. パッケージのインストール

```bash
pnpm add -D vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  happy-dom jest-axe @types/jest-axe
```

### 3-2. vitest.config.ts

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // coverage は base_testing.md を参照
  },
});
```

### 3-3. vitest.setup.ts

`@testing-library/jest-dom` のマッチャーと `jest-axe` の `toHaveNoViolations` を読み込む。

```ts
import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);
```

### 3-4. package.json にテストスクリプトを追加

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 3-5. async Server Component は E2E に回す

async Server Component（データフェッチを含む `async function` のコンポーネント）は、
現状 vitest（および React Testing Library）で描画できない。テストランナー側のサポートギャップなので、
E2E（Phase 4 の Playwright）で検証する。

- 同期 Server Component / Client Component → vitest + RTL で出力を検証
- async Server Component → Playwright E2E
- Server Action → async 関数として依存をモックし vitest で単体テスト
- `next/image`, `next/navigation` 等は vitest 側でモックする

---

## Phase 4: アクセシビリティ

`base_a11y.md` のレイヤー構成に従う。書いた瞬間（静的解析）→ コンポーネント → ページ → CI → レビューの順に網を重ねる。

### 4-1. Layer 1: 静的解析（eslint-plugin-jsx-a11y）

```bash
pnpm add -D eslint-plugin-jsx-a11y
```

`create-next-app@latest` が生成する Flat Config（`eslint.config.mjs`）に `jsx-a11y/recommended` を追加する。

```js
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:jsx-a11y/recommended",
  ),
];

export default eslintConfig;
```

旧来の `.eslintrc.json` 形式の場合:

```json
{
  "extends": ["next/core-web-vitals", "plugin:jsx-a11y/recommended"],
  "plugins": ["jsx-a11y"]
}
```

img の alt 欠落、label と input の未紐付け、不適切な ARIA などを書いた瞬間に検出できる。

### 4-2. Layer 2: コンポーネントテスト（jest-axe）

Phase 3 の vitest セットアップで `toHaveNoViolations` は読み込み済み。各コンポーネントのテストに追加する。

```tsx
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { Button } from "./Button";

describe("Button", () => {
  it("should have no axe violations", async () => {
    const { container } = render(<Button>送信</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

新規コンポーネントを作るたびにこのテストを追加するのをルールにする
（後から入れると大量の違反が出るので最初から入れる）。

### 4-3. Layer 3: E2E テスト（Playwright + axe-core）

```bash
pnpm add -D @playwright/test @axe-core/playwright
pnpm exec playwright install --with-deps chromium
```

```typescript
// tests/a11y/pages.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { name: "トップ", path: "/" },
  { name: "ログイン", path: "/login" },
];

for (const page of pages) {
  test(`${page.name}ページ: axe違反がないこと`, async ({ page: p }) => {
    await p.goto(page.path);
    const results = await new AxeBuilder({ page: p })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
```

自動検出できないキーボード操作は、主要フローに操作テストを書いて補う。

```typescript
test("モーダル: Escキーで閉じられること", async ({ page }) => {
  await page.goto("/some-page");
  await page.click('[data-testid="open-modal"]');
  await page.keyboard.press("Escape");
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
});
```

### 4-4. Layer 4: CI（GitHub Actions）

`.github/workflows/a11y.yml`:

```yaml
name: Accessibility

on:
  pull_request:
    branches: [main, develop]

jobs:
  component-a11y:
    name: Component a11y tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  page-a11y:
    name: Page a11y tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: pnpm exec playwright test tests/a11y/
        env:
          BASE_URL: http://localhost:3000
```

PR がマージできない状態を作ることで「後で直す」が起きにくくなる。

### 4-5. Layer 5: PR レビュープロセス

`.github/pull_request_template.md`:

```markdown
## 変更内容

<!-- 何を変更したか -->

## a11yチェック

UIの変更を含む場合、以下を確認してチェックを入れる。

- [ ] キーボードのみで全操作ができる
- [ ] フォーカスインジケータが視覚的に確認できる
- [ ] 画像・アイコンに適切なaltまたはaria-labelがある
- [ ] フォームのラベルとinputが紐づいている
- [ ] 色だけで情報を伝えていない
- [ ] スクリーンリーダーで主要な操作を確認した（できれば）

UIの変更がない場合: `N/A`
```

### 4-6. .claude/rules/a11y.md

UI コンポーネントを生成・編集するときに常時適用するルール。

```markdown
# アクセシビリティルール

UIコンポーネントを生成・編集するすべての場面で適用する。

## strict

- インタラクティブ要素には `button` / `a` / `input` / `select` / `textarea` を使う。`div` / `span` に `onClick` をつけない
- `img` には必ず `alt` を指定する。装飾画像は `alt=""` と `aria-hidden="true"` を併用する
- フォームの `input` / `select` / `textarea` には必ず `label` を紐付ける（`htmlFor` + `id`）
- フォームのエラーは `aria-describedby` で入力要素と紐付け、`aria-invalid` を設定する
- モーダル・ダイアログには `role="dialog"` と `aria-modal="true"` を設定し、Esc キーで閉じられるようにする

## warning

- 見出しの階層を飛ばさない
- 色だけで情報を伝えない
- ローディング状態は `aria-busy="true"` で伝える
- 動的に追加されるコンテンツには `role="alert"` または `aria-live="polite"` を使う

## advisory

- タッチターゲットは 44x44px 以上を目安にする
- アニメーションには `prefers-reduced-motion` で無効化オプションを提供する
```

> 補足: 自動検出できるのは WCAG 違反の 30〜40% 程度。フォーカス順序の妥当性やスクリーンリーダーの
> 読み上げ品質は、主要フローを月1回程度 VoiceOver / NVDA で手動確認して補う。

---

## Phase 5: Storybook

`base_storybook.md`（Storybook 10 + MCP）と `framework_nextjs.md` の Next.js 固有設定に従う。

### 5-1. Storybook のインストール

```bash
pnpm dlx storybook@latest init
```

Next.js プロジェクトが自動検出され、`@storybook/nextjs` または `@storybook/nextjs-vite` が選択される。

- `@storybook/nextjs`: Webpack ベース。`next.config.js` をそのまま引き継ぐ
- `@storybook/nextjs-vite`: Vite ベース。ビルドが速い。Next.js 15 以降で推奨

どちらでも `next/image`, `next/link`, `next/navigation`, `next/font` が Storybook 内で自動的に動作する。

### 5-2. addon-mcp のインストール

```bash
pnpm dlx storybook add @storybook/addon-mcp
```

これにより `http://localhost:6006/mcp` で MCP server が起動し、Manifest が自動生成され、
AI エージェントがコンポーネント情報を参照・テスト実行できるようになる。

### 5-3. react-docgen-typescript の設定

`.storybook/main.ts` で Props 情報精度を上げる。

```ts
const config: StorybookConfig = {
  // ...
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};
```

遅い場合は `react-docgen` に切り替えてもよい。

### 5-4. package.json スクリプト

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### 5-5. Claude Code の MCP 接続

Storybook の dev server を起動した状態で登録する。名前はプロジェクトを特定できる命名にする。

```bash
npx mcp-add --type http --url "http://localhost:6006/mcp" --scope project
```

手動で `.mcp.json` に追加する場合（`{project-name}` は置き換える）:

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

### 5-6. Story 作成ルール（Blueprint 側）

Story の書き方（基本方針・JSDoc・Manifest 管理・プロトタイプの story 化）は Blueprint 層が持つ。
このリポジトリでは `.claude/rules/storybook.md` を作らない。

- 参照先: `docs/product/stories/_rules.md`（正本: CCLauncher の `blueprint_stories_rules.md`）
- withAI 開発手法を採用していて上記が未配置の場合は、固定 bootstrap プロンプトの 2-1 を実行して配置する
- 採用しない場合は、Storybook の MCP ツール `get-storybook-story-instructions` が返す規約に従う

理由: プロトタイプを `src/prototypes/{slug}/` に story として置く運用と密結合しており、
slug・adopted・受け入れ条件といったプロダクト固有の概念に依存するため。

### 5-7. shadcn/ui コンポーネントの Story

shadcn/ui（`src/components/ui/`）はプロジェクトにコピーされたソースなので Story を書けるが、
**素の shadcn/ui には Story を書かない**（公式ドキュメントが十分な情報源）。
拡張・カスタマイズした場合、複数を組み合わせた複合コンポーネント、プロジェクト固有のバリエーションを
追加した場合のみ Story を書く。

### 5-8. protect-config.sh の確認

Phase 2-4 の `protect-config.sh` の保護対象に `.storybook/main.ts` が含まれていることを確認する
（既に含めてある）。

---

## Phase 6: UI モーションと UX 監査

`base_ui_motion.md` に従う。アニメーションは「見せるもの」ではなく「感じさせるもの」。
すべてのアニメーションは因果関係を表現し、`prefers-reduced-motion` を常に尊重する。

### 6-1. アニメーションライブラリのインストール

```bash
pnpm add motion
```

`motion`（旧 `framer-motion`）。import は `motion/react` から行う。

```tsx
import { motion, AnimatePresence } from "motion/react";
```

### 6-2. イージング変数と reduced-motion を globals.css に追加

`src/app/globals.css` に追記する。

```css
:root {
  --ease-spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring-smooth: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring-snappy: cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6-3. .claude/rules/ui_motion.md

```markdown
# UI モーションルール

アニメーションを実装・レビューするときに適用する。詳細は `.claude/docs/base_ui_motion.md` を参照。

## 原則

- すべてのアニメーションは因果関係を表現する。装飾だけのアニメーションは禁止
- ユーザーを待たせるためにアニメーションを使わない。遅いコードを隠さない
- `prefers-reduced-motion` は常に尊重する（CRITICAL 同等）
- 最初の100〜200msのレスポンス感を優先する（perceived performance）

## Timing & Easing

- micro（hover/toggle/press）150〜250ms / standard（モーダル・パネル）200〜350ms / complex（遷移）400〜600ms。1秒超禁止
- 退出は入場の60〜70%の長さ
- 入場は ease-out（`cubic-bezier(0.22, 1, 0.36, 1)`）、退場は ease-in。UI トランジションに linear 禁止

## What to Animate

- transform と opacity のみ。width/height/top/left/margin/padding は禁止（レイアウトスラッシング）
- `will-change` は開始前に付与し終了後に外す。常時 on 禁止
- レイアウトリフロー / CLS を起こさない

## Patterns

- 基本: `opacity: 0, y: 8px` → `opacity: 1, y: 0`
- モーダル: `scale(0.96) + opacity` で開く。`scale(0)` スタート禁止
- プレス: scale 0.97〜0.98（0.95以下はカートゥーン）
- stagger は 1項目 30〜60ms ずらす。グループは3〜7アイテムまで
- exit アニメーションを省略しない。同時に動かすフォーカル要素は1〜2個まで

## アニメーションを付けない場面

フォームバリデーションエラー / 重大なエラー状態 / 能動的に読んでいるコンテンツ /
ライブデータ・タイマー / セッション中に何百回も目にする要素。
```

### 6-4. Framer Motion パターン（参考）

```tsx
// フェード+ライズ（基本）
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 4 }}
  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
/>

// スプリング（ボタン/カード）
<motion.div
  whileTap={{ scale: 0.97 }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
/>

// AnimatePresence（exit対応）
<AnimatePresence mode="wait">
  <motion.div key={currentView} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} />
</AnimatePresence>
```


### 6-5. .claude/commands/ux-audit.md

汎用 UX ヒューリスティック（HIGH / MEDIUM）は常時適用ではなく、節目に走らせる監査として運用する。
再実行できる形にしておかないと変更後の劣化を検知できないため、スラッシュコマンドとして設置する。
コマンド本体と運用ルールは `.claude/docs/base_ux_audit.md` に記載されているので、
そのファイルの「セットアップ」節の内容をそのまま `.claude/commands/ux-audit.md` として配置する。

```bash
mkdir -p .claude/commands docs/ux-audit
```

- 実行: `/ux-audit [対象 or all]`
- 出力: `docs/ux-audit/{scope}.md`（上書き再生成。git 差分が劣化の検出結果になる）
- 実行タイミング（adopted 決定時・実装完了時など）は CLAUDE.md の読み分け表が持つ

### 6-6. .claude/commands/print.md（withAI 開発手法を採用する場合のみ）

ストーリーを入力に `src/prototypes/{slug}/` へデザイン案を複数生成する印刷コマンドを設置する。
コマンド本体と運用ルールは `.claude/docs/base_print.md` に記載されているので、
そのファイルの「セットアップ」節の内容をそのまま `.claude/commands/print.md` として配置する。

```bash
mkdir -p .claude/commands src/prototypes
```

- 実行: `/print <slug> [パターン数]`
- 入力: story の文脈層＋規範層 / 該当 layout spec / usage から選定した ui spec 群 / tokens
  （`target: modify` なら `pages` の対象ページの既存実装を追加）
- 出力: `src/prototypes/{slug}/` の複数パターン（Storybook stories。本番と同一リソースのみ、
  データは props / `args` 注入）
- 中間の計画確認を挟まず一発で最後まで走らせるコマンドとして定義してある。確認を足さない
- 実行の前提: Storybook（Phase 5）が動くこと、`docs/design/tokens/tokens.json` から
  `theme.css` が生成済みであること（トークンの値はセットアップ後に書くため、
  ここではコマンドの配置までを行う）

`/ux-audit` と同型の「ドキュメントを入力に取る再実行可能コマンド」。入力（story・ui spec・tokens）が
変わったら再実行して刷り直す。adopted 決定済みのファイルは再実行でも上書きされない。

---

## Phase 7: 開発パイプライン（spec 駆動 + Codex 連携）

`base_dev_pipeline.md` の開発フロー（spec 作成 → 設計レビュー → 凍結 → 実装 → 品質レビュー → 仕様突合）を
運用するためのファイルを配置する。パイプラインの本体・各 Phase の詳細は `base_dev_pipeline.md` を参照。

### 7-1. spec テンプレートの配置

`docs/specs/_template.md` を作成する（内容は `base_dev_pipeline.md` の「spec テンプレート」をコピー）。
機能ごとに `docs/specs/{機能名}.md` へコピーして使う。

### 7-2. AGENTS.md はここでは作らない（Phase 8-3 で生成する）

実装エージェント（Codex）が読む `AGENTS.md` は手書きしない。`CLAUDE.md` の読み分け表と
`.claude/rules/` の常時ルールから一方向生成する生成物として扱う（手編集禁止）。

ソースである `CLAUDE.md` と `.claude/rules/project_conventions.md` は Phase 8 で作るため、
生成は **8-3** で行う。ここでは順序だけ確認しておく。

AGENTS.md は guidance であって enforcement ではない。守りの実体が 2-6 の設定
（Codex サンドボックス・branch protection・CI 禁止パスチェック）にあることを確認する。

### 7-3. @codex review の有効化（推奨: 二重化）

`base_codex_review.md` の「GitHub PR での @codex review」に従い設定する。

1. Codex cloud を有効化（ChatGPT アカウントと GitHub リポジトリを接続）
2. [Codex の設定画面](https://chatgpt.com/codex/settings/code-review)でリポジトリの "Code review" をオン
3. "Automatic reviews" をオンにして PR オープン時に自動で走らせる（パイプラインの「品質レビュー」フェーズの実体）

### 7-4. 品質レビューと仕様突合の分離（運用ルール）

- 品質レビュー（バグ・セキュリティ・保守性）は実装と別インスタンスで行う。@codex review は
  PR 単位で新しいインスタンスが走るためこの原則を満たす
- 仕様突合（受け入れ条件の充足確認）は設計エージェント（Claude Code）が spec を正として行う
- Codex CLI のレビューコマンド・指摘の判断基準・オシレーション検出は `base_codex_review.md` に従う

---

## Phase 8: 常時適用ルールと CLAUDE.md / AGENTS.md

分担の原則:

- **常時適用されるルールは `.claude/rules/`** に置く（毎セッション自動で読まれる）
- **CLAUDE.md 本体は「タスク種別 → 参照ファイル」の読み分け表**。手順やルールを直接書かない
- **AGENTS.md は上の2つからの生成物**。手書きせず、手編集もしない（8-3）

CLAUDE.md にルールを書き込むと、量が増えるほど毎セッションのコンテキストを圧迫し、
かつ `.claude/rules/` 側と二重管理になって片方が古くなる。CLAUDE.md は地図であって、マニュアルではない。

この順序でしか作れない。`AGENTS.md` はソース（8-1・8-2）が揃ってからでないと生成できないため、
8-1 → 8-2 → 8-3 の順に進める。

### 8-1. .claude/rules/project_conventions.md

セキュリティ・a11y・モーション以外の、プロジェクト共通の常時適用ルール。

```markdown
# プロジェクト規約

## コーディング

- `any` 型の使用禁止。不明な場合は `unknown` を使い型ガードで絞り込む
- named export を使う（default export は避ける。ただし Next.js の page / layout / route は除く）
- コンポーネントは `src/components/` に配置する。shadcn/ui のコンポーネントは `src/components/ui/`
- Server Components をデフォルトとし、クライアント状態が必要な場合のみ `"use client"` をつける
- 新しいコンポーネントを作ったら Story と jest-axe テストを書く（shadcn/ui の素のコンポーネントは除く）
- DB を使う場合、スキーマから型を自動生成する仕組みを必ず入れる（手書きの型とスキーマの二重管理をしない）

## 変更禁止

- `eslint.config.*`、`biome.json`、`tsconfig.json`、`next.config.*`、`.storybook/main.ts`、`vitest.config.*` などの設定ファイルは編集禁止
- 生成物は手編集しない（`src/styles/theme.css`、`tests/coverage-map.md`）。ソースを直して再生成する
- `git commit --no-verify` 禁止

## 開発パイプライン（必須ゲート）

- 受け入れ条件が3件以上になる機能・変更は、`.claude/docs/base_dev_pipeline.md` のパイプライン
  （spec 作成 → 設計レビュー → 凍結 → 実装 → 品質レビュー → 仕様突合）に従う
- 受け入れ条件が3件未満の小さな変更はパイプラインをスキップしてよい。ただしスキップした事実を
  コミットメッセージまたは PR に明記する
- 凍結後の spec 変更はユーザーの明示的な承認が必要

## セキュリティレビュー

認証・認可コード / 外部入力を DB・shell に渡す処理 / 新規 API エンドポイント /
依存パッケージの追加・更新 のタイミングで `/security-review` を実行して報告する。

## レビュー観点（@codex review が参照）

- Prisma トランザクションが必要な箇所に抜け漏れがないか
- ファイルアップロード処理でマジックナンバー検証が行われているか
- PII のログ出力がないか
- スキーマ / migration 変更がある場合、既存 API・型定義との整合と後方互換性
- 新規・変更されたロジック層（Server Action / API / ユーティリティ）に対応するテストがあるか
- 理由の書かれていない lint 抑制コメント（biome-ignore / oxlint-disable）がないか
- spec の受け入れ条件とスコープに照らして、スコープ外の変更が混ざっていないか
```

レビュー観点はプロジェクトの技術スタックに合わせて調整する。`AGENTS.md` に直接書かず
このファイルに置くのは、`AGENTS.md` が生成物であり、常時ルールが 8-3 の生成で
インライン展開されるため（ソースを一箇所に保つ）。

### 8-2. CLAUDE.md

以下の内容をプロジェクトルートの `CLAUDE.md` として配置する。
`{project-name}-sb-mcp` は Phase 5 で決めた MCP server 名に書き換えること。

````markdown
# CLAUDE.md

このファイルは読み分け表。作業を始める前に、対応するファイルを必ず読むこと。
ルールそのものはここに書かない（常時適用ルールは `.claude/rules/`、手順は `.claude/docs/`）。

## プロジェクト概要

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui

```
src/
├── app/              # App Router（page, layout, route）
├── components/       # UI コンポーネント
│   └── ui/           # shadcn/ui コンポーネント
├── prototypes/       # 検討用プロトタイプ（Storybook story）
├── lib/              # ユーティリティ・ヘルパー
├── hooks/            # カスタムフック
└── types/            # 型定義
```

決定の経緯は `/docs/adr/` の ADR を参照。

## コマンド

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # プロダクションビルド
pnpm lint         # リント（Oxlint）
pnpm lint:next    # リント（Next.js ESLint + jsx-a11y）
pnpm typecheck    # 型チェック（tsc --noEmit）
pnpm format       # フォーマット（Biome）
pnpm test         # テスト（vitest run）
pnpm storybook    # Storybook 起動
```

## 完了の定義

- テストがすべて通ること／新規・変更したロジック層に対応するテストが存在すること
- リントエラー・型エラーがないこと
- `pnpm build` が成功すること

タスク完了時は `pnpm lint && pnpm typecheck && pnpm build` をすべて実行し、エラーがない状態でコミットする。

## 手編集禁止ファイル

| ファイル | ソース |
|---|---|
| `src/styles/theme.css` | `docs/design/tokens/tokens.json`（`pnpm tokens:build`） |
| `tests/coverage-map.md` | テストコードのアノテーション |
| `docs/ux-audit/*.md` | `/ux-audit` の実行結果 |
| `docs/design/` 配下 | 上流（Printer）。逸脱は `docs/design/_override.md` に書く |
| `AGENTS.md` | この `CLAUDE.md` + `.claude/rules/`（`/agents-md` で再生成） |
| 設定ファイル一式 | `.claude/rules/project_conventions.md` の変更禁止リストを参照 |

## 参照ドキュメント索引

IMPORTANT: 以下の作業を始める前に、対応するファイルを必ず読むこと。

| 作業 | 読むファイル |
|---|---|
| 機能実装の開始（spec 作成〜仕様突合） | `.claude/docs/base_dev_pipeline.md` |
| Codex CLI のコマンド・レビュー判断基準 | `.claude/docs/base_codex_review.md` |
| ストーリーの作成・変更 | `docs/product/stories/_rules.md` と `_template.md` |
| 目的・コア価値・優先順位の変更 | `docs/product/deck.md`（問いの台本は `docs/product/_deck_template.md`） |
| ページ・機能の増減 | `docs/product/content-list.md`（挙動は書かない） |
| どのドキュメントを書き換えるかの判断 | `docs/_rules.md` |
| コンポーネントの使いどころ・見た目の決定 | `docs/design/ui/{component}.md`、`docs/design/_rules.md` |
| 画面構成・レスポンシブの決定 | `docs/design/layout/{pattern}.md` |
| トークンの追加・変更 | `docs/design/tokens/_rules.md` |
| UI コンポーネントの実装・レビュー | 該当する `docs/design/ui/{component}.md`（固有仕様）と `.claude/docs/base_ux_checklist_high.md`（一般原則）の両方 |
| ページ・フローの実装 | 該当する `docs/product/stories/{slug}.md`（受け入れ条件が実装対象）と `docs/design/layout/{pattern}.md` |
| デザイン案の生成（プロトタイプの印刷） | `/print {slug}`（運用は `.claude/docs/base_print.md`） |
| UX ヒューリスティック監査の実行 | `/ux-audit`（運用は `.claude/docs/base_ux_audit.md`） |
| Story の作成・修正 | `docs/product/stories/_rules.md`（Storybook 環境は `.claude/docs/base_storybook.md`） |
| アニメーション・インタラクションの実装 | `.claude/docs/base_ui_motion.md` |
| テストの作成・修正 | `.claude/docs/base_testing.md` |
| a11y 対応・検証 | `.claude/docs/base_a11y.md` |
| フレームワーク固有の規約・設定の確認 | `.claude/docs/framework_nextjs.md` |
| ブラウザでの実行時デバッグ・パフォーマンス計測 | `.claude/docs/base_chrome_devtools.md` |
| SEO・メタデータの実装 | `.claude/docs/base_seo.md` |
| パフォーマンス改善・予算の確認 | `.claude/docs/base_performance.md` |
| リント・フォーマット・フックの設定変更 | `.claude/docs/base_harness.md` |
| CLAUDE.md 自体の編集 | `.claude/docs/base_claude_md_knowledge.md`（編集後は `/agents-md` で AGENTS.md を再生成する） |
| AGENTS.md の再生成・生成仕様の確認 | `.claude/docs/base_agents_md.md`（実行は `/agents-md`） |

配置していないファイルの行はセットアップ時に削除する。

## 節目に実行すること

| タイミング | 実行 |
|---|---|
| ストーリーの文脈層を書き終えたとき | `/print {slug}`（受け入れ条件の確定より先に案を出す） |
| ui spec / layout spec / tokens を大きく更新したとき | 未実装ストーリーの `/print {slug}` 再実行 |
| プロトタイプの adopted を決めたとき | `/ux-audit {slug}` |
| 機能の実装完了時 | `/ux-audit {slug}` と仕様突合（`base_dev_pipeline.md`） |
| リリース前 | `/ux-audit all` |

## Storybook

UI コンポーネントの実装・修正時は `{project-name}-sb-mcp` MCP ツールで
コンポーネント・ドキュメント情報を確認してから作業する。

- Props を使う前に必ず `get-documentation` で確認する。推測で使わない
- `list-all-documentation` で利用可能なコンポーネント一覧を取得できる
- 作業後は `run-story-tests` を実行し、失敗があれば修正してから完了とする

## プロジェクト属性（preflight の結果）

`base_preflight.md` を実行した結果をここに記録する。属性が変わる機能追加（例：LLM 連携を後から足す、ユーザー登録を追加する）を行う際は、該当 Step のみ再実行してこのセクションを更新する。

- scope: production / prototype のいずれか
- LLM 連携: あり / なし（あればプロバイダ・リージョン・学習 opt-out の状態）
- 外部コスト: 該当する外部 API とスペンディングキャップの設定状況
- 個人情報: 扱うデータと適用法（GDPR / APPI / CCPA 等）
- スクレイピング: あり / なし（あれば対象サイトと robots.txt / ToS の確認結果）
- プロトタイプ省略項目: prototype で省略した Step があれば列挙
- preflight 実行日: YYYY-MM-DD
````

withAI 開発手法（Blueprint / Printer）を採用していない場合、`docs/product/` `docs/design/` の行、
`/print` の行、「節目に実行すること」の `/print`・adopted 行は削除する。

### 8-3. AGENTS.md の生成

実装エージェント（Codex）向けの `AGENTS.md` を、8-2 の `CLAUDE.md` と `.claude/rules/` から生成する。
手書きしない。生成仕様・テンプレート・抽出ルールは `.claude/docs/base_agents_md.md` が正。

1. `.claude/docs/base_agents_md.md` の「セットアップ」節の内容をそのまま
   `.claude/commands/agents-md.md` として配置する
2. `/agents-md` を実行して、プロジェクトルートに `AGENTS.md` を生成する
3. 生成結果を確認する（`.claude/rules/` の中身がインライン展開されていること、
   参照表が実装系の行だけになっていること）

```bash
mkdir -p .claude/commands
```

- ソース: `CLAUDE.md`（読み分け表・手編集禁止一覧・完了の定義）+ `.claude/rules/` の全ファイル
- 再生成のトリガー: 上記ソースを変更したとき（上流からの再同期を含む）
- `AGENTS.md` は手編集しない。内容を変えたいときはソースを直して `/agents-md` を再実行する

Codex は `AGENTS.md` を自動で読むが `.claude/rules/` は読まない。だからルールは参照リンクではなく
インライン展開する。ここを参照リンクにすると、ルールが読まれないまま実装が始まる。

---

## Phase 9: 動作確認

### Next.js の確認

- [ ] `pnpm dev` で開発サーバーが起動する
- [ ] `pnpm build` がエラーなく完了する
- [ ] shadcn/ui のコンポーネントが `src/components/ui/` に存在する

### ハーネスの確認

- [ ] `.ts` / `.tsx` ファイルを編集したときに Biome のフォーマットが自動適用される
- [ ] Oxlint のリントが走り、エラーがあればコンテキストに注入される
- [ ] `biome.json` / `next.config.*` 等の保護対象ファイルを編集しようとするとブロックされる
- [ ] コミット時に Lefthook が型チェックとリントを実行する

### セキュリティの確認

- [ ] サンドボックスが有効化されている（`/sandbox` で確認）
- [ ] `.claudeignore` に依存していない（deny ルールと `protect-files.py` で機密ファイルが保護されている）
- [ ] `~/.claude/settings.json` の JSON 構文が正しい（`jq .` で確認）
- [ ] `disableBypassPermissionsMode` が `"disable"` になっている
- [ ] `enableAllProjectMcpServers` が `false` になっている
- [ ] `.claude/hooks/` の4ファイルが存在し、実行権限がある
- [ ] `.claude/rules/security_code.md` が配置されている
- [ ] `.github/workflows/security-scan.yml`（gitleaks / Semgrep）が配置され、required checks に登録されている（2-7）

### テストの確認

- [ ] `pnpm test` で vitest が実行され、同期コンポーネント・Server Action の単体テストが通る
- [ ] jest-axe の `toHaveNoViolations` がコンポーネントテストで使える

### アクセシビリティの確認

- [ ] `eslint-plugin-jsx-a11y` が ESLint 設定に組み込まれている（`pnpm lint:next` で確認）
- [ ] `tests/a11y/` の Playwright + axe テストが実行できる
- [ ] `.github/workflows/a11y.yml` が配置されている
- [ ] `.claude/rules/a11y.md` が配置されている

### Storybook の確認

- [ ] `pnpm storybook` で Storybook が起動する
- [ ] `@storybook/nextjs` または `@storybook/nextjs-vite` がフレームワークとして設定されている
- [ ] `http://localhost:6006/mcp` にアクセスすると MCP server のページが表示される
- [ ] Claude Code から `list-all-documentation` ツールを呼び出してコンポーネント一覧が返る
- [ ] Story 作成ルールの参照先（`docs/product/stories/_rules.md`）が存在する、または MCP の `get-storybook-story-instructions` が使える

### UI モーションの確認

- [ ] `motion`（framer-motion）がインストールされている
- [ ] `src/app/globals.css` にイージング変数と `prefers-reduced-motion` の指定がある
- [ ] `.claude/rules/ui_motion.md` が配置されている

### UX 監査の確認

- [ ] `.claude/commands/ux-audit.md` が配置されている
- [ ] `/ux-audit all` が実行でき、`docs/ux-audit/all.md` が生成される
- [ ] `.claude/rules/base_ux_checklist_critical.md`（常時適用）と `.claude/docs/base_ux_checklist_high.md`（監査用）が配置先どおりに置かれている

### 印刷コマンドの確認（withAI 開発手法を採用した場合）

- [ ] `.claude/commands/print.md` が配置されている
- [ ] `docs/product/_deck_template.md` `docs/product/stories/_template.md` `docs/design/` 配下の
      規約・テンプレが配置されている（未配置なら固定 bootstrap プロンプトの 2-1 を実行する）
- [ ] `src/prototypes/` が存在する
- [ ] `/print` の実行は最初のストーリーができてから（この時点では配置確認のみ）

### MCP サーバーの確認

- [ ] `~/.claude.json` に不要な MCP サーバーが登録されていない
- [ ] `.mcp.json` に不審な MCP サーバーがない（Storybook 以外）

### 開発パイプラインの確認

- [ ] `docs/specs/_template.md` が配置されている
- [ ] @codex review の "Automatic reviews" がオンになっている
- [ ] `~/.codex/config.toml` に workspace-write とネットワーク遮断が設定されている（2-6）
- [ ] main の branch protection と CI 禁止パスチェックが設定されている

### 常時適用ルールと CLAUDE.md の確認

- [ ] `.claude/rules/project_conventions.md` が配置されている（開発パイプラインの必須ゲートとレビュー観点を含む）
- [ ] プロジェクトルートに `CLAUDE.md` が配置されている（`{project-name}-sb-mcp` を書き換え済み）
- [ ] CLAUDE.md 本体に手順やルールを直接書いていない（読み分け表・コマンド・完了の定義・手編集禁止一覧に収まっている）
- [ ] 参照ドキュメント索引の、配置していないファイルの行を削除済み

### AGENTS.md の確認

- [ ] `.claude/commands/agents-md.md` が配置されている
- [ ] `/agents-md` が実行でき、プロジェクトルートに `AGENTS.md` が生成される
- [ ] `AGENTS.md` に `.claude/rules/` の中身がインライン展開されている（参照リンクで済ませていない）
- [ ] `AGENTS.md` のタスク別参照表が実装系（`src/` / `tests/` を触る作業）の行だけになっている
- [ ] `AGENTS.md` 冒頭に生成物ヘッダ（ソース・再生成コマンド・生成日）がある
- [ ] `CLAUDE.md` の手編集禁止ファイル一覧に `AGENTS.md` の行がある

---

## 運用ルール

- エージェントが新しい種類のミスをしたら、それを防ぐテストまたはリンタールールを追加する。一度追加したルールはすべての将来のセッションに適用される（ハーネスの複利効果）
- 新しいコンポーネントを作ったら必ず Story と jest-axe テストを書く。Story がないコンポーネントは Manifest に載らずエージェントから見えない
- Storybook の MCP server は開発中常時起動しておく
- async Server Component は vitest では描画できないため Playwright E2E で検証する
- お金が動くサービスの認証情報は AI がアクセスできる環境から完全に隔離する
- 外部から取得した CLAUDE.md / settings.json / .mcp.json は中身を読んでから使う。Web コンテンツ・他者の設定ファイルは信頼できない入力として扱う

---

## 運用開始後の参照先

- 自動化・CI/CD の拡張と運用改善のロードマップは `docs/base_automation_roadmap.md` を参照する。
- 障害・インシデント発生時の対応手順は `docs/base_ops_incident.md` を参照する。

---

## Launcher 工程の続き（配置のあとの対話）

ここまでは「プロジェクトを知らなくても書けるもの」の配布と設定。
Launcher 工程は**配置して終わりではなく**、配布したテンプレを埋めるところまでを含む。
以下はプロジェクトを知らないと書けないため配布していない（空テンプレは置かない）。

**この順で**進める。順序に意味がある（後のものが前のものを素材にするため、飛ばすと白紙から書くことになる）。
AI の役割は、人間にしか書けない中身を引き出して言語化することで、代わりに決めることではない。

withAI 開発手法（Blueprint / Printer）を採用していない場合は、この節はスキップしてよい。

### 1. deck インタビュー → `docs/product/deck.md`

目的・ビジョン・コア価値・ターゲット、コア価値間のトレードオフ序列。
この体系で唯一 AI に委譲できない核で、ここが決まらないと以降のすべての判断に基準が存在しない。

**やり方**（Claude Code に対して「deck インタビューを始めてください」と言う）:

1. AI が `docs/product/_deck_template.md` の「埋めるための問い」を上から順に聞く
2. 人間が答える。答えが出ない問いは、出ないという事実を確認して次へ進む（推測で埋めない）
3. AI は答えを構造（目的 / ビジョン / ターゲット / コア価値 / トレードオフ序列 / やらないこと）に整形して提示する
4. トレードオフ序列は具体的な場面を1つ挙げてもらってから一般化する。抽象論では決まらない
5. 人間が採否を確認する
6. **全項目が埋まった時点で** `docs/product/deck.md` を生成する。空欄・「TBD」が残る状態では作らない

### 2. `docs/product/content-list.md`

ページ一覧と、ページごとにやれること。

- 各項目はストーリーへの参照（slug）のみ。挙動の定義は書かない
- E2E の網羅チェックリストとして使う。ストーリーの `pages` はここの項目を参照する
- 新規画面のストーリーを書くときも、先にここへページを追加してから参照する

### 3. 最初のストーリー `docs/product/stories/{slug}.md`

`docs/product/stories/_template.md` をコピーして書く。規約は同ディレクトリの `_rules.md`。

1. 文脈層（ゴール・フリクション）を人間が書く。frontmatter の `target` と `pages` を決める
2. `/print {slug}` でプロトタイプを複数パターン生成する（Storybook story として並ぶ）
   - 印刷は semantic トークンだけで組むため、トークンが未生成ならここで 4 を先に済ませる
     （文脈層を書くところまでは先行できる）
3. 人間が触って adopted を1つ選び、選定理由を1行書く
4. 受け入れ条件を、文脈層と adopted プロトタイプを素材に AI がドラフトし、人間が落とす
5. adopted を決めたら `/ux-audit {slug}` で採用案を監査する

### 4. トークンの値生成 `docs/design/tokens/tokens.json`

`docs/design/tokens/_rules.md` の型（primitive → semantic → component）に従う。

- 値はプロジェクト固有なので配布されない。層構造・命名規約・設計根拠は配布済み
- semantic の命名が実質の判断点（名前が usage をエンコードする）。命名候補は AI、承認は人間
- 生成後 `pnpm tokens:build` で `src/styles/theme.css` を作る（`theme.css` は手編集しない）
- `/print` は semantic トークンしか使わないため、ここが空だと印刷結果が組めない

以降は 3 と 4 を繰り返しながら実装に入る。実装の進め方は `.claude/docs/base_dev_pipeline.md`。
実装（`src/` / `tests/`）は Codex が担当し、adopted プロトタイプを出発点に本実装へ昇格させる
（配線は `AGENTS.md`、生成仕様は `.claude/docs/base_agents_md.md`）。
