# base_performance

パフォーマンスの基準（予算）と、劣化を CI で自動検知する仕組み。
計測手段は `base_chrome_devtools.md`（対話的な計測・デバッグ）が担い、このファイルは「基準の定義」と「回帰の自動検知」を担う。
対象は Next.js。

---

## 基本方針

- 目標は Core Web Vitals の good 圏。数値はプロジェクト属性（コンテンツサイトかアプリか）で調整してよいが、調整した場合は理由を CLAUDE.md に記録する
- 対話的な計測（chrome-devtools-mcp）は開発中の調査用、CI（Lighthouse CI）は劣化の門番。両方を混同しない
- スコアを上げること自体を目的にしない。予算は「下回ったら赤」の最低ラインとして扱う

## 予算の既定値

| 指標 | 目標 | 備考 |
|---|---|---|
| LCP | 2.5s 以下 | |
| CLS | 0.1 以下 | |
| INP | 200ms 以下 | ラボでは計測不可。CI では TBT を代理指標にする |
| TBT | 300ms 以下 | INP の代理（ラボ指標） |
| ページ総転送量 | 1.5MB 以下（警告） | 画像の多いページは調整可 |

---

## 1. Lighthouse CI のセットアップ

```bash
pnpm add -D @lhci/cli
```

`lighthouserc.json` をプロジェクトルートに作成する。

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "pnpm start",
      "url": ["http://localhost:3000/"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 300 }],
        "total-byte-weight": ["warn", { "maxNumericValue": 1500000 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

- 対象 URL はトップだけでなく、代表的な動的ページ（記事詳細等）を1〜2本含める
- `lighthouserc.json` は `base_harness.md` の protect-config.sh の保護対象に追加する（閾値を勝手に緩めて緑にするのを防ぐ。`base_testing.md` の vitest.config と同じ理屈）

## 2. GitHub Actions ワークフロー

`.github/workflows/lighthouse.yml`:

```yaml
name: Lighthouse CI
on: [pull_request]

permissions:
  contents: read

jobs:
  lhci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4        # 適用時にフルレングス SHA へピン留めする
      - uses: pnpm/action-setup@v4       # 同上（base_security_npm_setup.md のルール）
      - uses: actions/setup-node@v4      # 同上
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm dlx @lhci/cli autorun
```

注意: Actions は `base_security_npm_setup.md` のルールに従い、適用時に必ずフルレングスのコミット SHA でピン留めすること（上記の `@v4` はプレースホルダ）。SHA の更新は dependabot.yml に任せる。

ローカルの CI 環境（GitHub ホストランナー）はマシン性能が揺れるため、閾値ギリギリの数値は flaky になる。`numberOfRuns: 3` の中央値でも揺れる場合は、error にするのはスコアと CLS に絞り、時間系は warn に落とす。

---

## 3. 実装ルール（コード生成時に常に適用）

- 画像は `next/image` を使う。`<img>` 直書きは生成しない。width / height（または fill）を必ず指定して CLS を防ぐ
- Web フォントは `next/font` で読み込む。`<link>` での外部フォント読み込みは生成しない
- 重いクライアントコンポーネント（エディタ・チャート・地図等）は `next/dynamic` で遅延読み込みする
- Server Components を既定とし、`"use client"` はクライアント状態が必要な末端に限る（framework_nextjs.md のルールを性能面から補強）
- 調査が必要なときは `@next/bundle-analyzer` を一時導入して原因を特定し、結果をユーザーに報告する
- LCP 要素（ファーストビューの主画像）には優先読み込み（`priority`）を指定する
- サイズの大きい依存を追加する前に軽量な代替を検討し、追加時はユーザーに報告する（`base_security_npm.md` の依存ツリー確認と併せて行う）

---

## CLAUDE.md に追記するセクション

```markdown
## パフォーマンスのルール

- 予算は `lighthouserc.json` が正。閾値の変更はユーザーの承認が必要
- 画像・フォント・遅延読み込みの実装ルールは `.claude/docs/base_performance.md` に従う
- Lighthouse CI が赤のままコミュニケーションを完了扱いにしない
```

---

## 動作確認

- [ ] PR で Lighthouse CI が実行され、結果がチェックに出る
- [ ] `lighthouserc.json` が protect-config.sh の保護対象に入っている
- [ ] 代表的な動的ページが計測対象 URL に含まれている
- [ ] ファーストビュー画像に priority / fetchpriority が付いている

---

最終検証日: 2026-07-03
