# 発注入荷→買掛金計上→仕入支払 PRD v1

**作成日:** 2026-06-09
**ステータス:** 確定（実装済み）
**スコープ:** 機能間連動フェーズ。発注入荷を契機に買掛金（仕入債務）を数量按分で計上し、仕入伝票一覧で支払を手動追跡する連鎖を作る。出荷確定→売上計上（sales）の買い側ミラー。

---

## 1. 背景

`purchasing/invoices`（仕入伝票管理）ページは完全な静的モックだった（`INVOICES` 配列をハードコード、支払登録ボタンは toast を出すだけで store/cascade に一切繋がっていない）。

一方、買い側では発注入荷の cascade（`runRecognizePayableOnReceipt`）のレールが整い、売り側では出荷確定→売上計上（`salesStore`）が既に動いている。この非対称を解消し、「入荷したら買掛金が積まれ、仕入伝票一覧で支払消し込みできる」フローを実機能化する。

参考: [`sales-recognition-cascade`（売上計上の売り側ミラー）](./order-state-machine.md), [`purchase-state-machine.md`](./purchase-state-machine.md), [`receiving-cascade-v1`](./reallocate-on-receipt-v1.md)

---

## 2. 発火点（Interview 確定）

発注入荷で受領数が増える 2 箇所で発火する（返品は買掛金に無関係なので対象外）。

| 発火元ページ | 入荷の種類 | 呼び出し |
|---|---|---|
| `purchasing/page.tsx` | 発注入荷（確定） | `confirmReceive()` 内 `runRecognizePayableOnReceipt` |
| `purchasing/receiving/page.tsx` | 入荷登録（単発・一括） | `receiveRow` / `receiveSelected` 内 `runRecognizePayableOnReceipt` |

各ページは在庫加算・再引当の **直後** に cascade を 1 回呼ぶだけ。`before`/`after` の `PurchaseOrderState` から受領差分を計算する。

---

## 3. 設計判断（Interview 回答）

### Q1. 発火条件 — 入荷確定の都度（推奨）

入荷を確定するたびに、その時点の累計受領数まで買掛金を計上する。発注発行時でも全数入荷時でもなく「入荷の都度」。仕入債務は物が入ったタイミングで負うのが会計実態に合う。

### Q2. 部分入荷 — 入荷分だけ都度按分計上（推奨）

- PO 明細には単価が無く総額 `amount` しか持たないため、買掛金 = `amount × 累計受領数 / 発注総数` で金額化する。
- 今回計上額は「按分累計（今回入荷後）− 按分累計（今回入荷前）」の差分のみ。残りは次回入荷で計上。
- 端数は最終入荷で true-up し、全数受領時に計上累計が必ず PO 総額に一致する（計上漏れ・過計上ゼロ）。

### Q3. 支払確定 — 手動の支払登録のみ（推奨）

- 買掛金は入荷で自動計上されるが、支払は自動化しない。`purchasing/invoices` の支払登録ダイアログで手動記録する。
- 残額を上限に一部支払も可能。完済で「支払済」、一部で「一部支払」、未払で「未払」にステータスが自動遷移（ステータスは保存せず `summarizePayables` で導出）。

### Q4. 冪等性 — (poId, cumulativeReceived) で二重計上防止

- 計上キーは `(poId, 累計受領数)`。累計受領数は単調増加するため、入荷ダイアログ再送・cascade 再実行は同一キーで no-op、真の次回部分入荷は新キーで計上される。
- 通知は実際に行が積まれた時のみ（重複 recognize は notify しない）。

### Q5. 失敗時のロールバック — なし

- 入荷（在庫加算）は既に確定済み。買掛金計上はその後段の記帳であり、失敗しても在庫加算は巻き戻さない。
- 計上は純粋関数 + store append のみで副作用が局所的。部分適用が起きても次回入荷の差分計算で整合が回復する（按分累計ベースのため）。

---

## 4. アーキテクチャ

