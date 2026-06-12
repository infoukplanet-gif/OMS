import { describe, expect, it } from "vitest";
import {
  aggregateProductSales,
  type ProductMasterLookup,
  type SalesOrderSource,
} from "./aggregate-product-sales";
import type { SalesEntry } from "@/lib/stores/sales";

const LOOKUP: ProductMasterLookup = {
  names: {
    "WEP-001-BK": "ワイヤレスイヤホン Pro / ブラック",
    "WEP-001-WH": "ワイヤレスイヤホン Pro / ホワイト",
    "UCB-002": "USB-Cケーブル 2m",
  },
  unitCosts: {
    "WEP-001-BK": 4900,
    "WEP-001-WH": 4900,
    "UCB-002": 700,
  },
  categories: {
    "WEP-001": "家電",
    "UCB-002": "家電",
  },
};

function entry(overrides: Partial<SalesEntry>): SalesEntry {
  return {
    shipmentId: "SH-001",
    orderId: "OR-001",
    shop: "楽天市場",
    customer: "山田 太郎",
    amount: 10_000,
    recognizedAt: "2026/04/30",
    ...overrides,
  };
}

describe("aggregateProductSales", () => {
  it("受注金額を明細数量で按分し、SKU×店舗ごとに販売数・売上・原価・粗利を集計する", () => {
    const orders: SalesOrderSource[] = [
      {
        id: "OR-001",
        allocation: [
          { sku: "WEP-001-BK", warehouse: "東京本社倉庫", qty: 3 },
          { sku: "UCB-002", warehouse: "大阪倉庫", qty: 1 },
        ],
      },
    ];
    const { rows, skipped } = aggregateProductSales(
      [entry({ amount: 40_000 })],
      orders,
      LOOKUP,
    );

    expect(skipped).toBe(0);
    expect(rows).toHaveLength(2);

    const earphone = rows.find((r) => r.sku === "WEP-001-BK");
    expect(earphone).toMatchObject({
      name: "ワイヤレスイヤホン Pro / ブラック",
      category: "家電",
      shop: "楽天市場",
      qty: 3,
      amount: 30_000, // 40,000 × 3/4
      cost: 14_700, // 4,900 × 3
      gross: 15_300,
      grossRate: 51,
    });

    const cable = rows.find((r) => r.sku === "UCB-002");
    expect(cable).toMatchObject({ qty: 1, amount: 10_000, cost: 700, gross: 9_300, grossRate: 93 });
  });

  it("同一SKU×店舗の複数計上は1行に合算される", () => {
    const orders: SalesOrderSource[] = [
      { id: "OR-001", allocation: [{ sku: "UCB-002", warehouse: "大阪倉庫", qty: 2 }] },
      { id: "OR-002", allocation: [{ sku: "UCB-002", warehouse: "大阪倉庫", qty: 3 }] },
    ];
    const { rows } = aggregateProductSales(
      [
        entry({ shipmentId: "SH-001", orderId: "OR-001", amount: 2_560 }),
        entry({ shipmentId: "SH-002", orderId: "OR-002", amount: 3_840 }),
      ],
      orders,
      LOOKUP,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sku: "UCB-002", qty: 5, amount: 6_400, cost: 3_500 });
  });

  it("店舗が異なれば同一SKUでも別行になる", () => {
    const orders: SalesOrderSource[] = [
      { id: "OR-001", allocation: [{ sku: "UCB-002", warehouse: "大阪倉庫", qty: 1 }] },
      { id: "OR-002", allocation: [{ sku: "UCB-002", warehouse: "大阪倉庫", qty: 1 }] },
    ];
    const { rows } = aggregateProductSales(
      [
        entry({ shipmentId: "SH-001", orderId: "OR-001", shop: "楽天市場" }),
        entry({ shipmentId: "SH-002", orderId: "OR-002", shop: "Amazon" }),
      ],
      orders,
      LOOKUP,
    );
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((r) => r.shop))).toEqual(new Set(["楽天市場", "Amazon"]));
  });

  it("対応する受注や明細が見つからない計上は skipped に数える", () => {
    const orders: SalesOrderSource[] = [
      { id: "OR-002", allocation: [] }, // 明細なし
    ];
    const { rows, skipped } = aggregateProductSales(
      [
        entry({ shipmentId: "SH-001", orderId: "OR-999" }), // 受注なし
        entry({ shipmentId: "SH-002", orderId: "OR-002" }), // 明細なし
      ],
      orders,
      LOOKUP,
    );
    expect(rows).toHaveLength(0);
    expect(skipped).toBe(2);
  });

  it("ABCランクは売上構成比の累積で A(～80%) / B(～95%) / C(残り) を付与する", () => {
    const orders: SalesOrderSource[] = [
      { id: "OR-A", allocation: [{ sku: "WEP-001-BK", warehouse: "東京本社倉庫", qty: 1 }] },
      { id: "OR-B", allocation: [{ sku: "WEP-001-WH", warehouse: "東京本社倉庫", qty: 1 }] },
      { id: "OR-C", allocation: [{ sku: "UCB-002", warehouse: "大阪倉庫", qty: 1 }] },
    ];
    const { rows } = aggregateProductSales(
      [
        entry({ shipmentId: "SH-A", orderId: "OR-A", amount: 70_000 }),
        entry({ shipmentId: "SH-B", orderId: "OR-B", amount: 20_000 }),
        entry({ shipmentId: "SH-C", orderId: "OR-C", amount: 10_000 }),
      ],
      orders,
      LOOKUP,
    );

    const rankBySku = Object.fromEntries(rows.map((r) => [r.sku, r.rank]));
    expect(rankBySku["WEP-001-BK"]).toBe("A"); // 累積70%
    expect(rankBySku["WEP-001-WH"]).toBe("B"); // 累積90%
    expect(rankBySku["UCB-002"]).toBe("C"); // 累積100%
  });

  it("マスタ未登録SKUは名称=SKU・カテゴリ=その他・原価0でフォールバックする", () => {
    const orders: SalesOrderSource[] = [
      { id: "OR-001", allocation: [{ sku: "NEW-999-XL", warehouse: "東京本社倉庫", qty: 2 }] },
    ];
    const { rows } = aggregateProductSales([entry({ amount: 5_000 })], orders, LOOKUP);
    expect(rows[0]).toMatchObject({
      sku: "NEW-999-XL",
      name: "NEW-999-XL",
      category: "その他",
      cost: 0,
      gross: 5_000,
      grossRate: 100,
    });
  });

  it("バリエーションSKUは末尾セグメントを外しながら基底コードのカテゴリへ解決する", () => {
    const orders: SalesOrderSource[] = [
      { id: "OR-001", allocation: [{ sku: "WEP-001-BK", warehouse: "東京本社倉庫", qty: 1 }] },
    ];
    const { rows } = aggregateProductSales([entry({})], orders, LOOKUP);
    expect(rows[0].category).toBe("家電"); // WEP-001-BK → WEP-001
  });

  it("計上ゼロなら空集計を返す", () => {
    const { rows, skipped } = aggregateProductSales([], [], LOOKUP);
    expect(rows).toEqual([]);
    expect(skipped).toBe(0);
  });
});
