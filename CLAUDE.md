@AGENTS.md

# OMS プロジェクトルール

## 専属エージェントチーム

このプロジェクトには専属のエージェント・スキル群が常駐しています。`.claude/agents/` および `.claude/skills/` を参照。

### Agents
- **oms-prp-orchestrator** (Opus) ⭐ — 1行要求から機能完成までを自律駆動（PRD→Plan→Impl→Verify）
- **oms-architect** (Opus) — 設計・技術判断・リファクタリング計画
- **oms-page-builder** (Sonnet) — 新規ページ作成、Liquid Glass UI実装
- **oms-form-master** (Sonnet) — マスタ登録の大型フォーム設計（20-50項目）
- **oms-reviewer** (Sonnet) — コード品質・規約・項目漏れ監査
- **oms-field-auditor** (Opus) — 参考資料との項目レベル照合
- **oms-verifier** (Sonnet) — typecheck/lint/build/route/db 検証ループ
- **oms-tdd-guide** (Sonnet) — `src/lib/` 配下のビジネスロジックにTDDを強制

### Skills
- **oms-conventions** — コーディング規約・デザイントークン完全リファレンス
- **add-page** — 新規ページ追加ワークフロー
- **audit-reference** — 参考資料照合監査
- **oms-feature-pipeline** ⭐ — PRD→Plan→Impl→Verify の4フェーズ爆速開発
- **oms-verification-loop** — 検証ループランブック
- **oms-click-path-audit** — 全ボタン/リンクの死活監視（404・空ハンドラ検出）

### 使い分け
- **1行要求を機能にする** → oms-prp-orchestrator (⭐ 最優先)
- 新機能の設計 → oms-architect
- 新規ページ作成 → oms-page-builder
- マスタ登録フォーム拡充 → oms-form-master
- 実装後のレビュー → oms-reviewer
- 項目漏れチェック → oms-field-auditor + audit-reference
- コミット前検証 → oms-verifier + oms-verification-loop
- ビジネスロジック → oms-tdd-guide
- 「ボタン動かない」系 → oms-click-path-audit

## 自律ガード（.claude/hooks.json）

- `pre:bash:block-no-verify` — `git commit --no-verify` を遮断
- `pre:bash:block-dangerous` — `rm -rf /`, `drop database`, 強制pushを遮断
- `pre:config-protection` — eslint/tsconfig/next.config の無断弱体化を警告
- `post:edit:oms-design-quality` — グラデーション・`<input type="date">`・英語UIを警告
- `stop:oms-verify` — セッション終了時に tsc バッチ実行

## UIコンポーネント規約

### 日付選択
**日付選択UIには必ず `@/components/ui/date-picker` の `DatePicker` を使う。**
- `<input type="date">` の使用は禁止（デザインがデフォルトで崩れる）
- カレンダーピッカーが必要なシーンが来たら、迷わずこれを使う
- ガラス質感のポップオーバーで日本語表記対応済み

```tsx
import { DatePicker } from "@/components/ui/date-picker";

<DatePicker placeholder="開始日を選択" onChange={(date) => ...} />
```

### Liquid Glass UI
- カード: `bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]`
- グラデーション禁止
- 全テキスト日本語
- 角丸 `rounded-xl` 以上

## 機能間連動フェーズの設計規約

OMSの次フェーズは「受注↔出荷↔入金↔在庫↔発注」の状態遷移と自動連鎖の実装。
画面間の情報の流れが本体になるため、UIに状態遷移を散らさない。

### 状態機械は src/lib/state-machines/ に集約
- 各ドメインの状態定義・遷移関数・ガード条件はすべて `src/lib/state-machines/<domain>.ts` に置く
- 例: `order.ts`（受注）, `shipment.ts`（出荷）, `payment.ts`（入金）, `inventory.ts`（在庫）, `purchase.ts`（発注）
- ページ側 (`src/app/**/page.tsx`) で `setStatus("出荷済")` のように直接書き換えない
- 必ず `transitionOrder(order, "ship")` のような遷移関数経由で更新する

### 連動の自動化はイベント駆動
- 受注確定 → 在庫引当 → 出荷指示作成、のような連鎖は `src/lib/events/` のドメインイベントで表現
- ページから直接他ドメインのstateを触らない（疎結合維持）

### TDD強制範囲
- `src/lib/state-machines/`, `src/lib/events/`, `src/lib/calculations/` は **oms-tdd-guide で必ずテスト先行**
- 状態遷移のRED-GREEN-REFACTORを通さずに実装するのは禁止

## PRDフェーズでのInterview強制

`oms-prp-orchestrator` でPRDを書き始める前に、要件が曖昧なら必ずユーザーに質問を投げる。

### Interview必須トリガー
- 状態遷移が複数ドメインに跨る要求（例: 「入金確認したら自動で出荷指示」）
- 既存の状態機械に新しい遷移を足す要求
- 数式・計算ロジックが絡む要求（発注数算定、引当ロジック、按分計算等）
- 「自動で〜する」を含む要求（自動化の発火条件・冪等性・失敗時挙動を必ず詰める）

### Interview項目の最低セット
1. **発火条件** — どのイベント・状態で起動するか
2. **冪等性** — 二重発火時の挙動
3. **失敗時のロールバック** — 連鎖の途中で失敗した時の戻し方
4. **手動オーバーライド** — 自動化を止める/巻き戻す操作の有無
5. **既存ページへの影響** — どのページのUIが変わるか
