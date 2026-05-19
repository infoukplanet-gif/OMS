import { describe, it, expect } from "vitest";
import { onShipmentTransitioned } from "./shipment-handlers";
import type { ShipmentState } from "../state-machines/shipment";

const shipment = (overrides: Partial<ShipmentState> = {}): ShipmentState => ({
  status: "出荷指示作成",
  orderIds: ["ORD-001"],
  ...overrides,
});

describe("onShipmentTransitioned — Order cascade on shipment confirmation", () => {
  it("returns cascadeOrderAction registerShipment when entering 出荷済み", () => {
    const before = shipment({ status: "出荷待ち" });
    const after = shipment({ status: "出荷済み" });

    const effects = onShipmentTransitioned(before, after);

    expect(effects.cascadeOrderAction).toEqual({
      orderId: "ORD-001",
      action: "registerShipment",
    });
  });

  it("does NOT cascade when shipment was already 出荷済み (no change)", () => {
    const same = shipment({ status: "出荷済み" });
    const effects = onShipmentTransitioned(same, same);

    expect(effects.cascadeOrderAction).toBeUndefined();
  });

  it("does NOT cascade when transitioning out of 出荷済み (e.g. 出荷済み → 配送中)", () => {
    const before = shipment({ status: "出荷済み" });
    const after = shipment({ status: "配送中" });

    const effects = onShipmentTransitioned(before, after);

    expect(effects.cascadeOrderAction).toBeUndefined();
  });
});

describe("onShipmentTransitioned — cancellation cascade", () => {
  it("cascades cancel to Order when Order is below 出荷済み (e.g. 印刷待ち)", () => {
    const before = shipment({ status: "出荷待ち" });
    const after = shipment({ status: "キャンセル" });

    const effects = onShipmentTransitioned(before, after, {
      orderStatusAtCancel: "印刷待ち",
    });

    expect(effects.cascadeOrderAction).toEqual({
      orderId: "ORD-001",
      action: "cancel",
    });
  });

  it("cascades cancel to Order when Order is at 印刷済み", () => {
    const effects = onShipmentTransitioned(
      shipment({ status: "出荷待ち" }),
      shipment({ status: "キャンセル" }),
      { orderStatusAtCancel: "印刷済み" },
    );

    expect(effects.cascadeOrderAction).toEqual({
      orderId: "ORD-001",
      action: "cancel",
    });
  });

  it("does NOT cascade cancel when Order is already at 出荷済み (the cascade would be a no-op anyway)", () => {
    const effects = onShipmentTransitioned(
      shipment({ status: "出荷待ち" }),
      shipment({ status: "キャンセル" }),
      { orderStatusAtCancel: "出荷済み" },
    );

    expect(effects.cascadeOrderAction).toBeUndefined();
  });

  it("does NOT cascade cancel when Order is already at キャンセル", () => {
    const effects = onShipmentTransitioned(
      shipment({ status: "出荷待ち" }),
      shipment({ status: "キャンセル" }),
      { orderStatusAtCancel: "キャンセル" },
    );

    expect(effects.cascadeOrderAction).toBeUndefined();
  });

  it("always returns releaseInventory when entering キャンセル (Shipment exists ⇒ inventory was allocated)", () => {
    const effects = onShipmentTransitioned(
      shipment({ status: "出荷待ち" }),
      shipment({ status: "キャンセル" }),
      { orderStatusAtCancel: "印刷待ち" },
    );

    expect(effects.releaseInventory).toEqual({
      orderId: "ORD-001",
      reason: "shipment-cancelled",
    });
  });

  it("does NOT return releaseInventory when shipment was already キャンセル", () => {
    const same = shipment({ status: "キャンセル" });
    const effects = onShipmentTransitioned(same, same, { orderStatusAtCancel: "キャンセル" });

    expect(effects.releaseInventory).toBeUndefined();
  });
});

