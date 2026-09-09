---
id: seo
verified: 2026-09-09
applies:
  - web
  - nextjs-16
topics:
  - seo
  - ui
  - deployment
---

# SEO

検索対象の公開ページで読む。ログイン後のprivate画面へ一律適用しない。公開URLと非公開データの境界を先に決める。

## 実装と確認

- Next.jsではMetadata APIでtitle・description・canonical・Open Graphを定義する。動的ページは`generateMetadata`、相対URL解決は`metadataBase`等の採用版仕様に合わせる。
- sitemapには公開するcanonical URLだけを含める。robotsやnoindexは検索表示の制御であり、private dataのアクセス制御にはならない。
- 見出し、link text、構造化dataを実際のページ内容と一致させる。存在しないratingや実績をmarkupしない。
- 公開環境のHTML、redirect、canonical、metadata、OG画像、sitemapを確認する。preview環境のURLがproductionに混ざらないことも検証する。
- crawl可否と検索順位を分けて報告する。性能は [performance](performance.md)、読みやすさ・操作性は [accessibility](accessibility.md) を参照する。

## 公式参照

- [Next.js metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Google robots introduction](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
