import { describe, it, expect } from "vitest";
import {
  accruedPayableThrough,
  payableAccrualForReceipt,
  summarizePayables,
  type PayableAccrual,
  type PayablePayment,
} from "./payable-recognition";

describe("accruedPayableThrough", () => {
  it("発注総数まで全数受領すると PO 総額に一致する", () => {
    expect(accruedPayableThrough(100000, 10, 10)).toBe(100000);
  });

  it("半数受領なら按分で半額", () => {
    expect(accruedPayableThrough(100000, 10, 5)).toBe(50000);
  });

  it("端数は四捨五入で按分する", () => {
    // 100000 * 3 / 7 = 42857.14... → 42857
    expect(accruedPayableThrough(100000, 7, 3)).toBe(42857);
  });

  it("受領0なら0", () => {
    expect(accruedPayableThrough(100000, 10, 0)).toBe(0);
  });

  it("発注総数を超える累計受領でも PO 総額で頭打ち", () => {
    expect(accruedPayableThrough(100000, 10, 12)).toBe(100000);
  });

  it("発注総数0なら0（ゼロ除算回避）", () => {
    expect(accruedPayableThrough(100000, 0, 5)).toBe(0);
  });

  it("PO総額0なら0", () => {
    expect(accruedPayableThrough(0, 10, 5)).toBe(0);
  });
});

describe("payableAccrualForReceipt", () => {
  it("初回部分入荷は受領分だけ按分計上", () => {
    const amount = payableAccrualForReceipt({
      poAmount: 100000,
      totalOrderedQty: 10,
      receivedBefore: 0,
      receivedAfter: 4,
    });
    expect(amount).toBe(40000);
  });

  it("2回目の部分入荷は差分のみ計上", () => {
    const amount = payableAccrualForReceipt({
      poAmount: 100000,
      totalOrderedQty: 10,
      receivedBefore: 4,
      receivedAfter: 7,
    });
    expect(amount).toBe(30000);
  });

  it("最終入荷で端数を true-up し累計が PO 総額に一致する", () => {
    // 7個受領: round(100000*3/7)=42857, round(100000*7/7=100000)
    const first = payableAccrualForReceipt({
      poAmount: 100000,
      totalOrderedQty: 7,
      receivedBefore: 0,
      receivedAfter: 3,
    });
    const second = payableAccrualForReceipt({
      poAmount: 100000,
      totalOrderedQty: 7,
      receivedBefore: 3,
      receivedAfter: 7,
    });
    expect(first).toBe(42857);
    expect(second).toBe(57143);
    expect(first + second).toBe(100000);
  });

  it("受領が進んでいなければ0", () => {
    expect(
      payableAccrualForReceipt({
        poAmount: 100000,
        totalOrderedQty: 10,
        receivedBefore: 5,
        receivedAfter: 5,
      }),
    ).toBe(0);
  });

  it("逆行（after < before）でも負にならず0", () => {
    expect(
      payableAccrualForReceipt({
        poAmount: 100000,
        totalOrderedQty: 10,
        receivedBefore: 6,
        receivedAfter: 4,
      }),
    ).toBe(0);
  });
});

describe("summarizePayables", () => {
  const accruals: PayableAccrual[] = [
    { poId: "PO-1", supplier: "A社", amount: 40000, cumulativeReceived: 4, accruedAt: "2026/06/01" },
    { poId: "PO-1", supplier: "A社", amount: 60000, cumulativeReceived: 10, accruedAt: "2026/06/05" },
    { poId: "PO-2", supplier: "B社", amount: 30000, cumulativeReceived: 5, accruedAt: "2026/06/03" },
  ];

  it("PO 単位で計上額を合算する", () => {
    const summary = summarizePayables(accruals, []);
    const po1 = summary.find((s) => s.poId === "PO-1");
    expect(po1?.accrued).toBe(100000);
    expect(po1?.supplier).toBe("A社");
    expect(po1?.lastAccruedAt).toBe("2026/06/05");
  });

  it("支払なしは未払", () => {
    const summary = summarizePayables(accruals, []);
    expect(summary.find((s) => s.poId === "PO-1")?.status).toBe("未払");
    expect(summary.find((s) => s.poId === "PO-1")?.remaining).toBe(100000);
  });

  it("一部支払は残額と状態を反映", () => {
    const payments: PayablePayment[] = [{ poId: "PO-1", amount: 30000, paidAt: "2026/06/06" }];
    const summary = summarizePayables(accruals, payments);
    const po1 = summary.find((s) => s.poId === "PO-1");
    expect(po1?.paid).toBe(30000);
    expect(po1?.remaining).toBe(70000);
    expect(po1?.status).toBe("一部支払");
  });

  it("全額支払は支払済・残額0", () => {
    const payments: PayablePayment[] = [{ poId: "PO-2", amount: 30000, paidAt: "2026/06/06" }];
    const po2 = summarizePayables(accruals, payments).find((s) => s.poId === "PO-2");
    expect(po2?.remaining).toBe(0);
    expect(po2?.status).toBe("支払済");
  });

  it("過払いでも残額は0で頭打ち", () => {
    const payments: PayablePayment[] = [{ poId: "PO-2", amount: 50000, paidAt: "2026/06/06" }];
    const po2 = summarizePayables(accruals, payments).find((s) => s.poId === "PO-2");
    expect(po2?.remaining).toBe(0);
    expect(po2?.status).toBe("支払済");
  });

  it("計上順に関係なく最新計上日を採用する", () => {
    const shuffled: PayableAccrual[] = [accruals[1], accruals[0]];
    expect(summarizePayables(shuffled, []).find((s) => s.poId === "PO-1")?.lastAccruedAt).toBe(
      "2026/06/05",
    );
  });
});
