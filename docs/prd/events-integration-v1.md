# 機能間連動 events レイヤー v1 仕様書

> 機能間連動フェーズ・第3段（連結フェーズ）。
> 関連: [`order-state-machine.md`](./order-state-machine.md) §連動 / [`shipment-state-machine.md`](./shipment-state-machine.md) §7-§8

## 1. 目的

`src/lib/events/` を、**ドメイン状態機械の遷移結果を受けて副作用を「記述子として」返す pure function 群**として実装する。

- 副作用は記述するだけで実行しない（実行は呼び出し元の責務）。
- これにより handler は db や外部APIに依存せず単体テストできる。
- 連鎖の制御（再帰の停止、複数記述子のマージ）は呼び出し元が握る。

## 2. ディレクトリ構成

```
src/lib/events/
├── order-handlers.ts       Order の遷移を観察し、Shipment 生成や在庫戻しの記述子を返す
└── shipment-handlers.ts    Shipment の遷移を観察し、Order への波及や在庫戻しの記述子を返す
```

将来追加予定：
- `inventory-handlers.ts` — 在庫戻し記述子の実動作（次フェーズ）
- `payment-handlers.ts` — 入金確認の波及（次フェーズ）
- `carrier-handlers.ts` — 配送業者API・CSVからの状態取り込み（後続）

## 3. 共通設計原則

### 3.1 純粋関数

すべての handler は**入力から出力を導く純粋関数**。db・clock・乱数・外部APIを呼ばない。

### 3.2 副作用は記述子として返す

```ts
// 例: Order が「引当待ち」に到達した時に Shipment を生成したい
//
// 良い例: 記述子を返すだけ
function onOrderTransitioned(...) {
  return { createShipment: { orderId } };
}
//
// 悪い例: handler 内で db.shipment.insert() を呼ぶ
```

### 3.3 連鎖は呼び出し元が制御

handler は1ホップ分の効果しか返さない。「Shipment を作ったらそれが連鎖でさらに...」のような多段連鎖は呼び出し元（pages / future server actions）が反復する。v1 のシナリオではすべて1ホップで完結する。

### 3.4 冪等性

副作用記述子は**同じ入力に対して同じ出力**を返す。状態が変わっていなければ空の `{}` を返す（参照同一性は保証しない、深い等価性のみ）。

## 4. 型定義

### 4.1 OrderTransitionEffects

```ts
export interface OrderTransitionEffects {
  /** Order が引当待ちに到達した時に Shipment を新規作成する記述子 */
  createShipment?: { orderId: string };
  /** Order がキャンセルされた時の在庫戻し記述子（実動作は inventory フェーズで実装） */
  releaseInventory?: { orderId: string; reason: "order-cancelled" };
}
```

### 4.2 ShipmentTransitionEffects

```ts
export interface ShipmentTransitionEffects {
  /** Shipment が出荷済みに到達した時、Order 側に registerShipment を叩く要求 */
  cascadeOrderAction?: { orderId: string; action: "registerShipment" | "cancel" };
  /** Shipment がキャンセルされた時の在庫戻し記述子（実動作は inventory フェーズで実装） */
  releaseInventory?: { orderId: string; reason: "shipment-cancelled" };
}
```

## 5. 関数シグネチャ

### 5.1 order-handlers

```ts
export function onOrderTransitioned(
  before: OrderState,
  after: OrderState,
  orderId: string,
  options?: { disableShipmentAutoCreate?: boolean },
): OrderTransitionEffects;
```

**動作:**
- `before.status !== "引当待ち"` かつ `after.status === "引当待ち"` の時に `createShipment: { orderId }` を返す。ただし `options.disableShipmentAutoCreate === true` なら省略。
- `before.status !== "キャンセル"` かつ `after.status === "キャンセル"` で**かつ** `before.status` が「引当待ち」「印刷待ち」「印刷済み」のいずれか（つまり既に在庫引当されていた状態）の場合のみ `releaseInventory: { orderId, reason: "order-cancelled" }` を返す。引当前のキャンセルでは在庫戻し不要。
- それ以外は `{}` を返す。

### 5.2 shipment-handlers

```ts
export function onShipmentTransitioned(
  before: ShipmentState,
  after: ShipmentState,
  options?: { orderStatusAtCancel?: OrderStatus },
): ShipmentTransitionEffects;
```

**動作:**
- `before.status !== "出荷済み"` かつ `after.status === "出荷済み"` の時、`after.orderIds` 各々について `cascadeOrderAction: { orderId, action: "registerShipment" }` を返す。v1 は orderIds.length === 1 で運用するため記述子は1個。
- `before.status !== "キャンセル"` かつ `after.status === "キャンセル"` の時：
  - `options.orderStatusAtCancel` が「印刷済み未満」（出荷済み・キャンセル以外）なら `cascadeOrderAction: { orderId, action: "cancel" }` を返す。
  - **常に** `releaseInventory: { orderId, reason: "shipment-cancelled" }` を返す（v1 では Shipment を生成する時点で在庫引当済みのため、キャンセル時は必ず戻す）。
- それ以外は `{}` を返す。

## 6. 失敗時のロールバック

handler 自体は db を触らないので失敗しない（純粋関数）。
呼び出し元が記述子を実行する段階で失敗する可能性がある：

| 失敗箇所 | 対応 |
|---|---|
| `createShipment` 実行失敗 | Order 側に `shipmentCreationFailed: true` を立てて運用画面でリトライ可能にする |
| `cascadeOrderAction` 実行失敗 | 整合チェック（`events/integrity-checks.ts`、次フェーズ）で日次検出 |
| `releaseInventory` 実行失敗 | inventory フェーズで実装。リトライ可能にする |

## 7. テスト戦略

- 各 handler は vitest で単体テストする（`order-handlers.test.ts`、`shipment-handlers.test.ts`）
- 入力は `OrderState` / `ShipmentState` のサンプル。出力は記述子の深い等価性で検証
- カバレッジ目標：100%（pure function なので分岐を網羅できる）

## 8. v1 で意図的に含めないもの

- 在庫ドメインの実動作（記述子を出すだけ）
- 入金ドメインの handler
- 配送業者API・CSV からの取り込み handler
- 整合チェック（`events/integrity-checks.ts`）
- 多段連鎖の orchestrator

これらはすべて次フェーズ以降で別 PRD として扱う。
