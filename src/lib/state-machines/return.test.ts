import { describe, expect, it } from "vitest";
import {
  isReturnRejectable,
  transitionReturn,
  type ReturnState,
} from "./return";

const baseLine = () => ({ sku: "SKU-1", warehouse: "本社倉庫", qty: 2, restockQty: 0 });

function ret(overrides: Partial<ReturnState> = {}): ReturnState {
  return {
    status: "返品依頼",
    orderId: "ORD-001",
    lines: [baseLine()],
    refundAmount: 5000,
    ...overrides,
  };
}

describe("transitionReturn — 正常系の遷移", () => {
  it("approve: 返品依頼 → 返品承認", () => {
    const next = transitionReturn(ret(), "approve");
    expect(next.status).toBe("返品承認");
  });

  it("receiveItems: 返品承認 → 検品中", () => {
    const next = transitionReturn(ret({ status: "返品承認" }), "receiveItems");
    expect(next.status).toBe("検品中");
  });

  it("completeInspection: 検品中 → 返品完了", () => {
    const next = transitionReturn(ret({ status: "検品中" }), "completeInspection");
    expect(next.status).toBe("返品完了");
  });

  it("reject: 返品依頼 → 却下", () => {
    expect(transitionReturn(ret(), "reject").status).toBe("却下");
  });

  it("reject: 検品中 → 却下（検品で返品不可と判明）", () => {
    expect(transitionReturn(ret({ status: "検品中" }), "reject").status).toBe("却下");
  });
});

describe("transitionReturn — guard 違反は no-op（参照同一・冪等）", () => {
  it("返品依頼から receiveItems はできない", () => {
    const r = ret();
    expect(transitionReturn(r, "receiveItems")).toBe(r);
  });

  it("返品完了から completeInspection は no-op（二重確定防止）", () => {
    const r = ret({ status: "返品完了" });
    expect(transitionReturn(r, "completeInspection")).toBe(r);
  });

  it("却下からは何も遷移しない", () => {
    const r = ret({ status: "却下" });
    expect(transitionReturn(r, "approve")).toBe(r);
    expect(transitionReturn(r, "completeInspection")).toBe(r);
  });

  it("返品承認からは approve できない（前進のみ）", () => {
    const r = ret({ status: "返品承認" });
    expect(transitionReturn(r, "approve")).toBe(r);
  });
});

describe("transitionReturn — completeInspection の良品判定（restockQty 反映）", () => {
  it("良品数量を line.restockQty に反映する（qty で上限クランプ）", () => {
    const next = transitionReturn(ret({ status: "検品中" }), "completeInspection", {
      inspectedGoodQty: [{ sku: "SKU-1", warehouse: "本社倉庫", goodQty: 5 }],
    });
    expect(next.lines[0].restockQty).toBe(2); // qty=2 を超えない
  });

  it("一部良品: goodQty=1 なら restockQty=1", () => {
    const next = transitionReturn(
      ret({ status: "検品中", lines: [{ sku: "SKU-1", warehouse: "本社倉庫", qty: 3, restockQty: 0 }] }),
      "completeInspection",
      { inspectedGoodQty: [{ sku: "SKU-1", warehouse: "本社倉庫", goodQty: 1 }] },
    );
    expect(next.lines[0].restockQty).toBe(1);
  });

  it("inspectedGoodQty 未指定の line は restockQty=0（全数不良扱い＝在庫戻しなし）", () => {
    const next = transitionReturn(ret({ status: "検品中" }), "completeInspection");
    expect(next.lines[0].restockQty).toBe(0);
  });

  it("負の goodQty は 0 にクランプ", () => {
    const next = transitionReturn(ret({ status: "検品中" }), "completeInspection", {
      inspectedGoodQty: [{ sku: "SKU-1", warehouse: "本社倉庫", goodQty: -3 }],
    });
    expect(next.lines[0].restockQty).toBe(0);
  });

  it("元オブジェクトを破壊しない（イミュータブル）", () => {
    const r = ret({ status: "検品中" });
    transitionReturn(r, "completeInspection", {
      inspectedGoodQty: [{ sku: "SKU-1", warehouse: "本社倉庫", goodQty: 2 }],
    });
    expect(r.lines[0].restockQty).toBe(0);
  });
});

describe("isReturnRejectable", () => {
  it("返品依頼・検品中は却下可能", () => {
    expect(isReturnRejectable("返品依頼")).toBe(true);
    expect(isReturnRejectable("検品中")).toBe(true);
  });

  it("返品完了・却下は却下不可", () => {
    expect(isReturnRejectable("返品完了")).toBe(false);
    expect(isReturnRejectable("却下")).toBe(false);
  });
});
