# base_sentry_setup

Sentry によるエラー監視のセットアップ手順。プロジェクト初期化時（またはリリース前）に一度だけ実行する。
`base_automation_roadmap.md` の「今やる」（Sentry → GitHub Issue 自動作成・通知経路の確保）と、
`base_ops_incident.md` の検知フローが前提とする Sentry 本体の導入がこのファイルの範囲。

---

## 0. 前提の確認

- Sentry アカウントとプロジェクトが作成済みであること（未作成ならユーザーに作成を依頼する。無料枠で開始してよい）
- コスト管理: 無料枠のイベント数上限と、超過時の挙動（ドロップ）をユーザーに伝える。quota アラートの設定を促す

## 1. SDK の導入

### Next.js

```bash
pnpm dlx @sentry/wizard@latest -i nextjs
```

ウィザードが `sentry.*.config.ts` / `instrumentation.ts` / `next.config.js` の書き換えを行う。差分をすべて提示してユーザーの承認を得ること（`base_security_env.md` のルール）。

### Astro

```bash
pnpm astro add @sentry/astro
```

## 2. キーと環境変数の扱い

| 値 | 性質 | 置き場所 |
|---|---|---|
| DSN | 公開可（送信先の識別子。秘密ではない） | `NEXT_PUBLIC_SENTRY_DSN` / `PUBLIC_SENTRY_DSN` |
| SENTRY_AUTH_TOKEN | 秘密（sourcemap アップロード用） | CI の Secrets とローカル `.env.sentry-build-plugin` のみ |

- DSN は公開可能だが、知っていれば誰でもイベントを送れる。スパムイベントが問題になったら Sentry 側の Inbound Filters / rate limit で対処する
- ウィザードが生成する `.env.sentry-build-plugin` が `.gitignore` に入っていることを必ず確認する。AUTH_TOKEN のコミットは即ローテーション対象
- Vercel でビルド時に sourcemap を上げる場合は、Vercel の環境変数に `SENTRY_AUTH_TOKEN` を（Production/Preview のサーバー側スコープで）設定する

## 3. 初期設定の調整

生成された設定に以下を反映する。

```ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // 個人情報の自動収集を無効化（IP アドレス等）。必要になった時に根拠と共に有効化を相談する
  sendDefaultPii: false,
  // トレースはコスト直結。低率から始める
  tracesSampleRate: 0.1,
  // Session Replay を使う場合も同様に低率から
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,
})
```

- `beforeSend` でエラーメッセージ・URL に含まれ得る個人情報（メールアドレス・トークン付き URL 等）のスクラブを検討する（advisory）
- 広告ブロッカーによる送信ブロックが問題になる場合のみ `tunnelRoute`（Next.js）を有効化する。既定では入れない（サーバー負荷とのトレードオフ）

## 4. 通知経路と Issue 連携

導入後、`base_automation_roadmap.md` の「今やる」に従って以下を設定する（Sentry ダッシュボード側の作業。ユーザーと一緒に行う）。

- Alert ルール: 新規 Issue 発生時に通知（Slack / Discord webhook / メール）
- GitHub 連携: Sentry Issue から GitHub Issue を作成できる状態にする
- quota アラート: 使用量が上限に近づいたら通知

## 5. 動作確認

- [ ] 意図的にエラーを投げるテストページ（本番から除外）で、Sentry にイベントが届く
- [ ] sourcemap が解決され、スタックトレースが元コードの行を指す
- [ ] `.env.sentry-build-plugin` がコミットされていない
- [ ] `sendDefaultPii` が false になっている
- [ ] アラートが通知先（Slack / Discord 等）に届く
- [ ] CLAUDE.md の「プロジェクト属性」に監視の状態（Sentry 導入済み・通知先）を追記した

---

最終検証日: 2026-07-03
