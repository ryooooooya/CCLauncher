---
id: supabase
verified: 2026-09-09
applies:
  - supabase
  - supabase-js-2
  - nextjs-16
topics:
  - auth
  - database
  - upload
  - testing
---

# Supabase

Supabase Auth / Postgres / Storageを採用する場合に読む。所有権・roles・公開範囲はconsumerの`docs/SECURITY.md`で決める。共通原則は [web security](../standards/web-security.md) に従う。

## IdentityとSSR

| 必要な情報 | API | 注意 |
|---|---|---|
| 検証済みJWTのidentity | `getClaims()` | 署名検証済みclaimsを利用。最新user recordや即時失効の確認と同一ではない |
| Auth serverの最新user record | `getUser()` | サーバーへの問い合わせを伴う |
| access / refresh token等のraw session | `getSession()` | 含まれるuser objectをidentity・認可の根拠にしない |

`@supabase/ssr`のbrowser / server clientを分け、server clientはrequestごとに作る。Next.jsのcookie更新は公式SSR構成に沿ってProxyからrequestとresponseへ反映する。認証付き応答を共有cacheへ保存しない。認可時には検証済みidentityと対象resourceの権限を突き合わせる。

## Postgresの境界

- Data APIに公開するschema・tableを列挙し、`anon` / `authenticated`に必要なPostgres grantsだけを付ける。schema利用権限、table操作、必要なsequence・functionの権限も確認する。
- 各公開tableにRLSを有効化し、操作別policyを設計する。既存行の条件`USING`と新しい行の条件`WITH CHECK`を区別し、owner変更・別tenantへの移動を防ぐ。
- table作成と同じmigration変更にgrants・RLS・policies・DB testsを含める。grantsがなく全操作失敗する状態を「RLSが正しい」としない。
- view・RPCも公開面に含める。viewの実行権限、`SECURITY DEFINER`関数の所有者・固定search path・EXECUTE権限を確認する。RLSが全経路に自動適用されるとは仮定しない。
- 管理用secret / service-role credentialはserver限定にし、通常利用者のclientと分離する。管理権限で実行した成功を利用者の許可テストにしない。

## DB security tests

`supabase/tests/database/*.sql`にpgTAPテストを置く。使い捨てのlocal Supabaseに対象migrationを適用してから`supabase test db`で実行する。テストはtransaction内でfixtureを作成し、`plan`・`finish`・`rollback`で完結させる。

各公開tableについて`anon`、authenticated user A、authenticated user Bの`select / insert / update / delete`をアクセスマトリクスと照合する。fixture準備後は実際のDB roleとJWT claimsを切り替えて操作する。ownerの成功に加え、他人のID指定・一覧取得・owner偽装insert・owner変更updateのdenyを検証する。select/update/deleteの拒否は例外とは限らないので、返却行・変更行数と保存状態を確認する。DBテストに加えHTTP経路はconsumerのsecurity/E2Eテストで確認する。

## Storageを使う場合だけ

bucketの公開範囲と`storage.objects`の操作別policyを設計する。private read、listing、upload、上書き、deleteを別ユーザーでも検証する。public bucketでprivate dataを守ろうとしない。署名URLを発行するserverにも認可が必要。ファイル検査等は [web security](../standards/web-security.md) を参照する。

## 公式参照

- [getClaims](https://supabase.com/docs/reference/javascript/auth-getclaims) / [getUser](https://supabase.com/docs/reference/javascript/auth-getuser) / [getSession](https://supabase.com/docs/reference/javascript/auth-getsession)
- [SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs)
- [API grants](https://supabase.com/docs/guides/api/securing-your-api) / [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database testing](https://supabase.com/docs/guides/database/testing)
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
