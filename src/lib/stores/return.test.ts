import { describe, expect, it } from "vitest";
import { createReturnStore, type ReturnRecord } from "./return";

function seed(): ReturnRecord[] {
  return [
    {
      id: "RMA-2026-00001",
      status: "検品中",
      orderId: "ORD-001",
      lines: [{ sku: "SKU-1", warehouse: "本社倉庫", qty: 2, restockQty: 0 }],
      refundAmount: 5000,
      customer: "山田太郎",
    },
  ];
}

describe("createReturnStore — applyTransition", () => {
  it("completeInspection で良品数量を反映し返品完了へ遷移、effects を返す", () => {
    const store = createReturnStore(seed());
    const result = store.applyTransition("RMA-2026-00001", "completeInspection", {
      inspectedGoodQty: [{ sku: "SKU-1", warehouse: "本社倉庫", goodQty: 2 }],
    });
    expect(result.applied).toBe(true);
    expect(result.after?.status).toBe("返品完了");
    expect(result.effects.restockInventory).toEqual({
      lines: [{ sku: "SKU-1", warehouse: "本社倉庫", qty: 2 }],
    });
    expect(result.effects.refundPayment).toEqual({
      orderId: "ORD-001",
      amount: 5000,
      reason: "return-completed",
    });
  });

  it("存在しない id は applied=false", () => {
    const store = createReturnStore(seed());
    expect(store.applyTransition("RMA-NOPE", "approve").applied).toBe(false);
  });

  it("guard 違反（検品中に approve）は applied=false で no-op", () => {
    const store = createReturnStore(seed());
    const result = store.applyTransition("RMA-2026-00001", "approve");
    expect(result.applied).toBe(false);
    expect(store.getState()[0].status).toBe("検品中");
  });

  it("遷移成功で subscribe リスナーへ通知する", () => {
    const store = createReturnStore(seed());
    let calls = 0;
    store.subscribe(() => calls++);
    store.applyTransition("RMA-2026-00001", "completeInspection");
    expect(calls).toBe(1);
  });

  it("no-op では通知しない", () => {
    const store = createReturnStore(seed());
    let calls = 0;
    store.subscribe(() => calls++);
    store.applyTransition("RMA-2026-00001", "approve");
    expect(calls).toBe(0);
  });
});

describe("createReturnStore — markRefundConfirmed（手動確定）", () => {
  it("返金確定フラグを立てて通知する", () => {
    const store = createReturnStore([
      { ...seed()[0], status: "返品完了", refundStatus: "起票済" },
    ]);
    let calls = 0;
    store.subscribe(() => calls++);
    const ok = store.markRefundConfirmed("RMA-2026-00001");
    expect(ok).toBe(true);
    expect(store.getState()[0].refundStatus).toBe("確定済");
    expect(calls).toBe(1);
  });

  it("既に確定済みなら no-op（false・通知なし）", () => {
    const store = createReturnStore([
      { ...seed()[0], status: "返品完了", refundStatus: "確定済" },
    ]);
    let calls = 0;
    store.subscribe(() => calls++);
    expect(store.markRefundConfirmed("RMA-2026-00001")).toBe(false);
    expect(calls).toBe(0);
  });

  it("存在しない id は false", () => {
    const store = createReturnStore(seed());
    expect(store.markRefundConfirmed("RMA-NOPE")).toBe(false);
  });
});

describe("createReturnStore — createForOrder", () => {
  it("採番して返品依頼を新規作成する", () => {
    const store = createReturnStore([]);
    const result = store.createForOrder("ORD-009", {
      lines: [{ sku: "SKU-9", warehouse: "本社倉庫", qty: 1, restockQty: 0 }],
      refundAmount: 1200,
      customer: "佐藤花子",
    });
    expect(result.created).toBe(true);
    expect(result.record?.status).toBe("返品依頼");
    expect(result.record?.id).toMatch(/^RMA-\d{4}-\d{5}$/);
    expect(store.getState()).toHaveLength(1);
  });

  it("採番は既存最大 +1", () => {
    const store = createReturnStore(seed());
    const result = store.createForOrder("ORD-009", { lines: [], refundAmount: 0 });
    expect(result.record?.id).toBe("RMA-2026-00002");
  });
});
