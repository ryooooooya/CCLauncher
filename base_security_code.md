# base_security_code

このファイルに書かれたルールは、コードを生成・編集するすべての場面で常に適用すること。
ユーザーから明示的に例外を求められた場合は、理由を確認してから対応する。

---

## 適用レベルの定義

- strict: このパターンは絶対に生成しない。代替実装を提示する
- warning: 警告を添えた上で代替案を提示する
- advisory: ベストプラクティスとして言及する

---

## 1. TypeScript 設定（strict）

tsconfig.json には必ず以下を含める。

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

`any` 型の使用は禁止。型が不明な外部データには `unknown` を使い、型ガードで絞り込む。

---

## 2. 入力バリデーション（strict）

すべての外部入力（リクエストボディ・クエリパラメータ・ヘッダー・環境変数）は
エントリーポイントで必ず Zod でバリデーションする。クライアントサイドのバリデーションのみは禁止。

```typescript
// DO
import { z } from 'zod'
const UserSchema = z.object({
  email: z.string().email().max(254),
  age: z.number().int().min(0).max(150),
})
const result = UserSchema.safeParse(req.body)
if (!result.success) return res.status(400).json({ error: 'Invalid input' })
const user = result.data

// DON'T
const user = req.body as User
```

---

## 3. SQL インジェクション（strict）

文字列結合・テンプレートリテラルによるクエリ構築は生成しない。
必ずパラメータ化クエリまたは ORM の安全なメソッドを使う。

```typescript
// DO
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId])
// Prisma
const user = await prisma.user.findUnique({ where: { id: userId } })

// DON'T
const query = `SELECT * FROM users WHERE id = ${userId}`
await db.query(query)
```

---

## 4. コマンドインジェクション（strict）

`exec` / `execSync` にユーザー入力を渡すのは禁止。
`spawn` / `spawnSync` を使い、引数を配列で渡す。`shell: true` は使わない。
`eval` / `new Function(string)` の生成は禁止。

```typescript
// DO
import { spawnSync } from 'child_process'
spawnSync('echo', [userInput])

// DON'T
import { exec } from 'child_process'
exec(`echo ${userInput}`)
eval(userInput)
```

---

## 5. プロトタイプ汚染（strict）

`Object.assign` / `lodash.merge` / `_.merge` に外部入力を渡すのは禁止。
JSON.parse した外部データをオブジェクトにマージする前に、`__proto__` / `constructor` / `prototype` キーを除去する。

```typescript
// DO: キーのサニタイズ
function safeMerge(target: object, source: unknown): void {
  if (typeof source !== 'object' || source === null) return
  for (const [key, value] of Object.entries(source)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) continue
    ;(target as Record<string, unknown>)[key] = value
  }
}

// または Object.create(null) で prototype のないオブジェクトを使う
const safe = Object.create(null)

// DON'T
Object.assign(config, JSON.parse(untrustedInput))
```

---

## 6. XSS（strict）

HTML に挿入するすべての文字列は DOMPurify でサニタイズする。
`innerHTML` への直接代入は禁止。テンプレートリテラルで HTML を組み立てるのは禁止。
サーバーサイドレンダリングでは `textContent` を使うか、テンプレートエンジンの自動エスケープに頼る。

```typescript
// DO
import DOMPurify from 'dompurify'
element.innerHTML = DOMPurify.sanitize(userContent)
element.textContent = userInput

// DON'T
element.innerHTML = userInput
document.write(userInput)
```

---

## 7. パストラバーサル（strict）

ユーザー入力をファイルパスに含める場合は、必ず `path.resolve` で正規化した後、
ベースディレクトリ内に収まっているか確認する。

```typescript
// DO
import path from 'path'
const BASE = path.resolve('./uploads')
const requested = path.resolve(BASE, userFilename)
if (!requested.startsWith(BASE + path.sep)) {
  throw new Error('Path traversal detected')
}

// DON'T
const filePath = `./uploads/${req.params.filename}`
fs.readFile(filePath, ...)
```

