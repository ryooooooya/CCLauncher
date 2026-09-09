# Dependencies

依存関係の追加・更新・監査時に読む。package数や人気を安全性の根拠にしない。

## 固定と実行

- 意図したpackage名・配布元を確認する。direct dependencyはexact versionを基本とし、lockfileをcommitする。CIはfrozen installで不一致を失敗させる。
- 変更はmanifestとlockfileをレビューし、新しい推移的依存・配布元・実行script・権限の増加を確認する。手作業の全package調査だけに依存しない。
- install/build scriptを実行する範囲を管理し、必要なものだけ有効にする。未信頼コードのインストール環境にproduction secretを渡さない。script無効化は実行時の安全を保証しない。
- CIの外部actionも固定commitへpinし、必要な権限だけを付与する。自動更新はPRと検証を通す。個別設定はrecipe/templateに置く。

## 継続検証

dependency review、既知脆弱性のaudit、更新通知、secret scanningをCI/運用へ組み込む。scanの失敗や未実行を「問題なし」と扱わない。実行可能な悪性挙動を調べるsupply-chain scanもリスクに応じて併用する。

問題の重要度・到達可能性・影響環境を評価し、修正または担当者・期限・理由のある例外を記録する。overrideは限定して互換性を検証し、親依存の対応後に解消する。auditを通すために根拠なく検知を無効化しない。[OWASP Dependency Management](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.html)

provenanceは配布物とsource/buildの関係を検証する材料であり、悪意あるコードがない証明ではない。lockfileのintegrityも同じ内容を取得したことの検証であり、安全性そのものではない。[npm provenance](https://docs.npmjs.com/generating-provenance-statements/)

侵害が疑われる場合は実行・公開を止め、影響versionと環境を特定し、信頼できる環境から復旧する。露出し得た資格情報の扱いは [web-security](web-security.md#secrets--errors--headers) を参照する。具体的なnpm調査・復旧手順はIssue #4のrecipeで扱う。

最終検証日: 2026-09-09。特定の過去インシデントの未検証な断定は移植しない。
