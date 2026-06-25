/**
 * 後払い.com（atone）サポート 共有ストア（collection パターン）。
 *
 * payments/atone ページの atone取引行（受注番号/顧客/金額/与信ステータス/登録日/
 * 経過日/催促送信フラグ）を id をキーにした複数レコードとして createMasterStore に
 * 載せ、与信同期・支払方法切替・催促送信・貸倒処理をリロード後も復元する。
 *
 * 与信ステータス遷移は state-machine transitionDeferredPayment を経由する
 * （ページで status を直書きしない）。催促は reminded フラグの upsert。
 *
 * 永続化（domain: "payment-atone-rows"）の正規オーナーページは
 * src/app/payments/atone/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import type { DeferredPaymentRecord } from "../state-machines/deferred-payment";
import { INITIAL_ATONE_ROWS } from "../seeds/payment-atone";

export const atonePaymentStore: MasterStore<DeferredPaymentRecord> =
  createMasterStore<DeferredPaymentRecord>(INITIAL_ATONE_ROWS);