---

## 8. 認証・パスワード（strict）

認証は自作を第一選択にしない。まず既製の認証基盤（Supabase Auth / Auth.js / Clerk 等）を検討し、
要件上使えない理由がある場合のみ自作する。DB・インフラも同様に、マネージドサービス（BaaS / PaaS）を
自前運用より優先する。Supabase を使う場合は `base_security_supabase.md` のルールを併用すること。
自作する場合はこのセクションとセクション9を厳守し、パスワードリセット・セッション無効化・
アカウントロックまで含めた設計をユーザーに提示する。

パスワードのハッシュは `argon2` を使う。`bcrypt` は可。`md5` / `sha1` / `sha256` は禁止。
比較には `crypto.timingSafeEqual` を使い、タイミング攻撃を防ぐ。

```typescript
// DO
import argon2 from 'argon2'
const hash = await argon2.hash(password)
const valid = await argon2.verify(hash, password)

// タイミングセーフな比較
import { timingSafeEqual, createHash } from 'crypto'
const a = createHash('sha256').update(tokenA).digest()
const b = createHash('sha256').update(tokenB).digest()
const match = a.length === b.length && timingSafeEqual(a, b)

// DON'T
const hash = require('crypto').createHash('md5').update(password).digest('hex')
if (storedToken === inputToken) { ... }  // タイミング攻撃に脆弱
```

---

## 9. JWT（strict）

`alg: "none"` を受け入れる設定は禁止。アルゴリズムを明示的に指定して検証する。
シークレットは環境変数から取得し、コードにハードコードしない。

```typescript
// DO
import jwt from 'jsonwebtoken'
const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
  algorithms: ['HS256'],
})

// DON'T
const decoded = jwt.decode(token)  // 署名検証なし
jwt.verify(token, secret)  // algorithms 未指定（alg:none 攻撃に脆弱）
```

---

## 10. シークレット管理（strict）

API キー・パスワード・接続文字列をコードにハードコードするのは禁止。
すべて環境変数から取得し、envalid などで起動時に検証する。

```typescript
// DO
import { cleanEnv, str } from 'envalid'
const env = cleanEnv(process.env, {
  DATABASE_URL: str(),
  JWT_SECRET: str(),
})

// DON'T
const secret = 'hardcoded-secret-key'
const dbUrl = 'postgresql://user:pass@localhost/db'
```

### クライアント側への露出（Next.js）

- `NEXT_PUBLIC_` プレフィックスの環境変数はビルド成果物に埋め込まれ、全ユーザーに公開される。
  シークレット（API キー・トークン・接続文字列）には絶対に付けない。
  付けてよいのは公開前提の値（計測 ID・公開 URL 等）のみ
- サーバー専用のモジュール（DB クライアント・シークレットを読むコード）には `import 'server-only'` を
  宣言し、クライアントバンドルへの混入をビルドエラーで検出する
- Server Component から Client Component に渡す props にシークレット・内部情報を含めない
  （props はシリアライズされてクライアントに送られる）

```typescript
// DO
// lib/db.ts（サーバー専用モジュール）
import 'server-only'
const client = createClient(process.env.DATABASE_URL!)

// DON'T
// NEXT_PUBLIC_ にシークレットを入れる
// NEXT_PUBLIC_API_SECRET=sk-...
```

---

## 11. HTTP セキュリティヘッダー（warning）

Next.js では `next.config.ts` の `headers()` で最低限以下を全ルートに設定する。

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]
const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}
```

- Content-Security-Policy は nonce ベース（middleware で nonce を生成して `script-src` に付与）が推奨。
  導入コストが見合わない場合も、最低限 `frame-ancestors 'none'`・`object-src 'none'` は設定する
- 埋め込み（iframe）を許可する要件がある場合のみ `X-Frame-Options` / `frame-ancestors` を緩め、
  許可先オリジンを明示する

Express / Fastify には必ず `helmet` を適用する。
CORS は許可するオリジンを明示的に列挙し、`origin: '*'` は禁止。

```typescript
// DO
import helmet from 'helmet'
import cors from 'cors'
app.use(helmet())
app.use(cors({ origin: ['https://example.com'] }))

