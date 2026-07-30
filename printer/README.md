# printer

Printer（デザイン資産層）の正本。Blueprint を画面として出力するための機構一式
（tokens 規約、ui spec、layout spec、コンポーネント）を置く。

資産＝**機構**であって、出力結果ではない。値とスタイルを含み、プロジェクト横断で育つ。

---

## 3層の中での位置

| 層 | 問い | 置き場 |
|---|---|---|
| Launcher（作法・規約層） | どう作るか | このリポジトリのルート（`base_*` / `framework_*`） |
| **Printer（デザイン資産層）** | **何で作るか** | **このディレクトリ（`printer/`）** |
| Blueprint（プロダクト固有層） | 何を作るか | 各プロジェクトの `docs/product/`（規約の雛形は `blueprint_*`） |

---

## 収録物と配置先

| ファイル | プロジェクト側の配置先 | 内容 |
|---|---|---|
| `design_rules.md` | `docs/design/_rules.md` | 汎用資産の運用規約（同期・override・非機能の横断ルール） |
| `tokens_rules.md` | `docs/design/tokens/_rules.md` | 層構造・参照ルール・設計根拠・theme.css 生成手順 |
| `ui/_template.md` | `docs/design/ui/_template.md` | ui spec（usage / function / surface）の書き方 |
| `layout/_template.md` | `docs/design/layout/_template.md` | layout spec（画面パターン）の書き方 |

### まだ収録していないもの

- `ui/{component}.md` の実体（Button、Dialog 等の spec）
- `layout/{pattern}.md` の実体（login、list、detail 等）
- コンポーネント実装

これらは値とスタイルを含む実資産で、プロジェクトで実際に育ったものを還元して収録する。
空テンプレは置かない（`blueprint_docs_rules.md` の原則と同じ）。
最初の1つが育つまで、プロジェクト側は `_template.md` に従って自分で書く。

---

## 印刷（資産を使って出力する側）

資産を置くだけでは画面にならない。ストーリーを入力にこれらの資産で `src/prototypes/{slug}/` へ
案を出す**印刷コマンド**（`/print`）を、ルート直下の `base_print.md` が持つ。

- 入力: story の文脈層＋規範層 / 該当 layout spec / usage から選定した ui spec 群 / tokens
  （`target: modify` なら対象ページの既存実装を追加）
- 出力: Storybook stories 形式の複数パターン（本番と同一リソースのみ。データは props / args 注入）

コマンド本体をここではなく `base_print.md` に置くのは、配置先が `.claude/commands/` であって
`docs/design/` ではないため。このディレクトリの収録物は「`docs/design/` に配置される資産」に限る。

---

## 運用ルール

ルート直下の `base_*` と同じ扱いにする。

- 正本はこのリポジトリ。プロジェクト側は raw URL から取得して配置する
- プロジェクト側で直接編集しない。ローカル逸脱は `_override.md` に書く（手順は `design_rules.md`）
- 上流を更新したら、README の再同期プロンプトで既存プロジェクトに反映する

取得 URL:

```
https://raw.githubusercontent.com/ryooooooya/CCLauncher/main/printer/<ファイル名>
```

---

## 別リポジトリへの切り出し条件

Printer の正本は**当面このリポジトリに同居**させる。以下のどちらかが実際に発生した時点で、
別リポジトリに切り出す。

1. **系統分岐**: Printer が2系統以上に分かれる（クライアントワーク用と自社用、
   ブランドごとのトークンセットなど）。1つのディレクトリで両方を持つと、
   どちらの系統に属する資産かが命名でしか区別できなくなる
2. **還元フローの発生**: プロジェクト側で育った資産を Printer に還元する運用が実際に回り始める。
   還元は PR ベースのレビューが要る。Launcher の更新（作法の改訂）と同じリポジトリで
   レビューを混ぜると、変更の性質が違いすぎて履歴が読めなくなる

「そのうち分けたほうがよさそう」では切り出さない。上のどちらかが起きるまでは同居のままでよい。
切り出す際は、このリポジトリの README のファイル一覧と固定 bootstrap プロンプトの
取得 URL を同時に更新する。
