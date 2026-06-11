import { describe, it, expect } from "vitest";
import {
  transitionDefective,
  canTransition,
  nextStatus,
  type DefectiveRecord,
} from "./defective";

const base: DefectiveRecord = {
  id: "DF-001",
  order: "—",
  product: "テスト商品",
  sku: "TS-WH-M",
  warehouse: "九州物流センター",
  qty: 2,
  reason: "破損",
  route: "返品倉庫",
  source: "manual",
  registeredAt: "2026/06/11 10:00",
  registeredBy: "佐藤 健",
  status: "承認待ち",
};

describe("transitionDefective - 承認フロー", () => {
  it("approve: 承認待ち → 振替待ち", () => {
    const next = transitionDefective(base, "approve");
    expect(next.status).toBe("振替待ち");
  });

  it("reject: 承認待ち → 却下", () => {
    const next = transitionDefective(base, "reject");
    expect(next.status).toBe("却下");
  });

  it("execute: 振替待ち → 振替完了", () => {
    const approved: DefectiveRecord = { ...base, status: "振替待ち" };
    const next = transitionDefective(approved, "execute");
    expect(next.status).toBe("振替完了");
  });
});

describe("transitionDefective - ガード（不正遷移は no-op で同一参照を返す）", () => {
  it("承認待ちに execute は不可（同一参照）", () => {
    const next = transitionDefective(base, "execute");
    expect(next).toBe(base);
  });

  it("振替待ちに approve は不可（同一参照）", () => {
    const approved: DefectiveRecord = { ...base, status: "振替待ち" };
    const next = transitionDefective(approved, "approve");
    expect(next).toBe(approved);
  });

  it("振替完了から先には進めない（同一参照）", () => {
    const done: DefectiveRecord = { ...base, status: "振替完了" };
    expect(transitionDefective(done, "execute")).toBe(done);
    expect(transitionDefective(done, "approve")).toBe(done);
    expect(transitionDefective(done, "reject")).toBe(done);
  });

  it("却下から先には進めない（同一参照）", () => {
    const rejected: DefectiveRecord = { ...base, status: "却下" };
    expect(transitionDefective(rejected, "approve")).toBe(rejected);
    expect(transitionDefective(rejected, "execute")).toBe(rejected);
  });
});

describe("transitionDefective - 不変性", () => {
  it("元レコードを破壊しない", () => {
    const next = transitionDefective(base, "approve");
    expect(base.status).toBe("承認待ち");
    expect(next).not.toBe(base);
  });
});

describe("canTransition / nextStatus", () => {
  it("canTransition は遷移可否を返す", () => {
    expect(canTransition("承認待ち", "approve")).toBe(true);
    expect(canTransition("承認待ち", "execute")).toBe(false);
    expect(canTransition("振替待ち", "execute")).toBe(true);
    expect(canTransition("振替完了", "execute")).toBe(false);
  });

  it("nextStatus は遷移先 or null を返す", () => {
    expect(nextStatus("承認待ち", "approve")).toBe("振替待ち");
    expect(nextStatus("承認待ち", "execute")).toBeNull();
    expect(nextStatus("振替待ち", "execute")).toBe("振替完了");
  });
});
