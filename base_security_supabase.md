# base_security_supabase

このファイルに書かれたルールは、Supabase を使うすべての場面（テーブル作成・クエリ・認証・Storage・スキーマ変更）で常に適用すること。
Supabase 採用プロジェクトでのみ配布される。

前提となる脅威モデル: Supabase では anon key（新命名: publishable key）がクライアントに露出する設計であり、ブラウザから PostgREST 経由で直接テーブルにアクセスできる。したがってサーバーコードの認可チェックだけでは不十分で、RLS（Row Level Security）が実質的に唯一の認可境界になる。RLS のないテーブルは、URL とキーを知っていれば誰でも全行を読み書きできる。

---

## 適用レベルの定義

- strict: 省略できない。違反するコードは生成しない。代替実装を提示する
- warning: 警告を添えた上で代替案を提示する
- advisory: ベストプラクティスとして言及する

---

## 1. RLS（strict）

テーブル作成と RLS 有効化・ポリシー定義は必ずセットで生成する。RLS なしのテーブルを作らない。
ポリシーは「デフォルト拒否 + 操作ごとの明示許可」で書く。UPDATE には USING と WITH CHECK の両方を書く。

```sql
-- DO: テーブル作成と同時に RLS + ポリシー
create table todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  title text not null
);

alter table todos enable row level security;

create policy "own rows select" on todos
  for select using ((select auth.uid()) = user_id);

create policy "own rows insert" on todos
  for insert with check ((select auth.uid()) = user_id);

create policy "own rows update" on todos
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own rows delete" on todos
  for delete using ((select auth.uid()) = user_id);

-- DON'T
create table todos (...);  -- RLS なしで放置
create policy "all" on todos for all using (true);  -- 実質無効化
```

- 公開して良いデータ（記事一覧等）でも RLS を有効化した上で `for select using (true)` を明示する。書き込み系は必ず制限する
- ポリシーが書けない・判断に迷うスキーマはユーザーに確認する。RLS を後回しにする提案はしない

---

## 2. キーの区別（strict）

| キー | 露出 | 用途 |
|---|---|---|
| anon key（publishable key） | クライアント可 | RLS が効いている前提でのみ安全 |
| service_role key（secret key） | サーバー専用 | RLS をバイパスする。管理処理のみ |

- service_role key を `NEXT_PUBLIC_` / `PUBLIC_` プレフィックスの環境変数に置かない
- service_role key を使うクライアント生成は、クライアントバンドルに含まれ得るファイル（"use client"、共有 lib）に書かない。Route Handler / Server Action / サーバー専用モジュール（`import 'server-only'`）に限定する
- service_role の使用は「RLS では表現できない管理処理」に限り、使用箇所をユーザーに提示する
- キーがコード・リポジトリ・クライアントに漏れた場合は即ローテーションを案内する

---

## 3. サーバーでのセッション検証（strict）

サーバーサイド（Server Component / Server Action / Route Handler / middleware）での認可判断には必ず `supabase.auth.getUser()` を使う。
`getSession()` はストレージ上の JWT をデコードして返すだけで Auth サーバーでの検証を行わないため、サーバーでは偽装され得る値として扱う。

```typescript
// DO: Auth サーバーで検証された user を使う
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) return redirect('/login')

// DON'T: 未検証のセッションで認可判断
const { data: { session } } = await supabase.auth.getSession()
if (session) { /* 認可済みとして扱う */ }
```

- クライアントの生成は `@supabase/ssr` を使い、サーバーは `createServerClient`（cookie 連携）、ブラウザは `createBrowserClient` と使い分ける
- middleware はトークンリフレッシュと画面誘導の補助であり、認可の境界にしない。認可は RLS と各データアクセス点で行う（`base_security_code.md` の認可ルールと同じ原則）

---

## 4. Storage（strict）

Storage も `storage.objects` に対する RLS ポリシーで守る。バケットの public / private 設定だけで済ませない。

- バケット作成時に public / private を明示し、private をデフォルトにする
- public バケットに個人情報・ユーザーアップロードの非公開ファイルを置かない
- アップロード・削除は所有者条件付きのポリシーを書く（例: パスの先頭フォルダを `auth.uid()` と一致させる）

```sql
create policy "own folder upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
```

---

## 5. スキーマ変更の経路（warning）

- スキーマ変更はマイグレーションファイル（`supabase migration new` → SQL 記述 → `supabase db push` / CI 適用）経由で行う。ダッシュボードの SQL エディタで直接変更する手順を提案しない
- スキーマ変更後は `supabase gen types typescript` で型を再生成し、差分をコミットする。型とスキーマの乖離はレビュー時のチェック項目（`base_codex_review.md`）

---

## 6. Database Functions / View（warning）

- 関数は `security invoker` をデフォルトにする。`security definer`（RLS を呼び出し元の権限でバイパス）が必要な場合は理由をユーザーに提示して承認を得る
- `security definer` 関数には `set search_path = ''` を必ず付け、オブジェクト参照をスキーマ修飾する
- View は Postgres 15+ なら `with (security_invoker = true)` を付ける（デフォルトは作成者権限で RLS を素通りする）

---

## 7. Auth 初期設定の確認（advisory）

プロジェクト初期化時に以下をユーザーと確認し、結果を CLAUDE.md の「プロジェクト属性」に記録する。

- Redirect URL の allowlist に本番・プレビューのドメインだけが登録されているか
- メール確認（confirm email）が有効か
- 使わない認証プロバイダが無効化されているか

---

## 禁止パターン一覧（即時拒否）

以下のコード・SQL は生成しない。代替を提示すること。

```
RLS を有効化しない create table
create policy ... using (true)  -- 書き込み系での無条件許可
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY  -- service_role のクライアント露出
"use client" ファイル内での service_role クライアント生成
サーバーコードでの getSession() による認可判断
public バケットへの個人情報の保存
ダッシュボード SQL エディタでの本番スキーマ直接変更の提案
```

---

最終検証日: 2026-07-03
