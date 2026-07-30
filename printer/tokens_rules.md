# デザイントークン規約

配置先: `docs/design/tokens/_rules.md`
正本: CCLauncher の `printer/tokens_rules.md`（直接編集せず、上流を更新して再取得する）

**値のソースは `src/app/globals.css`**。中間の JSON もビルド段も置かない。
Tailwind v4（CSS-first）と shadcn/ui がこのファイルの CSS 変数を直接読むため、
別形式の正本を作ると必ず二重管理になる。

このファイルは値の**書き方**を定める。値そのものはプロジェクト固有なので上流からは配布しない。

---

## 層構造

トークンは3層で持つ。層は CSS の書き場所で表現する。

```
primitive  →  semantic  →  component
（生の値）    （用途）      （特定コンポーネント専用）
:root        @theme inline  :root（接頭辞で区別）
```

### なぜ書き場所で分けるのか

Tailwind v4 では **`@theme` に置いた変数がユーティリティクラスを生成する**。
primitive を `@theme` に置くと `bg-blue-500` がコードから使えてしまい、
「コードから使えるのは semantic のみ」という規約が CSS レベルで破れる。

`:root` に置いた変数は CSS 変数にはなるがユーティリティを生成しない。
これが primitive と semantic の境界の実体になる。

### primitive

生の値。スケールそのもの。用途を持たない。`:root` に置く（ユーティリティを作らせない）。

```css
:root {
  /* primitive: 用途を持たない生のスケール */
  --p-blue-500: oklch(0.62 0.19 253);
  --p-blue-600: oklch(0.55 0.19 253);
  --p-gray-50:  oklch(0.98 0.00 0);
}
```

- 接頭辞 `--p-` を付ける。semantic と混ざると検査できなくなる
- ダークテーマの値はここには書かない（semantic 側で切り替える）

### semantic

用途を名前にエンコードした層。**コードから使えるのはこの層だけ**。
生値を `:root` / `.dark` に置き、`@theme inline` で `--color-*` に写してユーティリティを生成させる。

```css
:root {
  --background:        var(--p-gray-50);
  --foreground:        var(--p-gray-900);
  --primary:           var(--p-blue-500);
  --primary-foreground: var(--p-gray-50);
}

.dark {
  --background:        var(--p-gray-950);
  --foreground:        var(--p-gray-50);
  --primary:           var(--p-blue-400);
  --primary-foreground: var(--p-gray-950);
}

@theme inline {
  --color-background:         var(--background);
  --color-foreground:         var(--foreground);
  --color-primary:            var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}
```

`@theme` ではなく **`@theme inline`** を使う。他の変数を参照する値を `@theme` に置くと、
スコープの解決順で意図しないフォールバックが起きる。

### component

特定コンポーネント専用の値。semantic で表せない場合のみ作る。作りすぎない。
`:root` に `--{component}-{property}` の形で置き、ユーティリティは作らない
（該当コンポーネントの CSS から `var()` で読む）。

```css
:root {
  --button-height-md: 2.5rem;
}
```

---

## shadcn/ui の変数名に合わせる

semantic 層は **shadcn/ui が読む固定名を必ず含める**。名前を独自にすると、
shadcn/ui のコンポーネントがテーマから外れて素の色で描かれる。

必須の組（`:root` と `.dark` の両方 ＋ `@theme inline` の写し）:

`--background` / `--foreground` / `--card` / `--card-foreground` /
`--popover` / `--popover-foreground` / `--primary` / `--primary-foreground` /
`--secondary` / `--secondary-foreground` / `--muted` / `--muted-foreground` /
`--accent` / `--accent-foreground` / `--destructive` /
`--border` / `--input` / `--ring` / `--radius`

チャート・サイドバーを使う場合は `--chart-1`〜`--chart-5`、`--sidebar-*` も同様に持つ。

固定名で足りない用途は**追加する**（消したり読み替えたりしない）。追加の形は同じ:

```css
:root { --warning: oklch(0.84 0.16 84); --warning-foreground: oklch(0.28 0.07 46); }
.dark { --warning: oklch(0.41 0.11 46); --warning-foreground: oklch(0.99 0.02 95); }
@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

### 背景と前景は対で持つ

shadcn の規約に従い、面の色には必ず `-foreground` の対を作る。
任意の組み合わせを許すとコントラスト AA 割れが必ず起きる。

---

## 参照ルール

- **コード（tsx / css）から参照してよいのは semantic 層のみ**。
  ユーティリティ（`bg-primary`）か `var(--primary)` で参照する
- primitive（`--p-*`）を直接参照しない。テーマ切り替えとコントラスト調整が効かなくなる
- component 層は該当コンポーネントの実装からのみ参照する
- 生の値（`#3b82f6`、`16px`）をコードに書かない。任意値の Tailwind クラス
  （`bg-[#3b82f6]`、`p-[13px]`）も同じ扱いで禁止。必要なら先にトークンを足す

