/**
 * payableStore の初期シード値（買掛金台帳・仕入支払台帳）。
 *
 * purchasing/invoices（仕入伝票管理）が初回マウント時に投入する。
 * 既存の仕入伝票モックを買掛金計上（accrual）＋支払（payment）の台帳形へ移したもの。
 * 新規の発注入荷からの計上はこのシードに上積みされる。
 *
 * cumulativeReceived は冪等キーの一部。シードは履歴確定分なので、PO ごとに一意であれば
 * 値そのものに意味はない（全数受領済とみなして 0 以外の固定値を置く）。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { PayableAccrual, PayablePayment } from "@/lib/calculations/payable-recognition";

export const INITIAL_PAYABLE_ACCRUALS: PayableAccrual[] = [
  { poId: "PO-2026-0044", supplier: "グローバルパーツ合同会社", amount: 128000, cumulativeReceived: 20, accruedAt: "2026/04/23" },
  { poId: "PO-2026-0043", supplier: "株式会社ケーブルワークス", amount: 56000, cumulativeReceived: 10, accruedAt: "2026/04/21" },
  { poId: "PO-2026-0042", supplier: "株式会社ABC電子", amount: 89000, cumulativeReceived: 25, accruedAt: "2026/04/19" },
  { poId: "PO-2026-0038", supplier: "株式会社ABC電子", amount: 245000, cumulativeReceived: 30, accruedAt: "2026/03/25" },
  { poId: "PO-2026-0035", supplier: "アジアサプライ株式会社", amount: 84000, cumulativeReceived: 40, accruedAt: "2026/03/15" },
];

export const INITIAL_PAYABLE_PAYMENTS: PayablePayment[] = [
  { poId: "PO-2026-0043", amount: 56000, paidAt: "2026/05/20" },
  { poId: "PO-2026-0042", amount: 89000, paidAt: "2026/05/18" },
  { poId: "PO-2026-0038", amount: 100000, paidAt: "2026/04/28" },
];
