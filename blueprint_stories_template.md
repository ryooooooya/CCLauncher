# ストーリーテンプレート

配置先: `docs/product/stories/_template.md`
正本: CCLauncher の `blueprint_stories_template.md`（直接編集せず、上流を更新して再取得する）

新しいストーリーを書くときは、このファイルの「テンプレート本体」以下をコピーして
`docs/product/stories/{slug}.md` を作る。書き方の規約は `_rules.md` を参照。

---

## テンプレート本体

````markdown
---
title: 商品を検索して絞り込む      # 日本語。人が読んで何の価値かわかる名前
slug: product-search              # ケバブケース。ファイル名と一致させる
target: new                       # new（新規画面） / modify（既存画面の改修）
pages:                            # content-list.md の項目への参照。フリーテキスト不可
  - 商品一覧
prototypes:                       # src/prototypes/{slug}/ 配下のパターン（/print が更新する）
  - a-inline-filter
  - b-modal-filter
adopted: a-inline-filter          # 採用したパターン。未決定なら未記入のまま実装に進まない
adopted_reason: 絞り込み中も結果件数が見えるほうが試行回数が減るため
status: draft                     # draft / frozen / implemented
---

## ゴール

このストーリーが達成したいこと。ユーザーが何をできるようになるかを散文で書く。
deck.md のどのコア価値に紐づくかに触れる。

## フリクション

現状の何が障害になっているか。なぜこの機能が要るのかの根拠。
ここが薄いと、後から「この条件は本当に要るのか」を判断できなくなる。

## 推奨 UI

どのコンポーネント・レイアウトパターンを使うか。ui spec / layout spec を名前で参照する。
判断の根拠（なぜ他の選択肢ではないか）を1〜2行添える。

- コンポーネント: `SearchField`, `FilterChip`, `ResultList`
- レイアウト: `list`

## 定義する挙動

このストーリーが所有する挙動。ID 付き・観測可能・テスト導出可能であること。

- `AC-product-search-01`: 検索欄が空の状態で、2文字以上入力すると、300ms 後に候補リストが表示される
- `AC-product-search-02`: 候補が0件のとき、「該当なし」と検索条件をリセットするアクションが表示される
- `AC-product-search-03`: 絞り込み条件を変更すると、結果件数の表示が更新される

## 参照する挙動

他のストーリーが所有する挙動のうち、このストーリーの中で発生するもの。リンクのみを書き、内容は書き写さない。

- ログイン状態の判定: [auth-login](./auth-login.md) `AC-auth-login-03`

## 対象外

意図的に含めないもの。「まだやらない」と「やらない」を区別して書く。
ここを書いておかないと、レビューで毎回同じ議論が起きる。
````

---

## 各セクションの担当

| セクション | 人間が書く | AI が書く |
|---|---|---|
| frontmatter | target と pages の指定、adopted の判断と選定理由 | slug・prototypes の整合、status の追随 |
| ゴール | ○（価値判断） | ドラフト提示のみ |
| フリクション | ○（価値判断） | ドラフト提示のみ |
| 推奨 UI | 最終選択 | ui spec の usage からの候補導出 |
| 定義する挙動 | レビューと棄却 | ドラフト生成・ID 採番・Given-When-Then 整形 |
| 参照する挙動 | — | リンク整備 |
| 対象外 | ○（線引き） | 落とした条件の記録 |

受け入れ条件を白紙から人間が書かない。文脈層と adopted プロトタイプを素材に AI がドラフトし、
人間は過剰な条件を落とす側に回る。
