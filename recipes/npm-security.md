---
id: npm-security
verified: 2026-09-09
applies:
  - npm
  - pnpm
topics:
  - dependencies
  - testing
  - deployment
  - incident
---

# npm ecosystem security

依存追加・更新、CI install、依存由来incidentで読む。原則は [dependencies](../standards/dependencies.md)。package manager自体も版を固定し、その版の設定形式を使う。

## 追加・更新

1. 必要な機能と採用版を決め、registryのpackage名・source repository・license・公開物を照合する。download数やmaintainer数だけを合否にしない。
2. 依存先とlifecycle scriptsを確認し、隔離された環境で追加する。`pnpm add --save-exact`等に確認済みの具体的な`name@version`を渡す。
3. manifest・lockfileの差分をレビューする。予期しない依存やregistry変更は調べる。必要なbuild scriptsだけを採用版の許可設定で管理する。
4. frozen installからbuild・関連テストを実行する。overrideは影響する親依存と互換性を確認し、解除条件を記録する。

## CIでの確認

- pnpmは`pnpm install --frozen-lockfile --ignore-scripts`、npmは対応するpackage-lockで`npm ci --ignore-scripts`から始める。必要な生成・native buildは確認済みの手順として明示する。
- 選択したmanagerで`pnpm audit --audit-level=high`または`npm audit --audit-level=high`を実行する。到達性と対処を記録し、通信失敗を問題なしと扱わない。自動のforce修正はしない。
- Dependency Review・Dependabot等をrepository条件に合わせて有効化する。Actionsの参照もcommit SHAで固定し、更新PRを検証する。実行可能なconsumer CIはIssue #6で追加する。
- 利用可能なprovenance / registry signaturesを確認する。provenanceは由来の証拠であり、悪意や脆弱性がない保証ではない。

## Incident

lockfile、`pnpm why`等の依存経路、実際のinstall/build/deploy履歴から影響範囲を特定する。存在と実行を区別する。疑わしいpackageを調査のために実行しない。

配布・実行を止め、証拠を保持し、露出の可能性があるcredentialを調査して失効・交換する。確認済みの安全な版とcleanな環境から再構築し、lockfileだけでなく成果物も置き換える。復旧条件と事後対応は [operations](operations.md) に従う。

## 公式参照

- [pnpm install](https://pnpm.io/cli/install) / [pnpm audit](https://pnpm.io/cli/audit)
- [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/) / [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
