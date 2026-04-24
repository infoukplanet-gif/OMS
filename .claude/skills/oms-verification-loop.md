---
name: oms-verification-loop
description: OMS検証ループの実行手順書。typecheck → lint → build → route整合 → DB整合 → 規約レビュー を順番に走らせ、失敗時は該当エージェントにエスカレーションする。コミット前・デプロイ前に実行。
---

# OMS Verification Loop

everything-claude-code の `verification-loop` を OMS (Next.js 16 + Drizzle + Neon + Clerk + Liquid Glass UI) 向けに特殊化したランブックです。

## いつ実行するか

- コード変更後、ユーザーに「完成」と報告する前
- コミット前（`/oms-checkpoint` から自動呼び出し）
- Vercel デプロイ前
- oms-prp-orchestrator の Phase 4

## 実行手順

### Step 1: 静的解析（並列）
```bash
npx tsc --noEmit --pretty false
npm run lint
```
両方パスしたら Step 2 へ。片方でも失敗したら **止まる**。

### Step 2: ビルド
```bash
npm run build
```
`next build` が green になるまで Ship 不可。

失敗パターン別対応:
- Module not found → import path を確認、tsconfig の paths を確認
- Type error → `build-error-resolver` または `oms-verifier` に委譲
- RSC/Client境界違反 → `"use client"` の位置を確認

### Step 3: ルート整合（404防止）
```bash
# app配下のpage.tsxを全列挙
find src/app -name "page.tsx" | sed 's|src/app||; s|/page.tsx||'
```
`src/components/layout/sidebar.tsx` のリンクと照合し、sidebarに載っているのに page.tsx が無いURLがあれば **必ず新規作成** する。逆方向（page.tsxがあるのにsidebarに無い）は許容。

### Step 4: DB整合
```bash
npx drizzle-kit check || true
```
schema drift があれば警告し、マイグレーション生成を提案。

### Step 5: 規約監査
`oms-reviewer` Task を起動:
- Liquid Glass token 使用確認
- グラデーション禁止
- 日本語化
- `<input type="date">` の使用禁止（DatePicker 使用）
- 項目数（マスタ系は20-50項目が目安）

## 失敗時エスカレーション表

| 失敗 | 委譲先 |
|---|---|
| 型エラー | oms-verifier → build-error-resolver |
| デザイン違反 | oms-reviewer |
| 項目漏れ | oms-field-auditor |
| 設計レベルの問題 | oms-architect |
| ビジネスロジックバグ | oms-tdd-guide |

## 報告テンプレート

```
## 検証結果
✅ typecheck  ✅ lint  ✅ build  ✅ routes  ✅ db  ✅ review
または
❌ <step> で失敗 — <原因> — <次のアクション>
```
