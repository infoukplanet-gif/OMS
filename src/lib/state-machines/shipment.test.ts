import { describe, it, expect } from "vitest";
import {
  transitionShipment,
  isShipmentCancellable,
  SHIPMENT_STATUSES,
  shipmentStatusBadge,
  createShipmentForOrder,
  type ShipmentState,
  type ShipmentStatus,
} from "./shipment";

const shipment = (overrides: Partial<ShipmentState> = {}): ShipmentState => ({
  status: "出荷指示作成",
  orderIds: ["ORD-2026-08851"],
  ...overrides,
});

describe("SHIPMENT_STATUSES", () => {
  it("contains exactly the 8 canonical statuses defined in the PRD", () => {
    expect(SHIPMENT_STATUSES).toEqual([
      "出荷指示作成",
      "ピッキング待ち",
      "検品待ち",
      "出荷待ち",
      "出荷済み",
      "配送中",
      "配達完了",
      "キャンセル",
    ]);
  });

  it("provides a badge class for every status", () => {
    for (const status of SHIPMENT_STATUSES) {
      expect(shipmentStatusBadge[status]).toMatch(/^bg-/);
    }
  });
});

describe("createShipmentForOrder", () => {
  it("initializes a shipment in 出荷指示作成 with the order id wrapped in an array", () => {
    const created = createShipmentForOrder("ORD-2026-08851");

    expect(created.status).toBe("出荷指示作成");
    expect(created.orderIds).toEqual(["ORD-2026-08851"]);
  });

  it("stores orderIds as an array even for the v1 1:1 case (forward compat with 分納)", () => {
    const created = createShipmentForOrder("ORD-X");
    expect(Array.isArray(created.orderIds)).toBe(true);
  });
});

describe("transitionShipment — happy paths", () => {
  it("startPicking 出荷指示作成 → ピッキング待ち", () => {
    const after = transitionShipment(shipment({ status: "出荷指示作成" }), "startPicking");
    expect(after.status).toBe("ピッキング待ち");
  });

  it("completePicking ピッキング待ち → 検品待ち", () => {
    const after = transitionShipment(shipment({ status: "ピッキング待ち" }), "completePicking");
    expect(after.status).toBe("検品待ち");
  });

  it("passInspection 検品待ち → 出荷待ち", () => {
    const after = transitionShipment(shipment({ status: "検品待ち" }), "passInspection");
    expect(after.status).toBe("出荷待ち");
  });

  it("failInspection 検品待ち → ピッキング待ち", () => {
    const after = transitionShipment(shipment({ status: "検品待ち" }), "failInspection");
    expect(after.status).toBe("ピッキング待ち");
  });

  it("confirmShipment 出荷待ち → 出荷済み and stamps trackingNumber", () => {
    const after = transitionShipment(shipment({ status: "出荷待ち" }), "confirmShipment", {
      trackingNumber: "JP1234567890",
    });
    expect(after.status).toBe("出荷済み");
    expect(after.trackingNumber).toBe("JP1234567890");
  });

  it("markInTransit 出荷済み → 配送中", () => {
    const after = transitionShipment(shipment({ status: "出荷済み" }), "markInTransit");
    expect(after.status).toBe("配送中");
  });

  it("markDelivered 配送中 → 配達完了", () => {
    const after = transitionShipment(shipment({ status: "配送中" }), "markDelivered");
    expect(after.status).toBe("配達完了");
  });
});

describe("transitionShipment — cancellation", () => {
  it("moves any pre-shipped status to キャンセル", () => {
    const preShipped: ShipmentStatus[] = [
      "出荷指示作成",
      "ピッキング待ち",
      "検品待ち",
      "出荷待ち",
    ];
    for (const status of preShipped) {
      const after = transitionShipment(shipment({ status }), "cancel");
      expect(after.status).toBe("キャンセル");
    }
  });

  it("does not allow cancellation once 出荷済み or beyond", () => {
    const postShipped: ShipmentStatus[] = ["出荷済み", "配送中", "配達完了", "キャンセル"];
    for (const status of postShipped) {
      const before = shipment({ status });
      const after = transitionShipment(before, "cancel");
      expect(after).toBe(before); // reference identity preserved
    }
  });
});

describe("transitionShipment — idempotency", () => {
  it("returns the same reference when the action is not allowed from the current status", () => {
    const before = shipment({ status: "出荷指示作成" });
    const after = transitionShipment(before, "markDelivered");
    expect(after).toBe(before);
  });

  it("returns the same reference when confirmShipment fires twice", () => {
    const start = shipment({ status: "出荷待ち" });
    const once = transitionShipment(start, "confirmShipment", { trackingNumber: "TRK-1" });
    const twice = transitionShipment(once, "confirmShipment", { trackingNumber: "TRK-1" });
    expect(once.status).toBe("出荷済み");
    expect(twice).toBe(once);
  });

  it("never throws for any (status, action) pair", () => {
    const actions: Parameters<typeof transitionShipment>[1][] = [
      "startPicking",
      "completePicking",
      "passInspection",
      "failInspection",
      "confirmShipment",
      "markInTransit",
      "markDelivered",
      "cancel",
    ];

    for (const status of SHIPMENT_STATUSES) {
      for (const action of actions) {
        expect(() => transitionShipment(shipment({ status }), action)).not.toThrow();
      }
    }
  });
});

describe("transitionShipment — immutability", () => {
  it("does not mutate the input on a successful transition", () => {
    const before = shipment({ status: "出荷待ち" });
    const snapshot = { ...before, orderIds: [...before.orderIds] };
    const after = transitionShipment(before, "confirmShipment", { trackingNumber: "T-1" });

    expect(before).toEqual(snapshot);
    expect(after).not.toBe(before);
    expect(after.orderIds).toEqual(before.orderIds);
  });
});

describe("isShipmentCancellable", () => {
  it("returns true only for pre-shipped statuses", () => {
    const expectedTrue: ShipmentStatus[] = [
      "出荷指示作成",
      "ピッキング待ち",
      "検品待ち",
      "出荷待ち",
    ];
    for (const status of SHIPMENT_STATUSES) {
      expect(isShipmentCancellable(status)).toBe(expectedTrue.includes(status));
    }
  });
});
