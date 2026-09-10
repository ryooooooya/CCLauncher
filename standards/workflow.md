# Workflow

## Roles

- Planner: scope、受け入れ条件、変更対象、risk、検証方法を定義する。
- Implementer: project docsを読み、必要な変更と境界のテストを実装する。
- Reviewer: root cause、architecture issue、affected files、implementation direction、edge casesを返す。原則として全面的な書き直しはしない。
- Verifier: lint / typecheck / tests / security tests / buildを実行し、終了コードと結果を記録する。自己評価では代替しない。

モデル選択、プロセス起動、承認制御は外部runtimeの責務。この標準は実行エンジンを提供しない。

## Risk classification

| Risk | 判定 | 必要な作業 |
|---|---|---|
| low | 境界を変えない文言・見た目の小変更 | 影響に対応する確認 |
| normal | 通常の機能・データ処理の変更 | 受け入れ条件と回帰テスト、project verification |
| high-risk | 下記の境界に触れる変更 | security context、境界テスト、verification、独立review |

Authentication、authorization、billing、admin、file upload、webhook、PII、database permission、security configuration、secret handlingは原則high-risk。
変更行数や受け入れ条件の件数でriskを下げない。小さな設定変更でも境界を変えればhigh-risk。

## Execution

1. Plannerが目的とriskを明確にする。小変更では短い作業メモでよい。
2. Implementerが実装し、Verifierがcommand/testsを実行する。
3. failなら原因を絞って修正し、Verifierを再実行する。
4. 同一問題で2回程度失敗したらReviewerへ診断を依頼する。
5. Reviewerの診断をもとにImplementerが修正し、Verifierが再実行する。
6. passと必要なreviewが揃ったらDone。未実行・失敗・未解決の指摘は明示する。

Reviewerへの引き継ぎには目的、変更差分、失敗コマンド、秘密情報を除いたログ、試した修正を含める。
新しい変更が入った場合は影響する検証を更新する。CIを通すためにテストや制御を弱めない。

## High-risk gate

- 変更前にproject docs/SECURITY.mdと関連するpackage contextを読む。
- 実際の境界に対するsecurity testsを追加・更新する。allowとdenyを検証する。
- project verificationを実行し、必要なサービスが利用できたことも確認する。
- 実装者とは別context / instanceのReviewerによるreviewを行う。同じ実装者の自己点検は独立reviewとして数えない。
- reviewには認証と認可の分離、所有権、privilege escalation、漏洩、失敗時の状態を含める。
- 独立reviewが実行できない場合は未実施と報告し、gate完了と扱わない。

ローカルUI prototypeではproduction CIやE2Eを省略できるが、secret、実ユーザーデータ、公開時のauthorizationの境界は維持する。
project固有判断を優先し、明らかなsecurity regressionは実装せず報告する。

## Evidence

PRには目的と結果、変更した境界、実行コマンドと成否、独立reviewの有無、残る制約を記録する。
verification成功は設定された検証に通った証拠であり、未検証の性質まで保証しない。
