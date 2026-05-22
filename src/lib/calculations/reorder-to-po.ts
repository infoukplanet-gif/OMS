/**
 * 発注計算結果（ReorderSuggestion[]）→ 発注書（PO）起票データへの集約
 *
 * 仕様: docs/prd/purchase-state-machine.md §1（未発行PO起票）
 *
 * reorderSuggestions() が返す推奨発注一覧を、仕入先ごとに 1 件の「未発行」発注書へ
 * まとめる pure function。発注計算ページが purchaseStore に起票する際の変換層。
 *
 * - 仕入先は SKU マスタ（supplier map）から引く。未登録は「仕入先未設定」へフォールバック。
 * - 金額は 数量 × 原価（unitCost map）。原価未登録は 0 加算。
 * - 連番は startSeq から採番し、仕入先の初出順（投入順）で安定させる。
 */

import type { ReorderSuggestion } from "./reorder-calculation";

/** SKU → 仕入先 / 原価 のマスタ参照。発注計算ページから seed マップを渡す。 */
export interface ReorderMasterMaps {
  supplier: Record<string, string>;
  unitCost: Record<string, number>;
}

/** 採番・日付の決定論的入力。テスト容易性のため呼び出し元から渡す。 */
export interface BuildPurchaseOrdersOptions {
  /** 起票日（YYYY-MM-DD）。 */
  today: string;
  /** PO id の年部分。 */
  year: number;
  /** 連番の開始値。 */
  startSeq: number;
}

/** 起票する発注書 1 件分の明細。purchase 状態機械の PurchaseOrderLine と同形。 */
export interface NewPurchaseOrderLine {
  sku: string;
  warehouse: string;
  orderedQty: number;
  receivedQty: number;
}

/** purchaseStore に流し込む未発行 PO レコード。purchasing/page の PurchaseOrder と同じ形。 */
export interface NewPurchaseOrderInput {
  id: string;
  supplier: string;
  status: "未発行";
  lines: NewPurchaseOrderLine[];
  /** 合計数量。 */
  items: number;
  /** 合計金額（数量 × 原価）。 */
  amount: number;
  date: string;
  expected: string;
  daysToArrive: number;
}

const UNASSIGNED_SUPPLIER = "仕入先未設定";

function padSeq(seq: number): string {
  return String(seq).padStart(4, "0");
}

/**
 * 推奨発注一覧を仕入先ごとの未発行 PO へ集約する。
 * suggestedQty <= 0 の提案は除外する。
 */
export function buildPurchaseOrdersFromReorder(
  suggestions: ReadonlyArray<ReorderSuggestion>,
  maps: ReorderMasterMaps,
  opts: BuildPurchaseOrdersOptions,
): NewPurchaseOrderInput[] {
  // 仕入先ごとにグループ化しつつ、初出順を保持する。
  const order: string[] = [];
  const groups = new Map<string, NewPurchaseOrderLine[]>();

  for (const s of suggestions) {
    if (s.suggestedQty <= 0) continue;
    const supplier = maps.supplier[s.sku] ?? UNASSIGNED_SUPPLIER;
    if (!groups.has(supplier)) {
      groups.set(supplier, []);
      order.push(supplier);
    }
    groups.get(supplier)!.push({
      sku: s.sku,
      warehouse: s.warehouse,
      orderedQty: s.suggestedQty,
      receivedQty: 0,
    });
  }

  return order.map((supplier, i) => {
    const lines = groups.get(supplier)!;
    const items = lines.reduce((sum, l) => sum + l.orderedQty, 0);
    const amount = lines.reduce(
      (sum, l) => sum + l.orderedQty * (maps.unitCost[l.sku] ?? 0),
      0,
    );
    return {
      id: `PO-${opts.year}-${padSeq(opts.startSeq + i)}`,
      supplier,
      status: "未発行",
      lines,
      items,
      amount,
      date: opts.today,
      expected: "—",
      daysToArrive: 0,
    };
  });
}
