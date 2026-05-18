# 発注ドメイン状態機械 v1 仕様書

**作成日:** 2026-05-15
**ステータス:** 確定（実装着手可）
**スコープ:** 機能間連動フェーズ・第6段。発注（発注伝票）ドメインの状態機械を `src/lib/state-machines/purchase.ts` に集約し、入荷登録→在庫加算の連鎖の基盤を作る。

> 関連: [`inventory-state-machine.md`](./inventory-state-machine.md) / [`events-integration-v1.md`](./events-integration-v1.md)

---

## 1. 概要

発注伝票を `PurchaseOrderState`（SKU×倉庫の明細を持つ集約）として表現し、`markConditionsMet / issue / receivePurchaseOrder / cancel` のプリミティブ操作で状態遷移する。
ステータス（発行済 / 注残あり / 仕入完了）は明細の累計受領数と発注数の照合から**派生**させ、判定式を1箇所に固定する。
発注↔在庫の橋渡しは `events/purchase-handlers.ts` が記述子（`receiveInventory`）として返す。

**v1 スコープ:**
- 5状態 + キャンセル: 条件未達成 / 未発行 / 発行済 / 注残あり / 仕入完了 / キャンセル（参考資料 `reference/screenshot/発注伝票管理.png` のステップ表示に準拠）
- プリミティブ: `markConditionsMet` / `markConditionsUnmet` / `issue` / `receivePurchaseOrder` / `cancel`
- 部分入荷の都度受領分を `inventory` に加算する記述子返し
- 明細単位の `receivedQty` 集計

**v1 スコープ外:**
- 発注条件の自動判定（発注点・最低発注金額・ロット数 → `calculations/reorder-calculation.ts` で次フェーズ）
- 仕入伝票（`仕入伝票管理.png`）の独立した状態機械 — v1 では入荷登録のみ追う
- 倉庫API（楽天スーパーロジ等）からの入荷情報自動取り込み
- 不良品・返品処理（`shipments/return` 系で別実装）
- 仕入額・支払予定の会計連動

---

## 2. 状態セット（5状態 + キャンセル）

| # | 状態 | 説明 | 派生条件 |
|---|------|------|----------|
| 1 | 条件未達成 | 発注条件（発注点・最低金額等）が未充足 | 明示的（状態管理） |
| 2 | 未発行 | 条件達成済、未発行 | 明示的（状態管理） |
| 3 | 発行済 | 仕入先に発行済、未入荷 | 全 line の `receivedQty === 0` |
| 4 | 注残あり | 一部入荷済 | いずれかの line で `0 < receivedQty < orderedQty` |
| 5 | 仕入完了 | 全量入荷済 | 全 line で `receivedQty >= orderedQty` |
| 6 | キャンセル | 仕入完了到達前にキャンセル | 明示的（状態管理） |

**Why:** 発注伝票管理の参考資料スクリーンショットのステップ表示と完全一致させる。oms-field-auditor の機械的監査が通る。

**派生 vs 明示の分け方:** 発行済/注残あり/仕入完了 は累計受領数から導出可能なので派生。条件未達成/未発行/キャンセル は明示的フィールドで持つ（ユーザーアクションでしか遷移しない）。

---

## 3. 主要型

```ts
export type PurchaseOrderStatus =
  | "条件未達成"
  | "未発行"
  | "発行済"
  | "注残あり"
  | "仕入完了"
  | "キャンセル";

export interface PurchaseOrderLine {
  sku: string;
  warehouse: string;
  /** 発注数 */
  orderedQty: number;
  /** 累計受領数（部分入荷の累積） */
  receivedQty: number;
}

export interface PurchaseOrderState {
  /** 派生 + 明示の混合ステータス。プリミティブ操作が更新のたび再計算する。 */
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
}

/** 入荷登録時に渡す受領明細。lines と同じ key (sku, warehouse) で qty を加算する。 */
export interface ReceiptLine {
  sku: string;
  warehouse: string;
  qty: number;
}
```