```
発注入荷ページ (2点)
  └─ inventoryStore.applyReceive(lines)            // 在庫加算（既存）
  └─ runAutoReallocateOnReceipt(lines)             // 再引当（既存）
  └─ runRecognizePayableOnReceipt({...})           // ← 追加した1行
        └─ recognizePayableOnReceipt({payableStore}, args)   // 純粋cascade
              └─ totalOrdered/totalReceived（before/after）
              └─ payableAccrualForReceipt(...)               // 按分差分（純粋calc）
              └─ payableStore.recognize({poId, supplier, amount, cumulativeReceived, accruedAt})

仕入伝票一覧 purchasing/invoices
  └─ useSyncExternalStore(payableStore)            // 計上台帳＋支払台帳を購読
  └─ summarizePayables(accruals, payments)         // PO単位サマリ（純粋calc）
  └─ 支払登録ダイアログ → payableStore.recordPayment({poId, amount, paidAt})
```

| 層 | ファイル | 役割 |
|---|---|---|
| calc（純粋） | `src/lib/calculations/payable-recognition.ts` | 按分計上・サマリ集約。`accruedPayableThrough` / `payableAccrualForReceipt` / `summarizePayables` |
| store（DI 可能 singleton） | `src/lib/stores/payable.ts` | 計上台帳＋支払台帳。`(poId, cumulativeReceived)` 冪等。`recognize` / `recordPayment` |
| cascade（純粋） | `src/lib/cascades/recognize-payable.ts` | DI store 受け取り。before/after から差分計上。テスト対象 |
| glue（薄い） | `src/lib/cascades/run-recognize-payable.ts` | global singleton `payableStore` を 1 箇所に閉じ込める UI 向け接着剤 |
| seed | `src/lib/seeds/payables.ts` | 初期買掛金・支払台帳（旧ハードコードモックを移植） |
| UI | `src/app/purchasing/invoices/page.tsx` | 買掛金一覧＋手動支払ダイアログ |

純粋 cascade/calc は DI・引数渡しでテスト可能なまま、`Date` と global singleton は glue・page に隔離（`src/lib` は Date-free を維持）。page は `accruedAt` を整形済み文字列で渡す。

---

## 5. 既存ページへの影響

| ページ | 影響 |
|---|---|
| `purchasing/page.tsx` | 発注入荷確定後に買掛金を自動計上。`買掛金 ¥N 計上` を toast に追記 |
| `purchasing/receiving/page.tsx` | 入荷登録（単発・一括）後に自動計上。toast に `・買掛金¥N計上` 追記。`poAmountOf` で PO 総額を引く（`PlanRow` に amount が無いため） |
| `purchasing/invoices/page.tsx` | 静的モックを撤去し `payableStore` ライブ配線。支払登録ボタンを実機能化（残額上限の一部支払対応ダイアログ）。一覧は PO 単位の買掛金サマリに変更（伝票番号列→発注番号列） |

---

## 6. テスト戦略

`payable-recognition.test.ts` / `payable.test.ts` / `recognize-payable.test.ts`（計 30 件）で TDD 強制範囲を網羅。

- 按分: 部分入荷で受領分のみ計上、全数受領で PO 総額に一致（true-up）
- 逆行・据え置きで 0 計上（負計上なし）
- `(poId, cumulativeReceived)` 重複で no-op、新累計で計上
- `summarizePayables`: 計上累計・支払累計・残額・ステータス導出
- cascade: before/after 差分で正しく recognize 委譲、accrued<=0 で applied=false

---

## 7. v1 で実装したファイル

- `docs/prd/payable-recognition-v1.md`（本ファイル）
- `src/lib/calculations/payable-recognition.ts` + `.test.ts`
- `src/lib/stores/payable.ts` + `.test.ts`
- `src/lib/cascades/recognize-payable.ts` + `.test.ts`
- `src/lib/cascades/run-recognize-payable.ts`
- `src/lib/seeds/payables.ts`
- `src/app/purchasing/page.tsx`（1 行配線 + toast）
- `src/app/purchasing/receiving/page.tsx`（単発・一括に配線 + `poAmountOf` + toast）
- `src/app/purchasing/invoices/page.tsx`（ライブ配線 + 支払ダイアログ全面書き換え）

---

## 8. オープン項目（v2 で議論）

- 支払サイトの仕入先別設定（現状は計上日 + 30 日一律）
- PO 明細単価の導入（按分でなく明細積み上げ計上への移行）
- 支払予定表・買掛金齢分析（支払期日別の集計レポート）
- 仕入先別の買掛金残高サマリ
- server action 化したときの計上の排他制御（同時入荷の競合）と DB 永続化
