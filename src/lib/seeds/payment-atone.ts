/**
 * atonePaymentStore（後払い.com / atone サポート）の初期シード値。
 *
 * payments/atone が正規オーナーとして空ストアにセットする初期データ。
 * atone（外部決済プロバイダ）側の取引データで、API接続前提のためモック。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { DeferredPaymentRecord } from "@/lib/state-machines/deferred-payment";

export const INITIAL_ATONE_ROWS: DeferredPaymentRecord[] = [
  { id: "AT-001", order: "ORD-2026-00840", customer: "高橋健", amount: 22800, status: "与信中", registeredAt: "2026-04-24", daysAged: 1 },
  { id: "AT-002", order: "ORD-2026-00832", customer: "井上智", amount: 28500, status: "請求中", registeredAt: "2026-04-22", daysAged: 3 },
  { id: "AT-003", order: "ORD-2026-00821", customer: "佐藤花子", amount: 38400, status: "支払済", registeredAt: "2026-04-18", daysAged: 0 },
  { id: "AT-004", order: "ORD-2026-00812", customer: "中村あかり", amount: 12800, status: "与信NG", registeredAt: "2026-04-20", daysAged: 5 },
  { id: "AT-005", order: "ORD-2026-00802", customer: "渡辺京子", amount: 67800, status: "回収不能", registeredAt: "2026-03-15", daysAged: 41 },
];
