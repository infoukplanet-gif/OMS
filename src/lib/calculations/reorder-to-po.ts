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

import type { PurchaseOrderLine, PurchaseOrderStatus } from "../state-machines/purchase";
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
  /** purchaseStore レコード（[extra]: unknown）と構造整合させ、マージ層へそのまま渡せるようにする。 */
  [extra: string]: unknown;
}

const UNASSIGNED_SUPPLIER = "仕入先未設定";

function padSeq(seq: number): string {
  return String(seq).padStart(4, "0");
}

/**
 * 既存の発注書 id（PO-YYYY-NNNN）の連番から次の採番値（最大連番 + 1）を求める。
 * 規定形式にマッチしない id は無視する。空配列なら 1。
 */
export function nextPoSeq(ids: ReadonlyArray<string>): number {
  let max = 0;
  for (const id of ids) {
    const m = /^PO-\d{4}-(\d+)$/.exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
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

/**
 * purchaseStore が保持する発注書のうち、マージ対象として読み書きするフィールドを表す構造型。
 * 表示用の付帯フィールド（date / expected / daysToArrive 等）は index signature で温存する。
 */
export interface MergeablePurchaseOrder {
  id: string;
  supplier: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  /** 合計数量（マージ後は lines から再計算）。 */
  items: number;
  /** 合計金額（マージ後は 数量 × 原価 で再計算）。 */
  amount: number;
  [extra: string]: unknown;
}

export interface MergeReorderResult {
  /** マージ後の発注書全件（新規は先頭、既存は元の並びで温存）。 */
  orders: MergeablePurchaseOrder[];
  /** 新規に起票した未発行 PO 件数。 */
  created: number;
  /** 既存の未発行 PO を実際に更新した件数。 */
  merged: number;
}

const lineKey = (sku: string, warehouse: string) => `${sku}@@${warehouse}`;

/** 明細合計の再計算（数量合計・金額合計）。 */
function recomputeTotals(
  lines: PurchaseOrderLine[],
  unitCost: Record<string, number>,
): { items: number; amount: number } {
  return {
    items: lines.reduce((sum, l) => sum + l.orderedQty, 0),
    amount: lines.reduce((sum, l) => sum + l.orderedQty * (unitCost[l.sku] ?? 0), 0),
  };
}

/**
 * 発注推奨（ReorderSuggestion[]）を既存の発注書へ**冪等にマージ**する。
 *
 * 仕様（インタビュー回答 2026-07-09「既存未発行POとマージ」）:
 *  - 仕入先ごとにグループ化し、同一仕入先の「未発行」PO があればそこへ集約する
 *  - 同一 SKU×倉庫 の明細があれば数量を max(既存, 推奨) に更新（二重起票せず、手動で積んだ
 *    大きい数量も削らない）。無ければ明細を追加する
 *  - 未発行 PO が無い仕入先は新規に未発行 PO を起票する（発行済/仕入完了等には一切触れない）
 *  - suggestedQty <= 0 の提案は無視
 *  - 変更が生じた未発行 PO の件数を merged、新規起票を created に計上（再実行時は 0/0 で安定）
 *
 * 金額・数量合計はマージ後の明細から unitCost で再計算し整合させる。
 */
export function mergeReorderIntoPurchaseOrders(
  existing: ReadonlyArray<MergeablePurchaseOrder>,
  suggestions: ReadonlyArray<ReorderSuggestion>,
  maps: ReorderMasterMaps,
  opts: BuildPurchaseOrdersOptions,
): MergeReorderResult {
  // 仕入先ごとに推奨をグループ化（初出順を保持）。
  const supplierOrder: string[] = [];
  const bySupplier = new Map<string, ReorderSuggestion[]>();
  for (const s of suggestions) {
    if (s.suggestedQty <= 0) continue;
    const supplier = maps.supplier[s.sku] ?? UNASSIGNED_SUPPLIER;
    if (!bySupplier.has(supplier)) {
      bySupplier.set(supplier, []);
      supplierOrder.push(supplier);
    }
    bySupplier.get(supplier)!.push(s);
  }

  // 既存リストのミュータブルコピー（マージ結果を in-place で差し替える）。
  const next: MergeablePurchaseOrder[] = existing.map((po) => ({ ...po, lines: [...po.lines] }));
  const created: MergeablePurchaseOrder[] = [];
  let mergedCount = 0;
  let seq = opts.startSeq;

  for (const supplier of supplierOrder) {
    const group = bySupplier.get(supplier)!;
    const targetIdx = next.findIndex((po) => po.status === "未発行" && po.supplier === supplier);

    if (targetIdx === -1) {
      // 未発行 PO が無い → 新規起票。
      const built = buildPurchaseOrdersFromReorder(group, maps, { ...opts, startSeq: seq });
      for (const b of built) created.push(b);
      seq += built.length;
      continue;
    }

    // 既存未発行 PO へマージ。
    const target = next[targetIdx];
    const lines = [...target.lines];
    let changed = false;
    for (const s of group) {
      const k = lineKey(s.sku, s.warehouse);
      const idx = lines.findIndex((l) => lineKey(l.sku, l.warehouse) === k);
      if (idx === -1) {
        lines.push({ sku: s.sku, warehouse: s.warehouse, orderedQty: s.suggestedQty, receivedQty: 0 });
        changed = true;
      } else {
        const nextQty = Math.max(lines[idx].orderedQty, s.suggestedQty);
        if (nextQty !== lines[idx].orderedQty) {
          lines[idx] = { ...lines[idx], orderedQty: nextQty };
          changed = true;
        }
      }
    }
    if (changed) {
      const totals = recomputeTotals(lines, maps.unitCost);
      next[targetIdx] = { ...target, lines, items: totals.items, amount: totals.amount };
      mergedCount += 1;
    }
  }

  return { orders: [...created, ...next], created: created.length, merged: mergedCount };
}