describe("onShipmentTransitioned — inventory consumption on confirmation", () => {
  it("returns consumeInventory when entering 出荷済み", () => {
    const effects = onShipmentTransitioned(
      shipment({ status: "出荷待ち" }),
      shipment({ status: "出荷済み" }),
    );
    expect(effects.consumeInventory).toEqual({
      orderId: "ORD-001",
      reason: "shipment-confirmed",
    });
  });

  it("does NOT return consumeInventory when already 出荷済み", () => {
    const same = shipment({ status: "出荷済み" });
    const effects = onShipmentTransitioned(same, same);
    expect(effects.consumeInventory).toBeUndefined();
  });

  it("does NOT return consumeInventory when transitioning to キャンセル", () => {
    const effects = onShipmentTransitioned(
      shipment({ status: "出荷待ち" }),
      shipment({ status: "キャンセル" }),
      { orderStatusAtCancel: "印刷待ち" },
    );
    expect(effects.consumeInventory).toBeUndefined();
  });

  it("is emitted alongside cascadeOrderAction registerShipment and sendMail(ship-notify)", () => {
    const effects = onShipmentTransitioned(
      shipment({ status: "出荷待ち" }),
      shipment({ status: "出荷済み" }),
    );
    expect(effects.cascadeOrderAction).toBeDefined();
    expect(effects.consumeInventory).toBeDefined();
    expect(effects.sendMail).toBeDefined();
  });

  it("does NOT return consumeInventory when shipment has no orderId", () => {
    const before = shipment({ status: "出荷待ち", orderIds: [] });
    const after = shipment({ status: "出荷済み", orderIds: [] });
    const effects = onShipmentTransitioned(before, after);
    expect(effects.consumeInventory).toBeUndefined();
  });
});

describe("onShipmentTransitioned — ship-notify mail trigger", () => {
  it("returns sendMail(ship-notify) when entering 出荷済み", () => {
    const before = shipment({ status: "出荷待ち" });
    const after = shipment({ status: "出荷済み" });

    const effects = onShipmentTransitioned(before, after);

    expect(effects.sendMail).toEqual({
      orderId: "ORD-001",
      triggerType: "ship-notify",
      dedupeKey: "ORD-001:ship-notify",
    });
  });

  it("does NOT return sendMail when already 出荷済み (no change)", () => {
    const same = shipment({ status: "出荷済み" });
    const effects = onShipmentTransitioned(same, same);

    expect(effects.sendMail).toBeUndefined();
  });

  it("does NOT return sendMail when transitioning to キャンセル", () => {
    const effects = onShipmentTransitioned(
      shipment({ status: "出荷待ち" }),
      shipment({ status: "キャンセル" }),
      { orderStatusAtCancel: "印刷待ち" },
    );

    expect(effects.sendMail).toBeUndefined();
  });

  it("does NOT return sendMail when shipment has no orderId", () => {
    const before = shipment({ status: "出荷待ち", orderIds: [] });
    const after = shipment({ status: "出荷済み", orderIds: [] });

    const effects = onShipmentTransitioned(before, after);

    expect(effects.sendMail).toBeUndefined();
  });
});

describe("onShipmentTransitioned — purity and other transitions", () => {
  it("returns an empty effects object for transitions without cross-domain consequences", () => {
    const effects = onShipmentTransitioned(
      shipment({ status: "ピッキング待ち" }),
      shipment({ status: "検品待ち" }),
    );
    expect(effects).toEqual({});
  });

  it("does not mutate the input states", () => {
    const before = shipment({ status: "出荷待ち" });
    const after = shipment({ status: "出荷済み" });
    const beforeSnapshot = JSON.parse(JSON.stringify(before));
    const afterSnapshot = JSON.parse(JSON.stringify(after));

    onShipmentTransitioned(before, after);

    expect(before).toEqual(beforeSnapshot);
    expect(after).toEqual(afterSnapshot);
  });

  it("is deterministic — repeated calls produce equal results", () => {
    const before = shipment({ status: "出荷待ち" });
    const after = shipment({ status: "出荷済み" });

    const r1 = onShipmentTransitioned(before, after);
    const r2 = onShipmentTransitioned(before, after);

    expect(r1).toEqual(r2);
  });
});
