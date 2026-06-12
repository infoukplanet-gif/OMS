/**
 * フルライフサイクル統合テスト
 *
 * 個別の SM / handler / store / cascade が「組み合わさって」受注ライフサイクルを
 * 正しく流すことを、実 store インスタンス上で通しで検証する。
 *
 *   入金 → 受注確定 → 出荷指示作成 → 在庫引当 → 印刷 → 出荷確定 → 在庫消費
 *   返品 → 検品 → 在庫戻し → 返金
 */

import { describe, expect, it } from "vitest";
import { createPaymentStore, type PaymentRecord } from "../stores/payment";
import { createOrderStore, type OrderRecord } from "../stores/orders";
import { createShipmentStore } from "../stores/shipment";
import { createInventoryStore } from "../stores/inventory";
import { createReturnStore } from "../stores/return";
import { createMailQueue, type AutoMailEnabled } from "../mail/queue";
import { paymentStatusOf } from "../state-machines/payment";
import type { InventoryRecord } from "../state-machines/inventory";
import { applyRecordPaymentCascade } from "./record-payment";
import { allocatePendingOrders } from "./allocate-orders";
import { applyConfirmShipmentCascade } from "./confirm-shipment";
import { onReturnTransitioned } from "../events/return-handlers";

const ALL_ENABLED: AutoMailEnabled = {
  thanks: true,
  "ship-notify": true,
  "delivery-notify": true,
  "payment-confirmed": true,
  "payment-reminder-3d": true,
  "payment-final-call-7d": true,
  "follow-up": true,
  "rebill-mismatch": true,
};

const SKU = "SKU-1";
const WH = "本社倉庫";

function freshStores(onHand: number) {
  const order: OrderRecord = {
    id: "ORD-1",
    status: "入金待ち",
    inventoryShortage: false,
    allocation: [{ sku: SKU, warehouse: WH, qty: 2 }],
    customer: "統合テスト顧客",
    items: 2,
    amount: 10000,
  } as OrderRecord;

  const payment: PaymentRecord = {
    id: "PAY-1",
    orderId: "ORD-1",
    orderTotal: 10000,
    paidAmount: 0,
    status: paymentStatusOf(10000, 0),
    overpaid: false,
  };

  const inventory: InventoryRecord = {
    sku: SKU,
    warehouse: WH,
    onHand,
    allocated: 0,
    constant: 0,
    reorder: 0,
    lot: 1,
  };

  return {
    paymentStore: createPaymentStore([payment]),
    orderStore: createOrderStore([order]),
    shipmentStore: createShipmentStore([]),
    inventoryStore: createInventoryStore([inventory]),
    mailQueue: createMailQueue(),
    autoMailEnabled: ALL_ENABLED,
  };
}

