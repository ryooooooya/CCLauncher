# base_print

ストーリーを入力に、`src/prototypes/{slug}/` へデザイン案を複数生成する**印刷コマンド**の仕組み。
Printer 工程（デザインが必要なときに走る工程）の実行手段。

Printer 資産（tokens / ui spec / layout spec）の正本は CCLauncher の `printer/`。
このファイルはその資産を使って出力する側の運用を持つ。

---

## 印刷とは

ストーリー（何を作るか）と Printer 資産（何で作るか）を突き合わせて、画面の案を出すこと。
人間が判断するのは「どの案を採るか」だけで、案を出すこと自体は生成に寄せる。

出力は**本番と同一リソースで組んだモック**。実コンポーネントと semantic トークンだけを使い、
データはつなぎ込まずに props / args で注入する。adopted になった案は、注入元を実データに
差し替えるだけで本実装の出発点になる。捨てる前提の画像やワイヤーフレームは作らない。

## なぜコマンドにするのか

`/ux-audit` と同じ理由。入力（ストーリー・ui spec・tokens）は後から必ず変わるので、
そのたびに同じ手順を会話で組み立て直すと、参照漏れが起きて出力の質が入力に追従しなくなる。

ドキュメントを入力に取り、固定パスへ出力する再実行可能なコマンドにしておけば、
入力が変わったときに再実行するだけで案が更新される。

| | 入力 | 出力 |
|---|---|---|
| `/print {slug}` | story ＋ layout spec ＋ ui spec ＋ tokens（＋ 既存実装） | `src/prototypes/{slug}/` の複数パターン |
| `/ux-audit {scope}` | 汎用 UX チェックリスト ＋ 実装 | `docs/ux-audit/{scope}.md` |

## 前提

- Storybook が入っていること（プロトタイプを story として置くため。セットアップは `base_storybook.md`）
- `docs/product/stories/{slug}.md` が存在し、文脈層が書かれていること
  （受け入れ条件は未確定でよい。印刷の出力を素材に確定させる順序のため）
- `src/app/globals.css` に semantic トークンが定義済みであること
  （印刷は semantic トークンだけで組む。規約は `docs/design/tokens/_rules.md`）

---

## セットアップ: `.claude/commands/print.md`

以下を `.claude/commands/print.md` として配置する。`/print` で実行できるようになる。

````markdown
---
description: story を入力に src/prototypes/{slug}/ へデザイン案を複数生成（印刷）する
argument-hint: <slug> [パターン数（既定 3）]
---

ストーリー `$1` を印刷する。パターン数: $2（省略時は 3）

計画の確認やパターン方向性の相談を挟まず、最後まで走り切ること。
報告は生成後に1回だけ行う。

## 手順

1. 入力をすべて読む（読まずに書き始めない）

   | 入力 | 何を取るか |
   |---|---|
   | `docs/product/stories/$1.md` | frontmatter（`target` / `pages` / `prototypes` / `adopted`）、文脈層（ゴール・フリクション・推奨 UI）、規範層（定義する挙動・参照する挙動・対象外） |
   | `docs/design/layout/{pattern}.md` | 推奨 UI が指すレイアウトパターン。領域分割・レスポンシブ方針・必須の3状態 |
   | `docs/design/ui/{component}.md` | 推奨 UI が指す各コンポーネントの usage / function / surface |
   | `src/app/globals.css` と `docs/design/tokens/_rules.md` | 使えるのは semantic 層のみ（`--p-*` は参照しない） |
   | `docs/design/_override.md`（あれば） | このプロジェクトの逸脱。上流の spec より優先する |
   | `docs/product/content-list.md` | `pages` の各項目が指す対象ページ |

   - 推奨 UI にレイアウトパターンの指定がない場合、`content-list.md` のページの性質から
     `docs/design/layout/` の既存パターンを選ぶ。新しいパターンをここで定義しない
   - 推奨 UI が指すコンポーネントの ui spec が存在しない場合、spec を勝手に書かない。
     既存のプリミティブで組み、報告に「ui spec 未整備」として挙げる
   - Storybook の MCP server が起動している場合、`get-documentation` で Props を確認する。
     推測で Props を使わない

