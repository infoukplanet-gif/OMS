/**
 * 買掛金（仕入債務）の按分計上ロジック（純粋関数）。
 *
 * 仕様: docs/prd/payable-recognition-v1.md（発注入荷 → 買掛金計上 → 仕入支払）
 *
 * 出荷確定 → 売上計上（sales）の買い側ミラー。発注入荷の都度、PO 総額（`amount`）を
 * 「累計受領数 / 発注総数」で按分し、今回入荷分の差分だけを買掛金として計上する。
 * PO 明細には単価が無く総額しか持たないため、数量按分で受領分を金額化する。
 *
 * 端数は最終入荷で true-up し、全数受領時に按分累計が必ず PO 総額に一致する
 * （計上漏れ・過計上を防ぐ）。
 */

/** 入荷の都度積まれる買掛金計上 1 件。(poId, cumulativeReceived) が冪等キー。 */
export interface PayableAccrual {
  /** 計上元の発注 ID */
  poId: string;
  /** 仕入先名 */
  supplier: string;
  /** 今回の入荷で計上した買掛金額（按分差分） */
  amount: number;
  /** 計上時点の累計受領数（冪等キーの一部・端数 true-up の根拠） */
  cumulativeReceived: number;
  /** 計上日（YYYY/MM/DD） */
  accruedAt: string;
}

/** 手動の仕入支払 1 件。 */
export interface PayablePayment {
  /** 支払対象の発注 ID */
  poId: string;
  /** 支払額 */
  amount: number;
  /** 支払日（YYYY/MM/DD） */
  paidAt: string;
}

/** PO 単位に集約した買掛金サマリ（仕入伝票一覧の 1 行）。 */
export interface PayableSummary {
  poId: string;
  supplier: string;
  /** 計上累計（請求額） */
  accrued: number;
  /** 支払済累計 */
  paid: number;
  /** 残額（accrued − paid、下限 0） */
  remaining: number;
  status: "未払" | "一部支払" | "支払済";
  /** 最新の計上日 */
  lastAccruedAt: string;
}

/**
 * ある累計受領数までに按分計上されるべき買掛金累計額。
 * 全数受領（cumulativeReceived >= totalOrderedQty）で PO 総額に一致する（端数 true-up）。
 */
export function accruedPayableThrough(
  poAmount: number,
  totalOrderedQty: number,
  cumulativeReceived: number,
): number {
  if (poAmount <= 0 || totalOrderedQty <= 0 || cumulativeReceived <= 0) return 0;
  if (cumulativeReceived >= totalOrderedQty) return poAmount;
  return Math.round((poAmount * cumulativeReceived) / totalOrderedQty);
}

export interface PayableAccrualInput {
  /** PO 総額 */
  poAmount: number;
  /** 発注総数 */
  totalOrderedQty: number;
  /** 今回入荷前の累計受領数 */
  receivedBefore: number;
  /** 今回入荷後の累計受領数 */
  receivedAfter: number;
}

/**
 * 今回の入荷で新たに計上すべき買掛金額（按分累計の差分）。
 * 逆行・据え置きでは 0 を返す（負計上を防ぐ）。
 */
export function payableAccrualForReceipt(input: PayableAccrualInput): number {
  const { poAmount, totalOrderedQty, receivedBefore, receivedAfter } = input;
  const before = accruedPayableThrough(poAmount, totalOrderedQty, receivedBefore);
  const after = accruedPayableThrough(poAmount, totalOrderedQty, receivedAfter);
  return Math.max(0, after - before);
}

/**
 * 計上台帳と支払台帳を PO 単位に集約し、仕入伝票一覧用のサマリを作る。
 */
export function summarizePayables(
  accruals: ReadonlyArray<PayableAccrual>,
  payments: ReadonlyArray<PayablePayment>,
): PayableSummary[] {
  const byPo = new Map<
    string,
    { supplier: string; accrued: number; lastAccruedAt: string }
  >();

  for (const a of accruals) {
    const cur = byPo.get(a.poId);
    if (!cur) {
      byPo.set(a.poId, { supplier: a.supplier, accrued: a.amount, lastAccruedAt: a.accruedAt });
    } else {
      cur.accrued += a.amount;
      if (a.accruedAt > cur.lastAccruedAt) cur.lastAccruedAt = a.accruedAt;
    }
  }

  const paidByPo = new Map<string, number>();
  for (const p of payments) {
    paidByPo.set(p.poId, (paidByPo.get(p.poId) ?? 0) + p.amount);
  }

  return Array.from(byPo.entries()).map(([poId, v]) => {
    const paid = paidByPo.get(poId) ?? 0;
    const remaining = Math.max(0, v.accrued - paid);
    const status: PayableSummary["status"] =
      remaining <= 0 ? "支払済" : paid > 0 ? "一部支払" : "未払";
    return {
      poId,
      supplier: v.supplier,
      accrued: v.accrued,
      paid,
      remaining,
      status,
      lastAccruedAt: v.lastAccruedAt,
    };
  });
}
