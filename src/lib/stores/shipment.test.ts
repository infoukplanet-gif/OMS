import { describe, it, expect, beforeEach } from "vitest";
import {
  createShipmentStore,
  type ShipmentRecord,
  type ShipmentStore,
} from "./shipment";

const ship = (overrides: Partial<ShipmentRecord> = {}): ShipmentRecord => ({
  id: "SHIP-001",
  status: "出荷指示作成",
  orderIds: ["ORD-001"],
  ...overrides,
});

describe("createShipmentStore — getState / setItems", () => {
  it("starts empty by default", () => {
    const store = createShipmentStore();
    expect(store.getState()).toEqual([]);
  });

  it("accepts an initial seed", () => {
    const store = createShipmentStore([ship(), ship({ id: "SHIP-002" })]);
    expect(store.getState()).toHaveLength(2);
  });

  it("setItems replaces the entire list and notifies subscribers", () => {
    const store = createShipmentStore([ship()]);
    let calls = 0;
    store.subscribe(() => calls++);
    store.setItems([ship({ id: "X" })]);
    expect(store.getState().map((s) => s.id)).toEqual(["X"]);
    expect(calls).toBe(1);
  });
});

describe("createShipmentStore — applyTransition", () => {
  let store: ShipmentStore;
  beforeEach(() => {
    store = createShipmentStore([
      ship({ id: "S-A", status: "出荷指示作成", orderIds: ["O-A"] }),
      ship({ id: "S-B", status: "出荷待ち", orderIds: ["O-B"] }),
      ship({ id: "S-C", status: "出荷済み", orderIds: ["O-C"] }),
    ]);
  });

  it("transitions startPicking 出荷指示作成 → ピッキング待ち and notifies", () => {
    let calls = 0;
    store.subscribe(() => calls++);
    const result = store.applyTransition("S-A", "startPicking");
    expect(result.applied).toBe(true);
    expect(result.after?.status).toBe("ピッキング待ち");
    expect(calls).toBe(1);
  });

  it("confirmShipment 出荷待ち → 出荷済み emits cascadeOrderAction + consumeInventory + sendMail", () => {
    const result = store.applyTransition("S-B", "confirmShipment", {
      trackingNumber: "TRK-0001",
    });
    expect(result.applied).toBe(true);
    expect(result.after?.status).toBe("出荷済み");
    expect(result.after?.trackingNumber).toBe("TRK-0001");
    expect(result.effects.cascadeOrderAction).toEqual({
      orderId: "O-B",
      action: "registerShipment",
    });
    expect(result.effects.consumeInventory?.reason).toBe("shipment-confirmed");
    expect(result.effects.sendMail?.triggerType).toBe("ship-notify");
  });

  it("returns applied=false when guard rejects (no SM transition)", () => {
    let calls = 0;
    store.subscribe(() => calls++);
    const result = store.applyTransition("S-A", "confirmShipment");
    expect(result.applied).toBe(false);
    expect(calls).toBe(0);
  });

  it("returns applied=false when id is unknown", () => {
    const result = store.applyTransition("MISSING", "startPicking");
    expect(result.applied).toBe(false);
  });

  it("cancel from a cancellable state emits releaseInventory", () => {
    const result = store.applyTransition("S-A", "cancel", {
      orderStatusAtCancel: "印刷待ち",
    });
    expect(result.applied).toBe(true);
    expect(result.after?.status).toBe("キャンセル");
    expect(result.effects.releaseInventory?.reason).toBe("shipment-cancelled");
    expect(result.effects.cascadeOrderAction?.action).toBe("cancel");
  });

  it("cancel does NOT cascade to order if order is already 出荷済み", () => {
    const result = store.applyTransition("S-A", "cancel", {
      orderStatusAtCancel: "出荷済み",
    });
    expect(result.applied).toBe(true);
    expect(result.effects.cascadeOrderAction).toBeUndefined();
    // releaseInventory は常時 emit
    expect(result.effects.releaseInventory).toBeDefined();
  });
});

describe("createShipmentStore — subscribe", () => {
  it("does NOT notify when applyTransition is a no-op", () => {
    const store = createShipmentStore([ship({ status: "出荷済み" })]);
    let calls = 0;
    store.subscribe(() => calls++);
    store.applyTransition("SHIP-001", "startPicking");
    expect(calls).toBe(0);
  });

  it("unsubscribe stops further notifications", () => {
    const store = createShipmentStore([ship()]);
    let calls = 0;
    const unsub = store.subscribe(() => calls++);
    store.setItems([ship({ id: "X" })]);
    unsub();
    store.setItems([ship({ id: "Y" })]);
    expect(calls).toBe(1);
  });
});

describe("createShipmentStore — createForOrder (auto shipment from order cascade)", () => {
  let store: ShipmentStore;
  beforeEach(() => {
    store = createShipmentStore([
      ship({ id: "SHP-2026-00001", orderIds: ["ORD-A"], status: "出荷指示作成" }),
    ]);
  });

  it("appends a new ShipmentRecord in 出荷指示作成 for the given orderId", () => {
    const result = store.createForOrder("ORD-B");
    expect(result.created).toBe(true);
    expect(result.record?.status).toBe("出荷指示作成");
    expect(result.record?.orderIds).toEqual(["ORD-B"]);
    expect(store.getState()).toHaveLength(2);
  });

  it("auto-generates an id matching the SHP-YYYY-NNNNN scheme based on max existing", () => {
    const result = store.createForOrder("ORD-B");
    expect(result.record?.id).toMatch(/^SHP-\d{4}-\d{5}$/);
    const num = parseInt(result.record!.id.slice(-5), 10);
    expect(num).toBeGreaterThan(1);
  });

  it("starts ids at 00001 when store is empty", () => {
    const empty = createShipmentStore();
    const result = empty.createForOrder("ORD-B");
    expect(result.record?.id).toMatch(/00001$/);
  });

  it("attaches optional metadata (carrier / customer / shop) to the new record", () => {
    const result = store.createForOrder("ORD-B", {
      customer: "山田 太郎",
      carrier: "ヤマト運輸",
      shop: "本店",
    });
    expect(result.record?.customer).toBe("山田 太郎");
    expect(result.record?.carrier).toBe("ヤマト運輸");
    expect(result.record?.shop).toBe("本店");
  });

  it("returns created=false if a shipment already exists for the same orderId (dedupe)", () => {
    const result = store.createForOrder("ORD-A");
    expect(result.created).toBe(false);
    expect(store.getState()).toHaveLength(1);
  });

  it("notifies subscribers on creation", () => {
    let calls = 0;
    store.subscribe(() => calls++);
    store.createForOrder("ORD-B");
    expect(calls).toBe(1);
  });
});

describe("createShipmentStore — immutability", () => {
  it("getState returns a stable reference until mutation", () => {
    const store = createShipmentStore([ship()]);
    expect(store.getState()).toBe(store.getState());
  });

  it("getState returns a new reference after a successful transition", () => {
    const store = createShipmentStore([ship({ status: "出荷指示作成" })]);
    const before = store.getState();
    store.applyTransition("SHIP-001", "startPicking");
    expect(store.getState()).not.toBe(before);
  });
});
