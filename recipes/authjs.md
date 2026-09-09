---
id: authjs
verified: 2026-09-09
applies:
  - authjs
  - nextjs
topics:
  - auth
  - testing
---

# Auth.js

Auth.jsを採用すると決めた場合に読む。Supabase Authとの二重導入を標準にしない。採用するprovider・adapter・session strategyとpackageのexact versionをconsumer docsへ記録する。以下の`auth()`はそのAPIを提供する版向けで、旧版へそのまま適用しない。

## 導入と境界

- OAuth等の成熟したproviderを優先し、password resetやJWT署名を自作するためのCredentials例をbaselineにしない。
- Next.jsでは公式のserver側`auth()`でsessionを取得する。client側session表示やnavigation制御を認可に使わない。
- JWT session / database sessionの失効・保存・更新条件を確認する。roles変更や退会が既存sessionへ反映されるまでの条件を`docs/SECURITY.md`に記録する。
- resourceのowner照合に必要な安定したuser IDを、選択したstrategyに対応するcallbackでsessionへ追加する。型拡張だけで実データが追加されるとは考えない。
- 公開sessionには必要な情報だけを含める。provider access token・refresh tokenをclient sessionへ無条件に展開しない。provider設定、redirect先、secretの管理は採用版の公式設定で確認する。

## 検証

guest / owner / other userのresourceアクセス、期限切れ、logout、roles変更後の扱いを実provider連携に近いテスト環境で確認する。server actionやAPIの直接呼び出しも対象にする。共通denyケースは [testing](../standards/testing.md)、認可は [web security](../standards/web-security.md) を参照する。

## 公式参照

- [Protecting resources](https://authjs.dev/getting-started/session-management/protecting)
- [Session strategies](https://authjs.dev/concepts/session-strategies)
- [Extending the session](https://authjs.dev/guides/extending-the-session)
