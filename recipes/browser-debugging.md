---
id: browser-debugging
verified: 2026-09-09
applies:
  - chrome
  - web
topics:
  - debugging
  - testing
  - performance
---

# Browser debugging

画面・通信・runtimeの不具合を再現するときに読む。エージェントへのbrowser tool接続設定はadaptersの責務とする。

## 調査

1. 対象build、URL、account role、viewport、再現操作、期待結果を記録する。分離したテストprofileと合成データを使う。
2. Consoleで最初の関連エラー、Networkでrequest / response / initiator / cacheの状態を調べる。cookieが存在することだけで認証成功とはしない。
3. ElementsでDOM・computed style・layoutを確認する。表示だけの変更なら、networkやserverの変更へ不用意に広げない。
4. 性能問題はPerformance traceで操作を記録し、時間を消費する処理を特定する。仮説を一つずつ変更し、同じ条件で再現する。
5. 修正後に再現手順を繰り返し、必要なら回帰テストへ落とす。手動観察を自動テスト成功と記録しない。

HAR・screenshots・traceにはcookie、token、本文、個人情報が入り得る。共有前に [privacy](../standards/privacy.md) に沿って内容を確認し、必要最小限の証拠を残す。実ユーザーのbrowser profileへの接続を標準にしない。

## 公式参照

- [Chrome Network](https://developer.chrome.com/docs/devtools/network)
- [Chrome Performance](https://developer.chrome.com/docs/devtools/performance)
