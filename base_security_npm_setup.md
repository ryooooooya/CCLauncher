# base_security_npm_setup

CI / GitHub 側のサプライチェーン自動防御層のセットアップ手順。
プロジェクト初期化時（リポジトリ作成後）に一度だけ実行する。
パッケージ操作時の常時ルールは `.claude/rules/base_security_npm.md` を参照。

---

`base_security_npm.md` のルールが「Claude Code がパッケージを操作する時点」の防御なのに対し、ここはリポジトリ側で自動的に働く防御層。

## 1. Dependabot alerts / security updates

リポジトリの Settings > Code security で以下を有効化する。既存依存の既知の脆弱性を検出し、修正 PR を自動生成する。

| 設定項目 | 役割 |
|---|---|
| Dependency graph | 依存関係の可視化（土台） |
| Dependabot alerts | 脆弱性検出時にアラート発行 |
| Dependabot security updates | 脆弱性を修正する PR を自動作成 |

public リポジトリは graph と alerts がデフォルト有効。private リポジトリは手動で有効化する。pnpm も npm エコシステムとして扱われる。アラートが多い場合は CVSS（深刻度 9.0 以上は即対応）と EPSS（悪用確率 0.5 以上は優先）で優先順位を付ける。

## 2. dependabot.yml（バージョン更新と Actions 更新）

セキュリティ更新とは別に、定期的なバージョン更新と GitHub Actions の更新を自動化する。`groups` で PR 数の爆発を抑える。

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"   # pnpm もこのエコシステムで扱われる
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      dev-dependencies:
        dependency-type: "development"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

外部からの PR で Actions の SHA が変更されている場合は疑う。Dependabot が作成した PR であることを必ず確認する。

## 3. Dependency Review Action（PR でブロック）

Dependabot alerts が「既存の依存」を対象とするのに対し、これは「PR で新規追加される依存」をマージ前にチェックする。ブランチ保護ルールでこのチェックをマージ必須にすれば、脆弱なパッケージを含む PR はマージできなくなる。

```yaml
# .github/workflows/dependency-review.yml
name: Dependency Review
on: [pull_request]

permissions:
  contents: read

jobs:
  dependency-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4
      - uses: actions/dependency-review-action@67d4f4bd7a9b17a0db54d2a7519187c65e339de8  # v4
        with:
          fail-on-severity: high
          deny-licenses: GPL-3.0, AGPL-3.0
```

public リポジトリは無料。private リポジトリは GitHub Code Security のライセンスが必要。

## 4. pnpm audit を CI に組み込む

```yaml
# .github/workflows/dependency-check.yml
name: Dependency Check
on:
  pull_request:
    paths:
      - 'package.json'
      - 'pnpm-lock.yaml'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4
      - uses: pnpm/action-setup@a7487c7e89a18df4991f7f222e4898a00d66ddda  # v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=high
```

`package.json` または lockfile に変更がある PR でのみ実行される。

## 5. GitHub Actions は SHA でピン留めする（strict）

サプライチェーン攻撃は npm パッケージだけでなく GitHub Actions も標的になる。Actions は `@v4` のようなタグではなく、必ずフルレングスのコミット SHA でピン留めする（上記ワークフローの記法に従う）。タグは指し先を差し替えられるが、SHA は改ざんできない。SHA の更新は セクション2の dependabot.yml に任せる。

---
