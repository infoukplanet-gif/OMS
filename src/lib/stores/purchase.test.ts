import { describe, it, expect, beforeEach } from "vitest";
import {
  createPurchaseStore,
  type PurchaseOrderRecord,
  type PurchaseStore,
} from "./purchase";

const rec = (overrides: Partial<PurchaseOrderRecord> = {}): PurchaseOrderRecord => ({
  id: "PO-001",
  status: "発行済",
  lines: [
    { sku: "SKU-1", warehouse: "本店", orderedQty: 10, receivedQty: 0 },
  ],
  ...overrides,
});

describe("createPurchaseStore — getState / setItems", () => {
  it("starts empty by default", () => {
    const store = createPurchaseStore();
    expect(store.getState()).toEqual([]);
  });

  it("accepts an initial seed", () => {
    const store = createPurchaseStore([rec(), rec({ id: "PO-002" })]);
    expect(store.getState()).toHaveLength(2);
  });

  it("setItems replaces the entire list and notifies subscribers", () => {
    const store = createPurchaseStore([rec()]);
    let calls = 0;
    store.subscribe(() => calls++);
    store.setItems([rec({ id: "X" })]);
    expect(store.getState().map((r) => r.id)).toEqual(["X"]);
    expect(calls).toBe(1);
  });
});

describe("createPurchaseStore — applyIssue", () => {
  let store: PurchaseStore;
  beforeEach(() => {
    store = createPurchaseStore([
      rec({ id: "PO-A", status: "未発行" }),
      rec({ id: "PO-B", status: "発行済" }),
    ]);
  });

  it("transitions 未発行 → 発行済 and notifies subscribers", () => {
    let calls = 0;
    store.subscribe(() => calls++);
    const result = store.applyIssue("PO-A");
    expect(result.applied).toBe(true);
    expect(result.after?.status).toBe("発行済");
    expect(calls).toBe(1);
  });

  it("returns applied=false on guard rejection (already 発行済)", () => {
    let calls = 0;
    store.subscribe(() => calls++);
    const result = store.applyIssue("PO-B");
    expect(result.applied).toBe(false);
    expect(calls).toBe(0);
  });

  it("returns applied=false when id is unknown", () => {
    const result = store.applyIssue("MISSING");
    expect(result.applied).toBe(false);
  });
});

describe("createPurchaseStore — applyReceive (cascade effects)", () => {
  let store: PurchaseStore;
  beforeEach(() => {
    store = createPurchaseStore([
      rec({
        id: "PO-A",
        status: "発行済",
        lines: [
          { sku: "SKU-1", warehouse: "本店", orderedQty: 10, receivedQty: 0 },
          { sku: "SKU-2", warehouse: "本店", orderedQty: 5, receivedQty: 0 },
        ],
      }),
    ]);
  });

  it("partial receipt → status 注残あり, returns receiveInventory delta", () => {
    const result = store.applyReceive("PO-A", [
      { sku: "SKU-1", warehouse: "本店", qty: 4 },
    ]);
    expect(result.applied).toBe(true);
    expect(result.after?.status).toBe("注残あり");
    expect(result.effects.receiveInventory?.lines).toEqual([
      { sku: "SKU-1", warehouse: "本店", qty: 4 },
    ]);
  });

  it("full receipt across all lines → status 仕入完了", () => {
    const result = store.applyReceive("PO-A", [
      { sku: "SKU-1", warehouse: "本店", qty: 10 },
      { sku: "SKU-2", warehouse: "本店", qty: 5 },
    ]);
    expect(result.applied).toBe(true);
    expect(result.after?.status).toBe("仕入完了");
    expect(result.effects.receiveInventory?.lines).toHaveLength(2);
  });

  it("returns applied=false on guard rejection (条件未達成)", () => {
    store.setItems([rec({ id: "PO-X", status: "条件未達成" })]);
    const result = store.applyReceive("PO-X", [
      { sku: "SKU-1", warehouse: "本店", qty: 1 },
    ]);
    expect(result.applied).toBe(false);
    expect(result.effects).toEqual({});
  });

  it("returns applied=false when id is unknown", () => {
    const result = store.applyReceive("MISSING", [
      { sku: "SKU-1", warehouse: "本店", qty: 1 },
    ]);
    expect(result.applied).toBe(false);
  });

  it("returns applied=false when receipts contain no qty > 0 lines (no-op)", () => {
    let calls = 0;
    store.subscribe(() => calls++);
    const result = store.applyReceive("PO-A", [
      { sku: "SKU-1", warehouse: "本店", qty: 0 },
    ]);
    expect(result.applied).toBe(false);
    expect(calls).toBe(0);
  });

  it("notifies subscribers on successful receipt", () => {
    let calls = 0;
    store.subscribe(() => calls++);
    store.applyReceive("PO-A", [{ sku: "SKU-1", warehouse: "本店", qty: 3 }]);
    expect(calls).toBe(1);
  });
});

describe("createPurchaseStore — applyCancel", () => {
  let store: PurchaseStore;
  beforeEach(() => {
    store = createPurchaseStore([
      rec({ id: "PO-A", status: "未発行" }),
      rec({ id: "PO-B", status: "仕入完了" }),
      rec({ id: "PO-C", status: "キャンセル" }),
    ]);
  });

  it("cancels a non-terminal PO and notifies", () => {
    let calls = 0;
    store.subscribe(() => calls++);
    const result = store.applyCancel("PO-A");
    expect(result.applied).toBe(true);
    expect(result.after?.status).toBe("キャンセル");
    expect(calls).toBe(1);
  });

  it("is a no-op on already 仕入完了 (guard)", () => {
    let calls = 0;
    store.subscribe(() => calls++);
    const result = store.applyCancel("PO-B");
    expect(result.applied).toBe(false);
    expect(calls).toBe(0);
  });

  it("is a no-op on already キャンセル", () => {
    const result = store.applyCancel("PO-C");
    expect(result.applied).toBe(false);
  });
});

describe("createPurchaseStore — immutability", () => {
  it("getState returns a stable reference until a mutation occurs", () => {
    const store = createPurchaseStore([rec()]);
    expect(store.getState()).toBe(store.getState());
  });

  it("getState returns a new reference after a successful transition", () => {
    const store = createPurchaseStore([rec({ id: "PO-A", status: "未発行" })]);
    const before = store.getState();
    store.applyIssue("PO-A");
    expect(store.getState()).not.toBe(before);
  });
});
