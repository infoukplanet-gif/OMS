import { describe, it, expect } from "vitest";
import { applyInventoryRelease } from "./inventory-handlers";
import type { OrderAllocation } from "../state-machines/inventory";

const allocation = (lines: OrderAllocation["lines"]): OrderAllocation => ({
  orderId: "ORD-2026-08851",
  lines,
});

describe("applyInventoryRelease", () => {
  it("converts a single-line allocation into a single release op", () => {
    const ops = applyInventoryRelease(
      "order-cancelled",
      allocation([{ sku: "WEP-001-BK", warehouse: "東京本社倉庫", qty: 2 }]),
    );

    expect(ops.releases).toEqual([
      { sku: "WEP-001-BK", warehouse: "東京本社倉庫", qty: 2 },
    ]);
  });

  it("converts a multi-line allocation into multiple release ops, one per line", () => {
    const ops = applyInventoryRelease(
      "shipment-cancelled",
      allocation([
        { sku: "WEP-001-BK", warehouse: "東京本社倉庫", qty: 1 },
        { sku: "UCB-002", warehouse: "大阪倉庫", qty: 3 },
      ]),
    );

    expect(ops.releases.length).toBe(2);
    expect(ops.releases[0]).toEqual({ sku: "WEP-001-BK", warehouse: "東京本社倉庫", qty: 1 });
    expect(ops.releases[1]).toEqual({ sku: "UCB-002", warehouse: "大阪倉庫", qty: 3 });
  });

  it("returns no ops for an empty allocation", () => {
    const ops = applyInventoryRelease("order-cancelled", allocation([]));
    expect(ops.releases).toEqual([]);
  });

  it("filters out zero-qty lines (they would be no-ops downstream anyway)", () => {
    const ops = applyInventoryRelease(
      "order-cancelled",
      allocation([
        { sku: "A", warehouse: "W1", qty: 0 },
        { sku: "B", warehouse: "W1", qty: 2 },
      ]),
    );

    expect(ops.releases).toEqual([{ sku: "B", warehouse: "W1", qty: 2 }]);
  });

  it("filters out negative-qty lines (defensive against malformed input)", () => {
    const ops = applyInventoryRelease(
      "order-cancelled",
      allocation([{ sku: "A", warehouse: "W1", qty: -3 }]),
    );

    expect(ops.releases).toEqual([]);
  });

  it("aggregates duplicate (sku,warehouse) lines into a single release op", () => {
    // 同じ SKU×倉庫 の重複行は合算する。inventory.release を1回で済ませるため。
    const ops = applyInventoryRelease(
      "order-cancelled",
      allocation([
        { sku: "A", warehouse: "W1", qty: 2 },
        { sku: "A", warehouse: "W1", qty: 3 },
        { sku: "B", warehouse: "W1", qty: 1 },
      ]),
    );

    expect(ops.releases).toContainEqual({ sku: "A", warehouse: "W1", qty: 5 });
    expect(ops.releases).toContainEqual({ sku: "B", warehouse: "W1", qty: 1 });
    expect(ops.releases.length).toBe(2);
  });

  it("does not mutate the input allocation", () => {
    const lines: OrderAllocation["lines"] = [
      { sku: "A", warehouse: "W1", qty: 2 },
      { sku: "A", warehouse: "W1", qty: 3 },
    ];
    const alloc = allocation(lines);
    const snapshot = JSON.parse(JSON.stringify(alloc));

    applyInventoryRelease("order-cancelled", alloc);

    expect(alloc).toEqual(snapshot);
  });

  it("is deterministic — repeated calls produce equal results", () => {
    const alloc = allocation([
      { sku: "A", warehouse: "W1", qty: 1 },
      { sku: "B", warehouse: "W1", qty: 2 },
    ]);

    const r1 = applyInventoryRelease("order-cancelled", alloc);
    const r2 = applyInventoryRelease("order-cancelled", alloc);

    expect(r1).toEqual(r2);
  });

  it("treats both reasons (order-cancelled / shipment-cancelled) the same way at this layer", () => {
    // v1 は reason をログ目的で受け取るが、解放操作自体は同一。
    const alloc = allocation([{ sku: "A", warehouse: "W1", qty: 1 }]);
    const r1 = applyInventoryRelease("order-cancelled", alloc);
    const r2 = applyInventoryRelease("shipment-cancelled", alloc);

    expect(r1.releases).toEqual(r2.releases);
  });
});
