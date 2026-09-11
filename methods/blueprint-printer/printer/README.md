# Printer

Blueprintを画面として出力するためのデザイン資産層。tokens規約、UI spec、layout specを持つ。
資産は出力画像ではなく、値とスタイルを含む再利用可能な機構として育てる。

| 資産 | opt-in projectでの配置先 |
|---|---|
| design-rules.md | docs/design/_rules.md |
| tokens-rules.md | docs/design/tokens/_rules.md |
| ui/_template.md | docs/design/ui/_template.md |
| layout/_template.md | docs/design/layout/_template.md |

componentやlayoutの実体・実装はまだ収録していない。実projectで育ったものをレビューして還元する。
[Print](../print.md)がこれらを使って案を生成する。Storybookのセットアップは `cclauncher recipe storybook`。

固定packageから導入し、更新は差分レビューを伴う明示的な作業にする。自動同期しない。
project固有の逸脱は_override.mdに理由と還元判断を残す。一般化できる変更は上流へPRとして還元する。
複数系統への分岐や継続的な還元が必要になった場合に別package化を検討する。
