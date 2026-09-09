---
id: ux-audit
verified: 2026-09-09
applies:
  - web
topics:
  - ui
  - ux
  - testing
---

# UX audit

対象フローを決めて実施する再実行可能な監査。常時すべてのUIルールを読み込む方式は使わない。

## 手順

1. 対象URL・build・role・viewport・入力条件を固定する。前回の結果があれば同じ条件で比較する。
2. 主要フロー、loading / empty / error、保存・取消・戻る、誤操作からの回復を確認する。
3. keyboard・touch・狭い画面を確認する。フォームの説明とエラー、navigationの現在位置、文字の読みやすさ、chartの代替情報を確認する。
4. 各項目をpass / fail / n/a / 未検証で記録する。n/aには理由、failには再現手順・期待結果・証拠を付ける。
5. 修正後に同じ操作を再実行し、継続・解消・新規の問題を分ける。

優先度は利用者への影響で決める。操作不能・data loss等を最優先、主要フローの誤解や回復困難を次に、装飾の不統一等をその後に扱う。項目名だけで固定severityを割り当てない。

報告には対象範囲、未検証範囲、再現条件、影響、修正候補を含める。自動検査の詳細は [accessibility](accessibility.md)、速度は [performance](performance.md) を必要時に読む。

## 参照

- [W3C Easy Checks](https://www.w3.org/WAI/test-evaluate/easy-checks/)
- CCLauncher旧UX監査・3段階checklistを統合した運用手順。第三者のchecklist本文は転載していない。
