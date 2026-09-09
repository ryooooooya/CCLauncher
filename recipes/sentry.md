---
id: sentry
verified: 2026-09-09
applies:
  - sentry
  - nextjs
topics:
  - observability
  - privacy
  - deployment
---

# Sentry

Sentryを採用する場合の導入確認。監視の目的、対象環境、保持期間、閲覧権限と送信可能なdataをconsumer docsで決める。一般原則は [privacy](../standards/privacy.md) を参照する。

## 設定

- 採用するSDKの版とNext.js runtimeへの対応を確認する。公式setupで示されるclient / serverの初期化箇所を使い、生成設定は差分をレビューする。
- DSNとsource map upload用の認証tokenを区別する。upload tokenはCIのsecretとし、browser bundleへ含めない。公開成果物に不要なsource mapが残らないことを確認する。
- SDKのdata collection設定を採用版の公式資料で確認する。従来の`sendDefaultPii: false`だけで全送信経路からPIIが消えるとは扱わない。
- event・breadcrumbs・logs・trace・Replayの送信内容を個別に確認する。error用`beforeSend`だけで他の経路も処理されると仮定しない。URL query、form本文、token、user情報を取り除く。
- tracing / Replayは目的とdata境界を確認してから有効化する。sample率は流量・費用・必要な診断情報から決め、固定値を全projectへコピーしない。

## 検証

合成dataでclient/serverの試験errorを発生させ、環境・release・stack traceと実際の受信payloadを確認する。source mapの解決とPII除去の両方を確認する。通知先・担当者・復旧手順を [operations](operations.md) とつなぎ、試験用endpointは公開状態に残さない。

## 公式参照

- [Sentry for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Data collected](https://docs.sentry.io/platforms/javascript/guides/nextjs/data-management/data-collected/)
- [JavaScript configuration](https://docs.sentry.io/platforms/javascript/configuration/options/)
