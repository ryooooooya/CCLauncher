# Adapters

共有の正本はconsumerのAGENTS.md。agent固有の差分だけをここで管理する。

- [Claude](claude/security.md): `init --adapter claude` で参照だけのCLAUDE.mdを配置。
- [Codex](codex/README.md): AGENTS.mdを直接読む。追加ファイル不要。
- [Generic](generic/README.md): 自動読込のないagentにも同じ正本を渡す。

adapterはpackage内に収録するが、consumerへ一般的な説明やsecurity policyをコピーしない。
省略時のadapterはgeneric。選択はinitの一時的なオプションで、project configには保存しない。
共有workflowは [standard](../standards/workflow.md)、移行手順は [guide](../docs/agent-adapters.md)。