// DON'T
app.use(cors())  // 全オリジン許可
```

---

## 12. レート制限（warning）

認証エンドポイントには必ずレート制限を設ける。

```typescript
// DO
import rateLimit from 'express-rate-limit'
app.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }))
```

---

## 13. エラーハンドリング（warning）

スタックトレース・内部パス・DBエラーをクライアントに返すのは禁止。
エラーログはサーバーサイドにのみ記録し、クライアントには汎用メッセージを返す。

```typescript
// DO
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err)  // サーバーサイドにのみ記録
  res.status(500).json({ error: 'Internal server error' })
})

// DON'T
res.status(500).json({ error: err.message, stack: err.stack })
```

---

## 14. 依存関係（advisory）

- 新しいパッケージを追加する前に `npm audit` を実行して確認を得る
- `npm install` / `npm update` 前後に差分を提示する
- lockfile（package-lock.json / yarn.lock）はコミットする
- `postinstall` スクリプトを含むパッケージを追加する際は中身を提示してユーザーの承認を得る

パッケージの追加・更新・緊急対応の詳細手順は `base_security_npm.md` を参照すること。

---

## 15. 認可・アクセス制御（strict）

認証（本人確認）と認可（その人がその操作をしてよいか）は別物。ログイン済みであることの確認だけで
データアクセスを許可するコードは生成しない（IDOR / オブジェクトレベル認可の欠如）。

- ユーザー入力（URL パラメータ・body の id 等）で特定されるリソースへのアクセスは、
  必ず「そのリソースの所有者・許可された役割か」をデータアクセス点で検証する

```typescript
// DO: 取得条件に所有者を含める
const doc = await db.document.findFirst({
  where: { id: params.id, userId: session.user.id },
})

// DON'T: ログイン確認だけで id 直指定を許す
const doc = await db.document.findUnique({ where: { id: params.id } })
```

- 認可チェックは middleware やレイアウト層に集約せず、Server Action / Route Handler /
  データアクセス関数の各実行点で行う。middleware は画面誘導の補助であり認可の境界にしない
- 一覧取得はフィルタ（where 句・RLS）で絞る。全件取得後にアプリ側で filter しない
- 役割（admin 等）による分岐は、クライアントから送られた値ではなくサーバー側で取得した
  セッション・DB 上の役割を根拠にする
- Supabase を使う場合、認可境界は RLS（`base_security_supabase.md`）。アプリ側チェックは多層防御の追加層として扱う

---

## 16. Cookie・CSRF（strict）

セッション・認証トークンを保持する Cookie には必ず `httpOnly: true` / `secure: true` /
`sameSite: 'lax'` を指定する。クロスサイト送信が必要な場合のみ、理由を確認した上で
`sameSite: 'none'`（+ CSRF トークン等の追加対策）にする。
トークンを localStorage / sessionStorage に保存するコードは生成しない（XSS で窃取される）。

```typescript
// DO
cookies().set('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
})

