# project_bootstrap_guide_astro

空のリポジトリから Astro プロジェクトを立ち上げ、
Claude Code のハーネス・セキュリティ・テスト・アクセシビリティ・UI モーション・Codex 連携まで
一気にセットアップする手順。Phase 0 から順番に実行すれば完了する。

CMS はプロジェクトごとに異なるため、Phase 0 の中でいずれかを選択する。
選択後、該当セクション以外の CMS 手順を削除してから進めること。

各設定の背景・理由は以下を参照:

- ハーネスの設計思想 → `base_harness.md`
- セキュリティ（環境制御）→ `base_security_env.md` / `base_security_env_setup.md` / `base_security_env_guide.md`
- セキュリティ（生成コード）→ `base_security_code.md` / `base_security_code_guide.md`
- アクセシビリティ → `base_a11y.md`
- UI モーション → `base_ui_motion.md`
- Codex 連携 → `base_codex_review.md`
- フレームワーク固有 → `framework_astro.md`

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

## Phase 0: Astro プロジェクト初期化

### 0-1. プロジェクト作成

```bash
pnpm create astro@latest . \
  --template minimal \
  --typescript strict \
  --install \
  --no-git
```

- `--template minimal`: 最小構成から始める
- `--typescript strict`: strict モードで TypeScript を有効化

### 0-2. Tailwind CSS の追加

```bash
pnpm astro add tailwind
```

対話プロンプトで `Yes` を選択すると `tailwind.config.mjs` と `src/styles/global.css` が生成される。

### 0-3. tsconfig.json の確認

`create astro` が生成した `tsconfig.json` に `strict` が含まれていることを確認する。
`noUncheckedIndexedAccess` は含まれないため手動で追加する（`base_security_code.md`）。

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "noUncheckedIndexedAccess": true
  }
}
```

### 0-4. CMS の選択とセットアップ

以下から1つ選択し、該当セクションの手順を実行する。
選択後、このセクション全体を選択した CMS の内容に置き換えること。

| CMS | 向いているケース |
|---|---|
| A: ローカル Markdown | コンテンツ量が少なく、開発者がコンテンツを管理する |
| B: microCMS | 日本語コンテンツ主体・非エンジニアが編集する |
| C: Sanity | 構造化コンテンツ・リアルタイム共同編集が必要 |
| D: Storyblok | ビジュアルエディタが必要 |
| E: Contentful | 大規模・多言語・エンタープライズ |

#### A: ローカル Markdown（CMS なし）

追加インストール不要。`src/content.config.ts` の Content Collections のみ使用する。

```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string().transform((s) => new Date(s)),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
  }),
})

export const collections = { blog }
```

#### B: microCMS

```bash
pnpm add microcms-js-sdk
```

```typescript
// src/lib/microcms.ts
import { createClient } from 'microcms-js-sdk'

export const client = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY,
})
```

`.env.local` に追加:

```
MICROCMS_SERVICE_DOMAIN=your-service-domain
MICROCMS_API_KEY=your-api-key
```

Content Layer API でローダーとして組み込む場合:

```typescript
// src/content.config.ts
import { defineCollection } from 'astro:content'
import { client } from './src/lib/microcms'

const blog = defineCollection({
  loader: async () => {
    const data = await client.get({ endpoint: 'blog' })
    return data.contents.map((item) => ({ id: item.id, ...item }))
  },
})
```

#### C: Sanity

```bash
pnpm astro add sanity
```

`astro.config.mjs` に追加:

```typescript
import { defineConfig } from 'astro/config'
import sanity from '@sanity/astro'

export default defineConfig({
  integrations: [
    sanity({
      projectId: import.meta.env.SANITY_PROJECT_ID,
      dataset: import.meta.env.SANITY_DATASET,
      useCdn: false,
    }),
  ],
})
```

`.env.local` に追加:

```
SANITY_PROJECT_ID=your-project-id
SANITY_DATASET=production
```

#### D / E: Storyblok / Contentful

公式ドキュメントに従ってセットアップする:

- Storyblok: https://docs.astro.build/en/guides/cms/storyblok/
- Contentful: https://docs.astro.build/en/guides/cms/contentful/

### 0-5. astro sync の実行

Content Collections のスキーマや CMS ローダーを定義したら型を生成する。

```bash
pnpm astro sync
```

### 0-6. git 初期化とコミット

```bash
git init
git add -A
git commit -m "init: Astro + Tailwind + {選択した CMS}"
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

