---
name: oms-feature-pipeline
description: OMS機能を1行要求から本番URLまで爆速で届けるパイプライン。PRD→Plan→Implement→Verifyの4フェーズを oms-prp-orchestrator が自律駆動する。新機能追加・既存機能拡張の標準フロー。
---

# OMS Feature Pipeline

everything-claude-code の PRP (Product Requirement Prompt) ワークフローを OMS 向けに最適化したエンドツーエンド機能開発フロー。

## 起動方法

```
/oms-feature <1行要求>
```

または直接 `oms-prp-orchestrator` エージェントを呼ぶ。

## パイプライン全体像

```
[User 1行要求]
      │
      ▼
┌─────────────────────────┐
│ Phase 1: PRD            │  ← oms-prp-orchestrator 自身
│ - 要件分解              │
│ - 参考資料スキャン      │  (reference/screenshot/)
│ - 影響範囲特定          │
└─────────────────────────┘
      │
      ▼
┌─────────────────────────┐
│ Phase 2: Plan           │  ← oms-architect (Opus)
│ - ファイル一覧          │
│ - コンポーネント構成    │
│ - DBスキーマ差分        │
│ - ビルド順序            │
└─────────────────────────┘
      │
      ▼
┌─────────────────────────┐
│ Phase 3: Implement      │  並列実行
│ ┌─────────────────┐     │
│ │ oms-page-builder│     │  ← 新規ページ
│ │ oms-form-master │     │  ← マスタフォーム
│ │oms-field-auditor│     │  ← 参考資料照合
│ └─────────────────┘     │
└─────────────────────────┘
      │
      ▼
┌─────────────────────────┐
│ Phase 4: Verify         │  直列
│ 1. oms-verifier         │  ← type/lint/build/route/db
│ 2. oms-reviewer         │  ← 規約・項目数
│ 失敗 → Phase 3 ループ   │
└─────────────────────────┘
      │
      ▼
[本番デプロイ or ユーザー確認]
```

## 速度最適化

- **並列化**: Phase 3 で依存の無いファイルは同時に複数エージェント起動
- **既存模倣**: 新規デザインより `src/app/customers/page.tsx` 等の既存ページを複製ベースにする
- **スキップ条件**:
  - 参考資料が無ければ Phase 1 の field-auditor はスキップ
  - DB変更が無ければ Phase 4 の drizzle-check はスキップ
- **質問の統合**: ユーザーへの確認は最大1回、複数疑問は箇条書きで一度に聞く

## 品質ゲート（全通過必須）

- ✅ `npm run build` green
- ✅ サイドバーに載っている全URLで 404 が出ない
- ✅ Liquid Glass 規約準拠
- ✅ 全テキスト日本語
- ✅ マスタ系は20項目以上（業務システムレベル）

## 失敗時の挙動

1. 失敗したフェーズを特定
2. 該当エージェントに差し戻し（1回目は具体的エラーを渡す）
3. 2回目失敗したら `oms-architect` にエスカレーション
4. 3回目失敗したらユーザーに報告して判断を仰ぐ
