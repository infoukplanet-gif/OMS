import { describe, it, expect } from "vitest";
import {
  mergeReorderIntoPurchaseOrders,
  type MergeablePurchaseOrder,
  type ReorderMasterMaps,
} from "./reorder-to-po";
import type { ReorderSuggestion } from "./reorder-calculation";

const maps: ReorderMasterMaps = {
  supplier: {
    "WEP-001-BK": "株式会社ABC電子",
    "MBT-004": "株式会社ABC電子",
    "UCB-002": "株式会社ケーブルワークス",
  },
  unitCost: {
    "WEP-001-BK": 1000,
    "MBT-004": 2000,
    "UCB-002": 300,
  },
};

const opts = { today: "2026-07-15", year: 2026, startSeq: 50 };

const suggestion = (
  sku: string,
  suggestedQty: number,
  warehouse = "東京本社倉庫",
): ReorderSuggestion => ({ sku, warehouse, currentFree: 0, suggestedQty });

const po = (overrides: Partial<MergeablePurchaseOrder> = {}): MergeablePurchaseOrder => ({
  id: "PO-2026-0001",
  supplier: "株式会社ABC電子",
  status: "未発行",
  lines: [{ sku: "WEP-001-BK", warehouse: "東京本社倉庫", orderedQty: 10, receivedQty: 0 }],
  items: 10,
  amount: 10000,
  date: "2026-07-01",
  expected: "—",
  daysToArrive: 0,
  ...overrides,
});

describe("mergeReorderIntoPurchaseOrders", () => {
  it("merges same SKU into an existing 未発行 PO by taking the max quantity", () => {
    const result = mergeReorderIntoPurchaseOrders(
      [po({ lines: [{ sku: "WEP-001-BK", warehouse: "東京本社倉庫", orderedQty: 10, receivedQty: 0 }] })],
      [suggestion("WEP-001-BK", 30)],
      maps,
      opts,
    );
    expect(result.created).toBe(0);
    expect(result.merged).toBe(1);
    expect(result.orders).toHaveLength(1);
    const merged = result.orders[0];
    expect(merged.id).toBe("PO-2026-0001");
    expect(merged.lines[0].orderedQty).toBe(30);
    expect(merged.items).toBe(30);
    expect(merged.amount).toBe(30000);
  });

  it("does not reduce an existing larger quantity (max wins, idempotent)", () => {
    const existing = [po({ lines: [{ sku: "WEP-001-BK", warehouse: "東京本社倉庫", orderedQty: 50, receivedQty: 0 }], items: 50, amount: 50000 })];
    const result = mergeReorderIntoPurchaseOrders(existing, [suggestion("WEP-001-BK", 30)], maps, opts);
    expect(result.merged).toBe(0);
    expect(result.created).toBe(0);
    expect(result.orders[0].lines[0].orderedQty).toBe(50);
  });

  it("is idempotent: re-merging identical suggestions changes nothing", () => {
    const first = mergeReorderIntoPurchaseOrders(
      [po({ lines: [] , items: 0, amount: 0 })],
      [suggestion("WEP-001-BK", 30)],
      maps,
      opts,
    );
    const second = mergeReorderIntoPurchaseOrders(first.orders, [suggestion("WEP-001-BK", 30)], maps, opts);
    expect(second.created).toBe(0);
    expect(second.merged).toBe(0);
    expect(second.orders[0].lines[0].orderedQty).toBe(30);
  });

  it("appends a new SKU line to an existing same-supplier 未発行 PO", () => {
    const result = mergeReorderIntoPurchaseOrders(
      [po({ lines: [{ sku: "WEP-001-BK", warehouse: "東京本社倉庫", orderedQty: 10, receivedQty: 0 }], items: 10, amount: 10000 })],
      [suggestion("MBT-004", 20)],
      maps,
      opts,
    );
    expect(result.created).toBe(0);
    expect(result.merged).toBe(1);
    const merged = result.orders[0];
    expect(merged.lines).toHaveLength(2);
    expect(merged.items).toBe(30);
    expect(merged.amount).toBe(10 * 1000 + 20 * 2000);
  });

  it("creates a new 未発行 PO when the supplier has no draft PO", () => {
    const result = mergeReorderIntoPurchaseOrders([], [suggestion("UCB-002", 40, "大阪倉庫")], maps, opts);
    expect(result.created).toBe(1);
    expect(result.merged).toBe(0);
    expect(result.orders).toHaveLength(1);
    const created = result.orders[0];
    expect(created.id).toBe("PO-2026-0050");
    expect(created.supplier).toBe("株式会社ケーブルワークス");
    expect(created.status).toBe("未発行");
    expect(created.lines[0].orderedQty).toBe(40);
    expect(created.amount).toBe(40 * 300);
  });

  it("does not touch a 発行済 PO — creates a new draft instead", () => {
    const issued = po({ id: "PO-2026-0009", status: "発行済" });
    const result = mergeReorderIntoPurchaseOrders([issued], [suggestion("WEP-001-BK", 25)], maps, opts);
    expect(result.created).toBe(1);
    expect(result.merged).toBe(0);
    // the issued PO is preserved untouched
    const stillIssued = result.orders.find((p) => p.id === "PO-2026-0009");
    expect(stillIssued?.status).toBe("発行済");
    expect(stillIssued?.lines[0].orderedQty).toBe(10);
  });

  it("assigns incrementing sequence numbers for multiple new suppliers", () => {
    const result = mergeReorderIntoPurchaseOrders(
      [],
      [suggestion("WEP-001-BK", 10), suggestion("UCB-002", 20, "大阪倉庫")],
      maps,
      opts,
    );
    expect(result.created).toBe(2);
    const ids = result.orders.map((p) => p.id).sort();
    expect(ids).toEqual(["PO-2026-0050", "PO-2026-0051"]);
  });

  it("skips suggestions with non-positive quantity", () => {
    const result = mergeReorderIntoPurchaseOrders([], [suggestion("WEP-001-BK", 0)], maps, opts);
    expect(result.created).toBe(0);
    expect(result.orders).toHaveLength(0);
  });
});
