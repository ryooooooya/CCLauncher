# Generic adapter

利用するagentにproject rootのAGENTS.mdを読ませる。自動読込がない場合はタスク開始時に明示して渡す。
AGENTS.mdの参照先であるproject docsを読み、必要な `cclauncher context <topic>` の出力だけ取得する。
共有指示の複製やagent固有ファイルからの生成は不要。

外部runtimeがPlanner / Implementer / Reviewer / Verifierの実装を割り当てる。
モデル名をproject configや共有policyに保存しない。commandの実行結果とreviewの独立性を保持する。
詳細は `cclauncher context workflow`。自動実行runtimeはこのpackageに含まれない。
