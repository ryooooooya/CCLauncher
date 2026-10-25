# Claude adapter

Project rootのCLAUDE.mdは `@AGENTS.md` のみを基本とする。
AGENTS.mdを直接保守し、CLAUDE.mdやrulesから抽出・同期しない。

Claude固有のsandbox / permissions / hooksは利用環境に合わせて設定する。
このadapterは権限拡大、承認スキップ、hookや外部コマンドの自動導入を行わない。
ホストのsandboxとユーザー承認を尊重し、秘密情報を読み込む範囲を必要最小限にする。
hookは補助であり、project verificationや独立reviewの代わりにはならない。

Claude Codeのsandboxは既定で無効で、認証情報の組み込み除外リストもない。
利用者は自分が使う認証ファイル・環境変数・通信先を列挙して制限する。
通信先のallowlistなど一部の設定はproject設定では無視されるため、user / managed設定で行う。
キー名と挙動は変わるので、[公式ドキュメント](https://code.claude.com/docs/en/sandboxing)の現行版で確認する。

共有policyは `cclauncher context workflow` と関連security contextを読む。
permission設定はproject security decisionとして記録する。モデル割当は外部runtimeが決める。