層構造違反は機械的に検出できる（`--p-` の出現箇所、任意値クラスの grep）。

---

## space / radius / breakpoint

色以外の名前空間も同じ判断で分ける。

| 対象 | 書き場所 | 理由 |
|---|---|---|
| `--spacing-*` | `@theme` | スケールに用途がなく、`px-4` 等のユーティリティが欲しい。Tailwind の既定を上書きする形で足りる |
| `--radius-*` | `@theme`（`--radius` を参照する場合は `@theme inline`） | shadcn は `--radius` を基準に `--radius-sm/md/lg` を導出する |
| `--breakpoint-*` | `@theme` | レスポンシブ variant（`md:`）を生成させる。px を spec や実装に直書きしない |

Tailwind の既定スケールを丸ごと捨てる場合は `--spacing-*: initial;` のように
名前空間を初期化してから自分の値を並べる。捨てるかどうかは最初に決める（後から狭めると既存実装が壊れる）。

---

## usage は持たない

per-token の usage 説明は書かない。**usage は semantic 命名そのものにエンコードする**。

`--primary` / `--muted-foreground` という名前が用途を既に伝えているなら、
別途「この色は主要アクションに使います」と書く必要はない。二重管理になり、片方が古くなる。

名前を見て用途がわからないなら、説明を足すのではなく**名前を直す**。
名前が usage なので、semantic 命名の承認が実質の判断点になる。

---

## 命名

- semantic は shadcn の規約に揃える（`{role}` と `{role}-foreground` の対）
- 追加する semantic も見た目ではなく役割で命名する（`--blue-button` ではなく `--primary`、
  `--warning`、`--surface-subtle`）
- primitive は `--p-{category}-{scale}`（`--p-blue-500`、`--p-gray-50`）
- 否定形を使わない（`--border-not-focused` ではなく `--border`）
- 用途が判別できない汎用語を避ける（`--main`、`--sub`、`--space-normal`）

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
- shadcn/ui のデフォルトテーマも OKLCH で書かれているため、混在させずに済む

### コントラスト方針

- テキストと背景の組み合わせは semantic の対として定義する（`--foreground` / `--background`、
  `--primary-foreground` / `--primary`）。任意の組み合わせを許すと AA 割れが必ず起きる
- ダークテーマ（`.dark`）は primitive の L を反転させて導き、**導いたあとに AA を再検証する**。
  反転だけでは彩度の高い色が破綻する

---

## 検証（生成しない代わりに検査する）

値を生成物にしないため、正しさはテストで担保する。以下をプロジェクトのテストに置く。

1. **層構造**: `src/` のコード（`src/app/globals.css` を除く）に `--p-` と
   任意値クラス（`bg-[`、`text-[`、`p-[` 等）が出現しないこと
2. **対の網羅**: 面の semantic に `-foreground` の対が存在すること
3. **`.dark` の網羅**: `:root` で定義した semantic が `.dark` にも定義されていること
   （欠けると片方のテーマだけ壊れ、目視では気づきにくい）
4. **コントラスト**: `:root` と `.dark` の各対が WCAG AA を満たすこと（通常テキスト 4.5:1、
   大きいテキスト 3:1、UI コンポーネント 3:1）
5. **参照切れ**: `docs/design/ui/{component}.md` の surface に出てくるトークン名が
   `globals.css` に存在すること

4 は OKLCH の L から機械的に計算できる。目視レビューに任せない。

---

## 担当

| | 人間 | AI |
|---|---|---|
| 設計根拠（スケール・色空間・コントラスト方針） | ○ | 選択肢の提示 |
| semantic 命名の承認 | ○（実質の判断点） | 命名候補の提示 |
| primitive スケールの生成 | — | ○ |
| `.dark` の導出 | 承認 | ○（L 反転 ＋ AA 再検証） |
| `globals.css` への反映 | 承認 | ○ |

`src/app/globals.css` は semantic トークンの正本。実装エージェント（Codex）は変更しない
（`AGENTS.md` の書き込み境界に入る）。値を変えるのは設計側の判断。

## レビュー観点（AI が機械的に検査する）

- 層構造違反（コードからの `--p-` 直参照、生の値・任意値クラスの直書き）
- 命名の曖昧さ・重複（用途が判別できない名前、同義の別名）
- shadcn の固定名の欠落・改名
- `:root` と `.dark` の非対称（片方にしかない semantic）
- ダークテーマ側のコントラスト AA 割れ

---

最終検証日: 2026-07-30
