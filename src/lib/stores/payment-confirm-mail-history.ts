/**
 * 入金確認メール 一括送信バッチ履歴 共有ストア（collection パターン）。
 *
 * payments/email-confirm ページの一括送信バッチを id をキーにした複数レコードとして
 * createMasterStore に載せ、リロード後も復元する。
 *
 * 永続化（domain: "payment-confirm-mail-history"）の正規オーナーページは
 * src/app/payments/email-confirm/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import {
  INITIAL_PAYMENT_CONFIRM_MAIL_HISTORY,
  type PaymentConfirmMailBatch,
} from "../seeds/payment-confirm-mail-history";

export type { PaymentConfirmMailBatch } from "../seeds/payment-confirm-mail-history";

export const paymentConfirmMailHistoryStore: MasterStore<PaymentConfirmMailBatch> =
  createMasterStore<PaymentConfirmMailBatch>(INITIAL_PAYMENT_CONFIRM_MAIL_HISTORY);
