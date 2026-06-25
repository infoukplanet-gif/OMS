/**
 * npPaymentStore（NP後払いサポート）の初期シード値。
 *
 * payments/np が正規オーナーとして空ストアにセットする初期データ。
 * NP（外部決済プロバイダ）側の取引データで、API接続前提のためモック。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { DeferredPaymentRecord } from "@/lib/state-machines/deferred-payment";

export const INITIAL_NP_ROWS: DeferredPaymentRecord[] = [
  { id: "NP-001", order: "ORD-2026-00845", customer: "高橋健", amount: 22800, status: "与信OK", registeredAt: "2026-04-24", daysAged: 1 },
  { id: "NP-002", order: "ORD-2026-00839", customer: "井上智", amount: 28500, status: "請求中", registeredAt: "2026-04-22", daysAged: 3 },
  { id: "NP-003", order: "ORD-2026-00831", customer: "佐藤花子", amount: 38400, status: "支払済", registeredAt: "2026-04-18", daysAged: 0 },
  { id: "NP-004", order: "ORD-2026-00822", customer: "中村あかり", amount: 12800, status: "与信NG", registeredAt: "2026-04-20", daysAged: 5 },
  { id: "NP-005", order: "ORD-2026-00815", customer: "山田太郎", amount: 184000, status: "与信中", registeredAt: "2026-04-25", daysAged: 0 },
];
