/**
 * 発注ドメイン状態機械
 *
 * 仕様: docs/prd/purchase-state-machine.md
 *
 * 発注伝票を SKU × 倉庫 明細を持つ集約として表現し、
 * markConditionsMet / markConditionsUnmet / issue / receivePurchaseOrder / cancel の
 * プリミティブ操作で状態遷移する。
 * 発行済 / 注残あり / 仕入完了 は累計受領数から派生、それ以外は明示的フィールドで管理。
 * 全操作はイミュータブル更新かつ冪等（guard 違反時は no-op で参照同一）。
 */

export type PurchaseOrderStatus =
  | "条件未達成"
  | "未発行"
  | "発行済"
  | "注残あり"
  | "仕入完了"
  | "キャンセル";

export const PURCHASE_ORDER_STATUSES: readonly PurchaseOrderStatus[] = [
  "条件未達成",
  "未発行",
  "発行済",
  "注残あり",
  "仕入完了",
  "キャンセル",
] as const;

export interface PurchaseOrderLine {
  sku: string;
  warehouse: string;
  /** 発注数 */
  orderedQty: number;
  /** 累計受領数（部分入荷の累積） */
  receivedQty: number;
}

export interface PurchaseOrderState {
  /** 派生 + 明示の混合ステータス。プリミティブ操作が更新のたび再計算する。 */
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
}

/** 入荷登録時に渡す受領明細。lines と同じ key (sku, warehouse) で qty を加算する。 */
export interface ReceiptLine {
  sku: string;
  warehouse: string;
  qty: number;
}

/** 累計発注数。UI 表示用。 */
export function totalOrdered(po: PurchaseOrderState): number {
  return po.lines.reduce((sum, l) => sum + l.orderedQty, 0);
}

/** 累計受領数。UI 表示用。 */
export function totalReceived(po: PurchaseOrderState): number {
  return po.lines.reduce((sum, l) => sum + l.receivedQty, 0);
}

/** 全 line が発注数を満たしているか。仕入完了の派生判定式と同一。 */
export function isFullyReceived(po: PurchaseOrderState): boolean {
  return po.lines.every((l) => l.receivedQty >= l.orderedQty);
}

/**
 * 入荷フェーズの派生ステータス（発行済 / 注残あり / 仕入完了）を lines から導出する。
 * 内部ヘルパ。
 */
function deriveReceivingStatus(lines: PurchaseOrderLine[]): "発行済" | "注残あり" | "仕入完了" {
  if (lines.every((l) => l.receivedQty >= l.orderedQty)) return "仕入完了";
  if (lines.some((l) => l.receivedQty > 0)) return "注残あり";
  return "発行済";
}

/**
 * 条件未達成 → 未発行。発注条件（発注点・最低金額等）が充足したことを記録する。
 * v1 では運用画面からの手動操作。
 */
export function markConditionsMet(po: PurchaseOrderState): PurchaseOrderState {
  if (po.status !== "条件未達成") return po;
  return { ...po, status: "未発行" };
}

/**
 * 未発行 → 条件未達成。条件の再評価で未達成に戻す巻き戻し。
 */
export function markConditionsUnmet(po: PurchaseOrderState): PurchaseOrderState {
  if (po.status !== "未発行") return po;
  return { ...po, status: "条件未達成" };
}

/**
 * 未発行 → 発行済。仕入先への発注書送付タイミング。
 */
export function issue(po: PurchaseOrderState): PurchaseOrderState {
  if (po.status !== "未発行") return po;
  return { ...po, status: "発行済" };
}

/**
 * 入荷登録。発行済 or 注残あり からのみ受領数を加算できる。
 *
 * - 各 receipt.qty > 0 について、(sku, warehouse) が一致する line の receivedQty に加算
 * - マッチしない receipt は無視（呼び出し元のミスを表面化させない）
 * - 加算量が 0 の場合は no-op（参照同一）
 * - 加算後、lines から status を再導出（発行済 / 注残あり / 仕入完了）
 * - 過剰入荷（receivedQty > orderedQty）は cap せずに受け入れる（業務イベントとして発生しうる）
 */
export function receivePurchaseOrder(
  po: PurchaseOrderState,
  receipts: ReceiptLine[],
): PurchaseOrderState {
  if (po.status !== "発行済" && po.status !== "注残あり") return po;

  let changed = false;
  const nextLines = po.lines.map((l) => {
    let delta = 0;
    for (const r of receipts) {
      if (r.qty <= 0) continue;
      if (r.sku === l.sku && r.warehouse === l.warehouse) {
        delta += r.qty;
      }
    }
    if (delta === 0) return l;
    changed = true;
    return { ...l, receivedQty: l.receivedQty + delta };
  });

  if (!changed) return po;

  return { ...po, lines: nextLines, status: deriveReceivingStatus(nextLines) };
}

/**
 * 仕入完了到達前のキャンセル。既受領在庫は inventory に残す（物理的に倉庫にあるため）。
 */
export function cancel(po: PurchaseOrderState): PurchaseOrderState {
  if (po.status === "仕入完了" || po.status === "キャンセル") return po;
  return { ...po, status: "キャンセル" };
}

/**
 * UI 表示用のバッジクラス。`src/app/purchasing/page.tsx` 等で再利用する。
 * Liquid Glass 規約に従いグラデーション禁止、色は単色 tint のみ。
 */
export const purchaseStatusBadge: Record<PurchaseOrderStatus, string> = {
  条件未達成: "bg-slate-500/15 text-slate-700",
  未発行: "bg-blue-500/15 text-blue-700",
  発行済: "bg-cyan-500/15 text-cyan-700",
  注残あり: "bg-amber-500/15 text-amber-700",
  仕入完了: "bg-emerald-500/15 text-emerald-700",
  キャンセル: "bg-red-500/15 text-red-700",
};
