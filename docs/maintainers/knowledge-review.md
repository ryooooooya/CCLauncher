# 技術情報・ノウハウの月次見直し

担当はリポジトリオーナー。毎月第1週に、GitHubのNew issueから
**Monthly knowledge review**を選び、対象月・担当者・対象SHAを記録する。
月次Issueは手動で作成する。この手順だけでは通知やIssueの自動作成は行わない。
脆弱性の公表、破壊的変更、認可の不具合が分かった場合は月次を待たず対応する。

目的は、採用中の技術に対して正しい情報を保ち、実際の開発で得た知見を
再利用できる形にすること。新しい機能や情報をすべて追加する必要はない。
この文書は見直し手順であり、個々のrecipeを再検証した記録ではない。

## 1. 対象と根拠を集める

`manifest.json`の全entryを一覧として使い、対象SHAのstandards / recipes、
templates、adapters、methods、CLIとの関係を確認する。全entryについて前回の
確認日と未解決事項を確認し、今回詳しく読むもの・次回に回すものを明示する。
セキュリティ関連、採用版の変更、既知の不具合、古い確認日を優先する。

| 領域 | 確認先と見る内容 |
|---|---|
| Next.js / React | [Next.js recipe](../../recipes/nextjs.md)の公式参照先、採用版のrelease / migration notes。API、cache、routing、buildの差分 |
| Supabase | [Supabase recipe](../../recipes/supabase.md)の公式参照先、SDK / CLIのrelease notes。identity、session、grants、RLS、DB tests |
| Web security | [Web security standard](../../standards/web-security.md)のOWASP参照先、採用技術の公式security advisories。認可・cookie・入力境界 |
| 依存 / 配布 | [週次チェック](automation.md#template-dependency-review)、公式advisories、[配布と公開](../distribution.md)。Node / pnpm、lockfile、埋め込まれたCI、公開設定 |
| テスト / agent連携 | [Testing](../../standards/testing.md)、[adapters](../agent-adapters.md)、各ツールの公式仕様。テスト未実行・空suite・skipを失敗として扱えるか |
| その他のrecipe / method | manifestの残りのentryと[Blueprint / Printer](../../methods/blueprint-printer/README.md)。適用対象・参照先・利用実績 |
| 実プロジェクト | 利用者のIssue、PR、失敗ログ、回避策。何が繰り返し困るか、どの指示が過剰・曖昧か |

参照URL、確認日、対象バージョン、該当節を記録する。記事・SNS・AIの提案は
調査のきっかけに使い、技術的な結論は公式資料と必要な実行確認で裏づける。
資料を取得できなかった場合は未確認とする。最新版と採用版を混同しない。

## 2. 実プロジェクトの学びを判断する

失敗した状況、期待した結果、実際の結果、原因、修正、再現・検証結果を短く残す。
秘密情報、実ユーザーのデータ、非公開プロジェクトの内容を公開Issueへ転載しない。
公開可能な最小再現にする。

| 判断 | 反映先 |
|---|---|
| 複数の構成で成り立つ原則 | standards |
| 特定の技術・バージョンの使い方 | recipes |
| 初期状態から繰り返し必要になる実装・検証 | templates / CLIと回帰テスト |
| 特定agentの入口や操作規約 | adapters |
| 任意の開発手法だけに必要 | methods |
| サービス固有の仕様・一度きりの事情 | consumer側のproject docs。共通知識には追加しない |

一例だけを根拠に全プロジェクトへ必須化しない。既存記述を修正・削除できないか
先に考え、同じルールの複製を増やさない。変更不要・不採用も理由を記録する。

## 3. 小さなPRで反映・検証する

月次Issueで各項目を「変更不要 / 修正PR / 保留」に分ける。保留には理由・担当・
期限・追跡Issueを付け、重大な問題を月次の棚上げで放置しない。
PRには根拠、対象ファイル、適用バージョン、consumerへの影響を記載する。

文書はリンクと整合性を確認する。CLIやtemplateの動作を変える場合は対応する
回帰テストと`pnpm verify`を実行し、必須の`verify` / `webapp-example` CIを確認する。
認証・認可・cookie・DB権限等に関わる変更は、関連するdenyケース、実DB / HTTPS
ブラウザで必要な確認、および別context / instanceによる独立レビューを行う。
実施できなかった検証は未確認と明記し、成功したチェックと区別する。
詳細なrisk分類は[workflow](../../standards/workflow.md)に従う。

## 4. verifiedの日付を更新する条件

`verified`はそのentry全体について、適用対象に照らした記述の妥当性を最後に
確認した日とする。対象範囲、公式資料、必要な実行結果をIssue / PRに残した場合に
限り更新する。変更不要でも確認を完了したentryは更新できる。

- recipeはMarkdown先頭の`verified`とmanifest内の同じentryを同じ日付にする。
- standardはmanifestの該当entryを更新する。範囲や根拠はレビュー記録に残す。
- 一部の節だけ確認した場合はその範囲を記録し、entry全体の日付は進めない。
- CI成功、リンクが開けたこと、依存更新候補の取得、月が変わったことだけでは更新しない。
- buildはmetadataの整合性を検査するが、記述の正しさを証明しない。

現状のdoctorは確認日が180日を超える、または未来の日付のentryを警告する。
これは見直しの目安で、安全性や最新性の保証ではない。警告を消すためだけに
日付を一括更新せず、未確認のentryは古い日付のまま追跡する。

## 5. 月次記録を閉じる

各項目の判断、根拠、対応PR、検証結果、保留先と次回の担当・期限が揃ったら
月次Issueを閉じる。未検証・保留がある場合は「全体確認済み」と書かない。
配布内容の変更は[公開手順](../distribution.md#release-policy)に沿って別途リリースする。
マージだけでは公開済みpackageは変わらない。consumerはexact versionを明示更新し、
生成済みのproject docsや検証設定への反映は差分を確認して行う。
