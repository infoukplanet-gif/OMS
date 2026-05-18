import { describe, it, expect, beforeEach } from "vitest";
import {
  createOrderStore,
  type OrderRecord,
} from "./orders";

const order = (overrides: Partial<OrderRecord> = {}): OrderRecord => ({
  id: "ORD-001",
  status: "新規受付",
  ...overrides,
});

describe("createOrderStore — getState / setItems", () => {
  it("starts empty by default", () => {
    const store = createOrderStore();
    expect(store.getState()).toEqual([]);
  });

  it("accepts an initial seed", () => {
    const store = createOrderStore([order(), order({ id: "ORD-002" })]);
    expect(store.getState()).toHaveLength(2);
  });

  it("setItems replaces the entire list", () => {
    const store = createOrderStore([order()]);
    store.setItems([order({ id: "X" })]);
    expect(store.getState().map((o) => o.id)).toEqual(["X"]);
  });
});

describe("createOrderStore — applyTransition + handler effects", () => {
  let store: ReturnType<typeof createOrderStore>;
  beforeEach(() => {
    store = createOrderStore([
      order({ id: "ORD-A", status: "確認待ち" }),
      order({ id: "ORD-B", status: "印刷済み" }),
      order({ id: "ORD-C", status: "出荷済み" }),
    ]);
  });

  it("applies a valid transition and returns the new state + effects", () => {
    const result = store.applyTransition("ORD-A", "requestPayment");

    expect(result.applied).toBe(true);
    expect(result.after?.status).toBe("入金待ち");
    expect(result.effects.sendMail?.triggerType).toBe("thanks");
    expect(store.getState().find((o) => o.id === "ORD-A")?.status).toBe("入金待ち");
  });

  it("returns applied=false when guard rejects the transition (no-op state)", () => {
    const result = store.applyTransition("ORD-C", "registerShipment");

    expect(result.applied).toBe(false);
    expect(result.after).toBeUndefined();
    expect(store.getState().find((o) => o.id === "ORD-C")?.status).toBe("出荷済み");
  });

  it("returns applied=false when order id is unknown", () => {
    const result = store.applyTransition("MISSING", "cancel");
    expect(result.applied).toBe(false);
    expect(store.getState()).toHaveLength(3);
  });

  it("cascade: registerShipment from 印刷済み → 出荷済み also fires ship-notify is NOT order handler's job (order handler returns no ship-notify)", () => {
    const result = store.applyTransition("ORD-B", "registerShipment");
    expect(result.applied).toBe(true);
    expect(result.after?.status).toBe("出荷済み");
    // sendMail (thanks/...) は order handler から来ない。ship-notify は shipment handler 経由
    expect(result.effects.sendMail).toBeUndefined();
  });
});

describe("createOrderStore — subscribe / unsubscribe", () => {
  it("notifies subscribers on setItems", () => {
    const store = createOrderStore([order()]);
    let callCount = 0;
    const unsubscribe = store.subscribe(() => {
      callCount++;
    });

    store.setItems([order({ id: "X" })]);
    store.setItems([order({ id: "Y" })]);

    expect(callCount).toBe(2);
    unsubscribe();
    store.setItems([order({ id: "Z" })]);
    expect(callCount).toBe(2);
  });

  it("notifies subscribers on applyTransition", () => {
    const store = createOrderStore([order({ status: "確認待ち" })]);
    let calls = 0;
    store.subscribe(() => {
      calls++;
    });

    store.applyTransition("ORD-001", "requestPayment");
    expect(calls).toBe(1);
  });

  it("does NOT notify subscribers when applyTransition is a no-op", () => {
    const store = createOrderStore([order({ status: "出荷済み" })]);
    let calls = 0;
    store.subscribe(() => {
      calls++;
    });

    store.applyTransition("ORD-001", "registerShipment");
    expect(calls).toBe(0);
  });
});

describe("createOrderStore — immutability", () => {
  it("getState returns a stable reference until setItems is called", () => {
    const store = createOrderStore([order()]);
    const first = store.getState();
    const second = store.getState();
    expect(first).toBe(second);
  });

  it("getState returns a new reference after setItems", () => {
    const store = createOrderStore([order()]);
    const first = store.getState();
    store.setItems([order({ id: "X" })]);
    const second = store.getState();
    expect(first).not.toBe(second);
  });

  it("getState returns a new reference after a successful applyTransition", () => {
    const store = createOrderStore([order({ status: "確認待ち" })]);
    const first = store.getState();
    store.applyTransition("ORD-001", "requestPayment");
    const second = store.getState();
    expect(first).not.toBe(second);
  });
});
