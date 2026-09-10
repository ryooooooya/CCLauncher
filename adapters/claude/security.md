# Claude adapter

Project rootのCLAUDE.mdは `@AGENTS.md` のみを基本とする。
AGENTS.mdを直接保守し、CLAUDE.mdやrulesから抽出・同期しない。

Claude固有のsandbox / permissions / hooksは利用環境に合わせて設定する。
このadapterは権限拡大、承認スキップ、hookや外部コマンドの自動導入を行わない。
ホストのsandboxとユーザー承認を尊重し、秘密情報を読み込む範囲を必要最小限にする。
hookは補助であり、project verificationや独立reviewの代わりにはならない。

共有policyは `cclauncher context workflow` と関連security contextを読む。
permission設定はproject security decisionとして記録する。モデル割当は外部runtimeが決める。
