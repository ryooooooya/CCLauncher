---
id: ui-ux-tooling
verified: 2026-09-09
applies:
  - web
  - react
topics:
  - ui
  - ux
  - dependencies
---

# UI / UX tooling

UI検証に足りない機能があるときだけ読む。特定のdesign pluginやエージェントを全projectへ必須導入しない。

| 必要な作業 | 最初に使うもの | 関連recipe |
|---|---|---|
| component状態の比較 | 既存preview、必要ならStorybook | [Storybook](storybook.md) |
| 主要フロー・操作性の確認 | 実browserと再現手順 | [UX audit](ux-audit.md) |
| a11yの機械検査と手動確認 | 既存lint、Playwright / axe、keyboard | [Accessibility](accessibility.md) |
| 動きの実装 | CSS、必要ならMotion | [UI motion](ui-motion.md) |
| 遅延・表示崩れの調査 | browser DevTools | [Browser debugging](browser-debugging.md) |

新しいtoolは対応版・license・権限・外部送信・既存toolとの重複を確認する。pluginの配布元と固定版、導入目的、解除方法を記録する。依存は [dependencies](../standards/dependencies.md) に従う。

エージェント固有のcommandやskill導入はadaptersで扱う。旧guideの第三者pluginの一括install・mutable URL取得は引き継がない。projectのdesign systemを正本とし、tool生成物がtokensやcomponentsを複製していないか確認する。

## 検証

一つの代表フローで必要な検査が実行できること、既存buildと検証が通ることを確認する。導入数を品質の尺度にしない。

## 公式参照

- [Storybook framework integration](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite)
- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)
