# docs 全体規約

配置先: `docs/_rules.md`
正本: CCLauncher の `blueprint_docs_rules.md`（直接編集せず、上流を更新して再取得する）

このプロジェクトの `docs/` 配下のドキュメントが従う全体規約。
個別の規約は各ディレクトリの `_rules.md`（`docs/product/stories/_rules.md`、`docs/design/_rules.md`、
`docs/design/tokens/_rules.md`）が持ち、このファイルはそれらに共通する原則と境界定義だけを持つ。

---

## 原則

### 空テンプレを置かない

見出しだけの空ファイル・「TBD」だけのセクションを置かない。書く内容が決まっていないものは
ファイルごと存在させない。存在するドキュメントは常に信頼できる状態を保つ。

理由は、空テンプレがあると「ここに書いてあるはず」という前提で参照され、
実際には何も書かれていないという最悪の形の嘘になるため。人間も AI も同じ事故を起こす。

例外は `_template.md` と `_rules.md`。これらは「書き方の定義」であって「書かれるべき内容の器」ではない。

### 存在するドキュメントは常に正しい

仕様が変わったらドキュメントを同じ変更の中で更新する。「あとで直す」を許すと、
どのドキュメントが信用できるかを毎回確認する必要が生まれ、ドキュメント全体の価値が失われる。

更新できないなら、そのドキュメントを削除するほうがよい。

### 生成物は手編集しない

他のファイルから生成されるドキュメント（`tests/coverage-map.md`、`docs/ux-audit/*.md` など）は
手で編集しない。ソースを直して再生成する。手編集禁止ファイルの一覧は `CLAUDE.md` が持つ。

---

## product/ と design/ の境界

| | `docs/product/`（Blueprint） | `docs/design/`（Printer 由来） |
|---|---|---|
| 問い | 何を作るか | 何で作るか |
| 中身 | deck、content-list、stories | tokens、ui spec、layout spec |
| 固有性 | このプロダクト固有 | プロジェクト横断で育つ汎用資産 |
| 出自 | このリポジトリで書く | 上流（Printer）から同期する |
| 編集 | 直接編集する | 直接編集しない（`_override.md` に書く） |

判断に迷ったら「他のプロダクトでもそのまま使えるか」で切る。使えるなら design/、使えないなら product/。

境界に跨るもの（トークンの規約は Printer 由来だが、値は `src/app/globals.css` にあり
プロジェクト固有）はディレクトリ分類のまま扱う。所有の分類として再定義はしない。

---

## 仕様が変わったときにどれを書き換えるか

上から順に判定し、最初に当たったものを書き換える。複数該当する場合は上から全部書き換える。

1. **目的・コア価値・優先順位が変わった** → `docs/product/deck.md`
   （ここが変わると下位の判断がすべて変わるため、先に人間が決める）
2. **ページ構成・やれることの増減** → `docs/product/content-list.md`
3. **挙動が変わった／増えた** → 該当する `docs/product/stories/{slug}.md`
   （挙動の定義はストーリーだけが持つ。content-list には書かない）
4. **コンポーネントの使いどころ・見た目が変わった** → `docs/design/ui/{component}.md`
   （汎用資産なので、まず上流に還元すべき変更かを判断する。判断は `docs/design/_rules.md`）
5. **色・間隔・タイポの値が変わった** → `src/app/globals.css` の該当トークンを直す
   （`:root` と `.dark` の両方。規約は `docs/design/tokens/_rules.md`）
6. **受け入れ条件が変わった** → テストを同じ変更の中で追随させる（`tests/coverage-map.md` は再生成）

ドキュメントを書き換えずに実装だけ変えることは許さない。逆も同じ。

---

## 参照の向き

- `content-list.md` → stories を slug で参照する（挙動は書かない）
- `stories/{slug}.md` → 他のストーリーの挙動を参照できる。再定義はできない
- `stories/{slug}.md` → ui spec を component 名で参照する
- `ui/{component}.md` → semantic トークンを名前で参照する

逆向きの参照（ui spec からストーリーを指す等）は書かない。汎用資産が固有資産に依存すると
上流に還元できなくなる。

---

## 命名

`slug` と `component` がこの体系を貫くキー。命名から対応ファイルを辿れる状態を保つ。

- slug: ケバブケース。ストーリー・プロトタイプ・E2E テストで同じ値を使う
  （`docs/product/stories/{slug}.md` / `src/prototypes/{slug}/` / `tests/e2e/{slug}.spec.ts`）
- component: パスカルケース。ui spec・実装・単体テストで同じ値を使う
  （`docs/design/ui/{component}.md` / `src/components/{component}.tsx` / `tests/unit/{component}.test.tsx`）
