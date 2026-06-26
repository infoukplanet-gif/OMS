/**
 * Yahoo!入金処理（payments/yahoo）の取込キュー 共有マスタストア。
 *
 * Yahoo!ショッピングの入金行と、その OMS 取込状態（未取込/取込済/差異あり）を
 * id をキーに createMasterStore へ載せ、取込確定・API再同期の結果をリロード後も復元する。
 *
 * 永続化（domain: "yahoo-payment-import"）の正規オーナーページは
 * src/app/payments/yahoo/page.tsx。Yahoo!かんたん決済は別ストア
 * （yahoo-easy-import-store）が担当する。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type YahooPaymentStatus = "入金待ち" | "入金済" | "キャンセル" | "失敗";
export type YahooImportStatus = "未取込" | "取込済" | "差異あり";

export interface YahooPaymentImportRecord {
  id: string;
  order: string;
  customer: string;
  amount: number;
  yahooStatus: YahooPaymentStatus;
  paidAt: string;
  ourStatus: YahooImportStatus;
  selected: boolean;
  [extra: string]: unknown;
}

export const INITIAL_YAHOO_PAYMENT_IMPORT: YahooPaymentImportRecord[] = [
  { id: "Y-001", order: "ORD-2026-00824", customer: "佐藤花子", amount: 38400, yahooStatus: "入金済", paidAt: "2026-04-24", ourStatus: "未取込", selected: false },
  { id: "Y-002", order: "ORD-2026-00818", customer: "高橋健", amount: 22800, yahooStatus: "入金済", paidAt: "2026-04-23", ourStatus: "取込済", selected: false },
  { id: "Y-003", order: "ORD-2026-00812", customer: "中村あかり", amount: 12800, yahooStatus: "入金待ち", paidAt: "—", ourStatus: "未取込", selected: false },
  { id: "Y-004", order: "ORD-2026-00808", customer: "渡辺京子", amount: 67800, yahooStatus: "キャンセル", paidAt: "—", ourStatus: "未取込", selected: false },
  { id: "Y-005", order: "ORD-2026-00800", customer: "伊藤大輔", amount: 22400, yahooStatus: "入金済", paidAt: "2026-04-22", ourStatus: "差異あり", selected: false },
];

export const yahooPaymentImportStore: MasterStore<YahooPaymentImportRecord> =
  createMasterStore<YahooPaymentImportRecord>(INITIAL_YAHOO_PAYMENT_IMPORT);
