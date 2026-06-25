import { describe, it, expect } from "vitest";
import {
  transitionLotDefect,
  canTransitionLot,
  nextLotStatus,
  type LotDefectRecord,
} from "./defective-lot";

const base: LotDefectRecord = {
  id: "DS-001",
  lot: "LOT-2026-04-12-A",
  sku: "WEP-001-BK",
  product: "ワイヤレスイヤホン Pro ブラック",
  warehouse: "東京本社倉庫",
  detected: 8,
  affected: 12,
  rootCause: "メーカー由来",
  reportedAt: "2026-04-25 09:00",
  status: "未対応",
  responsibility: "メーカー",
};

describe("transitionLotDefect - 対応フロー", () => {
  it("contactMaker: 未対応 → メーカー連絡済", () => {
    expect(transitionLotDefect(base, "contactMaker").status).toBe("メーカー連絡済");
  });

  it("arrangeAlt: 未対応 → 代替手配中", () => {
    expect(transitionLotDefect(base, "arrangeAlt").status).toBe("代替手配中");
  });

  it("complete: メーカー連絡済 → 全件対応完了", () => {
    const contacted: LotDefectRecord = { ...base, status: "メーカー連絡済" };
    expect(transitionLotDefect(contacted, "complete").status).toBe("全件対応完了");
  });

  it("complete: 代替手配中 → 全件対応完了", () => {
    const arranging: LotDefectRecord = { ...base, status: "代替手配中" };
    expect(transitionLotDefect(arranging, "complete").status).toBe("全件対応完了");
  });

  it("close: 全件対応完了 → 終結", () => {
    const completed: LotDefectRecord = { ...base, status: "全件対応完了" };
    expect(transitionLotDefect(completed, "close").status).toBe("終結");
  });
});

describe("transitionLotDefect - ガード（不正遷移は no-op で同一参照を返す）", () => {
  it("未対応に complete / close は不可（同一参照）", () => {
    expect(transitionLotDefect(base, "complete")).toBe(base);
    expect(transitionLotDefect(base, "close")).toBe(base);
  });

  it("メーカー連絡済に contactMaker / arrangeAlt / close は不可（同一参照）", () => {
    const contacted: LotDefectRecord = { ...base, status: "メーカー連絡済" };
    expect(transitionLotDefect(contacted, "contactMaker")).toBe(contacted);
    expect(transitionLotDefect(contacted, "arrangeAlt")).toBe(contacted);
    expect(transitionLotDefect(contacted, "close")).toBe(contacted);
  });

  it("全件対応完了から complete は不可（同一参照）", () => {
    const completed: LotDefectRecord = { ...base, status: "全件対応完了" };
    expect(transitionLotDefect(completed, "complete")).toBe(completed);
    expect(transitionLotDefect(completed, "contactMaker")).toBe(completed);
  });

  it("終結から先には進めない（同一参照）", () => {
    const closed: LotDefectRecord = { ...base, status: "終結" };
    expect(transitionLotDefect(closed, "complete")).toBe(closed);
    expect(transitionLotDefect(closed, "close")).toBe(closed);
    expect(transitionLotDefect(closed, "contactMaker")).toBe(closed);
  });
});

describe("transitionLotDefect - 不変性", () => {
  it("元レコードを破壊しない", () => {
    const next = transitionLotDefect(base, "contactMaker");
    expect(base.status).toBe("未対応");
    expect(next).not.toBe(base);
  });

  it("ledgerId など他項目は維持する", () => {
    const linked: LotDefectRecord = { ...base, ledgerId: "DF-004" };
    const next = transitionLotDefect(linked, "contactMaker");
    expect(next.ledgerId).toBe("DF-004");
  });
});

describe("canTransitionLot / nextLotStatus", () => {
  it("canTransitionLot は遷移可否を返す", () => {
    expect(canTransitionLot("未対応", "contactMaker")).toBe(true);
    expect(canTransitionLot("未対応", "complete")).toBe(false);
    expect(canTransitionLot("代替手配中", "complete")).toBe(true);
    expect(canTransitionLot("終結", "close")).toBe(false);
  });

  it("nextLotStatus は遷移先 or null を返す", () => {
    expect(nextLotStatus("未対応", "arrangeAlt")).toBe("代替手配中");
    expect(nextLotStatus("未対応", "close")).toBeNull();
    expect(nextLotStatus("全件対応完了", "close")).toBe("終結");
  });
});
