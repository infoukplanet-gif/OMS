import { describe, expect, it } from "vitest";
import { applyConfirmShipmentCascade, type ConfirmShipmentDeps } from "./confirm-shipment";
import { createShipmentStore, type ShipmentRecord } from "../stores/shipment";
import { createOrderStore, type OrderRecord } from "../stores/orders";
import { createInventoryStore } from "../stores/inventory";
import { createMailQueue, type AutoMailEnabled } from "../mail/queue";
import type { InventoryRecord } from "../state-machines/inventory";

const ALL_ENABLED: AutoMailEnabled = {
  thanks: true,
  "ship-notify": true,
  "payment-confirmed": true,
  "payment-reminder-3d": true,
  "payment-final-call-7d": true,
  "follow-up": true,
};

function shipment(overrides: Partial<ShipmentRecord> = {}): ShipmentRecord {
  return {
    id: "SHP-2026-00001",
    status: "出荷待ち",
    orderIds: ["ORD-1"],
    trackingNumber: "TRK-123",
    ...overrides,
  } as ShipmentRecord;
}

function order(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "ORD-1",
    status: "印刷済み",
    inventoryShortage: false,
    allocation: [{ sku: "SKU-1", warehouse: "本社倉庫", qty: 2 }],
    ...overrides,
  } as OrderRecord;
}

function inv(onHand: number, allocated: number): InventoryRecord {
  return { sku: "SKU-1", warehouse: "本社倉庫", onHand, allocated, constant: 0, reorder: 0, lot: 1 };
}

function makeDeps(opts: {
  shipments: ShipmentRecord[];
  orders?: OrderRecord[];
  inventory?: InventoryRecord[];
  autoMailEnabled?: AutoMailEnabled;
}): ConfirmShipmentDeps {
  return {
    shipmentStore: createShipmentStore(opts.shipments),
    orderStore: createOrderStore(opts.orders ?? []),
    inventoryStore: createInventoryStore(opts.inventory ?? []),
    mailQueue: createMailQueue(),
    autoMailEnabled: opts.autoMailEnabled ?? ALL_ENABLED,
  };
}

describe("applyConfirmShipmentCascade — 出荷確定の全連鎖", () => {
  it("出荷確定で受注を出荷済みへ・在庫消費・出荷通知メールまで連鎖する", () => {
    const deps = makeDeps({
      shipments: [shipment()],
      orders: [order()],
      inventory: [inv(10, 2)],
    });

    const result = applyConfirmShipmentCascade("SHP-2026-00001", deps);

    expect(result.applied).toBe(true);
    expect(result.cascadeApplied).toBe(1);
    expect(result.consumed).toBe(1);
    expect(result.consumeFailed).toBe(0);
    expect(result.enqueued).toBeGreaterThan(0);

    expect(deps.shipmentStore.getState()[0].status).toBe("出荷済み");
    expect(deps.orderStore.getState()[0].status).toBe("出荷済み");
    // consume は onHand と allocated を同時に減算
    const rec = deps.inventoryStore.getState()[0];
    expect(rec.onHand).toBe(8);
    expect(rec.allocated).toBe(0);
  });

  it("ship-notify 無効化時は enqueue されない", () => {
    const deps = makeDeps({
      shipments: [shipment()],
      orders: [order()],
      inventory: [inv(10, 2)],
      autoMailEnabled: { ...ALL_ENABLED, "ship-notify": false },
    });
    const result = applyConfirmShipmentCascade("SHP-2026-00001", deps);
    expect(result.enqueued).toBe(0);
    expect(result.disabledSkipped).toBeGreaterThan(0);
  });

  it("出荷待ち以外（既に出荷済み）は applied=false で連鎖なし", () => {
    const deps = makeDeps({
      shipments: [shipment({ status: "出荷済み" })],
      orders: [order({ status: "出荷済み" })],
      inventory: [inv(10, 2)],
    });
    const result = applyConfirmShipmentCascade("SHP-2026-00001", deps);
    expect(result.applied).toBe(false);
    expect(result.cascadeApplied).toBe(0);
  });

  it("存在しない shipment は applied=false", () => {
    const deps = makeDeps({ shipments: [shipment()], orders: [order()] });
    expect(applyConfirmShipmentCascade("SHP-NOPE", deps).applied).toBe(false);
  });

  it("対応 order が無くても出荷自体は確定する（cascade は skip 計上）", () => {
    const deps = makeDeps({ shipments: [shipment({ orderIds: ["ORD-MISSING"] })], orders: [] });
    const result = applyConfirmShipmentCascade("SHP-2026-00001", deps);
    expect(result.applied).toBe(true);
    expect(result.cascadeApplied).toBe(0);
    expect(result.cascadeSkipped).toBe(1);
    expect(deps.shipmentStore.getState()[0].status).toBe("出荷済み");
  });
});
