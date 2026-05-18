import { describe, it, expect } from "vitest";
import { onPurchaseTransitioned } from "./purchase-handlers";
import type { PurchaseOrderState, PurchaseOrderLine } from "../state-machines/purchase";

const line = (overrides: Partial<PurchaseOrderLine> = {}): PurchaseOrderLine => ({
  sku: "SKU-1",
  warehouse: "本店",
  orderedQty: 10,
  receivedQty: 0,
  ...overrides,
});

const po = (overrides: Partial<PurchaseOrderState> = {}): PurchaseOrderState => ({
  status: "発行済",
  lines: [line()],
  ...overrides,
});

describe("onPurchaseTransitioned — receive deltas", () => {
  it("returns receiveInventory for the delta when a line gets partially received", () => {
    const before = po({ lines: [line({ receivedQty: 0 })] });
    const after = po({ status: "注残あり", lines: [line({ receivedQty: 4 })] });

    const effects = onPurchaseTransitioned(before, after);

    expect(effects.receiveInventory).toEqual({
      lines: [{ sku: "SKU-1", warehouse: "本店", qty: 4 }],
    });
  });

  it("returns the incremental delta on successive receipts (not the cumulative total)", () => {
    const before = po({ status: "注残あり", lines: [line({ receivedQty: 3 })] });
    const after = po({ status: "注残あり", lines: [line({ receivedQty: 7 })] });

    const effects = onPurchaseTransitioned(before, after);

    expect(effects.receiveInventory).toEqual({
      lines: [{ sku: "SKU-1", warehouse: "本店", qty: 4 }],
    });
  });

  it("returns one entry per line that increased, leaving untouched lines out", () => {
    const before = po({
      lines: [
        line({ sku: "A", receivedQty: 0 }),
        line({ sku: "B", receivedQty: 2 }),
        line({ sku: "C", receivedQty: 5 }),
      ],
    });
    const after = po({
      status: "注残あり",
      lines: [
        line({ sku: "A", receivedQty: 6 }),
        line({ sku: "B", receivedQty: 2 }), // unchanged
        line({ sku: "C", receivedQty: 10 }),
      ],
    });

    const effects = onPurchaseTransitioned(before, after);

    expect(effects.receiveInventory?.lines).toEqual([
      { sku: "A", warehouse: "本店", qty: 6 },
      { sku: "C", warehouse: "本店", qty: 5 },
    ]);
  });

  it("emits descriptors even when reaching 仕入完了 (treats it like any other receive)", () => {
    const before = po({ status: "注残あり", lines: [line({ receivedQty: 4 })] });
    const after = po({ status: "仕入完了", lines: [line({ receivedQty: 10 })] });

    const effects = onPurchaseTransitioned(before, after);

    expect(effects.receiveInventory?.lines).toEqual([
      { sku: "SKU-1", warehouse: "本店", qty: 6 },
    ]);
  });
});

describe("onPurchaseTransitioned — no-op cases", () => {
  it("returns {} when no receivedQty changed", () => {
    const before = po({ lines: [line({ receivedQty: 3 })] });
    const after = po({ lines: [line({ receivedQty: 3 })] });

    expect(onPurchaseTransitioned(before, after)).toEqual({});
  });

  it("returns {} on a pure status change with no receipt (e.g. issue, cancel)", () => {
    const before = po({ status: "未発行", lines: [line({ receivedQty: 0 })] });
    const after = po({ status: "発行済", lines: [line({ receivedQty: 0 })] });

    expect(onPurchaseTransitioned(before, after)).toEqual({});
  });

  it("returns {} when cancelling a partially received PO (received goods stay in inventory)", () => {
    const before = po({ status: "注残あり", lines: [line({ receivedQty: 4 })] });
    const after = po({ status: "キャンセル", lines: [line({ receivedQty: 4 })] });

    expect(onPurchaseTransitioned(before, after)).toEqual({});
  });

  it("ignores negative deltas (v1 does not support receipt cancellation)", () => {
    const before = po({ status: "注残あり", lines: [line({ receivedQty: 6 })] });
    const after = po({ status: "注残あり", lines: [line({ receivedQty: 4 })] });

    expect(onPurchaseTransitioned(before, after)).toEqual({});
  });

  it("treats a line newly appearing in after as a fresh receipt delta from zero", () => {
    const before = po({ lines: [line({ sku: "A", receivedQty: 0 })] });
    const after = po({
      status: "注残あり",
      lines: [
        line({ sku: "A", receivedQty: 0 }),
        line({ sku: "B", receivedQty: 5 }),
      ],
    });

    const effects = onPurchaseTransitioned(before, after);

    expect(effects.receiveInventory?.lines).toEqual([
      { sku: "B", warehouse: "本店", qty: 5 },
    ]);
  });
});