可読性系のルールは warn にとどめ、正当な例外は許容する（1-6 のコード品質ルールを参照）。

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

Oxlint は Astro ファイルの script ブロックに対応しているため `.astro` も対象に含める。

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "sync": "astro sync",
    "lint": "oxlint src --extension .ts,.tsx,.astro",
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

機械的に判定できる可読性はリンターに任せる（複雑度・関数長・ネスト深度は上記 warn ルール）。
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
過去にこの手順で `.claudeignore` を作成していた場合は削除してよい（残っていても無害だが、
「保護されている」という誤解のもとになる）。

機密ファイル（`.env*` / 鍵ファイル / 認証情報）の保護は、次の2層で確定的に担保する:

- `settings.json` の `permissions.deny`（2-2 の Read deny ルール）
- `protect-files.py` フック（2-4 の PreToolUse）

このため 2-1 での作成作業はない。2-2 に進む。

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
`.astro` も対象に含める。

```bash
#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$input")"

case "$file" in
  *.ts|*.tsx|*.astro) ;;
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

リンター・ビルド・テスト設定ファイルへの編集を物理的にブロックする。

```bash
#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$input")"

protected="eslint.config biome.json pyproject.toml .prettierrc tsconfig.json lefthook.yml .oxlintrc.json astro.config tailwind.config vitest.config"

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

- TypeScript: `strict` / `noImplicitAny` / `strictNullChecks` / `noUncheckedIndexedAccess` を有効に保つ。`any` 禁止、不明な外部データ（CMS レスポンス含む）は `unknown` + 型ガード、または Zod で検証
- 入力バリデーション: 外部入力・CMS レスポンス・環境変数は必ず Zod の `safeParse` で検証。クライアントサイドのみの検証は禁止
- SQL: 文字列結合・テンプレートリテラルでクエリを組まない。パラメータ化クエリ / ORM の安全なメソッドを使う
- コマンド実行: `exec`/`execSync` にユーザー入力を渡さない。`spawn`/`spawnSync` に配列で渡す（`shell: true` 禁止）。`eval`/`new Function(string)` 禁止
- プロトタイプ汚染: 外部入力を `Object.assign`/`merge` に渡さない。`__proto__`/`constructor`/`prototype` を除去するかキーをサニタイズ
- XSS: Astro はデフォルトで自動エスケープする。`set:html` に渡す前に DOMPurify でサニタイズする。`innerHTML` への直接代入禁止
- パストラバーサル: `path.resolve` で正規化し、ベースディレクトリ内に収まるか確認
- 認証: パスワードハッシュは `argon2`（`bcrypt` 可、`md5`/`sha1` 禁止）。比較は `crypto.timingSafeEqual`
- 認可・アクセス制御（IDOR / オブジェクトレベル認可）: ユーザー入力（URL パラメータ・body の id 等）で特定されるリソースへのアクセスは、必ず「そのリソースの所有者・許可された役割か」をデータアクセス点で検証する。ログイン済みの確認だけで id 直指定を許さない（取得条件に `userId` 等を含める）。認可チェックは middleware / レイアウトに集約せず、Server Action / Route Handler / データアクセス関数の各実行点で行う（middleware は画面誘導の補助であり認可の境界にしない）。一覧取得は where 句・RLS で絞り、全件取得後にアプリ側で filter しない。役割（admin 等）の判定はクライアント送信値ではなくサーバー側のセッション・DB 上の役割を根拠にする
- JWT: `alg: 'none'` 禁止。`algorithms` を明示して検証。シークレットは環境変数から
- シークレット: API キー・接続文字列をハードコードしない。環境変数（`import.meta.env`）から取得し起動時に検証。`PUBLIC_` 接頭辞のない値はクライアントに渡さない

## warning

