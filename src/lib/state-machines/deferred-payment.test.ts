import { describe, it, expect } from "vitest";
import {
  transitionDeferredPayment,
  canTransitionDeferredPayment,
  nextDeferredPaymentStatus,
  type DeferredPaymentRecord,
} from "./deferred-payment";

const base: DeferredPaymentRecord = {
  id: "NP-005",
  order: "ORD-2026-00815",
  customer: "山田太郎",
  amount: 184000,
  status: "与信中",
  registeredAt: "2026-04-25",
  daysAged: 0,
};

describe("transitionDeferredPayment - 与信/請求フロー", () => {
  it("approve: 与信中 → 与信OK", () => {
    expect(transitionDeferredPayment(base, "approve").status).toBe("与信OK");
  });

  it("switchPayment: 与信NG → 切替済", () => {
    const ng: DeferredPaymentRecord = { ...base, status: "与信NG" };
    expect(transitionDeferredPayment(ng, "switchPayment").status).toBe("切替済");
  });

  it("writeOff: 回収不能 → 貸倒処理済", () => {
    const bad: DeferredPaymentRecord = { ...base, status: "回収不能" };
    expect(transitionDeferredPayment(bad, "writeOff").status).toBe("貸倒処理済");
  });
});

describe("transitionDeferredPayment - ガード（不正遷移は no-op で同一参照）", () => {
  it("与信中に switchPayment / writeOff は不可（同一参照）", () => {
    expect(transitionDeferredPayment(base, "switchPayment")).toBe(base);
    expect(transitionDeferredPayment(base, "writeOff")).toBe(base);
  });

  it("与信NGに approve / writeOff は不可（同一参照）", () => {
    const ng: DeferredPaymentRecord = { ...base, status: "与信NG" };
    expect(transitionDeferredPayment(ng, "approve")).toBe(ng);
    expect(transitionDeferredPayment(ng, "writeOff")).toBe(ng);
  });

  it("回収不能に approve / switchPayment は不可（同一参照）", () => {
    const bad: DeferredPaymentRecord = { ...base, status: "回収不能" };
    expect(transitionDeferredPayment(bad, "approve")).toBe(bad);
    expect(transitionDeferredPayment(bad, "switchPayment")).toBe(bad);
  });

  it("支払済 / 請求中 / 与信OK / 切替済 / 貸倒処理済 は終端（どの操作も同一参照）", () => {
    for (const status of ["支払済", "請求中", "与信OK", "切替済", "貸倒処理済"] as const) {
      const rec: DeferredPaymentRecord = { ...base, status };
      expect(transitionDeferredPayment(rec, "approve")).toBe(rec);
      expect(transitionDeferredPayment(rec, "switchPayment")).toBe(rec);
      expect(transitionDeferredPayment(rec, "writeOff")).toBe(rec);
    }
  });
});

describe("transitionDeferredPayment - 不変性", () => {
  it("元レコードを破壊しない", () => {
    const next = transitionDeferredPayment(base, "approve");
    expect(base.status).toBe("与信中");
    expect(next).not.toBe(base);
  });

  it("reminded など他項目は維持する", () => {
    const flagged: DeferredPaymentRecord = { ...base, status: "与信NG", reminded: true };
    const next = transitionDeferredPayment(flagged, "switchPayment");
    expect(next.reminded).toBe(true);
    expect(next.order).toBe("ORD-2026-00815");
  });
});

describe("canTransitionDeferredPayment / nextDeferredPaymentStatus", () => {
  it("canTransitionDeferredPayment は遷移可否を返す", () => {
    expect(canTransitionDeferredPayment("与信中", "approve")).toBe(true);
    expect(canTransitionDeferredPayment("与信中", "writeOff")).toBe(false);
    expect(canTransitionDeferredPayment("与信NG", "switchPayment")).toBe(true);
    expect(canTransitionDeferredPayment("回収不能", "writeOff")).toBe(true);
    expect(canTransitionDeferredPayment("支払済", "approve")).toBe(false);
  });

  it("nextDeferredPaymentStatus は遷移先 or null を返す", () => {
    expect(nextDeferredPaymentStatus("与信中", "approve")).toBe("与信OK");
    expect(nextDeferredPaymentStatus("与信NG", "switchPayment")).toBe("切替済");
    expect(nextDeferredPaymentStatus("回収不能", "writeOff")).toBe("貸倒処理済");
    expect(nextDeferredPaymentStatus("与信中", "switchPayment")).toBeNull();
  });
});