---

## 4. プリミティブ操作

すべて pure function、イミュータブル更新、guard 違反時 no-op で参照同一性保持（order / shipment / inventory / payment と同じ規約）。

### 4.1 markConditionsMet

```ts
export function markConditionsMet(po: PurchaseOrderState): PurchaseOrderState;
```

- guard: `status === "条件未達成"`
- 成功: `status = "未発行"`
- それ以外: no-op

### 4.2 markConditionsUnmet

```ts
export function markConditionsUnmet(po: PurchaseOrderState): PurchaseOrderState;
```

- guard: `status === "未発行"`
- 成功: `status = "条件未達成"`
- それ以外: no-op

未発行から条件未達成に巻き戻すアクション（条件再評価のため）。

### 4.3 issue

```ts
export function issue(po: PurchaseOrderState): PurchaseOrderState;
```

- guard: `status === "未発行"`
- 成功: `status = "発行済"`
- それ以外: no-op

### 4.4 receivePurchaseOrder

```ts
export function receivePurchaseOrder(
  po: PurchaseOrderState,
  receipts: ReceiptLine[],
): PurchaseOrderState;
```

- guard: `status === "発行済"` または `"注残あり"`
- 動作:
  - 各 `receipt.qty > 0` について、`lines` 内で `sku × warehouse` が一致する line の `receivedQty` に加算
  - マッチしない receipt は無視（呼び出し元のミスを表面化させない）
  - 加算後、`lines` 全体から `status` を再導出（§2 派生条件参照）
- guard 違反 or 加算量が0（全 receipt が qty<=0 または無マッチ）: 元の po を返す（参照同一）

**Why 上限 cap を設けない:** 発注数を超える受領（過剰入荷）は発生しうる業務イベント。状態機械側で除外せず、`receivedQty` がそのまま積み上がる。過剰の検知は UI 側で `receivedQty > orderedQty` を見て判断。

### 4.5 cancel

```ts
export function cancel(po: PurchaseOrderState): PurchaseOrderState;
```

- guard: `status` が「条件未達成 / 未発行 / 発行済 / 注残あり」のいずれか
- 成功: `status = "キャンセル"`（lines はそのまま残す）
- 仕入完了・キャンセル: no-op

**既受領在庫の扱い:** 注残ありからキャンセルしても、既に入荷済みの数量は inventory に加算済み。在庫戻し（`releaseInventory`）は走らせない（物理的に倉庫に存在するため）。

---

## 5. 派生関数

```ts
export function totalOrdered(po: PurchaseOrderState): number;
export function totalReceived(po: PurchaseOrderState): number;
export function isFullyReceived(po: PurchaseOrderState): boolean;
```

UI 層が「発注残量」「進捗率」を出すときに使うヘルパ。

---

## 6. 冪等性

- 全プリミティブは guard 違反時 no-op で元のオブジェクトをそのまま返す（throw しない）。
- `receivePurchaseOrder` は「同じ receipt を二重登録」のようなアプリ側の誤りは guard では検知できない（呼び出し元責務）。入荷伝票ID の重複チェックは呼び出し元で行う。
- `issue` や `markConditionsMet` の二重発火は no-op で safe。

---

## 7. events 連動

### 7.1 PurchaseTransitionEffects

```ts
export interface PurchaseTransitionEffects {
  /**
   * 受領数の増分を inventory.onHand に加算する記述子。
   * 同一 (sku, warehouse) は合算済み、qty <= 0 は除外済み。
   */
  receiveInventory?: { lines: AllocationLine[] };
}
```

### 7.2 onPurchaseTransitioned

```ts
export function onPurchaseTransitioned(
  before: PurchaseOrderState,
  after: PurchaseOrderState,
): PurchaseTransitionEffects;
```

**動作:**
- `after.lines` を走査し、対応する `before` の line の `receivedQty` との差分を取る
- 差分が `> 0` の line を `(sku, warehouse, qty=delta)` として `receiveInventory.lines` に積む
- 差分なし（全 line で delta <= 0）の場合は `{}` を返す