- API ルート（SSR / エンドポイント）で外部入力を扱う場合はレート制限・CORS を検討する
- スタックトレース・内部パス・DB エラーをクライアントに返さない

## advisory

- 新規パッケージ追加前に `npm audit`、install 前後に差分提示、lockfile はコミット
- `postinstall` を含むパッケージは中身を提示して承認を得る

## セキュリティレビュー

以下のタイミングで `/security-review` を実行して報告する:
認証・認可コード / 外部入力を DB・shell に渡す処理 / 新規 API エンドポイント・CMS 連携 / 依存パッケージの追加・更新。

## 禁止パターン一覧（即時拒否）

\`\`\`
eval(...)
new Function(string)
exec(`...${userInput}...`)
set:html={userInput}  // サニタイズなし
const secret = '...'
`SELECT ... WHERE id = ${userInput}`
findUnique({ where: { id: params.id } })  // 所有者条件のない id 直指定アクセス
\`\`\`
```

---

## Phase 3: テスト

`base_testing.md` の方針に加えて、Astro 固有の設定を行う。
Astro は静的サイト寄りの用途が多く、ロジックが薄いプロジェクトでは vitest を入れない判断もあり得る
（`lib/` にユーティリティや CMS クライアントの加工処理が出てきた段階で導入する）。

### 3-1. パッケージのインストール

```bash
pnpm add -D vitest
```

### 3-2. vitest.config.ts

Astro は vitest 用に `getViteConfig` を提供しており、Astro プロジェクトの設定を引き継いだ状態でテストできる。

```ts
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    globals: true,
    // coverage は base_testing.md を参照
  },
});
```

### 3-3. package.json にテストスクリプトを追加

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 3-4. 何をテストするか

- `lib/` のユーティリティ・CMS レスポンスの加工関数 → vitest 単体（外部 CMS 呼び出しはモックする）
- Content Collections のスキーマ（Zod）→ vitest 単体で正常系・異常系を検証する
- `.astro` コンポーネントの描画 → Container API（`experimental_AstroContainer`）で文字列にレンダリングして検証できるが、見た目は Playwright + 人手に寄せる
- ページ全体・遷移・フォーム送信 → Playwright E2E（Phase 4）

---

## Phase 4: アクセシビリティ

`base_a11y.md` のレイヤー構成に従う。Astro は React 専用ツール（jest-axe + RTL）が
そのままは効かないため、**静的解析（eslint-plugin-astro）と Playwright + axe を主軸**にする。

### 4-1. Layer 1: 静的解析（eslint-plugin-astro）

`.astro` テンプレートの a11y 違反を書いた瞬間に検出する。

```bash
pnpm add -D eslint eslint-plugin-astro
```

`eslint.config.mjs` を作成する（Flat Config）。

```js
import astro from "eslint-plugin-astro";

export default [
  ...astro.configs.recommended,
  ...astro.configs["jsx-a11y-recommended"],
];
```

`package.json` に a11y 用リントを追加する（`lint` は Oxlint のまま）。

```json
{
  "scripts": {
    "lint:a11y": "eslint src"
  }
}
```

img の alt 欠落、label と control の未紐付け、不適切な ARIA などを検出できる。
あわせて Astro の **Dev Toolbar の Audit 機能**（`pnpm dev` 中にブラウザ下部のツールバーで実行）で
ランタイムの a11y / パフォーマンス問題も確認する。

### 4-2. Layer 2: コンポーネントテスト（任意）

- React / Preact / Solid のアイランドコンポーネント → Testing Library + `jest-axe` で検証できる
  （`pnpm add -D jest-axe @types/jest-axe` と該当フレームワークの testing-library を追加）
- `.astro` コンポーネント → Container API でレンダリングし、出力 HTML に `axe-core` をかける

アイランドを多用しない構成では Layer 1 と Layer 3 を優先し、このレイヤーは必要になった時点で足す。

