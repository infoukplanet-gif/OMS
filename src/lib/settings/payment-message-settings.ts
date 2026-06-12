/**
 * 支払方法別メッセージ設定のモジュール内シングルトン。
 *
 * - `settings/payment-message` ページが書き換える
 * - v1 はブラウザ module スコープでの保持（リロードで初期化）
 */

export interface PaymentMessage {
  id: string;
  method: string;
  thanksMessage: string;
  shipMessage: string;
  invoicePrint: string;
  showInOrderForm: boolean;
  showInThanksMail: boolean;
  showInShipMail: boolean;
  enabled: boolean;
}

export const DEFAULT_PAYMENT_MESSAGES: PaymentMessage[] = [
  {
    id: "pm-credit",
    method: "クレジットカード",
    thanksMessage: "ご利用のクレジットカードへ請求いたします。引落日はカード会社の締日に応じます。",
    shipMessage: "クレジットカードでの決済が完了しました。",
    invoicePrint: "クレジット決済済",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: false,
    enabled: true,
  },
  {
    id: "pm-cod",
    method: "代金引換",
    thanksMessage: "商品お受取り時に配達員へお支払いください。代引手数料 {{cod_fee}} 円が加算されます。",
    shipMessage: "代金引換でお届けします。お支払金額：{{total_with_cod}} 円",
    invoicePrint: "代金引換にて配達員にお支払いください",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: true,
    enabled: true,
  },
  {
    id: "pm-bank",
    method: "銀行振込（前払い）",
    thanksMessage: "下記口座へ {{payment_deadline}} までにお振込みください。\n\n■ 振込先\n{{bank_account}}",
    shipMessage: "ご入金確認後、商品を発送いたしました。",
    invoicePrint: "銀行振込にてご入金済",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: false,
    enabled: true,
  },
  {
    id: "pm-conveni",
    method: "コンビニ決済（後払い）",
    thanksMessage: "請求書は商品到着後に別送いたします。お近くのコンビニでお支払いください。",
    shipMessage: "請求書は本商品とは別便でお送りします（最長14日以内）。",
    invoicePrint: "コンビニ後払い（請求書は別送）",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: true,
    enabled: true,
  },
  {
    id: "pm-amazonpay",
    method: "Amazon Pay",
    thanksMessage: "Amazonアカウントに紐付くお支払い方法で決済いたしました。",
    shipMessage: "Amazon Pay の決済が完了しました。",
    invoicePrint: "Amazon Pay 決済済",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: false,
    enabled: true,
  },
  {
    id: "pm-paypay",
    method: "PayPay",
    thanksMessage: "PayPay 残高またはあと払いから決済いたしました。",
    shipMessage: "PayPay の決済が完了しました。",
    invoicePrint: "PayPay 決済済",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: false,
    enabled: true,
  },
  {
    id: "pm-np",
    method: "NP後払い",
    thanksMessage: "請求書は商品到着後に別送（NP後払い）。コンビニ・銀行・LINE Pay でお支払いいただけます。",
    shipMessage: "NP後払いの請求書は別便でお送りします。",
    invoicePrint: "NP後払い（請求書は別送）",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: true,
    enabled: false,
  },
];

let messages: PaymentMessage[] = DEFAULT_PAYMENT_MESSAGES.map((m) => ({ ...m }));

export function getPaymentMessages(): PaymentMessage[] {
  return messages.map((m) => ({ ...m }));
}

export function setPaymentMessages(items: PaymentMessage[]): void {
  messages = items.map((m) => ({ ...m }));
}

export function resetPaymentMessages(): void {
  messages = DEFAULT_PAYMENT_MESSAGES.map((m) => ({ ...m }));
}
