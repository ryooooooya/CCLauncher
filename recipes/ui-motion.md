---
id: ui-motion
verified: 2026-09-09
applies:
  - web
  - react
  - motion
topics:
  - ui
  - accessibility
  - performance
---

# UI motion

状態変化や操作の結果をmotionで伝える場合に読む。既存CSSで足りる演出のためにライブラリを追加しない。

## 実装

- animationの目的、開始・終了状態、interrupt時の挙動を決める。処理の成功をanimationの終了だけで伝えない。
- OSの`prefers-reduced-motion`を尊重する。Motion for Reactを使う場合は`motion/react`の採用版APIを確認し、`MotionConfig`の`reducedMotion="user"`を設定する。
- transform/layoutの抑制だけで十分とは限らない。`useReducedMotion`等でparallax・autoplay・点滅・大きな移動も扱い、静止した代替表現を用意する。
- focusや読み上げを遅延させない。操作中のlayout移動を抑え、低性能端末で再計測する。

## 検証

motion設定の両方、連打、途中のnavigation、keyboard操作を確認する。機能テストは任意の待ち時間に頼らず、最終状態を待つ。計測は [performance](performance.md)、利用可能性は [accessibility](accessibility.md) を参照する。

## 公式参照

- [Motion accessibility](https://motion.dev/docs/react-accessibility)
- [MotionConfig](https://motion.dev/docs/react-motion-config)
- [useReducedMotion](https://motion.dev/docs/react-use-reduced-motion)
