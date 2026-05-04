# ui_ux_skills_setup_guide

3つのUI/UXスキルとチェックリストをClaude Codeで併用するためのセットアップガイド。

---

## 全体像

| スキル | 役割 | インストール方法 |
|---|---|---|
| Impeccable | デザインワークフロー全体。20個のコマンドで段階的に品質を上げる | プラグイン |
| ui-polish (opkod) | Tailwind + shadcn/ui 固有の実装パターン。Refactoring UI原則 | プラグイン |
| ux_checklist_critical | アクセシビリティとタッチ操作の最低ライン。常時適用 | .claude/rules/ に配置 |
| ux_checklist_high / medium | レイアウト・パフォーマンス・フォーム等。必要時に参照 | docs/ に配置 |

---

## 1. Impeccable のインストール

公式サイト: https://impeccable.style/
リポジトリ: https://github.com/pbakaus/impeccable

### 方法A: プラグインマーケットプレイス経由（推奨）

Claude Codeのセッション内で以下を実行:

```
/plugin marketplace add pbakaus/impeccable
```

次に `/plugin` を開き、Discoverタブからインストールする。

### 方法B: npx 経由

```bash
npx skills add pbakaus/impeccable
```

プロジェクトの `.claude/` 配下に自動配置される。

### 方法C: 手動

1. https://impeccable.style/ からZIPをダウンロード
2. プロジェクトルートに展開（`.claude/` ディレクトリが作成される）

### インストール後の初期設定

プロジェクトのデザインコンテキストを保存するために、一度だけ以下を実行:

```
/teach-impeccable
```

これで `.impeccable.md` が生成され、以降のすべてのコマンドがプロジェクトのデザイン方針を参照する。

### 主なコマンド

日常的に使うものを抜粋:

- `/audit` — 技術品質チェック（a11y、パフォーマンス、レスポンシブ）
- `/critique` — UXデザインレビュー（ニールセンのヒューリスティクス、認知負荷評価）
- `/polish` — 出荷前の最終仕上げ
- `/typeset` — タイポグラフィの修正
- `/arrange` — レイアウトとスペーシングの修正
- `/bolder` — つまらないデザインの増幅
- `/quieter` — 過剰なデザインの抑制
- `/animate` — 意図的なモーション追加

---

## 2. ui-polish (opkod) のインストール

リポジトリ: https://github.com/opkod-france/opkod-claude-code-plugins

### 方法A: プラグインマーケットプレイス経由（推奨）

```
/plugin marketplace add opkod-france/opkod-claude-code-plugins
/plugin install ui-polish@opkod-marketplace
```

### 方法B: 手動クローン（グローバル）

```bash
cd ~/.claude/plugins
git clone https://github.com/opkod-france/claude-skill-refactoring-ui.git ui-polish
```

### 方法C: 手動クローン（プロジェクト単位）

```bash
cd your-project/.claude/plugins
git clone https://github.com/opkod-france/claude-skill-refactoring-ui.git ui-polish
```

### 主なコマンド

- `/ui-polish:review [ファイル]` — コンポーネントを分析してデザイン改善提案を出す
- `/ui-polish:refactor [ファイル]` — デザイン原則を適用してコンポーネントをリファクタリング

自動発火もする:
- Tailwind CSSでのスタイリング時
- shadcn/uiコンポーネントの使用時
- 「もっとプロフェッショナルに」「見た目を良くして」等のリクエスト時

---

## 3. UXチェックリストの配置

先に作成した4ファイルを使う。

### 常時適用（CRITICAL）

```bash
# .claude/rules/ に配置すると自動で読み込まれる
cp ux_checklist_critical.md your-project/.claude/rules/
```

### オンデマンド参照（HIGH / MEDIUM）

```bash
# docs/ に配置して、必要時にClaude Codeに参照させる
mkdir -p your-project/docs/ux-checklist
cp ux_checklist_high.md your-project/docs/ux-checklist/
cp ux_checklist_medium.md your-project/docs/ux-checklist/
```

---

## 4. CLAUDE.md への追記

プロジェクトの CLAUDE.md に以下のセクションを追加し、
3つのスキルとチェックリストの存在をClaudeに伝える:

```markdown
## UI/UX

### チェックリスト

- 基本ルール（アクセシビリティ・タッチ操作）→ .claude/rules/ux_checklist_critical.md で常時適用
- レイアウト・パフォーマンス・ナビゲーション → docs/ux-checklist/ux_checklist_high.md
- タイポグラフィ・アニメーション・フォーム・チャート → docs/ux-checklist/ux_checklist_medium.md

### デザインワークフロー

UIの実装・改善時は以下の順序で進める:

1. 実装完了後、`/critique` でUXレビュー
2. 指摘事項を修正
3. `/ui-polish:review` でTailwind + shadcn/ui固有の改善点を確認
4. `/polish` で最終仕上げ
5. `/audit` で技術品質チェック（a11y、パフォーマンス）
```

---

## 5. 実際のワークフロー例

### 新規コンポーネントを作るとき

```
> ユーザープロフィールカードを作って

（Claudeが実装。Impeccableの frontend-design スキルと
 ui-polish の Refactoring UI 原則が自動で適用される。
 .claude/rules/ux_checklist_critical.md のa11yルールも参照される）

> /critique
（ニールセンのヒューリスティクスでUXレビュー。スコアリング付き）

> /ui-polish:review src/components/UserProfileCard.tsx
（Tailwind + shadcn/ui 固有の改善提案）

> /polish
（最終仕上げ。細部の調整）

> /audit
（a11y、パフォーマンス、レスポンシブの技術チェック）
```

### 既存UIを改善するとき

```
> /critique src/pages/settings.tsx
（現状のUX問題を洗い出す）

> /ui-polish:refactor src/pages/settings.tsx
（Refactoring UI原則でリファクタリング実行）

> /audit src/pages/settings.tsx
（技術品質の最終確認）
```

### デザインの方向性を変えたいとき

```
> /bolder
（控えめすぎるデザインを増幅）

> /quieter
（逆に派手すぎる場合は抑制）

> /typeset
（タイポグラフィだけ修正したい場合）

> /arrange
（レイアウトとスペーシングだけ修正したい場合）
```

---

## 6. 競合の可能性と対処

### Impeccable と ui-polish の重複

両方ともビジュアルデザインを扱うが、粒度が異なる:
- Impeccable → 「何をすべきか」のワークフロー層
- ui-polish → 「Tailwind + shadcn/uiでどう実装するか」の具体層

実際に使ってみて、矛盾する指示が出た場合は
ui-polish 側を優先する（スタック固有の知識の方が具体的なため）。

### コンテキストウィンドウの圧迫

3つのスキルを同時にロードするとトークン消費が増える。
対策として:

- チェックリストは CRITICAL（31ルール、3.6KB）のみ常時適用
- HIGH / MEDIUM は docs/ に置いてオンデマンド参照
- Impeccable と ui-polish はスキルとして自動発火するが、
  UI作業をしていないときは読み込まれない（トリガー条件による）

---

## 7. セキュリティ確認

導入前に以下を確認する（外部設定ファイルの安全性チェック）:

- [ ] Impeccable の SKILL.md と references/ の中身を確認
- [ ] ui-polish の SKILL.md、references/、commands/ の中身を確認
- [ ] 不審な hooks や外部通信の指示がないことを確認
- [ ] `.impeccable.md` に機密情報が含まれないことを確認