**Why 差分方式:** 入荷の都度受領分を加算する（インタビュー回答）。`receivePurchaseOrder` を呼ぶたびに increments を inventory に加算したい。状態（注残あり / 仕入完了）には依存しない。

**減算（取消）について:** v1 では受領後の取消・誤入荷訂正は扱わない（次フェーズで `cancelReceipt` + `releaseInventory` を導入予定）。差分が負の line は無視する（v1 で発生しないシナリオ）。

### 7.3 キャンセル時の在庫戻し

`cancel` 遷移時、既受領在庫は inventory に残す（§4.5 参照）。`onPurchaseTransitioned` は cancel に対して `{}` を返す。

---

## 8. 失敗時のロールバック

| 失敗・例外ケース | v1 の対応 |
|---|---|
| `receivePurchaseOrder` 実行後の `receiveInventory` 実動作（inventory 加算）が失敗 | inventory フェーズで実装するリトライ機構に委ねる。purchase 側の `receivedQty` は更新済みで整合チェック（`events/integrity-checks.ts`、次フェーズ）で日次検出 |
| 同じ受領伝票を二重登録 | 呼び出し元の重複チェック責務。状態機械は加算するだけ |
| 過剰入荷（`receivedQty > orderedQty`） | エラーとせず受け入れる。UI で過剰アラート表示（運用判断） |

---

## 9. 手動オーバーライド

- `markConditionsMet` / `markConditionsUnmet` / `issue` / `receivePurchaseOrder` / `cancel` すべて運用画面からの手動操作。
- 発注条件の自動判定（在庫引当時に発注点を下回ったら markConditionsMet を自動発火）は v1 スコープ外。次フェーズ `calculations/reorder-calculation.ts` で扱う。

---

## 10. 既存ページへの影響

| ページ | 影響 | 修正方針 |
|---|---|---|
| `src/app/purchasing/page.tsx` | 現状の status（「発注中/一部入荷/入荷済」）は独自命名。参考資料準拠の5状態に置換 | UI 統合フェーズで合流（今フェーズは状態機械側のみ） |
| `src/app/purchasing/new/page.tsx` | 発注書作成時の初期状態は「条件未達成」or「未発行」 | UI 統合フェーズで合流 |
| `src/app/purchasing/invoices/page.tsx` | 仕入伝票管理。v1 状態機械の対象外（別ドメイン） | 影響なし |
| `src/app/products/inventory/page.tsx` | `receiveInventory` 記述子の実動作で onHand 加算 | UI 統合フェーズで合流 |

UI 統合（status 派生のリファクタ）は今フェーズでは行わず、状態機械側を整えた上で次の UI 統合フェーズで合流させる（inventory v1 / payment v1 と同じ進め方）。

---

## 11. テスト戦略

- `src/lib/state-machines/purchase.test.ts` — `markConditionsMet` / `markConditionsUnmet` / `issue` / `receivePurchaseOrder` / `cancel` / 派生関数を vitest で TDD。境界値（過剰入荷、複数ラインの部分入荷、guard 違反、参照同一）を網羅。
- `src/lib/events/purchase-handlers.test.ts` — `onPurchaseTransitioned` の差分計算（増分のみ、複数ライン、無マッチ、cancel 無効果）を網羅。
- カバレッジ目標: 100%（すべて pure function）。

---

## 12. 受け入れ基準

1. `src/lib/state-machines/purchase.ts` が存在し、5状態 + キャンセルを `PurchaseOrderStatus` 型で表現している
2. `receivePurchaseOrder` が `lines.receivedQty` を加算し `status` を再導出する
3. guard 違反時に no-op で同じ state を返す（throw しない）
4. `src/lib/events/purchase-handlers.ts` の `onPurchaseTransitioned` が §7.2 の通り受領増分を記述子として返す
5. `npx vitest run` が全テストグリーン、`npx tsc --noEmit` および `npx eslint` がエラーなく通る
