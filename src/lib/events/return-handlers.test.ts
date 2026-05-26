import { describe, expect, it } from "vitest";
import { onReturnTransitioned } from "./return-handlers";
import type { ReturnState } from "../state-machines/return";

function ret(overrides: Partial<ReturnState> = {}): ReturnState {
  return {
    status: "検品中",
    orderId: "ORD-001",
    lines: [{ sku: "SKU-1", warehouse: "本社倉庫", qty: 2, restockQty: 2 }],
    refundAmount: 5000,
    ...overrides,
  };
}

describe("onReturnTransitioned — 返品完了到達の連鎖", () => {
  it("良品 line を在庫戻し（restockInventory）として emit する", () => {
    const effects = onReturnTransitioned(ret(), ret({ status: "返品完了" }));
    expect(effects.restockInventory).toEqual({
      lines: [{ sku: "SKU-1", warehouse: "本社倉庫", qty: 2 }],
    });
  });

  it("返金予定額があれば refundPayment を emit する", () => {
    const effects = onReturnTransitioned(ret(), ret({ status: "返品完了" }));
    expect(effects.refundPayment).toEqual({
      orderId: "ORD-001",
      amount: 5000,
      reason: "return-completed",
    });
  });

  it("restockQty=0 の line は在庫戻しに含めない（不良品は戻さない）", () => {
    const before = ret({ lines: [{ sku: "SKU-1", warehouse: "本社倉庫", qty: 2, restockQty: 0 }] });
    const after = { ...before, status: "返品完了" as const };
    expect(onReturnTransitioned(before, after).restockInventory).toBeUndefined();
  });

  it("良品ありの line だけを抽出する（混在ケース）", () => {
    const lines = [
      { sku: "SKU-1", warehouse: "本社倉庫", qty: 2, restockQty: 1 },
      { sku: "SKU-2", warehouse: "本社倉庫", qty: 1, restockQty: 0 },
    ];
    const after = ret({ status: "返品完了", lines });
    expect(onReturnTransitioned(ret({ lines }), after).restockInventory).toEqual({
      lines: [{ sku: "SKU-1", warehouse: "本社倉庫", qty: 1 }],
    });
  });

  it("refundAmount=0 のときは refundPayment を emit しない", () => {
    const before = ret({ refundAmount: 0 });
    const after = { ...before, status: "返品完了" as const };
    expect(onReturnTransitioned(before, after).refundPayment).toBeUndefined();
  });
});

describe("onReturnTransitioned — 冪等性・対象外遷移", () => {
  it("既に返品完了（変化なし）なら何も emit しない", () => {
    const same = ret({ status: "返品完了" });
    const effects = onReturnTransitioned(same, same);
    expect(effects.restockInventory).toBeUndefined();
    expect(effects.refundPayment).toBeUndefined();
  });

  it("却下到達では在庫戻し・返金ともに emit しない", () => {
    const effects = onReturnTransitioned(ret(), ret({ status: "却下" }));
    expect(effects).toEqual({});
  });

  it("検品中への遷移（returnItems）では何も emit しない", () => {
    const effects = onReturnTransitioned(ret({ status: "返品承認" }), ret({ status: "検品中" }));
    expect(effects).toEqual({});
  });
});
