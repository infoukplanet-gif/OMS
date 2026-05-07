# 在庫ドメイン状態機械 v1 仕様書

> 機能間連動フェーズ・第4段。
> 関連: [`order-state-machine.md`](./order-state-machine.md) / [`shipment-state-machine.md`](./shipment-state-machine.md) / [`events-integration-v1.md`](./events-integration-v1.md)

## 1. 概要

在庫を SKU × 倉庫 単位の `InventoryRecord` として表現し、`src/lib/state-machines/inventory.ts` にプリミティブ操作を集約する。
受注↔在庫の橋渡しに `OrderAllocation` 型を導入し、`events/inventory-handlers.ts` から記述子を実動作に変換できる土台を作る。

**v1 スコープ:**
- プリミティブ: `allocate / release / consume`（per SKU×倉庫）
- 派生ステータス: `inventoryHealth`（適正 / 発注対象 / 在庫切れ / 過剰）
- OrderAllocation 型 + events handler

**v1 スコープ外:**
- 複数 SKU 横断の発注一括計算（`calculations/allocation.ts` で次フェーズ）
- ロット引当・有効期限管理
- 倉庫間移動の状態機械
- 在庫予測・自動発注

## 2. 主要型

### 2.1 InventoryRecord

```ts
export interface InventoryRecord {
  sku: string;
  warehouse: string;
  /** 物理在庫数（倉庫に存在する数） */
  onHand: number;
  /** 受注により引当済みの数 */
  allocated: number;
  /** 適正在庫数（運用パラメータ） */
  constant: number;
  /** 発注点（運用パラメータ） */
  reorder: number;
  /** 発注ロット数（運用パラメータ） */
  lot: number;
}

/** 引当できる残量。`onHand - allocated` の派生値 */
export function freeStock(record: InventoryRecord): number;
```

### 2.2 InventoryHealth（派生ステータス）

```ts
export type InventoryHealth = "適正" | "発注対象" | "在庫切れ" | "過剰";

export function inventoryHealth(record: InventoryRecord): InventoryHealth;
```

判定ルール:
| 条件 | ステータス |
|---|---|
| `freeStock(r) <= 0 && r.onHand <= 0` | 在庫切れ |
| `freeStock(r) <= r.reorder` | 発注対象 |
| `r.onHand >= r.constant * 3` | 過剰 |
| その他 | 適正 |

**Why:** 現行 `src/app/products/inventory/page.tsx` の振る舞いを踏襲しつつ、判定式を1箇所に固定する。「発注対象」と「過剰」の閾値は運用で調整可能なように、片方は reorder ベース、もう片方は constant ベース。

### 2.3 OrderAllocation

```ts
export interface AllocationLine {
  sku: string;
  warehouse: string;
  qty: number;
}

export interface OrderAllocation {
  orderId: string;
  lines: AllocationLine[];
}
```

orderId と「どの倉庫のどの SKU を何個引き当てたか」のマッピング。引当時に登録され、解放時・出荷時に参照される。

## 3. プリミティブ操作

すべて pure function、イミュータブル更新、guard 違反時 no-op で参照同一性保持。

### 3.1 allocate

```ts
export function allocate(record: InventoryRecord, qty: number): InventoryRecord;
```

- 前提: `qty > 0`、`freeStock(record) >= qty`
- 成功: `allocated += qty`
- guard 違反（在庫不足・qty <= 0）: 元の record を返す（参照同一）

### 3.2 release

```ts
export function release(record: InventoryRecord, qty: number): InventoryRecord;
```

- 前提: `qty > 0`、`record.allocated >= qty`
- 成功: `allocated -= qty`
- guard 違反: 元の record を返す（参照同一）

### 3.3 consume

```ts
export function consume(record: InventoryRecord, qty: number): InventoryRecord;
```

出荷確定時に物理在庫から引いて引当も減らす操作。

- 前提: `qty > 0`、`record.allocated >= qty`、`record.onHand >= qty`
- 成功: `onHand -= qty`、`allocated -= qty`
- guard 違反: 元の record を返す（参照同一）

## 4. 冪等性

- 全プリミティブは guard 違反時 no-op。
- events handler が「同じ allocation を二重解放しようとする」シナリオでも safe（最初の解放後は guard が効く）。
- 「同じ qty を二重引当」のようなアプリ側ロジックの誤りは guard では検知できない（呼び出し元責務）。

## 5. events 連動

### 5.1 inventory-handlers の責務

`events/order-handlers.ts` と `shipment-handlers.ts` が出した記述子を消費する：

```ts
export interface InventoryReleaseOps {
  /** (sku × warehouse) ごとの解放 qty */
  releases: AllocationLine[];
}

export function applyInventoryRelease(
  reason: "order-cancelled" | "shipment-cancelled",
  allocation: OrderAllocation,
): InventoryReleaseOps;
```

handler 自身は **InventoryRecord に直接触らない**。具体的な (sku, warehouse, qty) 操作群を返すだけ。実行は呼び出し元（page / 将来の server action）が `release` を順次呼ぶ。

### 5.2 引当（allocate）側の連動

v1 では引当成功は **手動で `transitionOrder(order, "allocateInventory")` を叩く運用** とする。
複数 SKU の自動 all-or-nothing 引当は次フェーズの `calculations/allocation.ts` に委譲。

## 6. 失敗時のロールバック

| 失敗 | 対応 |
|---|---|
| `allocate` が在庫不足で失敗 | Order に `inventoryShortage: true` を立て、Order は引当待ちで停留 |
| `release` が allocated 不足で失敗 | 整合エラーとしてログ出力（`events/integrity-checks` 次フェーズ）。実害は無視できる（既に解放済みの可能性が高い） |
| `consume` が onHand 不足で失敗 | 物理棚卸の不整合。手動の在庫補正画面（`src/app/products/inventory/update`）から修正 |

## 7. 手動オーバーライド

- 在庫補正: `src/app/products/inventory/update/page.tsx` で `onHand` を直接書き換え可能（運用画面、操作ログ必須）
- 引当強制解放: 管理者が orderId を指定して allocations.lines を全解放（v1.1 以降）
- 引当強制ロック: 検査中の SKU を `allocated` ではなく別フラグで予約（v1.2 以降）

## 8. 既存ページへの影響

| ページ | 影響 | 修正方針 |
|---|---|---|
| `src/app/products/inventory/page.tsx` | `status` 派生ロジックを `inventoryHealth()` に置換 | UI から計算ロジックを抜く |
| `src/app/products/inventory/update/page.tsx` | onHand 直書き換えは状態機械を経由しない | 例外的に直接更新を許す（v1） |
| `src/app/products/inventory/check/page.tsx` | 在庫照会のみ | 影響なし |
| `src/app/products/inventory/history/page.tsx` | 履歴表示 | 影響なし（v1 では履歴生成は別処理） |
| `src/app/orders/page.tsx` | 引当待ち停留時の inventoryShortage バッジ表示 | 既に `OrderState.inventoryShortage` で対応済み |

UI 統合（status 派生のリファクタ）は今フェーズでは行わず、状態機械側を整えた上で次の UI 統合フェーズで合流させる。

## 9. v1 で意図的に含めないもの

- 複数 SKU 横断 all-or-nothing 引当（`calculations/allocation.ts`）
- ロット・賞味期限・シリアル管理
- 倉庫間移動・倉庫切替の状態機械
- 自動発注計算（`calculations/reorder-calculation.ts`）
- 在庫履歴の自動生成