### 4-3. Layer 3: E2E テスト（Playwright + axe-core）— 主軸

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
  { name: "ブログ一覧", path: "/blog" },
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
test("ナビゲーション: Tabキーで全リンクにフォーカスできること", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
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
      - run: pnpm lint:a11y
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: pnpm exec playwright test tests/a11y/
        env:
          BASE_URL: http://localhost:4321
```

PR がマージできない状態を作ることで「後で直す」が起きにくくなる。
（Astro の dev/preview のデフォルトポートは `4321`。)

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

UIコンポーネント（.astro / アイランド）を生成・編集するすべての場面で適用する。

## strict

- インタラクティブ要素には `button` / `a` / `input` / `select` / `textarea` を使う。`div` / `span` に `onclick` をつけない
- `img` には必ず `alt` を指定する。装飾画像は `alt=""` と `aria-hidden="true"` を併用する
- フォームの `input` / `select` / `textarea` には必ず `label` を紐付ける（`for` + `id`）
- フォームのエラーは `aria-describedby` で入力要素と紐付け、`aria-invalid` を設定する
- モーダル・ダイアログには `role="dialog"` と `aria-modal="true"` を設定し、Esc キーで閉じられるようにする

## warning

- 見出しの階層を飛ばさない
- 色だけで情報を伝えない
- ローディング状態は `aria-busy="true"` で伝える
- 動的に追加されるコンテンツには `role="alert"` または `aria-live="polite"` を使う

## advisory

- タッチターゲットは 44x44px 以上を目安にする
- アニメーション・View Transitions には `prefers-reduced-motion` で無効化オプションを提供する
```

> 補足: 自動検出できるのは WCAG 違反の 30〜40% 程度。フォーカス順序の妥当性やスクリーンリーダーの
> 読み上げ品質は、主要フローを月1回程度 VoiceOver / NVDA で手動確認して補う。

---

## Phase 5: UI モーション

`base_ui_motion.md` に従う。アニメーションは「見せるもの」ではなく「感じさせるもの」。
すべてのアニメーションは因果関係を表現し、`prefers-reduced-motion` を常に尊重する。

Astro では、ページ全体の動きは **CSS トランジション / View Transitions API** を主に使い、
複雑なインタラクションが必要な箇所のみ React / Preact などのアイランドで Framer Motion を使う。

### 5-1. イージング変数と reduced-motion を global.css に追加

`src/styles/global.css` に追記する。

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

### 5-2. View Transitions（Astro ネイティブのページ遷移）

ページ間の空間的な連続性は Astro の View Transitions で表現する。
レイアウトの `<head>` に `<ClientRouter />` を追加すると、遷移時のクロスフェードと
`transition:name` による共有要素トランジションが使えるようになる。

```astro
---
import { ClientRouter } from "astro:transitions";
---
<head>
  <ClientRouter />
</head>
```

- 前進ナビゲーションは左/上へ、後退は右/下へ。方向を論理的に一貫させる（`navigation-direction`）
- View Transitions は `prefers-reduced-motion` を自動で尊重するが、独自の `transition:animate` を
  付ける場合は reduced-motion 時の代替を用意する

### 5-3. アイランドでの Framer Motion（必要な箇所のみ）

React / Preact アイランドで細かいインタラクションが必要な場合のみ導入する。

```bash
pnpm add motion
```

```tsx
import { motion, AnimatePresence } from "motion/react";

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
```

### 5-4. .claude/rules/ui_motion.md

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

## Astro 固有

- ページ遷移は View Transitions（`<ClientRouter />`）で表現し、方向を一貫させる
- 共有要素トランジションには `transition:name` を使う
- 複雑なインタラクションのみアイランド（React/Preact）+ Framer Motion に切り出す

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

---

## Phase 6: CLAUDE.md

以下の内容をプロジェクトルートの `CLAUDE.md` として配置する。
`{CMS名}` の部分は選択した CMS に書き換えること。

````markdown
# CLAUDE.md

## プロジェクト概要

Astro + TypeScript + Tailwind CSS + {CMS名}

## コマンド

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # プロダクションビルド
pnpm preview      # ビルド結果のプレビュー
pnpm sync         # Content Collections の型を再生成
pnpm lint         # リント（Oxlint）
pnpm lint:a11y    # リント（ESLint + eslint-plugin-astro a11y）
pnpm typecheck    # 型チェック（tsc --noEmit）
pnpm format       # フォーマット（Biome）
pnpm test         # テスト（vitest run）
```

タスク完了時は `pnpm lint && pnpm typecheck && pnpm build` をすべて実行し、エラーがない状態でコミットすること。
Content Collections のスキーマを変更したときは `pnpm sync` を先に実行すること。

## ルール

- `any` 型の使用禁止。CMS レスポンスには必ず Zod でスキーマを定義する
- named export を使う（default export は避ける。ただし Astro の pages / layouts は除く）
- コンポーネントは `src/components/` に配置する
- CMS クライアントは `src/lib/` に配置し、コンポーネントから直接 API を呼ばない
- Content Collections のスキーマ変更後は必ず `pnpm sync` を実行する
- `astro.config.*`、`tailwind.config.*`、`biome.json`、`tsconfig.json`、`eslint.config.*`、`vitest.config.*` などの設定ファイルは編集禁止
- `git commit --no-verify` 禁止

## アーキテクチャ

```
src/
├── components/       # Astro / UI コンポーネント
├── content/          # ローカル Markdown コンテンツ
├── layouts/          # ページレイアウト
├── lib/              # CMS クライアント・ユーティリティ
├── pages/            # ルーティング
├── styles/           # グローバルスタイル
└── types/            # 型定義
content.config.ts     # Content Collections スキーマ定義
```

決定の経緯は `/docs/adr/` の ADR を参照。

## セキュアコーディングルール

生成するすべてのコードに適用する。詳細は `.claude/rules/security_code.md` を参照。

- TypeScript strict（`strict` / `noUncheckedIndexedAccess`）。`any` 禁止
- すべての外部入力・CMS レスポンスはエントリーポイントで Zod の `safeParse` でバリデーション
- `eval` / `new Function(string)` / 文字列結合クエリ / サニタイズなしの `set:html` は生成しない
- シークレットはすべて環境変数（`import.meta.env`）から取得。ハードコード禁止。`PUBLIC_` 接頭辞のない値をクライアントに渡さない

### セキュリティレビュー

外部入力を扱う処理 / 新規 API エンドポイント・CMS 連携 / 依存パッケージの追加・更新 のタイミングで
`/security-review` を実行して報告する。

## アクセシビリティルール

UIコンポーネントを生成・編集するときに適用する。詳細は `.claude/rules/a11y.md` を参照。
`pnpm lint:a11y` と Playwright + axe で検証する。

## UI モーションルール

アニメーションを実装するときに適用する。詳細は `.claude/rules/ui_motion.md` を参照。
ページ遷移は View Transitions、transform と opacity のみアニメーションし、`prefers-reduced-motion` を尊重する。

## テスト

- `lib/` のユーティリティ・CMS レスポンス加工 → vitest 単体（外部呼び出しはモック）
- Content Collections のスキーマ（Zod）→ vitest 単体で正常系・異常系
- `.astro` の描画 → Container API、見た目は Playwright + 人手
- ページ全体・遷移・フォーム → Playwright E2E

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

判断基準: セキュリティ・ロジックの問題は必ず修正。スタイル・命名等は無視。

オシレーション検出: 同じ箇所への指摘が A→B→A と反復した場合、優れた方を directive として固定し `directive: {内容}` をコミットメッセージに記録する。

## 完了の定義

- テストがすべて通ること
- リントエラーがないこと
- 型エラーがないこと
- `pnpm build` が成功すること

## 参照ドキュメント索引

IMPORTANT: 以下の作業を始める前に、対応するファイルを必ず読むこと。

| 作業 | 読むファイル |
|---|---|
| UI コンポーネントの実装・レビュー | `.claude/docs/base_ux_checklist_high.md` |
| アニメーション・インタラクションの実装 | `.claude/docs/base_ui_motion.md` |
| テストの作成・修正 | `.claude/docs/base_testing.md` |
| a11y 対応・検証 | `.claude/docs/base_a11y.md` |
| 実装計画・コミット前のレビュー | `.claude/docs/base_codex_review.md` |
| フレームワーク固有の規約・設定の確認 | `.claude/docs/framework_astro.md` |
| ブラウザでの実行時デバッグ・パフォーマンス計測 | `.claude/docs/base_chrome_devtools.md` |
| SEO・メタデータの実装 | `.claude/docs/base_seo.md` |
| パフォーマンス改善・予算の確認 | `.claude/docs/base_performance.md` |
| リント・フォーマット・フックの設定変更 | `.claude/docs/base_harness.md` |
| CLAUDE.md 自体の編集 | `.claude/docs/base_claude_md_knowledge.md` |

配置していないファイルの行はセットアップ時に削除する。

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

---

## Phase 7: 動作確認

### Astro の確認

- [ ] `pnpm dev` で開発サーバーが起動する
- [ ] `pnpm build` がエラーなく完了する
- [ ] `pnpm sync` で Content Collections の型が生成される
- [ ] CMS からのデータ取得が型安全に動作する（CMS を使う場合）

### ハーネスの確認

- [ ] `.ts` / `.astro` ファイルを編集したときに Biome のフォーマットが自動適用される
- [ ] Oxlint のリントが走り、エラーがあればコンテキストに注入される
- [ ] `astro.config.*` / `tailwind.config.*` 等の保護対象ファイルを編集しようとするとブロックされる
- [ ] コミット時に Lefthook が型チェックとリントを実行する

### セキュリティの確認

- [ ] サンドボックスが有効化されている（`/sandbox` で確認）
- [ ] `.claudeignore` に依存していない（deny ルールと protect-files.py で機密ファイルが保護されている）
- [ ] `~/.claude/settings.json` の JSON 構文が正しい（`jq .` で確認）
- [ ] `disableBypassPermissionsMode` が `"disable"` になっている
- [ ] `enableAllProjectMcpServers` が `false` になっている
- [ ] `.claude/hooks/` の4ファイルが存在し、実行権限がある
- [ ] `.claude/rules/security_code.md` が配置されている

### テストの確認

- [ ] `pnpm test` で vitest が実行される（`lib/` やスキーマのテストが通る）

### アクセシビリティの確認

- [ ] `eslint-plugin-astro` の a11y ルールが有効（`pnpm lint:a11y` で確認）
- [ ] `tests/a11y/` の Playwright + axe テストが実行できる
- [ ] `.github/workflows/a11y.yml` が配置されている
- [ ] `.claude/rules/a11y.md` が配置されている

### UI モーションの確認

- [ ] `src/styles/global.css` にイージング変数と `prefers-reduced-motion` の指定がある
- [ ] ページ遷移を使う場合 `<ClientRouter />`（View Transitions）が設定されている
- [ ] `.claude/rules/ui_motion.md` が配置されている

### MCP サーバーの確認

- [ ] `~/.claude.json` に不要な MCP サーバーが登録されていない
- [ ] `.mcp.json` に不審な MCP サーバーがない

### CLAUDE.md の確認

- [ ] プロジェクトルートに `CLAUDE.md` が配置されている（`{CMS名}` を書き換え済み）
- [ ] 参照ドキュメント索引の、配置していないファイルの行を削除済み
- [ ] Codex 連携のセクションが含まれている

---

## 運用ルール

- エージェントが新しい種類のミスをしたら、それを防ぐテストまたはリンタールールを追加する。一度追加したルールはすべての将来のセッションに適用される（ハーネスの複利効果）
- Content Collections のスキーマを変更したら必ず `pnpm sync` を実行してから作業を続ける
- ページ遷移・アニメーションは View Transitions を基本とし、複雑なインタラクションのみアイランドに切り出す
- async なデータ取得を含むページ・フォームは Playwright E2E で検証する
- お金が動くサービスの認証情報は AI がアクセスできる環境から完全に隔離する
- 外部から取得した CLAUDE.md / settings.json / .mcp.json は中身を読んでから使う。Web コンテンツ・他者の設定ファイルは信頼できない入力として扱う

---

## 運用開始後の参照先

- 自動化・CI/CD・定期タスクの拡張方針 → `docs/base_automation_roadmap.md`
- 障害対応・インシデントレスポンスの手順 → `docs/base_ops_incident.md`
