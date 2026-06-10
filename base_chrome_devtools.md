# base_chrome_devtools

Chrome DevTools for agents（chrome-devtools-mcp）を Claude Code の開発フローに組み込むためのセットアップガイド。
ライブブラウザでの実行時デバッグとパフォーマンス計測を担う。

配置先は `.claude/docs/`（セットアップ・参照ドキュメント）。常時適用の `.claude/rules/` には入れない。

---

## 参照するタイミング

このファイルはオンデマンド参照。以下の状況になったら読み込んで使う。

- UI / ページを実装・修正して、ブラウザでの実挙動を確認したいとき
- コンソールエラーやネットワーク失敗の原因を実行時に追いたいとき
- パフォーマンス（Lighthouse / Core Web Vitals）を計測したいとき

逆に参照しないケース:

- アクセシビリティを見たいとき → `base_a11y.md`
- CI の回帰テストに載せたいとき → Playwright

---

## このツールの役割と非役割

担当する範囲:

- 実装中のライブデバッグ（コンソールエラー、ネットワークリクエスト、ソースマップ付きスタックトレース、スクリーンショット）
- パフォーマンス計測（Lighthouse 監査、トレース取得、Core Web Vitals: LCP / CLS / INP）
- デバイス・地域エミュレーション

担当しない範囲（既存資産との重複を避けるため、ここでは使わない）:

- アクセシビリティの作り込み・回帰検出 → `base_a11y.md`（eslint-plugin-jsx-a11y / jest-axe / Playwright + axe-core）が担当。chrome-devtools の a11y 監査も結局 axe 系で重複するため、こちらでは使わない。
- CI での回帰テスト → Playwright が担当。chrome-devtools-mcp はローカル・対話的で計測値もぶれるため、CI の合否ゲートには載せない。

役割の住み分け:

| ツール | 役割 | 実行場所 |
|---|---|---|
| Playwright | 事前定義アサーションの回帰テスト | CI |
| jest-axe | コンポーネント単体の a11y 検査 | CI / ローカル |
| chrome-devtools-mcp | 開発時のパフォーマンス計測・実行時デバッグ | ローカル（対話的） |

置き換えではなく補完。「生成したコードがブラウザで実際にどう動くか」を実装中に確認する用途。

---

## 適用フレームワーク

- Next.js / Astro: 適用する（localhost の dev サーバに対して使う）
- WordPress: 対象外（wp-env の Docker 構成に素直に乗らない。必要なら手動の DevTools で足りる）

---

## 要件

- Node.js LTS
- Google Chrome 安定版以降（Chrome for Testing も可。他の Chromium 系ブラウザは非保証）

---

## セットアップ（committed .mcp.json 方式）

セキュリティフラグをバージョン管理下に置きたいので、CLI の user スコープ登録ではなく、プロジェクトルートに `.mcp.json` をコミットする方式を既定とする。

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--isolated",
        "--headless",
        "--no-usage-statistics",
        "--no-performance-crux",
        "--redact-network-headers"
      ]
    }
  }
}
```

各フラグの意図:

- `--isolated`: 毎回使い捨ての一時プロファイルを作り、終了時に破棄する。常用 Chrome の認証済みプロファイルに触れさせない。
- `--headless`: ヘッドレス起動。バッチ計測やトークン節約に向く。画面を目視で追いたいデバッグ時は外す（後述）。
- `--no-usage-statistics`: Google への利用統計送信を止める。送信は既定で ON。env `CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS` または `CI` でも無効化される。
- `--no-performance-crux`: パフォーマンストレースの URL を CrUX API へ送るのを止める。実ユーザーのフィールドデータが取れなくなるトレードオフはあるが、URL の外部送信を避ける。
- `--redact-network-headers`: 機微なネットワークヘッダをクライアントへ返す前に伏せる。

確認: Claude Code 再起動後、`/mcp` に `chrome-devtools` が表示されること。最初のツール呼び出し時に初めてブラウザが起動する（接続だけでは起動しない）。

Plugin 方式（MCP + Skills バンドル）について:

`/plugin marketplace add ChromeDevTools/chrome-devtools-mcp` → `/plugin install chrome-devtools-mcp@chrome-devtools-plugins` で、「パフォーマンス監査して」で一発実行できる higher-level な Skill が付く。ただし上記セキュリティフラグの注入が `.mcp.json` ほど明示的に管理しづらい。本プロジェクトはフラグ制御を優先して `.mcp.json` 方式を既定とし、Skill が必要な場合のみ追加検討する。

---

## トークン・コンテキスト対策

このサーバはツール数が多い（40 超）。常時フル展開はコンテキストを圧迫する。

方針: 既定はフル（上記 `.mcp.json` のとおり）。パフォーマンス計測ではネットワーク・エミュレーションが必要になる場面が多く、最初から絞ると不便になりやすい。
コンテキスト圧迫が問題になってきたタイミングで初めて以下のいずれかを検討する。

- 基本操作だけなら `--slim`（ナビゲーション・スクリプト実行・スクリーンショットの 3 ツールのみ）
- 不要カテゴリを切る: `--category-emulation=false`、`--category-network=false` など
- パフォーマンス計測が主目的なら network / emulation を落として performance を残す

---

## セキュリティ上の前提（base_security_env と整合させる）

- chrome-devtools-mcp はブラウザの中身を MCP クライアントに露出し、閲覧・改変できる。制御下のブラウザで実アカウントにログインしない。
- 向ける先は localhost の開発サーバのみ。本番 URL に実認証情報で向けない。
- `.claudeignore` はファイルを守るが、ブラウザに表示された内容は守らない。秘匿情報を画面に出さない。
- 既存の認証状態を使う等で「起動中の Chrome に接続」する場合、リモートデバッグポートはローカルの任意アプリから制御可能になる。開いている間は機微なサイトを開かない。サンドボックス内で動かす場合は `--browser-url` での手動接続を使う。

---

## 使い方のパターン

ライブデバッグループ（実装直後の自己検証）:

```
localhost:3000 を開いて、コンソールエラーと 4xx/5xx を確認し、
トップとログインのスクリーンショットを撮って
```

目視で追いたいときの推奨は、コミット済み `.mcp.json` を編集しないこと（他メンバーに影響する）。
ローカル一時編集（コミットしない）にとどめるか、ヘッドあり設定をローカル専用ファイルに分ける運用にする。

パフォーマンスチェック（PR 前の任意確認、CI ゲートではない）:

```
localhost:3000 で Lighthouse を実行し、
LCP / CLS / INP と主要な改善提案を出して
```

数値が安定しないので合否ゲートには使わない。回帰の早期検知用。

エミュレーション:

デバイス幅・地域を変えてレイアウトや表示を確認する。

---

## 限界

- 計測値はローカル環境・実行ごとにぶれる。CI の合否基準には使わない。
- a11y の質的な問題（読み上げの妥当性、フォーカス順序の論理）は検出できない。`base_a11y.md` の手動確認が引き続き必要。
- WordPress 構成では非対応。
