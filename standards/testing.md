# Testing

仕様と信頼境界に対する実行結果で検証する。カバレッジ率や自己評価をセキュリティ保証にしない。

| 層 | 対象 |
|---|---|
| unit | 純粋ロジック・入力検証の正常/境界/異常値 |
| integration | data layer・service境界・DB権限と副作用 |
| E2E | 認証・cookie・navigation・主要なユーザーフロー |
| security | 拒否ケース・所有権・権限昇格。上記の適切な層で実行 |

## Security tests

アクセス方針は [web-security](web-security.md#authorization--最優先) とconsumerのSECURITY.mdのmatrixを正本とする。guest、独立したuser A/B、採用したroleで実経路へアクセスし、各resourceのread・create・update・delete・一覧/検索・件数・直接ID指定を検証する。

- user BがAのresourceを操作できず、owner/tenant/roleの差替えでも迂回できないことを確認する。
- HTTPの拒否statusだけでなく、responseに非公開情報がなく、DB/storageに書換え・副作用がないことを確認する。
- 正当なowner操作の成功も確認する。fixture不備ですべてが拒否されるテストを合格扱いにしない。
- 認可処理を常に成功するmockへ置き換えない。期限切れ・失効session、未認証状態と採用するCSRF対策も検証する。
- DB policyは管理権限だけで検証せず、実際の未認証/一般ユーザー権限で実行する。公開tableはgrantsとRLSの組合せについてselect/insert/update/deleteを検証する。

アプリ境界のケースは `tests/security/`、provider固有DBテストはその標準配置を使う。具体的なランナー・fixture・実行コマンドはrecipeとtemplateで用意する。[OWASP Authorization Testing](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Testing_Automation_Cheat_Sheet.html)

## 変更と完了

認証・認可・課金・管理機能・upload・webhook・PII・DB権限・secret・security設定を変える場合はhigh-riskとして、該当知識とSECURITY.mdを読み、必要なsecurity testを追加/更新し、実装者とは別context/instanceのreviewを受ける。reviewは検証の代替にしない。

仕様変更で実装とテストを同じPRで変更してよい。期待値の変更理由を仕様に結び付け、CIを通すためだけのskip・assertion緩和・検証の削除をしない。失敗の再現を残し、正しい修正で通ることを確認する。

production consumerのverifyはlint・typecheck・tests・build・該当security testsを実行し、失敗を非ゼロ終了で伝える。必要なserviceやcredentialがない場合は未検証として扱い、無言のskipを成功としない。ローカルUI prototypeで省略する検証は範囲とともに記録する。

最終検証日: 2026-09-09。上記は検証方針。consumer向けテスト実装・CIの配布はIssue #6。
