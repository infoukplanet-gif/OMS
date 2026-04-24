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
