import { describe, expect, it } from "vitest";
import {
  extractMismatches,
  rebillJobFor,
  type MismatchPaymentInput,
} from "./extract-mismatches";

/** テスト用の入金レコードを最小指定で生成する。 */
function payment(overrides: Partial<MismatchPaymentInput>): MismatchPaymentInput {
  return {
    paymentId: "P001",
    orderId: "ORD-2026-00001",
    customer: "テスト顧客",
    orderTotal: 10000,
    paidAmount: 0,
    daysOverdue: 0,
    ...overrides,
  };
}

describe("extractMismatches", () => {
  it("過剰入金（paidAmount > orderTotal）を「過剰」行として抽出する", () => {
    const rows = extractMismatches([
      payment({ paymentId: "P006", orderTotal: 12400, paidAmount: 12800 }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("過剰");
    expect(rows[0].diff).toBe(400);
    expect(rows[0].reason).toBe("過剰入金（差額返金対象）");
  });

  it("一部入金（0 < paid < total）は期日内でも「不足」行として抽出する", () => {
    const rows = extractMismatches([
      payment({ orderTotal: 56800, paidAmount: 30000, daysOverdue: 0 }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("不足");
    expect(rows[0].diff).toBe(-26800);
    expect(rows[0].reason).toBe("一部入金（残額未回収）");
  });

  it("未入金かつ期日超過は「不足」行として抽出する（理由は期日超過）", () => {
    const rows = extractMismatches([
      payment({ orderTotal: 154000, paidAmount: 0, daysOverdue: 3 }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("不足");
    expect(rows[0].diff).toBe(-154000);
    expect(rows[0].reason).toBe("期日超過・未入金");
    expect(rows[0].daysOpen).toBe(3);
  });

  it("未入金でも期日内なら通常フローとして除外する", () => {
    const rows = extractMismatches([
      payment({ orderTotal: 32400, paidAmount: 0, daysOverdue: 0 }),
    ]);

    expect(rows).toHaveLength(0);
  });

  it("ぴったり完済は除外する", () => {
    const rows = extractMismatches([
      payment({ orderTotal: 18600, paidAmount: 18600 }),
    ]);

    expect(rows).toHaveLength(0);
  });

  it("orderTotal が 0 以下の不正レコードは除外する", () => {
    const rows = extractMismatches([
      payment({ orderTotal: 0, paidAmount: 500 }),
      payment({ paymentId: "P002", orderTotal: -100, paidAmount: 0, daysOverdue: 10 }),
    ]);

    expect(rows).toHaveLength(0);
  });

  it("表示用フィールド（orderAmt / paidAmt / daysOpen / 顧客）を持ち回る", () => {
    const rows = extractMismatches([
      payment({
        paymentId: "P003",
        orderId: "ORD-2026-08841",
        customer: "吉田 あゆみ",
        orderTotal: 56800,
        paidAmount: 30000,
        daysOverdue: 8,
      }),
    ]);

    expect(rows[0]).toMatchObject({
      paymentId: "P003",
      orderId: "ORD-2026-08841",
      customer: "吉田 あゆみ",
      orderAmt: 56800,
      paidAmt: 30000,
      daysOpen: 8,
    });
  });

  it("daysOverdue が負（期日前）の場合 daysOpen は 0 に丸める", () => {
    const rows = extractMismatches([
      payment({ orderTotal: 10000, paidAmount: 4000, daysOverdue: -5 }),
    ]);

    expect(rows[0].daysOpen).toBe(0);
  });

  it("複数レコードの混在: 不整合のみが入力順で返る", () => {
    const rows = extractMismatches([
      payment({ paymentId: "A", orderTotal: 100, paidAmount: 100 }), // 完済 → 除外
      payment({ paymentId: "B", orderTotal: 100, paidAmount: 120 }), // 過剰
      payment({ paymentId: "C", orderTotal: 100, paidAmount: 0, daysOverdue: 0 }), // 期日内未入金 → 除外
      payment({ paymentId: "D", orderTotal: 100, paidAmount: 40 }), // 一部入金
    ]);

    expect(rows.map((r) => r.paymentId)).toEqual(["B", "D"]);
  });

  it("空配列は空配列を返す", () => {
    expect(extractMismatches([])).toEqual([]);
  });
});

describe("rebillJobFor", () => {
  it("rebill-mismatch トリガーの MailJob を dedupeKey 付きで生成する", () => {
    const job = rebillJobFor("ORD-2026-08841");

    expect(job).toEqual({
      orderId: "ORD-2026-08841",
      triggerType: "rebill-mismatch",
      dedupeKey: "ORD-2026-08841:rebill-mismatch",
    });
  });
});
