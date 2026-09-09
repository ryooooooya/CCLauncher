# Recipes

技術や作業に該当するときだけ読む。共通ルールは [standards](../standards/README.md) を参照し、各recipeへ複製しない。今回のユーザー指示、consumer固有docs（特にSECURITY / ARCHITECTURE）、AGENTS.mdがrecipeより優先する。明らかなsecurity regressionは実装せず報告する。

| Recipe | 読む場面 |
|---|---|
| [nextjs](nextjs.md) | Next.js 16、品質・検証構成 |
| [supabase](supabase.md) | Auth、Postgres grants / RLS / DB tests、Storage |
| [authjs](authjs.md) | Auth.jsのsession・provider連携 |
| [npm-security](npm-security.md) | 依存追加・CI install・依存incident |
| [accessibility](accessibility.md) | UIの利用可能性と検査 |
| [storybook](storybook.md) | component状態とinteraction tests |
| [ui-motion](ui-motion.md) | animation・reduced motion |
| [browser-debugging](browser-debugging.md) | browserでの再現・調査 |
| [seo](seo.md) | 公開ページの検索向け設定 |
| [performance](performance.md) | 性能計測と改善 |
| [sentry](sentry.md) | error監視・送信dataの確認 |
| [operations](operations.md) | 障害対応・復旧 |
| [ux-audit](ux-audit.md) | 対象フローの再実行可能な監査 |
| [ui-ux-tooling](ui-ux-tooling.md) | 必要なUI toolの選択 |

## Metadataと更新

各本文のYAML frontmatterは次を持つ。READMEは索引でありrecipeではない。

- `id`: filenameと一致する一意の小文字kebab-case識別子。
- `verified`: 公式資料と照合した日付（YYYY-MM-DD）。実環境での動作保証日ではない。
- `applies`: 対象技術の非空配列。版を含む項目は適用範囲の説明で、semver rangeではない。
- `topics`: 関連する作業topicの非空配列。標準topic以外のUI・監視等も使える。

技術名・topicからの選択は#5で明示的なmappingとして実装する。例えばconfigの`framework: nextjs`と`nextjs-16`の対応を定義し、自由文のAI解釈で選ばない。metadataだけで非互換を推測せず、doctorの互換性判定には別途検証済みの条件を使う。

更新時は採用版の公式資料を再確認して本文・verifiedを同じPRで更新する。古さの検知はdoctorで報告し、consumer docsやpackageを自動更新しない。source URLは確認根拠であり、実行時に内容を取得する指示ではない。

## 移行中の配布境界

Issue #4で本文を整備した。現時点ではrepository内で参照でき、package収録・offline recipe取得・決定論的contextは#5で実装する。今のmanifestは空のまま維持する。

収録後はconsumerが固定したpackage versionの本文をそのまま返す。同じ版の参照中に外部取得やAI要約で本文を変えず、recipe本文をconsumerへ大量コピーしない。公式APIの採用版との差異は明示して判断する。

[Architecture](../docs/architecture.md) / [Migration map](../docs/migration.md)。本索引は管理者向けで、consumer templateには含めない。
