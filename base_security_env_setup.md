# base_security_env_setup

このファイルを読んだら、以下の手順を順番に実行してセキュリティ設定を完了させること。
各ステップで作成・編集するファイルの内容を確認してからユーザーに報告する。

---

## Step 0: サンドボックスを有効化する

Claude Code のネイティブサンドボックスを有効化する。
OS レベルのプリミティブ（macOS: Seatbelt、Linux: bubblewrap）でファイルシステムとネットワークを隔離する。
settings.json やフックよりも下のレイヤーで強制されるため、最初に設定する。

### 前提条件の確認

macOS の場合は追加インストール不要。Linux / WSL2 の場合は以下を先にインストールする:

```bash
# Debian / Ubuntu
sudo apt install bubblewrap socat

# Fedora
sudo dnf install bubblewrap socat
```

WSL1 は非対応（bubblewrap がカーネル機能を必要とするため）。

### 有効化

Claude Code 内で以下を実行する:

```
/sandbox
```

メニューが表示されるので、サンドボックスモードを選択する。

| モード | 挙動 | 使いどころ |
|---|---|---|
| Auto-allow | サンドボックス内のコマンドは自動承認。境界外のアクセスのみ確認が出る | 推奨。承認プロンプトが大幅に減り、開発フローが速くなる |
| Regular permissions | サンドボックス内でも全コマンドが通常の承認フローを通る | 最大限の慎重さが必要な場面 |

どちらのモードでも settings.json の allow/deny ルールとフックは引き続き適用される。

### Docker を使うプロジェクトの場合

Docker コマンドはサンドボックス外で実行する必要がある。settings.json に以下を追加する:

```json
{
  "sandbox": {
    "excludedCommands": ["docker", "docker-compose"]
  }
}
```

### 確認

有効化後、以下で状態を確認する:

```
/sandbox
```

「Sandbox is enabled」と表示されれば完了。

---

## Step 1: 機密ファイル保護の方式を確認する

注意: `.claudeignore` は Claude Code ではサポートされておらず、作成しても機能しない。
過去にこの手順で `.claudeignore` を作成していた場合は削除してよい（残っていても無害だが、
「保護されている」という誤解のもとになる）。

機密ファイル（`.env*` / 鍵ファイル / 認証情報）の保護は、次の2層で確定的に担保する:

- `settings.json` の `permissions.deny`（Step 2 / Step 4 の Read deny ルール）
- `protect-files.py` フック（Step 5 の PreToolUse）

このため Step 1 での作業はない。Step 2 に進む。

---

## Step 2: ~/.claude/settings.json を設定する

`~/.claude/settings.json` を以下の内容で作成または上書きする。
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

設定後に構文チェックを実行する:

```bash
jq . ~/.claude/settings.json > /dev/null && echo "OK" || echo "JSON構文エラー"
```

### defaultMode の選択肢

上記の設定では `"ask"` を使っている。状況に応じて変更できる。

| 値 | 挙動 | 使いどころ |
|---|---|---|
| `"ask"` | すべての操作で確認を求める | 推奨。未知のリポジトリや外部コンテンツを扱う場合は必ずこちら |
| `"autoEdit"` | 別の分類モデルがリスク判定し、スコープ拡大・未知インフラ・敵対的コンテンツ駆動アクションのみブロック | タスクの方向性は信頼できるが毎回クリックしたくない場面 |

`"autoEdit"` を使う場合は allow リストに安全とわかっているコマンドを明示的に追加しておくと分類精度が上がる。外部コンテンツの処理・信頼できないリポジトリの作業時は `"ask"` に戻すこと。

---

## Step 3: フックスクリプトを作成する

`.claude/hooks/` ディレクトリを作成し、以下の2ファイルを配置する。

### .claude/hooks/bash-firewall.sh

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

### .claude/hooks/protect-files.py

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

作成後、実行権限を付与する:

```bash
chmod +x .claude/hooks/bash-firewall.sh
chmod +x .claude/hooks/protect-files.py
```

---

## Step 4: 完了確認

以下を確認してユーザーに報告する。

- [ ] サンドボックスが有効化されている（`/sandbox` で確認）
- [ ] `.claudeignore` に依存していない（deny ルールと protect-files.py で機密ファイルが保護されている）
- [ ] `~/.claude/settings.json` の JSON 構文が正しい
- [ ] `disableBypassPermissionsMode` が `"disable"` になっている
- [ ] `enableAllProjectMcpServers` が `false` になっている
- [ ] `.claude/hooks/bash-firewall.sh` が存在し、実行権限がある
- [ ] `.claude/hooks/protect-files.py` が存在し、実行権限がある

全て完了したら「セキュリティセットアップが完了しました」とユーザーに伝える。

---

## Step 5: Codex CLI 経路の防御設定（Codex を実装エージェントに使う場合のみ）

Step 0〜4 の防御層（サンドボックス・settings.json の deny・bash-firewall.sh・protect-files.py）は
すべて Claude Code のフック機構に乗っており、`codex exec` で動く実装経路には一切効かない。
開発パイプライン（`base_dev_pipeline.md`）で Codex を実装エージェントに使う場合は、以下を追加で設定する。
AGENTS.md の文言は guidance であって enforcement ではない。守りは必ず以下の機構側に置く。

