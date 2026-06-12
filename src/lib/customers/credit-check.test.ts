import { describe, it, expect } from "vitest";
import { checkCredit } from "./credit-check";

describe("checkCredit", () => {
  it("取引停止の卸先は金額に関わらず block", () => {
    const r = checkCredit({
      creditLimit: 1_000_000,
      customerStatus: "停止",
      currentOutstanding: 0,
      newOrderAmount: 1,
    });
    expect(r.status).toBe("block");
    expect(r.reason).toContain("停止");
  });

  it("停止 かつ 限度内でも block（block 優先）", () => {
    const r = checkCredit({
      creditLimit: 5_000_000,
      customerStatus: "停止",
      currentOutstanding: 100_000,
      newOrderAmount: 50_000,
    });
    expect(r.status).toBe("block");
  });

  it("与信限度 0 は block", () => {
    const r = checkCredit({
      creditLimit: 0,
      customerStatus: "通常",
      currentOutstanding: 0,
      newOrderAmount: 10_000,
    });
    expect(r.status).toBe("block");
    expect(r.reason).toContain("与信限度");
  });

  it("与信限度が負でも block", () => {
    const r = checkCredit({
      creditLimit: -1,
      customerStatus: "通常",
      currentOutstanding: 0,
      newOrderAmount: 10_000,
    });
    expect(r.status).toBe("block");
  });

  it("限度内（projected < limit）は ok", () => {
    const r = checkCredit({
      creditLimit: 1_000_000,
      customerStatus: "通常",
      currentOutstanding: 300_000,
      newOrderAmount: 200_000,
    });
    expect(r.status).toBe("ok");
    expect(r.projectedUsage).toBe(500_000);
    expect(r.available).toBe(700_000);
    expect(r.overBy).toBe(0);
  });

  it("境界: projected === limit はちょうど ok（超過は厳密 >）", () => {
    const r = checkCredit({
      creditLimit: 1_000_000,
      customerStatus: "通常",
      currentOutstanding: 600_000,
      newOrderAmount: 400_000,
    });
    expect(r.status).toBe("ok");
    expect(r.projectedUsage).toBe(1_000_000);
    expect(r.overBy).toBe(0);
  });

  it("限度超過（projected > limit）は warn、overBy 正しい", () => {
    const r = checkCredit({
      creditLimit: 1_000_000,
      customerStatus: "通常",
      currentOutstanding: 900_000,
      newOrderAmount: 250_000,
    });
    expect(r.status).toBe("warn");
    expect(r.projectedUsage).toBe(1_150_000);
    expect(r.overBy).toBe(150_000);
    expect(r.reason).toContain("超過");
  });

  it("既に超過している卸先に追加受注すると warn", () => {
    const r = checkCredit({
      creditLimit: 400_000,
      customerStatus: "通常",
      currentOutstanding: 412_000,
      newOrderAmount: 1_000,
    });
    expect(r.status).toBe("warn");
    expect(r.overBy).toBe(13_000);
  });

  it("available は負にならない（既に超過時は 0 にクランプ）", () => {
    const r = checkCredit({
      creditLimit: 400_000,
      customerStatus: "通常",
      currentOutstanding: 412_000,
      newOrderAmount: 0,
    });
    expect(r.available).toBe(0);
  });

  it("overBy は負にならない（限度内では 0）", () => {
    const r = checkCredit({
      creditLimit: 1_000_000,
      customerStatus: "通常",
      currentOutstanding: 100_000,
      newOrderAmount: 100_000,
    });
    expect(r.overBy).toBe(0);
  });
});
