import { describe, it, expect, beforeEach } from "vitest";
import {
  createInventoryStore,
  type InventoryStore,
} from "./inventory";
import type { InventoryRecord, AllocationLine } from "../state-machines/inventory";

const rec = (overrides: Partial<InventoryRecord> = {}): InventoryRecord => ({
  sku: "WEP-001-BK",
  warehouse: "東京本社倉庫",
  onHand: 30,
  allocated: 5,
  constant: 10,
  reorder: 15,
  lot: 10,
  ...overrides,
});

describe("createInventoryStore — getState / setItems", () => {
  it("starts empty by default", () => {
    const store = createInventoryStore();
    expect(store.getState()).toEqual([]);
  });

  it("accepts an initial seed", () => {
    const store = createInventoryStore([rec(), rec({ sku: "X", warehouse: "Y" })]);
    expect(store.getState()).toHaveLength(2);
  });

  it("setItems replaces the entire list", () => {
    const store = createInventoryStore([rec()]);
    store.setItems([rec({ sku: "X" })]);
    expect(store.getState().map((r) => r.sku)).toEqual(["X"]);
  });
});

describe("createInventoryStore — applyReceive (purchase cascade)", () => {
  let store: InventoryStore;
  beforeEach(() => {
    store = createInventoryStore([
      rec({ sku: "A", warehouse: "東京", onHand: 10 }),
      rec({ sku: "B", warehouse: "東京", onHand: 5 }),
      rec({ sku: "A", warehouse: "大阪", onHand: 2 }),
    ]);
  });

  it("adds qty to onHand for matching (sku, warehouse)", () => {
    const result = store.applyReceive([
      { sku: "A", warehouse: "東京", qty: 7 },
    ]);
    expect(result.applied).toBe(true);
    expect(result.appliedCount).toBe(1);
    const a = store.getState().find((r) => r.sku === "A" && r.warehouse === "東京");
    expect(a?.onHand).toBe(17);
  });

  it("does not touch allocated", () => {
    const before = store.getState().find((r) => r.sku === "A" && r.warehouse === "東京")!;
    store.applyReceive([{ sku: "A", warehouse: "東京", qty: 5 }]);
    const after = store.getState().find((r) => r.sku === "A" && r.warehouse === "東京")!;
    expect(after.allocated).toBe(before.allocated);
  });

  it("only updates records that match a receipt (other rows untouched)", () => {
    store.applyReceive([{ sku: "A", warehouse: "東京", qty: 5 }]);
    const others = store.getState().filter((r) => !(r.sku === "A" && r.warehouse === "東京"));
    expect(others.find((r) => r.sku === "B")?.onHand).toBe(5);
    expect(others.find((r) => r.sku === "A" && r.warehouse === "大阪")?.onHand).toBe(2);
  });

  it("aggregates multiple receipts for the same key into a single increment", () => {
    store.applyReceive([
      { sku: "A", warehouse: "東京", qty: 3 },
      { sku: "A", warehouse: "東京", qty: 4 },
    ]);
    expect(store.getState().find((r) => r.sku === "A" && r.warehouse === "東京")?.onHand).toBe(17);
  });

  it("ignores receipts with qty <= 0", () => {
    const result = store.applyReceive([
      { sku: "A", warehouse: "東京", qty: 0 },
      { sku: "A", warehouse: "東京", qty: -5 },
    ]);
    expect(result.applied).toBe(false);
    expect(result.appliedCount).toBe(0);
    expect(store.getState().find((r) => r.sku === "A" && r.warehouse === "東京")?.onHand).toBe(10);
  });

  it("ignores receipts that match no inventory record (unknownReceipts surfaced)", () => {
    const result = store.applyReceive([
      { sku: "UNKNOWN", warehouse: "東京", qty: 5 },
    ]);
    expect(result.applied).toBe(false);
    expect(result.unknownReceipts).toEqual([
      { sku: "UNKNOWN", warehouse: "東京", qty: 5 },
    ]);
  });

  it("applies the known receipts and lists unknown ones", () => {
    const result = store.applyReceive([
      { sku: "A", warehouse: "東京", qty: 5 },
      { sku: "UNKNOWN", warehouse: "東京", qty: 3 },
    ]);
    expect(result.applied).toBe(true);
    expect(result.appliedCount).toBe(1);
    expect(result.unknownReceipts).toHaveLength(1);
  });
});

describe("createInventoryStore — subscribe / unsubscribe", () => {
  it("notifies subscribers on setItems", () => {
    const store = createInventoryStore([rec()]);
    let calls = 0;
    const unsub = store.subscribe(() => calls++);
    store.setItems([rec({ sku: "X" })]);
    store.setItems([rec({ sku: "Y" })]);
    expect(calls).toBe(2);
    unsub();
    store.setItems([rec({ sku: "Z" })]);
    expect(calls).toBe(2);
  });

  it("notifies subscribers on successful applyReceive", () => {
    const store = createInventoryStore([rec({ sku: "A", warehouse: "東京", onHand: 10 })]);
    let calls = 0;
    store.subscribe(() => calls++);
    store.applyReceive([{ sku: "A", warehouse: "東京", qty: 3 }]);
    expect(calls).toBe(1);
  });

  it("does NOT notify when applyReceive is a no-op (no matching record)", () => {
    const store = createInventoryStore([rec({ sku: "A", warehouse: "東京" })]);
    let calls = 0;
    store.subscribe(() => calls++);
    store.applyReceive([{ sku: "UNKNOWN", warehouse: "東京", qty: 5 }]);
    expect(calls).toBe(0);
  });

  it("does NOT notify when applyReceive has only zero/negative qty receipts", () => {
    const store = createInventoryStore([rec({ sku: "A", warehouse: "東京" })]);
    let calls = 0;
    store.subscribe(() => calls++);
    store.applyReceive([{ sku: "A", warehouse: "東京", qty: 0 }]);
    expect(calls).toBe(0);
  });
});

describe("createInventoryStore — immutability", () => {
  it("getState returns a stable reference until a mutation occurs", () => {
    const store = createInventoryStore([rec()]);
    const first = store.getState();
    const second = store.getState();
    expect(first).toBe(second);
  });

  it("getState returns a new reference after a successful applyReceive", () => {
    const store = createInventoryStore([rec({ sku: "A", warehouse: "東京", onHand: 10 })]);
    const first = store.getState();
    store.applyReceive([{ sku: "A", warehouse: "東京", qty: 5 } satisfies AllocationLine]);
    const second = store.getState();
    expect(first).not.toBe(second);
  });
});
