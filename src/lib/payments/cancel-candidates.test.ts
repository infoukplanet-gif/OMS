import { describe, expect, it } from "vitest";
import { extractCancelCandidates, type OverdueAccount } from "./cancel-candidates";

const TODAY = new Date("2026-05-01T00:00:00Z");

function account(overrides: Partial<OverdueAccount> = {}): OverdueAccount {
  return {
    paymentId: "P-1",
    orderId: "ORD-1",
    customer: "山田 太郎",
    due: "2026-04-20", // 11日超過
    paidAmount: 0,
    orderTotal: 32_400,
    ...overrides,
  };
}

describe("extractCancelCandidates — 入金期日超過のキャンセル候補抽出", () => {
  it("期日7日超過かつ未完済をキャンセル候補に挙げる", () => {
    const result = extractCancelCandidates([account()], TODAY);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      paymentId: "P-1",
      orderId: "ORD-1",
      customer: "山田 太郎",
      daysOverdue: 11,
      outstanding: 32_400,
    });
  });

  it("一部入金は残額を outstanding に出す", () => {
    const result = extractCancelCandidates([account({ paidAmount: 30_000, orderTotal: 56_800 })], TODAY);
    expect(result[0].outstanding).toBe(26_800);
  });

  it("完済（paidAmount >= orderTotal）は候補から除外", () => {
    const result = extractCancelCandidates([account({ paidAmount: 32_400, orderTotal: 32_400 })], TODAY);
    expect(result).toHaveLength(0);
  });

  it("期日7日未満は候補に挙げない（6日超過は除外）", () => {
    const result = extractCancelCandidates([account({ due: "2026-04-25" })], TODAY); // 6日超過
    expect(result).toHaveLength(0);
  });

  it("期日ちょうど7日超過は候補に含める（境界）", () => {
    const result = extractCancelCandidates([account({ due: "2026-04-24" })], TODAY); // 7日超過
    expect(result).toHaveLength(1);
  });

  it("超過日数の降順でソートする", () => {
    const result = extractCancelCandidates(
      [
        account({ paymentId: "P-A", due: "2026-04-22" }), // 9日
        account({ paymentId: "P-B", due: "2026-04-10" }), // 21日
        account({ paymentId: "P-C", due: "2026-04-23" }), // 8日
      ],
      TODAY,
    );
    expect(result.map((c) => c.paymentId)).toEqual(["P-B", "P-A", "P-C"]);
  });

  it("閾値はオプションで変えられる（14日に厳格化）", () => {
    const result = extractCancelCandidates([account({ due: "2026-04-20" })], TODAY, 14); // 11日超過
    expect(result).toHaveLength(0);
  });
});
