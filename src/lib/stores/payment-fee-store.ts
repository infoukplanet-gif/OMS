/**
 * 支払方法別手数料 共有マスタストア。
 *
 * 支払方法ごとの決済手数料（率・固定額・下限/上限・税区分・負担区分）を
 * 画面横断で共有・永続化する。受注支払方法区分マスタ（payment-methods）とは
 * 別ドメイン（こちらは会計上の手数料計算ルール）。
 * 秘密情報は含まないため平文永続化で問題ない。
 *
 * 永続化（domain: "payment-fees"）の正規オーナーページは
 * src/app/payments/fees/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

/** 手数料の負担区分。 */
export type PaymentFeeScope = "顧客負担" | "自社負担";

/**
 * 手数料レコードの具体フィールド（index signature なし）。
 * フォーム側の `keyof` / `Omit` が壊れないよう Record とは別に定義する。
 */
export interface PaymentFeeFields {
  method: string;
  rate: number;
  fixed: number;
  minAmt: number;
  maxAmt: number | null;
  taxIncluded: boolean;
  active: boolean;
  scope: PaymentFeeScope;
}

export interface PaymentFeeRecord extends PaymentFeeFields {
  id: string;
  [extra: string]: unknown;
}

export const INITIAL_PAYMENT_FEES: PaymentFeeRecord[] = [
  { id: "F-01", method: "クレジットカード", rate: 3.25, fixed: 0, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "自社負担" },
  { id: "F-02", method: "代金引換", rate: 0, fixed: 330, minAmt: 0, maxAmt: 10000, taxIncluded: true, active: true, scope: "顧客負担" },
  { id: "F-03", method: "NP後払い", rate: 3.6, fixed: 190, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "自社負担" },
  { id: "F-04", method: "Atone", rate: 2.9, fixed: 0, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "自社負担" },
  { id: "F-05", method: "銀行振込", rate: 0, fixed: 0, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "顧客負担" },
  { id: "F-06", method: "コンビニ後払い", rate: 4, fixed: 210, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "自社負担" },
  { id: "F-07", method: "Yahoo!かんたん決済", rate: 3.45, fixed: 0, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "自社負担" },
  { id: "F-08", method: "楽天ペイ", rate: 3.3, fixed: 0, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "自社負担" },
];

export const paymentFeeStore: MasterStore<PaymentFeeRecord> =
  createMasterStore<PaymentFeeRecord>(INITIAL_PAYMENT_FEES);
