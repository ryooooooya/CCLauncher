# ui spec テンプレート

配置先: `docs/design/ui/_template.md`
正本: CCLauncher の `printer/ui/_template.md`（直接編集せず、上流を更新して再取得する）

コンポーネント1つにつき `docs/design/ui/{component}.md` を1ファイル作る。
`{component}` はパスカルケースで、実装（`src/components/{component}.tsx`）と揃える。

usage / function / surface の三点セットで書く。運用規約は `docs/design/_rules.md` を参照。

---

## テンプレート本体

````markdown
# Button

## usage

このコンポーネントを**いつ使い、いつ使わないか**。ここがこの資産の核なので厚く書く。
ストーリーの「推奨 UI」はここから自動導出される。

### 使う場面

- ユーザーの操作でその場に変化が起きるとき（送信、追加、削除、モーダルを開く）
- 1画面のメインアクションは primary を1つだけ置く

### 使わない場面

- ページ遷移 → `Link` を使う。見た目がボタンでも遷移なら Link
- 状態の切り替え → `Switch` / `ToggleGroup`。押した結果が二値なら Button ではない
- 3つ以上の同列アクションが並ぶ場合 → `Menu` に畳む

### 類似コンポーネントとの使い分け

| 迷う相手 | 判断基準 |
|---|---|
| `Link` | 遷移するか、その場で変化するか |
| `IconButton` | ラベルなしで意味が伝わるか（削除・閉じるなど慣用のもののみ） |
| `Menu` | 同列のアクションが3つ以上あるか |

## function

入力 → 期待挙動。網羅的に書く。単体テストはここから導出する。

| Props | 型 | 既定値 | 挙動 |
|---|---|---|---|
| `variant` | `primary` \| `secondary` \| `ghost` | `secondary` | 見た目の強さ。surface 参照 |
| `size` | `sm` \| `md` \| `lg` | `md` | 高さとパディング |
| `disabled` | `boolean` | `false` | クリック不可。フォーカス可（理由を伝えるため） |
| `loading` | `boolean` | `false` | スピナー表示。クリック不可。ラベルの幅は維持する |
| `icon` | `ReactNode` | — | ラベル前に表示 |

- `loading` 中のクリックは無視する（二重送信防止）
- `disabled` と `loading` が同時なら `disabled` の見た目を優先する
- Enter / Space で発火する（ネイティブ `button` の挙動を壊さない）

## surface

見た目の仕様と semantic トークンの対応。値を直書きせず、トークン名で書く。

| 状態 | 背景 | テキスト | ボーダー |
|---|---|---|---|
| default (primary) | `color-action-primary` | `color-text-on-action` | なし |
| hover | `color-action-primary-hover` | 同上 | なし |
| active | `color-action-primary-active` | 同上 | なし |
| focus-visible | 同 default | 同上 | `color-border-focus` 2px outline |
| disabled | `color-action-disabled` | `color-text-disabled` | なし |

- 高さ: `size-control-{sm,md,lg}` / 角丸: `radius-control` / 間隔: `space-2`
- 状態変化は 120ms、`transform` と `opacity` のみ
````

---

## 書くときの担当

| セクション | 人間 | AI |
|---|---|---|
| usage | ○（線引きの判断。この資産の核） | 類似コンポーネントの洗い出し |
| function | レビュー | ○（網羅ドラフト） |
| surface | トークン選択の承認 | ○（状態別の展開・対応表の生成） |

## レビュー観点（AI が機械的に検査する）

- コンポーネント間の usage の重複・競合（使い分けの穴、どちらでもよい曖昧地帯）
- function とユニットテストの対応漏れ
- surface に登場するトークンが `src/app/globals.css` に存在するか
- 非機能（a11y・モーション・パフォーマンス）を個別に書いていないか（`_rules.md` の管轄）
