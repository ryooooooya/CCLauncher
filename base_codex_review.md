# base_codex_review

OpenAI Codex CLI・@codex review の機構と運用の設定（認証・コマンド・レビュー判断基準・GitHub 連携）。

誰が設計し、誰が実装し、誰がレビューするかという開発フロー全体の役割分担は
`base_dev_pipeline.md` が正。このファイルは CLI・GitHub 連携の機構に限る。

---

## Codex の概要

クラウドベースのソフトウェアエンジニアリングエージェント。リポジトリ全体を読み・依存関係を推論し・テストを実行した上で指摘を出す点で、静的解析ツールより深いレイヤーの問題を検出できる。モデルは gpt-5.3-codex。ChatGPT Plus 以上のプランに含まれる。

### Skill（CLI）経由を使う理由

MCP 経由では進捗が見えず、長時間の無応答が発生する。Skill 経由（スラッシュコマンド）にすると実行ログがリアルタイムで表示され、中断の判断もしやすい。

---

## 認証

Codex CLI は ChatGPT ログインと API キーの2方式に対応する。
このプロジェクトでは ChatGPT ログインを使う（人間起点のローカル CLI 実行であり、
CI/CD のような無人実行ではないため）。ChatGPT のプラン枠で動くので API の従量課金は発生しない。

セットアップ:

```bash
# ブラウザが開き ChatGPT の OAuth フローでログインする
codex login

# 認証方式を確認（ChatGPT になっていること）
codex login status
```

すでに API キーでログインしている場合は切り替える:

```bash
codex logout
codex login
```

注意:

- 環境に `OPENAI_API_KEY` が残っていると、意図せず API キー認証になることがある。
  `codex login status` が API key を示す場合は、当該環境変数を外してから `codex login` し直す。
- ChatGPT ログインはプランごとの利用上限に従う。高頻度のレビューで上限に達する運用なら、
  上限なし従量課金の API キー（標準 API 課金）のほうが向く。用途に応じて選ぶ。

---

## CLAUDE.md へのゲートの置き方

CLAUDE.md に追記するゲートは `base_dev_pipeline.md` の「CLAUDE.md に追記するゲート」に一本化した。
このファイルへのゲートを個別に置かず、パイプラインのゲート経由で読みに来させる。

---

## 計画・spec レビューの手順

1. 計画（またはパイプラインの spec）をファイルに書き出す
2. Codex に致命的な問題のみ指摘させる（スタイルや軽微な点は無視させる）
3. 指摘があれば計画を修正し、再レビューする
4. OK が出たらユーザーに提示する

初回レビュー:

```bash
codex exec -m gpt-5.3-codex "このプランをレビューして。瑣末な点へのクソリプはしないで。致命的な点だけ指摘して: {plan_full_path} (ref: {CLAUDE.md full_path})"
```

修正後の再レビュー（文脈を引き継ぐため `resume --last` を必ずつける）:

```bash
codex exec resume --last -m gpt-5.3-codex "プランを更新したからレビューして。瑣末な点へのクソリプはしないで。致命的な点だけ指摘して: {plan_full_path} (ref: {CLAUDE.md full_path})"
```

---

## コードレビューの手順

1. 実装をコミットする
2. コミットハッシュを指定して Codex にレビューさせる
3. 指摘の内容を自分で判断し、対応が必要なものは修正する
4. 修正後は `resume --last` で再レビューする
5. 問題がなくなったらユーザーに報告する

単一コミットのレビュー:

```bash
codex exec -m gpt-5.3-codex "このコードをレビューして。瑣末な点へのクソリプはしないで。致命的な点だけ指摘して: {commit_hash} (ref: {CLAUDE.md full_path})"
```

範囲指定:

```bash
codex exec -m gpt-5.3-codex "このコードをレビューして。瑣末な点へのクソリプはしないで。致命的な点だけ指摘して: {start_hash}..{end_hash} (ref: {CLAUDE.md full_path})"
```

修正後の再レビュー:

```bash
codex exec resume --last -m gpt-5.3-codex "修正したから再レビューして。瑣末な点へのクソリプはしないで。致命的な点だけ指摘して: {commit_hash} (ref: {CLAUDE.md full_path})"
```

レビュー指摘の判断基準:

- セキュリティ上の問題 → 必ず修正
- ロジックの誤り → 必ず修正
- パフォーマンス上の重大な問題 → 修正
- スキーマ / migration の破壊的変更（カラム削除・型変更・NOT NULL 追加等） → 必ず修正
- スタイル・命名・コメント等 → 無視（瑣末な点として扱う）

オシレーション検出:

同じ箇所への指摘が2回以上反復した場合（A→B→A のパターン）、両方のアプローチを比較して優れた方を directive として固定し、以降はそれに従う。directive はコミットメッセージに `directive: {内容}` として記録する。

---

## GitHub PR での @codex review（推奨: 二重化）

Skill（CLI）経由とは別に、GitHub 連携経由のレビュー機能も使える。
CLI 側のゲートを Claude が飛ばした場合の安全網になるため、
"Automatic reviews" をオンにして PR オープン時に自動で走らせることを推奨する。

セットアップ:

1. Codex cloud を有効化（ChatGPT アカウントと GitHub リポジトリを接続）
2. [Codex の設定画面](https://chatgpt.com/codex/settings/code-review)でリポジトリの "Code review" をオン

PR のコメント欄に `@codex review` と書くだけで起動する。"Automatic reviews" をオンにすると PR オープン時に自動で走る。

AGENTS.md にプロジェクト固有のレビュー観点（Review guidelines）を書くと Codex がそれに従う。
雛形は `base_dev_pipeline.md` の「AGENTS.md 雛形」に統合した（実装原則・変更禁止領域と一体で配置する）。

### Skill（CLI）と @codex review の比較

| 観点 | Skill（CLI） | @codex review（GitHub） |
|---|---|---|
| トリガー | `/codex` コマンド | PR コメント |
| 進捗の可視性 | リアルタイムで見える | 見えない |
| 自動化 | 手動呼び出し | PR ごとに自動化できる |
| カスタマイズ | Skill の指示文 | AGENTS.md |
| 実装途中での利用 | できる | PR ベースなので難しい |

---

最終検証日: 2026-07-14
