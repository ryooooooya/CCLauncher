---
id: operations
verified: 2026-09-09
applies:
  - web-service
topics:
  - operations
  - incident
  - deployment
---

# Operations and incidents

運用準備・障害対応で読む。サービス固有の連絡先、責任者、復旧目標、backup / restore、deploy手順をconsumer docsに記録する。

## 対応

1. 影響範囲・発生時刻・利用者の症状を確認し、対応責任者と記録担当を決める。利用者への連絡は事実・影響・次の更新予定を明確にする。
2. 原因調査と被害拡大防止を進める。関連log・変更履歴を保全し、個人情報やsecretをincident記録へ複製しない。
3. rollback、機能停止、traffic制限、代替経路等から実行可能な緩和策を選ぶ。直前deployとの時間的な一致だけで原因を断定しない。
4. rollback前にDB migration・data形式・外部副作用との互換性を確認する。復元が必要なら検証済みbackupと復旧手順を使う。
5. 利用者の主要経路・error率・data整合性を確認して復旧を判断する。infra障害でも利用者への案内や安全な縮退を検討する。

依存侵害の疑いは [npm security](npm-security.md)、dataやcredentialへの影響は [web security](../standards/web-security.md) と [privacy](../standards/privacy.md) を参照する。

## 事後検証

timeline、原因と寄与要因、検知・復旧の遅れ、うまく働いた対策を記録する。再発防止と復旧改善にowner・期限・確認方法を付ける。backupの存在だけでなくrestore可能性を定期的に検証する。

## 公式参照

- [Google SRE incident response](https://sre.google/workbook/incident-response/)