// DON'T
localStorage.setItem('token', jwt)
document.cookie = `session=${token}`  // 属性なし
```

状態変更操作の CSRF 対策:

- 状態変更は Server Actions か POST の Route Handler で行う。GET / HEAD で状態を変更しない
- Next.js の Server Actions には Origin / Host ヘッダーの検証が組み込まれている。
  Cookie 認証で状態変更を受ける Route Handler には組み込みの CSRF 保護がないため、
  Origin ヘッダー検証または CSRF トークンを実装する
- `sameSite` は CSRF 対策の補助層であり、単独では境界にしない（サブドメイン・トップレベル
  ナビゲーション経由の抜け道がある）

---

## 17. ファイルアップロード（strict）

- 拡張子・Content-Type ヘッダーはクライアント申告値なので信頼しない。
  マジックバイトで実際のファイル形式を検証する（`file-type` 等）
- 保存ファイル名はサーバー側で生成する（UUID 等）。ユーザー入力のファイル名を
  パスに使わない（セクション7 パストラバーサル）
- サイズ上限を必ず設ける（バリデーションとサーバー / プロキシ両方）
- アプリの公開ディレクトリ（`public/` 等）に直接保存しない。
  オブジェクトストレージ（S3 / Supabase Storage 等）に保存し、配信は署名付き URL か専用ドメインで行う
- ユーザーがアップロードした SVG / HTML はスクリプトを実行できる。同一オリジンでそのまま配信しない。
  画像は `sharp` 等で再エンコードしてから配信すると埋め込みペイロードを無害化できる

```typescript
// DO
import { fileTypeFromBuffer } from 'file-type'
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_SIZE = 5 * 1024 * 1024

const buf = Buffer.from(await file.arrayBuffer())
if (buf.length > MAX_SIZE) return err('File too large')
const type = await fileTypeFromBuffer(buf)
if (!type || !ALLOWED.has(type.mime)) return err('Invalid file type')
const key = `${crypto.randomUUID()}.${type.ext}`  // 名前はサーバーで生成

// DON'T
await fs.writeFile(`./public/uploads/${file.name}`, buf)  // 申告名のまま公開領域へ
if (file.type === 'image/png') { ... }  // クライアント申告の Content-Type を信頼
```

---

## 18. SSRF（strict）

ユーザー入力の URL をサーバーサイドで fetch するコードは、検証なしには生成しない。

- 取得先は許可ドメインの列挙（allowlist）で検証する。deny リスト方式は禁止
- プライベート IP 帯・`localhost`・クラウドメタデータエンドポイント（`169.254.169.254` 等）への
  到達を遮断する
- リダイレクトで検証を迂回できるため、`redirect: 'manual'` で追跡を止めるか、追跡後の URL を再検証する
- DNS rebinding まで守る必要がある場合は、名前解決後の IP を検証してから接続する
  ライブラリ（`ssrf-req-filter` 等）の利用を検討する

```typescript
// DO
const ALLOWED_HOSTS = new Set(['api.example.com', 'cdn.example.com'])
const url = new URL(userInput)
if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
  throw new Error('URL not allowed')
}
const res = await fetch(url, { redirect: 'manual' })

// DON'T
const res = await fetch(req.query.url)  // 任意 URL への到達（内部ネットワーク・メタデータ含む）
```

---

## 19. セキュリティレビューの実施

以下のタイミングで `/security-review` を実行してユーザーに報告する。

- 認証・認可に関わるコードを書いたとき
- 外部入力をDBや shell に渡す処理を書いたとき
- 新しい API エンドポイントを追加したとき
- 依存パッケージを追加・更新したとき

`/security-review` はあくまで補助。Semgrep などの SAST ツールとの併用を推奨として伝える。

---

## 禁止パターン一覧（即時拒否）

以下のコードは生成しない。代替を提示すること。

```
eval(...)
new Function(string)
exec(`...${userInput}...`)
innerHTML = userInput
Object.assign(target, JSON.parse(untrustedInput))
alg: 'none'
md5 / sha1 でのパスワードハッシュ
const secret = '...'  // ハードコードされた認証情報
`SELECT ... WHERE id = ${userInput}`  // 文字列結合クエリ
findUnique({ where: { id: params.id } })  // 所有者条件のない id 直指定アクセス
NEXT_PUBLIC_XXX=<シークレット>  // 公開プレフィックスへのシークレット格納
localStorage.setItem('token', ...)  // 認証トークンの localStorage 保存
fetch(userProvidedUrl)  // 検証なしのユーザー指定 URL 取得（SSRF）
```

---

最終検証日: 2026-07-15
