---
id: storybook
verified: 2026-09-09
applies:
  - storybook
  - nextjs
  - vitest
topics:
  - ui
  - testing
  - accessibility
---

# Storybook

再利用componentの状態を独立して確認する必要がある場合に採用する。全Webappの必須依存にはしない。一般的なテスト責務は [testing](../standards/testing.md) を参照する。

## 設定

- 既存framework / builder / Vitestの版を調べ、対応するStorybook構成を選ぶ。Next.jsでは公式の`@storybook/nextjs-vite`を候補にし、既存Webpack構成からの移行可否を確認する。
- globals・font・theme等はアプリの正本から読み込む。storybook専用のdesign token複製を作らない。
- loading / empty / error / disabled / long text等の必要な状態をstoriesへ用意する。認証・通信fixtureは合成データを使う。
- interactionはroleやlabelで操作し、見える結果をassertする。採用構成に対応するVitest addonでbrowser内のcomponent testsを実行する。
- a11y addonを有効にし、採用版のテスト設定で違反が失敗として報告されることを確認する。画面の表示だけをCI gateとしない。

## 検証範囲

Storybook buildと対象storiesのテストを実行する。実際のcookie・routing・server data access・認可はアプリのintegration/E2Eで検証する。公開するStorybookには内部情報や秘密を含めない。

## 公式参照

- [Next.js with Vite](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite)
- [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
- [Accessibility testing](https://storybook.js.org/docs/writing-tests/accessibility-testing)
