import { describe, expect, it } from "vitest";
import { computeOrderCreditOutstanding, type CreditOrder, type CreditPayment } from "./credit-usage";

const order = (overrides: Partial<CreditOrder> = {}): CreditOrder => ({
  id: "ORD-1",
  customerCode: "WS-001",
  amount: 100_000,
  status: "印刷待ち",
  ...overrides,
});

const payment = (orderId: string, paid: number, total = 100_000): CreditPayment => ({
  orderId,
  orderTotal: total,
  paidAmount: paid,
});

describe("computeOrderCreditOutstanding — 卸先の与信使用額（受注由来）", () => {
  it("該当卸先の未入金額（orderTotal - paidAmount）の合計を返す", () => {
    const result = computeOrderCreditOutstanding(
      "WS-001",
      [order({ id: "A", amount: 100_000 }), order({ id: "B", amount: 50_000 })],
      [payment("A", 30_000, 100_000), payment("B", 0, 50_000)],
    );
    expect(result).toBe(120_000); // 70_000 + 50_000
  });

  it("対応 payment が無い受注は orderTotal が丸ごと未回収", () => {
    const result = computeOrderCreditOutstanding(
      "WS-001",
      [order({ id: "A", amount: 80_000 })],
      [],
    );
    expect(result).toBe(80_000);
  });

  it("別の卸先の受注は集計しない", () => {
    const result = computeOrderCreditOutstanding(
      "WS-001",
      [order({ id: "A", amount: 100_000 }), order({ id: "B", customerCode: "WS-002", amount: 50_000 })],
      [],
    );
    expect(result).toBe(100_000);
  });

  it("customerCode 未設定（B2C 個人受注）は集計しない", () => {
    const result = computeOrderCreditOutstanding(
      "WS-001",
      [order({ id: "A", customerCode: undefined, amount: 100_000 })],
      [],
    );
    expect(result).toBe(0);
  });

  it("キャンセル済みは集計しない", () => {
    const result = computeOrderCreditOutstanding(
      "WS-001",
      [order({ id: "A", status: "キャンセル", amount: 100_000 })],
      [],
    );
    expect(result).toBe(0);
  });

  it("完済（paidAmount >= orderTotal）は集計しない", () => {
    const result = computeOrderCreditOutstanding(
      "WS-001",
      [order({ id: "A", amount: 100_000 })],
      [payment("A", 100_000, 100_000)],
    );
    expect(result).toBe(0);
  });

  it("過剰入金は未回収扱いにしない（負値を返さない）", () => {
    const result = computeOrderCreditOutstanding(
      "WS-001",
      [order({ id: "A", amount: 100_000 })],
      [payment("A", 120_000, 100_000)],
    );
    expect(result).toBe(0);
  });
});
