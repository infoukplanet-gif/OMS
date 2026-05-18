import { describe, it, expect } from "vitest";
import { onOrderTransitioned } from "./order-handlers";
import type { OrderState } from "../state-machines/order";

const order = (overrides: Partial<OrderState> = {}): OrderState => ({
  status: "新規受付",
  ...overrides,
});

describe("onOrderTransitioned — Shipment auto-creation on 引当待ち arrival", () => {
  it("returns createShipment when transitioning into 引当待ち", () => {
    const before = order({ status: "入金待ち" });
    const after = order({ status: "引当待ち" });

    const effects = onOrderTransitioned(before, after, "ORD-001");

    expect(effects.createShipment).toEqual({ orderId: "ORD-001" });
  });

  it("does NOT return createShipment when already at 引当待ち (no change)", () => {
    const same = order({ status: "引当待ち" });
    const effects = onOrderTransitioned(same, same, "ORD-001");

    expect(effects.createShipment).toBeUndefined();
  });

  it("does NOT return createShipment when status moves out of 引当待ち", () => {
    const before = order({ status: "引当待ち" });
    const after = order({ status: "印刷待ち" });

    const effects = onOrderTransitioned(before, after, "ORD-001");

    expect(effects.createShipment).toBeUndefined();
  });

  it("skips createShipment when disableShipmentAutoCreate is true", () => {
    const before = order({ status: "入金待ち" });
    const after = order({ status: "引当待ち" });

    const effects = onOrderTransitioned(before, after, "ORD-001", {
      disableShipmentAutoCreate: true,
    });

    expect(effects.createShipment).toBeUndefined();
  });
});

describe("onOrderTransitioned — inventory release on cancellation", () => {
  it("returns releaseInventory when cancelling from 引当待ち", () => {
    const before = order({ status: "引当待ち" });
    const after = order({ status: "キャンセル" });

    const effects = onOrderTransitioned(before, after, "ORD-001");

    expect(effects.releaseInventory).toEqual({
      orderId: "ORD-001",
      reason: "order-cancelled",
    });
  });

  it("returns releaseInventory when cancelling from 印刷待ち", () => {
    const effects = onOrderTransitioned(
      order({ status: "印刷待ち" }),
      order({ status: "キャンセル" }),
      "ORD-001",
    );
    expect(effects.releaseInventory).toEqual({
      orderId: "ORD-001",
      reason: "order-cancelled",
    });
  });

  it("returns releaseInventory when cancelling from 印刷済み", () => {
    const effects = onOrderTransitioned(
      order({ status: "印刷済み" }),
      order({ status: "キャンセル" }),
      "ORD-001",
    );
    expect(effects.releaseInventory).toEqual({
      orderId: "ORD-001",
      reason: "order-cancelled",
    });
  });

  it("does NOT return releaseInventory when cancelling before allocation (新規受付/確認待ち/発売日時待ち/入金待ち)", () => {
    const preAllocationStatuses = ["新規受付", "確認待ち", "発売日時待ち", "入金待ち"] as const;

    for (const status of preAllocationStatuses) {
      const effects = onOrderTransitioned(
        order({ status }),
        order({ status: "キャンセル" }),
        "ORD-001",
      );
      expect(effects.releaseInventory).toBeUndefined();
    }
  });

  it("does NOT return releaseInventory when already at キャンセル", () => {
    const same = order({ status: "キャンセル" });
    const effects = onOrderTransitioned(same, same, "ORD-001");
    expect(effects.releaseInventory).toBeUndefined();
  });
});

describe("onOrderTransitioned — thanks mail trigger (受注確定)", () => {
  const orderConfirmedTargets = ["入金待ち", "引当待ち", "発売日時待ち"] as const;
  const newOrderSources = ["新規受付", "確認待ち"] as const;

  for (const before_ of newOrderSources) {
    for (const after_ of orderConfirmedTargets) {
      it(`returns sendMail(thanks) when transitioning ${before_} → ${after_}`, () => {
        const effects = onOrderTransitioned(
          order({ status: before_ }),
          order({ status: after_ }),
          "ORD-001",
        );
        expect(effects.sendMail).toEqual({
          orderId: "ORD-001",
          triggerType: "thanks",
          dedupeKey: "ORD-001:thanks",
        });
      });
    }
  }

  it("does NOT return sendMail when re-transitioning between order-confirmed statuses", () => {
    const effects = onOrderTransitioned(
      order({ status: "入金待ち" }),
      order({ status: "引当待ち" }),
      "ORD-001",
    );
    expect(effects.sendMail).toBeUndefined();
  });

  it("does NOT return sendMail when going to キャンセル", () => {
    const effects = onOrderTransitioned(
      order({ status: "新規受付" }),
      order({ status: "キャンセル" }),
      "ORD-001",
    );
    expect(effects.sendMail).toBeUndefined();
  });

  it("does NOT return sendMail when status stays the same", () => {
    const same = order({ status: "新規受付" });
    const effects = onOrderTransitioned(same, same, "ORD-001");
    expect(effects.sendMail).toBeUndefined();
  });
});

describe("onOrderTransitioned — purity and other transitions", () => {
  it("returns an empty effects object for transitions that have no cross-domain consequences", () => {
    const effects = onOrderTransitioned(
      order({ status: "新規受付" }),
      order({ status: "確認待ち" }),
      "ORD-001",
    );
    expect(effects).toEqual({});
  });

  it("does not mutate the input states", () => {
    const before = order({ status: "入金待ち" });
    const after = order({ status: "引当待ち" });
    const beforeSnapshot = { ...before };
    const afterSnapshot = { ...after };

    onOrderTransitioned(before, after, "ORD-001");

    expect(before).toEqual(beforeSnapshot);
    expect(after).toEqual(afterSnapshot);
  });

  it("is deterministic — repeated calls produce equal results", () => {
    const before = order({ status: "入金待ち" });
    const after = order({ status: "引当待ち" });

    const r1 = onOrderTransitioned(before, after, "ORD-001");
    const r2 = onOrderTransitioned(before, after, "ORD-001");

    expect(r1).toEqual(r2);
  });
});