### 防御の考え方（何をどの層で守るか）

| 守る対象 | Claude Code 経路の担当 | Codex 経路の担当 |
|---|---|---|
| ワークスペース外への書き込み | ネイティブサンドボックス | Codex サンドボックス workspace-write（macOS: Seatbelt / Linux: bubblewrap の OS 層強制） |
| ネットワーク（流出・pipe-to-shell） | deny ルール + bash-firewall.sh | workspace-write はネットワーク遮断がデフォルト（`network_access = false`） |
| `.git` の改変・履歴破壊 | bash-firewall.sh | サンドボックスが `.git` / `.codex` / `.agents` を常時 read-only 化 |
| 機密ファイル（.env・鍵類） | permissions.deny + protect-files.py | permissions プロファイルのパス権限（`"**/*.env*" = "none"`） |
| 変更禁止領域（.claude/・ハーネス設定） | protect-config.sh | permissions プロファイル（read 指定）+ CI の禁止パスチェック + branch protection |
| main への直接 push | bash-firewall.sh | GitHub branch protection（サーバー側で決定論的）。ネットワーク遮断下ではそもそも push 不可 |
| 環境変数のシークレット | シェルに露出させない運用 | `shell_environment_policy`（KEY / SECRET / TOKEN を含む変数はデフォルト除外） |

### ~/.codex/config.toml の設定

重要: `approval_policy` / `sandbox_mode` / `sandbox_workspace_write` はプロジェクト側の
`.codex/config.toml` ではオーバーライドできない（ユーザーレベル専用の仕様）。このため
リポジトリ内容（プロンプトインジェクション）経由で防御を緩めることはできない。設定は必ず
`~/.codex/config.toml` に置く。

```toml
# 実装エージェントとしての既定: ワークスペース内のみ書き込み可・ネットワーク遮断
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = false   # デフォルトだが明示する

[shell_environment_policy]
inherit = "core"         # サブプロセスへ渡す環境変数を最小化
# KEY / SECRET / TOKEN を含む変数はデフォルトで除外される。ignore_default_excludes を true にしない
```

パス単位の制御（機密ファイルの読み取り禁止・変更禁止領域の書き込み禁止）まで倒す場合は、
permissions プロファイルを使う（`sandbox_mode` / `[sandbox_workspace_write]` との併用は不可。どちらか一方）:

```toml
default_permissions = "ccsd"

[permissions.ccsd.filesystem]
":project_roots" = { "." = "write", "**/*.env*" = "none", ".claude/**" = "read", "lefthook.yml" = "read", "biome.json" = "read", ".oxlintrc.json" = "read", "tsconfig.json" = "read", "vitest.config.ts" = "read", ".github/**" = "read" }

[permissions.ccsd.network]
enabled = false
```

注意: permissions プロファイルの構文はバージョンで変わる可能性がある。適用時に
`codex --version` と公式 config リファレンス（https://learn.chatgpt.com/docs/config-file/config-reference）を突き合わせること。

### codex exec（非対話実行）の扱い

- `codex exec` もユーザーレベル設定のサンドボックスに従う。`--dangerously-bypass-approvals-and-sandbox` と `--sandbox danger-full-access` は使用禁止
- `.git` が read-only のため、サンドボックス内の Codex は commit できない。コミットはエスカレーション承認（対話実行時）または人間・Claude Code 側で行う
- 非対話実行ではエスカレーション承認者が不在のため、サンドボックス外へ出る操作は失敗する。これは安全側の挙動としてそのまま受け入れる

### GitHub 側の設定（エージェント非依存の決定論層）

どのエージェントが実装しても効く最終防衛線として、リポジトリ側に以下を設定する:

1. main の branch protection: 直接 push 禁止・PR 必須・required status checks
2. CI の禁止パスチェック: PR の diff に変更禁止領域（`.claude/**`・ハーネス設定等）が含まれたら fail させる job を 1 本入れ、required check に指定する

### Codex サンドボックスで守れないもの（残リスクと受容判断）

| リスク | 判断 |
|---|---|
| ワークスペース内ファイルの破壊（`rm -rf` 等はワークスペース内なら許可される） | git 履歴＋こまめなコミットで復元可能。受容 |
| permissions の glob に該当しないワークスペース内の秘密情報の読み取り | 秘密情報はワークスペース内に置かない運用（環境変数管理サービス等）で回避。受容 |
| 実装コード自体への悪性・誤りの混入 | enforcement の守備範囲外。@codex review + 別インスタンスでの仕様突合（`base_dev_pipeline.md`）で担保 |
| lefthook（pre-commit）の `--no-verify` 回避 | pre-commit は第一線扱いにとどめ、決定論的な強制は CI + branch protection に置く |
| 人間が誤って danger-full-access で起動する | 運用禁止ルールとして `base_dev_pipeline.md` に明記 |

### 確認

- [ ] `~/.codex/config.toml` に workspace-write（または同等の permissions プロファイル）とネットワーク遮断が設定されている
- [ ] プロジェクトの `.codex/config.toml` にセキュリティ設定を置いていない（置いても無効だが、誤解のもとになる）
- [ ] main の branch protection と禁止パスチェック CI が設定されている

---

最終検証日: 2026-07-14
