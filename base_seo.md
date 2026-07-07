# base_seo

SEO・メタデータの実装ルール。公開ページを持つプロジェクトで、SEO 対応が必要な場合に参照する。
対象は Next.js / Astro。WordPress は SWELL・プラグインの領分のため対象外。

---

## 1. ページ単位のメタデータ（必須）

すべての公開ページに title と description を固有の内容で設定する。共通文言の使い回しは不可。

### Next.js

```tsx
// layout.tsx（サイト共通）
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: { default: 'サイト名', template: '%s | サイト名' },
  description: 'サイトの説明',
}

// page.tsx（静的ページ）
export const metadata: Metadata = {
  title: 'ページ名',
  description: 'ページ固有の説明',
}

// 動的ページは generateMetadata で
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug)
  return { title: post.title, description: post.excerpt }
}
```

`metadataBase` を必ず設定する（OGP 画像等の相対 URL 解決に必要）。

### Astro

レイアウトコンポーネントで props として受け取り `<head>` に出力する。各ページから title / description を渡すことを必須にする。

```astro
---
// src/layouts/Base.astro
const { title, description } = Astro.props
const canonical = new URL(Astro.url.pathname, Astro.site)
---
<head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
</head>
```

`astro.config.mjs` の `site` を必ず設定する（canonical・sitemap の基点）。

---

## 2. OGP（必須）

- og:title / og:description / og:image / og:url / og:type を設定する
- og:image は 1200x630。Next.js は `opengraph-image.tsx`（または public の静的画像）、Astro は絶対 URL で指定
- Twitter カードは `summary_large_image` を既定にする

```tsx
// Next.js: Metadata に追加
openGraph: {
  title: 'ページ名',
  description: '説明',
  images: ['/og.png'],  // metadataBase で絶対 URL に解決される
},
twitter: { card: 'summary_large_image' },
```

---

## 3. sitemap / robots（必須）

### Next.js

`app/sitemap.ts` と `app/robots.ts` を作成する。動的ページは CMS / DB から一覧を取得して含める。

```ts
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```

### Astro

`@astrojs/sitemap` を導入し、`public/robots.txt` に sitemap の URL を記載する。

```bash
pnpm astro add sitemap
```

---

## 4. 構造化データ（該当時のみ）

該当するコンテンツタイプがある場合のみ JSON-LD を実装する。存在しない情報（架空のレビュー評価等）を入れない。

- 記事: Article / BlogPosting
- パンくず: BreadcrumbList
- FAQ ページ: FAQPage
- 組織・サイト: Organization / WebSite

```tsx
// Next.js: page 内で script タグとして出力
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

JSON-LD の中身にユーザー入力を含める場合は `JSON.stringify` の結果に `<` が含まれないようエスケープする（`</script>` 挿入対策）。

---

## 5. インデックス制御（必須）

- 検索結果・絞り込み・下書きプレビュー等の重複/薄いページには noindex を設定する
- Vercel の Preview Deployment には自動で `X-Robots-Tag: noindex` が付くが、独自ドメインを割り当てた検証環境は対象外なので明示的に noindex を設定する
- 公開前サイト全体を robots.txt の Disallow だけで守らない（クロール拒否とインデックス拒否は別物）

---

## CLAUDE.md に追記するセクション

```markdown
## SEO のルール

- 公開ページには固有の title / description / OGP を必ず設定する（`.claude/docs/base_seo.md` 参照）
- 新しい公開ページ・コンテンツタイプを追加したら sitemap への反映を確認する
- 重複・薄いページには noindex を設定する
```

---

## 動作確認

- [ ] 全公開ページで固有の title / description が出力されている
- [ ] OGP 画像が 1200x630 で絶対 URL 解決されている（SNS のカードバリデータで確認）
- [ ] /sitemap.xml と /robots.txt が返り、sitemap に主要ページが含まれる
- [ ] canonical が正しい URL を指している
- [ ] 検証環境が noindex になっている

---

最終検証日: 2026-07-03