describe("フルライフサイクル: 入金 → 引当 → 印刷 → 出荷確定 → 在庫消費", () => {
  it("1件の受注が全工程を通って出荷済みに到達し、在庫が正しく増減する", () => {
    const s = freshStores(10);

    // 1) 全額入金 → 受注確定（引当待ち）+ 出荷指示作成 + 在庫引当
    const pay = applyRecordPaymentCascade("PAY-1", 10000, s);
    expect(pay.applied).toBe(true);
    expect(pay.cascadeApplied).toBe(1);
    expect(pay.shipmentsCreated).toBe(1);
    expect(pay.allocated).toBe(1);
    expect(s.orderStore.getState()[0].status).toBe("引当待ち");
    expect(s.inventoryStore.getState()[0].allocated).toBe(2);

    // 2) 一括引当 → 引当待ち → 印刷待ち
    const alloc = allocatePendingOrders(s);
    expect(alloc.allocated).toBe(1);
    expect(s.orderStore.getState()[0].status).toBe("印刷待ち");

    // 3) 印刷 → 印刷済み
    expect(s.orderStore.applyTransition("ORD-1", "markPrinted").applied).toBe(true);
    expect(s.orderStore.getState()[0].status).toBe("印刷済み");

    // 4) 出荷を 出荷待ち まで進める（ピッキング → 検品 → 出荷待ち）
    const shp = s.shipmentStore.getState()[0];
    expect(shp.status).toBe("出荷指示作成");
    s.shipmentStore.applyTransition(shp.id, "startPicking");
    s.shipmentStore.applyTransition(shp.id, "completePicking");
    s.shipmentStore.applyTransition(shp.id, "passInspection");
    expect(s.shipmentStore.getState()[0].status).toBe("出荷待ち");

    // 5) 出荷確定 → 受注 出荷済み + 在庫消費 + 出荷通知メール
    const ship = applyConfirmShipmentCascade(shp.id, s);
    expect(ship.applied).toBe(true);
    expect(ship.cascadeApplied).toBe(1);
    expect(ship.consumed).toBe(1);

    // 最終状態
    expect(s.shipmentStore.getState()[0].status).toBe("出荷済み");
    expect(s.orderStore.getState()[0].status).toBe("出荷済み");
    const rec = s.inventoryStore.getState()[0];
    expect(rec.onHand).toBe(8); // 10 → 消費2
    expect(rec.allocated).toBe(0); // 引当2 → 消費で解放
  });

  it("在庫不足だと受注確定後の一括引当で在庫不足マークされ、印刷へ進まない", () => {
    const s = freshStores(1); // onHand 1 < 引当 2

    applyRecordPaymentCascade("PAY-1", 10000, s);
    // payment cascade 内の allocate も失敗 → markInventoryShortage 済み
    expect(s.orderStore.getState()[0].status).toBe("引当待ち");
    expect(s.orderStore.getState()[0].inventoryShortage).toBe(true);

    const alloc = allocatePendingOrders(s);
    expect(alloc.allocated).toBe(0);
    expect(alloc.shortage).toBe(1);
    expect(s.orderStore.getState()[0].status).toBe("引当待ち");
  });
});

describe("フルライフサイクル: 返品 → 検品 → 在庫戻し → 返金", () => {
  it("返品完了で良品が在庫に戻り、返金が入金から差し引かれる", () => {
    const s = freshStores(10);
    // 事前に完済しておく（返金原資）
    s.paymentStore.applyRecord("PAY-1", 10000);
    expect(s.paymentStore.getState()[0].paidAmount).toBe(10000);

    const returnStore = createReturnStore([]);
    const created = returnStore.createForOrder("ORD-1", {
      lines: [{ sku: SKU, warehouse: WH, qty: 2, restockQty: 0 }],
      refundAmount: 4000,
      customer: "統合テスト顧客",
    });
    const rmaId = created.record!.id;

    // 承認 → 受領 → 検品完了（全数良品）
    returnStore.applyTransition(rmaId, "approve");
    returnStore.applyTransition(rmaId, "receiveItems");
    const done = returnStore.applyTransition(rmaId, "completeInspection", {
      inspectedGoodQty: [{ sku: SKU, warehouse: WH, goodQty: 2 }],
    });

    expect(done.after?.status).toBe("返品完了");
    expect(done.after?.refundStatus).toBe("起票済");

    // 在庫戻し effect を inventory に反映
    expect(done.effects.restockInventory).toBeDefined();
    const onHandBefore = s.inventoryStore.getState()[0].onHand;
    s.inventoryStore.applyReceive(done.effects.restockInventory!.lines);
    expect(s.inventoryStore.getState()[0].onHand).toBe(onHandBefore + 2);

    // 返金 effect を payment に反映（手動確定相当）
    expect(done.effects.refundPayment).toEqual({
      orderId: "ORD-1",
      amount: 4000,
      reason: "return-completed",
    });
    s.paymentStore.applyCancel("PAY-1", done.effects.refundPayment!.amount);
    expect(s.paymentStore.getState()[0].paidAmount).toBe(6000);
    expect(returnStore.markRefundConfirmed(rmaId)).toBe(true);
    expect(returnStore.getState()[0].refundStatus).toBe("確定済");
  });

  it("onReturnTransitioned 単体でも返品完了到達で在庫戻し・返金を emit する（handler 純度）", () => {
    const before = {
      status: "検品中" as const,
      orderId: "ORD-1",
      lines: [{ sku: SKU, warehouse: WH, qty: 2, restockQty: 2 }],
      refundAmount: 4000,
    };
    const after = { ...before, status: "返品完了" as const };
    const effects = onReturnTransitioned(before, after);
    expect(effects.restockInventory).toEqual({ lines: [{ sku: SKU, warehouse: WH, qty: 2 }] });
    expect(effects.refundPayment?.amount).toBe(4000);
  });
});
