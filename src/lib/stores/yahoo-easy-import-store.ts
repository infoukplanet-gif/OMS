/**
 * Yahoo!かんたん決済入金確認（payments/yahoo-easy）の取込キュー 共有マスタストア。
 *
 * かんたん決済（クレカ・PayPay・コンビニ・ペイジー）の入金行と、その OMS 取込状態
 * （未取込/取込済）を id をキーに createMasterStore へ載せ、取込確定・API再同期の結果を
 * リロード後も復元する。
 *
 * 永続化（domain: "yahoo-easy-payment-import"）の正規オーナーページは
 * src/app/payments/yahoo-easy/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type YahooEasyMethod = "クレカ" | "PayPay" | "コンビニ" | "ペイジー";
export type YahooEasyImportStatus = "未取込" | "取込済";

export interface YahooEasyImportRecord {
  id: string;
  order: string;
  customer: string;
  amount: number;
  method: YahooEasyMethod;
  paidAt: string;
  yahooId: string;
  ourStatus: YahooEasyImportStatus;
  selected: boolean;
  [extra: string]: unknown;
}

export const INITIAL_YAHOO_EASY_IMPORT: YahooEasyImportRecord[] = [
  { id: "YE-001", order: "ORD-2026-00822", customer: "佐藤花子", amount: 12800, method: "クレカ", paidAt: "2026-04-25 11:24", yahooId: "YE-20260425-001", ourStatus: "未取込", selected: false },
  { id: "YE-002", order: "ORD-2026-00819", customer: "中村あかり", amount: 8400, method: "PayPay", paidAt: "2026-04-25 09:42", yahooId: "YE-20260425-002", ourStatus: "未取込", selected: false },
  { id: "YE-003", order: "ORD-2026-00811", customer: "高橋健", amount: 22800, method: "クレカ", paidAt: "2026-04-24 16:18", yahooId: "YE-20260424-018", ourStatus: "取込済", selected: false },
  { id: "YE-004", order: "ORD-2026-00805", customer: "渡辺京子", amount: 67800, method: "コンビニ", paidAt: "2026-04-23 14:00", yahooId: "YE-20260423-014", ourStatus: "未取込", selected: false },
];

export const yahooEasyImportStore: MasterStore<YahooEasyImportRecord> =
  createMasterStore<YahooEasyImportRecord>(INITIAL_YAHOO_EASY_IMPORT);
