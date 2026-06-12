import type { SalesEntry } from "@/lib/stores/sales";
import type { AllocationLine } from "@/lib/state-machines/inventory";

/** 確定売上の按分集計に必要な受注情報（共有 orderStore のサブセット） */
export interface SalesOrderSource {
  id: string;
  allocation?: AllocationLine[];
}

/** 商品マスタ由来のルックアップ（名称・原価・カテゴリ） */
export interface ProductMasterLookup {
  names: Record<string, string>;
  unitCosts: Record<string, number>;
  /** 基底商品コード（例: WEP-001）→ カテゴリ */
  categories: Record<string, string>;
}

export interface ProductSalesRow {
  sku: string;
  name: string;
  category: string;
  shop: string;
  qty: number;
  amount: number;
  cost: number;
  gross: number;
  /** 粗利率（%、整数四捨五入） */
  grossRate: number;
  rank: "A" | "B" | "C";
}

export interface ProductSalesResult {
  rows: ProductSalesRow[];
  /** 受注・明細が見つからず集計できなかった売上計上の件数 */
  skipped: number;
}

const FALLBACK_CATEGORY = "その他";

/**
 * バリエーションSKU（WEP-001-BK 等）を末尾セグメントを外しながら
 * 基底商品コードのカテゴリへ解決する。どこにも該当しなければ「その他」。
 */
function resolveCategory(sku: string, categories: Record<string, string>): string {
  let code = sku;
  for (;;) {
    const hit = categories[code];
    if (hit) return hit;
    const idx = code.lastIndexOf("-");
    if (idx <= 0) return FALLBACK_CATEGORY;
    code = code.slice(0, idx);
  }
}

/**
 * 確定売上台帳（受注単位）を受注明細へ展開し、SKU×店舗単位の販売実績に集計する。
 * - 売上金額は受注金額を明細数量で按分（v1 は明細単価を保持していないため）
 * - 原価は SKU 単位原価 × 数量（未登録 SKU は原価0でフォールバック）
 * - ABC ランクは売上構成比の累積で A(～80%) / B(～95%) / C(残り)
 */
export function aggregateProductSales(
  entries: ReadonlyArray<SalesEntry>,
  orders: ReadonlyArray<SalesOrderSource>,
  lookup: ProductMasterLookup,
): ProductSalesResult {
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const groups = new Map<string, { sku: string; shop: string; qty: number; amount: number }>();
  let skipped = 0;

  for (const entry of entries) {
    const order = orderById.get(entry.orderId);
    const lines = order?.allocation ?? [];
    const totalQty = lines.reduce((s, l) => s + l.qty, 0);
    if (lines.length === 0 || totalQty === 0) {
      skipped += 1;
      continue;
    }
    for (const line of lines) {
      const key = `${line.sku}|${entry.shop}`;
      const group = groups.get(key) ?? { sku: line.sku, shop: entry.shop, qty: 0, amount: 0 };
      groups.set(key, {
        ...group,
        qty: group.qty + line.qty,
        amount: group.amount + (entry.amount * line.qty) / totalQty,
      });
    }
  }

  const totals = [...groups.values()].map((g) => {
    const amount = Math.round(g.amount);
    const cost = (lookup.unitCosts[g.sku] ?? 0) * g.qty;
    const gross = amount - cost;
    return {
      sku: g.sku,
      name: lookup.names[g.sku] ?? g.sku,
      category: resolveCategory(g.sku, lookup.categories),
      shop: g.shop,
      qty: g.qty,
      amount,
      cost,
      gross,
      grossRate: amount > 0 ? Math.round((gross / amount) * 100) : 0,
    };
  });

  // ABCランク: 売上降順に並べ、累積構成比 ～80% → A / ～95% → B / 残り → C
  const sorted = [...totals].sort((a, b) => b.amount - a.amount);
  const grandTotal = sorted.reduce((s, r) => s + r.amount, 0);
  let cumulative = 0;
  const rows: ProductSalesRow[] = sorted.map((r) => {
    cumulative += r.amount;
    const share = grandTotal > 0 ? cumulative / grandTotal : 1;
    const rank: ProductSalesRow["rank"] = share <= 0.8 ? "A" : share <= 0.95 ? "B" : "C";
    return { ...r, rank };
  });

  return { rows, skipped };
}
