# Web security

一般的なログイン付きWebサービスの基準。該当する境界を変更するときに読む。provider・所有権・role・公開範囲・例外・検証コマンドはconsumerの `docs/SECURITY.md` に記録する。本文をAGENTS.mdへコピーしない。

## Authorization — 最優先

認証は「誰か」、認可は「その人がこのresourceにこの操作をしてよいか」。ログイン確認だけでアクセスを許可しない。許可の根拠がない場合は拒否する。

ownerの非公開resourceに対する基本例（共有機能などの例外はプロジェクトで明示する）:

| Actor | read / update / delete | list / search / direct ID |
|---|---|---|
| guest | deny | 非公開resourceを返さない |
| user A / owner | 許可された操作のみallow | 自分の範囲のみ |
| user B / other user | deny | 他人の存在・内容を漏らさない |
| admin | 仕様で明示した操作のみ | roleだけで全件公開しない |

すべてのAPI・server処理・DB/storageアクセス経路で、共通の認可処理を通す。middlewareや画面非表示だけを境界にしない。actor・tenant・roleはサーバーで検証した情報から取得し、bodyのowner IDやadminフラグを信用しない。一覧・件数・検索・exportも取得時点で範囲を絞る。更新可能なfieldを限定し、所有者やroleの書換えを防ぐ。認可と更新の間の競合にも備える。

DBのgrantsと、採用する場合のRLS/policiesを最小権限で設計する。RLSを迂回する管理資格情報は通常ユーザーの経路に使わない。private responseを他のactorへ共有cacheしない。**user B → user Aのresourceのdeny**を [security tests](testing.md#security-tests) で検証する。設計の根拠: [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)。

## Authentication

managed authまたは成熟した認証基盤を優先する。独自の署名・パスワード保存・reset処理をbaselineとして実装しない。providerの検証APIでidentityを確認し、未検証のtoken decodeやクライアント申告値を本人確認に使わない。アカウント回復・ログアウト・権限変更時の失効方針と、重要操作の再認証を設計する。ログイン・回復処理にはレート制限と列挙対策を設ける。

## Session / Cookie / CSRF

HTTPSを使い、server管理のsession cookieはSecure・HttpOnly・用途に合うSameSite・狭いscopeを設定する。期限・rotation・失効をproviderと整合させる。ブラウザSDKなどがJSからtokenへアクセスする場合は、provider推奨の構成とXSS対策・残るリスクをSECURITY.mdへ記録し、server専用secretと混同しない。[OWASP Session](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

GET/HEADに状態変更を載せない。cookie等が自動送信される認証では、frameworkのCSRF保護が対象の経路に実際に効くか確認する。保護のない変更経路は検証済みのCSRF token等で守り、信頼するOriginの確認も設計する。SameSiteやCORSだけを代替にしない。[OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

## Input / injection / filesystem

信頼境界で型・長さ・範囲・許可fieldを実行時検証する。クライアントの型や検証は代替にならない。SQLの値はparameter化し、動的な識別子は許可集合に限定する。shellへ入力を連結せず、固定実行ファイルと引数配列を使い、option injectionも防ぐ。外部入力の動的コード実行や無制限なobject mergeを避ける。ユーザー指定pathは基準directoryからの逸脱とsymlinkによる迂回を防ぐ。入力サイズ・処理時間・並行数に上限を設ける。[OWASP SQL injection](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

## XSS

通常のテキスト描画はframeworkのescapeと安全なDOM APIを使う。React / Next.jsでも通常renderingに一律のDOMPurifyを要求しない。`dangerouslySetInnerHTML` や生HTML挿入は原則使用しない。rich HTMLが要件のときだけ、挿入境界で保守されたsanitizerと許可方針を適用する。URLのscheme等は別に検証し、文字列escapeだけで安全としない。[React HTML挿入](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)、[OWASP XSS](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

## SSRF

serverからの取得先は可能ならscheme・host・portのallowlistで限定する。任意URL取得が必要なら専用の制限付き取得経路を設計する。内部・loopback・link-local・metadata等への接続をIPv4/IPv6両方で遮断し、DNS解決から接続まで検証を保つ。redirectは無効化または各hopを再検証する。egress制限・timeout・応答サイズ制限を併用し、資格情報を転送しない。[OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)

## File upload

upload・download・削除にも上記の認可を適用する。用途に必要な形式に限定し、申告MIME/拡張子だけでなく内容も検証する。全量をメモリへ読む前から容量を制限し、解凍後サイズ・画像寸法・処理時間も制限する。保存keyはサーバー生成、実行不可・原則非公開の領域に保存する。必要に応じ隔離・scan・再encodeを行い、検証前に公開しない。HTML/SVG等のactive contentをアプリと同一originで無制限に配信しない。署名URLは有効期間中のアクセス権として扱う。[OWASP Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)

## Secrets / errors / headers

secretは管理基盤や実行環境から取得し、最小権限・環境分離・rotationを設ける。repository、client bundle、props、URL、ログへ含めない。漏えい時は削除だけで終わらせず失効・交換する。エラーは内部stack・DB詳細を返さず、安全な識別子で調査できる形にする。ログの個人情報は [privacy](privacy.md) に従う。

CSP、nosniff、frame制限、referrer方針を配信形態に合わせて設定する。HSTSはHTTPS運用を確認して導入し、subdomainも対象にする場合はその対応を確認する。credential付きCORSは必要なoriginへ限定する。これらは認可やXSS対策の代替ではない。[OWASP Headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)

## Verification

危険な境界を変える場合は [testing](testing.md) に沿って検証する。依存関係は [dependencies](dependencies.md) を参照する。命名・関数長・lint・型設定はframework/qualityの責務であり、ここでは規定しない。ローカルUI prototypeでもsecretや実ユーザーデータを不用意に扱わず、公開時は認可を省略しない。

最終検証日: 2026-09-09。リンク先の知見を参照して本プロジェクトの方針として記述。コードの転載なし。
