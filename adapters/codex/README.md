# Codex adapter

Project rootのAGENTS.mdを共通の正本として直接読む。別の生成ファイルは不要。
作業ディレクトリに適用されるAGENTS.mdとproject docsを確認し、必要なpackage contextだけ取得する。

CLI / sandbox / approval設定はホスト環境側で管理する。このadapterは設定を書き換えない。
実行できないcommandや拒否された操作は結果に記録し、検証済みとして扱わない。

review機能や別instanceを使う場合、目的・差分・検証結果・残る懸念を渡す。
独立reviewは実装contextから分け、同じcontextの自己点検で代替しない。
具体的なreviewコマンドやGitHub連携は利用環境の機能であり、coreの必須依存にはしない。
共有role・risk・gateは `cclauncher context workflow` を参照する。
