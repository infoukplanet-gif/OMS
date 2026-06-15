/**
 * 支払方法 共有マスタストア
 *
 * 受注支払方法区分の登録を画面横断で共有する。
 * 永続化（domain: "payment-methods"）の正規オーナーページは
 * src/app/orders/categories/payment/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  fee: number;
  prepaid: boolean;
  enabled: boolean;
  [extra: string]: unknown;
}

export const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "PM-1", code: "PAY01", name: "クレジットカード", fee: 0, prepaid: true, enabled: true },
  { id: "PM-2", code: "PAY02", name: "代金引換", fee: 330, prepaid: false, enabled: true },
  { id: "PM-3", code: "PAY03", name: "銀行振込", fee: 0, prepaid: true, enabled: true },
  { id: "PM-4", code: "PAY04", name: "コンビニ払い", fee: 220, prepaid: true, enabled: true },
  { id: "PM-5", code: "PAY05", name: "後払い決済", fee: 250, prepaid: false, enabled: true },
  { id: "PM-6", code: "PAY06", name: "PayPay", fee: 0, prepaid: true, enabled: false },
];

/** クライアントセッション内で共有される単一の PaymentMethodsStore インスタンス */
export const paymentMethodsStore: MasterStore<PaymentMethod> =
  createMasterStore<PaymentMethod>(INITIAL_PAYMENT_METHODS);
