# base_ux_audit

汎用 UX ヒューリスティック（HIGH / MEDIUM）を、節目に走らせる**監査**として運用するための仕組み。
チェックリスト本体は `base_ux_checklist_high.md` / `base_ux_checklist_medium.md`。

---

## 二系統のチェック

UI の品質チェックは性質の違う二系統があり、混ぜると両方が形骸化する。

| | 固有仕様チェック | 汎用ヒューリスティック監査 |
|---|---|---|
| 何を見るか | このプロダクトの ui spec・ストーリーの受け入れ条件 | 一般的な UX 原則（HIG / Material / WCAG / CWV） |
| ソース | `docs/design/ui/{component}.md`、`docs/product/stories/{slug}.md` | `base_ux_checklist_high.md` / `_medium.md` |
| いつ | 構築時に常時参照 | 節目に監査として実行 |
| 出力 | 実装をその場で直す | レポート（合否と根拠）を残す |

CRITICAL だけは例外で、`.claude/rules/base_ux_checklist_critical.md` として常時適用する。
違反が事故に直結するものだけを CRITICAL に置いているため、監査を待たない。

## なぜ監査を「再実行可能」にするのか

一度きりのレビューは、その時点のスナップショットにしかならない。
UI は後から必ず変わるので、通ったはずの項目が静かに壊れる。

レポートを固定パスのファイルとして出力し、同じコマンドで上書き再生成すれば、
**git の差分がそのまま劣化の検出結果**になる。人間は差分だけ見ればよい。

---

## セットアップ: `.claude/commands/ux-audit.md`

以下を `.claude/commands/ux-audit.md` として配置する。`/ux-audit` で実行できるようになる。

````markdown
---
description: 汎用UXヒューリスティック（HIGH/MEDIUM）の監査を実行し、レポートを再生成する
argument-hint: [対象パス or コンポーネント名 or "all"]
---

汎用 UX ヒューリスティック監査を実行する。対象: $1（省略時は "all"）

## 手順

1. チェックリストを読む
   - `.claude/docs/base_ux_checklist_high.md`（必須）
   - `.claude/docs/base_ux_checklist_medium.md`（対象に該当する機能がある場合のみ）

2. 監査対象を確定する
   - `all` の場合: `src/app/` のルートと `src/components/` のコンポーネントを列挙する
   - パス・コンポーネント名が指定された場合: それと、それが依存するコンポーネントに限定する
   - `src/prototypes/` は対象外（adopted 前の検討物のため）

3. 各ルール ID について判定する
   - 判定は `pass` / `fail` / `n/a` の3値。曖昧なまま `pass` にしない
   - `fail` には「どのファイルのどこが、どのルールに、どう反しているか」を1行で書く
   - `n/a` には理由を1行で書く（該当する UI が存在しない等）
   - 実装を読まずに判定しない。該当ファイルを開いて確認する

4. レポートを `docs/ux-audit/{scope}.md` に**上書き**で出力する
   - `{scope}` は引数から決める（`all` なら `all.md`、コンポーネント名ならその名前）
   - 出力形式は下の「レポート形式」に従う
   - 既存ファイルがある場合、前回からの変化（新規 fail / 解消された fail）をレポート冒頭に書く

5. 実装は直さない
   - この監査は検出までが責務。修正は結果を人間が見て指示する
   - ただし `fail` のうち CRITICAL 相当（a11y・タッチターゲット）を見つけたら、
     レポートとは別に会話の中で明示的に警告する

## レポート形式

```markdown
# UX 監査レポート: {scope}

実行日: YYYY-MM-DD / 対象: {対象の説明} / 判定: pass N件 / fail N件 / n/a N件

## 前回からの変化

- 新規 fail: `rule-id`（{ファイル}）
- 解消: `rule-id`
（初回実行時は「初回実行」と書く）

## fail

| ルール ID | 対象 | 内容 |
|---|---|---|
| `touch-target-size` | `src/components/IconButton.tsx` | 32×32px。最小44×44pxを下回る |

## n/a

| ルール ID | 理由 |
|---|---|
| `chart-*` | チャートを使用していない |

## pass

`rule-id-a`, `rule-id-b`, ...（一覧のみ。詳細は書かない）
```
````

---

## 実行のトリガー

**いつ走らせるか（adopted 決定時・実装完了時など）の指定は Blueprint 側の管轄**で、
プロジェクトの `CLAUDE.md` の読み分け表に行として持たせる。
このリポジトリの責務は、チェックリストの提供と再実行手段（このコマンド）の整備まで。

目安として、以下の節目での実行を想定している。

- プロトタイプの adopted を決めたとき（採用案が原則に反していないかの確認）
- 機能の実装完了時（`/ux-audit {slug}` で範囲を絞って実行）
- リリース前（`/ux-audit all`）

---

## 運用ルール

- レポート（`docs/ux-audit/`）は生成物。手編集しない。再実行して上書きする
- レポートはコミットする。差分が劣化検知そのものなので、gitignore しない
- `fail` を放置する場合は、レポートではなく `docs/design/_override.md` に理由を書く。
  次の実行でまた `fail` として上がってくるが、それでよい（判断の記録は override 側にある）
- チェックリスト本体（`base_ux_checklist_*.md`）は上流の資産。プロジェクト側で編集しない

---

最終検証日: 2026-07-27