2. `target` で分岐する

   - `target: new` — レイアウトパターンの領域分割から組み立てる
   - `target: modify` — `pages` で特定した既存ページの実装（`src/app/` の該当ルートと、
     そこから辿れるコンポーネント）を追加の入力として読む。画面全体を作り直さず、
     **既存を出発点にした差分**のパターンを生成する。fixture は既存のデータ形状を引き継ぐ

3. パターンの方向性を決める（既定 3案）

   - 案ごとに**優先する軸を変える**。同じ案の配色違い・余白違いは別案として数えない
   - 軸の例: 情報密度、操作ステップ数、既存画面との一貫性、モバイル優先度、
     フリクションのどこを潰すか
   - ストーリーの「対象外」に書かれているものを実現する案は作らない

4. 生成する

   - 出力先: `src/prototypes/$1/{a,b,c}-{方向性を表す名前}.tsx`
   - story の書き方は `docs/product/stories/_rules.md` の「Story 作成ルール」に従う
     （CSF 3、title は `Prototypes/$1` で揃える、各 story に `@summary` で
     「この案が何を優先しているか」を1行）
   - 守る制約:
     - 本番と同一リソースのみで組む。`src/components/` の実コンポーネントと semantic トークン
     - 色・間隔・タイポの直書き禁止（`#fff`、`16px`、任意値の Tailwind クラスを書かない）
     - トークンが足りない場合も `globals.css` を書き換えない。既存の semantic で組み、
       報告に「トークン不足」として挙げる（値の追加は設計側の判断）
     - モックデータはコンポーネント内にハードコードせず、props か Storybook の `args` で注入する
     - データ取得（fetch / Server Action / DB アクセス）はつなぎ込まない
     - レイアウトパターンが要求する状態（0件・読み込み中・エラー）を story として持たせる
     - 非機能（a11y・モーション・レスポンシブ）は `docs/design/_rules.md` の横断ルールに従う
   - `adopted` が既に決まっている slug を再実行する場合、adopted のファイルは上書きしない。
     新しい案は未使用のレターで追加する（判断済みのものを生成で壊さない）

5. ストーリーの frontmatter の `prototypes` を、生成したファイル名に合わせて更新する

   - `adopted` は書かない。触って選ぶのは人間の判断（`docs/product/stories/_rules.md`）
   - 受け入れ条件もここでは書かない。adopted 決定後に別途ドラフトする

6. 報告する

   - 各案1行（ファイル名 ＋ 何を優先した案か）
   - 使った layout spec / ui spec / semantic トークン群
   - 入力が欠けていたもの（ui spec 未整備、tokens に無い用途、content-list に無いページ）
   - 制約を守れなかった箇所があれば、その理由（守れなかったことを黙って通さない）
````

---

## 実行のトリガー

**いつ走らせるかの指定は Blueprint 側の管轄**で、プロジェクトの `CLAUDE.md` の読み分け表に
行として持たせる。このリポジトリの責務は、コマンドと Printer 資産の提供まで。

目安として、以下を想定している。

- ストーリーの文脈層を書き終えたとき（受け入れ条件を確定させる前）
- 既存画面の改修ストーリー（`target: modify`）を起こしたとき
- ui spec / layout spec / tokens を大きく更新したあと、既存の未実装ストーリーを刷り直すとき

adopted 決定後は `/ux-audit {slug}` で採用案を監査する（`base_ux_audit.md`）。

---

## 運用ルール

- `src/prototypes/` は検討過程の記録。実装完了後も削除せずアーカイブする
  （ライフサイクルは `docs/product/stories/_rules.md`）
- 非採用パターンの story には `tags: ['!manifest']` を付けてエージェントの視界から外す
- 実装完了後の正は受け入れ条件と実装。プロトタイプと実装がずれてもプロトタイプは直さない
- adopted を本実装へ昇格させるのはコピーで行い、`src/prototypes/` 側の原本は残す。
  昇格作業（データつなぎ込み・状態管理・テスト追加）は実装エージェントの担当（`base_agents_md.md`）
- `/ux-audit` は `src/prototypes/` を対象外にしている。adopted を本実装へ昇格させたあとに監査する

---

最終検証日: 2026-07-30
