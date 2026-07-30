# design 資産の運用規約

配置先: `docs/design/_rules.md`
正本: CCLauncher の `printer/design_rules.md`（直接編集せず、上流を更新して再取得する）

`docs/design/` 配下は Printer（デザイン資産層）由来の**汎用資産**。このプロジェクトで生まれたものではなく、
プロジェクト横断で育つ機構を持ち込んでいる。プロダクト固有の判断は `docs/product/` の管轄。

これらの資産を使ってストーリーから画面案を出す手順（印刷）は `.claude/docs/base_print.md`（`/print`）。

---

## 出自と同期

- 出自: `https://github.com/ryooooooya/CCLauncher` の `printer/`
- 取得: `https://raw.githubusercontent.com/ryooooooya/CCLauncher/main/printer/<ファイル名>`

同期のタイミング:

1. プロジェクト初期化時（bootstrap が配置する）
2. 上流に影響の大きい変更が入ったと知らされたとき
3. デザインの見直しなど、資産をまとめて更新する節目

同期は自動では走らない。差分を一覧して人間が承認したものだけ上書きする。

---

## ローカル逸脱は override に書く

このプロジェクト固有の事情で汎用資産から外れる必要が出たとき、**元ファイルを直接編集しない**。
同じディレクトリに `_override.md` を作り、そこに書く。

```markdown
# _override.md

## ui/Button.md からの逸脱

- variant `ghost` の hover 時の背景を `--color-surface-subtle` ではなく `--color-surface-muted` にする
- 理由: このプロダクトは背景色が濃く、subtle だと状態変化が見えないため
- 還元判断: 保留（背景が濃いテーマ全般に効く可能性がある）
```

直接編集してしまうと、次の同期で上書きされるか、上書きを避けるために同期そのものを止めることになる。
どちらも汎用資産を持ち込んだ意味を失わせる。

### 還元判断

`_override.md` の各項目には還元判断を書く。

- **還元する**: 他プロジェクトでも効く一般性がある → 上流の `printer/` に PR を出し、
  マージされたら override から消す
- **還元しない**: このプロダクト固有の事情 → override に残したままにする。理由を明記する
- **保留**: 判断材料が足りない → 次の同期タイミングで再判断する

判断は都度、人間が行う。溜めてから一括で判断しようとすると、当時の文脈が失われて判断できなくなる。

---

## 非機能の横断ルール

コンポーネント個別に書かず、ここで一度だけ定める。ui spec 側では繰り返さない。

### アクセシビリティ

- コントラスト比は WCAG AA（通常テキスト 4.5:1、大きいテキスト 3:1、UI コンポーネント 3:1）を満たす
- インタラクティブ要素はキーボードのみで到達・操作・離脱できる
- フォーカスインジケータを消さない。`outline: none` は代替の可視表現とセットでのみ許可
- 状態を色だけで伝えない（エラー・成功・選択は形／アイコン／テキストを併用）
- タッチターゲットは最小 44×44px
- 詳細な検査項目は `.claude/rules/base_ux_checklist_critical.md` と
  `.claude/docs/base_ux_checklist_high.md` を参照。ここに転記しない

### モーション

- `transform` と `opacity` のみアニメーションする
- `prefers-reduced-motion: reduce` を尊重し、必須でないモーションは無効化する
- 詳細は `.claude/docs/base_ui_motion.md`

### パフォーマンス

- コンポーネント単位で画像・フォント・アイコンの読み込み方針を持たない。プロジェクト全体の予算に従う
- 予算と計測は `.claude/docs/base_performance.md`

### レスポンシブ

- ブレークポイントは tokens が持つ。ui spec / layout spec で px 直書きしない
- コンポーネントは自身の幅に応じて振る舞う（ビューポート幅を直接見ない）。
  画面幅による分岐は layout spec の管轄

---

## 層の境界

| | 書く場所 | 書かない場所 |
|---|---|---|
| 値（色・間隔・タイポ） | `tokens/tokens.json` | ui spec・実装 |
| コンポーネントの使いどころ | `ui/{component}.md` の usage | ストーリー |
| 画面の構成原則 | `layout/{pattern}.md` | ui spec |
| どの画面で何ができるか | `docs/product/` | design 配下すべて |

design 配下からプロダクト固有のドキュメント（stories、content-list、deck）を参照しない。
参照が発生した時点で、その資産は汎用ではなくなっている。

---

## レビュー観点（AI が機械的に検査する）

- `_override.md` を経由しない直接編集の検出（上流との差分を取る）
- 上流との差分の可視化（同期時に必ず提示する）
- ui spec に登場するトークン名が `tokens.json` に存在するか
- design 配下から `docs/product/` への参照が発生していないか
