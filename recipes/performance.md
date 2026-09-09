---
id: performance
verified: 2026-09-09
applies:
  - web
  - nextjs
  - chrome
topics:
  - performance
  - testing
---

# Performance

表示・操作の遅延を調べる場合に読む。consumerで重要なページ・端末・通信条件と予算を決める。全サービス共通のbundle上限を押し付けない。

## 計測と改善

- production相当buildを使い、ページ・viewport・network・cache条件を記録してbaselineを測る。lab測定と実利用のfield dataを区別する。
- Core Web Vitalsの良好な目安はLCP ≤ 2.5秒、INP ≤ 200ms、CLS ≤ 0.1。field評価では75 percentileを確認する。単回のLighthouse scoreから全利用者のINPを保証しない。
- LCP要素の画像・font・server応答、interactionのmain thread処理、layout shiftの原因をtraceから特定する。推測だけでmemo化やdynamic importを増やさない。
- Next.jsでは必要なClient Component範囲、画像寸法・配信、font、重い依存の読み込みを確認する。cache変更でprivate dataの境界を弱めない。
- 同条件で複数回測り、ばらつきと機能回帰も確認する。CI予算を追加する場合は安定した計測条件と失敗時の調査手順を併せて置く。

検証結果に変更前後の指標・測定条件・未測定の範囲を残す。詳細な調査は [browser debugging](browser-debugging.md) を参照する。

## 公式参照

- [Web Vitals](https://web.dev/articles/vitals)
- [Chrome Performance reference](https://developer.chrome.com/docs/devtools/performance/reference)
