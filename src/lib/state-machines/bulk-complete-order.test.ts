import { describe, it, expect } from "vitest";
import {
  transitionBulkCompleteOrder,
  canTransitionBulkCompleteOrder,
  nextBulkCompleteOrderStatus,
  type BulkCompleteOrderRecord,
} from "./bulk-complete-order";

const base: BulkCompleteOrderRecord = {
  id: "ORD-2026-01102",
  customer: "株式会社サンプル",
  status: "出荷待ち",
  amount: 38400,
  orderedAt: "2026-04-22",
};

describe("transitionBulkCompleteOrder - complete アクション", () => {
  it("complete: 確認待ち → 完了済", () => {
    const rec: BulkCompleteOrderRecord = { ...base, status: "確認待ち" };
    expect(transitionBulkCompleteOrder(rec, "complete").status).toBe("完了済");
  });

  it("complete: 引当済 → 完了済", () => {
    const rec: BulkCompleteOrderRecord = { ...base, status: "引当済" };
    expect(transitionBulkCompleteOrder(rec, "complete").status).toBe("完了済");
  });

  it("complete: 出荷待ち → 完了済", () => {
    expect(transitionBulkCompleteOrder(base, "complete").status).toBe("完了済");
  });
});

describe("transitionBulkCompleteOrder - 完了済は終端（no-op で同一参照）", () => {
  it("完了済に complete を適用しても同一参照を返す", () => {
    const done: BulkCompleteOrderRecord = { ...base, status: "完了済" };
    expect(transitionBulkCompleteOrder(done, "complete")).toBe(done);
  });
});

describe("transitionBulkCompleteOrder - 不変性", () => {
  it("元レコードを破壊しない（status が変わらない）", () => {
    const next = transitionBulkCompleteOrder(base, "complete");
    expect(base.status).toBe("出荷待ち");
    expect(next).not.toBe(base);
  });

  it("他フィールドは維持する", () => {
    const rec: BulkCompleteOrderRecord = { ...base, status: "引当済", note: "優先" };
    const next = transitionBulkCompleteOrder(rec, "complete");
    expect(next.customer).toBe("株式会社サンプル");
    expect(next.amount).toBe(38400);
    expect((next as BulkCompleteOrderRecord & { note?: string }).note).toBe("優先");
  });
});

describe("canTransitionBulkCompleteOrder", () => {
  it("確認待ち → complete は可", () => {
    expect(canTransitionBulkCompleteOrder("確認待ち", "complete")).toBe(true);
  });

  it("引当済 → complete は可", () => {
    expect(canTransitionBulkCompleteOrder("引当済", "complete")).toBe(true);
  });

  it("出荷待ち → complete は可", () => {
    expect(canTransitionBulkCompleteOrder("出荷待ち", "complete")).toBe(true);
  });

  it("完了済 → complete は不可", () => {
    expect(canTransitionBulkCompleteOrder("完了済", "complete")).toBe(false);
  });
});

describe("nextBulkCompleteOrderStatus", () => {
  it("確認待ち + complete → 完了済", () => {
    expect(nextBulkCompleteOrderStatus("確認待ち", "complete")).toBe("完了済");
  });

  it("引当済 + complete → 完了済", () => {
    expect(nextBulkCompleteOrderStatus("引当済", "complete")).toBe("完了済");
  });

  it("出荷待ち + complete → 完了済", () => {
    expect(nextBulkCompleteOrderStatus("出荷待ち", "complete")).toBe("完了済");
  });

  it("完了済 + complete → null", () => {
    expect(nextBulkCompleteOrderStatus("完了済", "complete")).toBeNull();
  });
});
