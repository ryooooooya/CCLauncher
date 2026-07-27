# デザイントークン規約

配置先: `docs/design/tokens/_rules.md`
正本: CCLauncher の `printer/tokens_rules.md`（直接編集せず、上流を更新して再取得する）

`tokens.json` が値のソース。`src/styles/theme.css` はそこから生成する生成物であり、手編集しない。

---

## 層構造

トークンは3層で持つ。

```
primitive  →  semantic  →  component
（生の値）    （用途）      （特定コンポーネント専用）
```

### primitive

生の値。スケールそのもの。用途を持たない。

```json
{ "color": { "blue": { "500": "oklch(0.62 0.19 253)" } },
  "space": { "4": "1rem" } }
```

### semantic

用途を名前にエンコードした層。primitive を参照する。**コードから使えるのはこの層だけ**。

```json
{ "color": { "action-primary": "{color.blue.500}",
             "surface-subtle": "{color.gray.50}" } }
```

### component

特定コンポーネント専用の値。semantic で表せない場合のみ作る。作りすぎない。

```json
{ "button": { "height-md": "{space.10}" } }
```

---

## 参照ルール

- **コード（tsx / css）から参照してよいのは semantic 層のみ**
- primitive を直接参照しない。テーマ切り替えとコントラスト調整が効かなくなる
- component 層は該当コンポーネントの実装からのみ参照する
- 生の値（`#3b82f6`、`16px`）をコードに書かない。必要なら先にトークンを足す

層構造違反はレビューで機械的に検出できる（primitive 名がコードに出現していないかの検査）。

---

## usage は持たない

per-token の usage 説明は書かない。**usage は semantic 命名そのものにエンコードする**。

`color.action-primary` という名前が「主要アクションに使う色」であることを既に伝えているなら、
別途「この色は主要アクションに使います」と書く必要はない。二重管理になり、片方が古くなる。

名前を見て用途がわからないなら、説明を足すのではなく**名前を直す**。
名前が usage なので、semantic 命名の承認が実質の判断点になる。

---

## 命名

- `{category}-{role}-{variant}` の順（`color-action-primary`、`color-surface-subtle`）
- 見た目ではなく役割で命名する（`color-blue-button` ではなく `color-action-primary`）
- 否定形を使わない（`border-not-focused` ではなく `border-default`）
- 用途が判別できない汎用語を避ける（`color-main`、`color-sub`、`space-normal`）

---

## 設計根拠

### スケールの決め方

- space: 4px 基準の等比に近い数列（4 / 8 / 12 / 16 / 24 / 32 / 48 / 64）。
  中間値が欲しくなったら、まずレイアウトのほうを疑う
- font-size: 1.2 前後の比率。行数の多い本文だけスケールから外して可読性を優先してよい
- radius / border-width は3段以内に抑える。段が増えるほど一貫性の判断が難しくなる

### OKLCH を使う理由

- 明度（L）が知覚的に均一なので、L を固定したまま色相を変えても明るさが揃う。
  HSL では色相ごとに体感の明るさが変わり、状態色の並びが崩れる
- L を等間隔で刻めばコントラスト比の予測が立つ。ダークテーマは L の反転で機械的に導ける
- 対応していない環境向けには生成時に sRGB フォールバックを併記する

### コントラスト方針

- テキストと背景の組み合わせは semantic のペアとして定義する（`text-on-surface`、`text-on-action`）。
  任意の組み合わせを許すと AA 割れが必ず起きる
- ダークテーマは primitive の L を反転させて生成し、生成後に AA を再検証する。
  反転だけでは彩度の高い色が破綻するため、検証は自動化する

---

## tokens.json → theme.css の生成

```bash
pnpm tokens:build     # tokens.json を読んで src/styles/theme.css を生成
```

- `theme.css` は生成物。手編集しない。編集したい場合は `tokens.json` を直して再生成する
- 出力は semantic 層と component 層のみ（primitive は CSS 変数として出さない。
  出すとコードから参照できてしまう）
- 生成は変更のたびに実行し、差分をコミットする。CI で「再生成して差分が出ないこと」を検査する

値そのもの（`tokens.json` の中身）はプロジェクト固有なので、上流からは配布しない。
このプロジェクトで生成し、このプロジェクトが所有する。

---

## 担当

| | 人間 | AI |
|---|---|---|
| 設計根拠（スケール・色空間・コントラスト方針） | ○ | 選択肢の提示 |
| semantic 命名の承認 | ○（実質の判断点） | 命名候補の提示 |
| tokens.json の生成 | — | ○ |
| theme.css への変換 | — | ○ |

## レビュー観点（AI が機械的に検査する）

- 層構造違反（コードからの primitive 直参照、生の値の直書き）
- 命名の曖昧さ・重複（用途が判別できない名前、同義の別名）
- `theme.css` が最新の `tokens.json` から生成されているか
- ダークテーマ側のコントラスト AA 割れ
