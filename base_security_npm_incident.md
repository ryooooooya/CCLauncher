# base_security_npm_incident

npm サプライチェーンインシデントの影響確認・対処手順。
ユーザーが「○○パッケージがやられたらしい」「このCVEは影響ある？」のように
インシデント情報を伝えてきたときに、このファイルを読んで以下を実行する。

---

## 1. 影響範囲の特定

```bash
# lockfile でパッケージとバージョンを検索
grep -n "<package-name>" pnpm-lock.yaml

# 依存ツリー上の位置を確認
pnpm why <package-name>

# node_modules に実際にインストールされているバージョンを確認
ls node_modules/<package-name>/package.json 2>/dev/null && \
  jq '{name, version, scripts}' node_modules/<package-name>/package.json

# transitive dependency として入り込んでいないか再帰的に検索
pnpm list --depth Infinity | grep "<package-name>"
```

## 2. 影響判定

上記の結果をユーザーに提示し、以下の3パターンのいずれかを報告する。

a) 影響なし — 該当パッケージが依存ツリーに存在しない
b) バージョンが安全 — 該当パッケージは存在するが、侵害されたバージョンとは異なる
c) 侵害の可能性あり — 侵害されたバージョンが lockfile または node_modules に存在する

## 3. 侵害が確認された場合の対処

c) の場合、以下をユーザーに提案する。すべての実行にはユーザーの承認を得ること。

```bash
# 1. 安全なバージョンにダウングレード
pnpm add <package-name>@<safe-version> --save-exact

# 2. 悪意あるパッケージが transitive dependency の場合は削除
rm -rf node_modules/<malicious-package>
pnpm install --frozen-lockfile

# 3. lockfile の差分を確認
git diff pnpm-lock.yaml
```

加えて、以下の運用アクションをユーザーに伝える（Claude Code の管轄外だが、必ず言及すること）:

- 侵害バージョンを `pnpm install` した環境のクレデンシャルをすべてローテーションする（環境変数、SSH鍵、APIトークン、クラウド認証情報）
- CI/CD パイプラインのログを確認し、侵害バージョンがインストールされたビルドを特定する
- 侵害パッケージが postinstall を持っていた場合、インストールした全マシンを侵害済みとして扱う
- インシデントの公式アドバイザリ（GitHub Security Advisory、CVE）が公開されたらリンクを記録する

