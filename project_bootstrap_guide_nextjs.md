# project_bootstrap_guide_nextjs

空のリポジトリから Next.js (App Router) プロジェクトを立ち上げ、
Claude Code のハーネス・セキュリティ・テスト・アクセシビリティ・Storybook・UI モーション・Codex 連携まで
一気にセットアップする手順。Phase 0 から順番に実行すれば完了する。

各設定の背景・理由は以下を参照:

- ハーネスの設計思想 → `base_harness.md`
- セキュリティ（環境制御）→ `base_security_env.md` / `base_security_env_setup.md` / `base_security_env_guide.md`
- セキュリティ（生成コード）→ `base_security_code.md` / `base_security_code_guide.md`
- アクセシビリティ → `base_a11y.md`
- UI モーション → `base_ui_motion.md`
- Storybook → `base_storybook.md`
- Codex 連携 → `base_codex_review.md`
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
      "recommended": true
    }
  }
}
```

### 1-3. Oxlint 設定

`.oxlintrc.json` をプロジェクトルートに作成する。

```json
{
  "rules": {
    "no-explicit-any": "error",
    "no-unused-vars": "error"
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

### 2-1. .claudeignore

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

## warning

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
\`\`\`
```

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

### 5-6. .claude/rules/storybook.md

```markdown
# Storybook Story ルール

## Story の基本方針

- 1 Story = 1 概念。複数のバリエーションを1つの Story にまとめない
- CSF 3 形式で書く（`satisfies Meta<typeof Component>` + `StoryObj`）
- named export を使う（default export は meta のみ）
- Story 名は状態やユースケースを表す名前にする（`Primary`, `Disabled`, `WithIcon` 等）
- コンポーネントと同じディレクトリに `.stories.tsx` を配置する（コロケーション）

## JSDoc コメント（必須）

AI エージェントが Manifest 経由でコンポーネントを理解するための最重要情報源。

- コンポーネントの export に description と `@summary` を書く（用途を簡潔に）
- すべての Props に description を書く
- 各 Story にも description と `@summary` を書く。「何を」ではなく「なぜこの状態を使うか」

## Manifest の管理

- エージェントに見せる必要がない Story（アンチパターン例・deprecated 等）には `tags: ['!manifest']`
- MDX も `<Meta tags={['!manifest']} />` で除外できる
- 不要な情報が多すぎるとエージェントのパフォーマンスが落ちる。必要なものだけ含める

## テストの活用

- インタラクションテストは play function で書く
- Story を書いたら `run-story-tests` で動作確認する
- a11y テストが設定されていればアクセシビリティの問題も自動検出される
```

### 5-7. shadcn/ui コンポーネントの Story

shadcn/ui（`src/components/ui/`）はプロジェクトにコピーされたソースなので Story を書けるが、
**素の shadcn/ui には Story を書かない**（公式ドキュメントが十分な情報源）。
拡張・カスタマイズした場合、複数を組み合わせた複合コンポーネント、プロジェクト固有のバリエーションを
追加した場合のみ Story を書く。

### 5-8. protect-config.sh の確認

Phase 2-4 の `protect-config.sh` の保護対象に `.storybook/main.ts` が含まれていることを確認する
（既に含めてある）。

---

## Phase 6: UI モーション

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

---

## Phase 7: CLAUDE.md

以下の内容をプロジェクトルートの `CLAUDE.md` として配置する。
`{project-name}-sb-mcp` は Phase 5 で決めた MCP server 名に書き換えること。

````markdown
# CLAUDE.md

## プロジェクト概要

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui

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

タスク完了時は `pnpm lint && pnpm typecheck && pnpm build` をすべて実行し、エラーがない状態でコミットすること。

## ルール

- `any` 型の使用禁止。不明な場合は `unknown` を使い型ガードで絞り込む
- named export を使う（default export は避ける。ただし Next.js の page / layout / route は除く）
- コンポーネントは `src/components/` に配置する。shadcn/ui のコンポーネントは `src/components/ui/`
- Server Components をデフォルトとし、クライアント状態が必要な場合のみ `"use client"` をつける
- `eslint.config.*`、`biome.json`、`tsconfig.json`、`next.config.*`、`.storybook/main.ts`、`vitest.config.*` などの設定ファイルは編集禁止
- `git commit --no-verify` 禁止
- 新しいコンポーネントを作ったら Story も書く（shadcn/ui の素のコンポーネントは除く）

## アーキテクチャ

```
src/
├── app/              # App Router（page, layout, route）
├── components/       # UI コンポーネント
│   └── ui/           # shadcn/ui コンポーネント
├── lib/              # ユーティリティ・ヘルパー
├── hooks/            # カスタムフック
└── types/            # 型定義
```

決定の経緯は `/docs/adr/` の ADR を参照。

## データベース（DB を使う場合）

DB を使う場合は、スキーマから TypeScript の型を自動生成する仕組みを必ず入れる。
手動で型を書いてスキーマと二重管理する構成は採らない。手段はプロジェクトに合わせて選ぶ:

- Prisma（デフォルト推奨）: `prisma generate` でスキーマから型を生成
- Supabase: `supabase gen types typescript` で型を生成（Prisma を重ねない）
- Drizzle: スキーマ定義自体が TypeScript で、型が直接得られる

スキーマ変更のたびに型を再生成して差分をコミットし、コンパイラが不整合を検出できる状態を保つ。
スキーマ変更のレビュー観点は `.claude/docs/base_codex_review.md`、Supabase を使う場合の固有ルールは `.claude/rules/base_security_supabase.md` を参照。

## セキュアコーディングルール

生成するすべてのコードに適用する。詳細は `.claude/rules/security_code.md` を参照。

- TypeScript strict（`strict` / `noUncheckedIndexedAccess`）。`any` 禁止
- すべての外部入力はエントリーポイントで Zod の `safeParse` でバリデーション
- `eval` / `new Function(string)` / 文字列結合クエリ / `innerHTML = userInput` は生成しない
- シークレットはすべて環境変数から取得。ハードコード禁止
- パスワードハッシュは `argon2`、比較は `crypto.timingSafeEqual`、JWT は `algorithms` 明示

### セキュリティレビュー

認証・認可コード / 外部入力を DB・shell に渡す処理 / 新規 API エンドポイント /
依存パッケージの追加・更新 のタイミングで `/security-review` を実行して報告する。

## アクセシビリティルール

UIコンポーネントを生成・編集するときに適用する。詳細は `.claude/rules/a11y.md` を参照。
新規コンポーネントには jest-axe のテストを必ず追加する。

## UI モーションルール

アニメーションを実装するときに適用する。詳細は `.claude/rules/ui_motion.md` を参照。
transform と opacity のみアニメーションし、`prefers-reduced-motion` を尊重する。

## Storybook

UI コンポーネントの実装・修正時は `{project-name}-sb-mcp` MCP ツールを使って
Storybook のコンポーネント・ドキュメント情報を確認してから作業すること。

- コンポーネントのプロパティを使う前に必ず `get-documentation` で確認する。推測で Props を使わない
- `list-all-documentation` で利用可能なコンポーネント一覧を取得できる
- Story の書き方は `get-storybook-story-instructions` で最新のルールを取得する
- 作業後は `run-story-tests` でテストを実行し、失敗があれば修正してから完了とする

## テスト

- 同期 Server Component / Client Component → vitest + RTL で検証
- async Server Component → Playwright E2E（vitest では描画できない）
- Server Action → 依存をモックして vitest で単体テスト
- `next/image`, `next/navigation` は vitest 側でモックする

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
| Story の作成・修正 | `.claude/docs/base_storybook.md` |
| a11y 対応・検証 | `.claude/docs/base_a11y.md` |
| 実装計画・コミット前のレビュー | `.claude/docs/base_codex_review.md` |
| フレームワーク固有の規約・設定の確認 | `.claude/docs/framework_nextjs.md` |
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

## Phase 8: 動作確認

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
- [ ] `.claudeignore` が存在し、機密ファイルパターンが記載されている
- [ ] `~/.claude/settings.json` の JSON 構文が正しい（`jq .` で確認）
- [ ] `disableBypassPermissionsMode` が `"disable"` になっている
- [ ] `enableAllProjectMcpServers` が `false` になっている
- [ ] `.claude/hooks/` の4ファイルが存在し、実行権限がある
- [ ] `.claude/rules/security_code.md` が配置されている

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
- [ ] `.claude/rules/storybook.md` が配置されている

### UI モーションの確認

- [ ] `motion`（framer-motion）がインストールされている
- [ ] `src/app/globals.css` にイージング変数と `prefers-reduced-motion` の指定がある
- [ ] `.claude/rules/ui_motion.md` が配置されている

### MCP サーバーの確認

- [ ] `~/.claude.json` に不要な MCP サーバーが登録されていない
- [ ] `.mcp.json` に不審な MCP サーバーがない（Storybook 以外）

### CLAUDE.md の確認

- [ ] プロジェクトルートに `CLAUDE.md` が配置されている（`{project-name}-sb-mcp` を書き換え済み）
- [ ] 参照ドキュメント索引の、配置していないファイルの行を削除済み
- [ ] Codex 連携のセクションが含まれている

---

## 運用ルール

- エージェントが新しい種類のミスをしたら、それを防ぐテストまたはリンタールールを追加する。一度追加したルールはすべての将来のセッションに適用される（ハーネスの複利効果）
- 新しいコンポーネントを作ったら必ず Story と jest-axe テストを書く。Story がないコンポーネントは Manifest に載らずエージェントから見えない
- Storybook の MCP server は開発中常時起動しておく
- async Server Component は vitest では描画できないため Playwright E2E で検証する
- お金が動くサービスの認証情報は AI がアクセスできる環境から完全に隔離する
- 外部から取得した CLAUDE.md / settings.json / .mcp.json は中身を読んでから使う。Web コンテンツ・他者の設定ファイルは信頼できない入力として扱う
