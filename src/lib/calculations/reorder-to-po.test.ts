import { describe, it, expect } from "vitest";
import {
  buildPurchaseOrdersFromReorder,
  type ReorderMasterMaps,
} from "./reorder-to-po";
import type { ReorderSuggestion } from "./reorder-calculation";

const maps: ReorderMasterMaps = {
  supplier: {
    "WEP-001-BK": "株式会社ABC電子",
    "MBT-004": "株式会社ABC電子",
    "UCB-002": "株式会社ケーブルワークス",
  },
  unitCost: {
    "WEP-001-BK": 1000,
    "MBT-004": 2000,
    "UCB-002": 300,
  },
};

const opts = { today: "2026-05-21", year: 2026, startSeq: 50 };

const suggestion = (
  sku: string,
  suggestedQty: number,
  warehouse = "東京本社倉庫",
  currentFree = 0,
): ReorderSuggestion => ({ sku, warehouse, currentFree, suggestedQty });

describe("buildPurchaseOrdersFromReorder", () => {
  it("仕入先ごとに1件の未発行POへ集約する", () => {
    const pos = buildPurchaseOrdersFromReorder(
      [suggestion("WEP-001-BK", 10), suggestion("MBT-004", 30), suggestion("UCB-002", 50, "大阪倉庫")],
      maps,
      opts,
    );

    expect(pos).toHaveLength(2);
    const abc = pos.find((p) => p.supplier === "株式会社ABC電子");
    expect(abc).toBeDefined();
    expect(abc!.status).toBe("未発行");
    expect(abc!.lines).toHaveLength(2);
    expect(abc!.lines.map((l) => l.sku).sort()).toEqual(["MBT-004", "WEP-001-BK"]);
  });

  it("明細の orderedQty は推奨数、receivedQty は 0 で起票する", () => {
    const [po] = buildPurchaseOrdersFromReorder([suggestion("UCB-002", 50, "大阪倉庫")], maps, opts);
    expect(po.lines[0]).toMatchObject({
      sku: "UCB-002",
      warehouse: "大阪倉庫",
      orderedQty: 50,
      receivedQty: 0,
    });
  });

  it("items は合計数量、amount は 数量×原価 の合計", () => {
    const [abc] = buildPurchaseOrdersFromReorder(
      [suggestion("WEP-001-BK", 10), suggestion("MBT-004", 30)],
      maps,
      opts,
    );
    expect(abc.items).toBe(40); // 10 + 30
    expect(abc.amount).toBe(10 * 1000 + 30 * 2000); // 70000
  });

  it("date は today、expected は未定、daysToArrive は 0", () => {
    const [po] = buildPurchaseOrdersFromReorder([suggestion("UCB-002", 50)], maps, opts);
    expect(po.date).toBe("2026-05-21");
    expect(po.expected).toBe("—");
    expect(po.daysToArrive).toBe(0);
  });

  it("PO id は PO-<year>-<連番ゼロ詰め4桁> を startSeq から採番する", () => {
    const pos = buildPurchaseOrdersFromReorder(
      [suggestion("WEP-001-BK", 10), suggestion("UCB-002", 50)],
      maps,
      opts,
    );
    const ids = pos.map((p) => p.id).sort();
    expect(ids).toEqual(["PO-2026-0050", "PO-2026-0051"]);
  });

  it("仕入先マスタ未登録の SKU は『仕入先未設定』にフォールバックする", () => {
    const [po] = buildPurchaseOrdersFromReorder([suggestion("UNKNOWN-999", 5)], maps, opts);
    expect(po.supplier).toBe("仕入先未設定");
  });

  it("原価マスタ未登録の SKU は amount を 0 加算（未設定扱い）にする", () => {
    const [po] = buildPurchaseOrdersFromReorder([suggestion("UNKNOWN-999", 5)], maps, opts);
    expect(po.amount).toBe(0);
    expect(po.items).toBe(5);
  });

  it("空入力では空配列を返す", () => {
    expect(buildPurchaseOrdersFromReorder([], maps, opts)).toEqual([]);
  });

  it("suggestedQty が 0 以下の提案は除外する", () => {
    const pos = buildPurchaseOrdersFromReorder(
      [suggestion("WEP-001-BK", 0), suggestion("MBT-004", -5)],
      maps,
      opts,
    );
    expect(pos).toEqual([]);
  });

  it("同一仕入先の出力は安定した仕入先順（投入順の初出順）になる", () => {
    const pos = buildPurchaseOrdersFromReorder(
      [suggestion("UCB-002", 50), suggestion("WEP-001-BK", 10)],
      maps,
      opts,
    );
    // UCB-002（ケーブルワークス）が先に登場 → seq 50、ABC電子 → seq 51
    expect(pos[0].supplier).toBe("株式会社ケーブルワークス");
    expect(pos[0].id).toBe("PO-2026-0050");
    expect(pos[1].supplier).toBe("株式会社ABC電子");
    expect(pos[1].id).toBe("PO-2026-0051");
  });
});
