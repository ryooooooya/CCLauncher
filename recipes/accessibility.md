---
id: accessibility
verified: 2026-09-09
applies:
  - web
  - react
  - playwright
topics:
  - accessibility
  - ui
  - testing
---

# Accessibility

フォーム、navigation、dialog等のUI変更と監査時に読む。達成基準はconsumerの製品要件に記録し、ツールの成功だけで適合を宣言しない。

## 実装・検証

- nativeなbutton / link / inputと関連付けたlabelを優先する。必要なaccessible name、見えるfocus、エラー説明、見出し階層を確認する。
- keyboardのみで主要フローを完了できるか確認する。dialogの初期focus、閉じた後のfocus復帰、不要なfocus trapを検証する。
- zoom・狭い画面・文字拡大・高contrastで操作できるか確認する。色だけで状態を伝えない。motion設定は [UI motion](ui-motion.md) を参照する。
- Playwrightと`@axe-core/playwright`で対象画面・interaction後の状態を検査する。ページ初期表示だけをscanして完了にしない。
- 自動検査が拾わない読み上げ順・説明の意味・操作の分かりやすさを、screen readerと人の操作で確認する。
- 既存lintが持つa11y検査を利用する。検査を追加するだけのためにlint stack全体を増やさない。Storybook採用時は [Storybook](storybook.md) の検証へ統合できる。

結果には対象URL・状態・操作手順・環境・期待結果・実際の結果を残す。既知の除外には理由と解消条件を付け、検査を弱めて成功扱いにしない。

## 公式参照

- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
