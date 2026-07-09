# base_harness

Claude Code + TypeScript プロジェクトにおけるハーネス設定。
コード品質を自動で維持する仕組み（Biome + Oxlint + Lefthook + PostToolUse/PreToolUse フック）のセットアップ手順。

各設定の設計思想と背景は `base_claude_md_knowledge.md` の「ハーネスエンジニアリング」セクションを参照。

---

## 前提

- Node.js 20+
- pnpm がインストール済み
- Claude Code がインストール済み
- TypeScript プロジェクトが存在する

---

## 1. ツールのインストール

```bash
pnpm add -D @biomejs/biome oxlint lefthook
```

---

## 2. Biome 設定

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

可読性系のルールは warn にとどめ、正当な例外は許容する（後述のコード品質ルールを参照）。

---

## 3. Oxlint 設定

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

---

## 4. package.json にスクリプトを追加

既存の `scripts` に以下を追加する（`dev`, `build`, `start` 等は残す）。

```json
{
  "scripts": {
    "lint": "oxlint src",
    "format": "biome format --write src",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 5. Lefthook でプリコミットフックを設定

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

## 6. .claude/settings.json（プロジェクトレベル）の作成

PostToolUse フックとリンター設定保護フックを登録する。

`.claude/settings.json` をプロジェクトルート直下に作成する。

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

---

## 7. フックスクリプトの作成

`.claude/hooks/` ディレクトリを作成し、以下の2ファイルを配置する。

### .claude/hooks/post-ts-lint.sh

ファイル編集後に Biome と Oxlint を自動実行する。残った違反をエージェントのコンテキストに注入する。

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

### .claude/hooks/protect-config.sh

リンター・ビルド設定ファイルへの編集を物理的にブロックする。

```bash
#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$input")"

protected="eslint.config biome.json pyproject.toml .prettierrc tsconfig.json lefthook.yml .oxlintrc.json next.config"

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
chmod +x .claude/hooks/post-ts-lint.sh
chmod +x .claude/hooks/protect-config.sh
```

---

## 7-2. コード品質ルール（可読性）

機械的に判定できる可読性はリンターに任せる（複雑度・関数長・ネスト深度は上記 warn ルール）。
閾値は絶対の上限ではなく検知のトリガーであり、正当な理由がある場合は例外を許容する。

- warn を無視して積み上げない。超過したらまず分割・早期リターンを検討する
- 例外にする場合は `biome-ignore` / `oxlint-disable` コメントに理由を1行書く。理由のない抑制コメントは Codex レビューの指摘対象
- コメントは WHAT ではなく WHY を書く。コードを読めば分かることを繰り返さない
- 重複コードは3回目で共通化を検討する。2回の重複を先回りして抽象化しない
- 使われなくなったコード・export は削除する。コメントアウトで残さない

TSDoc は公開 API（lib/ の export 関数等）にのみ書き、内部関数には強制しない。
テストコードの可読性ルールは `base_testing.md` を参照。

---

## 8. CLAUDE.md の最小構成

以下がハーネスに必要な CLAUDE.md の最小セクション。フレームワーク固有の内容は別途追加する。

```markdown
## コマンド

\`\`\`bash
pnpm lint         # リント（Oxlint）
pnpm typecheck    # 型チェック（tsc --noEmit）
pnpm format       # フォーマット（Biome）
\`\`\`

タスク完了時は `pnpm lint && pnpm typecheck` をすべて実行し、エラーがない状態でコミットすること。

## ルール

- `any` 型の使用禁止。不明な場合は `unknown` を使い型ガードで絞り込む
- `eslint.config`、`biome.json`、`tsconfig.json` などの設定ファイルは編集禁止
- `git commit --no-verify` 禁止
- named export を使う（default export は避ける）

## 完了の定義

- テストがすべて通ること
- リントエラーがないこと
- 型エラーがないこと
```

---

## 動作確認

- [ ] `.ts` / `.tsx` ファイルを編集したときに Biome のフォーマットが自動適用される
- [ ] Oxlint のリントが走り、エラーがあればコンテキストに注入される
- [ ] `biome.json` 等の保護対象ファイルを編集しようとするとブロックされる
- [ ] コミット時に Lefthook が型チェックとリントを実行する

---

## 運用ルール

エージェントが新しい種類のミスをしたとき、それを防ぐテストまたはリンタールールを追加する。
一度追加したルールはすべての将来のセッションに適用される。これがハーネスの複利効果の源泉。

---

最終検証日: 2026-07-08
